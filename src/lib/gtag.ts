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
