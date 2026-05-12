'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import AutoLogoutModal from './AutoLogoutModal'

export default function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { state, continueSession, logoutNow, dismissLoggedOut } = useAutoLogout(isLoggedIn)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      {children}
      <AutoLogoutModal
        state={state}
        onContinue={continueSession}
        onLogout={logoutNow}
        onDismissLoggedOut={dismissLoggedOut}
      />
    </>
  )
}
