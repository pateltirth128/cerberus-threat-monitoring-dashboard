import React, { useState } from 'react';
import { checkSsl } from '../../services/tools';

export default function SslChecker() {
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
      const result = await checkSsl(hostname.trim());
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to check SSL certificate.');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (valid, days) => {
    if (!valid) return 'bg-bad/12 border-bad/30 ';
    if (days < 30) return 'bg-warn/12 border-warn/30 ';
    return 'bg-ok/12 border-ok/30 ';
  };

  const statusText = (valid, days) => {
    if (!valid) return { label: 'Expired / Invalid', color: 'text-bad ' };
    if (days < 30) return { label: `Expiring Soon (${days} days)`, color: 'text-warn ' };
    return { label: `Valid (${days} days remaining)`, color: 'text-ok ' };
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div>
        <p className="text-sm text-muted ">Tools</p>
        <h2 className="text-2xl font-semibold text-ink ">SSL Certificate Checker</h2>
        <p className="text-sm text-muted mt-1">Check certificate validity, expiry date, issuer, and cipher details.</p>
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
          {loading ? 'Checking...' : 'Check SSL'}
        </button>
      </div>

      {error && <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{error}</div>}

      {data && (
        <div className="space-y-4">
          {data.error && !('valid' in data) ? (
            <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{data.error}</div>
          ) : (
            <>
              <div className={`rounded-xl border p-4 ${statusColor(data.valid, data.days_remaining)}`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted font-medium">Certificate Status</p>
                    <p className={`text-2xl font-bold mt-1 ${statusText(data.valid, data.days_remaining).color}`}>
                      {statusText(data.valid, data.days_remaining).label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted ">Hostname</p>
                    <p className="font-medium text-ink ">{data.hostname}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="rounded-lg border border-line p-4 space-y-3">
                  <h4 className="font-semibold text-ink ">Subject</h4>
                  <Row label="Common Name" value={data.subject?.common_name} />
                  <Row label="Organization" value={data.subject?.organization} />
                </div>
                <div className="rounded-lg border border-line p-4 space-y-3">
                  <h4 className="font-semibold text-ink ">Issuer</h4>
                  <Row label="Common Name" value={data.issuer?.common_name} />
                  <Row label="Organization" value={data.issuer?.organization} />
                </div>
                <div className="rounded-lg border border-line p-4 space-y-3">
                  <h4 className="font-semibold text-ink ">Validity</h4>
                  <Row label="Not Before" value={data.not_before} />
                  <Row label="Not After" value={data.not_after} />
                  <Row label="Serial Number" value={data.serial_number} />
                </div>
                <div className="rounded-lg border border-line p-4 space-y-3">
                  <h4 className="font-semibold text-ink ">Cipher</h4>
                  <Row label="Name" value={data.cipher?.name} />
                  <Row label="Protocol" value={data.cipher?.protocol} />
                  <Row label="Bits" value={data.cipher?.bits} />
                </div>
              </div>

              {data.san?.length > 0 && (
                <div className="rounded-lg border border-line p-4">
                  <h4 className="font-semibold text-ink mb-2">Subject Alternative Names ({data.san.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.san.map((name, i) => (
                      <span key={i} className="bg-surface-2 text-ink rounded-full px-3 py-1 text-xs font-mono">{name}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted ">{label}</span>
      <span className="font-medium text-ink text-right break-all max-w-[60%]">{value || '—'}</span>
    </div>
  );
}
