import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlusCircle, HiShieldCheck, HiShieldExclamation, HiExternalLink, HiTrash, HiSearch, HiCloudUpload } from 'react-icons/hi';
import HostnameService from "../../services/hostname";
import { useAuth } from "../../services/auth/authProvider";
import AddNewMonitorDialog from "../../components/dashboard/blacklistMonitor/AddNewMonitorDialog";
import CidrImportDialog from "../../components/dashboard/blacklistMonitor/CidrImportDialog";
import { AssetCardSkeleton } from "../../components/shared/Skeleton";
import AutoRefresh from "../../components/shared/AutoRefresh";
import TimeAgo from "../../components/shared/TimeAgo";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CHECK_BADGE_MAP = {
  check_blacklist: 'BL',
  check_abuseipdb: 'ABUSE',
  check_dns: 'DNS',
  check_ssl: 'SSL',
  check_whois: 'WHOIS',
  check_email_security: 'DMARC',
  check_server_status: 'UP',
};

const initialFormData = {
  hostname_type: "",
  hostname: "",
  description: "",
  is_alert_enabled: false,
  is_monitor_enabled: false,
  check_blacklist: true,
  check_abuseipdb: false,
  check_dns: false,
  check_ssl: false,
  check_whois: false,
  check_email_security: false,
  check_server_status: false,
  check_interval_minutes: null,
};

