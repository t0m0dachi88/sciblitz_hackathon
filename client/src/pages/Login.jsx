import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      login(data.token, data.user)
      navigate(data.user.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}><LogIn size={20} /></div>
          <h1 className={styles.title}>Sign In</h1>
          <p className={styles.sub}>UrbanEye Citizen </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />

          <label className="label" htmlFor="password" style={{ marginTop: 16 }}>Password</label>
          <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
            {loading ? <><Loader size={13} /> Signing in...</> : 'Sign In'}
          </button>

          <p className={styles.footerText} style={{ textAlign: 'center', marginTop: 16 }}>
            No account? <Link to="/signup" style={{ color: 'var(--accent)' }}>Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
