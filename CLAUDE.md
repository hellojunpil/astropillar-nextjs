# AstroPillar — Next.js 전환 프로젝트

## 프로젝트 개요
- **서비스명**: AstroPillar (동양 사주 + 서양 점성술 통합 운세)
- **런칭일**: 2026년 3월 22일
- **목표**: Bubble 앱 + 기존 index.html 랜딩 전체를 Next.js로 재구축
- **현황**: 세션49 기준 Bubble 로그인 오류(Vercel 분리 후 세션 충돌) → Next.js 전환 결정

---

## 인프라 구조 (전환 후)

```
astropillar.com         → Next.js 앱 전체 (Vercel) ← 이 프로젝트
FastAPI 백엔드          → Google Cloud Run (변경 없음)
Firebase Auth           → 로그인 (이메일 + Google OAuth)
Firestore               → 유저 데이터 (credit 잔액 등)
Gumroad                 → 결제 (크레딧 구매)
```

---

## 환경변수 (.env.local)

```env
# Firebase (pillarfortune 프로젝트)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWFmD7UDYuO0EErZDF3kxlmTYxw1tz9KU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pillarfortune.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pillarfortune

# Google OAuth Client ID (로그인용)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=944836465041-ofkua0sdrnabng4nq6laaiu1sa1n7vbl.apps.googleusercontent.com

# FastAPI 백엔드 (Cloud Run)
NEXT_PUBLIC_API_BASE=https://snap-pillar-api-xxxx.run.app  # ← Cloud Run URL 실제값 확인 필요

# Gumroad
NEXT_PUBLIC_GUMROAD_URL_1=https://junpil.gumroad.com/l/gveeli
NEXT_PUBLIC_GUMROAD_URL_5=https://junpil.gumroad.com/l/idksv
GUMROAD_SELLER_ID=0DwFvQOjnySBKZVYvOzIJg==

# GA4 (전 페이지 추적 중 — layout.tsx 전역 삽입, 개별 페이지 커스텀 이벤트 발송)
NEXT_PUBLIC_GA4_ID=G-NSTDRL3GJN
```

---

## 디자인 시스템

**색상:**
- 배경: `#0a0a0f` (거의 검정)
- 카드 배경: `#16213E` (다크 네이비)
- 골드 포인트: `#C9A84C`
- 텍스트 주: `#ffffff`
- 텍스트 보조: `#aaaaaa`
- 테두리: `#2a2a3e`

**폰트 (Google Fonts):**
- 제목: `Cormorant Garamond` (ASTROPILLAR 로고)
- 히어로 카피: `Playfair Display`
- 본문: `Inter` 또는 시스템 폰트

**랜딩 페이지 확정 내용:**
- 상단 태그라인: "Where the stars meet your fate."
- 큰 제목: "ASTROPILLAR" (Cormorant Garamond)
- 캐릭터 이미지: `p_1_main.webp` (GitHub: hellojunpil/astropillar_images)
- 버블 3개: "My toxic trait 😈" / "When will I meet them? 💕" / "What my stars hide 🌌"
- 카운터: 10,847명 (1.2~2초마다 1~4씩 증가)
- CTA 버튼: "Read My Stars & Fate — Free"
- 신뢰 배지: ★★★★★ "Trusted by 10,000+ readers"
- 후기 3개: Sarah K. / Emily R. / Mia L.
- 롤링 문구 4개 (혼잣말 톤 찔림 문구)

---

## 페이지 구조

| 경로 | 설명 | 인증 필요 | 비용 |
|------|------|-----------|------|
| `/` | 랜딩 페이지 | ❌ | 무료 |
| `/login` | 로그인/회원가입 | ❌ | 무료 |
| `/menu` | 서비스 목록 + Credit 잔액 | ✅ | 무료 |
| `/reading/full` | Full Reading (기본 사주) | ✅ | 무료 | **종료된 서비스 — 페이지 없음** |
| `/reading/personal-fortune` | Personal Fortune (평생 리딩) | ✅ | 1 Credit |
| `/reading/daily` | Personal Daily Fortune | ✅ | 1 Credit |
| `/reading/yearly` | Yearly Fortune | ✅ | 1 Credit |
| `/reading/compatibility` | Compatibility (궁합) | ✅ | 1 Credit |
| `/reading/scenario` | Scenario Reading | ✅ | 1 Credit |
| `/today` | Today's Fortune (별자리+띠) | ❌ | 무료 |
| `/buy` | Credit 구매 (Gumroad 연결) | ✅ | — |

