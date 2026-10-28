-- Guests can now remove what they posted.
--
-- There is deliberately still no DELETE policy: an open one would let any
-- visitor wipe the whole wall. Instead each entry records the SHA-256 of a
-- random token the browser keeps, and removal goes through these functions,
-- which run as owner and check the hash. Only the hash is stored, so the
-- value is useless to anyone who reads it (realtime broadcasts the row), and
-- the token itself is 122 bits of randomness, so it cannot be guessed.

alter table public.wishes add column owner_hash text;
alter table public.songs  add column owner_hash text;

create or replace function public.delete_wish(p_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed int;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;

  delete from public.wishes
   where id = p_id
     and owner_hash = encode(sha256(p_token::bytea), 'hex');

  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

create or replace function public.delete_song(p_id uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  removed int;
begin
  if p_token is null or length(p_token) < 16 then
    return false;
  end if;

  delete from public.songs
   where id = p_id
     and owner_hash = encode(sha256(p_token::bytea), 'hex');

  get diagnostics removed = row_count;
  return removed > 0;
end;
$$;

-- These are the only route to a delete, so they must be callable by guests.
grant execute on function public.delete_wish(uuid, text) to anon, authenticated;
grant execute on function public.delete_song(uuid, text) to anon, authenticated;

-- Realtime must announce removals too, or other open walls keep showing a
-- deleted card until reload. REPLICA IDENTITY FULL puts the old row in the
-- DELETE payload so subscribers know which id went.
alter table public.wishes replica identity full;
alter table public.songs  replica identity full;
