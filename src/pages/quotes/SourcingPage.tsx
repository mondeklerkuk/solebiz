import { useState } from 'react';

interface Result {
  title: string;
  source: string;
  snippet: string;
  price: string;
  link: string;
  delivery: string;
}

interface Analysis {
  summary: string;
  topPick: string;
  tips: string[];
}

const SUGGESTIONS = [
  'copper pipe 22mm', 'plasterboard 12.5mm', 'OSB board 18mm',
  'PVC conduit 20mm', 'decking boards hardwood', 'thermal insulation 100mm',
  'cement 25kg bags', 'roof tiles concrete', 'scaffolding hire',
  'tile adhesive', 'exterior paint 10L', 'chainsaw bar oil',
];

const SUPPLIERS = ['Screwfix', 'Toolstation', 'Travis Perkins', 'B&Q Trade', 'Amazon', 'HSS Hire'];

export default function SourcingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [saved, setSaved] = useState<Result[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResults([]);
    setAnalysis(null);
    setSearched(true);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `You are a UK trade supplier sourcing assistant. Return ONLY valid JSON, no markdown, no preamble.
Return this exact structure:
{
  "results": [
    {
      "title": "Product name and spec",
      "source": "Supplier (Screwfix/Toolstation/Travis Perkins/B&Q/Amazon/HSS Hire)",
      "snippet": "Brief description with key specs",
      "price": "£X.XX per unit/pack/m²",
      "link": "https://www.screwfix.com",
      "delivery": "Next day delivery"
    }
  ],
  "analysis": {
    "summary": "1-2 sentence market overview",
    "topPick": "Best value option and why",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
}
Include 5-7 results from real UK trade suppliers with realistic 2025 UK prices.`,
          messages: [{ role: 'user', content: `Find UK suppliers for: ${q}` }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      // Strip any markdown fences
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResults(parsed.results || []);
      setAnalysis(parsed.analysis || null);
    } catch (err: any) {
      console.error('Sourcing error:', err);
      if (err.message?.includes('401') || err.message?.includes('api-key') || err.message?.includes('403')) {
        setError('API authentication error. Please check configuration.');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Network error — please check your connection and try again.');
      } else {
        setError('Search failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleSave(r: Result) {
    setSaved(prev =>
      prev.some(s => s.link === r.link)
        ? prev.filter(s => s.link !== r.link)
        : [...prev, r]
    );
  }

  const isSaved = (r: Result) => saved.some(s => s.link === r.link);

  return (
    <div style={s.page}>
      <div style={s.hdr}>
        <h1 style={s.title}>Sourcing</h1>
        <p style={s.sub}>Find materials & prices from UK trade suppliers</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 28 }}>
        <div style={s.searchBox}>
          <span style={{ fontSize: 18, color: 'var(--text-tertiary)', flexShrink: 0 }}>🔍</span>
          <input
            style={s.searchInp}
            placeholder="Search for materials, tools, equipment…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ flexShrink: 0, padding: '10px 22px', borderRadius: 10 }}>
            {loading ? '…' : 'Search'}
          </button>
        </div>
        {/* Suggestions */}
        <div style={s.chips}>
          {SUGGESTIONS.map(s => (
            <button key={s} type="button" style={chipStyle} onClick={() => setQuery(s)}>{s}</button>
          ))}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <p style={{ fontSize: 'var(--text-15)', color: 'var(--text-secondary)', marginTop: 16 }}>
            Searching UK suppliers for <strong>"{query}"</strong>…
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          {/* AI Analysis banner */}
          {analysis && (
            <div style={s.analysisBanner}>
              <div style={s.analysisTop}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <span style={s.analysisTitle}>AI Analysis</span>
              </div>
              <p style={s.analysisSummary}>{analysis.summary}</p>
              <div style={s.topPickRow}>
                <span style={s.topPickLabel}>Top pick:</span>
                <span style={s.topPickText}>{analysis.topPick}</span>
              </div>
              <div style={s.tipsRow}>
                {analysis.tips.map((t, i) => (
                  <div key={i} style={s.tip}>💡 {t}</div>
                ))}
              </div>
            </div>
          )}

          {/* Result cards */}
          <div style={s.grid}>
            {results.map((r, i) => (
              <div key={i} style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.sourceTag}>{r.source}</span>
                  <span style={s.priceTag}>{r.price}</span>
                </div>
                <h3 style={s.cardTitle}>{r.title}</h3>
                <p style={s.cardSnippet}>{r.snippet}</p>
                {r.delivery && <div style={s.delivery}>🚚 {r.delivery}</div>}
                <div style={s.cardFooter}>
                  <a href={r.link} target="_blank" rel="noopener noreferrer" style={s.visitBtn}>Visit ↗</a>
                  <button
                    style={{ ...s.saveBtn, ...(isSaved(r) ? s.savedBtn : {}) }}
                    onClick={() => toggleSave(r)}
                  >
                    {isSaved(r) ? '✓ Saved' : '+ Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Saved list */}
          {saved.length > 0 && (
            <div style={s.savedSection}>
              <h3 style={s.savedTitle}>📌 Saved Items ({saved.length})</h3>
              {saved.map((r, i) => (
                <div key={i} style={s.savedRow}>
                  <span style={s.sourceTag}>{r.source}</span>
                  <span style={{ flex: 1, fontSize: 'var(--text-13)', color: 'var(--text-primary)', fontWeight: 500 }}>{r.title}</span>
                  <span style={{ fontSize: 'var(--text-13)', fontWeight: 700, color: 'var(--text-primary)' }}>{r.price}</span>
                  <button style={s.removeBtn} onClick={() => toggleSave(r)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty searched state */}
      {!loading && searched && results.length === 0 && !error && (
        <div style={s.emptyCenter}>
          <span style={{ fontSize: 40 }}>🔎</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12 }}>No results found. Try a different search.</p>
        </div>
      )}

      {/* Initial state */}
      {!searched && (
        <div style={s.emptyCenter}>
          <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }}>🏗️</span>
          <h3 style={s.emptyTitle}>Find the best prices on materials</h3>
          <p style={s.emptyDesc}>Search for any material, tool or equipment. We'll check UK trade suppliers and show you prices, delivery times and buying tips.</p>
          <div style={s.supplierRow}>
            {SUPPLIERS.map(s => (
              <span key={s} style={s2.supplierChip}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 20,
  border: '1px solid var(--separator)',
  background: 'var(--bg-card)', fontSize: 12,
  color: 'var(--text-secondary)', cursor: 'pointer',
  fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
  transition: 'all 0.15s',
};

const s2 = {
  supplierChip: { padding: '6px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--separator)', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 } as React.CSSProperties,
};

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(20px,4vw,40px) clamp(16px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  hdr: { marginBottom: 24 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' },
  sub: { fontSize: 'var(--text-13)', color: 'var(--text-secondary)', fontWeight: 400, marginTop: 4 },
  searchBox: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--separator)', borderRadius: 14, padding: '8px 8px 8px 16px', boxShadow: 'var(--shadow-card)', marginBottom: 14 },
  searchInp: { flex: 1, border: 'none', background: 'none', fontSize: 'var(--text-15)', color: 'var(--text-primary)', padding: '8px 0', fontWeight: 500, fontFamily: 'inherit', minWidth: 0 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: 'var(--accent-red)', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 'var(--text-13)', fontWeight: 600 },
  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' },
  spinner: { width: 36, height: 36, border: '3px solid var(--separator)', borderTop: '3px solid var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  analysisBanner: { background: 'linear-gradient(135deg,rgba(0,113,227,0.08),rgba(191,90,242,0.08))', border: '1px solid rgba(0,113,227,0.2)', borderRadius: 14, padding: '18px 20px', marginBottom: 20 },
  analysisTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  analysisTitle: { fontSize: 'var(--text-13)', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.06em' },
  analysisSummary: { fontSize: 'var(--text-13)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 },
  topPickRow: { display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 },
  topPickLabel: { fontSize: 'var(--text-13)', fontWeight: 700, color: 'var(--accent-blue)', flexShrink: 0 },
  topPickText: { fontSize: 'var(--text-13)', color: 'var(--text-primary)', fontWeight: 500 },
  tipsRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  tip: { fontSize: 'var(--text-13)', color: 'var(--text-secondary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, marginBottom: 28 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--separator)', borderRadius: 14, padding: '18px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 8 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  sourceTag: { fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(0,113,227,0.1)', padding: '3px 8px', borderRadius: 6 },
  priceTag: { fontSize: 'var(--text-15)', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' },
  cardTitle: { fontSize: 'var(--text-13)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 },
  cardSnippet: { fontSize: 'var(--text-11)', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 },
  delivery: { fontSize: 'var(--text-11)', color: 'var(--accent-green)', fontWeight: 600 },
  cardFooter: { display: 'flex', gap: 8, marginTop: 4 },
  visitBtn: { flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 'var(--text-13)', color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', display: 'block' },
  saveBtn: { padding: '8px 14px', background: 'rgba(0,113,227,0.1)', border: '1px solid rgba(0,113,227,0.2)', borderRadius: 8, fontSize: 'var(--text-13)', color: 'var(--accent-blue)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' },
  savedBtn: { background: 'rgba(48,209,88,0.1)', border: '1px solid rgba(48,209,88,0.2)', color: 'var(--accent-green)' },
  savedSection: { background: 'var(--bg-card)', border: '1px solid var(--separator)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-card)' },
  savedTitle: { fontSize: 'var(--text-15)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 },
  savedRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, marginBottom: 8, flexWrap: 'wrap' },
  removeBtn: { width: 26, height: 26, border: 'none', background: 'rgba(255,59,48,0.1)', color: 'var(--accent-red)', borderRadius: 6, cursor: 'pointer', fontSize: 11, flexShrink: 0, fontFamily: 'inherit' },
  emptyCenter: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 24px' },
  emptyTitle: { fontSize: 'var(--text-20)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.02em' },
  emptyDesc: { fontSize: 'var(--text-15)', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 440, marginBottom: 28 },
  supplierRow: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
};

// Add spinner animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  if (!document.head.querySelector('[data-spin]')) {
    style.setAttribute('data-spin', '');
    document.head.appendChild(style);
  }
}
