import React, { useState } from 'react';
import { checkAbuseIPDB } from '../../services/tools';

export default function AbuseIPDB() {
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!hostname.trim()) {
      setError('Enter an IP address or hostname.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await checkAbuseIPDB(hostname.trim());
      setData(result);
    } catch (err) {
      setData(null);
      setError(err.message || 'Failed to check AbuseIPDB.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score === null || score === undefined) return 'text-muted';
    if (score === 0) return 'text-ok';
    if (score <= 25) return 'text-warn';
    if (score <= 75) return 'text-warn';
    return 'text-bad';
  };

  const scoreBg = (score) => {
    if (score === null || score === undefined) return 'bg-surface-2';
    if (score === 0) return 'bg-ok/12 border-ok/30';
    if (score <= 25) return 'bg-warn/12 border-warn/30';
    if (score <= 75) return 'bg-warn/12 border-warn/30';
    return 'bg-bad/12 border-bad/30';
  };

  return (
    <section className='space-y-5'>
      <div className='bg-surface border border-line rounded-xl p-5 shadow-sm'>
        <p className='text-sm text-muted'>IP Reputation</p>
        <h2 className='text-2xl font-semibold text-ink mt-1'>AbuseIPDB Check</h2>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="h-11 w-full px-4 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:outline-none"
            placeholder="IP address or domain name"
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
          <p className="text-muted text-sm">Enter an IP or hostname to check its abuse reputation.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-ink">Report for {data.ip}</h3>
              {data.query !== data.ip && (
                <span className="text-sm text-muted">Resolved from: {data.query}</span>
              )}
            </div>

            <div className={`rounded-xl border p-5 ${scoreBg(data.abuse_confidence_score)}`}>
              <p className="text-sm text-muted font-medium">Abuse Confidence Score</p>
              <p className={`text-4xl font-bold mt-1 ${scoreColor(data.abuse_confidence_score)}`}>
                {data.abuse_confidence_score}%
              </p>
              <p className="text-xs text-muted mt-1">
                {data.abuse_confidence_score === 0
                  ? 'No abuse reports — this IP looks clean.'
                  : data.abuse_confidence_score <= 25
                  ? 'Low risk — few reports filed.'
                  : data.abuse_confidence_score <= 75
                  ? 'Moderate risk — some abuse activity reported.'
                  : 'High risk — significant abuse activity detected.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard label="ISP" value={data.isp} />
              <InfoCard label="Domain" value={data.domain} />
              <InfoCard label="Country" value={data.country_code} />
              <InfoCard label="Usage Type" value={data.usage_type} />
              <InfoCard label="Total Reports" value={data.total_reports} />
              <InfoCard label="Distinct Reporters" value={data.num_distinct_users} />
              <InfoCard label="Last Reported" value={data.last_reported_at || 'Never'} />
              <InfoCard label="Whitelisted" value={data.is_whitelisted ? 'Yes' : 'No'} />
              <InfoCard label="Public IP" value={data.is_public ? 'Yes' : 'No'} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5">{value ?? '—'}</p>
    </div>
  );
}
