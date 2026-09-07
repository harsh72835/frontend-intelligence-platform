"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchProduct } from "@/lib/mock-api"

type Product = { id: string; name: string; price: number; description: string }

export default function ProductDetailPage() {
  const params = useParams()
  const id = params["id"] as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct(id, 200)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>
  if (!product) return <p className="text-red-500 text-sm">Product not found.</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">{product.name}</h1>
      <p className="text-2xl font-bold text-blue-600 mb-4">${product.price}</p>
      <p className="text-gray-600 text-sm mb-6">{product.description}</p>
      <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
        Add to Cart
      </button>
    </div>
  )
}
