import { PropsWithChildren } from "react";
import BottomNav from "@/components/layout/BottomNav";
import logo from "@/assets/images/black_font_logo.svg";

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
        <img src={logo} alt="Tapybl Micro Reels" width={120} height={40} />
      </header>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>

      <BottomNav></BottomNav>
    </div>
  );
}
