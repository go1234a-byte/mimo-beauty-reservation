import type { MimoReservation } from "@/types/mimo";

/**
 * MIMO 수수료·부가세 정산 계산.
 *
 * - 플랫폼 수수료율: 예약 금액의 10% (MIMO의 공급가액/매출)
 * - 부가가치세(VAT): 한국 표준세율 10%, 공급가액(수수료)에 별도 부과 — 즉 사장님에게는
 *   "수수료 + 부가세"를 청구하고, 그중 부가세분은 MIMO가 국세청에 납부.
 *   (매입세액공제는 없다고 가정한 가장 단순한 모델 — 실제 신고 시 매입세액이 있으면 차감됨.
 *   법인세/소득세 등 순이익 기준 세금은 사업자 형태·경비에 따라 달라 별도 계산이 필요함.)
 */
const COMMISSION_RATE = 0.1;
const VAT_RATE = 0.1;

export interface MonthlySettlement {
  month: string; // "2026-08"
  reservationCount: number;
  totalRevenue: number; // 매장에 귀속되는 예약 총액
  commission: number; // MIMO 수수료(공급가액)
  vat: number; // 수수료에 대한 부가세(납부액)
  totalBilled: number; // 사장님에게 청구되는 금액(수수료 + 부가세)
}

export function computeMonthlySettlements(reservations: MimoReservation[]): MonthlySettlement[] {
  const byMonth = new Map<string, { count: number; revenue: number }>();

  for (const r of reservations) {
    if (r.paymentStatus !== "paid") continue;
    const month = r.createdAt.slice(0, 7); // YYYY-MM
    const entry = byMonth.get(month) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += r.price;
    byMonth.set(month, entry);
  }

  return Array.from(byMonth.entries())
    .map(([month, { count, revenue }]) => {
      const commission = revenue * COMMISSION_RATE;
      const vat = commission * VAT_RATE;
      return {
        month,
        reservationCount: count,
        totalRevenue: revenue,
        commission,
        vat,
        totalBilled: commission + vat,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));
}
