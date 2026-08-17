import { Store, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusToggle } from "@/components/merchant/StatusToggle";
import { useMerchantData } from "@/contexts/MerchantDataContext";

export default function MerchantHome() {
  const { mySalons, claimableSalons, incomingReservations, loading, claimSalon, toggleSalonStatus, completeReservation } =
    useMerchantData();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (mySalons.length === 0) {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="px-6 pt-6">
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        <div className="space-y-3 px-6 pt-6">
          <h1 className="text-base font-bold text-foreground">등록할 매장을 선택해주세요</h1>
          <p className="text-xs text-muted-foreground">
            MVP 데모: 실제 서비스에서는 사업자 인증 후 매장을 등록합니다. 지금은 소유자가 없는 매장을 선택해
            사장님 계정에 연결할 수 있어요.
          </p>
          {claimableSalons.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">등록 가능한 매장이 없습니다.</p>
          )}
          {claimableSalons.map((salon) => (
            <Card key={salon.id} className="rounded-2xl border-border">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{salon.name}</p>
                  <p className="text-xs text-muted-foreground">{salon.address}</p>
                </div>
                <Button size="sm" className="rounded-full" onClick={() => claimSalon(salon.id)}>
                  등록하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const salon = mySalons[0];

  return (
    <div className="min-h-full bg-background pb-10">
      <header className="flex items-center justify-between px-6 pt-6">
        <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Store className="h-3.5 w-3.5" />
          {salon.name}
        </span>
      </header>

      <div className="space-y-6 px-6 pt-6">
        <StatusToggle isOn={salon.status} onToggle={(next) => toggleSalonStatus(salon.id, next)} />

        <section className="space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarClock className="h-4 w-4" />
            들어온 예약
          </h2>
          {incomingReservations.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">아직 들어온 예약이 없어요.</p>
          )}
          {incomingReservations.map((r) => (
            <Card key={r.reservationId} className="rounded-2xl border-border shadow-mimo-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{r.serviceName}</span>
                  <Badge className={r.status === "confirmed" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning"}>
                    {r.status === "confirmed" ? "결제완료" : "대기중"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.startTime).toLocaleString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · ₩{r.price.toLocaleString()}
                </p>
                {r.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => completeReservation(r.reservationId, salon.id)}
                  >
                    예약 완료 처리
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
