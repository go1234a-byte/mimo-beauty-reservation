import { useEffect, useMemo, useRef, useState } from "react";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { GoogleMapView, isSalonWithinBounds, type MapBounds } from "@/components/mimo/home/GoogleMapView";
import { SalonListCard } from "@/components/mimo/home/SalonListCard";
import { NotificationBell } from "@/components/mimo/notifications/NotificationBell";
import { useMimoData } from "@/contexts/MimoDataContext";
import { useMimoLocation } from "@/contexts/LocationContext";
import { sortSalonsByDistance } from "@/lib/mimoGeo";
import { cn } from "@/lib/utils";

export default function MimoHome() {
  const { activeSalons, loading } = useMimoData();
  const { displayCoords } = useMimoLocation();
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const categories = useMemo(() => {
    const set = new Set<string>();
    activeSalons.forEach((s) => s.categories.forEach((c) => set.add(c)));
    return Array.from(set);
  }, [activeSalons]);

  const nearbySalons = useMemo(
    () => sortSalonsByDistance(activeSalons, displayCoords),
    [activeSalons, displayCoords],
  );

  const categorySalons = useMemo(
    () => (category ? nearbySalons.filter((s) => s.categories.includes(category)) : nearbySalons),
    [nearbySalons, category],
  );

  // 지도를 움직이면 그 화면 안에 보이는 매장만 하단 리스트에 남긴다.
  const visibleSalons = useMemo(
    () => categorySalons.filter((s) => isSalonWithinBounds(s, bounds)),
    [categorySalons, bounds],
  );

  // 지도 핀을 탭해서 선택이 바뀌면 해당 카드가 보이도록 리스트를 스크롤한다.
  useEffect(() => {
    if (!selectedSalonId) return;
    cardRefs.current[selectedSalonId]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSalonId]);

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-foreground">MIMO</span>
        <NotificationBell />
      </header>

      {/* 지도가 홈 화면의 중심 — 리스트보다 시각적 비중을 크게 가져간다 */}
      <div className="relative h-[38vh] min-h-[280px] w-full">
        <GoogleMapView
          salons={categorySalons}
          currentLocation={displayCoords}
          selectedSalonId={selectedSalonId}
          onSelectSalon={setSelectedSalonId}
          onBoundsChanged={setBounds}
        />
      </div>

      {/* 지도 위로 살짝 겹쳐 올라오는 카드 시트 — Apple Maps 스타일 */}
      <div className="relative z-10 -mt-5 rounded-t-[28px] bg-background pb-2 shadow-[0_-10px_24px_-18px_rgba(0,0,0,0.35)]">
        <div className="flex justify-center pt-2.5">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

        <div className="px-6 pb-3 pt-3">
          <h1 className="text-lg font-bold text-foreground">지금 가능한 곳</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "불러오는 중..." : `이 화면에서 ${visibleSalons.length}곳 예약 가능`}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto px-6 pb-3">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              전체
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c === category ? null : c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <section className="space-y-3 px-6">
          {!loading &&
            visibleSalons.map((salon) => (
              <div key={salon.id} ref={(el) => (cardRefs.current[salon.id] = el)}>
                <SalonListCard
                  salon={salon}
                  currentLocation={displayCoords}
                  selected={selectedSalonId === salon.id}
                  onSelect={setSelectedSalonId}
                />
              </div>
            ))}
          {!loading && visibleSalons.length === 0 && categorySalons.length > 0 && (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              이 화면 범위에는 예약 가능한 매장이 없어요. 지도를 움직여보세요.
            </div>
          )}
          {!loading && categorySalons.length === 0 && nearbySalons.length > 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              선택한 카테고리에 예약 가능한 매장이 없습니다.
            </div>
          )}
          {!loading && nearbySalons.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              지금 예약 가능한 매장이 없습니다.
            </div>
          )}
        </section>
      </div>

      <MimoBottomNav />
    </div>
  );
}
