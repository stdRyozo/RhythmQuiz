import { NextRequest, NextResponse } from "next/server";
import { generateMelody } from "@/lib/gemini";
import type { GenerateMelodyRequest, MelodyResponse, Note } from "@/types/melody";
import { getDiatonicPitchClasses } from "@/lib/musicUtils";

const VALID_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
const VALID_TIME_SIGNATURES = ["4/4", "3/4"];
const VALID_MEASURES = [2, 3, 4];
const VALID_BPM = [80, 90, 100, 110, 120];

function validateRequest(body: unknown): body is GenerateMelodyRequest {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    VALID_KEYS.includes(b.key as string) &&
    (b.mode === "major" || b.mode === "minor") &&
    VALID_TIME_SIGNATURES.includes(b.timeSignature as string) &&
    VALID_MEASURES.includes(b.measures as number) &&
    typeof b.includeChromaticNote === "boolean" &&
    VALID_BPM.includes(b.bpm as number)
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!validateRequest(body)) {
    return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
  }

  try {
    let notes: Note[] = await generateMelody(body);

    if (body.includeChromaticNote) {
      const diatonic = getDiatonicPitchClasses(body.key, body.mode);
      for (let attempt = 0; attempt < 2; attempt++) {
        const hasChromatic = notes.some((n) => !diatonic.has(n.pitch % 12));
        if (hasChromatic) break;
        console.warn(`[generate-melody] no chromatic note found, retrying (attempt ${attempt + 1})`);
        notes = await generateMelody(body);
      }
    }

    const response: MelodyResponse = {
      notes,
      key: body.key,
      mode: body.mode,
      timeSignature: body.timeSignature,
      measures: body.measures,
      bpm: body.bpm,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[generate-melody]", err);
    return NextResponse.json({ error: "Failed to generate melody" }, { status: 500 });
  }
}
