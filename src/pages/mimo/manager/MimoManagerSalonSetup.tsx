import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MimoPrimaryButton } from "@/components/mimo/ui/MimoPrimaryButton";
import { MimoManagerChipListInput } from "@/components/mimo/manager/MimoManagerChipListInput";
import { MimoManagerServiceEditor } from "@/components/mimo/manager/MimoManagerServiceEditor";
import { useMimoManager } from "@/contexts/MimoManagerContext";
import { mockGeocode } from "@/lib/mimoGeo";
import type { MimoService } from "@/types/mimo";

/** 사장님이 로그인은 했지만 아직 매장을 등록하지 않았을 때 보여주는 최초 매장 등록 화면. */
export default function MimoManagerSalonSetup() {
  const navigate = useNavigate();
  const { authLoading, isManagerLoggedIn, mySalon, salonLoading, createSalon } = useMimoManager();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [services, setServices] = useState<MimoService[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && !isManagerLoggedIn) {
    return <Navigate to="/mimo/manager/login" replace />;
  }
  if (!salonLoading && mySalon) {
    return <Navigate to="/mimo/manager" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error("매장명과 주소는 필수입니다.");
      return;
    }
    if (services.length === 0) {
      toast.error("시술 메뉴를 1개 이상 등록해주세요.");
      return;
    }
    setSubmitting(true);
    const { lat, lng } = mockGeocode(address.trim());
    const errorMessage = await createSalon({
      name: name.trim(),
      address: address.trim(),
      lat,
      lng,
      categories,
      photos,
      services,
    });
    setSubmitting(false);
    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }
    toast.success("매장이 등록되었습니다.");
    navigate("/mimo/manager");
  };

  return (
    <div className="min-h-full bg-background px-6 pb-16 pt-6">
      <h1 className="text-xl font-bold text-foreground">매장 등록</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        매장 정보를 등록하면 손님들이 MIMO 홈 화면에서 매장을 찾고 예약할 수 있어요.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label>매장명</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 미모네일 강남점" />
        </div>
        <div className="space-y-1.5">
          <Label>주소</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 서울 강남구 테헤란로 123" />
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
          {submitting ? "등록 중..." : "매장 등록 완료"}
        </MimoPrimaryButton>
      </form>
    </div>
  );
}
