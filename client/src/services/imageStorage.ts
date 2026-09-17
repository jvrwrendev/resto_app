import { Directory, File, Paths } from 'expo-file-system';
import { getDB } from '@/database/database';

const IMAGES_SUBDIR = 'product-images';
const DB_NAME = 'bbq_pos.db';

function getImagesDirectory(): Directory {
  const dir = new Directory(Paths.document, IMAGES_SUBDIR);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function getExtensionFromUri(uri: string): string {
  const cleaned = uri.split('?')[0].split('#')[0];
  const lastDot = cleaned.lastIndexOf('.');
  if (lastDot === -1) return 'jpg';
  const ext = cleaned.substring(lastDot + 1).toLowerCase();
  if (!/^[a-z0-9]{2,5}$/.test(ext)) return 'jpg';
  return ext;
}

export function isTemporaryUri(uri: string | null | undefined): boolean {
  if (!uri) return true;
  if (!uri.startsWith('file://') && !uri.startsWith('/')) return true;
  const normalized = uri.toLowerCase();
  if (normalized.includes('/tmp/')) return true;
  if (normalized.includes('/cache/')) return true;
  if (normalized.includes('/caches/')) return true;
  const docUri = Paths.document?.uri;
  if (docUri && normalized.startsWith(docUri.toLowerCase())) return false;
  const cacheUri = Paths.cache?.uri;
  if (cacheUri && normalized.startsWith(cacheUri.toLowerCase())) return true;
  return true;
}

function generateUniqueFilename(extension: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `img_${stamp}_${rand}.${extension}`;
}

export async function persistImage(sourceUri: string): Promise<string> {
  const ext = getExtensionFromUri(sourceUri);
  const filename = generateUniqueFilename(ext);
  const dir = getImagesDirectory();
  const sourceFile = new File(sourceUri);
  if (!sourceFile.exists) {
    throw new Error('Source image is no longer available');
  }
  const destination = new File(dir, filename);
  await sourceFile.copy(destination);
  return destination.uri;
}

export function deleteImageIfManaged(uri: string | null | undefined): void {
  if (!uri) return;
  const docUri = Paths.document?.uri;
  if (!docUri) return;
  if (!uri.toLowerCase().startsWith(docUri.toLowerCase())) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Ignore: best-effort cleanup.
  }
}

export function migrateExistingImages(): number {
  if (!Paths.document?.uri) return 0;
  const db = getDB();
  const rows = db.getAllSync<{ id: number; image_uri: string | null }>(
    'SELECT id, image_uri FROM products WHERE image_uri IS NOT NULL AND image_uri <> "";',
  );
  let migrated = 0;
  for (const row of rows) {
    const current = row.image_uri;
    if (!current) continue;
    if (!isTemporaryUri(current)) continue;
    try {
      const file = new File(current);
      if (!file.exists) continue;
      const ext = getExtensionFromUri(current);
      const filename = generateUniqueFilename(ext);
      const dir = getImagesDirectory();
      const destination = new File(dir, filename);
      // Use synchronous copy to keep migrations deterministic.
      file.copySync(destination);
      db.runSync('UPDATE products SET image_uri = ?, updated_at = ? WHERE id = ?;', [
        destination.uri,
        new Date().toISOString(),
        row.id,
      ]);
      migrated++;
    } catch {
      // Skip files we cannot copy; leave the original URI for inspection.
    }
  }
  return migrated;
}

export function getImagesDirectorySize(): number {
  try {
    const dir = new Directory(Paths.document, IMAGES_SUBDIR);
    if (!dir.exists) return 0;
    return dir.size ?? 0;
  } catch {
    return 0;
  }
}

export function getDatabaseSize(): number {
  try {
    const file = new File(Paths.document, DB_NAME);
    if (!file.exists) return 0;
    return file.size ?? 0;
  } catch {
    return 0;
  }
}

export { IMAGES_SUBDIR, DB_NAME };
