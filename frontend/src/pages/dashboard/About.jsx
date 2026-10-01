import { HiMail, HiExternalLink, HiShieldCheck, HiCode, HiHeart } from 'react-icons/hi';
import { FaGithub, FaLinkedin, FaDiscord } from 'react-icons/fa';

import { PROFILE } from '../../config/profile';

const LINKS = [
  { key: 'github', label: 'GitHub', href: PROFILE.github, icon: <FaGithub /> },
  { key: 'linkedin', label: 'LinkedIn', href: PROFILE.linkedin, icon: <FaLinkedin /> },
  { key: 'discord', label: 'Discord', href: PROFILE.discord, icon: <FaDiscord /> },
  { key: 'email', label: PROFILE.email, href: `mailto:${PROFILE.email}`, icon: <HiMail /> },
];

const FIXES = [
  { title: 'Forgeable admin logins', body: 'The JWT signing secret was published in the repo, so anyone could mint an admin token. It is now generated per install, and known placeholders are refused.' },
  { title: 'SSRF in "Is Server Up?"', body: 'Public tools could be aimed at localhost, the LAN or cloud metadata (169.254.169.254). Every target and redirect is now checked and the connection is pinned to the vetted IP.' },
  { title: 'Open sign-up and global settings', body: 'Anyone could register and change the scheduler for everyone. Registration is now opt-in and global settings are admin-only.' },
  { title: 'No rate limiting', body: 'One request could fire about 2,000 DNS queries. Public tools and login now have per-client limits that cannot be bypassed with a spoofed header.' },
  { title: 'Default password and upload bombs', body: 'The admin password123 is replaced by a random one on first start, and DMARC uploads are capped before and after decompression.' },
];

export default function About() {
  return (
    <div className='max-w-4xl space-y-6'>
      <section className='card p-6 sm:p-8'>
        <p className='label'>About</p>
        <div className='mt-4 flex flex-col sm:flex-row sm:items-center gap-5'>
          <div className='h-20 w-20 flex-none rounded-2xl grid place-items-center text-2xl font-bold text-white'
               style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), #4a0f1c)' }}>
            {PROFILE.initials}
          </div>
          <div className='min-w-0'>
            <h1 className='text-2xl font-bold text-ink'>{PROFILE.name}</h1>
            <p className='text-muted mt-1'>{PROFILE.title}</p>
            <p className='text-faint text-sm mt-0.5'>{PROFILE.subtitle}</p>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap gap-2'>
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel='noreferrer'
              className='btn-ghost !py-2'
            >
              <span className='text-base'>{link.icon}</span>
              {link.label}
              {!link.href.startsWith('mailto:') && <HiExternalLink className='text-faint' />}
            </a>
          ))}
        </div>
      </section>

      <section className='card p-6 sm:p-8'>
        <p className='label'>Why I built Cerberus</p>
        <div className='mt-3 space-y-4 text-muted leading-relaxed'>
          <p>
            When a server is compromised and starts sending spam, it ends up on public blacklists, and
            the business usually finds out the hard way: emails quietly land in spam and nobody knows why.
            I wanted to understand how defenders catch that early, so I took an open-source reputation
            monitor and made it my own project: Cerberus.
          </p>
          <p>
            I rebuilt the entire interface around a design-token system. Then I did what a blue teamer
            should do with any security tool before trusting it: I attacked it. I found that anyone could
            forge an admin login, that its network tools could be pointed at internal systems, and that its
            public endpoints had no limits. I fixed each issue and wrote 27 automated tests that prove the
            fixes hold.
          </p>
          <p className='text-ink'>
            Cerberus is the result: a reputation monitor that has been tested the way an attacker would test it.
          </p>
        </div>
      </section>

      <section className='card p-6 sm:p-8'>
        <div className='flex items-center gap-2'>
          <HiShieldCheck className='text-ok text-lg' />
          <p className='label'>Security audit: what I found and fixed</p>
        </div>
        <div className='mt-4 divide-y divide-line'>
          {FIXES.map((fix) => (
            <div key={fix.title} className='py-3.5 first:pt-0 last:pb-0'>
              <p className='font-medium text-ink'>{fix.title}</p>
              <p className='text-sm text-muted mt-1'>{fix.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='card p-6 sm:p-8'>
        <div className='flex items-center gap-2'>
          <HiHeart className='text-accent text-lg' />
          <p className='label'>Credits</p>
        </div>
        <ul className='mt-4 space-y-2 text-sm text-muted'>
          <li className='flex gap-2'>
            <HiCode className='mt-0.5 flex-none text-faint' />
            <span>&quot;Signal&quot; UI redesign, security audit and hardening: {PROFILE.name}</span>
          </li>
          <li className='flex gap-2'>
            <HiCode className='mt-0.5 flex-none text-faint' />
            <span>Built on open-source code released under the MIT License (see LICENSE).</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
