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
      <div style={s.left}>
        <div style={s.brand}>
          <div style={s.brandMark}>S</div>
          <span style={s.brandName}>SoleBiz</span>
        </div>
        <div style={s.hero}>
          <h1 style={s.heroTitle}>Run your business<br/>from one place.</h1>
          <p style={s.heroSub}>Quotes, invoices, jobs and finance — built for sole traders.</p>
        </div>
        <div style={s.dots}>
          {['Quotes & Invoices', 'Job Pipeline', 'Finance Tracking', 'AI Assistant'].map(f => (
            <div key={f} style={s.dot}><span style={s.dotCheck}>✓</span>{f}</div>
          ))}
        </div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <h2 style={s.title}>Welcome back</h2>
          <p style={s.subtitle}>Sign in to your account</p>

          <button style={s.googleBtn} onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div style={s.divider}><div style={s.line}/><span style={s.or}>or</span><div style={s.line}/></div>

          <form onSubmit={handleLogin}>
            {error && <div style={s.error}>{error}</div>}
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <button style={{ ...s.primaryBtn, opacity: loading ? 0.75 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p style={s.footer}>No account? <span style={s.link} onClick={onSwitch}>Sign up free</span></p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bg: { minHeight: '100vh', display: 'flex', background: '#F8FAFC' },
  left: { flex: 1, background: 'linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)', padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  brand: { display: 'flex', alignItems: 'center', gap: 10 },
  brandMark: { width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  heroTitle: { fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-1.5px', marginBottom: 16 },
  heroSub: { fontSize: 17, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, maxWidth: 360 },
  dots: { display: 'flex', flexDirection: 'column', gap: 12 },
  dot: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  dotCheck: { width: 22, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', flexShrink: 0 },
  right: { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 },
  card: { width: '100%', maxWidth: 380 },
  title: { fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 28 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', border: '1.5px solid #E2E8F0', borderRadius: 12, background: '#fff', fontSize: 14, fontWeight: 600, color: '#0F172A', cursor: 'pointer', marginBottom: 20, transition: 'border-color 0.15s' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1, background: '#E2E8F0' },
  or: { color: '#94A3B8', fontSize: 13, fontWeight: 500 },
  error: { background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, fontWeight: 500 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', background: '#fff', marginBottom: 14, display: 'block', transition: 'border-color 0.15s' },
  primaryBtn: { width: '100%', padding: '13px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', marginTop: 4, marginBottom: 20 },
  footer: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  link: { color: '#2563EB', cursor: 'pointer', fontWeight: 600 },
};
