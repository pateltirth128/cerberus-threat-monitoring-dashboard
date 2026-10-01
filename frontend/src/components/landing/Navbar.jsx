import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineMenu } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth/authProvider';

const itemClass = 'px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors';

const Navbar = () => {
  const { token } = useAuth();
  const [nav, setNav] = useState(false);
  const navigate = useNavigate();

  const go = (path) => {
    setNav(false);
    navigate(path);
  };

  return (
    <header className='sticky top-0 z-20 backdrop-blur-md bg-bg/70 border-b border-line'>
      <div className='max-w-6xl mx-auto px-4 h-18 py-3 flex justify-between items-center'>
        <button className='flex items-center gap-3' onClick={() => go('/')}>
          <img src="/logo.png" alt="Cerberus" className='h-9 w-9 rounded-xl object-cover ring-1 ring-line' />
          <div className='text-left'>
            <p className='text-base font-semibold text-ink'>Cerberus</p>
            <p className='text-xs text-faint'>Threat Monitoring</p>
          </div>
        </button>

        <nav className='hidden md:flex items-center gap-2'>
          <button className={itemClass} onClick={() => go('/')}>Home</button>
          <button className={itemClass} onClick={() => go('/quick-check')}>Quick Check</button>
          <button
            className='btn-primary !px-4 !py-2 ml-1'
            onClick={() => go(token ? '/dashboard' : '/login')}
          >
            {token ? 'Open Dashboard' : 'Sign in'}
          </button>
        </nav>

        <button onClick={() => setNav((prev) => !prev)} className='md:hidden text-ink'>
          {nav ? <AiOutlineClose size={22} /> : <AiOutlineMenu size={22} />}
        </button>
      </div>

      {nav ? (
        <div className='md:hidden border-t border-line px-4 py-3 bg-surface'>
          <div className='flex flex-col gap-2'>
            <button className={itemClass} onClick={() => go('/')}>Home</button>
            <button className={itemClass} onClick={() => go('/quick-check')}>Quick Check</button>
            <button className='btn-primary' onClick={() => go(token ? '/dashboard' : '/login')}>
              {token ? 'Open Dashboard' : 'Sign in'}
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
