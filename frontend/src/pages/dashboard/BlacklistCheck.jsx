import React, { useState } from 'react';
import { checkBlacklist } from '../../services/blacklist/checkService';
import ResultTableQuick from '../../components/blacklist/ResultTableQuick';

export default function BlacklistCheck() {
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setError('');
      if (hostname) {
        const result = await checkBlacklist(hostname);
        setData(result);
      }
    } catch (error) {
      setData(null);
      setError(error.message || 'Failed to run blacklist check.');
      console.log('Failed to check blacklist: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlacklistCheck = async () => {
    if (!hostname.trim()) {
      setError('Enter a hostname or IPv4 address.');
      return;
    }
    setLoading(true);
    fetchData();
  };

  return (
    <section className='space-y-5'>
      <div className='bg-surface border border-line rounded-xl p-5 shadow-sm'>
        <p className='text-sm text-muted'>Quick Probe</p>
        <h2 className='text-2xl font-semibold text-ink mt-1'>Blacklist Check</h2>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            className="h-11 w-full px-4 rounded-xl border border-line focus:ring-2 focus:ring-accent focus:outline-none"
            placeholder="IP address or domain name"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBlacklistCheck()}
          />
          <button
            className={`h-11 px-6 rounded-xl font-medium ${loading ? 'bg-surface-2 text-muted' : 'bg-accent hover:brightness-110 text-white'} transition-colors`}
            onClick={handleBlacklistCheck}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Run Check'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 shadow-sm">
        {!data ? (
          <p className="text-muted text-sm">Run a check to view provider-level status.</p>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-ink">Report for {hostname}</h3>
            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <ResultTableQuick data={data} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
