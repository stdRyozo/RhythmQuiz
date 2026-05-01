"use client";

import type { GenerateMelodyRequest, TimeSignature } from "@/types/melody";

interface Props {
  value: GenerateMelodyRequest;
  onChange: (req: GenerateMelodyRequest) => void;
  disabled: boolean;
}

const KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const BPMS = [80, 90, 100, 110, 120];

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Btn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
        ${active
          ? "bg-slate-800 text-white"
          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
        }
        disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export default function ControlPanel({ value, onChange, disabled }: Props) {
  function set<K extends keyof GenerateMelodyRequest>(key: K, val: GenerateMelodyRequest[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
      <Group label="調">
        {KEYS.map((k) => (
          <Btn key={k} active={value.key === k} disabled={disabled} onClick={() => set("key", k)}>
            {k}
          </Btn>
        ))}
        <Btn active={value.mode === "major"} disabled={disabled} onClick={() => set("mode", "major")}>長調</Btn>
        <Btn active={value.mode === "minor"} disabled={disabled} onClick={() => set("mode", "minor")}>短調</Btn>
      </Group>

      <Group label="拍子">
        {(["4/4", "3/4"] as TimeSignature[]).map((ts) => (
          <Btn key={ts} active={value.timeSignature === ts} disabled={disabled} onClick={() => set("timeSignature", ts)}>
            {ts}
          </Btn>
        ))}
      </Group>

      <Group label="小節数">
        {([2, 3, 4] as const).map((m) => (
          <Btn key={m} active={value.measures === m} disabled={disabled} onClick={() => set("measures", m)}>
            {m}
          </Btn>
        ))}
      </Group>

      <Group label="BPM">
        {BPMS.map((b) => (
          <Btn key={b} active={value.bpm === b} disabled={disabled} onClick={() => set("bpm", b)}>
            {b}
          </Btn>
        ))}
      </Group>

      <label className={`flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
        <input
          type="checkbox"
          checked={value.includeChromaticNote}
          disabled={disabled}
          onChange={(e) => set("includeChromaticNote", e.target.checked)}
          className="w-4 h-4 accent-slate-800"
        />
        派生音を含む
      </label>
    </div>
  );
}
