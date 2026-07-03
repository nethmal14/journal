// Core domain types for the Issue journal app.

export type BlockType =
  | "heading"
  | "body"
  | "image"
  | "quote"
  | "caption"
  | "divider";

export interface BlockBase {
  id: string;
  type: BlockType;
  // Named preset id (resolved by the renderer based on Edition default + per-block override)
  preset?: string;
}

export interface HeadingBlock extends BlockBase {
  type: "heading";
  text: string;
}
export interface BodyBlock extends BlockBase {
  type: "body";
  text: string;
}
export interface ImageBlock extends BlockBase {
  type: "image";
  // Object URL or data URL stored locally. We store the data URL in IndexedDB so it survives reloads.
  src: string;
  alt?: string;
}
export interface QuoteBlock extends BlockBase {
  type: "quote";
  text: string;
  attribution?: string;
}
export interface CaptionBlock extends BlockBase {
  type: "caption";
  text: string;
}
export interface DividerBlock extends BlockBase {
  type: "divider";
}

export type Block =
  | HeadingBlock
  | BodyBlock
  | ImageBlock
  | QuoteBlock
  | CaptionBlock
  | DividerBlock;

export interface DayEntry {
  // ISO date yyyy-mm-dd — primary key
  date: string;
  blocks: Block[];
  // Optional cover image src derived from first image block (cached for calendar)
  cover?: string;
  updatedAt: number;
  createdAt: number;
}

export type EditionId = "classic-life" | "modern-minimal" | "warm-kraft" | "noir";

export interface Edition {
  id: EditionId;
  name: string;
  tagline: string;
  description: string;
  // Tailwind-ish token overrides resolved at runtime by EditionStyles
  tokens: {
    bg: string;
    surface: string;
    ink: string;
    inkMuted: string;
    accent: string;
    accentInk: string;
    rule: string;
    serif: string; // font-family for serif
    sans: string; // font-family for sans
    mono: string;
  };
  // Default preset per block type
  defaults: Record<BlockType, string>;
  // Cover swatch used in onboarding card
  swatch: string;
}

export interface AppSettings {
  id: "settings";
  editionId: EditionId;
  onboardingComplete: boolean;
  // "dot" | "thumb" — how calendar markers render
  calendarMarker: "dot" | "thumb";
}
