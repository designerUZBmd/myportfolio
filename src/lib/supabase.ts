import { createBrowserClient } from "@supabase/ssr";

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bwuelpuepfmptrekvejc.supabase.co";
const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseAnonKey =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
