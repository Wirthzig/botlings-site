// The page: a welcome screen, and below it one botlings canvas as the last thing on the page.
//
// The canvas lives the way the app does. Bots work in their folders (one with subagents), some wait above
// the input with what they need, one naps, Rex checks someone's work, the dictation pill sits at the
// bottom. Every few seconds something happens: a bot finishes and comes over, a new one hatches from the
// input, Rex lets one through and takes the next. Everything has the question-mark cursor; click it and
// Meety runs over and explains it, for the waiting ones with the real card from the app.
//
// Places are given in layout units (a wide and a tall layout) and spread over the whole screen; the things
// themselves keep their small size.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Bot, MEETY, NAPPER, PIP, REX, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';
import { reducedMotion } from './hop';
import { Sheet, type SheetId } from './Sheets';

type Status = 'working' | 'subagents' | 'ask' | 'question' | 'done' | 'nap' | 'review' | 'hatch' | 'gone';
type Folder = 'shop' | 'api' | 'site' | 'docs';

interface Botling {
  id: string;
  name: string;
  look: Look;
  status: Status;
  folder?: Folder;
  activity?: string;
}

const INITIAL: Botling[] = [
  { id: 'shop', name: 'Ada', look: { type: 'flower', color: '#ff8fb1' }, status: 'working', folder: 'shop', activity: 'Editing cart.ts' },
  { id: 'api', name: 'Oli', look: { type: 'droid', color: '#8fe388' }, status: 'subagents', folder: 'api', activity: 'Searching the code' },
  { id: 'site', name: 'Fenn', look: { type: 'cat', color: '#ff9e6b' }, status: 'working', folder: 'site', activity: 'Running tests' },
  { id: 'lu', name: 'Lu', look: { type: 'ghost', color: '#b69cff' }, status: 'review' },
  { id: 'pip', name: 'Pip', look: PIP, status: 'ask' },
  { id: 'mo', name: 'Mo', look: { type: 'blob', color: '#7cc4ff' }, status: 'question' },
  { id: 'kai', name: 'Kai', look: { type: 'pebble', color: '#5fd6c9' }, status: 'done' },
  { id: 'nap', name: 'Ivy', look: NAPPER, status: 'nap', activity: 'Waiting on Sarah' },
  { id: 'docs', name: 'Bo', look: { type: 'star', color: '#ffd36b' }, status: 'gone', folder: 'docs', activity: 'Writing notes.md' },
];

type Thing = 'input' | 'pill' | 'rex' | 'meety';

interface Layout {
  w: number;
  h: number;
  folders: Record<Folder, { x: number; y: number }>;
  nap: { x: number; y: number };
  rex: { x: number; y: number };
  review: { x: number; y: number };
  queue: { x: number; y: number; gap: number };
  input: { x: number; y: number; width: number };
  pill: { x: number; y: number };
  home: { x: number; y: number };
  /** Bubbles beside Meety; on a phone what she says is a strip instead. */
  bubbles: boolean;
}

const WIDE: Layout = {
  w: 1200, h: 700, bubbles: true,
  folders: { shop: { x: 180, y: 170 }, api: { x: 560, y: 140 }, site: { x: 960, y: 170 }, docs: { x: 390, y: 300 } },
  nap: { x: 1050, y: 400 }, rex: { x: 170, y: 400 }, review: { x: 260, y: 400 },
  queue: { x: 600, y: 520, gap: 80 }, input: { x: 600, y: 572, width: 420 }, pill: { x: 600, y: 662 }, home: { x: 600, y: 380 },
};
const TALL: Layout = {
  w: 400, h: 780, bubbles: false,
  folders: { shop: { x: 90, y: 140 }, api: { x: 250, y: 120 }, site: { x: 110, y: 310 }, docs: { x: 270, y: 225 } },
  nap: { x: 300, y: 330 }, rex: { x: 80, y: 470 }, review: { x: 160, y: 470 },
  queue: { x: 200, y: 585, gap: 62 }, input: { x: 200, y: 632, width: 320 }, pill: { x: 200, y: 706 }, home: { x: 300, y: 470 },
};

