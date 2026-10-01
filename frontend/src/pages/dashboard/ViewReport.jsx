import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultTable from '../../components/blacklist/ResultTable';

const CHECK_LABELS = {
  blacklist: 'Blacklist (DNSBL)',
  abuseipdb: 'AbuseIPDB',
  dns: 'DNS Records',
  ssl: 'SSL Certificate',
  whois: 'WHOIS Lookup',
  email_security: 'SPF / DKIM / DMARC',
  server_status: 'Server Status',
};

export default function ViewReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const hostnameData = location.state?.hostnameData;
  const [activeTab, setActiveTab] = useState('blacklist');

  if (!hostnameData) {
    return (
      <section className="bg-surface p-5 rounded-xl border border-line shadow-sm">
        <div className="rounded-xl border border-line p-4 text-center py-10">
          <p className="text-muted mb-4">No report data available. Please select a hostname from the monitor list.</p>
          <button
            className="text-sm font-medium text-accent hover:text-accent"
            onClick={() => navigate('/dashboard/assets')}
          >
            Go to Blacklist Monitor
          </button>
        </div>
      </section>
    );
  }

  const result = hostnameData.result || {};
  const isNewFormat = 'blacklist' in result || 'abuseipdb' in result || 'dns' in result || 'ssl' in result;
  const tabs = isNewFormat
    ? Object.keys(result).filter(k => k !== 'id' && k in CHECK_LABELS)
    : ['blacklist'];

  const getTabData = (tab) => {
    if (isNewFormat) return result[tab] || {};
    return result;
  };

  return (
    <section className="bg-surface p-5 rounded-xl border border-line shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted ">Report</p>
          <h1 className="text-2xl font-semibold text-ink ">{hostnameData.hostname}</h1>
        </div>
        <button
          className="text-sm font-medium text-accent hover:text-accent"
          onClick={() => navigate('/dashboard/assets')}
        >
          Back to Monitors
        </button>
      </div>

      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-line ">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                activeTab === tab
                  ? 'bg-surface text-accent border border-b-0 border-line '
                  : 'text-muted text-ink'
              }`}
            >
              {CHECK_LABELS[tab] || tab}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-line p-4">
        {activeTab === 'blacklist' && (
          <BlacklistPanel data={getTabData('blacklist')} />
        )}
        {activeTab === 'abuseipdb' && (
          <AbuseIPDBPanel data={getTabData('abuseipdb')} />
        )}
        {activeTab === 'dns' && (
          <DnsPanel data={getTabData('dns')} />
        )}
        {activeTab === 'ssl' && (
          <SslPanel data={getTabData('ssl')} />
        )}
        {activeTab === 'whois' && (
          <WhoisPanel data={getTabData('whois')} />
        )}
        {activeTab === 'email_security' && (
          <EmailSecurityPanel data={getTabData('email_security')} />
        )}
        {activeTab === 'server_status' && (
          <ServerStatusPanel data={getTabData('server_status')} />
        )}
      </div>
    </section>
  );
}

function BlacklistPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return <ResultTable data={data} />;
}

function AbuseIPDBPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-3">
      <Row label="Abuse Confidence Score" value={`${data.abuse_confidence_score}%`} />
      <Row label="ISP" value={data.isp} />
      <Row label="Country" value={data.country_code} />
      <Row label="Usage Type" value={data.usage_type} />
      <Row label="Domain" value={data.domain} />
      <Row label="Total Reports" value={data.total_reports} />
      <Row label="Last Reported" value={data.last_reported_at || 'Never'} />
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
        <div key={type}>
          <p className="text-xs font-bold uppercase text-muted mb-1">{type}</p>
          {values.map((v, i) => (
            <p key={i} className="text-sm font-mono text-ink pl-3 break-all">{v}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

function SslPanel({ data }) {
  if (!data || (data.error && !('valid' in data))) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-3">
      <Row label="Valid" value={data.valid ? 'Yes' : 'No'} />
      <Row label="Days Remaining" value={data.days_remaining} />
      <Row label="Not Before" value={data.not_before} />
      <Row label="Not After" value={data.not_after} />
      <Row label="Issuer" value={data.issuer?.common_name} />
      <Row label="Subject" value={data.subject?.common_name} />
      <Row label="Cipher" value={data.cipher?.name} />
      <Row label="Protocol" value={data.cipher?.protocol} />
      {data.error && <p className="text-sm text-warn ">{data.error}</p>}
    </div>
  );
}

function WhoisPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-3">
      {data.parsed && Object.entries(data.parsed).map(([key, value]) => (
        <Row key={key} label={key} value={Array.isArray(value) ? value.join(', ') : String(value ?? '—')} />
      ))}
      {data.raw && (
        <details className="mt-3">
          <summary className="text-sm font-medium text-accent cursor-pointer">Show raw WHOIS</summary>
          <pre className="bg-bg text-ink rounded-lg p-3 text-xs overflow-auto max-h-[50vh] whitespace-pre-wrap mt-2">{data.raw}</pre>
        </details>
      )}
    </div>
  );
}

function EmailSecurityPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-black text-ink ">{data.grade}</span>
        <span className="text-sm text-muted ">Score: {data.score} / {data.max_score}</span>
      </div>
      <RecordSection title="SPF" data={data.spf} />
      <RecordSection title="DKIM" data={data.dkim} />
      <RecordSection title="DMARC" data={data.dmarc} />
    </div>
  );
}

function RecordSection({ title, data }) {
  if (!data) return null;
  return (
    <div className={`rounded-lg border p-3 ${data.found ? 'border-ok/30 bg-ok/12/50 ' : 'border-bad/30 bg-bad/12/50 '}`}>
      <p className="text-sm font-semibold text-ink ">{title}: {data.found ? 'Found' : 'Missing'}</p>
      {data.record && <pre className="text-xs font-mono text-muted mt-1 break-all whitespace-pre-wrap">{data.record}</pre>}
      {data.policy && <p className="text-xs text-muted mt-1">Policy: {data.policy}</p>}
    </div>
  );
}

function ServerStatusPanel({ data }) {
  if (!data || data.error) return <ErrorMsg msg={data?.error} />;
  return (
    <div className="space-y-3">
      <Row label="IP Address" value={data.ip} />
      <Row label="DNS Resolved" value={data.dns_resolved ? 'Yes' : 'No'} />
      <Row label="HTTP Status" value={data.http_status} />
      <Row label="Response Time" value={data.response_time_ms ? `${data.response_time_ms}ms` : '—'} />
      {data.ports && Object.entries(data.ports).map(([port, open]) => (
        <Row key={port} label={`Port ${port}`} value={open ? 'Open' : 'Closed'} />
      ))}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm border-b border-line pb-2">
      <span className="text-muted ">{label}</span>
      <span className="font-medium text-ink text-right break-all max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return <p className="text-sm text-bad ">{msg || 'No data available for this check.'}</p>;
}
