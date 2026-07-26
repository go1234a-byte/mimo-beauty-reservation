import { useState } from "react";
import { Bell } from "lucide-react";
import { MimoSplashScreen } from "@/components/mimo/SplashScreen";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { MockMapView } from "@/components/mimo/home/MockMapView";
import { SalonListCard } from "@/components/mimo/home/SalonListCard";
import { useMimoData } from "@/contexts/MimoDataContext";

export default function MimoHome() {
  const [splashDone, setSplashDone] = useState(false);
  const { activeSalons, loading } = useMimoData();
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

  return (
    <>
      {!splashDone && <MimoSplashScreen onFinish={() => setSplashDone(true)} />}
      <div className="min-h-full bg-background pb-24">
        <header className="flex items-center justify-between px-6 pt-6">
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO</span>
          <button type="button" aria-label="알림" className="text-foreground">
            <Bell className="h-5 w-5" />
          </button>
        </header>

        <div className="px-6 pt-4">
          <h1 className="text-xl font-bold text-foreground">지금 가능한 곳</h1>
        </div>

        <div className="mt-4 h-64 w-full px-6">
          <div className="h-full w-full overflow-hidden rounded-2xl shadow-mimo-sm">
            <MockMapView
              salons={activeSalons}
              selectedSalonId={selectedSalonId}
              onSelectSalon={setSelectedSalonId}
            />
          </div>
        </div>

        <section className="mt-5 space-y-3 px-6">
          {loading && <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>}
          {!loading &&
            activeSalons.map((salon) => <SalonListCard key={salon.id} salon={salon} />)}
          {!loading && activeSalons.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              지금 예약 가능한 매장이 없습니다.
            </div>
          )}
        </section>

        <MimoBottomNav />
      </div>
    </>
  );
}
