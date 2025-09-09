// src/features/.../pages/FeedPage.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import type { Microlesson } from "@/services/microlessons/types";
import MicroLessonCard from "../components/MicroLessonCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import Loader from "@/components/loaders";

// ⛔️ Ya no usamos el player con API/graph para esta versión local
// import InteractiveVideoPlayer from "@/components/player/core/InteractiveVideoPlayer";
// import { useLessonGraphLoader } from "@/components/player/adapters/useLessonGraphLoader";
// import VideoSwiper from "@/components/player/core/VideoSwiper";
import VideoSwiperLocal from "@/components/player/core/VideoSwiperLocal";

// ✅ Mock local
import RAW from "@/mocks/feed.json";

// Microlesson extendido para incluir el src local
type LocalMicrolesson = Microlesson & { src: string };

// Normaliza y agrega el `src` local basado en el id (nombre del archivo)
function normalize(raw: any): LocalMicrolesson {
  const safeId =
    raw?.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `mock-${Math.random().toString(36).slice(2)}`);

  const base: Microlesson = {
    id: safeId,
    title: raw?.title ?? "",
    subtitle: raw?.subtitle ?? raw?.description ?? "",
    description: raw?.description ?? "",
    poster: raw?.poster ?? "",
    duration: Number(raw?.duration ?? 0),

    // obligatorios que tu tipo suele exigir
    lessonContentId: raw?.lessonContentId ?? `mock-${safeId}`,
    statusString: raw?.statusString ?? "ACTIVE",
    dateCreated: raw?.dateCreated ?? new Date().toISOString(),
    dateUpdated: raw?.dateUpdated ?? raw?.dateCreated ?? new Date().toISOString(),

    status: typeof raw?.status === "number" ? raw.status : 0,
    inProgress: Boolean(raw?.inProgress),
    isGradable: Boolean(raw?.isGradable),
    passingScore: Number(raw?.passingScore ?? 0),

    organizationId: raw?.organizationId ?? "",
    organization: raw?.organization ?? null,

    libraryMediaFiles: raw?.libraryMediaFiles ?? null,
    totalAiCreditsUsed: raw?.totalAiCreditsUsed ?? 0,
    questionAiCreditsUsed: raw?.questionAiCreditsUsed ?? null,
    lessonGenerationAiCreditsUsed: raw?.lessonGenerationAiCreditsUsed ?? 0,
    promptToSlideAiCreditsUsed: raw?.promptToSlideAiCreditsUsed ?? null,
    videoGenerationAiCreditsUsed: raw?.videoGenerationAiCreditsUsed ?? null,
    imageGenerationAiCreditsUsed: raw?.imageGenerationAiCreditsUsed ?? null,
  };

  // ➕ acá mapeamos id -> src local
  const src = `/videos/${safeId}`; // ej: "dc1-vertical.mp4" => "/videos/dc1-vertical.mp4"

  return { ...base, src };
}

// Fuente en memoria
const ALL_RAW: any[] = Array.isArray((RAW as any)?.data) ? (RAW as any).data : [];
const ALL_NORMALIZED: LocalMicrolesson[] = ALL_RAW.map(normalize);

// Mock con paginado local
function fetchMicrolessonsMock(page: number, limit: number) {
  const lastPageIndex = Math.max(0, Math.ceil(ALL_NORMALIZED.length / limit) - 1);
  const start = page * limit;
  const end = start + limit;
  const data = ALL_NORMALIZED.slice(start, end);
  return { data, pagesCount: lastPageIndex };
}

export default function FeedPage() {
  const { organizationId } = useAuth();

  const [items, setItems] = useState<LocalMicrolesson[]>([]);
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
      const res = fetchMicrolessonsMock(page, 12);
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
      setErr(e?.message || "Error loading microlessons (mock)");
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

      {openLessonId &&
        organizationId &&
        items.some((i) => i.id === openLessonId) && (
          <VideoSwiperLocal
            lessons={items}
            initialLessonId={openLessonId}
            onClose={() => setOpenLessonId(null)}
          />
        )}
    </div>
  );
}