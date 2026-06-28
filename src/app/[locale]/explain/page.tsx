'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const BASE = 'https://raw.githubusercontent.com/hellojunpil/astropillar_images/main/'

const STEMS = [
  { key:'jia',  hanja:'甲', img:'gan_甲.png', name:'Jia',  sub:'The Bold Side of Wood',   kw:['Leader','Visionary','Determined'],
    desc:'Jia people are natural leaders. You move forward with conviction and rarely back down. Your energy is best spent starting new things and inspiring others to follow.' },
  { key:'yi',   hanja:'乙', img:'gan_乙.png', name:'Yi',   sub:'The Gentle Side of Wood',  kw:['Adaptable','Charming','Persistent'],
    desc:'Yi people are flexible and socially gifted. You find your way around obstacles gracefully and build lasting relationships. You get what you want — just not always in a straight line.' },
  { key:'bing', hanja:'丙', img:'gan_丙.png', name:'Bing', sub:'The Bold Side of Fire',    kw:['Charismatic','Generous','Optimistic'],
    desc:'Bing people light up every room. You give energy freely and make people feel good just by being around. Your warmth draws others in naturally.' },
  { key:'ding', hanja:'丁', img:'gan_丁.png', name:'Ding', sub:'The Gentle Side of Fire',  kw:['Intuitive','Devoted','Perceptive'],
    desc:'Ding people have a rare emotional depth. You sense what others feel before they say it, and your loyalty to the people you love runs deep.' },
  { key:'wu',   hanja:'戊', img:'gan_戊.png', name:'Wu',   sub:'The Bold Side of Earth',   kw:['Reliable','Patient','Grounded'],
    desc:'Wu people are the ones others lean on. You stay calm when everything else is chaotic. People trust you instinctively — and for good reason.' },
  { key:'ji',   hanja:'己', img:'gan_己.png', name:'Ji',   sub:'The Gentle Side of Earth', kw:['Nurturing','Detail-oriented','Practical'],
    desc:'Ji people notice what everyone else misses. You take care of the details and make sure things actually work. Your quiet contributions hold everything together.' },
  { key:'geng', hanja:'庚', img:'gan_庚.png', name:'Geng', sub:'The Bold Side of Metal',   kw:['Decisive','Principled','Courageous'],
    desc:'Geng people say what they mean and mean what they say. You have strong convictions and the courage to act on them — even when it is uncomfortable.' },
  { key:'xin',  hanja:'辛', img:'gan_辛.png', name:'Xin',  sub:'The Gentle Side of Metal', kw:['Refined','Perceptive','Precise'],
    desc:'Xin people have high standards and an eye for quality. You notice flaws others overlook and have a gift for making things better than they were.' },
  { key:'ren',  hanja:'壬', img:'gan_壬.png', name:'Ren',  sub:'The Bold Side of Water',   kw:['Strategic','Intelligent','Resourceful'],
    desc:'Ren people think fast and plan deep. You are always a few steps ahead and can navigate complex situations with ease. Your mind is your greatest asset.' },
  { key:'gui',  hanja:'癸', img:'gan_癸.png', name:'Gui',  sub:'The Gentle Side of Water', kw:['Empathetic','Intuitive','Deep'],
    desc:'Gui people feel everything more intensely than most. Your emotional intelligence is high, and your instincts are almost always right.' },
]

