import React from 'react';
import { HiOutlineLogout, HiMoon, HiSun, HiMenu } from 'react-icons/hi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth/authProvider';
import { useTheme } from '../../services/theme/themeProvider';
import { getPageTitle } from './constants';

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
          aria-label='Open menu'
          className='lg:hidden p-2 rounded-lg text-muted hover:bg-surface-2 transition-colors'
        >
          <HiMenu className='text-xl' />
        </button>
        <h1 className='text-base font-semibold text-ink'>{getPageTitle(pathname)}</h1>
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={toggleTheme}
          className='p-2 rounded-lg border border-line text-muted hover:bg-surface-2 hover:text-ink transition-colors'
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <HiSun className='text-lg' /> : <HiMoon className='text-lg' />}
        </button>
        <button onClick={handleLogout} className='btn-ghost !px-3 !py-2'>
          <HiOutlineLogout /> <span className='hidden sm:inline'>Sign out</span>
        </button>
      </div>
    </header>
  );
}
