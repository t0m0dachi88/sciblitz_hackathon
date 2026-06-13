import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Shield,
  Activity,
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit',    icon: FilePlus,        label: 'Submit Report' },
  { to: '/reports',   icon: FileText,        label: 'All Reports' },
]

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Branding */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Shield size={16} strokeWidth={2} />
        </div>
        <div>
          <div className={styles.brandName}>NCDN-CIP</div>
          <div className={styles.brandSub}>Urban Intelligence</div>
        </div>
      </div>

      {/* System status indicator */}
      <div className={styles.statusRow}>
        <Activity size={11} className={styles.statusDot} />
        <span className={styles.statusText}>System Online</span>
      </div>

      <div className={styles.divider} />

      {/* Navigation */}
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
            <Icon size={15} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.spacer} />

      {/* Footer info */}
      <div className={styles.footer}>
        <p className={styles.footerText}>Dhaka City — 12 Thanas</p>
        <p className={styles.footerSub}>Hackathon MVP v1.0</p>
      </div>
    </aside>
  )
}
