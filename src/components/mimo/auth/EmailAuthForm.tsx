import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthResult = { ok: boolean; needsEmailConfirm?: boolean; error?: string };

interface EmailAuthFormProps {
  signUpEmail?: (email: string, password: string, name: string) => Promise<AuthResult>;
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onSuccess: () => void;
}

/** 소비자/사장님/관리자 화면이 공유하는 이메일·비밀번호 로그인·회원가입 폼. signUpEmail을 안 주면 로그인만 노출한다. */
export function EmailAuthForm({ signUpEmail, signInEmail, onSuccess }: EmailAuthFormProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (mode === "signUp" && signUpEmail) {
      const result = await signUpEmail(email, password, name);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error ?? "회원가입에 실패했습니다.");
        return;
      }
      if (result.needsEmailConfirm) {
        setConfirmSent(true);
        return;
      }
      onSuccess();
      return;
    }

    const result = await signInEmail(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "로그인에 실패했습니다.");
      return;
    }
    onSuccess();
  };

  if (confirmSent) {
    return (
      <p className="rounded-xl bg-secondary p-4 text-sm text-foreground">
        가입 확인 이메일을 보냈어요. 메일함에서 확인 링크를 눌러주세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "signUp" && signUpEmail && (
          <div className="space-y-1.5">
            <Label htmlFor="ea-name">닉네임</Label>
            <Input id="ea-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="ea-email">이메일</Label>
          <Input id="ea-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ea-password">비밀번호</Label>
          <Input
            id="ea-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="h-[52px] w-full rounded-xl text-base font-semibold">
          {submitting ? "처리 중..." : mode === "signIn" ? "로그인" : "회원가입"}
        </Button>
      </form>

      {signUpEmail && (
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="w-full text-center text-xs font-medium text-muted-foreground"
        >
          {mode === "signIn" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      )}
    </div>
  );
}
