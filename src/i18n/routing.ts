import { defineRouting } from 'next-intl/routing'

const isCapacitor = process.env.BUILD_TARGET === 'capacitor'

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja'],
  defaultLocale: 'en',
  localePrefix: isCapacitor ? 'always' : 'as-needed',
})
