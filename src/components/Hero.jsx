import Countdown from './Countdown.jsx';

/* The monogram is an opaque illustration, not a flat logo, so it is served as
   photographic formats at two widths rather than an SVG. The master file is
   11126px square; these are built from it. */
import monoWebp320 from '../assets/monogram-320.webp';
import monoWebp640 from '../assets/monogram-640.webp';
import monoJpg320 from '../assets/monogram-320.jpg';
import monoJpg640 from '../assets/monogram-640.jpg';

const MONO_SIZES = '(max-width: 520px) 48vw, 250px';

export default function Hero() {
  return (
    <header className="hero">
      <picture className="monogram">
        <source
          type="image/webp"
          srcSet={`${monoWebp320} 320w, ${monoWebp640} 640w`}
          sizes={MONO_SIZES}
        />
        <img
          src={monoJpg640}
          srcSet={`${monoJpg320} 320w, ${monoJpg640} 640w`}
          sizes={MONO_SIZES}
          width="640"
          height="640"
          alt="Hand-painted V and S monogram entwined with flowers, the Toronto skyline, and Vaishali and Sumit by the lake"
          fetchPriority="high"
        />
      </picture>
      <p className="eyebrow">Together with our families</p>
      <h1 className="names">
        Vaishali<span className="amp">&amp;</span>Sumit
      </h1>
      <p className="names-dev">वैशाली &amp; सुमित</p>
      <p className="hero-date">are tying the knot · 5 December 2026 · Zirakpur, Punjab</p>
      <Countdown />
      <div className="scroll-cue">
        <span>Scroll for our story</span>
        <span className="dot" />
      </div>
    </header>
  );
}
