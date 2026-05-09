const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://accounts.google.com/signin');
  
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'hellojunpil@gmail.com');
  await page.click('#identifierNext');
  
  console.log('이메일 입력 완료. 비번 입력 대기 중...');
  
  // 비번 입력 후 GA4로 이동할 때까지 대기 (5분)
  await page.waitForURL('**/analytics**', { timeout: 300000 }).catch(() => {
    console.log('URL 변화 감지 안됨, 수동 이동 필요');
  });
  
  await page.goto('https://analytics.google.com/analytics/web/');
  console.log('GA4 열림');
  
  await page.waitForTimeout(600000);
})();
