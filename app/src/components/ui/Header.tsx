'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
    }
    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initial = profile?.name ? profile.name.charAt(0) : '?'

  return (
    <header className="bg-orange-600 text-white px-6 h-14 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <Link href="/search" className="text-xl font-extrabold tracking-wide text-white no-underline">
        MeshiLog
      </Link>
      <nav className="flex items-center gap-5">
        <Link
          href="/favorites"
          className={`text-sm text-white/90 hover:text-white transition-opacity ${pathname === '/favorites' ? 'font-bold' : ''}`}
        >
          ♡ お気に入り
        </Link>
        <Link
          href="/mypage"
          className={`text-sm text-white/90 hover:text-white transition-opacity ${pathname === '/mypage' ? 'font-bold' : ''}`}
        >
          マイページ
        </Link>
        <button
          onClick={handleSignOut}
          className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-white/35 transition-colors"
          title="ログアウト"
        >
          {initial}
        </button>
      </nav>
    </header>
  )
}
