"use client"

import "./globals.css"
import Link from "next/link"
import { useEffect } from "react"
import { initializeFip } from "@/lib/fip"

function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeFip()
  }, [])

  return (
    <>
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-6 h-14">
          <Link href="/" className="font-semibold text-sm">Shop</Link>
          <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900">Products</Link>
          <Link href="/checkout" className="text-sm text-gray-600 hover:text-gray-900">Checkout</Link>
          <Link href="/reports" className="text-sm text-gray-600 hover:text-gray-900">Reports</Link>
          <Link href="/demo" className="text-sm text-amber-600 hover:text-amber-800 font-medium">Demo</Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
