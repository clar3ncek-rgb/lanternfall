// Tiny Anthropic API client for Clarence's API credit (hobby jobs only). The key is read from his private file and never printed.
// Every call is logged (tokens only, no content) to Heidi's ledger so the tracker shows each job's real cost.
import { readFileSync, appendFileSync } from 'node:fs';

const KEY_FILE = 'C:/AI Workspace/Claude/runner/private/anthropic-api-key.txt';
const LEDGER = 'C:/AI Workspace/Claude/heidi/api-credit/ledger.jsonl';
export const HAIKU = 'claude-haiku-5-5';
export const SONNET = 'claude-sonnet-5-5';
export const OPUS = 'claude-opus-5-5';
/** US dollars per million tokens [input, output], from Heidi's handoff (10 Nov 2026). */
export const PRICE = { [HAIKU]: [0.1, 0.5], [SONNET]: [2, 10], [OPUS]: [4, 20] };

let spent = 0;
export const spentUsd = () => spent;

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export async function message(model, content, { system, maxTokens = 1024, tag = 'adhoc', extra = {} } = {}) {
  const key = readFileSync(KEY_FILE, 'ascii').trim();
  const body = { model, max_tokens: maxTokens, messages: [{ role: 'user', content }] };
  if (system) body.system = system;
  Object.assign(body, extra);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if ([429, 500, 529].includes(r.status) && attempt < 3) { await new Promise((ok) => setTimeout(ok, 5000 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 500)}`);
    const j = await r.json();
    const u = j.usage ?? {};
    const row = { t: stamp(), tag, model, batch: false, in: u.input_tokens ?? 0, out: u.output_tokens ?? 0,
      cache_read: u.cache_read_input_tokens ?? 0, cache_write: u.cache_creation_input_tokens ?? 0 };
    appendFileSync(LEDGER, JSON.stringify(row) + '\n');
    const [pi, po] = PRICE[model] ?? [4, 20];
    spent += (row.in * pi + row.out * po) / 1e6;
    return j;
  }
  throw new Error('API retries exhausted');
}

export const textOf = (r) => (r.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('');
