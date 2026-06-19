import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('ncdn_token')
    const savedUser = localStorage.getItem('ncdn_user')
    if (saved && savedUser) {
      setToken(saved)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  function login(token, user) {
    localStorage.setItem('ncdn_token', token)
    localStorage.setItem('ncdn_user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('ncdn_token')
    localStorage.removeItem('ncdn_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
