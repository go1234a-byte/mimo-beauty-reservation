import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { signUpWithEmail, signInWithEmail, signOutMimo, ensureMimoProfile } from "@/lib/mimoAuth";
import { insertMimoNotification, mapNotificationRow } from "@/lib/mimoNotifications";
import type {
  MimoNotification,
  MimoReservation,
  MimoReservationStatus,
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

interface CreateReservationInput {
  salonId: string;
  serviceName: string;
  price: number;
  startTime: string;
}

interface MimoDataContextValue {
  salons: MimoSalon[];
  activeSalons: MimoSalon[];
  loading: boolean;
  currentUser: MimoUser | null;
  reservations: MimoReservation[];
  hasActiveReservation: boolean;
  notifications: MimoNotification[];
  unreadNotificationCount: number;
  signUpEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ ok: boolean; needsEmailConfirm?: boolean; error?: string }>;
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  toggleFavorite: (salonId: string) => Promise<void>;
  isFavorite: (salonId: string) => boolean;
  isSlotTaken: (salonId: string, startTime: string) => boolean;
  createPendingReservation: (input: CreateReservationInput) => Promise<MimoReservation | null>;
  confirmReservation: (reservationId: string, paymentMethod: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  getSalonById: (salonId: string) => MimoSalon | undefined;
  refreshReservations: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const MimoDataContext = createContext<MimoDataContextValue | undefined>(undefined);

export function MimoDataProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<MimoSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<MimoUser | null>(null);
  const [reservations, setReservations] = useState<MimoReservation[]>([]);
  const [allReservations, setAllReservations] = useState<MimoReservation[]>([]);
  const [notifications, setNotifications] = useState<MimoNotification[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  const fetchSalons = useCallback(async () => {
    const { data, error } = await supabase.from("mimo_salons").select("*");
    if (!error && data) {
      setSalons(data.map((row) => mapSalonRow(row as MimoSalonRow)));
    }
  }, []);

  const fetchAllReservations = useCallback(async () => {
    const { data, error } = await supabase
      .from("mimo_reservations")
      .select("*")
      .in("status", ["pending", "confirmed"]);
    if (!error && data) {
      setAllReservations(data.map((row) => mapReservationRow(row as MimoReservationRow)));
    }
  }, []);

  const fetchUserReservations = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("mimo_reservations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setReservations(data.map((row) => mapReservationRow(row as MimoReservationRow)));
    }
  }, []);

  const fetchUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("mimo_users").select("*").eq("uid", userId).maybeSingle();
    if (!error && data) {
      setCurrentUser(mapUserRow(data as MimoUserRow));
      return true;
    }
    return false;
  }, []);

  const fetchNotifications = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("mimo_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && data) {
      setNotifications(data.map((row) => mapNotificationRow(row as Parameters<typeof mapNotificationRow>[0])));
    }
    // 마이그레이션 전이라 테이블이 없어도(error) 조용히 빈 목록을 유지한다.
  }, []);

  // 첫 로그인 시 mimo_users 프로필 행이 없으면 만들어준다 (이름은 회원가입 때 넘긴 메타데이터에서 가져옴).
  const ensureProfile = useCallback(
    async (activeSession: Session) => {
      const userId = activeSession.user.id;
      await ensureMimoProfile(activeSession);
      await Promise.all([fetchUser(userId), fetchUserReservations(userId), fetchNotifications(userId)]);
    },
    [fetchUser, fetchUserReservations, fetchNotifications],
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSalons(), fetchAllReservations()]).finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        ensureProfile(newSession);
      } else {
        setCurrentUser(null);
        setReservations([]);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchSalons, fetchAllReservations, ensureProfile]);

  // 실시간 동기화: 다른 사용자의 결제 확정이나 사장님의 ON/OFF 전환이 새로고침 없이
  // 바로 반영되도록 mimo_salons 테이블 변경을 구독한다. Realtime이 비활성화된 프로젝트에서도
  // 앱이 깨지지 않도록 실패는 조용히 무시한다(최초 fetch 결과로 계속 동작).
  useEffect(() => {
    const channel = supabase
      .channel("mimo_salons_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mimo_salons" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as { id?: string } | null)?.id;
            if (oldId) setSalons((prev) => prev.filter((s) => s.id !== oldId));
            return;
          }
          const row = payload.new as MimoSalonRow;
          const updated = mapSalonRow(row);
          setSalons((prev) => {
            const exists = prev.some((s) => s.id === updated.id);
            return exists ? prev.map((s) => (s.id === updated.id ? updated : s)) : [...prev, updated];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeSalons = useMemo(
    () => salons.filter((s) => s.status && s.approvalStatus === "approved"),
    [salons],
  );

  const hasActiveReservation = useMemo(
    () => reservations.some((r) => r.status === "pending" || r.status === "confirmed"),
    [reservations],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const logout = useCallback(async () => {
    await signOutMimo();
  }, []);

  const isFavorite = useCallback(
    (salonId: string) => !!currentUser?.favorites.includes(salonId),
    [currentUser],
  );

  const toggleFavorite = useCallback(
    async (salonId: string) => {
      if (!currentUser) return;
      const next = currentUser.favorites.includes(salonId)
        ? currentUser.favorites.filter((id) => id !== salonId)
        : [...currentUser.favorites, salonId];
      const { error } = await supabase.from("mimo_users").update({ favorites: next }).eq("uid", currentUser.uid);
      if (!error) {
        setCurrentUser({ ...currentUser, favorites: next });
      }
    },
    [currentUser],
  );

  const isSlotTaken = useCallback(
    (salonId: string, startTime: string) =>
      allReservations.some((r) => r.salonId === salonId && r.startTime === startTime),
    [allReservations],
  );

  const createPendingReservation = useCallback(
    async (input: CreateReservationInput): Promise<MimoReservation | null> => {
      if (!currentUser) return null;
      const { data, error } = await supabase
        .from("mimo_reservations")
        .insert({
          user_id: currentUser.uid,
          salon_id: input.salonId,
          service_name: input.serviceName,
          price: input.price,
          start_time: input.startTime,
          status: "pending",
          payment_status: "unpaid",
        })
        .select()
        .maybeSingle();
      if (!error && data) {
        const reservation = mapReservationRow(data as MimoReservationRow);
        setReservations((prev) => [reservation, ...prev]);
        setAllReservations((prev) => [reservation, ...prev]);
        return reservation;
      }
      return null;
    },
    [currentUser],
  );

  // Priority 6 — "NOW" 자동화의 핵심: 결제가 확정되는 순간 해당 매장은 즉시
  // 다른 사용자에게 보이지 않도록(OFF) 만들어서 이중 예약을 방지한다.
  const confirmReservation = useCallback(
    async (reservationId: string, paymentMethod: string) => {
      const { data, error } = await supabase
        .from("mimo_reservations")
        .update({ status: "confirmed", payment_status: "paid", payment_method: paymentMethod })
        .eq("reservation_id", reservationId)
        .select()
        .maybeSingle();
      if (!error && data) {
        const updated = mapReservationRow(data as MimoReservationRow);
        setReservations((prev) => prev.map((r) => (r.reservationId === reservationId ? updated : r)));
        setAllReservations((prev) => prev.map((r) => (r.reservationId === reservationId ? updated : r)));

        const { error: statusError } = await supabase
          .from("mimo_salons")
          .update({ status: false })
          .eq("id", updated.salonId);
        if (!statusError) {
          setSalons((prev) => prev.map((s) => (s.id === updated.salonId ? { ...s, status: false } : s)));
        }

        const salonName = salons.find((s) => s.id === updated.salonId)?.name ?? "매장";
        await insertMimoNotification(updated.userId, "reservation_complete", salonName);
        setNotifications((prev) => [
          {
            id: `local-${Date.now()}`,
            userId: updated.userId,
            type: "reservation_complete",
            title: "예약이 확정됐어요",
            body: `${salonName} 예약 결제가 완료됐습니다.`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    },
    [salons],
  );

  // 예약이 취소되면 해당 매장을 다시 "지금 가능" 상태로 되돌린다.
  const cancelReservation = useCallback(
    async (reservationId: string) => {
      const target = reservations.find((r) => r.reservationId === reservationId);
      const { error } = await supabase
        .from("mimo_reservations")
        .update({ status: "cancelled" })
        .eq("reservation_id", reservationId);
      if (!error) {
        setReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
        setAllReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));

        if (target) {
          const { error: statusError } = await supabase
            .from("mimo_salons")
            .update({ status: true })
            .eq("id", target.salonId);
          if (!statusError) {
            setSalons((prev) => prev.map((s) => (s.id === target.salonId ? { ...s, status: true } : s)));
          }
          const salonName = salons.find((s) => s.id === target.salonId)?.name ?? "매장";
          await insertMimoNotification(target.userId, "reservation_cancelled", salonName);
        }
      }
    },
    [reservations, salons],
  );

  const getSalonById = useCallback((salonId: string) => salons.find((s) => s.id === salonId), [salons]);

  const refreshReservations = useCallback(async () => {
    if (currentUser) {
      await fetchUserReservations(currentUser.uid);
    }
  }, [currentUser, fetchUserReservations]);

  const refreshNotifications = useCallback(async () => {
    if (currentUser) {
      await fetchNotifications(currentUser.uid);
    }
  }, [currentUser, fetchNotifications]);

  const markNotificationsRead = useCallback(async () => {
    if (!currentUser || notifications.every((n) => n.read)) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const { error } = await supabase
      .from("mimo_notifications")
      .update({ read: true })
      .eq("user_id", currentUser.uid)
      .eq("read", false);
    if (error) {
      console.warn("[mimo] failed to mark notifications read:", error.message);
    }
  }, [currentUser, notifications]);

  const value: MimoDataContextValue = {
    salons,
    activeSalons,
    loading,
    currentUser,
    reservations,
    hasActiveReservation,
    notifications,
    unreadNotificationCount,
    signUpEmail: signUpWithEmail,
    signInEmail: signInWithEmail,
    logout,
    toggleFavorite,
    isFavorite,
    isSlotTaken,
    createPendingReservation,
    confirmReservation,
    cancelReservation,
    getSalonById,
    refreshReservations,
    refreshNotifications,
    markNotificationsRead,
  };

  return <MimoDataContext.Provider value={value}>{children}</MimoDataContext.Provider>;
}

export function useMimoData() {
  const ctx = useContext(MimoDataContext);
  if (!ctx) throw new Error("useMimoData must be used within MimoDataProvider");
  return ctx;
}
