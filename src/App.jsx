import { lazy, Suspense, useEffect, useState } from 'react';
import Intro from './components/Intro.jsx';
import MusicToggle from './components/MusicToggle.jsx';
import Hero from './components/Hero.jsx';
import SectionHead from './components/SectionHead.jsx';
import Story from './components/Story.jsx';
import Proposal from './components/Proposal.jsx';
import Events from './components/Events.jsx';
import Footer from './components/Footer.jsx';

/* These two pull in the Supabase client, which is larger than the rest of the
   page put together. The envelope is the first paint, so they load on demand
   rather than holding it up. */
const WishingWall = lazy(() => import('./components/WishingWall.jsx'));
const Playlist = lazy(() => import('./components/Playlist.jsx'));

const SEEN_KEY = 'sumoxvaish:intro-seen';

/* Shown once per browser session, so a guest reading the page does not have to
   reopen the envelope on every reload. Add ?intro to the URL to force it. */
function shouldShowIntro() {
  if (typeof window === 'undefined') return false;
  if (window.location.search.includes('intro')) return true;
  try {
    return sessionStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export default function App() {
  const [introDone, setIntroDone] = useState(() => !shouldShowIntro());

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('intro-open', !introDone);
    return () => root.classList.remove('intro-open');
  }, [introDone]);

  function finishIntro() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode -- the intro simply shows again next load */
    }
    setIntroDone(true);
  }

  return (
    <>
      {introDone ? null : <Intro onDone={finishIntro} />}

      {/* Starts on the envelope click -- the gesture browsers require. */}
      <MusicToggle start={introDone} />

      <div className="page">
        <Hero />

        <SectionHead eyebrow="Our story" title="From dance partners to partners for life" />
        <Story />

        <SectionHead
          eyebrow="The proposal"
          title="The moment we said forever"
          sub="A few of our favourite frames from the day he asked."
        />
        <Proposal />

        <SectionHead eyebrow="Celebrations" title="The festivities" />
        <Events />

        <SectionHead
          eyebrow="For the couple"
          title="The Wishing Wall"
          sub="Pin a blessing, a memory, or a bit of advice. Every wish stays here as a keepsake."
        />
        <Suspense fallback={<p className="note">Loading the wall…</p>}>
          <WishingWall />
        </Suspense>

        <SectionHead
          eyebrow="Sangeet"
          title="Build the playlist"
          sub="Add the songs that have to play on the dance floor."
        />
        <Suspense fallback={<p className="note">Loading the playlist…</p>}>
          <Playlist />
        </Suspense>

        <Footer />
      </div>
    </>
  );
}
