import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import withPWAInit from '@ducanh2912/next-pwa'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const isCapacitor = process.env.BUILD_TARGET === 'capacitor'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development' || isCapacitor,
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  ...(isCapacitor ? {
    output: 'export',
    images: { unoptimized: true },
  } : {}),
}

export default isCapacitor ? withNextIntl(nextConfig) : withPWA(withNextIntl(nextConfig))
