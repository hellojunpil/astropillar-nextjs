'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { zodiacSignName } from '@/lib/birthLabels'

// 오행 색: 결과 화면과 같은 차분한 톤
const EL_COLOR: Record<string, string> = { wood:'#8FAE8B', fire:'#D08770', earth:'#C2A267', metal:'#B7BCC8', water:'#7E9CC0' }
const STEM_EL: Record<string, string> = { jia:'wood', yi:'wood', bing:'fire', ding:'fire', wu:'earth', ji:'earth', geng:'metal', xin:'metal', ren:'water', gui:'water' }
const PLANET_COLOR = '#aaa5d1'

// ── 해설 페이지 한국어·일본어 문구 ──
type Item = { title?: string; sub: string; kw: string[]; desc: string }

const EX_STEMS_I18N: Record<'ko' | 'ja', Record<string, Item>> = {
  ko: {
    jia:  { title:'갑(甲)', sub:'나무의 강한 면', kw:['리더','비전','결단력'], desc:'갑목은 타고난 리더예요. 확신을 갖고 앞으로 나아가며 쉽게 물러서지 않아요. 새로운 일을 시작하고 사람들을 이끌 때 가장 힘이 나요.' },
    yi:   { title:'을(乙)', sub:'나무의 부드러운 면', kw:['유연함','매력','끈기'], desc:'을목은 유연하고 사람 사이에서 빛나요. 장애물을 부드럽게 돌아가며 오래가는 관계를 쌓아요. 원하는 걸 결국 얻어내지만, 늘 직선으로 가지는 않아요.' },
    bing: { title:'병(丙)', sub:'불의 강한 면', kw:['카리스마','너그러움','낙관'], desc:'병화는 어디서든 분위기를 밝혀요. 에너지를 아낌없이 나누고, 곁에 있는 것만으로 사람들을 기분 좋게 만들어요. 그 따뜻함에 사람들이 자연스럽게 모여요.' },
    ding: { title:'정(丁)', sub:'불의 부드러운 면', kw:['직관','헌신','섬세함'], desc:'정화는 보기 드문 감정의 깊이를 가졌어요. 상대가 말하기 전에 마음을 알아채고, 아끼는 사람에게는 깊이 헌신해요.' },
    wu:   { title:'무(戊)', sub:'흙의 강한 면', kw:['믿음직함','인내','안정감'], desc:'무토는 다른 사람들이 기대는 사람이에요. 모두가 흔들릴 때도 침착함을 잃지 않아요. 사람들은 본능적으로 당신을 믿고, 그럴 만한 이유가 있어요.' },
    ji:   { title:'기(己)', sub:'흙의 부드러운 면', kw:['보살핌','꼼꼼함','실용성'], desc:'기토는 남들이 놓치는 것을 알아봐요. 세부를 챙기고 일이 실제로 굴러가게 만들어요. 조용한 기여가 모든 것을 단단히 붙잡아 줘요.' },
    geng: { title:'경(庚)', sub:'쇠의 강한 면', kw:['결단력','원칙','용기'], desc:'경금은 말과 행동이 같은 사람이에요. 신념이 분명하고, 불편한 상황에서도 그 신념대로 움직일 용기가 있어요.' },
    xin:  { title:'신(辛)', sub:'쇠의 부드러운 면', kw:['세련됨','안목','정교함'], desc:'신금은 기준이 높고 좋은 것을 알아보는 눈이 있어요. 남들이 지나치는 흠을 발견하고, 무엇이든 전보다 낫게 다듬는 재능이 있어요.' },
    ren:  { title:'임(壬)', sub:'물의 강한 면', kw:['전략','지성','수완'], desc:'임수는 생각이 빠르고 계획이 깊어요. 늘 몇 걸음 앞서 있고, 복잡한 상황도 능숙하게 헤쳐 나가요. 생각하는 힘이 가장 큰 자산이에요.' },
    gui:  { title:'계(癸)', sub:'물의 부드러운 면', kw:['공감','직관','깊이'], desc:'계수는 누구보다 깊이 느끼는 사람이에요. 감정을 읽는 능력이 뛰어나고, 직감이 거의 틀리지 않아요.' },
  },
  ja: {
    jia:  { title:'甲（きのえ）', sub:'木の力強い面', kw:['リーダー','ビジョン','決断力'], desc:'甲の人は生まれながらのリーダー。確信を持って前に進み、簡単には引きません。新しいことを始め、人を導くときに最も力を発揮します。' },
    yi:   { title:'乙（きのと）', sub:'木のしなやかな面', kw:['柔軟','魅力','粘り強さ'], desc:'乙の人は柔軟で、人付き合いの才能があります。障害をしなやかにかわし、長く続く関係を築きます。望むものは手に入れますが、いつもまっすぐな道とは限りません。' },
    bing: { title:'丙（ひのえ）', sub:'火の力強い面', kw:['カリスマ','寛大','楽観'], desc:'丙の人はその場を明るく照らします。惜しみなくエネルギーを分け、そばにいるだけで人を元気にします。その温かさに人が自然と集まります。' },
    ding: { title:'丁（ひのと）', sub:'火の繊細な面', kw:['直感','献身','洞察'], desc:'丁の人は珍しいほどの感情の深さを持っています。相手が口にする前に気持ちを察し、大切な人への誠実さは揺らぎません。' },
    wu:   { title:'戊（つちのえ）', sub:'土の力強い面', kw:['頼もしさ','忍耐','安定'], desc:'戊の人は周りが頼りにする存在。混乱の中でも落ち着きを失いません。人は本能的にあなたを信頼します。' },
    ji:   { title:'己（つちのと）', sub:'土のやわらかな面', kw:['思いやり','細やかさ','実用性'], desc:'己の人は他の人が見落とすことに気づきます。細部を整え、物事がきちんと回るようにします。その静かな貢献が全体を支えています。' },
    geng: { title:'庚（かのえ）', sub:'金の力強い面', kw:['決断','信念','勇気'], desc:'庚の人は言葉と行動が一致しています。強い信念と、居心地が悪くてもそれを貫く勇気があります。' },
    xin:  { title:'辛（かのと）', sub:'金の繊細な面', kw:['洗練','審美眼','精密さ'], desc:'辛の人は基準が高く、質を見抜く目を持っています。人が見逃す欠点に気づき、物事をより良く磨き上げる才能があります。' },
    ren:  { title:'壬（みずのえ）', sub:'水の力強い面', kw:['戦略','知性','機転'], desc:'壬の人は考えが速く、計画が深い。常に数歩先を読み、複雑な状況も軽やかに乗りこなします。頭脳が最大の武器です。' },
    gui:  { title:'癸（みずのと）', sub:'水の繊細な面', kw:['共感','直感','深み'], desc:'癸の人は誰よりも深く感じ取ります。感情を読む力が高く、直感はほとんど外れません。' },
  },
}

