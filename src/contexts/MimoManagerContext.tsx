import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  mapReservationRow,
  mapSalonRow,
  type MimoReservationRow,
  type MimoSalonRow,
} from "@/contexts/MimoDataContext";
import type { MimoReservation, MimoReservationStatus, MimoSalon, MimoService } from "@/types/mimo";

/**
 * MIMO 매장 관리자(사장님) 전용 데이터/인증 컨텍스트.
 * 소비자(MimoDataContext, 기기별 임시 uid 로그인)와는 완전히 분리된 실제 Supabase Auth
 * 이메일/비밀번호 계정을 사용한다 — 사업자 계정이므로 기기가 바뀌어도 로그인이 유지되어야 하기 때문.
 */

export interface MimoManagerProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
}

interface SalonInput {
  name: string;
  address: string;
  lat: number;
  lng: number;
  categories: string[];
  photos: string[];
  services: MimoService[];
}

interface MimoManagerContextValue {
  authLoading: boolean;
  isManagerLoggedIn: boolean;
  manager: MimoManagerProfile | null;
  mySalon: MimoSalon | null;
  salonLoading: boolean;
  reservations: MimoReservation[];
  signup: (input: { email: string; password: string; name: string; phone: string }) => Promise<string | null>;
  login: (input: { email: string; password: string }) => Promise<string | null>;
  logout: () => Promise<void>;
  createSalon: (input: SalonInput) => Promise<string | null>;
  updateSalon: (patch: Partial<SalonInput> & { status?: boolean }) => Promise<string | null>;
  setReservationStatus: (reservationId: string, status: MimoReservationStatus) => Promise<void>;
  refreshMySalon: () => Promise<void>;
}

const MimoManagerContext = createContext<MimoManagerContextValue | undefined>(undefined);

export function MimoManagerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mySalon, setMySalon] = useState<MimoSalon | null>(null);
  const [salonLoading, setSalonLoading] = useState(false);
  const [reservations, setReservations] = useState<MimoReservation[]>([]);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setAuthUser(nextSession?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const manager = useMemo<MimoManagerProfile | null>(() => {
    if (!authUser) return null;
    const meta = (authUser.user_metadata ?? {}) as { name?: string; phone?: string; role?: string };
    if (meta.role !== "manager") return null;
    return {
      id: authUser.id,
      email: authUser.email ?? "",
      name: meta.name ?? "",
      phone: meta.phone ?? "",
    };
  }, [authUser]);

  const fetchMySalon = useCallback(async (managerId: string) => {
    setSalonLoading(true);
    const { data, error } = await supabase
      .from("mimo_salons")
      .select("*")
      .eq("manager_id", managerId)
      .maybeSingle();
    if (!error) {
      setMySalon(data ? mapSalonRow(data as MimoSalonRow) : null);
    }
    setSalonLoading(false);
  }, []);

  const fetchSalonReservations = useCallback(async (salonId: string) => {
    const { data, error } = await supabase
      .from("mimo_reservations")
      .select("*")
      .eq("salon_id", salonId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setReservations(data.map((row) => mapReservationRow(row as MimoReservationRow)));
    }
  }, []);

  useEffect(() => {
    if (!manager) {
      setMySalon(null);
      setReservations([]);
      return;
    }
    fetchMySalon(manager.id);
  }, [manager, fetchMySalon]);

  useEffect(() => {
    if (!mySalon) {
      setReservations([]);
      return;
    }
    fetchSalonReservations(mySalon.id);
  }, [mySalon, fetchSalonReservations]);

  const signup = useCallback(
    async ({ email, password, name, phone }: { email: string; password: string; name: string; phone: string }) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone, role: "manager" } },
      });
      if (error) return error.message;
      return null;
    },
    [],
  );

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setMySalon(null);
    setReservations([]);
  }, []);

  const createSalon = useCallback(
    async (input: SalonInput) => {
      if (!manager) return "로그인이 필요합니다.";
      const { data, error } = await supabase
        .from("mimo_salons")
        .insert({
          name: input.name,
          address: input.address,
          lat: input.lat,
          lng: input.lng,
          status: true,
          categories: input.categories,
          photos: input.photos,
          services: input.services,
          rating: 0,
          manager_id: manager.id,
        })
        .select()
        .maybeSingle();
      if (error) return error.message;
      if (data) setMySalon(mapSalonRow(data as MimoSalonRow));
      return null;
    },
    [manager],
  );

  const updateSalon = useCallback(
    async (patch: Partial<SalonInput> & { status?: boolean }) => {
      if (!manager || !mySalon) return "매장 정보를 찾을 수 없습니다.";
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.address !== undefined) dbPatch.address = patch.address;
      if (patch.lat !== undefined) dbPatch.lat = patch.lat;
      if (patch.lng !== undefined) dbPatch.lng = patch.lng;
      if (patch.categories !== undefined) dbPatch.categories = patch.categories;
      if (patch.photos !== undefined) dbPatch.photos = patch.photos;
      if (patch.services !== undefined) dbPatch.services = patch.services;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      const { data, error } = await supabase
        .from("mimo_salons")
        .update(dbPatch)
        .eq("id", mySalon.id)
        .select()
        .maybeSingle();
      if (error) return error.message;
      if (data) setMySalon(mapSalonRow(data as MimoSalonRow));
      return null;
    },
    [manager, mySalon],
  );

  const setReservationStatus = useCallback(
    async (reservationId: string, status: MimoReservationStatus) => {
      const { data, error } = await supabase
        .from("mimo_reservations")
        .update({ status })
        .eq("reservation_id", reservationId)
        .select()
        .maybeSingle();
      if (!error && data) {
        const updated = mapReservationRow(data as MimoReservationRow);
        setReservations((prev) => prev.map((r) => (r.reservationId === reservationId ? updated : r)));
      }
    },
    [],
  );

  const refreshMySalon = useCallback(async () => {
    if (manager) await fetchMySalon(manager.id);
  }, [manager, fetchMySalon]);

  const value: MimoManagerContextValue = {
    authLoading,
    isManagerLoggedIn: !!manager,
    manager,
    mySalon,
    salonLoading,
    reservations,
    signup,
    login,
    logout,
    createSalon,
    updateSalon,
    setReservationStatus,
    refreshMySalon,
  };

  return <MimoManagerContext.Provider value={value}>{children}</MimoManagerContext.Provider>;
}

export function useMimoManager() {
  const ctx = useContext(MimoManagerContext);
  if (!ctx) throw new Error("useMimoManager must be used within MimoManagerProvider");
  return ctx;
}
