export interface MimoService {
  name: string;
  price: number;
  duration: number;
}

export interface MimoSalon {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: boolean;
  categories: string[];
  photos: string[];
  services: MimoService[];
  rating: number;
}

export type MimoAuthProvider = "apple" | "google" | "kakao";

export interface MimoUser {
  uid: string;
  name: string;
  phone: string | null;
  favorites: string[];
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
