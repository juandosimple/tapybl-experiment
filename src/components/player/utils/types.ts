export type Segment = { url: string; start: number; end?: number; poster?: string; title?: string; };
export type Cue = { at: number; type: "quiz" | "menu" | "jump"; targetId: string };

export type Graph = {
  rootId: string;
  items: Record<string, any>;
};

export type PlayerEvent =
  | { type: "START_SEGMENT"; nodeId: string; segment: Segment }
  | { type: "OPEN_MENU"; groupId: string }
  | { type: "OPEN_QUIZ"; quizId: string }
  | { type: "JUMP"; fromId: string; toId: string }
  | { type: "COMPLETE_SEGMENT"; nodeId: string }
  | { type: "ERROR"; message: string };