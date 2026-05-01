"use client";

import { useState } from "react";
import ControlPanel from "@/components/ControlPanel";
import NotePalette from "@/components/NotePalette";
import Staff from "@/components/Staff";
import { judgeRhythm, melodyToCorrectNotes } from "@/lib/judgment";
import { playMelody, stopPlayback } from "@/lib/tonePlayer";
import type {
  GenerateMelodyRequest,
  JudgmentResult,
  MelodyResponse,
  PlacedNote,
} from "@/types/melody";
import { UNITS_PER_MEASURE } from "@/types/melody";

type Phase = "configure" | "loading" | "ready" | "result";

const DEFAULT_REQUEST: GenerateMelodyRequest = {
  key: "C",
  mode: "major",
  timeSignature: "4/4",
  measures: 2,
  includeChromaticNote: false,
  bpm: 100,
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("configure");
  const [melody, setMelody] = useState<MelodyResponse | null>(null);
  const [request, setRequest] = useState<GenerateMelodyRequest>(DEFAULT_REQUEST);
  const [placedNotes, setPlacedNotes] = useState<PlacedNote[]>([]);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [judgment, setJudgment] = useState<JudgmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLoading = phase === "loading";

  const generateLabel = isLoading
    ? "生成中..."
    : melody
    ? "新しく生成"
    : "メロディー生成";

  const playLabel = isPlaying ? "再生中..." : hasPlayed ? "もう一度再生" : "再生";

  const totalUnits =
    UNITS_PER_MEASURE[request.timeSignature] * request.measures;
  const unitsPerMeasure = UNITS_PER_MEASURE[request.timeSignature];

  const melodyTotalUnits = melody
    ? UNITS_PER_MEASURE[melody.timeSignature] * melody.measures
    : totalUnits;
  const melodyUnitsPerMeasure = melody
    ? UNITS_PER_MEASURE[melody.timeSignature]
    : unitsPerMeasure;

  async function handleGenerate() {
    setPhase("loading");
    setError(null);
    setMelody(null);
    setPlacedNotes([]);
    setHasPlayed(false);
    setJudgment(null);
    stopPlayback();

    try {
      const res = await fetch("/api/generate-melody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setMelody(data as MelodyResponse);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("configure");
    }
  }

  async function handlePlay() {
    if (!melody || isPlaying) return;
    setIsPlaying(true);
    setHasPlayed(true);
    try {
      await playMelody(melody, () => setIsPlaying(false));
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
    }
  }

  function handleCheck() {
    if (!melody) return;
    const result = judgeRhythm(placedNotes, melody);
    setJudgment(result);
    setPhase("result");
  }

  function handleReset() {
    stopPlayback();
    setMelody(null);
    setPlacedNotes([]);
    setHasPlayed(false);
    setIsPlaying(false);
    setJudgment(null);
    setPhase("configure");
  }

  const correctPlacedNotes: PlacedNote[] = melody
    ? melodyToCorrectNotes(melody)
    : [];

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          リズムクイズ
        </h1>

        <ControlPanel
          value={request}
          onChange={setRequest}
          disabled={isLoading || phase === "result"}
        />

        {error && (
          <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded border border-red-200">
            エラー: {error}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={phase === "result" ? handleReset : handleGenerate}
            disabled={isLoading}
            className="px-5 py-2 rounded-lg font-medium text-sm bg-slate-800 text-white
              hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generateLabel}
          </button>

          {melody && (
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="px-5 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white
                hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {playLabel}
            </button>
          )}

          {phase === "ready" && placedNotes.length > 0 && (
            <button
              onClick={handleCheck}
              className="px-5 py-2 rounded-lg font-medium text-sm bg-emerald-600 text-white
                hover:bg-emerald-500 transition-colors ml-auto"
            >
              答え合わせ
            </button>
          )}
        </div>

        {melody && (
          <div className="flex flex-col gap-4">
            {phase !== "result" && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wide">
                  あなたの回答
                </p>
                <NotePalette disabled={phase !== "ready"} includeChromaticNote={request.includeChromaticNote} />
                <div className="mt-6">
                  <Staff
                    totalUnits={melodyTotalUnits}
                    measures={melody.measures}
                    unitsPerMeasure={melodyUnitsPerMeasure}
                    placedNotes={placedNotes}
                    onNotesChange={setPlacedNotes}
                  />
                </div>
              </div>
            )}

            {phase === "result" && judgment && (
              <>
                <div
                  className={`rounded-xl px-6 py-4 text-center font-bold text-xl
                    ${judgment.isCorrect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {judgment.isCorrect ? "正解！🎉" : "惜しい！もう一度聴いてみよう"}
                </div>

                {judgment.chromaticCorrect !== null && (
                  <div
                    className={`rounded-xl px-6 py-3 text-center font-medium text-base
                      ${judgment.chromaticCorrect
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                  >
                    派生音: {judgment.chromaticCorrect ? "正解！" : "位置が違います"}
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <p className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wide">
                    あなたの回答
                  </p>
                  <Staff
                    totalUnits={melodyTotalUnits}
                    measures={melody.measures}
                    unitsPerMeasure={melodyUnitsPerMeasure}
                    placedNotes={placedNotes}
                    onNotesChange={() => {}}
                    readOnly
                    noteColor={judgment.isCorrect ? "#16a34a" : "#dc2626"}
                  />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <p className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wide">
                    正解のリズム
                  </p>
                  <Staff
                    totalUnits={melodyTotalUnits}
                    measures={melody.measures}
                    unitsPerMeasure={melodyUnitsPerMeasure}
                    placedNotes={correctPlacedNotes}
                    onNotesChange={() => {}}
                    readOnly
                    noteColor="#1e3a5f"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 rounded-xl font-medium bg-slate-800 text-white
                      hover:bg-slate-700 transition-colors"
                  >
                    新しく生成
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!melody && !isLoading && (
          <div className="text-center text-slate-400 text-sm py-12">
            <p>「メロディー生成」を押して問題を作成してください</p>
          </div>
        )}
      </div>
    </main>
  );
}
