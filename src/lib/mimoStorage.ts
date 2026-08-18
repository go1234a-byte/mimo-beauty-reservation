import { supabase } from "@/integrations/supabase/client";

const PHOTOS_BUCKET = "salon-photos";
const DOCS_BUCKET = "merchant-docs";

export async function uploadSalonPhoto(salonId: string, file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${salonId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.warn("[mimo] photo upload failed:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export type MerchantDocKind = "business-reg" | "bankbook" | "id-card";

/** 사업자등록증/통장사본/신분증 — 비공개 버킷에 저장하고 storage 경로만 반환한다. */
export async function uploadMerchantDocument(
  salonId: string,
  kind: MerchantDocKind,
  file: File,
): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${salonId}/${kind}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    console.warn("[mimo] document upload failed:", error.message);
    return null;
  }
  return path;
}

/** 관리자가 서류를 열람할 때 1시간짜리 서명된 URL을 새로 발급한다. */
export async function getMerchantDocSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 3600);
  if (error || !data) {
    console.warn("[mimo] signed url failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}
