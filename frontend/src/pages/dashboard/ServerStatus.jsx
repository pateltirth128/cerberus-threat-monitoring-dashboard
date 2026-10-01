import React, { useState } from 'react';
import { checkServerStatus } from '../../services/tools';

export default function ServerStatus() {
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!hostname.trim()) {
      setError('Enter a hostname or URL.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await checkServerStatus(hostname.trim());
      setData(result);
    } catch (err) {
      setData(null);
      setError(err.message || 'Failed to check server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='space-y-5'>
      <div className='bg-surface border border-line rounded-xl p-5 shadow-sm'>
        <p className='text-sm text-muted'>Uptime Check</p>
        <h2 className='text-2xl font-semibold text-ink mt-1'>Is Server Up?</h2>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="h-11 w-full px-4 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:outline-none"
            placeholder="example.com or https://example.com"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          />
          <button
            className={`h-11 px-6 rounded-xl font-medium ${loading ? 'bg-surface-2 text-muted' : 'bg-accent hover:brightness-110 text-white'} transition-colors`}
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
        {!data ? (
          <p className="text-muted text-sm">Enter a hostname or URL to check if the server is reachable.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center text-2xl font-bold ${data.is_up ? 'bg-ok/12 text-ok' : 'bg-bad/12 text-bad'}`}>
                {data.is_up ? '✓' : '✗'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">{data.hostname}</h3>
                <p className={`text-sm font-medium ${data.is_up ? 'text-ok' : 'text-bad'}`}>
                  {data.is_up ? 'Server is UP' : 'Server is DOWN'}
                </p>
              </div>
            </div>

            {!data.is_up && data.reason && (
              <div className="rounded-xl border border-bad/30 bg-bad/12 p-4">
                <p className="text-sm text-bad"><span className="font-semibold">Reason:</span> {data.reason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatusCard label="Resolved IP" value={data.resolved_ip} />
              <StatusCard label="DNS Resolves" value={data.dns_resolves ? 'Yes' : 'No'} positive={data.dns_resolves} />
              <StatusCard label="Port 443 (HTTPS)" value={data.port_443_open ? 'Open' : 'Closed'} positive={data.port_443_open} />
              <StatusCard label="Port 80 (HTTP)" value={data.port_80_open ? 'Open' : 'Closed'} positive={data.port_80_open} />
              {data.status_code !== undefined && (
                <StatusCard label="HTTP Status" value={data.status_code} positive={data.status_code >= 200 && data.status_code < 400} />
              )}
              {data.response_time_ms !== undefined && (
                <StatusCard label="Response Time" value={`${data.response_time_ms} ms`} />
              )}
              {data.server_header && (
                <StatusCard label="Server" value={data.server_header} />
              )}
              {data.final_url && data.final_url !== data.url && (
                <StatusCard label="Redirected To" value={data.final_url} />
              )}
              {data.ssl_error && (
                <StatusCard label="SSL" value="Certificate Error" positive={false} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatusCard({ label, value, positive }) {
  const borderColor = positive === true ? 'border-ok/30' : positive === false ? 'border-bad/30' : 'border-line';
  const bgColor = positive === true ? 'bg-ok/12' : positive === false ? 'bg-bad/12' : 'bg-surface-2';
  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3`}>
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5 break-all">{value ?? '—'}</p>
    </div>
  );
}
