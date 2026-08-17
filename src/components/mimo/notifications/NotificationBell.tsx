import { useState } from "react";
import { Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMimoData } from "@/contexts/MimoDataContext";

const TYPE_ICON_BG: Record<string, string> = {
  reservation_complete: "bg-primary/10 text-primary",
  reservation_reminder: "bg-warning/15 text-warning",
  reservation_cancelled: "bg-muted text-muted-foreground",
  merchant_turned_on: "bg-success/15 text-success",
};

export function NotificationBell() {
  const { currentUser, notifications, unreadNotificationCount, markNotificationsRead } = useMimoData();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="알림"
        className="relative text-foreground"
        onClick={() => {
          setOpen(true);
          if (currentUser) markNotificationsRead();
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadNotificationCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2 rounded-full bg-primary" />
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-3xl border-none px-6 pb-8 pt-6">
          <SheetHeader className="text-left">
            <SheetTitle className="text-lg font-bold">알림</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-2">
            {!currentUser && (
              <p className="py-10 text-center text-sm text-muted-foreground">로그인 후 알림을 확인할 수 있어요.</p>
            )}
            {currentUser && notifications.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">아직 도착한 알림이 없어요.</p>
            )}
            {currentUser &&
              notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      TYPE_ICON_BG[n.type] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {new Date(n.createdAt).toLocaleString("ko-KR", {
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
              ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