---

## FastAPI 백엔드 엔드포인트 (Cloud Run)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/health` | GET | 헬스체크 |
| `/geo/search` | GET | 도시 검색 |
| `/full_reading` | POST | 사주 계산 + GPT 해석 (reading_type: basic/yearly/situation) |
| `/personal_fortune` | POST | 평생 리딩 (BaZi+서양 출생차트) |
| `/personal_daily_fortune` | POST | 하루 운세 (BaZi+Transit) |
| `/compatibility_reading` | POST | 궁합 리딩 |
| `/daily_fortune` | GET | 띠/별자리 일일운세 (Firebase 캐시) |
| `/register_user` | POST | 신규 유저 등록 (Credit 1개 자동 지급) |
| `/get_pouch` | GET | Credit 잔액 조회 |
| `/use_pouch` | POST | Credit 차감 |
| `/gumroad_webhook` | POST | 결제 완료 → Credit 지급 |
| `/record_share` | POST | 공유 카운트 (3회→1 Credit) |

**full_reading 요청 예시:**
```json
{
  "year": 1990, "month": 3, "day": 15,
  "birthtime": "14:30",
  "sex": "M",
  "city": "Seoul",
  "reading_type": "basic",
  "user_name": "John",
  "birth_year": 1990
}
```

---

## Firebase 설정

- **프로젝트 ID**: pillarfortune
- **계정**: bbiribbiri09@gmail.com
- **Auth 방식**: Email/Password + Google OAuth
- **Firestore 컬렉션**:
  - `users/{email}` → `{ pouch_count, created_at, updated_at, share_count }`
  - `daily_fortunes/{date_type_key}` → 일일운세 데이터
  - `service_config/pricing` → 서비스별 Credit 비용
  - `transactions/{sale_id}` → Gumroad 거래 내역

---

## Credit 시스템

- **DB 필드명**: `pouch_count` (UI에서는 "Credit"으로 표기)
- **신규 가입**: 1 Credit 무료 지급 (register_user API 호출)
- **서비스 비용**:
  - Full Reading: 무료
  - Personal Fortune / Daily / Yearly / Compatibility: 1 Credit
  - Scenario Reading: 1 Credit
- **구매**: Gumroad ($1.99=1개 `gveeli`, $8.99=5개 `idksv`)
- **공유 보상**: 3회 공유 → 1 Credit (record_share API)

---

## 기술 주의사항

- **일간 오프셋 앵커**: 2024-12-31 = 戊寅일 (절대 변경 금지)
- **Feb 경계**: cutoff[1] = 20
- **CORS**: FastAPI `main.py`에 `astropillar.com` CORS 추가 필요
  - 현재: `hellojunpil.bubbleapps.io`, `astropillar.com` (app.astropillar.com 없음)
- **GPT 모델**: gpt-4.1 → gpt-4o-mini 순으로 fallback
- **캐릭터 이미지 URL**: `https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/p_1_main.webp`

---

## GitHub

- **이 프로젝트 레포**: hellojunpil/astropillar-nextjs (신규 생성)
- **기존 레포**: hellojunpil/astropillar-web (index.html — 전환 완료 후 폐기)
- **이미지 레포**: hellojunpil/astropillar_images

---

## 진행 상황

### ✅ 완료 — 인프라 & 기반
- ✅ CLAUDE.md 작성
- ✅ Next.js 프로젝트 초기화 (TypeScript + Tailwind + App Router)
- ✅ Firebase 패키지 설치 및 초기화 (`src/lib/firebase.ts`)
- ✅ 레이아웃 & 글로벌 스타일 (다크 테마, `src/app/globals.css`)
- ✅ GA4 설치 — `layout.tsx` Script 태그, `src/lib/gtag.ts`, reading_completed 이벤트
- ✅ 폰트 전체 Noto Sans 교체 — 로고만 Cormorant Garamond 유지
- ✅ 하단 내비게이션 바 (`BottomNav.tsx`) — 5탭
- ✅ Firestore 연동 전체 검증 (pouch_count, register_user, use_pouch, get_pouch, gumroad webhook)
- ✅ Firestore 보안 규칙 파일 생성 (`firestore.rules`)
- ✅ git 초기화 + 커밋 (master 브랜치), GitHub 레포 연결, Vercel 자동 배포 연결

