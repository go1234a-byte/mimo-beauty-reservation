import type { MimoSalon } from "@/types/mimo";

// 목업 현재 위치 (지도 중심)
const CURRENT_LAT = 37.5015;
const CURRENT_LNG = 127.03;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getSalonDistance(salon: Pick<MimoSalon, "lat" | "lng">) {
  const meters = Math.round(haversineMeters(CURRENT_LAT, CURRENT_LNG, salon.lat, salon.lng));
  const walkMinutes = Math.max(1, Math.round(meters / 67));
  return { meters, walkMinutes };
}

export function formatDistanceLabel(salon: Pick<MimoSalon, "lat" | "lng">) {
  const { meters, walkMinutes } = getSalonDistance(salon);
  return `도보 ${walkMinutes}분 · ${meters}m`;
}
