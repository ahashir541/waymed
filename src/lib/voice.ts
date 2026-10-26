// Speech output (speechSynthesis) and input (SpeechRecognition), with graceful fallbacks.
// Sindhi voices are rarely installed: then we play native recordings from /audio/sd/ when they exist
// (see public/audio/sd/README.md), otherwise the page shows the text and says no voice is available.
import type { Lang } from './types.ts';
import { SPEECH_TAGS } from './i18n/core.ts';

export type ClipId = 'welcome' | 'emergency' | 'your_turn' | 'you_are_next' | 'go_straight' | 'turn_left' | 'turn_right' | 'arrived' | 'ask_staff';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

function voicesFor(lang: Lang): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  const prefix = lang === 'en' ? 'en' : lang;
  const all = speechSynthesis.getVoices();
  const list = all.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (lang === 'en') list.sort((a, b) => Number(b.lang.endsWith('PK') || b.lang.endsWith('IN')) - Number(a.lang.endsWith('PK') || a.lang.endsWith('IN')));
  return list;
}

export function hasVoice(lang: Lang) {
  return voicesFor(lang).length > 0;
}

// Voices load asynchronously in some browsers.
if (canSpeak()) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
}

let clipManifest: Record<string, string> | null = null;
async function clips(): Promise<Record<string, string>> {
  if (clipManifest) return clipManifest;
  try {
    const res = await fetch('/audio/sd/manifest.json');
    clipManifest = res.ok ? ((await res.json()) as { clips: Record<string, string> }).clips ?? {} : {};
  } catch {
    clipManifest = {};
  }
  return clipManifest;
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
  currentAudio?.pause();
  currentAudio = null;
}

/** Play native Sindhi recordings (if they exist) without interrupting speech that is already queued. */
export async function playClips(ids: ClipId[]): Promise<boolean> {
  const m = await clips();
  const files = ids.map((id) => m[id]).filter(Boolean);
  if (!files.length) return false;
  for (const f of files) {
    await new Promise<void>((resolve) => {
      const a = new Audio(`/audio/sd/${f}`);
      currentAudio = a;
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
  }
  return true;
}

/**
 * Speak text. Returns how it was delivered: 'voice', 'clip' (pre-recorded Sindhi), or 'none'
 * (the caller then shows the "no voice" note; the text is always on screen anyway).
 */
export async function speak(text: string | string[], lang: Lang, clipIds: ClipId[] = []): Promise<'voice' | 'clip' | 'none'> {
  stopSpeaking();
  const parts = Array.isArray(text) ? text : [text];
  const voice = voicesFor(lang)[0];
  if (voice && canSpeak()) {
    for (const p of parts) {
      const u = new SpeechSynthesisUtterance(p);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.92;
      speechSynthesis.speak(u);
    }
    return 'voice';
  }
  if (lang === 'sd' && clipIds.length && (await playClips(clipIds))) return 'clip';
  return 'none';
}

/** Speak several lines in different languages one after another (e.g. the trilingual welcome). */
export function speakMany(items: { text: string; lang: Lang }[]): number {
  stopSpeaking();
  if (!canSpeak()) return 0;
  let spoken = 0;
  for (const it of items) {
    const voice = voicesFor(it.lang)[0];
    if (!voice) continue;
    const u = new SpeechSynthesisUtterance(it.text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.92;
    speechSynthesis.speak(u);
    spoken++;
  }
  return spoken;
}

// ---------- Speech recognition ----------

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function Recognition(): (new () => RecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
export const canListen = () => typeof window !== 'undefined' && Recognition() !== null;

/** Listen once. Sindhi is tried first; if the browser refuses Sindhi, Urdu recognition is used. */
export function listen(lang: Lang, onText: (text: string, final: boolean) => void, onEnd: (error?: string) => void): () => void {
  const R = Recognition();
  if (!R) {
    onEnd('unsupported');
    return () => undefined;
  }
  let triedFallback = false;
  let rec: RecognitionLike;
  const start = (tag: string) => {
    rec = new R();
    rec.lang = tag;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const r = e.results[e.results.length - 1];
      onText(r[0].transcript, r.isFinal);
    };
    rec.onerror = (e) => {
      if (e.error === 'language-not-supported' && lang === 'sd' && !triedFallback) {
        triedFallback = true;
        start(SPEECH_TAGS.ur);
        return;
      }
      onEnd(e.error);
    };
    rec.onend = () => onEnd();
    rec.start();
  };
  try {
    start(lang === 'sd' ? 'sd-IN' : SPEECH_TAGS[lang]);
  } catch {
    onEnd('failed');
  }
  return () => {
    try {
      rec?.abort();
    } catch {
      /* already stopped */
    }
  };
}
