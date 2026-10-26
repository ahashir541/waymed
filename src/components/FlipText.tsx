import { useEffect, useRef, useState } from 'react';

/** Departure-board style characters that flip when the text changes. */
export function FlipText({ text, length, className = '' }: { text: string; length?: number; className?: string }) {
  const padded = length ? text.padEnd(length, ' ').slice(0, length) : text;
  const [shown, setShown] = useState(padded);
  const [flipping, setFlipping] = useState<boolean[]>([]);
  const prev = useRef(padded);
  useEffect(() => {
    if (prev.current === padded) return;
    const old = prev.current;
    prev.current = padded;
    setFlipping(padded.split('').map((c, i) => c !== old[i]));
    const id = setTimeout(() => setShown(padded), 250);
    const id2 = setTimeout(() => setFlipping([]), 520);
    return () => {
      clearTimeout(id);
      clearTimeout(id2);
    };
  }, [padded]);
  return (
    <span className={`ltr inline-flex ${className}`} aria-label={text.trim() || '-'}>
      {shown.split('').map((c, i) => (
        <span key={i} className={`flap ${flipping[i] ? 'flipping' : ''}`} aria-hidden="true">
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  );
}
