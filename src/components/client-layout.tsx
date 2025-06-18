'use client'

import { usePathname } from 'next/navigation'
import Navigation from './navigation'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  return (
    <>
      {!isAuthPage && <Navigation />}
      {children}
    </>
  )
}