import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MeshiLog - 社内飲食店共有プラットフォーム',
  description: '社員がランチ・会食先の飲食店情報を共有・発見できる社内プラットフォーム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
