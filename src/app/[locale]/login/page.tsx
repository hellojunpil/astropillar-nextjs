'use client'

import { useState, Suspense } from 'react'
import { useRouter } from '@/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  getAdditionalUserInfo,
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
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const fontFamily = locale === 'ko' ? "'Noto Sans KR', sans-serif" : locale === 'ja' ? "'Noto Sans JP', sans-serif" : "'Noto Sans', sans-serif"

  async function registerUser(userEmail: string) {
    await apiPost('/register_user', { email: userEmail })
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
        router.push('/menu')
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await registerUser(cred.user.email!)
        gtagEvent('sign_up', { method: 'email' })
        router.push('/menu')
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

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const info = getAdditionalUserInfo(result)
      if (info?.isNewUser) {
        await registerUser(result.user.email!)
        gtagEvent('sign_up', { method: 'google' })
      } else {
        gtagEvent('login', { method: 'google' })
      }
      router.push('/menu')
    } catch {
      setError(locale === 'ko' ? '구글 로그인에 실패했어요.' : locale === 'ja' ? 'Googleログインに失敗しました。' : 'Google sign-in failed.')
    } finally {
      setLoading(false)
    }
  }

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

  const inputSt: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(201,168,76,0.3)',
    borderRadius: 12, color: '#F6F6F8', fontFamily, fontSize: 15,
    outline: 'none', boxSizing: 'border-box',
  }
  const btnSt: React.CSSProperties = {
    width: '100%', padding: '15px', background: '#C9A84C', color: '#16213E',
    fontFamily, fontSize: 15, fontWeight: 700, border: 'none',
    borderRadius: 50, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
  }

  return (
    <main style={{ background: '#07071a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily, color: '#F6F6F8', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#C9A84C', letterSpacing: 3, marginBottom: 8 }}>ASTROPILLAR</div>
          <div style={{ fontSize: 14, color: 'rgba(200,195,220,0.6)' }}>{t('welcome')}</div>
        </div>

        {mode !== 'forgot' && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 28, padding: 4, gap: 4 }}>
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily, fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                background: mode === m ? '#C9A84C' : 'transparent',
                color: mode === m ? '#16213E' : 'rgba(200,195,220,0.6)',
              }}>
                {m === 'login' ? t('signin_tab') : t('signup_tab')}
              </button>
            ))}
          </div>
        )}

        {resetSent ? (
          <div style={{ textAlign: 'center', color: '#C9A84C', padding: 20 }}>{t('reset_sent')}</div>
        ) : (
          <form onSubmit={mode === 'forgot' ? handleForgot : handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'forgot' && (
              <div style={{ textAlign: 'center', color: 'rgba(200,195,220,0.7)', marginBottom: 8, fontSize: 14 }}>
                {locale === 'ko' ? '가입하신 이메일을 입력해주세요.' : locale === 'ja' ? '登録したメールアドレスを入力してください。' : 'Enter your email to reset your password.'}
              </div>
            )}
            <input style={inputSt} type="email" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} required />
            {mode !== 'forgot' && (
              <input style={inputSt} type="password" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} required />
            )}
            {mode === 'signup' && (
              <input style={inputSt} type="password" placeholder={t('confirm_password')} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            )}
            {error && <div style={{ color: '#ff6b6b', fontSize: 13, textAlign: 'center' }}>{error}</div>}
            <button type="submit" style={btnSt} disabled={loading}>
              {loading ? '...' : mode === 'forgot' ? (locale === 'ko' ? '재설정 이메일 보내기' : locale === 'ja' ? 'リセットメールを送る' : 'Send Reset Email') : mode === 'login' ? t('signin_btn') : t('signup_btn')}
            </button>
          </form>
        )}

        {mode === 'login' && (
          <button onClick={() => setMode('forgot')} style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.6)', fontFamily, fontSize: 12, cursor: 'pointer', display: 'block', margin: '12px auto 0', textDecoration: 'underline' }}>
            {t('forgot')}
          </button>
        )}
        {mode === 'forgot' && (
          <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'rgba(201,168,76,0.6)', fontFamily, fontSize: 12, cursor: 'pointer', display: 'block', margin: '12px auto 0' }}>
            ← {t('signin_link')}
          </button>
        )}

        {mode !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.2)' }} />
              <span style={{ fontSize: 11, color: 'rgba(200,195,220,0.4)' }}>{locale === 'ko' ? '또는' : locale === 'ja' ? 'または' : 'or'}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.2)' }} />
            </div>
            <button onClick={handleGoogle} disabled={loading} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(201,168,76,0.3)', borderRadius: 50, color: '#F6F6F8', fontFamily, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
              {t('google')}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'rgba(200,195,220,0.4)' }}>
          {mode === 'login' ? t('no_account') : t('have_account')}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', color: '#C9A84C', fontFamily, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
            {mode === 'login' ? t('signup_link') : t('signin_link')}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: 'rgba(200,195,220,0.3)', fontSize: 12, textDecoration: 'none' }}>
            {locale === 'ko' ? '← 홈으로 가기' : locale === 'ja' ? '← ホームへ戻る' : '← Back to Home'}
          </Link>
        </div>
      </div>
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
