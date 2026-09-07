import Link from "next/link"

export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Welcome to FIP Sample Store</h1>
      <p className="text-gray-600 mb-6 text-sm">
        This app is instrumented with the FIP browser SDK. Browse around to generate telemetry.
      </p>
      <div className="flex gap-3">
        <Link href="/products" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
          Browse Products
        </Link>
        <Link href="/reports" className="bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300">
          View Reports (slow)
        </Link>
      </div>
    </div>
  )
}
