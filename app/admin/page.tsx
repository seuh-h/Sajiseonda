'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './admin.module.css'

import { getLevelName, getLevelIcon } from '@/lib/levelSystem'

type UserProfile = {
  id: string
  email: string | null
  nickname: string | null
  last_seen: string | null
  banned_until: string | null
  level: number | null
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
}

function isBanned(bannedUntil: string | null): boolean {
  if (!bannedUntil) return false
  return new Date(bannedUntil) > new Date()
}

function getBanLabel(bannedUntil: string | null): string {
  if (!bannedUntil) return ''
  const date = new Date(bannedUntil)
  if (date.getFullYear() >= 9999) return '영구정지'
  return `${date.toLocaleDateString('ko-KR')}까지 정지`
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isAdmin, loading } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [fetching, setFetching] = useState(true)
  const [banDate, setBanDate] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push('/main')
  }, [user, isAdmin, loading, router])

  const fetchUsers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, email, nickname, last_seen, banned_until, level')
      .order('last_seen', { ascending: false, nullsFirst: false })
    setUsers(data ?? [])
    setFetching(false)
  }, [])

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin, fetchUsers])

  async function handleBan(userId: string, until: Date) {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ banned_until: until.toISOString() })
      .eq('id', userId)
    fetchUsers()
  }

  async function handleUnban(userId: string) {
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ banned_until: null })
      .eq('id', userId)
    fetchUsers()
  }

  function renderUser(u: UserProfile) {
    const banned = isBanned(u.banned_until)
    return (
      <div key={u.id} className={styles.userRow}>
        <div className={styles.userInfo}>
          <span className={styles.userEmail}>{u.email ?? '이메일 없음'}</span>
          {u.nickname && <span className={styles.userNickname}>{u.nickname}</span>}
          {u.level === 6
            ? <span className={styles.adminBadge}>관리자</span>
            : <span className={styles.userBadge}>{getLevelIcon(u.level ?? 1)} {getLevelName(u.level ?? 1)}</span>
          }
          {banned && <span className={styles.bannedBadge}>{getBanLabel(u.banned_until)}</span>}
        </div>
        <div className={styles.userActions}>
          {banned ? (
            <button className={styles.unbanBtn} onClick={() => handleUnban(u.id)}>
              정지 해제
            </button>
          ) : (
            <>
              <input
                type="date"
                className={styles.dateInput}
                min={new Date().toISOString().split('T')[0]}
                value={banDate[u.id] ?? ''}
                onChange={(e) => setBanDate(prev => ({ ...prev, [u.id]: e.target.value }))}
              />
              <button
                className={styles.tempBanBtn}
                disabled={!banDate[u.id]}
                onClick={() => {
                  if (banDate[u.id]) handleBan(u.id, new Date(banDate[u.id]))
                }}
              >
                기간정지
              </button>
              <button
                className={styles.permBanBtn}
                onClick={() => {
                  if (window.confirm(`${u.email}을 영구정지하시겠어요?`)) {
                    handleBan(u.id, new Date('9999-12-31'))
                  }
                }}
              >
                영구정지
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (loading || fetching) return null

  const onlineUsers = users.filter(u => isOnline(u.last_seen))
  const offlineUsers = users.filter(u => !isOnline(u.last_seen))

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button className={styles.backBtn} onClick={() => router.push('/main')}>← 돌아가기</button>
        <h1 className={styles.title}>관리자 패널</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.onlineDot} />
            접속 중 ({onlineUsers.length}명)
          </h2>
          {onlineUsers.length === 0
            ? <p className={styles.empty}>현재 접속 중인 유저가 없어요.</p>
            : onlineUsers.map(renderUser)
          }
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.offlineDot} />
            오프라인 ({offlineUsers.length}명)
          </h2>
          {offlineUsers.length === 0
            ? <p className={styles.empty}>오프라인 유저가 없어요.</p>
            : offlineUsers.map(renderUser)
          }
        </section>
      </div>
    </div>
  )
}
