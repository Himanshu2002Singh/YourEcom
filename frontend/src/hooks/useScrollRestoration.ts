import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

// Back/forward returns to where you were on that page; every other navigation starts at the top,
// or scrolls to the #hash target when the URL has one.
export function useScrollRestoration(): void {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const lastScrollY = useRef(0);
  const previousKey = useRef(key);

  useEffect(() => {
    history.scrollRestoration = 'manual';
    const track = (): void => {
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', track, { passive: true });
    return () => window.removeEventListener('scroll', track);
  }, []);

  useLayoutEffect(() => {
    if (previousKey.current !== key) positions.current.set(previousKey.current, lastScrollY.current);
    previousKey.current = key;
    const saved = positions.current.get(key);
    if (navigationType === 'POP' && saved !== undefined) window.scrollTo({ top: saved, behavior: 'instant' });
    else if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [key, hash, navigationType]);
}
