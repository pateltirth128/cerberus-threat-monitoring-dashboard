import React from 'react'
import { DASHBOARD_SIDEBAR_BOTTOM_LINKS, DASHBOARD_SIDEBAR_SECTIONS } from './constants'
import { Link, useLocation } from 'react-router-dom'
import { HiX } from 'react-icons/hi'
import classNames from 'classnames'

const linkClass =
  'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={classNames(
        'bg-surface w-64 p-4 flex flex-col text-ink border-r border-line overflow-y-auto',
        'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 px-2 py-3'>
            <img src="/logo.png" alt="Cerberus" className='h-9 w-9 rounded-xl object-cover ring-1 ring-line' />
            <div>
              <p className='text-ink text-base font-semibold leading-none'>Cerberus</p>
              <p className='text-faint text-xs mt-1'>Threat Monitoring with Tirth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label='Close menu'
            className='lg:hidden p-2 rounded-lg hover:bg-surface-2 text-muted'
          >
            <HiX className='text-lg' />
          </button>
        </div>

        <nav className='flex-1 py-4 flex flex-col gap-5' aria-label='Dashboard'>
          {DASHBOARD_SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className='px-3 mb-2 label'>{section.label}</p>
              <div className='flex flex-col gap-0.5'>
                {section.links.map((item) => (
                  <SidebarLink key={item.key} item={item} onClose={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className='flex flex-col gap-0.5 pt-3 border-t border-line'>
          {DASHBOARD_SIDEBAR_BOTTOM_LINKS.map(item => (
            <SidebarLink key={item.key} item={item} onClose={onClose}/>
          ))}
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ item, onClose }) {
  const { pathname } = useLocation()
  const isExternal = item.path.startsWith('http') || item.path.includes('/swagger/')
  const active = !isExternal && pathname === item.path
  const classes = classNames(
    active ? 'bg-accent/12 text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink',
    linkClass
  )

  const content = (
    <>
      {active && <span className='absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-accent' />}
      <span className='text-lg'>{item.icon}</span>
      {item.label}
    </>
  )

  if (isExternal) {
    return (
      <a href={item.path} className={classes} target='_blank' rel='noreferrer'>
        {content}
      </a>
    )
  }

  return (
    <Link to={item.path} className={classes} onClick={onClose}>
      {content}
    </Link>
  )
}
