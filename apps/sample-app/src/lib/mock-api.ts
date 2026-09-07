export async function fetchProducts(delay = 200): Promise<{ id: string; name: string; price: number }[]> {
  await new Promise((r) => setTimeout(r, delay))
  return [
    { id: "1", name: "Widget Pro", price: 29.99 },
    { id: "2", name: "Gadget Max", price: 49.99 },
    { id: "3", name: "Device Ultra", price: 99.99 },
  ]
}

export async function fetchProduct(id: string, delay = 150): Promise<{ id: string; name: string; price: number; description: string }> {
  await new Promise((r) => setTimeout(r, delay))
  return {
    id,
    name: `Product ${id}`,
    price: 29.99,
    description: "A sample product with detailed description for demo purposes.",
  }
}

export async function fetchReports(delay = 1200): Promise<{ id: string; title: string; value: number }[]> {
  await new Promise((r) => setTimeout(r, delay))
  return [
    { id: "r1", title: "Q1 Performance", value: 92 },
    { id: "r2", title: "Q2 Performance", value: 87 },
    { id: "r3", title: "Q3 Performance", value: 95 },
  ]
}