const EX_ELEMENTS_I18N: Record<'ko' | 'ja', Record<string, Item>> = {
  ko: {
    wood:  { title:'목(木)', sub:'나무', kw:['성장','야망','창의성'], desc:'목의 기운은 앞으로 나아가고 자라나는 힘이에요. 목표가 있을 때 움직이고, 새로운 도전에서 힘을 얻으며, 의미 있는 것을 만들어 갈 때 가장 빛나요.' },
    fire:  { title:'화(火)', sub:'불', kw:['열정','따뜻함','표현'], desc:'화의 기운은 연결과 표현의 힘이에요. 깊이 느끼고 힘 있게 전하며, 주변에 생기를 불어넣어요.' },
    earth: { title:'토(土)', sub:'흙', kw:['안정','신뢰','실용'], desc:'토의 기운은 중심을 잡아 주는 힘이에요. 사람들이 당신에게 기대요. 든든하고 믿음직하며, 생각을 실제 결과로 바꾸는 데 능해요.' },
    metal: { title:'금(金)', sub:'쇠', kw:['정확함','원칙','강인함'], desc:'금의 기운은 제대로 해내는 힘이에요. 타협하지 않는 원칙이 있고, 자신과 주변을 더 높은 수준으로 이끌어요.' },
    water: { title:'수(水)', sub:'물', kw:['지혜','흐름','깊이'], desc:'수의 기운은 이해하는 힘이에요. 사람과 상황을 잘 읽고 무엇에든 적응하며, 남들이 금방 알아채는 조용한 지혜를 지녔어요.' },
  },
  ja: {
    wood:  { title:'木（もく）', sub:'木', kw:['成長','向上心','創造性'], desc:'木の気は前へ進み、伸びていく力。目標があるときに動き出し、新しい挑戦から力を得て、意味あるものを築くときに最も輝きます。' },
    fire:  { title:'火（か）', sub:'火', kw:['情熱','温かさ','表現'], desc:'火の気はつながりと表現の力。深く感じ、力強く伝え、周りに活気をもたらします。' },
    earth: { title:'土（ど）', sub:'土', kw:['安定','信頼','実用'], desc:'土の気は軸を支える力。周りから頼りにされ、地に足がついていて、考えを確かな結果に変えるのが得意です。' },
    metal: { title:'金（ごん）', sub:'金', kw:['精確さ','信念','強さ'], desc:'金の気は物事を正しくやり遂げる力。譲れない原則があり、自分と周りをより高い水準へ導きます。' },
    water: { title:'水（すい）', sub:'水', kw:['知恵','流れ','深み'], desc:'水の気は理解する力。人や状況をよく読み、何にでも適応し、周りがすぐに気づく静かな知恵を持っています。' },
  },
}

