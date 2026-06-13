import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import styles from './TopBar.module.css'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of all active infrastructure reports' },
  '/submit':    { title: 'Submit Report', sub: 'File a new infrastructure incident report' },
  '/reports':   { title: 'All Reports', sub: 'Browse and filter all submitted reports' },
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
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </div>
        <button className={styles.bellBtn} aria-label="Notifications">
          <Bell size={15} strokeWidth={1.75} />
        </button>
        <div className={styles.avatar}>AU</div>
      </div>
    </header>
  )
}
