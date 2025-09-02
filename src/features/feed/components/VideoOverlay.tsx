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

export default function VideoOverlay({
  organizationId,
  lessonId,
  onClose,
}: Props) {
  const [preview, setPreview] = useState<any>(null);
  const [list, setList] = useState<any>(null);

  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null); // nodo “timeline”
  const [segment, setSegment] = useState<{
    url: string;
    start: number;
    end?: number;
    poster?: string;
    title?: string;
  } | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null); // primer contentUrl
  const [poster, setPoster] = useState<string | undefined>(undefined);

  // overlays
  const [menuId, setMenuId] = useState<string | null>(null); // id del CHOICE_GROUP actual
  const [quizId, setQuizId] = useState<string | null>(null); // id del QUIZ actual
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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
        const seg = toSegment(node(l, firstVideoId));
        setSegment(seg);
        setBaseUrl(seg.url);
        setPoster(seg.poster);

        // pre-chequeo: si luego del primer video hay menú, lo mostraremos al cortar en `end`
        const g = findChoiceGroupAfter(l, firstVideoId);
        if (g) setMenuId(null); // lo activamos al terminar el clip
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

  // on metadata loaded: seek al start del segmento actual
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !segment) return;
    const onLoaded = () => {
      try {
        v.currentTime = Math.max(0, segment.start ?? 0);
      } catch {}
      v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [segment?.url, segment?.start]);

  // timeupdate: cortar en end y mostrar overlay adecuado
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !list || !segment || !currentNodeId) return;
    const onTime = () => {
      if (segment.end != null && v.currentTime >= segment.end) {
        v.pause();
        // ¿hay choice group después?
        const g = findChoiceGroupAfter(list, currentNodeId);
        if (g) {
          setMenuId(g);
          setQuizId(null);
          return;
        }

        // ¿hay quiz (6) después directo?
        const kids = children(node(list, currentNodeId));
        const next = node(list, kids[0]);
        if (isType(next, T.QUIZ)) {
          setQuizId(kids[0]);
          setMenuId(null);
          return;
        }

        // sino, avanzar automático al siguiente VIDEO directo (si existiera)
        const nextVid = kids.find((id) => isType(node(list, id), T.VIDEO));
        if (nextVid) {
          const nv = node(list, nextVid);
          goToVideoNode(nextVid, nv);
        }
      }
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [segment?.end, list, currentNodeId]);

  function goToVideoNode(id: string, videoNode: any) {
    const seg = toSegment(videoNode);
    setCurrentNodeId(id);
    setPoster(seg.poster);

    // si la URL es la misma, solo seek; si cambia, reemplazamos src
    if (baseUrl && seg.url === baseUrl) {
      setSegment(seg); // mismo source, cambia el tramo
      // forzar seek inmediato en el próximo frame
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.currentTime = seg.start ?? 0;
          v.play().catch(() => {});
        }
      });
    } else {
      setSegment(seg); // y actualizamos baseUrl por si cambió
      setBaseUrl(seg.url);
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
      // otro menú
      setMenuId(targetId);
      return;
    }
    if (isType(t, T.VIDEO)) {
      // ir a clip de video
      goToVideoNode(targetId, t);
      return;
    }
    if (isType(t, T.JUMP)) {
      // salto a lo que sea
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
    // fallback: busca algún video alcanzable desde ese id
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

  // UI de quiz mínima (muestra y sigue al primer hijo luego de responder)
  function Quiz() {
    if (!list || !quizId) return null;
    const q = node(list, quizId);
    const question = q?.data?.question ?? "Question";
    const answers: Array<{ value: string; isCorrect?: boolean }> =
      q?.data?.answers ?? [];
    const nextId = children(q)[0]; // siguiente luego de quiz (según tu JSON)

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
                  // podrías validar a.isCorrect antes de avanzar
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

  if (loading)
    return overlayRoot(
      <div style={{ color: "#aaa" }}>Loading...</div>,
      onClose
    );
  if (error)
    return overlayRoot(<div style={{ color: "salmon" }}>{error}</div>, onClose);

  return overlayRoot(
    <>
      {/* VIDEO: siempre un solo <video> */}
      {baseUrl && (
        <video
          ref={videoRef}
          src={baseUrl}
          poster={poster}
          controls
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "100%",
            maxWidth: 900,
            background: "#000",
            borderRadius: 12,
          }}
        />
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
                  <PlayCircleIcon style={{ width: 20, height: 20 }} />{" "}
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
  padding:"2rem",
  borderRadius:"20px",
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
