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
  resolveFromText,
} from "../graphHelpers";

type Props = { organizationId: string; lessonId: string; onClose: () => void };

type Segment = {
  url: string;
  start: number;
  end?: number;
  poster?: string;
  title?: string;
};

type Cue =
  | { at: number; type: "quiz"; targetId: string }
  | { at: number; type: "menu"; targetId: string }
  | { at: number; type: "jump"; targetId: string };

export default function VideoOverlay({
  organizationId,
  lessonId,
  onClose,
}: Props) {
  const [list, setList] = useState<any>(null);

  // timeline actual
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>(undefined);

  // overlays
  const [menuId, setMenuId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // estado
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  /** --- PROGRESO (read-only) --- **/
  const [segDuration, setSegDuration] = useState<number>(0); // duración efectiva del segmento
  const [segCurrent, setSegCurrent] = useState<number>(0); // tiempo transcurrido dentro del segmento
  const [bufferedEnd, setBufferedEnd] = useState<number>(0); // fin de buffer relativo al segmento

  /** -------- CUES internos (opcional, si el JSON los trae) -------- */
  const [cueIndex, setCueIndex] = useState(0);
  const cues: Cue[] = useMemo(() => {
    if (!list || !currentNodeId) return [];
    try {
      // Ajustá esta llamada a la firma real de tu helper:
      // resolveFromText(list, currentNodeId)  ó  resolveFromText(list, node)
      const raw = (resolveFromText?.(list, currentNodeId) ?? []) as Cue[];
      return raw
        .filter((c) => Number.isFinite(c.at) && c.at >= 0)
        .sort((a, b) => a.at - b.at);
    } catch {
      return [];
    }
  }, [list, currentNodeId]);

  // ---------------------- DATA LOAD ----------------------
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const p = await fetchLessonPreview(organizationId, lessonId);
        if (cancel) return;
        const l = p?.lessonContent?.contentList;
        if (!l) throw new Error("Contenido no disponible.");
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

        // set inicial con lógica de mantener/expandir end
        setCurrentNodeId(firstVideoId);
        const raw = toSegment(node(l, firstVideoId));
        const keepEnd = hasInteractiveAfter(l, firstVideoId) && raw.end != null;
        const seg = keepEnd ? raw : { ...raw, end: undefined };
        setSegment(seg);
        setBaseUrl(seg.url);
        setPoster(seg.poster);
        setMenuId(null);
        setQuizId(null);
        setCueIndex(0);
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

  // ----------------- LOADED METADATA: duraciones & buffer -----------------
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
        updateBufferedRelative(v, start, setBufferedEnd);
      } catch {}
      v.play().catch(() => {});
    };

    const onProgress = () => {
      const start = segment.start ?? 0;
      updateBufferedRelative(v, start, setBufferedEnd);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("progress", onProgress);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("progress", onProgress);
    };
  }, [segment?.url, segment?.start, segment?.end]);

  // ----------------- TIME UPDATE: cues + corte en end + progreso -----------------
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

      // (A) Progreso relativo del segmento (para la barra)
      const rel = Math.max(
        0,
        Math.min(v.currentTime - start, Math.max(0, endAbs - start))
      );
      setSegCurrent(rel);

      // (B) Cues internos (si existen)
      const nextCue = cues[cueIndex];
      if (nextCue && rel >= nextCue.at - 0.05) {
        v.pause();
        if (nextCue.type === "menu") {
          setMenuId(nextCue.targetId);
          setQuizId(null);
        } else if (nextCue.type === "quiz") {
          setQuizId(nextCue.targetId);
          setMenuId(null);
        } else if (nextCue.type === "jump") {
          const dest = node(list, nextCue.targetId);
          if (dest) {
            if (isType(dest, T.VIDEO)) goToVideoNode(nextCue.targetId, dest);
            else if (isType(dest, T.CHOICE_GROUP)) setMenuId(nextCue.targetId);
            else if (isType(dest, T.QUIZ)) setQuizId(nextCue.targetId);
          }
        }
        setCueIndex((i) => i + 1);
        return;
      }

      // (C) Cortar en end si corresponde (solo cuando se mantuvo end)
      if (segment.end != null && v.currentTime >= segment.end - 0.05) {
        v.pause();

        // ¿hay choice group después?
        const g = findChoiceGroupAfter(list, currentNodeId);
        if (g) {
          setMenuId(g);
          setQuizId(null);
          return;
        }

        // ¿hay quiz directo después?
        const kids = children(node(list, currentNodeId));
        const next = node(list, kids[0]);
        if (isType(next, T.QUIZ)) {
          setQuizId(kids[0]);
          setMenuId(null);
          return;
        }

        // avanzar automático al próximo VIDEO, si lo hay
        const nextVid = kids.find((id) => isType(node(list, id), T.VIDEO));
        if (nextVid) {
          const nv = node(list, nextVid);
          goToVideoNode(nextVid, nv);
        }
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [segment?.end, segment?.start, list, currentNodeId, cues, cueIndex]);

  // ----------------- NAVEGACIÓN ENTRE VIDEOS -----------------
  function goToVideoNode(id: string, videoNode: any) {
    if (!list) return;

    const raw = toSegment(videoNode);
    const keepEnd = hasInteractiveAfter(list, id) && raw.end != null;
    const seg = keepEnd ? raw : { ...raw, end: undefined };

    setCurrentNodeId(id);
    setPoster(seg.poster);
    setCueIndex(0); // reset cues de ese video

    if (baseUrl && seg.url === baseUrl) {
      setSegment(seg);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.currentTime = seg.start ?? 0;
          v.play().catch(() => {});
        }
      });
    } else {
      setSegment(seg);
      setBaseUrl(seg.url);
    }
    setMenuId(null);
    setQuizId(null);
  }

  // ----------------- SELECCIÓN EN MENÚ -----------------
  function onSelectOption(targetId: string) {
    if (!list) return;
    const t = node(list, targetId);
    if (!t) return;

    // 1) Casos directos
    if (isType(t, T.CHOICE_GROUP)) {
      setMenuId(targetId);
      setQuizId(null);
      return;
    }
    if (isType(t, T.VIDEO)) {
      goToVideoNode(targetId, t);
      return;
    }
    if (isType(t, T.QUIZ)) {
      setQuizId(targetId);
      setMenuId(null);
      return;
    }
    if (isType(t, T.JUMP)) {
      const dest = t.data?.jumpToNodeId;
      if (!dest) return;
      const d = node(list, dest);
      if (!d) return;
      if (isType(d, T.CHOICE_GROUP)) {
        setMenuId(dest);
        setQuizId(null);
        return;
      }
      if (isType(d, T.VIDEO)) {
        goToVideoNode(dest, d);
        return;
      }
      if (isType(d, T.QUIZ)) {
        setQuizId(dest);
        setMenuId(null);
        return;
      }
      // Si el destino es otra cosa, seguimos con BFS desde 'dest'
      bfsResolve(dest);
      return;
    }

    // 2) Fallback: BFS desde targetId hasta el primer destino “alcanzable”
    bfsResolve(targetId);

    function bfsResolve(startId: string) {
      const q: string[] = [startId];
      const seen = new Set<string>();

      while (q.length) {
        const nid = q.shift()!;
        if (seen.has(nid)) continue;
        seen.add(nid);

        const n = node(list, nid);
        if (!n) continue;

        // Resolver en orden de prioridad natural: VIDEO > QUIZ > CHOICE_GROUP
        if (isType(n, T.VIDEO)) {
          goToVideoNode(nid, n);
          return;
        }
        if (isType(n, T.QUIZ)) {
          setQuizId(nid);
          setMenuId(null);
          return;
        }
        if (isType(n, T.CHOICE_GROUP)) {
          setMenuId(nid);
          setQuizId(null);
          return;
        }
        if (isType(n, T.JUMP)) {
          const dest = n.data?.jumpToNodeId;
          if (dest) q.push(dest);
        }

        // Continuar expandiendo el grafo
        for (const k of children(n) || []) q.push(k);
      }
      // Si no encuentra nada, no hace nada (evita crashear)
    }
  }

  // ----------------- UI: MENÚ & QUIZ -----------------
  const menu = useMemo(
    () => (list && menuId ? getMenuForGroup(list, menuId) : null),
    [list, menuId]
  );

  if (loading)
    return overlayRoot(
      <div style={{ color: "#aaa" }}>Loading...</div>,
      onClose
    );
  if (error)
    return overlayRoot(<div style={{ color: "salmon" }}>{error}</div>, onClose);

  return overlayRoot(
    <>
      {/* CONTENEDOR DEL VIDEO + PROGRESS (relative para ubicar la barra) */}
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
              tabIndex={-1}
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
              {menu.options.map((opt: { targetId: string; label: string }) => (
                <button
                  key={opt.targetId}
                  style={btn}
                  onClick={() => onSelectOption(opt.targetId)}
                >
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
      {quizId && list && (
        <Quiz
          list={list}
          quizId={quizId}
          goToVideoNode={goToVideoNode}
          setMenuId={setMenuId}
          setQuizId={setQuizId}
        />
      )}
    </>,
    onClose
  );
}

/** ---------- Helpers de lógica ---------- */

function hasInteractiveAfter(list: any, videoNodeId: string) {
  if (findChoiceGroupAfter(list, videoNodeId)) return true;
  const kids = children(node(list, videoNodeId));
  if (!kids?.length) return false;
  const next = node(list, kids[0]);
  return (
    isType(next, T.QUIZ) || isType(next, T.CHOICE_GROUP) || isType(next, T.JUMP)
  );
}

function updateBufferedRelative(
  v: HTMLVideoElement,
  start: number,
  setBufferedEnd: (n: number) => void
) {
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

function fmt(t: number) {
  if (!Number.isFinite(t)) return "0:00";
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/** ---------- UI Helpers ---------- */
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

function Quiz({
  list,
  quizId,
  goToVideoNode,
  setMenuId,
  setQuizId,
}: {
  list: any;
  quizId: string;
  goToVideoNode: (id: string, videoNode: any) => void;
  setMenuId: (id: string | null) => void;
  setQuizId: (id: string | null) => void;
}) {
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
                // si querés validar isCorrect antes de avanzar, hacelo acá
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
              {a.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** ---- Estilos inline ---- */
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
  zIndex: 5, 
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
  backdropFilter: "blur(4px)",
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
  left: "50%",
  transform: "translateX(-50%)",
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
