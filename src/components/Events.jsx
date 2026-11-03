import Reveal from './Reveal.jsx';
import { events } from '../data/events.js';

export default function Events({ side }) {
  /* No choice yet means show everything -- a guest who skips the picker must
     never end up with fewer events than they were invited to. */
  const shown = side ? events.filter((e) => e.sides.includes(side)) : events;

  return (
    <div className="events">
      {shown.map((e) => (
        <Reveal as="article" key={e.name} className={e.full ? 'event full' : 'event'}>
          <div className="ev-mark">{e.mark}</div>
          <h4>{e.name}</h4>
          <p className="ev-when">{e.when}</p>
          <p className="ev-where">{e.where}</p>
          <p className="ev-dress">{e.dress}</p>
        </Reveal>
      ))}
    </div>
  );
}
