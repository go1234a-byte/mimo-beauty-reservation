import { supabase } from "@/integrations/supabase/client";
import type { MimoNotification, MimoNotificationType } from "@/types/mimo";

interface MimoNotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export function mapNotificationRow(row: MimoNotificationRow): MimoNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as MimoNotificationType,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

const NOTIFICATION_COPY: Record<MimoNotificationType, (salonName: string) => { title: string; body: string }> = {
  reservation_complete: (salon) => ({
    title: "예약이 확정됐어요",
    body: `${salon} 예약 결제가 완료됐습니다.`,
  }),
  reservation_reminder: (salon) => ({
    title: "예약 시간이 다가와요",
    body: `${salon} 예약 시간이 곧 시작됩니다.`,
  }),
  reservation_cancelled: (salon) => ({
    title: "예약이 취소됐어요",
    body: `${salon} 예약이 취소되었습니다.`,
  }),
  merchant_turned_on: (salon) => ({
    title: "지금 예약 가능해요",
    body: `찜한 매장 ${salon}이(가) 방금 문을 열었어요.`,
  }),
};

/**
 * 알림 테이블(mimo_notifications)에 행을 추가한다.
 * 마이그레이션(MIMO_SCHEMA_MIGRATION.sql)을 아직 적용하지 않은 환경에서는
 * 테이블이 없어 이 호출이 실패할 수 있는데, 그 경우에도 예약/결제 같은 핵심 플로우가
 * 막히면 안 되므로 에러는 콘솔 경고로만 남기고 조용히 넘어간다.
 */
export async function insertMimoNotification(
  userId: string,
  type: MimoNotificationType,
  salonName: string,
) {
  const { title, body } = NOTIFICATION_COPY[type](salonName);
  const { error } = await supabase.from("mimo_notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    read: false,
  });
  if (error) {
    console.warn("[mimo] notification insert skipped:", error.message);
  }
}
