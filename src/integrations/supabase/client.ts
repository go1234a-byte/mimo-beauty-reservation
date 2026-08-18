// MIMO — 독립 프로젝트용 Supabase 클라이언트.
// 자체 supabase.com 프로젝트(mimo-beauty-reservation-v2, htqdooiejervjtebehgo)를 사용한다.
// mimo_users / mimo_salons / mimo_reservations / mimo_notifications / mimo_reviews / mimo_reports 테이블 사용.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://htqdooiejervjtebehgo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0cWRvb2llamVydmp0ZWJlaGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MzcyNDMsImV4cCI6MjEwMjUxMzI0M30.SffVheT4YplkdJYSdpmT6rFLBRwT-4YlBMK1t1QgG1o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
