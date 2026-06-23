import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "../types/database";

let supabaseAdmin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> | null {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseAdmin = createClient<Database>(url, key, {
        realtime: {
          transport: ws as any,
        },
      });
    }
  }
  return supabaseAdmin;
}
