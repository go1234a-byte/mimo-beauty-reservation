import { useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";

const SESSION_KEY = "mimo_admin_ok";
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "mimo-admin";

function isUnlocked() {
  return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
}

export function AdminPasscodeGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-foreground">관리자 인증</h1>
        <p className="text-xs text-muted-foreground">
          MVP 임시 게이트입니다. 프로덕션에서는 실제 관리자 권한 인증으로 교체가 필요합니다.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="관리자 패스코드"
          className="h-[52px] w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary"
        />
        {error && <p className="text-xs font-medium text-destructive">패스코드가 올바르지 않습니다.</p>}
        <MimoPrimaryButton type="submit">입장하기</MimoPrimaryButton>
      </form>
    </div>
  );
}
