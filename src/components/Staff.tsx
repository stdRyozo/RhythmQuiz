"use client";

import { useState } from "react";
import { DURATION_UNITS, type NoteDuration, type PlacedNote } from "@/types/melody";

const UNIT_WIDTH = 40;
const STAFF_HEIGHT = 96;
const LINE_Y = 62;
const STEM_TOP = LINE_Y - 40;
const MEASURES_PER_ROW = 2;

interface Props {
  totalUnits: number;
  measures: number;
  unitsPerMeasure: number;
  placedNotes: PlacedNote[];
  onNotesChange: (notes: PlacedNote[]) => void;
  readOnly?: boolean;
  noteColor?: string;
}

// ─── 音符SVGシンボル ─────────────────────────────────────────────
function NoteSymbol({
  duration,
  width,
  color = "black",
}: {
  duration: NoteDuration;
  width: number;
  color?: string;
}) {
  const headCx = 13;
  const headCy = LINE_Y;
  const stemX = headCx + 5;

  return (
    <g fill={color} stroke={color}>
      {/* 符頭 */}
      <ellipse
        cx={headCx}
        cy={headCy}
        rx={7}
        ry={5}
        transform={`rotate(-20 ${headCx} ${headCy})`}
      />
      {/* 符幹 */}
      <line x1={stemX} y1={headCy - 2} x2={stemX} y2={STEM_TOP} strokeWidth={1.8} />
      {/* 符尾 (8n のみ) */}
      {duration === "8n" && (
        <path
          d={`M${stemX},${STEM_TOP} Q${stemX + 14},${STEM_TOP + 8} ${stemX + 8},${STEM_TOP + 22}`}
          strokeWidth={1.8}
          fill="none"
        />
      )}
      {/* 付点 (4n. のみ) */}
      {duration === "4n." && (
        <circle cx={headCx + 14} cy={headCy - 3} r={3} stroke="none" />
      )}
      {/* 下線（一線に符頭をかけるための短線） */}
      <line
        x1={headCx - 9}
        y1={LINE_Y}
        x2={headCx + 12}
        y2={LINE_Y}
        strokeWidth={1.5}
        stroke={color}
      />
    </g>
  );
}

// ─── タイ弧線 ─────────────────────────────────────────────────────
function TieArc({
  x1,
  x2,
  color = "black",
  dashed = false,
}: {
  x1: number;
  x2: number;
  color?: string;
  dashed?: boolean;
}) {
  const mid = (x1 + x2) / 2;
  const dy = Math.min(18, (x2 - x1) * 0.25);
  return (
    <path
      d={`M${x1},${LINE_Y + 10} Q${mid},${LINE_Y + 10 + dy} ${x2},${LINE_Y + 10}`}
      stroke={color}
      strokeWidth={dashed ? 1.4 : 1.6}
      strokeDasharray={dashed ? "5 3" : undefined}
      opacity={dashed ? 0.85 : 1}
      fill="none"
    />
  );
}

