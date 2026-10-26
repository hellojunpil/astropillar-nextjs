import './globals.css'

// 루트 layout은 통과형이라 404는 자체 html/body를 가짐
export default function NotFound() {
  return (
    <html lang="en">
      <body>
        <div className="ap-sky" aria-hidden="true" />
        <main className="ap-page" style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div>
            <p className="ap-display ap-gold-text" style={{ fontSize: 72 }}>404</p>
            <p className="ap-lead" style={{ marginTop: 8 }}>This star is not on our map. · 이 별은 지도에 없어요.</p>
            <a href="/" className="ap-btn" style={{ marginTop: 28 }}>AstroPillar</a>
          </div>
        </main>
      </body>
    </html>
  )
}
