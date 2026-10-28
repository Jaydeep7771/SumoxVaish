import { useEffect, useState } from 'react';
import Reveal from './Reveal.jsx';
import { supabase, isConfigured, friendlyError } from '../supabase.js';
import { getToken, getOwnerHash } from '../owner.js';

export default function WishingWall() {
  const [wishes, setWishes] = useState([]);
  const [status, setStatus] = useState('Connecting to the wall…');
  const [form, setForm] = useState({ name: '', message: '', event: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [myHash, setMyHash] = useState(null);

  useEffect(() => {
    let live = true;
    getOwnerHash().then((h) => {
      if (live) setMyHash(h);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setStatus('The wall is offline');
      return;
    }

    let live = true;

    supabase
      .from('wishes')
      .select('id, name, message, event, owner_hash')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (!live) return;
        if (err) {
          setStatus('The wall is offline');
          return;
        }
        setWishes(data || []);
        setStatus('The wall is live');
      });

    /* A wish pinned on one guest's phone shows up on everyone else's wall
       without a reload -- the point of a shared wall during the events. */
    const channel = supabase
      .channel('wishes-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wishes' },
        (payload) => {
          if (!live) return;
          setWishes((prev) =>
            prev.some((w) => w.id === payload.new.id) ? prev : [payload.new, ...prev]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'wishes' },
        (payload) => {
          if (!live) return;
          setWishes((prev) => prev.filter((w) => w.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      live = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function submit() {
    const message = form.message.trim();
    if (!message || sending || !isConfigured) return;

    setSending(true);
    setError('');

    const row = {
      message,
      name: form.name.trim() || 'A well-wisher',
      event: form.event.trim(),
      owner_hash: myHash,
    };

    const { data, error: err } = await supabase.from('wishes').insert(row).select().single();

    if (err) {
      setError(friendlyError(err, 'Could not pin that wish. Please try again.'));
    } else {
      /* Realtime may have added it already; guard against a double. */
      setWishes((prev) => (prev.some((w) => w.id === data.id) ? prev : [data, ...prev]));
      setForm({ name: '', message: '', event: '' });
    }

    setSending(false);
  }

  async function remove(id) {
    const token = getToken();
    if (!token) return;

    const before = wishes;
    setWishes((prev) => prev.filter((w) => w.id !== id)); // optimistic

    const { data, error: err } = await supabase.rpc('delete_wish', {
      p_id: id,
      p_token: token,
    });

    /* The function returns false when the token does not match the row. */
    if (err || data === false) {
      setWishes(before);
      setError('Could not remove that wish.');
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isMine = (w) => Boolean(myHash) && w.owner_hash === myHash;

  return (
    <div className="wall-wrap">
      <Reveal className="wall-status">
        <span className="live-dot" />
        <span>{status}</span>
      </Reveal>

      <Reveal className="composer">
        <h3>Leave a wish</h3>
        <div className="field">
          <label htmlFor="w-name">Your name</label>
          <input
            type="text"
            id="w-name"
            maxLength={60}
            placeholder="Who is wishing?"
            value={form.name}
            onChange={set('name')}
          />
        </div>
        <div className="field">
          <label htmlFor="w-msg">Your wish</label>
          <textarea
            id="w-msg"
            maxLength={500}
            placeholder="A blessing, a memory, some advice…"
            value={form.message}
            onChange={set('message')}
          />
        </div>
        <div className="field">
          <label htmlFor="w-ev">Which celebration are you most excited for? (optional)</label>
          <input
            type="text"
            id="w-ev"
            maxLength={40}
            placeholder="e.g. Haldi"
            value={form.event}
            onChange={set('event')}
          />
        </div>
        <div className="btn-row">
          <button
            className="btn"
            type="button"
            onClick={submit}
            disabled={sending || !form.message.trim()}
          >
            {sending ? 'Pinning…' : 'Pin it to the wall'}
          </button>
        </div>
        {error ? <p className="note">{error}</p> : null}
      </Reveal>

      {wishes.length ? (
        <Reveal className="wall" aria-live="polite">
          {wishes.map((w) => (
            <figure className="wish" key={w.id}>
              {isMine(w) ? (
                <button
                  type="button"
                  className="remove"
                  onClick={() => remove(w.id)}
                  aria-label={`Remove your wish: ${w.message.slice(0, 40)}`}
                  title="Remove your wish"
                >
                  ×
                </button>
              ) : null}
              <div className="wish-msg">{w.message}</div>
              <figcaption className="wish-foot">
                <span className="wish-name">{w.name}</span>
                {w.event ? <span className="wish-ev">{w.event}</span> : null}
              </figcaption>
            </figure>
          ))}
        </Reveal>
      ) : (
        <Reveal className="wall-empty">
          No wishes yet — be the first to pin one to the wall.
        </Reveal>
      )}
    </div>
  );
}
