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
- [x] 레이아웃 & 글로벌 스타일 (다크 테마, `src/app/globals.css`)
- [x] 랜딩 페이지 (`/`)
- [x] 로그인/회원가입 (`/login`)
- [x] 메뉴 페이지 (`/menu`)
- [x] ~~Full Reading (`/reading/full`)~~ — **종료된 서비스, 페이지 삭제됨**
- [x] Personal Fortune (`/reading/personal-fortune`) — 1 Credit
- [x] Personal Daily Fortune (`/reading/daily`) — 1 Credit
- [x] Yearly Fortune (`/reading/yearly`) — 1 Credit, reading_type: yearly
- [x] Compatibility (`/reading/compatibility`) — 1 Credit, 두 사람 입력
- [x] Scenario Reading (`/reading/scenario`) — 2 Credits, reading_type: situation + 질문 입력 (2단계 플로우)
- [x] Today's Fortune (`/today`) — 무료, 로그인 불필요, 별자리/띠 선택
- [x] Credit 구매 페이지 (`/buy`) — Gumroad 연결
- [x] Gumroad Webhook (`/api/gumroad-webhook`) — seller_id 검증 후 FastAPI 전달
- [x] 공유 컴포넌트: `src/hooks/useAuth.ts`, `src/components/BirthForm.tsx`, `src/components/ReadingResult.tsx`, `src/components/ReadingPageShell.tsx`

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

### ⏳ 남은 작업
- [x] .env.local Cloud Run URL 실제값 확인 및 업데이트 → `https://snap-pillar-api-944836465041.asia-northeast3.run.app`
- [x] 공유 보상 UI (읽기 결과 화면에 share 버튼 + `/record_share` 연동)
- [x] GA4 이벤트 트래킹 (`gtag` 설치 및 주요 이벤트 추가 — reading_completed, credit_purchase_click)
- [ ] GitHub 레포 연결 + Vercel 배포
- [ ] CORS: FastAPI `main.py`에 `astropillar.com` 도메인 추가 확인
- [ ] 실제 API 응답 구조 확인 후 pillar/western 추출 로직 검증

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
