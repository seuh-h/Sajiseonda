'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/main')
    }
  }, [user, authLoading, router])

  if (authLoading || user) return null

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      if (signInError.message.includes('Email not confirmed')) {
        setError('이메일 인증이 필요해요. 가입 시 받은 6자리 코드로 인증을 완료해주세요.')
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않아요.')
      }
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('banned_until')
      .eq('id', data.user.id)
      .single()

    if (profile?.banned_until) {
      const bannedUntil = new Date(profile.banned_until)
      if (bannedUntil > new Date()) {
        await supabase.auth.signOut()
        if (bannedUntil.getFullYear() >= 9999) {
          setError('영구정지된 계정이에요. 관리자에게 문의해주세요.')
        } else {
          setError(`${bannedUntil.toLocaleDateString('ko-KR')}까지 정지된 계정이에요.`)
        }
        setLoading(false)
        return
      }
    }

    router.push('/main')
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoArea}>
          <Image src="/img/logo-icon.svg" alt="사지선다 로고" width={56} height={56} />
          <span className={styles.logoText}>사지선다</span>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
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
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
          <p className={styles.switchText}>
            계정이 없으신가요? <a href="/signup" className={styles.switchLink}>회원가입</a>
          </p>
        </form>
      </div>
    </div>
  )
}
