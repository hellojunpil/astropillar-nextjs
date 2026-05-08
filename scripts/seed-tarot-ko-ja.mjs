// 무료 원카드 타로 — KO/JA Firestore 사전 캐싱 스크립트
// 실행: node scripts/seed-tarot-ko-ja.mjs

const API_BASE = 'https://snap-pillar-api-944836465041.asia-northeast3.run.app'
const IMG_BASE = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

const MAJOR_ARCANA = [
  { name: 'The Fool',           file: 'major_arcana_fool'        },
  { name: 'The Magician',       file: 'major_arcana_magician'    },
  { name: 'The High Priestess', file: 'major_arcana_priestess'   },
  { name: 'The Empress',        file: 'major_arcana_empress'     },
  { name: 'The Emperor',        file: 'major_arcana_emperor'     },
  { name: 'The Hierophant',     file: 'major_arcana_hierophant'  },
  { name: 'The Lovers',         file: 'major_arcana_lovers'      },
  { name: 'The Chariot',        file: 'major_arcana_chariot'     },
  { name: 'Strength',           file: 'major_arcana_strength'    },
  { name: 'The Hermit',         file: 'major_arcana_hermit'      },
  { name: 'Wheel of Fortune',   file: 'major_arcana_fortune'     },
  { name: 'Justice',            file: 'major_arcana_justice'     },
  { name: 'The Hanged Man',     file: 'major_arcana_hanged'      },
  { name: 'Death',              file: 'major_arcana_death'       },
  { name: 'Temperance',         file: 'major_arcana_temperance'  },
  { name: 'The Devil',          file: 'major_arcana_devil'       },
  { name: 'The Tower',          file: 'major_arcana_tower'       },
  { name: 'The Star',           file: 'major_arcana_star'        },
  { name: 'The Moon',           file: 'major_arcana_moon'        },
  { name: 'The Sun',            file: 'major_arcana_sun'         },
  { name: 'Judgement',          file: 'major_arcana_judgement'   },
  { name: 'The World',          file: 'major_arcana_world'       },
]

const LANGUAGES = ['ko', 'ja']

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callTarotDaily(card, language) {
  const res = await fetch(`${API_BASE}/tarot/daily`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      card_name: card.name,
      card_image_url: `${IMG_BASE}${card.file}.webp`,
      language,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

async function main() {
  const today = new Date()
  const dateKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  console.log(`\n📅 오늘 날짜: ${dateKey}`)
  console.log(`🃏 총 ${MAJOR_ARCANA.length * LANGUAGES.length}개 생성 시작...\n`)

  let done = 0
  let failed = 0

  for (const lang of LANGUAGES) {
    console.log(`\n─── ${lang.toUpperCase()} (${MAJOR_ARCANA.length}장) ───`)
    for (const card of MAJOR_ARCANA) {
      try {
        const data = await callTarotDaily(card, lang)
        done++
        const preview = data.content_text?.slice(0, 40).replace(/\n/g, ' ') ?? '(no text)'
        console.log(`  ✅ [${String(done).padStart(2,'0')}] ${card.name} (${lang}) → "${preview}..."`)
      } catch (e) {
        failed++
        console.error(`  ❌ [FAIL] ${card.name} (${lang}): ${e.message}`)
      }
      await sleep(800) // GPT 요청 간격
    }
  }

  console.log(`\n═══════════════════════════════`)
  console.log(`완료: ${done}개 성공 / ${failed}개 실패`)
  console.log(`Firestore 키 형식: ${dateKey}_major_arcana_fool_ko`)
  console.log(`═══════════════════════════════\n`)
}

main().catch(console.error)
