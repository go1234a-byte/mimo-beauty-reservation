import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMerchantData } from "@/contexts/MerchantDataContext";
import { uploadSalonPhoto } from "@/lib/mimoStorage";
import type { MimoService } from "@/types/mimo";

export default function MerchantSalonEdit() {
  const { salonId } = useParams<{ salonId: string }>();
  const navigate = useNavigate();
  const { mySalons, updateSalonInfo } = useMerchantData();
  const salon = mySalons.find((s) => s.id === salonId) ?? mySalons[0];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(salon?.name ?? "");
  const [address, setAddress] = useState(salon?.address ?? "");
  const [phone, setPhone] = useState(salon?.phone ?? "");
  const [categoriesText, setCategoriesText] = useState(salon?.categories.join(", ") ?? "");
  const [photos, setPhotos] = useState<string[]>(salon?.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [services, setServices] = useState<MimoService[]>(salon?.services ?? []);
  const [saving, setSaving] = useState(false);

  if (!salon) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">등록된 매장이 없습니다.</p>
        <Link to="/merchant" className="text-sm font-semibold text-primary">
          사장님 홈으로
        </Link>
      </div>
    );
  }

  const updateService = (index: number, patch: Partial<MimoService>) => {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const removeService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const addService = () => {
    setServices((prev) => [...prev, { name: "", price: 0, duration: 30 }]);
  };

  const handlePhotoSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !salon) return;
    setUploading(true);
    const uploaded = await Promise.all(Array.from(files).map((file) => uploadSalonPhoto(salon.id, file)));
    const urls = uploaded.filter((url): url is string => !!url);
    if (urls.length < files.length) {
      toast.error("일부 사진 업로드에 실패했어요.");
    }
    setPhotos((prev) => [...prev, ...urls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error("매장명과 주소는 비워둘 수 없어요.");
      return;
    }
    const cleanedServices = services.filter((s) => s.name.trim().length > 0);
    if (cleanedServices.length === 0) {
      toast.error("서비스를 최소 1개 이상 등록해주세요.");
      return;
    }

    setSaving(true);
    const ok = await updateSalonInfo(salon.id, {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
      categories: categoriesText.split(",").map((c) => c.trim()).filter(Boolean),
      photos,
      services: cleanedServices,
    });
    setSaving(false);

    if (ok) {
      toast.success("매장 정보가 저장됐어요.");
      navigate("/merchant");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-full bg-background pb-28">
      <header className="flex items-center gap-2 px-6 pt-6">
        <Link to="/merchant" className="rounded-full p-1 text-foreground hover:bg-muted" aria-label="뒤로가기">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold text-foreground">매장 정보 수정</h1>
      </header>

      <div className="space-y-5 px-6 pt-6">
        <div className="space-y-1.5">
          <Label htmlFor="salon-name">매장명</Label>
          <Input id="salon-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-address">주소</Label>
          <Input id="salon-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-phone">전화번호</Label>
          <Input id="salon-phone" value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} placeholder="선택" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="salon-categories">카테고리 (쉼표로 구분)</Label>
          <Input
            id="salon-categories"
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            placeholder="예: 네일, 헤어"
          />
        </div>

        <div className="space-y-1.5">
          <Label>매장 사진</Label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <div key={url + i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/85 text-foreground"
                  aria-label="사진 삭제"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground disabled:opacity-50"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px]">{uploading ? "업로드 중..." : "사진 추가"}</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePhotoSelect(e.target.files)}
          />
          <p className="text-[11px] text-muted-foreground">촬영하거나 사진 보관함에서 선택할 수 있어요.</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>서비스 · 가격</Label>
            <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={addService}>
              <Plus className="h-3.5 w-3.5" />
              추가
            </Button>
          </div>

          <div className="space-y-3">
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
                    onClick={() => removeService(i)}
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
            {services.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">등록된 서비스가 없습니다. 추가해주세요.</p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-border bg-card p-4 md:max-w-lg">
        <Button className="h-[52px] w-full rounded-xl text-base font-semibold" onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </Button>
      </div>
    </div>
  );
}