### ✅ 완료 — 페이지
- ✅ 랜딩 페이지 (`/`) — index.html 전체 Next.js 변환, Firebase Auth 세션 유지, 3-view SPA
- ✅ 로그인/회원가입 (`/login`) — 비밀번호 확인, Forgot password, Google OAuth
- ✅ 메뉴 페이지 (`/menu`)
- ✅ Personal Fortune (`/reading/personal-fortune`) — 1 Credit
- ✅ Personal Daily Fortune (`/reading/daily`) — 1 Credit, 날짜 선택
- ✅ Yearly Fortune (`/reading/yearly`) — 1 Credit
- ✅ Compatibility (`/reading/compatibility`) — 1 Credit, Firestore 인물 드롭다운, 관계 선택 12종
- ✅ Scenario Reading (`/reading/scenario`) — 1 Credit, 2단계 플로우
- ✅ Today's Fortune (`/today`) — 무료, 로그인 불필요
- ✅ Credit 구매 (`/buy`) — Gumroad 연결
- ✅ Library (`/library`) — Reading History + My Persons, Firestore 연동
- ✅ /explain 페이지 — Day Stem/Elements/Planets 아코디언, 오행 canvas 차트
- ✅ Gumroad Webhook (`/api/gumroad-webhook`)

### ✅ 완료 — UX & 버그픽스
- ✅ PersonPicker 컴포넌트 — 인물 카드 선택, 인라인 Add Person 폼, Enter manually 토글
- ✅ ReadingResult.tsx 전면 개편 — 탭 3개(BaZi/Elements/Astrology Profile), GPT 섹션 아코디언
- ✅ 리딩 로딩 화면 (`ReadingLoader.tsx`) — 골드 프로그레스 바, 롤링 문구 20개
- ✅ 결과 캐싱 — getCachedReading() → 캐시 히트 시 Credit 미차감
- ✅ 공유 보상 UI — ShareButton, `/record_share` 연동, "3회 공유 → 1 Credit"
- ✅ Credit 차감 순서 수정 — 리딩 완료 후 /use_pouch 호출
- ✅ API 오류 메시지 개선 — Pydantic 배열/객체 오류 시 사용자 친화적 메시지
- ✅ register_user 버그 수정 — Google OAuth isNewUser getAdditionalUserInfo()로 교체
- ✅ FastAPI CORS 수정 — localhost:3000, astropillar-nextjs.vercel.app 추가

### ✅ 완료 — Western Astrology
- ✅ `main.py` `_extract_western_fields` 강건화 — planet id→name, sign→sign_id→sign_name fallback, ASC angles_details→angles fallback
- ✅ `main.py` personal_fortune 응답에 `western` 중첩 키 추가 (`sun_sign`, `moon_sign`, `ascendant`, `planets`)
- ✅ `main.py` `fetch_natal_western` 디버그 로그 추가
- ✅ Cloud Run 재배포 완료 (revision 00164-sml)
- ✅ Astrology Profile 탭 전면 교체 — Big Three 큰 카드 + Inner/Outer Planets 작은 카드 4열
- ✅ Astrology Profile "No Western chart data available." 버그 수정 — flat 필드 파싱 로직 추가
- ✅ Astrology Profile SVG filter 완전 제거 — 별자리 이미지 원본 색상 유지
- ✅ Astrology Profile ASC 키 탐색 강화 — `ascendant→rising→asc→ascendant_sign→western_asc`, 없으면 "Unknown", console.log 추가

### ✅ 완료 — Birth Time 수정
- ✅ Birth Time 드롭다운 → 2시간 범위 슬롯 13개로 교체
- ✅ PersonPicker / Library Add Person 폼 Birth Time 드롭다운 추가
- ✅ PersonPicker Birth Time 로컬 state 버그 수정 (`hour: null` 하드코딩 → pHour 반영)
- ✅ Birth time 저장 구조 전면 개선 — `birth_time_label` 필드 추가, TIME_RANGES start 시간(hour:minute) 사용, Firestore에 범위 문자열 저장, API에 `11:30` 형식 전송

