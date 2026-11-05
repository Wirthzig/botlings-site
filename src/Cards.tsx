// The small live cards above Meety, one per feature: a bot napping, Rex's checks, dictation through the
// pill, a meeting turning into a summary. Monochrome; the only colour is a bot.

import { useEffect, useState } from 'react';
import { Avatar, REX, type Look } from './Bot';
import { reducedMotion } from './hop';

const NAPPER: Look = { type: 'blob', color: '#7cc4ff' };
const SPOKEN = 'Fix the login bug on the checkout page';
const MEETING = [
  ['You', 'Can we ship the checkout fix on Friday?'],
  ['Anna', 'Yes, if the tests pass on Thursday.'],
];

/** Counts up while the card is shown, for things that appear one after another. */
function useTicks(on: boolean, every: number, max: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return setN(0);
    if (reducedMotion()) return setN(max);
    const t = window.setInterval(() => setN(x => (x >= max ? x : x + 1)), every);
    return () => clearInterval(t);
  }, [on, every, max]);
  return n;
}

export function Card({ step, theme }: { step: number; theme: 'light' | 'dark' }) {
  const typed = useTicks(step === 6, 55, SPOKEN.length);
  const heard = useTicks(step === 7, 900, MEETING.length + 1);
  if (step === 4) {
    return (
      <div className="card nap" key={step}>
        <svg width="22" height="22" viewBox="0 0 34 28" fill="none" aria-hidden><path d="M22.5 4.2A10.5 10.5 0 1 0 28.8 18 8.6 8.6 0 0 1 22.5 4.2z" fill="currentColor" opacity=".3" /></svg>
        <Avatar look={NAPPER} size={52} state="sleeping" theme={theme} />
        <p>Waiting on Sarah’s reply</p>
      </div>
    );
  }
  if (step === 5) {
    return (
      <div className="card review" key={step}>
        <Avatar look={REX} size={44} theme={theme} />
        <ul>
          <li>Tests pass</li>
          <li>Follows your style rules</li>
          <li>Does what you asked</li>
        </ul>
      </div>
    );
  }
  if (step === 6) {
    return (
      <div className="card dictate" key={step}>
        <span className="pill" aria-hidden>{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ animationDelay: `${(k % 5) * 90}ms` }} />)}</span>
        <p>{SPOKEN.slice(0, typed)}<span className="caret" /></p>
      </div>
    );
  }
  if (step === 7) {
    return (
      <div className="card meeting" key={step}>
        {MEETING.slice(0, heard).map(([who, text]) => <p key={who}><b>{who}</b> {text}</p>)}
        {heard > MEETING.length && <p className="sum">Summary: ship the checkout fix on Friday. Anna runs the tests on Thursday.</p>}
      </div>
    );
  }
  return null;
}
