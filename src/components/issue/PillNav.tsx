"use client";

import { motion } from "framer-motion";
import { CalendarDays, BookOpen } from "lucide-react";

export type NavTab = "calendar" | "journal";

interface PillNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
  // "full" | "shrunk" | "hidden"
  state: "full" | "shrunk" | "hidden";
}

// Floating translucent pill nav with two destinations.
// In "shrunk" mode it shrinks + dims (during editing).
// In "hidden" mode it slides out (during full-screen scrub mode).
export function PillNav({ active, onChange, state }: PillNavProps) {
  const scale = state === "shrunk" ? 0.92 : 1;
  const opacity = state === "shrunk" ? 0.7 : state === "hidden" ? 0 : 1;
  const y = state === "hidden" ? 80 : 0;

  return (
    <motion.div
      className="fixed left-1/2 -translate-x-1/2 z-40 safe-bottom"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      animate={{ scale, opacity, y }}
      transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.7 }}
      aria-hidden={state === "hidden"}
    >
      <div className="issue-pill flex items-center gap-1 rounded-full p-1.5">
        <NavButton
          icon={<CalendarDays className="w-4 h-4" />}
          label="Calendar"
          active={active === "calendar"}
          onClick={() => onChange("calendar")}
        />
        <NavButton
          icon={<BookOpen className="w-4 h-4" />}
          label="Journal"
          active={active === "journal"}
          onClick={() => onChange("journal")}
        />
      </div>
    </motion.div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium tracking-wide"
      style={{
        color: active ? "var(--issue-accent-ink)" : "var(--issue-ink)",
        background: active ? "var(--issue-accent)" : "transparent",
      }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
}
