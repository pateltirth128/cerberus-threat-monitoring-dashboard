import React from 'react';
import { HiOutlineLogout, HiShieldCheck, HiMoon, HiSun, HiMenu } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth/authProvider';
import { useTheme } from '../../services/theme/themeProvider';

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const { dark, toggleTheme } = useTheme();

  const handleLogout = () => {
    setToken(null, null);
    navigate('/', { replace: true });
  };

  return (
    <header className='h-16 px-4 sm:px-6 flex items-center justify-between border-b border-line bg-surface/80 backdrop-blur-md sticky top-0 z-10'>
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuToggle}
          className='lg:hidden p-2 rounded-lg text-muted hover:bg-surface-2 transition-colors'
        >
          <HiMenu className='text-xl' />
        </button>
        <div>
          <p className='label'>Security Dashboard</p>
          <h1 className='text-base font-semibold text-ink'>Realtime Blacklist Monitoring</h1>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <div className='hidden md:inline-flex items-center gap-2 pill-ok'>
          <HiShieldCheck className='text-sm' /> API Connected
        </div>
        <button
          onClick={toggleTheme}
          className='p-2 rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-ink transition-colors'
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <HiSun className="text-lg" /> : <HiMoon className="text-lg" />}
        </button>
        <button
          onClick={handleLogout}
          className='btn-ghost !px-3 !py-2'
        >
          <HiOutlineLogout /> <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
