// Turns route steps into sentences in the chosen language.
import type { HospitalData, Lang } from './types.ts';
import { tr } from './types.ts';
import type { RouteStep } from './route.ts';
import { deptAtNode } from './route.ts';
import { translate, type DictKey } from './i18n/core.ts';

export function placeName(data: HospitalData, nodeId: string, lang: Lang): string {
  const dept = deptAtNode(data, nodeId);
  if (dept) return tr(dept.name, lang);
  return tr(data.landmarks.find((l) => l.id === nodeId)?.name, lang) || nodeId;
}

export function stepText(step: RouteStep, data: HospitalData, lang: Lang): string {
  const main = translate(lang, `step.${step.kind}` as DictKey, { place: placeName(data, step.nodeId, lang) });
  return step.note ? `${main} ${translate(lang, `step.note.${step.note}` as DictKey)}` : main;
}
