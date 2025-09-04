import { VideoCameraIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export default function TopBar() {
  return (
    <header className="topbar">
      <strong>Tapybl Micro reels</strong>
      <div className="icons">
        <VideoCameraIcon className="icon" />
        <PaperAirplaneIcon className="icon" />
      </div>
    </header>
  );
}