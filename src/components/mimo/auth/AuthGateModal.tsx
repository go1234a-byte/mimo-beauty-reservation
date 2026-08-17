import { Apple } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMimoData } from "@/contexts/MimoDataContext";
import type { MimoAuthProvider } from "@/types/mimo";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated?: () => void;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.54-5.17 3.54-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-2.98c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.33c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.68H1.29A11.96 11.96 0 000 12.05c0 1.94.46 3.77 1.29 5.37l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.68l4.02 3.09c.94-2.83 3.58-5.02 6.69-5.02z"
      />
    </svg>
  );
}

export function AuthGateModal({ open, onOpenChange, onAuthenticated }: AuthGateModalProps) {
  const { loginWithProvider } = useMimoData();

  const handleLogin = async (provider: MimoAuthProvider) => {
    await loginWithProvider(provider);
    onOpenChange(false);
    onAuthenticated?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-none px-6 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold">로그인이 필요해요</SheetTitle>
          <SheetDescription>예약을 진행하려면 로그인이 필요합니다.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <Button
            onClick={() => handleLogin("apple")}
            className="h-[52px] w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          >
            <Apple className="h-4 w-4 fill-current" />
            Apple로 계속
          </Button>
          <Button
            onClick={() => handleLogin("google")}
            variant="outline"
            className="h-[52px] w-full rounded-xl border-border bg-background text-foreground hover:bg-secondary"
          >
            <GoogleIcon />
            Google로 계속
          </Button>
          <Button
            onClick={() => handleLogin("kakao")}
            className="h-[52px] w-full rounded-xl bg-[#FEE500] text-[#191600] hover:bg-[#FEE500]/90"
          >
            카카오로 계속
          </Button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          로그인하면 MIMO의 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </SheetContent>
    </Sheet>
  );
}
