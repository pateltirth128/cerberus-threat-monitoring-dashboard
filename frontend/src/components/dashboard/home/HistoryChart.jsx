import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

const token = (name, alpha = 1) => {
  if (typeof window === 'undefined') return '#b0263a';
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `rgb(${v} / ${alpha})` : '#b0263a';
};

export default function HistoryChart({ hostnameId, hostname }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`/api/hostname/${hostnameId}/history/`);
        const history = response.data.history || [];
        setData(
          history.map((h) => ({
            date: h.date ? new Date(h.date).toLocaleDateString() : '',
            detected: h.detected_count,
            total: h.total_providers,
          }))
        );
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (hostnameId) fetchHistory();
  }, [hostnameId]);

  const Shell = ({ children }) => (
    <div className="card p-4">
      <h4 className="text-sm font-semibold text-ink mb-3">
        Blacklist History — <span className="font-mono text-muted">{hostname}</span>
      </h4>
      {children}
    </div>
  );

  if (loading) return <Shell><p className="text-sm text-muted">Loading chart…</p></Shell>;
  if (data.length === 0) return <Shell><p className="text-sm text-muted">No history data available.</p></Shell>;

  return (
    <Shell>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={token('--line')} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: token('--faint') }} stroke={token('--line')} />
          <YAxis tick={{ fontSize: 11, fill: token('--faint') }} stroke={token('--line')} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: token('--surface-2', 0.5) }}
            contentStyle={{
              borderRadius: '10px',
              fontSize: '12px',
              background: token('--surface'),
              border: `1px solid ${token('--line-strong')}`,
              color: token('--ink'),
            }}
            labelStyle={{ color: token('--muted') }}
          />
          <Bar dataKey="detected" name="Detected" fill={token('--bad')} radius={[4, 4, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </Shell>
  );
}
