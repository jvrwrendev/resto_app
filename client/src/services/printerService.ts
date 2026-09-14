import { NativeModules } from 'react-native';
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

function getPrinterLib(): {
  BluetoothManager: any;
  BluetoothEscposPrinter: any;
} | null {
  if (!printerNativeModulesRegistered()) return null;
  try {
    return require(PRINTER_LIB_ID);
  } catch {
    return null;
  }
}

async function withLib<T>(fn: (lib: NonNullable<ReturnType<typeof getPrinterLib>>) => Promise<T>, fallback: T): Promise<T> {
  const lib = getPrinterLib();
  if (!lib) return fallback;
  try {
    return await fn(lib);
  } catch {
    return fallback;
  }
}

export const printerService = {
  async scan(): Promise<PrinterDevice[]> {
    return withLib<PrinterDevice[]>(async (lib) => {
      await lib.BluetoothManager.enableBluetooth();
      const devices = await lib.BluetoothManager.scanDevices();
      const list: PrinterDevice[] = [];
      const arr = Array.isArray(devices) ? devices : devices?.array ?? [];
      for (const d of arr) {
        if (d?.address) {
          list.push({ name: d.name || 'Unknown Printer', macAddress: d.address });
        }
      }
      return list;
    }, []);
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
      const name = await lib.BluetoothManager.getDeviceName?.() ?? 'Bluetooth Printer';
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
