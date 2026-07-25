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
        const email = u.email
        try {
          const data = await apiGet<{ ok: boolean; pouch_count: number }>('/get_pouch', { email })
          setCredits(data.pouch_count)
          if (!data.ok) {
            // 가입 직후에는 register_user(웰컴 크레딧 지급)가 아직 유저 문서를
            // 만들기 전이라 user_not_found(0)가 올 수 있음 — 백그라운드 재시도
            void (async () => {
              for (let i = 0; i < 4; i++) {
                await new Promise(r => setTimeout(r, 1500))
                try {
                  const retry = await apiGet<{ ok: boolean; pouch_count: number }>('/get_pouch', { email })
                  if (retry.ok) {
                    setCredits(retry.pouch_count)
                    return
                  }
                } catch { /* 다음 시도 */ }
              }
            })()
          }
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
