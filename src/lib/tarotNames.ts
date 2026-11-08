// 타로 카드 이름 현지화 (78장) + 본문 속 영어 카드명 치환 + 긴 문단 나누기
// 카드 데이터(tarotDeck.ts)의 name은 영어 원본이 기준키

type Loc = 'ko' | 'ja'

const MAJOR: Record<string, { ko: string; ja: string }> = {
  'The Fool': { ko: '바보', ja: '愚者' },
  'The Magician': { ko: '마법사', ja: '魔術師' },
  'The High Priestess': { ko: '여사제', ja: '女教皇' },
  'The Empress': { ko: '여황제', ja: '女帝' },
  'The Emperor': { ko: '황제', ja: '皇帝' },
  'The Hierophant': { ko: '교황', ja: '教皇' },
  'The Lovers': { ko: '연인', ja: '恋人' },
  'The Chariot': { ko: '전차', ja: '戦車' },
  'Strength': { ko: '힘', ja: '力' },
  'The Hermit': { ko: '은둔자', ja: '隠者' },
  'Wheel of Fortune': { ko: '운명의 수레바퀴', ja: '運命の輪' },
  'Justice': { ko: '정의', ja: '正義' },
  'The Hanged Man': { ko: '매달린 사람', ja: '吊るされた男' },
  'Death': { ko: '죽음', ja: '死神' },
  'Temperance': { ko: '절제', ja: '節制' },
  'The Devil': { ko: '악마', ja: '悪魔' },
  'The Tower': { ko: '탑', ja: '塔' },
  'The Star': { ko: '별', ja: '星' },
  'The Moon': { ko: '달', ja: '月' },
  'The Sun': { ko: '태양', ja: '太陽' },
  'Judgement': { ko: '심판', ja: '審判' },
  'The World': { ko: '세계', ja: '世界' },
}

const SUIT: Record<string, { ko: string; ja: string }> = {
  Cups: { ko: '컵', ja: 'カップ' },
  Pentacles: { ko: '펜타클', ja: 'ペンタクル' },
  Swords: { ko: '소드', ja: 'ソード' },
  Wands: { ko: '완드', ja: 'ワンド' },
}
const RANK: Record<string, { ko: string; ja: string; words: string[] }> = {
  Ace: { ko: '에이스', ja: 'エース', words: ['Ace', 'One', '1'] },
  '2': { ko: '2', ja: '2', words: ['2', 'Two'] },
  '3': { ko: '3', ja: '3', words: ['3', 'Three'] },
  '4': { ko: '4', ja: '4', words: ['4', 'Four'] },
  '5': { ko: '5', ja: '5', words: ['5', 'Five'] },
  '6': { ko: '6', ja: '6', words: ['6', 'Six'] },
  '7': { ko: '7', ja: '7', words: ['7', 'Seven'] },
  '8': { ko: '8', ja: '8', words: ['8', 'Eight'] },
  '9': { ko: '9', ja: '9', words: ['9', 'Nine'] },
  '10': { ko: '10', ja: '10', words: ['10', 'Ten'] },
  Page: { ko: '시종', ja: 'ペイジ', words: ['Page'] },
  Knight: { ko: '기사', ja: 'ナイト', words: ['Knight'] },
  Queen: { ko: '여왕', ja: 'クイーン', words: ['Queen'] },
  King: { ko: '왕', ja: 'キング', words: ['King'] },
}

function minorName(rank: string, suit: string, loc: Loc) {
  const r = RANK[rank], s = SUIT[suit]
  return loc === 'ko' ? `${s.ko} ${r.ko}` : `${s.ja}の${r.ja}`
}

/** 영어 카드명 → 현지화 이름 (모르는 이름이면 그대로) */
export function localizedCardName(en: string, locale: string): string {
  if (locale !== 'ko' && locale !== 'ja') return en
  const loc = locale as Loc
  const name = en.trim()
  const maj = MAJOR[name] ?? MAJOR[name.replace(/^The\s+/i, '')] ?? MAJOR['The ' + name]
  if (maj) return maj[loc]
  const m = name.match(/^(\w+)\s+of\s+(Cups|Pentacles|Swords|Wands)$/i)
  if (m) {
    const rank = Object.keys(RANK).find(k => RANK[k].words.some(w => w.toLowerCase() === m[1].toLowerCase()))
    const suit = Object.keys(SUIT).find(k => k.toLowerCase() === m[2].toLowerCase())
    if (rank && suit) return minorName(rank, suit, loc)
  }
  return en
}

