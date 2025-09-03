import { useEffect, useMemo, useRef, useState } from "react";
import { fetchLessonPreview } from "../api";
import { XMarkIcon, PlayCircleIcon } from "@heroicons/react/24/outline";
import {
  T,
  node,
  isType,
  children,
  findChoiceGroupAfter,
  getMenuForGroup,
  toSegment,
} from "../graphHelpers";
import { CircleStackIcon } from "@heroicons/react/16/solid";

type Props = { organizationId: string; lessonId: string; onClose: () => void };

export default function VideoOverlay({
  organizationId,
  lessonId,
  onClose,
}: Props) {
  const [preview, setPreview] = useState<any>(null);
  const [list, setList] = useState<any>(null);

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [segment, setSegment] = useState<{
    url: string;
    start: number;
    end?: number;
    poster?: string;
    title?: string;
  } | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>(undefined);

  // overlays
  const [menuId, setMenuId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** --- PROGRESO (read-only) --- **/
  const [segDuration, setSegDuration] = useState<number>(0); // duración efectiva del segmento
  const [segCurrent, setSegCurrent] = useState<number>(0); // tiempo transcurrido dentro del segmento
  const [bufferedEnd, setBufferedEnd] = useState<number>(0); // fin de buffer relativo al segmento

  // load preview
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetchLessonPreview(organizationId, lessonId);
        if (cancel) return;
        setPreview(p);
        const l = p?.lessonContent?.contentList;
        setList(l);

        // primer video alcanzable desde root
        const q = [l?.rootId].filter(Boolean) as string[];
        const seen = new Set<string>();
        let firstVideoId: string | null = null;
        while (q.length) {
          const id = q.shift()!;
          if (seen.has(id)) continue;
          seen.add(id);
          const n = node(l, id);
          if (!n) continue;
          if (isType(n, T.VIDEO)) {
            firstVideoId = id;
            break;
          }
          for (const k of children(n)) q.push(k);
        }
        if (!firstVideoId) throw new Error("No se encontró video.");

        setCurrentNodeId(firstVideoId);
        const raw = toSegment(node(l, firstVideoId));
        const seg = { ...raw, end: undefined }; // ▶️ reproducir completo
        setSegment(seg);
        setBaseUrl(seg.url);
        setPoster(seg.poster);

        // Si hay menú después del primer video, lo mostraremos al cortar en `end`
        const g = findChoiceGroupAfter(l, firstVideoId);
        if (g) setMenuId(null);
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Error cargando preview.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [organizationId, lessonId]);

  // on metadata loaded: setear currentTime al start, calcular duración efectiva y buffer
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !segment) return;

    const onLoaded = () => {
      try {
        const start = Math.max(0, segment.start ?? 0);
        const rawDur = Number.isFinite(v.duration) ? v.duration : 0;
        const end =
          segment.end != null ? Math.min(segment.end, rawDur) : rawDur;
        const effDur = Math.max(0, end - start);

        v.currentTime = start;
        setSegDuration(effDur);
        setSegCurrent(0);
        updateBufferedRelative(v, start);
      } catch {}
      v.play().catch(() => {});
    };

    const onProgress = () => {
      const start = segment.start ?? 0;
      updateBufferedRelative(v, start);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("progress", onProgress);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("progress", onProgress);
    };
  }, [segment?.url, segment?.start, segment?.end]);

  // timeupdate: cortar en end y mostrar overlay; también actualizar progreso
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !list || !segment || !currentNodeId) return;

    const onTime = () => {
      const start = segment.start ?? 0;
      const endAbs =
        segment.end != null
          ? segment.end
          : Number.isFinite(v.duration)
          ? v.duration
          : Infinity;

      // actualizar progreso relativo al segmento
      const rel = Math.max(
        0,
        Math.min(v.currentTime - start, Math.max(0, endAbs - start))
      );
      setSegCurrent(rel);

      if (segment.end != null && v.currentTime >= segment.end) {
        v.pause();
        const g = findChoiceGroupAfter(list, currentNodeId);
        if (g) {
          setMenuId(g);
          setQuizId(null);
          return;
        }
        const kids = children(node(list, currentNodeId));
        const next = node(list, kids[0]);
        if (isType(next, T.QUIZ)) {
          setQuizId(kids[0]);
          setMenuId(null);
          return;
        }
        const nextVid = kids.find((id) => isType(node(list, id), T.VIDEO));
        if (nextVid) {
          const nv = node(list, nextVid);
          goToVideoNode(nextVid, nv);
        }
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [segment?.end, segment?.start, list, currentNodeId]);

  function goToVideoNode(id: string, videoNode: any) {
    const raw = toSegment(videoNode);
    const seg = { ...raw, end: undefined }; // ▶️ sin recorte
    setCurrentNodeId(id);
    setPoster(seg.poster);

    if (baseUrl && seg.url === baseUrl) {
      setSegment(seg);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.currentTime = seg.start ?? 0;
          // reset progreso
          setSegCurrent(0);
          setSegDuration(
            Math.max(
              0,
              (seg.end ?? (Number.isFinite(v.duration) ? v.duration : 0)) -
                (seg.start ?? 0)
            )
          );
          v.play().catch(() => {});
        }
      });
    } else {
      setSegment(seg);
      setBaseUrl(seg.url);
      setSegCurrent(0);
      setSegDuration(0); // se recalcula onLoaded
    }
    setMenuId(null);
    setQuizId(null);
  }

  // selección en menú
  function onSelectOption(targetId: string) {
    if (!list) return;
    const t = node(list, targetId);
    if (!t) return;

    if (isType(t, T.CHOICE_GROUP)) {
      setMenuId(targetId);
      return;
    }
    if (isType(t, T.VIDEO)) {
      goToVideoNode(targetId, t);
      return;
    }
    if (isType(t, T.JUMP)) {
      const dest = t.data?.jumpToNodeId;
      if (!dest) return;
      const d = node(list, dest);
      if (isType(d, T.CHOICE_GROUP)) {
        setMenuId(dest);
        return;
      }
      if (isType(d, T.VIDEO)) {
        goToVideoNode(dest, d);
        return;
      }
    }
    const q = [targetId];
    const seen = new Set<string>();
    while (q.length) {
      const id = q.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const n = node(list, id);
      if (!n) continue;
      if (isType(n, T.VIDEO)) {
        goToVideoNode(id, n);
        return;
      }
      for (const k of children(n)) q.push(k);
    }
  }

  // UI de menú
  const menu = useMemo(
    () => (list && menuId ? getMenuForGroup(list, menuId) : null),
    [list, menuId]
  );

  // UI de quiz mínima
  function Quiz() {
    if (!list || !quizId) return null;
    const q = node(list, quizId);
    const question = q?.data?.question ?? "Question";
    const answers: Array<{ value: string; isCorrect?: boolean }> =
      q?.data?.answers ?? [];
    const nextId = children(q)[0];

    return (
      <div style={overlayBox}>
        <div style={overlayContainer}>
          <h3 style={overlayTitle}>{question}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {answers.map((a, i) => (
              <button
                key={i}
                style={btn}
                onClick={() => {
                  if (nextId) {
                    const n = node(list, nextId);
                    if (isType(n, T.VIDEO)) goToVideoNode(nextId, n);
                    else if (isType(n, T.CHOICE_GROUP)) setMenuId(nextId);
                    else setQuizId(null);
                  } else {
                    setQuizId(null);
                  }
                }}
              >
                <PlayCircleIcon style={{ width: 20, height: 20 }} /> {a.value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function fmt(t: number) {
    if (!Number.isFinite(t)) return "0:00";
    const s = Math.max(0, Math.floor(t));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  function updateBufferedRelative(v: HTMLVideoElement, start: number) {
    try {
      const b = v.buffered;
      let end = 0;
      for (let i = 0; i < b.length; i++) {
        const to = b.end(i);
        if (to >= v.currentTime) {
          end = Math.max(end, to);
        }
      }
      const rel = Math.max(0, end - start);
      setBufferedEnd(rel);
    } catch {
      setBufferedEnd(0);
    }
  }

  if (loading)
    return overlayRoot(
      <div style={{ color: "#aaa" }}>Loading...</div>,
      onClose
    );
  if (error)
    return overlayRoot(<div style={{ color: "salmon" }}>{error}</div>, onClose);

  return overlayRoot(
    <>
      {/* VIDEO */}
      {baseUrl && (
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            height: "100%",
          }}
        >
          <video
            ref={videoRef}
            src={baseUrl}
            poster={poster}
            controls={false}
            autoPlay
            playsInline
            style={{
              width: "100%",
              height: "auto",
              background: "#000",
              borderRadius: 12,
              display: "block",
            }}
          />

          {/* PROGRESS (READ-ONLY) */}
          <div style={progressWrap} aria-hidden={false}>
            <div style={timeLabel}>
              <span aria-label="elapsed">{fmt(segCurrent)}</span>
              <span aria-label="duration">{fmt(segDuration)}</span>
            </div>

            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={segDuration || 0}
              aria-valuenow={Math.min(segCurrent, segDuration)}
              aria-label="Video progress"
              tabIndex={-1} // sin foco, sin interacción
              style={trackReadOnly}
            >
              {/* buffer */}
              <div
                style={{
                  ...bufferBar,
                  width:
                    segDuration > 0
                      ? `${
                          (Math.min(bufferedEnd, segDuration) / segDuration) *
                          100
                        }%`
                      : "0%",
                }}
              />
              {/* progreso */}
              <div
                style={{
                  ...progressBar,
                  width:
                    segDuration > 0
                      ? `${
                          (Math.min(segCurrent, segDuration) / segDuration) *
                          100
                        }%`
                      : "0%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MENÚ */}
      {menu && (
        <div style={overlayBox}>
          <div style={overlayContainer}>
            <h3 style={overlayTitle}>{menu.title}</h3>
            <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
              {menu.options.map((opt) => (
                <button
                  key={opt.targetId}
                  style={btn}
                  onClick={() => onSelectOption(opt.targetId)}
                >
                  <CircleStackIcon style={{ width: 20, height: 20 }} />
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QUIZ */}
      <Quiz />
    </>,
    onClose
  );
}

/* ----- UI helpers ----- */
function overlayRoot(children: any, onClose: () => void) {
  return (
    <div style={root} role="dialog" aria-modal="true">
      <div style={topbar}>
        <button onClick={onClose} title="Cerrar" style={iconBtn}>
          <XMarkIcon style={{ width: 28, height: 28 }} />
        </button>
      </div>
      <div style={body}>{children}</div>
    </div>
  );
}

const root: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.98)",
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
};
const topbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  padding: 10,
};
const body: React.CSSProperties = {
  flex: 1,
  display: "grid",
  placeItems: "center",
  padding: 12,
  position: "relative",
};
const iconBtn: React.CSSProperties = {
  background: "none",
  border: 0,
  color: "#fff",
};

const overlayBox: React.CSSProperties = {
  position: "absolute",
  inset: 12,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  pointerEvents: "auto",
  justifyContent: "center",
  alignItems: "center",
};
const overlayContainer: React.CSSProperties = {
  background: "rgba(36,51,77,.9)",
  padding: "2rem",
  borderRadius: "20px",
};
const overlayTitle: React.CSSProperties = {
  color: "#fff",
  fontWeight: 700,
  textShadow: "0 2px 6px rgba(0,0,0,.6)",
};
const btn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(0,0,0,.45)",
  backdropFilter: "blur(5px)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: "12px 16px",
  color: "#fff",
  textAlign: "left",
};

/** ---- Progress bar styles (read-only) ---- */
const progressWrap: React.CSSProperties = {
  userSelect: "none",
  paddingTop: 10,
  position: "absolute",
  bottom: 30,
  width: "80%",
};
const timeLabel: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#cbd5e1",
  fontSize: 12,
  marginBottom: 6,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
};
const bufferBar: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: 8,
  borderRadius: 999,
  background: "rgba(255,255,255,.25)",
  pointerEvents: "none",
};
const progressBar: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: 8,
  borderRadius: 999,
  background: "linear-gradient(90deg, #60840ab3, #b7ef36ff)",
  pointerEvents: "none",
};
const trackReadOnly: React.CSSProperties = {
  position: "relative",
  height: 8,
  borderRadius: 999,
  background: "rgba(255,255,255,.15)",
  cursor: "default",
  pointerEvents: "none",
};
