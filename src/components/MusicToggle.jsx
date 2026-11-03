import { useEffect, useRef, useState } from 'react';
/* Generic filename so swapping the track later needs no code change. */
import track from '../assets/background-music.mp3';

const PREF_KEY = 'sumoxvaish:music-off';
const VOLUME = 0.32;

/* Background music, started by the envelope opening.
 *
 * Browsers only allow audio after a user gesture, and the envelope click is
 * exactly that. But the intro is only shown once a session, so on a reload
 * there is no gesture and the browser refuses. Rather than leaving the guest
 * staring at a Play button they did not ask for, a refusal arms a one-shot
 * listener and the music starts on their next tap, click or key press.
 *
 * An explicit Pause is different: that is remembered and honoured. */
export default function MusicToggle({ start }) {
  const audioRef = useRef(null);
  const detachRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [optedOut, setOptedOut] = useState(() => {
    try {
      return localStorage.getItem(PREF_KEY) === '1';
    } catch {
      return false;
    }
  });

  function fadeTo(el, target, ms = 1400) {
    const from = el.volume;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min((now - t0) / ms, 1);
      el.volume = from + (target - from) * k;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* Drops the pending "start on next interaction" listener, if any. */
  function disarm() {
    if (detachRef.current) {
      detachRef.current();
      detachRef.current = null;
    }
  }

  useEffect(() => {
    if (!start || optedOut) return undefined;

    const el = audioRef.current;
    if (!el) return undefined;

    let cancelled = false;

    const attempt = () =>
      el
        .play()
        .then(() => {
          if (cancelled) return false;
          setPlaying(true);
          fadeTo(el, VOLUME);
          return true;
        })
        .catch(() => false);

    el.volume = 0;
    attempt().then((ok) => {
      if (ok || cancelled) return;

      const events = ['pointerdown', 'keydown', 'touchstart'];
      const onFirstInteraction = () => {
        el.volume = 0;
        attempt().then((started) => {
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
  }, [start, optedOut]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;

    if (el.paused) {
      el.volume = 0;
      el.play()
        .then(() => {
          setPlaying(true);
          setOptedOut(false);
          try {
            localStorage.removeItem(PREF_KEY);
          } catch {
            /* preference just will not persist */
          }
          fadeTo(el, VOLUME);
        })
        .catch(() => setPlaying(false));
    } else {
      /* A deliberate pause also cancels any pending auto-start. */
      disarm();
      el.pause();
      setPlaying(false);
      setOptedOut(true);
      try {
        localStorage.setItem(PREF_KEY, '1');
      } catch {
        /* preference just will not persist */
      }
    }
  }

  if (!start) return null;

  return (
    <>
      <audio ref={audioRef} src={track} loop preload="none" />
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
    </>
  );
}
