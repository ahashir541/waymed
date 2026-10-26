import { safeStorage } from './prefs.tsx';
import { getVisit } from './visit.ts';

/** The last place the visitor confirmed (journey, landmark QR or kiosk), used as the start of routes. */
export const currentPlace = () => getVisit()?.here ?? safeStorage.get('wm_here', true) ?? 'entrance';
