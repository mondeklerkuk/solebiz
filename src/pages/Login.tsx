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
    <div style={s.page}>
      {/* Left panel */}
      <div style={s.left}>
        <div style={s.brand}>
          <div style={s.brandIcon}>S</div>
          <span style={s.brandName}>SoleBiz</span>
        </div>
        <div style={s.heroWrap}>
          <h1 style={s.heroTitle}>Run your<br/>business from<br/>one place.</h1>
          <p style={s.heroSub}>Quotes, invoices, jobs and clients — designed for sole traders.</p>
          <div style={s.features}>
            {['Quotes & Invoices','Job Pipeline','Client Manager','Materials Sourcing'].map(f => (
              <div key={f} style={s.feat}>
                <div style={s.checkCircle}>✓</div>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={s.leftFooter}>Free forever · No credit card needed</p>
      </div>

      {/* Right panel */}
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
            {error && <div style={s.err}>{error}</div>}
            <label style={s.lbl}>Email address</label>
            <input style={s.inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <label style={s.lbl}>Password</label>
            <input style={s.inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            <button style={{ ...s.primaryBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={s.foot}>No account? <span style={s.link} onClick={onSwitch}>Create one free</span></p>
        </div>
      </div>
    </div>
  );
}

const s: Record<string,React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexWrap: 'wrap', fontFamily: 'var(--font-text)' },
  left: { flex: '1 1 380px', background: 'linear-gradient(145deg,#000000 0%,#0a0a14 50%,#001533 100%)', padding: 'clamp(32px,6vw,60px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 260, position: 'relative', overflow: 'hidden' },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'clamp(40px,8vw,80px)', zIndex: 1, position: 'relative' },
  brandIcon: { width: 34, height: 34, borderRadius: 9, background: 'var(--accent-blue)', color: '#fff', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 'var(--text-17)', fontWeight: 700, color: '#fff' },
  heroWrap: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 'clamp(24px,4vw,48px)', zIndex: 1, position: 'relative' },
  heroTitle: { fontSize: 'clamp(32px,6vw,52px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 20, fontFamily: 'var(--font-display)' },
  heroSub: { fontSize: 'clamp(14px,2vw,17px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: 340, marginBottom: 36 },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  feat: { display: 'flex', alignItems: 'center', gap: 12, fontSize: 'var(--text-15)', color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, background: 'rgba(48,209,88,0.2)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  leftFooter: { fontSize: 'var(--text-13)', color: 'rgba(255,255,255,0.3)', zIndex: 1, position: 'relative' },
  right: { flex: '1 1 340px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,4vw,48px)', background: 'var(--bg-primary)' },
  card: { width: '100%', maxWidth: 380 },
  title: { fontSize: 'clamp(24px,4vw,28px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 'var(--text-15)', color: 'var(--text-secondary)', marginBottom: 28, fontWeight: 400 },
  googleBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', backdropFilter: 'blur(20px)', fontSize: 'var(--text-15)', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s var(--ease-apple)', fontFamily: 'inherit' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  line: { flex: 1, height: 1, background: 'var(--separator)' },
  or: { color: 'var(--text-tertiary)', fontSize: 'var(--text-13)', fontWeight: 500 },
  err: { background: 'rgba(255,59,48,0.1)', color: 'var(--accent-red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 14, fontSize: 'var(--text-13)', fontWeight: 600, border: '1px solid rgba(255,59,48,0.2)' },
  lbl: { display: 'block', fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.01em' },
  inp: { width: '100%', padding: '12px 14px', border: '1px solid var(--separator)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-15)', color: 'var(--text-primary)', background: 'var(--bg-card)', marginBottom: 14, display: 'block', fontFamily: 'inherit', fontWeight: 500, transition: 'border-color 0.2s', backdropFilter: 'blur(20px)' },
  primaryBtn: { width: '100%', padding: '14px', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-17)', fontWeight: 600, cursor: 'pointer', marginTop: 4, marginBottom: 20, fontFamily: 'inherit', transition: 'all 0.2s var(--ease-apple)' },
  foot: { fontSize: 'var(--text-15)', color: 'var(--text-secondary)', textAlign: 'center' },
  link: { color: 'var(--accent-blue)', cursor: 'pointer', fontWeight: 600 },
};
