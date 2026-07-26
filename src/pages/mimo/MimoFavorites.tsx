import { ChevronLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { SalonListCard } from "@/components/mimo/home/SalonListCard";
import { useMimoData } from "@/contexts/MimoDataContext";

export default function MimoFavorites() {
  const navigate = useNavigate();
  const { salons, currentUser } = useMimoData();

  const favoriteSalons = salons.filter((s) => currentUser?.favorites.includes(s.id));

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-6">
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">즐겨찾기</h1>
      </header>

      <div className="space-y-3 px-6 pt-5">
        {!currentUser && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            <Heart className="h-6 w-6 text-muted-foreground" />
            로그인 후 즐겨찾기를 이용할 수 있어요.
          </div>
        )}
        {currentUser && favoriteSalons.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            <Heart className="h-6 w-6 text-muted-foreground" />
            즐겨찾기한 매장이 없습니다.
          </div>
        )}
        {favoriteSalons.map((salon) => (
          <SalonListCard key={salon.id} salon={salon} />
        ))}
      </div>

      <MimoBottomNav />
    </div>
  );
}
