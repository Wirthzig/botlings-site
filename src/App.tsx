// The page is the botlings canvas. A bot waits above the input. Give it a job (or wait a moment and the
// page types one itself): it hops to its folder, works, comes back and answers, and its answer is what
// botlings is, with the download in it. Every further job hatches another bot from the input, up to a
// few, each coming back with one more thing botlings does.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bot, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';
import { reducedMotion } from './hop';

type Where = 'queue' | 'work' | 'egg';

interface Botling {
  id: string;
  name: string;
  look: Look;
  where: Where;
  answer: Answer | null;
}

type Answer = 'pitch' | number;

const FIRST_TASK = 'Tidy up the README';
const WORK_MS = 2600;
/** How long the page waits for you before it gives the first job itself. */
const AUTOPLAY_AFTER_MS = 2800;
const TYPE_MS = 55;
const MAX_BOTS = 5;

const PITCH = 'I’m a botling. I run Claude Code for you, one bot per job, right on your Mac. I work in your folders, come back when I need you, and take a nap while you wait on someone else.';

/** What the bots after the first one come back with. */
const FACTS = [
  'Hold fn and talk to me. What you say becomes text on your Mac, nothing leaves it.',
  'Want my work checked first? My older brother reviews it against your rules and your tests before it reaches you.',
  'Meety keeps your meetings. It listens on your Mac and only the summary goes to Claude.',
  'You bring your own Claude, a subscription or an API key. botlings never sees your login.',
];

const NAMES = ['Pip', 'Mo', 'Lu', 'Kai', 'Fenn'];
const LOOKS: Look[] = [
  { type: 'clover', color: '#ffd36b' },
  { type: 'blob', color: '#7cc4ff' },
  { type: 'flower', color: '#ff8fb1' },
  { type: 'ghost', color: '#8fe388', hat: 'beanie' },
  { type: 'cat', color: '#b69cff' },
];

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

/** Re-measures whenever the window or one of the watched elements changes size. */
function useLayoutTick() {
  const [tick, setTick] = useState(0);
  // made on first use: the elements hand themselves in through their refs before any effect runs
  const observer = useRef<ResizeObserver | null>(null);
  const watch = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    observer.current ??= new ResizeObserver(() => setTick(t => t + 1));
    observer.current.observe(el);
  }, []);
  useEffect(() => {
    const on = () => setTick(t => t + 1);
    window.addEventListener('resize', on);
    return () => {
      observer.current?.disconnect();
      window.removeEventListener('resize', on);
    };
  }, []);
  return { tick, watch };
}

