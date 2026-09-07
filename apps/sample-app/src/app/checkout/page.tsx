"use client"

import { useState } from "react"

export default function CheckoutPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("submitting")
    await new Promise((r) => setTimeout(r, 800))
    // Controlled error for demo telemetry
    if (Math.random() < 0.3) {
      setStatus("error")
      throw new Error("Payment processing failed: timeout")
    }
    setStatus("done")
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-6">Checkout</h1>
      {status === "done" ? (
        <p className="text-green-600 text-sm">Order placed successfully!</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Card Number</label>
            <input type="text" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="4242 4242 4242 4242" />
          </div>
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {status === "submitting" ? "Processing..." : "Place Order"}
          </button>
          {status === "error" && (
            <p className="text-red-500 text-sm">Payment failed. Please try again.</p>
          )}
        </form>
      )}
    </div>
  )
}
