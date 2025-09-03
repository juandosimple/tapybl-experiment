import {
  T,
  node,
  isType,
  children,
  findChoiceGroupAfter,
} from "@/components/player/utils/graphHelpers";

export function hasInteractiveAfter(list: any, videoNodeId: string) {
  if (findChoiceGroupAfter(list, videoNodeId)) return true;
  const kids = children(node(list, videoNodeId));
  if (!kids?.length) return false;
  const next = node(list, kids[0]);
  return (
    isType(next, T.QUIZ) || isType(next, T.CHOICE_GROUP) || isType(next, T.JUMP)
  );
}

export function bfsResolveFactory({
  list,
  goToVideoNode,
  setMenuId,
  setQuizId,
  onEvent,
}: {
  list: any;
  goToVideoNode: (id: string, videoNode: any) => void;
  setMenuId: (id: string | null) => void;
  setQuizId: (id: string | null) => void;
  onEvent?: (e: any) => void;
}) {
  return function bfsResolve(startId: string) {
    const start = node(list, startId);
    if (start) {
      if (isType(start, T.CHOICE_GROUP)) {
        setMenuId(startId);
        setQuizId(null);
        onEvent?.({ type: "OPEN_MENU", groupId: startId });
        return;
      }
      if (isType(start, T.VIDEO)) {
        goToVideoNode(startId, start);
        return;
      }
      if (isType(start, T.QUIZ)) {
        setQuizId(startId);
        setMenuId(null);
        onEvent?.({ type: "OPEN_QUIZ", quizId: startId });
        return;
      }
      if (isType(start, T.JUMP)) {
        const dest = start.data?.jumpToNodeId;
        if (dest) return bfsResolve(dest);
      }
    }

    const q: string[] = [startId];
    const seen = new Set<string>();
    while (q.length) {
      const nid = q.shift()!;
      if (seen.has(nid)) continue;
      seen.add(nid);

      const n = node(list, nid);
      if (!n) continue;

      if (isType(n, T.VIDEO)) {
        goToVideoNode(nid, n);
        return;
      }
      if (isType(n, T.QUIZ)) {
        setQuizId(nid);
        setMenuId(null);
        onEvent?.({ type: "OPEN_QUIZ", quizId: nid });
        return;
      }
      if (isType(n, T.CHOICE_GROUP)) {
        setMenuId(nid);
        setQuizId(null);
        onEvent?.({ type: "OPEN_MENU", groupId: nid });
        return;
      }
      if (isType(n, T.JUMP)) {
        const dest = n.data?.jumpToNodeId;
        if (dest) q.push(dest);
      }
      for (const k of children(n) || []) q.push(k);
    }
  };
}
