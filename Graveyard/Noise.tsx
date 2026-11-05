// The first frame: what working with several Claude Code sessions looks like today. Plain shell windows
// in a strict grid, each with a little history, three of them waiting on you, one cursor blinking.
// Deliberately neutral (our own words, no Claude Code look): it is any terminal, not Claude Code's.

export interface Term {
  path: string;
  lines: string[];
  /** The last line: what it waits for, or what it is busy with. */
  last: string;
  waiting: boolean;
}

export const TERMS: Term[] = [
  { path: '~/code/shop', lines: ['› fix the flaky checkout test', 'Edited src/cart.ts'], last: 'Allow edit to README.md? (y/n)', waiting: true },
  { path: '~/code/app', lines: ['› add dark mode to settings', 'Read src/theme.ts'], last: 'Reading src/settings.tsx', waiting: false },
  { path: '~/code/api', lines: ['› set up the prototype backend', 'Read docs/brief.md'], last: 'Postgres or SQLite for the prototype?', waiting: true },
  { path: '~/code/infra', lines: ['› upgrade node to 24', 'Edited Dockerfile'], last: 'Running tests (128)', waiting: false },
  { path: '~/code/site', lines: ['› shorten the pricing page', 'Edited pricing.md'], last: 'Done. 4 files changed.', waiting: true },
  { path: '~/notes', lines: ['› summarise yesterday’s call', 'Read call.txt'], last: 'Writing summary.md', waiting: false },
];

export function Noise({ cursorAt = 0 }: { cursorAt?: number }) {
  return (
    <div className="noise" aria-label="Six terminal sessions, three of them waiting for you">
      {TERMS.map((t, k) => (
        <div className={`term ${t.waiting ? 'waiting' : ''}`} key={t.path}>
          <div className="term-bar"><i /><i /><i /><span>{t.path}</span></div>
          <div className="term-body">
            {t.lines.map(l => <p key={l} className="dim">{l}</p>)}
            <p className="last">{t.last}{k === cursorAt && <span className="cursor" aria-hidden />}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
