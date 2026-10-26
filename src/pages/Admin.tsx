import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Layout, PageTitle } from '../components/Layout.tsx';
import { RequireStaff, StaffBar } from '../components/RequireStaff.tsx';
import { Icon } from '../components/Icon.tsx';
import { DeptMark } from '../components/DeptMark.tsx';
import { usePrefs } from '../lib/prefs.tsx';
import { useBackend, useHospital } from '../lib/store.tsx';
import { ApiError, type AuditRow } from '../lib/backend/types.ts';
import { ICON_NAMES } from '../lib/icons.ts';
import { edgePoints, toPath } from '../lib/route.ts';
import { FACILITY_TYPES, type Edge, type HospitalData, type Landmark, type Role, type StaffUser } from '../lib/types.ts';
import type { DictKey } from '../lib/i18n/core.ts';
import { PLAN_H, PLAN_W } from '../components/FloorPlan.tsx';

type Obj = Record<string, unknown>;
type FieldType = 'text' | 'number' | 'l10n' | 'color' | 'select' | 'bool' | 'days' | 'time' | 'room';
interface Field {
  key: string;
  label: DictKey;
  type: FieldType;
  options?: { value: string; label: string }[];
}

const get = (o: Obj, path: string): unknown => path.split('.').reduce<unknown>((a, k) => (a as Obj | undefined)?.[k], o);
const set = (o: Obj, path: string, v: unknown): Obj => {
  const keys = path.split('.');
  const out: Obj = structuredClone(o);
  let cur: Obj = out;
  keys.slice(0, -1).forEach((k) => (cur = (cur[k] ??= {}) as Obj));
  cur[keys[keys.length - 1]] = v;
  return out;
};

