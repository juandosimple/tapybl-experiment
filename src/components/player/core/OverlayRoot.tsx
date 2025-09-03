import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

const root: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.98)",
  display: "flex",
  flexDirection: "column",
  zIndex: 1000,
};
const topbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  padding: 10,
};
const iconBtn: React.CSSProperties = {
  background: "none",
  border: 0,
  color: "#fff",
};
const body: React.CSSProperties = {
  flex: 1,
  display: "grid",
  alignContent: "center",
  padding: 12,
  position: "relative",
};

export default function OverlayRoot({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div style={root} role="dialog" aria-modal="true">
      <div style={topbar}>
        <button onClick={onClose} title="Cerrar" style={iconBtn}>
          <XMarkIcon style={{ width: 28, height: 28 }} />
        </button>
      </div>
      <div style={body}>{children}</div>
    </div>
  );
}