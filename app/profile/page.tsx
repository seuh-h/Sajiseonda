'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './profile.module.css'

type Tab = '내 프로필' | '보안 설정'

export default function ProfilePage() {
  const router = useRouter()
  const { user, role, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('내 프로필')

  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMessage, setPwMessage] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const fetchProfile = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user!.id)
      .single()
    if (data) {
      setNickname(data.nickname ?? '')
      setAvatarUrl(data.avatar_url ?? null)
    }
  }, [user])

  useEffect(() => {
    if (user) fetchProfile()
  }, [user, fetchProfile])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setMessage('')
    const supabase = createClient()

    // Delete existing files before uploading new one
    const { data: existing } = await supabase.storage.from('avatars').list(user.id)
    if (existing && existing.length > 0) {
      const paths = existing.map(f => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
    }

    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setMessage('사진 업로드에 실패했어요.')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: urlWithCacheBust }).eq('id', user.id)
    setAvatarUrl(urlWithCacheBust)
    setMessage('프로필 사진이 변경됐어요!')
    setUploading(false)
  }

  async function handleAvatarRemove() {
    if (!user || !avatarUrl) return
    const supabase = createClient()
    const { data: files } = await supabase.storage.from('avatars').list(user.id)
    if (files && files.length > 0) {
      const paths = files.map(f => `${user.id}/${f.name}`)
      await supabase.storage.from('avatars').remove(paths)
    }
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    setAvatarUrl(null)
    setMessage('프로필 사진이 제거됐어요.')
  }

  async function handleSaveProfile() {
    if (!user) return
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', user.id)
    setMessage(error ? '저장에 실패했어요.' : '저장됐어요!')
    setSaving(false)
  }

  async function handleChangePassword() {
    setPwMessage('')
    if (newPassword !== confirmPassword) {
      setPwMessage('새 비밀번호가 일치하지 않아요.')
      return
    }
    if (newPassword.length < 6) {
      setPwMessage('비밀번호는 6자 이상이어야 해요.')
      return
    }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwMessage(error ? '변경에 실패했어요.' : '비밀번호가 변경됐어요!')
    setPwSaving(false)
    if (!error) {
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (loading) return null

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => router.push('/main')}>← 돌아가기</button>
        <h1 className={styles.title}>내 정보</h1>

        <div className={styles.tabs}>
          {(['내 프로필', '보안 설정'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === '내 프로필' && (
          <div className={styles.section}>
            <div className={styles.avatarArea}>
              <div className={styles.avatar} onClick={() => fileInputRef.current?.click()}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="프로필" fill className={styles.avatarImg} />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    {nickname ? nickname[0].toUpperCase() : '?'}
                  </span>
                )}
                <div className={styles.avatarOverlay}>{uploading ? '업로드 중...' : '변경'}</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              {avatarUrl ? (
                <button type="button" onClick={handleAvatarRemove} className={styles.removeBtn}>
                  사진 제거
                </button>
              ) : (
                <p className={styles.avatarHint}>사진을 클릭해서 변경하세요</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>이메일</label>
              <div className={styles.readOnly}>{user?.email}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>역할</label>
              <div className={styles.readOnly}>
                {role === 'admin' ? '🔴 관리자' : '일반 사용자'}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>별명</label>
              <input
                className={styles.input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="별명을 입력해주세요"
              />
            </div>

            {message && (
              <p className={message.includes('실패') ? styles.error : styles.success}>{message}</p>
            )}

            <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        {tab === '보안 설정' && (
          <div className={styles.section}>
            <p className={styles.securityNote}>비밀번호를 변경해요. 6자 이상으로 설정해주세요.</p>

            <div className={styles.field}>
              <label className={styles.label}>새 비밀번호</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>비밀번호 확인</label>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 재입력"
              />
            </div>

            {pwMessage && (
              <p className={pwMessage.includes('실패') ? styles.error : styles.success}>{pwMessage}</p>
            )}

            <button className={styles.saveBtn} onClick={handleChangePassword} disabled={pwSaving}>
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
