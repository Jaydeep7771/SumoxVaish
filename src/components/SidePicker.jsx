import Reveal from './Reveal.jsx';
import { SIDES } from '../data/events.js';

/* Both options stay on screen with the chosen one filled, rather than
   collapsing to a "change" link -- switching is then a single tap, and a guest
   who picks wrong is not stuck looking for the way back. */
export default function SidePicker({ side, onChange }) {
  return (
    <Reveal className="side-picker">
      <p className="side-q">Which side are you from?</p>
      <div className="side-opts" role="group" aria-label="Which side are you from?">
        {Object.entries(SIDES).map(([key, label]) => {
          const active = side === key;
          return (
            <button
              key={key}
              type="button"
              className={active ? 'side-btn side-btn--on' : 'side-btn'}
              aria-pressed={active}
              onClick={() => onChange(active ? null : key)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="side-note">
        {side
          ? `Showing the ${SIDES[side].toLowerCase()} celebrations. Tap again to see all.`
          : 'Pick a side to see just your celebrations — or scroll on for all of them.'}
      </p>
    </Reveal>
  );
}
