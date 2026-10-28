import { createClient } from '@supabase/supabase-js';

/* The browser talks to Supabase directly. This key is publishable by design --
   it is safe in client code because row level security, not secrecy, is what
   guards the tables: guests may read and insert, nothing else. See the
   migrations in the Supabase dashboard for the policies. */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: { persistSession: false },
    })
  : null;

/* Guests are not signed in, so a failure here is almost always a network drop
   or a policy change -- worth showing plainly rather than swallowing. */
export function friendlyError(error, fallback) {
  if (!error) return fallback;
  if (error.message && /row-level security/i.test(error.message)) {
    return 'That is not allowed right now.';
  }
  return fallback;
}
