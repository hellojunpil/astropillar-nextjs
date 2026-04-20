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

# GA4
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
| `/reading/scenario` | Scenario Reading | ✅ | 2 Credits |
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

### ⏳ 확인 필요
- [ ] Personal Fortune 리딩 후 브라우저 콘솔 `[AstrologyProfile] western:` 로그 확인 → ASC 키 이름 파악
- [ ] Cloud Run 로그 `DEBUG fetch_natal_western OK:` / `DEBUG western_fields:` 확인 → sun/moon/asc 값 검증

### 📋 남은 작업
- [ ] `firebase deploy --only firestore:rules` — Firebase CLI 설치 후 실행 (`npm install -g firebase-tools`)
- [ ] Vercel 환경변수 세팅 확인 (`NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)

---

## 다음 세션 시작 가이드

> 마지막 작업: 2026-04-21

### 직전 세션에서 완료한 것
1. **파비콘 교체** — `favicon_ap3.png` → `src/app/icon.png`, 기존 `favicon.ico` 삭제
2. **버그 수정: "Not enough Credits" 오작동** (`src/components/ReadingPageShell.tsx`, 5개 reading 페이지)
   - 리딩 완료 후 credits=0 되면 결과 대신 경고 뜨던 문제 → `inProgress` prop으로 해결
3. **버그 수정: 크레딧 UI 지연** (`src/hooks/useAuth.ts`)
   - `refreshCredits(decrement)` — 즉시 로컬 차감 + 백그라운드 서버 동기화
4. **가격 Firestore 연동** (`src/hooks/usePricing.ts` 신규, `src/lib/firestore.ts` getPricing 추가)
   - menu, buy, 5개 reading 페이지 전부 `service_config/pricing` 문서에서 동적 로드
5. **최신 커밋**: `b39733b` → GitHub push → Vercel 자동 배포 완료

### 다음 세션 우선순위
1. **[배포]** `firebase deploy --only firestore:rules` — Firebase CLI 설치 필요 (`npm install -g firebase-tools` → `firebase login`)
2. **[확인]** Vercel 환경변수 `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 세팅 여부
3. **[확인]** Personal Fortune → 브라우저 콘솔 `[AstrologyProfile] western:` 로그 → ASC "Unknown" 이면 키 이름 확인 후 수정

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
2. **Astrology Profile** — Big Three(Sun/Moon/Rising) + Inner Planets + Outer Planets 카드
   - 별자리 SVG: `r_[sign].svg` (원본 색상, filter 없음)
3. **Reading (GPT 해석문)** — 섹션별 아코디언

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
