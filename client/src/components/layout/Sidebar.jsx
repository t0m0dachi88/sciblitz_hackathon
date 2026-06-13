import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  Map,
  ListOrdered,
  BarChart2,
  ShieldCheck,
  Activity,
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit',    icon: FilePlus,        label: 'Submit Report' },
  { to: '/map',       icon: Map,             label: 'Map View' },
  { to: '/priority',  icon: ListOrdered,     label: 'Priority List' },
  { to: '/areas',     icon: BarChart2,       label: 'Area Intelligence' },
]

const ADMIN_ITEM = { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <ShieldCheck size={15} strokeWidth={2} />
        </div>
        <div>
          <div className={styles.brandName}>NCDN-CIP</div>
          <div className={styles.brandSub}>Urban Intelligence</div>
        </div>
      </div>

      <div className={styles.statusRow}>
        <Activity size={11} className={styles.statusDot} />
        <span className={styles.statusText}>System Online</span>
      </div>

      <div className={styles.divider} />

      <nav className={styles.nav}>
        <p className={styles.navSection}>Navigation</p>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={14} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.divider} style={{ margin: '12px 18px' }} />

      <nav className={styles.nav}>
        <p className={styles.navSection}>Authority</p>
        <NavLink
          to={ADMIN_ITEM.to}
          className={({ isActive }) =>
            `${styles.navItem} ${styles.adminItem} ${isActive ? styles.activeAdmin : ''}`
          }
        >
          <ADMIN_ITEM.icon size={14} strokeWidth={1.75} />
          <span>{ADMIN_ITEM.label}</span>
          <span className={styles.restricted}>Restricted</span>
        </NavLink>
      </nav>

      <div className={styles.spacer} />

      <div className={styles.footer}>
        <p className={styles.footerText}>Dhaka City — 12 Thanas</p>
        <p className={styles.footerSub}>Hackathon MVP v1.0</p>
      </div>
    </aside>
  )
}
