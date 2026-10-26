// Shared domain types used by the browser app and the server.

export type Lang = 'en' | 'ur' | 'sd';
export const LANGS: Lang[] = ['en', 'ur', 'sd'];

/** A string in all three languages. Every `sd` value is pending native review. */
export interface L10n {
  en: string;
  ur: string;
  sd: string;
}

export type Shape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';

export interface Hospital {
  id: string;
  name: L10n;
  shortName: string;
  /** Opening hours of the outpatient side, shown on the pre-visit page. */
  openHours: L10n;
  helpline: string;
  /** Street address shown on the home page. */
  address?: L10n;
  /** Ties the floor plan to GPS so the phone can spot a wrong turn on-device. Must be calibrated on site. */
  geo?: GeoRef;
}

export interface GeoRef {
  /** GPS position of plan point (x, y). */
  lat: number;
  lng: number;
  x: number;
  y: number;
  /** Clockwise angle from north to the plan's "up" direction. */
  rotationDeg: number;
  metersPerUnit: number;
}

export interface Department {
  id: string;
  /** Short code printed on tokens, e.g. PED. 2-4 capital letters. */
  code: string;
  name: L10n;
  color: string;
  icon: string;
  shape: Shape;
  floor: number;
  /** Fallback service time used only until real service times have been measured. */
  avgServiceMin: number;
  openHours: L10n;
  /** Graph node of the department door. */
  nodeId: string;
  /** Room rectangle drawn on the floor plan. */
  room: { x: number; y: number; w: number; h: number };
  bookable: boolean;
  isEmergency?: boolean;
  order: number;
  /** Two-letter badge shown with the icon and shape, e.g. "CH" for Children. */
  badge?: string;
}

export type NodeKind = 'landmark' | 'door' | 'waypoint';

export interface Landmark {
  id: string;
  name: L10n;
  x: number;
  y: number;
  floor: number;
  kind: NodeKind;
  /** Landmarks get a printed QR sticker. */
  hasSticker: boolean;
  deptId?: string;
}

export interface Edge {
  id: string;
  a: string;
  b: string;
  stepFree: boolean;
  /** Extra bend points between a and b for drawing and length. */
  via?: [number, number][];
  /** What is on this edge: shown in directions. */
  note?: 'steps' | 'ramp' | 'lift' | null;
}

export type FacilityType = 'water' | 'washroom' | 'seating' | 'prayer' | 'helpdesk';
export const FACILITY_TYPES: FacilityType[] = ['water', 'washroom', 'seating', 'prayer', 'helpdesk'];

export interface Facility {
  id: string;
  type: FacilityType;
  nodeId: string;
  x: number;
  y: number;
  name: L10n;
}

export interface WeeklySchedule {
  /** 0 = Sunday ... 6 = Saturday */
  days: number[];
  start: string; // "09:00"
  end: string; // "13:00"
}

export interface Doctor {
  id: string;
  deptId: string;
  name: L10n;
  schedule: WeeklySchedule;
  slotMin: number;
  available: boolean;
}

export interface Kiosk {
  id: string;
  name: string;
  landmarkId: string;
}

export interface HospitalData {
  hospital: Hospital;
  departments: Department[];
  landmarks: Landmark[];
  edges: Edge[];
  facilities: Facility[];
  doctors: Doctor[];
  kiosks: Kiosk[];
  version: number;
  /** True when this is the built-in sample data (shown with a label). */
  sample: boolean;
}

export type TokenStatus = 'waiting' | 'next' | 'called' | 'done' | 'skipped';
export type Channel = 'desk' | 'kiosk' | 'phone' | 'booking';

export interface Token {
  id: string;
  deptId: string;
  /** Daily running number per department. */
  number: number;
  /** Display label, e.g. PED-007 */
  label: string;
  status: TokenStatus;
  priority: 0 | 1;
  channel: Channel;
  createdAt: number;
  /** Sort key: createdAt for walk-ins, slot start minus a lead time for appointments. */
  orderKey: number;
  calledAt: number | null;
  recalledAt: number | null;
  doneAt: number | null;
  expiresAt: number;
  slotStart: number | null;
  slotEnd: number | null;
}

export interface WaitRange {
  minMin: number;
  maxMin: number;
  /** true when based on measured service times, false when based on the department setting. */
  measured: boolean;
}

/** What a visitor may see about one token. Nothing personal exists to show. */
export interface TokenView {
  id: string;
  label: string;
  deptId: string;
  status: TokenStatus;
  ahead: number;
  wait: WaitRange | null;
  calledAt: number | null;
  recalledAt: number | null;
  slotStart: number | null;
  slotEnd: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface QueueSummary {
  deptId: string;
  nowServing: { id: string; label: string; calledAt: number; recalledAt: number | null } | null;
  nextLabels: string[];
  waiting: number;
  avgServiceSec: number;
  measured: boolean;
  updatedAt: number;
}

export type SlotStatus = 'free' | 'booked' | 'blocked' | 'unavailable' | 'past';
export interface Slot {
  start: number;
  end: number;
  status: SlotStatus;
}

export type EventType =
  | 'slip_issued'
  | 'qr_scanned'
  | 'kiosk_used'
  | 'lost_help'
  | 'guide_requested'
  | 'feedback'
  | 'assistant_question_category'
  | 'route_viewed';

export const EVENT_TYPES: EventType[] = [
  'slip_issued',
  'qr_scanned',
  'kiosk_used',
  'lost_help',
  'guide_requested',
  'feedback',
  'assistant_question_category',
  'route_viewed',
];

export interface AnonEvent {
  type: EventType;
  lang?: Lang;
  channel?: Channel;
  deptId?: string;
  landmarkId?: string;
  /** Small categorical value only, e.g. "yes", "no", "facility". Never free text. */
  value?: string;
}

export type GuideStatus = 'open' | 'on_the_way' | 'done';
export interface GuideRequest {
  id: string;
  landmarkId: string;
  lang: Lang;
  status: GuideStatus;
  createdAt: number;
  updatedAt: number;
}

export type Role = 'admin' | 'desk' | 'dept';
export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  deptId: string | null;
  active: boolean;
}

export type AssistantAction =
  | { type: 'route'; dest: string }
  | { type: 'emergency' }
  | { type: 'book'; deptId?: string }
  | { type: 'token'; tokenId: string }
  | { type: 'lost' }
  | null;

export interface AssistantReply {
  reply: string;
  chips: string[];
  action: AssistantAction;
  category: string;
  source: 'llm' | 'rules';
}

export const tr = (s: L10n | undefined, lang: Lang): string => (s ? s[lang] || s.en : '');
