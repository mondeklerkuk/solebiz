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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>SoleBiz</h1>
        <p style={styles.tagline}>Your business, all in one place.</p>

        <button style={styles.googleBtn} onClick={handleGoogle}>Continue with Google</button>

        <div style={styles.divider}><div style={styles.line}/><span style={styles.or}>or</span><div style={styles.line}/></div>

        <form onSubmit={handleLogin}>
          {error && <div style={styles.error}>{error}</div>}
          <input style={styles.input} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.primaryBtn} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
        </form>

        <p style={styles.footer}>Don't have an account? <span style={styles.link} onClick={onSwitch}>Sign up</span></p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  logo: { fontSize: 28, fontWeight: 700, color: '#1A56DB', textAlign: 'center', margin: '0 0 4px' },
  tagline: { color: '#6B7280', textAlign: 'center', fontSize: 14, margin: '0 0 24px' },
  googleBtn: { width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 500, marginBottom: 20 },
  divider: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  line: { flex: 1, height: 1, background: '#E5E7EB' },
  or: { color: '#9CA3AF', fontSize: 13 },
  error: { background: '#FEF2F2', color: '#DC2626', padding: '10px 12px', borderRadius: 8, marginBottom: 12, fontSize: 14 },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: 10, fontSize: 15, marginBottom: 12, background: '#F9FAFB', boxSizing: 'border-box' },
  primaryBtn: { width: '100%', padding: 13, background: '#1A56DB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 14 },
  footer: { textAlign: 'center', color: '#6B7280', fontSize: 14, margin: 0 },
  link: { color: '#1A56DB', cursor: 'pointer' },
};
