declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function gtagEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params)
  }
}

export function gtagPageview(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID ?? '', { page_path: url })
  }
}
