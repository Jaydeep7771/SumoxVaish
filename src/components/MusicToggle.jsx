import { useEffect, useRef, useState } from 'react';
import track from '../assets/love-theme.mp3';

const PREF_KEY = 'sumoxvaish:music-off';

/* Background music, started by the envelope opening.
 *
 * Browsers only allow audio after a user gesture, and the envelope click is
 * exactly that -- which is why playback begins there rather than on load.
 * If the guest has already seen the intro this session there is no gesture,
 * so play() is refused and the button simply shows as paused until pressed. */
export default function MusicToggle({ start }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [optedOut, setOptedOut] = useState(() => {
    try {
      return localStorage.getItem(PREF_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!start || optedOut) return;
    const el = audioRef.current;
    if (!el) return;

    el.volume = 0; // fade in, so it does not jolt
    const attempt = el.play();

    if (attempt?.catch) {
      attempt
        .then(() => {
          setPlaying(true);
          fadeTo(el, 0.32);
        })
        .catch(() => setPlaying(false)); // autoplay refused; guest can press play
    }
  }, [start, optedOut]);

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
          fadeTo(el, 0.32);
        })
        .catch(() => setPlaying(false));
    } else {
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
