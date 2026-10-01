import React, { useEffect, useState, useCallback } from "react";
import { HiBell, HiDesktopComputer, HiShieldCheck, HiExclamationCircle } from "react-icons/hi";
import StatGrid from "../../components/dashboard/home/StatGrid";
import HistoryChart from "../../components/dashboard/home/HistoryChart";
import { StatSkeleton } from "../../components/shared/Skeleton";
import AutoRefresh from "../../components/shared/AutoRefresh";
import HostnameService from "../../services/hostname";
import { useAuth } from "../../services/auth/authProvider";

export default function Home() {
  const { token } = useAuth();
  const hostnameService = HostnameService();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hostnames, setHostnames] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    monitoringEnabled: 0,
    alertEnabled: 0,
    blacklisted: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      setError("");
      const list = await hostnameService.listHostname();
      setHostnames(list);
      setStats({
        total: list.length,
        monitoringEnabled: list.filter((item) => item.is_monitor_enabled).length,
        alertEnabled: list.filter((item) => item.is_alert_enabled).length,
        blacklisted: list.filter((item) => item.result?.is_blacklisted).length,
      });
    } catch (err) {
      setError("Failed to load dashboard stats. Please check your connection.");
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadStats();
  }, [token, loadStats]);

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']");
    if (!link) return;
    link.href = stats.blacklisted > 0 ? '/favicon-alert.svg' : '/favicon.svg';
  }, [stats.blacklisted]);

  return (
    <section className="space-y-5">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="label">Overview</p>
          <h2 className="text-2xl font-semibold text-ink mt-1">Monitoring Summary</h2>
          <p className="text-muted mt-2 text-sm">Track your monitored assets and prioritize blacklist incidents.</p>
        </div>
        <AutoRefresh onRefresh={loadStats} loading={loading} />
      </div>

      {error ? (
        <div className="rounded-xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad">{error}</div>
      ) : loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <StatGrid title="Total Monitors" bodyText={stats.total} icon={<HiDesktopComputer />} tone="accent" />
            <StatGrid title="Monitoring Enabled" bodyText={stats.monitoringEnabled} icon={<HiShieldCheck />} tone="emerald" />
            <StatGrid title="Alert Enabled" bodyText={stats.alertEnabled} icon={<HiBell />} tone="amber" />
            <StatGrid title="Currently Blacklisted" bodyText={stats.blacklisted} icon={<HiExclamationCircle />} tone="rose" />
          </div>

          {hostnames.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                Check History
                <span className="chip">{hostnames.length}</span>
              </h3>
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                {hostnames.slice(0, 4).map((h) => (
                  <HistoryChart key={h.id} hostnameId={h.id} hostname={h.hostname} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
