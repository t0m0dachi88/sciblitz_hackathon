import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import styles from './TopBar.module.css'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard',          sub: 'System-wide overview of infrastructure reports' },
  '/submit':    { title: 'Submit Report',       sub: 'File a new infrastructure damage report' },
  '/map':       { title: 'Map View',            sub: 'Geographic visualization of incidents across Dhaka thanas' },
  '/priority':  { title: 'Priority List',       sub: 'Ranked infrastructure issues by severity and impact score' },
  '/areas':     { title: 'Area Intelligence',   sub: 'Per-thana risk profiles and infrastructure condition leaderboard' },
  '/admin':     { title: 'Admin Dashboard',     sub: 'Authority verification and report management — restricted access' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const meta = PAGE_TITLES[pathname] ?? { title: 'NCDN-CIP', sub: '' }

  return (
    <header className={styles.topbar}>
      <div>
        <h1 className={styles.title}>{meta.title}</h1>
        {meta.sub && <p className={styles.sub}>{meta.sub}</p>}
      </div>
      <div className={styles.actions}>
        <div className={styles.clock}>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
          })}
        </div>
        <button className={styles.bellBtn} aria-label="Notifications">
          <Bell size={14} strokeWidth={1.75} />
        </button>
        <div className={styles.avatar}>AU</div>
      </div>
    </header>
  )
}
