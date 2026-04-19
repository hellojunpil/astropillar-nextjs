'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { apiPost } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function registerUser(email: string) {
    try {
      await apiPost('/register_user', { email })
    } catch {
      // register_user 실패해도 로그인은 계속 진행
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        await registerUser(email)
      }
      router.push('/menu')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password.')
      } else if (msg.includes('email-already-in-use')) {
        setError('Email already in use. Try signing in.')
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await registerUser(result.user.email || '')
      router.push('/menu')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="font-display" style={{ color: 'var(--gold)', fontSize: 28, letterSpacing: 4, fontWeight: 600, marginBottom: 6 }}>
            ASTROPILLAR
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your free account'}
          </p>
        </div>

        {/* 카드 */}
        <div className="card" style={{ padding: 28 }}>

          {/* 모드 토글 */}
          <div style={{ display: 'flex', background: '#0a0a1a', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: mode === m ? 'var(--gold)' : 'transparent',
                color: mode === m ? '#16213E' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google 버튼 */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
            background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
            transition: 'border-color 0.2s',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          {/* 구분선 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* 이메일/비밀번호 폼 */}
          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: 12 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)',
                  background: '#0a0a1a', color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)',
                  background: '#0a0a1a', color: '#fff', fontSize: 14, outline: 'none',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account — Free'}
            </button>
          </form>

          {mode === 'signup' && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
              🎁 You'll get 1 free Credit on sign-up
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
