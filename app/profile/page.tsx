'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import type { Lang } from '@/contexts/LanguageContext'
import { getLevelName, getLevelIcon, getNextLevelThreshold } from '@/lib/levelSystem'
import styles from './profile.module.css'

type Tab = 'profile' | 'security' | 'language'

export default function ProfilePage() {
  const router = useRouter()
  const { user, level, loading, isAdmin } = useAuth()
  const { t, lang, setLang } = useTranslation()
  const [tab, setTab] = useState<Tab>('profile')
  const [successCount, setSuccessCount] = useState<number>(0)

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

    const { count } = await supabase
      .from('game_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
    setSuccessCount(count ?? 0)
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
      setMessage(t.profile.uploadError)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
    await supabase.from('profiles').update({ avatar_url: urlWithCacheBust }).eq('id', user.id)
    setAvatarUrl(urlWithCacheBust)
    setMessage(t.profile.changedPhoto)
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
    setMessage(t.profile.removedPhoto)
  }

  async function handleSaveProfile() {
    if (!user) return
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ nickname }).eq('id', user.id)
    setMessage(error ? t.profile.saveError : t.profile.savedMsg)
    setSaving(false)
  }

  async function handleChangePassword() {
    setPwMessage('')
    if (newPassword !== confirmPassword) { setPwMessage(t.profile.pwMismatch); return }
    if (newPassword.length < 6) { setPwMessage(t.profile.pwTooShort); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwMessage(error ? t.profile.pwFailed : t.profile.pwChanged)
    setPwSaving(false)
    if (!error) { setNewPassword(''); setConfirmPassword('') }
  }

  if (loading) return null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: t.profile.tabs.profile },
    { key: 'security', label: t.profile.tabs.security },
    { key: 'language', label: t.profile.tabs.language },
  ]

  const LANGS: { key: Lang; label: string }[] = [
    { key: 'ko', label: t.profile.langs.ko },
    { key: 'en', label: t.profile.langs.en },
    { key: 'zh', label: t.profile.langs.zh },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => router.push('/main')}>{t.profile.backBtn}</button>
        <h1 className={styles.title}>{t.profile.title}</h1>

        <div className={styles.tabs}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
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
                <div className={styles.avatarOverlay}>
                  {uploading ? t.profile.uploadingPhoto : t.profile.changePhoto}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              {avatarUrl ? (
                <button type="button" onClick={handleAvatarRemove} className={styles.removeBtn}>
                  {t.profile.removePhoto}
                </button>
              ) : (
                <p className={styles.avatarHint}>{t.profile.photoHint}</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.profile.email}</label>
              <div className={styles.readOnly}>{user?.email}</div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.profile.level}</label>
              <div className={styles.readOnly}>{getLevelIcon(level)} {getLevelName(level)}</div>
            </div>

            {!isAdmin && (
              <div className={styles.field}>
                <label className={styles.label}>{t.profile.gameCount}</label>
                <div className={styles.readOnly}>
                  {successCount}{t.profile.times}
                  {level < 5 && (
                    <span style={{ marginLeft: '8px', fontSize: '13px', color: '#888' }}>
                      ({t.profile.nextLevel.replace('{n}', String(Math.max(0, (getNextLevelThreshold(level) ?? 0) - successCount)))})
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>{t.profile.nickname}</label>
              <input
                className={styles.input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.profile.nicknamePlaceholder}
              />
            </div>

            {message && (
              <p className={message.includes('실패') || message.includes('Failed') || message.includes('失败') ? styles.error : styles.success}>
                {message}
              </p>
            )}

            <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saving}>
              {saving ? t.profile.savingBtn : t.profile.saveBtn}
            </button>
          </div>
        )}

        {tab === 'security' && (
          <div className={styles.section}>
            <p className={styles.securityNote}>{t.profile.securityNote}</p>

            <div className={styles.field}>
              <label className={styles.label}>{t.profile.newPassword}</label>
              <input
                className={styles.input}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.profile.newPasswordPlaceholder}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>{t.profile.confirmPassword}</label>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.profile.confirmPasswordPlaceholder}
              />
            </div>

            {pwMessage && (
              <p className={pwMessage.includes('실패') || pwMessage.includes('Failed') || pwMessage.includes('失败') || pwMessage.includes('不一致') || pwMessage.includes('mismatch') || pwMessage.includes('match') ? styles.error : styles.success}>
                {pwMessage}
              </p>
            )}

            <button className={styles.saveBtn} onClick={handleChangePassword} disabled={pwSaving}>
              {pwSaving ? t.profile.changingPw : t.profile.changePwBtn}
            </button>
          </div>
        )}

        {tab === 'language' && (
          <div className={styles.section}>
            <p className={styles.securityNote}>{t.profile.langNote}</p>
            <div className={styles.langGrid}>
              {LANGS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.langBtn} ${lang === key ? styles.langBtnActive : ''}`}
                  onClick={() => setLang(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
