import Reveal from './Reveal.jsx';

/* Imported as modules so Vite fingerprints them into /assets and the paths
   resolve from any route or host -- no relative-path breakage.
   The order is the order of the evening: the question, the yes, the after. */
import photo1 from '../assets/1.jpeg';
import photo2 from '../assets/2.jpeg';
import photo3 from '../assets/3.jpeg';

const photos = [
  {
    src: photo1,
    width: 1370,
    height: 2048,
    alt: 'Sumit down on one knee, holding Vaishali’s hand, on the grass above the lake at sunset',
  },
  {
    src: photo2,
    width: 1070,
    height: 1600,
    alt: 'Sumit lifting Vaishali off her feet as she holds up her hand to show the ring',
  },
  {
    src: photo3,
    width: 1070,
    height: 1600,
    alt: 'Vaishali and Sumit sitting together among flowers, she is holding sunflowers',
  },
];

export default function Proposal() {
  return (
    /* On phones this is a horizontal scroller, so it needs a name and a tab
       stop -- otherwise a keyboard user has no way to scroll through it. */
    <Reveal
      className="proposals"
      role="group"
      aria-roledescription="carousel"
      aria-label="Photos from the proposal"
      tabIndex={0}
    >
      {photos.map((p) => (
        <figure className="frame" key={p.src}>
          <img
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
      ))}
    </Reveal>
  );
}
