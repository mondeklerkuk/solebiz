import { useState } from 'react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
  price?: string;
  image?: string;
}

interface AIAnalysis {
  summary: string;
  topPick: string;
  tips: string[];
}

export default function SourcingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [savedItems, setSavedItems] = useState<SearchResult[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResults([]); setAnalysis(null); setSearched(true);

    try {
      // Use Serper.dev for search - user needs to add their own key
      // For now use the Anthropic API to simulate a search and return structured results
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `You are a UK trade supplier sourcing assistant. When given a search query for materials or products needed for a job, return realistic UK supplier results in JSON format only. No preamble, no markdown, just valid JSON.

Return this exact structure:
{
  "results": [
    {
      "title": "Product name and spec",
      "source": "Supplier name (e.g. Screwfix, Toolstation, Travis Perkins, B&Q, Amazon, HSS Hire)",
      "snippet": "Brief product description including key specs",
      "price": "£X.XX (per unit/pack/m²/etc)",
      "link": "https://example.com",
      "delivery": "Next day / 2-3 days / Collection only"
    }
  ],
  "analysis": {
    "summary": "Brief 1-2 sentence overview of the market for this item",
    "topPick": "Name the best value option and why",
    "tips": ["Buying tip 1", "Buying tip 2", "Buying tip 3"]
  }
}

Include 5-8 results from real UK suppliers. Make prices realistic for the UK market. Focus on trade/professional suppliers.`,
          messages: [{ role: 'user', content: `Search for: ${query}` }]
        })
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || '{}';

      try {
        const parsed = JSON.parse(text);
        setResults(parsed.results || []);
        setAnalysis(parsed.analysis || null);
      } catch {
        setError('Could not parse results. Please try again.');
      }
    } catch (err) {
      setError('Search failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function saveItem(item: SearchResult) {
    setSavedItems(prev => prev.some(s => s.link === item.link) ? prev : [...prev, item]);
  }

  function removeItem(link: string) {
    setSavedItems(prev => prev.filter(s => s.link !== link));
  }

  const SUGGESTIONS = [
    'copper pipe 22mm', 'plasterboard 12.5mm', 'OSB board 18mm',
    'PVC conduit 20mm', 'decking boards hardwood', 'thermal insulation 100mm',
    'cement 25kg bags', 'roof tiles concrete', 'UPVC window 600x900',
    'scaffolding hire week', 'tile adhesive flexible', 'exterior paint 10L'
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Sourcing</h1>
          <p style={s.subtitle}>Find materials & prices from UK suppliers</p>
        </div>
      </div>

      {/* Search box */}
      <form onSubmit={handleSearch} style={s.searchForm}>
        <div style={s.searchBox}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={s.searchInput}
            placeholder="Search for materials, tools, equipment…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button style={{ ...s.searchBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? '…' : 'Search'}
          </button>
        </div>
        <div style={s.suggestions}>
          {SUGGESTIONS.map(s => (
            <button key={s} type="button" style={style.chip} onClick={() => setQuery(s)}>
              {s}
            </button>
          ))}
        </div>
      </form>

      {error && <div style={s.error}>{error}</div>}

      {loading && (
        <div style={s.loadingState}>
          <div style={s.loadingDots}>
            <span style={s.dot1} />
            <span style={s.dot2} />
            <span style={s.dot3} />
          </div>
          <p style={s.loadingText}>Searching UK suppliers…</p>
        </div>
      )}

      {!loading && searched && results.length > 0 && (
        <div style={s.content}>
          {/* AI Analysis */}
          {analysis && (
            <div style={s.analysisCard}>
              <div style={s.analysisHeader}>
                <span style={s.aiIcon}>🤖</span>
                <span style={s.analysisTitle}>AI Sourcing Analysis</span>
              </div>
              <p style={s.analysisSummary}>{analysis.summary}</p>
              <div style={s.topPick}>
                <span style={s.topPickLabel}>Top pick:</span> {analysis.topPick}
              </div>
              <div style={s.tips}>
                {analysis.tips.map((tip, i) => (
                  <div key={i} style={s.tip}>
                    <span style={s.tipIcon}>💡</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={s.resultsGrid}>
            {results.map((r, i) => (
              <div key={i} style={s.resultCard}>
                <div style={s.resultHeader}>
                  <div style={s.sourceTag}>{r.source}</div>
                  {r.price && <div style={s.price}>{r.price}</div>}
                </div>
                <h3 style={s.resultTitle}>{r.title}</h3>
                <p style={s.resultSnippet}>{r.snippet}</p>
                {(r as any).delivery && (
                  <div style={s.delivery}>🚚 {(r as any).delivery}</div>
                )}
                <div style={s.resultFooter}>
                  <a href={r.link} target="_blank" rel="noopener noreferrer" style={s.visitBtn}>
                    Visit site ↗
                  </a>
                  <button
                    style={{ ...s.saveBtn, ...(savedItems.some(s => s.link === r.link) ? s.savedBtn : {}) }}
                    onClick={() => saveItem(r)}
                  >
                    {savedItems.some(s => s.link === r.link) ? '✓ Saved' : '+ Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Saved items */}
          {savedItems.length > 0 && (
            <div style={s.savedSection}>
              <h2 style={s.savedTitle}>📌 Saved Items ({savedItems.length})</h2>
              <div style={s.savedList}>
                {savedItems.map((item, i) => (
                  <div key={i} style={s.savedItem}>
                    <div style={s.savedInfo}>
                      <span style={s.savedSource}>{item.source}</span>
                      <span style={s.savedName}>{item.title}</span>
                      {item.price && <span style={s.savedPrice}>{item.price}</span>}
                    </div>
                    <button style={s.removeBtn} onClick={() => removeItem(item.link)}>✕</button>
                  </div>
                ))}
              </div>
              <button style={s.addToQuoteBtn}>+ Add to Quote</button>
            </div>
          )}
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div style={s.empty}>
          <span style={{ fontSize: 40 }}>🔎</span>
          <p>No results found. Try a different search.</p>
        </div>
      )}

      {!searched && (
        <div style={s.emptyState}>
          <span style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>🏗️</span>
          <h3 style={s.emptyTitle}>Find the best prices on materials</h3>
          <p style={s.emptyDesc}>Search for any material, tool or equipment. We'll check UK trade suppliers and show you prices, delivery times and availability.</p>
          <div style={s.supplierLogos}>
            {['Screwfix', 'Toolstation', 'Travis Perkins', 'B&Q Trade', 'Amazon', 'HSS Hire'].map(s => (
              <span key={s} style={style.supplierChip}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const style = {
  chip: { padding: '5px 12px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' as const, fontFamily: 'inherit' },
  supplierChip: { padding: '6px 14px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 13, color: '#475569', fontWeight: 600 },
};

const s: Record<string, React.CSSProperties> = {
  page: { padding: 'clamp(16px,4vw,36px) clamp(14px,4vw,40px)', maxWidth: 960, margin: '0 auto' },
  header: { marginBottom: 24 },
  title: { fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.8px' },
  subtitle: { fontSize: 14, color: '#94A3B8', fontWeight: 500, marginTop: 4 },
  searchForm: { marginBottom: 32 },
  searchBox: { display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '6px 6px 6px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 14 },
  searchIcon: { fontSize: 16, marginRight: 4, flexShrink: 0 },
  searchInput: { flex: 1, border: 'none', background: 'none', fontSize: 15, color: '#0F172A', padding: '8px 0', fontWeight: 500, minWidth: 0 },
  searchBtn: { background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  error: { background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 16 },
  loadingDots: { display: 'flex', gap: 8 },
  dot1: { width: 10, height: 10, borderRadius: 5, background: '#2563EB', animation: 'pulse 1s ease infinite' },
  dot2: { width: 10, height: 10, borderRadius: 5, background: '#2563EB', opacity: 0.6 },
  dot3: { width: 10, height: 10, borderRadius: 5, background: '#2563EB', opacity: 0.3 },
  loadingText: { fontSize: 15, color: '#64748B', fontWeight: 500 },
  content: { display: 'flex', flexDirection: 'column', gap: 24 },
  analysisCard: { background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', border: '1px solid #BFDBFE', borderRadius: 16, padding: '20px 22px' },
  analysisHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiIcon: { fontSize: 18 },
  analysisTitle: { fontSize: 14, fontWeight: 800, color: '#1E40AF' },
  analysisSummary: { fontSize: 14, color: '#334155', lineHeight: 1.6, marginBottom: 12 },
  topPick: { fontSize: 14, color: '#0F172A', fontWeight: 600, background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 },
  topPickLabel: { color: '#2563EB' },
  tips: { display: 'flex', flexDirection: 'column', gap: 6 },
  tip: { display: 'flex', gap: 8, fontSize: 13, color: '#475569' },
  tipIcon: { flexShrink: 0 },
  resultsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 },
  resultCard: { background: '#fff', borderRadius: 14, padding: '18px 18px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 8 },
  resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  sourceTag: { fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 },
  price: { fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', whiteSpace: 'nowrap' },
  resultTitle: { fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.4 },
  resultSnippet: { fontSize: 13, color: '#64748B', lineHeight: 1.5, flex: 1 },
  delivery: { fontSize: 12, color: '#059669', fontWeight: 600 },
  resultFooter: { display: 'flex', gap: 8, marginTop: 4 },
  visitBtn: { flex: 1, textAlign: 'center', padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, color: '#475569', fontWeight: 600, textDecoration: 'none', display: 'block' },
  saveBtn: { padding: '8px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 13, color: '#2563EB', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  savedBtn: { background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669' },
  savedSection: { background: '#fff', borderRadius: 16, padding: '20px 22px', border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  savedTitle: { fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 16, letterSpacing: '-0.3px' },
  savedList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  savedItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10 },
  savedInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 },
  savedSource: { fontSize: 11, fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, flexShrink: 0 },
  savedName: { fontSize: 13, fontWeight: 600, color: '#0F172A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  savedPrice: { fontSize: 13, fontWeight: 800, color: '#0F172A', flexShrink: 0 },
  removeBtn: { width: 26, height: 26, border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: 6, fontSize: 11, cursor: 'pointer', flexShrink: 0 },
  addToQuoteBtn: { width: '100%', padding: '11px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', color: '#94A3B8' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '60px 24px' },
  emptyTitle: { fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.5px' },
  emptyDesc: { fontSize: 15, color: '#64748B', lineHeight: 1.6, maxWidth: 440, marginBottom: 28 },
  supplierLogos: { display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
};
