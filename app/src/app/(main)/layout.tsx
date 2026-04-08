import Header from '@/components/ui/Header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="max-w-[1100px] mx-auto px-6 py-8">
        {children}
      </main>
    </>
  )
}
