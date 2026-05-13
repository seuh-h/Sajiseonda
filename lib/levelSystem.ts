import { createClient } from '@/lib/supabase'

export const LEVEL_NAMES: Record<number, string> = {
  1: '입문자',
  2: '초보자',
  3: '중급자',
  4: '고급자',
  5: '장인',
  6: '관리자',
}

export const LEVEL_ICONS: Record<number, string> = {
  1: '🪨',
  2: '🥉',
  3: '🥈',
  4: '🥇',
  5: '💎',
  6: '👑',
}

export function getLevelIcon(level: number): string {
  return LEVEL_ICONS[level] ?? '🪨'
}

// Success count required to reach each level (cumulative)
export const LEVEL_UP_THRESHOLDS: Record<number, number> = {
  1: 5,   // 5 successes → level 2
  2: 15,  // 15 successes → level 3
  3: 30,  // 30 successes → level 4
  4: 50,  // 50 successes → level 5
  // level 5 → 6 is not allowed for regular users
}

export const XP_GAMES = ['memory', 'detective', 'reaction', 'aim', 'shooting']

export function getLevelName(level: number): string {
  return LEVEL_NAMES[level] ?? '알 수 없음'
}

export function getNextLevelThreshold(level: number): number | null {
  return LEVEL_UP_THRESHOLDS[level] ?? null
}

export async function recordSuccess(userId: string, gameId: string): Promise<void> {
  const supabase = createClient()

  await supabase.from('game_results').insert({ user_id: userId, game_id: gameId })

  const { count } = await supabase
    .from('game_results')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (count === null) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', userId)
    .single()

  const currentLevel = profile?.level ?? 1
  if (currentLevel >= 5) return

  const threshold = LEVEL_UP_THRESHOLDS[currentLevel]
  if (threshold !== undefined && count >= threshold) {
    await supabase
      .from('profiles')
      .update({ level: currentLevel + 1 })
      .eq('id', userId)
  }
}
