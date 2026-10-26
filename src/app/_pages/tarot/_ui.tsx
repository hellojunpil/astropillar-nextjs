'use client'
/**
 * 타로 스프레드 3종(three-card / relationship / celtic-cross) 공용 프레젠테이션 컴포넌트.
 * 로직(상태·API·차감·저장)은 각 페이지에 그대로 있고, 여기는 모양만 담당.
 * `_` 접두사 폴더/파일이라 라우트로 노출되지 않음.
 */
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/navigation'
import { TarotCard, cardImageUrl } from '@/lib/tarotDeck'

/* ── 공용 스타일 ─────────────────────────────────────────── */
export function TarotStyles() {
  return (
    <style>{`
      .tr-wrap { padding-top: 20px; }
      .tr-head { display:flex; justify-content:space-between; align-items:center; padding: 12px 16px;
        position: sticky; top: 0; z-index: 30;
        background: linear-gradient(180deg, rgba(7,9,20,.92), rgba(7,9,20,.6));
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
      .tr-logo { font-family:'Cormorant Garamond',serif; font-weight:700; font-size:16px; letter-spacing:.2em; color: var(--gold); text-decoration:none; }
      .tr-pill { display:flex; align-items:center; gap:6px; height:34px; padding:0 12px; border-radius:999px; text-decoration:none;
        background: var(--gold-soft); border:1px solid var(--gold-line); }
      .tr-pill b { color: var(--gold-light); font-size:14px; font-variant-numeric: tabular-nums; }
      .tr-pill span { color: rgba(230,205,133,.75); font-size:11px; }

      .tr-title { text-align:center; margin: 8px auto 28px; max-width: 640px; }
      .tr-title-glyph { display:inline-grid; place-items:center; width:44px; height:44px; border-radius:50%;
        border:1px solid var(--gold-line); color: var(--gold-light); font-size:18px; margin-bottom: 14px;
        background: radial-gradient(circle, rgba(201,168,76,.16), transparent 70%); }
      .tr-title h1 { font-family: var(--font-display); font-weight: 600; font-size: clamp(26px, 3.2vw, 38px); line-height: 1.2; }
      html[lang="ko"] .tr-title h1, html[lang="ja"] .tr-title h1 { font-family: 'Noto Serif KR','Noto Serif JP', serif; font-weight: 700; }
      .tr-title p { margin-top: 10px; color: var(--ink-2); font-size: 14.5px; }
      .tr-title .ap-badge { margin-top: 14px; }

      .tr-panel { padding: 28px 24px; }
      @media (min-width: 640px) { .tr-panel { padding: 32px; } }
      .tr-label { display:block; font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
      .tr-help { font-size: 13px; color: var(--ink-2); margin-bottom: 14px; line-height: 1.6; }
      .tr-sublabel { display:block; font-size: 13px; color: var(--ink-2); margin-bottom: 8px; }
      .tr-opt { color: var(--ink-3); }
      .tr-input { width:100%; background: rgba(7,9,20,.55); border:1px solid var(--line-strong); border-radius: 12px;
        padding: 14px 16px; color: var(--ink); font-size: 16px; line-height: 1.6; resize: none; outline: none; color-scheme: dark;
        transition: border-color .2s, box-shadow .2s; }
      .tr-input::placeholder { color: var(--ink-3); }
      .tr-input:focus { border-color: var(--gold-line); box-shadow: 0 0 0 3px rgba(201,168,76,.12); }
      .tr-input.is-filled { border-color: var(--gold-line); }
      select.tr-input { appearance:none; -webkit-appearance:none; cursor:pointer; padding-right: 40px;
        background-image: linear-gradient(45deg, transparent 50%, var(--gold) 50%), linear-gradient(135deg, var(--gold) 50%, transparent 50%);
        background-position: calc(100% - 20px) 50%, calc(100% - 15px) 50%; background-size: 5px 5px; background-repeat:no-repeat; }
      .tr-hint { color: rgba(230,205,133,.75); font-size: 12.5px; margin-top: 10px; }
      .tr-full { width: 100%; margin-top: 20px; }
      .tr-error { color: var(--danger); font-size: 13.5px; text-align:center; margin-bottom: 14px; }

      .tr-question { display:flex; gap: 12px; align-items:flex-start; padding: 14px 18px; margin-bottom: 20px; }
      .tr-question small { display:block; font-size: 12px; color: var(--ink-3); }
      .tr-question p { color: var(--ink); font-size: 15px; line-height: 1.6; }
      .tr-question-glyph { color: var(--gold-light); font-size: 14px; margin-top: 3px; }

      /* ── 카드 뒷면: 금빛 천체 문양 ── */
      .tr-back { position:relative; width: var(--cw, 44px); aspect-ratio: 2 / 3; border-radius: calc(var(--cw, 44px) * .11);
        background:
          radial-gradient(circle at 50% 50%, transparent 0 26%, rgba(201,168,76,.55) 27%, transparent 29%),
          radial-gradient(circle at 50% 50%, transparent 0 40%, rgba(170,165,209,.25) 41%, transparent 42.5%),
          repeating-conic-gradient(from 0deg at 50% 50%, rgba(201,168,76,.13) 0 6deg, transparent 6deg 15deg),
          radial-gradient(120% 90% at 50% 0%, #2a2f5c 0%, #141936 55%, #0b0e22 100%);
        box-shadow: inset 0 0 0 2px #0b0e22, inset 0 0 0 3px rgba(201,168,76,.55), 0 6px 14px -6px rgba(0,0,0,.8);
        flex-shrink: 0; }
      .tr-back::after { content:"✦"; position:absolute; inset:0; display:grid; place-items:center;
        color: var(--gold-light); font-size: calc(var(--cw, 44px) * .26); text-shadow: 0 0 8px rgba(230,205,133,.7); }
      .tr-back::before { content:""; position:absolute; inset: 7%; border-radius: inherit; border: 1px solid rgba(201,168,76,.25); }

      /* ── 덱 ── */
      .tr-deck-meta { display:flex; justify-content:space-between; align-items:baseline; gap: 12px; margin-bottom: 10px; }
      .tr-deck-meta p { font-size: 12.5px; color: var(--ink-3); }
      .tr-deck-scroll { max-height: 380px; overflow-y: auto; border-radius: 14px; padding: 12px;
        background: rgba(7,9,20,.35); border: 1px solid var(--line); }
      .tr-deck { --cw: 44px; display:grid; grid-template-columns: repeat(6, 1fr); gap: 10px 6px; justify-items:center; }
      .tr-deck-card { background:none; border:0; padding:0; cursor:pointer; border-radius: 6px;
        transition: transform .28s var(--ease-out), opacity .28s, filter .2s; }
      @media (hover: hover) {
        .tr-deck-card:hover { transform: translateY(-6px) rotate(-2deg); filter: drop-shadow(0 0 10px rgba(230,205,133,.45)); }
      }
      .tr-deck-card.is-exit { transform: scale(.5) translateY(-18px); opacity: 0; }
      .tr-deck-empty { width: var(--cw); aspect-ratio: 2/3; border-radius: 6px; border: 1px dashed rgba(201,168,76,.16); background: rgba(201,168,76,.02); }
      @media (min-width: 1024px) {
        .tr-deck-scroll { max-height: none; overflow: visible; padding: 20px; }
        .tr-deck { --cw: 54px; grid-template-columns: repeat(13, 1fr); gap: 14px 8px; }
      }

      /* ── 슬롯 ── */
      .tr-slots { display:flex; justify-content:center; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
      .tr-slots.is-grid { display:grid; grid-template-columns: repeat(2, auto); justify-content:center; }
      @media (min-width: 640px) { .tr-slots.is-grid { grid-template-columns: repeat(4, auto); } }
      .tr-slot { display:flex; flex-direction:column; align-items:center; gap: 8px; --cw: 76px; }
      @media (min-width: 1024px) { .tr-slot { --cw: 96px; } }
      .tr-slot-box { width: var(--cw); aspect-ratio: 2/3; border-radius: 10px; display:grid; place-items:center;
        border: 1.5px dashed rgba(201,168,76,.32); background: rgba(201,168,76,.03);
        transition: transform .35s var(--ease-out), opacity .35s, border-color .3s, box-shadow .3s; }
      .tr-slot-box.is-next { border-color: rgba(230,205,133,.75); box-shadow: 0 0 0 4px rgba(201,168,76,.08), 0 0 24px rgba(201,168,76,.25);
        animation: apGlow 2.4s ease-in-out infinite; }
      .tr-slot-box.is-filled { border: 0; background: none; }
      .tr-slot-box.is-entering { transform: translateY(10px) scale(.92); opacity: 0; }
      .tr-slot-num { font-family: var(--font-display); font-size: 22px; color: rgba(201,168,76,.4); }
      .tr-slot-label { font-size: 12.5px; font-weight: 700; color: var(--ink-3); text-align:center; max-width: calc(var(--cw) + 24px); }
      .tr-slot-label.is-on { color: var(--gold-light); }
      .tr-status { text-align:center; color: var(--ink-2); font-size: 14px; margin-bottom: 18px; }
      .tr-status b { color: var(--gold-light); font-variant-numeric: tabular-nums; }

      /* ── 공개된 카드 (뒤집기) ── */
      .tr-reveal-row { display:flex; justify-content:center; gap: 14px; flex-wrap: wrap; margin-bottom: 28px; }
      .tr-reveal-row.is-grid { display:grid; grid-template-columns: repeat(2, auto); justify-content:center; }
      @media (min-width: 640px) { .tr-reveal-row.is-grid { grid-template-columns: repeat(4, auto); } }
      .tr-rcard { --cw: 92px; display:flex; flex-direction:column; align-items:center; gap: 8px; perspective: 900px; }
      @media (min-width: 1024px) { .tr-rcard { --cw: 128px; } }
      .tr-flip { position:relative; width: var(--cw); aspect-ratio: 2/3; transform-style: preserve-3d;
        animation: trFlip .9s var(--ease-out) both; }
      .tr-flip > * { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; }
      .tr-flip .tr-back { width: 100%; transform: rotateY(180deg); }
      .tr-face { width:100%; height:100%; object-fit:cover; border-radius: calc(var(--cw) * .08);
        border: 1px solid rgba(201,168,76,.6); box-shadow: 0 18px 36px -14px rgba(0,0,0,.85), 0 0 30px -10px rgba(201,168,76,.35); background:#141936; }
      @keyframes trFlip { from { transform: rotateY(180deg) translateY(8px); } to { transform: rotateY(0) translateY(0); } }
      .tr-rcard-pos { font-size: 12.5px; font-weight: 700; color: var(--gold-light); text-align:center; }
      .tr-rcard-name { font-size: 11.5px; color: var(--ink-2); text-align:center; max-width: calc(var(--cw) + 16px); line-height: 1.35; }

      /* ── 로딩 ── */
      .tr-loading { display:flex; flex-direction:column; align-items:center; gap: 18px; padding: 12px 0 28px; text-align:center; }
      .tr-orb { position:relative; width: 112px; height: 112px; display:grid; place-items:center; }
      .tr-orb svg { position:absolute; inset:0; transform: rotate(-90deg); }
      .tr-orb-ring { position:absolute; inset: -10px; border-radius:50%; border: 1px dashed rgba(170,165,209,.3); animation: apSpin 14s linear infinite; }
      .tr-orb-ring::before { content:"✦"; position:absolute; top:-8px; left:50%; margin-left:-6px; font-size:12px; color: var(--gold-light); }
      .tr-orb b { font-size: 20px; color: var(--gold-light); font-variant-numeric: tabular-nums; }
      .tr-loading h2 { font-size: 16px; font-weight: 700; }
      .tr-loading p { font-size: 13px; color: var(--ink-2); }
      .tr-loading .tr-warn { color: var(--danger); font-size: 12.5px; }

      /* ── 결과 아코디언 ── */
      .tr-result { padding: 4px 22px; margin-bottom: 20px; }
      @media (min-width: 640px) { .tr-result { padding: 8px 32px; } }
      .tr-acc { border-bottom: 1px solid var(--line); }
      .tr-acc:last-child { border-bottom: 0; }
      .tr-acc-btn { width:100%; background:none; border:0; cursor:pointer; padding: 18px 0; display:flex; justify-content:space-between;
        align-items:center; gap: 14px; text-align:left; color: inherit; font: inherit; min-height: 56px; }
      .tr-acc-title { color: var(--ink); font-weight: 700; font-size: 15.5px; line-height: 1.4; }
      .tr-acc-icon { flex-shrink:0; width: 28px; height: 28px; border-radius: 50%; display:grid; place-items:center;
        border: 1px solid var(--gold-line); color: var(--gold-light); font-size: 16px; transition: transform .25s var(--ease-out), background .2s; }
      .tr-acc.is-open .tr-acc-icon { transform: rotate(45deg); background: var(--gold-soft); }
      .tr-acc-body { padding: 0 0 22px; animation: fadeIn .4s var(--ease-out) both; }
      .tr-acc-body p { color: var(--ink-2); font-size: 15px; line-height: 1.9; white-space: pre-wrap; }
      .tr-acc-body.has-card { padding-left: 0; }
      @media (min-width: 640px) { .tr-acc-body.has-card { padding-left: 66px; } }
      .tr-acc-card { display:flex; align-items:center; gap: 14px; }
      .tr-acc-card img { width: 46px; aspect-ratio: 2/3; object-fit: cover; border-radius: 5px; border: 1px solid rgba(201,168,76,.6); flex-shrink: 0; }
      .tr-acc-pos { display:block; font-size: 12px; font-weight: 700; color: var(--gold-light); margin-bottom: 3px; }
      .tr-acc-name { display:block; font-size: 15.5px; font-weight: 700; color: var(--ink); }
      .tr-acc-desc { display:block; font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }

      .tr-deeper { padding: 24px; margin-bottom: 16px; }
      .tr-deeper-top { display:flex; align-items:center; gap: 10px; margin-bottom: 8px; }
      .tr-deeper-top span:first-child { color: var(--lavender); font-size: 13px; font-weight: 600; }
      .tr-deeper h3 { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
      .tr-deeper p { color: var(--ink-2); font-size: 14px; line-height: 1.7; margin-bottom: 14px; }
      .tr-sec-label { color: var(--lavender); font-size: 13px; font-weight: 600; padding: 18px 0 4px; }
      .tr-again { width: 100%; margin-top: 12px; }

      .tr-notenough { padding: 32px 24px; text-align:center; border-color: rgba(242,155,155,.35); }
      .tr-notenough h2 { font-size: 17px; font-weight: 700; margin: 10px 0 8px; }
      .tr-notenough p { color: var(--ink-2); font-size: 14px; margin-bottom: 22px; }

      /* ── 켈틱 크로스 배치 ── */
      .tr-cc { --cw: 44px; --g: 8px; display:flex; justify-content:center; align-items:center; gap: calc(var(--g) * 3); margin: 4px auto 24px; }
      @media (min-width: 400px) { .tr-cc { --cw: 50px; } }
      @media (min-width: 1024px) { .tr-cc { --cw: 92px; --g: 14px; } }
      .tr-cc-cross { display:grid; grid-template-columns: repeat(3, var(--cw)); grid-template-rows: repeat(3, auto); gap: var(--g); align-items:center; justify-items:center; }
      .tr-cc-staff { display:flex; flex-direction: column-reverse; gap: var(--g); }
      .tr-cc-cell { position:relative; display:flex; flex-direction:column; align-items:center; gap: 4px; }
      .tr-cc-card { position:relative; width: var(--cw); aspect-ratio: 2/3; border-radius: calc(var(--cw) * .09); overflow:hidden; }
      .tr-cc-card.is-empty { border: 1px dashed rgba(201,168,76,.28); background: rgba(201,168,76,.03); display:grid; place-items:center; }
      .tr-cc-card.is-empty span { font-family: var(--font-display); color: rgba(201,168,76,.45); font-size: calc(var(--cw) * .3); }
      .tr-cc-card.is-next { border-color: rgba(230,205,133,.8); box-shadow: 0 0 18px rgba(201,168,76,.35); animation: apGlow 2.4s ease-in-out infinite; }
      .tr-cc-card img { width:100%; height:100%; object-fit:cover; display:block; }
      .tr-cc-card .tr-back { width: 100%; }
      .tr-cc-card.is-revealed { border: 1px solid rgba(201,168,76,.6); animation: fadeIn .6s var(--ease-out) both; }
      .tr-cc-cross-card { position:absolute; left:50%; top:50%; width: var(--cw); translate: -50% -50%; rotate: 90deg; z-index: 2; opacity: .92; }
      .tr-cc-num { position:absolute; top: 3px; left: 3px; z-index: 3; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px;
        background: rgba(7,9,20,.82); border: 1px solid var(--gold-line); color: var(--gold-light); font-size: 10px; line-height: 14px; text-align:center; font-weight: 700; }
      .tr-cc-label { display:none; font-size: 11.5px; color: var(--ink-2); text-align:center; width: calc(var(--cw) + 20px); line-height: 1.3; }
      @media (min-width: 1024px) { .tr-cc-cross { grid-template-columns: repeat(3, calc(var(--cw) + 22px)); } .tr-cc-label { display:block; } .tr-cc-num { font-size: 11px; height: 18px; line-height: 16px; min-width: 18px; } }
      .tr-cc-legend { display:grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; margin: -8px 0 24px; padding: 14px 16px; }
      .tr-cc-legend li { list-style:none; display:flex; gap: 8px; font-size: 12.5px; color: var(--ink-2); line-height: 1.4; }
      .tr-cc-legend b { color: var(--gold-light); min-width: 16px; font-variant-numeric: tabular-nums; }
      @media (min-width: 1024px) { .tr-cc-legend { display:none; } }
      .tr-cc-current { padding: 14px 18px; margin-bottom: 16px; display:flex; gap: 14px; align-items:center; }
      .tr-cc-current-num { width: 36px; height: 36px; border-radius: 50%; display:grid; place-items:center; flex-shrink:0;
        border: 1px solid var(--gold-line); color: var(--gold-light); font-family: var(--font-display); font-size: 18px; background: var(--gold-soft); }
      .tr-cc-current b { display:block; color: var(--gold-light); font-size: 14.5px; }
      .tr-cc-current small { display:block; color: var(--ink-2); font-size: 12.5px; margin-top: 2px; }

      @media (min-width: 1024px) {
        .tr-select-wrap { max-width: 1040px; margin: 0 auto; }
      }
    `}</style>
  )
}