const EX_PLANETS_I18N: Record<'ko' | 'ja', Record<string, Item>> = {
  ko: {
    sun:     { title:'태양', sub:'나의 본질', kw:['정체성','성격','생명력'], desc:'태양 별자리는 당신의 핵심을 보여줘요. 기본 성격과 타고난 강점, 세상에 내보내도록 태어난 에너지예요. 차트 전체의 토대가 돼요.' },
    moon:    { title:'달', sub:'나의 내면', kw:['감정','본능','안정감'], desc:'달 별자리는 속마음을 보여줘요. 안정감을 느끼려면 무엇이 필요한지, 감정적으로 어떻게 반응하는지, 아무도 보지 않을 때의 진짜 모습이 어떤지 알려줘요.' },
    asc:     { title:'상승궁', sub:'남들이 보는 나', kw:['외모','첫인상','겉모습'], desc:'상승궁은 당신이 주는 첫인상이에요. 당신을 잘 모르는 사람에게 비치는 모습, 분위기, 세상에 보여주는 얼굴이에요.' },
    mercury: { title:'수성', sub:'생각하고 말하는 방식', kw:['사고','소통','표현'], desc:'수성은 머리가 어떻게 돌아가는지 보여줘요. 소통하는 방식, 정보를 처리하는 방식, 생각을 표현하는 방식이에요.' },
    venus:   { title:'금성', sub:'내가 사랑하는 것', kw:['사랑','아름다움','가치관'], desc:'금성은 무엇에 끌리는지, 관계에서 어떻게 행동하는지 보여줘요. 취향과 가치관, 원하는 관계의 모습이 드러나요.' },
    mars:    { title:'화성', sub:'나를 움직이는 힘', kw:['추진력','행동','욕망'], desc:'화성은 당신의 엔진이에요. 어떻게 행동에 나서는지, 무엇을 좇는지, 무엇이 당신을 뜨겁게 만드는지 보여줘요.' },
    jupiter: { title:'목성', sub:'운이 따르는 곳', kw:['행운','성장','확장'], desc:'목성은 좋은 일이 자주 생기는 영역을 가리켜요. 가장 크게 성장하고, 기회가 자연스럽게 찾아오는 삶의 영역이에요.' },
    saturn:  { title:'토성', sub:'시련으로 성장하는 곳', kw:['절제','도전','숙련'], desc:'토성은 삶이 더 많은 것을 요구하는 곳이에요. 더 어렵고 느리지만, 그곳에서 쌓은 힘은 평생 당신의 것이 돼요.' },
    uranus:  { title:'천왕성', sub:'틀을 깨는 곳', kw:['자유','변화','혁신'], desc:'천왕성은 남들을 따르지 않는 영역이에요. 자유가 필요하고, 뜻밖의 일이 생기며, 변화가 당신을 앞으로 밀어내는 곳이에요.' },
    neptune: { title:'해왕성', sub:'꿈꾸는 곳', kw:['꿈','직관','영성'], desc:'해왕성은 가장 이상적이고 상상력이 풍부한 영역이에요. 직관과 창의성, 일상보다 큰 무언가에 대한 동경과 이어져 있어요.' },
    pluto:   { title:'명왕성', sub:'변화하는 곳', kw:['변화','힘','재탄생'], desc:'명왕성은 가장 깊은 변화가 일어나는 곳이에요. 느리고 강렬하지만, 그 변화는 오래 남아요. 그 영역은 예전과 같지 않게 돼요.' },
  },
  ja: {
    sun:     { title:'太陽', sub:'本当の自分', kw:['アイデンティティ','性格','生命力'], desc:'太陽星座はあなたの核を示します。基本的な性格、生まれ持った強み、世界に放つエネルギー。チャート全体の土台です。' },
    moon:    { title:'月', sub:'内面の世界', kw:['感情','本能','安心'], desc:'月星座は内側の気持ちを示します。安心するために何が必要か、感情的にどう反応するか、誰も見ていないときの本当の姿です。' },
    asc:     { title:'アセンダント', sub:'人から見たあなた', kw:['外見','第一印象','外の顔'], desc:'アセンダントはあなたの第一印象。あなたをよく知らない人にどう映るか、その雰囲気と世界に見せる顔です。' },
    mercury: { title:'水星', sub:'考え方・話し方', kw:['思考','コミュニケーション','表現'], desc:'水星は頭の働き方を示します。どう伝え、どう情報を処理し、どう考えを表現するか。思考と会話の星です。' },
    venus:   { title:'金星', sub:'愛するもの', kw:['愛','美','価値観'], desc:'金星は何に惹かれ、恋愛でどう振る舞うかを示します。好み、価値観、求めるつながりの形が表れます。' },
    mars:    { title:'火星', sub:'原動力', kw:['推進力','行動','欲求'], desc:'火星はあなたのエンジン。どう行動し、何を追い、何に燃えるかを示します。野心とエネルギーの源です。' },
    jupiter: { title:'木星', sub:'幸運が訪れる場所', kw:['幸運','成長','拡大'], desc:'木星は良いことが起こりやすい分野を示します。最も成長し、チャンスが自然と訪れる人生の領域です。' },
    saturn:  { title:'土星', sub:'試練で成長する場所', kw:['規律','挑戦','熟達'], desc:'土星は人生がより多くを求める場所。難しく時間もかかりますが、そこで得た強さは一生あなたのものです。' },
    uranus:  { title:'天王星', sub:'ルールを破る場所', kw:['自由','変化','革新'], desc:'天王星は周りに流されない領域。自由が必要で、思いがけないことが起き、変化があなたを前へ押し出す場所です。' },
    neptune: { title:'海王星', sub:'夢見る場所', kw:['夢','直感','スピリチュアリティ'], desc:'海王星は最も理想的で想像力豊かな領域。直感、創造性、日常を超えたものへの憧れとつながっています。' },
    pluto:   { title:'冥王星', sub:'変容する場所', kw:['変容','力','再生'], desc:'冥王星は最も深い変化が起きる場所。ゆっくりと強烈ですが、その変化は長く残ります。' },
  },
}

