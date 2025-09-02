// Tipos mínimos
export type NodeData = {
  ivNodeType?: number;
  title?: string | null;
  text?: string | null;
  contentUrl?: string | null;
  placeholderUrl?: string | null;
  startInSeconds?: number | null;
  endInSeconds?: number | null;
  durationInSeconds?: number | null;
  jumpToNodeId?: string | null; // para ivNodeType 24
};

export type GraphNode = {
  data?: NodeData;
  parentsIds?: string[] | null;
  childIds?: string[] | null;
};

export type ContentList = {
  rootId: string;
  items: Record<string, GraphNode>;
};

export type Preview = {
  lessonContent?: { contentList?: ContentList };
};

// utils
export const T = {
  VIDEO: 0,
  CHOICE: 2,
  CHOICE_GROUP: 3,
  TEXT: 23,
  JUMP: 24,
  QUIZ: 6,
};

export function node(list: any, id?: string | null) {
  return id ? list.items?.[id] : null;
}
export function isType(n: any, t: number) {
  return n?.data?.ivNodeType === t;
}
export function children(n: any): string[] {
  return (n?.childIds ?? []).filter(Boolean);
}

export function getList(preview: Preview): ContentList | null {
  const l = preview?.lessonContent?.contentList;
  return l?.rootId && l?.items ? l : null;
}

export function firstReachable(
  list: ContentList,
  predicate: (id: string, n: GraphNode) => boolean
): string | null {
  const q = [list.rootId];
  const seen = new Set<string>();
  while (q.length) {
    const id = q.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = list.items[id];
    if (!n) continue;
    if (predicate(id, n)) return id;
    const kids = n.childIds ?? [];
    for (const k of kids) if (k && !seen.has(k)) q.push(k);
  }
  return null;
}

export function toClip(n: GraphNode) {
  const d = n.data!;
  return {
    url: d.contentUrl!,
    poster: d.placeholderUrl ?? undefined,
    title: d.title ?? undefined,
    start: typeof d.startInSeconds === "number" ? d.startInSeconds : undefined,
    end: typeof d.endInSeconds === "number" ? d.endInSeconds : undefined,
  };
}

// siguiente “contenido” desde un nodo TEXT (opción): puede ser VIDEO o JUMP
export function resolveFromText(list: any, textId: string): string | null {
  const n = node(list, textId);
  const first = children(n)[0];
  const d = node(list, first);
  if (!d) return null;
  if (isType(d, T.VIDEO) || isType(d, T.CHOICE_GROUP) || isType(d, T.QUIZ))
    return first;
  if (isType(d, T.JUMP)) return d.data?.jumpToNodeId ?? null;
  return null;
}

// buscar grupo de opciones (2->3) a partir de un nodo (típicamente VIDEO)
export function findChoiceGroupAfter(list: any, fromId: string): string | null {
  const a = children(node(list, fromId));
  for (const id of a) {
    const A = node(list, id);
    if (isType(A, T.CHOICE)) {
      for (const b of children(A))
        if (isType(node(list, b), T.CHOICE_GROUP)) return b;
    }
    if (isType(A, T.CHOICE_GROUP)) return id;
  }
  return null;
}

// sacar título del grupo y opciones {label, targetId}
export function getMenuForGroup(list: any, groupId: string) {
  const g = node(list, groupId);
  const title = g?.data?.title ?? "Choose your path:";
  const opts = children(g)
    .map((textId) => {
      const t = node(list, textId);
      if (!isType(t, T.TEXT)) return null;
      const targetId = resolveFromText(list, textId);
      if (!targetId) return null;
      return { label: t.data?.text ?? "Option", targetId };
    })
    .filter(Boolean);
  return { title, options: opts as Array<{ label: string; targetId: string }> };
}

// convertir VIDEO node a segmento
export function toSegment(v: any) {
  const d = v?.data ?? {};
  return {
    url: d.contentUrl as string,
    start: typeof d.startInSeconds === "number" ? d.startInSeconds : 0,
    end: typeof d.endInSeconds === "number" ? d.endInSeconds : undefined,
    poster: d.placeholderUrl as string | undefined,
    title: d.title as string | undefined,
  };
}

export type ChoiceOption = { label: string; targetNodeId: string };

export function getOptionsForGroup(
  list: ContentList,
  groupId: string
): { title: string; options: ChoiceOption[] } {
  const group = list.items[groupId];
  const title = group?.data?.title ?? "Choose your path:";

  const options: ChoiceOption[] = [];
  const children = group?.childIds ?? [];
  for (const id of children) {
    const n = list.items[id];
    if (!isType(n, T.TEXT)) continue;
    const label = n?.data?.text ?? "Option";
    // destino: hijo del texto
    const kids = n?.childIds ?? [];
    if (!kids?.length) continue;
    const dest = list.items[kids[0]];
    if (!dest) continue;

    if (isType(dest, T.VIDEO)) {
      options.push({ label, targetNodeId: kids[0] });
    } else if (isType(dest, T.JUMP)) {
      const jumpTo = dest.data?.jumpToNodeId ?? "";
      if (jumpTo) options.push({ label, targetNodeId: jumpTo });
    }
  }
  return { title, options };
}
