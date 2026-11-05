// One bot on the page: a living avatar from the app's own library, placed by its feet, hopping when
// its place changes.

import { useLayoutEffect, useRef } from 'react';
import { BotAvatar } from './vendor/bot-avatars';
import type { BotAvatarFace, BotAvatarGlasses, BotAvatarHat, BotAvatarShading, BotAvatarState, BotAvatarType } from './vendor/bot-avatars/types';
import { hop, reducedMotion } from './hop';

export interface Look {
  type: BotAvatarType;
  color: string;
  hat?: BotAvatarHat;
  glasses?: BotAvatarGlasses;
  shading?: BotAvatarShading;
  face?: BotAvatarFace;
  headphones?: boolean;
}

/** The cast, as in the app. */
export const PIP: Look = { type: 'clover', color: '#ffd36b' };
export const REX: Look = { type: 'square', color: '#3a3d42', glasses: 'round', shading: 'plastic', face: 'eyes' };
export const MEETY: Look = { type: 'cloud', color: '#eef0f2', shading: 'plastic', face: 'eyes', headphones: true };
export const NAPPER: Look = { type: 'blob', color: '#7cc4ff' };

/** An avatar on its own, without a place: for the wordmark and the cast list. */
export function Avatar({ look, size, state = 'default', theme, interactive = false }: { look: Look; size: number; state?: BotAvatarState; theme: 'light' | 'dark'; interactive?: boolean }) {
  return (
    <BotAvatar type={look.type} color={look.color} hat={look.hat ?? 'none'} glasses={look.glasses ?? 'none'} shading={look.shading ?? 'fabric'}
      face={look.face ?? 'mouth'} headphones={look.headphones ?? false} size={size} state={state} theme={theme}
      interactive={interactive} paused={reducedMotion()} aria-hidden />
  );
}

export function Bot({ name, look, x, y, size, state, theme, hidden, selected, onSelect, showName = true, badge, label, pop = 0 }: {
  name: string;
  look: Look;
  /** Where its feet stand, in page pixels. */
  x: number;
  y: number;
  size: number;
  state: BotAvatarState;
  theme: 'light' | 'dark';
  hidden?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  showName?: boolean;
  /** What it needs from you, as in the app: ! asks permission, ? has a question, ✓ is done. */
  badge?: '!' | '?' | '✓';
  /** What a screen reader hears, when more than the name. */
  label?: string;
  /** Pops out of the spot it appears on, after this many ms (0: no pop). */
  pop?: number;
}) {
  const el = useRef<HTMLButtonElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const was = last.current;
    last.current = { x, y };
    if (!was || !el.current || reducedMotion()) return;
    hop(el.current, was.x - x, was.y - y);
  }, [x, y]);
  useLayoutEffect(() => {
    if (!pop || !el.current || reducedMotion()) return;
    el.current.animate(
      [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.12, .9)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 420, delay: pop, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <button
      ref={el}
      className={`bot ${hidden ? 'hidden' : ''} ${selected ? 'selected' : ''}`}
      style={{ left: x - size / 2, top: y - size, width: size }}
      onClick={onSelect}
      aria-label={label ?? name}
      tabIndex={onSelect ? 0 : -1}
    >
      <Avatar look={look} size={size} state={state} theme={theme} interactive={state === 'default'} />
      {badge && <span className="badge" aria-hidden>{badge}</span>}
      {showName && <span className="name">{name}</span>}
    </button>
  );
}
