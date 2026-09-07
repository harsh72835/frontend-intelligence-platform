import { Nav } from "@/components/Nav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </>
  )
}