const EX_UI = {
  en: {
    back:'← Back', h1:'What It All Means', yours:'YOURS', loading:'Loading...',
    s1:'East (BaZi) Meets West (Astrology)', s2:'Day Stem', s3:'Elements', s4:'Planets',
    trio:[
      { t:'BaZi — The Eastern Blueprint', d:'BaZi reads the exact moment you were born — the year, month, day, and hour — and translates it into a map of your core personality, your natural strengths, and the energy patterns that shape your life. It has been used for over a thousand years to understand who a person truly is at their core.' },
      { t:'Western Astrology — The Celestial Map', d:'Western astrology looks at where the planets were in the sky the moment you were born. Each planet governs a different part of your life — your emotions, your relationships, your ambitions, your fears. Together they paint a picture of how you experience the world around you.' },
      { t:'What Happens When You Combine Them', d:'BaZi tells you who you are. Western astrology tells you how you experience life. Used together, they cover each other\'s blind spots and give you a deeper reading than either system alone. That is exactly what AstroPillar does.', highlight:true },
    ],
    stemIntro:'Your Day Stem is determined by the exact day you were born. In BaZi, it represents your core identity — the person you are at your most fundamental level. It is the single most important element in your entire birth chart.',
    whyTitle:'Why your Day Stem and dominant element might be different',
    why:['Your Day Stem is determined by the day you were born. It shows your core personality.','Your dominant element is calculated from your entire birth chart — year, month, day, and hour combined. It shows the overall energy that shapes how your life unfolds.','They are measuring two different things.'],
    relTitle:'How the Five Elements Relate', nourish:'Nourishes', restrain:'Restrains',
    cycles:[
      { t:'Nourishing Cycle — each element feeds the next', items:['Wood feeds Fire — like fuel to a flame','Fire creates Earth — ash becomes rich soil','Earth produces Metal — ore forms deep in the ground','Metal collects Water — cold metal draws moisture','Water nourishes Wood — roots drink deep'] },
      { t:'Restraining Cycle — each element keeps another in check', items:['Wood breaks Earth — roots split through soil','Earth absorbs Water — ground soaks up the flood','Water extinguishes Fire — flood kills the flame','Fire melts Metal — heat destroys the blade','Metal cuts Wood — an axe fells the tree'] },
    ],
    elName:{ wood:'Wood', fire:'Fire', earth:'Earth', metal:'Metal', water:'Water' } as Record<string,string>,
  },
  ko: {
    back:'← 메뉴로', h1:'내 차트 읽는 법', yours:'나', loading:'불러오는 중...',
    s1:'동양(사주)과 서양(점성술)의 만남', s2:'일간', s3:'오행', s4:'행성',
    trio:[
      { t:'사주 — 동양의 설계도', d:'사주는 태어난 해·월·일·시, 네 기둥으로 당신의 타고난 성격과 강점, 삶을 움직이는 기운의 흐름을 읽어요. 천 년 넘게 한 사람의 본모습을 이해하는 데 쓰여 왔어요.' },
      { t:'서양 점성술 — 하늘의 지도', d:'서양 점성술은 태어난 순간 행성들이 하늘 어디에 있었는지를 봐요. 각 행성은 감정, 관계, 야망, 두려움처럼 삶의 서로 다른 영역을 맡고 있고, 함께 모여 당신이 세상을 경험하는 방식을 그려내요.' },
      { t:'둘을 함께 보면', d:'사주는 당신이 어떤 사람인지 알려주고, 점성술은 당신이 삶을 어떻게 겪는지 알려줘요. 함께 보면 서로의 빈틈을 채워, 한쪽만 볼 때보다 깊이 있는 해석이 나와요. AstroPillar가 하는 일이 바로 이거예요.', highlight:true },
    ],
    stemIntro:'일간은 태어난 날로 정해져요. 사주에서 당신의 본질, 가장 근본적인 모습을 나타내며 사주 전체에서 가장 중요한 글자예요.',
    whyTitle:'일간과 가장 강한 오행이 다를 수 있는 이유',
    why:['일간은 태어난 날로 정해지고, 핵심 성격을 보여줘요.','가장 강한 오행은 연·월·일·시 전체를 합쳐 계산해요. 삶이 펼쳐지는 전반적인 기운을 보여줘요.','둘은 서로 다른 것을 재는 거예요.'],
    relTitle:'오행은 서로 어떻게 작용할까', nourish:'상생', restrain:'상극',
    cycles:[
      { t:'상생 — 서로 살려 주는 흐름', items:['목생화 — 나무는 불의 땔감이 돼요','화생토 — 타고 난 재는 기름진 흙이 돼요','토생금 — 땅속 깊은 곳에서 광석이 생겨요','금생수 — 차가운 쇠에 물방울이 맺혀요','수생목 — 물이 나무뿌리를 적셔요'] },
      { t:'상극 — 서로 견제하는 흐름', items:['목극토 — 뿌리가 흙을 뚫고 들어가요','토극수 — 땅이 물을 막고 흡수해요','수극화 — 물이 불을 꺼요','화극금 — 불이 쇠를 녹여요','금극목 — 도끼가 나무를 베어요'] },
    ],
    elName:{ wood:'목', fire:'화', earth:'토', metal:'금', water:'수' } as Record<string,string>,
  },
  ja: {
    back:'← メニューへ', h1:'チャートの読み方', yours:'あなた', loading:'読み込み中...',
    s1:'東洋（四柱推命）と西洋（占星術）の出会い', s2:'日干', s3:'五行', s4:'惑星',
    trio:[
      { t:'四柱推命 — 東洋の設計図', d:'四柱推命は生まれた年・月・日・時の四つの柱から、あなたの本質的な性格や強み、人生を動かすエネルギーの流れを読み解きます。千年以上にわたり、人の本当の姿を知るために使われてきました。' },
      { t:'西洋占星術 — 天空の地図', d:'西洋占星術は、生まれた瞬間に惑星が空のどこにあったかを見ます。それぞれの惑星は感情、人間関係、野心、不安など人生の異なる領域を司り、あわせてあなたが世界をどう経験するかを描き出します。' },
      { t:'二つを合わせると', d:'四柱推命はあなたが誰なのかを、占星術はあなたが人生をどう経験するのかを教えてくれます。合わせて見ることで互いの死角を補い、どちらか一方だけよりも深い読み解きになります。それがAstroPillarです。', highlight:true },
    ],
    stemIntro:'日干は生まれた日で決まります。四柱推命ではあなたの本質、最も根本的な姿を表し、命式全体で最も重要な一字です。',
    whyTitle:'日干と最も強い五行が違うことがある理由',
    why:['日干は生まれた日で決まり、核となる性格を示します。','最も強い五行は年・月・日・時のすべてを合わせて計算します。人生の展開を形づくる全体のエネルギーを示します。','二つは別のものを測っているのです。'],
    relTitle:'五行の関係', nourish:'相生', restrain:'相克',
    cycles:[
      { t:'相生 — 互いを生かす流れ', items:['木生火 — 木は火の燃料になる','火生土 — 燃えた灰は豊かな土になる','土生金 — 地中深くで鉱石が生まれる','金生水 — 冷たい金属に水滴が宿る','水生木 — 水が木の根を潤す'] },
      { t:'相克 — 互いを抑える流れ', items:['木剋土 — 根が土を突き破る','土剋水 — 土が水をせき止め吸い込む','水剋火 — 水が火を消す','火剋金 — 火が金属を溶かす','金剋木 — 斧が木を切り倒す'] },
    ],
    elName:{ wood:'木', fire:'火', earth:'土', metal:'金', water:'水' } as Record<string,string>,
  },
}


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
  { key:'wood',  hanja:'木', color:EL_COLOR.wood, name:'Wood',  kw:['Growth','Ambition','Creativity'],
    desc:'Wood energy is about moving forward and growing. You are driven by goals, energized by new challenges, and at your best when you are building something meaningful.' },
  { key:'fire',  hanja:'火', color:EL_COLOR.fire, name:'Fire',  kw:['Passion','Warmth','Expression'],
    desc:'Fire energy is about connection and expression. You feel things deeply, communicate powerfully, and bring life to everything around you.' },
  { key:'earth', hanja:'土', color:EL_COLOR.earth, name:'Earth', kw:['Stability','Trust','Practicality'],
    desc:'Earth energy is about being the steady one. People rely on you. You are grounded, dependable, and good at turning ideas into real results.' },
  { key:'metal', hanja:'金', color:EL_COLOR.metal, name:'Metal', kw:['Precision','Integrity','Strength'],
    desc:'Metal energy is about doing things right. You have principles you do not compromise on, and you push yourself and others toward excellence.' },
  { key:'water', hanja:'水', color:EL_COLOR.water, name:'Water', kw:['Wisdom','Flow','Depth'],
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

function InnerItem({ id, symEl, title, sub, kws, desc, isYours, isPlanet, yoursLabel }: {
  id: string; symEl: React.ReactNode; title: string; sub: string
  kws: string[]; desc: string; isYours: boolean; isPlanet: boolean; yoursLabel: string
}) {
  const [open, setOpen] = useState(isYours)
  const goldColor = isPlanet ? PLANET_COLOR : '#c9a84c'
  return (
    <div className="ex-item" style={{ border:`1px solid ${isYours ? goldColor : 'var(--line)'}`, borderRadius:14, overflow:'hidden', background:'rgba(17,22,40,0.6)', alignSelf:'start' }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', cursor:'pointer', background:'transparent', border:0, color:'inherit', font:'inherit', textAlign:'left', minHeight:60 }}>
        {symEl}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'var(--ink)', fontSize:15, fontWeight:600 }}>{title}</p>
          <p style={{ color:'var(--ink-2)', fontSize:13, marginTop:2 }}>{sub}</p>
        </div>
        {isYours && (
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:11, fontWeight:700, letterSpacing:1.5, color:goldColor, border:`1px solid ${goldColor}60`, padding:'2px 8px', borderRadius:999, flexShrink:0 }}>
            {yoursLabel}
          </span>
        )}
        <span className="material-icons" aria-hidden="true" style={{ fontSize:20, color:'var(--ink-3)', transform:open?'rotate(180deg)':'none', transition:'transform 0.22s', flexShrink:0 }}>expand_more</span>
      </button>
      {open && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--line)' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, paddingTop:12, marginBottom:10 }}>
            {kws.map(k => (
              <span key={k} style={{ fontSize:12.5, fontWeight:500, color:goldColor, border:`1px solid ${goldColor}40`, borderRadius:20, padding:'2px 10px' }}>{k}</span>
            ))}
          </div>
          <p style={{ fontSize:14.5, lineHeight:1.85, color:'var(--ink-2)' }}>{desc}</p>
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
    <section id={id} className="ap-glass" style={{ marginBottom:14, overflow:'hidden', borderRadius:20 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 22px', cursor:'pointer', background:'transparent', border:0, color:'inherit', textAlign:'left', minHeight:64 }}>
        <span style={{ fontSize:19, fontWeight:600, color:'var(--gold-light)' }}>{title}</span>
        <span className="material-icons" aria-hidden="true" style={{ fontSize:24, color:'var(--gold)', transform:open?'rotate(180deg)':'none', transition:'transform 0.25s', flexShrink:0, marginLeft:10 }}>expand_more</span>
      </button>
      {open && (
        <div style={{ borderTop:'1px solid var(--line)', paddingBottom:4 }}>
          {children}
        </div>
      )}
    </section>
  )
}

