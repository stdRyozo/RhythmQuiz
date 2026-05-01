import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { GenerateMelodyRequest, Note, NoteDuration } from "@/types/melody";
import { UNITS_PER_MEASURE } from "@/types/melody";
import { KEY_TO_PC, getDiatonicMidi } from "@/lib/musicUtils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── プロンプト ────────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `You are a professional music composer specializing in ear training exercises.
Generate a melodic phrase following ALL rules below STRICTLY:
- Use ONLY the note durations: "8n" (eighth), "4n" (quarter), "4n." (dotted quarter)
- Fill exactly the specified number of measures with NO gaps and NO overlaps
- startTime values must be consecutive with no missing units
- Has a musical "question and answer" phrase structure (first half rises/opens, second half resolves)`;

function getChromaticMidi(key: string, mode: "major" | "minor"): number[] {
  const diatonicSet = new Set(getDiatonicMidi(key, mode).map((m) => m % 12));
  const result: number[] = [];
  for (let midi = 58; midi <= 77; midi++) {
    if (!diatonicSet.has(midi % 12)) result.push(midi);
  }
  return result;
}

function buildPrompt(req: GenerateMelodyRequest): string {
  const totalUnits = UNITS_PER_MEASURE[req.timeSignature] * req.measures;
  const diatonic = getDiatonicMidi(req.key, req.mode);
  const recommended = diatonic.filter((m) => m >= 60 && m <= 76);

  const tonicPc = KEY_TO_PC[req.key];
  const thirdPc = (tonicPc + (req.mode === "major" ? 4 : 3)) % 12;
  const tonicMidis = diatonic.filter((m) => m % 12 === tonicPc);
  const thirdMidis = diatonic.filter((m) => m % 12 === thirdPc);

  const chromaticSection = req.includeChromaticNote
    ? `\nCHROMATIC NOTE RULE (MANDATORY — you will be penalized if you ignore this):\n` +
      `You MUST include EXACTLY ONE note whose pitch is NOT in the diatonic list above.\n` +
      `That chromatic note MUST NOT appear in measure 1 (startTime must be >= ${UNITS_PER_MEASURE[req.timeSignature]}). ` +
      `It may appear in any of measures 2 through ${req.measures} — choose freely for musical interest.\n` +
      `Choose its pitch from this chromatic candidate list: ${getChromaticMidi(req.key, req.mode).join(", ")}\n` +
      `All other notes MUST use only the diatonic list.\n`
    : `\nPITCH RULE: Use ONLY pitches from the diatonic list. Do NOT use any other MIDI values.\n`;

  return (
    `Key: ${req.key} ${req.mode}\n` +
    `Time signature: ${req.timeSignature}\n` +
    `Measures: ${req.measures} (total eighth-note units: ${totalUnits}; 8n=1 unit, 4n=2 units, 4n.=3 units)\n` +
    `\n` +
    `Diatonic MIDI pitches for this key: ${diatonic.join(", ")}\n` +
    `Recommended range for melodic flow: ${recommended.join(", ")}\n` +
    chromaticSection +
    `\n` +
    `MANDATORY rule for measure 1: it MUST contain at least one note with pitch from [${tonicMidis.join(", ")}] (tonic = ${req.key}) ` +
    `AND at least one note with pitch from [${thirdMidis.join(", ")}] (3rd degree).\n` +
    `\n` +
    `Generate a JSON array of notes. Each note: { pitch (MIDI integer), duration ("8n"|"4n"|"4n."), startTime (eighth-note unit position, 0-based) }.\n` +
    `The sum of all note durations in units must equal exactly ${totalUnits}.`
  );
}

// ─── スキーマ ──────────────────────────────────────────────────────

const NOTE_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      pitch: {
        type: SchemaType.INTEGER,
        description: "MIDI note number (55-79)",
      },
      duration: {
        type: SchemaType.STRING,
        format: "enum",
        enum: ["8n", "4n", "4n."],
        description: "Tone.js duration string",
      },
      startTime: {
        type: SchemaType.INTEGER,
        description: "Zero-based eighth-note unit position",
      },
    },
    required: ["pitch", "duration", "startTime"],
  },
};

// ─── API呼び出し ───────────────────────────────────────────────────

export async function generateMelody(req: GenerateMelodyRequest): Promise<Note[]> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: NOTE_SCHEMA,
    },
  });

  const result = await model.generateContent(buildPrompt(req));
  const raw = JSON.parse(result.response.text()) as {
    pitch: number;
    duration: string;
    startTime: number;
  }[];

  return raw.map((n) => ({
    pitch: n.pitch,
    duration: n.duration as NoteDuration,
    startTime: n.startTime,
  }));
}
