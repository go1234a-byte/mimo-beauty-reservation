import { supabase } from "@/integrations/supabase/client";
import type { MimoSupportInquiry } from "@/types/mimo";

interface MimoSupportInquiryRow {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

export function mapInquiryRow(row: MimoSupportInquiryRow): MimoSupportInquiry {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    message: row.message,
    status: row.status as MimoSupportInquiry["status"],
    adminReply: row.admin_reply,
    createdAt: row.created_at,
  };
}

export async function submitInquiry(userId: string, subject: string, message: string): Promise<boolean> {
  const { error } = await supabase.from("mimo_support_inquiries").insert({ user_id: userId, subject, message });
  return !error;
}

export async function fetchMyInquiries(userId: string): Promise<MimoSupportInquiry[]> {
  const { data, error } = await supabase
    .from("mimo_support_inquiries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapInquiryRow(row as MimoSupportInquiryRow));
}
