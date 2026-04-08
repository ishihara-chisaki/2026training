'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DEPARTMENTS } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('パスワードが一致しません。')
      return
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください。')
      return
    }
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) { setError(signUpError.message); return }
      if (data.user) {
        await supabase.from('profiles').insert({ id: data.user.id, name, department: department || null })
      }
      router.push('/search')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-[#f9f5f0] flex items-center justify-center py-10">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-7">
          <div className="text-3xl font-extrabold text-orange-600">MeshiLog</div>
        </div>

        <div className="bg-white rounded-2xl p-9 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-6">新規アカウント登録</h2>

          {error && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-700 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">氏名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="石原 千祥"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">メールアドレス（社内メール）</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@company.co.jp"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">社内のメールアドレスを使用してください</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">部署</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors bg-white"
              >
                <option value="">選択してください</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.label}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">8文字以上、英数字を含めてください</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">パスワード（確認）</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="パスワードを再入力"
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 rounded-lg text-base font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-orange-600 font-semibold hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
