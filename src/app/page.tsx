"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getEdition } from "@/lib/editions";
import {
  getSettings,
  completeOnboarding,
  upsertEntry,
  getAllEntries,
} from "@/lib/issue-db";
import type { AppSettings, Block, DayEntry, EditionId } from "@/lib/issue-types";
import {
  addDaysISO,
  monthGrid,
  toISODate,
  todayISO,
  isSameMonth,
} from "@/lib/date-utils";
import { Onboarding } from "@/components/issue/Onboarding";
import { CalendarHome } from "@/components/issue/CalendarHome";
import { DayPageView } from "@/components/issue/DayPageView";
import { ScrubMode } from "@/components/issue/ScrubMode";
import { PillNav, type NavTab } from "@/components/issue/PillNav";
import { ExportDialog } from "@/components/issue/ExportDialog";

type View =
  | { kind: "calendar" }
  | { kind: "journal"; iso: string }
  | { kind: "scrub"; iso: string };

export default function Home() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [view, setView] = useState<View>({ kind: "calendar" });
  const [entriesMap, setEntriesMap] = useState<Record<string, DayEntry>>({});
  const [exportOpen, setExportOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refreshEntries = useCallback(async () => {
    const all = await getAllEntries();
    const map: Record<string, DayEntry> = {};
    for (const e of all) map[e.date] = e;
    setEntriesMap(map);
  }, []);

  // Load settings + all entries on mount
  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      if (s.onboardingComplete) {
        await refreshEntries();
      }
      setHydrated(true);
    })();
  }, [refreshEntries]);

  // Note: We optimistically update `entriesMap` on every block change, so a
  // Dexie live subscription is not needed for the editor's own writes.
  // `refreshEntries` is still called on mount and after onboarding to load
  // any pre-existing data from previous sessions.

  const editionId = settings?.editionId ?? "classic-life";
  const edition = getEdition(editionId);

  const entryDates = useMemo(
    () => new Set(Object.keys(entriesMap)),
    [entriesMap]
  );

  const covers = useMemo(() => {
    const out: Record<string, string | undefined> = {};
    for (const [iso, entry] of Object.entries(entriesMap)) {
      out[iso] = entry.cover;
    }
    return out;
  }, [entriesMap]);

  // Inline token style applied to the root — these cascade to all .issue-* classes.
  const rootStyle = {
    ["--issue-bg" as string]: edition.tokens.bg,
    ["--issue-surface" as string]: edition.tokens.surface,
    ["--issue-ink" as string]: edition.tokens.ink,
    ["--issue-ink-muted" as string]: edition.tokens.inkMuted,
    ["--issue-accent" as string]: edition.tokens.accent,
    ["--issue-accent-ink" as string]: edition.tokens.accentInk,
    ["--issue-rule" as string]: edition.tokens.rule,
    ["--issue-serif" as string]: edition.tokens.serif,
    ["--issue-sans" as string]: edition.tokens.sans,
    ["--issue-mono" as string]: edition.tokens.mono,
  } as React.CSSProperties;

  // Page number relative to earliest entry in current month
  const computePageNumber = useCallback(
    (iso: string): number => {
      const d = new Date(iso);
      const grid = monthGrid(d);
      const first = toISODate(grid[0]);
      let n = 0;
      let cursor = first;
      while (cursor <= iso) {
        if (entriesMap[cursor] && entriesMap[cursor].blocks.length > 0) n++;
        cursor = addDaysISO(cursor, 1);
      }
      return Math.max(n, 1);
    },
    [entriesMap]
  );

  // Month entries for export
  const currentIso = view.kind === "journal" ? view.iso : todayISO();
  const currentMonthEntries = useMemo(() => {
    const d = new Date(currentIso);
    return monthGrid(d)
      .filter((dd) => isSameMonth(dd, d))
      .map((dd) => {
        const iso = toISODate(dd);
        return { iso, entry: entriesMap[iso] };
      });
  }, [currentIso, entriesMap]);

  // ===== Render gates =====
  if (!hydrated) {
    return (
      <div
        className="min-h-[100dvh] flex items-center justify-center"
        style={{ background: "#0b0b0d", color: "#f5f3ee" }}
      >
        <div className="issue-meta-caps opacity-60">Loading…</div>
      </div>
    );
  }

  if (settings && !settings.onboardingComplete) {
    return (
      <div className="issue-app" style={rootStyle}>
        <Onboarding
          onComplete={async (edId: EditionId) => {
            await completeOnboarding(edId);
            const s = await getSettings();
            setSettings(s);
            await refreshEntries();
            setView({ kind: "journal", iso: todayISO() });
          }}
        />
      </div>
    );
  }

  const handleBlocksChange = async (iso: string, blocks: Block[]) => {
    // Optimistic local update — keeps the editor's `blocks` prop in sync
    // immediately so rapid edits don't race with the IndexedDB round-trip.
    setEntriesMap((prev) => {
      const existing = prev[iso];
      const now = Date.now();
      return {
        ...prev,
        [iso]: {
          date: iso,
          blocks,
          cover: blocks.find((b) => b.type === "image" && b.src)?.src,
          updatedAt: now,
          createdAt: existing?.createdAt ?? now,
        },
      };
    });
    await upsertEntry(iso, blocks);
  };

  const navigateDay = (delta: number) => {
    setView((v) => {
      if (v.kind !== "journal") return v;
      return { kind: "journal", iso: addDaysISO(v.iso, delta) };
    });
  };

  // Pill nav state
  const navState: "full" | "shrunk" | "hidden" =
    view.kind === "scrub" ? "hidden" : "full";
  const navTab: NavTab = view.kind === "calendar" ? "calendar" : "journal";

  return (
    <div className="issue-app" style={rootStyle}>
      <AnimatePresence mode="wait">
        {view.kind === "calendar" && (
          <motion.div
            key="calendar-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <CalendarHome
              entryDates={entryDates}
              covers={covers}
              markerMode={settings?.calendarMarker ?? "dot"}
              onPickDay={(iso) => setView({ kind: "journal", iso })}
            />
          </motion.div>
        )}

        {view.kind === "journal" && (
          <motion.div
            key={`journal-${view.iso}`}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <DayPageView
              iso={view.iso}
              entry={entriesMap[view.iso]}
              editionId={editionId}
              pageNumber={computePageNumber(view.iso)}
              onBlocksChange={handleBlocksChange}
              onPrev={() => navigateDay(-1)}
              onNext={() => navigateDay(1)}
              onEnterScrub={() => setView({ kind: "scrub", iso: view.iso })}
              onExport={() => setExportOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view.kind === "scrub" && (
          <ScrubMode
            entryDates={entryDates}
            entries={entriesMap}
            currentIso={view.iso}
            editionId={editionId}
            onClose={() => setView({ kind: "journal", iso: view.iso })}
            onPick={(iso) => setView({ kind: "journal", iso })}
          />
        )}
      </AnimatePresence>

      <PillNav
        active={navTab}
        onChange={(tab) => {
          if (tab === "calendar") setView({ kind: "calendar" });
          else
            setView((v) =>
              v.kind === "journal" ? v : { kind: "journal", iso: todayISO() }
            );
        }}
        state={navState}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        iso={currentIso}
        monthEntries={currentMonthEntries}
        singleEntry={entriesMap[currentIso]}
        editionId={editionId}
        pageNumber={computePageNumber(currentIso)}
      />

      {/* Hidden render target for PDF export */}
      <div
        id="export-render-root"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          width: "794px",
          pointerEvents: "none",
          opacity: 0,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
