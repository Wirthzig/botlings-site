// The page as a tour with Meety, in three variants to compare (?v=a, ?v=b, ?v=c):
// a) wake Meety like in the app, then four short steps with a button each;
// b) no waking, the same steps follow your scrolling;
// c) you give Meety a name and a look while she explains.

import { useCallback, useEffect, useRef, useState } from 'react';
import { MEETY, type Look } from './Bot';
import { DOWNLOAD_URL } from './config';
import { LAST, Stage } from './Stage';
import { Card } from './Cards';
import { reducedMotion } from './hop';

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

const variant = new URLSearchParams(location.search).get('v') ?? 'b';
const touch = 'ontouchend' in document;
const Download = () => <a className="btn" href={DOWNLOAD_URL}>Download for Mac</a>;

export function App() {
  const theme = useTheme();
  return (
    <div className="page">
      <header className="top">
        <span className="mark">botlings</span>
        <Download />
      </header>
      <p className="line">Your Claude Code sessions, as little bots that come to you when they need you.</p>
      <main>
        {variant === 'b' ? <Scroll theme={theme} /> : variant === 'c' ? <Dress theme={theme} /> : <Wake theme={theme} />}
      </main>
      <footer className="foot">
        <span>Free. For Macs with Apple chips and macOS 14 or later. Needs Claude Code. Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}

/** a) Meety sleeps until you rub her awake (or tap her), then four steps, one button each. */
function Wake({ theme }: { theme: 'light' | 'dark' }) {
  const { width, ref } = useWidth();
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState(false);
  const stroke = useRef<{ x: number; dir: number; run: number; n: number } | null>(null);
  useEffect(() => {
    const t = window.setTimeout(() => setHint(true), 1400);
    return () => clearTimeout(t);
  }, []);
  // back and forth over her: six strokes wake her, each one makes her stir
  const rub = (e: React.PointerEvent) => {
    if (step !== 0 || e.pointerType === 'touch') return;
    const s = (stroke.current ??= { x: e.clientX, dir: 0, run: 0, n: 0 });
    const dx = e.clientX - s.x;
    if (!dx) return;
    const dir = Math.sign(dx);
    if (dir === s.dir || !s.dir) s.run += Math.abs(dx);
    else {
      if (s.run >= 18) {
        s.n++;
        const el = document.querySelector<HTMLElement>('.stage .bot');
        if (el && !reducedMotion()) el.animate([{ transform: 'none' }, { transform: 'rotate(-6deg) scale(1.03,.97)', offset: 0.3 }, { transform: 'rotate(5deg)', offset: 0.7 }, { transform: 'none' }], { duration: 350 });
        if (s.n >= 6) window.setTimeout(() => setStep(1), 350);
      }
      s.run = Math.abs(dx);
    }
    s.dir = dir;
    s.x = e.clientX;
  };
  return (
    <section className="tour" ref={ref} onPointerMove={rub}>
      <Stage step={step} width={width || 1000} theme={theme} onMeety={step === 0 ? () => setStep(1) : undefined}>
        <div className="actions">
          {step === 1 && <button className="btn" onClick={() => setStep(2)} autoFocus>Hi</button>}
          {step >= 2 && step < LAST && <button className="btn" onClick={() => setStep(step + 1)} autoFocus>Next</button>}
          {step === LAST && <Download />}
        </div>
      </Stage>
      {step === 0 && <p className={`hint ${hint ? 'shown' : ''}`}>{touch ? 'Tap Meety' : 'Rub Meety awake ↔'}</p>}
    </section>
  );
}

/** b) The steps follow how far you scrolled; Meety stays in view, a small live card above her shows each feature. */
function Scroll({ theme }: { theme: 'light' | 'dark' }) {
  const { width, ref } = useWidth();
  const box = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(1);
  useEffect(() => {
    const on = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
      setStep(1 + Math.min(LAST - 1, Math.floor(progress * LAST)));
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <section className="scroll" ref={el => { box.current = el; ref(el); }} style={{ height: `${LAST * 70 + 30}vh` }}>
      <div className="sticky">
        <div className="card-slot"><Card step={step} theme={theme} /></div>
        <Stage step={step} width={width || 1000} theme={theme}>
          {step === LAST && <div className="actions"><Download /></div>}
        </Stage>
        {step < LAST && <p className="hint shown">Scroll</p>}
      </div>
    </section>
  );
}

const BODIES: Look['type'][] = ['cloud', 'clover', 'blob', 'ghost', 'cat', 'droid'];
const COLOURS = ['#eef0f2', '#ffd36b', '#7cc4ff', '#ff8fb1', '#b69cff', '#8fe388'];

/** c) You give Meety a name and a look; she explains botlings on the way. */
function Dress({ theme }: { theme: 'light' | 'dark' }) {
  const { width, ref } = useWidth();
  const [stage, setStage] = useState<'name' | 'look' | 'end'>('name');
  const [name, setName] = useState('Meety');
  const [look, setLook] = useState<Look>(MEETY);
  const shown = name.trim() || 'Meety';
  const text = stage === 'name' ? 'Hi! I look after your Claude Code sessions. What would you like to call me?'
    : stage === 'look' ? `${shown}, I like it. And how do I look? In botlings every session gets a bot like me.`
    : `Every one of them comes to you when it needs you. Want ${shown} on your Mac?`;
  return (
    <section className="tour" ref={ref}>
      <div className="stage" style={{ height: 420 }}>
        <Stage step={-1} width={width || 1000} theme={theme} meety={look} />
        <div className="say" style={{ top: (width < 560 ? 200 : 220) + 18 }} key={stage}>
          <p>{text}</p>
          {stage === 'name' && (
            <form className="name" onSubmit={e => { e.preventDefault(); setStage('look'); }}>
              <input value={name} onChange={e => setName(e.target.value.slice(0, 20))} aria-label="Her name" />
              <button className="btn" type="submit">That’s me</button>
            </form>
          )}
          {stage === 'look' && (
            <>
              <div className="chips" aria-label="Body">
                {BODIES.map(b => <button key={b} className={look.type === b ? 'on' : ''} onClick={() => setLook(l => ({ ...l, type: b }))}>{b}</button>)}
              </div>
              <div className="swatches" aria-label="Colour">
                {COLOURS.map(c => <button key={c} className={look.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setLook(l => ({ ...l, color: c }))} aria-label={c} />)}
              </div>
              <div className="actions"><button className="btn" onClick={() => setStage('end')}>Looks good</button></div>
            </>
          )}
          {stage === 'end' && <div className="actions"><Download /></div>}
        </div>
      </div>
    </section>
  );
}
