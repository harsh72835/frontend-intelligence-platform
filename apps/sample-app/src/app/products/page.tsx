"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchProducts } from "@/lib/mock-api"

type Product = { id: string; name: string; price: number }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts(300)
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Products</h1>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 transition-colors">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-gray-500 text-sm mt-1">${p.price}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
