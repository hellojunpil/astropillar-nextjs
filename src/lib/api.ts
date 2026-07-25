const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ''

export async function apiPost<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = err.detail
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.')
  }
  return res.json()
}

// 가입 직후에는 register_user(웰컴 크레딧 지급)가 끝나기 전에 잔액 조회가 도착해
// user_not_found(ok:false, 0)가 올 수 있음 — ok가 될 때까지 짧게 재시도
export async function getPouchWithRetry(email: string, retries = 4): Promise<number> {
  let last = 0
  for (let i = 0; i <= retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500))
    try {
      const data = await apiGet<{ ok: boolean; pouch_count: number }>('/get_pouch', { email })
      last = data.pouch_count
      if (data.ok) return data.pouch_count
    } catch { /* 다음 시도 */ }
  }
  return last
}

export async function apiGet<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const detail = err.detail
    throw new Error(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.')
  }
  return res.json()
}