### ✅ 완료 — 크레딧 & 가격 시스템 (2026-04-21)
- ✅ 파비콘 교체 — `favicon_ap3.png` → `src/app/icon.png`
- ✅ `firebase.json` 생성 → `firebase deploy --only firestore:rules` 가능
- ✅ 버그 수정: ReadingPageShell `inProgress` prop 추가 — 리딩 완료 후 credits=0 되면 "Not enough Credits" 표시되던 문제 해결 (5개 페이지 전부 적용)
- ✅ 버그 수정: `refreshCredits(decrement)` — 즉시 로컬 차감 후 백그라운드 서버 동기화 (크레딧 UI 지연 표시 해결)
- ✅ 가격 Firestore 연동 — `service_config/pricing` 문서에서 동적 로드 (`src/hooks/usePricing.ts`, `src/lib/firestore.ts` getPricing 추가)
  - 연동 위치: 5개 reading 페이지 헤더 배지, Reveal 버튼, menu 서비스 카드, buy 페이지 서비스 목록
  - 필드명: `personal_fortune`, `personal_daily_fortune`, `yearly`, `compatibility`, `scenario`

### ✅ 완료 — QA 테스트 (2026-04-21)
- ✅ k@k.com 계정으로 전체 서비스 Playwright 자동 테스트 완료
- ✅ 상세 리포트: `D:\snap_pillar bck\result\result_20260421_1.txt`

### ✅ 완료 — 결과 품질 전면 개선 + QA 2차 + Scenario 융합 업그레이드 (2026-04-22)

**작업 완료:**
1. **[완료]** SECTION FORMAT 전면 교체 — 모든 프롬프트에서 "Do NOT output any text before the first header" 추가
2. **[완료]** FIRST LINE 인스트럭션 제거 — 인트로 문장을 첫 번째 섹션 설명 안으로 이동 (5개 프롬프트 전부)
3. **[완료]** Compatibility SECTION FORMAT에 누락된 🔥 Where You Work Well Together 헤더 추가
4. **[완료]** Yearly Fortune — Monthly Highlights 섹션 내 4개 SVG 라인 차트 (2×2 그리드)
5. **[완료]** 차트 ≤390px 폭 제한, 아코디언 섹션 안에 포함
6. **[완료]** normalizeTitle 키 길이 내림차순 정렬 — 구체적 키 우선 매칭
7. **[완료]** Cloud Run 배포: revision 00173-xkc (compatibility fix), revision 00174-bkv (all prompts)
8. **[완료]** QA 테스트 전체 완료 → `D:\snap_pillar bck\result\result_20260422_1.txt`
9. **[완료]** Standalone Scenario Reading — BaZi+Western 완전 융합 업그레이드 (revision 00175-hdk)
   - `/full_reading` 엔드포인트: 모든 situation 리딩에서 Western natal 데이터 fetch
   - `build_gpt_prompt()` else 블록: western_data 있으면 "one fused eye" context_intro 생성
   - `use_western` 플래그: `source == "basic" and western_data is not None` 조건 추가
   - 결과: standalone 시나리오도 Sun/Moon/Rising/행성/Saturn return/Jupiter transit 전부 융합

**QA 최종 결과 (전 서비스 $1.99 기준):**
- Personal Daily Fortune: ✅ PASS — BaZi+Western 10/10, 가독성 10/10
- Yearly Fortune: ✅ PASS — 차트 포함, Monthly Highlights 정상
- Compatibility: ✅ PASS — 내용 10/10, Section 1 버그 수정 완료
- Scenario Reading: ✅ PASS — BaZi+Western 10/10 (업그레이드 완료), 가독성 10/10
- Personal Fortune: ✅ PASS — 내용 10/10, Section 1 버그 수정 완료
- **전체 서비스 5/5 PASS — 모두 10/10, $1.99 대비 3~4배 가치 over-deliver**

**가격 분석 ($1.99/크레딧 기준):**
- Personal Fortune ($1.99) → 실제 가치 $6~8 (4배 저평가)
- Scenario Reading ($1.99) → 실제 가치 $5~7 (3.5배 저평가)
- Compatibility ($1.99) → 실제 가치 $5~6 (3배 저평가)
- Yearly Fortune ($3.98) → 실제 가치 $10~15 (3~4배 저평가)
- Personal Daily ($1.99) → 실제 가치 $1.99~2.50 (적정, 단 매일 과금 구조 재검토 필요)
- **향후 크레딧 소모량 조정 검토**: Personal Fortune/Scenario/Compatibility → 2크레딧, Yearly → 3크레딧

