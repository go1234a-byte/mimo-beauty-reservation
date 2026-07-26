import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMimoManager } from "@/contexts/MimoManagerContext";
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

const FILTERS: { key: "all" | MimoReservationStatus; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "pending", label: "대기중" },
  { key: "confirmed", label: "예약확정" },
  { key: "completed", label: "이용완료" },
  { key: "cancelled", label: "취소됨" },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MimoManagerReservations() {
  const { reservations, setReservationStatus } = useMimoManager();
  const [filter, setFilter] = useState<"all" | MimoReservationStatus>("all");

  const filtered = useMemo(
    () => (filter === "all" ? reservations : reservations.filter((r) => r.status === filter)),
    [reservations, filter],
  );

  return (
    <div className="min-h-full bg-background px-6 pb-8 pt-6">
      <h1 className="text-xl font-bold text-foreground">예약 관리</h1>

      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">예약 내역이 없습니다.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.reservationId} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.serviceName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.startTime)}</p>
                </div>
                <Badge className={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{r.price.toLocaleString("ko-KR")}원</p>

              {(r.status === "pending" || r.status === "confirmed") && (
                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 flex-1 text-xs"
                    onClick={() => setReservationStatus(r.reservationId, "completed")}
                  >
                    이용완료 처리
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 flex-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => setReservationStatus(r.reservationId, "cancelled")}
                  >
                    예약 취소
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
