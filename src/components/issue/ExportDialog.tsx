"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import type { DayEntry, EditionId } from "@/lib/issue-types";
import { getEdition } from "@/lib/editions";
import { MagazinePage } from "./BlockRenderer";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  iso: string;
  // Month export: pass entries for the whole month
  monthEntries: { iso: string; entry: DayEntry | undefined }[];
  singleEntry: DayEntry | undefined;
  editionId: EditionId;
  pageNumber: number;
}

type Scope = "day" | "month";

// Print My Year (MVP step): export a single day or a single month as a
// print-ready PDF, laid out exactly like the in-app magazine spreads.
export function ExportDialog({
  open,
  onClose,
  iso,
  monthEntries,
  singleEntry,
  editionId,
  pageNumber,
}: ExportDialogProps) {
  const [scope, setScope] = useState<Scope>("day");
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const { exportToPdf } = await import("@/lib/pdf-export");
      const edition = getEdition(editionId);
      const target = document.getElementById("export-render-root");
      if (!target) throw new Error("Render root not found");

      // Render the magazine pages into the hidden DOM node, then capture.
      const pages: { iso: string; entry: DayEntry | undefined }[] =
        scope === "day"
          ? [{ iso, entry: singleEntry }]
          : monthEntries.filter((x) => x.entry && x.entry.blocks.length > 0);

      target.innerHTML = "";
      const React = await import("react");
      const ReactDOM = await import("react-dom/client");
      const root = ReactDOM.createRoot(target);
      root.render(
        React.createElement(
          "div",
          { style: { width: "794px", padding: "0", background: edition.tokens.bg } },
          pages.map((p, i) =>
            React.createElement(
              "div",
              {
                key: p.iso,
                "data-export-page": "1",
                style: {
                  width: "794px",
                  minHeight: "1123px", // A4 at 96dpi
                  padding: "48px",
                  background: edition.tokens.surface,
                  color: edition.tokens.ink,
                  boxSizing: "border-box",
                  marginBottom: "24px",
                  fontFamily: edition.tokens.sans,
                },
              },
              [
                React.createElement(MagazinePage, {
                  key: "p",
                  date: p.iso,
                  blocks: p.entry?.blocks ?? [],
                  editionId,
                  pageNumber: i + 1,
                }),
              ]
            )
          )
        )
      );

      // Wait a tick for images to load
      await new Promise((r) => setTimeout(r, 400));
      await exportToPdf({
        selector: '[data-export-page="1"]',
        filename:
          scope === "day"
            ? `issue-${iso}.pdf`
            : `issue-${iso.slice(0, 7)}.pdf`,
        edition,
      });
      root.unmount();
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 safe-bottom"
            style={{
              background: "var(--issue-surface)",
              color: "var(--issue-ink)",
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="issue-meta-caps opacity-60 mb-1">Print My Year</div>
                <h2
                  className="text-2xl"
                  style={{ fontFamily: "var(--issue-serif)", fontWeight: 700 }}
                >
                  Export to PDF
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-black/5 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm opacity-70 mb-5">
              Print-ready PDF, laid out exactly like your magazine spreads.
              Generated locally — nothing leaves your device.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              <ScopeBtn
                active={scope === "day"}
                onClick={() => setScope("day")}
                label="This day"
                hint={iso}
              />
              <ScopeBtn
                active={scope === "month"}
                onClick={() => setScope("month")}
                label="This month"
                hint={`${iso.slice(0, 7)}`}
              />
            </div>

            <button
              onClick={doExport}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium disabled:opacity-50"
              style={{
                background: "var(--issue-accent)",
                color: "var(--issue-accent-ink)",
              }}
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rendering…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {scope === "day" ? "day" : "month"} as PDF
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ScopeBtn({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg transition"
      style={{
        background: active
          ? "color-mix(in srgb, var(--issue-accent) 12%, transparent)"
          : "color-mix(in srgb, var(--issue-ink) 4%, transparent)",
        border: `1px solid ${
          active ? "var(--issue-accent)" : "transparent"
        }`,
      }}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="issue-meta-caps opacity-60 mt-0.5">{hint}</div>
    </button>
  );
}
