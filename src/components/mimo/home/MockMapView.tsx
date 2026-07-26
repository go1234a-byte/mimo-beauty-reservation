import { useMemo } from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MimoSalon } from "@/types/mimo";

interface MockMapViewProps {
  salons: MimoSalon[];
  selectedSalonId?: string | null;
  onSelectSalon?: (salonId: string) => void;
}

// 목업 지도 좌표 범위 (강남 일대 기준 bounding box)
const LAT_MIN = 37.4955;
const LAT_MAX = 37.5075;
const LNG_MIN = 127.0245;
const LNG_MAX = 127.0355;

function toPercent(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = 100 - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;
  return { x: Math.min(94, Math.max(6, x)), y: Math.min(90, Math.max(10, y)) };
}

export function MockMapView({ salons, selectedSalonId, onSelectSalon }: MockMapViewProps) {
  const pins = useMemo(
    () => salons.map((salon) => ({ salon, pos: toPercent(salon.lat, salon.lng) })),
    [salons],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-secondary">
      {/* 목업 도로망 배경 */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400" preserveAspectRatio="none">
        <rect width="400" height="400" fill="hsl(var(--secondary))" />
        <g stroke="hsl(var(--border))" strokeWidth="10" fill="none">
          <path d="M0 90 H400" />
          <path d="M0 190 H400" />
          <path d="M0 300 H400" />
          <path d="M70 0 V400" />
          <path d="M180 0 V400" />
          <path d="M300 0 V400" />
        </g>
        <g stroke="hsl(var(--border))" strokeWidth="4" fill="none" opacity="0.6">
          <path d="M0 140 H400" />
          <path d="M0 250 H400" />
          <path d="M120 0 V400" />
          <path d="M250 0 V400" />
        </g>
      </svg>

      {/* 현재 위치 마커 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-2 animate-ping rounded-full bg-primary/30" />
        <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-primary-foreground bg-primary shadow-mimo-sm" />
      </div>

      {/* 매장 핀 */}
      {pins.map(({ salon, pos }) => {
        const active = selectedSalonId === salon.id;
        return (
          <button
            key={salon.id}
            type="button"
            onClick={() => onSelectSalon?.(salon.id)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full transition-transform"
          >
            <MapPin
              className={cn(
                "h-8 w-8 drop-shadow-md transition-colors",
                active ? "fill-primary text-primary" : "fill-foreground/80 text-foreground/80",
              )}
              strokeWidth={1.5}
            />
          </button>
        );
      })}

      <button
        type="button"
        className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-mimo-sm"
        aria-label="현재 위치로 이동"
      >
        <Navigation className="h-4.5 w-4.5 text-foreground" />
      </button>
    </div>
  );
}
