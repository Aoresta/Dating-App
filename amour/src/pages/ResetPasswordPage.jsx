import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import MeshBackground from '../components/ui/MeshBackground'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // Also check if already in recovery (hash token auto-processed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMsgType('error');
        setMsg(error.message);
      } else {
        setMsgType('success');
        setMsg('Password updated! Redirecting...');
        setTimeout(() => nav('/home'), 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="safe-top relative mx-auto min-h-screen max-w-md px-5 py-6">
        <MeshBackground />
        <div className="grid min-h-screen place-items-center">
          <div className="text-center text-white">
            <div className="skeleton mx-auto h-12 w-12 rounded-full" />
            <p className="mt-3 text-muted">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-top relative mx-auto min-h-screen max-w-md px-5 py-6">
      <MeshBackground />
      <div className="page-enter">
        <img src="/heart-icon.svg" className="mx-auto h-20 w-20 rounded-3xl" />
        <h1 className="display gradient-text mt-3 text-center text-5xl font-bold">Amour</h1>
        <div className="glass-card mt-7 p-5">
          <div className="mb-5 text-center">
            <h2 className="text-lg font-bold text-white">Set New Password</h2>
            <p className="mt-1 text-xs text-muted">Choose a strong password for your account</p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input className="field" type="password" required minLength="6" placeholder="New password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="primary-btn w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          {msg && <p className={`mt-3 text-center text-xs ${msgType === 'success' ? 'text-green-400' : 'text-pink-light'}`}>{msg}</p>}
        </div>
      </div>
    </div>
  );
}
