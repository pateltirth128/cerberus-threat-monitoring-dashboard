import React, { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

const REPO_URL = 'https://github.com/pateltirth128/cerberus-threat-monitoring-dashboard';

const Section = ({ title, children }) => (
  <section className='py-5 border-t border-line first:border-t-0 first:pt-0'>
    <h3 className='text-sm font-semibold text-ink'>{title}</h3>
    <div className='mt-2 text-sm text-muted leading-relaxed space-y-2'>{children}</div>
  </section>
);

const Code = ({ children }) => (
  <pre className='mt-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs text-ink overflow-x-auto'>
    {children}
  </pre>
);

/**
 * "How to use Cerberus" help window.
 * Uses the native <dialog> element, so Esc closes it and focus stays inside.
 */
export default function HelpDialog({ open, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Close when clicking the dark area outside the window.
  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby='help-title'
      className='w-[calc(100%-2rem)] max-w-xl max-h-[85vh] p-0 rounded-xl border border-line bg-surface text-ink shadow-lift backdrop:bg-black/60 backdrop:backdrop-blur-sm'
    >
      <div className='flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-surface'>
        <h2 id='help-title' className='text-base font-semibold'>How to use Cerberus</h2>
        <button
          onClick={onClose}
          aria-label='Close'
          className='p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors'
        >
          <HiX className='text-lg' />
        </button>
      </div>

      <div className='px-6 py-5 overflow-y-auto max-h-[calc(85vh-4rem)]'>
        <Section title='What is it?'>
          <p>
            Cerberus checks whether a domain or IP address is listed on public spam blacklists
            (called DNSBLs). Mail servers use these lists to block email, so a single listing can
            send your messages straight to spam. It also checks your domain's email security
            (SPF, DKIM and DMARC).
          </p>
        </Section>

        <Section title='Quick check (no account needed)'>
          <ol className='list-decimal pl-5 space-y-3'>
            <li>
              Type a domain or IP on the home page.
              <div className='mt-2 rounded-lg border border-line p-3 space-y-2'>
                <p>
                  Don't know one? Find it in Command Prompt: press <span className='chip'>Win + R</span>,
                  type <span className='chip'>cmd</span> and press Enter (on Mac or Linux, open Terminal).
                </p>
                <p className='text-ink font-medium'>Your own public IP address:</p>
                <Code>curl ifconfig.me</Code>
                <p>Copy the number it prints (like <span className='chip'>203.0.113.25</span>) into the box.</p>
                <p className='text-ink font-medium'>The IP address behind a website:</p>
                <Code>nslookup gmail.com</Code>
                <p>Copy an <span className='chip'>Address</span> line under "Non-authoritative answer", or just type the domain itself.</p>
                <p className='text-ink font-medium'>A domain's mail servers (the best thing to check):</p>
                <Code>nslookup -type=mx gmail.com</Code>
                <p>Copy a <span className='chip'>mail exchanger</span> name into the box.</p>
              </div>
            </li>
            <li>Press <span className='text-ink font-medium'>Check now</span>.</li>
            <li>The report shows every blacklist provider and whether you are listed or clean.</li>
          </ol>
        </Section>

        <Section title='Dashboard (after signing in)'>
          <ul className='space-y-1.5'>
            <li><span className='text-ink font-medium'>Assets</span> – add domains and IPs to check automatically on a schedule, with optional alerts.</li>
            <li><span className='text-ink font-medium'>Blacklist</span> – check one target, a list of targets, or a whole subnet (up to /24).</li>
            <li><span className='text-ink font-medium'>Lookups</span> – IP reputation (AbuseIPDB), WHOIS, DNS records, SSL certificate and server status.</li>
            <li><span className='text-ink font-medium'>Email</span> – test SPF / DKIM / DMARC and upload DMARC reports to see who sends mail as your domain.</li>
          </ul>
        </Section>

        <Section title='Run it on your own computer'>
          <p>With Docker:</p>
          <Code>{`git clone ${REPO_URL}
cd cerberus-threat-monitoring-dashboard
docker compose up --build`}</Code>
          <p>Then open <span className='chip'>http://localhost:3000</span>. The admin password is printed once in the backend log on first start.</p>
          <p>
            Full setup steps (including without Docker) are in the{' '}
            <a href={REPO_URL} target='_blank' rel='noreferrer' className='text-accent hover:underline'>
              README on GitHub
            </a>.
          </p>
        </Section>
      </div>
    </dialog>
  );
}
