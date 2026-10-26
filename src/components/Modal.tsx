import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import { usePrefs } from '../lib/prefs.tsx';

/** Accessible modal built on the native <dialog> element (focus handling and Escape for free). */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = usePrefs();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="modal-title"
      className="m-auto w-[min(92vw,560px)] rounded-3xl border border-line bg-solid p-0 text-ink shadow-2xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="text-2xl font-bold">
            {title}
          </h2>
          <button className="btn btn-ghost min-h-11 px-3" onClick={onClose} aria-label={t('common.close')}>
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
