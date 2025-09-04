// src/components/organization/OrganizationAvatar.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiMyOrganization, type OrganizationDetailsResponse } from "@/features/auth/api";

type Props = {
  size?: number;
  showName?: boolean;
  className?: string;
};

// cache simple en módulo para evitar N requests si renderizan muchas cards
let _orgCache: OrganizationDetailsResponse["organization"] | null = null;
let _pending: Promise<OrganizationDetailsResponse> | null = null;

export default function OrganizationAvatar({ size = 28, showName = true, className = "" }: Props) {
  const [org, setOrg] = useState<OrganizationDetailsResponse["organization"] | null>(_orgCache);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    if (_orgCache) {
      setOrg(_orgCache);
      return;
    }

    // de-duplicar requests concurrentes
    const p = _pending ?? apiMyOrganization();
    _pending = p as any;

    p.then((res: any) => {
      const organization = ("organization" in res ? res.organization : res?.data?.organization) as OrganizationDetailsResponse["organization"];
      _orgCache = organization ?? null;
      if (mounted) setOrg(_orgCache);
    })
      .catch((e: any) => {
        if (mounted) setErr(e?.message || "Error loading organization");
      })
      .finally(() => {
        _pending = null;
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (err) {
    return <div className={className} style={{ fontSize: 12, color: "#f88" }}>Org error</div>;
  }

  // Skeleton minimal
  if (!org) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
          }}
        />
        {showName && (
          <div style={{ width: 90, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.12)" }} />
        )}
      </div>
    );
  }

  const { id, name, avatar } = org;

  return (
    <Link
      to={`/channel/${encodeURIComponent(id)}`}
      className={className}
      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
      aria-label={`Open channel ${name}`}
    >
      <img
        src={avatar || ""}
        alt={name || "Organization"}
        width={size}
        height={size}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            "data:image/svg+xml;utf8," +
            encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='#3b4252'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='sans-serif' font-size='${Math.max(
                10,
                size / 3
              )}'>ORG</text></svg>`
            );
        }}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
          border: "1px solid rgba(255,255,255,0.08)",
          marginRight:5
        }}
      />
      {showName && <span style={{  fontSize: 13, lineHeight: 1 }}>{name}</span>}
    </Link>
  );
}