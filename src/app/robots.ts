import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/today', '/explain'],
      disallow: ['/menu', '/reading/', '/library', '/buy', '/login'],
    },
    sitemap: 'https://astropillar.com/sitemap.xml',
  }
}
