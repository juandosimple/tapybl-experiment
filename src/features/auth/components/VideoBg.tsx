import { useEffect, useRef, useState } from "react";
import styles from "./VideoBg.module.css";

type VideoBgProps = {
  videos: string[];
  crossfadeMs?: number;
  startIndex?: number;
};

export default function VideoBg({
  videos,
  crossfadeMs = 700,
  startIndex = 0,
}: VideoBgProps) {
  const [idx, setIdx] = useState(
    videos.length ? Math.max(0, Math.min(startIndex, videos.length - 1)) : 0
  );
  const [useA, setUseA] = useState(true);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  async function loadAndPlay(el: HTMLVideoElement, src: string) {
    try {
      if (el.src !== src) el.src = src;
      el.load();
      // iOS requires muted + playsInline for autoplay.
      await el.play();
    } catch {
      // If autoplay fails, we don't break the UI.
    }
  }

  useEffect(() => {
    const a = aRef.current;
    if (!a || videos.length === 0) return;
    loadAndPlay(a, videos[idx]);
  }, [videos]);

  async function handleEnded() {
    if (videos.length <= 1) {
      const active = useA ? aRef.current : bRef.current;
      active?.play().catch(() => {});
      return;
    }
    const next = (idx + 1) % videos.length;
    const active = useA ? aRef.current : bRef.current;
    const idle = useA ? bRef.current : aRef.current;
    if (!idle || !active) return;

    await loadAndPlay(idle, videos[next]);

    active.style.transition = `opacity ${crossfadeMs}ms ease`;
    idle.style.transition = `opacity ${crossfadeMs}ms ease`;
    idle.style.opacity = "1";
    active.style.opacity = "0";

    setTimeout(() => {
      setUseA(!useA);
      setIdx(next);
    }, crossfadeMs + 50);
  }

  return (
    <div className={styles.bg}>
      <div className={styles.bg__overlay} />

      <video
        ref={aRef}
        className={`${styles.bg__video} ${styles.bg__videoA}`}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
      />
      <video
        ref={bRef}
        className={`${styles.bg__video} ${styles.bg__videoB}`}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{ opacity: 0 }}
      />
    </div>
  );
}