const ELEMENTS = [
  { key:'wood',  hanja:'木', color:'#4CAF50', name:'Wood',  kw:['Growth','Ambition','Creativity'],
    desc:'Wood energy is about moving forward and growing. You are driven by goals, energized by new challenges, and at your best when you are building something meaningful.' },
  { key:'fire',  hanja:'火', color:'#F44336', name:'Fire',  kw:['Passion','Warmth','Expression'],
    desc:'Fire energy is about connection and expression. You feel things deeply, communicate powerfully, and bring life to everything around you.' },
  { key:'earth', hanja:'土', color:'#FF9800', name:'Earth', kw:['Stability','Trust','Practicality'],
    desc:'Earth energy is about being the steady one. People rely on you. You are grounded, dependable, and good at turning ideas into real results.' },
  { key:'metal', hanja:'金', color:'#9E9E9E', name:'Metal', kw:['Precision','Integrity','Strength'],
    desc:'Metal energy is about doing things right. You have principles you do not compromise on, and you push yourself and others toward excellence.' },
  { key:'water', hanja:'水', color:'#2196F3', name:'Water', kw:['Wisdom','Flow','Depth'],
    desc:'Water energy is about understanding. You read people and situations well, adapt to anything, and carry a quiet wisdom that others sense immediately.' },
]

const PLANETS = [
  { sym:'☀', name:'Sun',     key:'sun',     sub:'Your Core Self',                    kw:['Identity','Personality','Vitality'],
    desc:'Your Sun sign shows who you are at your core — your main personality, your natural strengths, and the energy you were born to put out into the world. It is the foundation of your chart.' },
  { sym:'☽', name:'Moon',    key:'moon',    sub:'Your Inner World',                  kw:['Emotions','Instincts','Comfort'],
    desc:'Your Moon sign shows how you feel on the inside — what you need to feel safe, how you react emotionally, and what your private self is really like when no one is watching.' },
  { sym:'↑', name:'Rising',  key:'asc',     sub:'How Others See You',               kw:['Appearance','First Impression','Outer Self'],
    desc:'Your Rising sign is the first impression you make. It is how you come across to people who do not know you well — your appearance, your energy, and the face you show the world.' },
  { sym:'☿', name:'Mercury', key:'mercury', sub:'How You Think and Talk',           kw:['Mind','Communication','Thinking'],
    desc:'Mercury shows how your mind works — how you communicate, how you process information, and how you express your ideas. It is the planet of thought and conversation.' },
  { sym:'♀', name:'Venus',   key:'venus',   sub:'What You Love',                    kw:['Love','Beauty','Values'],
    desc:'Venus shows what you are attracted to and how you behave in relationships. It reveals your taste, your values, and the kind of connection you are looking for.' },
  { sym:'♂', name:'Mars',    key:'mars',    sub:'What Drives You',                  kw:['Drive','Action','Desire'],
    desc:'Mars is your engine. It shows how you take action, what you go after, and what makes you fired up. It is the force behind your ambition, your energy, and your desires.' },
  { sym:'♃', name:'Jupiter', key:'jupiter', sub:'Where You Get Lucky',              kw:['Luck','Growth','Expansion'],
    desc:'Jupiter points to where good things tend to happen for you — the area of life where you grow the most and where opportunities seem to find you naturally.' },
  { sym:'♄', name:'Saturn',  key:'saturn',  sub:'Where You Grow Through Challenge', kw:['Discipline','Challenge','Mastery'],
    desc:'Saturn shows where life asks more of you. It is harder, slower, and more demanding — but the strength you build there is yours to keep forever.' },
  { sym:'♅', name:'Uranus',  key:'uranus',  sub:'Where You Break the Rules',        kw:['Freedom','Change','Innovation'],
    desc:'Uranus shows where you refuse to follow the crowd. It is the part of your life where you need freedom, where surprises happen, and where change pushes you forward.' },
  { sym:'♆', name:'Neptune', key:'neptune', sub:'Where You Dream',                  kw:['Dreams','Intuition','Spirituality'],
    desc:'Neptune shows where you are most idealistic and imaginative. It is the part of your chart connected to intuition, creativity, and a longing for something bigger than everyday life.' },
  { sym:'♇', name:'Pluto',   key:'pluto',   sub:'Where You Transform',              kw:['Transformation','Power','Rebirth'],
    desc:'Pluto shows where your deepest changes happen. It is slow and intense — but the transformation it brings is permanent. Nothing in that area of your life ever stays the same.' },
]

