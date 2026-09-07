const SESSION_KEY = "__fip_session_id"

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = generateId()
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return generateId()
  }
}

export function generateEventId(): string {
  return generateId()
}
