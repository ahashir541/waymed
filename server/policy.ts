// Access policy: the single place that decides who may do what (the equivalent of firestore.rules).
// Default deny: an action not listed here is refused for everyone.
import type { Role, StaffUser } from '../src/lib/types.ts';

export type Actor = 'public' | Role;

export const POLICY = {
  // Visitors (anonymous): read hospital map data, read ONE token or guide request by its unguessable id,
  // read public queue summaries (what the entrance board shows), create anonymous events,
  // ask the assistant, read slots and book (booking returns only a token).
  'hospital.read': ['public', 'desk', 'dept', 'admin'],
  'queue.summary': ['public', 'desk', 'dept', 'admin'],
  'token.readById': ['public', 'desk', 'dept', 'admin'],
  'token.lookupByLabel': ['public', 'desk', 'dept', 'admin'],
  'event.create': ['public', 'desk', 'dept', 'admin'],
  'guide.create': ['public', 'desk', 'dept', 'admin'],
  'guide.readById': ['public', 'desk', 'dept', 'admin'],
  'slots.read': ['public', 'desk', 'dept', 'admin'],
  'appointment.book': ['public', 'desk', 'dept', 'admin'],
  'assistant.ask': ['public', 'desk', 'dept', 'admin'],
  'token.selfIssue': ['public', 'desk', 'dept', 'admin'],
  // Staff
  'token.issue': ['desk', 'admin'],
  'token.listRecent': ['desk', 'admin'],
  'queue.line': ['desk', 'dept', 'admin'],
  'queue.operate': ['dept', 'admin'],
  'queue.simulate': ['dept', 'admin'],
  'guide.list': ['desk', 'dept', 'admin'],
  'guide.update': ['desk', 'dept', 'admin'],
  'slots.block': ['dept', 'admin'],
  'doctor.availability': ['dept', 'admin'],
  // Admin
  'hospital.write': ['admin'],
  'users.manage': ['admin'],
  'insights.read': ['admin'],
  'audit.read': ['admin'],
} as const satisfies Record<string, readonly Actor[]>;

export type Action = keyof typeof POLICY;

/** Actions limited to the staff member's own department when they have one. */
const DEPT_SCOPED = new Set<Action>(['queue.operate', 'queue.simulate', 'queue.line', 'slots.block', 'doctor.availability']);

export function can(user: StaffUser | null, action: Action, scope?: { deptId?: string }): boolean {
  const actor: Actor = user?.active ? user.role : 'public';
  const allowed = POLICY[action] as readonly Actor[] | undefined;
  if (!allowed || !allowed.includes(actor)) return false;
  if (user && user.role === 'dept' && DEPT_SCOPED.has(action) && scope?.deptId && user.deptId && user.deptId !== scope.deptId) return false;
  return true;
}
