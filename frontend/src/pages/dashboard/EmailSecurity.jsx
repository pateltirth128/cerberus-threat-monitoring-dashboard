import React, { useState } from 'react';
import { checkEmailSecurity } from '../../services/tools';

const GRADE_COLORS = {
  A: 'bg-ok/12 text-ok border-ok/30',
  B: 'bg-info/12 text-info border-info/30',
  D: 'bg-warn/12 text-warn border-warn/30',
  F: 'bg-bad/12 text-bad border-bad/30',
};

export default function EmailSecurity() {
  const [hostname, setHostname] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!hostname.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await checkEmailSecurity(hostname.trim());
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to check email security.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div>
        <p className="text-sm text-muted ">Tools</p>
        <h2 className="text-2xl font-semibold text-ink ">SPF / DKIM / DMARC Checker</h2>
        <p className="text-sm text-muted mt-1">Validate email authentication records for any domain.</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="example.com"
          className="flex-1 p-2.5 border border-line rounded-lg focus:ring-2 focus:ring-accent focus:outline-none "
        />
        <button
          onClick={handleCheck}
          disabled={loading || !hostname.trim()}
          className="bg-accent hover:brightness-110 text-white py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {error && <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{error}</div>}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-xl border-2 px-5 py-3 text-center ${GRADE_COLORS[data.grade] || GRADE_COLORS.F}`}>
              <p className="text-xs uppercase tracking-wide font-medium opacity-70">Grade</p>
              <p className="text-4xl font-black">{data.grade}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-ink ">{data.domain}</p>
              <p className="text-sm text-muted ">Score: {data.score} / {data.max_score}</p>
            </div>
          </div>

          <CheckSection title="SPF" found={data.spf?.found} data={data.spf} />
          <CheckSection title="DKIM" found={data.dkim?.found} data={data.dkim} />
          <CheckSection title="DMARC" found={data.dmarc?.found} data={data.dmarc} />
        </div>
      )}
    </section>
  );
}

function CheckSection({ title, found, data }) {
  return (
    <div className={`rounded-lg border p-4 ${found ? 'border-ok/30 bg-ok/12/50 ' : 'border-bad/30 bg-bad/12/50 '}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${found ? 'bg-ok/12 text-ok' : 'bg-bad/12 text-bad'}`}>
          {found ? 'FOUND' : 'MISSING'}
        </span>
        <h4 className="font-semibold text-ink ">{title}</h4>
      </div>

      {data?.record && (
        <pre className="bg-bg text-ink rounded-lg p-3 text-xs overflow-auto mt-2 whitespace-pre-wrap">{data.record}</pre>
      )}

      {data?.policy && (
        <p className="text-sm mt-2 text-ink ">
          Policy: <span className="font-semibold">{data.policy}</span>
          {data.subdomain_policy && <> | Subdomain: <span className="font-semibold">{data.subdomain_policy}</span></>}
        </p>
      )}

      {data?.selectors_found?.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.selectors_found.map((s, i) => (
            <p key={i} className="text-sm text-ink ">
              Selector: <span className="font-mono font-semibold">{s.selector}</span>
              {s.cname && <span className="text-muted"> (CNAME: {s.cname})</span>}
            </p>
          ))}
        </div>
      )}

      {data?.details && !data.record && !data.selectors_found?.length && (
        <p className="text-sm text-muted mt-1">{data.details}</p>
      )}

      {data?.warnings?.length > 0 && (
        <div className="mt-2 space-y-1">
          {data.warnings.map((w, i) => (
            <p key={i} className="text-xs text-warn ">Warning: {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}
