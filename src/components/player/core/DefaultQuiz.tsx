import React from "react";
import { T, node, isType, children } from "@/components/player/utils/graphHelpers";

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

export default function DefaultQuiz({
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