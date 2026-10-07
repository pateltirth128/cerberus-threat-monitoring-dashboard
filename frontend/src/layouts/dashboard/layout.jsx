import React, { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../../components/dashboard/Sidebar'
import Header from '../../components/dashboard/Header'
import ErrorBoundary from '../../components/shared/ErrorBoundary'
import CreditFooter from '../../components/shared/CreditFooter'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  // Start every dashboard page at the top.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className='flex flex-row bg-bg text-ink min-h-screen w-screen overflow-hidden'>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='flex-1 min-w-0 flex flex-col'>
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main ref={mainRef} className='flex-1 p-5 lg:p-6 overflow-y-auto'>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <CreditFooter />
      </div>
    </div>
  )
}
