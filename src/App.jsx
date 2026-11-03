import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Intro from './components/Intro.jsx';
import MusicToggle from './components/MusicToggle.jsx';
import Hero from './components/Hero.jsx';
import SectionHead from './components/SectionHead.jsx';
import Story from './components/Story.jsx';
import Proposal from './components/Proposal.jsx';
import Events from './components/Events.jsx';
import SideGate from './components/SideGate.jsx';
import SideNote from './components/SideNote.jsx';
import Footer from './components/Footer.jsx';

/* These two pull in the Supabase client, which is larger than the rest of the
   page put together. The envelope is the first paint, so they load on demand
   rather than holding it up. */
const WishingWall = lazy(() => import('./components/WishingWall.jsx'));
const Playlist = lazy(() => import('./components/Playlist.jsx'));

const SEEN_KEY = 'sumoxvaish:intro-seen';
const SIDE_KEY = 'sumoxvaish:side';

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
  /* Set by MusicToggle; called by the envelope the moment it is clicked. */
  const playMusic = useRef(null);

  /* Which family a guest belongs to, remembered so they only pick once. */
  const [side, setSide] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDE_KEY);
      return saved === 'bride' || saved === 'groom' ? saved : null;
    } catch {
      return null;
    }
  });

  function persistSide(next) {
    try {
      if (next) localStorage.setItem(SIDE_KEY, next);
      else localStorage.removeItem(SIDE_KEY);
    } catch {
      /* private mode -- the choice just will not persist */
    }
  }

  function chooseSide(next) {
    setSide(next);
    persistSide(next);

    /* Picking a side is a step forward, so give the browser something to come
       back to -- otherwise Back would leave the site entirely and a guest who
       picked the wrong family would have no obvious way back to the question. */
    if (next) window.history.pushState({ sideChosen: next }, '');
  }

  useEffect(() => {
    function onPop() {
      /* Back out of the entry we pushed: return to the question. */
      setSide(null);
      persistSide(null);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* The question only makes sense once the envelope is open, and the page
     stays locked behind it until a side is chosen. */
  const askingSide = introDone && !side;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('intro-open', !introDone || askingSide);
    return () => root.classList.remove('intro-open');
  }, [introDone, askingSide]);

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
      {introDone ? null : (
        <Intro onDone={finishIntro} onOpen={() => playMusic.current?.()} />
      )}

      {/* The audio element mounts immediately so the envelope can start it;
          the toggle button only appears once the page is revealed. */}
      {askingSide ? <SideGate onChoose={chooseSide} /> : null}

      <MusicToggle
        autoStart={introDone}
        showButton={introDone && !askingSide}
        playRef={playMusic}
      />

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
        <SideNote side={side} onChange={chooseSide} />
        <Events side={side} />

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
