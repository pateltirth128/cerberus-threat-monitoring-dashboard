import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/dashboard/Sidebar'
import Header from '../../components/dashboard/Header'
import ErrorBoundary from '../../components/shared/ErrorBoundary'
import CreditFooter from '../../components/shared/CreditFooter'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className='flex flex-row bg-bg text-ink min-h-screen w-screen overflow-hidden'>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className='flex-1 min-w-0 flex flex-col'>
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className='flex-1 p-5 lg:p-6 overflow-y-auto'>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
        <CreditFooter />
      </div>
    </div>
  )
}
