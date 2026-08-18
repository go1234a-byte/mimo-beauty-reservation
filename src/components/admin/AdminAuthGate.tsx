import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithEmail, signOutMimo } from "@/lib/mimoAuth";
import { EmailAuthForm } from "@/components/mimo/auth/EmailAuthForm";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async (s: Session | null) => {
      if (!s) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      const { data } = await supabase.from("mimo_users").select("is_admin").eq("uid", s.user.id).maybeSingle();
      setIsAdmin(!!data?.is_admin);
      setChecking(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      checkAdmin(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  if (session && isAdmin) return <>{children}</>;

  if (session && !isAdmin) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">관리자 권한이 없습니다</h1>
          <p className="text-xs text-muted-foreground">이 계정은 관리자로 지정되지 않았어요.</p>
        </div>
        <button
          type="button"
          onClick={() => signOutMimo()}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-foreground">관리자 로그인</h1>
        <p className="text-xs text-muted-foreground">관리자로 지정된 계정으로만 입장할 수 있어요.</p>
      </div>
      <div className="w-full">
        <EmailAuthForm signInEmail={signInWithEmail} onSuccess={() => {}} />
      </div>
    </div>
  );
}
