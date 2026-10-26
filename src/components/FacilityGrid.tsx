import { Link } from 'react-router';
import { Icon } from './Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { resolveDestination } from '../lib/route.ts';
import { placeName } from '../lib/directions.ts';
import { FACILITY_TYPES, type FacilityType, type HospitalData } from '../lib/types.ts';

/** Facilities nearest to one place, from the hospital's facility list (the single source used by
 *  the More tab, the Wait screen and the map). Shows how many places have each facility. */
export function FacilityGrid({ data, from, types = FACILITY_TYPES }: { data: HospitalData; from: string; types?: FacilityType[] }) {
  const { t, lang } = usePrefs();
  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map((f) => {
        const node = resolveDestination(data, f, from);
        const count = new Set(data.facilities.filter((x) => x.type === f).map((x) => x.nodeId)).size;
        if (!node) return null;
        return (
          <Link key={f} to={`/g/${f}?from=${from}`} className="vtile flex h-full items-start gap-2 rounded-2xl border border-line bg-surface p-3">
            <Icon name={f} size={20} className="mt-0.5 shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-snug">{t(`facility.${f}`)}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted">
                {placeName(data, node, lang)}
                {count > 1 && <> · {t('v.fac.more', { n: count - 1 })}</>}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
