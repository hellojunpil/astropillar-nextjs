// Firestore 오래된 데이터 삭제 스크립트
// ~ 2026-04-30 이전 daily_fortunes + daily_tarot 전부 삭제
//
// 실행 전: gcloud auth application-default login (한 번만)
// 실행: node scripts/cleanup-old-firestore.mjs

import { readFileSync } from 'fs'
import { homedir } from 'os'

const PROJECT_ID = 'pillarfortune'
const CUTOFF_DATE = '2026-04-30'  // 이 날짜 포함 이전 전부 삭제
const COLLECTIONS = ['daily_fortunes', 'daily_tarot']

const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

async function getToken() {
  const configPath = `${homedir()}/.config/configstore/firebase-tools.json`
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  const { access_token, refresh_token, expires_at } = config.tokens

  // 토큰 유효한지 확인 (5분 여유)
  if (Date.now() < expires_at - 300_000) {
    return access_token
  }

  // 만료됐으면 refresh
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    }),
  })
  if (!res.ok) throw new Error(`토큰 갱신 실패: ${await res.text()}`)
  const data = await res.json()
  return data.access_token
}

async function listDocs(token, collection, pageToken) {
  const url = `${BASE_URL}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`listDocs failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function deleteDoc(token, name) {
  const url = `https://firestore.googleapis.com/v1/${name}`
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`deleteDoc failed: ${res.status}`)
}

function isOldDoc(docId) {
  // doc ID 형식: "2026-04-15_horoscope_aries" 또는 "2026-04-15_horoscope_aries_ko"
  const dateMatch = docId.match(/^(\d{4}-\d{2}-\d{2})/)
  if (!dateMatch) return false
  return dateMatch[1] <= CUTOFF_DATE
}

async function main() {
  console.log(`\n🔥 Firestore 정리 스크립트`)
  console.log(`컷오프 날짜: ~ ${CUTOFF_DATE} (이 날짜 포함 이전 삭제)`)
  console.log(`대상 컬렉션: ${COLLECTIONS.join(', ')}\n`)

  const token = await getToken()
  console.log('✅ Firebase 인증 성공\n')

  let totalDeleted = 0
  let totalFailed = 0

  for (const col of COLLECTIONS) {
    console.log(`─── ${col} 처리 중 ───`)
    let pageToken = undefined
    let colDeleted = 0

    while (true) {
      const data = await listDocs(token, col, pageToken)
      const docs = data.documents ?? []

      for (const doc of docs) {
        const parts = doc.name.split('/')
        const docId = parts[parts.length - 1]

        if (isOldDoc(docId)) {
          try {
            await deleteDoc(token, doc.name)
            colDeleted++
            process.stdout.write(`\r  삭제 중: ${colDeleted}개...`)
          } catch (e) {
            totalFailed++
            console.error(`\n  ❌ 삭제 실패: ${docId}: ${e.message}`)
          }
        }
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken
      } else {
        break
      }
    }

    console.log(`\n  ✅ ${col}: ${colDeleted}개 삭제 완료`)
    totalDeleted += colDeleted
  }

  console.log(`\n═══════════════════════════════`)
  console.log(`총 삭제: ${totalDeleted}개 / 실패: ${totalFailed}개`)
  console.log(`═══════════════════════════════\n`)
}

main().catch(e => {
  console.error('\n❌ 오류:', e.message)
  process.exit(1)
})
