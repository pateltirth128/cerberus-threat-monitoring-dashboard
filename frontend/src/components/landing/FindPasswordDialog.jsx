import React, { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';
import CopyButton from '../shared/CopyButton';

const Command = ({ children }) => (
  <div className='flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2'>
    <code className='font-mono text-sm text-ink break-all'>{children}</code>
    <CopyButton text={children} />
  </div>
);

const Step = ({ n, title, children }) => (
  <li className='flex gap-4'>
    <span className='flex-none h-7 w-7 grid place-items-center rounded-full bg-accent/15 text-accent font-mono text-xs font-semibold'>
      {n}
    </span>
    <div className='min-w-0 flex-1 space-y-2'>
      <p className='text-sm font-medium text-ink'>{title}</p>
      {children}
    </div>
  </li>
);

const Note = ({ children }) => <p className='text-xs text-faint leading-relaxed'>{children}</p>;

/** Popup on the login page: how to get the admin password from the backend. */
export default function FindPasswordDialog({ open, onClose }) {
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
      aria-labelledby='find-password-title'
      className='w-[calc(100%-2rem)] max-w-lg max-h-[85vh] p-0 rounded-xl border border-line bg-surface text-ink text-left shadow-lift backdrop:bg-black/60 backdrop:backdrop-blur-sm'
    >
      <div className='flex items-center justify-between px-5 py-4 border-b border-line'>
        <h2 id='find-password-title' className='text-base font-semibold'>Find your password</h2>
        <button
          type='button'
          onClick={onClose}
          aria-label='Close'
          className='p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors'
        >
          <HiX className='text-lg' />
        </button>
      </div>

      <div className='px-5 py-5 overflow-y-auto max-h-[calc(85vh-4rem)]'>
        <p className='text-sm text-muted'>
          Username is <span className='chip'>admin</span>. To get a password:
        </p>
        <ol className='mt-5 space-y-5'>
          <Step n='1' title='Stop the backend'>
            <p className='text-sm text-muted'>
              In the backend window press <span className='chip'>Ctrl + C</span>, then close it.
            </p>
          </Step>

          <Step n='2' title='Open PowerShell'>
            <p className='text-sm text-muted'>
              Press <span className='chip'>Win + R</span>, type <span className='chip'>powershell</span>, press Enter.
            </p>
          </Step>

          <Step n='3' title='Run these one by one'>
            <Command>cd C:\Projects\cerberus-threat-monitoring-dashboard\backend</Command>
            <Command>.\.venv\Scripts\Activate.ps1</Command>
            <Command>del app.db</Command>
            <Command>uvicorn app.main:app --reload</Command>
            <Note>Change the first path if Cerberus is saved somewhere else. <span className='chip'>del app.db</span> also clears saved data.</Note>
          </Step>

          <Step n='4' title='Copy the password'>
            <p className='text-sm text-muted'>
              Find <span className='text-ink font-medium'>Cerberus admin account created</span> in the window and
              copy the line after <span className='chip'>password:</span>. It is shown only once.
            </p>
          </Step>

          <Step n='5' title='Sign in'>
            <p className='text-sm text-muted'>
              Use <span className='chip'>admin</span> and that password. Keep the backend window open.
            </p>
          </Step>
        </ol>
      </div>
    </dialog>
  );
}
