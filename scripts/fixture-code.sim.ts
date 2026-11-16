// Writes tests/fixtures/save-v3.code.txt: the UT1 save code of the v3 fixture, for the browser smoke suite.
import { test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import * as G from '../src/rules/game';
test('fixture code', () => { writeFileSync('tests/fixtures/save-v3.code.txt', G.exportCode(G.deserialize(readFileSync('tests/fixtures/save-v3.json', 'utf8')))); });
