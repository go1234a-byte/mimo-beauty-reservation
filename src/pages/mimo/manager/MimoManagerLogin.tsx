import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoManager } from "@/contexts/MimoManagerContext";

export default function MimoManagerLogin() {
  const navigate = useNavigate();
  const { login } = useMimoManager();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    const errorMessage = await login({ email: email.trim(), password });
    setSubmitting(false);
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    navigate("/mimo/manager");
  };

  return (
    <div className="min-h-full bg-background px-6 pb-10 pt-6">
      <Link to="/mimo" className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </Link>

      <h1 className="text-xl font-bold text-foreground">사장님 로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">매장을 관리하려면 사장님 계정으로 로그인해주세요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label>이메일</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mimo.com" />
        </div>
        <div className="space-y-1.5">
          <Label>비밀번호</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
        </div>
        <MimoPrimaryButton type="submit" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </MimoPrimaryButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        아직 계정이 없으신가요?{" "}
        <Link to="/mimo/manager/signup" className="font-semibold text-primary">
          사장님 회원가입
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        <Link to="/mimo" className="underline">
          고객으로 이용하기
        </Link>
      </p>
    </div>
  );
}
