export const KEY_TO_PC: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const SCALE_INTERVALS: Record<"major" | "minor", number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export function getDiatonicPitchClasses(
  key: string,
  mode: "major" | "minor"
): Set<number> {
  const rootPc = KEY_TO_PC[key];
  return new Set(SCALE_INTERVALS[mode].map((i) => (rootPc + i) % 12));
}

export function getDiatonicMidi(key: string, mode: "major" | "minor"): number[] {
  const pcs = getDiatonicPitchClasses(key, mode);
  const result: number[] = [];
  for (let midi = 55; midi <= 79; midi++) {
    if (pcs.has(midi % 12)) result.push(midi);
  }
  return result;
}
