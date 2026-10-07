import {
	HiOutlineViewGrid,
	HiDesktopComputer,
	HiCheck,
	HiOutlineQuestionMarkCircle,
	HiShieldExclamation,
	HiGlobe,
	HiStatusOnline,
	HiServer,
	HiLockClosed,
	HiMail,
	HiViewList,
	HiCollection,
	HiDocumentReport,
	HiCog,
	HiUserCircle,
} from 'react-icons/hi'

export const DASHBOARD_SIDEBAR_SECTIONS = [
	{
		label: 'Monitor',
		links: [
			{ key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: <HiOutlineViewGrid /> },
			{ key: 'assets', label: 'Assets', path: '/dashboard/assets', icon: <HiDesktopComputer /> },
		],
	},
	{
		label: 'Blacklist',
		links: [
			{ key: 'blacklist-check', label: 'Blacklist Check', path: '/dashboard/blacklist-check', icon: <HiCheck /> },
			{ key: 'bulk-check', label: 'Bulk Check', path: '/dashboard/bulk-check', icon: <HiCollection /> },
			{ key: 'subnet-check', label: 'Subnet Check', path: '/dashboard/subnet-check', icon: <HiViewList /> },
		],
	},
	{
		label: 'Lookups',
		links: [
			{ key: 'abuseipdb', label: 'IP Reputation', path: '/dashboard/abuseipdb', icon: <HiShieldExclamation /> },
			{ key: 'whois', label: 'WHOIS', path: '/dashboard/whois', icon: <HiGlobe /> },
			{ key: 'dns-records', label: 'DNS Records', path: '/dashboard/dns-records', icon: <HiServer /> },
			{ key: 'ssl-checker', label: 'SSL Certificate', path: '/dashboard/ssl-checker', icon: <HiLockClosed /> },
			{ key: 'server-status', label: 'Server Status', path: '/dashboard/server-status', icon: <HiStatusOnline /> },
		],
	},
	{
		label: 'Email',
		links: [
			{ key: 'email-security', label: 'SPF / DKIM / DMARC', path: '/dashboard/email-security', icon: <HiMail /> },
			{ key: 'dmarc-reports', label: 'DMARC Reports', path: '/dashboard/dmarc-reports', icon: <HiDocumentReport /> },
		],
	},
]

export const DASHBOARD_SIDEBAR_BOTTOM_LINKS = [
	{
		key: 'support',
		label: 'API Docs',
		path: `${import.meta.env.VITE_API_DOCS_URL || 'http://localhost:8100/swagger/'}`,
		icon: <HiOutlineQuestionMarkCircle />
	},
	{
		key: 'settings',
		label: 'Settings',
		path: '/dashboard/settings',
		icon: <HiCog />
	},
	{
		key: 'about',
		label: 'About',
		path: '/dashboard/about',
		icon: <HiUserCircle />
	}
]

// Page title shown in the header, looked up from the sidebar links.
const ALL_LINKS = [
	...DASHBOARD_SIDEBAR_SECTIONS.flatMap((section) => section.links),
	...DASHBOARD_SIDEBAR_BOTTOM_LINKS,
]

export function getPageTitle(pathname) {
	if (pathname.startsWith('/dashboard/assets/')) return 'Asset Details'
	if (pathname.startsWith('/dashboard/blacklist-monitor/report')) return 'Report'
	if (pathname.startsWith('/dashboard/blacklist-monitor')) return 'Assets'
	const match = ALL_LINKS.find((link) => link.path === pathname)
	return match ? match.label : 'Dashboard'
}
