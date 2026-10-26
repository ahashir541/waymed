import type { AnonEvent, AssistantReply, GuideRequest, GuideStatus, HospitalData, Lang, Role, Slot, StaffUser, TokenView } from '../types.ts';

export type Listener = (event: string, data: unknown) => void;

export interface StaffLine {
  deptId: string;
  line: { id: string; label: string; status: string; priority: number; channel: string; createdAt: number; slotStart: number | null }[];
  called: { id: string; label: string; calledAt: number | null }[];
}

export interface RecentToken {
  id: string;
  label: string;
  deptId: string;
  priority: number;
  createdAt: number;
  status: string;
}

export interface KeyCount {
  key: string;
  count: number;
}

export interface Insights {
  days: number;
  since: string;
  minN: number;
  tokensByDept: KeyCount[];
  avgWaitByDept: { key: string; n: number; avgSec: number }[];
  channels: KeyCount[];
  languages: KeyCount[];
  lostByLandmark: KeyCount[];
  guidesByLandmark: KeyCount[];
  feedback: { yes: number; no: number };
  hours: { hour: number; count: number }[];
  assistant: KeyCount[];
}

export interface AuditRow {
  id: number;
  at: number;
  who: string | null;
  action: string;
  target: string;
  detail: string | null;
}

export interface AskInput {
  lang: Lang;
  message: string;
  history: { role: 'user' | 'assistant'; text: string }[];
  tokenId?: string;
  from?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export interface Backend {
  mode: 'live' | 'demo';
  getHospital(): Promise<HospitalData>;
  /** Subscribe to a public realtime topic. Returns an unsubscribe function. */
  subscribe(topic: string, cb: Listener): () => void;
  subscribeStaff(topic: string, cb: Listener): () => void;
  /** Connection state of the realtime stream (false while offline or reconnecting). */
  onStatus(cb: (online: boolean) => void): () => void;
  lookupToken(label: string): Promise<string | null>;
  /** Visitor takes a slip on their phone in the Slip Room. */
  selfIssue(deptId: string): Promise<TokenView>;
  getToken(id: string): Promise<TokenView | null>;
  slots(doctorId: string): Promise<Slot[]>;
  book(doctorId: string, slotStart: number): Promise<TokenView>;
  logEvent(e: AnonEvent): void;
  requestGuide(landmarkId: string, lang: Lang): Promise<GuideRequest>;
  ask(input: AskInput): Promise<AssistantReply>;
  // Staff
  me(): Promise<{ user: StaffUser | null; demoTools: boolean }>;
  login(email: string, password: string): Promise<StaffUser>;
  logout(): Promise<void>;
  issueToken(deptId: string, urgent: boolean, channel?: 'desk' | 'kiosk'): Promise<TokenView>;
  recentTokens(): Promise<RecentToken[]>;
  staffLine(deptId: string): Promise<StaffLine>;
  queueOp(deptId: string, op: 'next' | 'recall' | 'skip'): Promise<void>;
  simulate(deptId: string): Promise<void>;
  guides(): Promise<GuideRequest[]>;
  updateGuide(id: string, status: Exclude<GuideStatus, 'open'>): Promise<void>;
  setDoctorAvailable(doctorId: string, available: boolean): Promise<void>;
  setSlotBlocked(doctorId: string, slotStart: number, blocked: boolean): Promise<void>;
  // Admin
  putEntity(kind: string, id: string, data: unknown): Promise<HospitalData>;
  deleteEntity(kind: string, id: string): Promise<HospitalData>;
  users(): Promise<StaffUser[]>;
  createUser(u: { email: string; name: string; role: Role; deptId: string | null; password: string }): Promise<StaffUser>;
  updateUser(id: string, patch: Partial<{ name: string; role: Role; deptId: string | null; active: boolean; password: string }>): Promise<StaffUser>;
  audit(): Promise<AuditRow[]>;
  insights(days: number): Promise<Insights>;
  insightsCsvUrl(days: number): string | null;
  health(): Promise<{ ok: boolean; db: boolean; realtimeClients: number; llm: boolean; time: number }>;
}
