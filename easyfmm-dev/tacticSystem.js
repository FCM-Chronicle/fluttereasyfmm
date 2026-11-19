// c:\Users\jinuj\vsc\easyfmm\tacticSystem.js

// [전역 설정] 기본 롤(Role) 설정
if (!gameData.lineRoles) {
    gameData.lineRoles = {
        attack: 'AF',
        midfield: 'BBM',
        defense: 'BPD'
    };
}

// [개선] 전 클럽(194개) 및 국가대표팀(54개) 홈/어웨이 유니폼 컬러 데이터
const TeamColors = {
    // ================= Premier League (20) =================
    "아스널": { home: ["#ef0107", "#ffffff"], away: "#111827" },
    "아스톤_빌라": { home: ["#670e36", "#95bfe5"], away: "#ffffff" },
    "본머스": { home: ["#da291c", "#000000"], away: "#38bdf8" },
    "브렌트포드": { home: ["#e30613", "#ffffff"], away: "#1e293b" },
    "브라이튼": { home: ["#0057b8", "#ffffff"], away: "#fde047" },
    "첼시": { home: "#034694", away: "#f8fafc" },
    "코번트리_시티": { home: ["#6cabdd", "#ffffff"], away: "#1e1b4b" },
    "크리스탈_팰리스": { home: ["#1b458f", "#c4122e"], away: "#facc15" },
    "에버턴": { home: "#003399", away: "#111827" },
    "풀럼": { home: "#ffffff", away: "#111827" },
    "헐_시티": { home: ["#f5a12d", "#000000"], away: "#ffffff" },
    "입스위치": { home: "#0057b8", away: "#111827" },
    "리즈_유나이티드": { home: "#ffffff", away: "#1d4ed8" },
    "리버풀": { home: "#c8102e", away: "#f8fafc" },
    "맨체스터_유나이티드": { home: "#da291c", away: "#1e293b" },
    "맨체스터_시티": { home: "#6cabdd", away: "#1e1b4b" },
    "뉴캐슬_유나이티드": { home: ["#000000", "#ffffff"], away: "#065f46" },
    "노팅엄_포레스트": { home: "#dd0000", away: "#ffffff" },
    "토트넘_홋스퍼": { home: "#ffffff", away: "#132257" },
    "선덜랜드": { home: ["#eb172b", "#ffffff"], away: "#1e293b" },

    // ================= EFL Championship (24) =================
    "버밍엄_시티": { home: "#0000ff", away: "#ffffff" },
    "블랙번_로버스": { home: ["#009ee0", "#ffffff"], away: "#111827" },
    "볼턴_원더러스": { home: "#ffffff", away: "#1e293b" },
    "브리스톨_시티": { home: "#e21a23", away: "#ffffff" },
    "번리": { home: ["#6c1d45", "#99d6ea"], away: "#facc15" },
    "카디프_시티": { home: "#0070b5", away: "#111827" },
    "찰턴_애슬레틱": { home: "#d4021d", away: "#111827" },
    "더비_카운티": { home: "#ffffff", away: "#111827" },
    "링컨_시티": { home: ["#d71920", "#ffffff"], away: "#1e293b" },
    "미들즈브러": { home: "#e11b22", away: "#1e293b" },
    "밀월": { home: "#001d5e", away: "#ffffff" },
    "노리치_시티": { home: ["#fff200", "#00a650"], away: "#111827" },
    "포츠머스": { home: "#001489", away: "#ffffff" },
    "프레스턴_노스_엔드": { home: "#ffffff", away: "#1e3a8a" },
    "퀸즈_파크_레인저스": { home: ["#1d5ba4", "#ffffff"], away: "#dc2626" },
    "셰필드_유나이티드": { home: ["#ee2737", "#ffffff"], away: "#111827" },
    "사우샘프턴": { home: ["#d71920", "#ffffff"], away: "#fde047" },
    "스토크_시티": { home: ["#e03a3e", "#ffffff"], away: "#111827" },
    "스완지_시티": { home: "#ffffff", away: "#1e293b" },
    "왓퍼드": { home: ["#fbee23", "#000000"], away: "#dc2626" },
    "웨스트브롬위치": { home: ["#122f67", "#ffffff"], away: "#fde047" },
    "웨스트햄_유나이티드": { home: ["#7a263a", "#1bb1e7"], away: "#ffffff" },
    "울버햄튼": { home: ["#fdb913", "#000000"], away: "#111827" },
    "렉섬": { home: "#e41b17", away: "#ffffff" },

    // ================= La Liga (20) =================
    "아틀레틱_클루브": { home: ["#ee2523", "#ffffff"], away: "#1e293b" },
    "아틀레티코_마드리드": { home: ["#cb3524", "#ffffff"], away: "#1e293b" },
    "오사수나": { home: "#d91a21", away: "#1e3a8a" },
    "셀타_비고": { home: "#8ac3ee", away: "#1e293b" },
    "알라베스": { home: ["#0033a0", "#ffffff"], away: "#111827" },
    "엘체": { home: ["#ffffff", "#00843d"], away: "#111827" },
    "바르셀로나": { home: ["#a50044", "#004170"], away: "#111827" },
    "헤타페": { home: "#005999", away: "#dc2626" },
    "레반테": { home: ["#004d98", "#a50044"], away: "#ffffff" },
    "말라가": { home: ["#0072ce", "#ffffff"], away: "#111827" },
    "라싱_클루브": { home: ["#ffffff", "#00843d"], away: "#111827" },
    "라요_바예카노": { home: ["#ffffff", "#e53935"], away: "#111827" },
    "데포르티보": { home: ["#004b93", "#ffffff"], away: "#111827" },
    "에스파뇰": { home: ["#007fc8", "#ffffff"], away: "#dc2626" },
    "레알_베티스": { home: ["#0bb363", "#ffffff"], away: "#111827" },
    "레알_마드리드": { home: "#ffffff", away: "#f97316" },
    "레알_소시에다드": { home: ["#0067b1", "#ffffff"], away: "#111827" },
    "세비야": { home: "#ffffff", away: "#d71920" },
    "발렌시아": { home: "#ffffff", away: "#111827" },
    "비야레알": { home: "#ffe667", away: "#7f1d1d" },

    // ================= Bundesliga (18) =================
    "FC_쾰른": { home: ["#ffffff", "#ed1c24"], away: "#dc2626" },
    "마인츠": { home: "#c3141e", away: "#ffffff" },
    "도르트문트": { home: ["#fde100", "#000000"], away: "#111827" },
    "아우크스부르크": { home: ["#ffffff", "#ba3733"], away: "#111827" },
    "바이에른_뮌헨": { home: "#dc052d", away: "#ffffff" },
    "샬케_04": { home: "#004d9d", away: "#ffffff" },
    "프랑크푸르트": { home: ["#e1000f", "#000000"], away: "#ffffff" },
    "함부르크": { home: "#ffffff", away: "#005ca9" },
    "레버쿠젠": { home: ["#e32221", "#000000"], away: "#ffffff" },
    "묀헨글라트바흐": { home: "#ffffff", away: "#166534" },
    "라이프치히": { home: ["#ffffff", "#dd0741"], away: "#1e293b" },
    "프라이부르크": { home: ["#ed1c24", "#000000"], away: "#ffffff" },
    "파더보른": { home: ["#005ca9", "#000000"], away: "#ffffff" },
    "엘버스베르크": { home: "#ffffff", away: "#111827" },
    "베르더_브레멘": { home: "#1d9053", away: "#ffffff" },
    "호펜하임": { home: "#1c63b7", away: "#ffffff" },
    "우니온_베를린": { home: "#eb1923", away: "#ffffff" },
    "슈투트가르트": { home: ["#ffffff", "#e32219"], away: "#dc2626" },

    // ================= Serie A (20) =================
    "AS_로마": { home: ["#8e1f2f", "#f0bc42"], away: "#ffffff" },
    "아탈란타": { home: ["#1e71b8", "#000000"], away: "#ffffff" },
    "볼로냐": { home: ["#a21c26", "#1a2f48"], away: "#ffffff" },
    "칼리아리": { home: ["#a21c26", "#002350"], away: "#ffffff" },
    "코모": { home: "#0056a3", away: "#ffffff" },
    "피오렌티나": { home: "#482e92", away: "#ffffff" },
    "프로시노네": { home: ["#ffed00", "#0055a4"], away: "#ffffff" },
    "제노아": { home: ["#ad172b", "#002c5f"], away: "#ffffff" },
    "유벤투스": { home: ["#ffffff", "#000000"], away: "#fde047" },
    "라치오": { home: "#87d8f7", away: "#1e293b" },
    "레체": { home: ["#ffed00", "#e30613"], away: "#ffffff" },
    "인터_밀란": { home: ["#010e80", "#000000"], away: "#ffffff" },
    "AC_밀란": { home: ["#fb090b", "#000000"], away: "#ffffff" },
    "몬차": { home: "#e30613", away: "#ffffff" },
    "파르마": { home: ["#ffffff", "#000000"], away: "#fde047" },
    "사수올로": { home: ["#00a752", "#000000"], away: "#ffffff" },
    "나폴리": { home: "#12a0d7", away: "#1e293b" },
    "토리노": { home: "#8a1e03", away: "#ffffff" },
    "우디네세": { home: ["#ffffff", "#000000"], away: "#1e293b" },
    "베네치아": { home: ["#000000", "#ff6a00"], away: "#ffffff" },

    // ================= Ligue 1 (18) =================
    "오세르": { home: "#ffffff", away: "#1d4ed8" },
    "앙제": { home: ["#000000", "#ffffff"], away: "#ffffff" },
    "모나코": { home: ["#e51b22", "#ffffff"], away: "#111827" },
    "트루아": { home: "#0055a4", away: "#ffffff" },
    "로리앙": { home: ["#f58220", "#000000"], away: "#ffffff" },
    "르아브르": { home: "#87ceeb", away: "#1e3a8a" },
    "르망": { home: ["#e30613", "#facc15"], away: "#ffffff" },
    "릴": { home: "#e01e13", away: "#ffffff" },
    "니스": { home: ["#cc0000", "#000000"], away: "#ffffff" },
    "리옹": { home: "#ffffff", away: "#1d4ed8" },
    "올랭피크_드_마르세유": { home: "#2faee0", away: "#1e293b" },
    "파리_FC": { home: "#1b3f8b", away: "#ffffff" },
    "파리_생제르맹": { home: ["#004170", "#da291c"], away: "#ffffff" },
    "랑스": { home: ["#ffd700", "#e30613"], away: "#111827" },
    "브레스트": { home: "#e30613", away: "#ffffff" },
    "렌": { home: ["#e30613", "#000000"], away: "#ffffff" },
    "스트라스부르": { home: "#009fe3", away: "#ffffff" },
    "툴루즈": { home: "#5d2e8c", away: "#ffffff" },

    // ================= Eredivisie (18) =================
    "덴하흐": { home: ["#00843d", "#ffd100"], away: "#111827" },
    "아약스": { home: ["#ffffff", "#d2122e"], away: "#1e293b" },
    "AZ_알크마르": { home: "#db0029", away: "#111827" },
    "엑셀시오르": { home: ["#d50000", "#000000"], away: "#ffffff" },
    "흐로닝언": { home: ["#009944", "#ffffff"], away: "#111827" },
    "트벤테": { home: "#e30613", away: "#1e293b" },
    "위트레흐트": { home: "#e30613", away: "#ffffff" },
    "페예노르트": { home: ["#ee1c25", "#ffffff"], away: "#111827" },
    "포르투나_시타르트": { home: ["#ffdd00", "#009944"], away: "#111827" },
    "고_어헤드_이글스": { home: ["#e30613", "#ffdd00"], away: "#ffffff" },
    "NEC_네이메헌": { home: ["#e30613", "#00843d"], away: "#ffffff" },
    "PEC_즈볼레": { home: ["#0066b3", "#ffffff"], away: "#111827" },
    "PSV_에인트호번": { home: ["#ed1c24", "#ffffff"], away: "#1e293b" },
    "캄뷔르": { home: ["#ffd700", "#0055a4"], away: "#111827" },
    "헤이렌베인": { home: ["#0055a4", "#ffffff"], away: "#111827" },
    "텔스타": { home: "#ffffff", away: "#1e293b" },
    "스파르타_로테르담": { home: ["#d71920", "#ffffff"], away: "#111827" },
    "빌럼_II": { home: ["#e30613", "#0055a4"], away: "#111827" },

    // ================= Liga Portugal (18) =================
    "비제우": { home: ["#111827", "#ffffff"], away: "#fde047" },
    "아로카": { home: "#ffdd00", away: "#1e3a8a" },
    "카사_피아": { home: "#111827", away: "#ffffff" },
    "에스토릴": { home: "#ffdd00", away: "#1e3a8a" },
    "에스트렐라": { home: ["#ffffff", "#00843d"], away: "#111827" },
    "알베르카": { home: "#0055a4", away: "#ffffff" },
    "파말리캉": { home: "#003399", away: "#ffffff" },
    "FC_포르투": { home: ["#003893", "#ffffff"], away: "#f97316" },
    "질_비센테": { home: "#e30613", away: "#ffffff" },
    "마리티무": { home: ["#00843d", "#e30613"], away: "#ffffff" },
    "모레이렌스": { home: ["#00843d", "#ffffff"], away: "#111827" },
    "나시오날": { home: ["#111827", "#ffffff"], away: "#ffffff" },
    "히우_아브": { home: ["#00843d", "#ffffff"], away: "#111827" },
    "산타_클라라": { home: "#e30613", away: "#ffffff" },
    "SC_브라가": { home: "#e30613", away: "#ffffff" },
    "벤피카": { home: "#e30613", away: "#111827" },
    "스포르팅_CP": { home: ["#008057", "#ffffff"], away: "#111827" },
    "비토리아_기마랑이스": { home: "#ffffff", away: "#111827" },

    // ================= Süper Lig (18) =================
    "알라냐스포르": { home: ["#f58220", "#00843d"], away: "#ffffff" },
    "아메드": { home: ["#00843d", "#e30613"], away: "#ffffff" },
    "바샥셰히르": { home: ["#f37021", "#1d2951"], away: "#ffffff" },
    "베식타스": { home: ["#000000", "#ffffff"], away: "#dc2626" },
    "리제스포르": { home: ["#00843d", "#0055a4"], away: "#ffffff" },
    "초룸_FK": { home: ["#e30613", "#000000"], away: "#ffffff" },
    "에르주룸스포르": { home: ["#0055a4", "#ffffff"], away: "#111827" },
    "에위프스포르": { home: ["#6b21a8", "#facc15"], away: "#ffffff" },
    "페네르바체": { home: ["#ffed00", "#00235d"], away: "#ffffff" },
    "갈라타사라이": { home: ["#a90432", "#fdb912"], away: "#ffffff" },
    "가지안테프": { home: ["#e30613", "#000000"], away: "#ffffff" },
    "겐츨레르비를리이": { home: ["#e30613", "#000000"], away: "#ffffff" },
    "괴즈테페": { home: ["#ffd700", "#e30613"], away: "#ffffff" },
    "카슴파샤": { home: ["#0055a4", "#ffffff"], away: "#111827" },
    "코자엘리스포르": { home: ["#00843d", "#000000"], away: "#ffffff" },
    "코냐스포르": { home: ["#00843d", "#ffffff"], away: "#111827" },
    "삼순스포르": { home: ["#e30613", "#ffffff"], away: "#111827" },
    "트라브존스포르": { home: ["#7a1c3a", "#38bdf8"], away: "#ffffff" },

    // ================= K League 1 (12) =================
    "부천_FC": { home: "#e30613", away: "#ffffff" },
    "대전_하나": { home: ["#7a1c3a", "#00843d"], away: "#ffffff" },
    "FC_안양": { home: "#5b2c82", away: "#ffffff" },
    "FC_서울": { home: ["#fc0000", "#000000"], away: "#ffffff" },
    "강원_FC": { home: ["#f37021", "#004f32"], away: "#ffffff" },
    "김천_상무": { home: ["#e30613", "#1e3a8a"], away: "#ffffff" },
    "광주_FC": { home: ["#f5a12d", "#7a1c3a"], away: "#ffffff" },
    "인천_유나이티드": { home: ["#004b93", "#000000"], away: "#ffffff" },
    "제주_유나이티드": { home: "#f37021", away: "#ffffff" },
    "전북_현대": { home: "#006633", away: "#ffffff" },
    "포항_스틸러스": { home: ["#e30613", "#000000"], away: "#ffffff" },
    "울산_현대": { home: ["#004b93", "#ffd100"], away: "#ffffff" },

    // ================= Major League Soccer (30) =================
    "인터_마이애미": { home: "#f7b5cd", away: "#111827" },
    "LAFC": { home: ["#000000", "#c39e6d"], away: "#f8fafc" },
    "LA_갤럭시": { home: ["#ffffff", "#00245d"], away: "#00245d" },
    "애틀랜타_유나이티드": { home: ["#80000a", "#000000"], away: "#f8fafc" },
    "콜럼버스_크루": { home: ["#fedd00", "#000000"], away: "#111827" },
    "FC_신시내티": { home: ["#263b80", "#f05323"], away: "#ffffff" },
    "시애틀_사운더스": { home: ["#5d9732", "#005595"], away: "#111827" },
    "뉴욕_시티": { home: ["#6cadde", "#ffffff"], away: "#111827" },
    "뉴욕_레드불스": { home: ["#ffffff", "#ed1e36"], away: "#132257" },
    "올랜도_시티": { home: ["#633492", "#fde192"], away: "#ffffff" },
    "시카고_파이어": { home: ["#ff0000", "#001489"], away: "#ffffff" },
    "밴쿠버_화이트캡스": { home: ["#ffffff", "#00245e"], away: "#00245e" },
    "토론토_FC": { home: ["#b81137", "#455560"], away: "#ffffff" },
    "CF_몽레알": { home: ["#0033a0", "#000000"], away: "#ffffff" },
    "샬럿_FC": { home: ["#1a85c8", "#ffffff"], away: "#111827" },
    "필라델피아_유니언": { home: ["#071b2c", "#b19b69"], away: "#f8fafc" },
    "뉴잉글랜드_레볼루션": { home: ["#0a2240", "#ce0e2d"], away: "#ffffff" },
    "내슈빌_SC": { home: ["#ece83a", "#1f1646"], away: "#1f1646" },
    "DC_유나이티드": { home: ["#000000", "#ef3e42"], away: "#ffffff" },
    "포틀랜드_팀버스": { home: ["#004812", "#eae827"], away: "#ffffff" },
    "미네소타_유나이티드": { home: ["#231f20", "#8cd2f4"], away: "#ffffff" },
    "레알_솔트레이크": { home: ["#b30838", "#013a81"], away: "#ffffff" },
    "콜로라도_래피즈": { home: ["#862633", "#8bb8e8"], away: "#ffffff" },
    "FC_댈러스": { home: ["#bf0d3e", "#00205b"], away: "#ffffff" },
    "휴스턴_다이나모": { home: ["#ff6b00", "#101820"], away: "#101820" },
    "오스틴_FC": { home: ["#00b140", "#000000"], away: "#ffffff" },
    "스포팅_캔자스시티": { home: ["#91b0d5", "#002f65"], away: "#002f65" },
    "세인트루이스_시티": { home: ["#dd004a", "#001d4a"], away: "#ffffff" },
    "산호세_어스퀘이크스": { home: ["#0051ba", "#000000"], away: "#ffffff" },
    "샌디에이고_FC": { home: ["#0c2340", "#2cb3e3"], away: "#f8fafc" },

    // ================= Rest of World / Special Clubs (8) =================
    "아르헨티나_연합": { home: ["#75aadb", "#ffffff"], away: "#1e293b" },
    "미국_연합": { home: ["#ffffff", "#1d4ed8"], away: "#1e3a8a" },
    "멕시코_연합": { home: ["#006847", "#ce1126"], away: "#ffffff" },
    "브라질_연합": { home: "#ffdf00", away: "#002776" },
    "알_힐랄": { home: "#0055a4", away: "#ffffff" },
    "알_이티하드": { home: ["#ffdd00", "#000000"], away: "#ffffff" },
    "알_나스르": { home: "#ffd100", away: "#1e3a8a" },
    "셀틱": { home: ["#009944", "#ffffff"], away: "#111827" },

    // ================= World Cup National Teams (54) =================
    "대한민국": { home: "#ec0e27", away: "#111827" },
    "일본": { home: "#002395", away: "#ffffff" },
    "이란": { home: "#ffffff", away: "#da0000" },
    "호주": { home: "#ffcd00", away: "#00334e" },
    "사우디아라비아": { home: "#006c35", away: "#ffffff" },
    "카타르": { home: "#8d1b3d", away: "#ffffff" },
    "우즈베키스탄": { home: "#0099b5", away: "#ffffff" },
    "요르단": { home: "#ffffff", away: "#ce1126" },
    "이라크": { home: "#007a3d", away: "#ffffff" },
    "아랍에미리트": { home: "#ffffff", away: "#ef1c24" },

    "잉글랜드": { home: "#ffffff", away: "#1e293b" },
    "프랑스": { home: "#002395", away: "#ffffff" },
    "독일": { home: "#ffffff", away: "#111827" },
    "스페인": { home: "#aa151b", away: "#fde047" },
    "포르투갈": { home: "#e42518", away: "#ffffff" },
    "이탈리아": { home: "#0066b2", away: "#ffffff" },
    "네덜란드": { home: "#f36c21", away: "#1e3a8a" },
    "벨기에": { home: "#e30613", away: "#87ceeb" },
    "크로아티아": { home: ["#ff0000", "#ffffff"], away: "#1e3a8a" },
    "스위스": { home: "#da291c", away: "#ffffff" },
    "덴마크": { home: "#c60c30", away: "#ffffff" },
    "오스트리아": { home: "#ed2939", away: "#111827" },
    "폴란드": { home: "#ffffff", away: "#dc143c" },
    "우크라이나": { home: "#ffd700", away: "#005bbb" },
    "튀르키예": { home: "#e30a17", away: "#ffffff" },
    "체코": { home: "#d7141a", away: "#ffffff" },
    "스코틀랜드": { home: "#00205b", away: "#ffffff" },
    "웨일스": { home: "#d30731", away: "#ffffff" },
    "노르웨이": { home: "#ba0c2f", away: "#ffffff" },
    "루마니아": { home: "#fcd116", away: "#ce1126" },

    "브라질": { home: "#ffdf00", away: "#002776" },
    "아르헨티나": { home: ["#75aadb", "#ffffff"], away: "#1e293b" },
    "우루과이": { home: "#5eb3e4", away: "#ffffff" },
    "콜롬비아": { home: "#fcd116", away: "#111827" },
    "에콰도르": { home: "#ffdd00", away: "#034ea2" },
    "파라과이": { home: ["#d52b1e", "#ffffff"], away: "#0038a8" },
    "볼리비아": { home: "#007934", away: "#ffffff" },

    "미국": { home: "#ffffff", away: "#1d4ed8" },
    "멕시코": { home: "#006847", away: "#ffffff" },
    "캐나다": { home: "#d80621", away: "#111827" },
    "코스타리카": { home: "#ce1126", away: "#ffffff" },
    "파나마": { home: "#d21034", away: "#ffffff" },
    "아이티": { home: "#00209f", away: "#d21034" },
    "퀴라소": { home: "#002b7f", away: "#f9e814" },

    "모로코": { home: "#c1272d", away: "#ffffff" },
    "세네갈": { home: "#ffffff", away: "#00853f" },
    "이집트": { home: "#ce1126", away: "#ffffff" },
    "나이지리아": { home: "#008751", away: "#ffffff" },
    "코트디부아르": { home: "#f77f00", away: "#ffffff" },
    "가나": { home: "#ffffff", away: "#ce1126" },
    "알제리": { home: "#ffffff", away: "#006233" },
    "튀니지": { home: "#e70013", away: "#ffffff" },
    "남아공": { home: "#ffb81c", away: "#007a4d" },
    "카보베르데": { home: "#003893", away: "#ffffff" },

    "뉴질랜드": { home: "#ffffff", away: "#111827" }
};

