// The page: the real headline, then a small canvas where Pip offers to fix a line of this very site.
// He only starts when you say so, his brother Rex checks the change, and Pip comes back asking for
// permission with the diff, the way botlings does. Then a clip of the real app, the rest of the cast with
// one sentence each, and the facts. Nothing is gated: the download is in the header from the start.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar, Bot, MEETY, NAPPER, PIP, REX } from './Bot';
import { DOWNLOAD_URL } from './config';
import { reducedMotion } from './hop';

type Step = 'ask' | 'work' | 'review' | 'permission' | 'done' | 'denied';

const OLD_LINE = 'botlings is an innovative, AI-powered agent orchestration platform that empowers developers to seamlessly manage multiple Claude Code sessions.';
const NEW_LINE = 'Claude Code sessions as little bots. They work in your folders and ask before they change anything.';
const WORK_MS = 2200;
const REVIEW_MS = 1500;
const TYPE_MS = 18;

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
    // the content box: what the bots and bubbles are placed in
    const measure = () => {
      const cs = getComputedStyle(el);
      setWidth(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    observer.current = new ResizeObserver(measure);
    observer.current.observe(el);
    measure();
  }, []);
  return { width, ref };
}

const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent) && !('ontouchend' in document);

/** On a Mac: the DMG. Elsewhere: send this page on to your Mac through the share sheet. */
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

