import React from "react";
import {
  T,
  node,
  isType,
  children,
} from "@/components/player/utils/graphHelpers";
import styles from "./DefaultQuiz.module.css";

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
    <div className={styles["quiz-overlay"]}>
      <div className={styles["quiz-overlay__container"]}>
        <h3 className={styles["quiz-overlay__title"]}>{question}</h3>
        <div className={styles["quiz-overlay__button-container"]}>
          {answers.map((a, i) => (
            <button
              key={i}
              className={styles["quiz-overlay__button"]}
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
