// 생년월일 폼의 월/시간 라벨 현지화
// 주의: TIME_RANGES의 label 원문(영어)은 Firestore birth_time_label로 저장되고
// findIndex 매칭에도 쓰이므로 저장 값은 그대로 두고, 화면 표시만 이 함수로 번역한다.

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function monthOptionLabel(index0: number, locale: string): string {
  if (locale === 'ko') return `${index0 + 1}월`
  if (locale === 'ja') return `${index0 + 1}月`
  return MONTHS_EN[index0]
}

const SIGN_NAMES_KO: Record<string, string> = { aries: '양자리', taurus: '황소자리', gemini: '쌍둥이자리', cancer: '게자리', leo: '사자자리', virgo: '처녀자리', libra: '천칭자리', scorpio: '전갈자리', sagittarius: '사수자리', capricorn: '염소자리', aquarius: '물병자리', pisces: '물고기자리' }
const SIGN_NAMES_JA: Record<string, string> = { aries: '牡羊座', taurus: '牡牛座', gemini: '双子座', cancer: '蟹座', leo: '獅子座', virgo: '乙女座', libra: '天秤座', scorpio: '蠍座', sagittarius: '射手座', capricorn: '山羊座', aquarius: '水瓶座', pisces: '魚座' }

// 영어 별자리명(소문자)을 로케일 표기로 변환. 미등록 값은 원문 유지.
export function zodiacSignName(sign: string, locale: string): string {
  const key = sign.toLowerCase().replace(/\s/g, '')
  if (locale === 'ko') return SIGN_NAMES_KO[key] ?? sign
  if (locale === 'ja') return SIGN_NAMES_JA[key] ?? sign
  return sign
}

export function timeRangeLabel(label: string, locale: string): string {
  if (!/unknown/i.test(label)) return label
  if (locale === 'ko') return '모름 (태어난 시간을 몰라요)'
  if (locale === 'ja') return '不明（出生時間がわかりません）'
  return label
}
