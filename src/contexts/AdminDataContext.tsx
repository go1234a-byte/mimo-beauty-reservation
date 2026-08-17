import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  MimoReport,
  MimoReservation,
  MimoReservationStatus,
  MimoReview,
  MimoSalon,
  MimoSalonApprovalStatus,
  MimoService,
  MimoUser,
} from "@/types/mimo";

interface MimoSalonRow {
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
}

interface MimoUserRow {
  uid: string;
  name: string;
  phone: string | null;
  favorites: string[] | null;
  is_admin?: boolean | null;
}

interface MimoReservationRow {
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

interface MimoReviewRow {
  id: string;
  salon_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface MimoReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
}

function mapSalonRow(row: MimoSalonRow): MimoSalon {
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
    approvalStatus: (row.approval_status as MimoSalonApprovalStatus | null) ?? "approved",
  };
}

function mapUserRow(row: MimoUserRow): MimoUser {
  return {
    uid: row.uid,
    name: row.name,
    phone: row.phone,
    favorites: row.favorites ?? [],
    isAdmin: row.is_admin ?? false,
  };
}

function mapReservationRow(row: MimoReservationRow): MimoReservation {
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

function mapReviewRow(row: MimoReviewRow): MimoReview {
  return {
    id: row.id,
    salonId: row.salon_id,
    userId: row.user_id,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapReportRow(row: MimoReportRow): MimoReport {
  return {
    id: row.id,
    targetType: row.target_type as MimoReport["targetType"],
    targetId: row.target_id,
    reason: row.reason,
    status: row.status as MimoReport["status"],
    createdAt: row.created_at,
  };
}

interface AdminDataContextValue {
  salons: MimoSalon[];
  reservations: MimoReservation[];
  users: MimoUser[];
  reviews: MimoReview[];
  reports: MimoReport[];
  loading: boolean;
  refresh: () => Promise<void>;
  approveSalon: (salonId: string) => Promise<void>;
  rejectSalon: (salonId: string) => Promise<void>;
  forceOffSalon: (salonId: string) => Promise<void>;
  deleteSalon: (salonId: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  toggleUserAdmin: (uid: string, next: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  resolveReport: (reportId: string) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<MimoSalon[]>([]);
  const [reservations, setReservations] = useState<MimoReservation[]>([]);
  const [users, setUsers] = useState<MimoUser[]>([]);
  const [reviews, setReviews] = useState<MimoReview[]>([]);
  const [reports, setReports] = useState<MimoReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [salonsRes, reservationsRes, usersRes, reviewsRes, reportsRes] = await Promise.all([
      supabase.from("mimo_salons").select("*"),
      supabase.from("mimo_reservations").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("mimo_users").select("*"),
      supabase.from("mimo_reviews").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("mimo_reports").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (!salonsRes.error && salonsRes.data) setSalons(salonsRes.data.map((r) => mapSalonRow(r as MimoSalonRow)));
    if (!reservationsRes.error && reservationsRes.data)
      setReservations(reservationsRes.data.map((r) => mapReservationRow(r as MimoReservationRow)));
    if (!usersRes.error && usersRes.data) setUsers(usersRes.data.map((r) => mapUserRow(r as MimoUserRow)));
    // 리뷰/신고 테이블은 마이그레이션 전이면 존재하지 않을 수 있어 실패해도 무시한다.
    if (!reviewsRes.error && reviewsRes.data) setReviews(reviewsRes.data.map((r) => mapReviewRow(r as MimoReviewRow)));
    if (!reportsRes.error && reportsRes.data) setReports(reportsRes.data.map((r) => mapReportRow(r as MimoReportRow)));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const approveSalon = useCallback(async (salonId: string) => {
    const { error } = await supabase.from("mimo_salons").update({ approval_status: "approved" }).eq("id", salonId);
    if (!error) setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, approvalStatus: "approved" } : s)));
  }, []);

  const rejectSalon = useCallback(async (salonId: string) => {
    const { error } = await supabase
      .from("mimo_salons")
      .update({ approval_status: "rejected", status: false })
      .eq("id", salonId);
    if (!error)
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, approvalStatus: "rejected", status: false } : s)),
      );
  }, []);

  const cancelReservation = useCallback(async (reservationId: string) => {
    const { error } = await supabase
      .from("mimo_reservations")
      .update({ status: "cancelled" })
      .eq("reservation_id", reservationId);
    if (!error)
      setReservations((prev) =>
        prev.map((r) => (r.reservationId === reservationId ? { ...r, status: "cancelled" } : r)),
      );
  }, []);

  const toggleUserAdmin = useCallback(async (uid: string, next: boolean) => {
    const { error } = await supabase.from("mimo_users").update({ is_admin: next }).eq("uid", uid);
    if (!error) setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isAdmin: next } : u)));
  }, []);

  // 승인된 매장이라도 문제가 있으면 관리자가 즉시 노출을 강제로 끌 수 있어야 한다.
  const forceOffSalon = useCallback(async (salonId: string) => {
    const { error } = await supabase.from("mimo_salons").update({ status: false }).eq("id", salonId);
    if (!error) setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, status: false } : s)));
  }, []);

  const deleteSalon = useCallback(async (salonId: string) => {
    const { error } = await supabase.from("mimo_salons").delete().eq("id", salonId);
    if (!error) setSalons((prev) => prev.filter((s) => s.id !== salonId));
  }, []);

  const deleteReview = useCallback(async (reviewId: string) => {
    const { error } = await supabase.from("mimo_reviews").delete().eq("id", reviewId);
    if (!error) setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }, []);

  const resolveReport = useCallback(async (reportId: string) => {
    const { error } = await supabase.from("mimo_reports").update({ status: "resolved" }).eq("id", reportId);
    if (!error) setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
  }, []);

  const value: AdminDataContextValue = {
    salons,
    reservations,
    users,
    reviews,
    reports,
    loading,
    refresh,
    approveSalon,
    rejectSalon,
    forceOffSalon,
    deleteSalon,
    cancelReservation,
    toggleUserAdmin,
    deleteReview,
    resolveReport,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
