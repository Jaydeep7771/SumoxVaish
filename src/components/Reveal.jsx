import useReveal from '../useReveal.js';

export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, revealClass] = useReveal();
  return (
    <Tag ref={ref} className={`${revealClass} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
