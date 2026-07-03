"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { EDITION_LIST } from "@/lib/editions";
import type { EditionId } from "@/lib/issue-types";
import { PrivacyBadge } from "./PrivacyBadge";

interface OnboardingProps {
  onComplete: (editionId: EditionId) => void;
}

// Three-step onboarding: welcome → pick edition → confirm.
export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [picked, setPicked] = useState<EditionId>("classic-life");

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{
        background: "var(--issue-bg)",
        color: "var(--issue-ink)",
      }}
    >
      <div className="flex-1 flex flex-col px-6 pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-12">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col items-start justify-center max-w-md mx-auto w-full">
                <div className="issue-meta-caps opacity-60 mb-6">
                  Issue · v1.0
                </div>
                <h1
                  className="text-5xl sm:text-6xl leading-[0.95] mb-6"
                  style={{
                    fontFamily: "var(--issue-serif)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Every day is a{" "}
                  <span style={{ color: "var(--issue-accent)" }}>page</span>.
                </h1>
                <p
                  className="text-lg leading-relaxed opacity-80 mb-8"
                  style={{ fontFamily: "var(--issue-serif)" }}
                >
                  A magazine-style journal that lives entirely on your device. No
                  accounts. No cloud. Just you and the page.
                </p>
                <div className="mb-10">
                  <PrivacyBadge />
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="group flex items-center gap-3 px-6 py-3 rounded-full text-sm font-medium tracking-wide"
                  style={{
                    background: "var(--issue-ink)",
                    color: "var(--issue-bg)",
                  }}
                >
                  Choose your edition
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="edition"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="flex-1 flex flex-col"
            >
              <div className="max-w-md mx-auto w-full">
                <div className="issue-meta-caps opacity-60 mb-3">Step 1 of 2</div>
                <h2
                  className="text-3xl mb-2"
                  style={{ fontFamily: "var(--issue-serif)", fontWeight: 700 }}
                >
                  Pick your edition
                </h2>
                <p className="text-sm opacity-70 mb-6">
                  Your edition sets the default look for every page. You can
                  always override individual styles later.
                </p>

                <div className="grid gap-3">
                  {EDITION_LIST.map((ed) => {
                    const isPicked = picked === ed.id;
                    return (
                      <button
                        key={ed.id}
                        onClick={() => setPicked(ed.id)}
                        className="relative text-left rounded-2xl p-4 flex items-center gap-4 transition-all"
                        style={{
                          background: isPicked
                            ? "color-mix(in srgb, var(--issue-accent) 10%, var(--issue-surface))"
                            : "var(--issue-surface)",
                          border: `1.5px solid ${
                            isPicked ? "var(--issue-accent)" : "color-mix(in srgb, var(--issue-ink) 12%, transparent)"
                          }`,
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-xl flex-shrink-0"
                          style={{ background: ed.swatch }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-base font-semibold"
                            style={{ fontFamily: "var(--issue-serif)" }}
                          >
                            {ed.name}
                          </div>
                          <div className="issue-meta-caps opacity-60 mt-0.5">
                            {ed.tagline}
                          </div>
                          <div className="text-xs opacity-70 mt-1.5 leading-snug">
                            {ed.description}
                          </div>
                        </div>
                        {isPicked && (
                          <Check
                            className="w-5 h-5 flex-shrink-0"
                            style={{ color: "var(--issue-accent)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-md mx-auto w-full mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep(0)}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                  style={{
                    background: "var(--issue-ink)",
                    color: "var(--issue-bg)",
                  }}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="flex-1 flex flex-col"
            >
              <EditionPreview editionId={picked} />
              <div className="max-w-md mx-auto w-full mt-8 flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                >
                  Back
                </button>
                <button
                  onClick={() => onComplete(picked)}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium"
                  style={{
                    background: "var(--issue-accent)",
                    color: "var(--issue-accent-ink)",
                  }}
                >
                  Begin writing
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EditionPreview({ editionId }: { editionId: EditionId }) {
  // Render a small mock "page" in the chosen edition so the user sees their
  // default look before committing.
  const edition = EDITION_LIST.find((e) => e.id === editionId)!;
  return (
    <div className="max-w-md mx-auto w-full">
      <div className="issue-meta-caps opacity-60 mb-3">Preview</div>
      <div
        className="issue-page rounded-lg p-6 relative overflow-hidden"
        style={{ background: "var(--issue-surface)" }}
      >
        <div className="issue-masthead-rule py-2 mb-5 flex items-center justify-between">
          <span className="issue-masthead-title text-sm font-bold tracking-wider">
            ISSUE
          </span>
          <span className="issue-meta-caps opacity-60">VOL. I</span>
        </div>
        <h3
          className={`preset-heading-${edition.defaults.heading} mb-4`}
          style={{ fontSize: "1.75rem" }}
        >
          A Quiet Morning
        </h3>
        <div className="space-y-3">
          <p className={`preset-body-${edition.defaults.body}`}>
            The light came in slanted through the blinds and the coffee was
            still warm. I wrote three pages before the city woke up.
          </p>
          <div className={`preset-divider-${edition.defaults.divider}`} />
          <p className={`preset-quote-${edition.defaults.quote}`} style={{ fontSize: "1.05rem" }}>
            “The page is patient. It waits for you to mean it.”
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between issue-meta-caps opacity-50">
          <span>01</span>
          <span>{edition.name}</span>
        </div>
      </div>
    </div>
  );
}
