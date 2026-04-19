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
  - Scenario Reading: 2 Credits
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

### ✅ 완료
- [x] CLAUDE.md 작성
- [x] Next.js 프로젝트 초기화 (TypeScript + Tailwind + App Router)
- [x] Firebase 패키지 설치
- [x] Firebase 초기화 (`src/lib/firebase.ts`)
- [x] 레이아웃 & 글로벌 스타일 (다크 테마, `src/app/globals.css`) — CSS @import 순서 버그 수정 완료
- [x] 랜딩 페이지 (`/`) — 브라우저 확인 완료
- [x] 로그인/회원가입 (`/login`) — 브라우저 확인 완료
- [x] 메뉴 페이지 (`/menu`) — 브라우저 확인 완료
- [x] ~~Full Reading (`/reading/full`)~~ — **종료된 서비스, 페이지 삭제됨**
- [x] Personal Fortune (`/reading/personal-fortune`) — 1 Credit
- [x] Personal Daily Fortune (`/reading/daily`) — 1 Credit
- [x] Yearly Fortune (`/reading/yearly`) — 1 Credit, reading_type: yearly
- [x] Compatibility (`/reading/compatibility`) — 1 Credit, 두 사람 입력
- [x] Scenario Reading (`/reading/scenario`) — 2 Credits, reading_type: situation + 질문 입력 (2단계 플로우)
- [x] Today's Fortune (`/today`) — 무료, 로그인 불필요, 별자리/띠 선택
- [x] Credit 구매 페이지 (`/buy`) — Gumroad 연결, credit_purchase_click GA4 이벤트 추가
- [x] Gumroad Webhook (`/api/gumroad-webhook`) — seller_id 검증 후 FastAPI 전달
- [x] 공유 컴포넌트: `src/hooks/useAuth.ts`, `src/components/BirthForm.tsx`, `src/components/ReadingResult.tsx`, `src/components/ReadingPageShell.tsx`
- [x] .env.local Cloud Run URL 업데이트 → `https://snap-pillar-api-944836465041.asia-northeast3.run.app`
- [x] 공유 보상 UI — `ReadingResult.tsx`에 ShareButton 추가, `/record_share` POST 연동, "3회 공유 → 1 Credit" 안내
- [x] GA4 설치 — `layout.tsx` Script 태그, `src/lib/gtag.ts` 유틸, reading_completed 이벤트 (5개 리딩 페이지)
- [x] git 초기화 + 첫 커밋 (36 files, master 브랜치)
- [x] 폰트 전체 Noto Sans로 교체 — 로고(ASTROPILLAR)만 Cormorant Garamond 유지
- [x] 로그인 페이지 스펙 완성 — 비밀번호 확인 필드, Forgot password (Firebase 재설정 이메일), Google 신규 유저만 register_user 호출
- [x] Credit 차감 순서 수정 — 5개 리딩 페이지 전부 리딩 완료 후 /use_pouch 호출로 변경
- [x] Firestore 연동 전체 검증 완료 (users/{email}, pouch_count, register_user, use_pouch, get_pouch, gumroad webhook)
- [x] register_user 버그 수정 — 에러 묵살 제거, Google OAuth isNewUser를 getAdditionalUserInfo()로 교체, 이메일 회원가입 시 cred.user.email! 직접 사용
- [x] FastAPI CORS 수정 — `D:\snap pillar\main.py` allow_origins에 `http://localhost:3000` 추가 (로컬 개발 테스트 가능)
- [x] 하단 내비게이션 바 (`BottomNav.tsx`) — 5탭: Home/Destiny/Daily/Library/Credits, 골드 글로우 active 효과
- [x] Library 페이지 (`/library`) — Reading History + My Persons 탭, Firestore 연동
- [x] Reading History 저장 — 5개 리딩 페이지 전부 saveReading() 호출
- [x] 결과 캐싱 — getCachedReading() → 캐시 히트 시 Credit 미차감, "✓ Cached result" 배지 표시
- [x] Person 저장 — BirthForm에 savedPersons 필 버튼 + "Save this person" 버튼
- [x] Daily 날짜 선택 — 오늘~+7일 필 버튼 (Today/Tomorrow/요일표시)
- [x] Scenario 버튼 — ReadingResult에 질문 입력창 + sessionStorage로 /reading/scenario 이동
- [x] Scenario 페이지 — sessionStorage에서 birthData/question 프리필
- [x] FreeAstroAPI 연결 확인 — FREEASTRO_BASE env var, 기본값 astro-api-1qnc.onrender.com
- [x] OpenAI API 연결 확인 — OPENAI_API_KEY env var (Cloud Run에 세팅됨)
- [x] git 2차 커밋 — 이번 세션 전체 변경사항 18 files (BottomNav, Library, firestore.ts 등) 커밋 완료
- [x] 배포 절차 문서화 — CLAUDE.md에 GitHub 레포 생성/푸시 명령어, Vercel 환경변수 전체 목록, 도메인 연결 방법 기록
- [x] TypeScript 빌드 오류 수정 — `WesternData.planets` 타입 명시 (`Record<string,string>`) → 로컬 빌드 통과 확인
- [x] Vercel 배포 실패 원인 해결 — `npm run build` 로컬 검증 후 fix 커밋 완료
- [x] FastAPI CORS에 `https://astropillar-nextjs.vercel.app` 추가 — `D:\snap pillar\main.py` 저장 완료 (Cloud Run 재배포 필요)
- [x] Birth Time 드롭다운 → 2시간 범위 12슬롯으로 교체 (Unknown 포함, 00~23:00 목록 제거)
- [x] Birth City 자동완성 완전 제거 — BirthForm + Compatibility 페이지 모두 자유 텍스트 입력창으로 교체, 입력값 있으면 버튼 활성화
- [x] Saved Persons 드롭다운 — 저장된 인물 있으면 "Select a Person" select 표시, 선택 시 폼 자동 입력
- [x] savePerson 에러 묵살 제거 — Firestore 저장 실패 시 Library 페이지에 에러 메시지 표시
- [x] Birth City placeholder "e.g. New York" 으로 변경 (나라 코드 제거)
- [x] Compatibility 페이지 전면 개편 — 수동 입력 폼 제거, Firestore saved persons 드롭다운으로 교체, 관계 선택 12종, API 플랫 필드 수정(name1/year1 등), 저장 인물 부족 시 빈 상태 + Add Person 버튼
- [x] 랜딩 페이지 (`/`) — index.html 전체 Next.js 변환 완료: Firebase Auth 세션 유지(로그인 시 /menu 리다이렉트), 3-view SPA(v1 랜딩/v2 폼/v3 결과), 모든 스타일·애니메이션·이미지 URL 유지, GA4 이벤트 유지, window.parent 제거
- [x] [object Object] 에러 수정 — `api.ts` detail 필드가 배열/객체일 때 JSON.stringify로 변환
- [x] PersonPicker 컴포넌트 — 인물 카드 선택 UX, 빈 상태 + Add Person 링크, Enter manually 토글
- [x] 리딩 페이지 UX 전면 개편 — Personal Fortune/Daily/Yearly/Scenario 모두 PersonPicker로 교체, Daily 날짜 선택 유지(headerSlot), Scenario 1단계 인물 선택 + Change 버튼

