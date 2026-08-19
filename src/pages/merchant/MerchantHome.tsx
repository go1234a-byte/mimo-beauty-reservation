import { Link } from "react-router-dom";
import { ArrowLeft, Store, CalendarClock, Pencil, Clock, XCircle, LogOut, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusToggle } from "@/components/merchant/StatusToggle";
import { EmailAuthForm } from "@/components/mimo/auth/EmailAuthForm";
import { useMerchantData } from "@/contexts/MerchantDataContext";

export default function MerchantHome() {
  const {
    merchantUid,
    mySalons,
    claimableSalons,
    incomingReservations,
    loading,
    signUpEmail,
    signInEmail,
    logout,
    toggleSalonStatus,
    completeReservation,
  } = useMerchantData();

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (!merchantUid) {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="flex items-center gap-2 px-6 pt-6">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        <div className="space-y-4 px-6 pt-6">
          <p className="text-xs text-muted-foreground">사장님 계정으로 로그인하면 매장을 등록/관리할 수 있어요.</p>
          <EmailAuthForm signUpEmail={signUpEmail} signInEmail={signInEmail} onSuccess={() => {}} />
        </div>
      </div>
    );
  }

  if (mySalons.length === 0) {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="flex items-center gap-2 px-6 pt-6">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        <div className="space-y-3 px-6 pt-6">
          <Link to="/merchant/register">
            <Button className="h-12 w-full gap-1.5 rounded-xl text-sm font-semibold">
              <PlusCircle className="h-4 w-4" />
              새 매장 등록하기
            </Button>
          </Link>

          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">또는 등록 대기중인 매장 선택</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <h1 className="text-base font-bold text-foreground">등록할 매장을 선택해주세요</h1>
          <p className="text-xs text-muted-foreground">
            사업자등록증·통장사본·신분증 사본 제출과 세금계산서 발행 의무 동의가 필요해요. 제출 후 관리자
            심사를 거쳐야 매장이 노출됩니다.
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
                <Link to={`/merchant/apply/${salon.id}`}>
                  <Button size="sm" className="rounded-full">
                    등록하기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const salon = mySalons[0];

  if (salon.approvalStatus === "pending") {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="flex items-center gap-2 px-6 pt-6">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <Clock className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-base font-bold text-foreground">서류 심사중입니다</h1>
          <p className="text-xs text-muted-foreground">
            {salon.name} 제출 서류를 관리자가 검토하고 있어요. 승인되면 매장이 바로 노출됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (salon.approvalStatus === "rejected") {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="flex items-center gap-2 px-6 pt-6">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        <div className="flex flex-col items-center gap-3 px-6 pt-24 text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="text-base font-bold text-foreground">심사가 반려됐습니다</h1>
          <p className="text-xs text-muted-foreground">{salon.name} 등록 서류를 다시 확인 후 1:1 문의로 연락해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-10">
      <header className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            {salon.name}
          </span>
          <button type="button" onClick={logout} className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="로그아웃">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="space-y-6 px-6 pt-6">
        <div className="flex justify-end">
          <Link to="/merchant/edit">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
              <Pencil className="h-3.5 w-3.5" />
              매장 정보 수정
            </Button>
          </Link>
        </div>
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
