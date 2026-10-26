import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { en } from '../../src/lib/i18n/en.ts';
import { ur } from '../../src/lib/i18n/ur.ts';
import { sd } from '../../src/lib/i18n/sd.ts';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

describe('one dictionary, three languages', () => {
  it('has the same keys in English, Urdu and Sindhi', () => {
    expect(Object.keys(ur).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(sd).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings and the same placeholders everywhere', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      for (const d of [ur, sd]) {
        expect(d[k].trim(), k).not.toBe('');
        expect(placeholders(d[k]), k).toBe(placeholders(en[k]));
      }
    }
  });

  it('Urdu and Sindhi are written in Arabic script (not left in English)', () => {
    const latinOnly = (s: string) => !/[؀-ۿ]/.test(s);
    const allowed = new Set(['token.lookupHint', 'insights.csv', 'assistant.ans.hours']);
    for (const k of Object.keys(en) as (keyof typeof en)[]) {
      if (allowed.has(k) || k.startsWith('show.controls')) continue;
      expect(latinOnly(ur[k]), `ur ${k}`).toBe(false);
      expect(latinOnly(sd[k]), `sd ${k}`).toBe(false);
    }
  });

  it('marks every Sindhi string for native review', () => {
    const lines = readFileSync('src/lib/i18n/sd.ts', 'utf8').split('\n').filter((l) => /^\s+'[^']+':/.test(l));
    expect(lines.length).toBe(Object.keys(en).length);
    expect(lines.every((l) => l.includes('TODO: native review'))).toBe(true);
    for (const f of ['src/data/sampleHospital.ts', 'src/data/story.ts']) {
      const sdLines = readFileSync(f, 'utf8').split('\n').filter((l) => l.includes("sd: '"));
      expect(sdLines.every((l) => l.includes('TODO: native review')), f).toBe(true);
    }
  });
});
