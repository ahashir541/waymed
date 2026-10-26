import { safeStorage } from './prefs.tsx';

/** The last place the visitor confirmed (landmark QR, kiosk or journey), used as the start of routes. */
export const currentPlace = () => safeStorage.get('wm_here', true) ?? 'entrance';
