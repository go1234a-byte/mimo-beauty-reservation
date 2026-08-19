import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  CalendarClock,
  History,
  Star,
  Receipt,
  Pencil,
  Clock,
  XCircle,
  LogOut,
  PlusCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusToggle } from "@/components/merchant/StatusToggle";
import { EmailAuthForm } from "@/components/mimo/auth/EmailAuthForm";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import { computeMonthlySettlements } from "@/lib/mimoSettlement";

const RESERVATION_STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  confirmed: "결제완료",
  completed: "이용완료",
  cancelled: "취소됨",
};

const TABS = [
  { id: "home", label: "홈", icon: Store },
  { id: "history", label: "예약내역", icon: History },
  { id: "reviews", label: "리뷰", icon: Star },
  { id: "settlement", label: "정산", icon: Receipt },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function MerchantHome() {
  const {
    merchantUid,
    mySalons,
    claimableSalons,
    incomingReservations,
    salonReservationHistory,
    salonReviews,
    loading,
    signUpEmail,
    signInEmail,
    logout,
    toggleSalonStatus,
    completeReservation,
  } = useMerchantData();

  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("home");

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

  const salon = mySalons.find((s) => s.id === selectedSalonId) ?? mySalons[0];

  const SalonSwitcher = mySalons.length > 1 && (
    <div className="flex gap-1.5 overflow-x-auto px-6 pb-1 pt-3">
      {mySalons.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setSelectedSalonId(s.id)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            s.id === salon.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
          )}
        >
          {s.name}
        </button>
      ))}
    </div>
  );

  if (salon.approvalStatus === "pending") {
    return (
      <div className="min-h-full bg-background pb-10">
        <header className="flex items-center gap-2 px-6 pt-6">
          <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold tracking-tight text-foreground">MIMO 사장님</span>
        </header>
        {SalonSwitcher}
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
        {SalonSwitcher}
        <div className="flex flex-col items-center gap-3 px-6 pt-16 text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <h1 className="text-base font-bold text-foreground">심사가 반려됐습니다</h1>
          {salon.rejectionReason ? (
            <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{salon.rejectionReason}</p>
          ) : (
            <p className="text-xs text-muted-foreground">반려 사유는 1:1 문의로 확인해주세요.</p>
          )}
          <Link to={`/merchant/resubmit/${salon.id}`} className="w-full">
            <Button className="h-11 w-full rounded-xl text-sm font-semibold">서류 다시 제출하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const salonReservations = salonReservationHistory.filter((r) => r.salonId === salon.id);
  const salonOwnReviews = salonReviews.filter((r) => r.salonId === salon.id);
  const settlements = computeMonthlySettlements(salonReservations);

  return (
    <div className="min-h-full bg-background pb-16">
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

      {SalonSwitcher}

      <div className="mt-2 flex gap-1.5 overflow-x-auto px-6 pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6 px-6 pt-6">
        {tab === "home" && (
          <>
            <div className="flex justify-end">
              <Link to={`/merchant/edit/${salon.id}`}>
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
              {incomingReservations.filter((r) => r.salonId === salon.id).length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">아직 들어온 예약이 없어요.</p>
              )}
              {incomingReservations
                .filter((r) => r.salonId === salon.id)
                .map((r) => (
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
          </>
        )}

        {tab === "history" && (
          <section className="space-y-3">
            {salonReservations.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">예약 내역이 없어요.</p>
            )}
            {salonReservations.map((r) => (
              <Card key={r.reservationId} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{r.serviceName}</span>
                    <Badge className="bg-muted text-muted-foreground">
                      {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
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
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {tab === "reviews" && (
          <section className="space-y-3">
            {salonOwnReviews.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">아직 리뷰가 없어요.</p>}
            {salonOwnReviews.map((rv) => (
              <Card key={rv.id} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {rv.rating.toFixed(1)}
                  </span>
                  <p className="text-xs text-muted-foreground">{rv.comment}</p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {tab === "settlement" && (
          <section className="space-y-3">
            <div className="rounded-2xl bg-secondary p-4 text-xs leading-relaxed text-muted-foreground">
              결제 완료된 예약금액의 <strong className="text-foreground">10%가 MIMO 수수료</strong>로 정산되고,
              수수료에는 <strong className="text-foreground">부가가치세 10%</strong>가 별도로 붙어요. 정산 후
              실수령액은 예약 매출에서 수수료를 뺀 금액입니다.
            </div>
            {settlements.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">정산 내역이 없어요.</p>}
            {settlements.map((s, i) => (
              <Card key={s.month} className={cn("rounded-2xl", i === 0 ? "border-primary" : "border-border")}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{s.month}</p>
                    {i === 0 && <Badge className="bg-primary/10 text-primary">이번 달</Badge>}
                  </div>
                  <div className="space-y-1 text-xs">
                    <SettlementRow label={`예약 매출 (${s.reservationCount}건)`} value={`₩${s.totalRevenue.toLocaleString()}`} />
                    <SettlementRow label="MIMO 수수료 (10%)" value={`-₩${Math.round(s.commission).toLocaleString()}`} />
                    <SettlementRow label="수수료 부가세 (10%)" value={`-₩${Math.round(s.vat).toLocaleString()}`} />
                    <div className="h-px bg-border" />
                    <SettlementRow
                      label="실수령액"
                      value={`₩${Math.round(s.totalRevenue - s.totalBilled).toLocaleString()}`}
                      bold
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function SettlementRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(bold ? "font-bold text-foreground" : "font-medium text-foreground")}>{value}</span>
    </div>
  );
}
