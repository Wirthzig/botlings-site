// The stage all three tour variants share: Meety in the middle, a bubble under her, and the bots that
// appear as she explains. Steps: 0 asleep, 1 hello, 2 bots hatch, 3 one comes to you, then the features
// (nap, reviewer, dictation, meetings), and last the download.

import { useEffect, useState } from 'react';
import { Bot, MEETY, type Look } from './Bot';
import { reducedMotion } from './hop';

export const LINES = [
  '',
  'Hi! I’m Meety. I look after your Claude Code sessions.',
  'Every session becomes a little bot like me. Each one works in its own folder.',
  'When one needs you, it comes over. Otherwise it leaves you alone.',
  'Waiting on a colleague? Let a bot nap. It wakes when something new comes in.',
  'My older brother Rex checks their work against your rules and tests before it reaches you.',
  'Hold fn and talk, in any app. Your words become text right on your Mac.',
  'And I keep your meetings. I listen on your Mac, and only the summary goes to Claude.',
  'That’s botlings. Want me on your Mac?',
];
/** The last step, the one with the download. */
export const LAST = LINES.length - 1;

const LEFT: Look = { type: 'blob', color: '#7cc4ff' };
const RIGHT: Look = { type: 'clover', color: '#ffd36b' };

export function Stage({ step, width, theme, meety = MEETY, children, onMeety }: {
  step: number;
  width: number;
  theme: 'light' | 'dark';
  meety?: Look;
  /** What the bubble holds below the line (buttons, a field). */
  children?: React.ReactNode;
  onMeety?: () => void;
}) {
  const small = width < 560;
  const big = small ? 96 : 112;
  const bot = small ? 52 : 64;
  const cx = width / 2;
  const floor = small ? 200 : 220;
  const side = small ? 120 : 190;
  // step 3: the right one comes over to you, asks, and goes back to work
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (step !== 3) return setAsking(false);
    setAsking(true);
    const t = window.setTimeout(() => setAsking(false), reducedMotion() ? 2400 : 2600);
    return () => clearTimeout(t);
  }, [step]);
  const right = asking ? { x: cx + big / 2 + bot / 2 + 10, y: floor } : { x: cx + side, y: floor };
  return (
    <div className={step === -1 ? 'stage-inner' : 'stage'} style={{ height: floor + 200 }}>
      <Bot key={`${meety.type}${meety.color}`} name="Meety" look={meety} x={cx} y={floor} size={big} theme={theme} state={step === 0 ? 'sleeping' : 'default'} showName={false}
        onSelect={onMeety} label={step === 0 ? 'Wake Meety' : 'Meety'} />
      {(step === 2 || step === 3) && (
        <>
          <Bot name="A bot" look={LEFT} x={cx - side} y={floor} size={bot} theme={theme} state="working" showName={false} pop={1} />
          <Bot name="A bot" look={RIGHT} x={right.x} y={right.y} size={bot} theme={theme} state={asking ? 'default' : 'working'} showName={false} pop={120}
            badge={asking ? '?' : undefined} />
        </>
      )}
      {step >= 1 && (
        <div className="say" style={{ top: floor + 18 }} key={step} aria-live="polite">
          <p>{LINES[step]}</p>
          {children}
        </div>
      )}
    </div>
  );
}
