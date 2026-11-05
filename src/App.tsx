// The page: from noise to calm. First what several Claude Code sessions look like today, then (next
// step) the same sessions as bots, and you clear what needs you until nothing does.

import { useEffect, useState } from 'react';
import { Avatar, PIP } from './Bot';
import { DOWNLOAD_URL } from './config';
import { Noise } from './Noise';

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

const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent) && !('ontouchend' in document);

export function App() {
  const theme = useTheme();
  return (
    <div className="page">
      <header className="top">
        {/* grey until the noise turns into bots: the first colour on the page belongs to them */}
        <span className="mark"><Avatar look={{ ...PIP, color: '#9a9da2' }} size={24} theme={theme} /> botlings</span>
        {isMac ? <a className="btn strong" href={DOWNLOAD_URL}>Download for Mac</a> : <button className="btn strong">Send to my Mac</button>}
      </header>
      <main>
        <h1 className="line">Your Claude Code sessions, as little bots that come to you when they need you.</h1>
        <section className="stage">
          <Noise />
        </section>
      </main>
      <footer className="foot">
        <span>Free. For Macs with Apple chips and macOS 14 or later. Bring your own Claude Code login or Anthropic API key. Notarized by Apple. Not affiliated with Anthropic.</span>
        <a href={`${import.meta.env.BASE_URL}notices.txt`}>Notices</a>
      </footer>
    </div>
  );
}
