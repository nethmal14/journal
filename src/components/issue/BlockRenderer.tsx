"use client";

import { motion } from "framer-motion";
import type { Block, BlockType, EditionId } from "@/lib/issue-types";
import { getEdition } from "@/lib/editions";
import { decideLayout } from "@/lib/layout-engine";
import { PRESETS } from "@/lib/presets";

// Resolve the effective preset id for a block (block override > edition default).
export function effectivePreset(block: Block, editionId: EditionId): string {
  if (block.preset) return block.preset;
  return getEdition(editionId).defaults[block.type];
}

// Read-only magazine page renderer. Used both for the day-page view (read mode)
// and for PDF export (via the same DOM).
export function MagazinePage({
  date,
  blocks,
  editionId,
  pageNumber,
}: {
  date: string;
  blocks: Block[];
  editionId: EditionId;
  pageNumber: number;
}) {
  const edition = getEdition(editionId);
  const layout = decideLayout(blocks);
  const masthead = (() => {
    // Inline masthead generation to avoid import cycle
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    const months = [
      "January","February","March","April","May","June","July","August","September","October","November","December",
    ];
    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const issueNum = `${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}.${String(dt.getFullYear()).slice(2)}`;
    return {
      issue: `ISSUE ${issueNum}`,
      monthYear: `${months[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`,
      weekday: weekdays[dt.getDay()].toUpperCase(),
      dayNum: String(dt.getDate()),
    };
  })();

  return (
    <article
      className="issue-page relative mx-auto w-full"
      style={{
        background: "var(--issue-surface)",
        color: "var(--issue-ink)",
        borderRadius: "6px",
        padding: "clamp(20px, 6vw, 48px)",
        minHeight: "100%",
      }}
      data-issue-layout={layout.template}
    >
      {/* Masthead */}
      <header className="issue-masthead-rule py-2 mb-8 flex items-center justify-between">
        <span className="issue-meta-caps opacity-80">{masthead.issue}</span>
        <span className="issue-masthead-title text-base font-bold tracking-[0.18em]">
          ISSUE
        </span>
        <span className="issue-meta-caps opacity-80">{masthead.monthYear}</span>
      </header>

      {/* Body content laid out per template */}
      <MagazineBody blocks={blocks} editionId={editionId} layout={layout} />

      {/* Footer */}
      <footer className="mt-12 pt-3 border-t border-current/10 flex items-center justify-between issue-meta-caps opacity-50">
        <span>{masthead.weekday}</span>
        <span>{edition.name}</span>
        <span className="tabular-nums">{String(pageNumber).padStart(2, "0")}</span>
      </footer>
    </article>
  );
}

