import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ko', 'ja'],
  defaultLocale: 'en',
  localePrefix: 'as-needed', // /en은 그냥 /, /ko는 /ko, /ja는 /ja
})
