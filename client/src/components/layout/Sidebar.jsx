import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  Map,
  ListOrdered,
  BarChart2,
  ShieldCheck,
  Activity,
  User,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/submit',    icon: FilePlus,        label: 'Submit Report' },
  { to: '/map',       icon: Map,             label: 'Map View' },
  { to: '/priority',  icon: ListOrdered,     label: 'Priority List' },
  { to: '/areas',     icon: BarChart2,       label: 'Area Intelligence' },
  { to: '/my-reports', icon: User,           label: 'My Reports' },
]

const ADMIN_ITEM = { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' }

export default function Sidebar() {
  const { isAuth, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <ShieldCheck size={15} strokeWidth={2} />
        </div>
        <div>
          <div className={styles.brandName}>UrbanEye</div>
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

      {isAdmin && (
        <>
          <div className={styles.divider} style={{ margin: '12px 18px' }} />
          <nav className={styles.nav}>
            <p className={styles.navSection}>Authority</p>
            <NavLink
              to={ADMIN_ITEM.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.activeAdmin : ''}`
              }
            >
              <ADMIN_ITEM.icon size={14} strokeWidth={1.75} />
              <span>{ADMIN_ITEM.label}</span>
              <span className={styles.restricted}>Admin</span>
            </NavLink>
          </nav>
        </>
      )}

      <div className={styles.spacer} />

      <div className={styles.footer}>
        {isAuth ? (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}</div>
              <div className={styles.userDetails}>
                <p className={styles.userName}>{user?.name || user?.email?.split('@')[0]}</p>
                <p className={styles.userRole}>{user?.role === 'admin' ? 'Administrator' : 'Citizen'}</p>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/') }}>
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <div className={styles.authLinks}>
            <button className={styles.authLink} onClick={() => navigate('/login')}>
              <LogIn size={12} /> Sign In
            </button>
            <button className={styles.authLink} onClick={() => navigate('/signup')}>
              <UserPlus size={12} /> Sign Up
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
