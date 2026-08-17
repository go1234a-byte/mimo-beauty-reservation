import { useEffect, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, useMap, type MapCameraChangedEvent } from "@vis.gl/react-google-maps";
import { Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MimoCoordinates, MimoSalon } from "@/types/mimo";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
// Map ID가 없으면 Google이 문서/데모용으로 공개 제공하는 기본 Map ID를 사용한다.
// (Advanced Markers를 쓰려면 Map ID가 필수) — 프로덕션에서는 Cloud Console에서
// 직접 발급한 Map ID로 교체해 커스텀 스타일을 적용하는 것을 권장한다.
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface GoogleMapViewProps {
  salons: MimoSalon[];
  currentLocation: MimoCoordinates;
  selectedSalonId?: string | null;
  onSelectSalon?: (salonId: string) => void;
  /** 지도를 움직일 때마다 현재 화면에 보이는 영역(bounds)을 알려준다 — 하단 리스트를 뷰포트 기준으로 갱신하기 위함 */
  onBoundsChanged?: (bounds: MapBounds) => void;
}

/** currentLocation이 바뀔 때마다 지도 카메라를 부드럽게 이동시킨다 */
function MapCameraSync({ center }: { center: MimoCoordinates }) {
  const map = useMap();
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!map) return;
    const key = `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    map.panTo(center);
  }, [map, center]);

  return null;
}

/** 카드를 탭해서 selectedSalonId가 바뀌면 해당 매장 핀으로 부드럽게 이동한다 (카드 선택 → 핀 강조) */
function SelectedSalonPan({ salon }: { salon: MimoSalon | undefined }) {
  const map = useMap();
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !salon) return;
    if (lastId.current === salon.id) return;
    lastId.current = salon.id;
    map.panTo({ lat: salon.lat, lng: salon.lng });
  }, [map, salon]);

  return null;
}

function RecenterButton({ target }: { target: MimoCoordinates }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => {
        map?.panTo(target);
        map?.setZoom(16);
      }}
      className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-mimo-sm transition-transform active:scale-95"
      aria-label="현재 위치로 이동"
    >
      <Navigation className="h-4.5 w-4.5 text-foreground" />
    </button>
  );
}

function CurrentLocationMarker({ position }: { position: MimoCoordinates }) {
  return (
    <AdvancedMarker position={position} zIndex={10}>
      <div className="relative">
        <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-primary/30" />
        <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground bg-primary shadow-mimo-sm" />
      </div>
    </AdvancedMarker>
  );
}

function SalonMarker({
  salon,
  active,
  onSelect,
}: {
  salon: MimoSalon;
  active: boolean;
  onSelect?: (salonId: string) => void;
}) {
  return (
    <AdvancedMarker
      position={{ lat: salon.lat, lng: salon.lng }}
      onClick={() => onSelect?.(salon.id)}
      zIndex={active ? 20 : 5}
    >
      <div
        className={cn(
          "flex max-w-[140px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold shadow-mimo-sm transition-all duration-200",
          active
            ? "scale-110 border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground",
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-primary-foreground" : "bg-primary")} />
        <span className="truncate">{salon.name}</span>
      </div>
    </AdvancedMarker>
  );
}

function MapKeyMissingFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-secondary px-6 text-center">
      <p className="text-sm font-semibold text-foreground">지도를 표시할 수 없어요</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        .env 파일에 VITE_GOOGLE_MAPS_API_KEY를 설정한 뒤 다시 시작해주세요.
      </p>
    </div>
  );
}

export function GoogleMapView({
  salons,
  currentLocation,
  selectedSalonId,
  onSelectSalon,
  onBoundsChanged,
}: GoogleMapViewProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MapKeyMissingFallback />;
  }

  const selectedSalon = salons.find((s) => s.id === selectedSalonId);

  const handleCameraChanged = (event: MapCameraChangedEvent) => {
    const b = event.detail.bounds;
    if (b && onBoundsChanged) {
      onBoundsChanged({ north: b.north, south: b.south, east: b.east, west: b.west });
    }
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="relative h-full w-full overflow-hidden">
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={currentLocation}
          defaultZoom={15}
          minZoom={11}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          onBoundsChanged={handleCameraChanged}
          className="h-full w-full"
        >
          <CurrentLocationMarker position={currentLocation} />
          {salons.map((salon) => (
            <SalonMarker
              key={salon.id}
              salon={salon}
              active={selectedSalonId === salon.id}
              onSelect={onSelectSalon}
            />
          ))}
        </Map>
        <MapCameraSync center={currentLocation} />
        <SelectedSalonPan salon={selectedSalon} />
        <RecenterButton target={currentLocation} />
      </div>
    </APIProvider>
  );
}

export function isSalonWithinBounds(salon: Pick<MimoSalon, "lat" | "lng">, bounds: MapBounds | null) {
  if (!bounds) return true;
  const withinLat = salon.lat <= bounds.north && salon.lat >= bounds.south;
  // 경도는 날짜변경선을 넘는 극단적인 케이스를 무시한 단순 비교로 충분 (서비스 지역이 국지적이므로)
  const withinLng =
    bounds.west <= bounds.east
      ? salon.lng <= bounds.east && salon.lng >= bounds.west
      : salon.lng >= bounds.west || salon.lng <= bounds.east;
  return withinLat && withinLng;
}
