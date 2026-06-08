import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { useAppStore } from '../store/appStore';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import MeshBackground from '../components/ui/MeshBackground'

export default function AuthPage() {
  const [signup, setSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const nav = useNavigate();
  const user = useAppStore(s => s.user);
  const demo = useAppStore(s => s.initDemoMode);
  const showDemo = import.meta.env.VITE_ENABLE_DEMO === 'true';

  // If user is already logged in (e.g. OAuth deep link completed), go to home
  useEffect(() => { if (user) nav('/home', { replace: true }) }, [user, nav]);

  const goDemo = () => { demo(); nav('/home') };

  const submit = async e => {
    e.preventDefault();
    if (!supabase) return setMsg('Supabase is not connected. Add .env keys.');
    setLoading(true);
    setMsg('');
    setMsgType('error');
    try {
      if (resetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) return setMsg(error.message);
        setMsgType('success');
        setMsg('Password reset link sent! Check your email.');
        return;
      }
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { full_name: form.name } }
        });
        if (error) return setMsg(error.message);
        if (data.user) {
          nav('/home');
        } else {
          setMsg('Check your email to confirm your account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            setMsg('Invalid email or password. Try signing up if you don\'t have an account.');
          } else {
            setMsg(error.message);
          }
          return;
        }
        nav('/home');
      }
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    if (!supabase) return setMsg('Supabase is not connected.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
        skipBrowserRedirect: Capacitor.isNativePlatform(),
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) return setMsg(error.message);
    if (Capacitor.isNativePlatform() && data?.url) {
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  };

  return (
    <div className="safe-top relative mx-auto min-h-screen max-w-md px-5 py-6">
      <MeshBackground />
      <div className="page-enter">
        <img src="/heart-icon.svg" className="mx-auto h-20 w-20 rounded-3xl" />
        <h1 className="display gradient-text mt-3 text-center text-5xl font-bold">Amour</h1>
        <div className="glass-card mt-7 p-5">
          {!resetMode && (
            <div className="mb-5 grid grid-cols-2 rounded-full bg-white/5 p-1">
              {['Sign In', 'Sign Up'].map((x, i) => (
                <button key={x} onClick={() => { setSignup(Boolean(i)); setMsg(''); }}
                  className={`tap rounded-full py-2 text-sm font-semibold ${signup === Boolean(i) ? 'bg-gradient-to-r from-pink to-purple text-white' : 'text-muted'}`}>
                  {x}
                </button>
              ))}
            </div>
          )}
          {resetMode && (
            <div className="mb-5 text-center">
              <h2 className="text-lg font-bold text-white">Reset Password</h2>
              <p className="mt-1 text-xs text-muted">Enter your email to receive a reset link</p>
            </div>
          )}
          <form onSubmit={submit} className="space-y-3">
            {signup && !resetMode && <input className="field" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
            <input className="field" type="email" required placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {!resetMode && <input className="field" type="password" required minLength="6" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />}
            <button className="primary-btn w-full" disabled={loading}>
              {loading ? 'Please wait...' : resetMode ? 'Send Reset Link' : signup ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          {msg && <p className={`mt-3 text-center text-xs ${msgType === 'success' ? 'text-green-400' : 'text-pink-light'}`}>{msg}</p>}
          {!resetMode && !signup && (
            <button onClick={() => { setResetMode(true); setMsg(''); }} className="tap mt-2 w-full text-center text-xs text-muted hover:text-pink-light">
              Forgot your password?
            </button>
          )}
          {resetMode && (
            <button onClick={() => { setResetMode(false); setMsg(''); }} className="tap mt-2 w-full text-center text-xs text-muted hover:text-pink-light">
              ← Back to Sign In
            </button>
          )}
          {!resetMode && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <i className="h-px flex-1 bg-purple/30" />or<i className="h-px flex-1 bg-purple/30" />
              </div>
              <button onClick={google} className="secondary-btn w-full bg-white/5">
                <b className="text-base text-white">G</b> Continue with Google
              </button>
            </>
          )}
          {showDemo && !resetMode && (
            <button onClick={goDemo} className="tap mt-3 w-full rounded-full border border-dashed border-pink/50 py-3 text-sm text-pink-light">
              🎭 Try Demo Mode — no account needed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}