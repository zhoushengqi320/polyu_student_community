import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Relaxed Supabase client alias. The project uses a hand-maintained
 * `types/database.ts` without generated Relationships, so the fully inferred
 * client surface is intentionally kept loose at the boundary.
 */
export type AppSupabaseClient = SupabaseClient;
