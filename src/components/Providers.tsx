'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import { gtagPageview } from '@/lib/gtag'

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  useEffect(() => { gtagPageview(pathname) }, [pathname])
  return <AuthProvider>{children}</AuthProvider>
}
