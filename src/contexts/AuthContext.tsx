'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiGet } from '@/lib/api'

interface AuthContextValue {
  user: User | null
  credits: number | null
  loading: boolean
  refreshCredits: (decrement?: number) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  credits: null,
  loading: true,
  refreshCredits: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null)
        setCredits(null)
        setLoading(false)
        return
      }
      setUser(u)
      if (u.email) {
        try {
          const data = await apiGet<{ pouch_count: number }>('/get_pouch', { email: u.email })
          setCredits(data.pouch_count)
        } catch {
          setCredits(0)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function refreshCredits(decrement?: number) {
    if (!user?.email) return
    if (decrement !== undefined) {
      setCredits(prev => prev !== null ? prev - decrement : null)
    }
    apiGet<{ pouch_count: number }>('/get_pouch', { email: user.email })
      .then(data => setCredits(data.pouch_count))
      .catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, credits, loading, refreshCredits }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
