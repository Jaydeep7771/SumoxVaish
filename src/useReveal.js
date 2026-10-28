import { useEffect, useRef, useState } from 'react';

/* Some embedded webviews ship an IntersectionObserver that never fires. There
   the scroll animation would leave every section stuck at opacity 0 -- which
   reads as "the images are missing". So we watch for proof the observer works:
   the first callback anywhere on the page sets this flag. If nothing has fired
   by the deadline we treat the observer as dead and show everything. */
let observerAlive = false;
const FAILSAFE_MS = 1200;

export default function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;

    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        observerAlive = true;
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);

    const failsafe = setTimeout(() => {
      if (!observerAlive) setShown(true);
    }, FAILSAFE_MS);

    return () => {
      clearTimeout(failsafe);
      io.disconnect();
    };
  }, [shown]);

  return [ref, shown ? 'reveal in' : 'reveal'];
}
