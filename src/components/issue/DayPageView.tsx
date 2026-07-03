"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomOut, Pencil, Check, Share } from "lucide-react";
import type { Block, DayEntry, EditionId } from "@/lib/issue-types";
import { MagazinePage } from "./BlockRenderer";
import { BlockEditor } from "./BlockEditor";
import { PrivacyBadge } from "./PrivacyBadge";
import { addDaysISO, todayISO } from "@/lib/date-utils";

interface DayPageViewProps {
  iso: string;
  entry: DayEntry | undefined;
  editionId: EditionId;
  pageNumber: number;
  onBlocksChange: (iso: string, blocks: Block[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onEnterScrub: () => void;
  onExport: () => void;
}

export function DayPageView({
  iso,
  entry,
  editionId,
  pageNumber,
  onBlocksChange,
  onPrev,
  onNext,
  onEnterScrub,
  onExport,
}: DayPageViewProps) {
  const [editing, setEditing] = useState(false);
  const [idle, setIdle] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isToday = iso === todayISO();

  // Touch swipe for prev/next day
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold && info.velocity.x > -0.5) onPrev();
    else if (info.offset.x < -threshold && info.velocity.x < 0.5) onNext();
  };

  // Idle detection — fade chrome after 2.5s of no interaction (only in read mode).
  // We compute idle from editing state without synchronously calling setState in
  // the effect body — the reset() callback is event-driven (pointer/keydown).
  useEffect(() => {
    if (editing) {
      if (idleRef.current) {
        clearTimeout(idleRef.current);
        idleRef.current = null;
      }
      return;
    }
    const reset = () => {
      setIdle(false);
      if (idleRef.current) clearTimeout(idleRef.current);
      idleRef.current = setTimeout(() => setIdle(true), 2800);
    };
    // Defer the initial idle timer to a microtask so we don't synchronously
    // setState during the effect body.
    const initial = setTimeout(reset, 0);
    window.addEventListener("pointerdown", reset);
    window.addEventListener("pointermove", reset);
    window.addEventListener("keydown", reset);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("pointerdown", reset);
      window.removeEventListener("pointermove", reset);
      window.removeEventListener("keydown", reset);
      if (idleRef.current) clearTimeout(idleRef.current);
    };
  }, [editing]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "e" || e.key === "E") setEditing(true);
      else if (e.key === "Escape") setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onPrev, onNext]);

  const blocks = entry?.blocks ?? [];

  return (
    <div className="min-h-[100dvh] relative">
      {/* Top bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-30 safe-top px-4 py-3 flex items-center justify-between fade-on-idle"
        style={{ opacity: idle && !editing ? 0 : 1, pointerEvents: idle && !editing ? "none" : "auto" }}
      >
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <PrivacyBadge compact />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onExport}
            className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition"
            aria-label="Export"
          >
            <Share className="w-4 h-4" />
          </button>
          <button
            onClick={onEnterScrub}
            className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition"
            aria-label="Scrub mode"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="p-2 rounded-full active:scale-95 transition"
            style={{
              background: editing ? "var(--issue-accent)" : "transparent",
              color: editing ? "var(--issue-accent-ink)" : "var(--issue-ink)",
            }}
            aria-label={editing ? "Done" : "Edit"}
          >
            {editing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* The page itself */}
      <motion.div
        key={iso + (editing ? "-edit" : "-read")}
        drag={editing ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
        className="px-3 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+64px)] pb-[calc(env(safe-area-inset-bottom,0px)+120px)]"
      >
        <div className="max-w-2xl mx-auto">
          {editing ? (
            <div
              className="issue-page rounded-lg p-6 sm:p-8"
              style={{ background: "var(--issue-surface)" }}
            >
              <EditMasthead iso={iso} />
              <div className="mt-6">
                <BlockEditor
                  blocks={blocks}
                  editionId={editionId}
                  onChange={(next) => onBlocksChange(iso, next)}
                />
              </div>
              <div className="mt-8 pt-3 border-t border-current/10 flex items-center justify-between issue-meta-caps opacity-50">
                <span>Draft</span>
                <span className="tabular-nums">{String(pageNumber).padStart(2, "0")}</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[60vh]">
              {blocks.length === 0 ? (
                <EmptyPage iso={iso} isToday={isToday} onEdit={() => setEditing(true)} />
              ) : (
                <MagazinePage
                  date={iso}
                  blocks={blocks}
                  editionId={editionId}
                  pageNumber={pageNumber}
                />
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Edge chevrons — fade in on idle-tap, otherwise minimal */}
      <AnimatePresence>
        {!idle && !editing && (
          <>
            <motion.button
              key="left-ch"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.4, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={onPrev}
              className="fixed left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-100 hover:bg-black/5 transition z-20"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              key="right-ch"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 0.4, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onClick={onNext}
              className="fixed right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:opacity-100 hover:bg-black/5 transition z-20"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditMasthead({ iso }: { iso: string }) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  const months = [
    "January","February","March","April","May","June","July","August","September","October","November","December",
  ];
  const issueNum = `${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
  return (
    <div className="issue-masthead-rule py-2 flex items-center justify-between">
      <span className="issue-meta-caps opacity-80">ISSUE {issueNum}</span>
      <span className="issue-masthead-title text-base font-bold tracking-[0.18em]">
        ISSUE
      </span>
      <span className="issue-meta-caps opacity-80">
        {months[dt.getMonth()].toUpperCase()} {dt.getFullYear()}
      </span>
    </div>
  );
}

function EmptyPage({
  iso,
  isToday,
  onEdit,
}: {
  iso: string;
  isToday: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="issue-page rounded-lg p-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="issue-meta-caps opacity-40 mb-4">
        {isToday ? "Today" : iso}
      </div>
      <div
        className="text-2xl mb-2"
        style={{ fontFamily: "var(--issue-serif)" }}
      >
        A blank page.
      </div>
      <p className="text-sm opacity-60 mb-6">
        Pages are patient. Write when you mean it.
      </p>
      <button
        onClick={onEdit}
        className="px-5 py-2.5 rounded-full text-sm font-medium"
        style={{
          background: "var(--issue-accent)",
          color: "var(--issue-accent-ink)",
        }}
      >
        Write this page
      </button>
    </div>
  );
}