export default function Assets() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [cidrModalOpen, setCidrModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({ ...initialFormData });
  const hostnameService = HostnameService();
  const [hostnameListData, setHostnameListData] = useState([]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await hostnameService.createHostname(formData);
      if (result.status === 'active') {
        toast.success(`Added ${formData.hostname}`);
        setFormData({ ...initialFormData });
        setAddModalOpen(false);
        fetchHostnameList();
      }
    } catch {
      toast.error("Failed to create asset. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHostnameList = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const listData = await hostnameService.listHostname();
      setHostnameListData(listData);
    } catch {
      setErrorMessage("Failed to retrieve assets.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { if (token) fetchHostnameList(); }, [token, fetchHostnameList]);

  const handleDelete = async (e, id, hostname) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${hostname}"?`)) return;
    try {
      const result = await hostnameService.deleteHostname(id);
      if (result.status === 204) {
        toast.success(`Deleted ${hostname}`);
        fetchHostnameList();
      }
    } catch {
      toast.error('Failed to delete asset.');
    }
  };

  const handleCidrImport = async (cidrData) => {
    try {
      const result = await hostnameService.importCidr(cidrData);
      toast.success(`Imported ${result.created} asset${result.created !== 1 ? 's' : ''}${result.skipped > 0 ? `, ${result.skipped} skipped (already exist)` : ''}`);
      if (result.errors?.length > 0) {
        toast.warn(`${result.errors.length} error(s) during import`);
      }
      setCidrModalOpen(false);
      fetchHostnameList();
      return result;
    } catch (error) {
      const detail = error.response?.data?.detail || "Failed to import CIDR range.";
      toast.error(detail);
      throw error;
    }
  };

  const filtered = hostnameListData.filter((item) => {
    const matchSearch = !search || item.hostname.toLowerCase().includes(search.toLowerCase()) || item.hostname_type.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'listed') return item.is_blacklisted;
    if (filterStatus === 'clean') return !item.is_blacklisted;
    return true;
  });

  return (
    <section className="space-y-5">
      <div className="bg-surface border border-line rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted ">Monitor</p>
          <h2 className="text-2xl font-semibold text-ink ">Assets</h2>
          <p className="text-sm text-muted mt-1">
            {hostnameListData.length} asset{hostnameListData.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AutoRefresh onRefresh={fetchHostnameList} loading={isLoading} />
          <button
            className="bg-surface-2 hover:bg-surface-2 text-ink py-2.5 px-4 flex items-center gap-2 rounded-xl transition-colors font-medium text-sm"
            onClick={() => setCidrModalOpen(true)}
          >
            <HiCloudUpload className="text-lg" /> CIDR Import
          </button>
          <button
            className="bg-accent hover:brightness-110 text-white py-2.5 px-5 flex items-center gap-2 rounded-xl transition-colors font-medium"
            onClick={() => setAddModalOpen(true)}
          >
            <HiOutlinePlusCircle className="text-lg" /> Add Asset
          </button>
        </div>
      </div>

      {hostnameListData.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-line rounded-xl bg-surface text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-1 bg-surface-2 rounded-xl p-1 border border-line ">
            {[
              { key: 'all', label: 'All' },
              { key: 'clean', label: 'Clean' },
              { key: 'listed', label: 'Listed' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.key ? 'bg-surface text-ink shadow-sm' : 'text-muted text-ink '}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => <AssetCardSkeleton key={i} />)}
        </div>
      ) : errorMessage ? (
        <div className="bg-bad/12 border border-bad/30 rounded-xl p-4 text-sm text-bad ">{errorMessage}</div>
      ) : hostnameListData.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-12 text-center shadow-sm">
          <div className="text-faint text-5xl mb-4">
            <HiShieldCheck className="mx-auto" />
          </div>
          <p className="text-muted font-medium">No assets yet</p>
          <p className="text-sm text-muted mt-1">Add a domain or IP to start monitoring.</p>
          <button
            className="mt-4 bg-accent hover:brightness-110 text-white py-2 px-5 rounded-xl text-sm font-medium transition-colors"
            onClick={() => setAddModalOpen(true)}
          >
            Add Your First Asset
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center shadow-sm">
          <HiSearch className="text-4xl text-faint mx-auto mb-3" />
          <p className="text-muted text-sm">No assets match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const bl = item.result?.blacklist || (item.result?.detected_on ? item.result : null);
            const detectedCount = bl?.detected_on?.length ?? 0;
            const totalProviders = bl?.providers?.length ?? 0;
            const enabledChecks = Object.entries(CHECK_BADGE_MAP).filter(([key]) => item[key]).map(([, label]) => label);

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/dashboard/assets/${item.id}`)}
                className="bg-surface border border-line rounded-xl p-5 shadow-sm hover:shadow-md hover:border-accent transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.is_blacklisted ? 'bg-bad/12 text-bad ' : 'bg-ok/12 text-ok '}`}>
                      {item.is_blacklisted ? <HiShieldExclamation className="text-xl" /> : <HiShieldCheck className="text-xl" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink truncate">{item.hostname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-faint ">{item.hostname_type}</span>
                        <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${item.status === 'active' ? 'bg-ok/12 text-ok ' : 'bg-surface-2 text-muted'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(e, item.id, item.hostname)}
                      className="p-1.5 rounded-lg text-faint hover:text-bad hover:bg-bad/12 transition-colors"
                      title="Delete"
                    >
                      <HiTrash />
                    </button>
                    <HiExternalLink className="text-faint" />
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-muted mt-2 truncate">{item.description}</p>
                )}

                <div className="mt-4">
                  {!item.result ? (
                    <p className="text-xs text-faint">Not checked yet</p>
                  ) : (
                    <span className={`text-sm font-semibold ${detectedCount > 0 ? 'text-bad ' : 'text-ok '}`}>
                      {detectedCount > 0 ? `Listed on ${detectedCount} of ${totalProviders}` : totalProviders > 0 ? `Clear on ${totalProviders} providers` : 'Checked'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line ">
                  <div className="flex flex-wrap gap-1">
                    {enabledChecks.map((label) => (
                      <span key={label} className="inline-flex rounded bg-surface-2 text-muted px-1.5 py-0.5 text-[10px] font-bold">{label}</span>
                    ))}
                  </div>
                  <TimeAgo date={item.checked} className="text-[10px] text-faint flex-shrink-0 ml-2" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddNewMonitorDialog
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isOpen={addModalOpen}
        setIsOpen={setAddModalOpen}
        submitting={submitting}
      />

      <CidrImportDialog
        isOpen={cidrModalOpen}
        setIsOpen={setCidrModalOpen}
        onImport={handleCidrImport}
      />

      <ToastContainer position="top-center" autoClose={3000} />
    </section>
  );
}
