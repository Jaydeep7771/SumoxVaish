import { useEffect, useRef, useState } from 'react';
import '../intro.css';

/* Opening beats, in ms from the click. The envelope is built from flat panels
   hinged with rotateX, the way real paper folds -- so the seal breaks, the flap
   swings back, the card rises out, and the card then becomes the page. */
const BEATS = {
  seal: 0,
  flap: 260,
  card: 820,
  expand: 1500,
  done: 2250,
};

export default function Intro({ onDone }) {
  const [phase, setPhase] = useState('idle');
  const timers = useRef([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  function open() {
    if (phase !== 'idle') return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setPhase('gone');
      onDone();
      return;
    }

    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    setPhase('breaking');
    at(BEATS.flap, () => setPhase('opening'));
    at(BEATS.card, () => setPhase('rising'));
    at(BEATS.expand, () => setPhase('expanding'));
    at(BEATS.done, () => {
      setPhase('gone');
      onDone();
    });
  }

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  }

  return (
    <div className={`intro intro--${phase}`} role="dialog" aria-label="Wedding invitation">
      {/* Paper grain, reused by every panel via CSS. */}
      <svg className="intro-noise-def" aria-hidden="true" focusable="false">
        {/* The region must be clamped to the element: it defaults to 120% and
            feTurbulence fills whatever region it is given, which would paint
            grain 10% beyond every panel edge as a visible rectangle. */}
        <filter id="paperGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      <div className="intro-stage">
        <div
          className="envelope"
          role="button"
          tabIndex={0}
          onClick={open}
          onKeyDown={onKey}
          aria-label="Open the invitation"
        >
          <div className="env-shadow" aria-hidden="true" />

          {/* Back wall of the envelope -- the card sits against this. */}
          <div className="env-back">
            <span className="grain" aria-hidden="true" />
          </div>

          {/* The card that slides out and becomes the site. */}
          <div className="card">
            <span className="grain" aria-hidden="true" />
            <div className="card-inner">
              <p className="card-eyebrow">Together with our families</p>
              <p className="card-names">
                Vaishali<span className="card-amp">&amp;</span>Sumit
              </p>
              <span className="card-rule" aria-hidden="true" />
              <p className="card-date">5 December 2026</p>
              <p className="card-place">Zirakpur, Punjab</p>
            </div>
          </div>

          {/* Front pocket: two side folds and a bottom fold, like real paper. */}
          <div className="env-front">
            <span className="grain" aria-hidden="true" />
            <span className="fold fold-left" aria-hidden="true" />
            <span className="fold fold-right" aria-hidden="true" />
            <span className="fold fold-bottom" aria-hidden="true" />
            <div className="env-copy">
              <p className="env-invited">You are invited</p>
              <span className="env-flourish" aria-hidden="true">
                ✦
              </span>
              <p className="env-to">to the wedding of Vaishali &amp; Sumit</p>
            </div>
          </div>

          {/* Top flap, hinged along its upper edge. */}
          <div className="env-flap">
            <span className="grain" aria-hidden="true" />
          </div>

          {/* Wax seal, straddling the flap's lower point. */}
          <div className="seal" aria-hidden="true">
            <span className="seal-mono">V&amp;S</span>
          </div>
        </div>

        <p className="intro-cue">
          <span className="intro-cue-text">Tap the envelope to open</span>
          <span className="intro-cue-dot" />
        </p>
      </div>

      <button type="button" className="intro-skip" onClick={open}>
        Skip
      </button>
    </div>
  );
}
