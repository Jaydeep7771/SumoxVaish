import Reveal from './Reveal.jsx';

export default function SectionHead({ eyebrow, title, sub }) {
  return (
    <Reveal as="section" className="section-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {sub ? <p className="section-sub">{sub}</p> : null}
    </Reveal>
  );
}
