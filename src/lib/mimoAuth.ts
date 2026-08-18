import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<{ ok: boolean; needsEmailConfirm?: boolean; error?: string }> {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, needsEmailConfirm: true };
  return { ok: true };
}

export async function signInWithEmail(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutMimo() {
  return supabase.auth.signOut();
}

/** 첫 로그인 시 mimo_users 프로필 행이 없으면 만들어준다. 소비자/사장님 화면 양쪽에서 공용으로 쓴다. */
export async function ensureMimoProfile(session: Session): Promise<void> {
  const userId = session.user.id;
  const { data: existing } = await supabase.from("mimo_users").select("uid").eq("uid", userId).maybeSingle();
  if (existing) return;
  const name =
    (session.user.user_metadata?.name as string | undefined)?.trim() ||
    session.user.email?.split("@")[0] ||
    "사용자";
  await supabase.from("mimo_users").insert({ uid: userId, name, favorites: [] });
}
