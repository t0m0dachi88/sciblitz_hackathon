import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Loader, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signup } from '../api/reports'
import styles from './Login.module.css'

export default function SignUp() {
  const [name, setName] = useState('')
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
      const data = await signup({ name, email, password })
      login(data.token, data.user)
      navigate('/')
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
          <div className={styles.icon}><UserPlus size={20} /></div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.sub}>Join NCDN-CIP as a citizen reporter</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <label className="label" htmlFor="name">Name</label>
          <input id="name" type="text" className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />

          <label className="label" htmlFor="email" style={{ marginTop: 16 }}>Email</label>
          <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />

          <label className="label" htmlFor="password" style={{ marginTop: 16 }}>Password</label>
          <input id="password" type="password" className="input" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} />

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
            {loading ? <><Loader size={13} /> Creating account...</> : 'Create Account'}
          </button>

          <p className={styles.footerText} style={{ textAlign: 'center', marginTop: 16 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
