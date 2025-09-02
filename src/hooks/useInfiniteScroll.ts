import { useEffect, useRef } from "react";

type Options = {
  enabled?: boolean;
  onIntersect: () => void | Promise<void>;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useInfiniteScroll({ enabled = true, onIntersect, rootMargin = "200px", threshold = 0 }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const obs = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !ticking) {
          ticking = true;
          Promise.resolve(onIntersect()).finally(() => { ticking = false; });
        }
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [enabled, onIntersect, rootMargin, threshold]);

  return { sentinelRef: ref };
}