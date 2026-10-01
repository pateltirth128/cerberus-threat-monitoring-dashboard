import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

const CHECK_TOGGLES = [
  { name: "check_blacklist", label: "Blacklist (DNSBL)" },
  { name: "check_abuseipdb", label: "AbuseIPDB" },
  { name: "check_dns", label: "DNS Records" },
  { name: "check_ssl", label: "SSL Certificate" },
  { name: "check_whois", label: "WHOIS Lookup" },
  { name: "check_email_security", label: "SPF/DKIM/DMARC" },
  { name: "check_server_status", label: "Server Status" },
];

const initialForm = {
  cidr: "",
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
};

export default function CidrImportDialog({ isOpen, setIsOpen, onImport }) {
  const [form, setForm] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onImport(form);
      setForm({ ...initialForm });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  let hostCount = 0;
  try {
    const parts = form.cidr.split("/");
    if (parts.length === 2) {
      const prefix = parseInt(parts[1], 10);
      if (prefix >= 24 && prefix <= 32) {
        hostCount = Math.max(0, Math.pow(2, 32 - prefix) - 2);
      }
    }
  } catch {  }

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={() => setIsOpen(false)}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-4"
          >
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-surface shadow-xl rounded-xl border border-line ">
              <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-ink ">
                CIDR Import
              </Dialog.Title>
              <p className="mt-1 text-sm text-muted ">
                Import an IP range as monitored assets. Max /24 (254 hosts).
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink ">CIDR Range</label>
                  <input
                    type="text"
                    name="cidr"
                    value={form.cidr}
                    onChange={handleChange}
                    placeholder="192.168.1.0/24"
                    className="mt-1 p-2.5 w-full border border-line rounded-lg focus:ring-2 focus:ring-accent focus:outline-none "
                  />
                  {hostCount > 0 && (
                    <p className="mt-1 text-xs text-muted ">
                      This will create <span className="font-semibold text-accent">{hostCount}</span> asset{hostCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink ">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Optional description for all imported IPs"
                    className="mt-1 p-2.5 w-full border border-line rounded-lg focus:ring-2 focus:ring-accent focus:outline-none "
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-ink mb-2">Checks to Run</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CHECK_TOGGLES.map((toggle) => (
                      <label key={toggle.name} className="flex items-center gap-2 p-2 rounded-lg border border-line hover:bg-surface-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name={toggle.name}
                          checked={form[toggle.name] || false}
                          onChange={handleChange}
                          className="rounded border-line"
                        />
                        <span className="text-sm text-ink ">{toggle.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="is_monitor_enabled" checked={form.is_monitor_enabled} onChange={handleChange} className="rounded border-line" />
                    <span className="text-sm font-medium text-ink ">Enable Monitoring</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="is_alert_enabled" checked={form.is_alert_enabled} onChange={handleChange} className="rounded border-line" />
                    <span className="text-sm font-medium text-ink ">Enable Alerts</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="bg-surface-2 text-ink py-2 px-4 rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-50"
                    onClick={() => setIsOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="bg-accent hover:brightness-110 text-white py-2 px-5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 min-w-[120px] justify-center"
                    disabled={!form.cidr.trim() || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      'Import'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
