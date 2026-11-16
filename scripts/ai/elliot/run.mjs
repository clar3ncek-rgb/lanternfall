// Run one Elliot (Codex) play-test. The game server must be up on 5196 (vite preview). No API credits used.
// node scripts/ai/elliot/run.mjs --id <id> --port 5299 --save <save.json> --persona "<text>" --steps 120
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ID = arg('id', 'elliot-1');
const PORT = arg('port', '5299');
const SAVE = arg('save', '');
const STEPS = arg('steps', '120');
const PERSONA = arg('persona', 'A curious first-time player who found this game on itch.io and plays it on a phone.');
// run 8 (Clarence, 14 Nov): "testers from Elliot on Luna; we run on Haiku as well". codex = Elliot (ChatGPT plan);
// haiku = the Claude CLI on Clarence's Claude plan login (ANTHROPIC_API_KEY is removed from its environment, so no API credits)
const ENGINE = arg('engine', 'codex');
const OUT = `samples/playtest/elliot/${ID}`;
mkdirSync(OUT, { recursive: true });
const drv = spawn('node', ['scripts/ai/elliot/server.mjs', '--port', PORT, '--out', OUT, ...(SAVE ? ['--save', SAVE] : [])], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://localhost:${PORT}/?cmd=look`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 500));
}
const prompt = [
  `You are play-testing a phone idle game for its developer. ${PERSONA}`,
  'You cannot see pictures. You control the game with this shell command, run from the current folder:',
  '  node scripts/ai/elliot/cli.mjs <command>   (ELLIOT_PORT is already set in your environment; do not add anything before node)',
  'Commands: look | tap <n> | taps <n> <count up to 40> | hold <n> | wait <seconds up to 30> | scroll <dy> | note <bug|confused|boring|fun|ugly> <one sentence>',
  'Each command prints what is on screen afterwards: the top bar, the foe, your class meter, any popup, and a numbered list of things you can tap.',
  `Play about ${STEPS} commands like a real player: fight, open tabs, try things, make progress. Whenever something is confusing, broken, boring or fun, record it with the note command at once.`,
  'Rules: use only that command to play; do not read or edit the game source; the only file you write is the report.',
  `When done, write your report to ${OUT}/report.md in this shape:`,
  `# Elliot play-test (${ID})`,
  '## Verdict',
  '- **Would I come back tomorrow?** yes / maybe / no, and why in one sentence.',
  '- 2 to 4 more lines answering what you were asked to look at.',
  '## Findings, worst first',
  '1. ... (with the step numbers from your notes)',
  '## Raw notes',
  `(copy ${OUT}/notes.md here)`,
].join('\n');
writeFileSync(`${OUT}/prompt.txt`, prompt);
const env = { ...process.env, ELLIOT_PORT: PORT };
let cx;
if (ENGINE === 'haiku') {
  delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN; // plan login only
  cx = spawn('claude', ['-p', '--model', 'haiku', '--allowedTools', '"Bash(node scripts/ai/elliot/cli.mjs:*)"', 'Write'], { stdio: ['pipe', 'pipe', 'pipe'], shell: true, env });
} else {
  cx = spawn('codex', ['exec', '-m', process.env.ELLIOT_MODEL ?? 'gpt-5.6-luna', '--skip-git-repo-check', '-s', 'workspace-write', '-c', 'sandbox_workspace_write.network_access=true', '-'], { stdio: ['pipe', 'pipe', 'pipe'], shell: true, env });
}
cx.stdin.end(prompt);
let log = '';
cx.stdout.on('data', (d) => (log += d));
cx.stderr.on('data', (d) => (log += d));
const code = await new Promise((r) => cx.on('exit', r));
writeFileSync(`${OUT}/codex.log`, log);
try { await fetch(`http://localhost:${PORT}/?cmd=quit`); } catch { /* closed */ }
drv.kill();
console.log(`elliot ${ID} done, ${ENGINE} exit ${code}`);
