import {
  DURATION_UNITS,
  type JudgmentResult,
  type MelodyResponse,
  type NormalizedBeat,
  type PlacedNote,
} from "@/types/melody";
import { getDiatonicPitchClasses } from "@/lib/musicUtils";

export function normalizeRhythm(notes: PlacedNote[]): NormalizedBeat[] {
  const sorted = [...notes].sort((a, b) => a.startUnit - b.startUnit);
  const result: NormalizedBeat[] = [];

  let i = 0;
  while (i < sorted.length) {
    let totalUnits = DURATION_UNITS[sorted[i].duration];
    const startUnit = sorted[i].startUnit;

    while (sorted[i].hasTieToNext && i + 1 < sorted.length) {
      i++;
      totalUnits += DURATION_UNITS[sorted[i].duration];
    }

    result.push({ units: totalUnits, startUnit });
    i++;
  }

  return result;
}

export function melodyToCorrectNotes(melody: MelodyResponse): PlacedNote[] {
  const diatonic = getDiatonicPitchClasses(melody.key, melody.mode);
  return melody.notes.map((n) => ({
    duration: n.duration,
    startUnit: n.startTime,
    hasTieToNext: false,
    isChromatic: !diatonic.has(n.pitch % 12),
  }));
}

export function judgeRhythm(
  placed: PlacedNote[],
  melody: MelodyResponse
): JudgmentResult {
  const correctNotes = melodyToCorrectNotes(melody);
  const userBeats = normalizeRhythm(placed);
  const correctBeats = normalizeRhythm(correctNotes);

  const isCorrect =
    userBeats.length === correctBeats.length &&
    userBeats.every(
      (b, i) =>
        b.units === correctBeats[i].units &&
        b.startUnit === correctBeats[i].startUnit
    );

  const correctChromaticNote = correctNotes.find((n) => n.isChromatic);
  const correctChromaticUnit = correctChromaticNote?.startUnit ?? null;

  if (correctChromaticUnit === null) {
    return { isCorrect, userBeats, correctBeats, chromaticCorrect: null, userChromaticUnit: null, correctChromaticUnit: null };
  }

  const userChromaticNote = placed.find((n) => n.isChromatic);
  const userChromaticUnit = userChromaticNote?.startUnit ?? null;
  const chromaticCorrect = userChromaticUnit === correctChromaticUnit;

  return { isCorrect, userBeats, correctBeats, chromaticCorrect, userChromaticUnit, correctChromaticUnit };
}
