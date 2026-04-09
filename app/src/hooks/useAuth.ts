'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export const TEST_USER_ID = '04702adc-5a1e-4ac1-bfc6-13cc8bac7b78'

export function isTestAuthMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('__test_auth_mode') === 'true'
}

export function useAuth() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (isTestAuthMode()) {
        setUserId(TEST_USER_ID)
        setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setLoading(false)
    }
    init()
  }, [router])

  return { userId, loading }
}
