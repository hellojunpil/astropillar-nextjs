'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { gtagPageview } from '@/lib/gtag'
import CelestialBackground from './CelestialBackground'
import SiteNav from './SiteNav'

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => { gtagPageview(pathname) }, [pathname])

  // 스크롤 진입 애니메이션: .ap-reveal 요소에 .is-in 부여
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    const scan = () => document.querySelectorAll('.ap-reveal:not(.is-in)').forEach(el => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [pathname])

  return (
    <AuthProvider>
      <CelestialBackground />
      <SiteNav />
      {children}
    </AuthProvider>
  )
}