// ─── 1行分のスタッフ ──────────────────────────────────────────────
function StaffRow({
  rowUnits,
  rowOffset,
  unitsPerMeasure,
  placedNotes,
  onDrop,
  onRemove,
  onTieDrop,
  onChromaticDrop,
  readOnly,
  noteColor,
  isLastRow,
}: {
  rowUnits: number;
  rowOffset: number;
  unitsPerMeasure: number;
  placedNotes: PlacedNote[];
  onDrop: (startUnit: number, duration: NoteDuration) => void;
  onRemove: (startUnit: number) => void;
  onTieDrop: (startUnit: number) => void;
  onChromaticDrop: (startUnit: number) => void;
  readOnly: boolean;
  noteColor: string;
  isLastRow: boolean;
}) {
  const [dragOverCell, setDragOverCell] = useState<number | null>(null);
  const [tieHoverUnit, setTieHoverUnit] = useState<number | null>(null);
  const [chromaticHoverUnit, setChromaticHoverUnit] = useState<number | null>(null);

  const rowWidth = rowUnits * UNIT_WIDTH;

  const rowNotes = placedNotes
    .filter((n) => n.startUnit >= rowOffset && n.startUnit < rowOffset + rowUnits)
    .map((n) => ({ ...n, localStart: n.startUnit - rowOffset }));

  const tieHoveredIdx =
    tieHoverUnit !== null
      ? rowNotes.findIndex((n) => n.startUnit === tieHoverUnit)
      : -1;
  const tieNextNote =
    tieHoveredIdx >= 0 && tieHoveredIdx < rowNotes.length - 1
      ? rowNotes[tieHoveredIdx + 1]
      : null;

  const occupied = new Set<number>();
  rowNotes.forEach((n) => {
    const units = DURATION_UNITS[n.duration];
    for (let u = 0; u < units; u++) occupied.add(n.localStart + u);
  });

  const barlineXs: number[] = [];
  for (let m = 1; m < rowUnits / unitsPerMeasure; m++) {
    barlineXs.push(m * unitsPerMeasure * UNIT_WIDTH);
  }

  function handleDragOver(e: React.DragEvent, cell: number) {
    e.preventDefault();
    setDragOverCell(cell);
  }

  function handleDrop(e: React.DragEvent, localCell: number) {
    e.preventDefault();
    setDragOverCell(null);
    const duration = e.dataTransfer.getData("duration") as NoteDuration;
    const isTie = e.dataTransfer.getData("tie") === "true";
    if (isTie) {
      onTieDrop(rowOffset + localCell);
      return;
    }
    if (!duration) return;
    onDrop(rowOffset + localCell, duration);
  }

  return (
    <svg
      width={rowWidth}
      height={STAFF_HEIGHT}
      className="overflow-visible"
      style={{ display: "block" }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setTieHoverUnit(null);
        }
      }}
    >
      {/* ドロップゾーン（空セルのみ） */}
      {!readOnly &&
        Array.from({ length: rowUnits }, (_, i) => i).map((cell) => {
          if (occupied.has(cell)) return null;
          const x = cell * UNIT_WIDTH;
          return (
            <rect
              key={cell}
              x={x}
              y={0}
              width={UNIT_WIDTH}
              height={STAFF_HEIGHT}
              fill={dragOverCell === cell ? "rgba(59,130,246,0.10)" : "transparent"}
              onDragOver={(e) => handleDragOver(e, cell)}
              onDragLeave={() => setDragOverCell(null)}
              onDrop={(e) => handleDrop(e, cell)}
              style={{ cursor: "default" }}
            />
          );
        })}

      {/* 一線 */}
      <line
        x1={0}
        y1={LINE_Y}
        x2={rowWidth}
        y2={LINE_Y}
        stroke="black"
        strokeWidth={2}
      />

      {/* 表拍の縦線（四分音符ごと、淡いグレー） */}
      {Array.from({ length: rowUnits }, (_, i) => i)
        .filter((i) => i % 2 === 0)
        .map((i) => {
          const x = i * UNIT_WIDTH;
          return (
            <line
              key={`beat-${i}`}
              x1={x}
              y1={LINE_Y - 8}
              x2={x}
              y2={LINE_Y + 8}
              stroke="#94a3b8"
              strokeWidth={1}
            />
          );
        })}

      {/* 小節線 */}
      {barlineXs.map((x) => (
        <line
          key={x}
          x1={x}
          y1={STEM_TOP - 4}
          x2={x}
          y2={LINE_Y + 8}
          stroke="black"
          strokeWidth={1.5}
        />
      ))}

      {/* 終止線（最終行のみ二重線） */}
      {isLastRow && (
        <>
          <line
            x1={rowWidth - 4}
            y1={STEM_TOP - 4}
            x2={rowWidth - 4}
            y2={LINE_Y + 8}
            stroke="black"
            strokeWidth={1.5}
          />
          <line
            x1={rowWidth}
            y1={STEM_TOP - 4}
            x2={rowWidth}
            y2={LINE_Y + 8}
            stroke="black"
            strokeWidth={3}
          />
        </>
      )}

      {/* タイ弧線 */}
      {rowNotes.map((note, idx) => {
        if (!note.hasTieToNext) return null;
        const nextNote = rowNotes[idx + 1];
        if (!nextNote) return null;
        const x1 = note.localStart * UNIT_WIDTH + DURATION_UNITS[note.duration] * UNIT_WIDTH - 6;
        const x2 = nextNote.localStart * UNIT_WIDTH + 6;
        return (
          <TieArc key={`tie-${note.startUnit}`} x1={x1} x2={x2} color={noteColor} />
        );
      })}

      {/* タイドラッグ中: 弧線プレビュー */}
      {tieHoveredIdx >= 0 && tieNextNote && (() => {
        const hov = rowNotes[tieHoveredIdx];
        const x1 = hov.localStart * UNIT_WIDTH + DURATION_UNITS[hov.duration] * UNIT_WIDTH - 6;
        const x2 = tieNextNote.localStart * UNIT_WIDTH + 6;
        return <TieArc x1={x1} x2={x2} color="#f59e0b" dashed />;
      })()}

      {/* 配置済み音符 */}
      {rowNotes.map((note) => {
        const x = note.localStart * UNIT_WIDTH;
        const w = DURATION_UNITS[note.duration] * UNIT_WIDTH;
        const isTieHovered = note.startUnit === tieHoverUnit;
        const isTieTarget = tieNextNote !== null && note.startUnit === tieNextNote.startUnit;
        const isChromaticHovered = note.startUnit === chromaticHoverUnit;
        const baseColor = note.isChromatic ? "#dc2626" : noteColor;
        const effectiveColor =
          (isTieHovered || isTieTarget) ? "#f59e0b" :
          isChromaticHovered ? "#dc2626" :
          baseColor;
        return (
          <g
            key={note.startUnit}
            transform={`translate(${x}, 0)`}
            onClick={() => !readOnly && onRemove(note.startUnit)}
            style={{ cursor: readOnly ? "default" : "pointer" }}
          >
            {/* クリック判定を広げる透明rect */}
            {!readOnly && (
              <rect x={0} y={STEM_TOP - 6} width={w} height={STAFF_HEIGHT} fill="transparent" />
            )}
            {/* タイ・派生音ドロップ用（ホバー検知込み） */}
            {!readOnly && (
              <rect
                x={0}
                y={0}
                width={w}
                height={STAFF_HEIGHT}
                fill="transparent"
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("tie")) {
                    e.preventDefault();
                    setTieHoverUnit(note.startUnit);
                  } else if (e.dataTransfer.types.includes("chromatic")) {
                    e.preventDefault();
                    setChromaticHoverUnit(note.startUnit);
                  }
                }}
                onDragLeave={() => {
                  setTieHoverUnit(null);
                  setChromaticHoverUnit(null);
                }}
                onDrop={(e) => {
                  if (e.dataTransfer.getData("tie") === "true") {
                    e.preventDefault();
                    setTieHoverUnit(null);
                    onTieDrop(note.startUnit);
                  } else if (e.dataTransfer.getData("chromatic") === "true") {
                    e.preventDefault();
                    setChromaticHoverUnit(null);
                    onChromaticDrop(note.startUnit);
                  }
                }}
              />
            )}
            <NoteSymbol duration={note.duration} width={w} color={effectiveColor} />
            {/* 派生音ホバー時: 赤リングプレビュー */}
            {isChromaticHovered && (
              <circle
                cx={13}
                cy={LINE_Y}
                r={9}
                fill="none"
                stroke="#dc2626"
                strokeWidth={2}
                opacity={0.7}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────
export default function Staff({
  totalUnits,
  measures,
  unitsPerMeasure,
  placedNotes,
  onNotesChange,
  readOnly = false,
  noteColor = "black",
}: Props) {
  const measuresPerRow = MEASURES_PER_ROW;
  const rowCount = Math.ceil(measures / measuresPerRow);
  const rows = Array.from({ length: rowCount }, (_, r) => {
    const measuresInRow = Math.min(measuresPerRow, measures - r * measuresPerRow);
    const rowUnits = measuresInRow * unitsPerMeasure;
    const rowOffset = r * measuresPerRow * unitsPerMeasure;
    return { rowUnits, rowOffset, isLastRow: r === rowCount - 1 };
  });

  function addNote(startUnit: number, duration: NoteDuration) {
    const units = DURATION_UNITS[duration];
    const overlaps = placedNotes.some((n) => {
      const nEnd = n.startUnit + DURATION_UNITS[n.duration];
      const newEnd = startUnit + units;
      return n.startUnit < newEnd && nEnd > startUnit;
    });
    if (overlaps) return;
    const measureStart = Math.floor(startUnit / unitsPerMeasure) * unitsPerMeasure;
    if (startUnit + units > measureStart + unitsPerMeasure) return;
    if (startUnit + units > totalUnits) return;
    onNotesChange([...placedNotes, { duration, startUnit, hasTieToNext: false }]);
  }

  function removeNote(startUnit: number) {
    onNotesChange(placedNotes.filter((n) => n.startUnit !== startUnit));
  }

  function toggleTie(startUnit: number) {
    onNotesChange(
      placedNotes.map((n) =>
        n.startUnit === startUnit
          ? { ...n, hasTieToNext: !n.hasTieToNext }
          : n
      )
    );
  }

  function markChromatic(startUnit: number) {
    onNotesChange(
      placedNotes.map((n) =>
        n.startUnit === startUnit
          ? { ...n, isChromatic: !n.isChromatic }
          : n
      )
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {rows.map(({ rowUnits, rowOffset, isLastRow }, r) => (
        <div key={r}>
          <StaffRow
            rowUnits={rowUnits}
            rowOffset={rowOffset}
            unitsPerMeasure={unitsPerMeasure}
            placedNotes={placedNotes}
            onDrop={addNote}
            onRemove={removeNote}
            onTieDrop={toggleTie}
            onChromaticDrop={markChromatic}
            readOnly={readOnly}
            noteColor={noteColor}
            isLastRow={isLastRow}
          />
        </div>
      ))}
      {!readOnly && (
        <p className="text-xs text-slate-400">
          音符をドラッグして一線譜に配置 / 音符をクリックで削除
        </p>
      )}
    </div>
  );
}
