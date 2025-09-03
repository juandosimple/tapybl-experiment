import React from "react";

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

export default function DefaultMenu({
  menu,
  onSelect,
}: {
  menu: { title: string; options: Array<{ targetId: string; label: string }> };
  onSelect: (id: string) => void;
}) {
  return (
    <div style={overlayBox}>
      <div style={overlayContainer}>
        <h3 style={overlayTitle}>{menu.title}</h3>
        <div style={{ display: "grid", gap: 10, maxWidth: 560 }}>
          {menu.options.map((opt) => (
            <button
              key={opt.targetId}
              style={btn}
              onClick={() => onSelect(opt.targetId)}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}