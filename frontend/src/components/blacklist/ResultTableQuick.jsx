import React from 'react';

const ResultTableQuick = ({ data }) => {
  const providerList = data?.providers || [];
  const detectedList = data?.detected_on || [];

  const providers = [...providerList].sort((a, b) => {
    const isBlacklistedA = detectedList.some((item) => item.provider === a);
    const isBlacklistedB = detectedList.some((item) => item.provider === b);

    return isBlacklistedB - isBlacklistedA;
  });

  const isBlacklisted = (provider) => {
    return detectedList.some((item) => item.provider === provider);
  };

  const failedList = data?.failed_providers || [];
  const statusOf = (provider) => {
    if (isBlacklisted(provider)) return { label: 'Listed', className: 'bg-bad/12 text-bad' };
    if (failedList.includes(provider)) return { label: 'No answer', className: 'bg-surface-2 text-faint' };
    return { label: 'Clean', className: 'bg-ok/12 text-ok' };
  };

  const abuse = data.abuseipdb;

  const scoreColor = (score) => {
    if (score == null) return 'text-muted';
    if (score === 0) return 'text-ok';
    if (score <= 25) return 'text-warn';
    if (score <= 75) return 'text-warn';
    return 'text-bad';
  };

  const scoreBg = (score) => {
    if (score == null) return 'bg-surface-2 border-line';
    if (score === 0) return 'bg-ok/12 border-ok/30';
    if (score <= 25) return 'bg-warn/12 border-warn/30';
    if (score <= 75) return 'bg-warn/12 border-warn/30';
    return 'bg-bad/12 border-bad/30';
  };

  return (
    <div className="space-y-4">
      {abuse && (
        <div className={`rounded-xl border p-4 ${scoreBg(abuse.abuse_confidence_score)}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted font-medium">AbuseIPDB Score</p>
              <p className={`text-3xl font-bold mt-1 ${scoreColor(abuse.abuse_confidence_score)}`}>
                {abuse.abuse_confidence_score}%
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <p className="text-xs text-muted">ISP</p>
                <p className="font-medium text-ink">{abuse.isp || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Country</p>
                <p className="font-medium text-ink">{abuse.country_code || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Reports</p>
                <p className="font-medium text-ink">{abuse.total_reports ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Last Reported</p>
                <p className="font-medium text-ink">{abuse.last_reported_at || 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="scrollable-table overflow-auto max-h-[70vh]">
        <table className="w-full text-ink border-collapse">
          <thead className="sticky top-0 bg-surface-2">
            <tr className="text-left border-b border-line">
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Provider</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Status</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider, index) => (
              <tr key={index} className="border-b border-line hover:bg-surface-2/60">
                <td className="px-4 py-2.5 font-mono text-sm">{provider}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusOf(provider).className}`}>
                    {statusOf(provider).label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultTableQuick;
