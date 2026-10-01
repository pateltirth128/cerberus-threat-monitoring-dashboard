import React, { useState } from 'react';
import Typed from 'react-typed';
import { HiSparkles, HiStatusOnline, HiLightningBolt } from 'react-icons/hi';
import { checkBlacklist } from '../../services/blacklist/checkService';
import ResultTableQuick from '../blacklist/ResultTableQuick';

const Hero = () => {
  const [hostname, setHostname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);
  const [checkedTarget, setCheckedTarget] = useState('');

  const handleCheck = async () => {
    if (!hostname.trim()) return;
    const value = hostname.trim();
    setLoading(true);
    setError('');
    try {
      const result = await checkBlacklist(value);
      setReport(result);
      setCheckedTarget(value);
    } catch (err) {
      setReport(null);
      setError(err.message || 'Failed to check blacklist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className='max-w-6xl mx-auto px-4 py-16 lg:py-24'>
        <div className='grid lg:grid-cols-2 gap-10 items-center'>
          <div>
            <div className='inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent'>
              <HiSparkles /> Open-source DNSBL &amp; abuse monitoring
            </div>
            <h1 className='mt-6 text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.03] tracking-tight text-ink'>
              Catch blacklist risk before it hits your
              <span className='block text-accent'>
                <Typed
                  strings={['mail delivery', 'domain reputation', 'public services']}
                  typeSpeed={80}
                  backSpeed={40}
                  loop
                />
              </span>
            </h1>
            <p className='mt-6 text-muted text-base md:text-lg max-w-xl'>
              Cerberus continuously checks DNSBL providers and gives operators a clear, actionable view of blacklist status.
            </p>

            <div className='mt-8 flex flex-col sm:flex-row gap-3'>
              <input
                className='input sm:max-w-sm'
                type='text'
                placeholder='example.com or 8.8.8.8'
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              />
              <button
                className='btn-primary'
                onClick={handleCheck}
                disabled={!hostname.trim() || loading}
              >
                {loading ? 'Checking…' : 'Run Quick Check'}
              </button>
            </div>
            {error ? <p className='mt-3 text-sm text-bad'>{error}</p> : null}

            <div className='mt-10 flex gap-8 flex-wrap'>
              <div><div className='font-mono text-2xl font-bold text-ink'>60+</div><div className='text-xs text-faint'>DNSBL providers</div></div>
              <div><div className='font-mono text-2xl font-bold text-accent'>7</div><div className='text-xs text-faint'>check types</div></div>
              <div><div className='font-mono text-2xl font-bold text-ink'>/24</div><div className='text-xs text-faint'>subnet scans</div></div>
            </div>
          </div>

          <div className='card p-6'>
            <p className='label'>Why teams run it</p>
            <div className='mt-4 divide-y divide-line'>
              <div className='flex gap-3 py-3.5'>
                <div className='h-9 w-9 rounded-lg bg-accent/10 text-accent grid place-items-center flex-none'><HiStatusOnline /></div>
                <div>
                  <p className='font-medium text-ink'>Realtime provider coverage</p>
                  <p className='text-sm text-muted'>Dozens of DNSBL sources checked concurrently in one pass.</p>
                </div>
              </div>
              <div className='flex gap-3 py-3.5'>
                <div className='h-9 w-9 rounded-lg bg-accent/10 text-accent grid place-items-center flex-none'><HiLightningBolt /></div>
                <div>
                  <p className='font-medium text-ink'>Fast triage workflow</p>
                  <p className='text-sm text-muted'>Clear status summaries and provider-level detection details.</p>
                </div>
              </div>
              <div className='pt-4'>
                <div className='rounded-xl border border-line bg-surface-2 p-4'>
                  <p className='label'>Tip</p>
                  <p className='mt-1 text-sm text-muted'>First run? Your admin password is printed once in the backend log (<span className='chip'>docker compose logs backend</span>).</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {report ? (
          <div className='mt-10 card overflow-hidden'>
            <div className='flex items-center justify-between p-5 border-b border-line'>
              <h3 className='text-base font-semibold text-ink'>Blacklist Report: <span className='chip'>{checkedTarget}</span></h3>
            </div>
            <ResultTableQuick data={report} />
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Hero;
