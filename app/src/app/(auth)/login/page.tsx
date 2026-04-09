'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('メールアドレスまたはパスワードが正しくありません。')
        return
      }
      router.push('/search')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-[#f9f5f0] flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="text-4xl font-extrabold text-orange-600">MeshiLog</div>
          <div className="text-sm text-gray-400 mt-1">社内飲食店共有プラットフォーム</div>
        </div>

        <div className="bg-white rounded-2xl p-9 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-6">ログイン</h2>

          {error && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-700 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.co.jp"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="flex items-center gap-3 text-xs text-gray-300 my-5">
            <div className="flex-1 border-t border-gray-100" />
            または
            <div className="flex-1 border-t border-gray-100" />
          </div>

          <p className="text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-orange-600 font-semibold hover:underline">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
