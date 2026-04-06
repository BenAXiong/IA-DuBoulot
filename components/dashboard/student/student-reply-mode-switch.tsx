"use client";

import { useEffect, useRef, useState } from "react";
import { getStudentReplyModeCopy } from "@/lib/i18n/student-flow-copy";
import type { UiLanguageCode } from "@/lib/server/auth/types";
import type { StudentReplyMode } from "@/lib/server/conversations/types";

type StudentReplyModeSwitchProps = {
  languageCode: UiLanguageCode;
  mode: StudentReplyMode;
  disabled?: boolean;
  onModeChange: (mode: StudentReplyMode) => void;
};

function FastIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12.5 4.75 7.75 12h4l-.5 7.25L16.25 12h-4.25l.5-7.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ThinkingIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 5.25a6.75 6.75 0 0 0-4.72 11.57c.84.8 1.47 1.74 1.47 2.68h6.5c0-.94.63-1.88 1.47-2.68A6.75 6.75 0 0 0 12 5.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9.75 21h4.5M10.5 18.75h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function InteractiveIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 8.25h10A2.25 2.25 0 0 1 19.25 10.5v4A2.25 2.25 0 0 1 17 16.75h-4.5L8 19v-2.25H7A2.25 2.25 0 0 1 4.75 14.5v-4A2.25 2.25 0 0 1 7 8.25Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getModeIcon(mode: StudentReplyMode) {
  if (mode === "fast") {
    return <FastIcon />;
  }

  if (mode === "interactive") {
    return <InteractiveIcon />;
  }

  return <ThinkingIcon />;
}

const MODE_ORDER: StudentReplyMode[] = ["fast", "thinking", "interactive"];

export function StudentReplyModeSwitch({
  languageCode,
  mode,
  disabled = false,
  onModeChange,
}: StudentReplyModeSwitchProps) {
  const copy = getStudentReplyModeCopy(languageCode);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copy.switchLabel}
        className="inline-flex h-8 items-center gap-2 rounded-full px-2.5 text-sm text-[color:var(--ink-soft)] transition hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)] focus:shadow-none focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        title={copy.switchTooltip}
        type="button"
      >
        {getModeIcon(mode)}
        <span>{copy.names[mode]}</span>
        <span title={copy.chevronTooltip}>
          <ChevronIcon open={open} />
        </span>
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-30 mb-2 min-w-[12rem] rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-1.5 shadow-[var(--shadow)]">
          {MODE_ORDER.map((option) => {
            const selected = option === mode;

            return (
              <button
                aria-pressed={selected}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  selected
                    ? "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]"
                    : "text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-strong)] hover:text-[color:var(--foreground)]"
                }`}
                key={option}
                onClick={() => {
                  onModeChange(option);
                  setOpen(false);
                }}
                title={copy.descriptions[option]}
                type="button"
              >
                {getModeIcon(option)}
                <span>{copy.names[option]}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
