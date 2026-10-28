/* Lets a guest remove what they posted, without making them sign in.
 *
 * The browser keeps a random token. Only its SHA-256 goes to the database, so
 * the hash the server stores (and realtime broadcasts) cannot be turned back
 * into permission to delete. See the delete_wish / delete_song functions. */

const KEY = 'sumoxvaish:owner-token';

function makeToken() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getToken() {
  try {
    let t = localStorage.getItem(KEY);
    if (!t) {
      t = makeToken();
      localStorage.setItem(KEY, t);
    }
    return t;
  } catch {
    /* Private mode: the guest can still post, just not delete afterwards. */
    return null;
  }
}

/* crypto.subtle needs a secure context -- https or localhost. If it is
   missing we return null and the caller simply omits the cross button. */
export async function getOwnerHash() {
  const token = getToken();
  if (!token || !globalThis.crypto?.subtle) return null;
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}
