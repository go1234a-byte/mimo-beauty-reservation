import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { ReviewSheet } from "@/components/mimo/reviews/ReviewSheet";
import { useMimoData } from "@/contexts/MimoDataContext";
import { fetchReviewedSalonIds } from "@/lib/mimoReviews";
import type { MimoReservationStatus } from "@/types/mimo";

const STATUS_LABEL: Record<MimoReservationStatus, string> = {
  pending: "대기중",
  confirmed: "예약확정",
  completed: "이용완료",
  cancelled: "취소됨",
};

const STATUS_VARIANT: Record<MimoReservationStatus, string> = {
  pending: "bg-warning/15 text-warning",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function MimoBookings() {
  const navigate = useNavigate();
  const { reservations, salons, currentUser } = useMimoData();
  const [reviewedSalonIds, setReviewedSalonIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<{ salonId: string; salonName: string } | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    fetchReviewedSalonIds(currentUser.uid).then(setReviewedSalonIds);
  }, [currentUser]);

  const activeList = reservations.filter((r) => r.status === "pending" || r.status === "confirmed");
  const historyList = reservations.filter((r) => r.status === "completed" || r.status === "cancelled");

  return (
    <div className="min-h-full bg-background pb-24">
      <header className="flex items-center gap-3 px-4 pt-6">
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">대기내역</h1>
      </header>

      <div className="space-y-6 px-6 pt-5">
        {!currentUser && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            로그인 후 예약 내역을 확인할 수 있어요.
          </div>
        )}

        {currentUser && (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">진행중인 예약</h2>
              {activeList.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">진행중인 예약이 없습니다.</p>
              )}
              {activeList.map((r) => {
                const salon = salons.find((s) => s.id === r.salonId);
                return (
                  <Card key={r.reservationId} className="rounded-2xl border-border shadow-mimo-sm">
                    <CardContent className="space-y-1.5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{salon?.name ?? "매장"}</span>
                        <Badge className={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.startTime).toLocaleString("ko-KR", {
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="pt-1 text-sm font-bold text-foreground">₩{r.price.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">지난 예약</h2>
              {historyList.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">지난 예약 내역이 없습니다.</p>
              )}
              {historyList.map((r) => {
                const salon = salons.find((s) => s.id === r.salonId);
                const canReview = r.status === "completed" && salon && !reviewedSalonIds.includes(salon.id);
                return (
                  <Card key={r.reservationId} className="rounded-2xl border-border opacity-90">
                    <CardContent className="space-y-1.5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{salon?.name ?? "매장"}</span>
                        <Badge className={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{r.serviceName}</p>
                      {canReview && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1.5 w-full rounded-xl"
                          onClick={() => setReviewTarget({ salonId: salon.id, salonName: salon.name })}
                        >
                          리뷰 남기기
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          </>
        )}
      </div>

      {currentUser && reviewTarget && (
        <ReviewSheet
          open={!!reviewTarget}
          onOpenChange={(open) => !open && setReviewTarget(null)}
          salonId={reviewTarget.salonId}
          salonName={reviewTarget.salonName}
          userId={currentUser.uid}
          onSubmitted={() => setReviewedSalonIds((prev) => [...prev, reviewTarget.salonId])}
        />
      )}

      <MimoBottomNav />
    </div>
  );
}
