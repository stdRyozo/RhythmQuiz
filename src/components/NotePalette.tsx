"use client";

import type { NoteDuration } from "@/types/melody";

interface Props {
  disabled: boolean;
  includeChromaticNote?: boolean;
}

const LINE_Y = 42;
const STEM_TOP = 10;

function EighthNote() {
  return (
    <svg width="32" height="56" viewBox="0 0 32 56">
      <ellipse
        cx="9" cy={LINE_Y} rx="7" ry="5"
        transform={`rotate(-20 9 ${LINE_Y})`}
        fill="currentColor"
      />
      <line x1="16" y1={LINE_Y} x2="16" y2={STEM_TOP} stroke="currentColor" strokeWidth="1.8" />
      <path
        d={`M16,${STEM_TOP} Q28,${STEM_TOP + 8} 22,${STEM_TOP + 20}`}
        stroke="currentColor" strokeWidth="1.8" fill="none"
      />
    </svg>
  );
}

function QuarterNote() {
  return (
    <svg width="28" height="56" viewBox="0 0 28 56">
      <ellipse
        cx="9" cy={LINE_Y} rx="7" ry="5"
        transform={`rotate(-20 9 ${LINE_Y})`}
        fill="currentColor"
      />
      <line x1="16" y1={LINE_Y} x2="16" y2={STEM_TOP} stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DottedQuarterNote() {
  return (
    <svg width="34" height="56" viewBox="0 0 34 56">
      <ellipse
        cx="9" cy={LINE_Y} rx="7" ry="5"
        transform={`rotate(-20 9 ${LINE_Y})`}
        fill="currentColor"
      />
      <line x1="16" y1={LINE_Y} x2="16" y2={STEM_TOP} stroke="currentColor" strokeWidth="1.8" />
      <circle cx="23" cy={LINE_Y - 3} r="3" fill="currentColor" />
    </svg>
  );
}

function TieIcon() {
  return (
    <svg width="40" height="32" viewBox="0 0 40 32">
      <path
        d="M4,26 Q20,8 36,26"
        stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
      />
      <circle cx="4" cy="26" r="3" fill="currentColor" />
      <circle cx="36" cy="26" r="3" fill="currentColor" />
    </svg>
  );
}

const PALETTE: { duration: NoteDuration; label: string; Icon: React.FC }[] = [
  { duration: "8n", label: "八分音符", Icon: EighthNote },
  { duration: "4n", label: "四分音符", Icon: QuarterNote },
  { duration: "4n.", label: "付点四分音符", Icon: DottedQuarterNote },
];

export default function NotePalette({ disabled, includeChromaticNote }: Props) {
  function handleDragStart(
    e: React.DragEvent<HTMLDivElement>,
    duration: NoteDuration
  ) {
    e.dataTransfer.setData("duration", duration);
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleTieDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("tie", "true");
    e.dataTransfer.effectAllowed = "copy";
  }

  function handleChromaticDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData("chromatic", "true");
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-sm font-medium text-slate-500 shrink-0">音符</span>
      <div className="flex items-end gap-6">
        {PALETTE.map(({ duration, label, Icon }) => (
          <div
            key={duration}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, duration)}
            title={label}
            className={`flex flex-col items-center gap-1 select-none
              ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing hover:text-blue-600 transition-colors"
              }`}
          >
            <Icon />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}

        <div className="w-px h-12 bg-slate-200 mx-2" />

        <div
          draggable={!disabled}
          onDragStart={handleTieDragStart}
          title="タイ"
          className={`flex flex-col items-center gap-1 select-none
            ${disabled
              ? "opacity-40 cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing hover:text-blue-600 transition-colors"
            }`}
        >
          <TieIcon />
          <span className="text-xs text-slate-400">タイ</span>
        </div>

        {includeChromaticNote && (
          <div
            draggable={!disabled}
            onDragStart={handleChromaticDragStart}
            title="派生音"
            className={`flex flex-col items-center gap-1 select-none
              ${disabled
                ? "opacity-40 cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing"
              }`}
          >
            <svg width="32" height="32" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="#dc2626" />
            </svg>
            <span className="text-xs text-red-500 font-medium">派生音</span>
          </div>
        )}
      </div>
    </div>
  );
}