function useSaver() {
  const backend = useBackend();
  const { t } = usePrefs();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: t('common.saved') });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? `${t('admin.validation')} (${e.code})` : t('common.error') });
    }
  };
  return { backend, msg, run };
}

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? 'status' : 'alert'} className={`font-semibold ${msg.ok ? 'text-ok' : 'text-danger'}`}>
      {msg.text}
    </p>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const { t } = usePrefs();
  const label = <span className="font-semibold">{t(f.label)}</span>;
  if (f.type === 'l10n') {
    const v = (value ?? { en: '', ur: '', sd: '' }) as Record<string, string>;
    return (
      <fieldset className="grid gap-1 sm:col-span-2">
        <legend className="font-semibold">{t(f.label)}</legend>
        {(['en', 'ur', 'sd'] as const).map((l) => (
          <input key={l} className="field" lang={l} dir={l === 'en' ? 'ltr' : 'rtl'} aria-label={`${t(f.label)} (${l})`} placeholder={l.toUpperCase()} value={v[l] ?? ''} onChange={(e) => onChange({ ...v, [l]: e.target.value })} />
        ))}
      </fieldset>
    );
  }
  if (f.type === 'bool')
    return (
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-6" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {label}
      </label>
    );
  if (f.type === 'select')
    return (
      <label className="grid gap-1">
        {label}
        <select className="field" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {f.options!.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  if (f.type === 'days') {
    const days = (value as number[]) ?? [];
    return (
      <fieldset className="sm:col-span-2">
        <legend className="font-semibold">{t(f.label)}</legend>
        <div className="flex flex-wrap gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <label key={d} className="chip">
              <input type="checkbox" checked={days.includes(i)} onChange={(e) => onChange(e.target.checked ? [...days, i].sort() : days.filter((x) => x !== i))} /> {d}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  if (f.type === 'room') {
    const r = (value ?? { x: 0, y: 0, w: 100, h: 60 }) as Record<string, number>;
    return (
      <fieldset className="grid grid-cols-4 gap-2 sm:col-span-2">
        <legend className="font-semibold">Room x / y / w / h</legend>
        {(['x', 'y', 'w', 'h'] as const).map((k) => (
          <input key={k} type="number" className="field" aria-label={`room ${k}`} value={r[k]} onChange={(e) => onChange({ ...r, [k]: Number(e.target.value) })} />
        ))}
      </fieldset>
    );
  }
  return (
    <label className="grid gap-1">
      {label}
      <input
        className="field"
        type={f.type === 'number' ? 'number' : f.type === 'color' ? 'color' : f.type === 'time' ? 'time' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => onChange(f.type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}

function EntityEditor({ kind, items, fields, blank, title }: { kind: string; items: Obj[]; fields: Field[]; blank: () => Obj; title: (o: Obj) => React.ReactNode }) {
  const { t } = usePrefs();
  const { backend, msg, run } = useSaver();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Obj | null>(null);
  const [isNew, setIsNew] = useState(false);
  const start = (o: Obj, n = false) => {
    setOpenId(String(o.id));
    setDraft(structuredClone(o));
    setIsNew(n);
  };
  return (
    <div className="grid gap-3">
      <div>
        <button className="btn" onClick={() => start(blank(), true)}>
          <Icon name="plus" /> {t('common.add')}
        </button>
      </div>
      {[...items, ...(isNew && draft ? [draft] : [])].map((o) => {
        const open = openId === String(o.id);
        return (
          <div key={String(o.id)} className="glass rounded-2xl p-3">
            <button className="flex w-full items-center gap-3 text-start text-lg font-semibold" aria-expanded={open} onClick={() => (open ? (setOpenId(null), setIsNew(false)) : start(o))}>
              {title(o)}
              <Icon name={open ? 'x' : 'settings'} className="ms-auto" />
            </button>
            {open && draft && (
              <form
                className="mt-3 grid gap-3 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await backend.putEntity(kind, String(draft.id), draft);
                    setIsNew(false);
                  });
                }}
              >
                {isNew && (
                  <label className="grid gap-1">
                    <span className="font-semibold">id</span>
                    <input className="field ltr" pattern="[A-Za-z][A-Za-z0-9_\-]{1,39}" required value={String(draft.id)} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
                  </label>
                )}
                {fields.map((f) => (
                  <FieldInput key={f.key} f={f} value={get(draft, f.key)} onChange={(v) => setDraft(set(draft, f.key, v))} />
                ))}
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <button className="btn btn-primary">
                    <Icon name="check" /> {t('common.save')}
                  </button>
                  {!isNew && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        if (confirm(`${t('common.delete')}: ${String(o.id)}?`)) void run(() => backend.deleteEntity(kind, String(o.id)).then(() => setOpenId(null)));
                      }}
                    >
                      <Icon name="trash" /> {t('common.delete')}
                    </button>
                  )}
                  <Msg msg={msg} />
                </div>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Visual floor-plan editor ----------

function PlanEditor({ data }: { data: HospitalData }) {
  const { t, L } = usePrefs();
  const { backend, msg, run } = useSaver();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<Landmark[]>(data.landmarks);
  const [sel, setSel] = useState<string[]>([]);
  const [edgeSel, setEdgeSel] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  useEffect(() => {
    setNodes(data.landmarks);
  }, [data.landmarks]);
  const map = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const toPlan = (e: React.PointerEvent) => {
    const pt = svgRef.current!.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse());
    return { x: Math.round(Math.min(PLAN_W, Math.max(0, p.x))), y: Math.round(Math.min(PLAN_H, Math.max(0, p.y))) };
  };
  const selNode = sel.length === 1 ? map.get(sel[0]) : null;
  const edge = data.edges.find((e) => e.id === edgeSel) ?? null;
  const saveNode = (n: Landmark) => run(() => backend.putEntity('landmark', n.id, n));
  const saveEdge = (e: Edge) => run(() => backend.putEntity('edge', e.id, e));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <div className="glass rounded-3xl p-3">
        <p className="mb-2 text-base text-muted">{t('admin.editorHint')}</p>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${PLAN_W} ${PLAN_H}`}
          className="w-full touch-none select-none rounded-2xl bg-[var(--wm-plan-bg)]"
          onPointerMove={(e) => {
            if (!drag) return;
            const p = toPlan(e);
            setNodes((ns) => ns.map((n) => (n.id === drag ? { ...n, ...p } : n)));
          }}
          onPointerUp={() => {
            if (drag) {
              const n = map.get(drag);
              if (n) void saveNode(n);
            }
            setDrag(null);
          }}
        >
          {data.departments.map((d) => (
            <rect key={d.id} x={d.room.x} y={d.room.y} width={d.room.w} height={d.room.h} rx="12" fill={d.color} fillOpacity="0.15" stroke={d.color} />
          ))}
          {data.edges.map((e) => {
            const pts = edgePoints(e, map, e.a);
            return (
              <path
                key={e.id}
                d={toPath(pts)}
                fill="none"
                stroke={edgeSel === e.id ? 'var(--wm-accent)' : 'var(--wm-plan-corridor)'}
                strokeWidth={edgeSel === e.id ? 18 : 14}
                strokeDasharray={e.stepFree ? undefined : '6 8'}
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => {
                  setEdgeSel(e.id);
                  setSel([]);
                }}
              >
                <title>
                  {e.id} {e.stepFree ? 'step-free' : 'steps'}
                </title>
              </path>
            );
          })}
          {nodes.map((n) => (
            <g
              key={n.id}
              className="cursor-grab"
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDrag(n.id);
                setEdgeSel(null);
                setSel((s) => (e.shiftKey || s.length === 1 ? [...s.filter((x) => x !== n.id), n.id].slice(-2) : [n.id]));
              }}
            >
              <circle cx={n.x} cy={n.y} r={n.kind === 'door' ? 10 : 14} fill={sel.includes(n.id) ? 'var(--wm-accent)' : 'var(--wm-surface-solid)'} stroke="var(--wm-ink)" strokeWidth="3" />
              <text x={n.x} y={n.y - 20} textAnchor="middle" fontSize="16" fill="var(--wm-ink)">
                {L(n.name)}
              </text>
            </g>
          ))}
        </svg>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="btn"
            disabled={sel.length !== 2}
            onClick={() => void saveEdge({ id: `e_${Date.now().toString(36)}`, a: sel[0], b: sel[1], stepFree: true, note: null })}
          >
            <Icon name="route" /> {t('admin.connect')}
          </button>
          <button
            className="btn"
            onClick={() => {
              const id = `p_${Date.now().toString(36)}`;
              void saveNode({ id, kind: 'landmark', hasSticker: true, x: 500, y: 320, floor: 0, name: { en: 'New point', ur: 'نیا مقام', sd: 'نئين جاءِ' } });
            }}
          >
            <Icon name="plus" /> {t('admin.addPoint')}
          </button>
        </div>
        <Msg msg={msg} />
      </div>
      <div className="grid content-start gap-3">
        {selNode && <NodeForm key={selNode.id} node={selNode} onSave={saveNode} onDelete={() => run(() => backend.deleteEntity('landmark', selNode.id).then(() => setSel([])))} />}
        {edge && (
          <div className="glass grid gap-3 rounded-2xl p-4">
            <p className="font-bold">
              {L(map.get(edge.a)?.name)} ↔ {L(map.get(edge.b)?.name)}
            </p>
            <p>{edge.stepFree ? t('guide.stepFree') : t('step.note.steps')}</p>
            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => void saveEdge({ ...edge, stepFree: !edge.stepFree, note: edge.stepFree ? 'steps' : (edge.note === 'steps' ? null : edge.note) ?? null })}>
                <Icon name="wheelchair" /> {t('admin.toggleStepFree')}
              </button>
              <select className="field max-w-40" aria-label="note" value={edge.note ?? ''} onChange={(e) => void saveEdge({ ...edge, note: (e.target.value || null) as Edge['note'] })}>
                <option value="">—</option>
                <option value="steps">steps</option>
                <option value="ramp">ramp</option>
                <option value="lift">lift</option>
              </select>
              <button className="btn btn-danger" onClick={() => void run(() => backend.deleteEntity('edge', edge.id).then(() => setEdgeSel(null)))}>
                <Icon name="trash" /> {t('admin.removeEdge')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeForm({ node, onSave, onDelete }: { node: Landmark; onSave: (n: Landmark) => void; onDelete: () => void }) {
  const { t } = usePrefs();
  const [d, setD] = useState(node);
  return (
    <form
      className="glass grid gap-3 rounded-2xl p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(d);
      }}
    >
      <p className="ltr font-mono">{d.id}</p>
      <FieldInput f={{ key: 'name', label: 'admin.name', type: 'l10n' }} value={d.name} onChange={(v) => setD({ ...d, name: v as Landmark['name'] })} />
      <FieldInput
        f={{ key: 'kind', label: 'admin.type', type: 'select', options: ['landmark', 'door', 'waypoint'].map((v) => ({ value: v, label: v })) }}
        value={d.kind}
        onChange={(v) => setD({ ...d, kind: v as Landmark['kind'] })}
      />
      <FieldInput f={{ key: 'hasSticker', label: 'admin.sticker', type: 'bool' }} value={d.hasSticker} onChange={(v) => setD({ ...d, hasSticker: !!v })} />
      <div className="flex gap-2">
        <button className="btn btn-primary">{t('common.save')}</button>
        <button type="button" className="btn btn-danger" onClick={onDelete}>
          <Icon name="trash" /> {t('common.delete')}
        </button>
      </div>
    </form>
  );
}

// ---------- Users ----------

function Users({ me }: { me: StaffUser }) {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const { backend, msg, run } = useSaver();
  const [list, setList] = useState<StaffUser[]>([]);
  const [form, setForm] = useState({ email: '', name: '', role: 'desk' as Role, deptId: '', password: '' });
  const load = () => void backend.users().then(setList).catch(() => undefined);
  useEffect(load, [backend]);
  return (
    <div className="grid gap-4">
      <form
        className="glass grid gap-3 rounded-2xl p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await backend.createUser({ ...form, deptId: form.role === 'dept' ? form.deptId || null : null });
            setForm({ email: '', name: '', role: 'desk', deptId: '', password: '' });
            load();
          });
        }}
      >
        <label className="grid gap-1">
          <span className="font-semibold">{t('admin.email')}</span>
          <input className="field ltr" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('admin.name')}</span>
          <input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="grid gap-1">
          <span className="font-semibold">{t('admin.role')}</span>
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="desk">desk</option>
            <option value="dept">dept</option>
            <option value="admin">admin</option>
          </select>
        </label>
        {form.role === 'dept' && (
          <label className="grid gap-1">
            <span className="font-semibold">{t('staff.dept')}</span>
            <select className="field" required value={form.deptId} onChange={(e) => setForm({ ...form, deptId: e.target.value })}>
              <option value="">—</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {L(d.name)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-1">
          <span className="font-semibold">{t('admin.password')}</span>
          <input className="field ltr" type="password" minLength={10} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <div className="flex items-end gap-2">
          <button className="btn btn-primary">
            <Icon name="plus" /> {t('common.add')}
          </button>
          <Msg msg={msg} />
        </div>
      </form>
      <ul className="grid gap-2">
        {list.map((u) => (
          <li key={u.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
            <Icon name="user" />
            <span className="font-bold">{u.name}</span>
            <span className="ltr text-muted">{u.email}</span>
            <span className="rounded-full bg-accent-soft px-2">{u.role}</span>
            {u.deptId && <span>{L(data.departments.find((d) => d.id === u.deptId)?.name)}</span>}
            <label className="ms-auto flex items-center gap-2">
              <input type="checkbox" checked={u.active} disabled={u.id === me.id} onChange={(e) => void run(() => backend.updateUser(u.id, { active: e.target.checked }).then(load))} />
              {t('admin.active')}
            </label>
            <button
              className="btn min-h-11"
              onClick={() => {
                const p = prompt(t('admin.password'));
                if (p) void run(() => backend.updateUser(u.id, { password: p }));
              }}
            >
              <Icon name="lock" /> {t('admin.password')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Audit() {
  const { t } = usePrefs();
  const backend = useBackend();
  const [rows, setRows] = useState<AuditRow[]>([]);
  useEffect(() => void backend.audit().then(setRows).catch(() => undefined), [backend]);
  return (
    <div className="glass overflow-x-auto rounded-2xl p-3">
      <table className="w-full text-start text-base">
        <thead>
          <tr className="text-muted">
            <th className="p-2 text-start">{t('admin.when')}</th>
            <th className="p-2 text-start">{t('admin.who')}</th>
            <th className="p-2 text-start">{t('admin.action')}</th>
            <th className="p-2 text-start" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="ltr p-2">{new Date(r.at).toLocaleString()}</td>
              <td className="ltr p-2">{r.who}</td>
              <td className="ltr p-2 font-semibold">{r.action}</td>
              <td className="ltr p-2 text-muted">
                {r.target} {r.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TABS = ['departments', 'landmarks', 'facilities', 'doctors', 'kiosks', 'hospital', 'signage', 'users', 'audit'] as const;

function AdminInner({ me }: { me: StaffUser }) {
  const { t, L } = usePrefs();
  const { data } = useHospital();
  const [tab, setTab] = useState<(typeof TABS)[number]>('departments');
  const nodeOpts = data.landmarks.map((l) => ({ value: l.id, label: `${L(l.name)} (${l.id})` }));
  const deptOpts = data.departments.map((d) => ({ value: d.id, label: L(d.name) }));
  return (
    <>
      <PageTitle icon="settings">{t('admin.title')}</PageTitle>
      {data.sample && (
        <p className="mb-4 rounded-2xl border border-warn/50 bg-warn/10 p-3 font-semibold text-warn">
          <Icon name="alert" className="me-2 inline" />
          {t('admin.sampleData')}
        </p>
      )}
      <div role="tablist" className="no-print mb-4 flex flex-wrap gap-2">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`chip ${tab === k ? 'bg-accent text-on-accent' : ''}`} onClick={() => setTab(k)}>
            {t(`admin.${k}` as DictKey)}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'departments' && (
          <EntityEditor
            kind="department"
            items={data.departments as unknown as Obj[]}
            title={(o) => (
              <>
                <DeptMark dept={o as never} size={36} /> {L(o.name as never)}
              </>
            )}
            blank={() => ({ id: '', code: 'NEW', name: { en: '', ur: '', sd: '' }, color: '#0f766e', icon: 'stethoscope', shape: 'circle', floor: 0, avgServiceMin: 10, openHours: { en: '', ur: '', sd: '' }, nodeId: data.landmarks[0]?.id, room: { x: 400, y: 260, w: 160, h: 80 }, bookable: false, order: data.departments.length })}
            fields={[
              { key: 'name', label: 'admin.name', type: 'l10n' },
              { key: 'code', label: 'admin.code', type: 'text' },
              { key: 'color', label: 'admin.color', type: 'color' },
              { key: 'icon', label: 'admin.icon', type: 'select', options: ICON_NAMES.map((i) => ({ value: i, label: i })) },
              { key: 'shape', label: 'admin.shape', type: 'select', options: ['circle', 'square', 'triangle', 'diamond', 'hexagon'].map((v) => ({ value: v, label: v })) },
              { key: 'avgServiceMin', label: 'admin.avgService', type: 'number' },
              { key: 'nodeId', label: 'admin.node', type: 'select', options: nodeOpts },
              { key: 'openHours', label: 'admin.hours', type: 'l10n' },
              { key: 'room', label: 'admin.landmarks', type: 'room' },
              { key: 'bookable', label: 'admin.bookable', type: 'bool' },
              { key: 'order', label: 'admin.code', type: 'number' },
            ]}
          />
        )}
        {tab === 'landmarks' && <PlanEditor data={data} />}
        {tab === 'facilities' && (
          <EntityEditor
            kind="facility"
            items={data.facilities as unknown as Obj[]}
            title={(o) => (
              <>
                <Icon name={String(o.type)} className="text-accent" /> {L(o.name as never)} · {L(data.landmarks.find((l) => l.id === o.nodeId)?.name)}
              </>
            )}
            blank={() => ({ id: '', type: 'water', nodeId: data.landmarks[0]?.id, x: 500, y: 320, name: { en: '', ur: '', sd: '' } })}
            fields={[
              { key: 'type', label: 'admin.type', type: 'select', options: FACILITY_TYPES.map((f) => ({ value: f, label: t(`facility.${f}`) })) },
              { key: 'nodeId', label: 'admin.node', type: 'select', options: nodeOpts },
              { key: 'name', label: 'admin.name', type: 'l10n' },
              { key: 'x', label: 'admin.node', type: 'number' },
              { key: 'y', label: 'admin.node', type: 'number' },
            ]}
          />
        )}
        {tab === 'doctors' && (
          <EntityEditor
            kind="doctor"
            items={data.doctors as unknown as Obj[]}
            title={(o) => (
              <>
                <Icon name="stethoscope" className="text-accent" /> {L(o.name as never)} · {L(data.departments.find((d) => d.id === o.deptId)?.name)}
              </>
            )}
            blank={() => ({ id: '', deptId: data.departments.find((d) => d.bookable)?.id, name: { en: '', ur: '', sd: '' }, schedule: { days: [1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' }, slotMin: 15, available: true })}
            fields={[
              { key: 'name', label: 'admin.name', type: 'l10n' },
              { key: 'deptId', label: 'book.dept', type: 'select', options: deptOpts },
              { key: 'schedule.days', label: 'admin.schedule', type: 'days' },
              { key: 'schedule.start', label: 'admin.schedule', type: 'time' },
              { key: 'schedule.end', label: 'admin.schedule', type: 'time' },
              { key: 'slotMin', label: 'admin.slotMin', type: 'number' },
              { key: 'available', label: 'admin.available', type: 'bool' },
            ]}
          />
        )}
        {tab === 'kiosks' && (
          <EntityEditor
            kind="kiosk"
            items={data.kiosks as unknown as Obj[]}
            title={(o) => (
              <>
                <Icon name="keyboard" className="text-accent" /> {String(o.name)} ·{' '}
                <Link className="ltr underline" to={`/kiosk?at=${String(o.landmarkId)}`} onClick={(e) => e.stopPropagation()}>
                  /kiosk?at={String(o.landmarkId)}
                </Link>
              </>
            )}
            blank={() => ({ id: '', name: 'Kiosk', landmarkId: data.landmarks[0]?.id })}
            fields={[
              { key: 'name', label: 'admin.name', type: 'text' },
              { key: 'landmarkId', label: 'admin.node', type: 'select', options: nodeOpts },
            ]}
          />
        )}
        {tab === 'hospital' && (
          <EntityEditor
            kind="hospital"
            items={[data.hospital as unknown as Obj]}
            title={(o) => L(o.name as never)}
            blank={() => data.hospital as unknown as Obj}
            fields={[
              { key: 'name', label: 'admin.name', type: 'l10n' },
              { key: 'shortName', label: 'admin.code', type: 'text' },
              { key: 'openHours', label: 'admin.hours', type: 'l10n' },
              { key: 'helpline', label: 'common.help', type: 'text' },
            ]}
          />
        )}
        {tab === 'signage' && (
          <div className="glass grid gap-3 rounded-2xl p-5">
            <Link className="btn btn-primary w-fit" to="/admin/signage">
              <Icon name="printer" /> {t('admin.signage')}
            </Link>
            <p>
              {t('admin.printStickers')} · {t('admin.printSigns')} · {t('admin.printSlip')}
            </p>
          </div>
        )}
        {tab === 'users' && <Users me={me} />}
        {tab === 'audit' && <Audit />}
      </div>
    </>
  );
}

export default function Admin() {
  return (
    <Layout wide>
      <RequireStaff roles={['admin']}>
        {(user, _d, logout) => (
          <>
            <StaffBar user={user} logout={logout} />
            <AdminInner me={user} />
          </>
        )}
      </RequireStaff>
    </Layout>
  );
}
