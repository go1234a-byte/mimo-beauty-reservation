import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { signUpWithEmail, signInWithEmail, signOutMimo, ensureMimoProfile } from "@/lib/mimoAuth";
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
  business_reg_url?: string | null;
  bankbook_url?: string | null;
  id_card_url?: string | null;
  tax_invoice_agreed?: boolean | null;
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
    businessRegUrl: row.business_reg_url ?? null,
    bankbookUrl: row.bankbook_url ?? null,
    idCardUrl: row.id_card_url ?? null,
    taxInvoiceAgreed: row.tax_invoice_agreed ?? false,
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

interface NewSalonInput {
  name: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  categories: string[];
  services: MimoService[];
  businessRegUrl: string;
  bankbookUrl: string;
  idCardUrl: string;
}

interface MerchantDataContextValue {
  merchantUid: string | null;
  mySalons: MimoSalon[];
  claimableSalons: MimoSalon[];
  incomingReservations: MimoReservation[];
  loading: boolean;
  refresh: () => Promise<void>;
  signUpEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ ok: boolean; needsEmailConfirm?: boolean; error?: string }>;
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  submitMerchantApplication: (
    salonId: string,
    docs: { businessRegUrl: string; bankbookUrl: string; idCardUrl: string },
  ) => Promise<boolean>;
  registerNewSalon: (input: NewSalonInput) => Promise<string | null>;
  toggleSalonStatus: (salonId: string, next: boolean) => Promise<void>;
  completeReservation: (reservationId: string, salonId: string) => Promise<void>;
  updateSalonInfo: (salonId: string, patch: Partial<MimoSalon>) => Promise<boolean>;
}

const MerchantDataContext = createContext<MerchantDataContextValue | undefined>(undefined);

export function MerchantDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const merchantUid = session?.user?.id ?? null;
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
    setLoading(true);
    fetchSalons().finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) ensureMimoProfile(newSession);
    });

    return () => subscription.unsubscribe();
  }, [fetchSalons]);

  const logout = useCallback(async () => {
    await signOutMimo();
  }, []);

  useEffect(() => {
    const salonIds = mySalons.map((s) => s.id);
    fetchIncomingReservations(salonIds);
    const interval = setInterval(() => fetchIncomingReservations(salonIds), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mySalons.map((s) => s.id).join(","), fetchIncomingReservations]);

  // 사업자등록증/통장사본/신분증 + 세금계산서 발행 동의를 전부 제출해야 매장을 가져갈 수 있다.
  // 제출 즉시 승인되는 게 아니라 approval_status를 pending으로 돌려 관리자 심사를 거치게 한다.
  const submitMerchantApplication = useCallback(
    async (salonId: string, docs: { businessRegUrl: string; bankbookUrl: string; idCardUrl: string }) => {
      if (!merchantUid) return false;
      const { error } = await supabase
        .from("mimo_salons")
        .update({
          owner_uid: merchantUid,
          business_reg_url: docs.businessRegUrl,
          bankbook_url: docs.bankbookUrl,
          id_card_url: docs.idCardUrl,
          tax_invoice_agreed: true,
          approval_status: "pending",
        })
        .eq("id", salonId);
      if (error) return false;
      setAllSalons((prev) =>
        prev.map((s) =>
          s.id === salonId
            ? {
                ...s,
                ownerUid: merchantUid,
                businessRegUrl: docs.businessRegUrl,
                bankbookUrl: docs.bankbookUrl,
                idCardUrl: docs.idCardUrl,
                taxInvoiceAgreed: true,
                approvalStatus: "pending",
              }
            : s,
        ),
      );
      return true;
    },
    [merchantUid],
  );

  // 기존 seed 매장을 가져가는 게 아니라 사장님이 완전히 새 매장을 등록하는 경로.
  // 서류/세금계산서 요건은 클레임과 동일하고, 마찬가지로 pending으로 시작해 관리자 승인을 거친다.
  const registerNewSalon = useCallback(
    async (input: NewSalonInput): Promise<string | null> => {
      if (!merchantUid) return null;
      const id = crypto.randomUUID();
      const { error } = await supabase.from("mimo_salons").insert({
        id,
        name: input.name,
        address: input.address,
        phone: input.phone,
        lat: input.lat,
        lng: input.lng,
        status: true,
        categories: input.categories,
        photos: [],
        services: input.services,
        rating: 0,
        owner_uid: merchantUid,
        business_reg_url: input.businessRegUrl,
        bankbook_url: input.bankbookUrl,
        id_card_url: input.idCardUrl,
        tax_invoice_agreed: true,
        approval_status: "pending",
      });
      if (error) return null;
      await fetchSalons();
      return id;
    },
    [merchantUid, fetchSalons],
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

  const updateSalonInfo = useCallback(async (salonId: string, patch: Partial<MimoSalon>) => {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.address !== undefined) row.address = patch.address;
    if (patch.phone !== undefined) row.phone = patch.phone;
    if (patch.categories !== undefined) row.categories = patch.categories;
    if (patch.photos !== undefined) row.photos = patch.photos;
    if (patch.services !== undefined) row.services = patch.services;

    const { error } = await supabase.from("mimo_salons").update(row).eq("id", salonId);
    if (error) return false;
    setAllSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, ...patch } : s)));
    return true;
  }, []);

  const value: MerchantDataContextValue = {
    merchantUid,
    mySalons,
    claimableSalons,
    incomingReservations,
    loading,
    refresh,
    signUpEmail: signUpWithEmail,
    signInEmail: signInWithEmail,
    logout,
    submitMerchantApplication,
    registerNewSalon,
    toggleSalonStatus,
    completeReservation,
    updateSalonInfo,
  };

  return <MerchantDataContext.Provider value={value}>{children}</MerchantDataContext.Provider>;
}

export function useMerchantData() {
  const ctx = useContext(MerchantDataContext);
  if (!ctx) throw new Error("useMerchantData must be used within MerchantDataProvider");
  return ctx;
}