function _parseHexColor(color) {
    const primary = Array.isArray(color) ? color[0] : color;
    if (!primary || typeof primary !== 'string') return null;
    const hex = primary.trim().toLowerCase();
    const namedMap = {
        white: '#ffffff',
        black: '#000000',
        skyblue: '#87ceeb',
        red: '#ff0000',
        blue: '#0000ff',
        yellow: '#ffff00',
        green: '#008000'
    };
    const normalized = namedMap[hex] || hex;
    const match = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!match) return null;
    let h = match[1];
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16)
    };
}

function _colorDistance(c1, c2) {
    const rgb1 = _parseHexColor(c1);
    const rgb2 = _parseHexColor(c2);
    if (!rgb1 || !rgb2) {
        const p1 = (Array.isArray(c1) ? c1[0] : String(c1 || '')).toLowerCase();
        const p2 = (Array.isArray(c2) ? c2[0] : String(c2 || '')).toLowerCase();
        return p1 === p2 ? 0 : 999;
    }
    const rMean = (rgb1.r + rgb2.r) / 2;
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(
        (2 + rMean / 256) * dr * dr +
        4 * dg * dg +
        (2 + (255 - rMean) / 256) * db * db
    );
}

function _isLightColor(color) {
    const rgb = _parseHexColor(color);
    if (!rgb) return false;
    const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return lum > 0.65;
}

