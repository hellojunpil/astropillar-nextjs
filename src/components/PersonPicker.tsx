'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SavedPerson } from '@/lib/firestore'
import BirthForm, { BirthData } from './BirthForm'

export function personToBirthData(p: SavedPerson): BirthData {
  const [year, month, day] = p.birth_date.split('-').map(Number)
  return { name: p.name, year, month, day, hour: p.hour, minute: p.minute, sex: p.sex, city: p.birth_city }
}

function birthTimeLabel(p: SavedPerson) {
  if (p.hour === null || p.hour === undefined) return 'Birth time unknown'
  return `${String(p.hour).padStart(2,'0')}:${String(p.minute ?? 0).padStart(2,'0')}`
}

interface Props {
  people: SavedPerson[]
  onSubmit: (data: BirthData) => void
  loading: boolean
  submitLabel?: string
  costBadge?: string
  headerSlot?: React.ReactNode
}

export default function PersonPicker({ people, onSubmit, loading, submitLabel = 'Get My Reading', costBadge, headerSlot }: Props) {
  const [mode, setMode] = useState<'select' | 'manual'>('select')
  const [selectedId, setSelectedId] = useState('')

  const selectedPerson = people.find(p => p.id === selectedId) ?? null

  if (mode === 'manual') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {headerSlot}
        {people.length > 0 && (
          <button type="button" onClick={() => setMode('select')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', textAlign:'left', padding:0, display:'flex', alignItems:'center', gap:6 }}>
            ← Select a saved person
          </button>
        )}
        <BirthForm onSubmit={onSubmit} loading={loading} submitLabel={submitLabel} costBadge={costBadge} />
      </div>
    )
  }

  // Select mode
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {headerSlot}

      {people.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'36px 24px' }}>
          <p style={{ fontSize:28, marginBottom:12 }}>👤</p>
          <p style={{ color:'#fff', fontSize:15, fontWeight:600, marginBottom:8 }}>No saved persons yet.</p>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20, lineHeight:1.6 }}>
            Save yourself in My Persons first for quick readings.
          </p>
          <Link href="/library" className="btn-gold" style={{ display:'inline-block', padding:'11px 24px', fontSize:13, textDecoration:'none' }}>
            Add Person →
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {people.map(p => {
              const selected = p.id === selectedId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id ?? '')}
                  style={{
                    width:'100%', textAlign:'left', padding:'14px 16px', borderRadius:14, cursor:'pointer',
                    border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
                    background: selected ? 'rgba(201,168,76,0.08)' : 'var(--card)',
                    transition:'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ color: selected ? 'var(--gold)' : '#fff', fontSize:15, fontWeight:700 }}>{p.name}</p>
                    {selected && <span style={{ color:'var(--gold)', fontSize:16 }}>✦</span>}
                  </div>
                  <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>
                    {p.birth_date} · {p.sex === 'F' ? '♀' : '♂'} · {p.birth_city}
                  </p>
                  <p style={{ color:'var(--text-muted)', fontSize:11, marginTop:2 }}>{birthTimeLabel(p)}</p>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => selectedPerson && onSubmit(personToBirthData(selectedPerson))}
            disabled={!selectedPerson || loading}
            className="btn-gold"
            style={{
              marginTop:4,
              opacity: (!selectedPerson || loading) ? 0.5 : 1,
              cursor: (!selectedPerson || loading) ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}
          >
            {loading
              ? <><span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>✦</span> Reading the stars...</>
              : <>{submitLabel}{costBadge && <span style={{ background:'rgba(22,33,62,0.6)', borderRadius:20, padding:'2px 10px', fontSize:12 }}>{costBadge}</span>}</>
            }
          </button>
        </>
      )}

      <button type="button" onClick={() => setMode('manual')} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textAlign:'center', padding:'4px 0', textDecoration:'underline', textUnderlineOffset:3 }}>
        Enter manually →
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
