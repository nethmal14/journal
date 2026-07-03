import type { Edition, EditionId } from "./issue-types";

// Editions are full theme presets. Each one sets sensible defaults for every
// block type so the user lands on a polished page on day one with zero config.
export const EDITIONS: Record<EditionId, Edition> = {
  "classic-life": {
    id: "classic-life",
    name: "Classic LIFE",
    tagline: "Photo-essay era",
    description:
      "Serif mastheads, generous margins, deep ink on warm paper. Built for photo essays and long-form memoirs.",
    tokens: {
      bg: "#f4efe4",
      surface: "#fbf7ec",
      ink: "#1c1a16",
      inkMuted: "#6a6457",
      accent: "#9a2a1b",
      accentInk: "#ffffff",
      rule: "#1c1a16",
      serif: "'Source Serif 4', 'Playfair Display', Georgia, serif",
      sans: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    defaults: {
      heading: "editorial-serif",
      body: "classic-justified",
      image: "full-bleed",
      quote: "pull-quote-large",
      caption: "italic-smallcaps",
      divider: "ornamental",
    },
    swatch: "linear-gradient(135deg,#f4efe4 0%,#9a2a1b 100%)",
  },
  "modern-minimal": {
    id: "modern-minimal",
    name: "Modern Minimal",
    tagline: "Swiss editorial",
    description:
      "Whitespace as a feature. Geometric sans-serif, hairline rules, monochrome with a single cool accent.",
    tokens: {
      bg: "#fafafa",
      surface: "#ffffff",
      ink: "#0a0a0a",
      inkMuted: "#737373",
      accent: "#0a0a0a",
      accentInk: "#ffffff",
      rule: "#e5e5e5",
      serif: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
      sans: "'Inter', 'Helvetica Neue', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    defaults: {
      heading: "modern-sans",
      body: "modern-clean",
      image: "framed-polaroid",
      quote: "underline-accent",
      caption: "modern-meta",
      divider: "hairline",
    },
    swatch: "linear-gradient(135deg,#fafafa 0%,#0a0a0a 100%)",
  },
  "warm-kraft": {
    id: "warm-kraft",
    name: "Warm Kraft",
    tagline: "Field journal",
    description:
      "Hand-bound sketchbook energy. Kraft paper grain, typewriter headings, soft brown accents.",
    tokens: {
      bg: "#e7ddc8",
      surface: "#efe7d4",
      ink: "#3a2f1f",
      inkMuted: "#7a6a4d",
      accent: "#7a4f1d",
      accentInk: "#fbf7ec",
      rule: "#3a2f1f",
      serif: "'Source Serif 4', Georgia, serif",
      sans: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    defaults: {
      heading: "typewriter",
      body: "kraft-soft",
      image: "framed-polaroid",
      quote: "sidebar-quote",
      caption: "italic-smallcaps",
      divider: "whitespace-gap",
    },
    swatch: "linear-gradient(135deg,#e7ddc8 0%,#7a4f1d 100%)",
  },
  noir: {
    id: "noir",
    name: "Noir",
    tagline: "Midnight broadsheet",
    description:
      "Inverse treatment — deep black paper, bone-white ink, single hot accent. Cinematic and unapologetic.",
    tokens: {
      bg: "#0b0b0d",
      surface: "#161618",
      ink: "#f5f3ee",
      inkMuted: "#8d8a82",
      accent: "#d9a441",
      accentInk: "#0b0b0d",
      rule: "#2a2a2e",
      serif: "'Playfair Display', 'Source Serif 4', Georgia, serif",
      sans: "'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    defaults: {
      heading: "editorial-serif",
      body: "noir-justified",
      image: "duotone",
      quote: "pull-quote-large",
      caption: "modern-meta",
      divider: "ornamental",
    },
    swatch: "linear-gradient(135deg,#0b0b0d 0%,#d9a441 100%)",
  },
};

export const EDITION_LIST = Object.values(EDITIONS);

export function getEdition(id: EditionId): Edition {
  return EDITIONS[id] ?? EDITIONS["classic-life"];
}
