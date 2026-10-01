import React, { useState } from 'react';
import { checkSubnet, exportSubnetCsv } from '../../services/tools';

export default function SubnetCheck() {
  const [cidr, setCidr] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!cidr.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const result = await checkSubnet(cidr.trim());
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to check subnet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div>
        <p className="text-sm text-muted ">Tools</p>
        <h2 className="text-2xl font-semibold text-ink ">Subnet / CIDR Check</h2>
        <p className="text-sm text-muted mt-1">Scan an entire IP range against DNSBL providers. Max /24 (256 IPs).</p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="192.168.1.0/24"
          className="flex-1 p-2.5 border border-line rounded-lg focus:ring-2 focus:ring-accent focus:outline-none "
        />
        <button
          onClick={handleCheck}
          disabled={loading || !cidr.trim()}
          className="bg-accent hover:brightness-110 text-white py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {error && <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{error}</div>}

      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-4">
              <Stat label="Total IPs" value={data.total_ips} tone="sky" />
              <Stat label="Blacklisted" value={data.blacklisted_count} tone="rose" />
              <Stat label="Clean" value={data.clean_count} tone="emerald" />
            </div>
            <button
              onClick={() => exportSubnetCsv(cidr.trim())}
              className="text-sm font-medium text-accent hover:text-accent"
            >
              Export CSV
            </button>
          </div>

          <div className="rounded-lg border border-line overflow-hidden">
            <div className="scrollable-table overflow-auto max-h-[60vh]">
              <table className="w-full text-ink border-collapse">
                <thead className="sticky top-0 bg-surface-2 ">
                  <tr className="text-left border-b border-line ">
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">IP Address</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">Status</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted ">Listed On</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((result, i) => (
                    <tr key={i} className="border-b border-line hover:bg-surface-2/60 ">
                      <td className="px-4 py-2.5 font-mono text-sm">{result.ip}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${result.is_blacklisted ? 'bg-bad/12 text-bad' : 'bg-ok/12 text-ok'}`}>
                          {result.is_blacklisted ? 'Blacklisted' : 'Clear'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm">{result.listed_on?.join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, tone }) {
  const colors = {
    sky: 'bg-info/12 text-info border-info/30 ',
    rose: 'bg-bad/12 text-bad border-bad/30 ',
    emerald: 'bg-ok/12 text-ok border-ok/30 ',
  };
  return (
    <div className={`rounded-lg border px-4 py-2 text-center ${colors[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
