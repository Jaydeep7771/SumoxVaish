import { useEffect, useState } from 'react';
import Reveal from './Reveal.jsx';
import { supabase, isConfigured, friendlyError } from '../supabase.js';

export default function Playlist() {
  const [songs, setSongs] = useState([]);
  const [form, setForm] = useState({ title: '', by: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConfigured) return;

    let live = true;

    supabase
      .from('songs')
      .select('id, title, by_name')
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
      .insert({ title, by_name: form.by.trim() || 'A guest' })
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

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="wall-wrap">
      <ul className="songs">
        {songs.map((s) => (
          <li className="song" key={s.id}>
            <span className="note-ico">♪</span>
            <span className="s-title">{s.title}</span>
            <span className="s-by">{s.by_name}</span>
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
