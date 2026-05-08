import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

// 접속 국가 → 언어 매핑
function getLocaleFromCountry(country: string | null): string | null {
  if (!country) return null
  if (country === 'KR') return 'ko'
  if (country === 'JP') return 'ja'
  return null // 그 외는 기본값(en) 사용
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 경로, 정적 파일은 통과
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 이미 언어 접두사가 붙어있으면 그냥 처리
  if (pathname.startsWith('/ko') || pathname.startsWith('/ja')) {
    return intlMiddleware(request)
  }

  // 루트(/) 접속 시 언어 쿠키 확인 → 없으면 IP 감지
  if (pathname === '/' || !pathname.startsWith('/en')) {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
    if (cookieLocale && ['en', 'ko', 'ja'].includes(cookieLocale)) {
      if (cookieLocale !== 'en') {
        const url = request.nextUrl.clone()
        url.pathname = `/${cookieLocale}${pathname === '/' ? '' : pathname}`
        return NextResponse.redirect(url)
      }
      // 쿠키가 'en'이면 IP 감지 스킵 → EN 기본값으로 처리
      return intlMiddleware(request)
    }

    // Vercel IP 감지 (쿠키 없을 때만)
    const country = request.headers.get('x-vercel-ip-country')
    const detectedLocale = getLocaleFromCountry(country)
    if (detectedLocale) {
      const url = request.nextUrl.clone()
      url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`
      return NextResponse.redirect(url)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
