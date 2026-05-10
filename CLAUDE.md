# AstroPillar — 프로젝트 레퍼런스

> **마지막 작업: 2026-05-10 세션84**
> **다음 할 일: Info.plist에 ITSAppUsesNonExemptEncryption=false 추가 → TestFlight 내부 테스터 초대**

---

## 프로젝트 개요
- **서비스명**: AstroPillar (동양 사주 + 서양 점성술 통합 운세)
- **런칭일**: 2026년 3월 22일
- **스택**: Next.js (Vercel) + FastAPI (Cloud Run) + Firebase
- **사업자**: 필랩(PilLAB), 대표 박준필 / bbiribbiri09@gmail.com

---

## 인프라 구조

```
astropillar.com   → Next.js 앱 (Vercel) ← 이 프로젝트
FastAPI 백엔드    → Google Cloud Run (D:\snap pillar\main.py)
Firebase Auth     → 로그인 (이메일 + Google OAuth)
Firestore         → 유저 데이터 (pouch_count 등)
Gumroad           → 결제 (크레딧 구매, EN/JA)
PortOne           → 결제 (KO, 심사 중)
```

---

## 환경변수 (.env.local)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWFmD7UDYuO0EErZDF3kxlmTYxw1tz9KU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pillarfortune.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pillarfortune
NEXT_PUBLIC_GOOGLE_CLIENT_ID=944836465041-ofkua0sdrnabng4nq6laaiu1sa1n7vbl.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE=https://snap-pillar-api-944836465041.asia-northeast3.run.app
NEXT_PUBLIC_GUMROAD_URL_1=https://junpil.gumroad.com/l/gveeli
NEXT_PUBLIC_GUMROAD_URL_5=https://junpil.gumroad.com/l/idksv
GUMROAD_SELLER_ID=0DwFvQOjnySBKZVYvOzIJg==
NEXT_PUBLIC_GA4_ID=G-NSTDRL3GJN
NEXT_PUBLIC_PORTONE_CHANNEL_KEY= ← 실연동 후 교체
PORTONE_API_SECRET= ← 실연동 후 교체
```

---

## 디자인 시스템

**색상:**
- 배경: `#0a0a0f` / 카드: `#16213E` / 골드: `#C9A84C`
- 텍스트: `#ffffff` / 보조: `#aaaaaa` / 테두리: `#2a2a3e`

**폰트:** 로고: `Cormorant Garamond` / 본문: `Noto Sans`

---

## 페이지 구조

| 경로 | 설명 | 인증 | 비용 |
|------|------|------|------|
| `/` | 랜딩 | ❌ | 무료 |
| `/login` | 로그인/회원가입 | ❌ | 무료 |
| `/menu` | 서비스 목록 + Credit | ✅ | 무료 |
| `/reading/personal-fortune` | 평생 리딩 | ✅ | 1 Credit |
| `/reading/daily` | 오늘의 나 | ✅ | 1 Credit |
| `/reading/yearly` | 신년 운세 | ✅ | 1 Credit |
| `/reading/compatibility` | 궁합 | ✅ | 1 Credit |
| `/reading/scenario` | 시나리오 | ✅ | 1 Credit |
| `/today` | Today's Fortune (별자리+띠+타로) | ❌ | 무료 |
| `/tarot/three-card` | Three Card Spread | ✅ | 1 Credit |
| `/tarot/relationship` | Relationship Spread | ✅ | 1 Credit |
| `/tarot/celtic-cross` | Celtic Cross | ✅ | 2 Credits |
| `/buy` | Credit 구매 | ✅ | — |
| `/library` | Reading History + My Persons | ✅ | — |
| `/explain` | Day Stem/Elements/Planets 아코디언 | ❌ | 무료 |

---

