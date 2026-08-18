import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import { uploadMerchantDocument, type MerchantDocKind } from "@/lib/mimoStorage";

const DOC_FIELDS: { kind: MerchantDocKind; label: string; help: string }[] = [
  { kind: "business-reg", label: "사업자 등록증", help: "사업자등록증 사본 이미지" },
  { kind: "bankbook", label: "통장 사본", help: "정산 받을 계좌의 통장 사본" },
  { kind: "id-card", label: "신분증 사본", help: "대표자 신분증 사본" },
];

export default function MerchantSalonApply() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { merchantUid, claimableSalons, submitMerchantApplication } = useMerchantData();
  const salon = claimableSalons.find((s) => s.id === salonId);

  const [docPaths, setDocPaths] = useState<Partial<Record<MerchantDocKind, string>>>({});
  const [uploadingKind, setUploadingKind] = useState<MerchantDocKind | null>(null);
  const [taxAgreed, setTaxAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Partial<Record<MerchantDocKind, HTMLInputElement | null>>>({});

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

  const handleFileChange = async (kind: MerchantDocKind, file: File | null) => {
    if (!file || !salonId) return;
    setUploadingKind(kind);
    const path = await uploadMerchantDocument(salonId, kind, file);
    setUploadingKind(null);
    if (!path) {
      toast.error("업로드에 실패했어요. 다시 시도해주세요.");
      return;
    }
    setDocPaths((prev) => ({ ...prev, [kind]: path }));
  };

  const allDocsReady = DOC_FIELDS.every((f) => !!docPaths[f.kind]);
  const canSubmit = allDocsReady && taxAgreed && !submitting;

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

        <div className="space-y-3">
          {DOC_FIELDS.map(({ kind, label, help }) => {
            const done = !!docPaths[kind];
            const uploading = uploadingKind === kind;
            return (
              <div key={kind} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{help}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={done ? "outline" : "default"}
                  className="gap-1.5 rounded-full"
                  disabled={uploading}
                  onClick={() => fileInputRefs.current[kind]?.click()}
                >
                  {done ? <FileCheck2 className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "업로드 중..." : done ? "제출됨" : "업로드"}
                </Button>
                <input
                  ref={(el) => (fileInputRefs.current[kind] = el)}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(kind, e.target.files?.[0] ?? null)}
                />
              </div>
            );
          })}
        </div>

        <label className="flex items-start gap-2.5 rounded-2xl border border-border p-4">
          <input
            type="checkbox"
            checked={taxAgreed}
            onChange={(e) => setTaxAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-xs text-foreground">
            매출 발생 시 <strong className="font-semibold">세금계산서 발행 의무</strong>가 있음을 확인했으며, 이를
            성실히 이행할 것에 동의합니다.
          </span>
        </label>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-card p-4 md:max-w-lg">
        <Button className="h-[52px] w-full rounded-xl text-base font-semibold" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "제출 중..." : "제출하기"}
        </Button>
      </div>
    </div>
  );
}
