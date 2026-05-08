# AstroPillar i18n 작업 진행상황

## 결정사항 요약 (2026-05-05)

### 시장 확대 전략
- 기존: 북미 타겟 (전환율 낮음)
- 신규: 한국 + 일본 + 동남아 추가

### 결제 전략
| 지역 | 결제 서비스 |
|------|------------|
| 한국 + 일본 + 동남아 | 포트원 (사업자 등록 후) |
| 영미권 + 그 외 | Gumroad (현행 유지) |

- 포트원: 가입비 면제 (포트원 패키지), 수수료 3.4%, JCB 지원, 일본 편의점/간편결제 지원
- 포트원 미가입 상태 → 결제 분기 코드만 구조 잡아두고 나중에 연동

### URL 구조
```
astropillar.com      → IP 감지 → /ko or /ja or 기본(영어)
astropillar.com/ko   → 한국어
astropillar.com/ja   → 일본어
astropillar.com      → 영어 (기본값)
```

### 언어 선택
- 드롭다운 메뉴로 수동 선택 가능
- IP 기반 자동 감지 (Vercel x-vercel-ip-country 헤더)
- 선택값 쿠키 저장

### Git 브랜치
- 작업 브랜치: `feature/i18n`
- 운영: `master` (astropillar.com) — 건드리지 않음
- Vercel 프리뷰 URL에서 테스트 후 master 머지

---

## 작업 체크리스트

### 1단계 — 기반 세팅
- [ ] next-intl 설치
- [ ] next-intl 라우팅 설정 (middleware, i18n.ts)
- [ ] 번역 파일 구조 생성 (messages/en.json, ko.json, ja.json)
- [ ] 미들웨어 — IP 감지 + 언어 리다이렉트
- [ ] 언어 드롭다운 컴포넌트 (LanguageSwitcher)

### 2단계 — 페이지 번역
- [ ] 랜딩 페이지 (/)
- [ ] 로그인 (/login)
- [ ] 메뉴 (/menu)
- [ ] Personal Fortune (/reading/personal-fortune)
- [ ] Personal Daily (/reading/daily)
- [ ] Yearly Fortune (/reading/yearly)
- [ ] Compatibility (/reading/compatibility)
- [ ] Scenario Reading (/reading/scenario)
- [ ] Today's Fortune (/today)
- [ ] Credit 구매 (/buy)
- [ ] Library (/library)
- [ ] Tarot 3종 (/tarot/*)
- [ ] 공통 컴포넌트 (BottomNav, ReadingPageShell 등)

### 3단계 — 결제 분기
- [ ] 결제 분기 유틸 (getPaymentProvider by country)
- [ ] Gumroad 컴포넌트 분리
- [ ] PortOne 컴포넌트 자리 잡기 (가입 후 연동)

### 4단계 — GPT 프롬프트
- [ ] 한국어 결과 출력 프롬프트
- [ ] 일본어 결과 출력 프롬프트

---

## 진행 로그

### 2026-05-05 작업 1 (기반 세팅 완료)
- ✅ feature/i18n 브랜치 생성
- ✅ next-intl 설치
- ✅ src/i18n/routing.ts — 로케일 정의 (en/ko/ja)
- ✅ src/i18n/request.ts — 서버사이드 메시지 로더
- ✅ src/navigation.ts — 로케일 인식 Link/useRouter
- ✅ src/middleware.ts — IP 감지 + 언어 자동 리다이렉트
- ✅ next.config.ts — next-intl 플러그인 적용
- ✅ messages/en.json — 영어 번역 완료
- ✅ messages/ko.json — 한국어 번역 완료 (자연스러운 표현)
- ✅ messages/ja.json — 일본어 번역 완료 (자연스러운 표현)
- ✅ src/app/[locale]/layout.tsx — 로케일 레이아웃
- ✅ src/components/LanguageSwitcher.tsx — 언어 드롭다운

### 작업 2 완료 (랜딩 페이지)
- ✅ src/lib/landingData.ts — 로케일별 TEASER_SETS/DM_DESC (한/영/일)
- ✅ src/app/[locale]/page.tsx — 랜딩 페이지 완전 번역 (3 view 전부)
  - 롤링 텍스트, 버블, CTA, 폼 레이블, 결과 화면 전부 번역
  - 한국어 자연스러운 감성 문구 반영
  - 일본어 자연스러운 감성 문구 반영
  - LanguageSwitcher 탑바에 추가
  
### 작업 3 완료 (나머지 페이지)
- ✅ [locale]/login/page.tsx — 로그인 완전 번역 (오류 메시지 포함)
- ✅ [locale]/menu/page.tsx — 메뉴 완전 번역 (서비스 카드, 타로 섹션)
- ✅ [locale]/buy/page.tsx — 구매 페이지 번역 + 포트원 자리 확보
- ✅ src/lib/paymentProvider.ts — 결제 분기 유틸 (portone/gumroad)
- ✅ BottomNav.tsx — next-intl 번역 연동 + locale-aware Link
- ✅ 리딩 5개 + 타로 3개 + today/library — shell re-export

### 작업 4 완료 (빌드 & 배포)
- ✅ 빌드 오류 수정 (root layout에 NextIntlClientProvider 추가)
- ✅ npm run build 성공
- ✅ git commit (009a4f4)
- ✅ git push origin feature/i18n → Vercel 프리뷰 배포 시작

## 테스트 URL
Vercel 대시보드에서 feature/i18n 프리뷰 URL 확인
- `/ko` → 한국어 랜딩
- `/ja` → 일본어 랜딩
- `/` → 영어 랜딩 (IP 기반 자동 감지)

### 작업 5 완료 (GPT 한국어/일본어 출력)
- ✅ main.py — `_language_rule(language)` 헬퍼 함수 추가 (ko/ja/en 동적 언어 규칙)
- ✅ main.py — 4개 프롬프트 빌더에 `language` 파라미터 추가 + system_prompt 끝에 언어 override 주입
  - `build_gpt_prompt` (yearly/scenario)
  - `build_compatibility_prompt`
  - `build_personal_fortune_prompt`
  - `build_personal_daily_prompt`
- ✅ main.py — 3개 request 모델에 `language: Optional[str] = None` 추가
  - `CompatibilityRequest`, `FullReadingRequest`, `PersonalDailyRequest`
- ✅ main.py — 4개 엔드포인트 핸들러에서 `language=req.language` 전달
- ✅ 5개 reading 페이지에 `useLocale()` + `language: locale` API 전달
  - personal-fortune, daily, yearly, scenario, compatibility
- ✅ Cloud Run 재배포 완료 (revision 00199-w6p)
- ✅ git commit + push (60953a2)

## 미완료 / 향후 작업
- [ ] 포트원 가입 완료 후 결제 연동
- [ ] 리딩 페이지 UI 텍스트 번역 (현재 영어 — PersonPicker, BirthForm 등)
- [ ] Today's Fortune 번역
- [ ] 번역 검수 (특히 일본어)

