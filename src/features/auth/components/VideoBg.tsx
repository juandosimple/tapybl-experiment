import { useEffect, useRef, useState } from "react";
import styles from "./VideoBg.module.css";

type VideoBgProps = {
  videos: string[]; // rutas absolutas o relativas
  crossfadeMs?: number; // duración del fade entre videos
  startIndex?: number; // índice inicial (p.ej. aleatorio)
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

  // helper para cargar y reproducir respetando autoplay en mobile
  async function loadAndPlay(el: HTMLVideoElement, src: string) {
    try {
      if (el.src !== src) el.src = src;
      el.load();
      // iOS requiere muted + playsInline para autoplay
      await el.play();
    } catch {
      // si falla el autoplay, no rompemos la UI
    }
  }

  // Carga inicial en A
  useEffect(() => {
    const a = aRef.current;
    if (!a || videos.length === 0) return;
    loadAndPlay(a, videos[idx]);
  }, [videos]);

  // Cuando termina el activo, preparamos el siguiente en el inactivo y hacemos crossfade
  async function handleEnded() {
    if (videos.length <= 1) {
      // Si solo hay 1, lo volvemos a reproducir
      const active = useA ? aRef.current : bRef.current;
      active?.play().catch(() => {});
      return;
    }
    const next = (idx + 1) % videos.length;
    const active = useA ? aRef.current : bRef.current;
    const idle = useA ? bRef.current : aRef.current;
    if (!idle || !active) return;

    // Cargar siguiente en el inactivo
    await loadAndPlay(idle, videos[next]);

    // Crossfade: bajamos el activo y subimos el inactivo
    active.style.transition = `opacity ${crossfadeMs}ms ease`;
    idle.style.transition = `opacity ${crossfadeMs}ms ease`;
    idle.style.opacity = "1";
    active.style.opacity = "0";

    // Tras el fade, intercambiamos referencias lógicas
    setTimeout(() => {
      setUseA(!useA);
      setIdx(next);
    }, crossfadeMs + 50);
  }

  return (
    <div className={styles.bg}>
      {/* capa oscura opcional para contraste */}
      <div className={styles.bg__overlay} />

      {/* Pista A */}
      <video
        ref={aRef}
        className={`${styles.bg__video} ${styles.bg__videoA}`}
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
      />
      {/* Pista B */}
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
