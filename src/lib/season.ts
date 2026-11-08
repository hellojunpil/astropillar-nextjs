// 신년운세 시즌 (11월~1월): 무료 화면·메뉴·결과 화면에서 신년운세로 안내
// 대상 연도는 yearly/page.tsx·백엔드 get_fortune_year와 같은 규칙 (11월부터 다음 해)

export function getFortuneYear(now = new Date()): number {
  return now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear()
}

export function isNewYearSeason(now = new Date()): boolean {
  const m = now.getMonth()
  return m === 10 || m === 11 || m === 0
}

/** 신년운세 안내 문구 (언어별) */
export function yearlyPromo(locale: string, year = getFortuneYear()) {
  if (locale === 'ko') return {
    kicker: `${year} 신년운세`,
    title: `${year}년, 나는 어떻게 흘러갈까?`,
    desc: '사주와 별자리로 읽는 12개월 흐름. 연애·일·돈의 좋은 달까지 짚어드려요.',
    cta: `${year} 신년운세 보기`,
    guestNote: '가입하면 첫 리딩이 무료예요.',
  }
  if (locale === 'ja') return {
    kicker: `${year}年の運勢`,
    title: `${year}年、わたしはどう流れる？`,
    desc: '四柱推命と星で読む12か月の流れ。恋愛・仕事・お金の良い月までお伝えします。',
    cta: `${year}年の運勢を見る`,
    guestNote: '登録すると最初のリーディングが無料です。',
  }
  return {
    kicker: `${year} Forecast`,
    title: `Where is ${year} taking you?`,
    desc: 'Your 12 months read through BaZi and your stars — including the best months for love, work and money.',
    cta: `See my ${year} forecast`,
    guestNote: 'Sign up and your first reading is free.',
  }
}
