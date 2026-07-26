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


// 목업 지도 좌표 범위(강남 일대 bounding box, MockMapView.tsx와 동일한 범위) —
// 실제 지오코딩 API가 없으므로, 매장 주소 문자열을 해시해 이 범위 안의 좌표를 결정적으로 생성한다.
// (실 서비스 전환 시 실제 지오코딩 API로 교체 필요.)
const MOCK_LAT_MIN = 37.4955;
const MOCK_LAT_MAX = 37.5075;
const MOCK_LNG_MIN = 127.0245;
const MOCK_LNG_MAX = 127.0355;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 매장 등록 시 주소 문자열만으로 목업 지도 위 좌표를 결정적으로 생성한다. */
export function mockGeocode(address: string): { lat: number; lng: number } {
  const h = hashString(address || "mimo-salon");
  const latRatio = (h % 1000) / 1000;
  const lngRatio = ((h >> 10) % 1000) / 1000;
  return {
    lat: MOCK_LAT_MIN + latRatio * (MOCK_LAT_MAX - MOCK_LAT_MIN),
    lng: MOCK_LNG_MIN + lngRatio * (MOCK_LNG_MAX - MOCK_LNG_MIN),
  };
}
