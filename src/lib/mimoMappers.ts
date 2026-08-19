import type { MimoReservation, MimoReservationStatus, MimoSalon, MimoService, MimoUser } from "@/types/mimo";

// mimo_salons / mimo_users / mimo_reservations 행 매핑을 세 컨텍스트(Mimo/Merchant/Admin)가
// 각자 따로 들고 있다가 필드 하나 추가할 때마다 하나씩 빠뜨리는 문제가 있어서 공용으로 뺐다.

export interface MimoSalonRow {
  id: string;
  name: string;
  address: string;
  phone?: string | null;
  lat: number;
  lng: number;
  status: boolean;
  categories: string[] | null;
  photos: string[] | null;
  services: unknown;
  rating: number;
  owner_uid?: string | null;
  approval_status?: string | null;
  business_reg_url?: string | null;
  bankbook_url?: string | null;
  id_card_url?: string | null;
  tax_invoice_agreed?: boolean | null;
  rejection_reason?: string | null;
}

export function mapSalonRow(row: MimoSalonRow): MimoSalon {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone ?? null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    status: row.status,
    categories: row.categories ?? [],
    photos: row.photos ?? [],
    services: (row.services as MimoService[] | null) ?? [],
    rating: Number(row.rating),
    ownerUid: row.owner_uid ?? null,
    approvalStatus: (row.approval_status as MimoSalon["approvalStatus"] | null) ?? "approved",
    businessRegUrl: row.business_reg_url ?? null,
    bankbookUrl: row.bankbook_url ?? null,
    idCardUrl: row.id_card_url ?? null,
    taxInvoiceAgreed: row.tax_invoice_agreed ?? false,
    rejectionReason: row.rejection_reason ?? null,
  };
}

export interface MimoReservationRow {
  reservation_id: string;
  user_id: string;
  salon_id: string;
  service_name: string;
  price: number;
  start_time: string;
  status: string;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
}

export function mapReservationRow(row: MimoReservationRow): MimoReservation {
  return {
    reservationId: row.reservation_id,
    userId: row.user_id,
    salonId: row.salon_id,
    serviceName: row.service_name,
    price: Number(row.price),
    startTime: row.start_time,
    status: row.status as MimoReservationStatus,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

export interface MimoUserRow {
  uid: string;
  name: string;
  phone: string | null;
  favorites: string[] | null;
  is_admin?: boolean | null;
}

export function mapUserRow(row: MimoUserRow): MimoUser {
  return {
    uid: row.uid,
    name: row.name,
    phone: row.phone,
    favorites: row.favorites ?? [],
    isAdmin: row.is_admin ?? false,
  };
}