function WuxingCanvas({ userElement, names, youLabel }: { userElement: string; names: Record<string,string>; youLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = 100, nr = 26
    const els = [
      { name:'Wood', hanja:'木', color:EL_COLOR.wood },
      { name:'Fire', hanja:'火', color:EL_COLOR.fire },
      { name:'Earth', hanja:'土', color:EL_COLOR.earth },
      { name:'Metal', hanja:'金', color:EL_COLOR.metal },
      { name:'Water', hanja:'水', color:EL_COLOR.water },
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
      ctx!.beginPath(); ctx!.setLineDash(dashed?[5,4]:[]); ctx!.strokeStyle=color; ctx!.lineWidth=1; ctx!.globalAlpha=1
      ctx!.moveTo(sx,sy); ctx!.lineTo(ex,ey); ctx!.stroke()
      ctx!.globalAlpha=1; ctx!.setLineDash([]); ctx!.beginPath(); ctx!.fillStyle=color; ctx!.save()
      ctx!.translate(ex,ey); ctx!.rotate(a); ctx!.moveTo(0,0); ctx!.lineTo(-7,3.5); ctx!.lineTo(-7,-3.5)
      ctx!.closePath(); ctx!.fill(); ctx!.restore(); ctx!.globalAlpha=1
    }
    ctx.clearRect(0,0,W,H)
    ctx.beginPath(); pos.forEach((p,i)=>{ i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y) }); ctx.closePath()
    ctx.strokeStyle='rgba(201,168,76,0.12)'; ctx.lineWidth=1; ctx.setLineDash([3,4]); ctx.stroke(); ctx.setLineDash([])
    ;[0,1,2,3,4].forEach(i=>drawArrow(i,(i+1)%5,'rgba(201,168,76,0.6)',false))
    ;[[0,2],[2,4],[4,1],[1,3],[3,0]].forEach(p=>drawArrow(p[0],p[1],'rgba(184,189,205,0.35)',true))
    els.forEach((el,i) => {
      const p = pos[i]
      const isYours = userElement && userElement===el.name.toLowerCase()
      const SANS = "'Pretendard Variable', Pretendard, 'Pretendard JP Variable', system-ui, sans-serif"
      ctx.beginPath(); ctx.arc(p.x,p.y,nr,0,Math.PI*2); ctx.fillStyle='#0e1328'; ctx.fill()
      ctx.strokeStyle=el.color; ctx.lineWidth=1.2; ctx.stroke()
      if (isYours) { ctx.beginPath(); ctx.arc(p.x,p.y,nr+5,0,Math.PI*2); ctx.strokeStyle='rgba(230,205,133,0.7)'; ctx.lineWidth=1; ctx.stroke() }
      ctx.fillStyle=el.color; ctx.font='400 18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'
      ctx.fillText(el.hanja,p.x,p.y-4)
      ctx.fillStyle='rgba(241,237,228,0.6)'; ctx.font=`500 10px ${SANS}`; ctx.fillText(names[el.name.toLowerCase()] ?? el.name,p.x,p.y+11)
      if (isYours) { ctx.fillStyle='#e6cd85'; ctx.font=`600 10px ${SANS}`; ctx.fillText(youLabel,p.x,p.y+nr+15) }
    })
  }, [userElement, names, youLabel])
  return <canvas ref={canvasRef} width={300} height={300} style={{ display:'block', width:'100%', maxWidth:300, height:'auto', margin:'0 auto 6px' }} />
}

