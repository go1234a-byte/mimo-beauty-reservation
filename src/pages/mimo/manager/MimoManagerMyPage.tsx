import { LogOut, UserRound, Mail, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMimoManager } from "@/contexts/MimoManagerContext";

export default function MimoManagerMyPage() {
  const navigate = useNavigate();
  const { manager, mySalon, logout } = useMimoManager();

  const handleLogout = async () => {
    await logout();
    navigate("/mimo/manager/login");
  };

  return (
    <div className="min-h-full bg-background px-6 pb-8 pt-6">
      <h1 className="text-lg font-bold text-foreground">마이페이지</h1>

      <section className="mt-5 flex items-center gap-4 rounded-2xl bg-secondary p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-background">
          <UserRound className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{manager?.name ?? "-"}</p>
          <p className="text-xs text-muted-foreground">{mySalon?.name ?? "매장 미등록"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="로그아웃">
          <LogOut className="h-4.5 w-4.5 text-muted-foreground" />
        </Button>
      </section>

      <section className="mt-5 space-y-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Mail className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{manager?.email ?? "-"}</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Phone className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="text-sm text-foreground">{manager?.phone || "등록된 연락처 없음"}</span>
        </div>
      </section>
    </div>
  );
}
