'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const { user, credits, loading, refreshCredits } = useAuthContext()

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/login')
    }
  }, [loading, requireAuth, user, router])

  return { user, credits, loading, refreshCredits }
}
