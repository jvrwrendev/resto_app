import { NativeModules, Platform, PermissionsAndroid, Linking } from 'react-native';
import { AppError } from '@/utils/errors';
import { ensureSetting, setSetting } from './settingsService';

export interface PrinterDevice {
  name: string;
  macAddress: string;
}

export interface PrinterStatus {
  connected: boolean;
  name?: string;
  macAddress?: string;
}

export interface PrintResult {
  ok: boolean;
  error?: string;
}

let _connectedMac = '';
let _connectedName = '';

const PRINTER_LIB_ID = 'react-native-bluetooth-escpos-printer';

// Android's discovery scan is bounded (~12s). Wait a bit longer, then give up
// so the scan can never hang indefinitely when a device never answers.
const SCAN_TIMEOUT_MS = 15000;

function printerNativeModulesRegistered(): boolean {
  const m = NativeModules as Record<string, unknown>;
  return !!m.BluetoothManager && !!m.BluetoothEscposPrinter;
}

function isModuleAvailable(): boolean {
  try {
    return (
      printerNativeModulesRegistered() &&
      typeof require(PRINTER_LIB_ID) !== 'undefined'
    );
  } catch {
    return false;
  }
}

interface BluetoothScannerLike {
  enableBluetooth: () => Promise<unknown>;
  isBluetoothEnabled: () => Promise<unknown>;
  scanDevices: () => Promise<unknown>;
  connect: (address: string) => Promise<unknown>;
  getDeviceName?: () => Promise<unknown>;
  disconnect: () => Promise<unknown>;
}

interface BluetoothPrinterLike {
  printerAlign: (align: number) => Promise<unknown>;
  printText: (text: string, opts?: Record<string, unknown>) => Promise<unknown>;
  ALIGN: { CENTER: number };
}

interface PrinterNativeLib {
  BluetoothManager: BluetoothScannerLike;
  BluetoothEscposPrinter: BluetoothPrinterLike;
}

function getPrinterLib(): PrinterNativeLib | null {
  if (!printerNativeModulesRegistered()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(PRINTER_LIB_ID) as PrinterNativeLib;
  } catch {
    return null;
  }
}

/**
 * Request the runtime permissions the printer library needs before scanning.
 * The library only handles ACCESS_COARSE_LOCATION itself (fire-and-forget),
 * so we do it properly up front:
 *  - Android 12+ (API 31+): BLUETOOTH_SCAN + BLUETOOTH_CONNECT
 *  - Android 6–11: ACCESS_FINE_LOCATION (implied coarse, covers discovery)
 * Returns true when everything needed is granted.
 */
async function ensureBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;
  if (apiLevel >= 31) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  const loc = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return loc === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Normalise the mess of response shapes the native scan returns:
 *  - a plain array of { name, address }
 *  - the JSON string '{"paired":"[...str...]","found":"[...str...]"}'
 *  - an object with paired/found/array keys whose values are arrays or JSON strings
 */
