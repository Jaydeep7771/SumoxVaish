import Countdown from './Countdown.jsx';
import { namesFor } from '../data/names.js';

/* A 3:4 portrait, so the frame is portrait too -- a square crop would cut the
   sunset above them and the grass below, which is most of the photograph. */
import heroWebp210 from '../assets/hero-couple-210.webp';
import heroWebp420 from '../assets/hero-couple-420.webp';
import heroJpg210 from '../assets/hero-couple-210.jpg';
import heroJpg420 from '../assets/hero-couple-420.jpg';

const HERO_SIZES = '(max-width: 520px) 44vw, 210px';

export default function Hero({ side }) {
  const names = namesFor(side);

  return (
    <header className="hero">
      <picture className="hero-photo">
        <source
          type="image/webp"
          srcSet={`${heroWebp210} 210w, ${heroWebp420} 420w`}
          sizes={HERO_SIZES}
        />
        <img
          src={heroJpg420}
          srcSet={`${heroJpg210} 210w, ${heroJpg420} 420w`}
          sizes={HERO_SIZES}
          width="420"
          height="628"
          alt="Sumit and Vaishali running hand in hand through a meadow at sunset"
          fetchPriority="high"
        />
      </picture>
      <p className="eyebrow">Forever starts here</p>
      <h1 className="names">
        {names.first}
        <span className="amp">&amp;</span>
        {names.second}
      </h1>
      <p className="names-dev">{names.dev}</p>
      <p className="hero-date">Sat · 5 Dec 2026 · The Grandeur, Zirakpur</p>
      <span className="hero-rule" aria-hidden="true" />
      <Countdown />
      <div className="scroll-cue">
        <span>Scroll for our story</span>
        <span className="dot" />
      </div>
    </header>
  );
}
