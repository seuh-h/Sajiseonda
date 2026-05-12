'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'

const WARNING_DELAY = 10 * 60 * 1000  // 10 minutes
const TOTAL_DELAY = 30 * 60 * 1000   // 30 minutes
const THROTTLE = 1000
const STORAGE_KEY = 'lastActivityTime'

export type AutoLogoutState = 'active' | 'warning' | 'loggedOut'

export function useAutoLogout(isLoggedIn: boolean) {
  const [state, setState] = useState<AutoLogoutState>('active')
  const stateRef = useRef<AutoLogoutState>('active')
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastResetTime = useRef(0)

  const setStateSync = useCallback((next: AutoLogoutState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const clearTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  // Actual Supabase signOut — sets state to 'loggedOut'
  const performSignOut = useCallback(async () => {
    clearTimers()
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem(STORAGE_KEY)
    setStateSync('loggedOut')
  }, [clearTimers, setStateSync])

  const scheduleTimers = useCallback((warningIn: number, logoutIn: number) => {
    clearTimers()
    warningTimer.current = setTimeout(() => setStateSync('warning'), warningIn)
    logoutTimer.current = setTimeout(performSignOut, logoutIn)
  }, [clearTimers, setStateSync, performSignOut])

  // Called by activity event listeners — ignored during warning/loggedOut
  const resetActivity = useCallback(() => {
    if (stateRef.current !== 'active') return
    const now = Date.now()
    if (now - lastResetTime.current < THROTTLE) return
    lastResetTime.current = now
    localStorage.setItem(STORAGE_KEY, now.toString())
    scheduleTimers(WARNING_DELAY, TOTAL_DELAY)
  }, [scheduleTimers])

  // Called by "계속 사용하기" button — bypasses state check
  const continueSession = useCallback(() => {
    const now = Date.now()
    lastResetTime.current = now
    localStorage.setItem(STORAGE_KEY, now.toString())
    setStateSync('active')
    scheduleTimers(WARNING_DELAY, TOTAL_DELAY)
  }, [scheduleTimers, setStateSync])

  // Called by "지금 로그아웃" button — signs out and closes modal
  const logoutNow = useCallback(async () => {
    clearTimers()
    const supabase = createClient()
    await supabase.auth.signOut()
    localStorage.removeItem(STORAGE_KEY)
    setStateSync('active')
  }, [clearTimers, setStateSync])

  // Called when clicking the loggedOut overlay — just closes the modal
  const dismissLoggedOut = useCallback(() => {
    setStateSync('active')
  }, [setStateSync])

  // Activity event listeners
  useEffect(() => {
    if (!isLoggedIn) return

    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click']
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }))

    const now = Date.now()
    lastResetTime.current = now
    localStorage.setItem(STORAGE_KEY, now.toString())
    setStateSync('active')
    scheduleTimers(WARNING_DELAY, TOTAL_DELAY)

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity))
      clearTimers()
    }
  }, [isLoggedIn, resetActivity, scheduleTimers, clearTimers, setStateSync])

  // Tab visibility change — check elapsed time when returning to tab
  useEffect(() => {
    if (!isLoggedIn) return

    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return

      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return

      const elapsed = Date.now() - parseInt(stored)

      if (elapsed >= TOTAL_DELAY) {
        performSignOut()
      } else if (elapsed >= WARNING_DELAY) {
        clearTimers()
        setStateSync('warning')
        logoutTimer.current = setTimeout(performSignOut, TOTAL_DELAY - elapsed)
      } else {
        scheduleTimers(WARNING_DELAY - elapsed, TOTAL_DELAY - elapsed)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isLoggedIn, performSignOut, clearTimers, scheduleTimers, setStateSync])

  // If user logs out externally (not from this hook), clean up silently
  useEffect(() => {
    if (!isLoggedIn && stateRef.current !== 'loggedOut') {
      clearTimers()
      localStorage.removeItem(STORAGE_KEY)
      setStateSync('active')
    }
  }, [isLoggedIn, clearTimers, setStateSync])

  return { state, continueSession, logoutNow, dismissLoggedOut }
}