function ExplainPageInner() {
  const searchParams = useSearchParams()
  const locale = useLocale()
  const L = (locale === 'ko' || locale === 'ja') ? locale : 'en'
  const ui = EX_UI[L]
  const prefix = locale === 'en' ? '' : `/${locale}`
  const userStem = searchParams.get('day_gan')?.toLowerCase().trim() ?? ''
  const userElement = searchParams.get('element')?.toLowerCase().trim() ?? ''
  const userSun = searchParams.get('sun')?.toLowerCase().trim() ?? ''

  const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1)
  const parts: string[] = []
  if (L === 'en') {
    if (userStem) parts.push(cap(userStem))
    if (userElement) parts.push(cap(userElement))
    if (userSun) parts.push(cap(userSun))
  } else {
    if (userStem) parts.push(EX_STEMS_I18N[L][userStem]?.title ?? cap(userStem))
    if (userElement) parts.push(EX_ELEMENTS_I18N[L][userElement]?.title ?? cap(userElement))
    if (userSun) parts.push(zodiacSignName(cap(userSun), locale))
  }

  return (
    <main className="ap-page ex">
      {/* Header */}
      <div className="ap-container ex-head">
        <Link href={`${prefix}/menu`} className="ap-btn-ghost ap-btn-sm" style={{ marginBottom:18 }}>{ui.back}</Link>
        <h1 className="ap-h1 ap-gold-text">{ui.h1}</h1>
        {parts.length > 0 && (
          <p className="ap-lead" style={{ marginTop:8 }}>{parts.join(' · ')}</p>
        )}
      </div>

      <div className="ap-container" style={{ paddingTop:24 }}>

        {/* SECTION 1: East Meets West */}
        <MainSection id="about" title={ui.s1}>
          <div className="ex-trio" style={{ padding:16 }}>
            {ui.trio.map((b,i) => (
              <div key={i} style={{ background: 'rgba(17,22,40,0.6)', border:`1px solid ${'highlight' in b && b.highlight?'var(--gold-line)':'var(--line)'}`, borderRadius:14, padding:'20px 18px' }}>
                <p style={{ fontSize:17, fontWeight:600, color:'var(--gold-light)', marginBottom:10 }}>{b.t}</p>
                <p style={{ fontSize:14.5, lineHeight:1.85, color:'var(--ink-2)' }}>{b.d}</p>
              </div>
            ))}
          </div>
        </MainSection>

        {/* SECTION 2: Day Stem */}
        <MainSection id="stem" title={ui.s2} defaultOpen={!!userStem}>
          <div style={{ margin:'16px 16px 14px', background:'rgba(201,168,76,0.07)', border:'1px solid var(--gold-line)', borderRadius:14, padding:'16px 18px', fontSize:14.5, lineHeight:1.85, color:'var(--ink-2)', maxWidth:'72ch' }}>
            {ui.stemIntro}
          </div>
          <div className="ex-grid">
            {STEMS.map(s => (
              <InnerItem
                key={s.key} id={`stem-${s.key}`}
                symEl={<div className="ex-sym" style={{ color: EL_COLOR[STEM_EL[s.key]], borderColor: `${EL_COLOR[STEM_EL[s.key]]}55` }}>{s.hanja}</div>}
                title={L === 'en' ? `${s.name} (${s.hanja})` : EX_STEMS_I18N[L][s.key].title!}
                sub={L === 'en' ? s.sub : EX_STEMS_I18N[L][s.key].sub}
                kws={L === 'en' ? s.kw : EX_STEMS_I18N[L][s.key].kw}
                desc={L === 'en' ? s.desc : EX_STEMS_I18N[L][s.key].desc}
                isYours={!!userStem && userStem===s.key} isPlanet={false} yoursLabel={ui.yours}
              />
            ))}
          </div>
        </MainSection>

        {/* SECTION 3: Elements */}
        <MainSection id="element" title={ui.s3} defaultOpen={!!userElement}>
          <div style={{ margin:'16px 16px 14px', background:'rgba(201,168,76,0.07)', border:'1px solid var(--gold-line)', borderRadius:14, padding:'16px 18px', fontSize:14.5, lineHeight:1.85, color:'var(--ink-2)', maxWidth:'72ch' }}>
            <strong style={{ color:'var(--gold-light)', fontStyle:'normal', fontSize:16, fontWeight:600, display:'block', marginBottom:8 }}>{ui.whyTitle}</strong>
            {ui.why.map((w, i) => <p key={i} style={{ marginTop: i ? 10 : 0 }}>{w}</p>)}
          </div>
          <div className="ex-grid" style={{ paddingBottom:0 }}>
            {ELEMENTS.map(e => (
              <InnerItem
                key={e.key} id={`el-${e.key}`}
                symEl={<div className="ex-sym" style={{ color:e.color, borderColor:`${e.color}55` }}>{e.hanja}</div>}
                title={L === 'en' ? e.name : EX_ELEMENTS_I18N[L][e.key].title!}
                sub={L === 'en' ? e.hanja : EX_ELEMENTS_I18N[L][e.key].sub}
                kws={L === 'en' ? e.kw : EX_ELEMENTS_I18N[L][e.key].kw}
                desc={L === 'en' ? e.desc : EX_ELEMENTS_I18N[L][e.key].desc}
                isYours={!!userElement && userElement===e.key} isPlanet={false} yoursLabel={ui.yours}
              />
            ))}
          </div>
          <p style={{ fontSize:16, fontWeight:600, color:'var(--ink)', margin:'24px 16px 12px', display:'flex', alignItems:'center', gap:12 }}>
            {ui.relTitle}
            <span style={{ flex:1, height:1, background:'rgba(201,168,76,0.2)', display:'inline-block' }} />
          </p>
          <WuxingCanvas userElement={userElement} names={ui.elName} youLabel={L === 'ko' ? '나' : L === 'ja' ? 'あなた' : 'You'} />
          <div style={{ display:'flex', gap:14, justifyContent:'center', marginBottom:16 }}>
            {[{dashed:false,label:ui.nourish},{dashed:true,label:ui.restrain}].map(l=>(
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--ink-2)' }}>
                <div style={{ width:18, height:0, borderTop: l.dashed ? '1px dashed rgba(184,189,205,0.7)' : '1px solid rgba(201,168,76,0.8)' }} />{l.label}
              </div>
            ))}
          </div>
          <div className="ex-cycles">
            {ui.cycles.map((c, ci) => ({ ...c, color: ci === 0 ? '#d9c48c' : '#b8bdcd' })).map(c=>(
              <div key={c.t} style={{ background:'rgba(17,22,40,0.6)', border:'1px solid var(--line)', borderRadius:14, padding:'16px 18px' }}>
                <p style={{ fontSize:15, fontWeight:600, color:c.color, marginBottom:10 }}>{c.t}</p>
                {c.items.map((it,i) => {
                  const [bold, ...rest] = it.split(' — ')
                  return (
                    <p key={i} style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7, padding:'5px 0' }}>
                      <span style={{ color:'var(--ink)', fontWeight:600 }}>{bold}</span>{rest.length?' — '+rest.join(' — '):''}
                    </p>
                  )
                })}
              </div>
            ))}
          </div>
        </MainSection>

        {/* SECTION 4: Planets */}
        <MainSection id="planet" title={ui.s4} defaultOpen={!!userSun}>
          <div className="ex-grid" style={{ paddingTop:16 }}>
            {PLANETS.map(p => (
              <InnerItem
                key={p.key} id={`pl-${p.key}`}
                symEl={<div className="ex-sym" style={{ color:PLANET_COLOR, borderColor:'rgba(170,165,209,0.35)', fontSize:15 }}>{p.sym}{'\uFE0E'}</div>}
                title={L === 'en' ? p.name : EX_PLANETS_I18N[L][p.key].title!}
                sub={L === 'en' ? p.sub : EX_PLANETS_I18N[L][p.key].sub}
                kws={L === 'en' ? p.kw : EX_PLANETS_I18N[L][p.key].kw}
                desc={L === 'en' ? p.desc : EX_PLANETS_I18N[L][p.key].desc}
                isYours={p.key==='sun' && !!userSun} isPlanet={true} yoursLabel={ui.yours}
              />
            ))}
          </div>
        </MainSection>

      </div>
      <style>{`
        .ex-head { padding-top: 24px; }
        .ex-sym { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; font-size: 17px; font-weight: 400; line-height: 1;
          background: rgba(9,12,26,.6); border: 1px solid var(--line); }
        .ex-trio { display:grid; grid-template-columns: 1fr; gap: 12px; }
        .ex-grid { display:grid; grid-template-columns: 1fr; gap: 8px; padding: 0 16px 16px; }
        .ex-cycles { display:grid; grid-template-columns: 1fr; gap: 10px; padding: 0 16px 16px; }
        @media (min-width: 768px) {
          .ex-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .ex-cycles { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1024px) {
          .ex-head { padding-top: 48px; }
          .ex-trio { grid-template-columns: repeat(3, 1fr); }
          .ex-grid { grid-template-columns: repeat(3, 1fr); padding: 0 22px 22px; }
        }
      `}</style>
    </main>
  )
}

export default function ExplainPage() {
  return (
    <Suspense fallback={
      <main className="ap-page" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'var(--gold)', fontFamily:"'Cormorant Garamond',serif", fontSize:18 }}>Loading...</p>
      </main>
    }>
      <ExplainPageInner />
    </Suspense>
  )
}
