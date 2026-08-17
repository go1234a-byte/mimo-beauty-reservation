import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMimoUid } from "@/lib/mimoSession";
import { insertMimoNotification } from "@/lib/mimoNotifications";
import type { MimoReservation, MimoReservationStatus, MimoSalon, MimoService } from "@/types/mimo";

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
    approvalStatus: (row.approval_status as MimoSalon["approvalStatus"] | null) ?? "approved",
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

const POLL_INTERVAL_MS = 12000;

interface MerchantDataContextValue {
  merchantUid: string;
  mySalons: MimoSalon[];
  claimableSalons: MimoSalon[];
  incomingReservations: MimoReservation[];
  loading: boolean;
  refresh: () => Promise<void>;
  claimSalon: (salonId: string) => Promise<void>;
  toggleSalonStatus: (salonId: string, next: boolean) => Promise<void>;
  completeReservation: (reservationId: string, salonId: string) => Promise<void>;
}

const MerchantDataContext = createContext<MerchantDataContextValue | undefined>(undefined);

export function MerchantDataProvider({ children }: { children: ReactNode }) {
  const merchantUid = useMemo(() => getOrCreateMimoUid(), []);
  const [allSalons, setAllSalons] = useState<MimoSalon[]>([]);
  const [incomingReservations, setIncomingReservations] = useState<MimoReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalons = useCallback(async () => {
    const { data, error } = await supabase.from("mimo_salons").select("*");
    if (!error && data) {
      setAllSalons(data.map((row) => mapSalonRow(row as MimoSalonRow)));
    }
  }, []);

  const mySalons = useMemo(() => allSalons.filter((s) => s.ownerUid === merchantUid), [allSalons, merchantUid]);
  const claimableSalons = useMemo(() => allSalons.filter((s) => !s.ownerUid), [allSalons]);

  const fetchIncomingReservations = useCallback(async (salonIds: string[]) => {
    if (salonIds.length === 0) {
      setIncomingReservations([]);
      return;
    }
    const { data, error } = await supabase
      .from("mimo_reservations")
      .select("*")
      .in("salon_id", salonIds)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false });
    if (!error && data) {
      setIncomingReservations(data.map((row) => mapReservationRow(row as MimoReservationRow)));
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSalons();
  }, [fetchSalons]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchSalons();
      setLoading(false);
    })();
  }, [fetchSalons]);

  useEffect(() => {
    const salonIds = mySalons.map((s) => s.id);
    fetchIncomingReservations(salonIds);
    const interval = setInterval(() => fetchIncomingReservations(salonIds), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySalons.map((s) => s.id).join(","), fetchIncomingReservations]);

  const claimSalon = useCallback(
    async (salonId: string) => {
      const { error } = await supabase.from("mimo_salons").update({ owner_uid: merchantUid }).eq("id", salonId);
      if (!error) {
        setAllSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ownerUid: merchantUid } : s)));
      }
    },
    [merchantUid],
  );

  // Priority 4 핵심: 사장님은 ON/OFF만 누르면 된다.
  const toggleSalonStatus = useCallback(
    async (salonId: string, next: boolean) => {
      const { error } = await supabase.from("mimo_salons").update({ status: next }).eq("id", salonId);
      if (error) return;
      setAllSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, status: next } : s)));

      // 매장을 켜면(ON) 이 매장을 즐겨찾기한 유저들에게 알린다.
      if (next) {
        const salon = allSalons.find((s) => s.id === salonId);
        if (salon) {
          const { data: fans } = await supabase.from("mimo_users").select("uid, favorites").contains("favorites", [salonId]);
          if (fans) {
            await Promise.all(
              fans.map((fan: { uid: string }) => insertMimoNotification(fan.uid, "merchant_turned_on", salon.name)),
            );
          }
        }
      }
    },
    [allSalons],
  );

  // Priority 6 마무리: 사장님이 "예약 완료"를 누르면 매장이 다시 예약 가능 상태로 돌아간다.
  const completeReservation = useCallback(async (reservationId: string, salonId: string) => {
    const { error: resError } = await supabase
      .from("mimo_reservations")
      .update({ status: "completed" })
      .eq("reservation_id", reservationId);
    if (resError) return;

    setIncomingReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));

    const { error: statusError } = await supabase.from("mimo_salons").update({ status: true }).eq("id", salonId);
    if (!statusError) {
      setAllSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, status: true } : s)));
    }
  }, []);

  const value: MerchantDataContextValue = {
    merchantUid,
    mySalons,
    claimableSalons,
    incomingReservations,
    loading,
    refresh,
    claimSalon,
    toggleSalonStatus,
    completeReservation,
  };

  return <MerchantDataContext.Provider value={value}>{children}</MerchantDataContext.Provider>;
}

export function useMerchantData() {
  const ctx = useContext(MerchantDataContext);
  if (!ctx) throw new Error("useMerchantData must be used within MerchantDataProvider");
  return ctx;
}
