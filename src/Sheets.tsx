// The sheets the footer opens over the canvas, so the page stays two screens long: questions people ask
// before downloading, privacy, what's new, the imprint, and how to install after a download.
//

import { useEffect, useState } from 'react';
import { DOWNLOAD_URL } from './config';

export type SheetId = 'features' | 'faq' | 'privacy' | 'new' | 'imprint' | 'install' | 'notices';

const TITLE: Record<SheetId, string> = {
  features: 'Features',
  faq: 'Questions',
  privacy: 'Privacy',
  new: 'What’s new',
  imprint: 'Imprint',
  install: 'Installing botlings',
  notices: 'Notices',
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

/** Everything the released app does, by topic. */
const FEATURES: [string, string[]][] = [
  ['Bots', [
    'Each bot is a Claude Code session in a folder of yours. It works at its folder and shows the file it’s on.',
    'A bot comes to the centre when it needs you, with a permission, a question or its answer.',
    'Bots that wait on someone else take a nap off to the side and wake up with anything new.',
    'Subagents show up as small copies of their bot.',
    'Tick off the steps in an answer and send your progress back.',
    'Drag an answer onto another bot to pass it along.',
    'Pick up earlier sessions of a folder, or open a bot’s session in the terminal.',
    'When a conversation gets long, a bot offers to continue in a fresh session from a handoff note.',
    'Reach a bot from the Claude app on your phone.',
    'Claude sessions from VS Code and terminals can show on the canvas too.',
    'Bots that are done can hop onto your screen beside the pill, over every app.',
    'Bots can ask each other. The one asking walks over, and you see the exchange in both chats.',
    'A bot on the web stands at a browser beside its folder.',
    'botlings updates itself when you quit.',
  ]],
  ['Rex', [
    'Rex, Meety’s older brother, checks a bot’s work before it comes back to you. He only reads and runs your checks, and you turn him on per bot.',
    'He checks code, the files a script made and drafted messages, each in their own way, and your writing rules with fixed checks first.',
  ]],
  ['Meety and meetings', [
    'Record a meeting, you and the other side. It’s transcribed on your Mac while it runs.',
    'Meetings get a name by themselves, from your calendar or from what was said.',
    'Name a speaker once and botlings knows the voice next time.',
    'Take notes while it runs. The summary keeps them and adds decisions, action items and open questions.',
    'Hand an action item to a bot, or put it in Apple Reminders.',
    'The record button lights up when a call starts.',
    'Before a meeting you accepted, Meety reads Slack and mail about it and brings you what to clarify.',
    'A daily brief in the morning with what needs your answer. Meety only reads, never sends.',
  ]],
  ['Dictation', [
    'Hold fn to talk to a bot, or press it twice to talk hands-free.',
    'Press fn three times to dictate into any app.',
    'Teach it your words and how they’re spelled.',
    'Speech becomes text on your Mac, with local speech models (about 600 MB, downloaded once).',
  ]],
  ['Your setup', [
    'Your style: rules every Claude session reads, and suggestions from the corrections you make.',
    'Skills: every skill on your Mac, global or per project.',
    'Connections: Slack, Notion, Jira and more, with who is logged in, and more to add. Always allow one in a folder.',
    'Hand open reminders to a bot.',
  ]],
  ['Safety', [
    'Your API keys stay sealed in the keychain. Bots use them without ever seeing them.',
    'A guard stops commits and pushes that would publish a secret.',
    'botlings stays out of screen sharing and screenshots unless you turn that off.',
  ]],
];

const CHANGES: [string, string, string[]][] = [
  ['0.3.3', '20 November 2026', [
    'Meety prepares the meetings you accepted, about two hours before, and writes a daily brief. Both only read, and you turn them on in Settings.',
    'Bots can ask each other. The one asking walks over, and you see the exchange in both chats.',
    'A bot on the web stands at a browser beside its folder.',
    'Slack and other connections show what they do in words, and you can always allow one in a folder.',
    'Rex checks your writing rules with fixed checks first, and looks at code, results and drafts each in their own way.',
    'botlings updates itself: new versions download in the background and install when you quit.',
  ]],
  ['0.3.2', '20 November 2026', [
    'Rex also checks drafted messages and the files a script made, not only code.',
  ]],
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

/** Licence texts come wrapped at 80 characters: join the lines of each paragraph so they wrap to the sheet. */
const reflow = (t: string) => t.trim().split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ')).join('\n\n');

/** The licences from notices.txt (written at build time), one section per package. */
function Notices() {
  const [parts, setParts] = useState<{ intro: string; sections: { title: string; text: string }[] } | null>(null);
  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}notices.txt`).then(r => r.text()).then(t => {
      // each package starts with its name between two lines of "="
      const chunks = t.split(/^=+\n(.+)\n=+\n/m);
      const sections = [];
      for (let i = 1; i < chunks.length; i += 2) sections.push({ title: chunks[i].trim(), text: reflow(chunks[i + 1]) });
      setParts({ intro: chunks[0].trim(), sections });
    }, () => setParts({ intro: 'The notices couldn’t be loaded.', sections: [] }));
  }, []);
  if (!parts) return null;
  return (
    <div className="notices">
      <p>{parts.intro}</p>
      {parts.sections.map(s => (
        <section key={s.title}>
          <h3>{s.title}</h3>
          <pre>{s.text}</pre>
        </section>
      ))}
    </div>
  );
}

const BODY: Record<SheetId, React.ReactNode> = {
  notices: <Notices />,
  features: (
    <div className="changes">
      {FEATURES.map(([topic, items]) => (
        <section key={topic}>
          <h3>{topic}</h3>
          <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
        </section>
      ))}
    </div>
  ),
  faq: (
    <dl className="faq">
      {FAQ.map(([q, a]) => <div key={q}><dt>{q}</dt><dd>{a}</dd></div>)}
    </dl>
  ),
  privacy: (
    <div className="prose">
      <p>This website sets no cookies and uses no analytics or tracking. It is hosted on GitHub Pages. GitHub processes the technical data needed to deliver it, such as your IP address, under its own privacy statement.</p>
      <p>The botlings app has no account and no analytics of its own. Your bots talk to Anthropic through your own Claude Code, under your agreement with Anthropic. Dictation and meeting transcription happen on your Mac.</p>
      <p>Responsible for this website: Alexander Wirths, Deutschherrnufer 42, 60594 Frankfurt am Main, Germany, <a href="mailto:norn.optimization@gmail.com">norn.optimization@gmail.com</a>.</p>
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
      <h3>Information according to § 5 DDG</h3>
      <p>Alexander Wirths<br />Deutschherrnufer 42<br />60594 Frankfurt am Main<br />Germany</p>
      <h3>Contact</h3>
      <p>Email: <a href="mailto:norn.optimization@gmail.com">norn.optimization@gmail.com</a></p>
      <h3>Responsible for content according to § 18 (2) MStV</h3>
      <p>Alexander Wirths, Deutschherrnufer 42, 60594 Frankfurt am Main, Germany</p>
      <h3>Consumer dispute resolution</h3>
      <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
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
