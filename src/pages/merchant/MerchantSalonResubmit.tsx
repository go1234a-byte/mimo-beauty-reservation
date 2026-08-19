import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import { MerchantDocsSection, allDocsReady } from "@/components/merchant/MerchantDocsSection";
import type { MerchantDocKind } from "@/lib/mimoStorage";

export default function MerchantSalonResubmit() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { mySalons, resubmitApplication } = useMerchantData();
  const salon = mySalons.find((s) => s.id === salonId);

  const [docPaths, setDocPaths] = useState<Partial<Record<MerchantDocKind, string>>>({});
  const [taxAgreed, setTaxAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!salon || salon.approvalStatus !== "rejected") {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">재제출할 매장을 찾을 수 없습니다.</p>
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
    const ok = await resubmitApplication(salonId, {
      businessRegUrl: docPaths["business-reg"]!,
      bankbookUrl: docPaths["bankbook"]!,
      idCardUrl: docPaths["id-card"]!,
    });
    setSubmitting(false);
    if (ok) {
      toast.success("재제출 완료 — 관리자 심사 후 매장이 노출돼요.");
      navigate("/merchant");
    } else {
      toast.error("재제출에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-full bg-background pb-28">
      <header className="flex items-center gap-2 px-6 pt-6">
        <Link to="/merchant" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">서류 재제출</h1>
      </header>

      <div className="space-y-5 px-6 pt-6">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground">{salon.name}</p>
            <p className="text-xs text-muted-foreground">{salon.address}</p>
          </CardContent>
        </Card>

        {salon.rejectionReason && (
          <div className="rounded-2xl bg-destructive/10 p-4">
            <p className="text-xs font-semibold text-destructive">반려 사유</p>
            <p className="mt-1 text-xs text-destructive">{salon.rejectionReason}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          서류를 다시 제출하면 관리자 심사를 다시 거쳐요.
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
          {submitting ? "제출 중..." : "재제출하기"}
        </Button>
      </div>
    </div>
  );
}
