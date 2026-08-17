export interface MimoService {
  name: string;
  price: number;
  duration: number;
}

export type MimoSalonApprovalStatus = "pending" | "approved" | "rejected";

export interface MimoSalon {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  status: boolean;
  categories: string[];
  photos: string[];
  services: MimoService[];
  rating: number;
  ownerUid: string | null;
  approvalStatus: MimoSalonApprovalStatus;
}

export type MimoAuthProvider = "apple" | "google" | "kakao";

export interface MimoUser {
  uid: string;
  name: string;
  phone: string | null;
  favorites: string[];
  isAdmin: boolean;
}

export type MimoReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface MimoReservation {
  reservationId: string;
  userId: string;
  salonId: string;
  serviceName: string;
  price: number;
  startTime: string;
  status: MimoReservationStatus;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: string;
}

export const MIMO_PAYMENT_METHODS = [
  { id: "kakaopay", label: "카카오페이" },
  { id: "tosspay", label: "토스페이" },
  { id: "card", label: "신용/체크카드" },
  { id: "applepay", label: "Apple Pay" },
] as const;

export type MimoPaymentMethod = (typeof MIMO_PAYMENT_METHODS)[number]["id"];

export type MimoNotificationType =
  | "reservation_complete"
  | "reservation_reminder"
  | "reservation_cancelled"
  | "merchant_turned_on";

export interface MimoNotification {
  id: string;
  userId: string;
  type: MimoNotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export type MimoReportStatus = "open" | "resolved";

export interface MimoReport {
  id: string;
  targetType: "salon" | "user" | "review";
  targetId: string;
  reason: string;
  status: MimoReportStatus;
  createdAt: string;
}

export interface MimoReview {
  id: string;
  salonId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MimoCoordinates {
  lat: number;
  lng: number;
}
