'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './signup.module.css'

type Step = 'form' | 'verify'

export default function SignupPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<Step>('form')

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/main')
    }
  }, [user, authLoading, router])

  if (authLoading || user) return null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않아요.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해요.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      if (signUpError.message.includes('rate limit')) {
        setError('이메일 발송 한도를 초과했어요. 잠시 후 다시 시도해주세요.')
      } else {
        setError('회원가입에 실패했어요. 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    // Supabase returns empty identities for already-registered emails
    if (!data.user || data.user.identities?.length === 0) {
      setError('이미 사용중인 이메일이에요.')
      setLoading(false)
      return
    }

    setStep('verify')
    setLoading(false)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (verifyError) {
      setError('인증 코드가 올바르지 않아요. 다시 확인해주세요.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    alert('이메일 인증이 완료됐어요. 로그인해주세요.')
    router.push('/login')
  }

  async function handleResend() {
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    alert('인증 코드를 다시 보냈어요. 이메일을 확인해주세요.')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <Image src="/img/logo-icon.svg" alt="사지선다 로고" width={56} height={56} />
          <span className={styles.logoText}>사지선다</span>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSignup} className={styles.form}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={styles.input}
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? '처리 중...' : '회원가입'}
            </button>
            <p className={styles.switchText}>
              이미 계정이 있으신가요? <a href="/login" className={styles.switchLink}>로그인</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <p className={styles.verifyDesc}>
              <strong>{email}</strong>로 인증 코드를 보냈어요.<br />
              이메일에서 인증 코드를 확인해주세요.
            </p>
            <input
              type="text"
              placeholder="인증 코드 입력"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              className={styles.input}
              inputMode="numeric"
            />
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? '확인 중...' : '인증하기'}
            </button>
            <button type="button" onClick={handleResend} className={styles.resendBtn}>
              코드 다시 받기
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
