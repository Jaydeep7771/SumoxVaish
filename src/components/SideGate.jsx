import { useEffect, useRef, useState } from 'react';
import { SIDES } from '../data/events.js';

/* Sits between the opened envelope and the site: the guest says which family
   they are with, and the page behind is filtered to the celebrations they are
   invited to. Asked once, then remembered. */
export default function SideGate({ onChoose }) {
  const [leaving, setLeaving] = useState(false);
  const firstRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    return () => clearTimeout(timer.current);
  }, []);

  function pick(key) {
    if (leaving) return;
    setLeaving(true);
    /* Let the card fade before the page underneath is revealed. */
    timer.current = setTimeout(() => onChoose(key), 480);
  }

  return (
    <div
      className={leaving ? 'side-gate side-gate--leaving' : 'side-gate'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="side-gate-q"
    >
      <div className="side-gate-card">
        <p className="eyebrow">Before you come in</p>
        <h2 className="side-gate-q" id="side-gate-q">
          Which side are you from?
        </h2>
        <div className="side-opts">
          {Object.entries(SIDES).map(([key, label], i) => (
            <button
              key={key}
              type="button"
              ref={i === 0 ? firstRef : null}
              className="side-btn"
              onClick={() => pick(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
