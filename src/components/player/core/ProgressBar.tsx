import React from "react";
import { fmt } from "../utils/time";

const wrap: React.CSSProperties = {
  userSelect: "none",
  paddingTop: 10,
  position: "absolute",
  bottom: 30,
  width: "80%",
  left: "50%",
  transform: "translateX(-50%)",
};
const track: React.CSSProperties = {
  position: "relative",
  height: 8,
  borderRadius: 999,
  background: "rgba(255,255,255,.15)",
  pointerEvents: "none",
};
const buf: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: 8,
  borderRadius: 999,
  background: "rgba(255,255,255,.25)",
  pointerEvents: "none",
};
const prog: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  height: 8,
  borderRadius: 999,
  background: "linear-gradient(90deg, #60840ab3, #b7ef36ff)",
  pointerEvents: "none",
};
const timeLabel: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#cbd5e1",
  fontSize: 12,
  marginBottom: 6,
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
};

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
    <div style={wrap} aria-hidden={false}>
      <div style={timeLabel}>
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
        style={track}
      >
        <div style={{ ...buf, width: `${pctBuf}%` }} />
        <div style={{ ...prog, width: `${pct}%` }} />
      </div>
    </div>
  );
}