## 결과 화면 구성 (ReadingResult.tsx)

결과 화면은 3개 섹션으로 구성:
1. **四柱八字 (사주팔자)** — 년/월/일/시 각 기둥의 천간·지지 이미지 (GitHub 이미지 레포)
   - 천간: `https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/gan_[한자].png`
   - 지지: `https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/zhi_[한자].png`
2. **Western Astrology Chart** — 태양/달/ASC 별자리 SVG 이미지
   - 별자리 SVG: `https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/r_[sign].svg`
   - 예: `r_aries.svg`, `r_leo.svg`, `r_scorpio.svg` 등
3. **GPT 해석문** — 섹션별 텍스트 렌더링

API 응답에서 천간/지지 데이터를 `pillars.year.gan`, `pillars.year.zhi` 등 다양한 필드명으로 유연하게 추출.

### ✅ 이번 세션 추가 완료
- [x] 이모지 제거 — `ReadingPageShell.tsx` 타이틀 emoji span 삭제, `menu/page.tsx` 서비스 카드 emoji span 삭제
- [x] Add Person 버튼 URL 수정 — `PersonPicker.tsx` `href="/library?tab=persons"`
- [x] Library 페이지 URL 파라미터 처리 — `useSearchParams`로 `?tab=persons` 감지, Suspense 래핑
- [x] 리딩 로딩 화면 (`ReadingLoader.tsx`) — 골드 프로그레스 바, 롤링 문구 20개 (4초 간격), 60~120초 완료 후 결과 전환, 5개 리딩 페이지 적용
- [x] Firestore 보안 규칙 — `firestore.rules` 파일 생성 (users/{email}/** 읽기/쓰기 이메일 인증), Firebase 콘솔 또는 `firebase deploy --only firestore:rules` 배포 필요
- [x] Personal Fortune `reading_type` 누락 수정 — `/personal_fortune` API 호출에 `reading_type: 'personal_fortune'` 추가
- [x] Credit 차감 흐름 검증 — 5개 리딩 페이지 모두 `use_pouch` → `refreshCredits()` 순서 정상 확인
- [x] PersonPicker 인라인 Add Person 폼 — /library 이동 없이 같은 페이지에서 인물 입력/저장/자동선택 후 바로 리딩 진행, `savePerson` ID 반환으로 변경, 5개 리딩 페이지 `userEmail`+`onPeopleChange` prop 전달
- [x] API 오류 메시지 개선 — `api.ts` Pydantic 배열/객체 오류 시 "Something went wrong. Please try again." 표시 (모든 리딩 페이지 자동 적용)
- [x] `/use_pouch` 파라미터 수정 — 프론트 `amount` → `reading_type` 으로 변경 (5개 리딩 페이지), 백엔드 `UsePouchRequest` 스펙 일치
- [x] Scenario `reading_type` 수정 — `situation` → `scenario` (Firestore service_config/pricing 키 일치)

### ⏳ 남은 작업
- [ ] `firestore.rules` Firebase에 실제 배포 (`firebase deploy --only firestore:rules`)
- [ ] GitHub 레포 연결 + Vercel 배포 (아래 "배포 절차" 참고)
- [ ] 실제 API 응답 구조 확인 후 pillar/western 추출 로직 검증
- [ ] Vercel 환경변수 세팅 (아래 목록 참고)
- [ ] FastAPI CORS에 `https://astropillar.com` 확인 후 Cloud Run 재배포
- [ ] `.env.local` `NEXT_PUBLIC_FIREBASE_APP_ID` 값 입력, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` 추가

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
