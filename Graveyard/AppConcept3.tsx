// The page: from noise to calm. First what several Claude Code sessions look like today, plain terminals
// in a grid. Then each window shrinks into its folder and a bot pops out of it: the ones that are busy
// stay and work, the three that wait for you hop into a row. You answer each with one click, it hops
// back to work, until nothing needs you. The tab title and icon count along, like botlings' Dock badge.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Avatar, Bot, MEETY, PIP, REX, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';
import { reducedMotion } from './hop';
import { Noise, TERMS } from './Noise';

type Phase = 'noise' | 'collapse' | 'bots';
type Where = 'folder' | 'queue';

interface Request {
  kind: 'permission' | 'question' | 'done';
  /** The tab title while you are elsewhere. */
  away: string;
}

interface Botling {
  id: string;
  name: string;
  look: Look;
  where: Where;
  state: 'working' | 'default' | 'sleeping';
  request: Request | null;
}

/** Each terminal becomes a bot with the same job. Order and paths as in TERMS. */
const CAST: { name: string; look: Look; request: Request | null }[] = [
  { name: 'Pip', look: PIP, request: { kind: 'permission', away: 'Pip wants to edit README.md' } },
  { name: 'Ada', look: { type: 'flower', color: '#ff8fb1' }, request: null },
  { name: 'Mo', look: { type: 'blob', color: '#7cc4ff' }, request: { kind: 'question', away: 'Mo has a question' } },
  { name: 'Oli', look: { type: 'droid', color: '#8fe388' }, request: null },
  { name: 'Lu', look: { type: 'ghost', color: '#b69cff' }, request: { kind: 'done', away: 'Lu is done' } },
  { name: 'Fenn', look: { type: 'cat', color: '#ff9e6b' }, request: null },
];

const OLD_README = 'Shop is an innovative, AI-powered commerce solution that empowers makers to seamlessly sell their creations.';
const NEW_README = 'A small shop for handmade cups.';

const NOISE_MS = 1500;
const COLLAPSE_MS = 380;
/** Visitors who cleared the row before start in the calm, with one bot that finished meanwhile. */
const CALM_KEY = 'botlings-site.calm';

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

const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent) && !('ontouchend' in document);

function DownloadButton({ small }: { small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const cls = `btn strong ${small ? 'sm' : ''}`;
  if (isMac) return <a className={cls} href={DOWNLOAD_URL}>Download for Mac</a>;
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: 'botlings', text: 'botlings, Claude Code sessions as little bots on your Mac', url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // the share sheet was closed
    }
  };
  return <button className={cls} onClick={() => void share()}>{copied ? 'Link copied' : 'Send to my Mac'}</button>;
}

const startBots = (returning: boolean): Botling[] =>
  CAST.map((c, k) => {
    // back again: everyone is at work, and one finished while you were gone
    if (returning) {
      const back = k === 4;
      return { id: TERMS[k].path, name: c.name, look: c.look, where: back ? 'queue' : 'folder', state: back ? 'default' : 'working', request: back ? { kind: 'done', away: 'Lu is done' } : null };
    }
    return { id: TERMS[k].path, name: c.name, look: c.look, where: c.request ? 'queue' : 'folder', state: c.request ? 'default' : 'working', request: c.request };
  });

