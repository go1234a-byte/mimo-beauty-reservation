import { useState } from "react";
import { Store, CalendarClock, Users, Star, Flag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminData } from "@/contexts/AdminDataContext";

const TABS = [
  { id: "salons", label: "매장 승인", icon: Store },
  { id: "reservations", label: "예약", icon: CalendarClock },
  { id: "users", label: "사용자", icon: Users },
  { id: "reviews", label: "리뷰", icon: Star },
  { id: "reports", label: "신고", icon: Flag },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminHome() {
  const [tab, setTab] = useState<TabId>("salons");
  const admin = useAdminData();

  return (
    <div className="min-h-full bg-background pb-16">
      <header className="px-6 pt-6">
        <h1 className="text-lg font-bold text-foreground">MIMO 관리자</h1>
        <p className="text-xs text-muted-foreground">매장 승인, 예약, 사용자, 리뷰, 신고를 관리합니다.</p>
      </header>

      <div className="mt-4 flex gap-1.5 overflow-x-auto px-6 pb-1">
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

      <div className="space-y-3 px-6 pt-4">
        {admin.loading && <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>}

        {!admin.loading && tab === "salons" && (
          <>
            {admin.salons.length === 0 && <EmptyState label="등록된 매장이 없습니다." />}
            {admin.salons.map((s) => (
              <Card key={s.id} className="rounded-2xl border-border">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                    <ApprovalBadge status={s.approvalStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.address}</p>
                  <p className="text-xs text-muted-foreground">
                    운영상태: {s.status ? "ON (지금 가능)" : "OFF"} · 소유자: {s.ownerUid ?? "미배정"}
                  </p>
                  {s.approvalStatus !== "approved" && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 rounded-xl" onClick={() => admin.approveSalon(s.id)}>
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => admin.rejectSalon(s.id)}
                      >
                        거절
                      </Button>
                    </div>
                  )}
                  {s.approvalStatus === "approved" && (
                    <div className="flex gap-2 pt-1">
                      {s.status && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-xl"
                          onClick={() => admin.forceOffSalon(s.id)}
                        >
                          강제 OFF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl text-destructive"
                        onClick={() => admin.deleteSalon(s.id)}
                      >
                        매장 삭제
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!admin.loading && tab === "reservations" && (
          <>
            {admin.reservations.length === 0 && <EmptyState label="예약 내역이 없습니다." />}
            {admin.reservations.map((r) => (
              <Card key={r.reservationId} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{r.serviceName}</p>
                    <Badge className="bg-muted text-muted-foreground">{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    salon: {r.salonId} · user: {r.userId}
                  </p>
                  <p className="text-xs text-muted-foreground">₩{r.price.toLocaleString()}</p>
                  {(r.status === "pending" || r.status === "confirmed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 w-full rounded-xl"
                      onClick={() => admin.cancelReservation(r.reservationId)}
                    >
                      예약 취소
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!admin.loading && tab === "users" && (
          <>
            {admin.users.length === 0 && <EmptyState label="가입한 사용자가 없습니다." />}
            {admin.users.map((u) => (
              <Card key={u.uid} className="rounded-2xl border-border">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.uid}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={u.isAdmin ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => admin.toggleUserAdmin(u.uid, !u.isAdmin)}
                  >
                    {u.isAdmin ? "관리자 해제" : "관리자 지정"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!admin.loading && tab === "reviews" && (
          <>
            {admin.reviews.length === 0 && (
              <EmptyState label="리뷰가 없습니다. (mimo_reviews 테이블 마이그레이션이 필요할 수 있어요)" />
            )}
            {admin.reviews.map((rv) => (
              <Card key={rv.id} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                      {rv.rating.toFixed(1)}
                    </span>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => admin.deleteReview(rv.id)}>
                      삭제
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{rv.comment}</p>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!admin.loading && tab === "reports" && (
          <>
            {admin.reports.length === 0 && (
              <EmptyState label="신고가 없습니다. (mimo_reports 테이블 마이그레이션이 필요할 수 있어요)" />
            )}
            {admin.reports.map((rp) => (
              <Card key={rp.id} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {rp.targetType} · {rp.targetId}
                    </span>
                    <Badge className={rp.status === "open" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}>
                      {rp.status === "open" ? "미해결" : "해결됨"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rp.reason}</p>
                  {rp.status === "open" && (
                    <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => admin.resolveReport(rp.id)}>
                      해결 처리
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-14 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}

function ApprovalBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const map = {
    pending: { label: "승인대기", cls: "bg-warning/15 text-warning" },
    approved: { label: "승인됨", cls: "bg-success/15 text-success" },
    rejected: { label: "거절됨", cls: "bg-destructive/10 text-destructive" },
  } as const;
  const v = map[status];
  return <Badge className={v.cls}>{v.label}</Badge>;
}
