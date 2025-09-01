import { HomeIcon, BellIcon } from "@heroicons/react/24/outline";

export default function BottomNav() {
  return (
    <nav className="bottomnav" aria-label="primary">
      <button className="tab" aria-current="page">
        <HomeIcon className="icon" />
      </button>
      <button className="tab">
        <BellIcon className="icon" />
      </button>
    </nav>
  );
}