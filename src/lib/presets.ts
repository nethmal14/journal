import type { BlockType } from "./issue-types";

// Each preset is a named, opinionated visual treatment for a block.
// The renderer resolves the preset id → concrete CSS class strings.
export interface PresetMeta {
  id: string;
  label: string;
  // Short hint shown in the style picker
  hint: string;
}

export const PRESETS: Record<BlockType, PresetMeta[]> = {
  heading: [
    { id: "editorial-serif", label: "Editorial Serif", hint: "Large display serif, masthead feel" },
    { id: "modern-sans", label: "Modern Sans", hint: "Geometric sans, tight tracking" },
    { id: "typewriter", label: "Typewriter", hint: "Mono, all caps, underlined" },
    { id: "minimal-caps", label: "Minimal Caps", hint: "Wide letterspaced caps" },
  ],
  body: [
    { id: "classic-justified", label: "Classic Justified", hint: "Justified serif, indented paragraphs" },
    { id: "modern-clean", label: "Modern Clean", hint: "Ragged-right sans, generous leading" },
    { id: "kraft-soft", label: "Kraft Soft", hint: "Serif on warm paper, soft measure" },
    { id: "noir-justified", label: "Noir Justified", hint: "Justified serif, high contrast ink" },
  ],
  image: [
    { id: "full-bleed", label: "Full Bleed", hint: "Edge-to-edge, magazine cover energy" },
    { id: "framed-polaroid", label: "Framed Polaroid", hint: "White border, slight drop shadow" },
    { id: "halftone-print", label: "Halftone Print", hint: "Halftone dot screen, newsprint look" },
    { id: "duotone", label: "Duotone", hint: "Two-tone overlay using accent color" },
  ],
  quote: [
    { id: "pull-quote-large", label: "Pull-Quote Large", hint: "Oversized serif, accent rule" },
    { id: "sidebar-quote", label: "Sidebar Quote", hint: "Left-aligned, vertical accent bar" },
    { id: "underline-accent", label: "Underline Accent", hint: "Sans, hand-drawn underline stroke" },
  ],
  caption: [
    { id: "italic-smallcaps", label: "Italic Small Caps", hint: "Serif italic, small caps" },
    { id: "modern-meta", label: "Modern Meta", hint: "Sans, ink-muted, tight tracking" },
  ],
  divider: [
    { id: "hairline", label: "Hairline", hint: "Single thin rule" },
    { id: "ornamental", label: "Ornamental", hint: "Centered glyph with rules" },
    { id: "whitespace-gap", label: "Whitespace Gap", hint: "No visible mark, just space" },
  ],
};

export function getPresetLabel(type: BlockType, id?: string): string {
  if (!id) return "";
  const found = PRESETS[type].find((p) => p.id === id);
  return found?.label ?? id;
}
