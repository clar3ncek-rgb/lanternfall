// Re-run chosen Elliot play-tests with the persona and brief they had before (run 8: three Luna Warriors froze when the PC was overloaded).
// node scripts/ai/elliot/rerun.mjs --engine codex --port 5470 elliot-warrior-human-codex elliot-warrior-elf-codex ...
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const ENGINE = opt('engine', 'codex');
const BASE = Number(opt('port', 5470));
const runs = argv.map((id, i) => new Promise((done) => {
  const old = readFileSync(`samples/playtest/elliot/${id}/prompt.txt`, 'utf8').split('\n')[0];
  const persona = old.replace(/^You are play-testing a phone idle game for its developer\. /, '');
  const c = spawn('node', ['scripts/ai/elliot/run.mjs', '--engine', ENGINE, '--id', id, '--port', String(BASE + i), '--steps', '120', '--persona', persona], { stdio: 'inherit' });
  c.on('exit', done);
}));
await Promise.all(runs);
console.log('RERUN DONE');
