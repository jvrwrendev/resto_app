import { getDB } from '@/database/database';
import { AppError } from '@/utils/errors';

export type AppSettingKey =
  | 'storeName'
  | 'address'
  | 'contact'
  | 'footer'
  | 'autoPrint'
  | 'connectedPrinterName'
  | 'connectedPrinterMac';

export function getSetting(key: AppSettingKey): string {
  const db = getDB();
  const row = db.getFirstSync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?;',
    [key],
  );
  return row?.value ?? '';
}

export function setSetting(key: AppSettingKey, value: string): void {
  const db = getDB();
  db.runSync(
    'INSERT INTO app_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
    [key, value],
  );
}

export function getAllSettings(): Record<string, string> {
  const db = getDB();
  const rows = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings;',
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function ensureSetting(key: AppSettingKey, fallback: string): string {
  const v = getSetting(key);
  if (v === '' || v == null) {
    setSetting(key, fallback);
    return fallback;
  }
  return v;
}

export function safeSetSetting(key: AppSettingKey, value: string): void {
  try {
    setSetting(key, value);
  } catch (e) {
    throw new AppError('UNKNOWN', String(e));
  }
}
