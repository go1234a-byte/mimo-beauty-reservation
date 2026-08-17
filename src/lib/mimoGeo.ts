import type { MimoCoordinates, MimoSalon } from "@/types/mimo";

// 서울 강남 일대 — 위치 권한이 아직 없거나 실패했을 때만 쓰는 최후의 폴백.
// 실제 거리/지도 중심은 LocationContext에서 제공하는 브라우저 Geolocation 좌표를 사용한다.
export const MIMO_FALLBACK_COORDS: MimoCoordinates = { lat: 37.5015, lng: 127.03 };

function haversineMeters(a: MimoCoordinates, b: MimoCoordinates) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2) ** 2;
  const sinLng = Math.sin(dLng / 2) ** 2;
  const h = sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// 평균 도보 속도 67m/분(4km/h), 시내 평균 주행 속도 약 210m/분(12.6km/h, 신호/정체 감안)로
// 근사한다. 실제 경로가 아닌 직선거리 기반 추정치이므로 어디까지나 "참고용" 정보다.
const WALK_METERS_PER_MIN = 67;
const DRIVE_METERS_PER_MIN = 210;

export function getSalonDistance(salon: Pick<MimoSalon, "lat" | "lng">, from: MimoCoordinates) {
  const meters = Math.round(haversineMeters(from, { lat: salon.lat, lng: salon.lng }));
  const walkMinutes = Math.max(1, Math.round(meters / WALK_METERS_PER_MIN));
  const driveMinutes = Math.max(1, Math.round(meters / DRIVE_METERS_PER_MIN));
  return { meters, walkMinutes, driveMinutes };
}

export function formatDistanceLabel(salon: Pick<MimoSalon, "lat" | "lng">, from: MimoCoordinates) {
  const { meters, walkMinutes } = getSalonDistance(salon, from);
  if (meters >= 1000) {
    return `도보 ${walkMinutes}분 · ${(meters / 1000).toFixed(1)}km`;
  }
  return `도보 ${walkMinutes}분 · ${meters}m`;
}

/** 카드용 짧은 ETA 라벨: "도보 4분 · 자동차 2분" */
export function formatEtaLabel(salon: Pick<MimoSalon, "lat" | "lng">, from: MimoCoordinates) {
  const { walkMinutes, driveMinutes } = getSalonDistance(salon, from);
  return `도보 ${walkMinutes}분 · 자동차 ${driveMinutes}분`;
}

export function formatServiceDurationLabel(minutes: number) {
  return `약 ${minutes}분`;
}

export function sortSalonsByDistance<T extends Pick<MimoSalon, "lat" | "lng">>(
  salons: T[],
  from: MimoCoordinates,
): T[] {
  return [...salons].sort(
    (a, b) => getSalonDistance(a, from).meters - getSalonDistance(b, from).meters,
  );
}
