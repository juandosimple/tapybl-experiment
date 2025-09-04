import { PropsWithChildren } from "react";
import BottomNav from "@/components/layout/BottomNav";

export default function MobileShell({ children }: PropsWithChildren) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100dvh",
        background: "#fff",
        color: "#fff",
      }}
    >
      <header style={{ padding: "10px" }}>
        <strong style={{color:"#000"}}>Tapybl Micro reels</strong>
      </header>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>

      <BottomNav></BottomNav>
    </div>
  );
}
