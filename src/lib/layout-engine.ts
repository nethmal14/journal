// Auto-layout engine.
//
// The user does not position blocks on a grid. They add blocks in order and
// we pick one of a small set of editorial templates that best fits the mix.
// Templates are layout *hints* — the BlockRenderer reads the chosen template
// and applies Tailwind grid classes accordingly.

import type { Block, BlockType } from "./issue-types";

export type LayoutTemplate =
  | "photo-essay"
  | "op-ed"
  | "mixed-grid"
  | "quote-feature"
  | "single-column";

export interface LayoutDecision {
  template: LayoutTemplate;
  // Indices into the block array that should be promoted / spanned / sidebarred
  fullBleedImageIndices: number[];
  pullQuoteIndices: number[];
  // True when the layout should render a two-column body for blocks [start,end]
  twoColumnRange: { start: number; end: number } | null;
  rationale: string;
}

const countBy = (blocks: Block[]) => {
  const c: Record<BlockType, number> = {
    heading: 0,
    body: 0,
    image: 0,
    quote: 0,
    caption: 0,
    divider: 0,
  };
  for (const b of blocks) c[b.type]++;
  return c;
};

export function decideLayout(blocks: Block[]): LayoutDecision {
  const counts = countBy(blocks);

  // Empty / minimal — single column fallback.
  if (blocks.length <= 1) {
    return {
      template: "single-column",
      fullBleedImageIndices: [],
      pullQuoteIndices: [],
      twoColumnRange: null,
      rationale: "Single column — too little content to template.",
    };
  }

  const imageIndices = blocks
    .map((b, i) => (b.type === "image" ? i : -1))
    .filter((i) => i >= 0);
  const quoteIndices = blocks
    .map((b, i) => (b.type === "quote" ? i : -1))
    .filter((i) => i >= 0);

  // QUOTE FEATURE: a single dominant quote with body around it.
  if (counts.quote >= 1 && counts.body >= 1 && counts.image <= 1) {
    return {
      template: "quote-feature",
      fullBleedImageIndices: imageIndices.slice(0, 1),
      pullQuoteIndices: quoteIndices,
      twoColumnRange: null,
      rationale: "Quote feature — pull quote is the centerpiece.",
    };
  }

  // PHOTO ESSAY: 2+ images, lighter on text. Promote images to full bleed.
  if (counts.image >= 2 && counts.body <= counts.image + 1) {
    return {
      template: "photo-essay",
      fullBleedImageIndices: imageIndices,
      pullQuoteIndices: [],
      twoColumnRange: null,
      rationale: "Photo essay — images carry the page.",
    };
  }

  // MIXED GRID: at least one image, at least 2 body blocks, optionally a quote.
  if (counts.image >= 1 && counts.body >= 2) {
    // Two-column body run starts after the first image (or first block if no image first).
    const firstImageIdx = imageIndices[0];
    const start = firstImageIdx + 1 < blocks.length ? firstImageIdx + 1 : 0;
    const end = blocks.length - 1;
    return {
      template: "mixed-grid",
      fullBleedImageIndices: imageIndices.slice(0, 1),
      pullQuoteIndices: quoteIndices,
      twoColumnRange: start < end ? { start, end } : null,
      rationale: "Mixed grid — lead image, two-column body.",
    };
  }

  // OP-ED: text-heavy, no images. Justified two-column body.
  if (counts.body >= 2 && counts.image === 0) {
    const firstBody = blocks.findIndex((b) => b.type === "body");
    const lastBody = blocks.length - 1;
    return {
      template: "op-ed",
      fullBleedImageIndices: [],
      pullQuoteIndices: quoteIndices,
      twoColumnRange: firstBody >= 0 && firstBody < lastBody ? { start: firstBody, end: lastBody } : null,
      rationale: "Op-ed — text-heavy, two columns.",
    };
  }

  // Fallback
  return {
    template: "single-column",
    fullBleedImageIndices: imageIndices,
    pullQuoteIndices: quoteIndices,
    twoColumnRange: null,
    rationale: "Single column — content didn't fit a richer template.",
  };
}
