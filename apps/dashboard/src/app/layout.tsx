import type { Metadata } from "next"
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "FIP — Frontend Intelligence Platform",
  description: "Frontend observability and performance governance",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jetbrains.variable}`}>
      <body
        className="min-h-screen font-display"
        style={{ background: "var(--bg)", color: "var(--text-primary)" }}
      >
        {children}
      </body>
    </html>
  )
}
