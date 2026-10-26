import { MetadataRoute } from 'next'

const PRIVATE = ['/menu', '/reading/', '/tarot/', '/library', '/buy', '/login', '/share/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/today', '/explain', '/ko/today', '/ja/today', '/ko/explain', '/ja/explain'],
      // 언어 접두어(/ko, /ja) 경로도 동일하게 제외
      disallow: PRIVATE.flatMap(p => [p, `/ko${p}`, `/ja${p}`]),
    },
    sitemap: 'https://astropillar.com/sitemap.xml',
  }
}
