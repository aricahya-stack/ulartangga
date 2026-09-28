import { createClient, type SupabaseClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
export const db: SupabaseClient | null = url && key ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;
export type Profile = { id: string; full_name: string; role: 'student'|'teacher'|'admin'; username: string|null };
export const clean = (s: unknown) => String(s ?? '').replace(/[&<>"']/g,c=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
export function need<T>(data: T | null, error: {message:string}|null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Data tidak ditemukan');
  return data;
}
