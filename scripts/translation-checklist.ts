// Generates TRANSLATION_CHECKLIST.md: every Sindhi string with its English source, for native review.
// Run: node scripts/translation-checklist.ts
import { writeFileSync } from 'node:fs';
import { en } from '../src/lib/i18n/en.ts';
import { ur } from '../src/lib/i18n/ur.ts';
import { sd } from '../src/lib/i18n/sd.ts';
import { sampleHospital } from '../src/data/sampleHospital.ts';
import { PERSONAS, WALKS, JOURNEY, FEATURE_EVIDENCE, REJECTED, PILOT, HMW, MOOD_LABEL } from '../src/data/story.ts';
import type { L10n } from '../src/lib/types.ts';

const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const rows: string[] = [];
const add = (area: string, key: string, v: L10n) => rows.push(`| [ ] | ${area} | \`${key}\` | ${esc(v.en)} | ${esc(v.ur)} | ${esc(v.sd)} |`);

// Safety-critical strings first.
const keys = Object.keys(en) as (keyof typeof en)[];
const critical = keys.filter((k) => /^(emergency\.|assistant\.ans\.(emergency|medical)|followup\.r4|token\.status\.|prepare\.emergencyNote)/.test(k));
for (const k of [...critical, ...keys.filter((k) => !critical.includes(k))]) add(critical.includes(k) ? 'UI (safety)' : 'UI', k, { en: en[k], ur: ur[k], sd: sd[k] });

const h = sampleHospital;
add('Hospital', 'hospital.name', h.hospital.name);
add('Hospital', 'hospital.openHours', h.hospital.openHours);
for (const d of h.departments) {
  add('Department', `${d.id}.name`, d.name);
  add('Department', `${d.id}.openHours`, d.openHours);
}
for (const l of h.landmarks) add('Landmark', l.id, l.name);
for (const f of h.facilities) add('Facility', f.id, f.name);
for (const d of h.doctors) add('Doctor (sample)', d.id, d.name);

add('Story', 'HMW', HMW);
for (const p of PERSONAS) {
  add('Persona', `${p.id}.name`, p.name);
  add('Persona', `${p.id}.role`, p.role);
  p.evidence.forEach((e, i) => add('Persona', `${p.id}.evidence.${i}`, e));
}
for (const [m, v] of Object.entries(MOOD_LABEL)) add('Mood', m, v);
for (const [who, steps] of Object.entries(WALKS))
  steps.forEach((s, i) => {
    add('Walk', `${who}.${i}.today`, s.today.text);
    add('Walk', `${who}.${i}.waymed`, s.waymed.text);
    add('Walk', `${who}.${i}.feature`, s.waymed.feature);
  });
JOURNEY.forEach((j, i) => {
  add('Journey', `${i}.stage`, j.stage);
  add('Journey', `${i}.today`, j.today);
  add('Journey', `${i}.expected`, j.expected);
  add('Journey', `${i}.feature`, j.feature);
});
FEATURE_EVIDENCE.forEach((f, i) => add('Evidence', `${i}`, f.feature));
REJECTED.forEach((r, i) => {
  add('Rejected', `${i}.idea`, r.idea);
  add('Rejected', `${i}.why`, r.why);
});
PILOT.forEach((p, i) => add('Pilot', `${i}`, p));

const md = `# Sindhi translation checklist (native review)

Every Sindhi string in WayMed is a **draft** marked \`TODO: native review\` in the code.
A native Sindhi speaker should check each row, correct it in the source file, tick the box,
and then remove the \`// TODO: native review\` marker on that line.

- UI strings: \`src/lib/i18n/sd.ts\`
- Hospital data: \`src/data/sampleHospital.ts\` (replace with real data in /admin before the pilot)
- Story and presenter content: \`src/data/story.ts\`
- Assistant keywords (Sindhi words the assistant understands): \`src/lib/assistantRules.ts\`
- Voice recordings for phones without a Sindhi voice: \`public/audio/sd/README.md\`

Review **safety strings first** (Emergency, medical-advice refusal, "come to Emergency if worse", token status).
Also check that simple, everyday Sindhi is used for visitors with low literacy.

Total strings: ${rows.length}

| Done | Area | Key | English | Urdu | Sindhi (draft) |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
writeFileSync('TRANSLATION_CHECKLIST.md', md);
console.log(`TRANSLATION_CHECKLIST.md written (${rows.length} strings)`);
