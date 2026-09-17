import { getDB } from './database';
import { SCHEMA_STATEMENTS } from './schema';
import { seedDatabase } from './seed';
import { migrateExistingImages } from '@/services/imageStorage';
import { AppError } from '@/utils/errors';

let _initialized = false;

export function initDatabase(): void {
  if (_initialized) return;
  try {
    const db = getDB();
    db.execSync('PRAGMA foreign_keys = ON;');
    for (const stmt of SCHEMA_STATEMENTS) {
      db.execSync(stmt);
    }
    runMigrations(db);
    seedDatabase();
    try {
      migrateExistingImages();
    } catch {
      // Best-effort: existing images will remain as-is if migration fails.
    }
    _initialized = true;
  } catch (err) {
    throw new AppError('DB_INIT_FAILED');
  }
}

function runMigrations(db: ReturnType<typeof getDB>): void {
  const productColumns = db.getAllSync<{ name: string }>('PRAGMA table_info(products);');
  const hasImageUri = productColumns.some((c) => c.name === 'image_uri');
  if (!hasImageUri) {
    db.execSync('ALTER TABLE products ADD COLUMN image_uri TEXT;');
  }
}

export function isDatabaseInitialized(): boolean {
  return _initialized;
}
