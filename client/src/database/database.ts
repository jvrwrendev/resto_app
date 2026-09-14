import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'bbq_pos.db';

let _db: SQLiteDatabase | null = null;

export function getDB(): SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

export function closeDB(): void {
  if (_db) {
    _db.closeSync();
    _db = null;
  }
}
