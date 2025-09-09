import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", icon: HomeIcon, label: "Home" },
    { to: "/explore", icon: MagnifyingGlassIcon, label: "Explore" },
    { to: "/notifications", icon: BellIcon, label: "Notifications" },
    { to: "/profile", icon: UserCircleIcon, label: "Profile" },
  ];

  return (
    <nav className="bottomnav" aria-label="primary">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.to;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={`tab ${active ? "active" : ""}`}
          >
            <Icon className="nav_icon" />
          </Link>
        );
      })}
    </nav>
  );
}
