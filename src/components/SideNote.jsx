import { SIDES } from '../data/events.js';

/* A quiet line under the festivities, not the question again. Clearing the
   choice brings the gate back, so "change" needs no interface of its own. */
export default function SideNote({ side, onChange }) {
  if (!side) return null;

  return (
    <p className="side-note">
      Showing the {SIDES[side].toLowerCase()} celebrations.{' '}
      <button type="button" className="side-change" onClick={() => onChange(null)}>
        Change
      </button>
    </p>
  );
}
