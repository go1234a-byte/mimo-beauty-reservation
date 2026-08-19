import { useRef, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadMerchantDocument, type MerchantDocKind } from "@/lib/mimoStorage";

const DOC_FIELDS: { kind: MerchantDocKind; label: string; help: string }[] = [
  { kind: "business-reg", label: "사업자 등록증", help: "사업자등록증 사본 이미지" },
  { kind: "bankbook", label: "통장 사본", help: "정산 받을 계좌의 통장 사본" },
  { kind: "id-card", label: "신분증 사본", help: "대표자 신분증 사본" },
];

interface MerchantDocsSectionProps {
  /** Storage 업로드 경로 prefix (매장 id 등 — 아직 매장이 없으면 임시 id) */
  pathPrefix: string;
  docPaths: Partial<Record<MerchantDocKind, string>>;
  onDocUploaded: (kind: MerchantDocKind, path: string) => void;
  taxAgreed: boolean;
  onTaxAgreedChange: (agreed: boolean) => void;
}

export function MerchantDocsSection({
  pathPrefix,
  docPaths,
  onDocUploaded,
  taxAgreed,
  onTaxAgreedChange,
}: MerchantDocsSectionProps) {
  const [uploadingKind, setUploadingKind] = useState<MerchantDocKind | null>(null);
  const fileInputRefs = useRef<Partial<Record<MerchantDocKind, HTMLInputElement | null>>>({});

  const handleFileChange = async (kind: MerchantDocKind, file: File | null) => {
    if (!file) return;
    setUploadingKind(kind);
    const path = await uploadMerchantDocument(pathPrefix, kind, file);
    setUploadingKind(null);
    if (!path) {
      toast.error("업로드에 실패했어요. 다시 시도해주세요.");
      return;
    }
    onDocUploaded(kind, path);
  };

  return (
    <>
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
          onChange={(e) => onTaxAgreedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-xs text-foreground">
          매출 발생 시 <strong className="font-semibold">세금계산서 발행 의무</strong>가 있음을 확인했으며, 이를
          성실히 이행할 것에 동의합니다.
        </span>
      </label>
    </>
  );
}

export function allDocsReady(docPaths: Partial<Record<MerchantDocKind, string>>): boolean {
  return DOC_FIELDS.every((f) => !!docPaths[f.kind]);
}
