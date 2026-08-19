import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mapInquiryRow } from "@/lib/mimoInquiries";
import { mapSalonRow, mapUserRow, mapReservationRow, type MimoSalonRow, type MimoUserRow, type MimoReservationRow } from "@/lib/mimoMappers";
import { mapReviewRow, type MimoReviewRow } from "@/lib/mimoReviews";
import type { MimoReport, MimoReservation, MimoReview, MimoSalon, MimoSupportInquiry, MimoUser } from "@/types/mimo";

interface MimoReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
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
  inquiries: MimoSupportInquiry[];
  loading: boolean;
  refresh: () => Promise<void>;
  approveSalon: (salonId: string) => Promise<void>;
  rejectSalon: (salonId: string, reason: string) => Promise<void>;
  forceOffSalon: (salonId: string) => Promise<void>;
  deleteSalon: (salonId: string) => Promise<void>;
  updateSalonInfo: (salonId: string, patch: Partial<MimoSalon>) => Promise<boolean>;
  cancelReservation: (reservationId: string) => Promise<void>;
  toggleUserAdmin: (uid: string, next: boolean) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  resolveReport: (reportId: string) => Promise<void>;
  replyToInquiry: (inquiryId: string, reply: string) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<MimoSalon[]>([]);
  const [reservations, setReservations] = useState<MimoReservation[]>([]);
  const [users, setUsers] = useState<MimoUser[]>([]);
  const [reviews, setReviews] = useState<MimoReview[]>([]);
  const [reports, setReports] = useState<MimoReport[]>([]);
  const [inquiries, setInquiries] = useState<MimoSupportInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [salonsRes, reservationsRes, usersRes, reviewsRes, reportsRes, inquiriesRes] = await Promise.all([
      supabase.from("mimo_salons").select("*"),
      supabase.from("mimo_reservations").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("mimo_users").select("*"),
      supabase.from("mimo_reviews").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("mimo_reports").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("mimo_support_inquiries").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (!salonsRes.error && salonsRes.data) setSalons(salonsRes.data.map((r) => mapSalonRow(r as MimoSalonRow)));
    if (!reservationsRes.error && reservationsRes.data)
      setReservations(reservationsRes.data.map((r) => mapReservationRow(r as MimoReservationRow)));
    if (!usersRes.error && usersRes.data) setUsers(usersRes.data.map((r) => mapUserRow(r as MimoUserRow)));
    // 리뷰/신고/문의 테이블은 마이그레이션 전이면 존재하지 않을 수 있어 실패해도 무시한다.
    if (!reviewsRes.error && reviewsRes.data) setReviews(reviewsRes.data.map((r) => mapReviewRow(r as MimoReviewRow)));
    if (!reportsRes.error && reportsRes.data) setReports(reportsRes.data.map((r) => mapReportRow(r as MimoReportRow)));
    if (!inquiriesRes.error && inquiriesRes.data)
      setInquiries(inquiriesRes.data.map((r) => mapInquiryRow(r as Parameters<typeof mapInquiryRow>[0])));
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

  const rejectSalon = useCallback(async (salonId: string, reason: string) => {
    const { error } = await supabase
      .from("mimo_salons")
      .update({ approval_status: "rejected", status: false, rejection_reason: reason })
      .eq("id", salonId);
    if (!error)
      setSalons((prev) =>
        prev.map((s) =>
          s.id === salonId ? { ...s, approvalStatus: "rejected", status: false, rejectionReason: reason } : s,
        ),
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

  const updateSalonInfo = useCallback(async (salonId: string, patch: Partial<MimoSalon>) => {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.address !== undefined) row.address = patch.address;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.categories !== undefined) row.categories = patch.categories;
    if (patch.services !== undefined) row.services = patch.services;

    const { error } = await supabase.from("mimo_salons").update(row).eq("id", salonId);
    if (error) return false;
    setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...patch } : s)));
    return true;
  }, []);

  const replyToInquiry = useCallback(async (inquiryId: string, reply: string) => {
    const { error } = await supabase
      .from("mimo_support_inquiries")
      .update({ admin_reply: reply, status: "answered", updated_at: new Date().toISOString() })
      .eq("id", inquiryId);
    if (!error)
      setInquiries((prev) =>
        prev.map((q) => (q.id === inquiryId ? { ...q, adminReply: reply, status: "answered" } : q)),
      );
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
    inquiries,
    loading,
    refresh,
    approveSalon,
    rejectSalon,
    forceOffSalon,
    deleteSalon,
    updateSalonInfo,
    cancelReservation,
    toggleUserAdmin,
    deleteReview,
    replyToInquiry,
    resolveReport,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