function getTeamColor(teamName, kit = 'home') {
    const entry = TeamColors[teamName];
    if (entry) {
        if (typeof entry === 'object' && !Array.isArray(entry)) {
            return kit === 'away' ? (entry.away || entry.home) : entry.home;
        }
        return entry;
    }
    // 팀 데이터가 없으면 이름 해시로 고유 색상 생성
    let hash = 0;
    for (let i = 0; i < (teamName || '').length; i++) {
        hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return kit === 'away'
        ? `hsl(${(hue + 180) % 360}, 65%, 52%)`
        : `hsl(${hue}, 70%, 50%)`;
}

function getMatchKitColors(homeTeam, awayTeam) {
    const homeColor = getTeamColor(homeTeam, 'home');
    let awayColor = getTeamColor(awayTeam, 'away');

    const CLASH_THRESHOLD = 175;
    if (_colorDistance(homeColor, awayColor) < CLASH_THRESHOLD) {
        // 1순위: 원정팀의 홈 유니폼이 홈팀과 겹치지 않으면 원정팀 홈 유니폼 착용
        const awayHomeColor = getTeamColor(awayTeam, 'home');
        if (_colorDistance(homeColor, awayHomeColor) >= CLASH_THRESHOLD) {
            awayColor = awayHomeColor;
        } else {
            // 2순위: 둘 다 겹치면 홈팀 밝기에 따라 흰색 또는 다크 네이비로 대비
            awayColor = _isLightColor(homeColor) ? '#111827' : '#f8fafc';
        }
    }

    return { home: homeColor, away: awayColor };
}

if (typeof window !== 'undefined') {
    window.TeamColors = TeamColors;
    window.getTeamColor = getTeamColor;
    window.getMatchKitColors = getMatchKitColors;
}

// =========================================================================================
// [PART 1] 유틸리티 함수 (전력 계산, 베스트 11 등)
// =========================================================================================


function updateTeamStrength() {
    if (gameData.selectedTeam && gameData.currentOpponent) {
        const strengthData = calculateTeamStrengthDifference();
        const strengthDisplay = document.getElementById('strengthDisplay');
        if (strengthDisplay) {
            strengthDisplay.replaceChildren();

            const userRatingDiv = document.createElement('div');
            userRatingDiv.textContent = `우리팀 전력: ${strengthData.userRating.toFixed(1)}`;

            const oppRatingDiv = document.createElement('div');
            oppRatingDiv.textContent = `상대팀 전력: ${strengthData.opponentRating.toFixed(1)}`;

            const diffDiv = document.createElement('div');
            diffDiv.textContent = `전력 차이: ${strengthData.difference > 0 ? '+' : ''}${strengthData.difference.toFixed(1)}`;

            const advDiv = document.createElement('div');
            advDiv.textContent = `상대적 우위: ${strengthData.userAdvantage ? '유리' : '불리'}`;

            strengthDisplay.append(userRatingDiv, oppRatingDiv, diffDiv, advDiv);
        }
        return strengthData;
    }
    return null;
}

setInterval(() => updateTeamStrength(), 5000);

// =========================================================================================
// [PART 2] 전술 시스템 (TacticSystem)
// =========================================================================================

// 전 클럽 현실 기반 고유 전술 매핑 (170개 전체 클럽 완벽 지원)
const DEFAULT_CLUB_TACTICS = {
    // EPL
    "아스널": "tikitaka", "아스톤_빌라": "counter", "본머스": "gegenpress", "브렌트포드": "twoLine",
    "브라이튼": "lavolpiana", "첼시": "gegenpress", "코번트리_시티": "longBall", "크리스탈_팰리스": "counter",
    "에버턴": "twoLine", "풀럼": "possession", "헐_시티": "longBall", "입스위치": "counter",
    "리즈_유나이티드": "gegenpress", "리버풀": "gegenpress", "맨체스터_유나이티드": "counter",
    "맨체스터_시티": "tikitaka", "뉴캐슬_유나이티드": "twoLine", "노팅엄_포레스트": "counter",
    "토트넘_홋스퍼": "gegenpress", "선덜랜드": "twoLine",

    // La Liga
    "아틀레틱_클루브": "gegenpress", "아틀레티코_마드리드": "catenaccio", "오사수나": "twoLine",
    "셀타_비고": "possession", "알라베스": "twoLine", "엘체": "twoLine", "바르셀로나": "tikitaka",
    "헤타페": "catenaccio", "레반테": "counter", "말라가": "longBall", "라싱_클루브": "twoLine",
    "라요_바예카노": "gegenpress", "데포르티보": "possession", "에스파뇰": "catenaccio",
    "레알_베티스": "possession", "레알_마드리드": "counter", "레알_소시에다드": "possession",
    "세비야": "twoLine", "발렌시아": "twoLine", "비야레알": "counter",

    // Bundesliga
    "FC_쾰른": "twoLine", "마인츠": "twoLine", "도르트문트": "gegenpress", "아우크스부르크": "twoLine",
    "바이에른_뮌헨": "tikitaka", "샬케_04": "longBall", "프랑크푸르트": "counter", "함부르크": "counter",
    "레버쿠젠": "tikitaka", "묀헨글라트바흐": "possession", "라이프치히": "gegenpress", "프라이부르크": "twoLine",
    "파더보른": "gegenpress", "엘버스베르크": "counter", "베르더_브레멘": "counter", "호펜하임": "gegenpress",
    "우니온_베를린": "catenaccio", "슈투트가르트": "possession",

    // Serie A
    "AS_로마": "twoLine", "아탈란타": "gegenpress", "볼로냐": "tikitaka", "칼리아리": "twoLine",
    "코모": "tikitaka", "피오렌티나": "possession", "프로시노네": "counter", "제노아": "catenaccio",
    "유벤투스": "catenaccio", "라치오": "possession", "레체": "twoLine", "인터_밀란": "catenaccio",
    "AC_밀란": "counter", "몬차": "possession", "파르마": "counter", "사수올로": "possession",
    "나폴리": "possession", "토리노": "twoLine", "우디네세": "twoLine", "베네치아": "counter",

    // Ligue 1
    "오세르": "twoLine", "앙제": "catenaccio", "모나코": "counter", "트루아": "longBall",
    "로리앙": "counter", "르아브르": "twoLine", "르망": "longBall", "릴": "possession",
    "니스": "possession", "리옹": "twoLine", "올랭피크_드_마르세유": "gegenpress", "파리_FC": "possession",
    "파리_생제르맹": "tikitaka", "랑스": "gegenpress", "브레스트": "counter", "렌": "possession",
    "스트라스부르": "counter", "툴루즈": "twoLine",

    // Eredivisie
    "덴하흐": "twoLine", "아약스": "totalFootball", "AZ_알크마르": "possession", "엑셀시오르": "counter",
    "흐로닝언": "twoLine", "트벤테": "counter", "위트레흐트": "twoLine", "페예노르트": "gegenpress",
    "포르투나_시타르트": "twoLine", "고_어헤드_이글스": "counter", "NEC_네이메헌": "twoLine",
    "PEC_즈볼레": "twoLine", "PSV_에인트호번": "totalFootball", "캄뷔르": "longBall", "헤이렌베인": "possession",
    "텔스타": "twoLine", "스파르타_로테르담": "twoLine", "빌럼_II": "twoLine",

    // Portugal & Turkey & K-League & World
    "비제우": "twoLine", "아로카": "counter", "카사_피아": "catenaccio", "에스토릴": "possession",
    "에스트렐라": "twoLine", "알베르카": "longBall", "파말리캉": "counter", "FC_포르투": "gegenpress",
    "질_비센테": "counter", "마리티무": "twoLine", "모레이렌스": "twoLine", "나시오날": "longBall",
    "히우_아브": "possession", "산타_클라라": "twoLine", "SC_브라가": "counter", "벤피카": "twoLine",
    "스포르팅_CP": "possession", "비토리아_기마랑이스": "counter", "알라냐스포르": "counter", "아메드": "twoLine",
    "바샥셰히르": "possession", "베식타스": "gegenpress", "리제스포르": "twoLine", "초룸_FK": "longBall",
    "에르주룸스포르": "twoLine", "에위프스포르": "counter", "페네르바체": "counter", "갈라타사라이": "possession",
    "가지안테프": "twoLine", "겐츨레르비를리이": "twoLine", "괴즈테페": "counter", "카슴파샤": "twoLine",
    "코자엘리스포르": "twoLine", "코냐스포르": "catenaccio", "삼순스포르": "counter", "트라브존스포르": "twoLine",
    "부천_FC": "twoLine", "대전_하나": "counter", "FC_안양": "catenaccio", "FC_서울": "lavolpiana",
    "강원_FC": "counter", "김천_상무": "twoLine", "광주_FC": "tikitaka", "인천_유나이티드": "twoLine",
    "제주_유나이티드": "possession", "전북_현대": "lavolpiana", "포항_스틸러스": "possession",
    "울산_현대": "tikitaka", "아르헨티나_연합": "catenaccio", "미국_연합": "gegenpress",
    "멕시코_연합": "totalFootball", "브라질_연합": "possession", "알_힐랄": "tikitaka",
    "알_이티하드": "possession", "알_나스르": "twoLine", "셀틱": "gegenpress",

    // MLS (30)
    "인터_마이애미": "tikitaka", "LAFC": "gegenpress", "LA_갤럭시": "possession",
    "애틀랜타_유나이티드": "verticalTikitaka", "콜럼버스_크루": "possession", "FC_신시내티": "directCounter",
    "시애틀_사운더스": "balanced", "뉴욕_시티": "tikitaka", "뉴욕_레드불스": "gegenpress",
    "올랜도_시티": "directCounter", "시카고_파이어": "wingPlay", "밴쿠버_화이트캡스": "directCounter",
    "토론토_FC": "possession", "CF_몽레알": "verticalTikitaka", "샬럿_FC": "lowBlockCounter",
    "필라델피아_유니언": "gegenpress", "뉴잉글랜드_레볼루션": "wingPlay", "내슈빌_SC": "lowBlockCounter",
    "DC_유나이티드": "routeOne", "포틀랜드_팀버스": "directCounter", "미네소타_유나이티드": "directCounter",
    "레알_솔트레이크": "gegenpress", "콜로라도_래피즈": "directCounter", "FC_댈러스": "wingPlay",
    "휴스턴_다이나모": "possession", "오스틴_FC": "possession", "스포팅_캔자스시티": "possession",
    "세인트루이스_시티": "gegenpress", "산호세_어스퀘이크스": "wingPlay", "샌디에이고_FC": "verticalTikitaka"
};
if (typeof window !== 'undefined') window.DEFAULT_CLUB_TACTICS = DEFAULT_CLUB_TACTICS;

// 구형 프리셋 키 -> FM 정통 전술 키 정규화 매핑
const LEGACY_TACTIC_KEY_MAP = {
    lavolpiana: 'verticalTikitaka',
    twoLine: 'directCounter',
    counter: 'directCounter',
    parkBus: 'lowBlockCounter',
    longBall: 'routeOne'
};

const ALL_TACTIC_KEYS = [
    'gegenpress', 'tikitaka', 'verticalTikitaka', 'possession',
    'wingPlay', 'directCounter', 'lowBlockCounter', 'catenaccio',
    'routeOne', 'totalFootball', 'balanced'
];

const COMPLEMENTARY_TACTIC_MAP = {
    tikitaka: 'verticalTikitaka',
    verticalTikitaka: 'possession',
    possession: 'tikitaka',
    totalFootball: 'gegenpress',
    gegenpress: 'verticalTikitaka',
    wingPlay: 'directCounter',
    directCounter: 'lowBlockCounter',
    lowBlockCounter: 'directCounter',
    catenaccio: 'lowBlockCounter',
    routeOne: 'wingPlay',
    balanced: 'directCounter'
};

function normalizeTacticKey(key) {
    if (!key || typeof key !== 'string') return 'balanced';
    return LEGACY_TACTIC_KEY_MAP[key] || key;
}
if (typeof window !== 'undefined') window.normalizeTacticKey = normalizeTacticKey;

// 게임 시작 시 3개 기본 전술의 친숙도를 50%로 초기화 (나머지 20%)
function initializeTacticMastery(teamKey = null) {
    if (typeof gameData === 'undefined' || !gameData) return {};
    if (!gameData.tacticMastery || typeof gameData.tacticMastery !== 'object') {
        gameData.tacticMastery = {};
    }

    const clubRaw = String(teamKey || gameData.selectedTeam || '').trim();
    const clubDef = clubRaw
        ? normalizeTacticKey(DEFAULT_CLUB_TACTICS[clubRaw] || DEFAULT_CLUB_TACTICS[clubRaw.replace(/\s+/g, '_')] || 'balanced')
        : 'balanced';
    const currentNorm = normalizeTacticKey(gameData.currentTactic || clubDef || 'balanced');

    const starterSet = new Set([clubDef, 'balanced']);
    const comp = COMPLEMENTARY_TACTIC_MAP[clubDef] || 'verticalTikitaka';
    starterSet.add(comp);
    for (const fallbackKey of ['gegenpress', 'possession', 'directCounter']) {
        if (starterSet.size >= 3) break;
        starterSet.add(fallbackKey);
    }
    if (currentNorm && starterSet.size < 3) starterSet.add(currentNorm);

    ALL_TACTIC_KEYS.forEach(k => {
        if (typeof gameData.tacticMastery[k] !== 'number') {
            gameData.tacticMastery[k] = starterSet.has(k) ? 50 : 20;
        }
    });
    return gameData.tacticMastery;
}
if (typeof window !== 'undefined') window.initializeTacticMastery = initializeTacticMastery;

// 전술 친숙도(0~100%) 기반 성능 보정 계산 (50% 기준: 50% 미만은 마이너스 페널티, 50%는 0%, 초과 시 보너스)
function getTacticMasteryEffect(masteryPct) {
    const pct = Math.max(0, Math.min(100, Number.isFinite(Number(masteryPct)) ? Number(masteryPct) : 50));
    const delta = (pct - 50) / 50; // -1.0 (0%) ~ 0.0 (50%) ~ +1.0 (100%)
    const stabilityPct = Number((delta * 5.0).toFixed(1));
    const stabilityFactor = 1.0 + delta * 0.05;
    const chanceDelta = delta * 0.04;
    const pressDelta = delta * 0.08;
    const tempoDelta = delta * 0.04;

    let tier = '미숙 (페널티)';
    let color = '#F87171';
    if (pct >= 85) { tier = '완벽 체화'; color = '#34D399'; }
    else if (pct >= 65) { tier = '숙련'; color = '#34D399'; }
    else if (pct > 50) { tier = '적응 완료'; color = '#38BDF8'; }
    else if (pct === 50) { tier = '적응 중 (기준)'; color = '#FBBF24'; }

    const signedText = `${stabilityPct > 0 ? '+' : ''}${stabilityPct.toFixed(1)}%`;
    return {
        pct,
        delta,
        stabilityPct,
        stabilityFactor,
        chanceDelta,
        pressDelta,
        tempoDelta,
        tier,
        color,
        signedText
    };
}
if (typeof window !== 'undefined') window.getTacticMasteryEffect = getTacticMasteryEffect;

// 전술 숙련도(0~100%) 조회 및 구형 키 숙련도 자동 마이그레이션 헬퍼
function getTacticMasteryPct(tacticKey) {
    if (typeof gameData === 'undefined' || !gameData) return 50;
    if (!gameData.tacticMastery || typeof gameData.tacticMastery !== 'object') {
        gameData.tacticMastery = {};
    }
    // 구형 키(lavolpiana, parkBus, twoLine, counter, longBall) 숙련도를 정규 FM 키로 병합
    for (const [oldK, newK] of Object.entries(LEGACY_TACTIC_KEY_MAP)) {
        if (typeof gameData.tacticMastery[oldK] === 'number') {
            gameData.tacticMastery[newK] = Math.max(gameData.tacticMastery[newK] || 0, gameData.tacticMastery[oldK]);
            delete gameData.tacticMastery[oldK];
        }
    }
    if (Object.keys(gameData.tacticMastery).length === 0) {
        initializeTacticMastery();
    }
    const normKey = normalizeTacticKey(tacticKey || gameData.currentTactic || 'balanced');
    if (typeof gameData.tacticMastery[normKey] !== 'number') {
        initializeTacticMastery();
        if (typeof gameData.tacticMastery[normKey] !== 'number') {
            gameData.tacticMastery[normKey] = 20;
        }
    }
    return Math.max(0, Math.min(100, Math.round(gameData.tacticMastery[normKey] || 0)));
}
if (typeof window !== 'undefined') window.getTacticMasteryPct = getTacticMasteryPct;

// 유저 커스텀 전술 슬롯 (3개) 관리 유틸
const CustomTacticSlots = {
    ensureSlots() {
        if (typeof gameData === 'undefined' || !gameData) return [];
        if (!Array.isArray(gameData.customTactics) || gameData.customTactics.length !== 3) {
            const prev = Array.isArray(gameData.customTactics) ? gameData.customTactics : [];
            gameData.customTactics = [0, 1, 2].map(idx => prev[idx] || {
                id: idx + 1,
                name: `커스텀 플랜 ${idx + 1}`,
                baseStyle: null,
                settings: null,
                mentality: 'balanced',
                savedAt: null
            });
        }
        return gameData.customTactics;
    },
    saveToSlot(slotIdx, customName) {
        const slots = this.ensureSlots();
        if (!slots[slotIdx]) return false;
        const curStyle = normalizeTacticKey(gameData.currentTactic || 'balanced');
        const defaultFn = typeof window.getDefaultTacticSettings === 'function'
            ? window.getDefaultTacticSettings
            : () => ({ buildUp: 'balanced', defensiveLine: 'normal', pressIntensity: 'normal', offensiveTrans: 'balanced', defensiveTrans: 'regroup', passLength: 'mixed', tempo: 'normal', width: 'normal' });
        const curSettings = Object.assign({}, defaultFn(curStyle), gameData.tacticSettings || {});
        slots[slotIdx] = {
            id: slotIdx + 1,
            name: (customName && String(customName).trim()) ? String(customName).trim() : (slots[slotIdx].name || `커스텀 플랜 ${slotIdx + 1}`),
            baseStyle: curStyle,
            settings: curSettings,
            mentality: (gameData.tacticMentality || 'balanced'),
            savedAt: Date.now()
        };
        gameData.activeCustomSlot = slotIdx;
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        return slots[slotIdx];
    },
    loadFromSlot(slotIdx) {
        const slots = this.ensureSlots();
        const slot = slots[slotIdx];
        if (!slot || !slot.settings) return null;
        gameData.currentTactic = normalizeTacticKey(slot.baseStyle || 'balanced');
        gameData.tacticSettings = Object.assign({}, slot.settings);
        gameData.tacticMentality = slot.mentality || 'balanced';
        gameData.activeCustomSlot = slotIdx;
        if (typeof window.updateCurrentTacticPanelUI === 'function') {
            window.updateCurrentTacticPanelUI(gameData.currentTactic);
        }
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        return slot;
    }
};
if (typeof window !== 'undefined') window.CustomTacticSlots = CustomTacticSlots;

class TacticSystem {
    constructor() {
        this.tactics = {
            gegenpress: { name: "게겐프레싱", effective: ["tikitaka", "possession", "verticalTikitaka"], ineffective: ["lowBlockCounter", "routeOne", "catenaccio", "directCounter"], description: "공을 잃자마자 높은 수비라인에서 즉각 재압박해 상대 진영에서 찬스를 만드는 전술" },
            tikitaka: { name: "티키타카", effective: ["lowBlockCounter", "catenaccio", "directCounter"], ineffective: ["gegenpress", "totalFootball"], description: "극단적인 짧은 패스와 삼각 대형으로 점유율을 지배하며 틈을 여는 전술" },
            verticalTikitaka: { name: "수직 티키타카", effective: ["lowBlockCounter", "catenaccio", "possession"], ineffective: ["gegenpress", "wingPlay"], description: "짧고 빠른 전진 패스로 하프스페이스를 수직 공략하는 현대식 빌드업 전술" },
            possession: { name: "컨트롤 포제션", effective: ["lowBlockCounter", "catenaccio", "routeOne"], ineffective: ["gegenpress", "directCounter"], description: "안정적인 볼 순환과 템포 조절로 경기 흐름을 통제하는 점유 전술" },
            wingPlay: { name: "윙 플레이", effective: ["lowBlockCounter", "catenaccio", "verticalTikitaka"], ineffective: ["tikitaka", "totalFootball"], description: "터치라인 끝까지 벌린 윙어와 풀백의 오버래핑·크로스로 측면을 폭격하는 전술" },
            directCounter: { name: "플루이드 역습", effective: ["gegenpress", "totalFootball", "possession"], ineffective: ["catenaccio", "lowBlockCounter"], description: "견고한 미드블록 유지 후 탈취 즉시 전방 공간으로 빠르게 찌르는 역습 전술" },
            lowBlockCounter: { name: "로우 블록", effective: ["gegenpress", "totalFootball", "verticalTikitaka"], ineffective: ["wingPlay", "tikitaka", "possession"], description: "수비 라인을 깊게 내리고 박스 안 공간을 잠근 뒤 한 방의 롱카운터를 노리는 전술" },
            catenaccio: { name: "카테나치오", effective: ["directCounter", "gegenpress", "routeOne"], ineffective: ["tikitaka", "wingPlay", "possession"], description: "촘촘한 중앙 수비 블록과 대인 마크로 실점을 극도로 억제하는 빗장수비 전술" },
            routeOne: { name: "루트 원 롱볼", effective: ["gegenpress", "tikitaka"], ineffective: ["catenaccio", "possession", "balanced"], description: "후방에서 최전방 타겟맨과 뒷공간으로 곧바로 긴 패스를 투입하는 직선 전술" },
            totalFootball: { name: "토탈 풋볼", effective: ["catenaccio", "lowBlockCounter", "wingPlay"], ineffective: ["directCounter", "routeOne"], description: "전 포지션이 유기적으로 스위칭하며 공수 전역에서 수적 우위를 점하는 전술" },
            balanced: { name: "밸런스", effective: [], ineffective: [], description: "공수 라인과 패스·템포를 표준 균형으로 유지하며 상황에 유연하게 대응하는 전술" },
            // 하위 호환 별칭 (구형 세이브 및 클럽 매핑 호환용)
            lavolpiana: { name: "수직 티키타카", isAlias: true, canonical: "verticalTikitaka", effective: ["lowBlockCounter", "catenaccio"], ineffective: ["gegenpress"], description: "짧고 빠른 전진 패스로 하프스페이스를 수직 공략하는 현대식 빌드업 전술" },
            twoLine: { name: "플루이드 역습", isAlias: true, canonical: "directCounter", effective: ["gegenpress", "totalFootball"], ineffective: ["catenaccio"], description: "견고한 미드블록 유지 후 탈취 즉시 전방 공간으로 빠르게 찌르는 역습 전술" },
            counter: { name: "플루이드 역습", isAlias: true, canonical: "directCounter", effective: ["gegenpress", "totalFootball"], ineffective: ["catenaccio"], description: "견고한 미드블록 유지 후 탈취 즉시 전방 공간으로 빠르게 찌르는 역습 전술" },
            parkBus: { name: "로우 블록", isAlias: true, canonical: "lowBlockCounter", effective: ["gegenpress", "totalFootball"], ineffective: ["wingPlay", "tikitaka"], description: "수비 라인을 깊게 내리고 박스 안 공간을 잠근 뒤 한 방의 롱카운터를 노리는 전술" },
            longBall: { name: "루트 원 롱볼", isAlias: true, canonical: "routeOne", effective: ["gegenpress", "tikitaka"], ineffective: ["catenaccio", "possession"], description: "후방에서 최전방 타겟맨과 뒷공간으로 곧바로 긴 패스를 투입하는 직선 전술" }
        };
    }

    getOpponentTactic(opponentTeam) {
        if (!opponentTeam) return 'directCounter';
        const keyRaw = String(opponentTeam).trim();
        const keyUnderscore = keyRaw.replace(/\s+/g, '_');
        const keySpace = keyRaw.replace(/_/g, ' ');

        if (DEFAULT_CLUB_TACTICS[keyUnderscore]) return normalizeTacticKey(DEFAULT_CLUB_TACTICS[keyUnderscore]);
        if (DEFAULT_CLUB_TACTICS[keySpace]) return normalizeTacticKey(DEFAULT_CLUB_TACTICS[keySpace]);
        if (DEFAULT_CLUB_TACTICS[keyRaw]) return normalizeTacticKey(DEFAULT_CLUB_TACTICS[keyRaw]);

        const tt = (typeof teamTactics !== 'undefined' && teamTactics) || (typeof window !== 'undefined' && window.teamTactics) || {};
        if (tt[keyUnderscore]) return normalizeTacticKey(tt[keyUnderscore]);
        if (tt[keySpace]) return normalizeTacticKey(tt[keySpace]);
        if (tt[keyRaw]) return normalizeTacticKey(tt[keyRaw]);

        const styles = ['directCounter', 'gegenpress', 'possession', 'catenaccio', 'tikitaka', 'verticalTikitaka', 'wingPlay', 'lowBlockCounter'];
        let hash = 0;
        for (let i = 0; i < keyRaw.length; i++) hash = ((hash << 5) - hash) + keyRaw.charCodeAt(i);
        return styles[Math.abs(hash) % styles.length];
    }

    calculateTacticEffect(userTactic, opponentTactic) {
        // 전술 상성에 따른 인위적 스탯 증감 폐지 (엔진 내 전술 움직임·인과관계로만 작동)
        return 0;
    }

    getTacticMatchup(userTactic, opponentTactic) {
        const uKey = normalizeTacticKey(userTactic);
        const oKey = normalizeTacticKey(opponentTactic);
        const userTacticData = this.tactics[uKey] || this.tactics[userTactic];
        const opponentTacticData = this.tactics[oKey] || this.tactics[opponentTactic];

        if (!userTacticData) return { result: "균형 승부", advantage: 0, description: "전술 인과관계 승부" };

        let result = "전술 맞대결";
        if (userTacticData.effective && userTacticData.effective.includes(oKey)) {
            result = "구조적 상성 우위";
        } else if (userTacticData.ineffective && userTacticData.ineffective.includes(oKey)) {
            result = "구조적 상성 주의";
        }

        return {
            result: result,
            advantage: 0,
            userTacticName: userTacticData.name,
            opponentTacticName: opponentTacticData ? opponentTacticData.name : opponentTactic,
            description: `${userTacticData.name} vs ${opponentTacticData ? opponentTacticData.name : opponentTactic}: ${result}`
        };
    }

    // 모든 정규 FM 전술 목록 가져오기 (별칭 제외)
    getAllTactics() {
        return Object.keys(this.tactics)
            .filter(key => !this.tactics[key].isAlias)
            .map(key => ({
                key: key,
                name: this.tactics[key].name,
                description: this.tactics[key].description
            }));
    }

    getTacticName(tactic) {
        return this.tactics[tactic] ? this.tactics[tactic].name : tactic;
    }

    getRecommendedTactic(opponentTactic) {
        const results = [];
        Object.keys(this.tactics).forEach(key => {
            if (key === 'balanced') return;
            const data = this.tactics[key];
            if (data.effective.includes(opponentTactic)) {
                results.push({
                    key,
                    tactic: key,
                    name: data.name,
                    reason: `${this.getTacticName(opponentTactic)}에 효과적`
                });
            }
        });
        if (results.length === 0) {
            return [{ key: 'balanced', tactic: 'balanced', name: this.tactics.balanced.name, reason: '무난한 선택' }];
        }
        return results;
    }
}

// =========================================================================================
// [PART 3] 경기 진행 로직 (RealSoccerEngine 연동)
// =========================================================================================

function normalizeMatchDrama() {
    if (!gameData.matchDrama) {
        gameData.matchDrama = {
            enabled: gameData.settings ? gameData.settings.immersionMode !== false : true,
            intensity: 'high'
        };
    }
    if (!['low', 'medium', 'high'].includes(gameData.matchDrama.intensity)) {
        gameData.matchDrama.intensity = 'high';
    }
    return gameData.matchDrama;
}

function getDramaTickDelay(matchData, snapshot) {
    if (matchData.isFastForward) return 0;
    if (!snapshot || !snapshot.isSuspense) return null;

    const drama = (typeof window.getMatchDramaConfig === 'function')
        ? window.getMatchDramaConfig()
        : normalizeMatchDrama();

    if (!drama.enabled) return 120;

    const intensityDelays = { low: 900, medium: 1800, high: 3200 };
    return intensityDelays[drama.intensity] || intensityDelays.high;
}

function startMatch() {
    // 1. 초기 검증
    if (!gameData.selectedTeam || !gameData.currentOpponent) {
        alert("팀이나 상대가 설정되지 않았습니다.");
        return;
    }

    // 2. 스쿼드 검증
    if (!validateFormationBeforeMatch()) return;

    normalizeMatchDrama();

    // 3. 화면 전환
    showScreen('matchScreen');

    // 4. 경기 데이터 초기화
    const matchData = {
        homeTeam: gameData.isHomeGame ? gameData.selectedTeam : gameData.currentOpponent,
        awayTeam: gameData.isHomeGame ? gameData.currentOpponent : gameData.selectedTeam,
        homeScore: 0,
        awayScore: 0,
        minute: 0,
        events: [],
        isRunning: false,
        substitutionsMade: 0,
        strengthDiff: calculateTeamStrengthDifference(),
        isFastForward: false // [신규] 고속 모드 플래그
    };
    window.currentMatchData = matchData; // [신규] 치트키 사용을 위해 전역 노출

    // 5. 전술 상성에 따른 사전 스탯/사기 변동 제거 (인게임 움직임·전술 인과관계로만 승부)
    const tacticSystem = new TacticSystem();

    // 6. UI 업데이트
    document.getElementById('homeTeam').textContent = teamNames[matchData.homeTeam];
    document.getElementById('awayTeam').textContent = teamNames[matchData.awayTeam];
    document.getElementById('scoreDisplay').textContent = "0 - 0";
    document.getElementById('matchTime').textContent = "0분";

    // [신규] 스타디움 경기 장소 및 관중 프리뷰 연동
    if (typeof stadiumSystem !== 'undefined') {
        const stadiumRes = stadiumSystem.calculateMatchday(matchData.homeTeam, matchData.awayTeam);
        matchData.stadiumInfo = stadiumRes;
        const matchTitleEl = document.getElementById('matchTitle');
        if (matchTitleEl) {
            const selloutTag = stadiumRes.isSellout ? " ★전석 매진" : "";
            let cupPrefix = '';
            if (gameData.isMLSPlayoffMatch) {
                const mlsLabels = {
                    MLS_WC: '와일드카드',
                    MLS_R1_G1: '1R 1차전',
                    MLS_R1_G2: '1R 2차전',
                    MLS_R1_G3: '1R 3차전',
                    MLS_CONF_SF: '컨퍼런스 준결승',
                    MLS_CONF_FINAL: '컨퍼런스 결승',
                    MLS_CUP: 'MLS컵 파이널'
                };
                const poLabel = mlsLabels[gameData.playoffStage] || '플레이오프';
                cupPrefix = `🇺🇸 MLS컵 플레이오프 [${poLabel}] · `;
            } else if (gameData.isPlayoffMatch) {
                const poLabel = gameData.playoffStage === 'FINAL' ? '결승' : (gameData.playoffStage === 'SF_LEG2' ? '준결승 2차전' : '준결승 1차전');
                cupPrefix = `🔥 EFL 승격 플레이오프 [${poLabel}] · `;
            } else if (gameData.isUCLMatch && typeof cupCompetitionManager !== 'undefined') {
                const uclStage = cupCompetitionManager.uclStageNames[gameData.uclStage] || '토너먼트';
                cupPrefix = `⭐ UCL [${uclStage}] · `;
            } else if (gameData.isFACupMatch && typeof faCupManager !== 'undefined') {
                const faName = (gameData.faCup && gameData.faCup.config) ? gameData.faCup.config.name : 'FA컵';
                const faStage = faCupManager.faStageNames[gameData.faCupStage] || '토너먼트';
                cupPrefix = `🏆 ${faName} [${faStage}] · `;
            }
            matchTitleEl.textContent = `${cupPrefix}🏟️ ${stadiumRes.stadiumName} (관중: ${stadiumRes.attendance.toLocaleString()}명${selloutTag})`;
        }
    }
    const elList = document.getElementById('eventList');
    if (elList) elList.replaceChildren();

    // 교체 버튼
    const subBtn = document.getElementById('substituteBtn');
    subBtn.style.display = 'inline-block';
    subBtn.onclick = () => openSubstitutionModal(matchData);
    document.getElementById('endMatchBtn').style.display = 'none';

    // 7. 엔진 및 비주얼라이저 초기화
    // (RealSoccerEngine은 deepenTactic.js에 정의되어 있음)
    const homeSquad = getSquadData(matchData.homeTeam);
    const awaySquad = getSquadData(matchData.awayTeam);

    // [수정] 상대 전술 정보를 선수에 전달
    const homeTactic = (matchData.homeTeam === gameData.selectedTeam) ? gameData.currentTactic : tacticSystem.getOpponentTactic(matchData.homeTeam);
    const awayTactic = (matchData.awayTeam === gameData.selectedTeam) ? gameData.currentTactic : tacticSystem.getOpponentTactic(matchData.awayTeam);

    const engine = new RealSoccerEngine(homeSquad, awaySquad, homeTactic, awayTactic);

    // [신규] 스타디움 및 경기 장소(홈/어웨이/관중 위압감) 컨텍스트 주입
    if (typeof engine.setMatchContext === 'function') {
        engine.setMatchContext({
            stadiumInfo: matchData.stadiumInfo,
            homeTeam: matchData.homeTeam,
            awayTeam: matchData.awayTeam,
            userTeam: gameData.selectedTeam,
            isHomeGame: matchData.homeTeam === gameData.selectedTeam
        });
    }

    matchData.engine = engine; // 엔진 참조 저장

    // [개선] 홈/어웨이 유니폼 컬러 가져오기 (원정팀은 어웨이 유니폼 착용 + 색상 충돌 자동 방지)
    const { home: homeColor, away: awayColor } = getMatchKitColors(matchData.homeTeam, matchData.awayTeam);

    // 비주얼라이저 초기화
    if (window.matchVisualizer) {
        // [수정] 팀 컬러 전달
        window.matchVisualizer.init('matchVisualizerContainer', engine.players, { home: homeColor, away: awayColor });
    } else {
        // 비주얼라이저가 없으면 캔버스 영역을 숨기거나 텍스트 모드로 동작
        console.warn("matchVisualizer not found. Playing in text mode.");
    }

    // [신규] 상단 브로드캐스트 점수판 로고, 스태미나 HUD, 실시간 텔레메트리 초기화
    initMatchLiveTelemetry(matchData, engine);
    updateMatchStaminaUI(matchData);
    updateMatchTelemetryUI(matchData);
    initLiveTacticsBar(matchData, engine);

    // 8. 킥오프 버튼 표시
    showKickoffButton(matchData, engine);
}

// =========================================================================================
// [신규] 경기 중 실시간 전술 컨트롤 바 (5단계 성향 · 터치라인 지침 · 슬롯 즉시 전환)
// =========================================================================================

function initLiveTacticsBar(matchData, engine) {
    const bar = document.getElementById('liveTacticsBar');
    if (!bar) return;

    bar.style.display = 'flex';
    const userSide = matchData.homeTeam === gameData.selectedTeam ? 'home' : 'away';

    const state = {
        mentality: (gameData && gameData.tacticMentality) || 'balanced',
        pressAll: false,
        counterPrepare: false,
        timeWasting: false
    };

    const pushDirectiveToEngine = (logMsg) => {
        if (engine && typeof engine.setUserLiveDirectives === 'function') {
            engine.setUserLiveDirectives(userSide, state);
        }
        if (logMsg && typeof displayEvent === 'function') {
            displayEvent({
                minute: matchData.minute || 0,
                type: 'tactic',
                description: `[감독 지시] ${logMsg}`
            }, matchData);
        }
    };

    // 초기 동기화 (로그 없음)
    pushDirectiveToEngine(null);

    const mentalityLabels = {
        veryDefensive: '극단적 수비',
        defensive: '수비적',
        balanced: '균형',
        attacking: '공격적',
        veryAttacking: '총공세'
    };

    // 성향 버튼 렌더링/바인딩
    const mentalityBtns = bar.querySelectorAll('[data-live-mentality]');
    const syncMentalityUI = () => {
        mentalityBtns.forEach(btn => {
            const val = btn.getAttribute('data-live-mentality');
            if (val === state.mentality) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    };
    mentalityBtns.forEach(btn => {
        btn.onclick = () => {
            const val = btn.getAttribute('data-live-mentality');
            if (!val || state.mentality === val) return;
            state.mentality = val;
            if (gameData) gameData.tacticMentality = val;
            syncMentalityUI();
            pushDirectiveToEngine(`경기 성향을 '${mentalityLabels[val] || val}'(으)로 전환합니다!`);
        };
    });
    syncMentalityUI();

    // 빠른 터치라인 지침 토글 바인딩
    const shoutDefs = {
        pressAll: '🔥 전원 압박 가동! (전방 압박 및 역압박 극대화 · 체력 소모 증가)',
        counterPrepare: '🛡️ 역습 대비 지시! (수비 라인 하향 및 후방 수비 인원 고정)',
        timeWasting: '⏱️ 시간 끌기 지시! (템포를 늦추고 안전한 볼 소유 우선)'
    };
    const shoutBtns = bar.querySelectorAll('[data-live-shout]');
    const syncShoutUI = () => {
        shoutBtns.forEach(btn => {
            const key = btn.getAttribute('data-live-shout');
            if (state[key]) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    };
    shoutBtns.forEach(btn => {
        btn.onclick = () => {
            const key = btn.getAttribute('data-live-shout');
            if (!key || !(key in state)) return;
            state[key] = !state[key];
            // 상호 배타 정리: 전원 압박과 시간 끌기가 동시에 켜지면 어색하므로 자동 조정
            if (key === 'pressAll' && state.pressAll && state.timeWasting) state.timeWasting = false;
            if (key === 'timeWasting' && state.timeWasting && state.pressAll) state.pressAll = false;
            syncShoutUI();
            const label = btn.textContent.trim();
            pushDirectiveToEngine(state[key] ? shoutDefs[key] : `'${label}' 지시를 해제하고 기본 대형으로 복귀합니다.`);
        };
    });
    syncShoutUI();

    // 전술 프리셋 / 커스텀 슬롯 즉시 전환 셀렉트
    const presetSelect = document.getElementById('liveTacticPresetSelect');
    const liveMasteryBadge = document.getElementById('liveTacticMasteryBadge');
    const syncLiveMasteryBadge = (tacKey) => {
        if (!liveMasteryBadge) return;
        const mPct = getTacticMasteryPct(tacKey || gameData.currentTactic || 'balanced');
        liveMasteryBadge.textContent = `숙련도 ${mPct}% (+${((mPct / 100) * 4.5).toFixed(1)}%)`;
    };
    syncLiveMasteryBadge(gameData.currentTactic);

    if (presetSelect) {
        presetSelect.replaceChildren();
        const ts = new TacticSystem();
        const curTac = normalizeTacticKey(gameData.currentTactic || 'balanced');

        // 1) 저장된 커스텀 슬롯 그룹
        const slots = CustomTacticSlots.ensureSlots().filter(s => s && s.settings);
        if (slots.length > 0) {
            const customGroup = document.createElement('optgroup');
            customGroup.label = '★ 저장된 커스텀 플랜';
            slots.forEach((s, idx) => {
                const opt = document.createElement('option');
                opt.value = `slot:${s.id - 1}`;
                opt.textContent = `★ ${s.name} (${ts.getTacticName(s.baseStyle)} · ${getTacticMasteryPct(s.baseStyle)}%)`;
                if (gameData.activeCustomSlot === (s.id - 1)) opt.selected = true;
                customGroup.appendChild(opt);
            });
            presetSelect.appendChild(customGroup);
        }

        // 2) FM 기본 전술 철학 그룹
        const baseGroup = document.createElement('optgroup');
        baseGroup.label = 'FM 전술 철학 프리셋';
        ts.getAllTactics().forEach(t => {
            const opt = document.createElement('option');
            opt.value = `preset:${t.key}`;
            opt.textContent = `${t.name} (숙련도 ${getTacticMasteryPct(t.key)}%)`;
            if (gameData.activeCustomSlot == null && t.key === curTac) opt.selected = true;
            baseGroup.appendChild(opt);
        });
        presetSelect.appendChild(baseGroup);

        presetSelect.onchange = (e) => {
            const val = e.target.value || '';
            if (val.startsWith('slot:')) {
                const slotIdx = parseInt(val.split(':')[1], 10);
                const loaded = CustomTacticSlots.loadFromSlot(slotIdx);
                if (loaded) {
                    state.mentality = loaded.mentality || state.mentality;
                    syncMentalityUI();
                    syncLiveMasteryBadge(loaded.baseStyle);
                    if (engine && typeof engine.applyLiveTacticChange === 'function') {
                        engine.applyLiveTacticChange(userSide, loaded.baseStyle, loaded.settings, state);
                    }
                    pushDirectiveToEngine(`커스텀 플랜 [${loaded.name}] 전술을 즉시 적용합니다! (숙련도 ${getTacticMasteryPct(loaded.baseStyle)}%)`);
                }
            } else if (val.startsWith('preset:')) {
                const presetKey = normalizeTacticKey(val.split(':')[1]);
                gameData.currentTactic = presetKey;
                gameData.activeCustomSlot = null;
                if (typeof window.getDefaultTacticSettings === 'function') {
                    gameData.tacticSettings = window.getDefaultTacticSettings(presetKey);
                }
                if (typeof window.updateCurrentTacticPanelUI === 'function') {
                    window.updateCurrentTacticPanelUI(presetKey);
                }
                syncLiveMasteryBadge(presetKey);
                if (engine && typeof engine.applyLiveTacticChange === 'function') {
                    engine.applyLiveTacticChange(userSide, presetKey, gameData.tacticSettings, state);
                }
                pushDirectiveToEngine(`전술 철학을 [${ts.getTacticName(presetKey)}](으)로 즉시 전환합니다! (숙련도 ${getTacticMasteryPct(presetKey)}%)`);
            }
        };
    }
}

// =========================================================================================
// [신규] 인게임 실시간 체력(Stamina) HUD & 브로드캐스트 텔레메트리 (점유율/파울/주목할 선수)
// =========================================================================================

function initMatchLiveTelemetry(matchData, engine) {
    // 1. 상단 점수판 홈/어웨이 로고 삽입
    const homeSlot = document.getElementById('bmhHomeLogoSlot');
    const awaySlot = document.getElementById('bmhAwayLogoSlot');
    if (homeSlot) {
        homeSlot.replaceChildren();
        if (typeof createTeamLogoElement === 'function' && matchData.homeTeam) {
            homeSlot.appendChild(createTeamLogoElement(matchData.homeTeam));
        }
    }
    if (awaySlot) {
        awaySlot.replaceChildren();
        if (typeof createTeamLogoElement === 'function' && matchData.awayTeam) {
            awaySlot.appendChild(createTeamLogoElement(matchData.awayTeam));
        }
    }

    // 2. 경기 전 주목할 선수 (Player to Watch) 선정
    const allSimPlayers = (engine && Array.isArray(engine.players)) ? engine.players : [];
    const userSide = matchData.homeTeam === gameData.selectedTeam ? 'home' : 'away';
    const userPlayers = allSimPlayers.filter(p => p.teamId === userSide);
    const starCandidates = (userPlayers.length > 0 ? userPlayers : allSimPlayers)
        .filter(p => p.position === 'FW' || p.position === 'MF')
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const watchPlayer = starCandidates[0] || allSimPlayers[0] || { name: '에이스', position: 'FW', rating: 82, teamId: userSide };

    const playerActions = {};
    allSimPlayers.forEach(p => {
        playerActions[p.name] = {
            name: p.name,
            teamId: p.teamId,
            position: p.position,
            rating: Math.round(p.rating || 75),
            goals: 0,
            assists: 0,
            shots: 0,
            passes: 0,
            tackles: 0,
            dribbles: 0,
            saves: 0
        };
    });

    matchData.liveStats = {
        possessionTicks: { home: 1, away: 1 },
        possessionPct: { home: 50, away: 50 },
        shots: { home: 0, away: 0 },
        shotsOnTarget: { home: 0, away: 0 },
        fouls: { home: 0, away: 0 },
        tackles: { home: 0, away: 0 },
        passes: { home: 0, away: 0 },
        playerActions,
        playerToWatch: {
            name: watchPlayer.name,
            position: watchPlayer.position,
            rating: Math.round(watchPlayer.rating || 80),
            teamId: watchPlayer.teamId
        },
        currentSpotlight: {
            tag: 'PLAYER TO WATCH',
            name: `${watchPlayer.name} (${watchPlayer.position} · OVR ${Math.round(watchPlayer.rating || 80)})`,
            detail: '오늘 경기 공격 전개의 핵심 키플레이어',
            teamId: watchPlayer.teamId
        },
        lastGoalBanner: null
    };
}

function updateMatchStaminaUI(matchData) {
    if (!matchData || !matchData.engine || !Array.isArray(matchData.engine.players)) return;

    const userSide = matchData.homeTeam === gameData.selectedTeam ? 'home' : 'away';
    const userPlayers = matchData.engine.players.filter(p => p.teamId === userSide);

    const calcAvg = (pos) => {
        const list = userPlayers.filter(p => p.position === pos);
        if (list.length === 0) return 100;
        const sum = list.reduce((acc, p) => acc + (Number.isFinite(p.stamina) ? p.stamina : 100), 0);
        return Math.max(0, Math.min(100, Math.round(sum / list.length)));
    };

    const fwPct = calcAvg('FW');
    const mfPct = calcAvg('MF');
    const dfPct = calcAvg('DF');

    const applyBar = (barId, textId, pct, baseClass) => {
        const barEl = document.getElementById(barId);
        const txtEl = document.getElementById(textId);
        if (txtEl) txtEl.textContent = `${pct}%`;
        if (barEl) {
            barEl.style.width = `${pct}%`;
            let stateCls = 'good';
            if (pct < 45) stateCls = 'low';
            else if (pct < 70) stateCls = 'warn';
            barEl.className = `bmh-stamina-fill ${baseClass} ${stateCls}`;
        }
    };

    applyBar('atkStaminaBar', 'atkStaminaText', fwPct, 'fw');
    applyBar('midStaminaBar', 'midStaminaText', mfPct, 'mf');
    applyBar('defStaminaBar', 'defStaminaText', dfPct, 'df');

    // 레거시 숫자 엘리먼트 호환
    if (document.getElementById('atkStamina')) document.getElementById('atkStamina').textContent = fwPct;
    if (document.getElementById('midStamina')) document.getElementById('midStamina').textContent = mfPct;
    if (document.getElementById('defStamina')) document.getElementById('defStamina').textContent = dfPct;
}

function updateLiveMatchTelemetry(matchData, snapshot, isNewMinute) {
    if (!matchData || !matchData.liveStats || !snapshot) return;
    const ls = matchData.liveStats;
    const enginePlayers = (matchData.engine && matchData.engine.players) ? matchData.engine.players : [];

    const findSideByName = (name) => {
        if (!name) return null;
        if (ls.playerActions[name]) return ls.playerActions[name].teamId;
        const p = enginePlayers.find(u => u.name === name);
        return p ? p.teamId : null;
    };

    const ensureActor = (name) => {
        if (!name) return null;
        if (!ls.playerActions[name]) {
            const p = enginePlayers.find(u => u.name === name);
            ls.playerActions[name] = {
                name,
                teamId: p ? p.teamId : 'home',
                position: p ? p.position : 'MF',
                rating: p ? Math.round(p.rating || 78) : 78,
                goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, dribbles: 0, saves: 0
            };
        }
        return ls.playerActions[name];
    };

    // 1. 실시간 볼 점유율 틱 누적 (패스 비행 중에도 possessionTeam에 동일 가중치 부여)
    if (Array.isArray(snapshot.players)) {
        const holder = snapshot.players.find(p => p.hasBall);
        if (holder && (holder.teamId === 'home' || holder.teamId === 'away')) {
            ls.possessionTicks[holder.teamId] += 1;
        } else if (snapshot.possessionTeam === 'home' || snapshot.possessionTeam === 'away') {
            ls.possessionTicks[snapshot.possessionTeam] += 1;
        }
    }
    const totalPoss = ls.possessionTicks.home + ls.possessionTicks.away;
    ls.possessionPct.home = Math.max(15, Math.min(85, Math.round((ls.possessionTicks.home / totalPoss) * 100)));
    ls.possessionPct.away = 100 - ls.possessionPct.home;

    // 2. 엔진 이벤트 기반 슈팅/패스/태클/파울/선수 활약 누적
    if (Array.isArray(snapshot.events)) {
        snapshot.events.forEach(ev => {
            if (!ev) return;
            if (ev.type === 'goal') {
                const side = ev.team === 'home' || ev.team === 'away' ? ev.team : findSideByName(ev.scorer) || 'home';
                ls.shots[side]++;
                ls.shotsOnTarget[side]++;
                const scorerAct = ensureActor(ev.scorer);
                if (scorerAct) {
                    scorerAct.goals++;
                    scorerAct.shots++;
                }
                if (ev.assister) {
                    const astAct = ensureActor(ev.assister);
                    if (astAct) astAct.assists++;
                }
                ls.lastGoalBanner = {
                    minute: matchData.minute,
                    scorer: ev.scorer,
                    assister: ev.assister || null,
                    teamId: side,
                    timestamp: Date.now()
                };
            } else if (ev.type === 'shoot') {
                // shoot 이벤트는 중거리/원터치 슈팅 시도 연출 로그이며,
                // 실제 슈팅 결과(goal/save/miss/block)에서 슈팅 수가 집계되므로 이중 카운트 방지
                ensureActor(ev.player);
            } else if (ev.type === 'save') {
                const shooterSide = findSideByName(ev.shooter) || 'home';
                ls.shots[shooterSide]++;
                ls.shotsOnTarget[shooterSide]++;
                const sAct = ensureActor(ev.shooter);
                if (sAct) sAct.shots++;
                const gkAct = ensureActor(ev.gk);
                if (gkAct) gkAct.saves++;
            } else if (ev.type === 'miss' || ev.type === 'block') {
                const shooterSide = findSideByName(ev.shooter) || 'home';
                ls.shots[shooterSide]++;
                const sAct = ensureActor(ev.shooter);
                if (sAct) sAct.shots++;
                if (ev.blocker) {
                    const bAct = ensureActor(ev.blocker);
                    if (bAct) bAct.tackles++;
                }
            } else if (ev.type === 'tackle') {
                const side = findSideByName(ev.player) || 'home';
                ls.tackles[side]++;
                const act = ensureActor(ev.player);
                if (act) act.tackles++;
                // 거친 태클/경합 과정에서 일정 확률로 파울 카운트 누적
                if (Math.random() < 0.28) {
                    const foulSide = Math.random() < 0.55 ? (side === 'home' ? 'away' : 'home') : side;
                    ls.fouls[foulSide]++;
                }
            } else if (ev.type === 'pass' || ev.type === 'throughpass') {
                const side = findSideByName(ev.from) || 'home';
                ls.passes[side]++;
                const act = ensureActor(ev.from);
                if (act) act.passes++;
            } else if (ev.type === 'dribble') {
                const act = ensureActor(ev.player);
                if (act) act.dribbles++;
            }
        });
    }

    // 분 변경 시 중원 몸싸움 파울 자연 보정 및 주목할 선수(Spotlight) 갱신
    if (isNewMinute) {
        if (matchData.minute > 0 && matchData.minute % 7 === 0 && Math.random() < 0.55) {
            const fSide = Math.random() < 0.5 ? 'home' : 'away';
            ls.fouls[fSide]++;
        }

        // 실시간 가장 활약도가 높은 선수 계산
        const actors = Object.values(ls.playerActions);
        if (matchData.minute >= 12 && actors.length > 0) {
            const scoredActors = actors.map(a => {
                const impact = (a.goals * 30) + (a.assists * 18) + (a.shots * 5) + (a.tackles * 4) + (a.saves * 6) + (a.dribbles * 3) + (a.passes * 1.2);
                return { ...a, impact };
            }).sort((a, b) => b.impact - a.impact);

            const top = scoredActors[0];
            if (top && top.impact >= 6) {
                let statParts = [];
                if (top.goals > 0) statParts.push(`${top.goals}골`);
                if (top.assists > 0) statParts.push(`${top.assists}도움`);
                if (top.shots > 0 && top.goals === 0) statParts.push(`슈팅 ${top.shots}`);
                if (top.tackles >= 2) statParts.push(`태클 ${top.tackles}`);
                if (top.saves >= 2) statParts.push(`선방 ${top.saves}`);
                if (statParts.length === 0) statParts.push(`패스 ${Math.max(1, top.passes)}회`);

                ls.currentSpotlight = {
                    tag: top.goals > 0 ? 'KEY SCORER' : 'HOT PERFORMER',
                    name: `${top.name} (${top.position}) · ${statParts.join(' / ')}`,
                    detail: `${top.name} (${top.position}) — ${statParts.join(' · ')}`,
                    teamId: top.teamId
                };
            }
        }
    }
}

function updateMatchTelemetryUI(matchData) {
    if (!matchData || !matchData.liveStats) return;
    const ls = matchData.liveStats;

    const pHome = document.getElementById('bmhPossHome');
    const pAway = document.getElementById('bmhPossAway');
    const pFill = document.getElementById('bmhPossFillHome');
    if (pHome) pHome.textContent = `${ls.possessionPct.home}%`;
    if (pAway) pAway.textContent = `${ls.possessionPct.away}%`;
    if (pFill) pFill.style.width = `${ls.possessionPct.home}%`;

    const sHome = document.getElementById('bmhShotsHome');
    const sAway = document.getElementById('bmhShotsAway');
    if (sHome) sHome.textContent = ls.shots.home;
    if (sAway) sAway.textContent = ls.shots.away;

    const fHome = document.getElementById('bmhFoulsHome');
    const fAway = document.getElementById('bmhFoulsAway');
    if (fHome) fHome.textContent = ls.fouls.home;
    if (fAway) fAway.textContent = ls.fouls.away;

    const tHome = document.getElementById('bmhTacklesHome');
    const tAway = document.getElementById('bmhTacklesAway');
    if (tHome) tHome.textContent = ls.tackles.home;
    if (tAway) tAway.textContent = ls.tackles.away;

    const spTag = document.getElementById('bmhSpotlightTag');
    const spName = document.getElementById('bmhSpotlightName');
    if (ls.currentSpotlight) {
        if (spTag) spTag.textContent = ls.currentSpotlight.tag;
        if (spName) spName.textContent = ls.currentSpotlight.name;
    }
}

function showKickoffButton(matchData, engine) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;
    const kickoffInfo = document.createElement('div');
    kickoffInfo.className = 'event-card kickoff-ready';

    const timeDiv = document.createElement('div');
    timeDiv.className = 'event-time';
    timeDiv.textContent = '준비 완료';

    const descDiv = document.createElement('div');
    descDiv.textContent = '경기 시작 준비가 완료되었습니다.';

    const kickoffBtn = document.createElement('button');
    kickoffBtn.id = 'kickoffBtn';
    kickoffBtn.className = 'btn primary';
    kickoffBtn.style.cssText = 'margin-top: 15px; padding: 12px 30px; font-size: 1.1rem; font-weight: bold; width: 100%;';
    kickoffBtn.textContent = '킥오프';

    kickoffInfo.append(timeDiv, descDiv, kickoffBtn);
    eventList.appendChild(kickoffInfo);

    kickoffBtn.addEventListener('click', () => {
        startMatchSimulation(matchData, engine);
        kickoffInfo.remove();
    });
}

function startMatchSimulation(matchData, engine) {
    console.log('[Match] 경기 시뮬레이션 시작');
    matchData.isRunning = true;

    // [신규] 경기 화면(피치) 클릭 시 세리머니 즉시 스킵
    const pitchContainer = document.getElementById('matchVisualizerContainer');
    if (pitchContainer && !pitchContainer._celebrationSkipBound) {
        pitchContainer._celebrationSkipBound = true;
        pitchContainer.addEventListener('click', () => {
            if (window.currentMatchData && window.currentMatchData.isRunning && window.currentMatchData.engine) {
                if (typeof window.currentMatchData.engine.skipCelebration === 'function') {
                    window.currentMatchData.engine.skipCelebration();
                }
            }
        });
    }

    const kickoffEvent = {
        minute: 0,
        type: 'kickoff',
        description: `경기 시작! ${teamNames[matchData.homeTeam]} vs ${teamNames[matchData.awayTeam]}`
    };
    displayEvent(kickoffEvent, matchData);

    simulateMatch(matchData, engine);
}

function simulateMatch(matchData, engine) {
    let tickCount = 0;
    matchData.seconds = 0; // [신규] 초 단위 정밀 시간 계산용
    matchData._lastMinute = -1; // [신규] 중복 체력 소모 방지
    const tickDuration = 80; // [템포 완화] 60ms -> 80ms (약 12.5FPS) : 탁구 같은 핑퐁 속도를 해소하고 눈으로 축구 전술을 여유 있게 감상할 수 있는 최적 템포

    // [최적화] setInterval 대신 setTimeout 재귀 호출 사용
    // 처리 시간이 길어져도 메인 스레드를 차단하지 않도록 함
    function gameLoop() {
        // 경기 종료 상태면 루프 중단
        if (matchData.isEnded && !matchData.isExiting) return;

        // 일시정지 상태면 잠시 대기 후 다시 체크 (폴링)
        if (!matchData.isRunning) {
            matchData.timeoutId = setTimeout(gameLoop, 500);
            return;
        }

        // 1. 경기 종료 체크
        if (matchData.minute >= 90) {
            if (!matchData.isEnded) {
                matchData.isEnded = true;
                endMatch(matchData);

                // [신규] 퇴장 애니메이션 시작
                if (typeof engine.startExitAnimation === 'function') {
                    // 승리 팀 판별 ('home', 'away', or null)
                    let winner = null;
                    if (matchData.homeScore > matchData.awayScore) winner = 'home';
                    else if (matchData.awayScore > matchData.homeScore) winner = 'away';

                    engine.startExitAnimation(winner);
                    matchData.isExiting = true;
                }
            }

            // [신규] 퇴장 애니메이션 진행
            if (matchData.isExiting) {
                const snapshot = engine.updatePostMatch();
                if (window.matchVisualizer) window.matchVisualizer.sync(snapshot);

                if (engine.isExitAnimationDone()) {
                    matchData.isExiting = false;
                    return;
                }
                matchData.timeoutId = setTimeout(gameLoop, 60);
                return;
            }
            return;
        }

        const startTime = performance.now();

        // 2. 엔진 업데이트 (1틱 = 4초)
        // [수정] 분이 바뀔 때만 isNewMinute를 1회 전달하여 체력 소모 중복 호출(골 세리머니 등) 방지
        const isNewMinute = (matchData.minute !== matchData._lastMinute);
        if (isNewMinute) {
            matchData._lastMinute = matchData.minute;
        }
        const snapshot = engine.update(matchData.minute, isNewMinute);

        // [수정] 실시간 스태미나 HUD 및 브로드캐스트 텔레메트리(점유율/파울/주목할 선수) 동기화
        updateLiveMatchTelemetry(matchData, snapshot, isNewMinute);
        updateMatchStaminaUI(matchData);
        updateMatchTelemetryUI(matchData);

        // 3. 비주얼라이저 동기화
        if (window.matchVisualizer) {
            window.matchVisualizer.sync(snapshot);
        }

        // 4. 이벤트 처리 (텍스트 로그 변환 및 점수 업데이트)
        if (snapshot.events && snapshot.events.length > 0) {
            snapshot.events.forEach(engineEvent => {
                // 엔진 이벤트를 텍스트 이벤트로 변환
                const textEvent = convertToTextEvent(engineEvent, matchData);

                if (textEvent) {
                    displayEvent(textEvent, matchData);

                    // [신규] 개인기 시각 효과 연동
                    if (engineEvent.type === 'dribble' && engineEvent.skillId) {
                        if (window.matchVisualizer && window.matchVisualizer.units[engineEvent.player]) {
                            window.matchVisualizer.units[engineEvent.player].triggerSkillEffect(engineEvent.skillId);
                        }
                    }

                    // [신규] 태클 시각 효과 연동
                    if (engineEvent.type === 'tackle') {
                        if (window.matchVisualizer && window.matchVisualizer.units[engineEvent.player]) {
                            window.matchVisualizer.units[engineEvent.player].triggerSkillEffect('TACKLE');
                        }
                    }

                    if (engineEvent.type === 'goal') {
                        if (engineEvent.team === 'home') matchData.homeScore++;
                        else matchData.awayScore++;

                        document.getElementById('scoreDisplay').textContent = `${matchData.homeScore} - ${matchData.awayScore}`;

                        // 진동 효과
                        if (window.customCursorInstance && typeof window.customCursorInstance.triggerVibration === 'function') {
                            window.customCursorInstance.triggerVibration(600, 0.9, 0.6);
                        }
                    }
                }
            });
        }

        // 5. 부상 시스템 체크 (기존 시스템 연동)
        const injuryResult = injurySystem.checkInjury(matchData);
        if (injuryResult.occurred) {
            const event = createInjuryEvent(matchData, injuryResult);
            displayEvent(event, matchData);
            if (injuryResult.isUserTeam) {
                handleForcedSubstitution(injuryResult.player, matchData);
            } else {
                handleAIForcedSubstitution(injuryResult.player, matchData);
            }
            // 부상 발생 시 처리를 위해 루프는 계속 돌되 다음 틱에 isRunning 체크로 대기 상태 진입
        }

        // 6. 시간 업데이트
        tickCount++;

        // [수정] 세리머니/골 직전 연출 중에는 시간 멈춤
        if (!snapshot.isCelebration && !snapshot.isSuspense) {
            matchData.seconds += 4;
            if (matchData.seconds >= 60) {
                matchData.minute++;
                matchData.seconds = matchData.seconds % 60; // 남은 초 이월
                document.getElementById('matchTime').textContent = matchData.minute + '분';
                if (window.ScoreboardUI) {
                    window.ScoreboardUI.updateTime(matchData.minute, matchData.seconds);
                }

                // [신규] AI 팀 교체 타이밍 체크
                checkAISubstitutions(matchData);
            }
        }

        const endTime = performance.now();
        const elapsed = endTime - startTime;

        // [수정] 고속 모드 / 골 직전 연출에 따른 틱 딜레이
        const dramaDelay = getDramaTickDelay(matchData, snapshot);
        const targetDuration = matchData.isFastForward ? 0 : (dramaDelay !== null ? dramaDelay : tickDuration);
        const nextDelay = Math.max(0, targetDuration - elapsed);

        matchData.timeoutId = setTimeout(gameLoop, nextDelay);
    }

    // 루프 시작
    gameLoop();
}


// [헬퍼] 스쿼드 데이터 추출 (엔진 전달용)
function getSquadData(teamKey) {
    if (teamKey === gameData.selectedTeam) {
        return {
            ...gameData.squad,
            squadLines: gameData.squadLines
        };
    } else {
        if (typeof TeamUtils !== 'undefined' && typeof TeamUtils.getOptimalSquadData === 'function') {
            const optimal = TeamUtils.getOptimalSquadData(teamKey);
            if (optimal) return optimal;
        }
        const best11 = getBestEleven(teamKey);
        return {
            gk: best11.find(p => p.position === 'GK'),
            df: best11.filter(p => p.position === 'DF'),
            mf: best11.filter(p => p.position === 'MF'),
            fw: best11.filter(p => p.position === 'FW')
        };
    }
}

// [신규] 해설 멘트 데이터 및 생성 함수
const MatchCommentaryData = {
    goal: [
        "골입니다! {team}의 {scorer}가 마무리합니다!",
        "{scorer}, 침착한 마무리로 골망을 흔듭니다!",
        "결정적인 골입니다! {scorer}의 슈팅이 그대로 들어갑니다!",
        "{scorer}, 박스 안에서 기회를 놓치지 않습니다!"
    ],
    miss: [
        "{shooter}의 슈팅이 골문을 벗어납니다.",
        "{shooter}, 좋은 기회를 살리지 못합니다.",
        "{shooter}의 슈팅이 아쉽게 빗나갑니다."
    ],
    dribble: [
        "{player}, 드리블로 전진합니다.",
        "{player}가 수비를 흔들며 공간을 만듭니다.",
        "{player}, 공을 몰고 올라갑니다."
    ],
    tackle: [
        "{player}, 정확한 태클로 공을 따냅니다.",
        "{player}가 중요한 순간에 수비에 성공합니다.",
        "{player}, 침착하게 패스를 차단합니다."
    ],
    throughpass: [
        "{from}, 수비 라인 뒤로 날카로운 패스를 찔러줍니다!",
        "{to}에게 결정적인 침투 패스가 연결됩니다!",
        "{from}의 패스가 수비 사이를 가릅니다!"
    ],
    save: [
        "{gk}, 좋은 선방입니다!",
        "{gk}가 슈팅을 막아냅니다!",
        "{gk}, 골문을 지켜냅니다!"
    ],
    block: [
        "{blocker}, 몸을 던져 슈팅을 막아냅니다!",
        "{shooter}의 슈팅이 수비벽에 막힙니다.",
        "{blocker}가 중요한 위치에서 길목을 지킵니다."
    ],
    preGoalSuspense: [
        "{desc}",
        "{desc}",
        "{desc}"
    ]
};

function getRandomCommentary(type, data) {
    const templates = MatchCommentaryData[type];
    if (!templates) return "경기 진행 중..";
    let template = templates[Math.floor(Math.random() * templates.length)];
    for (const key in data) {
        template = template.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return template;
}

// [헬퍼] 경기 결과를 SNS/기록/메일 등 하위 시스템용으로 정규화
function buildMatchResultPayload(matchData) {
    if (!matchData) return null;

    const resultEvents = (matchData.events || []).filter(e =>
        e && !['preGoalSuspense', 'kickoff', 'final'].includes(e.type)
    );
    const goalEvents = resultEvents.filter(e => e.type === 'goal').map(g => ({
        minute: g.minute,
        type: 'goal',
        scorer: g.scorer,
        assister: g.assister || null,
        team: g.team,
        teamKey: g.teamKey || resolveGoalTeamKey(g, matchData),
        description: g.description
    }));

    const isUserHome = matchData.homeTeam === gameData.selectedTeam;
    const userScore = isUserHome ? matchData.homeScore : matchData.awayScore;
    const oppScore = isUserHome ? matchData.awayScore : matchData.homeScore;
    const userResult = userScore > oppScore ? 'win' : (userScore < oppScore ? 'loss' : 'draw');

    return {
        ...matchData,
        events: resultEvents,
        goalEvents,
        totalGoals: matchData.homeScore + matchData.awayScore,
        userTeam: gameData.selectedTeam,
        opponentTeam: gameData.currentOpponent,
        userScore,
        oppScore,
        userResult,
        isUserHome,
        isHighScoring: (matchData.homeScore + matchData.awayScore) >= 5,
        hadDrama: (matchData.events || []).some(e => e.type === 'preGoalSuspense')
    };
}

function resolveGoalTeamKey(goalEvent, matchData) {
    if (goalEvent.teamKey) return goalEvent.teamKey;
    if (goalEvent.team === teamNames[matchData.homeTeam]) return matchData.homeTeam;
    if (goalEvent.team === teamNames[matchData.awayTeam]) return matchData.awayTeam;
    if (goalEvent.team === gameData.selectedTeam) return gameData.selectedTeam;
    return goalEvent.team === teamNames[gameData.selectedTeam]
        ? gameData.selectedTeam
        : gameData.currentOpponent;
}

window.buildMatchResultPayload = buildMatchResultPayload;

// [헬퍼] 엔진 이벤트를 텍스트 이벤트로 변환
function convertToTextEvent(engineEvent, matchData) {
    const homeName = teamNames[matchData.homeTeam];
    const awayName = teamNames[matchData.awayTeam];
    const eventTeamKey = engineEvent.team === 'home' ? matchData.homeTeam : matchData.awayTeam;
    const eventTeamName = engineEvent.team === 'home' ? homeName : awayName;

    if (engineEvent.type === 'goal') {
        const data = { scorer: engineEvent.scorer, team: eventTeamName };
        let description = getRandomCommentary('goal', data);
        if (engineEvent.assister) description += ` (도움: ${engineEvent.assister})`;
        return {
            minute: matchData.minute,
            type: 'goal',
            team: eventTeamName,
            teamKey: eventTeamKey,
            scorer: engineEvent.scorer,
            assister: engineEvent.assister || null,
            description: description
        };
    } else if (engineEvent.type === 'miss') {
        const data = { shooter: engineEvent.shooter };
        return {
            minute: matchData.minute,
            type: 'miss',
            description: getRandomCommentary('miss', data)
        };
    } else if (engineEvent.type === 'dribble') {
        const data = { player: engineEvent.player };
        return {
            minute: matchData.minute,
            type: 'dribble',
            // 엔진에서 보낸 전용 desc(개인기 멘트)가 있으면 그것을 사용, 없으면 일반 멘트 사용
            description: engineEvent.desc || getRandomCommentary('dribble', data)
        };
    } else if (engineEvent.type === 'tackle') {
        const data = { player: engineEvent.player };
        return {
            minute: matchData.minute,
            type: 'tackle',
            description: getRandomCommentary('tackle', data)
        };
    } else if (engineEvent.type === 'pass') {
        // 패스는 너무 자주 나오므로 30% 확률로만 로그 출력
        if (Math.random() < 0.3) {
            // 패스의 성공/실패 여부가 엔진 desc에 포함되어 있으므로 engineEvent.desc를 우선 사용
            return {
                minute: matchData.minute,
                type: 'pass',
                description: engineEvent.desc || `${engineEvent.from} → ${engineEvent.to} 패스`
            };
        }
        return null;
    } else if (engineEvent.type === 'throughpass') {
        // [신규] 스루패스는 중요한 이벤트이므로 항상 출력
        const data = { from: engineEvent.from, to: engineEvent.to };
        return {
            minute: matchData.minute,
            type: 'throughpass',
            description: getRandomCommentary('throughpass', data)
        };
    } else if (engineEvent.type === 'save') {
        const data = { gk: engineEvent.gk, shooter: engineEvent.shooter };
        return {
            minute: matchData.minute,
            type: 'save', // CSS ?ㅽ????꾩슂 (?놁쑝硫??쇰컲 ?띿뒪??
            description: getRandomCommentary('save', data)
        };
    } else if (engineEvent.type === 'block') {
        const data = { blocker: engineEvent.blocker, shooter: engineEvent.shooter };
        return {
            minute: matchData.minute,
            type: 'block',
            description: getRandomCommentary('block', data)
        };
    } else if (engineEvent.type === 'shoot') {
        return {
            minute: matchData.minute,
            type: 'shoot',
            description: engineEvent.desc || `${engineEvent.player || '공격수'}의 날카로운 슈팅!`
        };
    } else if (engineEvent.type === 'preGoalSuspense') {
        const desc = engineEvent.desc || '결정적인 순간이 다가옵니다...';
        return {
            minute: matchData.minute,
            type: 'preGoalSuspense',
            description: getRandomCommentary('preGoalSuspense', { desc })
        };
    } else if (engineEvent.type === 'tactical_change' || engineEvent.type === 'notice') {
        return {
            minute: matchData.minute,
            type: engineEvent.type,
            description: engineEvent.desc
        };
    } else if (engineEvent.type === 'offside') {
        return {
            minute: matchData.minute,
            type: 'offside',
            description: engineEvent.desc || '🚩 부심의 깃발이 올라갑니다! 오프사이드 반칙입니다.'
        };
    }
    return null;
}

function displayEvent(event, matchData) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;

    eventList.replaceChildren();

    const card = document.createElement('div');
    card.className = `event-card ${event.type}`;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'event-time';
    timeSpan.textContent = `${event.minute}분`;

    const descSpan = document.createElement('span');
    descSpan.className = 'event-desc';
    descSpan.textContent = event.description;

    card.append(timeSpan, descSpan);
    eventList.appendChild(card);

    if (event.type === 'preGoalSuspense' && window.customCursorInstance && typeof window.customCursorInstance.triggerVibration === 'function') {
        window.customCursorInstance.triggerVibration(180, 0.35, 0.25);
    }

    matchData.events.push(event);
}

// =========================================================================================
// [PART 4] 경기 종료 및 후처리
// =========================================================================================

function endMatch(matchData) {
    console.log('[Match] 경기 종료 처리');
    document.getElementById('endMatchBtn').style.display = 'block';
    document.getElementById('substituteBtn').style.display = 'none';
    const liveTacBar = document.getElementById('liveTacticsBar');
    if (liveTacBar) liveTacBar.style.display = 'none';

    // 진동 피드백
    if (window.customCursorInstance && typeof window.customCursorInstance.triggerVibration === 'function') {
        window.customCursorInstance.triggerVibration(2000, 1.0, 1.0);
    }

    // 결과 산정
    const isUserHome = matchData.homeTeam === gameData.selectedTeam;
    const userScore = isUserHome ? matchData.homeScore : matchData.awayScore;
    const oppScore = isUserHome ? matchData.awayScore : matchData.homeScore;

    let result = userScore > oppScore ? '승리' : (userScore < oppScore ? '패배' : '무승부');
    let points = result === '승리' ? 3 : (result === '무승부' ? 1 : 0);

    // [신규] 일회성 이벤트 버프/디버프 원상 복구 (경기 종료 후)
    if (gameData && gameData.tempEventBuffs) {
        console.log('이벤트 일회성 버프 원상 복구:', gameData.tempEventBuffs);

        // 사기 복구
        if (gameData.tempEventBuffs.morale) {
            if (window.GameState) {
                window.GameState.adjustTeamMorale(-gameData.tempEventBuffs.morale);
            } else {
                gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale - gameData.tempEventBuffs.morale));
            }
        }

        // 선수 능력치 복구
        if (gameData.tempEventBuffs.players && gameData.tempEventBuffs.players.length > 0) {
            const teamPlayers = window.teams ? window.teams[gameData.selectedTeam] : null;
            if (teamPlayers) {
                gameData.tempEventBuffs.players.forEach(buff => {
                    const player = teamPlayers.find(p => p.name === buff.name);
                    if (player) {
                        player.rating = Math.max(1, Math.min(99, player.rating - buff.boost));
                    }
                });
            }
        }

        // 버프 기록 초기화
        gameData.tempEventBuffs = { morale: 0, players: [] };
    }

    // 자금 및 사기 보상
    if (result === '승리') {
        if (window.GameState) {
            window.GameState.addTeamMoney(50);
            window.GameState.adjustTeamMorale(5);
        } else {
            gameData.teamMoney += 50;
            gameData.teamMorale = Math.min(100, gameData.teamMorale + 5);
        }
    } else if (result === '무승부') {
        if (window.GameState) {
            window.GameState.addTeamMoney(15);
        } else {
            gameData.teamMoney += 15;
        }
    } else {
        if (window.GameState) {
            window.GameState.addTeamMoney(10);
            window.GameState.adjustTeamMorale(-3);
        } else {
            gameData.teamMoney += 10;
            gameData.teamMorale = Math.max(0, gameData.teamMorale - 3);
        }
    }

    // 스폰서 보너스
    if (gameData.currentSponsor) {
        if (result === '승리') {
            if (window.GameState) window.GameState.addTeamMoney(gameData.currentSponsor.payPerWin);
            else gameData.teamMoney += gameData.currentSponsor.payPerWin;
        }
        else if (result === '패배') {
            if (window.GameState) window.GameState.addTeamMoney(gameData.currentSponsor.payPerLoss);
            else gameData.teamMoney += gameData.currentSponsor.payPerLoss;
        }
        else {
            const drawBonus = Math.floor(gameData.currentSponsor.payPerWin / 2);
            if (window.GameState) window.GameState.addTeamMoney(drawBonus);
            else gameData.teamMoney += drawBonus;
        }
    }

    // 리그 데이터 업데이트 (FA컵, UCL, 플레이오프가 아닐 때만 정규 리그 순위표 반영)
    if (!gameData.isFACupMatch && !gameData.isUCLMatch && !gameData.isPlayoffMatch) {
        updateLeagueData(matchData, points);
    }
    if (window.GameState) window.GameState.incrementMatchesPlayed();
    else gameData.matchesPlayed++;

    // 감독 성과 기록
    if (typeof managerSystem !== 'undefined' && gameData.managerId) {
        managerSystem.updateManagerStats(gameData.managerId, {
            win: result === '승리',
            draw: result === '무승부',
            loss: result === '패배'
        });
    }

    // [신규] 스타디움 매치데이 관중 및 수익 정산
    let matchdayReport = null;
    if (isUserHome && typeof stadiumSystem !== 'undefined') {
        matchdayReport = stadiumSystem.processMatchdayRevenue(matchData);
        if (matchdayReport && typeof mailManager !== 'undefined') {
            const selloutTxt = matchdayReport.isSellout ? " (★전석 매진!)" : "";
            mailManager.addMail(
                `[매치데이 수익] ${teamNames[matchData.awayTeam] || matchData.awayTeam}전 관중 및 수입 결산`,
                '구단 재정국',
                `경기장: ${matchdayReport.stadiumName}\n` +
                `- 관중 수: ${matchdayReport.attendance.toLocaleString()}명 (${matchdayReport.occupancyRate}%)${selloutTxt}\n` +
                `- 티켓 수입: +${matchdayReport.ticketRevenue}억원\n` +
                (matchdayReport.skyboxRevenue > 0 ? `- VIP 스카이박스: +${matchdayReport.skyboxRevenue}억원\n` : '') +
                (matchdayReport.megastoreRevenue > 0 ? `- 공식 메가스토어: +${matchdayReport.megastoreRevenue}억원\n` : '') +
                `------------------------------------\n` +
                `총 매치데이 입금액: +${matchdayReport.totalRevenue}억원\n\n구단 금고에 정상 입금되었습니다.`
            );
        }
    }

    // [신규] 전술 숙련도(Familiarity) 증가 로직 (+5%)
    const currentTac = normalizeTacticKey(gameData.currentTactic || 'balanced');
    gameData.currentTactic = currentTac;
    const prevMastery = getTacticMasteryPct(currentTac);
    gameData.tacticMastery[currentTac] = Math.min(100, prevMastery + 5);
    if (typeof window.updateMatchTabCurrentTacticDisplay === 'function') {
        window.updateMatchTabCurrentTacticDisplay();
    }
    // 理쒖쥌 硫붿떆吏
    const strengthDiff = matchData.strengthDiff || { userAdvantage: false };
    let finalMsg = `경기 종료! ${result} (${userScore}-${oppScore})`;
    if ((result === '승리' && !strengthDiff.userAdvantage) || (result === '패배' && strengthDiff.userAdvantage)) {
        finalMsg += result === '승리' ? `\n 대이변! 불리한 전력을 뒤집고 승리!` : `\n 충격! 유리한 경기에서 패배...`;
    }
    if (matchdayReport) {
        finalMsg += `\n🏟️ 관중: ${matchdayReport.attendance.toLocaleString()}명 (매치데이 수익 +${matchdayReport.totalRevenue}억원)`;
    }

    const finalEvent = {
        minute: 90,
        type: 'final',
        description: finalMsg
    };
    displayEvent(finalEvent, matchData);

    // ?ㅽ룿??泥섎━ (寃쎄린 寃곌낵 ?곕룞)
    if (typeof window.processSponsorAfterMatch === 'function') {
        const matchResult = result === '승리' ? 'win' : result === '패배' ? 'loss' : 'draw';
        window.processSponsorAfterMatch(matchResult);
    }

    // 후처리 시스템용 정규화 payload
    const resultPayload = buildMatchResultPayload(matchData);
    matchData.resultPayload = resultPayload;

    // [복구] 메일 시스템 연동 (경기 결과 및 이적 제안)
    if (!gameData.isWorldCupMode && typeof mailManager !== 'undefined') {
        mailManager.sendMatchResultMail(resultPayload);
        mailManager.checkTransferOffer();
    }

    // 踰꾪듉 ?대깽???곌껐
    const ratings = calculateMatchRatings(matchData);

    // [?좉퇋] ?좎? ? ?됱젏 湲곕줉 ?쒖뒪?쒖뿉 ?깅줉 (踰좎뒪??11 ?좎젙??
    if (typeof recordsSystem !== 'undefined') {
        recordsSystem.processMatchRatings(ratings, matchData);
    }

    document.getElementById('endMatchBtn').onclick = () => {
        showMatchResultModal(matchData, ratings, result, userScore, oppScore, matchData.strengthDiff);
    };

    // [개편] 스카우터 10경기 주기 유망주 발굴 처리 (능동적 해지 전까지 영구 유지)
    if (!gameData.isWorldCupMode && gameData.hiredScout && typeof scoutingSystem !== 'undefined') {
        gameData.hiredScout.progressMatches = (gameData.hiredScout.progressMatches || 0) + 1;
        const targetInterval = gameData.hiredScout.targetInterval || 10;

        if (gameData.hiredScout.progressMatches >= targetInterval) {
            gameData.hiredScout.progressMatches = 0;
            const discovered = scoutingSystem.discoverYouthPlayer();
            if (discovered) {
                const tierDesc = (typeof POTENTIAL_TIERS !== 'undefined' && POTENTIAL_TIERS[discovered.potentialTier]) ? POTENTIAL_TIERS[discovered.potentialTier].desc : '';
                const scoutObj = scoutingSystem.scouts[gameData.hiredScout.tier];
                const scoutName = scoutObj ? scoutObj.name : '스카우터';

                // 알림 및 메일 발송
                setTimeout(() => {
                    alert(`🌟 [유스 스카우트 보고서]\n${scoutName}이(가) 10경기 탐색 끝에 새로운 유망주를 발굴했습니다!\n\n` +
                        `선수: ${discovered.name} (${discovered.position}, ${discovered.age}세)\n` +
                        `현재 능력치: OVR ${discovered.rating}\n` +
                        `잠재력 등급: [${discovered.potentialName}] (최대 OVR ~${discovered.maxPotential})\n` +
                        `평가: ${tierDesc}`);
                    if (typeof displayYouthPlayers === 'function') displayYouthPlayers();
                    if (typeof displayScoutingScreen === 'function') displayScoutingScreen();
                }, 1200);

                if (typeof mailManager !== 'undefined') {
                    mailManager.addMail(
                        `[유스 발굴] ${discovered.name} (${discovered.potentialName}) 유망주 입단 보고서`,
                        scoutName,
                        `감독님, 지난 10경기 동안 전 세계 각지를 탐색한 끝에 구단의 미래를 책임질 유망주를 발굴했습니다!\n\n` +
                        `- 선수명: ${discovered.name}\n` +
                        `- 포지션: ${discovered.position} | 나이: ${discovered.age}세\n` +
                        `- 현재 능력치: OVR ${discovered.rating}\n` +
                        `- 잠재력 등급: [${discovered.potentialName}] (예상 포텐셜: ~${discovered.maxPotential})\n` +
                        `- 스카우터 코멘트: ${tierDesc}\n\n` +
                        `해당 선수는 현재 [유스팀]에 등록되어 있으며, 언제든지 1군 스쿼드로 콜업하여 훈련 및 실전 경기에 투입할 수 있습니다.`
                    );
                }
            }
        }
    }

    // ?꾩쿂由?(?깆옣, 遺???뚮났 ??
    if (typeof processPostMatchGrowth === 'function') setTimeout(processPostMatchGrowth, 1000);

    // [以묒슂] 媛쒖씤湲곕줉 ?낅뜲?댄듃 諛?AI ?쒕??덉씠???ㅽ뻾 (simulateOtherMatches ?泥?
    if (!gameData.isFACupMatch && !gameData.isUCLMatch && !gameData.isPlayoffMatch) {
        if (typeof updateRecordsAfterMatch === 'function') {
            updateRecordsAfterMatch(resultPayload);
        }
    }

    injurySystem.removeInjuredFromSquad();

    // [복구] 임시 스탯 초기화
    if (gameData.temporaryStats) {
        if (window.GameState) window.GameState.clearTemporaryStats();
        else gameData.temporaryStats = {};
    }

    // 다음 라운드 준비 (플레이오프/컵 대회 경기면 결과 처리 후 리그 라운드는 유지)
    if (gameData.isPlayoffMatch) {
        if (gameData.isMLSPlayoffMatch && typeof MLSPlayoffManager !== 'undefined') {
            MLSPlayoffManager.handleUserMatchEnd(matchData);
        } else if (typeof EFLPlayoffManager !== 'undefined') {
            EFLPlayoffManager.handleUserMatchEnd(matchData);
        }
        gameData.isPlayoffMatch = false;
        gameData.isMLSPlayoffMatch = false;
        setNextOpponent();
    } else if ((gameData.isFACupMatch || gameData.isUCLMatch) && typeof cupCompetitionManager !== 'undefined') {
        cupCompetitionManager.handleUserMatchEnd(matchData);
        gameData.isFACupMatch = false;
        gameData.isUCLMatch = false;
        setNextOpponent();
    } else {
        if (window.GameState) window.GameState.advanceRound();
        else gameData.currentRound++;
        setNextOpponent();
    }

    // [?섏젙] 泥대젰 ?뚮났 ?쒖뒪??媛쒗렪 (媛쒕퀎 ?좎닔 ?⑥쐞)
    if (matchData.engine && matchData.engine.players && gameData.selectedTeam) {
        const userTeamKey = gameData.selectedTeam;
        const userPlayers = teams[userTeamKey];

        // ?ъ슜?먯쓽 ???home?몄? away?몄? ?뺤씤
        const userSide = matchData.homeTeam === userTeamKey ? 'home' : 'away';
        const playedPlayerNames = new Set();

        // 1. 寃쎄린 ???좎닔 泥대젰 ?낅뜲?댄듃
        matchData.engine.players.forEach(simPlayer => {
            if (simPlayer.teamId === userSide) {
                const realPlayer = userPlayers.find(p => p.name === simPlayer.name);
                if (realPlayer) {
                    playedPlayerNames.add(realPlayer.name);

                    const remaining = simPlayer.stamina;

                    // [蹂듦뎄] 泥대젰 ?뚮났 濡쒖쭅 (?뚮え??泥대젰????83% ?뚮났)
                    // ?? ?붿뿬 40(?뚮え 60) -> ?뚮났 50 -> 寃곌낵 90
                    // 출전 선수: 경기 종료 후 휴식 회복(+18) 부여 (최대 100)
                    // 예: 90분 풀타임 45 잔여 시 -> 63으로 다음 경기 진입 (로테이션 관리 필요)
                    const recovered = Math.min(100, Math.max(15, Math.round(remaining + 18)));

                    realPlayer.condition = recovered;
                }
            }
        });

        // 2. 경기 미출전 선수 컨디션 회복 (+25)
        userPlayers.forEach(p => {
            if (!playedPlayerNames.has(p.name)) {
                const current = p.condition !== undefined ? p.condition : 100;
                p.condition = Math.min(100, current + 30);
            }
        });
    }

    // ?쒖쫵 醫낅즺 諛????泥섎━
    if (window.GameEventBus) {
        window.GameEventBus.emit('match:end', resultPayload);
    }

    setTimeout(() => {
        if (typeof processRetirementsAndReincarnations === 'function') processRetirementsAndReincarnations();
        checkSeasonEnd();
    }, 1000);
}

function updateLeagueData(matchData, points) {
    let uLId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(gameData.selectedTeam) : null;
    let tTable = (uLId && gameData.leagueData && gameData.leagueData[uLId]) ? gameData.leagueData[uLId] : (gameData.leagueData ? gameData.leagueData[`division${gameData.currentLeague}`] : null);
    if (!tTable) return;
    const userData = tTable[gameData.selectedTeam];
    const oppData = tTable[gameData.currentOpponent];

    if (!userData || !oppData) return;

    const isUserHome = matchData.homeTeam === gameData.selectedTeam;
    const myScore = isUserHome ? matchData.homeScore : matchData.awayScore;
    const oppScore = isUserHome ? matchData.awayScore : matchData.homeScore;

    // ?좎? ? ?낅뜲?댄듃
    userData.matches++;
    userData.goalsFor += myScore;
    userData.goalsAgainst += oppScore;
    userData.points += points;
    if (points === 3) userData.wins++;
    else if (points === 1) userData.draws++;
    else userData.losses++;

    // ?곷? ? ?낅뜲?댄듃
    oppData.matches++;
    oppData.goalsFor += oppScore;
    oppData.goalsAgainst += myScore;
    if (oppScore > myScore) {
        oppData.wins++;
        oppData.points += 3;
    } else if (oppScore === myScore) {
        oppData.draws++;
        oppData.points += 1;
    } else {
        oppData.losses++;
    }

    // [신규] 스케줄 객체에 유저 경기 스코어 저장 (경기 일정 뷰어 연동)
    if (gameData.schedule) {
        const sKey = (uLId && gameData.schedule[uLId]) ? uLId : ('division' + gameData.currentLeague);
        const lSched = gameData.schedule[sKey];
        const rIdx = (gameData.currentRound || 1) - 1;
        if (lSched && lSched[rIdx]) {
            const mObj = lSched[rIdx].find(m => m && (m.home === gameData.selectedTeam || m.away === gameData.selectedTeam));
            if (mObj) {
                mObj.homeScore = matchData.homeScore;
                mObj.awayScore = matchData.awayScore;
                mObj.played = true;
            }
        }
    }
}

// =========================================================================================
// [PART 5] 공식 기자회견 (Press Conference) 및 평점 시스템
// =========================================================================================

let currentPressState = {
    questions: [],
    currentIndex: 0,
    totalMoraleDelta: 0,
    selectedHeadlines: [],
    result: '무승부',
    userScore: 0,
    opponentScore: 0,
    oppTeamName: '상대 구단',
    userTeamName: '우리 구단',
    momName: null
};

function renderPressBackdropWall(userTeamKey) {
    const wall = document.getElementById('pressBackdropWall');
    if (!wall) return;
    wall.replaceChildren();

    const leagueId = (typeof LeagueManager !== 'undefined' && LeagueManager.getLeagueIdByTeam)
        ? LeagueManager.getLeagueIdByTeam(userTeamKey)
        : 'premier_league';
    const leagueCfg = (typeof LEAGUES_CONFIG !== 'undefined' && LEAGUES_CONFIG[leagueId])
        ? LEAGUES_CONFIG[leagueId]
        : null;

    let compLabel = leagueCfg ? leagueCfg.id.replace('_', ' ').toUpperCase() : 'OFFICIAL LEAGUE';
    if (gameData.isMLSPlayoffMatch) compLabel = 'MLS CUP PLAYOFFS';
    else if (gameData.isPlayoffMatch) compLabel = 'EFL PLAYOFF';
    else if (gameData.isUCLMatch) compLabel = 'CHAMPIONS LEAGUE';
    else if (gameData.isFACupMatch) compLabel = 'OFFICIAL FA CUP';
    else if (gameData.currentLeague === 0) compLabel = 'LEGEND LEAGUE';

    const teamLabel = (typeof teamNames !== 'undefined' && teamNames[userTeamKey])
        ? teamNames[userTeamKey]
        : (userTeamKey || 'CLUB');

    const totalTiles = 48;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < totalTiles; i++) {
        const tile = document.createElement('div');
        const isTeamTile = (i % 2 === 0);
        tile.className = `press-wall-tile ${isTeamTile ? 'team-tile' : 'comp-tile'}`;

        if (isTeamTile) {
            if (typeof createTeamLogoElement === 'function' && userTeamKey) {
                const logoEl = createTeamLogoElement(userTeamKey);
                logoEl.classList.add('press-wall-logo');
                tile.appendChild(logoEl);
            }
            const txt = document.createElement('span');
            txt.className = 'press-wall-text';
            txt.textContent = teamLabel;
            tile.appendChild(txt);
        } else {
            if (!gameData.isUCLMatch && !gameData.isFACupMatch && typeof createLeagueLogoElement === 'function' && leagueCfg) {
                const lLogo = createLeagueLogoElement(leagueId, 28);
                if (lLogo && lLogo.tagName === 'IMG') {
                    lLogo.classList.add('press-wall-logo');
                    tile.appendChild(lLogo);
                }
            } else {
                const badge = document.createElement('span');
                badge.className = 'press-wall-trophy';
                badge.textContent = gameData.isUCLMatch ? '★ UCL' : (gameData.isFACupMatch ? '🏆 CUP' : '⚽');
                tile.appendChild(badge);
            }
            const txt = document.createElement('span');
            txt.className = 'press-wall-text comp';
            txt.textContent = compLabel;
            tile.appendChild(txt);
        }
        frag.appendChild(tile);
    }

    wall.appendChild(frag);
}

function renderPressHeaderAndSummary(result, userScore, opponentScore, matchData, ratings) {
    const userTeamKey = gameData.selectedTeam;
    const oppTeamKey = matchData
        ? (matchData.homeTeam === userTeamKey ? matchData.awayTeam : matchData.homeTeam)
        : gameData.currentOpponent;

    const leagueId = (typeof LeagueManager !== 'undefined' && LeagueManager.getLeagueIdByTeam)
        ? LeagueManager.getLeagueIdByTeam(userTeamKey)
        : 'premier_league';
    const leagueCfg = (typeof LEAGUES_CONFIG !== 'undefined' && LEAGUES_CONFIG[leagueId])
        ? LEAGUES_CONFIG[leagueId]
        : null;

    const compNameEl = document.getElementById('pressCompName');
    if (compNameEl) {
        if (gameData.isUCLMatch) {
            compNameEl.textContent = 'UEFA CHAMPIONS LEAGUE · OFFICIAL PRESS CONFERENCE';
        } else if (gameData.isFACupMatch) {
            compNameEl.textContent = 'OFFICIAL FA CUP · POST-MATCH MEDIA BRIEFING';
        } else if (leagueCfg) {
            compNameEl.textContent = `${leagueCfg.name} · R${Math.max(1, (gameData.currentRound || 2) - 1)} 공식 기자회견`;
        } else {
            compNameEl.textContent = 'OFFICIAL POST-MATCH PRESS CONFERENCE';
        }
    }

    const homeKey = matchData ? matchData.homeTeam : userTeamKey;
    const awayKey = matchData ? matchData.awayTeam : oppTeamKey;
    const hScore = matchData ? matchData.homeScore : userScore;
    const aScore = matchData ? matchData.awayScore : opponentScore;

    const homeSide = document.getElementById('pressHomeSide');
    const awaySide = document.getElementById('pressAwaySide');
    const scorePill = document.getElementById('pressScorePill');

    if (homeSide) {
        homeSide.replaceChildren();
        if (typeof createTeamLogoElement === 'function' && homeKey) {
            homeSide.appendChild(createTeamLogoElement(homeKey));
        }
        const span = document.createElement('span');
        span.textContent = (typeof teamNames !== 'undefined' && teamNames[homeKey]) ? teamNames[homeKey] : homeKey;
        homeSide.appendChild(span);
    }

    if (awaySide) {
        awaySide.replaceChildren();
        const span = document.createElement('span');
        span.textContent = (typeof teamNames !== 'undefined' && teamNames[awayKey]) ? teamNames[awayKey] : awayKey;
        awaySide.appendChild(span);
        if (typeof createTeamLogoElement === 'function' && awayKey) {
            awaySide.appendChild(createTeamLogoElement(awayKey));
        }
    }

    if (scorePill) {
        scorePill.textContent = `${hScore} - ${aScore}`;
        scorePill.className = `press-score-pill ${result === '승리' ? 'win' : result === '패배' ? 'loss' : 'draw'}`;
    }

    const momNameEl = document.getElementById('pressMomName');
    if (momNameEl) {
        if (ratings && ratings.mom && ratings.mom.player) {
            const momP = ratings.mom.player;
            const statsTxt = ratings.mom.goals > 0 ? ` · ${ratings.mom.goals}골` : (ratings.mom.assists > 0 ? ` · ${ratings.mom.assists}도움` : '');
            momNameEl.textContent = `${momP.name} (평점 ${ratings.mom.rating}${statsTxt})`;
        } else {
            momNameEl.textContent = '집계 완료';
        }
    }
}

function startInterview(result, userScore, opponentScore, strengthDiff, matchData = null, ratings = null) {
    // 부상자 업데이트
    injurySystem.updateInjuries();
    injurySystem.removeInjuredFromSquad();

    showScreen('interviewScreen');

    const userTeamKey = gameData.selectedTeam;
    const oppTeamKey = matchData
        ? (matchData.homeTeam === userTeamKey ? matchData.awayTeam : matchData.homeTeam)
        : gameData.currentOpponent;

    renderPressBackdropWall(userTeamKey);
    renderPressHeaderAndSummary(result, userScore, opponentScore, matchData, ratings);

    const qaStage = document.getElementById('pressQAStage');
    const summaryPanel = document.getElementById('pressResultSummaryPanel');
    const skipBtn = document.getElementById('pressNoCommentBtn');
    const stepIndicator = document.getElementById('pressStepIndicator');

    if (qaStage) qaStage.style.display = 'block';
    if (summaryPanel) summaryPanel.style.display = 'none';
    if (skipBtn) {
        skipBtn.style.display = 'inline-flex';
        skipBtn.onclick = () => finishPressConference(true);
    }
    if (stepIndicator) stepIndicator.style.display = 'inline-flex';

    const sequence = buildPressConferenceSequence(result, userScore, opponentScore, strengthDiff, matchData, ratings);

    currentPressState = {
        questions: sequence,
        currentIndex: 0,
        totalMoraleDelta: 0,
        selectedHeadlines: [],
        result,
        userScore,
        opponentScore,
        oppTeamName: (typeof teamNames !== 'undefined' && teamNames[oppTeamKey]) ? teamNames[oppTeamKey] : '상대 구단',
        userTeamName: (typeof teamNames !== 'undefined' && teamNames[userTeamKey]) ? teamNames[userTeamKey] : '우리 구단',
        momName: (ratings && ratings.mom && ratings.mom.player) ? ratings.mom.player.name : null
    };

    renderCurrentPressQuestion();
}

function renderCurrentPressQuestion() {
    const idx = currentPressState.currentIndex;
    const total = currentPressState.questions.length;
    const q = currentPressState.questions[idx];
    if (!q) {
        finishPressConference(false);
        return;
    }

    const stepEl = document.getElementById('pressStepIndicator');
    if (stepEl) stepEl.textContent = `QUESTION ${idx + 1} / ${total}`;

    const outletEl = document.getElementById('pressMediaOutlet');
    const reporterEl = document.getElementById('pressReporterName');
    if (outletEl) outletEl.textContent = q.outlet || 'FOOTBALL JOURNAL';
    if (reporterEl) reporterEl.textContent = q.reporter || '현장 취재진 질문';

    const qEl = document.getElementById('interviewQuestion');
    if (qEl) qEl.textContent = `"${q.question}"`;

    const btns = document.querySelectorAll('.interview-btn');
    q.options.forEach((opt, i) => {
        if (btns[i]) {
            btns[i].dataset.morale = opt.morale;
            btns[i].dataset.headline = opt.headline || opt.text;
            btns[i].style.display = 'flex';
            btns[i].replaceChildren();

            const numSpan = document.createElement('span');
            numSpan.className = 'press-opt-num';
            numSpan.textContent = `0${i + 1}`;

            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'press-opt-body';

            const metaRow = document.createElement('div');
            metaRow.className = 'press-opt-meta';

            const toneBadge = document.createElement('span');
            toneBadge.className = `press-tone-badge ${opt.toneClass || 'calm'}`;
            toneBadge.textContent = opt.tone || '공식 답변';

            metaRow.appendChild(toneBadge);

            const textP = document.createElement('div');
            textP.className = 'press-opt-text';
            textP.textContent = `"${opt.text}"`;

            bodyDiv.append(metaRow, textP);
            btns[i].append(numSpan, bodyDiv);
        }
    });
    for (let i = q.options.length; i < btns.length; i++) {
        btns[i].style.display = 'none';
    }
}

function buildPressConferenceSequence(result, userScore, oppScore, strengthDiff, matchData, ratings) {
    const scoreDiff = Math.abs(userScore - oppScore);
    const safeStrengthDiff = strengthDiff || { userAdvantage: false, strengthGap: 0 };
    const isUpset = (result === '승리' && !safeStrengthDiff.userAdvantage) ||
        (result === '패배' && safeStrengthDiff.userAdvantage);

    const userTeamKey = gameData.selectedTeam;
    const oppTeamKey = matchData
        ? (matchData.homeTeam === userTeamKey ? matchData.awayTeam : matchData.homeTeam)
        : gameData.currentOpponent;
    const userTeamName = (typeof teamNames !== 'undefined' && teamNames[userTeamKey]) ? teamNames[userTeamKey] : '우리 팀';
    const oppTeamName = (typeof teamNames !== 'undefined' && teamNames[oppTeamKey]) ? teamNames[oppTeamKey] : '상대 팀';

    // 유저 팀 평점 및 주요 선수 추출
    const isUserHome = matchData ? (matchData.homeTeam === userTeamKey) : true;
    const userRatings = ratings ? (isUserHome ? ratings.home : ratings.away) : [];
    const sortedUserRatings = [...userRatings].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    const bestUserEntry = sortedUserRatings[0] || null;
    const multiScorerEntry = sortedUserRatings.find(r => r.goals >= 2) || null;
    const anyScorerEntry = sortedUserRatings.find(r => r.goals >= 1) || null;
    const lateGoalEvent = (matchData && Array.isArray(matchData.events))
        ? matchData.events.find(e => e.type === 'goal' && e.minute >= 82 && e.team === userTeamName)
        : null;

    const sequence = [];

    // =========================================================================
    // [QUESTION 1] 경기 총평 및 승부처 질의
    // =========================================================================
    const q1Pool = getInterviewQuestions(result, userScore, oppScore, strengthDiff);
    const baseQ1 = q1Pool[Math.floor(Math.random() * q1Pool.length)];

    if (result === '승리' && lateGoalEvent) {
        sequence.push({
            outlet: 'SKY SPORTS DESK',
            reporter: '김태훈 현장 리포터',
            question: `후반 ${lateGoalEvent.minute}분에 터진 ${lateGoalEvent.scorer} 선수의 극적인 골로 ${userScore}-${oppScore} 승리를 거머쥐었습니다! 벤치에서도 엄청난 환호가 터져 나왔는데, 당시 기분이 어떠셨습니까?`,
            options: [
                {
                    tone: '열정적 격려',
                    toneClass: 'positive',
                    text: `종료 휘슬이 울릴 때까지 단 한 명도 포기하지 않았습니다! ${lateGoalEvent.scorer}의 골은 우리 선수단 전체의 집념이 만들어낸 드라마입니다.`,
                    morale: 10,
                    headline: `"${lateGoalEvent.scorer}의 극장골, 포기하지 않는 팀 정신이 만든 기적"`
                },
                {
                    tone: '전술적 자부심',
                    toneClass: 'calm',
                    text: `후반 막판 상대 체력이 떨어질 타이밍을 노려 공격 템포를 끌어올린 전술적 노림수가 정확히 적중했습니다.`,
                    morale: 7,
                    headline: `"막판 승부수 적중... 준비된 시나리오대로 거둔 승리"`
                },
                {
                    tone: '침착한 분석',
                    toneClass: 'strict',
                    text: `승점 3점은 기쁘지만, 경기를 훨씬 일찍 끝낼 수 있는 찬스들을 놓친 점은 복기해야 합니다.`,
                    morale: 3,
                    headline: `"극적 승리에도 냉정함 유지... 결정력 보완 예고"`
                }
            ]
        });
    } else {
        sequence.push(baseQ1);
    }

    // =========================================================================
    // [QUESTION 2] 선수 개인 활약상 (MOM / 멀티골 / 무실점 / 수비 붕괴 등)
    // =========================================================================
    if (multiScorerEntry) {
        const pName = multiScorerEntry.player.name;
        const gCnt = multiScorerEntry.goals;
        sequence.push({
            outlet: 'THE ATHLETIC KOREA',
            reporter: '박진우 수석 기자',
            question: `오늘 ${pName} 선수가 무려 ${gCnt}골(평점 ${multiScorerEntry.rating})을 터뜨리며 ${oppTeamName} 수비진을 완전히 무너뜨렸습니다. 오늘 ${pName} 선수의 퍼포먼스를 어떻게 평가하십니까?`,
            options: [
                {
                    tone: '극찬과 신뢰',
                    toneClass: 'positive',
                    text: `${pName}은(는) 현재 리그에서 가장 위협적인 결정력을 가진 선수입니다. 오늘 경기장은 완전히 그의 무대였습니다!`,
                    morale: 8,
                    headline: `"${pName}, 리그 최고의 크랙 증명... 오늘 경기장은 그의 무대"`
                },
                {
                    tone: '팀워크 강조',
                    toneClass: 'calm',
                    text: `${pName}의 마무리도 훌륭했지만, 뒤에서 헌신적으로 공간을 만들어준 동료들의 패스가 있었기에 가능한 기록입니다.`,
                    morale: 6,
                    headline: `"${pName}의 ${gCnt}골 폭발, 동료들의 헌신이 뒷받침된 결과"`
                },
                {
                    tone: '자만심 경계',
                    toneClass: 'strict',
                    text: `좋은 골들을 넣었지만, 지금에 안주해선 안 됩니다. 매 경기 이런 집중력을 유지해야 진정한 월드클래스입니다.`,
                    morale: 2,
                    headline: `"멀티골 활약에도 긴장감 불어넣은 벤치의 메시지"`
                }
            ]
        });
    } else if (oppScore === 0 && bestUserEntry) {
        const pName = bestUserEntry.player.name;
        sequence.push({
            outlet: 'FOOTBALL TACTICS LAB',
            reporter: '이준호 전술 전문 기자',
            question: `오늘 ${oppTeamName}의 공세를 상대로 완벽한 클린시트(무실점)를 기록했습니다. 특히 최고 평점(${bestUserEntry.rating})을 받은 ${pName} 선수를 비롯해 수비 집중력이 돋보였는데요?`,
            options: [
                {
                    tone: '수비진 찬사',
                    toneClass: 'positive',
                    text: `공격은 관중을 부르지만 수비는 승점을 만든다는 말을 증명했습니다. ${pName}을(를) 중심으로 한 수비 라인에 만점을 주고 싶습니다.`,
                    morale: 8,
                    headline: `"통곡의 벽 세운 ${userTeamName}, 무실점 수비 조직력에 극찬"`
                },
                {
                    tone: '전술적 규율',
                    toneClass: 'calm',
                    text: `최전방부터 시작된 전방 압박과 간격 유지가 90분 내내 흔들리지 않았던 것이 무실점의 비결입니다.`,
                    morale: 5,
                    headline: `"90분 내내 완벽했던 간격 유지... 전술적 완성도 과시"`
                },
                {
                    tone: '공격력 아쉬움',
                    toneClass: 'strict',
                    text: `무실점은 만족스럽지만, 수비에서 공을 탈취한 뒤 역습 전환 속도는 더 날카로워져야 합니다.`,
                    morale: 1,
                    headline: `"무실점에도 만족 없다... 더 날카로운 공수 전환 주문"`
                }
            ]
        });
    } else if (result === '패배' && oppScore >= 3) {
        sequence.push({
            outlet: 'PRESS ROOM LIVE',
            reporter: '정민석 축구전문기자',
            question: `오늘 ${oppTeamName}에게 ${oppScore}실점을 허용하며 수비 밸런스가 크게 흔들렸습니다. 라인 간격과 대인 마크 중 어느 부분이 가장 뼈아팠습니까?`,
            options: [
                {
                    tone: '감독 책임론',
                    toneClass: 'calm',
                    text: `선수들의 탓이 아닙니다. 상대의 공격 패턴에 맞춰 전술적 변화를 한발 일찍 가져가지 못한 제 판단 미스입니다.`,
                    morale: 6,
                    headline: `"${oppScore}실점 아픔 속 선수단 감싼 감독, '모든 책임은 나에게'"`
                },
                {
                    tone: '강도 높은 질책',
                    toneClass: 'strict',
                    text: `실점 장면 모두 집중력 결여에서 비롯되었습니다. 구단 엠블럼의 무게를 안다면 다음 경기에서는 완전히 달라져야 합니다.`,
                    morale: -8,
                    headline: `"라커룸에 떨어진 불호령, '프로다운 집중력 다시 찾아야'"`
                },
                {
                    tone: '냉정한 복기',
                    toneClass: 'calm',
                    text: `수비 라인만의 문제가 아니라 중원에서의 1차 저지선이 쉽게 뚫린 것이 원인입니다. 비디오 분석을 통해 즉시 교정하겠습니다.`,
                    morale: 0,
                    headline: `"수비 붕괴 원인 정밀 진단... 다음 라운드 대수술 예고"`
                }
            ]
        });
    } else if (bestUserEntry) {
        const pName = bestUserEntry.player.name;
        const pRating = bestUserEntry.rating;
        sequence.push({
            outlet: 'BEST ELEVEN MEDIA',
            reporter: '최유나 취재기자',
            question: `오늘 경기에서 ${pName} 선수가 팀 내 최고 평점(${pRating})을 기록하며 고군분투했습니다. 감독님께서 보신 ${pName} 선수의 활약은 어땠습니까?`,
            options: [
                {
                    tone: '핵심 자원 격려',
                    toneClass: 'positive',
                    text: `${pName}은(는) 언제나 팀이 가장 필요로 할 때 제 몫 이상을 해주는 핵심 선수입니다. 오늘도 최고의 헌신을 보여줬습니다.`,
                    morale: 7,
                    headline: `"에이스 ${pName}(평점 ${pRating}) 향한 전폭적 신뢰"`
                },
                {
                    tone: '원팀 메시지',
                    toneClass: 'calm',
                    text: `${pName}의 활약도 빛났지만, 오늘 그라운드 위 11명 모두가 각자의 전술적 롤을 충실히 수행했습니다.`,
                    morale: 5,
                    headline: `"특정 스타보다 '원팀' 강조... 흔들림 없는 조직력"`
                },
                {
                    tone: '더 높은 기준',
                    toneClass: 'strict',
                    text: `${pName}의 잠재력을 생각하면 오늘 활약도 아직 100%가 아닙니다. 팀을 더 높은 곳으로 이끌어주길 기대합니다.`,
                    morale: 2,
                    headline: `"활약 속에서도 더 높은 목표 제시한 ${userTeamName} 벤치"`
                }
            ]
        });
    }

    // =========================================================================
    // [QUESTION 3] 향후 일정 및 라커룸·서포터즈 메시지
    // =========================================================================
    const tacticNames = {
        balanced: '밸런스 전술',
        attacking: '공격적 전술',
        defensive: '선수비 후역습',
        possession: '점유율 티키타카',
        pressing: '게겐프레싱',
        counter: '고속 카운터'
    };
    const curTacLabel = tacticNames[gameData.currentTactic] || '현재 전술 철학';

    if (result === '승리') {
        sequence.push({
            outlet: 'CLUB OFFICIAL MEDIA',
            reporter: '구단 공식 미디어팀',
            question: `오늘 승리로 팀 분위기가 한층 고조되었습니다. 현재 구사 중인 '${curTacLabel}' 완성도와 다음 라운드를 기다리는 서포터즈에게 한 말씀 부탁드립니다.`,
            options: [
                {
                    tone: '자신감 표출',
                    toneClass: 'positive',
                    text: `우리의 '${curTacLabel}'은(는) 매 경기 진화하고 있습니다. 경기장을 가득 메워주신 팬분들께 다음 경기에서도 승리로 보답하겠습니다!`,
                    morale: 7,
                    headline: `"기세 탄 ${userTeamName}, '우리의 축구는 매 경기 진화 중'"`
                },
                {
                    tone: '차분한 집중',
                    toneClass: 'calm',
                    text: `오늘 승리의 기쁨은 자정까지만 누리겠습니다. 내일 아침 훈련장부터는 오직 다음 상대만을 생각하며 준비하겠습니다.`,
                    morale: 5,
                    headline: `"일희일비 없는 ${userTeamName}, '오늘 승리는 자정까지만'"`
                },
                {
                    tone: '로테이션/경쟁 예고',
                    toneClass: 'strict',
                    text: `시즌은 길고 누구도 주전 자리를 보장받지 못합니다. 훈련장에서 가장 좋은 폼을 보여주는 선수에게 다음 경기 기회가 갈 것입니다.`,
                    morale: 2,
                    headline: `"승리에도 치열한 내부 경쟁 예고... 긴장감 유지"`
                }
            ]
        });
    } else {
        sequence.push({
            outlet: 'SPORTS INSIGHT',
            reporter: '한승우 출입기자',
            question: `아쉬운 결과를 뒤로하고 곧바로 다음 라운드 일정이 기다리고 있습니다. 라커룸 분위기를 어떻게 추스르고 다음 경기를 준비하실 계획입니까?`,
            options: [
                {
                    tone: '선수단 사기 진작',
                    toneClass: 'positive',
                    text: `고개 숙일 필요 없다고 선수들에게 말했습니다. 나는 우리 선수들을 100% 믿으며, 다음 경기에서 반드시 반등할 것입니다!`,
                    morale: 8,
                    headline: `"흔들림 없는 믿음, '고개 숙이지 마라, 다음 경기에 반등한다'"`
                },
                {
                    tone: '전술적 해법 모색',
                    toneClass: 'calm',
                    text: `'${curTacLabel}'의 세부 디테일을 다듬어 오늘 노출된 문제점을 보완하겠습니다. 결과로 증명하겠습니다.`,
                    morale: 4,
                    headline: `"전술 디테일 재점검 예고... '다음 라운드 결과로 증명할 것'"`
                },
                {
                    tone: '강도 높은 훈련 예고',
                    toneClass: 'strict',
                    text: `말보다는 행동이 필요한 시점입니다. 이번 주 훈련 강도를 높여 정신력과 체력 모두 재무장하겠습니다.`,
                    morale: -3,
                    headline: `"특단의 조치 예고한 ${userTeamName}, 고강도 훈련으로 돌파구 찾는다"`
                }
            ]
        });
    }

    return sequence;
}


function getInterviewQuestions(result, userScore, oppScore, strengthDiff) {
    const scoreDiff = Math.abs(userScore - oppScore);
    const safeStrengthDiff = strengthDiff || { userAdvantage: false, strengthGap: 0 };
    const isUpset = (result === '승리' && !safeStrengthDiff.userAdvantage) ||
        (result === '패배' && safeStrengthDiff.userAdvantage);

    if (result === '승리') {
        if (isUpset) {
            return [{
                outlet: 'FOOTBALL JOURNAL',
                reporter: '이현우 수석 기자',
                question: "객관적인 전력의 열세를 뒤집고 짜릿한 이변을 연출하셨습니다! 오늘 경기의 가장 큰 승인(勝因)은 무엇입니까?",
                options: [
                    { tone: '열정적 찬사', toneClass: 'positive', text: "선수들의 투지가 만들어낸 기적입니다. 그들은 운동장에서 모든 것을 쏟아부었고, 불가능을 가능으로 만들었습니다.", morale: 12, headline: `"선수들의 투지가 만든 기적... 불가능을 가능으로"` },
                    { tone: '전술적 자부심', toneClass: 'calm', text: "우리가 준비한 맞춤형 전술이 완벽하게 적중했습니다. 상대의 허점을 집요하게 파고든 것이 주효했습니다.", morale: 9, headline: `"맞춤형 전술 완벽 적중, 거함을 침몰시키다"` },
                    { tone: '겸손한 태도', toneClass: 'strict', text: "운이 꽤 따랐던 경기였습니다. 들뜨지 않고 승점 3점을 챙긴 것에 의의를 두며 다음 경기를 준비하겠습니다.", morale: 4, headline: `"대이변 연출에도 침착함 유지, '승점 3점에 만족'"` }
                ]
            }];
        } else if (scoreDiff >= 3) {
            return [{
                outlet: 'SKY SPORTS DESK',
                reporter: '정윤성 현장 기자',
                question: `${userScore}-${oppScore}, 압도적인 화력으로 대승을 거두셨습니다! 오늘 경기력에 대해 어떻게 총평하시겠습니까?`,
                options: [
                    { tone: '열정적 격려', toneClass: 'positive', text: "완벽에 가까운 경기였습니다. 공수 모든 면에서 우리가 원하던 플레이가 나왔고, 선수들이 정말 자랑스럽습니다.", morale: 10, headline: `"공수 완벽했던 마스터클래스, 선수들이 자랑스럽다"` },
                    { tone: '자신감 표출', toneClass: 'calm', text: "우리의 본실력을 보여준 경기일 뿐입니다. 이 기세를 몰아 다음 경기에서도 압도적인 모습을 보여드리겠습니다.", morale: 7, headline: `"대승 거둔 벤치의 자신감, '우리 본실력 보여준 것뿐'"` },
                    { tone: '냉정한 평가', toneClass: 'strict', text: "상대가 오늘 유독 부진했던 점도 있습니다. 점수 차에 취하지 않고 세밀한 부분들을 계속 가다듬겠습니다.", morale: 1, headline: `"대승에도 자만 경계... '점수 차에 취하지 않겠다'"` }
                ]
            }];
        } else {
            return [{
                outlet: 'SPORTING NEWS',
                reporter: '강민수 출입기자',
                question: "치열한 접전 끝에 귀중한 승점 3점을 챙겼습니다. 오늘 90분 경기를 총평해주신다면?",
                options: [
                    { tone: '팀워크 칭찬', toneClass: 'positive', text: "선수들이 끝까지 집중력을 잃지 않고 뛰어준 덕분입니다. 끈끈한 팀워크가 빛난 승리였습니다.", morale: 8, headline: `"끝까지 잃지 않은 집중력, 팀워크가 빛난 값진 승리"` },
                    { tone: '실리적 만족', toneClass: 'calm', text: "힘든 경기였지만 결과적으로 승리했다는 것이 가장 중요합니다. 우리는 승점 3점을 얻을 자격이 충분했습니다.", morale: 6, headline: `"접전 끝 승점 3점 수확, '이기는 법을 아는 팀'"` },
                    { tone: '보완점 지적', toneClass: 'strict', text: "몇몇 장면에서는 위험한 실수가 있었지만 결과를 가져온 것에 만족합니다. 부족한 점은 훈련장에서 고쳐나가겠습니다.", morale: 3, headline: `"승리 속에서도 옥에 티 점검... '훈련으로 보완할 것'"` }
                ]
            }];
        }
    } else if (result === '패배') {
        if (isUpset) {
            return [{
                outlet: 'FOOTBALL JOURNAL',
                reporter: '김도현 기자',
                question: "전력상 우위가 예상되었음에도 충격적인 일격을 당했습니다. 팬들의 실망이 클 텐데 어떻게 보십니까?",
                options: [
                    { tone: '선수단 보호', toneClass: 'calm', text: "오늘 패배의 모든 책임은 감독인 저에게 있습니다. 전술적 대처가 늦었고, 선수들을 제대로 이끌지 못했습니다.", morale: 7, headline: `"충격패 책임 자처한 감독, '선수들 아닌 내 불찰'"` },
                    { tone: '강력한 질책', toneClass: 'strict', text: "몇몇 선수들의 안일한 플레이가 너무나 실망스러웠습니다. 프로라면 경기장에서 투쟁심을 증명해야 합니다.", morale: -10, headline: `"충격패 후 라커룸 강타한 질책, '안일한 태도 용납 못 해'"` },
                    { tone: '현실적 인정', toneClass: 'calm', text: "축구에서는 언제든 일어날 수 있는 일입니다. 상대가 오늘 매우 잘 준비해왔고, 우리는 골운이 따르지 않았습니다.", morale: -3, headline: `"아쉬운 이변 허용, '상대 준비성 인정... 다음 경기 반등 다짐'"` }
                ]
            }];
        } else if (scoreDiff >= 3) {
            return [{
                outlet: 'PRESS ROOM LIVE',
                reporter: '배성재 현장 리포터',
                question: `${userScore}-${oppScore}로 무기력한 대패를 당했습니다. 오늘 경기에서 가장 큰 문제점은 무엇이었다고 보십니까?`,
                options: [
                    { tone: '팬 사과 및 보호', toneClass: 'calm', text: "끝까지 자리를 지켜주신 팬 여러분께 죄송합니다. 철저히 분석하여 다시는 이런 무기력한 경기를 하지 않겠습니다.", morale: 4, headline: `"대패에 고개 숙인 벤치, '팬들께 죄송... 철저히 환골탈태할 것'"` },
                    { tone: '냉정한 현실 인식', toneClass: 'strict', text: "상대와의 실력 차이를 인정할 수밖에 없는 하루였습니다. 우리는 아직 부족하고 배워야 할 점이 많습니다.", morale: -4, headline: `"완패 인정한 감독, '뼈아픈 교훈 삼아 처음부터 다시'"` },
                    { tone: '수비진 질책', toneClass: 'strict', text: "초반 실점 이후 선수들이 너무 쉽게 무너졌습니다. 수비 조직력과 정신력을 처음부터 다시 점검해야 합니다.", morale: -8, headline: `"대패 후 수비 조직력 정조준... 대대적 개편 예고"` }
                ]
            }];
        } else {
            return [{
                outlet: 'SPORTING NEWS',
                reporter: '박찬영 기자',
                question: "한 끗 차이로 아쉽게 패배하며 승점을 놓쳤습니다. 오늘 경기에서 긍정적인 부분을 찾을 수 있었나요?",
                options: [
                    { tone: '투지 격려', toneClass: 'positive', text: "패배는 언제나 쓰라리지만, 선수들이 마지막 순간까지 포기하지 않고 뛴 점은 높이 평가합니다.", morale: 5, headline: `"석패에도 선수단 격려, '포기하지 않은 투지 높이 산다'"` },
                    { tone: '결정력 아쉬움', toneClass: 'strict', text: "골 결정력 부족이 뼈아픕니다. 찬스를 아무리 만들어도 마무리하지 못하면 축구에서는 이길 수 없습니다.", morale: -4, headline: `"한 끗 차 석패, '찬스 살리지 못한 결정력이 패인'"` },
                    { tone: '담담한 승복', toneClass: 'calm', text: "상대가 우리보다 조금 더 집중력이 높았습니다. 패배를 깨끗이 인정하고 다음 라운드를 준비하겠습니다.", morale: 0, headline: `"깔끔히 패배 인정한 벤치, 시선은 이미 다음 라운드로"` }
                ]
            }];
        }
    }

    // 무승부
    if (safeStrengthDiff.userAdvantage && safeStrengthDiff.strengthGap > 10) {
        return [{
            outlet: 'FOOTBALL JOURNAL',
            reporter: '오세훈 기자',
            question: "반드시 잡아야 할 경기에서 무승부에 그쳤습니다. 오늘 승점 1점이라는 결과에 만족하시나요?",
            options: [
                { tone: '강한 아쉬움', toneClass: 'strict', text: "전혀 만족스럽지 않습니다. 우리는 이길 수 있는 경기를 놓쳤고, 승점 2점을 잃어버린 기분입니다.", morale: -4, headline: `"무승부에 굳은 표정, '승점 1점 아닌 2점을 잃은 경기'"` },
                { tone: '전술적 반성', toneClass: 'calm', text: "상대가 내려앉았을 때 뚫어내지 못한 우리의 숙제입니다. 더 창의적인 공격 패턴을 준비하겠습니다.", morale: 1, headline: `"밀집수비 파훼법 고심... '더 창의적인 공격 해법 찾겠다'"` },
                { tone: '긍정적 수용', toneClass: 'positive', text: "아쉽지만 패하지 않고 승점 1점을 쌓은 것도 의미가 있습니다. 리그는 장기 레이스니까요.", morale: 3, headline: `"아쉬운 무승부에도 여유, '리그는 길다, 승점 1점도 소중'"` }
            ]
        }];
    } else if (!safeStrengthDiff.userAdvantage && safeStrengthDiff.strengthGap > 10) {
        return [{
            outlet: 'THE ATHLETIC KOREA',
            reporter: '장현석 기자',
            question: "강팀을 상대로 대등한 경기를 펼치며 값진 무승부를 기록했습니다. 오늘 경기를 어떻게 보셨습니까?",
            options: [
                { tone: '열정적 격려', toneClass: 'positive', text: "선수들이 정말 자랑스럽습니다! 강팀을 상대로 물러서지 않고 우리의 축구를 보여준, 승리만큼 값진 무승부입니다.", morale: 8, headline: `"강팀 상대로 거둔 값진 승점 1점, '승리 못지않은 수확'"` },
                { tone: '전술적 만족', toneClass: 'calm', text: "수비 블록이 계획대로 단단하게 버텨줬습니다. 목표했던 승점을 챙길 수 있어서 다행입니다.", morale: 5, headline: `"치밀했던 수비 전술 성공, 강호 상대로 승점 확보"` },
                { tone: '야망 표출', toneClass: 'positive', text: "막판 찬스를 살렸다면 이길 수도 있었던 경기라 오히려 아쉽습니다. 우리 선수들의 자신감은 확실히 올라갔을 겁니다.", morale: 7, headline: `"강호 상대 무승부에도 '이길 수 있었다'... 높아진 팀 눈높이"` }
            ]
        }];
    } else {
        return [{
            outlet: 'SPORTS INSIGHT',
            reporter: '윤재호 기자',
            question: `${userScore}-${oppScore}, 팽팽한 접전 끝에 승부를 가리지 못했습니다. 오늘 경기 내용에 대해 어떻게 생각하십니까?`,
            options: [
                { tone: '공정한 평가', toneClass: 'calm', text: "양 팀 모두 수준 높은 경기를 펼쳤습니다. 무승부가 가장 공정한 결과라고 생각합니다.", morale: 3, headline: `"명승부 끝 무승부, '양 팀 모두 박수받아 마땅한 경기'"` },
                { tone: '아쉬움 토로', toneClass: 'strict', text: "경기 주도권은 우리가 쥐고 있었는데 마무리가 아쉬웠습니다. 다음 맞대결에서는 반드시 승리하겠습니다.", morale: 0, headline: `"주도권 쥐고도 무승부... '다음 맞대결에선 반드시 결판낸다'"` },
                { tone: '팬들을 향한 약속', toneClass: 'positive', text: "끝까지 응원해주신 팬분들께 승리를 안겨드리지 못해 아쉽습니다. 다음 경기에서는 더 화끈한 공격 축구로 보답하겠습니다.", morale: 3, headline: `"팬들에게 전한 약속, '다음 경기에선 화끈한 승리로 보답'"` }
            ]
        }];
    }
}

function handleInterview(option) {
    const btn = document.querySelector(`.interview-btn[data-option="${option}"]`);
    if (!btn) return;

    const moraleChange = parseInt(btn.dataset.morale || '0', 10);
    const headline = btn.dataset.headline || '';

    currentPressState.totalMoraleDelta += moraleChange;
    if (headline) currentPressState.selectedHeadlines.push(headline);

    currentPressState.currentIndex++;

    if (currentPressState.currentIndex < currentPressState.questions.length) {
        renderCurrentPressQuestion();
    } else {
        finishPressConference(false);
    }
}

function finishPressConference(skipped = false) {
    const qaStage = document.getElementById('pressQAStage');
    const summaryPanel = document.getElementById('pressResultSummaryPanel');
    const skipBtn = document.getElementById('pressNoCommentBtn');
    const stepIndicator = document.getElementById('pressStepIndicator');

    if (qaStage) qaStage.style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    if (stepIndicator) {
        stepIndicator.textContent = skipped ? ' WALKED OUT' : 'BRIEFING COMPLETE';
    }

    // 사기 반영
    const delta = currentPressState.totalMoraleDelta;
    if (window.GameState) {
        window.GameState.adjustTeamMorale(delta);
    } else {
        gameData.teamMorale = Math.max(0, Math.min(100, (gameData.teamMorale || 70) + delta));
    }

    const currentMorale = Math.round(gameData.teamMorale || 70);

    // 헤드라인 구성
    const headlineTitle = document.getElementById('pressHeadlineTitle');
    const headlineSub = document.getElementById('pressHeadlineSub');
    const moraleDeltaEl = document.getElementById('pressMoraleDelta');
    const moraleBarFill = document.getElementById('pressMoraleBarFill');
    const moraleCurrentText = document.getElementById('pressMoraleCurrentText');

    if (headlineTitle) {
        if (skipped && currentPressState.selectedHeadlines.length === 0) {
            headlineTitle.textContent = `[속보] ${currentPressState.userTeamName} 감독, "노코멘트"... 공식 기자회견 조기 퇴장`;
        } else {
            const mainHeadline = currentPressState.selectedHeadlines[0] || `"${currentPressState.userTeamName}, 다음 라운드 준비에 총력"`;
            headlineTitle.textContent = `[공식 브리핑] ${currentPressState.userTeamName} 감독, ${mainHeadline}`;
        }
    }

    if (headlineSub) {
        if (skipped && currentPressState.selectedHeadlines.length === 0) {
            headlineSub.textContent = `취재진의 질문 공세에 말을 아낀 채 곧바로 라커룸으로 향했습니다. 선수단은 차분하게 다음 일정을 준비합니다.`;
        } else if (currentPressState.selectedHeadlines.length > 1) {
            headlineSub.textContent = `추가 코멘트: ${currentPressState.selectedHeadlines.slice(1).join(' · ')}`;
        } else {
            headlineSub.textContent = `기자회견 발언이 구단 공식 채널과 주요 스포츠 미디어를 통해 보도되며 선수단 라커룸 사기에 즉시 반영되었습니다.`;
        }
    }

    if (moraleDeltaEl) {
        const sign = delta > 0 ? '+' : '';
        moraleDeltaEl.textContent = `${sign}${delta} ${delta > 0 ? '▲' : delta < 0 ? '▼' : '—'}`;
        moraleDeltaEl.className = `press-morale-delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral'}`;
    }

    if (moraleBarFill) {
        moraleBarFill.style.width = `${Math.max(4, Math.min(100, currentMorale))}%`;
    }

    if (moraleCurrentText) {
        moraleCurrentText.textContent = `현재 팀 사기: ${currentMorale} / 100`;
    }

    if (summaryPanel) {
        summaryPanel.style.display = 'block';
    }

    const finishBtn = document.getElementById('pressFinishReturnBtn');
    if (finishBtn) {
        finishBtn.onclick = () => {
            checkSeasonEnd();
            showScreen('lobby');
            updateDisplay();
        };
    }
}

function calculateMatchRatings(matchData) {
    // 평점 계산 로직 (기존 유지)
    const homeTeam = matchData.homeTeam;
    const awayTeam = matchData.awayTeam;

    // 유저 팀 선수 명단 정보
    let homePlayers = [], awayPlayers = [];

    if (homeTeam === gameData.selectedTeam) {
        const s = gameData.squad;
        if (s.gk) homePlayers.push(s.gk);
        [...s.df, ...s.mf, ...s.fw].forEach(p => { if (p) homePlayers.push(p); });
    } else {
        homePlayers = getBestEleven(homeTeam);
    }

    if (awayTeam === gameData.selectedTeam) {
        const s = gameData.squad;
        if (s.gk) awayPlayers.push(s.gk);
        [...s.df, ...s.mf, ...s.fw].forEach(p => { if (p) awayPlayers.push(p); });
    } else {
        awayPlayers = getBestEleven(awayTeam);
    }

    const calc = (p, team, goalsAgainst) => {
        let r = 6.0 + (Math.random() * 0.4 - 0.2);
        const goals = matchData.events.filter(e => e.type === 'goal' && e.scorer === p.name).length;
        const assists = matchData.events.filter(e => e.type === 'goal' && e.assister === p.name).length;
        r += goals * 1.5;
        r += assists * 1.2; // [異붽?] ?댁떆?ㅽ듃 ?됱젏 諛섏쁺
        if (goalsAgainst === 0 && (p.position === 'GK' || p.position === 'DF')) r += 0.5;

        // 승리 보너스
        const myScore = team === homeTeam ? matchData.homeScore : matchData.awayScore;
        const oppScore = team === homeTeam ? matchData.awayScore : matchData.homeScore;
        if (myScore > oppScore) r += 0.3;
        else if (myScore < oppScore) r -= 0.2;

        // 최대 10.0, 최소 3.0 제한
        return { player: p, rating: Math.max(3.0, Math.min(10.0, r)).toFixed(1), goals: goals, assists: assists };
    };

    const homeRatings = homePlayers.map(p => calc(p, homeTeam, matchData.awayScore));
    const awayRatings = awayPlayers.map(p => calc(p, awayTeam, matchData.homeScore));

    // MOM
    const all = [...homeRatings, ...awayRatings];
    all.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    return { home: homeRatings, away: awayRatings, mom: all[0] };
}

function showMatchResultModal(matchData, ratings, result, userScore, oppScore, diff) {
    const modal = document.getElementById('matchResultModal');
    document.getElementById('resultHomeTeam').textContent = teamNames[matchData.homeTeam];
    document.getElementById('resultAwayTeam').textContent = teamNames[matchData.awayTeam];
    document.getElementById('resultScore').textContent = `${matchData.homeScore} - ${matchData.awayScore}`;

    const render = (id, list) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.replaceChildren();
        list.forEach(r => {
            const div = document.createElement('div');
            div.className = 'rating-row';
            let stats = '';
            if (r.goals > 0) stats += ` (${r.goals})`;
            if (r.assists > 0) stats += ` (${r.assists})`;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${r.player.name}${stats}`;

            const ratingSpan = document.createElement('span');
            ratingSpan.textContent = r.rating;

            div.append(nameSpan, ratingSpan);
            el.appendChild(div);
        });
    };
    render('homeTeamRatings', ratings.home);
    render('awayTeamRatings', ratings.away);

    document.getElementById('confirmResultBtn').onclick = () => {
        modal.style.display = 'none';
        if (gameData.isWorldCupMode && typeof WorldCupManager !== 'undefined') {
            WorldCupManager.handleMatchEnd(matchData);

            if (!WorldCupManager.isEliminated) {
                if (typeof setNextOpponent === 'function') setNextOpponent();
                if (typeof showScreen === 'function') showScreen('lobby');
                if (typeof updateDisplay === 'function') updateDisplay();
            } else if (typeof showScreen === 'function') {
                showScreen('lobby');
            }
            return;
        }

        startInterview(result, userScore, oppScore, diff, matchData, ratings);
    };
    modal.style.display = 'block';
}

// =========================================================================================
// [PART 6] 부상 및 교체 시스템
// =========================================================================================

class InjurySystem {
    constructor() { this.injuredPlayers = new Map(); }

    checkInjury(matchData) {
        // [수정] 부상 확률 대폭 하향 (0.05% -> 0.01%)
        if (Math.random() < 0.0001) {
            const isUser = Math.random() < 0.5;
            const teamKey = isUser ? gameData.selectedTeam : gameData.currentOpponent;
            const squad = isUser ? [gameData.squad.gk, ...gameData.squad.df, ...gameData.squad.mf, ...gameData.squad.fw] : getBestEleven(teamKey);
            const player = squad.filter(p => p)[Math.floor(Math.random() * squad.filter(p => p).length)];

            if (player && !this.isInjured(teamKey, player.name)) {
                const games = Math.floor(Math.random() * 3) + 1;
                this.injuredPlayers.set(`${teamKey}_${player.name}`, { team: teamKey, name: player.name, gamesRemaining: games });
                return { occurred: true, isUserTeam: isUser, player: player, teamName: teamNames[teamKey], gamesOut: games };
            }
        }
        return { occurred: false };
    }

    updateInjuries() {
        this.injuredPlayers.forEach((v, k) => {
            v.gamesRemaining--;
            if (v.gamesRemaining <= 0) this.injuredPlayers.delete(k);
        });
    }

    isInjured(team, name) { return this.injuredPlayers.has(`${team}_${name}`); }

    getInjuredPlayers(team) {
        const list = [];
        this.injuredPlayers.forEach(v => { if (v.team === team) list.push(v); });
        return list;
    }

    removeInjuredFromSquad() {
        if (!gameData.selectedTeam) return;
        const s = gameData.squad;
        if (s.gk && this.isInjured(gameData.selectedTeam, s.gk.name)) s.gk = null;
        s.df = s.df.map(p => p && this.isInjured(gameData.selectedTeam, p.name) ? null : p);
        s.mf = s.mf.map(p => p && this.isInjured(gameData.selectedTeam, p.name) ? null : p);
        s.fw = s.fw.map(p => p && this.isInjured(gameData.selectedTeam, p.name) ? null : p);
    }

    getSaveData() { return { injuredPlayers: Array.from(this.injuredPlayers.entries()) }; }
    loadSaveData(data) { if (data && data.injuredPlayers) this.injuredPlayers = new Map(data.injuredPlayers); }
    reset() { this.injuredPlayers.clear(); }
}

function createInjuryEvent(matchData, injury) {
    return {
        minute: matchData.minute,
        type: 'injury',
        description: ` ${injury.teamName}의 ${injury.player.name}, 부상으로 교체됩니다! (${injury.gamesOut}경기 결장 예상)`
    };
}

// [교체 시스템 구현]
let selectedFieldPlayer = null;
let selectedBenchPlayer = null;

function createSubPlayerElement(player) {
    const el = document.createElement('div');
    el.className = 'substitution-player';
    el.dataset.playerName = player.name;

    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    nameDiv.textContent = `${player.name} (${player.position})`;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'details';
    let staminaVal = player.condition !== undefined ? player.condition : 100;
    if (window.currentMatchData && window.currentMatchData.engine && Array.isArray(window.currentMatchData.engine.players)) {
        const sp = window.currentMatchData.engine.players.find(p => p.name === player.name);
        if (sp && sp.stamina !== undefined) staminaVal = Math.round(sp.stamina);
    }
    const stamColor = staminaVal >= 75 ? '#2ecc71' : (staminaVal >= 50 ? '#f39c12' : '#e74c3c');
    detailsDiv.innerHTML = `OVR ${Math.floor(player.rating)} · 체력 <span style="color:${stamColor}; font-weight:bold;">${staminaVal}%</span>`;
    const stamBar = document.createElement('div');
    stamBar.style.cssText = 'width: 100%; height: 4px; background: rgba(255,255,255,0.14); border-radius: 2px; margin-top: 5px; overflow: hidden;';
    const stamFill = document.createElement('div');
    stamFill.style.cssText = `width: ${Math.max(0, Math.min(100, staminaVal))}%; height: 100%; background: ${stamColor}; border-radius: 2px;`;
    stamBar.appendChild(stamFill);
    detailsDiv.appendChild(stamBar);

    el.append(nameDiv, detailsDiv);
    return el;
}

function openSubstitutionModal(matchData, isForced = false, injuredPlayer = null) {
    if (matchData.substitutionsMade >= 5 && !isForced) {
        alert('교체 횟수를 모두 사용했습니다.');
        return;
    }

    const modal = document.getElementById('substitutionModal');
    const fieldPlayersList = document.getElementById('fieldPlayersList');
    const benchPlayersList = document.getElementById('benchPlayersList');
    const subsLeftEl = document.getElementById('substitutionsLeft');
    const modalTitle = document.getElementById('substitutionModalTitle');

    // 초기화
    if (fieldPlayersList) fieldPlayersList.replaceChildren();
    if (benchPlayersList) benchPlayersList.replaceChildren();
    selectedFieldPlayer = null;
    selectedBenchPlayer = null;

    subsLeftEl.textContent = `남은 교체 횟수: ${5 - matchData.substitutionsMade}`;
    modalTitle.textContent = isForced ? `부상 선수 교체` : '선수 교체';

    // 1. 현재 필드 위 선수 목록 (스쿼드 기준)
    const squad = gameData.squad;
    const fieldPlayers = [squad.gk, ...squad.df, ...squad.mf, ...squad.fw].filter(p => p);

    fieldPlayers.forEach(player => {
        const playerEl = createSubPlayerElement(player);

        // 부상 교체 시 부상자 자동 선택 및 강조
        if (isForced && injuredPlayer && player.name === injuredPlayer.name) {
            playerEl.classList.add('selected');
            playerEl.style.borderColor = '#e74c3c'; // 빨간색 강조
            selectedFieldPlayer = { element: playerEl, player: player };
        }

        // 클릭 이벤트 (부상 교체 시 부상자가 아니면 선택 불가)
        playerEl.addEventListener('click', () => {
            if (isForced && injuredPlayer && player.name !== injuredPlayer.name) return;
            selectPlayerForSub(player, playerEl, 'field', matchData);
        });

        fieldPlayersList.appendChild(playerEl);
    });

    // 2. 벤치 선수 목록 (전체 선수 중 필드/교체아웃/부상 제외)
    const allPlayers = teams[gameData.selectedTeam];
    const fieldPlayerNames = new Set(fieldPlayers.map(p => p.name));
    matchData.subbedOutPlayers = matchData.subbedOutPlayers || new Set();

    const benchPlayers = allPlayers.filter(p =>
        !fieldPlayerNames.has(p.name) &&
        !matchData.subbedOutPlayers.has(p.name) &&
        (!injurySystem || !injurySystem.isInjured(gameData.selectedTeam, p.name))
    );

    benchPlayers.forEach(player => {
        const playerEl = createSubPlayerElement(player);
        playerEl.addEventListener('click', () => selectPlayerForSub(player, playerEl, 'bench', matchData));
        benchPlayersList.appendChild(playerEl);
    });

    modal.style.display = 'block';
}

function selectPlayerForSub(player, element, type, matchData) {
    // 선택 스타일 처리
    if (type === 'field') {
        if (selectedFieldPlayer && selectedFieldPlayer.element !== element) {
            selectedFieldPlayer.element.classList.remove('selected');
        }
        element.classList.add('selected');
        selectedFieldPlayer = { element, player };
    } else {
        if (selectedBenchPlayer && selectedBenchPlayer.element !== element) {
            selectedBenchPlayer.element.classList.remove('selected');
        }
        element.classList.add('selected');
        selectedBenchPlayer = { element, player };
    }

    // 둘 다 선택하면 교체 실행 확인
    if (selectedFieldPlayer && selectedBenchPlayer) {
        setTimeout(() => {
            if (confirm(`${selectedFieldPlayer.player.name}을(를) ${selectedBenchPlayer.player.name} 선수가 교체하시겠습니까?`)) {
                performSubstitution(selectedFieldPlayer.player, selectedBenchPlayer.player, matchData);
            } else {
                // 취소 시 선택 해제
                if (selectedBenchPlayer) selectedBenchPlayer.element.classList.remove('selected');
                selectedBenchPlayer = null;

                if (!matchData.isPausedForInjury) {
                    if (selectedFieldPlayer) selectedFieldPlayer.element.classList.remove('selected');
                    selectedFieldPlayer = null;
                }
            }
        }, 100);
    }
}

function performSubstitution(playerOut, playerIn, matchData) {
    // 1. gameData.squad 업데이트
    const squad = gameData.squad;
    if (squad.gk && squad.gk.name === playerOut.name) squad.gk = playerIn;
    else {
        ['df', 'mf', 'fw'].forEach(pos => {
            const idx = squad[pos].findIndex(p => p && p.name === playerOut.name);
            if (idx !== -1) squad[pos][idx] = playerIn;
        });
    }

    // 1.1 gameData.squadLines 동기화 (5선 라인 체계)
    if (gameData && gameData.squadLines) {
        for (const lineKey in gameData.squadLines) {
            const arr = gameData.squadLines[lineKey];
            if (Array.isArray(arr)) {
                const idx = arr.findIndex(p => p && p.name === playerOut.name);
                if (idx !== -1) {
                    arr[idx] = playerIn;
                    break;
                }
            }
        }
    }

    // 2. 엔진 데이터 업데이트 (SimPlayer 교체)
    if (matchData.engine) {
        const simPlayers = matchData.engine.players;
        const simPlayerIndex = simPlayers.findIndex(p => p.id === playerOut.name || p.name === playerOut.name);

        if (simPlayerIndex !== -1) {
            const simPlayer = simPlayers[simPlayerIndex];

            // 기존 SimPlayer 객체를 새 선수 정보로 갱신
            simPlayer.id = playerIn.name;
            simPlayer.name = playerIn.name;
            simPlayer.rating = playerIn.rating;
            simPlayer.position = playerIn.position;
            simPlayer.detailPosition = ((playerIn.detailPosition || playerIn.position) || '').toUpperCase();
            simPlayer.otherPositions = playerIn.otherPositions || [];
            // [수정] 교체 투입 선수 체력 반영
            simPlayer.stamina = (playerIn.condition !== undefined) ? playerIn.condition : 100;

            // 역할 재설정
            let role = 'CM';
            if (gameData.playerRoles && gameData.playerRoles[playerIn.name]) {
                role = gameData.playerRoles[playerIn.name];
            } else {
                const tactic = matchData.engine.getTeamTactic ? matchData.engine.getTeamTactic(simPlayer.teamId) : 'balanced';
                if (matchData.engine && typeof matchData.engine._bestRoleForTactic === 'function') {
                    role = matchData.engine._bestRoleForTactic(tactic, playerIn.position, 0, 4, simPlayer.detailPosition);
                } else {
                    if (playerIn.position === 'FW') role = 'AF';
                    else if (playerIn.position === 'MF') role = 'BBM';
                    else if (playerIn.position === 'DF') role = 'CD';
                    else if (playerIn.position === 'GK') role = 'GK';
                }
            }
            simPlayer.role = role;

            // [수정] 능력치 업데이트 시 tackle, physical 포함 및 DNA/역할 가중치 정밀 반영
            if (typeof simPlayer._buildStats === 'function') {
                const isUser = (simPlayer.teamId === 'home' && gameData.isHomeGame) || (simPlayer.teamId === 'away' && !gameData.isHomeGame);
                const lineStats = isUser ? gameData.lineStats : (matchData.engine.aiStats || null);
                const morale = isUser ? (gameData.teamMorale || 50) : 50;
                const tactic = matchData.engine.getTeamTactic ? matchData.engine.getTeamTactic(simPlayer.teamId) : 'balanced';
                const mul = tactic === 'balanced' ? 0.60 : 1.0;
                simPlayer.stats = simPlayer._buildStats(playerIn, role, lineStats, morale, mul);
            } else {
                simPlayer.stats = {
                    speed: playerIn.rating,
                    passing: playerIn.rating,
                    shooting: playerIn.rating,
                    defense: playerIn.rating,
                    decision: playerIn.rating,
                    physical: playerIn.rating,
                    tackle: playerIn.rating
                };
            }
            if (simPlayer.stats) {
                if (simPlayer.stats.tackle === undefined) simPlayer.stats.tackle = simPlayer.stats.defense || playerIn.rating;
                if (simPlayer.stats.physical === undefined) simPlayer.stats.physical = playerIn.rating;
            }

            // [시각화 동기화] 비주얼라이저 유닛 업데이트
            if (window.matchVisualizer && window.matchVisualizer.units[playerOut.name]) {
                const unit = window.matchVisualizer.units[playerOut.name];
                delete window.matchVisualizer.units[playerOut.name];
                unit.id = playerIn.name;
                unit.name = playerIn.name;
                window.matchVisualizer.units[playerIn.name] = unit;
            }
        }

        // 스테미나 재계산 (교체 투입된 선수 기준으로 정확히 전달)
        if (typeof matchData.engine.recalculateStaminaOnSub === 'function') {
            matchData.engine.recalculateStaminaOnSub(playerIn);
        }
        updateMatchStaminaUI(matchData);
    }

    // 이미 교체되어 나간 선수는 다시 투입 불가
    matchData.subbedOutPlayers = matchData.subbedOutPlayers || new Set();
    matchData.subbedOutPlayers.add(playerOut.name);

    // 3. 기록 및 이벤트
    matchData.substitutionsMade++;
    const subEvent = {
        minute: matchData.minute,
        type: 'substitution',
        description: `교체: ${playerOut.name} OUT / ${playerIn.name} IN`
    };
    displayEvent(subEvent, matchData);

    // 4. 모달 닫기 및 경기 재개
    document.getElementById('substitutionModal').style.display = 'none';
    selectedFieldPlayer = null;
    selectedBenchPlayer = null;

    if (matchData.isPausedForInjury) {
        matchData.isPausedForInjury = false;
        matchData.isRunning = true;
        console.log('부상 교체 완료, 경기 재개');
    }
}

// 모달 닫기 버튼
function closeSubstitutionModal() {
    if (window.currentMatchData && window.currentMatchData.isPausedForInjury) {
        alert("부상 선수가 있어 반드시 교체해야 합니다!");
        return;
    }
    const modal = document.getElementById('substitutionModal');
    if (modal) modal.style.display = 'none';
    selectedFieldPlayer = null;
    selectedBenchPlayer = null;
}

// 이벤트 리스너 연결
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('closeSubstitutionModal');
    if (closeBtn) closeBtn.addEventListener('click', closeSubstitutionModal);
});

function handleForcedSubstitution(player, matchData) {
    matchData.isRunning = false;
    matchData.isPausedForInjury = true; // 부상 일시정지 플래그

    // [수정] 알림 후 즉시 모달 열기 (비동기 처리로 UI 블로킹 방지)
    setTimeout(() => {
        alert(` ${player.name} 부상 발생! 경기를 뛸 수 없어 교체가 필요합니다.`);
        openSubstitutionModal(matchData, true, player);
    }, 100);
}

// [신규] AI 팀 교체 실행
function performAISubstitution(playerOut, playerIn, aiTeam, matchData) {
    if (!matchData.engine || !playerOut || !playerIn) return;

    const outName = playerOut.name || playerOut.id;
    const inName = playerIn.name;

    const simPlayers = matchData.engine.players;
    const simPlayerIndex = simPlayers.findIndex(p => p.id === outName || p.name === outName);

    if (simPlayerIndex !== -1) {
        const simPlayer = simPlayers[simPlayerIndex];

        simPlayer.id = inName;
        simPlayer.name = inName;
        simPlayer.rating = playerIn.rating;
        simPlayer.position = playerIn.position;
        simPlayer.detailPosition = ((playerIn.detailPosition || playerIn.position) || '').toUpperCase();
        simPlayer.otherPositions = playerIn.otherPositions || [];
        simPlayer.stamina = (playerIn.condition !== undefined) ? playerIn.condition : 100;

        const tactic = matchData.engine.getTeamTactic ? matchData.engine.getTeamTactic(simPlayer.teamId) : 'balanced';
        let role = 'CM';
        if (typeof matchData.engine._bestRoleForTactic === 'function') {
            role = matchData.engine._bestRoleForTactic(tactic, playerIn.position, 0, 4, simPlayer.detailPosition);
        } else {
            if (playerIn.position === 'FW') role = 'AF';
            else if (playerIn.position === 'MF') role = 'BBM';
            else if (playerIn.position === 'DF') role = 'CD';
            else if (playerIn.position === 'GK') role = 'GK';
        }
        simPlayer.role = role;

        if (typeof simPlayer._buildStats === 'function') {
            const lineStats = matchData.engine.aiStats || null;
            const mul = (tactic === 'balanced' ? 0.60 : 1.0) * 1.11;
            simPlayer.stats = simPlayer._buildStats(playerIn, role, lineStats, 50, mul);
        } else {
            simPlayer.stats = {
                speed: playerIn.rating,
                passing: playerIn.rating,
                shooting: playerIn.rating,
                defense: playerIn.rating,
                decision: playerIn.rating,
                physical: playerIn.rating,
                tackle: playerIn.rating
            };
        }
        if (simPlayer.stats) {
            if (simPlayer.stats.tackle === undefined) simPlayer.stats.tackle = simPlayer.stats.defense || playerIn.rating;
            if (simPlayer.stats.physical === undefined) simPlayer.stats.physical = playerIn.rating;
        }

        // [시각화 동기화] 비주얼라이저 유닛 업데이트
        if (window.matchVisualizer && window.matchVisualizer.units[outName]) {
            const unit = window.matchVisualizer.units[outName];
            delete window.matchVisualizer.units[outName];
            unit.id = inName;
            unit.name = inName;
            window.matchVisualizer.units[inName] = unit;
        }

        if (typeof matchData.engine.recalculateStaminaOnSub === 'function') {
            matchData.engine.recalculateStaminaOnSub(playerIn);
        }
    }

    matchData.subbedOutPlayers = matchData.subbedOutPlayers || new Set();
    matchData.subbedOutPlayers.add(outName);

    matchData.aiSubs = matchData.aiSubs || {};
    matchData.aiSubs[aiTeam.side] = (matchData.aiSubs[aiTeam.side] || 0) + 1;
    matchData.lastAISubMinute = matchData.minute;

    const teamDisp = (typeof teamNames !== 'undefined' && teamNames[aiTeam.key]) ? teamNames[aiTeam.key] : aiTeam.key;
    const subEvent = {
        minute: matchData.minute,
        type: 'substitution',
        description: `[${teamDisp}] 교체: ${outName} OUT / ${inName} IN`
    };
    displayEvent(subEvent, matchData);
}

// [신규] 경기 중 AI 교체 주기적 체크
function checkAISubstitutions(matchData) {
    if (!matchData.engine || !matchData.isRunning) return;

    const userTeam = (typeof gameData !== 'undefined' && gameData.selectedTeam) ? gameData.selectedTeam : null;
    const aiTeams = [];
    if (matchData.homeTeam !== userTeam) aiTeams.push({ side: 'home', key: matchData.homeTeam });
    if (matchData.awayTeam !== userTeam) aiTeams.push({ side: 'away', key: matchData.awayTeam });

    matchData.aiSubs = matchData.aiSubs || {};
    matchData.subbedOutPlayers = matchData.subbedOutPlayers || new Set();

    aiTeams.forEach(aiTeam => {
        const subsCount = matchData.aiSubs[aiTeam.side] || 0;
        if (subsCount >= 3) return; // 최대 3회 교체

        // 교체 간격: 최소 3분 간격
        if (matchData.lastAISubMinute && (matchData.minute - matchData.lastAISubMinute < 3)) return;

        // 체력이 가장 떨어진 필드 플레이어 탐색
        const activeOutfield = matchData.engine.players.filter(p => p.teamId === aiTeam.side && p.position !== 'GK');
        if (!activeOutfield.length) return;
        activeOutfield.sort((a, b) => a.stamina - b.stamina);
        const mostTired = activeOutfield[0];

        // 교체 기준 (실제 엔진 분당 체력 소모량에 맞춘 현실적 기준)
        // 엔진 소모율: 60분경 MF 약 56, FW 약 65 / 70분경 MF 약 49, FW 약 59
        // 70 미만 시 스탯 10% 저하, 60 미만 시 스탯 25% 저하, 50 미만 시 스탯 50% 반토막
        let shouldSub = false;
        if (matchData.minute >= 55 && mostTired.stamina < 55) shouldSub = true;
        else if (matchData.minute >= 60 && subsCount === 0 && mostTired.stamina < 68) shouldSub = true;
        else if (matchData.minute >= 70 && subsCount <= 1 && mostTired.stamina < 62) shouldSub = true;
        else if (matchData.minute >= 78 && subsCount <= 2 && mostTired.stamina < 65) shouldSub = true;

        if (!shouldSub) return;

        // 벤치 선수 탐색 (이미 교체되어 나간 선수 및 부상자 제외)
        const teamPlayers = (window.teams && window.teams[aiTeam.key]) || (typeof teams !== 'undefined' ? teams[aiTeam.key] : []);
        const activeNames = new Set(matchData.engine.players.filter(p => p.teamId === aiTeam.side).map(p => p.name));
        const bench = teamPlayers.filter(p => !activeNames.has(p.name) && !matchData.subbedOutPlayers.has(p.name) && !(window.injurySystem && window.injurySystem.isInjured(aiTeam.key, p.name)));

        if (!bench.length) return;

        // 동일 포지션 우선 탐색, 없으면 필드 플레이어 중 선택
        let available = bench.filter(p => p.position === mostTired.position);
        if (!available.length) available = bench.filter(p => p.position !== 'GK');
        if (!available.length) return;

        // 컨디션과 능력치가 높은 선수 선택
        available.sort((a, b) => (b.condition || 100) - (a.condition || 100) || b.rating - a.rating);
        const bestBench = available[0];

        performAISubstitution(mostTired, bestBench, aiTeam, matchData);
    });
}

// [신규] AI 선수 부상 시 즉시 강제 교체
function handleAIForcedSubstitution(injuredPlayer, matchData) {
    if (!matchData.engine || !injuredPlayer) return;

    const userTeam = (typeof gameData !== 'undefined' && gameData.selectedTeam) ? gameData.selectedTeam : null;
    let aiTeamSide = null;
    let aiTeamKey = null;

    if (matchData.homeTeam !== userTeam) {
        const found = matchData.engine.players.find(p => p.teamId === 'home' && (p.name === injuredPlayer.name || p.id === injuredPlayer.name));
        if (found) { aiTeamSide = 'home'; aiTeamKey = matchData.homeTeam; }
    }
    if (!aiTeamSide && matchData.awayTeam !== userTeam) {
        const found = matchData.engine.players.find(p => p.teamId === 'away' && (p.name === injuredPlayer.name || p.id === injuredPlayer.name));
        if (found) { aiTeamSide = 'away'; aiTeamKey = matchData.awayTeam; }
    }
    if (!aiTeamSide || !aiTeamKey) return;

    const teamPlayers = (window.teams && window.teams[aiTeamKey]) || (typeof teams !== 'undefined' ? teams[aiTeamKey] : []);
    const activeNames = new Set(matchData.engine.players.filter(p => p.teamId === aiTeamSide).map(p => p.name));
    matchData.subbedOutPlayers = matchData.subbedOutPlayers || new Set();
    const bench = teamPlayers.filter(p => !activeNames.has(p.name) && !matchData.subbedOutPlayers.has(p.name) && !(window.injurySystem && window.injurySystem.isInjured(aiTeamKey, p.name)));

    if (!bench.length) return;

    let available = bench.filter(p => p.position === injuredPlayer.position);
    if (!available.length) available = bench.filter(p => p.position !== 'GK');
    if (!available.length) return;

    available.sort((a, b) => b.rating - a.rating);
    const bestBench = available[0];

    performAISubstitution(injuredPlayer, bestBench, { side: aiTeamSide, key: aiTeamKey }, matchData);
}

// 전역 인스턴스
const injurySystem = new InjurySystem();
window.injurySystem = injurySystem;
window.startMatch = startMatch;
window.handleInterview = handleInterview;

// [신규] 경기 속도 조절 치트키 (Shift + F) 및 세리머니 스킵 (Space / ESC)
document.addEventListener('keydown', (e) => {
    if (e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        if (window.currentMatchData && window.currentMatchData.isRunning) {
            window.currentMatchData.isFastForward = !window.currentMatchData.isFastForward;

            // 시각적 피드백 (시간 텍스트 색상 변경)
            const timeEl = document.getElementById('matchTime');
            if (timeEl) {
                timeEl.style.color = window.currentMatchData.isFastForward ? '#f1c40f' : '';
                timeEl.style.textShadow = window.currentMatchData.isFastForward ? '0 0 10px #f1c40f' : '';
            }
        }
    }

    // [신규] 세리머니 즉시 스킵 (Space 또는 ESC 키)
    if (e.code === 'Space' || e.key === 'Escape') {
        const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
            if (window.currentMatchData && window.currentMatchData.isRunning && window.currentMatchData.engine) {
                if (typeof window.currentMatchData.engine.skipCelebration === 'function') {
                    window.currentMatchData.engine.skipCelebration();
                }
            }
        }
    }
});
