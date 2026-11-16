import { test } from 'vitest';
import { CLASSES, RACES, FORMS } from '../src/rules/data';
import { RACE_TREES, FORM_TREES } from '../src/rules/content';
import { SUBCLASS_EXTRA, FORM_EXTRA } from '../src/rules/tiers-content';
test('count', () => {
  console.log('CLS', CLASSES.map((c) => c.id).join(' '));
  console.log('RACES', RACES.map((r) => r.id + ':' + r.name).join(' '));
  console.log('FORMS', FORMS.map((r) => r.id + ':' + r.name).join(' '));
  console.log('SUBKEYS', Object.keys(SUBCLASS_EXTRA).join(' '));
  console.log('SUBNODE', Object.entries(SUBCLASS_EXTRA).slice(0, 2).map(([k, v]) => k + '=' + v.nodes.map((n) => n.id).join(',') + ' ult ' + v.ultimate.id).join(' | '));
  console.log('FXKEYS', Object.keys(FORM_EXTRA).join(' '), Object.values(FORM_EXTRA)[0].nodes.map((n) => n.id).join(','), Object.values(FORM_EXTRA)[0].ultimate.id);
  console.log('RT', RACE_TREES.map((t) => t.id + ':' + t.nodes.slice(0, 2).map((n) => n.id).join(',')).join(' '));
  console.log('FT', FORM_TREES.map((t) => t.id + ':' + t.nodes.slice(0, 2).map((n) => n.id).join(',')).join(' '));
});
