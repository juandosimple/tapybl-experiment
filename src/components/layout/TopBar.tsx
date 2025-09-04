import {
  VideoCameraIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import logo from "@/assets/images/white_colour_with_tagline microreels.svg";

export default function TopBar() {
  return (
    <header className="topbar">
      <img src={logo} alt="Tapybl Micro Reels" width={120} height={40} />
      <div className="icons">
        <VideoCameraIcon className="icon" />
        <PaperAirplaneIcon className="icon" />
      </div>
    </header>
  );
}
