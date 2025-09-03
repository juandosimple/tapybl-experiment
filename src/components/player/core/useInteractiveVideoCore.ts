import { useEffect, useMemo, useRef, useState } from "react";
import { T, node, isType, children, findChoiceGroupAfter, getMenuForGroup, toSegment, resolveFromText } from "@/components/player/utils/graphHelpers";
import { Graph, Segment, Cue, PlayerEvent } from "../utils/types";
import { bfsResolveFactory, hasInteractiveAfter } from "../utils/nav";
import { computeBufferedRelative } from "../utils/time";

type Args = {
  graph: Graph | null;
  onEvent?: (e: PlayerEvent) => void;
};
export function useInteractiveVideoCore({ graph, onEvent }: Args) {
  const [list, setList] = useState<any>(null);

  // overlays
  const [menuId, setMenuId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // timeline
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [segment, setSegment] = useState<Segment | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | undefined>(undefined);

  // status
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // progress
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [segDuration, setSegDuration] = useState(0);
  const [segCurrent, setSegCurrent] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  // cues
  const [cueIndex, setCueIndex] = useState(0);
  const cues: Cue[] = useMemo(() => {
    if (!list || !currentNodeId) return [];
    try {
      const raw = (resolveFromText?.(list, currentNodeId) ?? []) as Cue[];
      return raw.filter(c => Number.isFinite(c.at) && c.at >= 0).sort((a,b)=>a.at-b.at);
    } catch { return []; }
  }, [list, currentNodeId]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setList(graph);
    if (!graph) { setLoading(false); return; }

    const q = [graph.rootId].filter(Boolean) as string[];
    const seen = new Set<string>();
    let firstVideoId: string | null = null;
    while (q.length) {
      const id = q.shift()!; if (seen.has(id)) continue; seen.add(id);
      const n = node(graph, id); if (!n) continue;
      if (isType(n, T.VIDEO)) { firstVideoId = id; break; }
      for (const k of children(n)) q.push(k);
    }
    if (!firstVideoId) {
      setError("No se encontró video.");
      setLoading(false);
      return;
    }

    setCurrentNodeId(firstVideoId);
    const raw = toSegment(node(graph, firstVideoId));
    const keepEnd = hasInteractiveAfter(graph, firstVideoId) && raw.end != null;
    const seg = keepEnd ? raw : { ...raw, end: undefined };
    setSegment(seg);
    setBaseUrl(seg.url);
    setPoster(seg.poster);
    setMenuId(null); setQuizId(null); setCueIndex(0);
    setLoading(false);
    onEvent?.({ type: "START_SEGMENT", nodeId: firstVideoId, segment: seg });
  }, [graph]);

  useEffect(() => {
    const v = videoRef.current; if (!v || !segment) return;

    const onLoaded = () => {
      try {
        const start = Math.max(0, segment.start ?? 0);
        const rawDur = Number.isFinite(v.duration) ? v.duration : 0;
        const end = segment.end != null ? Math.min(segment.end, rawDur) : rawDur;
        const effDur = Math.max(0, end - start);
        v.currentTime = start;
        setSegDuration(effDur);
        setSegCurrent(0);
        computeBufferedRelative(v, start, setBufferedEnd);
      } catch {}
      v.play().catch(()=>{});
    };

    const onProgress = () => computeBufferedRelative(v, segment.start ?? 0, setBufferedEnd);

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("progress", onProgress);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("progress", onProgress);
    };
  }, [segment?.url, segment?.start, segment?.end]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !list || !segment || !currentNodeId) return;

    const onTime = () => {
      const start = segment.start ?? 0;
      const endAbs = segment.end ?? (Number.isFinite(v.duration) ? v.duration : Infinity);
      const rel = Math.max(0, Math.min(v.currentTime - start, Math.max(0, endAbs - start)));
      setSegCurrent(rel);

      const nextCue = cues[cueIndex];
      if (nextCue && rel >= nextCue.at - 0.05) {
        v.pause();
        if (nextCue.type === "menu") {
          setMenuId(nextCue.targetId); setQuizId(null);
          onEvent?.({ type: "OPEN_MENU", groupId: nextCue.targetId });
        } else if (nextCue.type === "quiz") {
          setQuizId(nextCue.targetId); setMenuId(null);
          onEvent?.({ type: "OPEN_QUIZ", quizId: nextCue.targetId });
        } else if (nextCue.type === "jump") {
          const dest = node(list, nextCue.targetId);
          if (dest) {
            if (isType(dest, T.VIDEO)) goToVideoNode(nextCue.targetId, dest);
            else if (isType(dest, T.CHOICE_GROUP)) { setMenuId(nextCue.targetId); onEvent?.({ type:"OPEN_MENU", groupId: nextCue.targetId }); }
            else if (isType(dest, T.QUIZ)) { setQuizId(nextCue.targetId); onEvent?.({ type:"OPEN_QUIZ", quizId: nextCue.targetId }); }
          }
          onEvent?.({ type: "JUMP", fromId: currentNodeId!, toId: nextCue.targetId });
        }
        setCueIndex(i => i + 1);
        return;
      }

      if (segment.end != null && v.currentTime >= segment.end - 0.05) {
        v.pause();
        onEvent?.({ type: "COMPLETE_SEGMENT", nodeId: currentNodeId! });
        const g = findChoiceGroupAfter(list, currentNodeId);
        if (g) { setMenuId(g); setQuizId(null); onEvent?.({ type:"OPEN_MENU", groupId: g }); return; }
        const kids = children(node(list, currentNodeId));
        const next = node(list, kids[0]);
        if (isType(next, T.QUIZ)) { setQuizId(kids[0]); setMenuId(null); onEvent?.({ type:"OPEN_QUIZ", quizId: kids[0] }); return; }
        const nextVid = kids.find((id) => isType(node(list, id), T.VIDEO));
        if (nextVid) goToVideoNode(nextVid, node(list, nextVid));
      }
    };

    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [segment?.end, segment?.start, list, currentNodeId, cues, cueIndex]);

  function goToVideoNode(id: string, videoNode: any) {
    if (!list) return;
    const raw = toSegment(videoNode);
    const keepEnd = hasInteractiveAfter(list, id) && raw.end != null;
    const seg = keepEnd ? raw : { ...raw, end: undefined };

    setCurrentNodeId(id);
    setPoster(seg.poster);
    setCueIndex(0);

    if (baseUrl && seg.url === baseUrl) {
      setSegment(seg);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) { v.currentTime = seg.start ?? 0; v.play().catch(()=>{}); }
      });
    } else {
      setSegment(seg);
      setBaseUrl(seg.url);
    }
    setMenuId(null); setQuizId(null);
    onEvent?.({ type: "START_SEGMENT", nodeId: id, segment: seg });
  }

  function onSelectOption(targetId: string) {
    if (!list) return;
    const bfsResolve = bfsResolveFactory({ list, goToVideoNode, setMenuId, setQuizId, onEvent });
    bfsResolve(targetId);
  }

  const menu = useMemo(() => (list && menuId ? getMenuForGroup(list, menuId) : null), [list, menuId]);

  return {
    state: {
      loading, error,
      video: { baseUrl, poster, ref: videoRef },
      progress: { segCurrent, segDuration, bufferedEnd },
      overlays: { menu, quizId, list },
    },
    actions: { onSelectOption, goToVideoNode, setMenuId, setQuizId },
  };
}