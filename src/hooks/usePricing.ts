'use client'
import { useState, useEffect } from 'react'
import { getPricing, PricingConfig } from '@/lib/firestore'

const DEFAULTS: PricingConfig = {
  personal_fortune: 1,
  personal_daily_fortune: 1,
  yearly: 1,
  compatibility: 1,
  scenario: 1,
  tarot_three_card: 1,
  tarot_relationship: 1,
  tarot_celtic_cross: 2,
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULTS)
  useEffect(() => {
    getPricing().then(setPricing)
  }, [])
  return pricing
}
