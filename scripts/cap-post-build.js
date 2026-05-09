// Capacitor 빌드 후 실행: out/index.html 생성 (로케일 감지 후 리다이렉트)
const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '..', 'out')

if (!fs.existsSync(outDir)) {
  console.error('[cap-post-build] out/ 폴더가 없습니다. 빌드를 먼저 실행하세요.')
  process.exit(1)
}

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AstroPillar</title>
  <script>
    (function() {
      function getCookie(name) {
        var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
      }
      var locale = getCookie('NEXT_LOCALE') || 'en';
      if (['en', 'ko', 'ja'].indexOf(locale) === -1) locale = 'en';
      window.location.replace('./' + locale + '/');
    })();
  </script>
</head>
<body></body>
</html>`

fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8')
console.log('[cap-post-build] out/index.html 생성 완료')
