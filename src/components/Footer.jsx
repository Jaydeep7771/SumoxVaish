import { namesFor } from '../data/names.js';

export default function Footer({ side }) {
  const names = namesFor(side);

  return (
    <footer>
      <p className="hashtag">#SumoxVaish</p>
      <p className="foot-small">
        With love · {names.first} &amp; {names.second} · 2026
      </p>
    </footer>
  );
}
