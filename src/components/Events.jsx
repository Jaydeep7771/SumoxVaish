import Reveal from './Reveal.jsx';
import { events } from '../data/events.js';

export default function Events() {
  return (
    <div className="events">
      {events.map((e) => (
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
