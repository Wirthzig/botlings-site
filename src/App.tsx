// The page scrolls like any page. Down it are windows that look like botlings itself. Meety follows you:
// whichever window is in the middle of the screen, she hops over to it, sits beside it and says what it
// is in one sentence. Nothing is pinned and nothing fades in with the scroll; only Meety moves.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bot, MEETY } from './Bot';
import { DOWNLOAD_URL } from './config';
import { AskView, CanvasView, DictationView, MeetingView, NapView, ReviewView } from './Views';

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

interface Part {
  id: string;
  say: string;
  /** Which side the window sits on; Meety takes the other. */
  side: 'left' | 'right';
}

const PARTS: Part[] = [
  { id: 'hello', say: 'Hi! I’m Meety. Scroll down, I’ll show you around.', side: 'left' },
  { id: 'canvas', say: 'Every Claude Code session becomes a little bot. It works in its own folder.', side: 'left' },
  { id: 'ask', say: 'When one needs you, it comes over and asks. You answer, it gets back to work.', side: 'right' },
  { id: 'nap', say: 'Waiting on a colleague? Let a bot nap. It wakes up when something new comes in.', side: 'left' },
  { id: 'review', say: 'My older brother Rex checks the work against your rules and tests before it reaches you.', side: 'right' },
  { id: 'dictation', say: 'Hold fn and talk, in any app. Your words turn into text right on your Mac.', side: 'left' },
  { id: 'meeting', say: 'And I keep your meetings. I listen on your Mac, and only the summary goes to Claude.', side: 'right' },
  { id: 'end', say: 'That’s botlings. Want me on your Mac?', side: 'left' },
];

export function App() {
  const theme = useTheme();
  const main = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);
  const [, remeasure] = useState(0);

  // whichever part's window is nearest the middle of the screen is the one Meety explains
  useEffect(() => {
    let frame = 0;
    let settle = 0;
    const pick = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let best = 0;
      let bestD = Infinity;
      document.querySelectorAll<HTMLElement>('[data-part]').forEach((el, k) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      });
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) best = PARTS.length - 1;
      // she waits until the scrolling calms down a little, so she doesn't hop back and forth
      clearTimeout(settle);
      settle = window.setTimeout(() => setActive(best), 140);
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };
    const resize = () => remeasure(n => n + 1);
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', resize);
    pick();
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, []);
  useLayoutEffect(() => remeasure(n => n + 1), []);

  // where she sits: beside the active window, on its free side (above it on a phone)
  const small = window.innerWidth < 760;
  const size = small ? 60 : 76;
  const box = main.current?.getBoundingClientRect();
  const anchor = main.current?.querySelectorAll<HTMLElement>('[data-part] .anchor')[active]?.getBoundingClientRect();
  let at = { x: -400, y: 200 };
  let bubbleSide: 'left' | 'right' = 'right';
  if (box && anchor) {
    const top = anchor.top - box.top;
    if (small) at = { x: 16 + size / 2, y: top - 12 };
    else if (PARTS[active].side === 'left') at = { x: anchor.right - box.left + 72, y: top + 150 };
    else {
      at = { x: anchor.left - box.left - 72, y: top + 150 };
      bubbleSide = 'left';
    }
  }
  const part = PARTS[active];

  return (
    <div className="page">
      <header className="top">
        <span className="mark">botlings</span>
        <a className="btn" href={DOWNLOAD_URL}>Download for Mac</a>
      </header>

      <main ref={main}>
        <section className="part hero" data-part="hello">
          <div className="anchor hero-anchor">
            <h1>Your Claude Code sessions, as little bots that come to you when they need you.</h1>
          </div>
        </section>
        <section className="part left" data-part="canvas"><div className="anchor"><CanvasView theme={theme} /></div></section>
        <section className="part right" data-part="ask"><div className="anchor"><AskView theme={theme} /></div></section>
        <section className="part left" data-part="nap"><div className="anchor"><NapView theme={theme} /></div></section>
        <section className="part right" data-part="review"><div className="anchor"><ReviewView theme={theme} live={part.id === 'review'} /></div></section>
        <section className="part left" data-part="dictation"><div className="anchor"><DictationView live={part.id === 'dictation'} /></div></section>
        <section className="part right" data-part="meeting"><div className="anchor"><MeetingView live={part.id === 'meeting'} /></div></section>
        <section className="part end" data-part="end">
          <div className="anchor end-anchor">
            <a className="btn big" href={DOWNLOAD_URL}>Download for Mac</a>
            <p className="muted">Free. For Macs with Apple chips and macOS 14 or later. Needs Claude Code.</p>
          </div>
        </section>

        <Bot name="Meety" look={MEETY} x={at.x} y={at.y} size={size} theme={theme} state="default" showName={false} />
        <div className={`say ${bubbleSide}`} key={active}
          style={small ? { left: at.x + size / 2 + 10, top: at.y } : bubbleSide === 'right' ? { left: at.x + size / 2 + 14, top: at.y - size } : { right: (box?.width ?? 0) - at.x + size / 2 + 14, top: at.y - size }}
          aria-live="polite">
          {part.say}
        </div>
      </main>

      <footer className="foot">
        <span>Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}
