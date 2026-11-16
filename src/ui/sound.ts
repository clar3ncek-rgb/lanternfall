// Run 2, idea 27: three synthesized cues (no audio files). Off by default; the first sound plays only after a tap.
let ctx: AudioContext | null = null;
let last: Record<string, number> = {};

function ac(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** At most one of each cue per gap, so fast tapping never turns into noise. */
function gate(id: string, ms: number): boolean {
  const now = performance.now();
  if ((last[id] ?? 0) + ms > now) return false;
  last[id] = now;
  return true;
}

export const sfx = {
  tap(crit: boolean) {
    if (!gate('tap', 45)) return;
    tone(crit ? 520 : 300, 0.06, 'triangle', crit ? 0.12 : 0.06, crit ? 260 : 180);
  },
  bell() {
    if (!gate('bell', 600)) return;
    tone(196, 1.4, 'sine', 0.18);
    tone(392, 1.0, 'sine', 0.06);
    tone(587, 0.7, 'sine', 0.03);
  },
  chime() {
    if (!gate('chime', 300)) return;
    [659, 880, 1175].forEach((f, i) => tone(f, 0.35, 'sine', 0.08, undefined, i * 0.07));
  },
};
