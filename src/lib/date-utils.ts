// Date helpers. All app dates are normalized to local-day ISO yyyy-mm-dd
// (not UTC) so a user's "today" stays consistent regardless of timezone drift.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(iso: string, delta: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function addMonths(date: Date, delta: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + delta);
  return d;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function weekdayShort(d: Date): string {
  return WEEKDAYS[d.getDay()];
}
export function weekdayLong(d: Date): string {
  return WEEKDAYS_LONG[d.getDay()];
}
export function monthLong(d: Date): string {
  return MONTHS[d.getMonth()];
}
export function monthShort(d: Date): string {
  return MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
}

// Magazine-style masthead: "ISSUE 07.04.26 · JULY" style
export function mastheadFor(iso: string): { issue: string; monthYear: string; weekday: string; dayNum: string } {
  const d = fromISODate(iso);
  const issueNum = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
  return {
    issue: `ISSUE ${issueNum}`,
    monthYear: `${monthLong(d).toUpperCase()} ${d.getFullYear()}`,
    weekday: weekdayLong(d).toUpperCase(),
    dayNum: String(d.getDate()),
  };
}

// Returns a 6x7 grid of Dates covering the month (with leading/trailing days).
export function monthGrid(viewDate: Date): Date[] {
  const first = startOfMonth(viewDate);
  const startWeekday = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startWeekday);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export function clampDayInMonth(iso: string, viewDate: Date): string {
  // If a date is outside the current view month, snap to first/last of month.
  const d = fromISODate(iso);
  if (isSameMonth(d, viewDate)) return iso;
  return toISODate(startOfMonth(viewDate));
}

// Count entries in the given month from a set of ISO dates.
export function countInMonth(entries: Set<string>, year: number, month: number): number {
  let n = 0;
  entries.forEach((iso) => {
    const d = fromISODate(iso);
    if (d.getFullYear() === year && d.getMonth() === month) n++;
  });
  return n;
}

// Calculate current streak ending today (or the most recent day with an entry).
export function currentStreak(entries: Set<string>): number {
  if (entries.size === 0) return 0;
  let cursor = todayISO();
  if (!entries.has(cursor)) {
    // Allow streak to "rest" if today isn't written yet — start from yesterday.
    cursor = addDaysISO(cursor, -1);
    if (!entries.has(cursor)) return 0;
  }
  let streak = 0;
  while (entries.has(cursor)) {
    streak++;
    cursor = addDaysISO(cursor, -1);
  }
  return streak;
}
