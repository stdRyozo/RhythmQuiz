import type { MelodyResponse } from "@/types/melody";

// キャッシュ: 一度ロードしたサンプラーを再利用
let cachedSampler: import("tone").Sampler | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedTransport: any = null;

async function getSampler() {
  if (cachedSampler) return cachedSampler;

  const Tone = await import("tone");
  cachedSampler = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3",
      "D#5": "Ds5.mp3",
      "F#5": "Fs5.mp3",
      A5: "A5.mp3",
      C6: "C6.mp3",
      "D#6": "Ds6.mp3",
      "F#6": "Fs6.mp3",
      A6: "A6.mp3",
      C7: "C7.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();

  return cachedSampler;
}

export async function playMelody(
  melody: MelodyResponse,
  onEnd?: () => void
): Promise<void> {
  const Tone = await import("tone");
  await Tone.start();

  const transport = Tone.getTransport();
  cachedTransport = transport;
  transport.stop();
  transport.cancel();
  transport.bpm.value = melody.bpm;

  const sampler = await getSampler();
  await Tone.loaded();

  const beatDuration = 60 / melody.bpm; // 秒/四分音符

  // カウントイン: 4拍
  const click = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  }).toDestination();
  click.volume.value = -6;

  for (let i = 0; i < 4; i++) {
    const t = i * beatDuration;
    transport.schedule((time) => {
      click.triggerAttackRelease("C2", "16n", time);
    }, t);
  }

  const countInEnd = 4 * beatDuration;

  // メロディ本体
  melody.notes.forEach((note) => {
    // startTime は八分音符ユニット → 四分音符換算: / 2
    const noteBeats = note.startTime * 0.5;
    const t = countInEnd + noteBeats * beatDuration;
    transport.schedule((time) => {
      sampler.triggerAttackRelease(
        Tone.Frequency(note.pitch, "midi").toNote(),
        note.duration,
        time
      );
    }, t);
  });

  // 最終音符の終了を検知してコールバック
  if (onEnd) {
    const lastNote = [...melody.notes].sort(
      (a, b) => b.startTime - a.startTime
    )[0];
    if (lastNote) {
      const lastBeat = lastNote.startTime * 0.5;
      const durationSecs =
        lastNote.duration === "4n."
          ? beatDuration * 1.5
          : lastNote.duration === "4n"
          ? beatDuration
          : beatDuration * 0.5;
      const endTime = countInEnd + lastBeat * beatDuration + durationSecs + 0.2;
      transport.schedule(() => {
        onEnd();
      }, endTime);
    }
  }

  transport.start();
}

export function stopPlayback(): void {
  if (cachedTransport) {
    cachedTransport.stop();
    cachedTransport.cancel();
  }
}
