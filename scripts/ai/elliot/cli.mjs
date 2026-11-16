// Elliot's controls for the game (see server.mjs). Each call prints what is on screen afterwards.
//   node scripts/ai/elliot/cli.mjs look
//   node scripts/ai/elliot/cli.mjs tap 3          (tap item [3] from the last look)
//   node scripts/ai/elliot/cli.mjs taps 0 20      (tap item [0] 20 times fast, e.g. the fight)
//   node scripts/ai/elliot/cli.mjs hold 5         (press and hold: shows what a thing does)
//   node scripts/ai/elliot/cli.mjs wait 10        (let the idle game run, up to 30 s)
//   node scripts/ai/elliot/cli.mjs scroll 400
//   node scripts/ai/elliot/cli.mjs note bug "the X button does nothing"
const PORT = process.env.ELLIOT_PORT || 5299;
const [cmd = 'look', a, b] = process.argv.slice(2);
const q = new URLSearchParams({ cmd });
if (['tap', 'taps', 'hold'].includes(cmd)) q.set('ref', a ?? '');
if (cmd === 'taps') q.set('n', b ?? '10');
if (cmd === 'wait') q.set('s', a ?? '5');
if (cmd === 'scroll') q.set('dy', a ?? '300');
if (cmd === 'note') { q.set('kind', a ?? 'note'); q.set('text', process.argv.slice(4).join(' ')); }
const res = await fetch(`http://localhost:${PORT}/?${q}`);
console.log(await res.text());