export function App() {
  const theme = useTheme();
  const returning = useRef(localStorage.getItem(CALM_KEY) === '1').current;
  const skip = returning || reducedMotion();
  const [phase, setPhase] = useState<Phase>(skip ? 'bots' : 'noise');
  // bots first appear at their folders, then the waiting ones hop to the row
  const [settled, setSettled] = useState(skip);
  const [bots, setBots] = useState<Botling[]>(() => startBots(returning));
  const [open, setOpen] = useState<string | null>(null);
  const [meety, setMeety] = useState(false);
  const [readme, setReadme] = useState<'old' | 'new'>('old');

  useEffect(() => {
    if (skip) return;
    const a = window.setTimeout(() => setPhase('collapse'), NOISE_MS);
    const b = window.setTimeout(() => setPhase('bots'), NOISE_MS + COLLAPSE_MS);
    const c = window.setTimeout(() => setSettled(true), NOISE_MS + COLLAPSE_MS + 650);
    return () => [a, b, c].forEach(clearTimeout);
  }, [skip]);

  // measure the stage: the six cells (terminals, then folders) and the row the waiting bots stand in
  const stage = useRef<HTMLElement | null>(null);
  const row = useRef<HTMLDivElement | null>(null);
  const [, remeasure] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const watch = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    observer.current ??= new ResizeObserver(() => remeasure(n => n + 1));
    observer.current.observe(el);
  }, []);
  useLayoutEffect(() => remeasure(n => n + 1), [phase]);

  const base = stage.current?.getBoundingClientRect();
  const cells = stage.current ? [...stage.current.querySelectorAll<HTMLElement>('.cell')] : [];
  const rowRect = row.current?.getBoundingClientRect();
  const small = window.innerWidth < 720;
  const size = small ? 56 : 64;
  const queued = settled ? bots.filter(b => b.where === 'queue') : [];
  const gap = size + 36;
  const spot = (b: Botling, k: number) => {
    if (!base) return null;
    const cell = cells[k]?.getBoundingClientRect();
    if (!cell || cell.width === 0) return null;
    const q = queued.indexOf(b);
    if (q >= 0 && rowRect) {
      return { x: rowRect.left - base.left + rowRect.width / 2 + (q - (queued.length - 1) / 2) * gap, y: rowRect.bottom - base.top - 24 };
    }
    // at its folder: standing right of the folder icon
    return { x: cell.left - base.left + 112, y: cell.top - base.top + cell.height / 2 + size / 2 - 4 };
  };

  const need = queued.length;
  const calm = settled && need === 0;
  useEffect(() => {
    if (!calm) return;
    localStorage.setItem(CALM_KEY, '1');
    const t = window.setTimeout(() => setMeety(true), 700);
    return () => clearTimeout(t);
  }, [calm]);

  // the tab counts along, and says who needs you while you are elsewhere
  useEffect(() => {
    const title = () => {
      const first = queued[0]?.request;
      document.title = !need ? 'botlings' : document.hidden && first ? first.away : `(${need}) botlings`;
    };
    title();
    document.addEventListener('visibilitychange', title);
    return () => document.removeEventListener('visibilitychange', title);
  }, [need, queued]);
  useFavicon(settled ? queued[0]?.name ?? null : null, need);

  const answer = (id: string) => {
    setOpen(null);
    setBots(prev => prev.map(b => (b.id === id ? { ...b, where: 'folder', request: null, state: b.request?.kind === 'done' ? 'sleeping' : 'working' } : b)));
  };

  const current = open ? bots.find(b => b.id === open && b.request) ?? null : null;
  const currentIndex = current ? bots.indexOf(current) : -1;
  const currentAt = current ? spot(current, currentIndex) : null;

  return (
    <div className="page">
      <header className="top">
        {/* grey until the noise turns into bots: the first colour on the page belongs to them */}
        <span className="mark"><Avatar look={{ ...PIP, color: phase === 'bots' ? PIP.color : '#9a9da2' }} size={24} theme={theme} /> botlings</span>
        <DownloadButton />
      </header>
      <main>
        <h1 className="line">Your Claude Code sessions, as little bots that come to you when they need you.</h1>
        <section className={`stage ${phase}`} ref={el => { stage.current = el; watch(el); }}>
          {phase === 'bots' ? (
            <div className="noise folders" aria-hidden>
              {TERMS.map(t => (
                <div className="cell" key={t.path}>
                  <span className="folder-spot">
                    <svg width="34" height="27" viewBox="0 0 40 32" fill="none">
                      <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
                      <path d="M3 12h34" stroke="currentColor" strokeOpacity=".28" />
                    </svg>
                    <span>{t.path.split('/').pop()}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Noise />
          )}

          <div className="row" ref={el => { row.current = el; watch(el); }} />
          <p className="status" aria-live="polite">
            {!settled ? '' : calm ? <>Nothing needs you right now. <DownloadButton small /></> : need === 1 ? '1 needs you' : `${need} need you`}
          </p>

          {phase === 'bots' && bots.map((b, k) => {
            const at = spot(b, k);
            if (!at) return null;
            const waits = settled && b.where === 'queue' && b.request;
            return (
              <Bot key={b.id} name={b.name} look={b.look} x={at.x} y={at.y} size={size} theme={theme}
                state={b.state} pop={skip ? 0 : 60 * k} showName={!!waits && open === b.id}
                badge={waits ? (b.request!.kind === 'permission' ? '!' : b.request!.kind === 'question' ? '?' : '✓') : undefined}
                label={waits ? `${b.name}: ${b.request!.away}` : b.name}
                selected={open === b.id} onSelect={waits ? () => setOpen(o => (o === b.id ? null : b.id)) : undefined} />
            );
          })}

          {phase === 'bots' && !small && (
            // Rex stands a little apart from the row, where he can look over everyone's work
            <div className={`rex ${calm ? 'away' : ''}`} style={rowRect && base ? { left: rowRect.left - base.left + rowRect.width / 2 + 2.6 * gap - size * 0.43, top: rowRect.bottom - base.top - 24 - size * 0.86 } : undefined}>
              <Avatar look={REX} size={size * 0.86} theme={theme} />
              <span className="name">Rex</span>
            </div>
          )}

          {meety && rowRect && base && (
            <button className="meety" style={{ left: rowRect.left - base.left + rowRect.width / 2 - size * 0.43, top: rowRect.bottom - base.top - 24 - size * 0.86 }} onClick={() => setOpen(o => (o === 'meety' ? null : 'meety'))} aria-label="Meety">
              <Avatar look={MEETY} size={size * 0.86} theme={theme} state={open === 'meety' ? 'default' : 'sleeping'} />
              <span className="name">Meety</span>
            </button>
          )}
          {open === 'meety' && rowRect && base && (
            <Bubble x={rowRect.left - base.left + rowRect.width / 2} y={rowRect.bottom - base.top - 24 - size - 14} width={300} sceneWidth={base.width}>
              <p>I keep your meetings. I listen on your Mac, and only the summary goes to Claude.</p>
            </Bubble>
          )}

          {current && currentAt && base && (
            <Bubble x={currentAt.x} y={currentAt.y - size - 30} width={current.request!.kind === 'permission' ? 380 : 300} sceneWidth={base.width} key={current.id}>
              {current.request!.kind === 'permission' && (
                <div role="group" aria-label={`${current.name} asks for permission`}>
                  <p className="ask-title">{current.name} wants to edit README.md</p>
                  <p className="diff"><del>{OLD_README}</del><ins>{NEW_README}</ins></p>
                  <p className="note">Rex checked it. Shorter, still true.</p>
                  <div className="actions">
                    <button className="btn sm" onClick={() => answer(current.id)}>Deny</button>
                    <button className="btn strong sm" onClick={() => { setReadme('new'); answer(current.id); }} autoFocus>Allow</button>
                  </div>
                </div>
              )}
              {current.request!.kind === 'question' && (
                <div role="group" aria-label={`${current.name} has a question`}>
                  <p className="ask-title">{current.name} asks</p>
                  <p>Postgres or SQLite for the prototype?</p>
                  <div className="actions">
                    <button className="btn sm" onClick={() => answer(current.id)}>Postgres</button>
                    <button className="btn strong sm" onClick={() => answer(current.id)} autoFocus>SQLite</button>
                  </div>
                </div>
              )}
              {current.request!.kind === 'done' && (
                <div role="group" aria-label={`${current.name} is done`}>
                  <p className="ask-title">{current.name} {returning ? 'finished while you were gone' : 'is done'}</p>
                  <p>Shortened the pricing page. 4 files changed.</p>
                  <div className="actions"><button className="btn strong sm" onClick={() => answer(current.id)} autoFocus>Thanks</button></div>
                </div>
              )}
            </Bubble>
          )}
          <span className="sr-only" aria-live="polite">{readme === 'new' ? `README.md now says: ${NEW_README}` : ''}</span>
        </section>
      </main>
      <footer className="foot">
        <span>Free. For Macs with Apple chips and macOS 14 or later. Bring your own Claude Code login or Anthropic API key. Notarized by Apple. Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}

/** A speech bubble above a bot, kept inside the stage, its tail pointing at the bot. */
function Bubble({ x, y, width, sceneWidth, children }: { x: number; y: number; width: number; sceneWidth: number; children: React.ReactNode }) {
  const w = Math.min(width, sceneWidth - 24);
  const left = Math.max(12, Math.min(sceneWidth - w - 12, x - w / 2));
  return (
    <div className="bubble" style={{ left, top: y, width: w, ['--tail' as string]: `${x - left}px` }}>
      {children}
    </div>
  );
}

/** The tab icon: the first waiting bot with a small count, or the plain page icon when nobody waits. */
function useFavicon(botName: string | null, count: number) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const draw = () => {
      const source = botName
        ? document.querySelector<HTMLCanvasElement>(`.bot[aria-label^="${CSS.escape(botName)}:"] canvas`)
        : document.querySelector<HTMLCanvasElement>('.mark canvas');
      const out = document.createElement('canvas');
      out.width = out.height = 64;
      const g = out.getContext('2d');
      if (!g) return;
      try {
        if (source) g.drawImage(source, 0, 0, 64, 64);
        if (count > 0) {
          g.fillStyle = '#171717';
          g.beginPath();
          g.arc(48, 16, 15, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#ffffff';
          g.font = '600 20px system-ui, sans-serif';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(String(count), 48, 17);
        }
        link!.href = out.toDataURL('image/png');
      } catch {
        // a canvas we may not read: keep the last icon
      }
    };
    // the avatar draws a frame or two after it mounts
    const t = window.setTimeout(draw, 300);
    return () => clearTimeout(t);
  }, [botName, count]);
}
