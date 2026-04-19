'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiGet } from '@/lib/api'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        if (requireAuth) router.push('/login')
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
  }, [router, requireAuth])

  async function refreshCredits() {
    if (!user?.email) return
    try {
      const data = await apiGet<{ pouch_count: number }>('/get_pouch', { email: user.email })
      setCredits(data.pouch_count)
    } catch {
      /* ignore */
    }
  }

  return { user, credits, loading, refreshCredits }
}
