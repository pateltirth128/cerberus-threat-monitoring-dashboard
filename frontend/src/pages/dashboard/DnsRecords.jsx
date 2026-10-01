import React, { useState } from 'react';
import { checkDns } from '../../services/tools';
import CopyButton from '../../components/shared/CopyButton';

const RECORD_COLORS = {
  A: 'bg-info/12 text-info',
  AAAA: 'bg-indigo-100 text-indigo-800',
  MX: 'bg-warn/12 text-warn',
  TXT: 'bg-surface-2 text-ink',
  CNAME: 'bg-ok/12 text-ok',
  NS: 'bg-violet-100 text-violet-800',
  SOA: 'bg-bad/12 text-bad',
  PTR: 'bg-warn/12 text-warn',
};

export default function DnsRecords() {
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
      const result = await checkDns(hostname.trim());
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to lookup DNS records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div>
        <p className="text-sm text-muted ">Tools</p>
        <h2 className="text-2xl font-semibold text-ink ">DNS Record Viewer</h2>
        <p className="text-sm text-muted mt-1">Look up A, AAAA, MX, TXT, CNAME, NS, SOA, and PTR records for any domain.</p>
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
          {loading ? 'Looking up...' : 'Lookup'}
        </button>
      </div>

      {error && <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{error}</div>}

      {data && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink ">Records for <span className="text-accent ">{data.domain}</span></h3>

          {Object.keys(data.records).length === 0 ? (
            <p className="text-sm text-muted">No records found.</p>
          ) : (
            Object.entries(data.records).map(([type, records]) => (
              <div key={type} className="rounded-lg border border-line overflow-hidden">
                <div className="bg-surface-2 px-4 py-2 flex items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${RECORD_COLORS[type] || 'bg-surface-2 text-ink'}`}>
                    {type}
                  </span>
                  <span className="text-xs text-muted ">{records.length} record{records.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-line ">
                  {records.map((record, i) => (
                    <div key={i} className="px-4 py-2.5 text-sm font-mono text-ink break-all flex items-center justify-between">
                      <span>{record}</span>
                      <CopyButton text={record} />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
