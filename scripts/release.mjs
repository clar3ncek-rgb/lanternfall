// One-command release (run 2, item 5): `npm run release`.
// typecheck + build, unit tests, browser smoke suite, then the itch zip and the single-file game, with checks. Stops at the first failure.
// The pacing sim is a separate gate (`npm run sim`), run before balance changes ship.
import { execSync, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd) => { console.log(`\n> ${cmd}`); execSync(cmd, { stdio: 'inherit' }); };
run('npm run build');
run('npx vitest run');
run('node scripts/smoke.mjs 5241');

// Only these may ship: index.html and the built assets. Screenshot helpers and demo pages never do.
const files = ['index.html', ...readdirSync('dist/assets').map((f) => `assets/${f}`)];
const extras = readdirSync('dist').filter((f) => f !== 'index.html' && f !== 'assets');
if (extras.length) console.log(`(left out of the release: ${extras.join(', ')})`);
for (const f of files) if (/phone\.html|tall\.html|ph\.html|demo/i.test(f)) throw new Error(`refusing to ship ${f}`);

// Single-file game: inline the script and the stylesheet into one HTML.
let html = readFileSync('dist/index.html', 'utf8');
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, p) => `<script type="module">${readFileSync(join('dist', p), 'utf8').replace(/<\/script/g, '<\\/script')}</script>`);
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/, (_, p) => `<style>${readFileSync(join('dist', p), 'utf8')}</style>`);
if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('single-file build still points at an asset file');
mkdirSync('itch', { recursive: true });
writeFileSync('itch/play-the-unwritten-lanternfall.html', html);

// Zip with forward-slash paths (itch needs them), using Python's zipfile. File names go in as arguments, so no shell quoting.
const ZIP = 'itch/the-unwritten-lanternfall.zip';
const PY_ZIP = ['import sys, zipfile', "z = zipfile.ZipFile(sys.argv[1], 'w', zipfile.ZIP_DEFLATED)", "for f in sys.argv[2:]: z.write('dist/' + f, f)", 'z.close()'].join('\n');
execFileSync('python', ['-I', '-c', PY_ZIP, ZIP, ...files], { stdio: 'inherit' });
const PY_LIST = ['import sys, zipfile', 'for n in zipfile.ZipFile(sys.argv[1]).namelist(): print(n)'].join('\n');
const names = execFileSync('python', ['-I', '-c', PY_LIST, ZIP]).toString().trim().split(/\r?\n/);
if (names.some((n) => n.includes('\\'))) throw new Error('zip has backslash paths');
if (!names.includes('index.html')) throw new Error('zip has no index.html at the top');
const kb = (p) => Math.round(statSync(p).size / 1024);
console.log(`\nRELEASE OK\n  ${ZIP}  ${kb(ZIP)} KB  (${names.join(', ')})\n  itch/play-the-unwritten-lanternfall.html  ${kb('itch/play-the-unwritten-lanternfall.html')} KB`);