function InnerItem({ id, symEl, title, sub, kws, desc, isYours, isPlanet }: {
  id: string; symEl: React.ReactNode; title: string; sub: string
  kws: string[]; desc: string; isYours: boolean; isPlanet: boolean
}) {
  const [open, setOpen] = useState(isYours)
  const goldColor = isPlanet ? '#FF6B9D' : 'var(--gold)'
  return (
    <div style={{ border:`1px solid ${isYours ? goldColor : 'rgba(201,168,76,0.2)'}`, borderRadius:10, marginBottom:6, overflow:'hidden' }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer', background:'#1a2744', userSelect:'none' }}>
        {symEl}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'#E8E4DC', fontSize:11, fontWeight:600 }}>{title}</p>
          <p style={{ color:'rgba(232,228,220,0.55)', fontSize:10, fontStyle:'italic', marginTop:1 }}>{sub}</p>
        </div>
        {isYours && (
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:7, letterSpacing:1.5, color:goldColor, border:`1px solid ${goldColor}40`, padding:'2px 6px', borderRadius:4, flexShrink:0 }}>
            YOURS
          </span>
        )}
        <span style={{ fontSize:9, color:'rgba(232,228,220,0.55)', transform:open?'rotate(180deg)':'none', transition:'transform 0.22s', flexShrink:0 }}>▼</span>
      </div>
      {open && (
        <div style={{ padding:'0 14px 14px', background:'#1a2744', borderTop:'1px solid rgba(201,168,76,0.15)' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, paddingTop:12, marginBottom:10 }}>
            {kws.map(k => (
              <span key={k} style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:8, letterSpacing:1, color:goldColor, border:`1px solid ${goldColor}30`, borderRadius:20, padding:'2px 9px' }}>{k}</span>
            ))}
          </div>
          <p style={{ fontSize:13, lineHeight:1.85, color:'rgba(232,228,220,0.55)', fontStyle:'italic' }}>{desc}</p>
        </div>
      )}
    </div>
  )
}

