import { useEffect, useRef, useState } from 'react';
/* Generic filename so swapping the track later needs no code change. */
import track from '../assets/background-music.mp3';

const PREF_KEY = 'sumoxvaish:music-off';
const VOLUME = 0.32;

/* Background music.
 *
 * The audio element is always mounted, even while the envelope is still
 * closed, so the intro can start playback from inside its own click handler.
 * That matters: iOS Safari only honours play() when it is called in the call
 * stack of the gesture, so starting it from a timer after the animation --
 * which is when the page itself appears -- would be refused there.
 *
 * Three ways in, in order of preference:
 *   1. the envelope click, via playRef, synchronous with the gesture;
 *   2. autoStart, for a reload where the intro is skipped entirely;
 *   3. if the browser refuses that, the guest's next tap anywhere.
 *
 * An explicit Pause outranks all three and is remembered. */
export default function MusicToggle({ autoStart, showButton, playRef }) {
  const audioRef = useRef(null);
  const detachRef = useRef(null);
  const optedOutRef = useRef(false);
  const fadeGen = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [optedOut, setOptedOut] = useState(() => {
    try {
      return localStorage.getItem(PREF_KEY) === '1';
    } catch {
      return false;
    }
  });

  optedOutRef.current = optedOut;

  function fadeTo(el, target, ms = 1400) {
    const from = el.volume;
    const t0 = performance.now();
    const gen = ++fadeGen.current;

    const step = (now) => {
      if (gen !== fadeGen.current) return; // a newer fade took over
      const k = Math.min((now - t0) / ms, 1);
      el.volume = from + (target - from) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    /* requestAnimationFrame is paused while the tab is hidden, so a guest who
       switches apps mid-fade would come back to music playing at volume 0 and
       hear nothing. Land the final value whatever happened to the frames. */
    setTimeout(() => {
      if (gen === fadeGen.current) el.volume = target;
    }, ms + 60);
  }

  function disarm() {
    if (detachRef.current) {
      detachRef.current();
      detachRef.current = null;
    }
  }

  /* Returns a promise so callers can tell whether the browser allowed it. */
  function startPlayback() {
    const el = audioRef.current;
    if (!el || optedOutRef.current) return Promise.resolve(false);

    el.volume = 0;
    return el
      .play()
      .then(() => {
        setPlaying(true);
        fadeTo(el, VOLUME);
        return true;
      })
      .catch(() => false);
  }

  /* The envelope calls this straight from its click handler. */
  useEffect(() => {
    if (!playRef) return undefined;
    playRef.current = startPlayback;
    return () => {
      if (playRef.current === startPlayback) playRef.current = null;
    };
  });

  useEffect(() => {
    if (!autoStart || optedOut) return undefined;

    const el = audioRef.current;
    if (!el || !el.paused) return undefined; // the envelope already started it

    let cancelled = false;

    startPlayback().then((ok) => {
      if (ok || cancelled) return;

      const events = ['pointerdown', 'keydown', 'touchstart'];
      const onFirstInteraction = () => {
        startPlayback().then((started) => {
          if (started) disarm();
        });
      };
      events.forEach((e) =>
        document.addEventListener(e, onFirstInteraction, { passive: true })
      );
      detachRef.current = () =>
        events.forEach((e) => document.removeEventListener(e, onFirstInteraction));
    });

    return () => {
      cancelled = true;
      disarm();
    };
  }, [autoStart, optedOut]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      setOptedOut(false);
      optedOutRef.current = false;
      try {
        localStorage.removeItem(PREF_KEY);
      } catch {
        /* preference just will not persist */
      }
      startPlayback();
    } else {
      disarm();
      el.pause();
      setPlaying(false);
      setOptedOut(true);
      optedOutRef.current = true;
      try {
        localStorage.setItem(PREF_KEY, '1');
      } catch {
        /* preference just will not persist */
      }
    }
  }

  return (
    <>
      <audio ref={audioRef} src={track} loop preload="auto" />
      {showButton ? (
        <button
          type="button"
          className="music-toggle"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? 'Pause the music' : 'Play the music'}
          title={playing ? 'Pause the music' : 'Play the music'}
        >
          <span className={`eq ${playing ? 'eq--on' : ''}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="music-label">{playing ? 'Pause' : 'Play'}</span>
        </button>
      ) : null}
    </>
  );
}