function MagazineBody({
  blocks,
  editionId,
  layout,
}: {
  blocks: Block[];
  editionId: EditionId;
  layout: ReturnType<typeof decideLayout>;
}) {
  // Build a left/right column split for mixed-grid / op-ed templates.
  const twoCol = layout.twoColumnRange;

  if (layout.template === "single-column") {
    return (
      <div className="space-y-5">
        {blocks.map((b, i) => (
          <BlockView key={b.id} block={b} editionId={editionId} index={i} />
        ))}
      </div>
    );
  }

  if (layout.template === "photo-essay") {
    return (
      <div className="space-y-6">
        {blocks.map((b, i) => {
          const isFullBleed = layout.fullBleedImageIndices.includes(i);
          if (isFullBleed && b.type === "image") {
            return (
              <FullBleedImage key={b.id} block={b} editionId={editionId} />
            );
          }
          return (
            <div
              key={b.id}
              className={b.type === "image" ? "max-w-2xl mx-auto" : ""}
            >
              <BlockView block={b} editionId={editionId} index={i} />
            </div>
          );
        })}
      </div>
    );
  }

  if (layout.template === "quote-feature") {
    const quoteIdx = layout.pullQuoteIndices[0];
    return (
      <div className="space-y-6">
        {blocks.map((b, i) => {
          if (i === quoteIdx) {
            return (
              <div key={b.id} className="my-10">
                <BlockView block={b} editionId={editionId} index={i} forceFeatured />
              </div>
            );
          }
          return <BlockView key={b.id} block={b} editionId={editionId} index={i} />;
        })}
      </div>
    );
  }

  // mixed-grid or op-ed: lead content, then two-column body range.
  const lead: Block[] = [];
  const body: Block[] = [];
  const tail: Block[] = [];
  if (twoCol) {
    blocks.forEach((b, i) => {
      if (i < twoCol.start) lead.push(b);
      else if (i <= twoCol.end) body.push(b);
      else tail.push(b);
    });
  } else {
    lead.push(...blocks);
  }

  return (
    <div className="space-y-6">
      {lead.map((b, i) => {
        const isFullBleed =
          b.type === "image" && layout.fullBleedImageIndices.includes(i);
        if (isFullBleed) {
          return <FullBleedImage key={b.id} block={b} editionId={editionId} />;
        }
        return <BlockView key={b.id} block={b} editionId={editionId} index={i} />;
      })}
      {body.length > 0 && (
        <div className="two-col-body space-y-4 mt-6">
          {body.map((b, i) => (
            <BlockView
              key={b.id}
              block={b}
              editionId={editionId}
              index={i + (twoCol?.start ?? 0)}
              inColumn
            />
          ))}
        </div>
      )}
      {tail.map((b, i) => (
        <BlockView
          key={b.id}
          block={b}
          editionId={editionId}
          index={i + (twoCol ? twoCol.end + 1 : 0)}
        />
      ))}
    </div>
  );
}

function FullBleedImage({ block, editionId }: { block: Block; editionId: EditionId }) {
  if (block.type !== "image") return null;
  const preset = effectivePreset(block, editionId);
  return (
    <div className="-mx-[clamp(20px,6vw,48px)] my-6">
      <ImageInner src={block.src} alt={block.alt} preset={preset} />
    </div>
  );
}

function BlockView({
  block,
  editionId,
  index,
  inColumn = false,
  forceFeatured = false,
}: {
  block: Block;
  editionId: EditionId;
  index: number;
  inColumn?: boolean;
  forceFeatured?: boolean;
}) {
  const preset = effectivePreset(block, editionId);

  switch (block.type) {
    case "heading":
      return (
        <h2 className={`preset-heading-${preset}`}>{block.text || "Untitled"}</h2>
      );
    case "body":
      // First body after a heading (index 1, or first in body range) gets a drop cap
      // for classic-style editions.
      const edition = getEdition(editionId);
      const isClassic = ["classic-justified", "noir-justified"].includes(preset);
      const dropCap = isClassic && index <= 1;
      return (
        <p className={`preset-body-${preset} ${dropCap ? "drop-cap" : ""}`}>
          {block.text || "Write here…"}
        </p>
      );
    case "image":
      return <ImageInner src={block.src} alt={block.alt} preset={preset} />;
    case "quote":
      return (
        <blockquote className={`preset-quote-${preset} ${forceFeatured ? "text-center" : ""}`}>
          <span>“{block.text}”</span>
          {block.attribution && (
            <footer
              className="mt-2 issue-meta-caps opacity-60"
              style={{ fontWeight: 500 }}
            >
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );
    case "caption":
      return <p className={`preset-caption-${preset}`}>{block.text}</p>;
    case "divider":
      return <div className={`preset-divider-${preset}`} aria-hidden="true">
        {preset === "ornamental" && <span>❦</span>}
      </div>;
    default:
      return null;
  }
}

function ImageInner({
  src,
  alt,
  preset,
}: {
  src: string;
  alt?: string;
  preset: string;
}) {
  if (!src) {
    return (
      <div
        className="w-full aspect-[4/3] flex items-center justify-center text-xs opacity-40"
        style={{ background: "color-mix(in srgb, var(--issue-ink) 5%, transparent)" }}
      >
        No image
      </div>
    );
  }
  return (
    <div className={`preset-image-${preset}`}>
      <img src={src} alt={alt || ""} className="w-full" />
    </div>
  );
}

// Helper exported for editor preview / PDF export
export { effectivePreset as getEffectivePreset };
