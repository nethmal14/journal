"use client";

import { Lock } from "lucide-react";

// Subtle privacy indicator: "On this device only".
// Visible-but-quiet — privacy is a trust feature, not a hidden technical detail.
// No client-only state needed: this component renders identical SSR + CSR output.
export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase opacity-70">
        <span className="privacy-dot inline-block w-1.5 h-1.5 rounded-full bg-current" />
        <span>On this device</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase opacity-60">
      <Lock className="w-3 h-3" />
      <span>On this device only · No cloud</span>
    </div>
  );
}
