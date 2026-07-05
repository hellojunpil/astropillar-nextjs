// GPT 타로 리딩의 영어 섹션 헤더를 표시용으로 현지화
// (백엔드 프롬프트가 파싱 안정성을 위해 헤더를 영어로 고정하므로, 표시 단계에서 번역)

const TAROT_TITLE_MAP: Record<string, { ko: string; ja: string }> = {
  'The Answer':         { ko: '카드가 주는 답',   ja: 'カードからの答え' },
  'What To Do':         { ko: '이렇게 해보세요',  ja: 'やるべきこと' },
  'What This Means':    { ko: '이 리딩의 의미',   ja: 'このリーディングの意味' },
  'One Thing To Do':    { ko: '이렇게 해보세요',  ja: 'やるべきこと' },
  'The Bigger Picture': { ko: '전체 그림',        ja: '全体像' },
}

export function localizeTarotTitle(title: string, locale: string): string {
  if (locale !== 'ko' && locale !== 'ja') return title
  const stripped = title.replace(/^[^A-Za-z]+/, '').trim()
  const entry = TAROT_TITLE_MAP[stripped]
  if (!entry) return title
  const idx = title.indexOf(stripped)
  const prefix = idx > 0 ? title.slice(0, idx) : ''
  return prefix + entry[locale]
}
