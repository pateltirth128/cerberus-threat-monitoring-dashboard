import { HiMail } from 'react-icons/hi';
import { FaGithub, FaLinkedin, FaDiscord } from 'react-icons/fa';
import { PROFILE } from '../../config/profile';

const iconLink =
  'h-8 w-8 grid place-items-center rounded-lg border border-line text-muted hover:text-ink hover:border-line-strong hover:bg-surface-2 transition-colors';

export default function CreditFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className='border-t border-line bg-surface/60 backdrop-blur-sm'>
      <div className='max-w-6xl mx-auto px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <img src='/logo.png' alt='' className='h-7 w-7 rounded-lg object-cover ring-1 ring-line' />
          <p className='text-sm text-muted'>
            <span className='font-semibold text-ink'>Cerberus</span>
            <span className='mx-2 text-faint'>·</span>
            by <span className='text-ink font-medium'>{PROFILE.name}</span>
            <span className='mx-2 text-faint'>·</span>
            <span className='text-faint'>© {year}</span>
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <a className={iconLink} href={PROFILE.github} target='_blank' rel='noreferrer' title='GitHub' aria-label='GitHub'>
            <FaGithub />
          </a>
          <a className={iconLink} href={PROFILE.linkedin} target='_blank' rel='noreferrer' title='LinkedIn' aria-label='LinkedIn'>
            <FaLinkedin />
          </a>
          <a className={iconLink} href={PROFILE.discord} target='_blank' rel='noreferrer' title='Discord' aria-label='Discord'>
            <FaDiscord />
          </a>
          <a className={iconLink} href={`mailto:${PROFILE.email}`} title={PROFILE.email} aria-label='Email'>
            <HiMail />
          </a>
        </div>
      </div>
    </footer>
  );
}
