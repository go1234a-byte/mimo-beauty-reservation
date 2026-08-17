import { supabase } from "@/integrations/supabase/client";

/**
 * 완료된 예약에 대해서만 남길 수 있는 짧은 리뷰. 긴 글쓰기 기능은 의도적으로 만들지 않는다
 * (별점 + 한줄만). mimo_reviews 테이블이 없는 환경(마이그레이션 전)에서는 조용히 실패시킨다.
 */
export async function submitMimoReview(
  salonId: string,
  userId: string,
  rating: number,
  comment: string,
): Promise<boolean> {
  const { error } = await supabase.from("mimo_reviews").insert({
    salon_id: salonId,
    user_id: userId,
    rating,
    comment: comment.slice(0, 60),
  });
  if (error) {
    console.warn("[mimo] review insert failed:", error.message);
    return false;
  }
  return true;
}

/** 이미 리뷰를 남긴 매장 id 목록 — 완료 내역에서 중복으로 리뷰 버튼을 노출하지 않기 위함 */
export async function fetchReviewedSalonIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("mimo_reviews").select("salon_id").eq("user_id", userId);
  if (error || !data) return [];
  return data.map((row) => (row as { salon_id: string }).salon_id);
}
