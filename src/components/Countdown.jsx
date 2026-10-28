import { useEffect, useState } from 'react';
import { WEDDING_DATE } from '../data/events.js';

const TARGET = new Date(WEDDING_DATE).getTime();
const pad = (n) => String(n).padStart(2, '0');

function remaining() {
  const d = Math.max(TARGET - Date.now(), 0);
  return {
    days: Math.floor(d / 86400000),
    hours: pad(Math.floor((d % 86400000) / 3600000)),
    minutes: pad(Math.floor((d % 3600000) / 60000)),
    seconds: pad(Math.floor((d % 60000) / 1000)),
  };
}

export default function Countdown() {
  const [t, setT] = useState(remaining);

  useEffect(() => {
    const id = setInterval(() => setT(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    ['Days', t.days],
    ['Hours', t.hours],
    ['Minutes', t.minutes],
    ['Seconds', t.seconds],
  ];

  return (
    <div className="countdown" aria-label="Countdown to the wedding">
      {units.map(([label, value]) => (
        <div className="cd-unit" key={label}>
          <div className="cd-num">{value}</div>
          <div className="cd-lab">{label}</div>
        </div>
      ))}
    </div>
  );
}
