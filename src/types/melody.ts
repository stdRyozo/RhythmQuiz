export type TimeSignature = "4/4" | "3/4";

// 使用できる音符の長さ: 八分音符 / 四分音符 / 付点四分音符
export type NoteDuration = "8n" | "4n" | "4n.";

// 八分音符ユニット数 (4/4: 8/小節, 3/4: 6/小節)
export const UNITS_PER_MEASURE: Record<TimeSignature, number> = {
  "4/4": 8,
  "3/4": 6,
};

// 各音符の八分音符ユニット数
export const DURATION_UNITS: Record<NoteDuration, number> = {
  "8n": 1,
  "4n": 2,
  "4n.": 3,
};

export interface Note {
  pitch: number;      // MIDIノート番号 (例: C4=60)
  duration: NoteDuration;
  startTime: number;  // 八分音符ユニット位置 (0始まり)
}

export interface GenerateMelodyRequest {
  key: string;                  // "C" | "D" | "E" | "F" | "G" | "A" | "B"
  mode: "major" | "minor";
  timeSignature: TimeSignature;
  measures: 2 | 3 | 4;
  includeChromaticNote: boolean;
  bpm: number;                  // 80 | 90 | 100 | 110 | 120
}

export interface MelodyResponse {
  notes: Note[];
  key: string;
  mode: "major" | "minor";
  timeSignature: TimeSignature;
  measures: number;
  bpm: number;
}

export interface PlacedNote {
  duration: NoteDuration;
  startUnit: number;
  hasTieToNext: boolean;
  isChromatic?: boolean;
}

export interface NormalizedBeat {
  units: number;
  startUnit: number;
}

export interface JudgmentResult {
  isCorrect: boolean;
  userBeats: NormalizedBeat[];
  correctBeats: NormalizedBeat[];
  chromaticCorrect: boolean | null;
  userChromaticUnit: number | null;
  correctChromaticUnit: number | null;
}
