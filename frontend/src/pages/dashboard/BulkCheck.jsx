import React, { useState } from 'react';
import { bulkCheck } from '../../services/tools';

export default function BulkCheck() {
  const [input, setInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    const cleaned = input.split(/[\n,]+/).map(h => h.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    if (cleaned.length > 20) {
      setError('Maximum 20 hostnames per request.');
      return;
    }

    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await bulkCheck(cleaned.join(','));
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to run bulk check.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div>
        <p className="text-sm text-muted ">Tools</p>
        <h2 className="text-2xl font-semibold text-ink ">Bulk Blacklist Check</h2>
        <p className="text-sm text-muted mt-1">Check multiple IPs or domains at once. Enter one per line or comma-separated (max 20).</p>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"example.com\n8.8.8.8\n1.1.1.1"}
        rows={5}
        className="w-full p-3 border border-line rounded-lg focus:ring-2 focus:ring-accent focus:outline-none font-mono text-sm "
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          disabled={loading || !input.trim()}
          className="bg-accent hover:brightness-110 text-white py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check All'}
        </button>
        <span className="text-xs text-muted ">
          {input.split(/[\n,]+/).filter(h => h.trim()).length} / 20 hostnames
        </span>
      </div>

      {error && <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{error}</div>}

      {data && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="bg-info/12 border border-info/30 rounded-lg px-4 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-info ">Total</p>
              <p className="text-xl font-bold text-info ">{data.total}</p>
            </div>
            <div className="bg-bad/12 border border-bad/30 rounded-lg px-4 py-2 text-center">
              <p className="text-xs uppercase tracking-wide text-bad ">Blacklisted</p>
              <p className="text-xl font-bold text-bad ">{data.blacklisted_count}</p>
            </div>
          </div>

          <div className="rounded-lg border border-line overflow-hidden">
            <table className="w-full text-ink border-collapse">
              <thead className="bg-surface-2 ">
                <tr className="text-left border-b border-line ">
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">Hostname / IP</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">Status</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">Detected On</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((result, i) => (
                  <tr key={i} className="border-b border-line hover:bg-surface-2/60 ">
                    <td className="px-4 py-2.5 font-mono text-sm">{result.hostname}</td>
                    <td className="px-4 py-2.5">
                      {result.error ? (
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-surface-2 text-muted">Error</span>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${result.is_blacklisted ? 'bg-bad/12 text-bad' : 'bg-ok/12 text-ok'}`}>
                          {result.is_blacklisted ? `Listed (${result.detected_count})` : 'Clear'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {result.detected_on?.map(d => d.provider).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
