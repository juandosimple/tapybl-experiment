export type VideoClip = {
  url: string;
  poster?: string | null;
  title?: string | null;
  start?: number;  // segundos
  end?: number;    // segundos
  duration?: number; // segundos del clip
  nodeId: string;  // id del nodo en el grafo
};

type ContentNode = {
  data?: {
    ivNodeType?: number;
    contentUrl?: string | null;
    placeholderUrl?: string | null;
    title?: string | null;
    startInSeconds?: number | null;
    endInSeconds?: number | null;
    durationInSeconds?: number | null;
    // otros campos...
  };
  parentsIds?: string[] | null;
  childIds?: string[] | null;
};

type ContentList = {
  rootId: string;
  items: Record<string, ContentNode>;
};

type LessonContent = {
  contentList?: ContentList;
};

type PreviewShape = {
  lessonContent?: LessonContent;
  // ... otros campos
};

const isHttp = (u: any) => typeof u === "string" && /^https?:\/\//.test(u);

function toClip(nodeId: string, n: ContentNode): VideoClip | null {
  const d = n?.data ?? {};
  if (d?.ivNodeType !== 0) return null; // solo nodos de video
  if (!isHttp(d.contentUrl)) return null;

  const start = typeof d.startInSeconds === "number" ? d.startInSeconds : undefined;
  const end   = typeof d.endInSeconds === "number" ? d.endInSeconds : undefined;
  const dur   = typeof d.durationInSeconds === "number" ? d.durationInSeconds : (end && start ? end - start : undefined);

  return {
    url: d.contentUrl!,
    poster: d.placeholderUrl ?? null,
    title: d.title ?? null,
    start,
    end,
    duration: dur,
    nodeId,
  };
}

/**
 * Recorre el grafo BFS desde root y devuelve:
 * - firstClip: el primer clip de video encontrado (ideal para reproducir de inmediato)
 * - allClips: todos los clips de video alcanzables (por si querés ofrecer navegación)
 */
export function extractClipsFromPreview(preview: PreviewShape): { firstClip: VideoClip | null; allClips: VideoClip[] } {
  const list = preview?.lessonContent?.contentList;
  if (!list?.rootId || !list?.items) return { firstClip: null, allClips: [] };

  const items = list.items;
  const visited = new Set<string>();
  const q: string[] = [list.rootId];
  const clips: VideoClip[] = [];

  while (q.length) {
    const id = q.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = items[id];
    if (!node) continue;

    // Si es un video, lo guardamos
    const clip = toClip(id, node);
    if (clip) clips.push(clip);

    // Continuamos recorriendo hijos (si hay branching, BFS toma el primero disponible naturalmente)
    const children = node.childIds ?? [];
    for (const childId of children) {
      if (childId && !visited.has(childId)) q.push(childId);
    }
  }

  return { firstClip: clips[0] ?? null, allClips: clips };
}