import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logoMark}>S</div>
        <h1 style={s.title}>SoleBiz</h1>
        <p style={s.subtitle}>Sign in to your account</p>

        <button style={s.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div style={s.divider}><div style={s.line}/><span style={s.or}>or</span><div style={s.line}/></div>

        <form onSubmit={handleLogin}>
          {error && <div style={s.error}>{error}</div>}
          <div style={s.inputGroup}>
            <input style={s.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <div style={s.inputDivider}/>
            <input style={s.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button style={{ ...s.primaryBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.footer}>Don't have an account?{' '}
          <span style={s.link} onClick={onSwitch}>Create one</span>
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bg: { minHeight: '100vh', background: '#F2F2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 2px 20px rgba(0,0,0,0.08)', textAlign: 'center' },
  logoMark: { width: 56, height: 56, borderRadius: 16, background: '#007AFF', color: '#fff', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  title: { fontSize: 26, fontWeight: 700, color: '#1C1C1E', letterSpacing: '-0.5px', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 28 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', border: '1px solid #E5E5EA', borderRadius: 12, background: '#fff', fontSize: 15, fontWeight: 500, color: '#1C1C1E', cursor: 'pointer', marginBottom: 20 },
  divider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1, background: '#E5E5EA' },
  or: { color: '#C7C7CC', fontSize: 13 },
  error: { background: '#FFF2F2', color: '#FF3B30', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 14, textAlign: 'left' },
  inputGroup: { border: '1px solid #E5E5EA', borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  input: { width: '100%', padding: '14px 16px', border: 'none', fontSize: 15, color: '#1C1C1E', background: '#fff', display: 'block' },
  inputDivider: { height: 1, background: '#E5E5EA' },
  primaryBtn: { width: '100%', padding: '14px', background: '#007AFF', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 20 },
  footer: { fontSize: 14, color: '#8E8E93' },
  link: { color: '#007AFF', cursor: 'pointer', fontWeight: 500 },
};
