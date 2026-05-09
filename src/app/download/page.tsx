import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.pillab.astropillar'
const APP_STORE_URL = 'https://apps.apple.com/app/astropillar/id0000000000'
const WEB_URL = 'https://astropillar.com'

export default async function DownloadPage() {
  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''

  const isAndroid = /android/i.test(ua)
  const isIOS = /iphone|ipad|ipod/i.test(ua)

  if (isAndroid) redirect(PLAY_STORE_URL)
  if (isIOS) redirect(APP_STORE_URL)
  redirect(WEB_URL)
}
