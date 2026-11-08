// The elements on the page: small windows that look like botlings itself. Monochrome; the only colour
// is the bots. Each one comes alive (types, fills in) only while Meety is explaining it.

import { useEffect, useState } from 'react';
import { Avatar, NAPPER, PIP, REX, type Look } from './Bot';
import { reducedMotion } from './hop';

const MO: Look = { type: 'flower', color: '#ff8fb1' };
const OLI: Look = { type: 'droid', color: '#8fe388' };

/** Counts up while the view is the one Meety explains, for things that appear one after another. */
function useTicks(on: boolean, every: number, max: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (reducedMotion()) return setN(max);
    setN(0);
    const t = window.setInterval(() => setN(x => (x >= max ? x : x + 1)), every);
    return () => clearInterval(t);
  }, [on, every, max]);
  return on || n ? n : max;
}

function Window({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`window ${className}`}>
      <div className="window-bar"><i /><i /><i /><span>{title}</span></div>
      <div className="window-body">{children}</div>
    </div>
  );
}

const Folder = ({ name }: { name: string }) => (
  <span className="folder">
    <svg width="30" height="24" viewBox="0 0 40 32" fill="none" aria-hidden>
      <path d="M3 8a4 4 0 0 1 4-4h8.4c1 0 2 .4 2.8 1.2L20.4 7.4H33a4 4 0 0 1 4 4V26a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill="currentColor" opacity=".18" />
      <path d="M3 12h34" stroke="currentColor" strokeOpacity=".28" />
    </svg>
    {name}
  </span>
);

/** The canvas: bots at work in their folders, one waiting above the input. */
export function CanvasView({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Window title="botlings" className="canvas-view">
      <div className="grid-bg" />
      <div className="spot" style={{ left: '8%', top: '12%' }}><Folder name="shop" /><Avatar look={MO} size={56} state="working" theme={theme} /></div>
      <div className="spot" style={{ right: '10%', top: '16%' }}><Folder name="api" /><Avatar look={OLI} size={56} state="working" theme={theme} /></div>
      <div className="waiting"><Avatar look={PIP} size={64} theme={theme} /><span className="badge">?</span></div>
      <div className="input">What should a new botling work on?</div>
    </Window>
  );
}

/** A bot asking for permission, as in the app. Allow sends it back to work. */
export function AskView({ theme }: { theme: 'light' | 'dark' }) {
  const [allowed, setAllowed] = useState(false);
  return (
    <Window title="botlings" className="ask-view">
      <div className="ask-row">
        <Avatar look={PIP} size={64} state={allowed ? 'working' : 'default'} theme={theme} />
        <div className="ask-card">
          <p className="muted">Pip wants to run</p>
          <p className="mono">npm test</p>
          {allowed ? <p className="muted">Running the tests…</p> : (
            <div className="actions">
              <button className="btn quiet" onClick={() => setAllowed(true)}>Deny</button>
              <button className="btn" onClick={() => setAllowed(true)}>Allow</button>
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}

/** The nap spot: bots that wait on someone else, asleep off to the side. */
export function NapView({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Window title="botlings" className="nap-view">
      <div className="nap-spot">
        <svg width="30" height="24" viewBox="0 0 34 28" fill="none" aria-hidden><path d="M22.5 4.2A10.5 10.5 0 1 0 28.8 18 8.6 8.6 0 0 1 22.5 4.2z" fill="currentColor" opacity=".22" /></svg>
        <span>Nap</span>
      </div>
      <div className="nappers">
        <span><Avatar look={NAPPER} size={60} state="sleeping" theme={theme} /><small>Waiting on Sarah’s reply</small></span>
        <span><Avatar look={OLI} size={60} state="sleeping" theme={theme} /><small>Waiting on the client</small></span>
      </div>
    </Window>
  );
}

/** Rex looking over a bot's work before it comes to you. */
export function ReviewView({ theme, live }: { theme: 'light' | 'dark'; live: boolean }) {
  const checks = ['Tests pass', 'Follows your style rules', 'Does what you asked'];
  const shown = useTicks(live, 600, checks.length);
  return (
    <Window title="botlings" className="review-view">
      <div className="review">
        <Avatar look={REX} size={68} theme={theme} state={live && shown < checks.length ? 'working' : 'default'} />
        <ul>{checks.map((c, k) => <li key={c} className={k < shown ? 'done' : ''}>{c}</li>)}</ul>
      </div>
    </Window>
  );
}

const SPOKEN = 'Fix the login bug on the checkout page and add a test for it';

/** Dictation: a text field in any app filling in while the pill listens. */
export function DictationView({ live }: { live: boolean }) {
  const typed = useTicks(live, 45, SPOKEN.length);
  return (
    <Window title="Any app" className="dictation-view">
      <div className="field">{SPOKEN.slice(0, typed)}{live && typed < SPOKEN.length && <span className="caret" />}</div>
      <div className="pill" aria-hidden>{Array.from({ length: 11 }, (_, k) => <i key={k} style={{ animationDelay: `${(k % 6) * 80}ms` }} />)}</div>
    </Window>
  );
}

const MEETING: [string, string][] = [
  ['You', 'Can we ship the checkout fix on Friday?'],
  ['Anna', 'Yes, if the tests pass on Thursday.'],
  ['You', 'Then I’ll ask a bot to write the release notes.'],
];

/** A meeting: the transcript fills in, the summary follows. */
export function MeetingView({ live }: { live: boolean }) {
  const heard = useTicks(live, 800, MEETING.length + 1);
  return (
    <Window title="Meeting with Anna" className="meeting-view">
      {MEETING.slice(0, heard).map(([who, text], k) => <p key={k}><b>{who}</b> {text}</p>)}
      {heard > MEETING.length && (
        <div className="summary">
          <p className="muted">Summary</p>
          <p>Ship the checkout fix on Friday. Anna runs the tests on Thursday.</p>
          <p className="todo">Write the release notes</p>
        </div>
      )}
    </Window>
  );
}