export function App() {
  const theme = useTheme();
  const [bots, setBots] = useState<Botling[]>([{ id: 'b0', name: NAMES[0], look: LOOKS[0], where: 'queue', answer: null }]);
  const [shown, setShown] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const facts = useRef(0);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const { tick, watch } = useLayoutTick();
  const queueRef = useRef<HTMLDivElement | null>(null);
  const folderRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [, force] = useState(0);
  // measure once more after the first paint, when the elements have their size
  useLayoutEffect(() => force(n => n + 1), [tick]);

  const small = window.innerWidth < 640;
  const size = small ? 58 : 72;

  /** A job for a bot: the waiting first one, then a new one from the input, then whoever waits longest. */
  const give = (task: string) => {
    if (!task.trim()) return;
    setText('');
    setBots(prev => {
      const idle = prev.filter(b => b.where === 'queue');
      let id: string;
      let next = prev;
      const fresh = !prev.some(b => b.answer !== null) && idle.length ? idle[0] : null;
      if (fresh) {
        id = fresh.id;
      } else if (prev.length < MAX_BOTS) {
        const k = prev.length;
        id = `b${k}`;
        next = [...prev, { id, name: NAMES[k], look: LOOKS[k], where: 'egg', answer: null }];
      } else if (idle.length) {
        id = idle[0].id;
      } else {
        return prev;
      }
      const answer: Answer = prev.every(b => b.answer === null) ? 'pitch' : facts.current++ % FACTS.length;
      // out of the input first (a new one), then to the folder on the next frame, so it hops
      requestAnimationFrame(() => setBots(p => p.map(b => (b.id === id ? { ...b, where: 'work' } : b))));
      later(() => {
        setBots(p => p.map(b => (b.id === id ? { ...b, where: 'queue', answer } : b)));
        setShown(id);
      }, reducedMotion() ? 300 : WORK_MS);
      return next;
    });
  };

  // nobody started yet: the page gives the first job itself, typed out like you would
  useEffect(() => {
    if (touched) return;
    const start = window.setTimeout(() => {
      if (reducedMotion()) return give(FIRST_TASK);
      let i = 0;
      const typing = window.setInterval(() => {
        i++;
        setText(FIRST_TASK.slice(0, i));
        if (i >= FIRST_TASK.length) {
          clearInterval(typing);
          later(() => give(FIRST_TASK), 420);
        }
      }, TYPE_MS);
      timers.current.push(typing);
    }, AUTOPLAY_AFTER_MS);
    return () => clearTimeout(start);
  }, [touched]); // eslint-disable-line react-hooks/exhaustive-deps
  const takeOver = () => {
    if (touched) return;
    setTouched(true);
    timers.current.forEach(clearTimeout);
    timers.current.forEach(clearInterval);
    timers.current = [];
    setText('');
  };

  // where everyone stands
  const q = queueRef.current?.getBoundingClientRect();
  const f = folderRef.current?.getBoundingClientRect();
  const inp = inputRef.current?.getBoundingClientRect();
  const waiting = bots.filter(b => b.where === 'queue');
  const working = bots.filter(b => b.where === 'work');
  const gap = size + 22;
  const spot = (b: Botling): { x: number; y: number } => {
    if (b.where === 'queue' && q) {
      const k = waiting.indexOf(b);
      return { x: q.left + q.width / 2 + (k - (waiting.length - 1) / 2) * gap, y: q.bottom - 22 };
    }
    if (b.where === 'work' && f) {
      const k = working.indexOf(b);
      return { x: f.right + 18 + size / 2 + k * (size * 0.8), y: f.top + f.height / 2 + size / 2 - 6 };
    }
    return inp ? { x: inp.left + inp.width / 2, y: inp.top + inp.height / 2 + size / 2 } : { x: -200, y: -200 };
  };
  const current = bots.find(b => b.id === shown && b.answer !== null && b.where === 'queue') ?? null;

  return (
    <main className="stage">
      <header className="top">
        <span className="mark">botlings</span>
        <a className="btn strong" href={DOWNLOAD_URL}>Download</a>
      </header>

      <div className="folder" ref={el => { folderRef.current = el; watch(el); }} aria-hidden>
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
          <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".14" />
          <path d="M3 12h34" stroke="currentColor" strokeOpacity=".22" />
        </svg>
        <span>your-project</span>
      </div>

      <div className="stack" ref={watch}>
        <div className="queue" ref={el => { queueRef.current = el; watch(el); }} />
        {current && (
          <section className="answer" key={current.id} aria-live="polite">
            {current.answer === 'pitch' ? (
              <>
                <p>{PITCH}</p>
                <p>My older brother checks my work before you see it, and Meety keeps your meetings.</p>
                <div className="actions">
                  <a className="btn strong" href={DOWNLOAD_URL}>Download for Mac</a>
                </div>
              </>
            ) : (
              <p>{FACTS[current.answer as number]}</p>
            )}
          </section>
        )}
        <form className="composer" onSubmit={e => { e.preventDefault(); takeOver(); give(text); }}>
          <input
            ref={el => { inputRef.current = el; watch(el); }}
            value={text}
            onChange={e => { takeOver(); setText(e.target.value); }}
            onFocus={takeOver}
            placeholder={small ? 'Give a botling a job' : 'What should a new botling work on?'}
            aria-label="Give a botling a job"
            maxLength={120}
          />
          <button className="send" type="submit" aria-label="Send" disabled={!text.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" /></svg>
          </button>
        </form>
      </div>

      <div className="bots">
        {bots.map(b => {
          const at = spot(b);
          return (
            <Bot key={b.id} name={b.name} look={b.look} x={at.x} y={at.y} size={b.where === 'work' ? size * 0.82 : size}
              state={b.where === 'work' ? 'working' : 'default'} theme={theme} hidden={b.where === 'egg'}
              selected={current?.id === b.id} onSelect={b.answer !== null && b.where === 'queue' ? () => setShown(b.id) : undefined} />
          );
        })}
      </div>

      <footer className="foot">
        <span>For Macs with Apple chips and macOS 14 or later. You bring your own Claude.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </main>
  );
}
