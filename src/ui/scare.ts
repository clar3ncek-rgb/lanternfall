// Jumpscares (Clarence, 11 Nov 2026): rare (about one per 30 to 45 min of play), on by default with a Menu switch,
// scare then joke, no reward. Faces are pixel art drawn in code. No strobe: one dark fade, the face, then the joke.
import { mix } from './pixel/core';

const W = 48, H = 48;
type G = CanvasRenderingContext2D;
const R = (g: G, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const P = (g: G, x: number, y: number, c: string) => R(g, x, y, 1, 1, c);

/** A gaunt pale face filling the frame: head oval, deep sockets, a wide mouth of teeth. `tilt` shifts rows (a hanged head). */
function head(g: G, skin: string, shade: string, tilt = 0, top = 6) {
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top);
    const half = Math.round(19 * Math.sqrt(Math.max(0, 1 - ((t - 0.42) / 0.62) ** 2)) - (t > 0.75 ? (t - 0.75) * 22 : 0));
    if (half <= 0) continue;
    const cx = 24 + Math.round(tilt * (y - 24) / 24);
    R(g, cx - half, y, half * 2, 1, skin);
    R(g, cx - half, y, 2, 1, shade); R(g, cx + half - 3, y, 3, 1, shade);
  }
}
function sockets(g: G, y: number, glow: string | null, tilt = 0, size = 5) {
  for (const sx of [16, 32]) {
    const cx = sx + Math.round(tilt * (y - 24) / 24);
    for (let dy = -size; dy <= size; dy++) for (let dx = -size; dx <= size; dx++) if (dx * dx + dy * dy * 1.3 <= size * size) P(g, cx + dx, y + dy, '#050305');
    if (glow) { R(g, cx - 1, y, 2, 2, glow); P(g, cx, y - 1, mix(glow, '#ffffff', 0.5)); }
  }
}
function mouth(g: G, y: number, w: number, h: number, tilt = 0) {
  const cx = 24 + Math.round(tilt * (y - 24) / 24);
  for (let dy = 0; dy < h; dy++) { const half = Math.round(w * Math.sqrt(Math.max(0, 1 - ((dy - h / 2) / (h / 2)) ** 2))); R(g, cx - half, y + dy, half * 2, 1, '#120406'); }
  for (let x = cx - w + 2; x < cx + w - 2; x += 3) { R(g, x, y + 1, 2, 3, '#e8e0c8'); R(g, x + 1, y + h - 4, 2, 3, '#d0c8b0'); }
}

/** Hollow cheeks under the sockets, dark rims round the eyes, a crack or two: makes a cartoon face gaunt. */
function gaunt(g: G, shade: string, eyeY: number, tilt = 0, cracks = true) {
  const at = (x: number, y: number) => x + Math.round(tilt * (y - 24) / 24);
  for (const sx of [16, 32]) {
    for (let dx = -6; dx <= 6; dx++) { P(g, at(sx + dx, eyeY - 6), eyeY - 6, shade); if (Math.abs(dx) < 5) P(g, at(sx + dx, eyeY + 7), eyeY + 7, shade); }
    for (let y = eyeY + 8; y < eyeY + 14; y++) R(g, at(sx + (sx < 24 ? -4 : 2), y), y, 2, 1, mix(shade, '#000000', 0.25)); // cheek hollows
  }
  for (let y = 8; y < 34; y += 3) P(g, at(20, y), y, shade); // the nose bridge, collapsed
  R(g, at(22, eyeY + 9), eyeY + 9, 1, 3, '#050305'); R(g, at(25, eyeY + 9), eyeY + 9, 1, 3, '#050305'); // nostril slits
  if (cracks) [[34, 10], [35, 12], [35, 13], [37, 15], [36, 17], [38, 19]].forEach(([x, y]) => P(g, at(x, y), y, '#2a2024'));
}