const SIZE = 40;
const BUBBLE = 230;
/** After a click, the canvas holds still this long so Meety's explanation stays true. */
const HOLD_MS = 14000;
const LOOP_MS = 30000;
const JOB = 'Write the release notes';

const SAY = {
  hello: 'Here they are at work. Click any bot or thing and I’ll tell you what it is.',
  working: 'Every Claude Code session is a bot like this one. It works in its own folder while you do something else.',
  tests: 'Running the tests. When it’s done it comes over to you, you don’t have to keep checking.',
  subagents: 'This one split a big job. The little copies are its subagents, working in parallel.',
  hatched: 'A new one, hatched from the input a moment ago. It’s writing the release notes in its own folder.',
  nap: 'Napping. It’s waiting on a colleague and wakes up by itself when something new comes in.',
  review: 'Rex is checking this one’s work against your rules and tests before it reaches you.',
  rex: 'My older brother Rex. He checks a bot’s work before it comes back to you.',
  input: 'Type a job here and a new bot hatches. Or hold fn and just say it.',
  pill: 'The pill works in every app. Hold fn and talk, and your words appear as text, right on your Mac.',
};

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

function useViewport() {
  const [v, setV] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return v;
}

const FolderIcon = ({ name }: { name: string }) => (
  <span className="folder">
    <svg width="24" height="19" viewBox="0 0 40 32" fill="none" aria-hidden>
      <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
      <path d="M3 12h34" stroke="currentColor" strokeOpacity=".28" />
    </svg>
    {name}
  </span>
);

const BADGE: Partial<Record<Status, '!' | '?' | '✓'>> = { ask: '!', question: '?', done: '✓' };
const WAITING: Status[] = ['ask', 'question', 'done'];

