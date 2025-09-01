import TopBar from "../components/layout/TopBar";
import BottomNav from "../components/layout/BottomNav";

export default function App() {
  return (
    <div className="app">
      <TopBar />
      <main className="content">
        {/* acá va tu app: feed, reels, perfiles, etc. */}
        <section className="section">
          <h1 className="title">microreels</h1>
          <p className="muted">
            Base mínima lista. Conectá tu API en <code>lib/http.ts</code>.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}