// MIMO — 독립 프로젝트용 Supabase 클라이언트.
// All Blue와 동일한 Enter Cloud Managed Supabase 백엔드를 공유하며,
// mimo_users / mimo_salons / mimo_reservations 테이블만 사용한다.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://spb-t4ni8g9fz54lu3cz.supabase.opentrust.net";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi10NG5pOGc5Zno1NGx1M2N6IiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3ODM1MzM0NzcsImV4cCI6MjA5OTEwOTQ3N30.Serf2fm49vub2aMu6Zk1syPvQ3bFDpuzdbsfCMKhw1A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
