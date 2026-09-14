import { create } from 'zustand';
import { ensureSetting, getSetting, setSetting } from '@/services/settingsService';
import { DEFAULT_RECEIPT } from '@/constants';

export interface StoreSettings {
  storeName: string;
  address: string;
  contact: string;
  footer: string;
}

interface SettingsState {
  storeSettings: StoreSettings;
  autoPrint: boolean;
  connectedPrinterName: string;
  connectedPrinterMac: string;
  load: () => void;
  saveStore: (s: StoreSettings) => void;
  setAutoPrint: (v: boolean) => void;
  setPrinter: (name: string, mac: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  storeSettings: {
    storeName: DEFAULT_RECEIPT.storeName,
    address: DEFAULT_RECEIPT.address,
    contact: DEFAULT_RECEIPT.contact,
    footer: DEFAULT_RECEIPT.footer,
  },
  autoPrint: true,
  connectedPrinterName: '',
  connectedPrinterMac: '',

  load() {
    set({
      storeSettings: {
        storeName: ensureSetting('storeName', DEFAULT_RECEIPT.storeName),
        address: ensureSetting('address', DEFAULT_RECEIPT.address),
        contact: ensureSetting('contact', DEFAULT_RECEIPT.contact),
        footer: ensureSetting('footer', DEFAULT_RECEIPT.footer),
      },
      autoPrint: getSetting('autoPrint') !== 'false',
      connectedPrinterName: getSetting('connectedPrinterName'),
      connectedPrinterMac: getSetting('connectedPrinterMac'),
    });
  },

  saveStore(s) {
    setSetting('storeName', s.storeName);
    setSetting('address', s.address);
    setSetting('contact', s.contact);
    setSetting('footer', s.footer);
    set({ storeSettings: s });
  },

  setAutoPrint(v) {
    setSetting('autoPrint', v ? 'true' : 'false');
    set({ autoPrint: v });
  },

  setPrinter(name, mac) {
    setSetting('connectedPrinterName', name);
    setSetting('connectedPrinterMac', mac);
    set({ connectedPrinterName: name, connectedPrinterMac: mac });
  },
}));
