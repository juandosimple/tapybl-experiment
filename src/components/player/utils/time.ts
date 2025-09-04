export function fmt(t: number) {
  if (!Number.isFinite(t)) return "0:00";
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function computeBufferedRelative(
  v: HTMLVideoElement,
  start: number,
  setBufferedEnd: (n: number) => void
) {
  try {
    const b = v.buffered;
    let end = 0;
    for (let i = 0; i < b.length; i++) {
      const to = b.end(i);
      if (to >= v.currentTime) end = Math.max(end, to);
    }
    setBufferedEnd(Math.max(0, end - start));
  } catch {
    setBufferedEnd(0);
  }
}