## FastAPI 엔드포인트 (Cloud Run)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/health` | GET | 헬스체크 |
| `/geo/search` | GET | 도시 검색 |
| `/full_reading` | POST | 사주+GPT (reading_type: basic/yearly/situation) |
| `/personal_fortune` | POST | 평생 리딩 |
| `/personal_daily_fortune` | POST | 하루 운세 |
| `/compatibility_reading` | POST | 궁합 |
| `/daily_fortune` | GET | 띠/별자리 일일운세 (Firebase 캐시) |
| `/register_user` | POST | 신규 유저 등록 (Credit 1개 지급) |
| `/get_pouch` | GET | Credit 잔액 |
| `/use_pouch` | POST | Credit 차감 |
| `/gumroad_webhook` | POST | 결제 완료 → Credit 지급 |
| `/record_share` | POST | 공유 카운트 (3회→1 Credit) |
| `/tarot/daily` | POST | 원카드 타로 |
| `/tarot/three_card` | POST | Three Card |
| `/tarot/relationship` | POST | Relationship |
| `/tarot/celtic_cross` | POST | Celtic Cross |

---

## Firebase 설정

- **프로젝트 ID**: pillarfortune / **계정**: bbiribbiri09@gmail.com
- **Auth**: Email/Password + Google OAuth
- **Firestore 컬렉션**:
  - `users/{email}` → `{ pouch_count, created_at, updated_at, share_count }`
  - `daily_fortunes/{date_type_key}` → 일일운세
  - `service_config/pricing` → 서비스별 Credit 비용
  - `transactions/{sale_id}` → Gumroad 거래 내역

---

## Credit 시스템

- **DB 필드명**: `pouch_count` (UI: "Credit")
- **신규 가입**: 1 Credit 자동 지급
- **구매**: Gumroad ($1.99=1개, $8.99=5개) — EN/JA
- **공유 보상**: 3회 공유 → 1 Credit

---

## 기술 주의사항

- **일간 오프셋 앵커**: 2024-12-31 = 戊寅일 (절대 변경 금지)
- **GPT 모델**: gpt-4.1 → gpt-4o-mini 순으로 fallback
- **카드 이미지**: `https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/` (tarot/ 서브폴더 없음)
- **카드 파일명**: `major_arcana_[name].webp`
- **타로 해석**: 순수 타로 해석만 (BaZi/Western 융합 없음)

---

## ⚠️ Cloud Run 배포 명령어 (반드시 --allow-unauthenticated 사용)

```bash
cd "D:\snap pillar" && gcloud run deploy snap-pillar-api --source . --project snap-pillar --region asia-northeast3 --allow-unauthenticated
```

> `--no-allow-unauthenticated` 사용 금지 — 배포 시 allUsers invoker IAM이 제거되어 모든 GET API가 CORS 차단됨 (0 크레딧 버그 발생)

**최신 revision**: `00213-zjb` (2026-05-09)

---

## 결과 화면 구성 (ReadingResult.tsx)

탭 4개:
1. **BaZi Chart** — 천간/지지 이미지 (gan_[한자].png / zhi_[한자].png)
2. **Elements** — Day Master 카드 + WuXingChart (오각형, 상생/상극 화살표)
3. **Astrology Profile** — Big Three + Inner/Outer Planets (r_[sign].svg)
4. **Reading** — GPT 해석문, 섹션별 아코디언

---

## 배포 절차

```bash
# Vercel 자동배포 (GitHub push → 자동)
git -C "E:/My Team/astropillar" add [파일] && git commit -m "메시지" && git push

# Cloud Run 배포
cd "D:\snap pillar" && gcloud run deploy snap-pillar-api --source . --project snap-pillar --region asia-northeast3 --allow-unauthenticated
```

**Vercel 환경변수**: 위 `.env.local` 목록 전부 입력 (PORTONE 포함)

---

## 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `src/components/ReadingResult.tsx` | 결과 UI, extractWestern() |
| `src/components/BirthForm.tsx` | TIME_RANGES, BirthData |
| `src/components/PersonPicker.tsx` | 인물 선택 UI |
| `src/lib/firestore.ts` | SavedPerson, savePerson() |
| `src/app/library/page.tsx` | Library My Persons 탭 |
| `src/messages/ko.json` | 한국어 번역 |
| `src/messages/ja.json` | 일본어 번역 |
| `D:\snap pillar\main.py` | FastAPI 백엔드 |

---

## GitHub

- **프론트엔드**: hellojunpil/astropillar-nextjs
- **이미지**: hellojunpil/astropillar_images

---

## 세션84 완료 — 2026-05-10

