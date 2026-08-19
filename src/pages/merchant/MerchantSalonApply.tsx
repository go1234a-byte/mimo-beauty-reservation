import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import { MerchantDocsSection, allDocsReady } from "@/components/merchant/MerchantDocsSection";
import type { MerchantDocKind } from "@/lib/mimoStorage";

export default function MerchantSalonApply() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { merchantUid, claimableSalons, submitMerchantApplication } = useMerchantData();
  const salon = claimableSalons.find((s) => s.id === salonId);

  const [docPaths, setDocPaths] = useState<Partial<Record<MerchantDocKind, string>>>({});
  const [taxAgreed, setTaxAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!merchantUid) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">로그인 후 이용할 수 있어요.</p>
        <Link to="/merchant" className="text-sm font-semibold text-primary">
          사장님 홈으로
        </Link>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">등록 가능한 매장을 찾을 수 없습니다.</p>
        <Link to="/merchant" className="text-sm font-semibold text-primary">
          사장님 홈으로
        </Link>
      </div>
    );
  }

  const canSubmit = allDocsReady(docPaths) && taxAgreed && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !salonId) return;
    setSubmitting(true);
    const ok = await submitMerchantApplication(salonId, {
      businessRegUrl: docPaths["business-reg"]!,
      bankbookUrl: docPaths["bankbook"]!,
      idCardUrl: docPaths["id-card"]!,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("제출 완료 — 관리자 심사 후 매장이 노출돼요.");
      navigate("/merchant");
    } else {
      toast.error("제출에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-full bg-background pb-28">
      <header className="flex items-center gap-2 px-6 pt-6">
        <Link to="/merchant" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">가게 등록 서류 제출</h1>
      </header>

      <div className="space-y-5 px-6 pt-6">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground">{salon.name}</p>
            <p className="text-xs text-muted-foreground">{salon.address}</p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          입점 심사를 위해 아래 서류가 모두 필요합니다. 제출 후 관리자 승인이 완료되면 매장이 노출됩니다.
        </p>

        <MerchantDocsSection
          pathPrefix={salon.id}
          docPaths={docPaths}
          onDocUploaded={(kind, path) => setDocPaths((prev) => ({ ...prev, [kind]: path }))}
          taxAgreed={taxAgreed}
          onTaxAgreedChange={setTaxAgreed}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-card p-4 md:max-w-lg">
        <Button className="h-[52px] w-full rounded-xl text-base font-semibold" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "제출 중..." : "제출하기"}
        </Button>
      </div>
    </div>
  );
}
