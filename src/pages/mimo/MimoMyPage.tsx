import { LogOut, UserRound, CalendarClock, Heart, ChevronRight, MessageCircleQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MimoBottomNav } from "@/components/mimo/layout/MimoBottomNav";
import { AuthGateModal } from "@/components/mimo/auth/AuthGateModal";
import { InquirySheet } from "@/components/mimo/support/InquirySheet";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoData } from "@/contexts/MimoDataContext";
import { fetchMyInquiries } from "@/lib/mimoInquiries";
import type { MimoSupportInquiry } from "@/types/mimo";

export default function MimoMyPage() {
  const { currentUser, logout, reservations } = useMimoData();
  const [authOpen, setAuthOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiries, setInquiries] = useState<MimoSupportInquiry[]>([]);

  const activeCount = reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length;

  const refreshInquiries = () => {
    if (currentUser) fetchMyInquiries(currentUser.uid).then(setInquiries);
  };

  useEffect(() => {
    refreshInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

        {currentUser && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MessageCircleQuestion className="h-4 w-4" />
                1:1 문의
              </h2>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setInquiryOpen(true)}>
                문의하기
              </Button>
            </div>
            {inquiries.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">문의 내역이 없어요.</p>
            )}
            {inquiries.map((q) => (
              <Card key={q.id} className="rounded-2xl border-border">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{q.subject}</span>
                    <Badge className={q.status === "answered" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning"}>
                      {q.status === "answered" ? "답변완료" : "답변대기"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{q.message}</p>
                  {q.adminReply && (
                    <div className="mt-1 rounded-xl bg-secondary p-3">
                      <p className="text-[11px] font-semibold text-foreground">답변</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{q.adminReply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>

      <AuthGateModal open={authOpen} onOpenChange={setAuthOpen} />
      {currentUser && (
        <InquirySheet
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          userId={currentUser.uid}
          onSubmitted={refreshInquiries}
        />
      )}
      <MimoBottomNav />
    </div>
  );
}
