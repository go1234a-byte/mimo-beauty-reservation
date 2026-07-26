import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { MimoManagerChipListInput } from "@/components/mimo/manager/MimoManagerChipListInput";
import { MimoManagerServiceEditor } from "@/components/mimo/manager/MimoManagerServiceEditor";
import { useMimoManager } from "@/contexts/MimoManagerContext";
import { mockGeocode } from "@/lib/mimoGeo";
import type { MimoService } from "@/types/mimo";

export default function MimoManagerSalonEdit() {
  const { mySalon, updateSalon } = useMimoManager();

  const [name, setName] = useState(mySalon?.name ?? "");
  const [address, setAddress] = useState(mySalon?.address ?? "");
  const [categories, setCategories] = useState<string[]>(mySalon?.categories ?? []);
  const [photos, setPhotos] = useState<string[]>(mySalon?.photos ?? []);
  const [services, setServices] = useState<MimoService[]>(mySalon?.services ?? []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mySalon) return;
    setName(mySalon.name);
    setAddress(mySalon.address);
    setCategories(mySalon.categories);
    setPhotos(mySalon.photos);
    setServices(mySalon.services);
  }, [mySalon]);

  if (!mySalon) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    );
  }

  const handleToggleStatus = async () => {
    const errorMessage = await updateSalon({ status: !mySalon.status });
    if (errorMessage) toast.error(errorMessage);
    else toast.success(mySalon.status ? "영업을 일시중지했습니다." : "영업을 재개했습니다.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("매장명과 주소는 필수입니다.");
      return;
    }
    setSubmitting(true);
    const addressChanged = address.trim() !== mySalon.address;
    const geo = addressChanged ? mockGeocode(address.trim()) : { lat: mySalon.lat, lng: mySalon.lng };
    const errorMessage = await updateSalon({
      name: name.trim(),
      address: address.trim(),
      lat: geo.lat,
      lng: geo.lng,
      categories,
      photos,
      services,
    });
    setSubmitting(false);
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    toast.success("매장 정보가 저장되었습니다.");
  };

  return (
    <div className="min-h-full bg-background px-6 pb-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">매장 정보 관리</h1>
        <Badge variant={mySalon.status ? "default" : "secondary"}>{mySalon.status ? "영업중" : "영업중지"}</Badge>
      </div>

      <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={handleToggleStatus}>
        {mySalon.status ? "영업 일시중지하기" : "영업 재개하기"}
      </Button>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="space-y-1.5">
          <Label>매장명</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>주소</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>카테고리</Label>
          <MimoManagerChipListInput values={categories} onChange={setCategories} placeholder="예: 네일, 속눈썹" />
        </div>
        <div className="space-y-1.5">
          <Label>매장 사진 (이미지 URL)</Label>
          <MimoManagerChipListInput values={photos} onChange={setPhotos} placeholder="이미지 URL 붙여넣기" />
        </div>
        <div className="space-y-1.5">
          <Label>시술 메뉴 및 가격</Label>
          <MimoManagerServiceEditor services={services} onChange={setServices} />
        </div>
        <MimoPrimaryButton type="submit" disabled={submitting}>
          {submitting ? "저장 중..." : "저장하기"}
        </MimoPrimaryButton>
      </form>
    </div>
  );
}
