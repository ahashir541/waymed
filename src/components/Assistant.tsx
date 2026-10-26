// Floating talkative assistant: speak or type, hear and read the answer, tap suggestion chips.
// Navigation, facilities and appointments only; never medical advice.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { AssistantReply } from '../lib/types.ts';
import { usePrefs } from '../lib/prefs.tsx';
import { useBackend, useHospital, useSavedToken } from '../lib/store.tsx';
import { answerRules, defaultChips, replyLanguage } from '../lib/assistantRules.ts';
import { loadDictionary } from '../lib/i18n/core.ts';
import { ApiError } from '../lib/backend/types.ts';
import { canListen, listen, speak, stopSpeaking } from '../lib/voice.ts';
import { Icon } from './Icon.tsx';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  reply?: AssistantReply;
}

import { currentPlace } from '../lib/place.ts';
export { currentPlace };

export function Assistant({ inline = false, floating = false }: { inline?: boolean; floating?: boolean } = {}) {
  const { t, lang } = usePrefs();
  const backend = useBackend();
  const { data } = useHospital();
  const saved = useSavedToken();
  const navigate = useNavigate();
  const [open, setOpen] = useState(inline);
  // On phones the floating assistant opens from the bottom navigation ("Ask"), not a floating button.
  useEffect(() => {
    if (!floating) return;
    const toggle = () => setOpen((o) => !o);
    addEventListener('wm:ask', toggle);
    return () => removeEventListener('wm:ask', toggle);
  }, [floating]);
  useEffect(() => {
    if (floating) dispatchEvent(new CustomEvent('wm:ask-state', { detail: open }));
  }, [floating, open]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [note, setNote] = useState('');
  const stopRef = useRef<() => void>(() => undefined);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ role: 'assistant', text: t('assistant.hello'), reply: { reply: t('assistant.hello'), chips: defaultChips(lang), action: null, category: 'greeting', source: 'rules' } }]);
  }, [open, msgs.length, t, lang]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);
  useEffect(() => () => stopRef.current(), []);

  function act(r: AssistantReply) {
    const from = currentPlace();
    const a = r.action;
    if (!a) return;
    if (a.type === 'emergency') navigate(`/emergency?from=${from}`);
    else if (a.type === 'route') navigate(`/g/${a.dest}?from=${from}`);
    else if (a.type === 'book') navigate(`/book${a.deptId ? `?dept=${a.deptId}` : ''}`);
    else if (a.type === 'token') navigate(`/t/${a.tokenId}`);
    else if (a.type === 'lost') navigate(`/w/${from}`);
  }

  async function send(text: string) {
    const q = text.trim().slice(0, 300);
    if (!q || busy) return;
    setInput('');
    setNote('');
    const history = msgs.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setBusy(true);
    // Answer in the language of the question (e.g. Sindhi typed or spoken on an English screen).
    const rl = replyLanguage(q, lang);
    let r: AssistantReply;
    try {
      r = await backend.ask({ lang: rl, message: q, history, tokenId: saved?.id, from: currentPlace() });
    } catch (e) {
      // Offline, rate-limited or server down: answer locally with the same rules.
      await loadDictionary(rl);
      r = answerRules(q, { data, lang: rl, from: currentPlace(), token: null });
      if (e instanceof ApiError && e.status === 429) r = { ...r, reply: t('assistant.ans.limit'), action: null };
    } finally {
      setBusy(false);
    }
    setMsgs((m) => [...m, { role: 'assistant', text: r.reply, reply: r }]);
    if (voiceOn) {
      const how = await speak(r.reply, rl, r.action?.type === 'emergency' ? ['emergency'] : []);
      if (how === 'none') setNote(t('guide.voiceMissing'));
    }
    if (r.action?.type === 'emergency') act(r);
  }

  function mic() {
    if (listening) {
      stopRef.current();
      setListening(false);
      return;
    }
    if (!canListen()) {
      setNote(t('assistant.micUnsupported'));
      return;
    }
    stopSpeaking();
    setListening(true);
    stopRef.current = listen(
      lang,
      (text, final) => {
        setInput(text);
        if (final) {
          setListening(false);
          void send(text);
        }
      },
      (err) => {
        setListening(false);
        if (err && err !== 'aborted' && err !== 'no-speech') setNote(t('assistant.micUnsupported'));
      },
    );
  }

  const last = [...msgs].reverse().find((m) => m.reply)?.reply;

  return (
    <>
      {!inline && (
      <button
        className={
          floating
            ? 'no-print fixed bottom-6 end-6 z-40 hidden h-12 items-center gap-2 rounded-full bg-accent px-4 text-base font-bold text-on-accent shadow-[0_10px_30px_-8px_rgba(224,168,0,0.6)] transition-transform hover:scale-105 md:flex'
            : 'no-print fixed bottom-4 end-4 z-40 flex min-h-16 items-center gap-2 rounded-full bg-accent px-5 text-lg font-bold text-on-accent shadow-xl transition-transform hover:scale-105'
        }
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="wm-assistant"
      >
        <Icon name={open ? 'x' : 'mic'} size={floating ? 22 : 28} />
        <span className="sr-only sm:not-sr-only">{t('assistant.open')}</span>
      </button>
      )}
      {open && (
        <section
          id="wm-assistant"
          aria-label={t('assistant.title')}
          className={
            inline
              ? 'flex h-[max(460px,calc(100dvh-240px))] flex-col overflow-hidden rounded-2xl border border-line bg-surface md:h-[min(72dvh,620px)]'
              : floating
                ? 'no-print v-pop fixed inset-x-2 bottom-[calc(66px+env(safe-area-inset-bottom))] z-40 flex h-[min(76dvh,600px)] flex-col overflow-hidden rounded-3xl border border-line bg-solid shadow-2xl md:inset-x-auto md:bottom-24 md:end-6 md:w-[400px]'
                : 'no-print glass fade-up fixed bottom-24 end-3 z-40 flex max-h-[min(78vh,720px)] w-[min(94vw,440px)] flex-col overflow-hidden rounded-3xl bg-solid/95'
          }
        >
          <header className="border-b border-line p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{t('assistant.title')}</h2>
              <span className="flex items-center gap-1">
              <button className="btn btn-ghost min-h-11 px-3" aria-pressed={voiceOn} onClick={() => (setVoiceOn(!voiceOn), stopSpeaking())} title={t('common.listen')}>
                <Icon name="speaker" />
                <span className="sr-only">{t('common.listen')}</span>
                {!voiceOn && <Icon name="x" size={16} />}
              </button>
              {floating && (
                <button className="btn btn-ghost min-h-11 px-3 md:hidden" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                  <Icon name="x" />
                </button>
              )}
              </span>
            </div>
            <p className="text-base text-muted">{t('assistant.label')}</p>
            {last?.source === 'rules' && msgs.length > 1 && <p className="text-base font-semibold text-accent">{t('assistant.rulesMode')}</p>}
          </header>
          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-lg ${m.role === 'user' ? 'bg-accent text-on-accent' : 'border border-line bg-solid'}`}>
                  {m.text}
                  {m.reply?.action && m.reply.action.type !== 'emergency' && (
                    <button className="btn btn-primary mt-2 w-full" onClick={() => act(m.reply!)}>
                      <Icon name={m.reply.action.type === 'book' ? 'calendar' : m.reply.action.type === 'token' ? 'ticket' : 'route'} />
                      {m.reply.action.type === 'book' ? t('assistant.openBooking') : m.reply.action.type === 'token' ? t('assistant.openToken') : t('assistant.showRoute')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="text-muted">{t('common.loading')}</p>}
          </div>
          {last?.chips?.length ? (
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto border-t border-line p-3">
              {last.chips.map((c) => (
                <button key={c} className="chip max-w-full text-base" onClick={() => void send(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null}
          {note && (
            <p role="status" className="px-4 pb-1 text-base text-muted">
              {note}
            </p>
          )}
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <button type="button" className={`btn min-w-12 px-3 ${listening ? 'btn-danger' : ''}`} onClick={mic} aria-pressed={listening} aria-label={t('assistant.mic')}>
              <Icon name="mic" />
            </button>
            <label className="sr-only" htmlFor="wm-ask">
              {t('assistant.placeholder')}
            </label>
            <input id="wm-ask" className="field" value={input} maxLength={300} onChange={(e) => setInput(e.target.value)} placeholder={listening ? t('assistant.listening') : t('assistant.placeholder')} autoComplete="off" />
            <button className="btn btn-primary min-w-12 px-3" disabled={busy || !input.trim()} aria-label={t('assistant.send')}>
              <Icon name="send" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