/* ── 모바일 상단 바 (PC는 전역 SiteNav) ─────────────────────── */
export function TarotMobileHeader({ credits, creditsLabel }: { credits: number | null; creditsLabel: string }) {
  return (
    <header className="tr-head ap-mobile-only">
      <Link href="/menu" className="tr-logo">ASTROPILLAR</Link>
      <Link href="/buy" className="tr-pill">
        <b>{credits ?? '—'}</b>
        <span>{creditsLabel}</span>
      </Link>
    </header>
  )
}

export function TarotTitle({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) {
  return (
    <div className="tr-title ap-rise">
      <span className="tr-title-glyph" aria-hidden="true">✦</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <span className="ap-badge">{badge}</span>
    </div>
  )
}

export function NotEnough({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="ap-glass tr-notenough ap-rise">
      <span className="tr-title-glyph" aria-hidden="true">☾</span>
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href="/buy" className="ap-btn">{cta}</Link>
    </div>
  )
}

/* ── 카드 ─────────────────────────────────────────────────── */
export function CardBack({ width }: { width?: number }) {
  return <div className="tr-back" style={width ? ({ '--cw': `${width}px` } as React.CSSProperties) : undefined} aria-hidden="true" />
}

export function DeckGrid({ deck, exitIdxs, onSelect, label, status }: {
  deck: (TarotCard | null)[]
  exitIdxs: Set<number>
  onSelect: (i: number) => void
  label: string
  status?: React.ReactNode
}) {
  const locale = useLocale()
  const cardAria = (n: number) => locale === 'ko' ? `카드 ${n}` : locale === 'ja' ? `カード ${n}` : `Card ${n}`
  return (
    <div>
      <div className="tr-deck-meta">
        <p>{label}</p>
        {status}
      </div>
      <div className="tr-deck-scroll">
        <div className="tr-deck">
          {deck.map((card, i) => card === null ? (
            <div key={i} className="tr-deck-empty" />
          ) : (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`tr-deck-card${exitIdxs.has(i) ? ' is-exit' : ''}`}
              aria-label={cardAria(i + 1)}
            >
              <CardBack />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/** 선택 중 슬롯 (뒷면 상태) */
export function SlotRow({ slots, labels, entering, grid }: {
  slots: (TarotCard | null)[]
  labels: string[]
  entering: Set<number>
  grid?: boolean
}) {
  const nextIdx = slots.findIndex(s => s === null)
  return (
    <div className={`tr-slots${grid ? ' is-grid' : ''}`}>
      {labels.map((label, i) => {
        const card = slots[i]
        const cls = ['tr-slot-box', card ? 'is-filled' : '', i === nextIdx ? 'is-next' : '', entering.has(i) ? 'is-entering' : ''].filter(Boolean).join(' ')
        return (
          <div key={i} className="tr-slot">
            <div className={cls}>
              {card ? <CardBack /> : <span className="tr-slot-num">{i + 1}</span>}
            </div>
            <p className={`tr-slot-label${card ? ' is-on' : ''}`}>{label}</p>
          </div>
        )
      })}
    </div>
  )
}

/** 공개된 카드 줄 (뒤집기 애니메이션) */
export function RevealRow({ slots, labels, grid }: { slots: (TarotCard | null)[]; labels: string[]; grid?: boolean }) {
  return (
    <div className={`tr-reveal-row${grid ? ' is-grid' : ''}`}>
      {labels.map((label, i) => {
        const card = slots[i]
        return (
          <div key={i} className="tr-rcard">
            <div className="tr-flip" style={{ animationDelay: `${i * 0.18}s` }}>
              {card
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="tr-face" src={cardImageUrl(card.file)} alt={card.name} />
                : <div className="tr-face" />}
              <CardBack />
            </div>
            <p className="tr-rcard-pos">{label}</p>
            {card && <p className="tr-rcard-name">{card.name}</p>}
          </div>
        )
      })}
    </div>
  )
}

/* ── 로딩 ─────────────────────────────────────────────────── */
export function TarotLoading({ pct, title, sub, warn }: { pct: number; title: string; sub: string; warn: string }) {
  const r = 50, circ = 2 * Math.PI * r
  return (
    <div className="tr-loading" role="status" aria-live="polite">
      <div className="tr-orb">
        <div className="tr-orb-ring" aria-hidden="true" />
        <svg width={112} height={112} viewBox="0 0 112 112" aria-hidden="true">
          <circle cx={56} cy={56} r={r} fill="none" stroke="rgba(201,168,76,0.14)" strokeWidth={3} />
          <circle cx={56} cy={56} r={r} fill="none" stroke="url(#trGold)" strokeWidth={3} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
          <defs>
            <linearGradient id="trGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3e2ac" />
              <stop offset="100%" stopColor="#c9a84c" />
            </linearGradient>
          </defs>
        </svg>
        <b>{pct}%</b>
      </div>
      <h2>{title}</h2>
      <p>{sub}</p>
      <p className="tr-warn">{warn}</p>
    </div>
  )
}

/* ── 결과 아코디언 ────────────────────────────────────────── */
export function Section({ title, content, defaultOpen }: { title: string; content: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className={`tr-acc${open ? ' is-open' : ''}`}>
      <button className="tr-acc-btn" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="tr-acc-title">{title}</span>
        <span className="tr-acc-icon" aria-hidden="true">+</span>
      </button>
      {open && <div className="tr-acc-body"><p>{content}</p></div>}
    </div>
  )
}

export function CardSection({ card, positionLabel, positionDesc, content, defaultOpen }: {
  card: TarotCard; positionLabel: string; positionDesc: string; content: string; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className={`tr-acc${open ? ' is-open' : ''}`}>
      <button className="tr-acc-btn" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="tr-acc-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardImageUrl(card.file)} alt={card.name} />
          <span>
            <span className="tr-acc-pos">{positionLabel}</span>
            <span className="tr-acc-name">{card.name}</span>
            <span className="tr-acc-desc">{positionDesc}</span>
          </span>
        </span>
        <span className="tr-acc-icon" aria-hidden="true">+</span>
      </button>
      {open && <div className="tr-acc-body has-card"><p>{content}</p></div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', position: 'relative', zIndex: 1 }}>
      <div style={{ width: 44, height: 44, border: '2px solid rgba(201,168,76,0.18)', borderTop: '2px solid var(--gold-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )
}
