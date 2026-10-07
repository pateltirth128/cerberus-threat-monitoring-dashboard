import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiRefresh, HiShieldCheck, HiShieldExclamation, HiClock, HiStatusOnline, HiDocumentReport } from 'react-icons/hi';
import axios from 'axios';
import HistoryChart from '../../components/dashboard/home/HistoryChart';
import ResultTable from '../../components/blacklist/ResultTable';
import { DetailSkeleton } from '../../components/shared/Skeleton';
import CopyButton from '../../components/shared/CopyButton';
import TimeAgo from '../../components/shared/TimeAgo';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CHECK_LABELS = {
  blacklist: { label: 'Blacklist', icon: HiShieldExclamation },
  abuseipdb: { label: 'AbuseIPDB', icon: HiShieldCheck },
  dns: { label: 'DNS Records', icon: HiStatusOnline },
  ssl: { label: 'SSL Certificate', icon: HiShieldCheck },
  whois: { label: 'WHOIS', icon: HiClock },
  email_security: { label: 'SPF/DKIM/DMARC', icon: HiShieldCheck },
  server_status: { label: 'Server Status', icon: HiStatusOnline },
  dmarc_reports: { label: 'DMARC Reports', icon: HiDocumentReport },
};

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [result, setResult] = useState(null);
  const [dmarcSummary, setDmarcSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(null);

  const fetchAsset = async () => {
    setLoading(true);
    setError('');
    try {
      const [assetRes, listRes] = await Promise.all([
        axios.get(`/api/hostname/${id}`, { headers: { Accept: 'application/json' } }),
        axios.get('/api/hostname/list/', { headers: { Accept: 'application/json' } }),
      ]);
      const assetData = assetRes.data;
      setAsset(assetData);

      const listItem = (listRes.data || []).find((h) => h.id === Number(id));
      if (listItem?.result) {
        setResult(listItem.result);
        const tabs = getAvailableTabs(listItem.result, assetData);
        if (tabs.length > 0 && !activeTab) setActiveTab(tabs[0]);
      }

      if (assetData.hostname_type === 'domain') {
        try {
          const dmarcRes = await axios.get(`/api/dmarc/summary/?domain=${encodeURIComponent(assetData.hostname)}`);
          setDmarcSummary(dmarcRes.data);
        } catch {
          setDmarcSummary(null);
        }
      }
    } catch (err) {
      setError('Failed to load asset details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecheck = async () => {
    setRechecking(true);
    try {
      await axios.post(`/api/hostname/${id}/recheck/`, {}, { headers: { Accept: 'application/json' } });
      toast.success('Re-check started');
      setTimeout(() => {
        fetchAsset().finally(() => setRechecking(false));
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to re-check');
      setRechecking(false);
    }
  };

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const getAvailableTabs = (data, assetData) => {
    if (!data) return [];
    const newFormatTabs = Object.keys(data).filter((k) => k !== 'id' && k in CHECK_LABELS);
    let tabs = newFormatTabs.length > 0 ? newFormatTabs : (data.providers || data.detected_on) ? ['blacklist'] : [];
    if ((assetData || asset)?.hostname_type === 'domain' && !tabs.includes('dmarc_reports')) {
      tabs = [...tabs, 'dmarc_reports'];
    }
    return tabs;
  };

  const getTabData = (tab) => {
    if (!result) return null;
    const tabs = getAvailableTabs(result);
    if (tabs.length > 0 && tabs[0] !== 'blacklist') return result[tab] || null;
    if (tab === 'blacklist' && (result.providers || result.detected_on)) return result;
    return result[tab] || null;
  };

  const tabs = result ? getAvailableTabs(result, asset) : (asset?.hostname_type === 'domain' ? ['dmarc_reports'] : []);

  if (loading) return <DetailSkeleton />;

  if (error || !asset) {
    return (
      <section className="bg-surface p-6 rounded-xl border border-line shadow-sm text-center py-16">
        <p className="text-muted mb-4">{error || 'Asset not found.'}</p>
        <button onClick={() => navigate('/dashboard/assets')} className="text-sm font-medium text-accent ">
          Back to Assets
        </button>
      </section>
    );
  }

  const enabledChecks = [
    asset.check_blacklist && 'BL',
    asset.check_abuseipdb && 'ABUSE',
    asset.check_dns && 'DNS',
    asset.check_ssl && 'SSL',
    asset.check_whois && 'WHOIS',
    asset.check_email_security && 'DMARC',
    asset.check_server_status && 'UP',
  ].filter(Boolean);

  return (
    <section className="space-y-5">
      <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/assets')}
              className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-muted "
            >
              <HiArrowLeft className="text-xl" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-ink ">{asset.hostname}</h1>
                <CopyButton text={asset.hostname} />
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${asset.status === 'active' ? 'bg-ok/12 text-ok ' : 'bg-bad/12 text-bad'}`}>
                  {asset.status}
                </span>
                <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted ">
                  {asset.hostname_type}
                </span>
              </div>
              {asset.description && (
                <p className="text-sm text-muted mt-1">{asset.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {enabledChecks.map((label) => (
                  <span key={label} className="inline-flex rounded bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold border border-accent ">
                    {label}
                  </span>
                ))}
                {asset.is_monitor_enabled && (
                  <span className="inline-flex rounded bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold border border-accent/30 ">
                    MONITORING
                  </span>
                )}
                {asset.is_alert_enabled && (
                  <span className="inline-flex rounded bg-warn/12 text-warn px-2 py-0.5 text-[10px] font-bold border border-warn/30 ">
                    ALERTS
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRecheck}
              disabled={rechecking}
              className="inline-flex items-center gap-2 bg-accent hover:brightness-110 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <HiRefresh className={rechecking ? 'animate-spin' : ''} />
              {rechecking ? 'Checking...' : 'Re-check Now'}
            </button>
            <div className="text-right">
              <p className="text-[10px] text-faint ">Created</p>
              <TimeAgo date={asset.created} className="text-xs text-muted " />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <SummaryCard
          label="Blacklisted"
          value={asset.is_blacklisted ? 'Yes' : 'No'}
          tone={asset.is_blacklisted ? 'rose' : 'emerald'}
        />
        <SummaryCard
          label="Checks Enabled"
          value={enabledChecks.length}
          tone="sky"
        />
        <SummaryCard
          label="Monitoring"
          value={asset.is_monitor_enabled ? 'Active' : 'Off'}
          tone={asset.is_monitor_enabled ? 'violet' : 'slate'}
        />
        <SummaryCard
          label="Alerts"
          value={asset.is_alert_enabled ? 'Active' : 'Off'}
          tone={asset.is_alert_enabled ? 'amber' : 'slate'}
        />
      </div>

      <HistoryChart hostnameId={asset.id} hostname={asset.hostname} />

      {tabs.length > 0 ? (
        <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="flex border-b border-line overflow-x-auto">
            {tabs.map((tab) => {
              const info = CHECK_LABELS[tab] || { label: tab };
              const Icon = info.icon || HiShieldCheck;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-accent text-accent bg-surface-2 '
                      : 'border-transparent text-muted text-ink hover:bg-surface-2 '
                  }`}
                >
                  <Icon className="text-base" />
                  {info.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {activeTab === 'blacklist' && <BlacklistPanel data={getTabData('blacklist')} />}
            {activeTab === 'abuseipdb' && <AbuseIPDBPanel data={getTabData('abuseipdb')} />}
            {activeTab === 'dns' && <DnsPanel data={getTabData('dns')} />}
            {activeTab === 'ssl' && <SslPanel data={getTabData('ssl')} />}
            {activeTab === 'whois' && <WhoisPanel data={getTabData('whois')} />}
            {activeTab === 'email_security' && <EmailSecurityPanel data={getTabData('email_security')} />}
            {activeTab === 'server_status' && <ServerStatusPanel data={getTabData('server_status')} />}
            {activeTab === 'dmarc_reports' && <DmarcReportsPanel domain={asset?.hostname} summary={dmarcSummary} />}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-xl p-8 text-center shadow-sm">
          <p className="text-muted ">No check results available yet. Click "Re-check Now" to run checks.</p>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} />
    </section>
  );
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    rose: 'bg-bad/12 border-bad/30 text-bad ',
    emerald: 'bg-ok/12 border-ok/30 text-ok ',
    sky: 'bg-info/12 border-info/30 text-info ',
    violet: 'bg-accent/12 border-accent/30 text-accent ',
    amber: 'bg-warn/12 border-warn/30 text-warn ',
    slate: 'bg-surface-2 border-line text-muted ',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-wide font-medium opacity-70">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  );
}

function BlacklistPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return <ResultTable data={data} />;
}

function AbuseIPDBPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  const score = data.abuse_confidence_score;
  const scoreColor = score === 0 ? 'text-ok' : score <= 25 ? 'text-warn' : score <= 75 ? 'text-warn' : 'text-bad';
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className={`text-4xl font-black ${scoreColor}`}>{score}%</span>
        <span className="text-sm text-muted ">Abuse Confidence Score</span>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <InfoCard label="ISP" value={data.isp} />
        <InfoCard label="Country" value={data.country_code} />
        <InfoCard label="Usage Type" value={data.usage_type} />
        <InfoCard label="Domain" value={data.domain} />
        <InfoCard label="Total Reports" value={data.total_reports} />
        <InfoCard label="Last Reported" value={data.last_reported_at || 'Never'} />
      </div>
    </div>
  );
}

function DnsPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  const records = data.records || {};
  if (Object.keys(records).length === 0) return <p className="text-sm text-muted">No records found.</p>;
  return (
    <div className="space-y-3">
      {Object.entries(records).map(([type, values]) => (
        <div key={type} className="rounded-lg border border-line overflow-hidden">
          <div className="bg-surface-2 px-4 py-2">
            <span className="text-xs font-bold uppercase text-muted ">{type}</span>
            <span className="text-xs text-faint ml-2">{values.length} record{values.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-line ">
            {values.map((v, i) => (
              <div key={i} className="px-4 py-2 text-sm font-mono text-ink break-all flex items-center justify-between">
                <span>{v}</span>
                <CopyButton text={v} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SslPanel({ data }) {
  if (!data || (data.error && !('valid' in data))) return <ErrorMsg msg={data?.error} />;
  const valid = data.valid;
  const days = data.days_remaining;
  return (
    <div className="space-y-4">
      <div className={`rounded-xl border p-4 ${valid ? (days < 30 ? 'border-warn/30 bg-warn/12 ' : 'border-ok/30 bg-ok/12 ') : 'border-bad/30 bg-bad/12 '}`}>
        <p className={`text-2xl font-bold ${valid ? (days < 30 ? 'text-warn ' : 'text-ok ') : 'text-bad '}`}>
          {valid ? `Valid — ${days} days remaining` : 'Expired / Invalid'}
        </p>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <InfoCard label="Issuer" value={data.issuer?.common_name} />
        <InfoCard label="Subject" value={data.subject?.common_name} />
        <InfoCard label="Not Before" value={data.not_before} />
        <InfoCard label="Not After" value={data.not_after} />
        <InfoCard label="Cipher" value={data.cipher?.name} />
        <InfoCard label="Protocol" value={data.cipher?.protocol} />
      </div>
      {data.san?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted mb-2">Subject Alternative Names</p>
          <div className="flex flex-wrap gap-1.5">
            {data.san.map((name, i) => (
              <span key={i} className="bg-surface-2 text-muted rounded-full px-2.5 py-0.5 text-xs font-mono">{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhoisPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-4">
      {data.parsed && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {Object.entries(data.parsed).map(([key, value]) => (
            <InfoCard key={key} label={key} value={Array.isArray(value) ? value.join(', ') : String(value ?? '—')} copyable />
          ))}
        </div>
      )}
      {data.raw && (
        <details>
          <summary className="text-sm font-medium text-accent cursor-pointer hover:underline">Show raw WHOIS</summary>
          <pre className="bg-bg text-ink rounded-xl p-4 text-xs overflow-auto max-h-[50vh] whitespace-pre-wrap mt-2">{data.raw}</pre>
        </details>
      )}
    </div>
  );
}

function EmailSecurityPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  const gradeColors = { A: 'text-ok', B: 'text-info', D: 'text-warn', F: 'text-bad' };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className={`text-5xl font-black ${gradeColors[data.grade] || 'text-muted'}`}>{data.grade}</span>
        <div>
          <p className="text-sm text-muted ">Email Security Grade</p>
          <p className="text-sm font-medium text-ink ">{data.score} / {data.max_score} checks passed</p>
        </div>
      </div>
      <div className="space-y-3">
        <RecordBlock title="SPF" data={data.spf} />
        <RecordBlock title="DKIM" data={data.dkim} />
        <RecordBlock title="DMARC" data={data.dmarc} />
      </div>
    </div>
  );
}

function RecordBlock({ title, data }) {
  if (!data) return null;
  return (
    <div className={`rounded-lg border p-4 ${data.found ? 'border-ok/30 bg-ok/12/50 ' : 'border-bad/30 bg-bad/12/50 '}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${data.found ? 'bg-ok/12 text-ok' : 'bg-bad/12 text-bad'}`}>
          {data.found ? 'FOUND' : 'MISSING'}
        </span>
        <span className="text-sm font-semibold text-ink ">{title}</span>
        {data.policy && <span className="text-xs text-muted ml-2">Policy: {data.policy}</span>}
      </div>
      {data.record && (
        <div className="flex items-start gap-2 mt-2">
          <pre className="text-xs font-mono text-muted break-all whitespace-pre-wrap bg-surface-2 rounded-lg p-2 flex-1">{data.record}</pre>
          <CopyButton text={data.record} className="mt-1" />
        </div>
      )}
      {data.warnings?.map((w, i) => (
        <p key={i} className="text-xs text-warn mt-1">Warning: {w}</p>
      ))}
    </div>
  );
}

function ServerStatusPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
      <InfoCard label="IP Address" value={data.ip} copyable />
      <InfoCard label="DNS Resolved" value={data.dns_resolved ? 'Yes' : 'No'} />
      <InfoCard label="HTTP Status" value={data.http_status} />
      <InfoCard label="Response Time" value={data.response_time_ms ? `${data.response_time_ms}ms` : '—'} />
      {data.ports && Object.entries(data.ports).map(([port, open]) => (
        <InfoCard key={port} label={`Port ${port}`} value={open ? 'Open' : 'Closed'} />
      ))}
    </div>
  );
}

function DmarcReportsPanel({ domain, summary }) {
  if (!summary) {
    return (
      <div className="text-center py-6">
        <HiDocumentReport className="text-4xl text-faint mx-auto mb-3" />
        <p className="text-sm text-muted ">No DMARC aggregate reports uploaded for this domain.</p>
        <a href="/dashboard/dmarc-reports" className="inline-block mt-3 text-sm font-medium text-accent hover:underline">
          Go to DMARC Reports to upload
        </a>
      </div>
    );
  }

  const { pass_rate, total_messages, disposition_breakdown, top_senders, report_count, date_range, policy } = summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <InfoCard label="Total Messages" value={total_messages?.toLocaleString()} />
        <InfoCard label="DKIM Aligned" value={`${pass_rate?.dkim ?? 0}%`} />
        <InfoCard label="SPF Aligned" value={`${pass_rate?.spf ?? 0}%`} />
        <InfoCard label="Overall Aligned" value={`${pass_rate?.aligned ?? 0}%`} />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <span className="bg-surface-2 rounded-lg px-3 py-1.5 text-sm font-mono text-ink ">p={policy?.p || 'none'}</span>
        <span className="text-xs text-muted ">
          {report_count} report{report_count !== 1 ? 's' : ''} &middot; {date_range?.earliest?.slice(0, 10)} to {date_range?.latest?.slice(0, 10)}
        </span>
      </div>

      {disposition_breakdown && Object.keys(disposition_breakdown).length > 0 && (
        <div className="flex gap-4">
          {Object.entries(disposition_breakdown).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-lg font-bold text-ink ">{val.toLocaleString()}</p>
              <p className="text-[10px] uppercase text-muted">{key}</p>
            </div>
          ))}
        </div>
      )}

      {top_senders?.length > 0 && (
        <div className="rounded-lg border border-line overflow-hidden">
          <div className="px-4 py-2 bg-surface-2 ">
            <p className="text-xs font-semibold uppercase text-muted ">Top Senders</p>
          </div>
          <div className="overflow-auto max-h-[30vh]">
            <table className="w-full text-sm text-ink border-collapse">
              <thead className="bg-surface-2 sticky top-0">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs uppercase text-muted">IP</th>
                  <th className="px-3 py-2 text-xs uppercase text-muted">Messages</th>
                  <th className="px-3 py-2 text-xs uppercase text-muted">DKIM</th>
                  <th className="px-3 py-2 text-xs uppercase text-muted">SPF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line ">
                {top_senders.slice(0, 10).map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-mono flex items-center gap-1">{s.ip} <CopyButton text={s.ip} /></td>
                    <td className="px-3 py-2">{s.count.toLocaleString()}</td>
                    <td className="px-3 py-2"><span className={s.dkim_rate >= 90 ? 'text-ok' : 'text-bad'}>{s.dkim_rate}%</span></td>
                    <td className="px-3 py-2"><span className={s.spf_rate >= 90 ? 'text-ok' : 'text-bad'}>{s.spf_rate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <a href="/dashboard/dmarc-reports" className="inline-block text-sm font-medium text-accent hover:underline">
        View all reports &rarr;
      </a>
    </div>
  );
}

function InfoCard({ label, value, copyable }) {
  return (
    <div className="rounded-lg border border-line p-3 bg-surface-2/50 ">
      <p className="text-[11px] uppercase tracking-wide text-muted font-medium">{label}</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-sm font-medium text-ink break-all">{value ?? '—'}</p>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="rounded-lg border border-bad/30 bg-bad/12 p-4">
      <p className="text-sm text-bad ">{msg || 'No data available for this check.'}</p>
    </div>
  );
}
