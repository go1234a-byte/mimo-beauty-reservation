import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateMimoUid, isMimoLoggedIn, setMimoLoggedIn } from "@/lib/mimoSession";
import type {
  MimoAuthProvider,
  MimoReservation,
  MimoReservationStatus,
  MimoSalon,
  MimoService,
  MimoUser,
} from "@/types/mimo";

interface MimoSalonRow {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: boolean;
  categories: string[] | null;
  photos: string[] | null;
  services: unknown;
  rating: number;
}

interface MimoUserRow {
  uid: string;
  name: string;
  phone: string | null;
  favorites: string[] | null;
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
    lat: Number(row.lat),
    lng: Number(row.lng),
    status: row.status,
    categories: row.categories ?? [],
    photos: row.photos ?? [],
    services: (row.services as MimoService[] | null) ?? [],
    rating: Number(row.rating),
  };
}

function mapUserRow(row: MimoUserRow): MimoUser {
  return {
    uid: row.uid,
    name: row.name,
    phone: row.phone,
    favorites: row.favorites ?? [],
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

const PROVIDER_LABEL: Record<MimoAuthProvider, string> = {
  apple: "Apple 사용자",
  google: "Google 사용자",
  kakao: "카카오 사용자",
};

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
  loginWithProvider: (provider: MimoAuthProvider) => Promise<void>;
  logout: () => void;
  toggleFavorite: (salonId: string) => Promise<void>;
  isFavorite: (salonId: string) => boolean;
  isSlotTaken: (salonId: string, startTime: string) => boolean;
  createPendingReservation: (input: CreateReservationInput) => Promise<MimoReservation | null>;
  confirmReservation: (reservationId: string, paymentMethod: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  getSalonById: (salonId: string) => MimoSalon | undefined;
  refreshReservations: () => Promise<void>;
}

const MimoDataContext = createContext<MimoDataContextValue | undefined>(undefined);

export function MimoDataProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<MimoSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<MimoUser | null>(null);
  const [reservations, setReservations] = useState<MimoReservation[]>([]);
  const [allReservations, setAllReservations] = useState<MimoReservation[]>([]);

  const uid = useMemo(() => getOrCreateMimoUid(), []);

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchSalons(), fetchAllReservations()]);
      if (isMimoLoggedIn()) {
        const found = await fetchUser(uid);
        if (found) {
          await fetchUserReservations(uid);
        } else {
          setMimoLoggedIn(false);
        }
      }
      setLoading(false);
    })();
  }, [fetchSalons, fetchAllReservations, fetchUser, fetchUserReservations, uid]);

  const activeSalons = useMemo(() => salons.filter((s) => s.status), [salons]);

  const hasActiveReservation = useMemo(
    () => reservations.some((r) => r.status === "pending" || r.status === "confirmed"),
    [reservations],
  );

  const loginWithProvider = useCallback(
    async (provider: MimoAuthProvider) => {
      const name = PROVIDER_LABEL[provider];
      const { data, error } = await supabase
        .from("mimo_users")
        .upsert({ uid, name, favorites: [] }, { onConflict: "uid", ignoreDuplicates: true })
        .select()
        .maybeSingle();
      if (!error) {
        setMimoLoggedIn(true);
        if (data) {
          setCurrentUser(mapUserRow(data as MimoUserRow));
        } else {
          await fetchUser(uid);
        }
        await fetchUserReservations(uid);
      }
    },
    [uid, fetchUser, fetchUserReservations],
  );

  const logout = useCallback(() => {
    setMimoLoggedIn(false);
    setCurrentUser(null);
    setReservations([]);
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

  const confirmReservation = useCallback(async (reservationId: string, paymentMethod: string) => {
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
    }
  }, []);

  const cancelReservation = useCallback(async (reservationId: string) => {
    const { error } = await supabase
      .from("mimo_reservations")
      .update({ status: "cancelled" })
      .eq("reservation_id", reservationId);
    if (!error) {
      setReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
      setAllReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
    }
  }, []);

  const getSalonById = useCallback((salonId: string) => salons.find((s) => s.id === salonId), [salons]);

  const refreshReservations = useCallback(async () => {
    if (currentUser) {
      await fetchUserReservations(currentUser.uid);
    }
  }, [currentUser, fetchUserReservations]);

  const value: MimoDataContextValue = {
    salons,
    activeSalons,
    loading,
    currentUser,
    reservations,
    hasActiveReservation,
    loginWithProvider,
    logout,
    toggleFavorite,
    isFavorite,
    isSlotTaken,
    createPendingReservation,
    confirmReservation,
    cancelReservation,
    getSalonById,
    refreshReservations,
  };

  return <MimoDataContext.Provider value={value}>{children}</MimoDataContext.Provider>;
}

export function useMimoData() {
  const ctx = useContext(MimoDataContext);
  if (!ctx) throw new Error("useMimoData must be used within MimoDataProvider");
  return ctx;
}
