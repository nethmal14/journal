import Dexie, { type Table } from "dexie";
import type { AppSettings, DayEntry, Block, EditionId } from "./issue-types";

// IndexedDB-backed, fully offline storage. No cloud, no account.
// All journal content lives only on this device.
export class IssueDB extends Dexie {
  entries!: Table<DayEntry, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("issue-journal-db");
    this.version(1).stores({
      // date is the primary key (ISO yyyy-mm-dd)
      entries: "date, updatedAt",
      settings: "id",
    });
  }
}

export const db = new IssueDB();

const DEFAULT_SETTINGS: AppSettings = {
  id: "settings",
  editionId: "classic-life",
  onboardingComplete: false,
  calendarMarker: "dot",
};

export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.get("settings");
  if (s) return s;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function setEdition(id: EditionId): Promise<void> {
  const s = await getSettings();
  await db.settings.put({ ...s, editionId: id });
}

export async function completeOnboarding(id: EditionId): Promise<void> {
  const s = await getSettings();
  await db.settings.put({
    ...s,
    editionId: id,
    onboardingComplete: true,
  });
}

export async function setCalendarMarker(mode: "dot" | "thumb"): Promise<void> {
  const s = await getSettings();
  await db.settings.put({ ...s, calendarMarker: mode });
}

export async function getEntry(date: string): Promise<DayEntry | undefined> {
  return db.entries.get(date);
}

export async function upsertEntry(date: string, blocks: Block[]): Promise<DayEntry> {
  const now = Date.now();
  const existing = await db.entries.get(date);
  const cover = blocks.find((b) => b.type === "image" && b.src)?.src;
  const entry: DayEntry = {
    date,
    blocks,
    cover,
    updatedAt: now,
    createdAt: existing?.createdAt ?? now,
  };
  await db.entries.put(entry);
  return entry;
}

export async function deleteEntry(date: string): Promise<void> {
  await db.entries.delete(date);
}

export interface MonthIndexItem {
  date: string;
  hasEntry: boolean;
  cover?: string;
}

// Returns a Set of dates (yyyy-mm-dd) that have entries, for fast calendar lookup.
export async function getAllEntryDates(): Promise<Set<string>> {
  const all = await db.entries.toArray();
  return new Set(all.map((e) => e.date));
}

export async function getAllEntries(): Promise<DayEntry[]> {
  return db.entries.orderBy("date").toArray();
}

// Generate a fresh block id without external deps.
export function newBlockId(): string {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
