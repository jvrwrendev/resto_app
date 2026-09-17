import { Directory, Paths } from 'expo-file-system';
import { getDatabaseSize, getImagesDirectorySize } from './imageStorage';

export interface StorageBreakdown {
  totalBytes: number;
  databaseBytes: number;
  imagesBytes: number;
  otherBytes: number;
}

export function getAppStorageUsage(): StorageBreakdown {
  let docBytes = 0;
  try {
    const docDir = new Directory(Paths.document);
    if (docDir.exists) docBytes = docDir.size ?? 0;
  } catch {
    docBytes = 0;
  }
  const databaseBytes = getDatabaseSize();
  const imagesBytes = getImagesDirectorySize();
  const otherBytes = Math.max(0, docBytes - databaseBytes - imagesBytes);
  return {
    totalBytes: docBytes,
    databaseBytes,
    imagesBytes,
    otherBytes,
  };
}

const UNITS: Array<{ unit: string; bytes: number }> = [
  { unit: 'GB', bytes: 1024 * 1024 * 1024 },
  { unit: 'MB', bytes: 1024 * 1024 },
  { unit: 'KB', bytes: 1024 },
  { unit: 'B', bytes: 1 },
];

export function formatStorageSize(bytes: number, fractionDigits = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  for (const { unit, bytes: unitBytes } of UNITS) {
    if (bytes >= unitBytes) {
      const value = bytes / unitBytes;
      const digits = unit === 'B' ? 0 : fractionDigits;
      const rounded = Number(value.toFixed(digits));
      return `${rounded} ${unit}`;
    }
  }
  return `${bytes} B`;
}
