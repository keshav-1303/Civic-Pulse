"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import Link from "next/link";
import { CATEGORY_META, STATUS_META, type Issue } from "@/lib/types";
import { useIsDark } from "./useIsDark";

function pinIcon(issue: Issue) {
  const meta = CATEGORY_META[issue.category];
  const ring = issue.urgency === "critical" ? "#dc2626" : issue.status === "resolved" ? "#16b783" : meta.color;
  const pulse = issue.urgency === "critical" && issue.status !== "resolved";
  return L.divIcon({
    className: "civic-pin",
    html: `<div style="position:relative;display:flex;align-items:center;justify-content:center">
      ${pulse ? `<span style="position:absolute;width:38px;height:38px;border-radius:9999px;background:${ring}33;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite"></span>` : ""}
      <div style="width:30px;height:30px;border-radius:9999px;background:#fff;border:3px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 10px rgba(8,13,24,.25)">${meta.icon}</div>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function IssuesMap({
  issues,
  center,
  zoom = 13,
  height = "100%",
}: {
  issues: Issue[];
  center: [number, number];
  zoom?: number;
  height?: string;
}) {
  const isDark = useIsDark();
  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-ink-100">
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <Recenter center={center} />
        <TileLayer
          key={isDark ? "dark" : "light"}
          attribution='&copy; OpenStreetMap'
          url={
            isDark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />
        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.location.lat, issue.location.lng]} icon={pinIcon(issue)}>
            <Popup>
              <div className="min-w-[200px]">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: STATUS_META[issue.status].color }}>
                    ● {STATUS_META[issue.status].label}
                  </span>
                </div>
                <div className="text-sm font-bold leading-snug text-ink-900">{issue.title}</div>
                <div className="mt-1 text-xs text-ink-500">
                  {CATEGORY_META[issue.category].label} · Severity {issue.severity}/5
                </div>
                <div className="mt-1 text-xs text-ink-400">{issue.location.address}</div>
                <Link href={`/issues/${issue.id}`} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