function parseScanResponse(devices: unknown): PrinterDevice[] {
  const list: PrinterDevice[] = [];
  const extract = (rows: unknown) => {
    let arr = rows;
    if (typeof rows === 'string') {
      try {
        arr = JSON.parse(rows);
      } catch {
        return;
      }
    }
    if (!Array.isArray(arr)) return;
    for (const d of arr) {
      if (!d || typeof d !== 'object') continue;
      const rec = d as Record<string, unknown>;
      const address = typeof rec.address === 'string' ? rec.address : '';
      if (!address) continue;
      list.push({
        name: typeof rec.name === 'string' && rec.name ? rec.name : 'Unknown Printer',
        macAddress: address,
      });
    }
  };
  if (Array.isArray(devices)) {
    extract(devices);
    return list;
  }
  if (typeof devices === 'string') {
    try {
      const parsed = JSON.parse(devices) as Record<string, unknown>;
      extract(parsed.paired);
      extract(parsed.found);
    } catch {
      extract(devices);
    }
  } else if (devices && typeof devices === 'object') {
    const rec = devices as Record<string, unknown>;
    extract(rec.paired);
    extract(rec.found);
    extract(rec.array);
  }
  return list;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export const printerService = {
  /**
   * Open the system Bluetooth settings (Android). No-op elsewhere.
   */
  async openBluetoothSettings(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
      return true;
    } catch {
      const opened = await Linking.openSettings().then(() => true).catch(() => false);
      return opened;
    }
  },

  async scan(): Promise<PrinterDevice[]> {
    if (!printerNativeModulesRegistered()) return [];
    if (Platform.OS === 'android') {
      const granted = await ensureBluetoothPermissions();
      if (!granted) throw new AppError('BLUETOOTH_PERMISSION_DENIED');
    }
    const lib = getPrinterLib();
    if (!lib) return [];

    await withTimeout(lib.BluetoothManager.enableBluetooth(), 2000, undefined);
    const btEnabled = Boolean(await lib.BluetoothManager.isBluetoothEnabled());
    if (!btEnabled) throw new AppError('BLUETOOTH_DISABLED');

    try {
      const raw = await withTimeout(lib.BluetoothManager.scanDevices(), SCAN_TIMEOUT_MS, undefined);
      return parseScanResponse(raw);
    } catch {
      throw new AppError('BLUETOOTH_SCAN_FAILED');
    }
  },

  async connect(macAddress: string): Promise<boolean> {
    const lib = getPrinterLib();
    if (!lib) {
      _connectedMac = macAddress;
      _connectedName = 'Mock Printer';
      setSetting('connectedPrinterName', _connectedName);
      setSetting('connectedPrinterMac', _connectedMac);
      return true;
    }
    try {
      await lib.BluetoothManager.connect(macAddress);
      const rawName = lib.BluetoothManager.getDeviceName
        ? await lib.BluetoothManager.getDeviceName()
        : null;
      const name = typeof rawName === 'string' && rawName ? rawName : 'Bluetooth Printer';
      _connectedMac = macAddress;
      _connectedName = name;
      setSetting('connectedPrinterName', name);
      setSetting('connectedPrinterMac', macAddress);
      return true;
    } catch {
      throw new AppError('PRINTER_CONNECT_FAIL');
    }
  },

  async disconnect(): Promise<void> {
    const lib = getPrinterLib();
    if (lib) {
      try {
        await lib.BluetoothManager.disconnect();
      } catch {
        // ignore
      }
    }
    _connectedMac = '';
    _connectedName = '';
    setSetting('connectedPrinterName', '');
    setSetting('connectedPrinterMac', '');
  },

  status(): PrinterStatus {
    const mac = ensureSetting('connectedPrinterMac', _connectedMac);
    const name = ensureSetting('connectedPrinterName', _connectedName);
    if (!mac) return { connected: false };
    return { connected: true, name, macAddress: mac };
  },

  isAvailable(): boolean {
    return isModuleAvailable();
  },

  async testPrint(): Promise<PrintResult> {
    const lib = getPrinterLib();
    if (!lib) {
      return { ok: true };
    }
    try {
      await lib.BluetoothEscposPrinter.printerAlign(lib.BluetoothEscposPrinter.ALIGN.CENTER);
      await lib.BluetoothEscposPrinter.printText('PRINTER TEST\n\n', { bold: true });
      await lib.BluetoothEscposPrinter.printText('If you can read this, the\nprinter is working.\n\n\n', {});
      return { ok: true };
    } catch {
      return { ok: false, error: 'PRINT_FAILED' };
    }
  },

  async printText(text: string): Promise<PrintResult> {
    const lib = getPrinterLib();
    if (!lib) {
      return { ok: true };
    }
    try {
      await lib.BluetoothEscposPrinter.printText(text, {});
      return { ok: true };
    } catch {
      return { ok: false, error: 'PRINT_FAILED' };
    }
  },

  async printReceipt(orderId: number, text: string): Promise<PrintResult> {
    if (!printerService.status().connected) {
      return { ok: false, error: 'PRINTER_NOT_FOUND' };
    }
    return printerService.printText(text + '\n\n\n');
  },
};
