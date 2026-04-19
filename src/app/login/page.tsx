'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  getAdditionalUserInfo,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { apiPost } from '@/lib/api'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  async function registerUser(email: string) {
    await apiPost('/register_user', { email })
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await registerUser(cred.user.email!)
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
      const info = getAdditionalUserInfo(result)
      if (info?.isNewUser) await registerUser(result.user.email!)
      router.push('/menu')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(msg.includes('user-not-found') ? 'No account found with this email.' : msg)
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setResetSent(false)
    setPassword('')
    setConfirmPassword('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1px solid var(--border)', background: '#0a0a1a',
    color: '#fff', fontSize: 14, outline: 'none',
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="font-display" style={{ color: 'var(--gold)', fontSize: 28, letterSpacing: 4, fontWeight: 600, marginBottom: 6 }}>
            ASTROPILLAR
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your free account' : 'Reset your password'}
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>

          {/* Forgot password view */}
          {mode === 'forgot' ? (
            resetSent ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>📬</p>
                <p style={{ color: '#fff', fontWeight: 600, marginBottom: 8 }}>Check your email</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                  We sent a password reset link to <strong style={{ color: '#fff' }}>{email}</strong>
                </p>
                <button onClick={() => switchMode('login')} style={{ color: 'var(--gold)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                  Enter your email and we'll send you a reset link.
                </p>
                <div style={{ marginBottom: 16 }}>
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => switchMode('login')} style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                  ← Back to Sign In
                </button>
              </form>
            )
          ) : (
            <>
              {/* Mode toggle */}
              <div style={{ display: 'flex', background: '#0a0a1a', borderRadius: 10, padding: 4, marginBottom: 24 }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => switchMode(m)} style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: mode === m ? 'var(--gold)' : 'transparent',
                    color: mode === m ? '#16213E' : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
                background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <form onSubmit={handleEmailAuth}>
                <div style={{ marginBottom: 12 }}>
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
                </div>
                <div style={{ marginBottom: mode === 'signup' ? 12 : 8 }}>
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
                </div>

                {mode === 'signup' && (
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? '#ef4444' : 'var(--border)' }}
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Passwords do not match.</p>
                    )}
                  </div>
                )}

                {mode === 'login' && (
                  <div style={{ textAlign: 'right', marginBottom: 16 }}>
                    <button type="button" onClick={() => switchMode('forgot')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || (mode === 'signup' && !!confirmPassword && confirmPassword !== password)}
                  className="btn-gold"
                  style={{ width: '100%', marginTop: mode === 'signup' ? 12 : 0, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account — Free'}
                </button>
              </form>

              {mode === 'signup' && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 14 }}>
                  🎁 You&apos;ll get 1 free Credit on sign-up
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
