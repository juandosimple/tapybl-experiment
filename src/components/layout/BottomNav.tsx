import { Link, useLocation } from "react-router-dom";
import { HomeIcon, BellIcon, UserCircleIcon } from "@heroicons/react/24/outline";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", icon: HomeIcon, label: "Home" },
    { to: "/notifications", icon: BellIcon, label: "Notificaciones" },
    { to: "/profile", icon: UserCircleIcon, label: "Perfil" },
  ];

  return (
    <nav className="bottomnav" aria-label="primary">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.to;
        return (
          <Link key={t.to} to={t.to} className={`tab ${active ? "active" : ""}`}>
            <Icon className="icon" />
          </Link>
        );
      })}
    </nav>
  );
}