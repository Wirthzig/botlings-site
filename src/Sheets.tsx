// The sheets the footer opens over the canvas, so the page stays two screens long: questions people ask
// before downloading, privacy, what's new, the imprint, and how to install after a download.
//
// Imprint and privacy are drafts: they need the owner's name and address, and a legal check, before the
// site goes public. The [brackets] mark what is missing.

import { useEffect } from 'react';
import { DOWNLOAD_URL } from './config';

export type SheetId = 'faq' | 'privacy' | 'new' | 'imprint' | 'install';

const TITLE: Record<SheetId, string> = {
  faq: 'Questions',
  privacy: 'Privacy',
  new: 'What’s new',
  imprint: 'Imprint',
  install: 'Installing botlings',
};

const FAQ: [string, string][] = [
  ['Does it cost anything?', 'No, botlings is free.'],
  ['Which Macs does it run on?', 'Macs with an Apple chip (M1 or newer) and macOS 14 or later.'],
  ['What do I need besides botlings?', 'Claude Code, installed and signed in with your Claude subscription, or an Anthropic API key. Meety helps you set it up on first launch.'],
  ['Does it use my Claude subscription?', 'botlings runs your own installed Claude Code, so your bots use your plan or your API key, the same as Claude Code in a terminal. botlings never sees your login.'],
  ['What stays on my Mac?', 'Dictation and meeting transcripts are made on your Mac with local speech models (about 600 MB, downloaded once). A meeting summary goes to Claude only when you ask for one.'],
  ['Can a bot change things without asking?', 'That’s up to you. In the default mode a bot asks before it edits files or runs commands, and Rex can check its work before it comes back to you.'],
  ['Is botlings made by Anthropic?', 'No. botlings is an independent app that runs Claude Code. It is not affiliated with Anthropic.'],
];

const CHANGES: [string, string, string[]][] = [
  ['0.3.1', '4 November 2026', [
    'Sign in with an Anthropic API key instead of a subscription.',
    'Meety asks about consent before your first meeting recording.',
    'The licences of everything botlings uses ship with the app.',
  ]],
  ['0.3.0', '4 November 2026', [
    'Take a nap: bots that wait on someone else sleep off to the side.',
    'Rex, Meety’s older brother, reviews a bot’s work before it comes back to you.',
    'The tour now shows answers, the right-click menu, naps and reviews.',
  ]],
  ['0.2.0', '31 October 2026', [
    'Tick off steps in an answer and send your progress back.',
    'API keys stay sealed in your keychain, and a guard stops commits that would publish a secret.',
  ]],
];

export function Sheet({ id, onClose }: { id: SheetId; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={TITLE[id]} onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{TITLE[id]}</h2>
          <button className="close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        </div>
        <div className="sheet-body">{BODY[id]}</div>
      </div>
    </div>
  );
}

const BODY: Record<SheetId, React.ReactNode> = {
  faq: (
    <dl className="faq">
      {FAQ.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}
    </dl>
  ),
  privacy: (
    <div className="prose">
      <p>This website sets no cookies and uses no analytics or tracking. It is hosted on GitHub Pages. GitHub processes the technical data needed to deliver it, such as your IP address, under its own privacy statement.</p>
      <p>The botlings app has no account and no analytics of its own. Your bots talk to Anthropic through your own Claude Code, under your agreement with Anthropic. Dictation and meeting transcription happen on your Mac.</p>
      <p>Responsible for this website: [Name], [Address], [Email].</p>
      <p className="draft">Draft. To be completed and checked before the site goes public.</p>
    </div>
  ),
  new: (
    <div className="changes">
      {CHANGES.map(([v, date, items]) => (
        <section key={v}>
          <h3>{v} <span>{date}</span></h3>
          <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
    </div>
  ),
  imprint: (
    <div className="prose">
      <p>[Name]<br />[Street and number]<br />[Postcode and city]<br />[Country]</p>
      <p>Email: [Email]</p>
      <p className="draft">Draft. To be completed and checked before the site goes public.</p>
    </div>
  ),
  install: (
    <ol className="steps">
      <li><b>Open the download.</b> It’s botlings.dmg in your Downloads folder.</li>
      <li><b>Drag botlings into Applications.</b></li>
      <li><b>Open botlings.</b> Meety wakes up and shows you the rest, including setting up Claude Code.</li>
      <li className="again">Download didn’t start? <a href={DOWNLOAD_URL}>Try again</a></li>
    </ol>
  ),
};
