import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useMimoData } from "@/contexts/MimoDataContext";
import { EmailAuthForm } from "./EmailAuthForm";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthenticated?: () => void;
}

export function AuthGateModal({ open, onOpenChange, onAuthenticated }: AuthGateModalProps) {
  const { signUpEmail, signInEmail } = useMimoData();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-none px-6 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold">로그인</SheetTitle>
          <SheetDescription>예약을 진행하려면 로그인이 필요합니다.</SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <EmailAuthForm
            signUpEmail={signUpEmail}
            signInEmail={signInEmail}
            onSuccess={() => {
              onOpenChange(false);
              onAuthenticated?.();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
