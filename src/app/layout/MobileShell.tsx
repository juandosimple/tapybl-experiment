import { PropsWithChildren } from "react";
import BottomNav from "../../components/layout/BottomNav";

export default function MobileShell({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#000",
        color: "#fff",
      }}
    >
      {/* header simple */}
      <header style={{ padding: "10px", borderBottom: "1px solid #333" }}>
        <strong>microreels</strong>
      </header>

      {/* contenido dinámico */}
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>

      {/* footer simple */}
      <BottomNav></BottomNav>
    </div>
  );
}
