import { describe, expect, it } from 'vitest';
import { answerRules, detectIntent, normalizeText } from '../../src/lib/assistantRules.ts';
import { sampleHospital as data } from '../../src/data/sampleHospital.ts';

const ctx = (lang: 'en' | 'ur' | 'sd') => ({ data, lang, from: 'entrance', token: null });

describe('rule-based assistant', () => {
  it('understands where-to questions in three languages', () => {
    expect(detectIntent('Where is the children department?', data)).toEqual({ kind: 'where', deptId: 'paediatrics' });
    expect(detectIntent('بچوں کا شعبہ کہاں ہے؟', data)).toEqual({ kind: 'where', deptId: 'paediatrics' });
    expect(detectIntent('ٻارن جو شعبو ڪٿي آهي؟', data)).toEqual({ kind: 'where', deptId: 'paediatrics' });
    expect(detectIntent('where is the lab', data)).toEqual({ kind: 'where', deptId: 'lab' });
    expect(detectIntent('where can I get medicines', data)).toEqual({ kind: 'where', deptId: 'pharmacy' });
  });

  it('finds facilities', () => {
    expect(detectIntent('where is drinking water', data)).toEqual({ kind: 'facility', type: 'water' });
    expect(detectIntent('پانی کہاں ہے', data)).toEqual({ kind: 'facility', type: 'water' });
    expect(detectIntent('پاڻي ڪٿي آهي', data)).toEqual({ kind: 'facility', type: 'water' });
    expect(detectIntent('نماز کہاں پڑھوں', data)).toEqual({ kind: 'facility', type: 'prayer' });
    expect(detectIntent('washroom?', data)).toEqual({ kind: 'facility', type: 'washroom' });
  });

  it('emergencies come first and point to the Emergency route', () => {
    const r = answerRules('my child is not breathing, where do I go', ctx('en'));
    expect(r.category).toBe('emergency');
    expect(r.action).toEqual({ type: 'emergency' });
    expect(answerRules('بچہ بے ہوش ہے', ctx('ur')).action).toEqual({ type: 'emergency' });
    expect(answerRules('ايمرجنسي', ctx('sd')).action).toEqual({ type: 'emergency' });
  });

  it('refuses medical advice and diagnosis in every language', () => {
    for (const [q, lang] of [
      ['what medicine should I take for fever', 'en'],
      ['is it serious? what disease is this', 'en'],
      ['بخار کے لیے کون سی دوا لوں', 'ur'],
      ['ڪهڙي دوا وٺان', 'sd'],
    ] as const) {
      const r = answerRules(q, ctx(lang));
      expect(r.category).toBe('medical');
      expect(r.reply).not.toMatch(/mg|tablet/i);
    }
    expect(answerRules('what medicine should I take', ctx('en')).reply).toContain('cannot give medical advice');
  });

  it('answers token questions with or without a saved token', () => {
    expect(answerRules('my token', ctx('en')).reply).toContain('PED-007');
    const tok = { id: 'abcdefghijklmnop', label: 'PED-012', deptId: 'paediatrics', status: 'waiting' as const, ahead: 3, wait: { minMin: 10, maxMin: 20, measured: true }, calledAt: null, recalledAt: null, slotStart: null, slotEnd: null, createdAt: 0, updatedAt: 0 };
    const r = answerRules('my token', { ...ctx('en'), token: tok });
    expect(r.reply).toContain('PED-012');
    expect(r.action).toEqual({ type: 'token', tokenId: tok.id });
  });

  it('always offers suggestion chips and replies in the chosen language', () => {
    const ur = answerRules('asdfgh', ctx('ur'));
    expect(ur.category).toBe('unknown');
    expect(ur.chips.length).toBeGreaterThan(0);
    expect(ur.reply).toMatch(/[؀-ۿ]/);
    expect(answerRules('where is water', ctx('sd')).reply).toMatch(/[؀-ۿ]/);
  });

  it('normalizes Urdu and Sindhi letter variants', () => {
    expect(normalizeText('ڪ ي ه')).toBe(normalizeText('ک ی ہ'));
  });
});
