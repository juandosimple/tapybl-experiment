import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { fetchMicrolessons } from "@/services/microlessons/api";
import type { Microlesson } from "@/services/microlessons/types";
import MicroLessonCard from "../components/MicroLessonCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Loader from "@/components/loaders";

import InteractiveVideoPlayer from "@/components/player/core/InteractiveVideoPlayer";
import { useLessonGraphLoader } from "@/components/player/adapters/useLessonGraphLoader";

export default function FeedPage() {
  const { organizationId } = useAuth();

  const [items, setItems] = useState<Microlesson[]>([]);
  const [page, setPage] = useState(0);
  const [pagesCount, setPagesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  const seenIds = useRef<Set<string>>(new Set());
  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    setItems([]);
    setPage(0);
    setPagesCount(null);
    setErr("");
    seenIds.current = new Set();
    inFlight.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
  }, [organizationId]);

  const hasMore = useMemo(() => {
    if (pagesCount == null) return true;
    return page <= pagesCount;
  }, [page, pagesCount]);

  const loadNext = useCallback(async () => {
    if (!organizationId || loading || !hasMore) return;
    if (inFlight.current) return;

    inFlight.current = true;
    setLoading(true);
    setErr("");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const myRequestId = ++requestIdRef.current;

    try {
      const res = await fetchMicrolessons(organizationId, page, 12);

      if (myRequestId !== requestIdRef.current) return;

      const fresh = res.data.filter((it) => {
        if (seenIds.current.has(it.id)) return false;
        seenIds.current.add(it.id);
        return true;
      });

      setItems((prev) => [...prev, ...fresh]);
      setPagesCount(res.pagesCount ?? null);
      setPage((p) => p + 1);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Error loading microlessons");
    } finally {
      if (myRequestId === requestIdRef.current) {
        setLoading(false);
        inFlight.current = false;
      }
    }
  }, [organizationId, page, loading, hasMore]);

  useEffect(() => {
    if (organizationId && items.length === 0) {
      loadNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const { sentinelRef } = useInfiniteScroll({
    enabled: !!organizationId && hasMore && !loading && !err,
    onIntersect: loadNext,
    rootMargin: "400px",
  });

  if (!organizationId) {
    return <div style={{ padding: 16 }}>Loading Organization…</div>;
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
          Retry
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
          No more Micro Reels available
        </div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ padding: 16 }}>No Micro Reels found</div>
      )}

      {openLessonId && organizationId && (
        <FeedLessonOverlay
          organizationId={organizationId}
          lessonId={openLessonId}
          onClose={() => setOpenLessonId(null)}
        />
      )}
    </div>
  );
}

function FeedLessonOverlay({
  organizationId,
  lessonId,
  onClose,
}: {
  organizationId: string;
  lessonId: string;
  onClose: () => void;
}) {
  const { graph, loading, error } = useLessonGraphLoader({
    organizationId,
    lessonId,
  });

  if (loading) return <Loader />;
  if (error) return <div style={{ padding: 16, color: "salmon" }}>{error}</div>;
  if (!graph) return null;

  return <InteractiveVideoPlayer graph={graph} onClose={onClose} />;
}
