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
  } : {
    // www는 백엔드 CORS 허용 목록과 어긋나 크레딧 0 버그를 만들었음 — apex로 통일
    async redirects() {
      return [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'www.astropillar.com' }],
          destination: 'https://astropillar.com/:path*',
          permanent: true,
        },
      ]
    },
  }),
}

export default isCapacitor ? withNextIntl(nextConfig) : withPWA(withNextIntl(nextConfig))