**미수정 버그:**
- [P1] 랜딩 "100% Private. Never stored. Never shared." — 교체 필요
- ~~[P2] 하단 네비게이션 Credits 수치 갱신 안 됨~~ ✅ 수정 완료 (커밋 1d9c82f)
- [P2] Astrology Profile RISING 카드 "ASC" 텍스트 → 별자리 이미지
- [P3] PersonPicker 저장 인물 auto-select 안 됨

**향후 개선 사항 (버그 아님):**
- 각 섹션 상단 TL;DR 콜아웃 박스 추가
- Personal Daily — 구독 모델 검토 ($9.99/월 무제한 Daily)

### ⏳ 확인 필요
- [ ] ASC 이미지 로드 실패 원인 — `r_cancer.svg` 파일 존재 여부 및 키 파싱 확인

### 📋 남은 작업
- [ ] `firebase deploy --only firestore:rules` — Firebase CLI 설치 후 실행 (`npm install -g firebase-tools`)
- [ ] Vercel 환경변수 세팅 확인 (`NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
- [x] 하단 네비게이션 Credits 갱신 버그 수정 ✅ (AuthContext로 전역 상태 공유, 커밋 1d9c82f)
- [ ] "Never stored." 문구 교체
- [ ] PersonPicker 저장 인물 1명일 때 auto-select

---

## 다음 세션 시작 가이드

> 마지막 작업: 2026-04-25 세션59 진행 중

### ⏳ 세션59 진행 중 — 2026-04-25

**작업 목록 (10개):**
1. ✅ **Daily V3 업그레이드**: `/api/v2/` → `/api/v3/horoscope/daily/personal` + V3 필드 파싱
2. ✅ **RISING 버그**: `symbol="ASC"` → `ZODIAC_SYMBOL[ascSign] ?? '↑'` 교체 완료
3. ✅ **BaZi Synastry**: `fetch_bazi_synastry()` + `build_compatibility_prompt` synastry_data 파라미터 추가
4. ✅ **BaZi Flow + Yearly 그래프 차별화**: `fetch_bazi_flow()` 추가, `build_gpt_prompt` 연동, SCORES_JSON 차별화 지시 추가
5. ✅ **Moon Phase → Today's Fortune**: `/moon_phase` GET 엔드포인트 + today/page.tsx 달 위상 카드 추가
6. ⏳ **SVG Chart**: `/api/v1/natal/chart/` → Personal Fortune/Daily/Yearly 차트 뷰어
7. ✅ **Lifespan Chart**: `fetch_lifespan()` + `LifespanChart` 컴포넌트 (2줄 레이아웃), LuckCycleBarChart 폴백 유지
8. ✅ **추가a**: SPLIT_RE `\\n+` 수정 + `\r\n` 정규화 (parseResult 내)
9. ✅ **추가b**: "Your Sign" (별자리×일간) BaZi Chart 탭 내부 표시
10. ⏳ **최종 테스트**: astropillar.com k@k.com 로그인 후 전 서비스 테스트

---

> 마지막 작업: 2026-04-24 세션58 완료

### ✅ 세션58 완료 — 2026-04-24

**완료된 작업:**
1. **[완료]** Elements 탭 — 오행 관계 차트(WuXingChart) 추가 (커밋 14cd90e)
   - 캔버스 기반 오각형 차트: 상생(초록 실선) / 상극(빨강 점선) 화살표
   - 노드 크기 `wood_points` / `fire_points` 등 API 점수에 비례 (없으면 균등)
   - Day Master element에 ★ You 골드 마커 표시
   - "Five Elements · Relationships" 레이블로 Day Master 카드 아래 배치

2. **[완료]** 프롬프트 30/30/40 규칙 전수 적용 — 5개 서비스 27개 섹션 전부 (Cloud Run revision 00184-4xj)
   - 적용 방식: 각 섹션 설명 끝에 `SECTION RATIO` 지시어 추가
   - Personal Fortune: ✨Who You Are / 💼Career / ❤️Love / 💰Wealth / 🌿Health / 📊Life Chapters (6개)
   - Personal Daily: system prompt CONTENT RATIO RULE + ✨Who You Are Today / 💼Career / ❤️Love / 💰Money / 🌿Health (6개)
   - Yearly Fortune: ✨at a Glance / 💼Career&Money / ❤️Love / 🌿Health / 📊Growth / 📅Monthly Highlights / 💡Strategy (7개)
   - Scenario Reading (use_western): 🎯What / ✅Working / ⚠️Watch Out / 📅Timing / 💡How / 🔮Bottom Line (6개)
   - Compatibility: FUSION REMINDER + ✨Who / 🔥Works Well / ⚡Complicated / 💫Bottom Line (5개)
   - **규칙**: ~30% BaZi + ~30% Western + ~40% 두 시스템만 합쳤을 때 보이는 융합 진실. 병렬 서술 절대 금지.

3. **[완료]** Scenario 버튼 크레딧 수치 Firebase 연동 (커밋 ee48564)
   - `ScenarioButton` 내 `usePricing()` 훅 추가
   - 하드코딩 "2 Credits" → `service_config/pricing.scenario` 동적 로드
   - 1이면 "Credit" (단수), 복수면 "Credits" 자동 표기

### ✅ 세션57 완료 — 2026-04-23

**완료된 작업:**
1. **[완료]** 일간 표현 10개 전면 교체 — `get_day_master_label()` 함수 새 매핑 적용
   - 甲→Bold Wood, 乙→Graceful Wood, 丙→Blazing Fire, 丁→Glowing Fire, 戊→Steady Earth, 己→Grounded Earth, 庚→Forged Metal, 辛→Pure Metal, 壬→Vast Water, 癸→Still Water
   - 모든 프롬프트 예시 "Fierce Metal" → "Forged Metal", "Flowing Wood" → "Graceful Wood" 등 전부 교체
2. **[완료]** Personal Fortune 그래프 추가 — 육각 RadarChart(Love/Career/Wealth/Health/Vitality/Life) + LuckCycleBarChart
   - SCORES_JSON 지시어 프롬프트에 추가 + 백엔드 파싱 로직 추가
3. **[완료]** Personal Daily Fortune 그래프 추가 — 육각 RadarChart + AmPmBarChart(오전/오후)
   - SCORES_JSON 지시어 프롬프트에 추가 + 백엔드 파싱 로직 추가
4. **[완료]** Yearly SCORES_JSON 일관성 규칙 추가 — 텍스트 긍정 → 점수 높게, 부정 → 낮게 강제
5. **[완료]** 일간 표현 Bold 처리 (프론트엔드) — `RichText` 컴포넌트로 10개 표현 골드 bold 렌더링
6. **[완료]** 별자리 카드 뉴스 엑셀 12개 — A열 일간 표현 전면 교체 (120개 셀)

7. **[완료]** QA 수정사항 (2026-04-23 세션56 추가작업):
   - Compatibility 페이지 — 인라인 Add Person 폼 추가 (Library 이동 없이 직접 추가 가능)
   - Yearly 아코디언 버그 수정 — SPLIT_RE/eMatch에 `u` 플래그 추가 (non-BMP 이모지 파싱 실패 → 단일 Section 1 표시 버그 수정)
   - 한자 영어 병기 — BaZi 차트 이미지 아래 `甲 (Bold Wood)` / `子 (Rat)` 형식 라벨 추가, RichText 한자 annotation 함수 추가
   - 랜딩 페이지 이미지 교체 — p_1_main.webp → home.png (로컬 파일)

8. **[완료]** Yearly 섹션명 중복 수정 — "Career & Learning" → "Growth & Learning" (Cloud Run revision 00178-dz9)

**세션57 QA 진행상황 (2026-04-23):**
- [x] Personal Fortune (qewr) — 완료 (이전 세션)
- [x] Daily Fortune (qewr) — 완료 (이전 세션)
- [x] Yearly Fortune (qewr) — 완료, "Career & Learning" 중복 버그 발견 및 수정
- [x] Compatibility (qewr + parkjp) — 완료
- [x] Scenario Reading (qewr) — 완료
- [x] QA 보고서 작성 → `D:\snap_pillar bck\result\result_20260423_1.txt` ✅ 완료
- [x] Daily Fortune P1 버그 수정 — 날짜줄 헤더 안으로 이동 (Cloud Run revision 00180-wsl)
- [x] QA Round 2 (test01) — Personal + Daily 신규 테스트, 보고서: `result_20260423_2.txt`
  - P1 수정 확인 ✅
  - 신규 발견: Personal Fortune 레이더 차트 저점 문제 (7 Killings 차트에서 전 영역 20~30점대)

### 직전 세션에서 완료한 것 (2026-04-22)
1. **Section 1 아코디언 버그 수정** — 모든 프롬프트에 "Do NOT output any text before first header" + FIRST LINE 인스트럭션 첫 섹션 안으로 이동
2. **Compatibility SECTION FORMAT 누락 헤더 추가** — 🔥 Where You Work Well Together
3. **Scenario Reading BaZi+Western 완전 융합** (revision 00175-hdk)
4. **하단 네비게이션 Credits 갱신 버그 수정** — AuthContext 도입, 전역 상태 공유 (커밋 1d9c82f)
5. **Yearly Fortune 차트 레이아웃 개선** (커밋 c4c106e)
   - Career & Money: 가로 → 세로 배치 (Career 위, Money 아래), 각 330px 풀사이즈
   - At a Glance: 총운(Overall) 차트 추가 — career/love/health/money 평균, 골드색
6. **프롬프트 Fierce/Flowing 명칭 통일** — "Geng Metal" → "Fierce Metal", "Gui Water" → "Flowing Water" (revision 00176-76j)
7. **융합 구조 전면 강화 + 비율 규칙** (revision 00177-xfp)
   - "Option B" (BaZi 먼저 → Western → 결론) 병렬 구조 허용 조항 완전 삭제
   - 모든 프롬프트에 구체적 ❌/✅ 예시 추가: "Fierce Metal with Scorpio Sun" 형식 강제
   - **콘텐츠 비율 규칙**: 명리학 30% + 점성술 30% + 융합 결론 40% — 5개 서비스 전부 적용
   - 적용 범위: situation_system_prompt / personal_fortune / yearly_western_block / western_fusion_rules / anti_parallel
8. **QA 전체 완료** — 5개 서비스 모두 PASS, 10/10
   - 상세 리포트: `D:\snap_pillar bck\result\result_20260422_1.txt`

### 다음 세션 우선순위

**버그 수정**
1. **[버그]** 랜딩 "100% Private. Never stored. Never shared." 문구 교체 (법적 리스크) ← 광고 집행 전 필수
2. **[버그]** Astrology Profile RISING 카드 "ASC" 텍스트 → 별자리 이미지 수정

**UX 개선**
3. **[UX]** Scenario Reading 단일 장문 서사 → 4섹션 아코디언 분리 (Short Answer / In-Depth / Timing / Action Steps)
4. **[UX]** 폰트 개선 — 리딩 본문 Lora(세리프)로 교체 검토
5. **[개선]** PersonPicker 저장 인물 1명일 때 auto-select

**전환율 개선 (로그인 컨버전) — 2026-04-23 분석**
현재 문제:
- "Read My Stars & Fate — Free" CTA → Today's Fortune (로그인 없이 이용) → 가입 없이 이탈
- 랜딩에 실제 리딩 결과물 미리보기 없음 (비주얼만 있고 콘텐츠 없음)
- 플로팅 버블("My toxic trait", "When will I meet them?")이 클릭 불가 — 감정 훅 낭비
- "Sign In" 버튼만 있고 신규 유저용 "Sign Up" 진입점 없음

우선순위별 개선안:
- **①[최우선]** 플로팅 버블 클릭 → "Enter your birth info" → 생년월일 입력 → 가입 → 답 바로 표시 (욕구 최고점에서 전환)
- **②** 스크롤 시 실제 Personal Fortune 결과 일부를 블러 처리 + "Sign up to read yours" 오버레이
- **③** Today's Fortune 무료 이용 시 생년월일 입력 = 계정 생성으로 연결 (가입 마찰 최소화)
- **④** CTA 문구 변경: "✦ Read My Stars & Fate — Free" → "✦ Reveal My Chart — Free" + 아래에 `No credit card · Takes 30 seconds`

**기타**
6. **[배포]** `firebase deploy --only firestore:rules`
7. **[비즈]** 크레딧 소모량 조정 검토 — Personal Fortune/Scenario/Compatibility 2크레딧, Yearly 3크레딧

### 핵심 파일 경로
| 파일 | 역할 |
|------|------|
| `E:\My Team\astropillar\src\components\ReadingResult.tsx` | Astrology Profile UI, extractWestern() |
| `E:\My Team\astropillar\src\components\BirthForm.tsx` | TIME_RANGES, BirthData 인터페이스 |
| `E:\My Team\astropillar\src\components\PersonPicker.tsx` | 인물 선택 UI, Add Person 폼 |
| `E:\My Team\astropillar\src\lib\firestore.ts` | SavedPerson 인터페이스, savePerson() |
| `E:\My Team\astropillar\src\app\library\page.tsx` | Library My Persons 탭 |
| `D:\snap pillar\main.py` | FastAPI 백엔드 (Cloud Run) |

---

## 결과 화면 구성 (ReadingResult.tsx)

결과 화면은 3개 탭으로 구성:
1. **BaZi Chart** — 년/월/일/시 각 기둥의 천간·지지 이미지
   - 천간: `gan_[한자].png`, 지지: `zhi_[한자].png` (GitHub 이미지 레포)
2. **Elements** — Day Master 카드 + 오행 관계 차트(WuXingChart)
   - Day Master 원소 설명 카드 (색상/한자/설명)
   - WuXingChart: 오각형 + 상생(초록 실선) / 상극(빨강 점선) 화살표, ★ You 마커
   - API `*_points` 필드로 노드 크기 비례 표시
3. **Astrology Profile** — Big Three(Sun/Moon/Rising) + Inner Planets + Outer Planets 카드
   - 별자리 SVG: `r_[sign].svg` (원본 색상, filter 없음)
4. **Reading (GPT 해석문)** — 섹션별 아코디언

---

## 배포 절차 (GitHub + Vercel)

### 1단계 — GitHub 레포 생성 & 푸시
`gh` CLI가 없을 경우 GitHub에서 빈 레포 `hellojunpil/astropillar-nextjs` 수동 생성 후:
```bash
git -C "E:/My Team/astropillar" remote add origin https://github.com/hellojunpil/astropillar-nextjs.git
git -C "E:/My Team/astropillar" push -u origin master
```
`gh` CLI 있을 경우:
```bash
gh repo create hellojunpil/astropillar-nextjs --public --source="E:/My Team/astropillar" --remote=origin --push
```

### 2단계 — Vercel 배포
1. https://vercel.com → "Add New Project" → GitHub 레포 import
2. Framework: **Next.js** (자동 감지)
3. 환경변수 아래 목록 전부 입력 후 Deploy

### 3단계 — Vercel 환경변수 목록
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWFmD7UDYuO0EErZDF3kxlmTYxw1tz9KU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pillarfortune.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pillarfortune
NEXT_PUBLIC_GOOGLE_CLIENT_ID=944836465041-ofkua0sdrnabng4nq6laaiu1sa1n7vbl.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE=https://snap-pillar-api-944836465041.asia-northeast3.run.app
NEXT_PUBLIC_GUMROAD_URL_1=https://junpil.gumroad.com/l/gveeli
NEXT_PUBLIC_GUMROAD_URL_5=https://junpil.gumroad.com/l/idksv
GUMROAD_SELLER_ID=0DwFvQOjnySBKZVYvOzIJg==
NEXT_PUBLIC_GA4_ID=G-NSTDRL3GJN
```

### 4단계 — 도메인 연결
- Vercel → Settings → Domains → `astropillar.com` 추가
- DNS: Vercel이 안내하는 A레코드 또는 CNAME 설정

---

## 세션 히스토리 요약

- **세션1~22**: Bubble + FastAPI 기반 전체 서비스 개발 완료
- **세션47**: Vercel 분리 (astropillar.com → Vercel 랜딩, app.astropillar.com → Bubble)
- **세션48**: GA4 내부 트래픽 필터, Playwright MCP 설치, V1 디자인 개선
- **세션49**: Bubble 로그인 401 오류 미해결 → Bubble 포기, Next.js 전환 결정
- **세션50~**: Next.js 전환 작업 시작

---

## 중요 원칙

- **솔직한 진단 우선** — 듣기 좋은 말보다 도움 되는 말
- **main.py 수정 전** 반드시 최신 파일 먼저 확인
- **배포**: VSCode 터미널 기준으로 안내
- **모델**: Claude Sonnet 4.6
- **광고 타겟**: 미국/영국/캐나다/호주/필리핀/싱가포르/말레이시아