**이번 세션에서 한 것:**
- ✅ iOS IPA 빌드 성공 (Build #9, commit d5307d8, 4.76 MB)
- ✅ App Store Connect 업로드 성공
- ✅ TestFlight Export Compliance 문제 해결
  - 원인: "수출 규정 관련 문서 누락" — 암호화 질문 미답변
  - 해결: "위에 언급된 알고리즘에 모두 해당하지 않음" 선택 → 저장
  - 결과: 빌드 #1 상태 "제출 준비 완료 (90일 후 만료)"

**다음 세션에서 할 것 (App Store 정식 제출 준비):**
1. `ios/App/App/Info.plist`에 `ITSAppUsesNonExemptEncryption = false` 추가
2. App Store Connect 배포 탭 메타데이터 채우기:
   - 스크린샷 (iPhone 6.5인치 필수, 최대 10장)
   - 앱 설명 / 프로모션 텍스트 / 키워드 (KO/EN/JA)
   - 앱 아이콘 1024×1024
   - 개인정보처리방침 URL
   - 연령 등급 설문
3. 심사 제출 (Submit for Review)
4. TestFlight 내부 테스터 초대 (형님 Apple ID)

**Codemagic 빌드 관련 발견사항:**
- `ios_signing` 블록에 `certificate`/`provisioning_profile` 키 추가 불가 (스키마 오류)
- Codemagic Team Settings → Code signing identities에 .p12 + .mobileprovision 업로드하면 자동 매칭
- `npm ci` 대신 `npm install` 사용 (Lock 파일 버전 불일치 방지)
- Node 22.14.0 필요 (@capacitor/cli@6 요구사항)
- `git push web master:main` 병행 필수 (Codemagic은 web remote 감시)

---

## 세션83 완료 — 2026-05-09

**이번 세션에서 한 것:**
- ✅ CLAUDE.md 정리 (1245줄 → 간결하게, 백업: claude_back_20260509.md)
- ✅ android.keystore 백업 확인 (Google Drive + 바탕화면 + E:\My Team\app\astropillar_keystore_backup.txt)
- ✅ 앱 전략 메모리 업데이트

**확인된 사항:**
- iOS Capacitor + Codemagic: Windows에서 Mac 없이 가능, "시작해" 하면 코드 작업 하루 완료
- AdMob: iOS에서도 정상 지원 (`@capacitor-community/admob`)
- 국가별 가격: Google Play / App Store 둘 다 가능
- Apple Developer Program($99/년) 가입이 iOS 시작 조건

---

## 현재 상태 (2026-05-09 세션83 기준)

### 완료된 것
- ✅ 전체 서비스 개발 (8종 리딩 + 타로 3종 + Today's Fortune)
- ✅ i18n KO/JA 완성 (전 서비스 KO/JA/EN)
- ✅ QA 종합 8.8/10 (EN 9.4 / KO 8.4 / JA 8.7)
- ✅ Android TWA APK 빌드 완료
- ✅ assetlinks.json 배포 (commit 856628f)
- ✅ KakaoPay 모바일 결제 버그 수정 (commit 47e7e5a)
- ✅ PortOne 실연동 신청 (심사 중)

### QA 결과 (최신 — 세션80 기준)

| 서비스 | EN | KO | JA | 평균 |
|--------|----|----|----|----|
| Personal Fortune | 9.3 | 9.5 | 10.0 | 9.6 ✅ |
| Daily Fortune | 9.3 | 9.5 | 10.0 | 9.6 ✅ |
| Yearly Fortune | 8.7 | 9.5 | 10.0 | 9.4 ✅ |
| Compatibility | 9.3 | 9.5 | 10.0 | 9.6 ✅ |
| Scenario Reading | 9.7 | 9.3 | 9.3 | 9.4 ✅ |
| Three Card | 9.3 | 6.7 | 6.7 | 7.6 ⚠️ (캐시 영어) |
| Relationship | 9.7 | 6.7 | 6.7 | 7.7 ⚠️ (캐시 영어) |
| Celtic Cross | 9.7 | 6.7 | 6.7 | 7.7 ⚠️ (캐시 영어) |

---

## 현재 버그 (우선순위 순)

| 우선순위 | 버그 | 위치 |
|---------|------|------|
| P1 | Celtic Cross 요금 배지 "3 Credits" | Firestore `service_config/pricing.tarot_celtic_cross` 값 2로 수정 |
| P1 | 랜딩 "100% Private. Never stored." 문구 | 법적 리스크 — 광고 집행 중 필수 교체 |
| P1 | manifest.json / icon-512.png 404 (astropillar.com) | next-pwa 빌드 간섭 의심, AAB 빌드 선행 조건 |
| P2 | KO/JA 타로 GPT 본문 영어 (캐시) | 언어별 캐시 키 분기 필요 |
| P2 | KO/JA 타로 22장 Firestore 사전 캐싱 미완료 | 매 API 호출 → 응답 느림 |
| P2 | EN Yearly "SECTION 3" 라벨 | normalizeTitle 맵 미등록 |
| P3 | 타로 "What To Do" 헤더 영어 유지 | GPT 포맷 지시어 — 본문은 KO/JA 정상 |
| P3 | RISING 카드 "ASC" 텍스트 → 별자리 이미지 | Astrology Profile |
| P3 | PersonPicker 저장 인물 auto-select | 1명일 때 |

---

## 다음 작업 우선순위

**앱 출시 관련 (Android)**
1. manifest.json / icon-512.png 404 수정
2. twa-manifest.json localhost URL → astropillar.com 교체
3. bundleRelease (AAB) → Play Store 업로드 (Google Play 개발자 인증 완료 후)

**앱 출시 관련 (iOS)**
4. Apple Developer Program 가입 ($99/년) → Capacitor + Codemagic 작업 시작
   - Windows에서 Mac 없이 가능 (Codemagic 클라우드 빌드)
   - AdMob iOS도 정상 지원 (`@capacitor-community/admob`)
   - 국가별 가격 설정 가능

**결제**
5. PortOne 실연동 완료 대기 (hellojunpil@gmail.com 이메일 수신)
6. KOMOJU 이메일 문의 — support@komoju.com (일본 결제, 미발송)
7. Gumroad $0.99/$4.95 신규 상품 생성 + ENV 교체

**서비스 개선**
8. P1 버그 수정 (Celtic Cross 요금, 랜딩 문구, 타로 캐시)
9. 포춘쿠키 `/fortune` 페이지 (GPT 생성, 영어 웃긴 운세, 공유 카드 바이럴)
10. /download 스마트 링크 (User-Agent → Play Store / App Store / 웹)
11. Meta Pixel 설치 + UTM 파라미터 bio 링크

---

## Android TWA 정보

- **패키지**: com.pillab.astropillar
- **버전**: 2
- **APK**: `E:\My Team\astropillar\app\build\outputs\apk\release\app-release-signed.apk`
- **키스토어**: `E:\My Team\astropillar\android.keystore`
  - alias: android / 비밀번호: AstroPillar2026!
  - SHA256: D6:5E:A4:F3:23:C1:C6:AD:D6:D5:6E:A5:56:AF:31:F7:53:9D:7A:50:E1:AF:90:D1:5B:83:B9:61:00:90:1A:EA
  - 백업: Google Drive / 바탕화면 / `E:\My Team\app\astropillar_keystore_backup.txt`
- **Google Play**: PilLAB 계정 (hellojunpil@gmail.com), 개발자 인증 진행 중

---

## 결제 현황 (2026-05-09)

| 지역 | 방식 | 상태 |
|------|------|------|
| KO | PortOne (KG이니시스 + KakaoPay) | 심사 중 |
| JA | Gumroad ($0.99/$4.95) | 운영 중 |
| EN | Gumroad ($0.99/$4.95) | 운영 중 |

**일본 결제 PG 조사 결과:**
- KOMOJU: 1순위 후보 (한국 개인사업자 가능, 점성술 금지 없음) — 이메일 미발송
- Payverse, Payhip: 2~3순위 후보

---

## 중요 원칙

- **솔직한 진단 우선** — 듣기 좋은 말보다 도움 되는 말
- **main.py 수정 전** 반드시 최신 파일 먼저 확인
- **배포**: VSCode 터미널 기준 / `--allow-unauthenticated` 필수
- **광고 타겟**: 미국/영국/캐나다/호주/필리핀/싱가포르/말레이시아
