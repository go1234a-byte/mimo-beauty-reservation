import { Link } from "react-router-dom";
import { CalendarCheck, Store, Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMimoManager } from "@/contexts/MimoManagerContext";

export default function MimoManagerDashboard() {
  const { manager, mySalon, reservations } = useMimoManager();

  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const todayCount = reservations.filter((r) => {
    const d = new Date(r.startTime);
    const today = new Date();
    return (
      (r.status === "pending" || r.status === "confirmed") &&
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }).length;

  return (
    <div className="min-h-full bg-background px-6 pb-8 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">안녕하세요, {manager?.name ?? "사장님"}님</p>
        <h1 className="mt-0.5 text-xl font-bold text-foreground">{mySalon?.name ?? "매장"}</h1>
        <Badge variant={mySalon?.status ? "default" : "secondary"} className="mt-2">
          {mySalon?.status ? "영업중" : "영업 일시중지"}
        </Badge>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{todayCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">오늘 예약</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">대기중</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{confirmedCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">확정</p>
        </div>
      </section>

      <section className="mt-6 space-y-2">
        <Link
          to="/mimo/manager/reservations"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-foreground">
            <CalendarCheck className="h-4.5 w-4.5 text-muted-foreground" />
            예약 관리
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          to="/mimo/manager/salon"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Store className="h-4.5 w-4.5 text-muted-foreground" />
            매장 정보 관리
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <span className="flex items-center gap-3 text-sm font-medium text-foreground">
            <Users className="h-4.5 w-4.5 text-muted-foreground" />
            누적 예약
          </span>
          <span className="text-sm text-muted-foreground">{reservations.length}건</span>
        </div>
      </section>
    </div>
  );
}
