import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi';
import Navbar from '../../components/landing/Navbar';
import CreditFooter from '../../components/shared/CreditFooter';
import ResultTableQuick from '../../components/blacklist/ResultTableQuick';
import HowToCheckDialog from '../../components/landing/HowToCheckDialog';
import { checkBlacklist } from '../../services/blacklist/checkService';
import { exportBlacklistCsv } from '../../services/tools';
import { SAMPLE_REPORT, SAMPLE_TARGET } from '../../services/blacklist/sampleReport';

function Summary({ report }) {
  const total = report.providers?.length || 0;
  const listed = report.detected_on?.length || 0;
  const noAnswer = report.failed_providers?.length || 0;

  const clean = listed === 0;
  const Icon = clean ? HiCheckCircle : HiExclamationCircle;

  return (
    <div className={`rounded-xl border p-5 flex gap-4 items-start ${clean ? 'border-ok/30 bg-ok/10' : 'border-bad/30 bg-bad/10'}`}>
      <Icon className={`flex-none text-2xl mt-0.5 ${clean ? 'text-ok' : 'text-bad'}`} aria-hidden='true' />
      <div>
        <p className={`text-lg font-semibold ${clean ? 'text-ok' : 'text-bad'}`}>
          {clean ? 'Clean' : `Listed on ${listed} of ${total} blacklists`}
        </p>
        <p className='mt-1 text-sm text-muted'>
          {clean
            ? `Not listed on any of the ${total} blacklists we checked.`
            : 'Mail from this address may be blocked or sent to spam. The listed providers are shown first below.'}
          {noAnswer > 0 ? ` ${noAnswer} provider${noAnswer > 1 ? 's' : ''} did not answer.` : ''}
        </p>
      </div>
    </div>
  );
}

const QuickCheck = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const target = (searchParams.get('hostname') || '').trim();

  const [input, setInput] = useState(target);
  const [report, setReport] = useState(null);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [howToOpen, setHowToOpen] = useState(false);

  const runCheck = useCallback(async (value) => {
    setLoading(true);
    setError('');
    setReport(null);
    setIsSample(false);
    try {
      setReport(await checkBlacklist(value));
    } catch (err) {
      if (err.offline) {
        setReport(SAMPLE_REPORT);
        setIsSample(true);
      } else {
        setError(err.message || 'The check failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Run a check whenever the ?hostname= in the address bar changes.
  useEffect(() => {
    setInput(target);
    if (target) runCheck(target);
  }, [target, runCheck]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    if (value === target) runCheck(value);
    else setSearchParams({ hostname: value });
  };

  return (
    <div className='landing-bg min-h-screen flex flex-col text-ink'>
      <Navbar />

      <main className='flex-1 px-4 py-12'>
        <div className='max-w-3xl mx-auto'>
          <h1 className='text-3xl font-bold tracking-tight'>Quick Check</h1>
          <p className='mt-2 text-muted'>Enter a domain or IP address to check it against spam blacklists.</p>

          <form className='mt-6 flex flex-col sm:flex-row gap-3' onSubmit={handleSubmit}>
            <label htmlFor='qc-target' className='sr-only'>Domain or IP address</label>
            <input
              id='qc-target'
              className='input flex-1 !py-3'
              type='text'
              placeholder='Enter your IP here'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type='submit' className='btn-primary !py-3 !px-6' disabled={!input.trim() || loading}>
              {loading ? 'Checking…' : 'Check now'}
            </button>
            {/* Only needed before a result is shown */}
            {!report && !loading ? (
              <button type='button' className='btn-ghost !py-3' onClick={() => setHowToOpen(true)}>
                How to check
              </button>
            ) : null}
          </form>
          <HowToCheckDialog open={howToOpen} onClose={() => setHowToOpen(false)} />

          <div className='mt-10' aria-live='polite'>
            {loading ? (
              <div className='card p-10 flex flex-col items-center gap-4 text-muted'>
                <div className='h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent' />
                <p className='text-sm'>Checking <span className='chip'>{target || input}</span> against 60 blacklists…</p>
              </div>
            ) : error ? (
              <div className='rounded-xl border border-bad/30 bg-bad/10 p-5 text-sm text-bad' role='alert'>{error}</div>
            ) : report ? (
              <div className='space-y-5'>
                {isSample ? (
                  <div className='rounded-xl border border-warn/30 bg-warn/10 p-4 flex gap-3 text-sm'>
                    <HiInformationCircle className='flex-none text-xl text-warn' aria-hidden='true' />
                    <p className='text-muted'>
                      <span className='font-semibold text-warn'>Sample result.</span> The live backend is offline,
                      so this is an example report for <span className='chip'>{SAMPLE_TARGET}</span>, not a real
                      check of <span className='chip'>{target}</span>. Run Cerberus locally to check real addresses.
                    </p>
                  </div>
                ) : null}

                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <p className='text-sm text-muted'>
                    Result for <span className='chip'>{isSample ? SAMPLE_TARGET : target}</span>
                  </p>
                  {!isSample ? (
                    <button className='text-sm font-medium text-accent hover:underline' onClick={() => exportBlacklistCsv(target)}>
                      Export CSV
                    </button>
                  ) : null}
                </div>

                <Summary report={report} />

                <div className='card overflow-hidden'>
                  <ResultTableQuick data={report} />
                </div>
              </div>
            ) : (
              <div className='card p-10 text-center text-sm text-muted'>
                Your result will appear here.
              </div>
            )}
          </div>
        </div>
      </main>

      <CreditFooter />
    </div>
  );
};

export default QuickCheck;
