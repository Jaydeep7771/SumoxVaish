import { useEffect, useState } from 'react';
import Reveal from './Reveal.jsx';
import { supabase, isConfigured, friendlyError } from '../supabase.js';
import { getToken, getOwnerHash } from '../owner.js';

export default function Playlist() {
  const [songs, setSongs] = useState([]);
  const [form, setForm] = useState({ title: '', by: '' });
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
    if (!isConfigured) return;

    let live = true;

    supabase
      .from('songs')
      .select('id, title, by_name, owner_hash')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error: err }) => {
        if (live && !err) setSongs(data || []);
      });

    const channel = supabase
      .channel('songs-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'songs' },
        (payload) => {
          if (!live) return;
          setSongs((prev) =>
            prev.some((s) => s.id === payload.new.id) ? prev : [payload.new, ...prev]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'songs' },
        (payload) => {
          if (!live) return;
          setSongs((prev) => prev.filter((s) => s.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      live = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function submit() {
    const title = form.title.trim();
    if (!title || sending || !isConfigured) return;

    setSending(true);
    setError('');

    const { data, error: err } = await supabase
      .from('songs')
      .insert({ title, by_name: form.by.trim() || 'A guest', owner_hash: myHash })
      .select()
      .single();

    if (err) {
      setError(friendlyError(err, 'Could not add that song. Please try again.'));
    } else {
      setSongs((prev) => (prev.some((s) => s.id === data.id) ? prev : [data, ...prev]));
      setForm({ title: '', by: '' });
    }

    setSending(false);
  }

  async function remove(id) {
    const token = getToken();
    if (!token) return;

    const before = songs;
    setSongs((prev) => prev.filter((s) => s.id !== id)); // optimistic

    const { data, error: err } = await supabase.rpc('delete_song', {
      p_id: id,
      p_token: token,
    });

    if (err || data === false) {
      setSongs(before);
      setError('Could not remove that song.');
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isMine = (s) => Boolean(myHash) && s.owner_hash === myHash;

  return (
    <div className="wall-wrap">
      <ul className="songs">
        {songs.map((s) => (
          <li className="song" key={s.id}>
            <span className="note-ico">♪</span>
            <span className="s-title">{s.title}</span>
            <span className="s-by">{s.by_name}</span>
            {isMine(s) ? (
              <button
                type="button"
                className="remove remove--inline"
                onClick={() => remove(s.id)}
                aria-label={`Remove your song: ${s.title}`}
                title="Remove your song"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <Reveal className="song-add">
        <input
          type="text"
          maxLength={80}
          placeholder="Song &amp; artist"
          aria-label="Song and artist"
          value={form.title}
          onChange={set('title')}
        />
        <input
          type="text"
          maxLength={40}
          placeholder="Your name"
          aria-label="Your name"
          value={form.by}
          onChange={set('by')}
        />
        <button
          className="btn"
          type="button"
          onClick={submit}
          disabled={sending || !form.title.trim()}
        >
          {sending ? 'Adding…' : 'Add song'}
        </button>
      </Reveal>
      {error ? <p className="note">{error}</p> : null}
    </div>
  );
}