const FACES: Record<string, (g: G) => void> = {
  // the Hollow Bishop: white mitre with gold trim, burning eyes
  bishop(g) {
    head(g, '#c8beb0', '#8a8278', 0, 12);
    for (let y = 0; y < 14; y++) { const half = 6 + Math.round(y * 0.6); R(g, 24 - half, y, half * 2, 1, '#e8e0d0'); }
    R(g, 23, 0, 2, 14, '#c8a050'); R(g, 14, 12, 20, 2, '#c8a050');
    sockets(g, 24, '#f04020');
    gaunt(g, '#8a8278', 24, 0, false);
    mouth(g, 36, 9, 8);
  },
  // an Erased One: no eyes at all, only a mouth that opens too far
  erased(g) {
    head(g, '#b8b4c0', '#7a7684');
    for (let y = 18; y < 28; y += 3) R(g, 12, y, 24, 1, mix('#b8b4c0', '#7a7684', 0.6)); // scratched-out features
    gaunt(g, '#7a7684', 22);
    mouth(g, 30, 12, 15);
  },
  // the Rope-Hanged: head lolled sideways, rope at the neck, pinprick eyes
  hanged(g) {
    head(g, '#a8a090', '#6a6258', 6, 4);
    sockets(g, 20, '#e0d8c0', 6, 4);
    gaunt(g, '#6a6258', 20, 6);
    mouth(g, 31, 7, 7, 6);
    for (let y = 38; y < 44; y++) R(g, 30 + Math.round(6 * (y - 24) / 24), y, 3, 1, '#8a3040'); // the tongue
    for (let x = 6; x < 44; x++) { const y = 42 + Math.round(Math.sin(x * 0.4)); R(g, x, y, 1, 3, x % 3 ? '#7a6444' : '#5a4a30'); }
    R(g, 34, 34, 2, 6, '#7a6444');
  },
};
export const SCARE_FACES = Object.keys(FACES);

/** Jokes for any face, then jokes that name the face, so a line never names the wrong one. */
const JOKES_ANY = [
  'Sorry. The dead get bored too.',
  'Your Named saw that. They will not mention it.',
  'The Bell rang. You flinched. Everyone saw.',
  'Your gold is safe. Your dignity, less so.',
];
const JOKES_FACE: Record<string, string[]> = {
  bishop: ['Boo. The Hollow Bishop says hi.', 'The Bishop came to collect your name. He will try again later.'],
  erased: ['Relax. It was an Erased One. It already forgot why it came.', 'An Erased One wanted to borrow your face. You said no. Probably.'],
  hanged: ['That was the Rope-Hanged. He has been practising.', 'Something climbed the rope. It just wanted to wave.'],
};

function faceCanvas(kind: string): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  (FACES[kind] ?? FACES.erased)(c.getContext('2d')!);
  return c;
}

function screech(ac: AudioContext) {
  const t = ac.currentTime;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  g.connect(ac.destination);
  for (const [f, type] of [[880, 'sawtooth'], [1245, 'square'], [622, 'sawtooth']] as const) {
    const o = ac.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.15); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.9);
    o.connect(g); o.start(t); o.stop(t + 0.95);
  }
}

export interface ScareOpts { sound: boolean; motion: boolean; buzz: (ms: number) => void; face?: string; joke?: number; onDone: () => void }

/** Plays one jumpscare over everything: a slow dark fade, the face lunges in with a screech, then a joke and a button. */
export function jumpscare(o: ScareOpts): void {
  const face = o.face ?? SCARE_FACES[Math.floor(Math.random() * SCARE_FACES.length)];
  const pool = [...(JOKES_FACE[face] ?? []), ...JOKES_ANY];
  const joke = pool[o.joke ?? Math.floor(Math.random() * pool.length)];
  const el = document.createElement('div');
  el.id = 'scare';
  el.className = o.motion ? 'scare' : 'scare calmscare';
  const cv = faceCanvas(face); cv.className = 'scareface';
  el.append(cv);
  document.body.append(el);
  let ac: AudioContext | null = null;
  try { if (o.sound) ac = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { ac = null; }
  setTimeout(() => {
    el.classList.add('boo');
    if (ac) screech(ac);
    o.buzz(400);
  }, 900);
  let closable = false;
  setTimeout(() => {
    el.classList.add('joke');
    const box = document.createElement('div'); box.className = 'scarejoke';
    box.innerHTML = `<p></p><button class="big" data-scare="close">I wasn't scared</button>`;
    box.querySelector('p')!.textContent = joke;
    el.append(box);
    closable = true;
  }, 2100);
  const done = () => { if (!closable) return; closable = false; el.remove(); void ac?.close(); o.onDone(); };
  el.addEventListener('click', done);
}