function MainSection({ id, title, children, defaultOpen }: {
  id: string; title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div style={{ border:'1px solid rgba(201,168,76,0.2)', borderRadius:14, marginBottom:10, overflow:'hidden' }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', cursor:'pointer', background:'#16213E', userSelect:'none' }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:12, fontWeight:600, letterSpacing:1.5, color:'var(--gold)', textTransform:'uppercase' }}>{title}</span>
        <span style={{ fontSize:11, color:'var(--gold)', transform:open?'rotate(180deg)':'none', transition:'transform 0.25s', flexShrink:0, marginLeft:10 }}>▼</span>
      </div>
      {open && (
        <div style={{ background:'#16213E', borderTop:'1px solid rgba(201,168,76,0.15)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function WuxingCanvas({ userElement }: { userElement: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = 100, nr = 26
    const els = [
      { name:'Wood', hanja:'木', color:'#4CAF50' },
      { name:'Fire', hanja:'火', color:'#F44336' },
      { name:'Earth', hanja:'土', color:'#FF9800' },
      { name:'Metal', hanja:'金', color:'#9E9E9E' },
      { name:'Water', hanja:'水', color:'#2196F3' },
    ]
    const pos = els.map((_,i) => {
      const a = (i*2*Math.PI/5) - Math.PI/2
      return { x: cx+R*Math.cos(a), y: cy+R*Math.sin(a) }
    })
    function drawArrow(fi: number, ti: number, color: string, dashed: boolean) {
      const f = pos[fi], t = pos[ti]
      const a = Math.atan2(t.y-f.y, t.x-f.x)
      const sx = f.x+(nr+2)*Math.cos(a), sy = f.y+(nr+2)*Math.sin(a)
      const ex = t.x-(nr+6)*Math.cos(a), ey = t.y-(nr+6)*Math.sin(a)
      ctx!.beginPath(); ctx!.setLineDash(dashed?[5,4]:[]); ctx!.strokeStyle=color; ctx!.lineWidth=dashed?1.5:2; ctx!.globalAlpha=0.7
      ctx!.moveTo(sx,sy); ctx!.lineTo(ex,ey); ctx!.stroke()
      ctx!.globalAlpha=0.9; ctx!.setLineDash([]); ctx!.beginPath(); ctx!.fillStyle=color; ctx!.save()
      ctx!.translate(ex,ey); ctx!.rotate(a); ctx!.moveTo(0,0); ctx!.lineTo(-7,3.5); ctx!.lineTo(-7,-3.5)
      ctx!.closePath(); ctx!.fill(); ctx!.restore(); ctx!.globalAlpha=1
    }
    ctx.clearRect(0,0,W,H)
    ctx.beginPath(); pos.forEach((p,i)=>{ i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y) }); ctx.closePath()
    ctx.strokeStyle='rgba(201,168,76,0.12)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.stroke(); ctx.setLineDash([])
    ;[0,1,2,3,4].forEach(i=>drawArrow(i,(i+1)%5,'#4CAF50',false))
    ;[[0,2],[2,4],[4,1],[1,3],[3,0]].forEach(p=>drawArrow(p[0],p[1],'#F44336',true))
    els.forEach((el,i) => {
      const p = pos[i]
      const isYours = userElement && userElement===el.name.toLowerCase()
      const grd = ctx.createRadialGradient(p.x,p.y,nr*0.3,p.x,p.y,nr*1.6)
      grd.addColorStop(0,el.color+'35'); grd.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(p.x,p.y,nr*1.6,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill()
      ctx.beginPath(); ctx.arc(p.x,p.y,nr,0,Math.PI*2); ctx.fillStyle='#16213E'; ctx.fill()
      ctx.strokeStyle=el.color; ctx.lineWidth=isYours?3:1.5; ctx.stroke()
      ctx.fillStyle=el.color; ctx.font='bold 18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(el.hanja,p.x,p.y-3)
      ctx.fillStyle='#D7D7D9'; ctx.font='9px Arial'; ctx.fillText(el.name,p.x,p.y+11)
      if (isYours) { ctx.fillStyle='#C9A84C'; ctx.font='bold 8px Arial'; ctx.fillText('YOU',p.x,p.y+nr+12) }
    })
  }, [userElement])
  return <canvas ref={canvasRef} width={300} height={300} style={{ display:'block', width:'100%', maxWidth:300, height:'auto', margin:'0 auto 6px' }} />
}

function ExplainPageInner() {
  const searchParams = useSearchParams()
  const userStem = searchParams.get('day_gan')?.toLowerCase().trim() ?? ''
  const userElement = searchParams.get('element')?.toLowerCase().trim() ?? ''
  const userSun = searchParams.get('sun')?.toLowerCase().trim() ?? ''

  const parts = []
  if (userStem) parts.push(userStem.charAt(0).toUpperCase()+userStem.slice(1))
  if (userElement) parts.push(userElement.charAt(0).toUpperCase()+userElement.slice(1))
  if (userSun) parts.push(userSun.charAt(0).toUpperCase()+userSun.slice(1))

  return (
    <main style={{ background:'#0D1B2A', minHeight:'100vh', paddingBottom:60, color:'#E8E4DC', fontFamily:"'Noto Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ padding:'28px 20px 20px', borderBottom:'1px solid rgba(201,168,76,0.2)', background:'linear-gradient(180deg,rgba(201,168,76,0.05) 0%,transparent 100%)' }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <Link href="/menu" style={{ color:'rgba(201,168,76,0.7)', fontSize:13, textDecoration:'none', display:'block', marginBottom:12 }}>← Back</Link>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:'var(--gold)', letterSpacing:2, marginBottom:4 }}>What It All Means</p>
          {parts.length > 0 && (
            <p style={{ fontSize:13, color:'rgba(232,228,220,0.55)', fontStyle:'italic' }}>{parts.join(' · ')}</p>
          )}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 20px' }}>

        {/* SECTION 1: East Meets West */}
        <MainSection id="about" title="East (BaZi) Meets West (Astrology)">
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { t:'BaZi — The Eastern Blueprint', d:'BaZi reads the exact moment you were born — the year, month, day, and hour — and translates it into a map of your core personality, your natural strengths, and the energy patterns that shape your life. It has been used for over a thousand years to understand who a person truly is at their core.' },
              { t:'Western Astrology — The Celestial Map', d:'Western astrology looks at where the planets were in the sky the moment you were born. Each planet governs a different part of your life — your emotions, your relationships, your ambitions, your fears. Together they paint a picture of how you experience the world around you.' },
              { t:'What Happens When You Combine Them', d:'BaZi tells you who you are. Western astrology tells you how you experience life. Used together, they cover each other\'s blind spots and give you a reading that is both deeper and more accurate than either system alone. That is exactly what AstroPillar does.', highlight: true },
            ].map((b,i) => (
              <div key={i} style={{ background: b.highlight ? 'linear-gradient(135deg,#1a2744 0%,rgba(201,168,76,0.06) 100%)' : '#1a2744', border:`1px solid ${b.highlight?'var(--gold)':'rgba(201,168,76,0.2)'}`, borderRadius:12, padding:'18px 16px' }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, letterSpacing:1.5, color:'var(--gold)', marginBottom:10 }}>{b.t}</p>
                <p style={{ fontSize:13, lineHeight:1.85, color:'rgba(232,228,220,0.55)', fontStyle:'italic' }}>{b.d}</p>
              </div>
            ))}
          </div>
        </MainSection>

        {/* SECTION 2: Day Stem */}
        <MainSection id="stem" title="Day Stem" defaultOpen={!!userStem}>
          <div style={{ margin:'16px 16px 12px', background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:'14px 16px', fontSize:13, lineHeight:1.85, color:'rgba(232,228,220,0.55)', fontStyle:'italic' }}>
            Your Day Stem is determined by the exact day you were born. In BaZi, it represents your core identity — the person you are at your most fundamental level. It is the single most important element in your entire birth chart.
          </div>
          <div style={{ padding:'0 12px 16px' }}>
            {STEMS.map(s => (
              <InnerItem
                key={s.key} id={`stem-${s.key}`}
                symEl={<img src={`${BASE}${s.img}`} alt={s.name} width={32} height={32} style={{ borderRadius:7, objectFit:'cover', flexShrink:0 }} />}
                title={`${s.name} (${s.hanja})`} sub={s.sub} kws={s.kw} desc={s.desc}
                isYours={!!userStem && userStem===s.key} isPlanet={false}
              />
            ))}
          </div>
        </MainSection>

        {/* SECTION 3: Elements */}
        <MainSection id="element" title="Elements" defaultOpen={!!userElement}>
          <div style={{ margin:'16px 16px 12px', background:'rgba(201,168,76,0.07)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:'14px 16px', fontSize:13, lineHeight:1.85, color:'rgba(232,228,220,0.55)', fontStyle:'italic' }}>
            <strong style={{ color:'var(--gold)', fontStyle:'normal', fontFamily:"'Cormorant Garamond',serif", fontSize:9, letterSpacing:1, display:'block', marginBottom:8 }}>Why your Day Stem and dominant element might be different</strong>
            Your Day Stem is determined by the day you were born. It shows your core personality.<br/><br/>
            Your dominant element is calculated from your entire birth chart — year, month, day, and hour combined. It shows the overall energy that shapes how your life unfolds.<br/><br/>
            They are measuring two different things.
          </div>
          <div style={{ padding:'0 12px' }}>
            {ELEMENTS.map(e => (
              <InnerItem
                key={e.key} id={`el-${e.key}`}
                symEl={<div style={{ width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:`${e.color}12`, border:`1px solid ${e.color}40`, color:e.color, fontSize:16, flexShrink:0 }}>{e.hanja}</div>}
                title={e.name} sub={e.hanja} kws={e.kw} desc={e.desc}
                isYours={!!userElement && userElement===e.key} isPlanet={false}
              />
            ))}
          </div>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:8, letterSpacing:2.5, color:'rgba(232,228,220,0.55)', textTransform:'uppercase', margin:'20px 12px 12px', display:'flex', alignItems:'center', gap:10 }}>
            How the Five Elements Relate
            <span style={{ flex:1, height:1, background:'rgba(201,168,76,0.2)', display:'inline-block' }} />
          </p>
          <WuxingCanvas userElement={userElement} />
          <div style={{ display:'flex', gap:14, justifyContent:'center', marginBottom:16 }}>
            {[{color:'#4CAF50',label:'Nourishes'},{color:'#F44336',label:'Restrains'}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'Cormorant Garamond',serif", fontSize:8, letterSpacing:1, color:'rgba(232,228,220,0.55)' }}>
                <div style={{ width:18, height:2, borderRadius:2, background:l.color }} />{l.label}
              </div>
            ))}
          </div>
          <div style={{ padding:'0 12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { t:'Nourishing Cycle — each element feeds the next', color:'#4CAF50', items:['Wood feeds Fire — like fuel to a flame','Fire creates Earth — ash becomes rich soil','Earth produces Metal — ore forms deep in the ground','Metal collects Water — cold metal draws moisture','Water nourishes Wood — roots drink deep'] },
              { t:'Restraining Cycle — each element keeps another in check', color:'#F44336', items:['Wood breaks Earth — roots split through soil','Earth absorbs Water — ground soaks up the flood','Water extinguishes Fire — flood kills the flame','Fire melts Metal — heat destroys the blade','Metal cuts Wood — an axe fells the tree'] },
            ].map(c=>(
              <div key={c.t} style={{ background:'#1a2744', border:'1px solid rgba(201,168,76,0.2)', borderRadius:10, padding:'14px 16px' }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:9, letterSpacing:1.5, color:c.color, marginBottom:10 }}>{c.t}</p>
                {c.items.map((it,i) => {
                  const [bold, ...rest] = it.split(' — ')
                  return (
                    <p key={i} style={{ fontSize:13, color:'rgba(232,228,220,0.55)', lineHeight:1.7, padding:'4px 0', borderBottom:i<c.items.length-1?'1px solid rgba(255,255,255,0.04)':'none', fontStyle:'italic' }}>
                      <span style={{ color:'#E8E4DC', fontStyle:'normal', fontWeight:500 }}>{bold}</span>{rest.length?' — '+rest.join(' — '):''}
                    </p>
                  )
                })}
              </div>
            ))}
          </div>
        </MainSection>

        {/* SECTION 4: Planets */}
        <MainSection id="planet" title="Planets" defaultOpen={!!userSun}>
          <div style={{ padding:'0 12px 16px' }}>
            {PLANETS.map(p => (
              <InnerItem
                key={p.key} id={`pl-${p.key}`}
                symEl={<div style={{ width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,107,157,0.12)', border:'1px solid rgba(255,107,157,0.25)', color:'#FF6B9D', fontSize:14, flexShrink:0 }}>{p.sym}</div>}
                title={p.name} sub={p.sub} kws={p.kw} desc={p.desc}
                isYours={p.key==='sun' && !!userSun} isPlanet={true}
              />
            ))}
          </div>
        </MainSection>

      </div>
    </main>
  )
}

export default function ExplainPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#0D1B2A', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'var(--gold)', fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>Loading...</p>
      </main>
    }>
      <ExplainPageInner />
    </Suspense>
  )
}
