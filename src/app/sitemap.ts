import { MetadataRoute } from 'next'

const BASE = 'https://astropillar.com'
const LOCALES = ['en', 'ko', 'ja'] as const
const url = (l: string, path: string) => `${BASE}${l === 'en' ? '' : `/${l}`}${path}`

// 공개 페이지 × 3개 언어 (hreflang 대체 경로 포함)
const PAGES: { path: string; freq: 'daily' | 'weekly' | 'monthly'; priority: number }[] = [
  { path: '', freq: 'weekly', priority: 1 },
  { path: '/today', freq: 'daily', priority: 0.9 },
  { path: '/explain', freq: 'monthly', priority: 0.5 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap(p => LOCALES.map(l => ({
    url: url(l, p.path),
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: l === 'en' ? p.priority : p.priority - 0.05,
    alternates: { languages: Object.fromEntries(LOCALES.map(x => [x, url(x, p.path)])) },
  })))
}
