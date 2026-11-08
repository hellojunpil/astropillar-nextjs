'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from '@/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  getAdditionalUserInfo,
  type UserCredential,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { apiPost } from '@/lib/api'
import { gtagEvent } from '@/lib/gtag'

type Mode = 'login' | 'signup' | 'forgot'

function LoginContent() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('login')
  const searchParams = useSearchParams()
  const initialMode: Mode = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  // returnUrl: 같은 사이트 경로만 허용 (open redirect 방지). 로케일 접두어가 이미 포함된
  // 전체 경로이므로 next-intl 라우터 대신 location으로 이동한다.
  const rawReturnUrl = searchParams.get('returnUrl')
  const returnUrl = rawReturnUrl && rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//') ? rawReturnUrl : null

  function goAfterAuth() {
    if (returnUrl) {
      window.location.assign(returnUrl)
    } else {
      router.push('/menu')
    }
  }
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  // 가입 크레딧 지급 — 일시 오류로 계정만 생기고 크레딧 0이 되지 않도록 3회 재시도
  async function registerUser(userEmail: string) {
    const platform = window.matchMedia('(display-mode: standalone)').matches ? 'mo' : 'on'
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await apiPost('/register_user', { email: userEmail, platform })
        return
      } catch {
        if (attempt === 3) {
          gtagEvent('register_user_failed', { platform })
          return
        }
        await new Promise(r => setTimeout(r, 800 * attempt))
      }
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('error_mismatch'))
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError(t('error_weak_password'))
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        gtagEvent('login', { method: 'email' })
        goAfterAuth()
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await registerUser(cred.user.email!)
        gtagEvent('sign_up', { method: 'email' })
        goAfterAuth()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError(locale === 'ko' ? '이메일 또는 비밀번호가 올바르지 않아요.' : locale === 'ja' ? 'メールアドレスまたはパスワードが正しくありません。' : 'Invalid email or password.')
      } else if (msg.includes('email-already-in-use')) {
        setError(locale === 'ko' ? '이미 사용 중인 이메일이에요.' : locale === 'ja' ? 'このメールアドレスはすでに使用されています。' : 'Email already in use.')
      } else {
        setError(locale === 'ko' ? '오류가 발생했어요. 다시 시도해주세요.' : locale === 'ja' ? 'エラーが発生しました。もう一度お試しください。' : 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 인스타그램/페이스북/카카오톡 등 인앱 브라우저는 구글이 팝업 OAuth를 차단(disallowed_useragent)
  function isInAppBrowser() {
    return /instagram|threads|fban|fbav|fb_iab|kakaotalk|line\/|naver|daumapps/i.test(navigator.userAgent)
  }

  async function completeSocialSignIn(result: UserCredential, method: string) {
    if (!result.user.email) {
      setError(locale === 'ko' ? '이메일 제공에 동의해야 이용할 수 있어요.' : locale === 'ja' ? 'メールアドレスの提供に同意してください。' : 'Email permission is required to sign in.')
      return
    }
    const info = getAdditionalUserInfo(result)
    if (info?.isNewUser) {
      await registerUser(result.user.email)
      gtagEvent('sign_up', { method })
    } else {
      gtagEvent('login', { method })
    }
    goAfterAuth()
  }

  async function handleSocial(provider: typeof googleProvider, method: string) {
    setError('')
    setLoading(true)
    const failMsg = locale === 'ko' ? '구글 로그인에 실패했어요.' : locale === 'ja' ? 'Googleログインに失敗しました。' : 'Google sign-in failed.'
    if (isInAppBrowser()) {
      try {
        sessionStorage.setItem('social_method', method)
        await signInWithRedirect(auth, provider)
      } catch {
        setError(failMsg)
        setLoading(false)
      }
      return
    }
    try {
      const result = await signInWithPopup(auth, provider)
      await completeSocialSignIn(result, method)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (/popup-closed-by-user|cancelled-popup-request/.test(msg)) {
        setLoading(false)
        return
      }
      if (/popup-blocked|operation-not-supported|web-storage-unsupported/.test(msg)) {
        try {
          sessionStorage.setItem('social_method', method)
          await signInWithRedirect(auth, provider)
          return
        } catch { /* fall through */ }
      }
      setError(failMsg)
    } finally {
      setLoading(false)
    }
  }

  // 인앱 브라우저에서 redirect 방식으로 돌아온 경우 처리
  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result) {
          const method = sessionStorage.getItem('social_method') || 'google'
          sessionStorage.removeItem('social_method')
          return completeSocialSignIn(result, method)
        }
      })
      .catch(() => {
        setError(locale === 'ko' ? '로그인에 실패했어요. 다시 시도해주세요.' : locale === 'ja' ? 'ログインに失敗しました。もう一度お試しください。' : 'Sign-in failed. Please try again.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch {
      setError(locale === 'ko' ? '이메일을 찾을 수 없어요.' : locale === 'ja' ? 'メールアドレスが見つかりません。' : 'Email not found.')
    } finally {
      setLoading(false)
    }
  }

  const L = locale === 'ko' ? 'ko' : locale === 'ja' ? 'ja' : 'en'
  const BRAND = {
    ko: { title: '당신의 별 지도를\n펼칠 시간이에요', body: '사주와 별자리, 타로가 하나의 이야기로 이어지는 곳. 가입하면 첫 리딩을 위한 크레딧 1개를 드려요.', points: ['사주 + 서양 점성술 통합 리딩', '나의 리딩 기록과 인물 저장', '매일 무료 타로와 별자리 운세'] },
    ja: { title: 'あなたの星の地図を\n広げるときです', body: '四柱推命と星座、タロットがひとつの物語につながる場所。登録すると最初のリーディング用に1クレジットを差し上げます。', points: ['四柱推命 + 西洋占星術の統合リーディング', 'リーディング履歴と人物の保存', '毎日無料のタロットと星座運勢'] },
    en: { title: 'Time to unfold\nyour star map', body: 'Where BaZi, astrology and tarot become one story. Sign up and get 1 free credit for your first reading.', points: ['BaZi + Western astrology in one reading', 'Your reading history and saved people', 'Free daily tarot and horoscope'] },
  }[L]

  const submitLabel = loading ? '...' : mode === 'forgot' ? (locale === 'ko' ? '재설정 이메일 보내기' : locale === 'ja' ? 'リセットメールを送る' : 'Send Reset Email') : mode === 'login' ? t('signin_btn') : t('signup_btn')

  return (
    <main className="ap-page lg">
      <div className="lg-wrap ap-container">
        {/* 브랜드 패널 (PC 전용) */}
        <aside className="lg-brand ap-desktop-only" aria-hidden="true">
          <div className="lg-arch">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home.png" alt="" />
          </div>
          <div className="lg-brand-copy">
            <h2 className="lg-brand-title">{BRAND.title}</h2>
            <p className="lg-brand-body">{BRAND.body}</p>
            <ul className="lg-points">
              {BRAND.points.map(p => <li key={p}><span className="lg-point-star">✦</span>{p}</li>)}
            </ul>
          </div>
        </aside>

        {/* 폼 카드 */}
        <section className="lg-card ap-glass ap-glass-gold">
          <div className="lg-head">
            <Link href={locale === 'en' ? '/' : `/${locale}`} className="lg-logo">ASTROPILLAR</Link>
            <p className="lg-welcome">{t('welcome')}</p>
          </div>

          {mode !== 'forgot' && (
            <div className="lg-tabs" role="tablist">
              {(['login', 'signup'] as const).map(m => (
                <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`lg-tab${mode === m ? ' is-on' : ''}`}>
                  {m === 'login' ? t('signin_tab') : t('signup_tab')}
                </button>
              ))}
            </div>
          )}

          {mode !== 'forgot' && (
            <>
              <button onClick={() => handleSocial(googleProvider, 'google')} disabled={loading} className="lg-google">
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
                {t('google')}
              </button>
              <div className="lg-divider">
                <span>{locale === 'ko' ? '또는 이메일로' : locale === 'ja' ? 'またはメールで' : 'or continue with email'}</span>
              </div>
            </>
          )}

          {resetSent ? (
            <div className="lg-reset-sent">{t('reset_sent')}</div>
          ) : (
            <form onSubmit={mode === 'forgot' ? handleForgot : handleEmailAuth} className="lg-form">
              {mode === 'forgot' && (
                <p className="lg-forgot-note">
                  {locale === 'ko' ? '가입하신 이메일을 입력해주세요.' : locale === 'ja' ? '登録したメールアドレスを入力してください。' : 'Enter your email to reset your password.'}
                </p>
              )}
              <label className="lg-field">
                <span>{t('email')}</span>
                <input className="lg-input" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              {mode !== 'forgot' && (
                <label className="lg-field">
                  <span>{t('password')}</span>
                  <input className="lg-input" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} required />
                </label>
              )}
              {mode === 'signup' && (
                <label className="lg-field">
                  <span>{t('confirm_password')}</span>
                  <input className="lg-input" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </label>
              )}
              {error && <div className="lg-error" role="alert">{error}</div>}
              <button type="submit" className="ap-btn lg-submit" disabled={loading}>{submitLabel}</button>
            </form>
          )}

          {mode === 'login' && (
            <button onClick={() => setMode('forgot')} className="lg-textbtn">{t('forgot')}</button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="lg-textbtn">← {t('signin_link')}</button>
          )}

          {mode === 'signup' && (
            <p className="lg-gift">
              <span aria-hidden="true">✦</span>
              {locale === 'ko' ? '가입하면 무료 크레딧 1개를 드려요' : locale === 'ja' ? '登録で無料クレジット1個プレゼント' : 'Get 1 free Credit on sign-up'}
            </p>
          )}

          <p className="lg-switch">
            {mode === 'login' ? t('no_account') : t('have_account')}{' '}
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? t('signup_link') : t('signin_link')}
            </button>
          </p>

          <div className="lg-home">
            <Link href={locale === 'en' ? '/' : `/${locale}`}>
              {locale === 'ko' ? '← 홈으로 가기' : locale === 'ja' ? '← ホームへ戻る' : '← Back to Home'}
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        .lg { display:flex; align-items:center; padding-bottom: 32px; }
        .lg-wrap { display:grid; grid-template-columns: 1fr; gap: 48px; align-items:center; padding-top: 32px; padding-bottom: 32px; }
        .lg-card { width: 100%; max-width: 440px; margin: 0 auto; padding: 32px 24px; }
        .lg-head { text-align:center; margin-bottom: 26px; }
        .lg-logo { font-family:'Cormorant Garamond',serif; font-size: 26px; font-weight: 700; letter-spacing: .2em; color: var(--gold); text-decoration:none; }
        .lg-welcome { margin-top: 8px; font-size: 14px; color: var(--ink-2); }
        .lg-tabs { display:grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: 999px; background: rgba(255,255,255,.04); border: 1px solid var(--line); margin-bottom: 22px; }
        .lg-tab { min-height: 40px; border: 0; border-radius: 999px; background: transparent; color: var(--ink-2); font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .2s, color .2s; }
        .lg-tab.is-on { color: var(--gold-light); background: rgba(241,237,228,.08); box-shadow: inset 0 0 0 1px rgba(201,168,76,.32); }
        .lg-google { width:100%; min-height: 52px; display:flex; align-items:center; justify-content:center; gap: 10px; border-radius: 999px; cursor: pointer;
          background: #f6f4ef; color: #1f2330; border: 1px solid rgba(255,255,255,.6); font: inherit; font-size: 15px; font-weight: 600;
          transition: transform .16s, box-shadow .2s; box-shadow: 0 10px 24px -12px rgba(0,0,0,.6); }
        .lg-google:hover { box-shadow: 0 14px 30px -12px rgba(230,205,133,.35); }
        .lg-google:active { transform: scale(.98); }
        .lg-google:disabled { opacity: .6; cursor: not-allowed; }
        .lg-divider { display:flex; align-items:center; gap: 12px; margin: 22px 0; font-size: 12px; color: var(--ink-3); }
        .lg-divider::before, .lg-divider::after { content:""; flex:1; height:1px; background: var(--line-strong); }
        .lg-form { display:flex; flex-direction:column; gap: 14px; }
        .lg-field { display:flex; flex-direction:column; gap: 6px; }
        .lg-field > span { font-size: 13px; color: var(--ink-2); font-weight: 500; }
        .lg-input { width:100%; min-height: 50px; padding: 0 16px; border-radius: 12px; outline: none;
          background: rgba(7,9,20,.55); border: 1px solid var(--line-strong); color: var(--ink); transition: border-color .2s, box-shadow .2s; }
        .lg-input::placeholder { color: var(--ink-3); }
        .lg-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,.18); }
        .lg-error { color: var(--danger); font-size: 13px; text-align:center; }
        .lg-submit { width: 100%; margin-top: 4px; }
        .lg-forgot-note { text-align:center; color: var(--ink-2); font-size: 14px; margin-bottom: 4px; }
        .lg-reset-sent { text-align:center; color: var(--gold-light); padding: 20px; line-height: 1.7; }
        .lg-textbtn { display:block; margin: 14px auto 0; background:none; border:none; color: var(--gold-light); font: inherit; font-size: 13px; cursor:pointer; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(230,205,133,.35); min-height: 32px; }
        .lg-gift { display:flex; align-items:center; justify-content:center; gap: 8px; margin-top: 16px; padding: 10px 14px; border-radius: 12px;
          background: var(--gold-soft); border: 1px solid var(--gold-line); color: var(--gold-light); font-size: 13px; }
        .lg-switch { text-align:center; margin-top: 22px; font-size: 13px; color: var(--ink-2); }
        .lg-switch button { background:none; border:none; color: var(--gold-light); font: inherit; font-size: 13px; font-weight: 600; cursor:pointer; text-decoration: underline; text-underline-offset: 3px; }
        .lg-home { text-align:center; margin-top: 18px; }
        .lg-home a { color: var(--ink-3); font-size: 12.5px; text-decoration:none; }
        .lg-home a:hover { color: var(--ink-2); }

        .lg-brand { display:grid; grid-template-columns: 220px 1fr; gap: 40px; align-items:center; }
        .lg-arch { aspect-ratio: 3 / 4.4; border-radius: 999px 999px 20px 20px; overflow:hidden; border: 1px solid var(--gold-line);
          box-shadow: 0 0 0 6px rgba(201,168,76,.05), 0 30px 80px -20px rgba(120,104,190,.45); }
        .lg-arch img { width:100%; height:100%; object-fit:cover; object-position: center 22%; display:block; }
        .lg-brand-title { font-family: var(--font-display); font-size: 40px; line-height: 1.25; font-weight: 600; white-space: pre-line; }
        html[lang="ko"] .lg-brand-title, html[lang="ja"] .lg-brand-title { font-family: 'Noto Serif KR','Noto Serif JP',serif; font-size: 34px; }
        .lg-brand-body { margin-top: 16px; font-size: 15.5px; line-height: 1.75; color: var(--ink-2); max-width: 42ch; }
        .lg-points { list-style:none; margin-top: 22px; display:flex; flex-direction:column; gap: 10px; }
        .lg-points li { display:flex; gap: 10px; font-size: 14.5px; color: var(--ink); }
        .lg-point-star { color: var(--gold-light); font-size: 12px; line-height: 22px; }

        @media (min-width: 1024px) {
          .lg { min-height: calc(100dvh - var(--nav-h)); }
          .lg-wrap { grid-template-columns: 1.25fr 1fr; gap: 64px; }
          .lg-card { padding: 40px 36px; margin: 0; justify-self: end; }
        }
      `}</style>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
