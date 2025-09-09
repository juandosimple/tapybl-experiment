// src/features/explore/pages/ExplorePage.tsx
import { useMemo, useState } from "react";
import styles from "./ExplorePage.module.css";

type Vid = { src: string; title: string; tags: string[] };

const videos: Vid[] = [
  { src: "/videos/video1.mp4", title: "City Night", tags: ["city","night","urban"] },
  { src: "/videos/video2.mp4", title: "Waves", tags: ["ocean","nature","relax"] },
  { src: "/videos/video3.mp4", title: "Forest Path", tags: ["forest","nature","green"] },
  { src: "/videos/video4.mp4", title: "Workout", tags: ["fitness","sport"] },
  { src: "/videos/video5.mp4", title: "Coffee Shop", tags: ["coffee","indoors"] },
  { src: "/videos/video6.mp4", title: "Sunset Ride", tags: ["sunset","travel"] },
];

function tileClass(i: number, styles: any) {
  const pos = (i % 12) + 1;
  return pos === 5 || pos === 10 ? `${styles.item} ${styles.big}` : styles.item;
}

export default function ExplorePage() {
  const [q, setQ] = useState("");

  // repetimos lista para poblar el grid
  const list = useMemo(
    () => Array.from({ length: 24 }, (_, i) => videos[i % videos.length]),
    []
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(v =>
      v.title.toLowerCase().includes(term) ||
      v.tags.some(t => t.toLowerCase().includes(term)) ||
      v.src.toLowerCase().includes(term)
    );
  }, [q, list]);

  return (
    <>
      <div className={styles.searchBar}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos (e.g. nature, city, coffee)…"
          aria-label="Search videos"
        />
        {q && (
          <button className={styles.clearBtn} onClick={() => setQ("")} aria-label="Clear search">
            ×
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No results for “{q}”.</div>
        ) : (
          filtered.map((v, i) => (
            <div key={`${v.src}-${i}`} className={tileClass(i, styles)}>
              <video src={v.src} muted autoPlay loop playsInline preload="metadata" />
              <span className={styles.badge}>▶︎</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}