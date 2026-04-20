'use client'
import { db } from './firebase'
import {
  collection, addDoc, getDocs, getDoc, query, where,
  orderBy, deleteDoc, doc, Timestamp, serverTimestamp,
} from 'firebase/firestore'

export interface SavedPerson {
  id?: string
  name: string
  birth_date: string   // "YYYY-MM-DD"
  sex: 'M' | 'F'
  birth_city: string
  hour: number | null
  minute: number | null
  birth_time_label?: string  // e.g. "11:30 - 13:30" or "Unknown"
}

export interface ReadingRecord {
  id?: string
  reading_type: string
  name: string
  birth_date: string   // "YYYY-MM-DD"
  birth_city: string
  target_date?: string // for daily
  result: unknown
  created_at?: Timestamp
}

export function birthDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Readings ────────────────────────────────────────────────────────────────

export async function saveReading(
  email: string,
  data: Omit<ReadingRecord, 'id' | 'created_at'>
): Promise<void> {
  try {
    await addDoc(collection(db, 'users', email, 'readings'), {
      ...data,
      created_at: serverTimestamp(),
    })
  } catch {
    // non-fatal
  }
}

export async function getReadings(email: string): Promise<ReadingRecord[]> {
  try {
    const q = query(
      collection(db, 'users', email, 'readings'),
      orderBy('created_at', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReadingRecord))
  } catch {
    return []
  }
}

export async function getCachedReading(
  email: string,
  reading_type: string,
  name: string,
  birth_date: string,
  birth_city: string,
  target_date?: string
): Promise<ReadingRecord | null> {
  try {
    const q = query(
      collection(db, 'users', email, 'readings'),
      where('reading_type', '==', reading_type)
    )
    const snap = await getDocs(q)
    const match = snap.docs.find(d => {
      const r = d.data() as ReadingRecord
      const base = r.name === name && r.birth_date === birth_date && r.birth_city === birth_city
      if (!base) return false
      if (target_date) return r.target_date === target_date
      return true
    })
    return match ? { id: match.id, ...match.data() } as ReadingRecord : null
  } catch {
    return null
  }
}

// ─── People ───────────────────────────────────────────────────────────────────

export async function savePerson(
  email: string,
  data: Omit<SavedPerson, 'id'>
): Promise<{ id: string }> {
  const ref = await addDoc(collection(db, 'users', email, 'people'), data)
  return { id: ref.id }
}

export async function getPeople(email: string): Promise<SavedPerson[]> {
  try {
    const snap = await getDocs(collection(db, 'users', email, 'people'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedPerson))
  } catch {
    return []
  }
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface PricingConfig {
  personal_fortune: number
  personal_daily_fortune: number
  yearly: number
  compatibility: number
  scenario: number
  [key: string]: number
}

const PRICING_DEFAULTS: PricingConfig = {
  personal_fortune: 1,
  personal_daily_fortune: 1,
  yearly: 1,
  compatibility: 1,
  scenario: 1,
}

export async function getPricing(): Promise<PricingConfig> {
  try {
    const snap = await getDoc(doc(db, 'service_config', 'pricing'))
    if (snap.exists()) return { ...PRICING_DEFAULTS, ...snap.data() as PricingConfig }
  } catch { /* ignore */ }
  return PRICING_DEFAULTS
}

export async function deletePerson(email: string, personId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', email, 'people', personId))
  } catch {
    // non-fatal
  }
}
