"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Block, DayEntry, EditionId } from "@/lib/issue-types";
import { addDaysISO, fromISODate, mastheadFor } from "@/lib/date-utils";

interface ScrubModeProps {
  entryDates: Set<string>;
  entries: Record<string, DayEntry | undefined>;
  currentIso: string;
  editionId: EditionId;
  onClose: () => void;
  onPick: (iso: string) => void;
}

// Full-screen zoomed-out scrub mode.
// Renders a horizontal filmstrip of day-pages (real or empty placeholders) at
// reduced scale, with inertial scroll and a haptic "tick" as each day passes
// the center threshold.
export function ScrubMode({
  entryDates,
  entries,
  currentIso,
  editionId,
  onClose,
  onPick,
}: ScrubModeProps) {
  // Build a window of +/- 60 days around currentIso so scrubbing stays smooth.
  const days = useMemo(() => {
    const out: string[] = [];
    let cursor = addDaysISO(currentIso, -60);
    const end = addDaysISO(currentIso, 60);
    while (cursor <= end) {
      out.push(cursor);
      cursor = addDaysISO(cursor, 1);
    }
    return out;
  }, [currentIso]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [centerIso, setCenterIso] = useState(currentIso);
  const lastTickIso = useRef<string>(currentIso);
  const itemWidth = 240; // px, includes gap

  // Snap initial scroll position to currentIso
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const idx = days.indexOf(currentIso);
    if (idx < 0) return;
    const target = idx * itemWidth + itemWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollLeft = target;
  }, [days, currentIso]);

  // On scroll, compute which day is centered and trigger haptic tick on change.
  const onScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    const idx = Math.floor(center / itemWidth);
    const iso = days[idx];
    if (!iso) return;
    if (iso !== lastTickIso.current) {
      lastTickIso.current = iso;
      setCenterIso(iso);
      // Haptic tick (where supported)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(6);
      }
    }
  };

  const pickCenter = () => {
    onPick(centerIso);
  };

  const jumpBy = (delta: number) => {
    const idx = days.indexOf(centerIso);
    if (idx < 0) return;
    const next = days[Math.max(0, Math.min(days.length - 1, idx + delta))];
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = days.indexOf(next) * itemWidth + itemWidth / 2 - scroller.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  };

  const mast = mastheadFor(centerIso);

  return (
    <motion.div
      className="fixed inset-0 z-50"
      style={{ background: "var(--issue-bg)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 safe-top px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition"
          aria-label="Close scrub mode"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="issue-meta-caps opacity-60">{mast.issue}</div>
          <div
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--issue-serif)" }}
          >
            {mast.monthYear}
          </div>
        </div>
        <button
          onClick={pickCenter}
          className="px-4 py-2 rounded-full text-xs font-medium"
          style={{
            background: "var(--issue-accent)",
            color: "var(--issue-accent-ink)",
          }}
        >
          Open
        </button>
      </div>

      {/* Filmstrip */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar absolute inset-0 flex items-center overflow-x-auto"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Left spacer for centering first item */}
        <div style={{ flex: "0 0 50%", minWidth: "50%" }} aria-hidden="true" />
        {days.map((iso) => (
          <ScrubCard
            key={iso}
            iso={iso}
            entry={entries[iso]}
            editionId={editionId}
            hasEntry={entryDates.has(iso)}
            isCenter={iso === centerIso}
            onPick={() => onPick(iso)}
          />
        ))}
        <div style={{ flex: "0 0 50%", minWidth: "50%" }} aria-hidden="true" />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 safe-bottom px-6 py-5 flex items-center justify-center gap-6">
        <button
          onClick={() => jumpBy(-7)}
          className="p-2 rounded-full hover:bg-black/5 transition"
          aria-label="Back one week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          className="text-center min-w-[140px]"
          style={{ fontFamily: "var(--issue-serif)" }}
        >
          <div className="text-2xl font-semibold">{mast.dayNum}</div>
          <div className="issue-meta-caps opacity-60">{mast.weekday}</div>
        </div>
        <button
          onClick={() => jumpBy(7)}
          className="p-2 rounded-full hover:bg-black/5 transition"
          aria-label="Forward one week"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Center focal indicator — subtle vertical lines */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 z-10">
        <div className="w-px h-12" style={{ background: "color-mix(in srgb, var(--issue-accent) 60%, transparent)" }} />
      </div>
    </motion.div>
  );
}

function ScrubCard({
  iso,
  entry,
  editionId,
  hasEntry,
  isCenter,
  onPick,
}: {
  iso: string;
  entry: DayEntry | undefined;
  editionId: EditionId;
  hasEntry: boolean;
  isCenter: boolean;
  onPick: () => void;
}) {
  const blocks = entry?.blocks ?? [];
  const dt = fromISODate(iso);
  const dayNum = String(dt.getDate());
  const monthShort = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();

  return (
    <motion.div
      className="flex-shrink-0 cursor-pointer"
      style={{
        width: "210px",
        marginRight: "30px",
        scrollSnapAlign: "center",
      }}
      animate={{
        scale: isCenter ? 1 : 0.82,
        opacity: isCenter ? 1 : 0.55,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      onClick={onPick}
    >
      <div
        className="issue-page rounded p-3 overflow-hidden"
        style={{
          background: "var(--issue-surface)",
          height: "300px",
          position: "relative",
        }}
      >
        {/* Masthead */}
        <div className="issue-masthead-rule py-1 px-1 mb-2 flex items-center justify-between">
          <span className="issue-meta-caps opacity-60">{dayNum}</span>
          <span className="issue-meta-caps opacity-60">{monthShort}</span>
        </div>

        {/* Mini page preview */}
        <div
          className="text-[6px] leading-[1.4] overflow-hidden"
          style={{ height: "240px" }}
        >
          {blocks.length === 0 ? (
            <div className="opacity-30 text-center pt-10" style={{ fontFamily: "var(--issue-serif)" }}>
              blank
            </div>
          ) : (
            <MiniPage blocks={blocks} editionId={editionId} />
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between issue-meta-caps opacity-40">
          <span>{hasEntry ? "●" : "○"}</span>
          <span>{dayNum}</span>
        </div>
      </div>
    </motion.div>
  );
}

function MiniPage({ blocks, editionId }: { blocks: Block[]; editionId: EditionId }) {
  // Render a tiny representation of up to 4 blocks for the scrub card.
  return (
    <div className="space-y-1">
      {blocks.slice(0, 4).map((b) => {
        switch (b.type) {
          case "heading":
            return (
              <div
                key={b.id}
                className="font-bold"
                style={{ fontFamily: "var(--issue-serif)", fontSize: "8px" }}
              >
                {(b.text || "Untitled").slice(0, 40)}
              </div>
            );
          case "body":
            return (
              <div
                key={b.id}
                style={{ color: "var(--issue-ink-muted)", fontSize: "5.5px" }}
              >
                {(b.text || "").slice(0, 140)}
              </div>
            );
          case "image":
            return (
              <div
                key={b.id}
                className="w-full h-10 bg-cover bg-center rounded-sm"
                style={{
                  backgroundImage: `url(${b.src})`,
                  background: b.src ? undefined : "color-mix(in srgb, var(--issue-ink) 10%, transparent)",
                }}
              />
            );
          case "quote":
            return (
              <div
                key={b.id}
                className="italic"
                style={{ fontFamily: "var(--issue-serif)", fontSize: "6px" }}
              >
                “{(b.text || "").slice(0, 60)}”
              </div>
            );
          case "caption":
            return (
              <div key={b.id} className="opacity-60" style={{ fontSize: "5px" }}>
                {(b.text || "").slice(0, 60)}
              </div>
            );
          case "divider":
            return (
              <div
                key={b.id}
                className="h-px my-1"
                style={{ background: "color-mix(in srgb, var(--issue-ink) 30%, transparent)" }}
              />
            );
          default:
            return null;
        }
      })}
      {blocks.length > 4 && (
        <div className="opacity-40 text-center" style={{ fontSize: "5px" }}>
          +{blocks.length - 4} more
        </div>
      )}
    </div>
  );
}
