import { LogOut, UserRound, CalendarClock, Heart, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { AuthGateModal } from "@/components/mimo/auth/AuthGateModal";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoData } from "@/contexts/MimoDataContext";
import { useState } from "react";

export default function MimoMyPage() {
  const { currentUser, logout, reservations } = useMimoData();
  const [authOpen, setAuthOpen] = useState(false);

  const activeCount = reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length;

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="px-6 pt-6">
        <h1 className="text-lg font-bold text-foreground">마이페이지</h1>
      </header>

      <div className="space-y-6 px-6 pt-5">
        <section className="flex items-center gap-4 rounded-2xl bg-secondary p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background">
            <UserRound className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            {currentUser ? (
              <>
                <p className="truncate text-base font-bold text-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.uid}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">로그인이 필요합니다</p>
            )}
          </div>
          {currentUser ? (
            <Button variant="ghost" size="icon" onClick={logout} aria-label="로그아웃">
              <LogOut className="h-4.5 w-4.5 text-muted-foreground" />
            </Button>
          ) : null}
        </section>

        {!currentUser && <MimoPrimaryButton onClick={() => setAuthOpen(true)}>로그인</MimoPrimaryButton>}

        {currentUser && (
          <section className="space-y-2">
            <Link
              to="/mimo/bookings"
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                <CalendarClock className="h-4.5 w-4.5 text-muted-foreground" />
                내 예약
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {activeCount > 0 ? `진행중 ${activeCount}건` : "없음"}
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              to="/mimo/favorites"
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                <Heart className="h-4.5 w-4.5 text-muted-foreground" />
                즐겨찾기
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                {currentUser.favorites.length}개
                <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </section>
        )}
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} />
      <MimoBottomNav />
    </div>
  );
}
