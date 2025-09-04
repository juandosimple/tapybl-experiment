import React from "react";
import { fmt } from "../utils/time";
import styles from "./ProgressBar.module.css";

export default function ProgressBar({
  current,
  duration,
  buffered,
}: {
  current: number;
  duration: number;
  buffered: number;
}) {
  const pct = duration > 0 ? (Math.min(current, duration) / duration) * 100 : 0;
  const pctBuf =
    duration > 0 ? (Math.min(buffered, duration) / duration) * 100 : 0;

  return (
    <div className={styles["progress-bar"]} aria-hidden={false}>
      <div className={styles["progress-bar__time-label"]}>
        <span aria-label="elapsed">{fmt(current)}</span>
        <span aria-label="duration">{fmt(duration)}</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={Math.min(current, duration)}
        aria-label="Video progress"
        tabIndex={-1}
        className={styles["progress-bar__track"]}
      >
        <div
          className={styles["progress-bar__buffer"]}
          style={{ width: `${pctBuf}%` }}
        />
        <div
          className={styles["progress-bar__progress"]}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