// 본문 치환용 패턴 (긴 이름부터)
const PATTERNS: { re: RegExp; ko: string; ja: string }[] = (() => {
  const list: { src: string; ko: string; ja: string }[] = []
  for (const [en, v] of Object.entries(MAJOR)) {
    list.push({ src: en, ...v })
    if (en.startsWith('The ')) list.push({ src: en.slice(4), ...v })
  }
  list.push({ src: 'Judgment', ...MAJOR['Judgement'] })
  for (const [rank, r] of Object.entries(RANK)) for (const suit of Object.keys(SUIT)) for (const w of r.words) {
    list.push({ src: `${w} of ${suit}`, ko: minorName(rank, suit, 'ko'), ja: minorName(rank, suit, 'ja') })
  }
  // 한 단어짜리는 흔한 영어 단어(Star, Moon, Sun…)와 겹칠 수 있어 카드 고유 단어만 허용
  const SINGLE_OK = /^(Temperance|Judgement|Judgment|Strength|Justice|Death)$/i
  return list
    .filter(x => /\s/.test(x.src) || SINGLE_OK.test(x.src))
    .sort((a, b) => b.src.length - a.src.length)
    .map(x => ({ re: new RegExp(`(?<![A-Za-z])${x.src.replace(/ /g, '\\s+')}(?![A-Za-z])`, 'gi'), ko: x.ko, ja: x.ja }))
})()
const SAFE = PATTERNS

// 숫자 끝 받침 여부 (한국어 읽기 기준)
const DIGIT_BATCHIM: Record<string, boolean> = { '0': true, '1': true, '2': false, '3': true, '4': false, '5': false, '6': true, '7': true, '8': true, '9': false }
function hasBatchim(word: string): boolean {
  const ch = word[word.length - 1]
  if (/\d/.test(ch)) return DIGIT_BATCHIM[ch]
  const code = ch.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return false
  return code % 28 !== 0
}
function particle(p: string, batchim: boolean): string {
  const pairs: Record<string, [string, string]> = { 은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'], 을: ['을', '를'], 를: ['을', '를'], 과: ['과', '와'], 와: ['과', '와'], 으로: ['으로', '로'], 로: ['으로', '로'] }
  const pair = pairs[p]
  if (!pair) return p
  return batchim ? pair[0] : pair[1]
}

/** 한국어·일본어 본문 속 영어 카드명을 현지화 (조사 자동 보정) */
export function localizeCardNamesInText(text: string, locale: string): string {
  if (!text || (locale !== 'ko' && locale !== 'ja')) return text
  let out = text
  for (const p of SAFE) {
    const rep = locale === 'ko' ? p.ko : p.ja
    if (locale === 'ko') {
      const re = new RegExp(p.re.source + '(으로|은|는|이|가|을|를|과|와|로)?', 'gi')
      out = out.replace(re, (_m, part?: string) => rep + (part ? particle(part, hasBatchim(rep)) : ''))
    } else {
      out = out.replace(p.re, rep)
    }
  }
  return out
}

/** 350자 넘는 문단을 3문장 단위로 나눔 (표시용) */
export function splitLongParagraphs(text: string, max = 350, perChunk = 3): string {
  if (!text) return text
  return text.split(/\n{2,}/).map(par => {
    if (par.length <= max) return par
    const sentences = par.match(/[^.!?。！？]+[.!?。！？]+["”’)]*\s*|[^.!?。！？]+$/g)
    if (!sentences || sentences.length <= perChunk) return par
    const chunks: string[] = []
    for (let i = 0; i < sentences.length; i += perChunk) chunks.push(sentences.slice(i, i + perChunk).join('').trim())
    return chunks.join('\n\n')
  }).join('\n\n')
}
