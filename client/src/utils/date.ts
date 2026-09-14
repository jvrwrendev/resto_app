import { format, parseISO } from 'date-fns';

export function todayKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function compactKey(d: Date = new Date()): string {
  return format(d, 'yyyyMMdd');
}

export function formatDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy h:mm a');
  } catch {
    return iso;
  }
}

export function formatTime(iso: string): string {
  try {
    return format(parseISO(iso), 'h:mm a');
  } catch {
    return iso;
  }
}

export function formatHourLabel(d: Date = new Date()): string {
  return format(d, 'h a');
}
