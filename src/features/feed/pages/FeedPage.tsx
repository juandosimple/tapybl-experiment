import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { fetchMicrolessons } from "../api";
import type { Microlesson } from "../types";
import MicroLessonCard from "../components/MicroLessonCard";
import { useInfiniteScroll } from "../../../hooks/useInfiniteScroll";
import VideoOverlay from "../components/VideoOverlay";
import Loader from "../../../components/loaders";

export default function FeedPage() {
  const { organizationId } = useAuth();

  const [items, setItems] = useState<Microlesson[]>([]);
  const [page, setPage] = useState(0);
  const [pagesCount, setPagesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  // Set de ids ya vistos para evitar duplicados
  const seenIds = useRef<Set<string>>(new Set());
  // Flag anti-concurrencia (carreras entre primer load y sentinel)
  const inFlight = useRef(false);

  // Reset cuando cambia la organización
  useEffect(() => {
    setItems([]);
    setPage(1);
    setPagesCount(null);
    setErr("");
    seenIds.current = new Set();
    inFlight.current = false;
  }, [organizationId]);

  const hasMore = useMemo(() => {
    if (pagesCount == null) return true;
    return page <= pagesCount;
  }, [page, pagesCount]);

  const loadNext = useCallback(async () => {
    if (!organizationId || loading || !hasMore) return;
    if (inFlight.current) return; // evita doble fetch simultáneo
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetchMicrolessons(organizationId, page, 12);

      // Desduplicar por id
      const fresh = res.data.filter((it) => {
        if (seenIds.current.has(it.id)) return false;
        seenIds.current.add(it.id);
        return true;
      });

      setItems((prev) => [...prev, ...fresh]);
      setPagesCount(res.pagesCount ?? null);
      setPage((p) => p + 1);
    } catch (e: any) {
      setErr(e?.message || "Error cargando microlessons");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [organizationId, page, loading, hasMore]);

  // Primer page al montar/when organizationId becomes available
  useEffect(() => {
    if (organizationId && items.length === 0) {
      // llamamos una vez; inFlight evita que se duplique con el sentinel
      loadNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const { sentinelRef } = useInfiniteScroll({
    enabled: !!organizationId && hasMore && !loading,
    onIntersect: loadNext,
    rootMargin: "400px",
  });

  if (!organizationId) {
    return <div style={{ padding: 16 }}>Cargando organización…</div>;
  }

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: "salmon" }}>{err}</div>
        <button
          onClick={loadNext}
          className="btn btn-light"
          disabled={loading}
          style={{ marginTop: 12 }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 10 }}>
      {items.map((ml) => (
        <MicroLessonCard
          key={ml.id}
          item={ml}
          onOpen={(id) => setOpenLessonId(id)}
        />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />
      {loading && <Loader />}
      {!hasMore && items.length > 0 && (
        <div style={{ padding: 16, color: "#777", textAlign: "center" }}>
          Fin del feed
        </div>
      )}
      {!loading && items.length === 0 && (
        <div style={{ padding: 16 }}>No microlesons found</div>
      )}

      {openLessonId && organizationId && (
        <VideoOverlay
          organizationId={organizationId}
          lessonId={openLessonId} // 👈 usamos id aquí
          onClose={() => setOpenLessonId(null)}
        />
      )}
    </div>
  );
}
