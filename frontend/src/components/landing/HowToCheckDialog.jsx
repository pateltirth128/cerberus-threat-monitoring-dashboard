import React, { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';
import CopyButton from '../shared/CopyButton';

const STEPS = [
  {
    title: 'Open Command Prompt',
    body: (
      <>
        Press <span className='chip'>Win + R</span>, type <span className='chip'>cmd</span> and press Enter.
        On Mac or Linux, open Terminal.
      </>
    ),
  },
  {
    title: 'Run this command',
    command: 'curl ifconfig.me',
  },
  {
    title: 'Paste the result and check',
    body: (
      <>
        It prints a number like <span className='chip'>203.0.113.25</span>. That is your public IP.
        Paste it in the box and click <span className='text-ink font-medium'>Check now</span>.
      </>
    ),
  },
];

/** Small popup explaining how to find an IP to check. */
export default function HowToCheckDialog({ open, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      aria-labelledby='how-to-check-title'
      className='w-[calc(100%-2rem)] max-w-md p-0 rounded-xl border border-line bg-surface text-ink text-left shadow-lift backdrop:bg-black/60 backdrop:backdrop-blur-sm'
    >
      <div className='flex items-center justify-between px-5 py-4 border-b border-line'>
        <h2 id='how-to-check-title' className='text-base font-semibold'>How to check your IP</h2>
        <button
          onClick={onClose}
          aria-label='Close'
          className='p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors'
        >
          <HiX className='text-lg' />
        </button>
      </div>

      <ol className='px-5 py-5 space-y-5'>
        {STEPS.map((step, i) => (
          <li key={step.title} className='flex gap-4'>
            <span className='flex-none h-7 w-7 grid place-items-center rounded-full bg-accent/15 text-accent font-mono text-xs font-semibold'>
              {i + 1}
            </span>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium text-ink'>{step.title}</p>
              {step.body ? <p className='mt-1 text-sm text-muted leading-relaxed'>{step.body}</p> : null}
              {step.command ? (
                <div className='mt-2 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2'>
                  <code className='font-mono text-sm text-ink'>{step.command}</code>
                  <CopyButton text={step.command} />
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </dialog>
  );
}