export function App() {
  const theme = useTheme();
  const view = useViewport();
  const layout = view.w / view.h < 0.9 ? TALL : WIDE;
  const W = view.w;
  const H = view.h;
  const px = (p: { x: number; y: number }) => ({ x: (p.x / layout.w) * W, y: (p.y / layout.h) * H });

  const [bots, setBots] = useState<Botling[]>(INITIAL);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const lastClick = useRef(0);
  const pick = (id: string | null) => {
    lastClick.current = Date.now();
    setPicked(id);
  };
  const update = (id: string, p: Partial<Botling>) => setBots(bs => bs.map(b => (b.id === id ? { ...b, ...p } : b)));

  // ---------- where everyone stands (layout units) ----------

  const queue = bots.filter(b => WAITING.includes(b.status));
  const napping = bots.filter(b => b.status === 'nap');
  const unitsOf = (b: Botling): { x: number; y: number } => {
    if (WAITING.includes(b.status)) {
      const k = queue.indexOf(b);
      return { x: layout.queue.x + (k - (queue.length - 1) / 2) * layout.queue.gap, y: layout.queue.y };
    }
    if (b.status === 'nap') return { x: layout.nap.x + napping.indexOf(b) * 44, y: layout.nap.y };
    if (b.status === 'review') return layout.review;
    if (b.status === 'hatch') return { x: layout.input.x, y: layout.input.y + 10 };
    const f = b.folder ? layout.folders[b.folder] : layout.home;
    const mates = bots.filter(x => x.folder === b.folder && (x.status === 'working' || x.status === 'subagents'));
    return { x: f.x + Math.max(0, mates.indexOf(b)) * 46, y: f.y };
  };
  const reviewed = bots.find(b => b.status === 'review');
  const folders = (Object.keys(layout.folders) as Folder[]).filter(f => f !== 'docs' || bots.some(b => b.folder === 'docs' && b.status !== 'gone' && b.status !== 'hatch'));

  // ---------- the canvas lives: a short story that repeats ----------

  useEffect(() => {
    if (reducedMotion()) return;
    const steps: [number, () => void][] = [
      [5000, () => update('site', { status: 'done', activity: undefined })],
      [9000, () => setTyped(JOB.slice(0, 1))],
      [11800, () => {
        setTyped('');
        update('docs', { status: 'hatch' });
      }],
      [12100, () => update('docs', { status: 'working' })],
      [18000, () => {
        update('lu', { status: 'done' });
        update('shop', { status: 'review' });
      }],
      // the story's own bots go back to the start; whoever you answered keeps their new job
      [26000, () => setBots(bs => bs.map(b => (['site', 'docs', 'lu', 'shop'].includes(b.id) ? INITIAL.find(x => x.id === b.id)! : b)))],
    ];
    const timers: number[] = [];
    const run = () => {
      for (const [at, fn] of steps) {
        timers.push(window.setTimeout(() => {
          // after a click the canvas holds still, so what Meety explains stays where it is
          if (Date.now() - lastClick.current < HOLD_MS) return;
          fn();
        }, at));
      }
      timers.push(window.setTimeout(run, LOOP_MS));
    };
    run();
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // the job types itself into the input before the new bot hatches
  useEffect(() => {
    if (!typed || typed.length >= JOB.length) return;
    const t = window.setTimeout(() => setTyped(JOB.slice(0, typed.length + 1)), 90);
    return () => clearTimeout(t);
  }, [typed]);

  // ---------- Meety ----------

  const thingAt: Record<Thing, { x: number; y: number }> = {
    input: { x: layout.input.x + layout.input.width / 2, y: layout.input.y }, pill: layout.pill, rex: layout.rex, meety: layout.home,
  };
  const pickedBot = picked ? bots.find(b => b.id === picked) : undefined;
  const spotFor = (): { x: number; y: number; side?: 'right' | 'left' | 'below' | 'above' } => {
    if (!picked || picked === 'meety') return { ...layout.home, side: layout.bubbles ? 'right' : undefined };
    if (!layout.bubbles) {
      const t = pickedBot ? unitsOf(pickedBot) : thingAt[picked as Thing];
      // in the row of waiting bots there is no room beside one: she stands just above it
      if (pickedBot && WAITING.includes(pickedBot.status)) return { x: t.x, y: t.y - 62 };
      return { x: Math.min(layout.w - 30, Math.max(30, t.x + 60)), y: t.y };
    }
    if (picked === 'input') return { x: 980, y: 640, side: 'above' };
    if (picked === 'pill') return { x: 720, y: 672, side: 'right' };
    if (picked === 'rex') return { x: 360, y: 400, side: 'right' };
    if (pickedBot && WAITING.includes(pickedBot.status)) {
      const last = layout.queue.x + ((queue.length - 1) / 2) * layout.queue.gap;
      return { x: last + 100, y: layout.queue.y, side: 'right' };
    }
    const t = pickedBot ? unitsOf(pickedBot) : layout.home;
    const right = t.x < layout.w * 0.62;
    const high = t.y < 260;
    return { x: t.x + (right ? 100 : -100), y: t.y + 4, side: high ? 'below' : right ? 'right' : 'left' };
  };
  const spotUnits = spotFor();
  const spot = { ...px(spotUnits), side: spotUnits.side };
  const clampLeft = (left: number) => Math.max(12, Math.min(W - BUBBLE - 12, left));
  const bubble: React.CSSProperties | null = !spot.side ? null
    : spot.side === 'right' ? { left: spot.x + 32, top: spot.y - 52 }
    : spot.side === 'left' ? { left: spot.x - 32 - BUBBLE, top: spot.y - 52 }
    : spot.side === 'below' ? { left: clampLeft(spot.x - BUBBLE / 2), top: spot.y + 28 }
    : { left: clampLeft(spot.x - BUBBLE / 2), top: spot.y - 62, transform: 'translateY(-100%)' };
  // the strip on a phone goes where it doesn't cover what she explains
  const stripTop = spot.y > H / 2;

  const answer = (b: Botling, next: Partial<Botling>) => {
    update(b.id, next);
    pick(null);
  };
  const talk = (): React.ReactNode => {
    if (picked === 'meety') {
      return (
        <>
          <p>That’s me. I keep your meetings, right on your Mac.</p>
          <div className="card mini">
            <p><b>You</b> Can we ship on Friday?</p>
            <p><b>Anna</b> If the tests pass on Thursday.</p>
            <p className="muted">Summary. Ship Friday, Anna runs the tests.</p>
          </div>
          <a className="btn sm" href={DOWNLOAD_URL} onClick={() => setSheet('install')}>Download for Mac</a>
        </>
      );
    }
    if (picked === 'input' || picked === 'pill' || picked === 'rex') return <p>{SAY[picked]}</p>;
    const b = pickedBot;
    if (!b) return <p>{SAY.hello}</p>;
    if (b.status === 'ask') {
      return (
        <>
          <p className="muted">{b.name} wants to run</p>
          <p className="mono">npm test</p>
          <p className="muted small">It waits until you allow it.</p>
          <div className="actions">
            <button className="btn sm quiet" onClick={() => answer(b, { status: 'done', activity: undefined })}>Deny</button>
            <button className="btn sm" onClick={() => answer(b, { status: 'working', folder: 'shop', activity: 'Running npm test' })}>Allow</button>
          </div>
        </>
      );
    }
    if (b.status === 'question') {
      return (
        <>
          <p className="muted">{b.name} asks</p>
          <p>Postgres or SQLite for the prototype?</p>
          <div className="actions">
            <button className="btn sm quiet" onClick={() => answer(b, { status: 'working', folder: 'api', activity: 'Setting up Postgres' })}>Postgres</button>
            <button className="btn sm" onClick={() => answer(b, { status: 'working', folder: 'api', activity: 'Setting up SQLite' })}>SQLite</button>
          </div>
        </>
      );
    }
    if (b.status === 'done') {
      const steps = ['Look at the new pricing page', 'Tell Anna it’s live'];
      return (
        <>
          <p className="muted">{b.name} is done</p>
          <p>Shortened the pricing page. Steps for you.</p>
          <ul className="ticks">
            {steps.map(s => {
              const key = `${b.id}${s}`;
              return <li key={s}><button className={ticks[key] ? 'on' : ''} onClick={() => setTicks(t => ({ ...t, [key]: !t[key] }))} aria-pressed={!!ticks[key]} aria-label={s} />{s}</li>;
            })}
          </ul>
          <div className="actions"><button className="btn sm" onClick={() => answer(b, { status: 'nap', activity: 'Resting' })}>Thanks</button></div>
        </>
      );
    }
    if (b.status === 'nap') return <p>{SAY.nap}</p>;
    if (b.status === 'review') return <p>{SAY.review}</p>;
    if (b.status === 'subagents') return <p>{SAY.subagents}</p>;
    if (b.id === 'docs') return <p>{SAY.hatched}</p>;
    if (b.activity === 'Running tests') return <p>{SAY.tests}</p>;
    return <p>{SAY.working}</p>;
  };

  // ---------- the first view: a ring round what you can click ----------

  const world = useRef<HTMLElement | null>(null);
  const [hinting, setHinting] = useState(false);
  useEffect(() => {
    const el = world.current;
    if (!el) return;
    const seen = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || e.intersectionRatio < 0.6) return;
      seen.disconnect();
      setHinting(true);
      window.setTimeout(() => setHinting(false), 3600);
    }, { threshold: [0, 0.6] });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  // ---------- the welcome screen: Meety hops in and offers to show you around ----------

  const guide = useRef<HTMLDivElement | null>(null);
  const [guideW, setGuideW] = useState(0);
  const measureGuide = useCallback((el: HTMLDivElement | null) => {
    guide.current = el;
    if (el) setGuideW(el.clientWidth);
  }, []);
  const [arrived, setArrived] = useState(false);
  const [offer, setOffer] = useState<'ask' | 'later' | 'going'>('ask');
  useEffect(() => {
    const t = window.setTimeout(() => setArrived(true), 900);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => setGuideW(guide.current?.clientWidth ?? 0), [view.w]);
  const showMe = () => {
    setOffer('going');
    setPicked(null);
    world.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const download = (className = 'btn') => <a className={className} href={DOWNLOAD_URL} onClick={() => setSheet('install')}>Download for Mac</a>;
  // the order the hint ring goes round in
  let order = 0;
  const hint = () => ({ ['--k' as string]: order++ });

  return (
    <>
      <section className="welcome">
        <header className="top">
          <span className="mark">botlings</span>
          {/* the small print behind an i beside the download: shows on hover, and on a tap for touch screens */}
          <span className={`info ${infoOpen ? 'open' : ''}`}>
            <button className="info-i" aria-label="What you need" aria-expanded={infoOpen} onClick={() => setInfoOpen(o => !o)} onBlur={() => setInfoOpen(false)}>i</button>
            <span className="info-card" role="tooltip">
              <span>Free. For Macs with Apple chips and macOS 14 or later. Needs Claude Code.</span>
              <span>No account. No tracking. Dictation stays on your Mac.</span>
            </span>
          </span>
          {download()}
        </header>
        <div className="hello">
          <button className="news" onClick={() => setSheet('new')}>New in 0.3.3. Meety prepares your meetings.</button>
          <h1>Your Claude Code sessions, as little botlings<img className="h1-bot" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" /></h1>
        </div>
        <div className="guide" ref={measureGuide}>
          {guideW > 0 && (
            <Bot name="Meety" look={MEETY} x={arrived ? guideW / 2 - 150 : guideW + 80} y={64} size={52} theme={theme} state="default" showName={false} speed={1.4} label="Meety" />
          )}
          {arrived && offer !== 'going' && (
            <div className="say right offer" style={{ left: guideW / 2 - 112, top: 8 }} aria-live="polite">
              {offer === 'ask' ? (
                <>
                  I’m Meety, I look after the bots in botlings. Want me to show you around?
                  <span className="offer-actions">
                    <button className="btn sm quiet" onClick={() => setOffer('later')}>Not now</button>
                    <button className="btn sm" onClick={showMe}>Show me</button>
                  </span>
                </>
              ) : 'Okay! The arrow below takes you there whenever you like.'}
            </div>
          )}
        </div>
        <button className="next" onClick={() => world.current?.scrollIntoView({ behavior: 'smooth' })} aria-label="See them at work">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 3.5v11M4.5 10 9 14.5 13.5 10" /></svg>
        </button>
      </section>

      <section className={`world ${hinting ? 'hinting' : ''}`} ref={world} onClick={e => { if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas')) pick(null); }}>
        <div className="canvas" style={{ width: W, height: H }}>
          {folders.map(f => {
            const p = px(layout.folders[f]);
            return <span key={f} className="place" style={{ left: p.x - 52, top: p.y - 32 }}><FolderIcon name={f} /></span>;
          })}

          {(() => {
            const p = px(layout.nap);
            return (
              <span className="place moon" style={{ left: p.x - 24, top: p.y - 64 }}>
                <svg width="18" height="15" viewBox="0 0 34 28" fill="none" aria-hidden><path d="M22.5 4.2A10.5 10.5 0 1 0 28.8 18 8.6 8.6 0 0 1 22.5 4.2z" fill="currentColor" opacity=".25" /></svg>
                Nap
              </span>
            );
          })()}

          {(() => {
            const p = px(layout.rex);
            return (
              <button className={`item rex ${picked === 'rex' ? 'picked' : ''}`} style={{ left: p.x - 21, top: p.y - 42, ...hint() }} onClick={() => pick('rex')} aria-label="Rex, the reviewer">
                <Avatar look={REX} size={38} theme={theme} state={reviewed ? 'working' : 'default'} />
                <span className="activity">{reviewed ? `Checking ${reviewed.name}’s work` : 'Waiting for work'}</span>
              </button>
            );
          })()}

          {bots.map(b => {
            const p = px(unitsOf(b));
            const waits = WAITING.includes(b.status);
            return (
              <Bot key={b.id} name={b.name} look={b.look} x={p.x} y={p.y} size={b.status === 'nap' ? 34 : SIZE} theme={theme} showName={false}
                state={b.status === 'nap' ? 'sleeping' : b.status === 'working' || b.status === 'subagents' ? 'working' : 'default'}
                hidden={b.status === 'gone'} speed={1.2} badge={BADGE[b.status]}
                className={`item thing ${waits ? 'queued' : ''} ${picked === b.id ? 'picked' : ''}`} style={hint()}
                label={`${b.name}${waits ? `, ${b.status === 'ask' ? 'asking for permission' : b.status === 'question' ? 'with a question' : 'done'}` : ''}`}
                onSelect={b.status === 'gone' ? undefined : () => pick(b.id)}>
                {b.status === 'subagents' && <span className="minis" aria-hidden>{[0, 1, 2].map(n => <Avatar key={n} look={b.look} size={16} state="working" theme={theme} />)}</span>}
                {(b.status === 'working' || b.status === 'subagents' || b.status === 'nap') && b.activity && <span className="activity">{b.activity}</span>}
              </Bot>
            );
          })}

          {(() => {
            const p = px(layout.input);
            return (
              <button className={`item input ${picked === 'input' ? 'picked' : ''}`} style={{ left: p.x - layout.input.width / 2, top: p.y - 8, width: layout.input.width, ...hint() }} onClick={() => pick('input')} aria-label="The input">
                <span className={typed ? 'typed' : ''}>{typed || 'What should a new botling work on?'}</span>
              </button>
            );
          })()}
          {(() => {
            const p = px(layout.pill);
            return (
              <button className={`item pill ${picked === 'pill' ? 'picked' : ''}`} style={{ left: p.x - 34, top: p.y - 11, ...hint() }} onClick={() => pick('pill')} aria-label="The dictation pill">
                {Array.from({ length: 11 }, (_, n) => <i key={n} style={{ animationDelay: `${(n % 6) * 80}ms` }} />)}
              </button>
            );
          })()}

          <Bot name="Meety" look={MEETY} x={spot.x} y={spot.y} size={46} theme={theme} state="default" showName={false} speed={1.8}
            onSelect={() => pick('meety')} label="Meety" className="item" />
          {bubble && (
            <div className={`say ${spot.side}`} key={`${picked ?? 'hello'}${pickedBot?.status ?? ''}`} aria-live="polite" style={{ ...bubble, width: BUBBLE }}>
              {talk()}
            </div>
          )}
        </div>
        {!spot.side && (
          <div className={`strip ${stripTop ? 'at-top' : 'at-bottom'}`} key={`${picked ?? 'hello'}${pickedBot?.status ?? ''}`} aria-live="polite">
            {talk()}
          </div>
        )}
        <footer className="foot">
          <span>Not affiliated with Anthropic.</span>
          <nav>
            <button onClick={() => setSheet('features')}>Features</button>
            <button onClick={() => setSheet('faq')}>Questions</button>
            <button onClick={() => setSheet('new')}>What’s new</button>
            <button onClick={() => setSheet('privacy')}>Privacy</button>
            <button onClick={() => setSheet('imprint')}>Imprint</button>
            <button onClick={() => setSheet('notices')}>Notices</button>
          </nav>
        </footer>
      </section>

      {sheet && <Sheet id={sheet} onClose={() => setSheet(null)} />}
    </>
  );
}
