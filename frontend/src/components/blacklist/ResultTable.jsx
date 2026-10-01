import React, { useState } from 'react';
import providerFields from './delist/constant';
import DelistModal from './delist/DelistModal';

const ResultTable = ({ data }) => {
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

  const getProviderStatus = (provider) => {
    const detectedProvider = detectedList.find((item) => item.provider === provider);
    return detectedProvider ? detectedProvider.status : 'unknown';
  };

  const [selectedProvider, setSelectedProvider] = useState(null);
  const handleDelist = (provider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = () => {
    setSelectedProvider(null);
    setIsModalOpen(false);
  };

  const modalFields = selectedProvider ? providerFields[selectedProvider] : [];

  return (
    <div className="scrollable-table overflow-auto max-h-[70vh] rounded-lg border border-line">
      <table className="w-full text-ink border-collapse">
        <thead className="sticky top-0 bg-surface-2">
          <tr className="text-left border-b border-line">
            <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Provider</th>
            <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Status</th>
            <th className="px-4 py-3 text-xs uppercase tracking-wide text-muted">Action</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((provider, index) => (
            <tr key={index} className="border-b border-line hover:bg-surface-2/60">
              <td className="px-4 py-2.5 font-medium">{provider}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isBlacklisted(provider) ? 'bg-bad/12 text-bad' : 'bg-ok/12 text-ok'}`}>
                  {isBlacklisted(provider) ? 'Blacklisted' : 'Clear'}
                </span>
              </td>
              <td className="px-4 py-2.5">
                {isBlacklisted(provider) ? (
                  getProviderStatus(provider) === 'open' ? (
                    <button
                      className="bg-bad hover:brightness-110 text-white font-semibold py-1 px-4 rounded-lg transition-colors"
                      onClick={() => handleDelist(provider)}
                    >
                      Delist
                    </button>
                  ) : (
                    <button className="text-muted cursor-not-allowed py-0.5 px-4 rounded" disabled>
                      Delist request sent
                    </button>
                  )
                ) : (
                  ''
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DelistModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        provider={selectedProvider}
        data={data}
        fields={modalFields}
      />
    </div>
  );
};

export default ResultTable;
