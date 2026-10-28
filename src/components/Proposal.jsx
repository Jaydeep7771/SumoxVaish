import Reveal from './Reveal.jsx';

/* Imported as modules so Vite fingerprints them into /assets and the paths
   resolve from any route or host -- no relative-path breakage. */
import photo1 from '../assets/1.jpeg';
import photo2 from '../assets/2.jpeg';
import photo3 from '../assets/3.jpeg';

const photos = [
  { src: photo1, alt: 'Vaishali and Sumit on the day he asked' },
  { src: photo2, alt: 'Vaishali and Sumit celebrating the proposal' },
  { src: photo3, alt: 'Vaishali and Sumit together after the proposal' },
];

export default function Proposal() {
  return (
    <Reveal className="proposals">
      {photos.map((p) => (
        <figure className="frame" key={p.src}>
          <img src={p.src} alt={p.alt} width="1070" height="1600" loading="lazy" decoding="async" />
        </figure>
      ))}
    </Reveal>
  );
}
