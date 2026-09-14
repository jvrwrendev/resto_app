import { getDB } from '../database';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export function listCategories(): Category[] {
  const db = getDB();
  return db.getAllSync<Category>(
    'SELECT * FROM categories ORDER BY sort_order ASC, name ASC;',
  );
}

export function findCategoryBySlug(slug: string): Category | null {
  const db = getDB();
  return (
    db.getFirstSync<Category>('SELECT * FROM categories WHERE slug = ?;', [slug]) ?? null
  );
}
