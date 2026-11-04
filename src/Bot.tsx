// One bot on the page: a living avatar from the app's own library, placed by its feet, hopping when
// its place changes.

import { useLayoutEffect, useRef } from 'react';
import { BotAvatar } from './vendor/bot-avatars';
import type { BotAvatarGlasses, BotAvatarHat, BotAvatarState, BotAvatarType } from './vendor/bot-avatars/types';
import { hop, reducedMotion } from './hop';

export interface Look {
  type: BotAvatarType;
  color: string;
  hat?: BotAvatarHat;
  glasses?: BotAvatarGlasses;
}

export function Bot({ name, look, x, y, size, state, theme, hidden, selected, onSelect }: {
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
      <BotAvatar
        type={look.type}
        color={look.color}
        hat={look.hat ?? 'none'}
        glasses={look.glasses ?? 'none'}
        shading="fabric"
        face="mouth"
        size={size}
        state={state}
        theme={theme}
        interactive={state === 'default'}
        paused={reducedMotion()}
      />
      <span className="name">{name}</span>
    </button>
  );
}
