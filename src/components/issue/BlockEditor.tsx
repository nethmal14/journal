"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Heading1,
  Pilcrow,
  Image as ImageIcon,
  Quote,
  Type,
  Minus,
  Trash2,
  GripVertical,
  Palette,
} from "lucide-react";
import type { Block, BlockType, EditionId } from "@/lib/issue-types";
import { getEdition } from "@/lib/editions";
import { PRESETS } from "@/lib/presets";
import { effectivePreset } from "./BlockRenderer";
import { newBlockId } from "@/lib/issue-db";

const BLOCK_ICONS: Record<BlockType, React.ReactNode> = {
  heading: <Heading1 className="w-4 h-4" />,
  body: <Pilcrow className="w-4 h-4" />,
  image: <ImageIcon className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  caption: <Type className="w-4 h-4" />,
  divider: <Minus className="w-4 h-4" />,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  body: "Body",
  image: "Image",
  quote: "Quote",
  caption: "Caption",
  divider: "Divider",
};

const ORDER: BlockType[] = ["heading", "body", "image", "quote", "caption", "divider"];

interface BlockEditorProps {
  blocks: Block[];
  editionId: EditionId;
  onChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, editionId, onChange }: BlockEditorProps) {
  const [stylePickerFor, setStylePickerFor] = useState<string | null>(null);

  const addBlock = (type: BlockType, afterId?: string) => {
    const id = newBlockId();
    const edition = getEdition(editionId);
    let block: Block;
    switch (type) {
      case "heading":
        block = { id, type, text: "", preset: edition.defaults.heading };
        break;
      case "body":
        block = { id, type, text: "", preset: edition.defaults.body };
        break;
      case "image":
        block = { id, type, src: "", alt: "", preset: edition.defaults.image };
        break;
      case "quote":
        block = { id, type, text: "", attribution: "", preset: edition.defaults.quote };
        break;
      case "caption":
        block = { id, type, text: "", preset: edition.defaults.caption };
        break;
      case "divider":
        block = { id, type, preset: edition.defaults.divider };
        break;
    }
    const next = [...blocks];
    if (afterId) {
      const idx = next.findIndex((b) => b.id === afterId);
      next.splice(idx + 1, 0, block);
    } else {
      next.push(block);
    }
    onChange(next);
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const setBlockPreset = (id: string, preset: string) => {
    onChange(blocks.map((b) => (b.id === id ? ({ ...b, preset } as Block) : b)));
    setStylePickerFor(null);
  };

  return (
    <div className="space-y-3">
      <Reorder.Group
        axis="y"
        values={blocks}
        onReorder={onChange}
        className="space-y-3"
      >
        {blocks.map((b) => (
          <Reorder.Item
            key={b.id}
            value={b}
            className="relative group"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            whileDrag={{ scale: 1.02, zIndex: 50 }}
          >
            <div
              className="rounded-lg border border-transparent hover:border-current/10 transition-colors"
              style={{ background: "transparent" }}
            >
              <BlockEditSurface
                block={b}
                editionId={editionId}
                onUpdate={(patch) => updateBlock(b.id, patch)}
                onDelete={() => deleteBlock(b.id)}
                onOpenStyle={() =>
                  setStylePickerFor(stylePickerFor === b.id ? null : b.id)
                }
                onAddBelow={(type) => addBlock(type, b.id)}
                styleOpen={stylePickerFor === b.id}
                onSetPreset={(p) => setBlockPreset(b.id, p)}
              />
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {blocks.length === 0 && (
        <EmptyState onAdd={(type) => addBlock(type)} />
      )}

      <AddBlockBar onAdd={(type) => addBlock(type)} />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div className="py-16 text-center opacity-60">
      <div
        className="text-2xl mb-2"
        style={{ fontFamily: "var(--issue-serif)" }}
      >
        A blank page.
      </div>
      <p className="text-sm mb-6">Tap a block below to begin.</p>
      <div className="flex justify-center">
        <AddBlockBar onAdd={onAdd} compact />
      </div>
    </div>
  );
}

function AddBlockBar({
  onAdd,
  compact = false,
}: {
  onAdd: (t: BlockType) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`issue-pill flex items-center gap-1 ${compact ? "" : "rounded-full p-1.5"}`}
      style={compact ? { display: "inline-flex", padding: "6px", borderRadius: 999 } : {}}
    >
      {ORDER.map((t) => (
        <motion.button
          key={t}
          onClick={() => onAdd(t)}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium hover:bg-black/5 active:scale-95 transition"
          aria-label={`Add ${BLOCK_LABELS[t]}`}
          whileTap={{ scale: 0.92 }}
        >
          {BLOCK_ICONS[t]}
          <span className="hidden sm:inline">{BLOCK_LABELS[t]}</span>
        </motion.button>
      ))}
    </div>
  );
}

function BlockEditSurface({
  block,
  editionId,
  onUpdate,
  onDelete,
  onOpenStyle,
  onAddBelow,
  styleOpen,
  onSetPreset,
}: {
  block: Block;
  editionId: EditionId;
  onUpdate: (patch: Partial<Block>) => void;
  onDelete: () => void;
  onOpenStyle: () => void;
  onAddBelow: (t: BlockType) => void;
  styleOpen: boolean;
  onSetPreset: (p: string) => void;
}) {
  const preset = effectivePreset(block, editionId);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = async (file: File) => {
    // Read as data URL — stored locally in IndexedDB, never uploaded.
    const reader = new FileReader();
    reader.onload = () => {
      onUpdate({ src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      {/* Drag handle */}
      <div className="absolute left-0 top-2 -ml-7 opacity-0 group-hover:opacity-40 cursor-grab active:cursor-grabbing hidden sm:block">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Block body */}
      <BlockEditBody
        block={block}
        preset={preset}
        onUpdate={onUpdate}
        onPickImage={() => fileRef.current?.click()}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickImage(f);
          e.target.value = "";
        }}
      />

      {/* Contextual controls */}
      <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <ContextBtn icon={<Palette className="w-3.5 h-3.5" />} label="Style" onClick={onOpenStyle} active={styleOpen} />
        <ContextBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="Delete" onClick={onDelete} />
      </div>

      <AnimatePresence>
        {styleOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <StylePicker
              blockType={block.type}
              currentPreset={preset}
              onPick={onSetPreset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContextBtn({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] uppercase tracking-wider opacity-70 hover:opacity-100 hover:bg-black/5 transition"
      style={active ? { color: "var(--issue-accent)" } : undefined}
    >
      {icon}
      {label}
    </button>
  );
}

function BlockEditBody({
  block,
  preset,
  onUpdate,
  onPickImage,
}: {
  block: Block;
  preset: string;
  onUpdate: (patch: Partial<Block>) => void;
  onPickImage: () => void;
}) {
  switch (block.type) {
    case "heading":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Title…"
          rows={1}
          className={`preset-heading-${preset} w-full bg-transparent resize-none issue-editable`}
          style={{ minHeight: "2.5rem" }}
        />
      );
    case "body":
      return (
        <textarea
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Write here…"
          rows={4}
          className={`preset-body-${preset} w-full bg-transparent resize-none issue-editable`}
        />
      );
    case "image":
      return (
        <div>
          {block.src ? (
            <div className={`preset-image-${preset} relative`}>
              <img src={block.src} alt={block.alt || ""} className="w-full" />
              <button
                onClick={onPickImage}
                className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] uppercase tracking-wider bg-black/40 text-white hover:bg-black/60"
              >
                Replace
              </button>
            </div>
          ) : (
            <button
              onClick={onPickImage}
              className="w-full aspect-[4/3] rounded border border-dashed border-current/30 flex flex-col items-center justify-center gap-2 opacity-60 hover:opacity-100 transition"
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs uppercase tracking-wider">Choose image</span>
            </button>
          )}
          <input
            type="text"
            value={block.alt || ""}
            onChange={(e) => onUpdate({ alt: e.target.value })}
            placeholder="Alt text (optional)"
            className="mt-2 w-full bg-transparent text-[11px] opacity-50 issue-editable"
          />
        </div>
      );
    case "quote":
      return (
        <div>
          <textarea
            value={block.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            placeholder="Pull quote…"
            rows={2}
            className={`preset-quote-${preset} w-full bg-transparent resize-none issue-editable`}
          />
          <input
            type="text"
            value={block.attribution || ""}
            onChange={(e) => onUpdate({ attribution: e.target.value })}
            placeholder="Attribution (optional)"
            className="mt-2 w-full bg-transparent text-xs opacity-60 issue-editable"
          />
        </div>
      );
    case "caption":
      return (
        <input
          type="text"
          value={block.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Caption…"
          className={`preset-caption-${preset} w-full bg-transparent issue-editable`}
        />
      );
    case "divider":
      return <div className={`preset-divider-${preset}`} aria-hidden="true">
        {preset === "ornamental" && <span>❦</span>}
      </div>;
    default:
      return null;
  }
}

function StylePicker({
  blockType,
  currentPreset,
  onPick,
}: {
  blockType: BlockType;
  currentPreset: string;
  onPick: (id: string) => void;
}) {
  const presets = PRESETS[blockType];
  return (
    <div
      className="mt-2 p-3 rounded-lg"
      style={{
        background: "color-mix(in srgb, var(--issue-surface) 80%, transparent)",
        border: "1px solid color-mix(in srgb, var(--issue-ink) 10%, transparent)",
      }}
    >
      <div className="issue-meta-caps opacity-60 mb-2">Style</div>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => {
          const active = p.id === currentPreset;
          return (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="text-left p-2 rounded-md transition"
              style={{
                background: active
                  ? "color-mix(in srgb, var(--issue-accent) 12%, transparent)"
                  : "transparent",
                border: `1px solid ${
                  active ? "var(--issue-accent)" : "color-mix(in srgb, var(--issue-ink) 10%, transparent)"
                }`,
              }}
            >
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-[10px] opacity-60 mt-0.5 leading-tight">
                {p.hint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
