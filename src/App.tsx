// The page is one botlings canvas, nothing to scroll. Bots are busy on it the way they are in the app:
// some work in their folders (one with subagents), three wait above the input, one naps, Rex is checking
// someone's work, the dictation pill sits at the bottom. Everything has the question-mark cursor; click
// something and Meety hops over and tells you what it is.
//
// The canvas has two fixed layouts (wide and tall) in their own units, scaled to fit the window, so
// every element keeps its place at any size.

import { useEffect, useState } from 'react';
import { Avatar, Bot, MEETY, NAPPER, PIP, REX, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';

type Id = 'shop' | 'api' | 'site' | 'nap' | 'rex' | 'ask' | 'question' | 'done' | 'input' | 'pill' | 'meety';

const SAY: Record<Id | 'hello', string> = {
  hello: 'Hi! I’m Meety. Click anything you see and I’ll tell you what it is.',
  shop: 'Every Claude Code session is a bot like this one. It works in its own folder, here editing a file, while you do something else.',
  api: 'This one split a big job. The little copies are its subagents, working in parallel.',
  site: 'Running the tests. When it’s done it comes over to you, you don’t have to keep checking.',
  nap: 'Napping. It’s waiting on a colleague and wakes up by itself when something new comes in.',
  rex: 'My older brother Rex. He checks a bot’s work against your rules and tests before it reaches you.',
  ask: 'This one wants to run a command. It waits until you allow it, nothing happens behind your back.',
  question: 'This one has a question for you. Answer it and it gets back to work.',
  done: 'Done. Click it in botlings and you read its answer, with every file it changed.',
  input: 'Type a job here and a new bot hatches. Or hold fn and just say it.',
  pill: 'The pill works in every app. Hold fn and talk, and your words appear as text, right on your Mac.',
  meety: 'That’s me. I keep your meetings. I listen on your Mac, and only the summary goes to Claude.',
};

const LABEL: Record<Id, string> = {
  shop: 'A bot working in its folder', api: 'A bot with subagents', site: 'A bot running tests', nap: 'A napping bot',
  rex: 'Rex, the reviewer', ask: 'A bot asking for permission', question: 'A bot with a question', done: 'A bot that is done',
  input: 'The input', pill: 'The dictation pill', meety: 'Meety',
};

const LOOKS: Record<string, Look> = {
  shop: { type: 'flower', color: '#ff8fb1' },
  api: { type: 'droid', color: '#8fe388' },
  site: { type: 'cat', color: '#ff9e6b' },
  checked: { type: 'ghost', color: '#b69cff' },
  ask: PIP,
  question: { type: 'blob', color: '#7cc4ff' },
  done: { type: 'pebble', color: '#5fd6c9' },
};

type Side = 'right' | 'left' | 'below' | 'above';

interface Layout {
  w: number;
  h: number;
  /** Where each thing sits (its anchor point: feet for bots, centre for the rest). */
  at: Record<Id | 'checked' | 'home', { x: number; y: number }>;
  inputWidth: number;
  /** Where Meety stands to explain each thing, and on which side of her the bubble goes (none: a strip). */
  spot: Record<Id | 'hello', { x: number; y: number; side?: Side }>;
}

const WIDE: Layout = {
  w: 1200, h: 700, inputWidth: 520,
  at: {
    shop: { x: 180, y: 170 }, api: { x: 560, y: 140 }, site: { x: 960, y: 170 },
    nap: { x: 1050, y: 400 }, rex: { x: 170, y: 400 }, checked: { x: 260, y: 400 },
    ask: { x: 520, y: 520 }, question: { x: 600, y: 520 }, done: { x: 680, y: 520 },
    input: { x: 600, y: 572 }, pill: { x: 600, y: 662 }, meety: { x: 600, y: 380 }, home: { x: 600, y: 380 },
  },
  spot: {
    hello: { x: 600, y: 380, side: 'right' }, meety: { x: 600, y: 380, side: 'right' },
    shop: { x: 270, y: 175, side: 'below' }, api: { x: 720, y: 150, side: 'below' }, site: { x: 1050, y: 175, side: 'below' },
    rex: { x: 360, y: 400, side: 'right' }, nap: { x: 930, y: 400, side: 'left' },
    ask: { x: 790, y: 522, side: 'right' }, question: { x: 790, y: 522, side: 'right' }, done: { x: 790, y: 522, side: 'right' },
    input: { x: 920, y: 600, side: 'below' }, pill: { x: 720, y: 672, side: 'right' },
  },
};
const TALL: Layout = {
  w: 400, h: 780, inputWidth: 360,
  at: {
    shop: { x: 90, y: 140 }, api: { x: 250, y: 120 }, site: { x: 110, y: 310 },
    nap: { x: 300, y: 320 }, rex: { x: 80, y: 470 }, checked: { x: 160, y: 470 },
    ask: { x: 130, y: 600 }, question: { x: 200, y: 600 }, done: { x: 270, y: 600 },
    input: { x: 200, y: 650 }, pill: { x: 200, y: 738 }, meety: { x: 300, y: 470 }, home: { x: 300, y: 470 },
  },
  // on a phone she still runs over, and what she says shows as a strip at the top or bottom
  spot: {
    hello: { x: 300, y: 470 }, meety: { x: 300, y: 470 },
    shop: { x: 170, y: 150 }, api: { x: 190, y: 225 }, site: { x: 200, y: 320 },
    rex: { x: 240, y: 470 }, nap: { x: 220, y: 330 },
    ask: { x: 340, y: 600 }, question: { x: 340, y: 600 }, done: { x: 340, y: 600 },
    input: { x: 340, y: 540 }, pill: { x: 300, y: 745 },
  },
};
/** The bubble's width on the wide canvas. */
const BUBBLE = 260;

const HEADER = 64;
const SIZE = 64;

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

const Folder = ({ name }: { name: string }) => (
  <span className="folder">
    <svg width="34" height="27" viewBox="0 0 40 32" fill="none" aria-hidden>
      <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
      <path d="M3 12h34" stroke="currentColor" strokeOpacity=".28" />
    </svg>
    {name}
  </span>
);

export function App() {
  const theme = useTheme();
  const view = useViewport();
  const layout = view.w / view.h < 0.9 ? TALL : WIDE;
  const scale = Math.min(view.w / layout.w, (view.h - HEADER) / layout.h);
  const [picked, setPicked] = useState<Id | null>(null);
  const at = layout.at;

  // Meety stands beside what you clicked, her bubble on the free side (a strip on a phone)
  const spot = layout.spot[picked ?? 'hello'];
  const meety = { x: spot.x, y: spot.y };
  const say = SAY[picked ?? 'hello'];
  const clampLeft = (left: number) => Math.max(12, Math.min(layout.w - BUBBLE - 12, left));
  const bubble: React.CSSProperties | null = !spot.side ? null
    : spot.side === 'right' ? { left: spot.x + 46, top: spot.y - 70 }
    : spot.side === 'left' ? { left: spot.x - 46 - BUBBLE, top: spot.y - 70 }
    : spot.side === 'below' ? { left: clampLeft(spot.x - BUBBLE / 2), top: spot.y + 36 }
    : { left: clampLeft(spot.x - BUBBLE / 2), top: spot.y - 84, transform: 'translateY(-100%)' };
  // the strip goes where it doesn't cover what she explains
  const stripTop = spot.y > layout.h / 2;

  // a thing you can click: the question-mark cursor, and Meety explains it
  const item = (id: Id, className: string, style: React.CSSProperties, children: React.ReactNode) => (
    <button className={`item ${className} ${picked === id ? 'picked' : ''} ${['ask', 'question', 'done'].includes(id) ? 'queued' : ''}`} style={style} onClick={() => setPicked(id)} aria-label={LABEL[id]}>
      {children}
    </button>
  );
  const bot = (id: Id, look: Look, x: number, y: number, state: 'working' | 'default' | 'sleeping', extra?: React.ReactNode, size = SIZE) =>
    item(id, 'thing', { left: x - size / 2, top: y - size, width: size }, (
      <>
        <Avatar look={look} size={size} state={state} theme={theme} />
        {extra}
      </>
    ));

  return (
    <div className="page">
      <header className="top">
        <span className="mark">botlings</span>
        <span className="line">Your Claude Code sessions, as little bots that come to you when they need you.</span>
        <a className="btn" href={DOWNLOAD_URL}>Download for Mac</a>
      </header>

      <main className="viewport" onClick={e => { if (e.target === e.currentTarget) setPicked(null); }}>
        <div className="canvas" style={{ width: layout.w, height: layout.h, transform: `translate(-50%, -50%) scale(${scale})` }}>
          {/* folders, and the bots working in them */}
          <span className="place" style={{ left: at.shop.x - 70, top: at.shop.y - 46 }}><Folder name="shop" /></span>
          {bot('shop', LOOKS.shop, at.shop.x, at.shop.y, 'working', <span className="activity">Editing cart.ts</span>)}

          <span className="place" style={{ left: at.api.x - 70, top: at.api.y - 46 }}><Folder name="api" /></span>
          {bot('api', LOOKS.api, at.api.x, at.api.y, 'working', (
            <>
              <span className="minis" aria-hidden>{[0, 1, 2].map(k => <Avatar key={k} look={LOOKS.api} size={24} state="working" theme={theme} />)}</span>
              <span className="activity">Searching the code</span>
            </>
          ))}

          <span className="place" style={{ left: at.site.x - 70, top: at.site.y - 46 }}><Folder name="site" /></span>
          {bot('site', LOOKS.site, at.site.x, at.site.y, 'working', <span className="activity">Running tests</span>)}

          {/* the nap spot */}
          {item('nap', 'nap', { left: at.nap.x - 70, top: at.nap.y - 62 }, (
            <>
              <span className="moon" aria-hidden>
                <svg width="26" height="22" viewBox="0 0 34 28" fill="none"><path d="M22.5 4.2A10.5 10.5 0 1 0 28.8 18 8.6 8.6 0 0 1 22.5 4.2z" fill="currentColor" opacity=".25" /></svg>
                Nap
              </span>
              <Avatar look={NAPPER} size={54} state="sleeping" theme={theme} />
              <span className="activity">Waiting on Sarah</span>
            </>
          ))}

          {/* Rex checking someone's work */}
          {item('rex', 'rex', { left: at.rex.x - 34, top: at.rex.y - 64 }, (
            <>
              <Avatar look={REX} size={58} theme={theme} state="working" />
              <span className="activity">Checking Lu’s work</span>
            </>
          ))}
          <span className="checked" style={{ left: at.checked.x - 26, top: at.checked.y - 52 }}><Avatar look={LOOKS.checked} size={52} theme={theme} /></span>

          {/* the bots waiting for you, above the input */}
          {bot('ask', LOOKS.ask, at.ask.x, at.ask.y, 'default', <span className="badge">!</span>)}
          {bot('question', LOOKS.question, at.question.x, at.question.y, 'default', <span className="badge">?</span>)}
          {bot('done', LOOKS.done, at.done.x, at.done.y, 'default', <span className="badge">✓</span>)}
          {item('input', 'input', { left: at.input.x - layout.inputWidth / 2, top: at.input.y - 8, width: layout.inputWidth }, <span>What should a new botling work on?</span>)}
          {item('pill', 'pill', { left: at.pill.x - 48, top: at.pill.y - 16 }, Array.from({ length: 11 }, (_, k) => <i key={k} style={{ animationDelay: `${(k % 6) * 80}ms` }} />))}

          {/* Meety: at home until you click something, then she runs over */}
          <Bot name="Meety" look={MEETY} x={meety.x} y={meety.y} size={72} theme={theme} state="default" showName={false} speed={1.8}
            onSelect={() => setPicked('meety')} label="Meety" />
          {bubble && (
            <div className={`say ${spot.side}`} key={picked ?? 'hello'} aria-live="polite" style={{ ...bubble, width: BUBBLE }}>
              {say}
              {picked === 'meety' && <a className="btn sm" href={DOWNLOAD_URL}>Download for Mac</a>}
            </div>
          )}
        </div>
        {!spot.side && (
          <div className={`strip ${stripTop ? 'top' : 'bottom'}`} key={picked ?? 'hello'} aria-live="polite">
            {say}
            {picked === 'meety' && <a className="btn sm" href={DOWNLOAD_URL}>Download for Mac</a>}
          </div>
        )}
      </main>
      <footer className="foot">
        <span>Free. For Macs with Apple chips and macOS 14 or later. Needs Claude Code. Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}
