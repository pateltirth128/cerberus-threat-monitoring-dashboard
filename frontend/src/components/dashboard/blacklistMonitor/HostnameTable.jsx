import React, { memo } from "react";
import { MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import { RiListSettingsLine } from "react-icons/ri";
import { HiEye, HiTrash, HiPencilAlt } from "react-icons/hi";
import { Transition, Menu } from "@headlessui/react";

const CHECK_BADGES = [
  { key: "check_blacklist", label: "BL" },
  { key: "check_abuseipdb", label: "ABUSE" },
  { key: "check_dns", label: "DNS" },
  { key: "check_ssl", label: "SSL" },
  { key: "check_whois", label: "WHOIS" },
  { key: "check_email_security", label: "DMARC" },
  { key: "check_server_status", label: "UP" },
];

const formatDateTime = (value) => {
  if (!value || value === "Not checked") return "Not checked";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

function HostnameTable({ hostnameListData, handleView, handleDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-ink border-collapse">
        <thead className="bg-surface-2 ">
          <tr className="text-left border-b border-line ">
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Hostname</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Type</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Checks</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Report</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Checked</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Monitor</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Alert</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Status</th>
            <th className="p-3 text-xs uppercase tracking-wide text-muted ">Action</th>
          </tr>
        </thead>
        <tbody>
          {hostnameListData.map((hostnameData) => (
            <tr key={hostnameData.id} className="border-b border-line hover:bg-surface-2/60 ">
              <td className="p-3">
                <p className="font-medium text-ink ">{hostnameData.hostname}</p>
                {hostnameData.description && (
                  <p className="text-xs text-faint mt-0.5">{hostnameData.description}</p>
                )}
              </td>
              <td className="p-3">
                <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium">{hostnameData.hostname_type}</span>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {CHECK_BADGES.filter(b => hostnameData[b.key]).map(b => (
                    <span key={b.key} className="inline-flex rounded bg-accent/10 text-accent px-1.5 py-0.5 text-[10px] font-bold">
                      {b.label}
                    </span>
                  ))}
                </div>
              </td>
              <td className={`p-3 ${hostnameData.result ? (hostnameData.is_blacklisted ? 'text-bad' : 'text-ok') : 'text-muted'}`}>
                <div className="text-sm">
                  {!hostnameData.result ? (
                    <p>Not checked</p>
                  ) : hostnameData.result.blacklist ? (
                    <p>Detected: {hostnameData.result.blacklist.detected_on?.length ?? 0} / {hostnameData.result.blacklist.providers?.length ?? 0}</p>
                  ) : hostnameData.result.detected_on ? (
                    <p>Detected: {hostnameData.result.detected_on?.length ?? 0} / {hostnameData.result.providers?.length ?? 0}</p>
                  ) : (
                    <p>Checked</p>
                  )}
                </div>
              </td>
              <td className="p-3 text-sm">{formatDateTime(hostnameData.checked)}</td>
              <td className="p-3 text-lg">
                {hostnameData.is_monitor_enabled ? <MdCheckBox className="text-ok" /> : <MdCheckBoxOutlineBlank className="text-faint" />}
              </td>
              <td className="p-3 text-lg">
                {hostnameData.is_alert_enabled ? <MdCheckBox className="text-ok" /> : <MdCheckBoxOutlineBlank className="text-faint" />}
              </td>
              <td className="p-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${hostnameData.status === 'active' ? 'bg-ok/12 text-ok' : 'bg-bad/12 text-bad'}`}>
                  {hostnameData.status}
                </span>
              </td>
              <td className="p-3 relative">
                <Menu>
                  {({ open }) => (
                    <>
                      <Menu.Button className="text-ink cursor-pointer text-ink ">
                        <RiListSettingsLine />
                      </Menu.Button>
                      <Transition
                        show={open}
                        enter="transition-opacity duration-75"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Menu.Items
                          static
                          className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-surface ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                        >
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleView(hostnameData)}
                                  className={`${active ? 'bg-surface-2 ' : ''} text-ink w-full text-left py-2 px-4 text-sm`}
                                >
                                  <div className="flex items-center"><HiEye className="mr-2" />View Report</div>
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  disabled
                                  className="text-ink w-full text-left py-2 px-4 text-sm cursor-not-allowed opacity-60"
                                >
                                  <div className="flex items-center"><HiPencilAlt className="mr-2" />Edit</div>
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => handleDelete(hostnameData.id)}
                                  className={`${active ? 'bg-surface-2 ' : ''} text-ink w-full text-left py-2 px-4 text-sm`}
                                >
                                  <div className="flex items-center"><HiTrash className="mr-2" />Delete</div>
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(HostnameTable);
