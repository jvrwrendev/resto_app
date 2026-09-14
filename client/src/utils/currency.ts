export function formatPHP(value: number): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2);
  const [whole, frac] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `\u20B1${withCommas}.${frac}`;
}

export function parseAmount(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
