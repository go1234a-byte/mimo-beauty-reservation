import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  LayoutDashboard,
  Store,
  CalendarClock,
  Users,
  Star,
  Flag,
  MessageCircleQuestion,
  FileText,
  ExternalLink,
  LogOut,
  Pencil,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAdminData } from "@/contexts/AdminDataContext";
import { getMerchantDocSignedUrl } from "@/lib/mimoStorage";
import { signOutMimo } from "@/lib/mimoAuth";
import { AdminSalonEditSheet } from "@/components/admin/AdminSalonEditSheet";
import type { MimoSalon } from "@/types/mimo";

const DOC_LABELS = [
  { key: "businessRegUrl", label: "사업자등록증" },
  { key: "bankbookUrl", label: "통장사본" },
  { key: "idCardUrl", label: "신분증사본" },
] as const;

function DocLink({ label, path }: { label: string; path: string | null }) {
  const [opening, setOpening] = useState(false);
  if (!path) return null;

  const handleOpen = async () => {
    setOpening(true);
    const url = await getMerchantDocSignedUrl(path);
    setOpening(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      disabled={opening}
      className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground disabled:opacity-50"
    >
      <FileText className="h-3 w-3" />
      {label}
      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 text-xs"
      />
    </div>
  );
}

const TABS = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "salons", label: "매장 승인", icon: Store },
  { id: "reservations", label: "예약", icon: CalendarClock },
  { id: "users", label: "사용자", icon: Users },
  { id: "reviews", label: "리뷰", icon: Star },
  { id: "reports", label: "신고", icon: Flag },
  { id: "inquiries", label: "문의", icon: MessageCircleQuestion },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminHome() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const admin = useAdminData();
  const [salonQuery, setSalonQuery] = useState("");
  const [reservationQuery, setReservationQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [editingSalon, setEditingSalon] = useState<MimoSalon | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const filteredSalons = useMemo(() => {
    const q = salonQuery.trim().toLowerCase();
    if (!q) return admin.salons;
    return admin.salons.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }, [admin.salons, salonQuery]);

  const filteredReservations = useMemo(() => {
    const q = reservationQuery.trim().toLowerCase();
    if (!q) return admin.reservations;
    return admin.reservations.filter(
      (r) => r.serviceName.toLowerCase().includes(q) || r.salonId.toLowerCase().includes(q) || r.userId.toLowerCase().includes(q),
    );
  }, [admin.reservations, reservationQuery]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return admin.users;
    return admin.users.filter((u) => u.name.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q));
  }, [admin.users, userQuery]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayReservations = admin.reservations.filter((r) => new Date(r.createdAt).toDateString() === today).length;
    const revenue = admin.reservations.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.price, 0);
    return {
      totalSalons: admin.salons.length,
      pendingSalons: admin.salons.filter((s) => s.approvalStatus === "pending").length,
      liveSalons: admin.salons.filter((s) => s.status && s.approvalStatus === "approved").length,
      totalReservations: admin.reservations.length,
      todayReservations,
      revenue,
      totalUsers: admin.users.length,
      adminUsers: admin.users.filter((u) => u.isAdmin).length,
      openReports: admin.reports.filter((r) => r.status === "open").length,
      openInquiries: admin.inquiries.filter((q) => q.status === "open").length,
    };
  }, [admin]);

  return (
    <div className="min-h-full bg-background pb-16">
      <header className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/mimo" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold text-foreground">MIMO 관리자</h1>
          </div>
          <button
            type="button"
            onClick={() => signOutMimo()}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            aria-label="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">매장 승인, 예약, 사용자, 리뷰, 신고, 문의를 관리합니다.</p>
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
              {t.id === "reports" && stats.openReports > 0 && (
                <span className="rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                  {stats.openReports}
                </span>
              )}
              {t.id === "inquiries" && stats.openInquiries > 0 && (
                <span className="rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                  {stats.openInquiries}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 px-6 pt-4">
        {admin.loading && <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</p>}

        {!admin.loading && tab === "dashboard" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="전체 매장" value={stats.totalSalons} />
            <StatCard label="승인대기 매장" value={stats.pendingSalons} warn={stats.pendingSalons > 0} />
            <StatCard label="지금 운영중" value={stats.liveSalons} />
            <StatCard label="오늘 예약" value={stats.todayReservations} />
            <StatCard label="전체 예약" value={stats.totalReservations} />
            <StatCard label="완료 매출" value={`₩${stats.revenue.toLocaleString()}`} />
            <StatCard label="가입자" value={stats.totalUsers} />
            <StatCard label="관리자" value={stats.adminUsers} />
            <StatCard label="미해결 신고" value={stats.openReports} warn={stats.openReports > 0} />
            <StatCard label="답변대기 문의" value={stats.openInquiries} warn={stats.openInquiries > 0} />
          </div>
        )}

        {!admin.loading && tab === "salons" && (
          <>
            <SearchInput value={salonQuery} onChange={setSalonQuery} placeholder="매장명, 주소로 검색" />
            {filteredSalons.length === 0 && <EmptyState label="검색 결과가 없습니다." />}
            {filteredSalons.map((s) => (
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
                  {s.ownerUid && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {DOC_LABELS.map(({ key, label }) => (
                        <DocLink key={key} label={label} path={s[key]} />
                      ))}
                      <Badge className={s.taxInvoiceAgreed ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}>
                        세금계산서 동의 {s.taxInvoiceAgreed ? "O" : "X"}
                      </Badge>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => setEditingSalon(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                      정보 수정
                    </Button>
                    {s.approvalStatus !== "approved" ? (
                      <>
                        <Button size="sm" className="flex-1 rounded-xl" onClick={() => admin.approveSalon(s.id)}>
                          승인
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => admin.rejectSalon(s.id)}>
                          거절
                        </Button>
                      </>
                    ) : (
                      <>
                        {s.status && (
                          <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => admin.forceOffSalon(s.id)}>
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
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {!admin.loading && tab === "reservations" && (
          <>
            <SearchInput value={reservationQuery} onChange={setReservationQuery} placeholder="서비스명, 매장/유저 id로 검색" />
            {filteredReservations.length === 0 && <EmptyState label="검색 결과가 없습니다." />}
            {filteredReservations.map((r) => (
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
            <SearchInput value={userQuery} onChange={setUserQuery} placeholder="이름, uid로 검색" />
            {filteredUsers.length === 0 && <EmptyState label="검색 결과가 없습니다." />}
            {filteredUsers.map((u) => (
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

        {!admin.loading && tab === "inquiries" && (
          <>
            {admin.inquiries.length === 0 && <EmptyState label="문의가 없습니다." />}
            {admin.inquiries.map((q) => (
              <Card key={q.id} className="rounded-2xl border-border">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{q.subject}</span>
                    <Badge className={q.status === "answered" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning"}>
                      {q.status === "answered" ? "답변완료" : "답변대기"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">from: {q.userId}</p>
                  <p className="text-xs text-foreground">{q.message}</p>
                  {q.adminReply && (
                    <div className="rounded-xl bg-secondary p-3">
                      <p className="text-[11px] font-semibold text-foreground">답변 완료</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{q.adminReply}</p>
                    </div>
                  )}
                  {q.status === "open" && (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        value={replyDraft[q.id] ?? ""}
                        onChange={(e) => setReplyDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="답변을 입력하세요"
                        rows={2}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        className="w-full rounded-xl"
                        disabled={!replyDraft[q.id]?.trim()}
                        onClick={() => {
                          admin.replyToInquiry(q.id, replyDraft[q.id]!.trim());
                          setReplyDraft((prev) => ({ ...prev, [q.id]: "" }));
                        }}
                      >
                        답변 등록
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      <AdminSalonEditSheet salon={editingSalon} onOpenChange={(open) => !open && setEditingSalon(null)} />
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", warn ? "text-destructive" : "text-foreground")}>{value}</p>
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
