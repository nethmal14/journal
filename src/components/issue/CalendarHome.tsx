"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import {
  addMonths,
  monthGrid,
  monthLong,
  toISODate,
  todayISO,
  isSameMonth,
  countInMonth,
  currentStreak,
} from "@/lib/date-utils";
import { PrivacyBadge } from "./PrivacyBadge";

interface CalendarHomeProps {
  entryDates: Set<string>;
  covers: Record<string, string | undefined>;
  markerMode: "dot" | "thumb";
  onPickDay: (iso: string) => void;
}

export function CalendarHome({
  entryDates,
  covers,
  markerMode,
  onPickDay,
}: CalendarHomeProps) {
  const today = todayISO();
  const [viewDate, setViewDate] = useState(() => new Date());

  const grid = useMemo(() => monthGrid(viewDate), [viewDate]);
  const monthCount = useMemo(
    () => countInMonth(entryDates, viewDate.getFullYear(), viewDate.getMonth()),
    [entryDates, viewDate]
  );
  const streak = useMemo(() => currentStreak(entryDates), [entryDates]);

  // Swipe handlers for month navigation
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setSwipeStart({ x: t.clientX, y: t.clientY });
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipeStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.x;
    const dy = t.clientY - swipeStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) setViewDate((v) => addMonths(v, -1));
      else setViewDate((v) => addMonths(v, 1));
    }
    setSwipeStart(null);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header
        className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="issue-meta-caps opacity-50 mb-1">Issue</div>
            <h1
              className="text-3xl sm:text-4xl leading-none"
              style={{ fontFamily: "var(--issue-serif)", fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              {monthLong(viewDate)}
            </h1>
            <div className="text-sm opacity-60 mt-1">{viewDate.getFullYear()}</div>
          </div>
          <PrivacyBadge compact />
        </div>

        {/* Streak / count indicators — quiet, not gamified */}
        <div className="flex items-center gap-4 mt-4">
          <Indicator
            icon={<Flame className="w-3.5 h-3.5" />}
            value={`${streak}`}
            label={streak === 1 ? "day streak" : "days streak"}
          />
          <Indicator
            value={`${monthCount}`}
            label={monthCount === 1 ? "issue this month" : "issues this month"}
          />
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setViewDate((v) => addMonths(v, -1))}
            className="p-2 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewDate(new Date())}
            className="issue-meta-caps opacity-60 hover:opacity-100 transition"
          >
            Today
          </button>
          <button
            onClick={() => setViewDate((v) => addMonths(v, 1))}
            className="p-2 -mr-2 rounded-full hover:bg-black/5 active:scale-95 transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="px-5 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${viewDate.getFullYear()}-${viewDate.getMonth()}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <WeekdayHeader />
            <div className="grid grid-cols-7 gap-1 mt-2">
              {grid.map((d) => {
                const iso = toISODate(d);
                const inMonth = isSameMonth(d, viewDate);
                const isToday = iso === today;
                const hasEntry = entryDates.has(iso);
                const cover = covers[iso];
                return (
                  <DayCell
                    key={iso}
                    iso={iso}
                    dayNum={d.getDate()}
                    inMonth={inMonth}
                    isToday={isToday}
                    hasEntry={hasEntry}
                    cover={cover}
                    markerMode={markerMode}
                    onPick={() => onPickDay(iso)}
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] pt-6">
        <PrivacyBadge />
      </footer>
    </div>
  );
}

function Indicator({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="opacity-60">{icon}</span>}
      <span
        className="text-lg font-semibold tabular-nums"
        style={{ fontFamily: "var(--issue-serif)" }}
      >
        {value}
      </span>
      <span className="text-xs opacity-60">{label}</span>
    </div>
  );
}

function WeekdayHeader() {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  return (
    <div className="grid grid-cols-7">
      {days.map((d, i) => (
        <div
          key={i}
          className="text-center issue-meta-caps opacity-50 py-1"
        >
          {d}
        </div>
      ))}
    </div>
  );
}

function DayCell({
  iso,
  dayNum,
  inMonth,
  isToday,
  hasEntry,
  cover,
  markerMode,
  onPick,
}: {
  iso: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  hasEntry: boolean;
  cover?: string;
  markerMode: "dot" | "thumb";
  onPick: () => void;
}) {
  return (
    <motion.button
      onClick={onPick}
      className="relative aspect-square rounded-lg flex flex-col items-center justify-center transition-colors"
      style={{
        opacity: inMonth ? 1 : 0.25,
        background: isToday ? "var(--issue-accent)" : "transparent",
        color: isToday ? "var(--issue-accent-ink)" : "var(--issue-ink)",
      }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-label={`${iso}${hasEntry ? " · has entry" : ""}`}
    >
      {markerMode === "thumb" && cover && hasEntry && !isToday ? (
        <div
          className="absolute inset-1 rounded-md bg-cover bg-center"
          style={{
            backgroundImage: `url(${cover})`,
            opacity: 0.85,
          }}
        />
      ) : null}
      <span
        className="relative text-sm font-medium tabular-nums"
        style={{ fontFamily: "var(--issue-sans)" }}
      >
        {dayNum}
      </span>
      {hasEntry && !isToday && markerMode === "dot" && (
        <span
          className="absolute bottom-1.5 w-1 h-1 rounded-full"
          style={{ background: "var(--issue-accent)" }}
        />
      )}
      {hasEntry && isToday && (
        // Today's cell already has the accent fill — add a tiny ring at the bottom
        // so the entry marker is still visible.
        <span
          className="absolute bottom-1 w-3 h-0.5 rounded-full"
          style={{ background: "var(--issue-accent-ink)", opacity: 0.7 }}
        />
      )}
      {hasEntry && !isToday && markerMode === "thumb" && !cover && (
        <span
          className="absolute bottom-1.5 w-1 h-1 rounded-full"
          style={{ background: "var(--issue-accent)" }}
        />
      )}
    </motion.button>
  );
}
