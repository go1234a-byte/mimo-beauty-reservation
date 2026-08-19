import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminData } from "@/contexts/AdminDataContext";
import type { MimoSalon, MimoService } from "@/types/mimo";

interface AdminSalonEditSheetProps {
  salon: MimoSalon | null;
  onOpenChange: (open: boolean) => void;
}

export function AdminSalonEditSheet({ salon, onOpenChange }: AdminSalonEditSheetProps) {
  const { updateSalonInfo } = useAdminData();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [categoriesText, setCategoriesText] = useState("");
  const [services, setServices] = useState<MimoService[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!salon) return;
    setName(salon.name);
    setAddress(salon.address);
    setPhone(salon.phone ?? "");
    setCategoriesText(salon.categories.join(", "));
    setServices(salon.services);
  }, [salon]);

  if (!salon) return null;

  const updateService = (index: number, patch: Partial<MimoService>) => {
    setServices((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error("매장명과 주소는 비워둘 수 없어요.");
      return;
    }
    setSaving(true);
    const ok = await updateSalonInfo(salon.id, {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || null,
      categories: categoriesText.split(",").map((c) => c.trim()).filter(Boolean),
      services: services.filter((s) => s.name.trim().length > 0),
    });
    setSaving(false);
    if (ok) {
      toast.success("매장 정보가 저장됐어요.");
      onOpenChange(false);
    } else {
      toast.error("저장에 실패했습니다.");
    }
  };

  return (
    <Sheet open={!!salon} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-none px-6 pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">매장 정보 수정</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-salon-name">매장명</Label>
            <Input id="admin-salon-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-salon-address">주소</Label>
            <Input id="admin-salon-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-salon-phone">전화번호</Label>
            <Input id="admin-salon-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="선택" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-salon-categories">카테고리 (쉼표로 구분)</Label>
            <Input id="admin-salon-categories" value={categoriesText} onChange={(e) => setCategoriesText(e.target.value)} />
          </div>

          <div className="space-y-2">
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

          <Button className="h-12 w-full rounded-xl text-sm font-semibold" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
