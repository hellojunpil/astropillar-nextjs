const IMG_BASE = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

export interface TarotCard {
  name: string
  file: string
  type: 'major' | 'minor'
  suit?: 'cups' | 'pentacles' | 'swords' | 'wands'
}

export function cardImageUrl(file: string): string {
  return `${IMG_BASE}${file}.webp`
}

export function shuffleDeck(cards: TarotCard[]): TarotCard[] {
  const arr = [...cards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const MAJOR: TarotCard[] = [
  { name: 'The Fool',           file: 'major_arcana_fool',        type: 'major' },
  { name: 'The Magician',       file: 'major_arcana_magician',    type: 'major' },
  { name: 'The High Priestess', file: 'major_arcana_priestess',   type: 'major' },
  { name: 'The Empress',        file: 'major_arcana_empress',     type: 'major' },
  { name: 'The Emperor',        file: 'major_arcana_emperor',     type: 'major' },
  { name: 'The Hierophant',     file: 'major_arcana_hierophant',  type: 'major' },
  { name: 'The Lovers',         file: 'major_arcana_lovers',      type: 'major' },
  { name: 'The Chariot',        file: 'major_arcana_chariot',     type: 'major' },
  { name: 'Strength',           file: 'major_arcana_strength',    type: 'major' },
  { name: 'The Hermit',         file: 'major_arcana_hermit',      type: 'major' },
  { name: 'Wheel of Fortune',   file: 'major_arcana_fortune',     type: 'major' },
  { name: 'Justice',            file: 'major_arcana_justice',     type: 'major' },
  { name: 'The Hanged Man',     file: 'major_arcana_hanged',      type: 'major' },
  { name: 'Death',              file: 'major_arcana_death',       type: 'major' },
  { name: 'Temperance',         file: 'major_arcana_temperance',  type: 'major' },
  { name: 'The Devil',          file: 'major_arcana_devil',       type: 'major' },
  { name: 'The Tower',          file: 'major_arcana_tower',       type: 'major' },
  { name: 'The Star',           file: 'major_arcana_star',        type: 'major' },
  { name: 'The Moon',           file: 'major_arcana_moon',        type: 'major' },
  { name: 'The Sun',            file: 'major_arcana_sun',         type: 'major' },
  { name: 'Judgement',          file: 'major_arcana_judgement',   type: 'major' },
  { name: 'The World',          file: 'major_arcana_world',       type: 'major' },
]

type Suit = 'cups' | 'pentacles' | 'swords' | 'wands'
const SUITS: Suit[] = ['cups', 'pentacles', 'swords', 'wands']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'page', 'knight', 'queen', 'king']
const RANK_DISPLAY: Record<string, string> = { ace: 'Ace', page: 'Page', knight: 'Knight', queen: 'Queen', king: 'King' }
const SUIT_DISPLAY: Record<string, string> = { cups: 'Cups', pentacles: 'Pentacles', swords: 'Swords', wands: 'Wands' }

const MINOR: TarotCard[] = SUITS.flatMap(suit =>
  RANKS.map(rank => ({
    name: `${RANK_DISPLAY[rank] ?? rank} of ${SUIT_DISPLAY[suit]}`,
    file: `minor_arcana_${suit}_${rank}`,
    type: 'minor' as const,
    suit,
  }))
)

export const FULL_DECK: TarotCard[] = [...MAJOR, ...MINOR]