export function App() {
  const theme = useTheme();
  const [step, setStep] = useState<Step>('ask');
  const [line, setLine] = useState(OLD_LINE);
  const [clip, setClip] = useState(true);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reducedMotion() ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const scene = useWidth();

  const start = () => {
    setStep('work');
    later(() => setStep('review'), WORK_MS);
    later(() => setStep('permission'), WORK_MS + REVIEW_MS);
  };
  const allow = () => {
    setStep('done');
    if (reducedMotion()) return setLine(NEW_LINE);
    // the old line goes, the new one writes itself in
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setLine(NEW_LINE.slice(0, i));
      if (i >= NEW_LINE.length) clearInterval(t);
    }, TYPE_MS);
    timers.current.push(t);
  };
  const again = () => {
    timers.current.forEach(t => { clearTimeout(t); clearInterval(t); });
    timers.current = [];
    setLine(OLD_LINE);
    setStep('ask');
  };

  // where the two bots stand, in the scene's own pixels
  const W = scene.width || 960;
  const narrow = W < 620;
  const size = narrow ? 56 : 68;
  const floor = narrow ? 650 : 400;
  const cardLeft = narrow ? 0 : 140;
  const cardW = narrow ? W : Math.min(440, W - 360);
  const rex = { x: narrow ? 44 : 72, y: floor };
  // far enough right that a long permission bubble never covers the file it is about
  const pipHome = { x: narrow ? W - 52 : Math.max(cardLeft + cardW + 220, W - 190), y: floor };
  const pipAt = step === 'work' ? { x: narrow ? W - 52 : cardLeft + cardW + 56, y: narrow ? 300 : 210 }
    : step === 'review' ? { x: rex.x + size + 24, y: floor }
    : pipHome;
  const talking = step === 'ask' || step === 'permission' || step === 'done' || step === 'denied';

  return (
    <div className="page">
      <header className="top">
        <span className="mark"><Avatar look={PIP} size={24} theme={theme} /> botlings</span>
        <DownloadButton />
      </header>

      <main>
        <section className="hero">
          <h1>Your Claude Code sessions, as little bots on your Mac.</h1>
          <p className="facts">Free. For Macs with Apple chips and macOS 14 or later. Bring your own Claude Code login or Anthropic API key. Notarized by Apple.</p>
        </section>

        <section className="scene" ref={scene.ref} aria-label="A short demo">
          <div className="folder" style={{ left: narrow ? 0 : 40, top: narrow ? 0 : 40 }} aria-hidden>
            <svg width="36" height="29" viewBox="0 0 40 32" fill="none">
              <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
              <path d="M3 12h34" stroke="currentColor" strokeOpacity=".28" />
            </svg>
            <span>botlings-site</span>
          </div>

          <figure className={`file ${step === 'work' ? 'busy' : ''}`} style={{ left: cardLeft, top: narrow ? 64 : 40, width: cardW }}>
            <figcaption>index.html</figcaption>
            <p aria-live="polite">{line}</p>
          </figure>

          <Bot name="Rex" look={REX} x={rex.x} y={rex.y} size={size} theme={theme} state={step === 'review' ? 'working' : 'default'} />
          <Bot name="Pip" look={PIP} x={pipAt.x} y={pipAt.y} size={size} theme={theme} state={step === 'work' ? 'working' : 'default'} />

          {step === 'review' && (
            <Bubble x={rex.x} y={rex.y - size - 18} width={190} sceneWidth={W}>
              <p>Shorter, still true.</p>
            </Bubble>
          )}

          {talking && (
            <Bubble x={pipHome.x} y={pipHome.y - size - 18} width={narrow ? Math.min(W, 340) : 360} sceneWidth={W} key={step}>
              {step === 'ask' && (
                <>
                  <p>Hi, I’m Pip. That line in index.html is a mouthful. Want me to fix it?</p>
                  <div className="actions"><button className="btn strong sm" onClick={start}>Go ahead</button></div>
                </>
              )}
              {step === 'permission' && (
                <div role="group" aria-label="Pip asks for permission">
                  <p className="ask-title">Wants to edit index.html</p>
                  <p className="diff"><del>{OLD_LINE}</del><ins>{NEW_LINE}</ins></p>
                  <p className="note">Rex checked it.</p>
                  <div className="actions">
                    <button className="btn sm" onClick={() => setStep('denied')}>Deny</button>
                    <button className="btn strong sm" onClick={allow}>Allow</button>
                  </div>
                </div>
              )}
              {step === 'done' && (
                <>
                  <p>Done. On your Mac I do this for real, in your folders, while you do something else.</p>
                  <div className="actions"><button className="btn sm" onClick={again}>Again</button><DownloadButton small /></div>
                </>
              )}
              {step === 'denied' && (
                <>
                  <p>Fair, I’ll leave it. You always decide.</p>
                  <div className="actions"><button className="btn sm" onClick={again}>Again</button></div>
                </>
              )}
            </Bubble>
          )}
          {step === 'work' && <p className="working" style={{ left: pipAt.x, top: pipAt.y + 22 }}>Reading index.html</p>}
        </section>

        {clip && (
          <video className="clip" src={`${import.meta.env.BASE_URL}app.mp4`} autoPlay muted loop playsInline onError={() => setClip(false)}
            aria-label="botlings at work: bots hop to their folders and come back when they need you" />
        )}

        <section className="cast" aria-label="The others">
          <div><Avatar look={NAPPER} size={52} state="sleeping" theme={theme} /><p>Waiting on a colleague? Let a bot take a nap. It wakes when something new comes in.</p></div>
          <div><Avatar look={REX} size={52} theme={theme} /><p>Rex, Pip’s older brother, checks the work against your rules and tests before it reaches you.</p></div>
          <div><Avatar look={MEETY} size={52} theme={theme} /><p>Meety keeps your meetings. It listens on your Mac, and only the summary goes to Claude.</p></div>
        </section>
      </main>

      <footer className="foot">
        <span>botlings is not affiliated with Anthropic. Claude and Claude Code are trademarks of Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}

/** A speech bubble above a bot, kept inside the scene, its tail pointing at the bot. */
function Bubble({ x, y, width, sceneWidth, children }: { x: number; y: number; width: number; sceneWidth: number; children: React.ReactNode }) {
  const left = Math.max(0, Math.min(sceneWidth - width, x - width / 2));
  return (
    <div className="bubble" style={{ left, top: y, width, ['--tail' as string]: `${x - left}px` }}>
      {children}
    </div>
  );
}
