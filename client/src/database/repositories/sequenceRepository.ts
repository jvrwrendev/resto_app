import { getDB } from '../database';
import { todayKey } from '@/utils/date';

interface LastValueRow {
  last_value: number;
}

export function nextOrderNumber(d: Date = new Date()): string {
  const db = getDB();
  const date = todayKey(d);
  const compact = d.toISOString().slice(0, 10).replace(/-/g, '');

  let value = 0;
  db.execSync('BEGIN IMMEDIATE;');
  try {
    db.runSync(
      'INSERT OR IGNORE INTO daily_sequences(date, last_value) VALUES(?, 0);',
      [date],
    );
    db.runSync(
      'UPDATE daily_sequences SET last_value = last_value + 1 WHERE date = ?;',
      [date],
    );
    const row = db.getFirstSync<LastValueRow>(
      'SELECT last_value FROM daily_sequences WHERE date = ?;',
      [date],
    );
    value = row?.last_value ?? 0;
    db.execSync('COMMIT;');
  } catch (e) {
    db.execSync('ROLLBACK;');
    throw e;
  }

  return `${compact}-${String(value).padStart(3, '0')}`;
}

export function getLastValue(date: string = todayKey()): number {
  const db = getDB();
  const row = db.getFirstSync<LastValueRow>(
    'SELECT last_value FROM daily_sequences WHERE date = ?;',
    [date],
  );
  return row?.last_value ?? 0;
}
