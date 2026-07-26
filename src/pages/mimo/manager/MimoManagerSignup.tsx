import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { useMimoManager } from "@/contexts/MimoManagerContext";

export default function MimoManagerSignup() {
  const navigate = useNavigate();
  const { signup } = useMimoManager();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !password) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    const errorMessage = await signup({ email: email.trim(), password, name: name.trim(), phone: phone.trim() });
    setSubmitting(false);
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    toast.success("가입이 완료되었습니다. 로그인해주세요.");
    navigate("/mimo/manager/login");
  };

  return (
    <div className="min-h-full bg-background px-6 pb-10 pt-6">
      <Link to="/mimo/manager/login" className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary">
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </Link>

      <h1 className="text-xl font-bold text-foreground">사장님 회원가입</h1>
      <p className="mt-1 text-sm text-muted-foreground">매장 정보 등록은 가입 후 바로 이어서 진행할 수 있어요.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label>대표자 이름</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </div>
        <div className="space-y-1.5">
          <Label>휴대폰 번호</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
        </div>
        <div className="space-y-1.5">
          <Label>이메일</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mimo.com" />
        </div>
        <div className="space-y-1.5">
          <Label>비밀번호</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" />
        </div>
        <div className="space-y-1.5">
          <Label>비밀번호 확인</Label>
          <Input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호 재입력"
          />
        </div>
        <MimoPrimaryButton type="submit" disabled={submitting}>
          {submitting ? "가입 중..." : "가입하기"}
        </MimoPrimaryButton>
      </form>
    </div>
  );
}
