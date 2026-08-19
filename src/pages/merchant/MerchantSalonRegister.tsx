import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MerchantDocsSection, allDocsReady } from "@/components/merchant/MerchantDocsSection";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import type { MerchantDocKind } from "@/lib/mimoStorage";
import type { MimoService } from "@/types/mimo";

// 위치 권한이 없거나 실패하면 서비스 중심지(강남)로 폴백 — 등록 후 필요하면 관리자에게 좌표 보정 요청.
const FALLBACK_COORDS = { lat: 37.5006, lng: 127.0286 };

export default function MerchantSalonRegister() {
  const navigate = useNavigate();
  const { merchantUid, registerNewSalon } = useMerchantData();

  // 서류는 매장이 생기기 전에 올려야 하므로 임시 경로 prefix를 하나 만들어 쓴다.
  const tempPathPrefix = useMemo(() => `new-${crypto.randomUUID()}`, []);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [categoriesText, setCategoriesText] = useState("");
  const [services, setServices] = useState<MimoService[]>([{ name: "", price: 0, duration: 30 }]);
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

  const updateService = (index: number, patch: Partial<MimoService>) => {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const canSubmit =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    services.some((s) => s.name.trim().length > 0) &&
    allDocsReady(docPaths) &&
    taxAgreed &&
    !submitting;

  const getCoords = (): Promise<{ lat: number; lng: number }> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(FALLBACK_COORDS);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(FALLBACK_COORDS),
        { timeout: 5000 },
      );
    });

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const coords = await getCoords();
    const newId = await registerNewSalon({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
      lat: coords.lat,
      lng: coords.lng,
      categories: categoriesText.split(",").map((c) => c.trim()).filter(Boolean),
      services: services.filter((s) => s.name.trim().length > 0),
      businessRegUrl: docPaths["business-reg"]!,
      bankbookUrl: docPaths["bankbook"]!,
      idCardUrl: docPaths["id-card"]!,
    });
    setSubmitting(false);
    if (newId) {
      toast.success("제출 완료 — 관리자 심사 후 매장이 노출돼요.");
      navigate("/merchant");
    } else {
      toast.error("등록에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-full bg-background pb-28">
      <header className="flex items-center gap-2 px-6 pt-6">
        <Link to="/merchant" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">새 매장 등록</h1>
      </header>

      <div className="space-y-5 px-6 pt-6">
        <p className="text-xs text-muted-foreground">
          매장 정보와 서류를 제출하면 관리자 심사 후 노출됩니다. 위치는 이 페이지를 여는 브라우저의 현재
          위치로 자동 설정돼요 (등록 후 조정이 필요하면 문의해주세요).
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="new-salon-name">매장명</Label>
          <Input id="new-salon-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-salon-address">주소</Label>
          <Input id="new-salon-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-salon-phone">전화번호</Label>
          <Input id="new-salon-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="선택" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-salon-categories">카테고리 (쉼표로 구분)</Label>
          <Input
            id="new-salon-categories"
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            placeholder="예: 네일, 헤어"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>서비스 · 가격</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setServices((prev) => [...prev, { name: "", price: 0, duration: 30 }])}
            >
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>
          {services.map((service, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={service.name}
                  onChange={(e) => updateService(i, { name: e.target.value })}
                  placeholder="서비스명"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                  aria-label="서비스 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={service.price}
                  onChange={(e) => updateService(i, { price: Number(e.target.value) || 0 })}
                  placeholder="가격"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={service.duration}
                  onChange={(e) => updateService(i, { duration: Number(e.target.value) || 0 })}
                  placeholder="소요시간(분)"
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>

        <MerchantDocsSection
          pathPrefix={tempPathPrefix}
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
