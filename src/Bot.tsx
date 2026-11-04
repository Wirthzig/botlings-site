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

export function Bot({ name, look, x, y, size, state, theme, hidden, selected, onSelect, showName = true }: {
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
}) {
  const el = useRef<HTMLButtonElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const was = last.current;
    last.current = { x, y };
    if (!was || !el.current || reducedMotion()) return;
    hop(el.current, was.x - x, was.y - y);
  }, [x, y]);
  return (
    <button
      ref={el}
      className={`bot ${hidden ? 'hidden' : ''} ${selected ? 'selected' : ''}`}
      style={{ left: x - size / 2, top: y - size, width: size }}
      onClick={onSelect}
      aria-label={name}
      tabIndex={onSelect ? 0 : -1}
    >
      <Avatar look={look} size={size} state={state} theme={theme} interactive={state === 'default'} />
      {showName && <span className="name">{name}</span>}
    </button>
  );
}
