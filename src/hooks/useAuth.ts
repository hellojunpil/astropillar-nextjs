'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'

export function useAuth(requireAuth = true) {
  const router = useRouter()
  const { user, credits, loading, refreshCredits } = useAuthContext()

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      // 로그인 후 원래 페이지로 복귀할 수 있도록 현재 경로를 returnUrl로 전달
      const current = window.location.pathname + window.location.search
      const withReturn = current && !current.includes('/login')
        ? `/login?returnUrl=${encodeURIComponent(current)}`
        : '/login'
      router.push(withReturn)
    }
  }, [loading, requireAuth, user, router])

  return { user, credits, loading, refreshCredits }
}
