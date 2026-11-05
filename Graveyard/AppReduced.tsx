// The page, as reduced as it gets: one line, a quiet canvas with three bots, and the one thing botlings
// is about. After a moment one bot comes forward and asks. You allow it, it goes back to work, and
// nothing needs you. If you don't answer, it waits, the way bots in botlings do.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, PIP, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';
import { reducedMotion } from './hop';

const OTHERS: Look[] = [
  { type: 'blob', color: '#7cc4ff' },
  { type: 'ghost', color: '#b69cff' },
];
/** How long the canvas stays still before Pip comes forward. */
const ASK_AFTER_MS = 2000;

type Step = 'still' | 'ask' | 'done';

function useTheme(): 'light' | 'dark' {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setDark(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return dark ? 'dark' : 'light';
}

/** The inner width of an element, kept current. */
function useWidth() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    observer.current = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.current.observe(el);
    setWidth(el.clientWidth);
  }, []);
  return { width, ref };
}

export function App() {
  const theme = useTheme();
  const [step, setStep] = useState<Step>(reducedMotion() ? 'ask' : 'still');
  useEffect(() => {
    if (step !== 'still') return;
    const t = window.setTimeout(() => setStep('ask'), ASK_AFTER_MS);
    return () => clearTimeout(t);
  }, [step]);

  const canvas = useWidth();
  const W = canvas.width || 1000;
  const small = W < 560;
  const size = small ? 56 : 68;
  // three bots resting across the upper canvas (two on a phone); Pip's place in front, where he asks
  const homes = small
    ? [{ x: W * 0.32, y: 150 }, { x: W * 0.68, y: 132 }]
    : [{ x: W * 0.3, y: 160 }, { x: W * 0.52, y: 136 }, { x: W * 0.72, y: 168 }];
  const front = { x: W / 2, y: small ? 330 : 360 };
  const pip = step === 'ask' ? front : homes[0];

  return (
    <div className="page">
      <header className="top">
        <span className="mark">botlings</span>
        <a className="btn" href={DOWNLOAD_URL}>Download for Mac</a>
      </header>
      <main>
        <h1>Your Claude Code sessions, as little bots that come to you when they need you.</h1>
        <section className="canvas" ref={canvas.ref} aria-label="A bot asks before it changes a file">
          <Bot name="Pip" look={PIP} x={pip.x} y={pip.y} size={size} theme={theme} state={step === 'done' ? 'working' : 'default'} showName={false} />
          {OTHERS.slice(0, homes.length - 1).map((look, k) => (
            <Bot key={k} name="A bot at work" look={look} x={homes[k + 1].x} y={homes[k + 1].y} size={size} theme={theme} state="working" showName={false} />
          ))}
          {step === 'ask' && (
            <div className="bubble" style={{ left: front.x, top: front.y - size - 16 }} role="group" aria-label="Pip asks">
              <p>May I edit README.md?</p>
              <button className="btn" onClick={() => setStep('done')} autoFocus={false}>Allow</button>
            </div>
          )}
          <p className={`calm ${step === 'done' ? 'shown' : ''}`} aria-live="polite">{step === 'done' ? 'Nothing needs you right now.' : ''}</p>
        </section>
      </main>
      <footer className="foot">
        <span>Free. For Macs with Apple chips and macOS 14 or later. Needs Claude Code. Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}
