// script.js
// 주요 데이터 구조 및 초기화

// gameData 객체에 부상 정보 추가 (기존 gameData 선언 부분 수정)
let gameData = {
    selectedTeam: null,
    currentLeague: 1,
    teamMoney: 1000,
    teamMorale: 80,
    currentSponsor: null,
    totalWeeklyWage: 0, // [신규] 팀 주급 총합
    wageBudget: 0, // [신규] 주급 자금
    gameMode: 'direct', // [신규] 게임 모드: 'direct' (기본), 'longtime' (하드모드)
    matchesPlayed: 0,
    currentOpponent: null,
    currentTactic: 'balanced', // [수정] 기본값 'balanced' (무전술)로 변경
    isWorldCupMode: false, // [추가] 월드컵 모드 플래그 초기화
    squad: {
        // 4-3-3 포메이션 기준
        gk: null,
        df: [null, null, null, null],
        mf: [null, null, null],
        fw: [null, null, null]
    },
    leagueData: {
        division1: {},
        division2: {},
        division3: {}
    },
    playerGrowthData: {},
    transferSystemData: {},
    injuredPlayers: [], // 부상 선수 목록 추가
    aiPrestige: {}, // AI 팀의 환생 선수/성장 보너스 관리
    youthSquad: [], // 유스팀 선수 목록 추가
    hiredScout: null, // 고용된 스카우터 정보
    schedule: null, // 시즌 스케줄
    currentRound: 1, // 현재 라운드
    isHomeGame: true, // 현재 경기가 홈 경기인지 여부
    startYear: 2025, // 시작 연도 (시즌 표기용)
    seasonCount: 1, // 시즌 카운트
    settings: { autoSave: false, bgm: true, bgmVolume: 50, sfxVolume: 50, immersionMode: true, customCursor: false, useIdFacepack: true }, // 게임 설정 (오디오, SFX, 몰입 모드, 커스텀 커서, ID 페이스팩)
    matchDrama: { enabled: true, intensity: 'high' }, // 골 직전 몰입 연출 (CM 스타일)
    playerRoles: {}, // [추가] 선수별 역할 데이터 초기화
    aiFormations: {}, // [신규] AI 팀별 최적 포메이션 데이터 저장소
    temporaryStats: {}, // [신규] 일시적 스탯 버프/디버프 저장소
    secretaryName: "김지수", // [신규] 비서 이름 (secretary.js에서 사용)
    losingStreak: 0, // [신규] 연패 기록
    userTransferList: [], // [신규] 유저가 이적 명단에 올린 선수들
    mentoringPairs: [], // [신규] 유저가 수동으로 설정한 1:1 멘토링 관계 배열 {mentor: 'Name', mentee: 'Name'}
    chatState: {
        activeContactId: 'secretary',
        threads: {}
    }
};

// [개선] 데이터 중앙화를 통해 수동 매핑 제거
const teamNames = Object.fromEntries(Object.entries(allTeams).map(([k, v]) => [k, v.displayName || k]));
const teamCities = Object.fromEntries(Object.entries(allTeams).map(([k, v]) => [k, v.city || "알 수 없음"]));
const teamLogoCodes = Object.fromEntries(Object.entries(allTeams).map(([k, v]) => [k, v.logoCode || "DFT"]));

// 얇은 이벤트 허브로 기능 간 직접 함수 덮어쓰기를 줄입니다.
window.GameEventBus = window.GameEventBus || {
    listeners: {},

    on(eventName, handler) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = new Set();
        }
        this.listeners[eventName].add(handler);
        return () => this.off(eventName, handler);
    },

    off(eventName, handler) {
        const handlers = this.listeners[eventName];
        if (!handlers) return;
        handlers.delete(handler);
        if (handlers.size === 0) {
            delete this.listeners[eventName];
        }
    },

    emit(eventName, payload) {
        const handlers = this.listeners[eventName];
        if (!handlers || handlers.size === 0) return;

        Array.from(handlers).forEach(handler => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`[GameEventBus] '${eventName}'handler failed:`, error);
            }
        });
    }
};

// ==================== [신규] 자동 저장 시스템 ====================
window.AutoSaveSystem = {
    lastLoadedSlot: 1, // 기본값 슬롯 1
    saveTimer: null,
    isSaving: false,
    pendingSave: false,
    eventsBound: false,

    init: function () {
        // UI 이벤트 바인딩 (설정 탭)
        const toggle = document.getElementById('autoSaveToggle');
        if (toggle && !toggle.dataset.autoSaveBound) {
            toggle.dataset.autoSaveBound = 'true';
            toggle.addEventListener('change', (e) => {
                if (!gameData.settings) gameData.settings = {};
                gameData.settings.autoSave = e.target.checked;
                this.updateUI();

                // 켜는 순간 팀이 선택된 상태라면 즉시 1회 저장
                if (gameData.settings.autoSave && gameData.selectedTeam) {
                    this.triggerSave(true);
                }
            });
        }

        this.hookMoney();
        this.bindEvents();
        this.updateUI();
    },

    bindEvents: function () {
        if (this.eventsBound || !window.GameEventBus) return;
        this.eventsBound = true;

        window.GameEventBus.on('match:end', () => {
            this.triggerSave();
        });
        window.GameEventBus.on('records:updated', () => {
            this.triggerSave();
        });
    },

    hookMoney: function () {
        if (typeof gameData === 'undefined' || !gameData) return;
        if (Object.getOwnPropertyDescriptor(gameData, '__teamMoneyHooked')) return;

        let currentMoney = gameData.teamMoney;
        const self = this;

        Object.defineProperty(gameData, '__teamMoneyHooked', {
            value: true,
            enumerable: false,
            configurable: true
        });

        Object.defineProperty(gameData, 'teamMoney', {
            enumerable: true,
            configurable: true,
            get: function () {
                return currentMoney;
            },
            set: function (val) {
                const prev = currentMoney;
                currentMoney = val;
                if (prev !== val && !window.loadingInProgress) {
                    self.triggerSave();
                }
            }
        });
    },

    updateUI: function () {
        const toggle = document.getElementById('autoSaveToggle');
        const status = document.getElementById('autoSaveStatus');

        if (toggle && status) {
            const isEnabled = !!(gameData.settings && gameData.settings.autoSave);
            toggle.checked = isEnabled;
            status.textContent = isEnabled ?
                `자동 저장이 켜져있습니다 (슬롯 ${this.lastLoadedSlot})` :
                "자동 저장이 꺼져있습니다.";
            status.style.color = isEnabled ? "#2ecc71" : "#aaa";
        }
    },

    setLastLoadedSlot: function (slot) {
        this.lastLoadedSlot = slot;
        this.updateUI();
    },

    executeSave: function () {
        if (!gameData || !gameData.selectedTeam) return;
        if (!(gameData.settings && gameData.settings.autoSave)) return;
        if (typeof window.saveToSlot !== 'function') return;

        if (this.isSaving) {
            this.pendingSave = true;
            return;
        }

        this.isSaving = true;
        console.log(`[AutoSave] 자동 저장 실행 (슬롯 ${this.lastLoadedSlot})`);
        Promise.resolve(window.saveToSlot(this.lastLoadedSlot, true))
            .then((saved) => {
                if (saved !== false) {
                    this.showToast();
                }
            })
            .catch((err) => {
                console.error('[AutoSave] 자동 저장 실패:', err);
            })
            .finally(() => {
                this.isSaving = false;
                if (this.pendingSave) {
                    this.pendingSave = false;
                    this.triggerSave();
                }
            });
    },

    triggerSave: function (immediate = false) {
        if (!gameData || !gameData.settings || !gameData.settings.autoSave) return;
        if (!gameData.selectedTeam || window.loadingInProgress) return;

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }

        if (immediate) {
            this.executeSave();
            return;
        }

        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this.executeSave();
        }, 500);
    },

    showToast: function () {
        const toast = document.createElement('div');
        toast.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('save') : ''}<span>자동 저장됨</span>`;
        toast.style.cssText = `position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(56, 189, 248, 0.4);
            color: #F8FAFC;
            padding: 10px 18px;
            border-radius: 6px;
            z-index: 10000;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.45);
            animation: fadeUp 2s ease forwards;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        // 애니메이션 스타일 추가 (중복 방지)
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes fadeUp {
                    0% { opacity: 0; transform: translateY(20px); }
                    15% { opacity: 1; transform: translateY(0); }
                    85% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-20px); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => toast.remove(), 2000);
    }
};

// 하위 호환 전역 별칭 (formation.js, tactics.js, tacticSystem.js, matchEngine.js 등)
window.autoSaveSystem = window.AutoSaveSystem;
window.triggerAutoSave = function () {
    if (window.AutoSaveSystem) {
        window.AutoSaveSystem.triggerSave();
    }
};

// 전역 헬퍼 (loadGame 등에서 호출)
window.updateAutoSaveUI = function () {
    if (window.AutoSaveSystem) {
        window.AutoSaveSystem.updateUI();
    }
};

const WORLD_CUP_FLAGS = {
    "대한민국": "KOR", "일본": "JPN", "중국": "CHN", "호주": "AUS", "사우디아라비아": "KSA",
    "이란": "IRN", "카타르": "QAT", "우즈베키스탄": "UZB", "이라크": "IRQ", "요르단": "JOR", "UAE": "UAE",
    "잉글랜드": "ENG", "프랑스": "FRA", "독일": "GER", "스페인": "ESP", "이탈리아": "ITA",
    "네덜란드": "NED", "포르투갈": "POR", "벨기에": "BEL", "크로아티아": "CRO", "스위스": "SUI",
    "덴마크": "DEN", "오스트리아": "AUT", "노르웨이": "NOR", "스웨덴": "SWE", "폴란드": "POL",
    "체코": "CZE", "우크라이나": "UKR", "스코틀랜드": "SCO", "웨일스": "WAL", "튀르키예": "TUR", "루마니아": "ROU",
    "브라질": "BRA", "아르헨티나": "ARG", "우루과이": "URU", "콜롬비아": "COL", "에콰도르": "ECU",
    "파라과이": "PAR", "칠레": "CHI", "볼리비아": "BOL", "페루": "PER",
    "미국": "USA", "멕시코": "MEX", "캐나다": "CAN", "파나마": "PAN", "코스타리카": "CRC", "아이티": "HAI", "퀴라소": "CUW",
    "모로코": "MAR", "세네갈": "SEN", "이집트": "EGY", "알제리": "ALG", "튀니지": "TUN",
    "나이지리아": "NGA", "카메룬": "CMR", "가나": "GHA", "코트디부아르": "CIV", "남아공": "RSA", "카보베르데": "CPV",
    "뉴질랜드": "NZL"
};

function getTeamLogoHTML(teamName) {
    if (!teamName) return '';

    // 월드컵 모드이거나 국가대표팀 코드가 존재하는 경우 국가 코드 배지 표시
    if ((typeof gameData !== 'undefined' && gameData.isWorldCupMode) || (typeof WORLD_CUP_FLAGS !== 'undefined' && WORLD_CUP_FLAGS[teamName])) {
        const flag = (typeof WORLD_CUP_FLAGS !== 'undefined' && WORLD_CUP_FLAGS[teamName]) || 'INT';
        return `<span class="team-logo-flag" style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:22px; font-size:0.7rem; font-weight:800; background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.35); border-radius:4px; margin-right:6px; flex-shrink:0; vertical-align:middle; font-variant-numeric:tabular-nums;">${flag}</span>`;
    }

    // 레전드 팀
    if (teamName.startsWith("Legend_")) {
        const legendCode = (typeof LegendLeagueManager !== 'undefined' && LegendLeagueManager.legendLogoCodes && LegendLeagueManager.legendLogoCodes[teamName])
            || (typeof LegendLeagueManager !== 'undefined' && LegendLeagueManager.legendTeams && LegendLeagueManager.legendTeams[teamName]?.logoCode)
            || "DFT";
        return `<img src="assets/logo/legend/${legendCode}.webp" class="team-logo" alt="${teamName}" onerror="this.outerHTML='<span class=\\'team-logo-fallback\\'>LG</span>'">`;
    }

    const team = typeof allTeams !== 'undefined' ? allTeams[teamName] : null;
    if (!team) return '';

    // 1순위: teamid 기반 assets/team_logos/L{teamid}.png
    if (team.teamid) {
        return `<img src="assets/team_logos/L${team.teamid}.png" class="team-logo" alt="${teamName}" onerror="this.outerHTML='<span class=\\'team-logo-fallback\\' style=\\'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #38BDF8, #0284C7); color:#090D16; border-radius:6px; font-weight:900; font-size:0.72rem; margin-right:6px; flex-shrink:0; vertical-align:middle;\\'>FC</span>'">`;
    }

    const code = team.logoCode || "DFT";
    if (code === "DFT" || team.isCustom || team.isIcon || !team.league) {
        const initials = ((typeof teamNames !== 'undefined' && teamNames[teamName]) || teamName || 'FC').substring(0, 2).toUpperCase();
        return `<span class="team-logo-fallback" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #FBBF24, #D97706); color:#090D16; border-radius:6px; font-weight:900; font-size:0.75rem; border:1px solid rgba(251,191,36,0.6); margin-right:6px; flex-shrink:0; vertical-align:middle;">${initials}</span>`;
    }

    return `<img src="assets/logo/${team.league}/${code}.webp" class="team-logo" alt="${teamName}" onerror="this.outerHTML='<span class=\\'team-logo-fallback\\' style=\\'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #38BDF8, #0284C7); color:#090D16; border-radius:6px; font-weight:900; font-size:0.72rem; margin-right:6px; flex-shrink:0; vertical-align:middle;\\'>FC</span>'">`;
}

function createTeamLogoElement(teamName) {
    if (!teamName) return document.createDocumentFragment();

    if ((typeof gameData !== 'undefined' && gameData.isWorldCupMode) || (typeof WORLD_CUP_FLAGS !== 'undefined' && WORLD_CUP_FLAGS[teamName])) {
        const flag = (typeof WORLD_CUP_FLAGS !== 'undefined' && WORLD_CUP_FLAGS[teamName]) || 'INT';
        const span = document.createElement('span');
        span.className = 'team-logo-flag';
        span.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:30px; height:22px; font-size:0.7rem; font-weight:800; background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.35); border-radius:4px; margin-right:6px; flex-shrink:0; vertical-align:middle;';
        span.textContent = flag;
        return span;
    }

    if (teamName.startsWith("Legend_")) {
        const code = (typeof LegendLeagueManager !== 'undefined' && LegendLeagueManager.legendLogoCodes && LegendLeagueManager.legendLogoCodes[teamName])
            || (typeof LegendLeagueManager !== 'undefined' && LegendLeagueManager.legendTeams && LegendLeagueManager.legendTeams[teamName]?.logoCode)
            || "DFT";
        const img = document.createElement('img');
        img.src = `assets/logo/legend/${code}.webp`;
        img.className = 'team-logo';
        img.alt = teamName;
        img.onerror = function() {
            const fallback = document.createElement('span');
            fallback.className = 'team-logo-fallback';
            fallback.textContent = 'LG';
            this.replaceWith(fallback);
        };
        return img;
    }

    const team = typeof allTeams !== 'undefined' ? allTeams[teamName] : null;
    if (!team) return document.createDocumentFragment();

    // 1순위: teamid 기반 assets/team_logos/L{teamid}.png
    if (team.teamid) {
        const img = document.createElement('img');
        img.src = `assets/team_logos/L${team.teamid}.png`;
        img.className = 'team-logo';
        img.alt = teamName;
        img.onerror = function() {
            const fallback = document.createElement('span');
            fallback.className = 'team-logo-fallback';
            fallback.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #38BDF8, #0284C7); color:#090D16; border-radius:6px; font-weight:900; font-size:0.72rem; margin-right:6px; flex-shrink:0; vertical-align:middle;';
            fallback.textContent = 'FC';
            this.replaceWith(fallback);
        };
        return img;
    }

    const code = team.logoCode || "DFT";
    if (code === "DFT" || team.isCustom || team.isIcon || !team.league) {
        const initials = ((typeof teamNames !== 'undefined' && teamNames[teamName]) || teamName || 'FC').substring(0, 2).toUpperCase();
        const span = document.createElement('span');
        span.className = 'team-logo-fallback';
        span.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #FBBF24, #D97706); color:#090D16; border-radius:6px; font-weight:900; font-size:0.75rem; border:1px solid rgba(251,191,36,0.6); margin-right:6px; flex-shrink:0; vertical-align:middle;';
        span.textContent = initials;
        return span;
    }

    const img = document.createElement('img');
    img.src = `assets/logo/${team.league}/${code}.webp`;
    img.className = 'team-logo';
    img.alt = teamName;
    img.onerror = function() {
        const fallback = document.createElement('span');
        fallback.className = 'team-logo-fallback';
        fallback.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:linear-gradient(135deg, #38BDF8, #0284C7); color:#090D16; border-radius:6px; font-weight:900; font-size:0.72rem; margin-right:6px; flex-shrink:0; vertical-align:middle;';
        fallback.textContent = 'FC';
        this.replaceWith(fallback);
    };
    return img;
}




// 스폰서 데이터 - [수정] 현실적 재정 다이어트 (퍼주기 방지 & 긴축 재정)
const sponsors = [
    {
        name: "푸마",
        description: "빠르고 역동적인 스포츠 브랜드",
        payPerWin: 5,
        payPerLoss: 1,
        contractLength: 28,
        signingBonus: 100,
        requirements: { minRating: 70 }
    },
    {
        name: "나이키",
        description: "세계적인 스포츠 브랜드",
        payPerWin: 7,
        payPerLoss: 2,
        contractLength: 28,
        signingBonus: 130,
        requirements: { minRating: 75 }
    },
    {
        name: "뉴발란스",
        description: "전문성을 추구하는 스포츠 브랜드",
        payPerWin: 6,
        payPerLoss: 1,
        contractLength: 28,
        signingBonus: 120,
        requirements: { minRating: 78 }
    },
    {
        name: "아디다스",
        description: "독일의 프리미엄 스포츠 브랜드",
        payPerWin: 8,
        payPerLoss: 2,
        contractLength: 28,
        signingBonus: 170,
        requirements: { minRating: 80 }
    },
    {
        name: "넥센타이어",
        description: "한국의 타이어 브랜드",
        payPerWin: 10,
        payPerLoss: 3,
        contractLength: 28,
        signingBonus: 220,
        requirements: { minRating: 85 }
    },
    {
        name: "플라이 에미레이츠",
        description: "세계 최고의 항공사 중 하나",
        payPerWin: 14,
        payPerLoss: 4,
        contractLength: 28,
        signingBonus: 300,
        requirements: { minRating: 90 }
    },
    {
        name: "삼성",
        description: "세계 최고의 전자제품 생산 기업",
        payPerWin: 18,
        payPerLoss: 5,
        contractLength: 28,
        signingBonus: 400,
        requirements: { minRating: 92 }
    }
];

// 경기 이벤트 메시지
const passMessages = [
    "이(가) 팀이 미드필드에서 공을 돌리고 있습니다",
    "의 예리한 패스!",
    "의 후방 빌드업",
    "이(가) 측면으로 공을 연결합니다",
    "이(가) 중앙에서 패스를 시도합니다",
    "의 안전한 백패스",
    "이(가) 공격을 전개합니다",
    "이(가) 좌측으로 공을 옮깁니다",
    "이(가) 우측으로 볼을 배급합니다",
    "이(가) 킬패스를 시도합니다",
    "이(가) 크로스 올립니다",
    "이(가) 스루패스를 찔러넣습니다",
    "이(가) 롱패스로 전환합니다",
    "이(가) 숏패스를 연결합니다",
    "의 침착한 패스 플레이",
    "이(가) 템포를 조절합니다",
    "의 빠른 역습!",
    "이(가) 측면을 돌파합니다",
    "이(가) 중앙 침투를 시도합니다",
    "의 조직적인 수비",
    "이(가) 전방 압박을 가합니다",
    "이(가) 라인을 올립니다",
    "의 치밀한 빌드업",
    "이(가) 공간을 찾아갑니다",
    "이(가) 볼 소유권을 가져갑니다",
    "의 강력한 중거리 슛!",
    "이(가) 박스 안으로 침투합니다",
    "의 날카로운 돌파",
    "이(가) 측면을 활용합니다",
    "이(가) 수비 라인을 흔듭니다",
    "이(가) 빈 공성간을 찾아 들어갑니다",
    "의 감각적인 힐패스!",
    "이(가) 반대편으로 길게 열어줍니다",
    "이(가) 2대1 패스를 주고받습니다",
    "의 탈압박 능력이 돋보입니다",
    "이(가) 상대의 압박을 여유롭게 벗어납니다",
    "이(가) 전방으로 쇄도합니다",
    "의 창의적인 플레이",
    "이(가) 경기를 조율합니다",
    "이(가) 볼을 지켜냅니다",
    "의 정확한 롱킥!",
    "이(가) 수비 사이로 파고듭니다",
    "이(가) 동료를 활용합니다",
    "의 센스 있는 터치",
    "이(가) 공격 템포를 올립니다",
    "이(가) 침착하게 볼을 소유합니다",
    "의 날카로운 크로스 시도",
    "이(가) 중앙으로 좁혀 들어옵니다",
    "이(가) 오버래핑을 시도합니다",
    "의 허를 찌르는 패스"
];

// DOM 요소들
let currentModal = null;
let selectedPosition = null;

// [신규] 팀 선택 화면 상태 관리
let selectionState = {
    league: 1,
    teamIndex: 0
};

// 초기화
function initializeGame() {
    // 리그 데이터 초기화
    initializeLeagueData();

    // [신규] 메인 화면 저장된 게임 슬롯 표시
    renderMainSaveSlots();

    // [신규] 게임 모드 선택 UI 추가
    addGameModeSelectorUI();

    // [신규] 팀 선택 UI 초기화
    renderTeamSelectionUI();

    // [신규] 전체 AI 팀의 최적 포메이션 연산 및 초기화
    if (typeof TeamUtils !== 'undefined') {
        TeamUtils.initializeAllAIFormations();
    }
}

// [신규] 선수 목록 클릭 핸들러
function handlePlayerListClick(e) {
    const card = e.target.closest('.player-card');
    if (!card) return;
    if (e.target.closest('button, a, input, select, .fc26-status-pill')) return;
    const playerName = card.dataset.playerName;
    const player = (teams[gameData.selectedTeam] || []).find(p => p.name === playerName);
    if (player && typeof openPlayerDetail === 'function') openPlayerDetail(player, gameData.selectedTeam);
}

// [신규] 선수 목록 우클릭 핸들러
function handlePlayerListRightClick(e) {
    e.preventDefault();
    const card = e.target.closest('.player-card');
    if (!card) return;

    const playerName = card.dataset.playerName;
    if (!playerName) return;

    const player = teams[gameData.selectedTeam].find(p => p.name === playerName);
    if (player) {
        releasePlayerWithFee(player);
    }
}

// [신규] 게임 모드 선택 UI 생성 함수
function addGameModeSelectorUI() {
    const screen = document.getElementById('teamSelection');
    if (!screen || document.getElementById('gameModeSelector')) return;

    const selector = document.createElement('div');
    selector.id = 'gameModeSelector';
    selector.style.cssText = `display: flex;
        justify-content: center;
        padding: 20px;
        margin-bottom: 20px;
        animation: fadeIn 0.5s ease;
    `;

    const glass = document.createElement('div');
    glass.className = 'glass';
    glass.style.cssText = 'display: flex; align-items: center; gap: 20px; padding: 10px 30px; border-radius: 50px; background: rgba(16, 28, 51, 0.9);';

    const span = document.createElement('span');
    span.style.cssText = 'font-weight: bold; color: #FBBF24; display: inline-flex; align-items: center; gap: 6px;';
    span.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('settings') : ''}<span>모드 설정:</span>`;

    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display: flex; gap: 10px;';

    const btnDirect = document.createElement('button');
    btnDirect.id = 'btn-mode-direct';
    btnDirect.className = 'btn primary';
    btnDirect.style.cssText = 'padding: 8px 20px; font-size: 0.9rem;';
    btnDirect.textContent = '다이렉트 모드';

    const btnLong = document.createElement('button');
    btnLong.id = 'btn-mode-longtime';
    btnLong.className = 'btn';
    btnLong.style.cssText = 'padding: 8px 20px; font-size: 0.9rem; background: rgba(255,255,255,0.1);';
    btnLong.textContent = '롱타임 모드';

    btnWrap.append(btnDirect, btnLong);
    glass.append(span, btnWrap);
    selector.appendChild(glass);

    // h1 다음에 삽입
    const h1 = screen.querySelector('h1');
    if (h1) h1.after(selector);
    else screen.prepend(selector);

    btnDirect.onclick = () => {
        gameData.gameMode = 'direct';
        btnDirect.classList.add('primary');
        btnLong.classList.remove('primary');
        btnLong.style.background = 'rgba(255,255,255,0.1)';
    };

    btnLong.onclick = () => {
        gameData.gameMode = 'longtime';
        btnLong.classList.add('primary');
        btnDirect.classList.remove('primary');
        btnDirect.style.background = 'rgba(255,255,255,0.1)';
    };
}

function setupEventListeners() {
    // [성능 개선] 이벤트 위임(Event Delegation) 적용
    const teamSelectionScreen = document.getElementById('teamSelection');
    if (teamSelectionScreen) {
        teamSelectionScreen.addEventListener('click', function (e) {
            const card = e.target.closest('.team-card');
            if (card) {
                const originalTeamKey = card.dataset.team;
                const validTeamKey = originalTeamKey.replace(/\s/g, '_');
                selectTeam(validTeamKey);
            }
        });
    }

    // [성능 개선] 선수 목록 이벤트 위임
    const playerList = document.getElementById('playerList');
    if (playerList) {
        playerList.addEventListener('click', handlePlayerListClick);
        playerList.addEventListener('contextmenu', handlePlayerListRightClick);
    }


    // 탭 전환
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tabName = this.dataset.tab;
            showTab(tabName);
        });
    });
    // [수정] 홈 버튼 이벤트
    document.getElementById('homeBtn').addEventListener('click', function () {
        if (typeof showDashboard === 'function') showDashboard();
    });

    // 포지션 클릭
    // document.querySelectorAll('.position').forEach(position => {
    //     position.addEventListener('click', function() {
    //         const pos = this.dataset.position;
    //         const index = this.dataset.index;
    //         openPlayerModal(pos, index);
    //     });
    // });

    // 나만의 팀 만들기 버튼 및 인터랙션
    document.getElementById('openCreateTeamModalBtn')?.addEventListener('click', openCreateTeamModal);
    document.getElementById('closeCreateTeamModal')?.addEventListener('click', closeCreateTeamModal);
    document.getElementById('createIconTeamBtn')?.addEventListener('click', showIconTeamCreation);
    document.getElementById('createCustomTeamBtn')?.addEventListener('click', showCustomTeamCreation);
    document.getElementById('confirmCreateTeamBtn')?.addEventListener('click', createIconTeam);
    document.getElementById('confirmCreateCustomTeamBtn')?.addEventListener('click', createCustomTeam);
    document.getElementById('customLeagueSelect')?.addEventListener('change', updateCustomReplacementTeams);

    // [신규] 아이콘/커스텀 팀 만들기 편의 기능 이벤트 연결
    document.getElementById('autoDraftIconBtn')?.addEventListener('click', autoDraftIconTeam);
    document.getElementById('randomIconTeamNameBtn')?.addEventListener('click', pickRandomIconTeamName);
    document.getElementById('randomCustomTeamNameBtn')?.addEventListener('click', pickRandomCustomTeamName);
    document.getElementById('autoFillCustomPlayersBtn')?.addEventListener('click', autoFillCustomPlayers);

    // 아이콘 포지션 필터 버튼 이벤트
    document.getElementById('iconFilterTabs')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-tab-pill');
        if (!btn) return;
        document.querySelectorAll('#iconFilterTabs .filter-tab-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterIconPlayers(btn.dataset.pos);
    });

    // 경기 시작
    // document.getElementById('startMatchBtn').addEventListener('click', startMatch);
    // [수정] 경기 시작 (캘린더 시뮬레이션 후 시작)
    document.getElementById('startMatchBtn').addEventListener('click', runMatchSequence);

    // 모달 닫기
    document.querySelector('.close').addEventListener('click', closeModal);

    // 이적 검색
    if (document.getElementById('searchBtn')) {
        document.getElementById('searchBtn').addEventListener('click', searchPlayers);
    }

    // 게임 저장/불러오기
    document.getElementById('saveGameBtn').addEventListener('click', saveGame);
    document.getElementById('loadGameBtn').addEventListener('click', function () {
        document.getElementById('loadGameInput').click();
    });
    document.getElementById('loadGameInput').addEventListener('change', loadGame);

    // 성장 현황 보기
    document.getElementById('showGrowthBtn').addEventListener('click', showGrowthSummary);

    // [신규] 전술 팁 모달 (엔진 샌드박스 버튼 대체)
    const tacticTipsBtn = document.getElementById('openTacticTipsBtn');
    const tacticTipsModal = document.getElementById('tacticTipsModal');
    const closeTacticTipsBtn = document.getElementById('closeTacticTipsModal');

    if (tacticTipsBtn && tacticTipsModal) {
        tacticTipsBtn.addEventListener('click', () => { tacticTipsModal.style.display = 'block'; });
        if (closeTacticTipsBtn) {
            closeTacticTipsBtn.addEventListener('click', () => { tacticTipsModal.style.display = 'none'; });
        }
        window.addEventListener('click', (e) => {
            if (e.target === tacticTipsModal) tacticTipsModal.style.display = 'none';
        });
    }

    // [통합] 전술 탭 가이드 버튼도 통합 전술 팁 모달(#tacticTipsModal)로 연결
    const guideBtn = document.getElementById('openEngineGuideBtn');
    const guideModal = document.getElementById('engineGuideModal');
    const closeGuideBtn = document.getElementById('closeEngineGuideModal');

    if (guideBtn) {
        guideBtn.addEventListener('click', () => {
            if (tacticTipsModal) tacticTipsModal.style.display = 'block';
            else if (guideModal) guideModal.style.display = 'block';
        });
    }
    if (guideModal && closeGuideBtn) {
        closeGuideBtn.addEventListener('click', () => guideModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === guideModal) guideModal.style.display = 'none';
        });
    }

    // 인터뷰 버튼
    document.querySelectorAll('.interview-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const option = this.dataset.option;
            handleInterview(option);
        });
    });

    // [신규] 감독실(비서 상담) 버튼 이벤트
    const officeBtn = document.getElementById('openOfficeBtn');
    if (officeBtn) {
        officeBtn.addEventListener('click', () => {
            if (typeof secretarySystem !== 'undefined') {
                secretarySystem.startConsultation();
            } else {
                alert('비서 시스템이 로드되지 않았습니다.');
            }
        });
    }

    // [신규] 5시즌 시뮬레이션 단축키 (Ctrl + Shift + S)
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            if (confirm("5시즌을 빠르게 시뮬레이션 하시겠습니까?\n(시간이 걸릴 수 있으며, 진행 중인 경기는 스킵됩니다.)")) {
                simulateMultipleSeasons(5);
            }
        }
    }); // keydown 이벤트 끝
} // setupEventListeners 함수 끝 (파일 전체의 끝이 아님에 주의!)

// ==================== [NEW] 나만의 팀 만들기 & 아이콘/커스텀 구단 창단 시스템 ====================

const RANDOM_CUSTOM_TEAM_NAMES = [
    "FC 서울시티", "네오 유나이티드", "골든 드림팀", "블루 피닉스", "블랙 드래곤스",
    "빅토리 스타즈", "레전드 일레븐", "인피니티 FC", "로얄 킹덤", "크라운 유나이티드",
    "사이버 FC", "마제스티 유나이티드", "판타지아 FC", "프라임 일레븐"
];

const RANDOM_KOREAN_PLAYER_NAMES = [
    "김민재", "이강인", "손흥민", "황희찬", "조규성", "설영우", "이재성", "황인범", "박용우", "정우영",
    "김승규", "조현우", "송범근", "김영권", "김진수", "김문환", "이기제", "홍현석", "배준호", "양현준",
    "오현규", "정상빈", "엄원상", "송민규", "백승호", "원두재", "이동경", "권창훈", "나상호", "김태환",
    "권경원", "정승현", "박진섭", "김주성", "이태석", "최준", "배서준", "강성진", "이영준", "고영준"
];

const RANDOM_GLOBAL_PLAYER_NAMES = [
    "하란드", "음바페", "벨링엄", "비니시우스", "사카", "로드리", "포든", "더브라위너", "살라", "케인",
    "무시알라", "비르츠", "야말", "페드리", "가비", "카마빙가", "추아메니", "발베르데", "반다이크", "살리바",
    "디아스", "그바르디올", "알폰소", "하키미", "테오", "쿠르투아", "알리송", "에데르송", "돈나룸마", "오블락",
    "라파엘 레앙", "라우타로", "오시멘", "로드리고", "바렐라", "바스토니", "마르키뉴스", "워커", "더리흐트"
];

let selectedIconIndices = new Set();
let currentIconPosFilter = "ALL";

// 팀 만들기 모달 열기
function openCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) modal.style.display = 'block';
    const modeSel = document.getElementById('createTeamModeSelection');
    if (modeSel) modeSel.style.display = 'grid';
    const iconArea = document.getElementById('iconTeamCreationArea');
    if (iconArea) iconArea.style.display = 'none';
    const customArea = document.getElementById('customTeamCreationArea');
    if (customArea) customArea.style.display = 'none';
}

function closeCreateTeamModal() {
    const modal = document.getElementById('createTeamModal');
    if (modal) modal.style.display = 'none';
}

// 아이콘 팀 생성 화면 표시
function showIconTeamCreation() {
    document.getElementById('createTeamModeSelection').style.display = 'none';
    document.getElementById('iconTeamCreationArea').style.display = 'block';

    // 교체할 팀 목록 채우기 (2부 리그)
    const teamSelect = document.getElementById('replacementTeamSelect');
    if (teamSelect) {
        teamSelect.replaceChildren();
        const league2Teams = Object.keys(allTeams).filter(key => allTeams[key].league === 2);
        league2Teams.forEach(teamKey => {
            const option = document.createElement('option');
            option.value = teamKey;
            option.textContent = teamNames[teamKey] || teamKey;
            teamSelect.appendChild(option);
        });
    }

    // 정렬 (GK -> DF -> MF -> FW)
    const positionOrder = { 'GK': 1, 'DF': 2, 'MF': 3, 'FW': 4 };
    iconPlayersList.sort((a, b) => {
        const posA = positionOrder[a.position] || 5;
        const posB = positionOrder[b.position] || 5;
        return posA - posB;
    });

    selectedIconIndices.clear();
    currentIconPosFilter = "ALL";
    renderIconPlayersList();
    updateSelectedCount();
}

function filterIconPlayers(pos) {
    currentIconPosFilter = pos;
    renderIconPlayersList();
}

function renderIconPlayersList() {
    const listContainer = document.getElementById('iconPlayerSelectionList');
    if (!listContainer) return;
    listContainer.replaceChildren();

    iconPlayersList.forEach((player, index) => {
        if (currentIconPosFilter !== "ALL" && player.position !== currentIconPosFilter) return;

        const isSelected = selectedIconIndices.has(index);
        const item = document.createElement('div');
        item.className = `icon-player-card-item ${isSelected ? 'selected' : ''}`.trim();

        const infoDiv = document.createElement('div');
        infoDiv.className = 'icon-player-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'icon-player-name';
        nameDiv.textContent = player.name;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'icon-player-meta';
        metaDiv.textContent = `${player.country} · OVR 81`;

        infoDiv.append(nameDiv, metaDiv);

        const rightDiv = document.createElement('div');
        rightDiv.style.cssText = 'display: flex; align-items: center; gap: 6px;';

        const tag = document.createElement('span');
        tag.className = `icon-pos-tag ${player.position}`;
        tag.textContent = player.position;

        const checkMark = document.createElement('span');
        checkMark.className = 'check-mark';
        checkMark.style.cssText = 'font-size: 0.9rem; color: #A3E635; display: inline-flex; align-items: center;';
        if (!isSelected) checkMark.style.display = 'none';
        checkMark.innerHTML = typeof iconSVG === 'function' ? iconSVG('check') : '';

        rightDiv.append(tag, checkMark);
        item.append(infoDiv, rightDiv);

        item.addEventListener('click', () => toggleIconPlayerSelection(index));
        listContainer.appendChild(item);
    });
}

function toggleIconPlayerSelection(index) {
    if (selectedIconIndices.has(index)) {
        selectedIconIndices.delete(index);
    } else {
        if (selectedIconIndices.size >= 18) {
            alert('최대 18명까지만 선택할 수 있습니다.');
            return;
        }
        selectedIconIndices.add(index);
    }
    renderIconPlayersList();
    updateSelectedCount();
}

function updateSelectedCount() {
    const count = selectedIconIndices.size;
    const countEl = document.getElementById('selectedCount');
    if (countEl) countEl.textContent = count;

    let gkCount = 0, dfCount = 0, mfCount = 0, fwCount = 0;
    selectedIconIndices.forEach(idx => {
        const p = iconPlayersList[idx];
        if (p.position === 'GK') gkCount++;
        else if (p.position === 'DF') dfCount++;
        else if (p.position === 'MF') mfCount++;
        else if (p.position === 'FW') fwCount++;
    });

    const cntGk = document.getElementById('cnt-GK');
    const cntDf = document.getElementById('cnt-DF');
    const cntMf = document.getElementById('cnt-MF');
    const cntFw = document.getElementById('cnt-FW');
    if (cntGk) cntGk.textContent = gkCount;
    if (cntDf) cntDf.textContent = dfCount;
    if (cntMf) cntMf.textContent = mfCount;
    if (cntFw) cntFw.textContent = fwCount;

    const pillGk = document.getElementById('pill-GK');
    const pillDf = document.getElementById('pill-DF');
    const pillMf = document.getElementById('pill-MF');
    const pillFw = document.getElementById('pill-FW');
    if (pillGk) pillGk.className = `pos-pill ${gkCount >= 2 ? 'ready' : ''}`;
    if (pillDf) pillDf.className = `pos-pill ${dfCount >= 5 ? 'ready' : ''}`;
    if (pillMf) pillMf.className = `pos-pill ${mfCount >= 5 ? 'ready' : ''}`;
    if (pillFw) pillFw.className = `pos-pill ${fwCount >= 1 ? 'ready' : ''}`;

    const confirmBtn = document.getElementById('confirmCreateTeamBtn');
    if (confirmBtn) {
        const isReady = count === 18 && gkCount >= 2 && dfCount >= 5 && mfCount >= 5 && fwCount >= 1;
        confirmBtn.disabled = !isReady;
    }
}

function autoDraftIconTeam() {
    selectedIconIndices.clear();

    const gks = [], dfs = [], mfs = [], fws = [];
    iconPlayersList.forEach((p, idx) => {
        if (p.position === 'GK') gks.push(idx);
        else if (p.position === 'DF') dfs.push(idx);
        else if (p.position === 'MF') mfs.push(idx);
        else if (p.position === 'FW') fws.push(idx);
    });

    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    // GK 2, DF 6, MF 5, FW 5
    shuffle(gks).slice(0, 2).forEach(i => selectedIconIndices.add(i));
    shuffle(dfs).slice(0, 6).forEach(i => selectedIconIndices.add(i));
    shuffle(mfs).slice(0, 5).forEach(i => selectedIconIndices.add(i));
    shuffle(fws).slice(0, 5).forEach(i => selectedIconIndices.add(i));

    renderIconPlayersList();
    updateSelectedCount();
}

function pickRandomIconTeamName() {
    const input = document.getElementById('customTeamName');
    if (input) {
        const randomName = RANDOM_CUSTOM_TEAM_NAMES[Math.floor(Math.random() * RANDOM_CUSTOM_TEAM_NAMES.length)];
        input.value = randomName.substring(0, 6);
    }
}

function createIconTeam() {
    const teamNameInput = (document.getElementById('customTeamName').value || '').trim();
    if (!teamNameInput) return alert('팀 이름을 입력해주세요.');
    if (teamNameInput.length > 6) return alert('팀 이름은 6글자 이내여야 합니다.');
    if (selectedIconIndices.size !== 18) return alert('선수 18명을 모두 선택해야 합니다.');

    const replacedTeamKey = document.getElementById('replacementTeamSelect').value;
    if (!replacedTeamKey || !allTeams[replacedTeamKey]) return alert('교체할 팀을 선택해주세요.');

    const budgetVal = parseInt(document.getElementById('iconTeamBudgetSelect')?.value) || 300;

    const newPlayers = Array.from(selectedIconIndices).map(index => {
        const p = iconPlayersList[index];
        return {
            name: p.name,
            position: p.position,
            country: p.country,
            age: 19,
            rating: 81,
            isIcon: true
        };
    });

    const newTeamKey = teamNameInput;
    allTeams[newTeamKey] = {
        league: allTeams[replacedTeamKey].league,
        players: newPlayers,
        description: "전설적인 아이콘들이 모인 나만의 드림팀",
        displayName: teamNameInput,
        logoCode: "DFT",
        isIcon: true,
        budget: budgetVal
    };
    teams[newTeamKey] = newPlayers;
    teamNames[newTeamKey] = teamNameInput;

    if (replacedTeamKey !== newTeamKey) {
        delete allTeams[replacedTeamKey];
        delete teams[replacedTeamKey];
        delete teamNames[replacedTeamKey];
    }

    // 개인 기록 시스템에 선수 등록
    if (typeof leagueBasedRecordsSystem !== 'undefined' && leagueBasedRecordsSystem) {
        newPlayers.forEach(p => {
            leagueBasedRecordsSystem.initializePlayer(p.name, newTeamKey, p.position);
        });
    }

    gameData.teamMoney = budgetVal;
    gameData.schedule = null;
    initializeLeagueData();

    closeCreateTeamModal();
    selectTeam(newTeamKey);
}

// 커스텀 팀 생성 화면 표시
function showCustomTeamCreation() {
    document.getElementById('createTeamModeSelection').style.display = 'none';
    document.getElementById('customTeamCreationArea').style.display = 'block';

    updateCustomReplacementTeams();
    generateCustomPlayerInputs();
}

function updateCustomReplacementTeams() {
    const league = parseInt(document.getElementById('customLeagueSelect').value) || 2;
    const select = document.getElementById('customReplacementSelect');
    if (!select) return;
    select.replaceChildren();

    const leagueTeams = Object.keys(allTeams).filter(key => allTeams[key].league === league);
    leagueTeams.forEach(teamKey => {
        const option = document.createElement('option');
        option.value = teamKey;
        option.textContent = teamNames[teamKey] || teamKey;
        select.appendChild(option);
    });
}

function generateCustomPlayerInputs() {
    const container = document.getElementById('customPlayerInputs');
    if (!container) return;
    container.replaceChildren();

    const structure = [
        { pos: 'GK', count: 2 },
        { pos: 'DF', count: 6 },
        { pos: 'MF', count: 5 },
        { pos: 'FW', count: 5 }
    ];

    structure.forEach(group => {
        for (let i = 1; i <= group.count; i++) {
            const div = document.createElement('div');
            div.className = 'custom-player-row-item';

            const tag = document.createElement('span');
            tag.className = `icon-pos-tag ${group.pos}`;
            tag.textContent = `${group.pos} ${i}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'custom-player-input';
            input.dataset.pos = group.pos;
            input.placeholder = '선수 이름 입력';
            input.maxLength = 12;

            const diceBtn = document.createElement('button');
            diceBtn.type = 'button';
            diceBtn.className = 'dice-mini-btn';
            diceBtn.title = '랜덤 이름 추천';
            diceBtn.innerHTML = typeof iconSVG === 'function' ? iconSVG('refresh') : 'RND';
            diceBtn.onclick = () => randomizeSingleCustomPlayer(input, group.pos);

            div.append(tag, input, diceBtn);
            container.appendChild(div);
        }
    });
}

function pickRandomCustomTeamName() {
    const input = document.getElementById('customTeamNameInput');
    if (input) {
        const randomName = RANDOM_CUSTOM_TEAM_NAMES[Math.floor(Math.random() * RANDOM_CUSTOM_TEAM_NAMES.length)];
        input.value = randomName.substring(0, 6);
    }
}

function randomizeSingleCustomPlayer(inputEl, pos) {
    const nation = document.getElementById('customNationSelect')?.value || '대한민국';
    const pool = (nation === '대한민국') ? RANDOM_KOREAN_PLAYER_NAMES : RANDOM_GLOBAL_PLAYER_NAMES;
    const randomName = pool[Math.floor(Math.random() * pool.length)];
    inputEl.value = randomName;
}

function autoFillCustomPlayers() {
    const nation = document.getElementById('customNationSelect')?.value || '대한민국';
    const pool = [...((nation === '대한민국') ? RANDOM_KOREAN_PLAYER_NAMES : RANDOM_GLOBAL_PLAYER_NAMES)].sort(() => Math.random() - 0.5);
    const inputs = document.querySelectorAll('.custom-player-input');

    inputs.forEach((input, idx) => {
        input.value = pool[idx % pool.length] + (idx >= pool.length ? ` ${idx}` : '');
    });
}

function createCustomTeam() {
    const teamNameInput = (document.getElementById('customTeamNameInput').value || '').trim();
    if (!teamNameInput) return alert('팀 이름을 입력해주세요.');
    if (teamNameInput.length > 6) return alert('팀 이름은 6글자 이내여야 합니다.');

    const replacedTeamKey = document.getElementById('customReplacementSelect').value;
    const nation = document.getElementById('customNationSelect').value;
    const budgetVal = parseInt(document.getElementById('customBudgetSelect')?.value) || 300;

    if (!replacedTeamKey || !allTeams[replacedTeamKey]) return alert('교체할 팀을 선택해주세요.');

    // 교체 대상 팀의 리그와 무조건 일치시켜 리그별 14팀 균형 보장
    const targetLeague = allTeams[replacedTeamKey].league || parseInt(document.getElementById('customLeagueSelect').value) || 2;

    const inputs = document.querySelectorAll('.custom-player-input');
    const newPlayers = [];
    const pool = (nation === '대한민국') ? RANDOM_KOREAN_PLAYER_NAMES : RANDOM_GLOBAL_PLAYER_NAMES;
    const usedNames = new Set();

    let minRating, maxRating;
    if (targetLeague === 1) { minRating = 80; maxRating = 86; }
    else if (targetLeague === 2) { minRating = 78; maxRating = 84; }
    else { minRating = 70; maxRating = 75; }

    inputs.forEach((input, index) => {
        let name = input.value.trim();
        if (!name) {
            name = pool[index % pool.length];
        }

        let uniqueName = name;
        let counter = 1;
        while (usedNames.has(uniqueName)) {
            uniqueName = `${name}_${counter++}`;
        }
        usedNames.add(uniqueName);

        const pos = input.dataset.pos || 'MF';
        const rating = Math.floor(Math.random() * (maxRating - minRating + 1)) + minRating;
        const age = Math.floor(Math.random() * 6) + 18;

        let playerNation = nation;
        if (nation === 'random') {
            const nations = ['대한민국', '잉글랜드', '스페인', '독일', '프랑스', '이탈리아', '브라질', '아르헨티나', '네덜란드', '포르투갈'];
            playerNation = nations[Math.floor(Math.random() * nations.length)];
        }

        newPlayers.push({
            name: uniqueName,
            position: pos,
            country: playerNation,
            age: age,
            rating: rating,
            isCustom: true
        });
    });

    const newTeamKey = teamNameInput;
    allTeams[newTeamKey] = {
        league: targetLeague,
        players: newPlayers,
        description: "직접 창단한 나만의 커스텀 명문 구단",
        displayName: teamNameInput,
        logoCode: "DFT",
        isCustom: true,
        budget: budgetVal
    };
    teams[newTeamKey] = newPlayers;
    teamNames[newTeamKey] = teamNameInput;

    if (replacedTeamKey !== newTeamKey) {
        delete allTeams[replacedTeamKey];
        delete teams[replacedTeamKey];
        delete teamNames[replacedTeamKey];
    }

    // 개인 기록 시스템에 선수 등록
    if (typeof leagueBasedRecordsSystem !== 'undefined' && leagueBasedRecordsSystem) {
        newPlayers.forEach(p => {
            leagueBasedRecordsSystem.initializePlayer(p.name, newTeamKey, p.position);
        });
    }

    gameData.teamMoney = budgetVal;
    gameData.schedule = null;
    initializeLeagueData();

    closeCreateTeamModal();
    selectTeam(newTeamKey);
}

function selectTeam(teamKey) {
    gameData.selectedTeam = teamKey;
    gameData.currentLeague = allTeams[teamKey].league; // 팀의 리그 설정

    // [수정] 팀별 고유 시작 자금 적용 (budget 속성이 있으면 사용, 없으면 리그별 기본값)
    if (allTeams[teamKey].budget !== undefined) {
        gameData.teamMoney = allTeams[teamKey].budget;
    } else {
        gameData.teamMoney = (gameData.currentLeague === 3) ? 10 : 1000;
    }

    applyTeamTheme(teamKey);

    // [신규] 초기 주급 계산
    calculateTotalWages();
    if (typeof initializeTeamFinance === 'function') {
        initializeTeamFinance();
    }

    const teamNameEl = document.getElementById('teamName');
    if (teamNameEl) {
        teamNameEl.replaceChildren(createTeamLogoElement(teamKey), document.createTextNode(' ' + (teamNames[teamKey] || teamKey)));
    }

    // 자동으로 최고 능력치 선수들로 스쿼드 채우기
    autoFillSquad();

    // 선수 성장 시스템 초기화
    if (typeof playerGrowthSystem !== 'undefined') {
        playerGrowthSystem.initializePlayerGrowth();
    }

    // 이적 시스템 초기화
    if (typeof transferSystem !== 'undefined') {
        transferSystem.initializeTransferMarket();
    }

    // DNA 시스템 초기화 (추가)
    if (typeof window.initializeTacticMastery === 'function') {
        gameData.tacticMastery = {};
        window.initializeTacticMastery(teamKey);
    }
    if (typeof DNAManager !== 'undefined') {
        DNAManager.initialize(teams[teamKey]);
    }

    // 개인기록 시스템 초기화
    if (typeof recordsSystem !== 'undefined') {
        recordsSystem.initialize();
    }

    // [신규] 스타디움 시스템 초기화
    if (typeof stadiumSystem !== 'undefined') {
        stadiumSystem.initUserStadium(teamKey);
    }

    // 스케줄이 없으면 생성
    if (!gameData.schedule) {
        generateFullSchedule();
    }

    // [신규] 통합 FA컵 토너먼트 초기화
    if (typeof faCupManager !== 'undefined' && !gameData.isWorldCupMode) {
        faCupManager.initSeason();
    }

    // 상대팀 설정 (리그 또는 FA컵)
    if (typeof TeamUtils !== 'undefined') {
        TeamUtils.initializeAllAIFormations();
    }
    setNextOpponent();

    // 로비 진입 공통 처리 함수
    const enterLobby = () => {
        showScreen('lobby');
        displayTeamPlayers();
        showDashboard(); // [수정] 로비 진입 시 대시보드 표시
        updateDisplay();
        displaySponsors();

        // 환영 메일 발송
        if (typeof mailManager !== 'undefined') {
            mailManager.sendWelcomeMail();
        }

        // 배경음악 재생 시작
        if (typeof audioManager !== 'undefined') {
            audioManager.init();
            audioManager.play();
        }

        // 튜토리얼 시작 (처음인 경우)
        if (window.tutorialSystem) {
            window.tutorialSystem.init();
        }
    };

    // 오프닝 시네마틱 연출 실행 (스킵 또는 종료 시 로비 진입)
    if (typeof playCinematicIntro === 'function') {
        playCinematicIntro({
            teamKey: teamKey,
            onComplete: enterLobby
        });
    } else {
        enterLobby();
    }

    // [신규] 랜덤 이벤트 트리거 (경기 전/후 등 적절한 시점에 호출 가능)
    if (typeof secretarySystem !== 'undefined') {
        // secretarySystem.triggerRandomEvent(); // 테스트용, 실제로는 경기 전후에 호출
    }
}

// 자동으로 스쿼드 채우기 함수 (팀의 최적 실축 포메이션 기반 자동 선발)
function autoFillSquad() {
    if (!gameData || !gameData.selectedTeam) return;

    if (typeof TeamUtils !== 'undefined' && TeamUtils.calculateBestFormation) {
        const best = TeamUtils.calculateBestFormation(gameData.selectedTeam);
        if (best && best.squad && best.squadLines) {
            gameData.squad = {
                gk: best.squad.gk,
                df: [...best.squad.df],
                mf: [...best.squad.mf],
                fw: [...best.squad.fw]
            };
            gameData.squadLines = {
                TOP: [...best.squadLines.TOP],
                AM: [...best.squadLines.AM],
                CM: [...best.squadLines.CM],
                DM: [...best.squadLines.DM],
                DF: [...best.squadLines.DF],
                GK: [...best.squadLines.GK]
            };
            gameData.currentFormation = best.formationName || best.formation;

            if (window.refreshFormation) {
                window.refreshFormation();
            }
            return;
        }
    }

    const teamPlayers = teams[gameData.selectedTeam] || [];
    const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
    const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
    const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
    const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);

    if (gks.length > 0) gameData.squad.gk = gks[0];
    for (let i = 0; i < 4 && i < dfs.length; i++) gameData.squad.df[i] = dfs[i];
    for (let i = 0; i < 3 && i < mfs.length; i++) gameData.squad.mf[i] = mfs[i];
    for (let i = 0; i < 3 && i < fws.length; i++) gameData.squad.fw[i] = fws[i];

    if (window.refreshFormation) {
        window.refreshFormation();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // [수정] 스페셜 모드 버튼 (월드컵 / 레전드 리그) 표시/숨김 처리
    const wcBtn = document.getElementById('worldCupBtn');
    if (wcBtn) {
        if (screenId === 'teamSelection') {
            if (typeof gameData !== 'undefined' && gameData.isLegendMode) {
                wcBtn.style.display = 'none';
            } else {
                wcBtn.style.display = 'inline-flex';
            }
        } else {
            wcBtn.style.display = 'none';
        }
    }

    const legendBtn = document.getElementById('legendLeagueBtn');
    if (legendBtn) {
        if (screenId === 'teamSelection') {
            if (typeof gameData !== 'undefined' && gameData.isLegendMode) {
                legendBtn.style.display = 'none';
            } else {
                legendBtn.style.display = 'inline-flex';
            }
        } else {
            legendBtn.style.display = 'none';
        }
    }
}

// [신규] 가로(와이드) 화면 여부 - 이 경우 벤토 대시보드 대신 좌측 사이드바 + 우측 콘텐츠 레이아웃 사용
const LANDSCAPE_LAYOUT_QUERY = '(min-width: 900px) and (orientation: landscape)';
function isLandscapeLayout() {
    return window.matchMedia(LANDSCAPE_LAYOUT_QUERY).matches;
}

// [신규] 경기 탭의 현재 전술 디스플레이 업데이트 (FM 스타일 전술 철학 및 커스텀 슬롯 반영)
function updateMatchTabCurrentTacticDisplay() {
    const rawKey = gameData.currentTactic || 'balanced';
    const curKey = (typeof window.normalizeTacticKey === 'function') ? window.normalizeTacticKey(rawKey) : rawKey;
    gameData.currentTactic = curKey;

    // 숨겨진 셀렉트가 있다면 동기화 (기존 코드 호환성)
    const tacticSelect = document.getElementById('tacticSelect');
    if (tacticSelect) tacticSelect.value = curKey;

    const nameEl = document.getElementById('currentTacticNameDisplay');
    const descEl = document.getElementById('currentTacticDescDisplay');
    const tagsEl = document.getElementById('currentTacticTagsDisplay');
    if (!nameEl || !descEl || !tagsEl) return;

    const tacticMap = {
        gegenpress: {
            name: '게겐프레싱',
            desc: '높은 수비 라인과 즉각 재압박(게겐프레싱)으로 상대 진영에서 볼을 탈취해 빠른 역습을 노립니다.',
            tags: [{ text: '즉각 재압박', type: 'press' }, { text: '빠른 템포', type: 'tempo' }, { text: '하이 라인', type: 'mentality' }]
        },
        tikitaka: {
            name: '티키타카',
            desc: '짧고 정교한 삼각 원터치 패스를 연속 연결하여 볼 점유율을 지배하고 문전 공간을 엽니다.',
            tags: [{ text: '극단적 숏패스', type: 'tempo' }, { text: '점유율 지배', type: 'mentality' }, { text: '전방 재압박', type: 'press' }]
        },
        verticalTikitaka: {
            name: '수직 티키타카',
            desc: '변형 3백 빌드업과 짧고 빠른 수직 전진 패스로 하프스페이스를 공략하는 현대식 전술입니다.',
            tags: [{ text: '수직 전진 패스', type: 'tempo' }, { text: '하프스페이스', type: 'mentality' }, { text: '변형 3백 빌드업', type: 'press' }]
        },
        possession: {
            name: '컨트롤 포제션',
            desc: '안정적인 볼 순환과 침착한 템포 조절로 체력을 아끼며 경기 흐름을 완벽히 통제합니다.',
            tags: [{ text: '경기 흐름 통제', type: 'mentality' }, { text: '안정된 지공', type: 'tempo' }, { text: '체력 세이브', type: 'press' }]
        },
        wingPlay: {
            name: '윙 플레이',
            desc: '측면 터치라인 끝까지 벌린 윙어와 풀백의 오버래핑·크로스로 박스 안을 폭격합니다.',
            tags: [{ text: '측면 오버래핑', type: 'tempo' }, { text: '넓은 좌우 폭', type: 'mentality' }, { text: '크로스 집중', type: 'press' }]
        },
        directCounter: {
            name: '플루이드 역습',
            desc: '단단한 미드 블록으로 상대 공격을 흡수한 뒤 볼 탈취 즉시 전방 공간으로 빠르게 역습합니다.',
            tags: [{ text: '미드 블록', type: 'press' }, { text: '직선 역습', type: 'tempo' }, { text: '실리적 전환', type: 'mentality' }]
        },
        lowBlockCounter: {
            name: '로우 블록',
            desc: '수비 라인을 깊게 내리고 박스 안 공간을 잠근 뒤 최전방 스피드로 한 방의 롱카운터를 노립니다.',
            tags: [{ text: '로우 블록(텐백)', type: 'press' }, { text: '롱카운터', type: 'tempo' }, { text: '선수비 후역습', type: 'mentality' }]
        },
        catenaccio: {
            name: '카테나치오',
            desc: '이탈리아식 철벽 수비 조직력과 대인 마크로 실점을 원천 봉쇄하는 빗장수비 전술입니다.',
            tags: [{ text: '빗장 수비', type: 'press' }, { text: '최소 실점', type: 'mentality' }, { text: '느린 템포', type: 'tempo' }]
        },
        routeOne: {
            name: '루트 원 롱볼',
            desc: '중원 압박을 생략하고 최전방 타겟맨과 뒷공간으로 곧바로 긴 패스를 투입해 세컨볼 승부를 겁니다.',
            tags: [{ text: '루트 원 롱패스', type: 'tempo' }, { text: '세컨볼 경합', type: 'press' }, { text: '직선 전개', type: 'mentality' }]
        },
        totalFootball: {
            name: '토탈 풋볼',
            desc: '전 포지션이 유기적으로 스위칭하며 공격과 수비 전역에서 수적 우위를 점하는 전원 축구입니다.',
            tags: [{ text: '전원 공수 가담', type: 'mentality' }, { text: '포지션 스위칭', type: 'press' }, { text: '높은 활동량', type: 'tempo' }]
        },
        balanced: {
            name: '밸런스',
            desc: '공수 균형을 맞춘 표준 전술입니다. [전술] 탭에서 8대 지침과 선수 롤을 자유롭게 설계하세요.',
            tags: [{ text: '공수 균형', type: 'mentality' }, { text: '표준 템포', type: 'tempo' }, { text: '유연한 대응', type: 'press' }]
        }
    };

    const info = tacticMap[curKey] || tacticMap.balanced;
    const customSlotName = (typeof gameData.activeCustomSlot === 'number' && gameData.customTactics?.[gameData.activeCustomSlot])
        ? ` (★ ${gameData.customTactics[gameData.activeCustomSlot].name})`
        : '';

    nameEl.textContent = `${info.name}${customSlotName}`;
    descEl.textContent = info.desc;
    tagsEl.replaceChildren();

    // 6대 전술 설정이 있을 경우 실시간 세부 태그 반영
    if (gameData.tacticSettings) {
        const ts = gameData.tacticSettings;
        const customTags = [];
        if (ts.buildUp === 'direct') customTags.push({ text: '다이렉트 빌드업', type: 'tempo' });
        else if (ts.buildUp === 'back3') customTags.push({ text: '변형 3백 빌드업', type: 'mentality' });
        else customTags.push({ text: '후방 숏패스', type: 'mentality' });

        if (ts.defensiveLine === 'high') customTags.push({ text: '하이 프레스 라인', type: 'press' });
        else if (ts.defensiveLine === 'low') customTags.push({ text: '로우 블록 (텐백)', type: 'press' });

        if (ts.width === 'wide') customTags.push({ text: '넓은 너비 (측면 우회)', type: 'tempo' });
        else if (ts.width === 'narrow') customTags.push({ text: '좁은 너비 (중앙 집약)', type: 'mentality' });

        if (ts.offensiveTrans === 'counter') customTags.push({ text: '즉시 카운터 역습', type: 'press' });
        if (ts.tempo === 'fast') customTags.push({ text: '빠른 템포', type: 'tempo' });

        customTags.slice(0, 4).forEach(t => {
            const span = document.createElement('span');
            span.className = `tactic-tag tag-${t.type}`;
            span.textContent = t.text;
            tagsEl.appendChild(span);
        });
    } else {
        info.tags.forEach(t => {
            const span = document.createElement('span');
            span.className = `tactic-tag tag-${t.type}`;
            span.textContent = t.text;
            tagsEl.appendChild(span);
        });
    }

    // 현재 전술 숙련도(Familiarity) 게이지 및 텍스트 업데이트 (50% 미만 페널티 반영)
    const masteryPct = (typeof window.getTacticMasteryPct === 'function')
        ? window.getTacticMasteryPct(curKey)
        : Math.min(100, Math.max(0, Number(gameData.tacticMastery?.[curKey] ?? 50)));
    const eff = (typeof window.getTacticMasteryEffect === 'function')
        ? window.getTacticMasteryEffect(masteryPct)
        : {
            tier: masteryPct >= 85 ? '완벽 체화' : (masteryPct >= 65 ? '숙련' : (masteryPct > 50 ? '적응 완료' : (masteryPct === 50 ? '적응 중 (기준)' : '미숙 (페널티)'))),
            signedText: `${masteryPct - 50 > 0 ? '+' : ''}${(((masteryPct - 50) / 50) * 5).toFixed(1)}%`,
            color: masteryPct < 50 ? '#F87171' : (masteryPct === 50 ? '#FBBF24' : '#34D399')
        };

    const masteryTxtEl = document.getElementById('currentTacticMasteryText');
    const masteryBarEl = document.getElementById('currentTacticMasteryBar');
    if (masteryTxtEl) {
        masteryTxtEl.textContent = `${masteryPct}% · ${eff.tier} (전술 효율 ${eff.signedText})`;
        masteryTxtEl.style.color = eff.color;
    }
    if (masteryBarEl) {
        masteryBarEl.style.width = `${masteryPct}%`;
        masteryBarEl.style.background = masteryPct < 50
            ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
            : (masteryPct === 50 ? 'linear-gradient(90deg, #F59E0B, #38BDF8)' : 'linear-gradient(90deg, #38BDF8, #34D399)');
    }
}
window.updateMatchTabCurrentTacticDisplay = updateMatchTabCurrentTacticDisplay;
window.updateCurrentTacticPanelUI = updateMatchTabCurrentTacticDisplay;

// [신규] 경기 탭 내 시즌 일정 & FA컵/UCL 토너먼트 대진표 인라인 렌더링
function renderMatchTabScheduleOrBracket(mode) {
    const panel = document.getElementById('matchScheduleAndBracketPanel');
    if (!panel || typeof cupCompetitionManager === 'undefined') return;
    if (gameData && gameData.isWorldCupMode) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    if (mode) {
        window._matchTabInlineMode = mode;
    } else if (!window._matchTabInlineMode) {
        if (gameData && gameData.isUCLMatch) window._matchTabInlineMode = 'ucl';
        else if (gameData && gameData.isFACupMatch) window._matchTabInlineMode = 'fa';
        else window._matchTabInlineMode = 'schedule';
    }

    const curMode = window._matchTabInlineMode;
    const rerenderInline = () => {
        if (curMode === 'fa') {
            panel.innerHTML = cupCompetitionManager.buildFAContentHTML();
        } else if (curMode === 'ucl') {
            panel.innerHTML = cupCompetitionManager.buildUCLContentHTML();
        } else {
            panel.innerHTML = cupCompetitionManager.buildSeasonScheduleHTML();
        }
        cupCompetitionManager.bindInteractiveControls(panel, rerenderInline);
    };
    rerenderInline();
}
window.renderMatchTabScheduleOrBracket = renderMatchTabScheduleOrBracket;

// [신규] 탭 버튼 라벨 교체 (아이콘/텍스트 span 구조 유지)
function setTabButtonLabel(btn, iconName, label) {
    if (!btn) return;
    btn.textContent = '';
    const ico = document.createElement('span');
    ico.className = 'tab-ico';
    if (typeof createIcon === 'function') ico.appendChild(createIcon(iconName));
    const lab = document.createElement('span');
    lab.className = 'tab-label';
    lab.textContent = label;
    btn.append(ico, lab);
}
window.setTabButtonLabel = setTabButtonLabel;

function showTab(tabName) {
    // [신규] 대시보드 숨기고 탭 컨텐츠 표시
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('tab-content-area').style.display = 'block';
    document.getElementById('homeBtn').style.display = 'block'; // 홈 버튼 표시
    const lobbyTabs = document.getElementById('main-tabs');
    if (lobbyTabs) lobbyTabs.style.display = 'flex'; // 상단 탭 표시하여 다른 탭으로 빠른 전환 지원

    // 기존 탭 로직 유지

    // [추가] 월드컵 모드 탭 제어
    if (gameData.isWorldCupMode) {
        // 허용된 탭: squad, match, tactics, settings, records(대회기록), callup(차출)
        // 차단된 탭: transfer, league, sponsor, youth, sns, transfer_news, mail, stadium
        const blockedTabs = ['transfer', 'league', 'sponsor', 'youth', 'sns', 'transfer_news', 'mail', 'stadium'];

        if (blockedTabs.includes(tabName)) {
            return;
        }

        // 'records'탭 클릭 시 월드컵 기록 화면 표시
        if (tabName === 'records') {
            if (typeof WorldCupManager !== 'undefined') {
                WorldCupManager.renderRecordsTab();
            }
        }

        // 'callup'탭 (이적 탭 자리에 대신 사용)
        if (tabName === 'callup') {
            if (typeof WorldCupManager !== 'undefined') {
                WorldCupManager.renderCallUpTab();
            }
            // callup 탭 활성화 (UI적으로는 transfer 탭을 사용)
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const btn = document.querySelector(`[data-tab="transfer"]`); // 차출 버튼은 transfer 버튼을 재활용
            if (btn) btn.classList.add('active');

            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            const panel = document.getElementById('transfer'); // 패널도 transfer 재활용
            if (panel) panel.classList.add('active');
            return;
        }
    }

    // [추가] 매치 탭 예외 처리 (대시보드에서 호출 시)
    if (tabName === 'match') {
        // 탭 전환만 하고 경기 시작은 버튼으로 하도록 변경 (바로 시작하면 캘린더 효과를 못 봄)

        // [추가] 경기 탭의 현재 전술 디스플레이 동기화
        if (typeof updateMatchTabCurrentTacticDisplay === 'function') {
            updateMatchTabCurrentTacticDisplay();
        }
        if (typeof renderMatchTabScheduleOrBracket === 'function') {
            renderMatchTabScheduleOrBracket();
        }
    }

    // 탭 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        // [신규] 상단바 제목 갱신 (가로 레이아웃)
        const titleEl = document.getElementById('topbarTitle');
        const labelEl = activeBtn.querySelector('.tab-label');
        if (titleEl && labelEl) titleEl.textContent = labelEl.textContent;
    }

    // 탭 패널 표시
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(tabName);
    if (activePanel) {
        activePanel.classList.add('active');
    } else {
        console.error(`Tab panel not found: ${tabName}`);
        return;
    }

    // 탭별 초기화
    switch (tabName) {
        case 'squad':
            if (window.refreshFormation) {
                window.refreshFormation();
            }
            displayTeamPlayers(); // 선수 목록은 계속 표시
            break;

        case 'transfer':
            if (typeof displayTransferPlayers === 'function') {
                displayTransferPlayers();
            }
            break;

        case 'transfer_news': // [추가] 이적 뉴스 탭 처리
            if (typeof displayTransferNews === 'function') {
                displayTransferNews();
            }
            break;

        case 'finance':
            if (typeof renderFinanceTab === 'function') {
                renderFinanceTab();
            }
            break;

        case 'stadium':
            if (typeof stadiumSystem !== 'undefined' && typeof stadiumSystem.renderTab === 'function') {
                stadiumSystem.renderTab();
            }
            break;

        case 'chat':
            if (typeof renderChatTab === 'function') {
                renderChatTab();
            }
            break;

        case 'tactics': // 전술 탭 추가
            if (typeof DNAManager !== 'undefined') {
                console.log('Tactics tab opened, calling DNAManager.renderUI()');
                DNAManager.renderUI();
            }
            // [신규] 탭이 열릴 때 세부 전술 UI도 초기화
            if (typeof DeepTacticManager !== 'undefined') {
                DeepTacticManager.init();
            }
            break;

        case 'league':
            displayLeagueTable();
            break;

        case 'sponsor':
            displaySponsors();
            break;

        case 'records':
            if (typeof updateRecordsTab === 'function') {
                updateRecordsTab();
            }
            break;

        case 'sns':
            // SNS 매니저가 존재하는지 확인
            if (typeof snsManager !== 'undefined') {
                // SNS 피드 표시
                snsManager.displayFeed('snsFeed', 15);
            } else {
                // SNS 시스템이 아직 로드되지 않은 경우
                console.log('SNS 시스템을 로딩 중입니다...');

                // SNS 컨테이너가 있다면 로딩 메시지 표시
                const feedContainer = document.getElementById('snsFeed');
                if (feedContainer) {
                    feedContainer.replaceChildren();
                    const emptyDiv = document.createElement('div');
                    emptyDiv.className = 'sns-empty';
                    emptyDiv.textContent = 'SNS 시스템을 초기화하는 중입니다...';
                    feedContainer.appendChild(emptyDiv);
                }

                // 잠시 후 다시 시도
                setTimeout(() => {
                    if (typeof snsManager !== 'undefined') {
                        snsManager.displayFeed('snsFeed', 15);
                    } else {
                        // 여전히 로드되지 않은 경우 에러 메시지
                        if (feedContainer) {
                            feedContainer.replaceChildren();
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'sns-empty';
                            errorDiv.textContent = 'SNS 시스템을 불러올 수 없습니다. 페이지를 새로고침해 주세요.';
                            feedContainer.appendChild(errorDiv);
                        }
                    }
                }, 500);
            }
            break;

        case 'mail':
            if (typeof mailManager !== 'undefined') {
                mailManager.renderList();
            }
            break;

        case 'settings':
            // 설정 탭을 열 때마다 슬롯 UI 생성
            createSaveSlots();
            // 오디오 설정 UI 생성
            if (typeof renderAudioSettings === 'function') {
                renderAudioSettings();
            }
            // 일반 설정 UI 생성
            if (typeof renderGeneralSettings === 'function') {
                renderGeneralSettings();
            }
            break;

        case 'youth':
            displayYouthPlayers();
            // 스카우트 UI도 함께 표시
            if (typeof displayScoutingScreen === 'function') {
                displayScoutingScreen();
            }
            break;

        case 'growth': // 성장 현황 탭
            if (typeof playerGrowthSystem !== 'undefined' && typeof playerGrowthSystem.renderGrowthTab === 'function') {
                playerGrowthSystem.renderGrowthTab();
            }
            break;

        default:
            console.log(`Unknown tab: ${tabName}`);
            break;
    }
}


// ==================== [신규] 커스텀 커서 시스템 ====================

const cursorStyle = document.createElement('style');
cursorStyle.textContent = `body.custom-cursor-active, body.custom-cursor-active * {
        cursor: none !important;
    }
    .custom-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        pointer-events: none;
        z-index: 99999;
        transform-origin: center center;
        mix-blend-mode: difference;
        transition: width 0.2s cubic-bezier(0.25, 1, 0.5, 1), height 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s, border-radius 0.2s;
    }
    .custom-cursor.targeting {
        background-color: transparent;
        border-radius: 4px;
    }
    .custom-cursor-corner {
        position: absolute;
        width: 10px;
        height: 10px;
        background-color: transparent;
        transition: transform 0.1s ease-out, opacity 0.2s;
        opacity: 0;
    }
    .custom-cursor.targeting .custom-cursor-corner {
        opacity: 1;
    }
    .custom-cursor-corner-tl { top: -2px; left: -2px; border-top: 2px solid white; border-left: 2px solid white; }
    .custom-cursor-corner-tr { top: -2px; right: -2px; border-top: 2px solid white; border-right: 2px solid white; }
    .custom-cursor-corner-bl { bottom: -2px; left: -2px; border-bottom: 2px solid white; border-left: 2px solid white; }
    .custom-cursor-corner-br { bottom: -2px; right: -2px; border-bottom: 2px solid white; border-right: 2px solid white; }
`;
document.head.appendChild(cursorStyle);

class CustomCursor {
    constructor(options = {}) {
        this.options = {
            targetSelector: 'a, button, .btn, .team-card, .tab-btn, .player-slot, .interview-btn, .scout-card, .mail-item, select, input, [onclick], .dashboard-card, .player-card, .transfer-player, .league-switch-btn, .sponsor-card, .settings-section',
            hideDefaultCursor: true,
            hoverDuration: 0.2,
            parallaxOn: true,
            parallaxAmount: 5,
            ...options
        };

        this.cursorEl = null;
        this.corners = {};
        this.pos = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        this.isTargeting = false;
        this.target = null;
        this.animationFrame = null;

        // [신규] 게임패드 관련 변수
        this.gamepadIndex = null;
        this.buttonStates = {};
        this.cursorSpeed = 12; // 커서 이동 속도
        this.scrollSpeed = 15; // 스크롤 속도
        this.deadzone = 0.1;   // 데드존
        this.dpadCooldown = 150; // D-pad 연타 방지 쿨다운 (ms)
        this.vibrationTimer = null; // [신규] 진동 타이머

        this.init();
    }

    init() {
        // 한글 파일명 호환성 문제를 위해 영문명으로 변경 (파일 이름도 변경 필요)
        this.hoverSound = new Audio('assets/SFX/hover.mp3');
        this.clickSound = new Audio('assets/SFX/click.mp3');

        this.hoverSound.onerror = () => console.warn("Hover sound not found: assets/SFX/hover.mp3");
        this.clickSound.onerror = () => console.warn("Click sound not found: assets/SFX/click.mp3");

        if (typeof audioManager !== 'undefined') {
            this.hoverSound.volume = audioManager.sfxVolume / 100;
            this.clickSound.volume = audioManager.sfxVolume / 100;
        } else { // Fallback if audioManager is not yet initialized
            this.hoverSound.volume = 0.5;
            this.clickSound.volume = 0.5;
        }

        // [신규] 모바일 장치 감지 (터치 스크린)
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

        if (isMobile) {
            return;
        }

        const isEnabled = gameData.settings && gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : false;
        this.isEnabled = isEnabled;

        if (isEnabled && this.options.hideDefaultCursor) {
            document.body.classList.add('custom-cursor-active');
        }

        // [신규] 게임패드 연결 이벤트
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log("컨트롤러 연결됨:", e.gamepad.id);
            // 연결 시 현재 마우스 위치로 초기화 (튀는 현상 방지)
            this.mouse.x = this.pos.x;
            this.mouse.y = this.pos.y;
            // 연결 시 진동 피드백
            if (e.gamepad.vibrationActuator) {
                this.triggerVibration(100, 0.5, 0.2);
            }
        });
        window.addEventListener("gamepaddisconnected", (e) => {
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
                console.log("컨트롤러 연결 해제됨");
            }
        });

        this.createCursor();

        if (!isEnabled && this.cursorEl) {
            this.cursorEl.style.display = 'none';
        }

        this.addEventListeners();
        this.startAnimation();
    }

    toggle(isOn) {
        this.isEnabled = isOn;
        if (gameData.settings) {
            gameData.settings.customCursor = isOn;
        }

        if (isOn) {
            document.body.classList.add('custom-cursor-active');
            if (this.cursorEl) this.cursorEl.style.display = 'block';
        } else {
            document.body.classList.remove('custom-cursor-active');
            if (this.cursorEl) this.cursorEl.style.display = 'none';
        }
    }

    createCursor() {
        this.cursorEl = document.createElement('div');
        this.cursorEl.className = 'custom-cursor';

        const cornerIds = ['tl', 'tr', 'bl', 'br'];
        cornerIds.forEach(id => {
            const corner = document.createElement('div');
            corner.className = `custom-cursor-corner custom-cursor-corner-${id}`;
            this.cursorEl.appendChild(corner);
            this.corners[id] = corner;
        });

        document.body.appendChild(this.cursorEl);
    }

    addEventListeners() {
        document.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        document.addEventListener('mousedown', () => {
            if (typeof audioManager !== 'undefined') {
                this.triggerVibration(50, 0.4, 0.1); // 클릭 시 짧은 진동
                audioManager.playSfx(this.clickSound);
            }
        });

        document.body.addEventListener('mouseover', (e) => {
            const newTarget = e.target.closest(this.options.targetSelector);
            if (newTarget) {
                this.onTargetEnter(newTarget);
            } else if (this.target) {
                this.onTargetLeave();
            }
        });
    }

    onTargetEnter(target) {
        if (this.target === target) return;

        if (typeof audioManager !== 'undefined') {
            audioManager.playSfx(this.hoverSound);
        }

        this.isTargeting = true;
        this.target = target;
        this.cursorEl.classList.add('targeting');

        const rect = this.target.getBoundingClientRect();

        this.cursorEl.style.transition = `width 0.2s cubic-bezier(0.25, 1, 0.5, 1), height 0.2s cubic-bezier(0.25, 1, 0.5, 1), transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.2s, background-color 0.2s`;
        this.cursorEl.style.width = `${rect.width}px`;
        this.cursorEl.style.height = `${rect.height}px`;
        this.cursorEl.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    }

    onTargetLeave() {
        if (!this.isTargeting) return;

        this.isTargeting = false;
        this.target = null;
        this.cursorEl.classList.remove('targeting');

        this.cursorEl.style.transition = `width 0.2s cubic-bezier(0.25, 1, 0.5, 1), height 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-radius 0.2s, background-color 0.2s`;
        Object.values(this.corners).forEach(corner => corner.style.transform = 'translate(0, 0)');
    }

    startAnimation() {
        const animate = () => {
            // [신규] 게임패드 입력 처리
            this.updateGamepad();

            this.pos.x += (this.mouse.x - this.pos.x) * 0.2;
            this.pos.y += (this.mouse.y - this.pos.y) * 0.2;

            if (!this.isTargeting) {
                this.cursorEl.style.width = '8px';
                this.cursorEl.style.height = '8px';
                this.cursorEl.style.transform = `translate(${this.pos.x - 4}px, ${this.pos.y - 4}px)`;
            } else if (this.options.parallaxOn && this.target) {
                const rect = this.target.getBoundingClientRect();
                const relX = this.mouse.x - rect.left;
                const relY = this.mouse.y - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const dx = (relX - centerX) / centerX;
                const dy = (relY - centerY) / centerY;
                const p = this.options.parallaxAmount;

                this.corners.tl.style.transform = `translate(${-dx * p}px, ${-dy * p}px)`;
                this.corners.tr.style.transform = `translate(${dx * p}px, ${-dy * p}px)`;
                this.corners.bl.style.transform = `translate(${-dx * p}px, ${dy * p}px)`;
                this.corners.br.style.transform = `translate(${dx * p}px, ${dy * p}px)`;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    // [신규] 컨트롤러 진동 메서드
    triggerVibration(duration = 100, strong = 0.5, weak = 0.25) {
        if (this.gamepadIndex === null) return;
        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (gp && gp.vibrationActuator) {
            // 기존 타이머가 있다면 취소 (중복 실행 방지)
            if (this.vibrationTimer) {
                clearTimeout(this.vibrationTimer);
                this.vibrationTimer = null;
            }

            gp.vibrationActuator.playEffect("dual-rumble", {
                startDelay: 0,
                duration: duration,
                weakMagnitude: weak,
                strongMagnitude: strong,
            });

            // [수정] 안전장치: duration 후에 강제로 0으로 설정 (무한 진동 방지)
            this.vibrationTimer = setTimeout(() => {
                if (gp && gp.vibrationActuator) {
                    gp.vibrationActuator.playEffect("dual-rumble", {
                        startDelay: 0,
                        duration: 0,
                        weakMagnitude: 0,
                        strongMagnitude: 0,
                    });
                }
                this.vibrationTimer = null;
            }, duration + 50); // 50ms 여유
        }
    }

    // [신규] D-pad 메뉴 네비게이션 메서드
    navigateWithDpad(direction) {
        const allTargets = Array.from(document.querySelectorAll(this.options.targetSelector))
            .filter(el => el.offsetParent !== null && el.getBoundingClientRect().width > 0); // 보이는 요소만

        if (allTargets.length === 0) return;

        let currentTarget = this.target;
        // 현재 타겟이 없으면, 화면 중앙에서 가장 가까운 요소를 시작점으로.
        if (!currentTarget || !allTargets.includes(currentTarget)) {
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            allTargets.sort((a, b) => {
                const aRect = a.getBoundingClientRect();
                const bRect = b.getBoundingClientRect();
                const distA = Math.hypot(aRect.x - screenCenterX, aRect.y - screenCenterY);
                const distB = Math.hypot(bRect.x - screenCenterX, bRect.y - screenCenterY);
                return distA - distB;
            });
            currentTarget = allTargets[0];
        }

        const currentRect = currentTarget.getBoundingClientRect();
        const currentCenter = { x: currentRect.left + currentRect.width / 2, y: currentRect.top + currentRect.height / 2 };

        let bestCandidate = null;
        let minScore = Infinity;

        allTargets.forEach(candidate => {
            if (candidate === currentTarget) return;

            const candRect = candidate.getBoundingClientRect();
            const candCenter = { x: candRect.left + candRect.width / 2, y: candRect.top + candRect.height / 2 };

            const dx = candCenter.x - currentCenter.x;
            const dy = candCenter.y - currentCenter.y;

            let score = Infinity;

            switch (direction) {
                case 'right':
                    if (dx > 0) { // 오른쪽에 있는 후보만
                        score = Math.hypot(dx, dy * 2.5); // Y축 차이에 더 큰 페널티
                    }
                    break;
                case 'left':
                    if (dx < 0) { // 왼쪽에 있는 후보만
                        score = Math.hypot(dx, dy * 2.5);
                    }
                    break;
                case 'down':
                    if (dy > 0) { // 아래쪽에 있는 후보만
                        score = Math.hypot(dx * 2.5, dy); // X축 차이에 더 큰 페널티
                    }
                    break;
                case 'up':
                    if (dy < 0) { // 위쪽에 있는 후보만
                        score = Math.hypot(dx * 2.5, dy);
                    }
                    break;
            }

            if (score < minScore) {
                minScore = score;
                bestCandidate = candidate;
            }
        });

        if (bestCandidate) {
            const nextRect = bestCandidate.getBoundingClientRect();
            // 새 타겟의 중심으로 마우스 위치 이동
            this.mouse.x = nextRect.left + nextRect.width / 2;
            this.mouse.y = nextRect.top + nextRect.height / 2;

            // onTargetEnter가 자동으로 호출되면서 호버 효과와 소리 재생
            // this.onTargetEnter(bestCandidate); // mousemove 이벤트가 처리하므로 중복 호출 불필요
        }
    }

    // [신규] 게임패드 업데이트 메서드
    updateGamepad() {
        if (this.gamepadIndex === null) return;

        const gp = navigator.getGamepads()[this.gamepadIndex];
        if (!gp) return;

        // 1. 커서 이동 (L 스틱 + D-pad)
        let dx = 0;
        let dy = 0;

        // L 스틱 (Axis 0, 1)
        if (Math.abs(gp.axes[0]) > this.deadzone) dx += gp.axes[0] * this.cursorSpeed;
        if (Math.abs(gp.axes[1]) > this.deadzone) dy += gp.axes[1] * this.cursorSpeed;

        // D-pad (Buttons 12, 13, 14, 15) - 메뉴 네비게이션으로 변경
        const now = Date.now();
        const dpadPressed = (buttonIndex, direction) => {
            if (gp.buttons[buttonIndex] && gp.buttons[buttonIndex].pressed) {
                if (!this.buttonStates[buttonIndex] || (now - this.buttonStates[buttonIndex]) > this.dpadCooldown) {
                    this.navigateWithDpad(direction);
                    this.buttonStates[buttonIndex] = now;
                }
                return true;
            } else {
                if (this.buttonStates[buttonIndex]) this.buttonStates[buttonIndex] = false;
                return false;
            }
        };

        const dpadUp = dpadPressed(12, 'up');
        const dpadDown = dpadPressed(13, 'down');
        const dpadLeft = dpadPressed(14, 'left');
        const dpadRight = dpadPressed(15, 'right');

        // D-pad가 눌렸을 때는 아날로그 스틱의 커서 이동을 무시
        if (dpadUp || dpadDown || dpadLeft || dpadRight) {
            dx = 0;
            dy = 0;
        }

        if (dx !== 0 || dy !== 0) {
            this.mouse.x += dx;
            this.mouse.y += dy;

            // 화면 경계 제한
            this.mouse.x = Math.max(0, Math.min(window.innerWidth, this.mouse.x));
            this.mouse.y = Math.max(0, Math.min(window.innerHeight, this.mouse.y));

            // 커서 아래 요소 감지 (호버 효과 트리거)
            const element = document.elementFromPoint(this.mouse.x, this.mouse.y);
            if (element) {
                const newTarget = element.closest(this.options.targetSelector);
                if (newTarget) {
                    this.onTargetEnter(newTarget);
                } else if (this.target) {
                    this.onTargetLeave();
                }
            }
        }

        // 2. 스크롤 (R 스틱 - Axis 3)
        if (Math.abs(gp.axes[3]) > this.deadzone) {
            window.scrollBy(0, gp.axes[3] * this.scrollSpeed);
        }

        // 3. 클릭 (O 버튼 - Button 1)
        if (gp.buttons[1] && gp.buttons[1].pressed) {
            if (!this.buttonStates[1]) {
                this.triggerVibration(50, 0.5, 0.1); // 클릭 진동
                this.triggerClick('click');
                this.buttonStates[1] = true;
            }
        } else {
            this.buttonStates[1] = false;
        }

        // 4. 우클릭 (네모 버튼 - Button 2)
        if (gp.buttons[2] && gp.buttons[2].pressed) {
            if (!this.buttonStates[2]) {
                this.triggerVibration(50, 0.5, 0.1); // 클릭 진동
                this.triggerClick('contextmenu');
                this.buttonStates[2] = true;
            }
        } else {
            this.buttonStates[2] = false;
        }
    }

    triggerClick(type) {
        const element = document.elementFromPoint(this.mouse.x, this.mouse.y);
        if (element) {
            const event = new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: this.mouse.x,
                clientY: this.mouse.y,
                button: type === 'contextmenu' ? 2 : 0
            });
            element.dispatchEvent(event);

            // 소리 재생
            if (type === 'click' && typeof audioManager !== 'undefined') {
                // this.triggerVibration(50, 0.4, 0.1); // mousedown에서 이미 처리
                audioManager.playSfx(this.clickSound);
            }
        }
    }
}

// [신규] 탭 UI 활성화 헬퍼 함수
function activateTabUI(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // callup 탭은 transfer 버튼을 사용
    let btnSelector = `[data-tab="${tabName}"]`;
    if (tabName === 'callup') btnSelector = `[data-tab="transfer"]`;

    const btn = document.querySelector(btnSelector);
    if (btn) btn.classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // 패널 ID 매핑 (callup은 transfer 패널 재활용)
    let panelId = (tabName === 'callup') ? 'transfer' : tabName;
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
}

// 선수가 이미 스쿼드에 있는지 확인하는 함수
function displayTeamPlayers() {
    const playerList = document.getElementById('playerList');
    if (!playerList) return;
    const fragment = document.createDocumentFragment();
    playerList.replaceChildren();

    const teamPlayers = teams[gameData.selectedTeam] || [];

    const squadPlayerNames = new Set();
    if (gameData.squad.gk) squadPlayerNames.add(gameData.squad.gk.name);
    gameData.squad.df.forEach(p => p && squadPlayerNames.add(p.name));
    gameData.squad.mf.forEach(p => p && squadPlayerNames.add(p.name));
    gameData.squad.fw.forEach(p => p && squadPlayerNames.add(p.name));

    teamPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card fc26-player-card';
        playerCard.dataset.playerName = player.name;

        const isUsed = squadPlayerNames.has(player.name);
        if (isUsed) {
            playerCard.classList.add('used');
        }

        const cardContent = document.createElement('div');
        cardContent.className = 'player-card-content fc26-card-layout';

        const cutoutWrap = document.createElement('div');
        cutoutWrap.className = 'fc26-cutout-wrap';

        const ovrBadge = document.createElement('span');
        ovrBadge.className = 'fc26-ovr-badge';
        ovrBadge.textContent = Math.floor(player.rating);

        const posBadge = document.createElement('span');
        const posLower = (player.position || 'mf').toLowerCase();
        posBadge.className = `pos-badge pos-${posLower}`;
        posBadge.textContent = player.position;

        const img = document.createElement('img');
        img.className = 'player-card-image fc26-cutout-img';
        img.loading = 'lazy';
        setPlayerPhoto(img, player);

        cutoutWrap.append(ovrBadge, posBadge, img);

        const infoText = document.createElement('div');
        infoText.className = 'player-info-text fc26-card-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = player.name;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';

        const ageWageDiv = document.createElement('div');
        ageWageDiv.className = 'fc26-meta-row';
        const ageSpan = document.createElement('span');
        ageSpan.textContent = `${player.age}세`;
        ageWageDiv.appendChild(ageSpan);

        // [신규] 계약 기간 및 재계약 배지 표시
        if (typeof contractSystem !== 'undefined') {
            const contractYears = contractSystem.getPlayerContractYears(player);
            const contractBadge = document.createElement('span');
            if (contractYears <= 1) {
                contractBadge.className = 'fc26-status-pill';
                contractBadge.style.cssText = 'background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.5); cursor: pointer; font-weight: 700;';
                contractBadge.textContent = '재계약 필요 (1년)';
                contractBadge.title = '클릭하여 재계약 협상 열기';
                contractBadge.onclick = (e) => {
                    e.stopPropagation();
                    contractSystem.openRenewalModal(player);
                };
            } else {
                contractBadge.className = 'fc26-status-pill';
                contractBadge.style.cssText = 'background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3);';
                contractBadge.textContent = `계약 ${contractYears}년`;
            }
            ageWageDiv.appendChild(contractBadge);
        }

        const isInjured = typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, player.name);
        if (isInjured) {
            playerCard.classList.add('injured');
            const injuryInfo = injurySystem.getInjuredPlayers(gameData.selectedTeam).find(i => i.name === player.name);
            const gamesLeft = injuryInfo ? injuryInfo.gamesRemaining : '?';

            const injuredDiv = document.createElement('span');
            injuredDiv.className = 'fc26-status-pill injured';
            injuredDiv.textContent = `부상 (${gamesLeft}경기)`;
            ageWageDiv.appendChild(injuredDiv);
            detailsDiv.appendChild(ageWageDiv);
        } else {
            if (isUsed) {
                const usedDiv = document.createElement('span');
                usedDiv.className = 'fc26-status-pill active';
                usedDiv.textContent = '선발';
                ageWageDiv.appendChild(usedDiv);
            }
            detailsDiv.appendChild(ageWageDiv);

            const condition = (player.condition !== undefined) ? player.condition : 100;
            let condColor = '#A3E635';
            if (condition < 70) condColor = '#EF4444';
            else if (condition < 90) condColor = '#FBBF24';

            const condBar = document.createElement('div');
            condBar.className = 'player-list-condition';
            condBar.style.cssText = 'width: 100%; height: 4px; background: rgba(255,255,255,0.12); margin-top: 6px; border-radius: 2px; overflow: hidden;';

            const condFill = document.createElement('div');
            condFill.style.cssText = `width: ${condition}%; height: 100%; background: ${condColor}; border-radius: 2px;`;
            condBar.appendChild(condFill);
            detailsDiv.appendChild(condBar);
        }

        infoText.append(nameDiv, detailsDiv);
        cardContent.append(cutoutWrap, infoText);
        playerCard.appendChild(cardContent);
        fragment.appendChild(playerCard);
    });

    playerList.appendChild(fragment);
}

// 이적료를 받고 선수 방출
function releasePlayerWithFee(player) {
    const teamPlayers = teams[gameData.selectedTeam];
    if (teamPlayers.length <= 16) {
        alert("팀 인원이 최소 16명 이상이어야 합니다!\n더 이상 선수를 이적 명단에 올릴 수 없습니다.");
        return;
    }

    const userTransferList = window.GameState ? window.GameState.getUserTransferList() : gameData.userTransferList;
    if (userTransferList.some(entry => entry.player.name === player.name)) {
        alert("이미 이적 명단에 올라가 있는 선수입니다.");
        return;
    }

    if (confirm(`${player.name} 선수를 이적 명단에 올리시겠습니까?\n다음 경기 종료 후 메일함으로 영입 제안이 도착합니다.`)) {
        // waitRounds를 1로 설정하여 다음 업데이트 때 오퍼가 오도록 함
        const transferEntry = { player: JSON.parse(JSON.stringify(player)), waitRounds: 1, isOfferSent: false };
        if (window.GameState) window.GameState.addUserTransferListEntry(transferEntry);
        else gameData.userTransferList.push(transferEntry);
        alert("이적 명단에 등록되었습니다. 비서가 오퍼를 정리해서 메일로 보내줄 것입니다.");
    }
}

// 스쿼드에서 선수 제거하는 헬퍼 함수 (script.js에 추가)
function removePlayerFromSquad(player) {
    if (gameData.squad.gk && gameData.squad.gk.name === player.name) {
        gameData.squad.gk = null;
    }

    gameData.squad.df = gameData.squad.df.map(p =>
        p && p.name === player.name ? null : p
    );

    gameData.squad.mf = gameData.squad.mf.map(p =>
        p && p.name === player.name ? null : p
    );

    gameData.squad.fw = gameData.squad.fw.map(p =>
        p && p.name === player.name ? null : p
    );
}

function openPlayerModal(position, index) {
    selectedPosition = { position, index };
    const modal = document.getElementById('playerModal');
    const modalPlayerList = document.getElementById('modalPlayerList');
    if (!modalPlayerList) return;

    modalPlayerList.replaceChildren();

    const teamPlayers = teams[gameData.selectedTeam] || [];
    const filteredPlayers = teamPlayers.filter(player =>
        !isPlayerInSquad(player)
    );

    if (filteredPlayers.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.textContent = '배치 가능한 선수가 없습니다.';
        modalPlayerList.appendChild(emptyP);
        if (modal) modal.style.display = 'block';
    } else {
        filteredPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';
            nameDiv.textContent = player.name;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'details';
            detailsDiv.textContent = `능력치: ${player.rating} | 나이: ${player.age}`;

            playerCard.append(nameDiv, detailsDiv);

            playerCard.addEventListener('click', () => {
                // assignPlayerToPosition(player);
                closeModal();
            });

            modalPlayerList.appendChild(playerCard);
        });
    }

    // modal.style.display = 'block';
}

function assignPlayerToPosition(player) {
    if (!selectedPosition) return;

    // 이미 스쿼드에 있는 선수인지 확인
    if (isPlayerInSquad(player)) {
        alert('이 선수는 이미 스쿼드에 포함되어 있습니다.');
        return;
    }

    const { position, index } = selectedPosition;

    if (position === 'gk') {
        gameData.squad.gk = player;
    } else if (position === 'df') {
        gameData.squad.df[index] = player;
    } else if (position === 'mf') {
        gameData.squad.mf[index] = player;
    } else if (position === 'fw') {
        gameData.squad.fw[index] = player;
    }

    updateFormationDisplay();
    displayTeamPlayers(); // 선수 목록 새로고침
    selectedPosition = null;
}

function updateFormationDisplay() {
    //  이 3줄만 추가
    if (typeof refreshFormation === 'function') {
        refreshFormation();
        return;
    }

    const setSlotContent = (slot, player, defaultText) => {
        if (!slot) return;
        slot.replaceChildren();
        if (player) {
            const nameDiv = document.createElement('div');
            nameDiv.textContent = player.name;
            const ratingDiv = document.createElement('div');
            ratingDiv.textContent = Math.floor(player.rating);
            slot.append(nameDiv, ratingDiv);
            slot.classList.add('filled');
        } else {
            slot.textContent = defaultText;
            slot.classList.remove('filled');
        }
    };

    // GK 업데이트
    setSlotContent(document.getElementById('gk-slot'), gameData.squad.gk, 'GK');

    // DF 업데이트
    for (let i = 0; i < 4; i++) {
        setSlotContent(document.querySelector(`.df-${i + 1} .player-slot`), gameData.squad.df[i], 'DF');
    }

    // MF 업데이트
    for (let i = 0; i < 3; i++) {
        setSlotContent(document.querySelector(`.mf-${i + 1} .player-slot`), gameData.squad.mf[i], 'MF');
    }

    // FW 업데이트
    for (let i = 0; i < 3; i++) {
        setSlotContent(document.querySelector(`.fw-${i + 1} .player-slot`), gameData.squad.fw[i], 'FW');
    }
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
    // selectedPosition = null; // formation.js의 교체 로직과 충돌하므로 주석 처리
}

// [신규] 개별 선수 주급 계산 (오버롤 및 나이 비례)
function calculatePlayerWage(player) {
    if (typeof player.weeklyWage === 'number') {
        return parseFloat(player.weeklyWage.toFixed(2));
    }

    // 오버롤 75 기준 주급 1.0억. 오버롤이 높을수록 훨씬 가파르게 상승
    const base = Math.pow(player.rating / 72, 6.2) * 1.0;

    // 나이에 따른 편차 확대: 젊은 선수는 프리미엄, 노장은 감가
    let ageModifier = 1.0;
    if (player.age <= 20) ageModifier = 1.32;
    else if (player.age <= 24) ageModifier = 1.14;
    else if (player.age >= 35) ageModifier = 0.62;
    else if (player.age >= 32) ageModifier = 0.78;
    else if (player.age >= 29) ageModifier = 0.92;

    return Math.max(0.25, parseFloat((base * ageModifier).toFixed(2)));
}

// [신규] 팀 전체 주급 총합 계산
function calculateTotalWages() {
    if (!gameData.selectedTeam || !teams[gameData.selectedTeam]) return 0;
    const total = teams[gameData.selectedTeam].reduce((sum, p) => sum + calculatePlayerWage(p), 0);
    gameData.totalWeeklyWage = parseFloat(total.toFixed(1));
    return gameData.totalWeeklyWage;
}

function initializeTeamFinance() {
    if (!gameData.selectedTeam) return;

    // 시작 시 선수단 총 주급 계산
    calculateTotalWages();

    // 시작 시에는 사용 가능한 여유 주급이 0이어야 하므로, 주급 예산(wageBudget)을 선수단 총 주급과 동일하게 설정
    if (typeof gameData.wageBudget !== 'number' || gameData.wageBudget <= 0) {
        gameData.wageBudget = gameData.totalWeeklyWage || 0;
    }

    updateFinanceDisplay();
}

function formatFinanceVal(num) {
    const n = Number(num) || 0;
    return Number(n.toFixed(2));
}

function updateFinanceDisplay() {
    const wageBudgetVal = formatFinanceVal(gameData.wageBudget || 0);
    const totalWageVal = formatFinanceVal(gameData.totalWeeklyWage || 0);
    const availableWage = Math.max(0, formatFinanceVal((gameData.wageBudget || 0) - (gameData.totalWeeklyWage || 0)));

    const wageBudgetEl = document.getElementById('wageBudget');
    if (wageBudgetEl) wageBudgetEl.textContent = wageBudgetVal + '억';

    const totalWageEl = document.getElementById('totalWages');
    if (totalWageEl) totalWageEl.textContent = totalWageVal + '억';

    const availableWageEl = document.getElementById('availableWage');
    if (availableWageEl) availableWageEl.textContent = availableWage + '억';

    // 로비 상단 헤더의 주급 여유분 표시 갱신
    const lobbyAvailableWageEl = document.getElementById('lobbyAvailableWage');
    if (lobbyAvailableWageEl) {
        lobbyAvailableWageEl.textContent = `${availableWage}억`;
        lobbyAvailableWageEl.title = `총 주급: ${totalWageVal}억 / 예산: ${wageBudgetVal}억`;
    }
}

function convertTransferToWageBudget(amount) {
    const rawValue = Math.round(Number(amount));
    const units = Math.floor(rawValue / 52);
    const value = units * 52;
    if (!Number.isFinite(rawValue) || units <= 0) return { success: false, message: '이적 자금은 52억 단위(주급 자금 1억 단위)로만 전환할 수 있습니다.' };
    if (gameData.teamMoney < value) return { success: false, message: '이적 자금이 부족합니다.' };

    gameData.teamMoney = Math.round(gameData.teamMoney - value);
    gameData.wageBudget = formatFinanceVal((gameData.wageBudget || 0) + units);
    if (typeof updateDisplay === 'function') updateDisplay();
    updateFinanceDisplay();
    const finPanel = document.getElementById('finance');
    if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
        renderFinanceTab();
    }
    return { success: true, message: `${value}억 이적 자금을 주급 자금 ${units}억으로 전환했습니다. (여유 주급 +${units}억 확보)` };
}

function convertWageToTransferBudget(amount) {
    const units = Math.floor(Number(amount));
    if (!Number.isFinite(units) || units <= 0) return { success: false, message: '주급 자금은 1억 단위(이적 자금 52억 단위)로만 전환할 수 있습니다.' };
    
    // 현재 사용 가능한 여유 주급 확인 (선수단 총 주급을 제외한 여유분만 이적 자금으로 회수 가능)
    const available = Math.max(0, formatFinanceVal((gameData.wageBudget || 0) - (gameData.totalWeeklyWage || 0)));
    if (available < units) {
        return { 
            success: false, 
            message: `전환 가능한 여유 주급 예산이 부족합니다.\n현재 잔여 여유 주급: ${available}억 (전환 요구: ${units}억)\n선수단 총 주급(${formatFinanceVal(gameData.totalWeeklyWage)}억) 이하로는 줄일 수 없습니다.` 
        };
    }

    gameData.wageBudget = formatFinanceVal(gameData.wageBudget - units);
    gameData.teamMoney = Math.round((gameData.teamMoney || 0) + units * 52);
    if (typeof updateDisplay === 'function') updateDisplay();
    updateFinanceDisplay();
    const finPanel = document.getElementById('finance');
    if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
        renderFinanceTab();
    }
    return { success: true, message: `${units}억 주급 자금을 이적 자금 ${units * 52}억으로 전환했습니다.` };
}

function promptBudgetConversion(direction) {
    const amountText = window.prompt(
        direction === 'transferToWage'
            ? `이적 자금을 주급 자금으로 바꿀 금액을 입력하세요.\n(52억 이적 자금 -> 1억 주급 자금)`
            : `주급 자금을 이적 자금으로 바꿀 금액을 입력하세요.\n(1억 주급 자금 -> 52억 이적 자금)`
    );

    if (amountText === null) return;

    const result = direction === 'transferToWage'
        ? convertTransferToWageBudget(amountText)
        : convertWageToTransferBudget(amountText);

    alert(result.message);
}

function updateDisplay() {
    document.getElementById('teamMoney').textContent = gameData.teamMoney + '억';
    document.getElementById('teamMorale').textContent = gameData.teamMorale;
    const roundEl = document.getElementById('teamRound');
    if (roundEl) roundEl.textContent = gameData.currentRound || 1;
    document.getElementById('currentSponsor').textContent =
        gameData.currentSponsor ? gameData.currentSponsor.name : '없음';

    // [신규] 경기 탭 현재 전술 디스플레이 동기화
    if (typeof updateMatchTabCurrentTacticDisplay === 'function') {
        updateMatchTabCurrentTacticDisplay();
    }
    if (typeof renderMatchTabScheduleOrBracket === 'function') {
        const matchPanel = document.getElementById('match');
        if (matchPanel && matchPanel.classList.contains('active')) {
            renderMatchTabScheduleOrBracket();
        }
    }

    // [신규] 주급 표시 업데이트 (HTML에 totalWages ID가 있다고 가정)
    const wageEl = document.getElementById('totalWages');
    if (wageEl) wageEl.textContent = gameData.totalWeeklyWage + '억';
    updateFinanceDisplay();

    if (gameData.currentOpponent) {
        const oppEl = document.getElementById('opponentName');
        if (oppEl) {
            oppEl.replaceChildren(
                createTeamLogoElement(gameData.currentOpponent),
                document.createTextNode(' ' + (teamNames[gameData.currentOpponent] || gameData.currentOpponent))
            );
        }

        // [신규] 다음 경기 일정에 홈/원정 구장 정보 및 FA컵 표시
        const matchTypeSpan = document.querySelector('.match-details .match-type');
        if (matchTypeSpan) {
            const homeKey = gameData.isHomeGame ? gameData.selectedTeam : gameData.currentOpponent;
            const stad = (typeof stadiumSystem !== 'undefined') ? stadiumSystem.getStadiumInfo(homeKey) : null;
            const tag = gameData.isHomeGame ? '홈 경기' : '원정 경기';
            const stadDesc = stad ? ` · ${stad.name} (${(stad.currentCapacity || stad.capacity).toLocaleString()}석)` : '';

            if (gameData.isMLSPlayoffMatch) {
                const mlsStageNames = {
                    MLS_WC: '와일드카드 (단판·PK직행)',
                    MLS_R1_G1: '1라운드 1차전 (3판2선승)',
                    MLS_R1_G2: '1라운드 2차전 (3판2선승)',
                    MLS_R1_G3: '1라운드 최종 3차전',
                    MLS_CONF_SF: '컨퍼런스 준결승 (단판)',
                    MLS_CONF_FINAL: '컨퍼런스 결승 (단판)',
                    MLS_CUP: 'MLS컵 파이널 (단판)'
                };
                const mlsLabel = mlsStageNames[gameData.playoffStage] || 'MLS컵 플레이오프';
                matchTypeSpan.textContent = `🇺🇸 MLS컵 플레이오프 [${mlsLabel} · ${tag}]${stadDesc}`;
                matchTypeSpan.style.color = '#38BDF8';
                matchTypeSpan.style.fontWeight = '800';
            } else if (gameData.isPlayoffMatch) {
                const poStageName = gameData.playoffStage === 'FINAL' ? '웸블리 결승전 (단판)'
                    : (gameData.playoffStage === 'SF_LEG2' ? '준결승 2차전' : '준결승 1차전');
                const locTag = gameData.playoffStage === 'FINAL' ? '중립 구장 · 웸블리' : tag;
                matchTypeSpan.textContent = `🔥 승격 플레이오프 [${poStageName} · ${locTag}]${stadDesc}`;
                matchTypeSpan.style.color = '#F59E0B';
                matchTypeSpan.style.fontWeight = '800';
            } else if (gameData.isUCLMatch && typeof cupCompetitionManager !== 'undefined') {
                const stName = cupCompetitionManager.uclStageNames[gameData.uclStage] || '토너먼트';
                matchTypeSpan.textContent = `⭐ UCL [${stName} · ${tag}]${stadDesc}`;
                matchTypeSpan.style.color = '#38BDF8';
                matchTypeSpan.style.fontWeight = '800';
            } else if (gameData.isFACupMatch && typeof faCupManager !== 'undefined') {
                const cupName = (gameData.faCup && gameData.faCup.config) ? gameData.faCup.config.name : 'FA컵';
                const stName = faCupManager.faStageNames[gameData.faCupStage] || '토너먼트';
                matchTypeSpan.textContent = `🏆 ${cupName} [${stName} · ${tag}]${stadDesc}`;
                matchTypeSpan.style.color = '#FBBF24';
                matchTypeSpan.style.fontWeight = '800';
            } else {
                matchTypeSpan.textContent = `리그전 [${tag}]${stadDesc}`;
                matchTypeSpan.style.color = '';
                matchTypeSpan.style.fontWeight = '';
            }
        }
    }
}

// 리그 스케줄 생성 (더블 라운드 로빈)
function generateLeagueSchedule(leagueTeams) {
    const schedule = [];
    const numberOfTeams = leagueTeams.length;
    if (numberOfTeams % 2 !== 0) return []; // 팀 수가 짝수여야 함

    const rounds = numberOfTeams - 1;
    const halfSize = numberOfTeams / 2;
    const teamsCopy = [...leagueTeams];

    // 전반기 (라운드 로빈)
    for (let round = 0; round < rounds; round++) {
        const roundMatches = [];
        for (let i = 0; i < halfSize; i++) {
            const home = teamsCopy[i];
            const away = teamsCopy[numberOfTeams - 1 - i];

            // 라운드마다 홈/어웨이 번갈아가며 배정 (공평성)
            if (round % 2 === 0) {
                roundMatches.push({ home: home, away: away });
            } else {
                roundMatches.push({ home: away, away: home });
            }
        }
        schedule.push(roundMatches);

        // 팀 회전 (0번 인덱스 고정, 나머지 회전)
        const first = teamsCopy[0];
        const rest = teamsCopy.slice(1);
        const last = rest.pop();
        rest.unshift(last);
        teamsCopy.splice(0, teamsCopy.length, first, ...rest);
    }

    // 후반기 (전반기와 대진은 같고 홈/어웨이만 반대)
    const secondHalf = schedule.map(round =>
        round.map(match => ({ home: match.away, away: match.home }))
    );

    return [...schedule, ...secondHalf];
}

function generateFullSchedule() {
    if (typeof gameData !== 'undefined' && gameData.isWorldCupMode) {
        if (typeof WorldCupManager !== 'undefined') {
            WorldCupManager.generateWCSchedule();
        }
        return;
    }

    if (typeof LeagueManager !== 'undefined') {
        LeagueManager.generateAllLeagueSchedules();
        gameData.currentRound = 1;
        console.log('새 시즌 스케줄 생성 완료 (LeagueManager)');
        return;
    }

    gameData.schedule = {};
    for (let i = 1; i <= 3; i++) {
        const leagueTeams = Object.keys(allTeams).filter(key => allTeams[key] && allTeams[key].league === i);
        // 팀 목록 랜덤 셔플
        leagueTeams.sort(() => Math.random() - 0.5);
        gameData.schedule[`division${i}`] = generateLeagueSchedule(leagueTeams);
    }
    gameData.currentRound = 1;
    console.log("새 시즌 스케줄 생성 완료");
}

function setNextOpponent() {
    // [신규] MLS컵 플레이오프 경기 체크 (정규 시즌 종료 후 최우선)
    if (typeof MLSPlayoffManager !== 'undefined' && !gameData.isWorldCupMode && gameData.mlsPlayoff && !gameData.mlsPlayoff.completed) {
        const isMLSPlayoff = MLSPlayoffManager.checkAndSetupMatch();
        if (isMLSPlayoff) {
            updateDisplay();
            return;
        }
    }
    gameData.isMLSPlayoffMatch = false;

    // [신규] EFL 챔피언십 승격 플레이오프 경기 체크 (정규 시즌 종료 후 최우선)
    if (typeof EFLPlayoffManager !== 'undefined' && !gameData.isWorldCupMode && gameData.eflPlayoff && !gameData.eflPlayoff.completed) {
        const isPlayoff = EFLPlayoffManager.checkAndSetupMatch();
        if (isPlayoff) {
            updateDisplay();
            return;
        }
    }
    gameData.isPlayoffMatch = false;
    gameData.playoffStage = null;

    // [신규] 컵 대회 (UCL 리그 페이즈 / FA컵 토너먼트) 경기 체크 (우선순위)
    if (typeof cupCompetitionManager !== 'undefined' && !gameData.isWorldCupMode && (gameData.faCup || gameData.ucl)) {
        const isCup = cupCompetitionManager.checkAndSetupCupMatch();
        if (isCup) {
            updateDisplay();
            return;
        }
    }
    gameData.isFACupMatch = false;
    gameData.isUCLMatch = false;

    if (!gameData.schedule) {
        generateFullSchedule();
    }

    const userLeagueId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(gameData.selectedTeam) : null;
    const currentLeagueKey = (userLeagueId && gameData.schedule && gameData.schedule[userLeagueId]) ? userLeagueId : `division${gameData.currentLeague}`;
    const leagueSchedule = gameData.schedule ? gameData.schedule[currentLeagueKey] : null;

    if (!leagueSchedule || !Array.isArray(leagueSchedule) || gameData.currentRound > leagueSchedule.length || gameData.currentRound <= 0) {
        // 시즌 종료 또는 스케줄 범위 초과
        return;
    }

    const currentRoundMatches = leagueSchedule[gameData.currentRound - 1];
    if (!currentRoundMatches || !Array.isArray(currentRoundMatches)) return;

    const userMatch = currentRoundMatches.find(m => m && (m.home === gameData.selectedTeam || m.away === gameData.selectedTeam));

    if (userMatch) {
        gameData.currentOpponent = (userMatch.home === gameData.selectedTeam) ? userMatch.away : userMatch.home;
        gameData.isHomeGame = (userMatch.home === gameData.selectedTeam);
    }

    updateDisplay();
}

function initializeLeagueData() {
    if (typeof LeagueManager !== 'undefined') {
        LeagueManager.initializeAllLeagueData();
        return;
    }

    if (!gameData.leagueData) {
        gameData.leagueData = {};
    }

    // 월드컵 모드인 경우
    if (typeof gameData !== 'undefined' && gameData.isWorldCupMode) {
        gameData.leagueData.division4 = {};
        if (typeof WorldCupManager !== 'undefined' && WorldCupManager.wcPlayers) {
            Object.keys(WorldCupManager.wcPlayers).forEach(teamKey => {
                gameData.leagueData.division4[teamKey] = {
                    matches: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0
                };
            });
        }
        return;
    }

    // 일반 클럽 리그 모드: 1, 2, 3부만 초기화
    gameData.leagueData.division1 = {};
    gameData.leagueData.division2 = {};
    gameData.leagueData.division3 = {};

    // 리그 테이블도 초기화
    window.league1Table = {};
    window.league2Table = {};
    window.league3Table = {};

    // allTeams 중 league가 1, 2, 3인 팀만 안전하게 등록 (국가대표팀/비정상 데이터 제외)
    Object.keys(allTeams).forEach(teamKey => {
        const teamObj = allTeams[teamKey];
        if (!teamObj || (teamObj.league !== 1 && teamObj.league !== 2 && teamObj.league !== 3)) return;

        const league = teamObj.league;
        const divisionKey = `division${league}`;

        if (!gameData.leagueData[divisionKey]) {
            gameData.leagueData[divisionKey] = {};
        }

        gameData.leagueData[divisionKey][teamKey] = {
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };

        let leagueTable;
        if (league === 1) leagueTable = window.league1Table;
        else if (league === 2) leagueTable = window.league2Table;
        else if (league === 3) leagueTable = window.league3Table;

        if (leagueTable) {
            leagueTable[teamKey] = {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
        }
    });

    console.log('리그 데이터 및 테이블 완전 초기화 완료');
}

function displayLeagueTable() {
    if (typeof LeagueManager !== 'undefined') {
        LeagueManager.renderLeagueStandingsUI();
        return;
    }

    const leagueTable = document.getElementById('leagueTable');
    if (!leagueTable) return;

    // 현재 리그 확인
    const currentLeague = gameData.currentLeague;
    const divisionKey = `division${currentLeague}`;

    // 해당 리그 데이터 존재 여부 확인
    if (!gameData.leagueData || !gameData.leagueData[divisionKey]) {
        leagueTable.replaceChildren();
        const p = document.createElement('p');
        p.textContent = '리그 데이터를 불러올 수 없습니다.';
        leagueTable.appendChild(p);
        return;
    }

    // 현재 리그의 팀들만 가져와서 순위 계산
    const standings = Object.keys(gameData.leagueData[divisionKey]).map(teamKey => ({
        team: teamKey,
        ...gameData.leagueData[divisionKey][teamKey],
        goalDiff: gameData.leagueData[divisionKey][teamKey].goalsFor - gameData.leagueData[divisionKey][teamKey].goalsAgainst
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
    });

    leagueTable.replaceChildren();

    const table = document.createElement('table');
    table.className = 'league-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['순위', '팀', '경기', '승', '무', '패', '득점', '실점', '득실차', '승점'];
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    standings.forEach((team, index) => {
        const isUserTeam = team.team === gameData.selectedTeam;
        const tr = document.createElement('tr');
        if (isUserTeam) tr.className = 'user-team';

        const tdRank = document.createElement('td');
        tdRank.textContent = index + 1;

        const tdTeam = document.createElement('td');
        tdTeam.append(createTeamLogoElement(team.team), document.createTextNode(' ' + (teamNames[team.team] || team.team)));

        const tdMatches = document.createElement('td');
        tdMatches.textContent = team.matches;

        const tdWins = document.createElement('td');
        tdWins.textContent = team.wins;

        const tdDraws = document.createElement('td');
        tdDraws.textContent = team.draws;

        const tdLosses = document.createElement('td');
        tdLosses.textContent = team.losses;

        const tdGf = document.createElement('td');
        tdGf.textContent = team.goalsFor;

        const tdGa = document.createElement('td');
        tdGa.textContent = team.goalsAgainst;

        const tdGd = document.createElement('td');
        tdGd.textContent = (team.goalDiff > 0 ? '+' : '') + team.goalDiff;

        const tdPts = document.createElement('td');
        tdPts.textContent = team.points;

        tr.append(tdRank, tdTeam, tdMatches, tdWins, tdDraws, tdLosses, tdGf, tdGa, tdGd, tdPts);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    leagueTable.appendChild(table);
}

// 스폰서 계약 체결 시 (모던 & 클린 UI 리팩토링)
function displaySponsors() {
    const sponsorList = document.getElementById('sponsorList');
    if (!sponsorList) return;
    sponsorList.replaceChildren();

    const teamRating = calculateTeamRating();

    // 상단 팀 평점 뱃지 갱신
    const teamOvrBadge = document.getElementById('sponsorTeamRatingBadge');
    if (teamOvrBadge) {
        teamOvrBadge.textContent = `현재 구단 OVR: ${teamRating.toFixed(1)}`;
    }

    // 상단 현재 스폰서 카드 정보 갱신
    const curNameEl = document.getElementById('currentSponsorDisplay');
    const curSubEl = document.getElementById('currentSponsorSubDisplay');
    const curCardEl = document.getElementById('currentSponsorDisplayCard');

    if (gameData.currentSponsor) {
        if (curNameEl) curNameEl.textContent = gameData.currentSponsor.name;
        if (curSubEl) {
            const remain = gameData.sponsorRemainingMatches || 0;
            curSubEl.innerHTML = `<span style="color: #2ECC71; font-weight: bold;">공식 파트너십 가동 중</span> · 잔여 <strong>${remain}</strong>경기 (승리시 +${gameData.currentSponsor.payPerWin}억)`;
        }
        if (curCardEl) curCardEl.classList.add('has-contract');
    } else {
        if (curNameEl) curNameEl.textContent = '현재 체결된 스폰서 없음';
        if (curSubEl) curSubEl.textContent = '새로운 스폰서십을 체결하여 안정적인 경기 수당을 확보하세요.';
        if (curCardEl) curCardEl.classList.remove('has-contract');
    }

    sponsors.forEach(sponsor => {
        const isContracted = gameData.currentSponsor && gameData.currentSponsor.name === sponsor.name;
        const meetsRating = teamRating >= sponsor.requirements.minRating;
        const isAvailable = meetsRating && !gameData.currentSponsor;

        const sponsorCard = document.createElement('div');
        let cardClass = 'sponsor-modern-card';
        if (isContracted) {
            cardClass += ' is-contracted';
        } else if (isAvailable) {
            cardClass += ' is-available';
        } else {
            cardClass += ' is-unavailable';
        }
        sponsorCard.className = cardClass;

        // 1. 카드 헤더
        const cardHeader = document.createElement('div');
        cardHeader.className = 'sponsor-card-top';

        const title = document.createElement('h4');
        title.className = 'sponsor-card-title';
        title.textContent = sponsor.name;

        const badge = document.createElement('span');
        badge.className = 'sponsor-status-badge';
        if (isContracted) {
            badge.className += ' badge-contracted';
            badge.textContent = '계약 진행 중';
        } else if (isAvailable) {
            badge.className += ' badge-available';
            badge.textContent = '계약 가능';
        } else if (!meetsRating) {
            badge.className += ' badge-locked';
            badge.textContent = `OVR ${sponsor.requirements.minRating} 필요`;
        } else {
            badge.className += ' badge-locked';
            badge.textContent = '타 스폰서 계약 중';
        }
        cardHeader.append(title, badge);

        // 2. 설명
        const desc = document.createElement('p');
        desc.className = 'sponsor-card-desc';
        desc.textContent = sponsor.description;

        // 3. 혜택 그리드
        const gridDiv = document.createElement('div');
        gridDiv.className = 'sponsor-spec-grid';

        const specs = [
            { label: '계약금', value: `${sponsor.signingBonus}억`, highlight: 'bonus' },
            { label: '승리 수당', value: `${sponsor.payPerWin}억`, highlight: 'win' },
            { label: '패배 위로금', value: `${sponsor.payPerLoss}억`, highlight: 'loss' },
            { label: '계약 기간', value: `${sponsor.contractLength}경기`, highlight: 'term' }
        ];

        specs.forEach(s => {
            const item = document.createElement('div');
            item.className = `spec-box spec-${s.highlight}`;
            const lbl = document.createElement('span');
            lbl.className = 'spec-lbl';
            lbl.textContent = s.label;
            const val = document.createElement('span');
            val.className = 'spec-val';
            val.textContent = s.value;
            item.append(lbl, val);
            gridDiv.appendChild(item);
        });

        // 4. 자격 요건 바
        const reqRow = document.createElement('div');
        reqRow.className = 'sponsor-req-row';
        const reqLabel = document.createElement('span');
        reqLabel.className = 'req-text';
        reqLabel.textContent = `요구 구단 OVR: ${sponsor.requirements.minRating}`;

        const reqStatus = document.createElement('span');
        reqStatus.className = meetsRating ? 'req-tag-ok' : 'req-tag-no';
        reqStatus.textContent = meetsRating ? `충족 (팀 OVR ${teamRating.toFixed(1)})` : `미달 (현재 ${teamRating.toFixed(1)})`;
        reqRow.append(reqLabel, reqStatus);

        // 5. 액션 버튼
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn sponsor-action-btn';

        if (isContracted) {
            btn.className += ' btn-contract-active';
            const remain = gameData.sponsorRemainingMatches || 0;
            btn.innerHTML = `✓ 공식 후원 중 (잔여 ${remain}경기)`;
            btn.disabled = true;
        } else if (isAvailable) {
            btn.className += ' btn-contract-hire primary';
            btn.innerHTML = `스폰서십 체결하기 (+${sponsor.signingBonus}억 즉시 수령)`;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`${sponsor.name}와 공식 파트너십 계약을 체결하시겠습니까?\n계약금 ${sponsor.signingBonus}억원이 구단 자금에 즉시 입금됩니다.`)) {
                    gameData.currentSponsor = sponsor;
                    gameData.sponsorRemainingMatches = sponsor.contractLength;
                    gameData.teamMoney += sponsor.signingBonus;

                    updateDisplay();
                    displaySponsors();
                    alert(`${sponsor.name}와 스폰서십 계약을 체결했습니다!\n계약금 ${sponsor.signingBonus}억을 받았습니다.`);

                    if (typeof mailManager !== 'undefined') {
                        mailManager.sendSponsorMail(sponsor);
                    }
                }
            });
        } else if (!meetsRating) {
            btn.className += ' btn-contract-disabled';
            btn.textContent = `구단 평점 부족 (OVR ${sponsor.requirements.minRating} 필요)`;
            btn.disabled = true;
        } else {
            btn.className += ' btn-contract-disabled';
            btn.textContent = '다른 스폰서 계약 진행 중';
            btn.disabled = true;
        }

        sponsorCard.append(cardHeader, desc, gridDiv, reqRow, btn);
        sponsorList.appendChild(sponsorCard);
    });
}

// 경기 후 스폰서 관련 처리 함수
function processSponsorAfterMatch(matchResult) {
    if (!gameData.currentSponsor) return;

    const sponsor = gameData.currentSponsor;
    let payment = 0;

    // [수정] 롱타임 모드일 경우 경기 후 보너스 지급 생략 (계약 체결시에만 수령)
    if (gameData.gameMode !== 'longtime') {
        // 경기 결과에 따른 보너스 지급
        if (matchResult === 'win') {
            payment = sponsor.payPerWin;
            gameData.teamMoney += payment;
            console.log(`스폰서 승리 보너스: ${payment}억원`);
        } else if (matchResult === 'loss') {
            payment = sponsor.payPerLoss;
            gameData.teamMoney += payment;
            console.log(`스폰서 패배 보상: ${payment}억원`);
        }
    }

    // 계약 기간 감소
    if (gameData.sponsorRemainingMatches > 0) {
        gameData.sponsorRemainingMatches--;
        console.log(`스폰서 계약 남은 경기: ${gameData.sponsorRemainingMatches}`);

        // 계약 만료 체크
        if (gameData.sponsorRemainingMatches <= 0) {
            expireSponsorContract();
        } else if (gameData.sponsorRemainingMatches <= 3) {
            // 계약 만료 임박 알림
            alert(`스폰서 계약이 ${gameData.sponsorRemainingMatches}경기 후 만료됩니다.`);
        }
    }

    // === 경기 결과 기반 팀 사기 조절 (난이도 UP) ===
    if (typeof gameData.losingStreak !== 'number') gameData.losingStreak = 0;
    const curMorale = typeof gameData.teamMorale === 'number' ? gameData.teamMorale : 80;

    if (matchResult === 'win') {
        gameData.losingStreak = 0;
        const gain = 3 + Math.floor(Math.random() * 3); // +3 ~ +5
        gameData.teamMorale = Math.min(100, curMorale + gain);
        console.log(`승리 - 사기 +${gain} (현재 ${gameData.teamMorale})`);
    } else if (matchResult === 'draw') {
        gameData.losingStreak = 0;
        const drop = 1 + Math.floor(Math.random() * 2); // -1 ~ -2
        gameData.teamMorale = Math.max(0, curMorale - drop);
        console.log(`무승부 - 사기 -${drop} (현재 ${gameData.teamMorale})`);
    } else if (matchResult === 'loss') {
        gameData.losingStreak++;
        // 연패 누적될수록 더 크게 떨어뜨림: 기본 -4 + 연패*2 (연패1=-6, 연패2=-8, 연패3=-10 ...)
        const baseDrop = 4 + (gameData.losingStreak * 2);
        const drop = baseDrop + Math.floor(Math.random() * 3);
        gameData.teamMorale = Math.max(0, curMorale - drop);
        console.log(`패배 (${gameData.losingStreak}연패) - 사기 -${drop} (현재 ${gameData.teamMorale})`);
    }

    updateDisplay();
}

// 스폰서 계약 만료 처리
function expireSponsorContract() {
    const expiredSponsor = gameData.currentSponsor;

    // 계약 정보 초기화
    gameData.currentSponsor = null;
    gameData.sponsorRemainingMatches = 0;

    console.log(`${expiredSponsor.name} 계약 만료`);
    alert(`${expiredSponsor.name}와의 계약이 만료되었습니다. 새로운 스폰서를 선택할 수 있습니다.`);

    // 스폰서 탭이 활성화되어 있다면 새로고침
    if (document.getElementById('sponsor').classList.contains('active')) {
        displaySponsors();
    }

    updateDisplay();
}


// 저장/불러오기에 스폰서 데이터 포함 확인
function checkSponsorDataInSave() {
    // gameData에 다음이 포함되어야 함:
    // - currentSponsor
    // - sponsorRemainingMatches
    console.log('현재 스폰서:', gameData.currentSponsor);
    console.log('남은 계약 경기:', gameData.sponsorRemainingMatches);
}


// [신규] 불러오기 후 스쿼드 선수 객체 재연결 (Re-linking) 및 페이스팩/스펙 자동 복원
// 저장된 스쿼드의 선수 객체는 복사본이므로, 실제 teams의 선수 객체와 연결해줘야 함
function relinkSquadPlayers() {
    if (!gameData.squad || !gameData.selectedTeam || !teams[gameData.selectedTeam]) return;

    const teamPlayers = teams[gameData.selectedTeam];

    // [페이스팩 & 스펙 자동 복원] 이적 선수나 기존 선수의 id/attributes 누락 시 allTeams에서 자동 보충
    teamPlayers.forEach(p => {
        if (!p) return;
        if ((!p.playerid && !p.id) || !p.attributes) {
            let found = null;
            if (typeof allTeams !== 'undefined') {
                for (const t in allTeams) {
                    found = (allTeams[t].players || []).find(x => x.name === p.name);
                    if (found) break;
                }
            }
            if (!found && typeof transferSystem !== 'undefined' && Array.isArray(transferSystem.extraPlayers)) {
                found = transferSystem.extraPlayers.find(x => x.name === p.name);
            }
            if (found) {
                ['playerid', 'playerId', 'id', 'attributes', 'traits', 'detailPosition', 'otherPositions', 'potential', 'preferredFoot', 'weakFoot', 'skillMoves', 'country'].forEach(k => {
                    if (p[k] === undefined && found[k] !== undefined) p[k] = found[k];
                });
            }
            const pid = p.playerid || p.playerId || p.id;
            if (pid) {
                p.playerid = pid;
                p.id = pid;
            }
        }
    });

    const findRealPlayer = (savedPlayer) => {
        if (!savedPlayer) return null;
        // 이름과 포지션으로 실제 선수 객체 찾기
        return teamPlayers.find(p => p.name === savedPlayer.name && p.position === savedPlayer.position) || savedPlayer;
    };

    if (gameData.squad.gk) gameData.squad.gk = findRealPlayer(gameData.squad.gk);
    gameData.squad.df = gameData.squad.df.map(p => findRealPlayer(p));
    gameData.squad.mf = gameData.squad.mf.map(p => findRealPlayer(p));
    gameData.squad.fw = gameData.squad.fw.map(p => findRealPlayer(p));

    console.log('스쿼드 선수 객체 재연결 및 페이스팩/스펙 복원 완료');
}

function saveGame() {
    // 중복 실행 방지
    if (window.savingInProgress) {
        console.log('저장이 이미 진행 중입니다.');
        return;
    }
    window.savingInProgress = true;

    console.log('=== 저장 시작 ===');

    // [추가] AI 선수들의 성장 데이터를 allTeams에도 반영 (저장 시 누락 방지)
    if (typeof allTeams !== 'undefined' && typeof teams !== 'undefined') {
        Object.keys(teams).forEach(teamKey => {
            if (allTeams[teamKey]) {
                allTeams[teamKey].players = teams[teamKey];
            }
        });
        console.log('teams 데이터를 allTeams에 동기화 완료 (AI 성장 반영)');
    }

    try {
        // 이적 시장 데이터 저장 (gameData에 통합)
        if (typeof transferSystem !== 'undefined') {
            gameData.transferSystemData = transferSystem.getSaveData();
        }

        // Records System에서 모든 득점/도움 데이터 수집
        const recordsData = {};

        if (typeof leagueBasedRecordsSystem !== 'undefined') {
            recordsData.recordsSystemData = leagueBasedRecordsSystem.getSaveData();

            // 전체 득점왕/도움왕 순위도 저장
            recordsData.topScorersAll = leagueBasedRecordsSystem.getTopScorers(20);
            recordsData.topAssistersAll = leagueBasedRecordsSystem.getTopAssisters(20);

            // 리그별 득점왕/도움왕도 저장
            recordsData.leagueTopScorers = {};
            recordsData.leagueTopAssisters = {};

            for (let league = 1; league <= 3; league++) {
                recordsData.leagueTopScorers[league] = leagueBasedRecordsSystem.getTopScorersByLeague(league, 10);
                recordsData.leagueTopAssisters[league] = leagueBasedRecordsSystem.getTopAssistersByLeague(league, 10);
            }
        }

        const gameDataToSave = { ...gameData };
        delete gameDataToSave.aiFormations;

        const saveData = {
            gameData: gameDataToSave,
            allTeams: typeof allTeams !== 'undefined' ? allTeams : null, // teams는 allTeams에서 복구 가능하므로 제외
            recordsData: recordsData,
            snsData: snsManager.getSaveData(),
            mailData: mailManager.getSaveData(), // 메일 데이터 저장
            growthData: playerGrowthSystem.getSaveData(),
            injuryData: injurySystem.getSaveData(), // 부상 데이터 추가
            timestamp: new Date().toISOString()
        };

        // JSON 파일로 저장
        const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${teamNames[gameData.selectedTeam]}_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('게임 저장 완료');

    } catch (error) {
        console.error('저장 중 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
    } finally {
        // 중복 실행 방지 해제 (2초 후)
        setTimeout(() => {
            window.savingInProgress = false;
        }, 2000);
    }
}

function loadGame(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 중복 실행 방지
    if (window.loadingInProgress) {
        console.log('불러오기가 이미 진행 중입니다.');
        return;
    }
    window.loadingInProgress = true;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            console.log('=== 게임 불러오기 시작 ===');
            const saveData = JSON.parse(e.target.result);

            // 기본 게임 데이터 복원
            gameData = saveData.gameData;
            window.gameData = gameData;
            if (!gameData.playerRoles) gameData.playerRoles = {}; // [추가] 구버전 세이브 호환성 보장
            if (!gameData.mentoringPairs) gameData.mentoringPairs = []; // [추가] 멘토링 세이브 호환성 보장
            if (typeof calculateTotalWages === 'function') calculateTotalWages();
            if (typeof gameData.wageBudget !== 'number' || gameData.wageBudget < (gameData.totalWeeklyWage || 0)) {
                gameData.wageBudget = gameData.totalWeeklyWage || 0;
            }
            if (!gameData.stadiumInfo && gameData.selectedTeam && typeof stadiumSystem !== 'undefined') {
                stadiumSystem.initUserStadium(gameData.selectedTeam);
            }
            if (!gameData.faCup && !gameData.isWorldCupMode && typeof faCupManager !== 'undefined') {
                faCupManager.initSeason();
            }
            ensureMatchDramaDefaults();
            // [신규] deepTactics 스키마 마이그레이션 (구버전 matchEngine.js 규격 → deepenTactic.js 규격)
            if (typeof migrateDeepTactics === 'function' && gameData.deepTactics) {
                migrateDeepTactics();
            }
            console.log('gameData 복원 완료');

            // 팀 데이터 복원 (allTeams -> teams 재구성)
            if (saveData.allTeams) {
                Object.assign(allTeams, saveData.allTeams);
                console.log('allTeams 데이터 복원 완료');

                // teams 객체 재구성
                Object.keys(allTeams).forEach(teamKey => {
                    teams[teamKey] = allTeams[teamKey].players;
                });
                console.log('teams 객체 재구성 완료');
            } else if (saveData.teams) {
                // 구버전 호환: teams만 있는 경우
                Object.assign(teams, saveData.teams);
            }

            // 스쿼드 선수 객체 재연결 (중요!)
            relinkSquadPlayers();

            // AI 최적 포메이션 캐시 복원 (저장 용량 절감을 위해 생략된 경우 재계산)
            if (!gameData.aiFormations && typeof TeamUtils !== 'undefined') {
                TeamUtils.initializeAllAIFormations();
            }

            // 리그 테이블 복원 (gameData.leagueData 기반으로 전역 변수 복구)
            if (gameData.leagueData) {
                if (gameData.leagueData.division1) window.league1Table = gameData.leagueData.division1;
                if (gameData.leagueData.division2) window.league2Table = gameData.leagueData.division2;
                if (gameData.leagueData.division3) window.league3Table = gameData.leagueData.division3;
                console.log('리그 테이블 전역 변수 복구 완료');
            } else {
                // 구버전 호환
                if (saveData.league1Table) window.league1Table = saveData.league1Table;
                if (saveData.league2Table) window.league2Table = saveData.league2Table;
                if (saveData.league3Table) window.league3Table = saveData.league3Table;
            }

            // Records System 데이터 복원
            if (saveData.recordsData && typeof leagueBasedRecordsSystem !== 'undefined') {
                if (saveData.recordsData.recordsSystemData) {
                    leagueBasedRecordsSystem.loadSaveData(saveData.recordsData.recordsSystemData);
                    console.log('Records System 데이터 복원 완료');
                }
            }
            // 기존 형식 호환성 지원
            else if (saveData.recordsSystemData && typeof leagueBasedRecordsSystem !== 'undefined') {
                leagueBasedRecordsSystem.loadSaveData(saveData.recordsSystemData);
                console.log('Records System 데이터 복원 완료 (기존 형식)');
            }

            // SNS 데이터 복원
            if (saveData.snsData && typeof snsManager !== 'undefined') {
                snsManager.loadSaveData(saveData.snsData);
                console.log('SNS 데이터 복원 완료');
            }

            // 부상 데이터 복원
            if (saveData.injuryData && typeof injurySystem !== 'undefined') {
                injurySystem.loadSaveData(saveData.injuryData);
                console.log('부상 데이터 복원 완료');
            }

            // 이적 시장 데이터 복원
            if (gameData.transferSystemData && typeof transferSystem !== 'undefined') {
                transferSystem.loadSaveData(gameData.transferSystemData);
                console.log('이적 시장 데이터 복원 완료');
            }

            // 스케줄 데이터 복원 (없으면 생성)
            if (!gameData.schedule) {
                generateFullSchedule();
            }

            // 시작 연도 초기화 (구버전 호환)
            if (!gameData.startYear) {
                gameData.startYear = 2025;
            }

            // [추가] 시즌 카운트 복원 (구버전 호환)
            if (!gameData.seasonCount) {
                gameData.seasonCount = (gameData.startYear || 2025) - 2024;
            }

            // 포텐셜 시스템 처리
            if (typeof playerGrowthSystem !== 'undefined') {
                console.log('=== 포텐셜 시스템 처리 시작 ===');

                playerGrowthSystem.resetGrowthSystem();
                console.log('기존 포텐셜 데이터 초기화 완료');

                if (saveData.growthData) {
                    playerGrowthSystem.loadSaveData(saveData.growthData);
                    console.log('저장된 포텐셜 데이터 로드 완료');

                    const summary = playerGrowthSystem.getTeamGrowthSummary();
                    console.log('복원된 성장 중인 선수 수:', summary.length);
                } else {
                    playerGrowthSystem.initializePlayerGrowth();
                    console.log('새로운 포텐셜 시스템 초기화');
                }

                console.log('=== 포텐셜 시스템 처리 완료 ===');
            }


            // 화면 업데이트
            console.log('=== 화면 업데이트 시작 ===');
            const teamNameEl = document.getElementById('teamName');
            if (teamNameEl) {
                teamNameEl.replaceChildren(createTeamLogoElement(gameData.selectedTeam), document.createTextNode(' ' + (teamNames[gameData.selectedTeam] || gameData.selectedTeam)));
            }
            updateDisplay();
            updateFormationDisplay();
            displayTeamPlayers();
            showScreen('lobby'); // 로비 화면으로 이동
            if (typeof showDashboard === 'function') showDashboard(); // 대시보드 표시
            console.log('기본 화면 업데이트 완료');

            // SNS 피드 새로고침
            if (typeof snsManager !== 'undefined' && document.getElementById('snsFeed')) {
                snsManager.displayFeed('snsFeed', 15);
                console.log('SNS 피드 새로고침 완료');
            }

            // Records 탭 업데이트
            if (typeof updateRecordsTab === 'function') {
                updateRecordsTab();
                console.log('Records 탭 업데이트 완료');
            }

            console.log('=== 게임 불러오기 완료 ===');
            alert('게임을 불러왔습니다!');

            // gameData 객체가 교체되었으므로 자동 저장 감지기 재설정
            if (window.AutoSaveSystem) {
                window.AutoSaveSystem.hookMoney();
            }

            // 자동 저장 UI 업데이트
            if (typeof window.updateAutoSaveUI === 'function') {
                window.updateAutoSaveUI();
            }

            // 오디오 설정 복원 및 재생
            if (typeof audioManager !== 'undefined') {
                audioManager.init();
                audioManager.applySettings(gameData.settings);
            }

            // 커스텀 커서 설정 복원
            if (window.customCursorInstance && gameData.settings) {
                const isCustomCursorOn = gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : false;
                window.customCursorInstance.toggle(isCustomCursorOn);
            }

        } catch (error) {
            console.error('불러오기 에러:', error);
            alert('저장 파일을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setTimeout(() => {
                window.loadingInProgress = false;
            }, 1000);
        }
    };

    reader.readAsText(file);
    event.target.value = '';
}

// [신규] 메인 화면에 저장된 슬롯 렌더링
function renderMainSaveSlots() {
    const container = document.getElementById('mainLoadSlots');
    const section = document.getElementById('mainLoadSection');
    if (!container || !section) return;

    container.replaceChildren();
    let hasSave = false;

    for (let i = 1; i <= 3; i++) {
        const slotInfo = getSlotInfo(i);
        if (slotInfo) {
            hasSave = true;
            const slotDiv = document.createElement('div');
            slotDiv.className = 'main-load-slot';
            slotDiv.style.cssText = `background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                padding: 15px;
                display: flex;
                align-items: center;
                gap: 15px;
                cursor: pointer;
                transition: all 0.2s;
            `;

            // 호버 효과
            slotDiv.onmouseover = () => {
                slotDiv.style.background = 'rgba(255, 255, 255, 0.2)';
                slotDiv.style.transform = 'translateY(-3px)';
                slotDiv.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
            };
            slotDiv.onmouseout = () => {
                slotDiv.style.background = 'rgba(255, 255, 255, 0.1)';
                slotDiv.style.transform = 'none';
                slotDiv.style.boxShadow = 'none';
            };

            const iconDiv = document.createElement('div');
            iconDiv.style.cssText = 'color: #38BDF8; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(56, 189, 248, 0.12); border-radius: 6px;';
            iconDiv.innerHTML = typeof iconSVG === 'function' ? iconSVG('save') : 'SAVE';

            const infoDiv = document.createElement('div');
            infoDiv.style.flex = '1';

            const teamNameDiv = document.createElement('div');
            teamNameDiv.style.cssText = 'color: #ffd700; font-weight: bold; font-size: 1.1rem;';
            teamNameDiv.textContent = slotInfo.teamName;

            const descDiv = document.createElement('div');
            descDiv.style.cssText = 'font-size: 0.85rem; color: #ccc;';

            const line1 = document.createTextNode(`시즌 ${slotInfo.season} | ${slotInfo.matchesPlayed}경기 진행`);
            const br = document.createElement('br');
            const dateSpan = document.createElement('span');
            dateSpan.style.color = '#aaa';
            dateSpan.textContent = `${new Date(slotInfo.timestamp).toLocaleDateString()} 저장됨`;

            descDiv.append(line1, br, dateSpan);
            infoDiv.append(teamNameDiv, descDiv);

            const arrowDiv = document.createElement('div');
            arrowDiv.style.cssText = 'font-size: 1.5rem; color: #2ecc71;';
            arrowDiv.textContent = '';

            slotDiv.append(iconDiv, infoDiv, arrowDiv);
            slotDiv.onclick = () => loadFromSlot(i);
            container.appendChild(slotDiv);
        }
    }

    section.style.display = hasSave ? 'block' : 'none';
}

// [신규] 경기 시작 시퀀스 (캘린더 시뮬레이션 -> 경기 시작)
function runMatchSequence() {
    // 30% 확률로 이벤트 모달 표시
    if (Math.random() < 0.30 && window.eventManager && gameData.selectedTeam) {
        const eventData = window.eventManager.triggerRandomEvent();
        if (eventData) {
            window.eventManager.showEventModal(eventData, _runMatchSequenceInternal);
            return;
        }
    }
    _runMatchSequenceInternal();
}

function _runMatchSequenceInternal() {
    const modal = document.getElementById('calendarModal');
    const dateEl = document.getElementById('calendarDate');
    const eventEl = document.getElementById('calendarEvent');
    const opponentEl = document.getElementById('calendarOpponent');

    if (!modal) {
        if (typeof window.startMatch === 'function') {
            window.startMatch();
        } else {
            console.error("startMatch function is not defined.");
        }
        return;
    }

    // 1. 초기화
    modal.style.display = 'flex';
    opponentEl.style.opacity = '0';
    opponentEl.replaceChildren();

    // 현재 날짜 계산
    const baseDate = new Date(2025, 7, 1);
    const currentRound = gameData.currentRound || 1;
    const daysPassed = (currentRound - 1) * 4;

    let currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + daysPassed);

    const simDays = 3;
    let dayCount = 0;
    const events = ["전술 훈련", "체력 단련", "비디오 분석", "휴식", "미디어 데이", "가벼운 훈련"];

    // 2. 날짜 넘기기 애니메이션
    const interval = setInterval(() => {
        const displayDate = new Date(currentDate);
        displayDate.setDate(currentDate.getDate() - (simDays - dayCount));

        const month = displayDate.getMonth() + 1;
        const day = displayDate.getDate();
        dateEl.textContent = `${month}월 ${day}일`;

        if (dayCount < simDays) {
            eventEl.textContent = events[Math.floor(Math.random() * events.length)];
            eventEl.style.color = '#aaa';
        } else {
            eventEl.textContent = "MATCH DAY";
            eventEl.style.color = "#e74c3c";
            eventEl.style.fontWeight = "bold";

            const oppName = gameData.currentOpponent ? teamNames[gameData.currentOpponent] : "상대팀";
            opponentEl.replaceChildren(document.createTextNode('VS '));
            const oppSpan = document.createElement('span');
            oppSpan.style.color = '#ffd700';
            oppSpan.textContent = oppName;
            opponentEl.appendChild(oppSpan);
            opponentEl.style.opacity = '1';

            clearInterval(interval);

            // 3. 잠시 후 경기 시작
            setTimeout(() => {
                modal.style.display = 'none';
                if (typeof window.startMatch === 'function') {
                    window.startMatch();
                }
            }, 1500);
        }
        dayCount++;
    }, 400);
}


// 이벤트 리스너 설정
function setupSaveLoadListeners() {
    const saveBtn = document.getElementById('saveGameBtn');
    const loadBtn = document.getElementById('loadGameBtn');
    const loadInput = document.getElementById('loadGameInput');

    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', saveGame);
        console.log('저장 버튼 이벤트 리스너 설정 완료');
    }

    if (loadBtn && loadInput) {
        const newLoadBtn = loadBtn.cloneNode(true);
        loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);

        const newLoadInput = loadInput.cloneNode(true);
        loadInput.parentNode.replaceChild(newLoadInput, loadInput);

        newLoadBtn.addEventListener('click', function () {
            newLoadInput.click();
        });
        newLoadInput.addEventListener('change', loadGame);

        console.log('불러오기 버튼 이벤트 리스너 설정 완료');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(setupSaveLoadListeners, 1500);
});

// 전술 정보 버튼 이벤트 리스너 (설정 탭 제거 대비 null-safe)
const showTacticsBtnEl = document.getElementById('showTacticsBtn');
if (showTacticsBtnEl) showTacticsBtnEl.addEventListener('click', showTacticsInfo);
const showTeamTacticsBtnEl = document.getElementById('showTeamTacticsBtn');
if (showTeamTacticsBtnEl) showTeamTacticsBtnEl.addEventListener('click', showTeamTacticsInfo);

// 전술 정보 표시 함수 (통합 전술 팁 모달로 일원화)
function showTacticsInfo() {
    const tipsModal = document.getElementById('tacticTipsModal');
    if (tipsModal) {
        tipsModal.style.display = 'block';
        return;
    }
    const tactics = {
        gegenpress: {
            name: "게겐프레싱",
            effective: ["twoLine", "possession"],
            ineffective: ["longBall", "catenaccio"],
            description: "높은 압박으로 빠른 역습을 노리는 전술"
        },
        twoLine: {
            name: "다이렉트 축구",
            effective: ["longBall", "parkBus"],
            ineffective: ["gegenpress", "totalFootball"],
            description: "긴 패스로 상대의 공간을 파고드는 전술"
        },
        lavolpiana: {
            name: "라볼피아나",
            effective: ["possession", "tikitaka"],
            ineffective: ["catenaccio", "longBall"],
            description: "측면 공격과 크로스를 중심으로 한 전술"
        },
        longBall: {
            name: "롱볼 축구",
            effective: ["parkBus", "catenaccio"],
            ineffective: ["gegenpress", "tikitaka"],
            description: "긴 패스로 빠르게 공격을 전개하는 전술"
        },
        possession: {
            name: "점유율 축구",
            effective: ["tikitaka", "lavolpiana"],
            ineffective: ["longBall", "gegenpress"],
            description: "공을 오래 소유하며 천천히 공격 기회를 만드는 전술"
        },
        parkBus: {
            name: "역습 축구",
            effective: ["catenaccio", "twoLine"],
            ineffective: ["gegenpress", "totalFootball"],
            description: "수비에 집중하고 호시탐탐 역습을 노리는 전술"
        },
        catenaccio: {
            name: "카테나치오",
            effective: ["twoLine", "parkBus"],
            ineffective: ["possession", "totalFootball"],
            description: "이탈리아식 견고한 수비 전술"
        },
        totalFootball: {
            name: "토탈 풋볼",
            effective: ["tikitaka", "gegenpress"],
            ineffective: ["twoLine", "catenaccio"],
            description: "모든 선수가 공격과 수비에 참여하는 전술"
        },
        tikitaka: {
            name: "티키타카",
            effective: ["possession", "lavolpiana"],
            ineffective: ["longBall", "parkBus"],
            description: "짧은 패스를 연결하며 공간을 만드는 전술"
        }
    };

    document.getElementById('tacticsModalTitle').textContent = '전술 상성표';

    const modalContent = document.getElementById('tacticsModalContent');
    if (!modalContent) return;
    modalContent.replaceChildren();

    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'max-height: 500px; overflow-y: auto;';

    Object.entries(tactics).forEach(([key, tactic]) => {
        const card = document.createElement('div');
        card.style.cssText = 'background: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 12px;';

        const title = document.createElement('h4');
        title.style.cssText = 'color: #38BDF8; font-size: 1.05rem; font-weight: 800; margin: 0 0 8px 0;';
        title.textContent = `[${tactic.name}]`;

        const desc = document.createElement('p');
        desc.style.cssText = 'margin: 0 0 12px 0; line-height: 1.4; color: #94A3B8; font-size: 0.88rem;';
        desc.textContent = tactic.description;

        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';

        const effBox = document.createElement('div');
        effBox.style.cssText = 'background: rgba(163, 230, 53, 0.1); border: 1px solid rgba(163, 230, 53, 0.25); padding: 10px; border-radius: 6px;';
        const effTitle = document.createElement('strong');
        effTitle.style.cssText = 'color: #A3E635; display: block; margin-bottom: 6px; font-size: 0.82rem;';
        effTitle.textContent = '유리한 상대 전술:';
        effBox.appendChild(effTitle);
        tactic.effective.forEach(t => {
            const line = document.createElement('div');
            line.style.cssText = 'color: #F8FAFC; font-size: 0.85rem; padding: 2px 0;';
            line.textContent = `· ${tactics[t] ? tactics[t].name : t}`;
            effBox.appendChild(line);
        });

        const ineffBox = document.createElement('div');
        ineffBox.style.cssText = 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); padding: 10px; border-radius: 6px;';
        const ineffTitle = document.createElement('strong');
        ineffTitle.style.cssText = 'color: #F87171; display: block; margin-bottom: 6px; font-size: 0.82rem;';
        ineffTitle.textContent = '불리한 상대 전술:';
        ineffBox.appendChild(ineffTitle);
        tactic.ineffective.forEach(t => {
            const line = document.createElement('div');
            line.style.cssText = 'color: #F8FAFC; font-size: 0.85rem; padding: 2px 0;';
            line.textContent = `· ${tactics[t] ? tactics[t].name : t}`;
            ineffBox.appendChild(line);
        });

        grid.append(effBox, ineffBox);
        card.append(title, desc, grid);
        scrollContainer.appendChild(card);
    });

    const tipDiv = document.createElement('div');
    tipDiv.style.cssText = 'background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); border-radius: 6px; padding: 12px; margin-top: 12px; text-align: center;';
    const tipStrong = document.createElement('strong');
    tipStrong.style.cssText = 'color: #FBBF24; font-size: 0.88rem;';
    tipStrong.textContent = 'TIP: 경기 전 상대팀의 전술을 확인하고, 상대 전술에 상성상 유리한 전술을 선택하세요.';
    tipDiv.appendChild(tipStrong);
    scrollContainer.appendChild(tipDiv);

    modalContent.appendChild(scrollContainer);
    document.getElementById('tacticsModal').style.display = 'block';
}

// 팀별 전술 매핑 (전역 변수)
const teamTactics = {
    // 1부 리그
    바르셀로나: "tikitaka",
    레알_마드리드: "possession",
    맨체스터_시티: "tikitaka",
    리버풀: "gegenpress",
    토트넘_홋스퍼: "totalFootball",
    파리_생제르맹: "tikitaka",
    AC_밀란: "twoLine",
    인터_밀란: "catenaccio",
    아스널: "tikitaka",
    나폴리: "possession",
    첼시: "gegenpress",
    바이에른_뮌헨: "tikitaka",
    아틀레티코_마드리드: "catenaccio",
    도르트문트: "gegenpress",

    // 2부 리그
    유벤투스: "catenaccio",
    뉴캐슬_유나이티드: "longBall",
    아스톤_빌라: "possession",
    라이프치히: "gegenpress",
    세비야: "tikitaka",
    아약스: "totalFootball",
    AS_로마: "catenaccio",
    레버쿠젠: "longBall",
    스포르팅_CP: "possession",
    벤피카: "twoLine",
    셀틱: "longBall",
    페예노르트: "possession",
    맨체스터_유나이티드: "gegenpress",
    올랭피크_드_마르세유: "twoLine",

    // 3부 리그
    FC_서울: "lavolpiana",
    갈라타사라이: "possession",
    알_힐랄: "tikitaka",
    알_이티하드: "possession",
    알_나스르: "twoLine",
    아르헨티나_연합: "catenaccio",
    미국_연합: "gegenpress",
    멕시코_연합: "totalFootball",
    브라질_연합: "possession",
    전북_현대: "lavolpiana",
    울산_현대: "tikitaka",
    포항_스틸러스: "possession",
    광주_FC: "tikitaka",
    리옹: "twoLine"
};

// 팀별 전술 정보 표시 함수
function showTeamTacticsInfo() {
    // 전술별로 그룹화
    const tacticGroups = {};
    Object.entries(teamTactics).forEach(([teamKey, tacticKey]) => {
        if (!tacticGroups[tacticKey]) {
            tacticGroups[tacticKey] = [];
        }
        tacticGroups[tacticKey].push(teamNames[teamKey] || teamKey);
    });

    const modalContent = document.getElementById('tacticsModalContent');
    if (!modalContent) return;
    modalContent.replaceChildren();

    const scrollContainer = document.createElement('div');
    scrollContainer.style.cssText = 'max-height: 500px; overflow-y: auto;';

    Object.entries(tacticGroups).forEach(([tacticKey, teams]) => {
        const card = document.createElement('div');
        card.style.cssText = 'background: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 16px; margin-bottom: 12px;';

        const title = document.createElement('h4');
        title.style.cssText = 'color: #38BDF8; font-size: 1.05rem; font-weight: 800; margin: 0 0 12px 0; display: flex; align-items: center; gap: 6px;';
        title.textContent = tacticNames[tacticKey] || tacticKey;

        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;';

        teams.forEach(team => {
            const teamDiv = document.createElement('div');
            teamDiv.style.cssText = 'background: #161F30; padding: 8px 12px; border-radius: 6px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.08); font-size: 0.88rem; color: #F8FAFC;';
            teamDiv.textContent = team;
            grid.appendChild(teamDiv);
        });

        card.append(title, grid);
        scrollContainer.appendChild(card);
    });

    const tipDiv = document.createElement('div');
    tipDiv.style.cssText = 'background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); border-radius: 6px; padding: 12px; margin-top: 12px; text-align: center;';
    const tipStrong = document.createElement('strong');
    tipStrong.style.cssText = 'color: #FBBF24; font-size: 0.88rem;';
    tipStrong.textContent = 'TIP: 경기 전에 상대팀의 전술을 확인하고 대응 전술을 준비하세요.';
    tipDiv.appendChild(tipStrong);
    scrollContainer.appendChild(tipDiv);

    modalContent.appendChild(scrollContainer);
    document.getElementById('tacticsModal').style.display = 'block';
}


const tacticNames = {
    gegenpress: "게겐프레싱",
    twoLine: "다이렉트 축구",
    lavolpiana: "라볼피아나",
    longBall: "롱볼축구",
    possession: "점유율 축구",
    parkBus: "역습 축구",
    catenaccio: "카테나치오",
    totalFootball: "토탈 풋볼",
    tikitaka: "티키타카"
};

// 전술 모달 닫기 함수
function closeTacticsModal() {
    document.getElementById('tacticsModal').style.display = 'none';
}

// 모달 바깥 클릭 시 닫기
window.onclick = function (event) {
    const tacticsModal = document.getElementById('tacticsModal');
    if (event.target === tacticsModal) {
        tacticsModal.style.display = 'none';
    }
}

// 팀 테마 적용 함수
function applyTeamTheme(teamKey) {
    // 기존 팀 클래스 제거
    document.body.className = document.body.className.replace(/team-\w+/g, '');

    // 새로운 팀 클래스 추가
    document.body.classList.add(`team-${teamKey}`);
}

// 아니진짜왜안되지

// 슬롯 정보 가져오기
// 특정 슬롯 정보 가져오기
function getSlotInfo(slotNumber, managerId = null) {
    const activeManagerId = managerId || gameData.managerId;
    const saveKey = activeManagerId ? `fm_save_${activeManagerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
    const savedData = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(saveKey) : localStorage.getItem(saveKey);
    if (!savedData) return null;

    try {
        const data = JSON.parse(savedData);
        const selectedTeam = data.gameData.selectedTeam;
        const currentLeague = data.gameData.currentLeague;

        // 팀 순위 계산
        let teamRank = '-';
        const divisionKey = `division${currentLeague}`;
        const uLeagueId = (typeof allTeams !== 'undefined' && allTeams[selectedTeam] && allTeams[selectedTeam].leagueId)
            ? allTeams[selectedTeam].leagueId
            : null;
        const leagueDataObj = (data.gameData.leagueData)
            ? ((uLeagueId && data.gameData.leagueData[uLeagueId]) || data.gameData.leagueData[divisionKey] || data.gameData.leagueData.division1)
            : null;

        if (leagueDataObj) {
            const standings = Object.keys(leagueDataObj).map(teamKey => ({
                team: teamKey,
                ...leagueDataObj[teamKey],
                goalDiff: leagueDataObj[teamKey].goalsFor - leagueDataObj[teamKey].goalsAgainst
            })).sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                return b.goalsFor - a.goalsFor;
            });

            const rank = standings.findIndex(team => team.team === selectedTeam);
            if (rank !== -1) {
                teamRank = rank + 1;
            }
        }

        // 다음 상대팀
        const nextOpponent = data.gameData.currentOpponent ? teamNames[data.gameData.currentOpponent] : '미정';

        return {
            teamName: teamNames[selectedTeam] || '알 수 없음',
            timestamp: data.timestamp,
            matchesPlayed: data.gameData.matchesPlayed || 0,
            money: data.gameData.teamMoney || 0,
            league: currentLeague || 1,
            rank: teamRank,
            nextOpponent: nextOpponent,
            season: data.gameData.seasonCount || ((data.gameData.startYear || 2025) - 2024) // [추가] 시즌 정보
        };
    } catch (error) {
        console.error(`슬롯 ${slotNumber} 정보 읽기 오류:`, error);
        return null;
    }
}

// 슬롯 UI 생성
function createSaveSlots() {
    const container = document.getElementById('saveSlots');
    if (!container) return;

    container.replaceChildren();

    for (let i = 1; i <= 3; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'save-slot';
        slotDiv.style.cssText = `background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const slotInfo = getSlotInfo(i);

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin: 0; color: #ffd700;';
        h4.textContent = `슬롯 ${i}`;

        const statusSpan = document.createElement('span');
        statusSpan.style.fontSize = '0.9rem';
        if (slotInfo) {
            statusSpan.style.color = '#2ecc71';
            statusSpan.textContent = '저장됨';
        } else {
            statusSpan.style.color = '#95a5a6';
            statusSpan.textContent = '빈 슬롯';
        }
        headerDiv.append(h4, statusSpan);

        const infoDiv = document.createElement('div');
        if (slotInfo) {
            infoDiv.style.cssText = 'background: #090D16; border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px; border-radius: 6px;';

            const teamNameDiv = document.createElement('div');
            teamNameDiv.style.cssText = 'color: #38BDF8; font-weight: 800; font-size: 1.05rem; margin-bottom: 6px;';
            teamNameDiv.textContent = slotInfo.teamName;

            const date = new Date(slotInfo.timestamp);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            const descDiv = document.createElement('div');
            descDiv.style.cssText = 'font-size: 0.85rem; color: #94A3B8; line-height: 1.6; font-variant-numeric: tabular-nums;';
            descDiv.append(
                `저장 일시: ${formattedDate}`, document.createElement('br'),
                `시즌 ${slotInfo.season} · ${slotInfo.league}부 리그 ${slotInfo.rank}위`, document.createElement('br'),
                `경기 수: ${slotInfo.matchesPlayed}경기 · 자금: ${slotInfo.money}억`, document.createElement('br'),
                `다음 상대: ${slotInfo.nextOpponent}`
            );
            infoDiv.append(teamNameDiv, descDiv);
        } else {
            infoDiv.style.cssText = 'text-align: center; padding: 20px; color: #94A3B8; opacity: 0.6;';
            const icon = document.createElement('div');
            icon.style.cssText = 'margin-bottom: 8px; display: flex; justify-content: center;';
            icon.innerHTML = typeof iconSVG === 'function' ? iconSVG('folder') : '';
            const emptyLabel = document.createElement('div');
            emptyLabel.textContent = '비어있는 슬롯';
            infoDiv.append(icon, emptyLabel);
        }

        const btnGrid = document.createElement('div');
        btnGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn';
        saveBtn.style.cssText = 'padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;';
        saveBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('save') : ''}<span>저장</span>`;
        saveBtn.onclick = () => saveToSlot(i);

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn';
        loadBtn.style.cssText = 'padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;';
        loadBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('folder') : ''}<span>불러오기</span>`;
        if (!slotInfo) loadBtn.disabled = true;
        loadBtn.onclick = () => loadFromSlot(i);

        btnGrid.append(saveBtn, loadBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn';
        delBtn.style.cssText = 'background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #F87171; padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;';
        delBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trash') : ''}<span>이 슬롯 삭제</span>`;
        if (!slotInfo) delBtn.disabled = true;
        delBtn.onclick = () => deleteSlot(i);

        slotDiv.append(headerDiv, infoDiv, btnGrid, delBtn);
        container.appendChild(slotDiv);
    }
}

// 특정 슬롯에 저장
async function saveToSlot(slotNumber, silent = false) {
    try {
        if (!silent) console.log(`=== 슬롯 ${slotNumber}에 저장 시작 ===`);

        // [추가] 자동 저장 타겟 슬롯 업데이트 (수동 저장 시 해당 슬롯을 따라감)
        if (window.AutoSaveSystem) {
            window.AutoSaveSystem.setLastLoadedSlot(slotNumber);
        }

        // [추가] AI 선수들의 성장 데이터를 allTeams에도 반영
        if (typeof allTeams !== 'undefined' && typeof teams !== 'undefined') {
            Object.keys(teams).forEach(teamKey => {
                if (allTeams[teamKey]) {
                    allTeams[teamKey].players = teams[teamKey];
                }
            });
        }

        const slotInfo = getSlotInfo(slotNumber);

        // 자동 저장이 아닐 때만 덮어쓰기 확인
        if (slotInfo && !silent) {
            if (!confirm(`슬롯 ${slotNumber}에 이미 저장된 데이터가 있습니다.\n(${slotInfo.teamName}, ${slotInfo.matchesPlayed}경기)\n\n덮어쓰시겠습니까?`)) {
                return false;
            }
        }

        // [수정] 이적 시장 데이터 저장 (gameData에 통합)
        if (typeof transferSystem !== 'undefined') {
            gameData.transferSystemData = transferSystem.getSaveData();
        }

        // Records System 데이터 수집 (불필요한 중복 랭킹 캐시는 제외해 저장 용량 절감)
        const recordsData = {};

        if (typeof leagueBasedRecordsSystem !== 'undefined') {
            recordsData.recordsSystemData = leagueBasedRecordsSystem.getSaveData();
        }

        // aiFormations는 로드 시 즉시 재계산 가능한 캐시이므로 저장 데이터에서 제외 (약 3~4MB 절감)
        const gameDataToSave = { ...gameData };
        delete gameDataToSave.aiFormations;

        const saveData = {
            gameData: gameDataToSave,
            allTeams: typeof allTeams !== 'undefined' ? allTeams : null,
            recordsData: recordsData,
            snsData: snsManager.getSaveData(),
            mailData: mailManager.getSaveData(),
            growthData: playerGrowthSystem.getSaveData(),
            injuryData: injurySystem.getSaveData(),
            timestamp: new Date().toISOString()
        };

        // [수정] 매니저 시스템 적용: gameData.managerId 기반으로 저장키 분리
        const managerId = gameData.managerId;
        const saveKey = managerId ? `fm_save_${managerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
        const serializedData = JSON.stringify(saveData);

        // IndexedDB 기반 대용량 스토리지에 저장 (미지원 시 localStorage 폴백)
        if (typeof SaveStorage !== 'undefined') {
            await SaveStorage.setItem(saveKey, serializedData);
        } else {
            localStorage.setItem(saveKey, serializedData);
        }

        if (!silent) {
            console.log(`슬롯 ${slotNumber}에 저장 완료`);
            alert(`슬롯 ${slotNumber}에 게임이 저장되었습니다!`);
        }

        // 슬롯 UI 새로고침
        createSaveSlots();
        return true;

    } catch (error) {
        console.error(`슬롯 ${slotNumber} 저장 중 오류:`, error);

        if (!silent) {
            // 용량 초과 에러 처리
            if (error && error.name === 'QuotaExceededError') {
                alert('브라우저 저장 공간이 부족합니다. 다른 슬롯을 삭제하거나 파일 저장을 이용해주세요.');
            } else {
                alert('저장 중 오류가 발생했습니다.');
            }
        }
        return false;
    }
}

// 특정 슬롯에서 불러오기
function loadFromSlot(slotNumber, overrideManagerId = null) {
    try {
        const managerId = overrideManagerId || gameData.managerId;
        const saveKey = managerId ? `fm_save_${managerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
        const savedData = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(saveKey) : localStorage.getItem(saveKey);

        if (!savedData) {
            alert(`슬롯 ${slotNumber}에 저장된 게임이 없습니다.`);
            return;
        }

        const slotInfo = getSlotInfo(slotNumber);
        const confirmMessage = slotInfo
            ? `슬롯 ${slotNumber}의 게임을 불러오시겠습니까?\n\n팀: ${slotInfo.teamName}\n경기 수: ${slotInfo.matchesPlayed}\n\n현재 진행 중인 게임은 사라집니다.`
            : `슬롯 ${slotNumber}의 게임을 불러오시겠습니까?\n현재 진행 중인 게임은 사라집니다.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        console.log(`=== 슬롯 ${slotNumber}에서 불러오기 시작 ===`);
        const saveData = JSON.parse(savedData);

        // 기본 게임 데이터 복원
        gameData = saveData.gameData;
        window.gameData = gameData;
        if (!gameData.playerRoles) gameData.playerRoles = {};
        if (!gameData.mentoringPairs) gameData.mentoringPairs = [];
        if (typeof calculateTotalWages === 'function') calculateTotalWages();
        if (typeof gameData.wageBudget !== 'number' || gameData.wageBudget < (gameData.totalWeeklyWage || 0)) {
            gameData.wageBudget = gameData.totalWeeklyWage || 0;
        }
        if (!gameData.stadiumInfo && gameData.selectedTeam && typeof stadiumSystem !== 'undefined') {
            stadiumSystem.initUserStadium(gameData.selectedTeam);
        }
        if (!gameData.faCup && !gameData.isWorldCupMode && typeof faCupManager !== 'undefined') {
            faCupManager.initSeason();
        }
        ensureMatchDramaDefaults();
        console.log('gameData 복원 완료');

        // 팀 데이터 복원 (allTeams -> teams 재구성)
        if (saveData.allTeams) {
            Object.assign(allTeams, saveData.allTeams);
            console.log('allTeams 데이터 복원 완료');

            // teams 객체 재구성
            Object.keys(allTeams).forEach(teamKey => {
                teams[teamKey] = allTeams[teamKey].players;
            });
            console.log('teams 객체 재구성 완료');
        } else if (saveData.teams) {
            // 구버전 호환
            Object.assign(teams, saveData.teams);
        }

        // 스쿼드 선수 객체 재연결
        relinkSquadPlayers();

        // AI 최적 포메이션 캐시 복원 (저장 용량 절감을 위해 생략된 경우 재계산)
        if (!gameData.aiFormations && typeof TeamUtils !== 'undefined') {
            TeamUtils.initializeAllAIFormations();
        }

        // 이적 시장 데이터 복원
        if (gameData.transferSystemData && typeof transferSystem !== 'undefined') {
            transferSystem.loadSaveData(gameData.transferSystemData);
        }

        // 스케줄 데이터 복원 (없으면 생성)
        if (!gameData.schedule) {
            generateFullSchedule();
        }

        // 리그 테이블 복원
        if (gameData.leagueData) {
            if (gameData.leagueData.division1) window.league1Table = gameData.leagueData.division1;
            if (gameData.leagueData.division2) window.league2Table = gameData.leagueData.division2;
            if (gameData.leagueData.division3) window.league3Table = gameData.leagueData.division3;
            console.log('리그 테이블 전역 변수 복구 완료');
        } else {
            // 구버전 호환
            if (saveData.league1Table) window.league1Table = saveData.league1Table;
            if (saveData.league2Table) window.league2Table = saveData.league2Table;
            if (saveData.league3Table) window.league3Table = saveData.league3Table;
        }

        // Records System 데이터 복원
        if (saveData.recordsData && typeof leagueBasedRecordsSystem !== 'undefined') {
            if (saveData.recordsData.recordsSystemData) {
                leagueBasedRecordsSystem.loadSaveData(saveData.recordsData.recordsSystemData);
                console.log('Records System 데이터 복원 완료');
            }
        }

        // SNS 데이터 복원
        if (saveData.snsData && typeof snsManager !== 'undefined') {
            snsManager.loadSaveData(saveData.snsData);
            console.log('SNS 데이터 복원 완료');
        }

        // 메일 데이터 복원
        if (saveData.mailData && typeof mailManager !== 'undefined') {
            mailManager.loadSaveData(saveData.mailData);
            console.log('메일 데이터 복원 완료');
        }

        // 부상 데이터 복원
        if (saveData.injuryData && typeof injurySystem !== 'undefined') {
            injurySystem.loadSaveData(saveData.injuryData);
            console.log('부상 데이터 복원 완료');
        }

        // 포텐셜 시스템 처리
        if (typeof playerGrowthSystem !== 'undefined') {
            console.log('=== 포텐셜 시스템 처리 시작 ===');

            playerGrowthSystem.resetGrowthSystem();
            console.log('기존 포텐셜 데이터 초기화 완료');

            if (saveData.growthData) {
                playerGrowthSystem.loadSaveData(saveData.growthData);
                console.log('저장된 포텐셜 데이터 로드 완료');
            } else {
                playerGrowthSystem.initializePlayerGrowth();
                console.log('새로운 포텐셜 시스템 초기화');
            }

            console.log('=== 포텐셜 시스템 처리 완료 ===');
        }

        // 화면 업데이트
        console.log('=== 화면 업데이트 시작 ===');
        const teamNameEl = document.getElementById('teamName');
        if (teamNameEl) {
            teamNameEl.replaceChildren(createTeamLogoElement(gameData.selectedTeam), document.createTextNode(' ' + (teamNames[gameData.selectedTeam] || gameData.selectedTeam)));
        }
        updateDisplay();
        updateFormationDisplay();
        displayTeamPlayers();
        showScreen('lobby'); // 로비 화면으로 이동
        if (typeof showDashboard === 'function') showDashboard(); // 대시보드 표시
        console.log('기본 화면 업데이트 완료');

        // SNS 피드 새로고침
        if (typeof snsManager !== 'undefined' && document.getElementById('snsFeed')) {
            snsManager.displayFeed('snsFeed', 15);
            console.log('SNS 피드 새로고침 완료');
        }

        // Records 탭 업데이트
        if (typeof updateRecordsTab === 'function') {
            updateRecordsTab();
            console.log('Records 탭 업데이트 완료');
        }

        console.log(`=== 슬롯 ${slotNumber}에서 불러오기 완료 ===`);
        alert(`슬롯 ${slotNumber}에서 게임을 불러왔습니다!`);

        // [추가] 자동 저장 타겟 슬롯 업데이트
        if (window.AutoSaveSystem) {
            window.AutoSaveSystem.setLastLoadedSlot(slotNumber);
            window.AutoSaveSystem.hookMoney();
        }

        // 자동 저장 UI 업데이트 (설정 복원)
        if (typeof window.updateAutoSaveUI === 'function') {
            window.updateAutoSaveUI();
        }

        // 커스텀 커서 설정 복원
        if (window.customCursorInstance && gameData.settings) {
            const isCustomCursorOn = gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : false;
            window.customCursorInstance.toggle(isCustomCursorOn);
        }

    } catch (error) {
        console.error(`슬롯 ${slotNumber} 불러오기 에러:`, error);
        alert('저장 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 특정 슬롯 삭제
async function deleteSlot(slotNumber) {
    const slotInfo = getSlotInfo(slotNumber);

    if (!slotInfo) {
        alert(`슬롯 ${slotNumber}은(는) 이미 비어있습니다.`);
        return;
    }

    const confirmMessage = `슬롯 ${slotNumber}을(를) 삭제하시겠습니까?\n\n팀: ${slotInfo.teamName}\n경기 수: ${slotInfo.matchesPlayed}\n\n이 작업은 되돌릴 수 없습니다.`;

    if (confirm(confirmMessage)) {
        const managerId = gameData.managerId;
        const saveKey = managerId ? `fm_save_${managerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
        if (typeof SaveStorage !== 'undefined') {
            await SaveStorage.removeItem(saveKey);
        } else {
            localStorage.removeItem(saveKey);
        }
        alert(`슬롯 ${slotNumber}이(가) 삭제되었습니다.`);

        // 슬롯 UI 새로고침
        createSaveSlots();
        if (typeof managerSystem !== 'undefined' && managerId) {
            managerSystem.renderSaveSlotsForManager(managerId);
        }
    }
}

// ==================== 유스 & 환생 시스템 ====================

// 유스팀 선수 표시 (모던 & 클린 UI 리팩토링)
function displayYouthPlayers() {
    const container = document.getElementById('youthPlayerList');
    if (!container) return;
    const fragment = document.createDocumentFragment();
    container.replaceChildren();

    if (!gameData.youthSquad || gameData.youthSquad.length === 0) {
        const emptyBox = document.createElement('div');
        emptyBox.className = 'youth-empty-state';
        emptyBox.innerHTML = `
            <div class="empty-icon-wrap"><span data-icon="users"></span></div>
            <h5>등록된 유스 선수가 없습니다</h5>
            <p>아래 글로벌 스카우터를 고용하면 경기 진행 시 전 세계에서 숨은 원더키드를 발굴하여 유스팀에 영입합니다.</p>
        `;
        container.appendChild(emptyBox);
        return;
    }

    gameData.youthSquad.forEach(player => {
        const posLower = (player.position || 'mf').toLowerCase();
        const playerCard = document.createElement('div');
        playerCard.className = `player-card fc26-player-card pos-theme-${posLower} youth-member-card`;
        playerCard.dataset.playerName = player.name;

        const cardContent = document.createElement('div');
        cardContent.className = 'player-card-content fc26-card-layout';

        const cutoutWrap = document.createElement('div');
        cutoutWrap.className = 'fc26-cutout-wrap';

        const ovrBadge = document.createElement('span');
        ovrBadge.className = 'fc26-ovr-badge';
        ovrBadge.textContent = Math.floor(player.rating);

        const posBadge = document.createElement('span');
        posBadge.className = `pos-badge pos-${posLower}`;
        posBadge.textContent = player.position;

        const img = document.createElement('img');
        img.className = 'player-card-image fc26-cutout-img';
        img.loading = 'lazy';
        setPlayerPhoto(img, player);

        cutoutWrap.append(ovrBadge, posBadge, img);

        const infoText = document.createElement('div');
        infoText.className = 'player-info-text fc26-card-info';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.textContent = player.name;

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';

        const metaRow = document.createElement('div');
        metaRow.className = 'fc26-meta-row';
        const ageSpan = document.createElement('span');
        ageSpan.textContent = `${player.age}세`;

        let badgeDiv;
        if (player.potentialTier && typeof getPotentialBadgeHTML === 'function') {
            badgeDiv = document.createElement('span');
            badgeDiv.innerHTML = getPotentialBadgeHTML(player.potentialTier);
        } else {
            badgeDiv = document.createElement('span');
            badgeDiv.className = 'fc26-status-pill prospect';
            badgeDiv.textContent = '유스 유망주';
        }

        metaRow.append(ageSpan, badgeDiv);
        detailsDiv.appendChild(metaRow);

        const callUpBtn = document.createElement('button');
        callUpBtn.type = 'button';
        callUpBtn.className = 'btn btn-callup-action';
        callUpBtn.textContent = '1군 콜업';
        callUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (teams[gameData.selectedTeam].length >= 50) {
                alert('팀 인원이 가득 찼습니다! (최대 50명)\n기존 선수를 방출해야 콜업할 수 있습니다.');
                return;
            }

            if (confirm(`${player.name} 선수를 1군 스쿼드로 콜업하시겠습니까?`)) {
                if (typeof player.contractYears !== 'number') {
                    player.contractYears = (typeof contractSystem !== 'undefined')
                        ? contractSystem.getPlayerContractYears(player)
                        : (Math.floor(Math.random() * 2) + 4);
                }
                if (typeof player.weeklyWage !== 'number') player.weeklyWage = calculatePlayerWage(player);

                teams[gameData.selectedTeam].push(player);
                gameData.youthSquad = gameData.youthSquad.filter(p => p.name !== player.name);

                if (typeof calculateTotalWages === 'function') calculateTotalWages();
                if (typeof updateDisplay === 'function') updateDisplay();
                if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();

                if (typeof playerGrowthSystem !== 'undefined') {
                    const potentialGranted = playerGrowthSystem.grantPotentialToPlayer(player);
                    if (potentialGranted) {
                        alert(`${player.name} 선수가 1군으로 콜업되었으며, 잠재력 성장 시스템이 적용되었습니다!\n(주급: ${player.weeklyWage}억/주, 계약: ${player.contractYears}년)`);
                    } else {
                        alert(`${player.name} 선수가 1군으로 콜업되었습니다.\n(주급: ${player.weeklyWage}억/주, 계약: ${player.contractYears}년)`);
                    }
                }

                displayYouthPlayers();
                if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
            }
        });

        infoText.append(nameDiv, detailsDiv, callUpBtn);
        cardContent.append(cutoutWrap, infoText);
        playerCard.appendChild(cardContent);
        fragment.appendChild(playerCard);
    });
    container.appendChild(fragment);
}

// 은퇴 및 환생 처리
function processRetirementsAndReincarnations() {
    console.log("은퇴 및 환생 시스템 작동...");
    Object.keys(allTeams).forEach(teamKey => {
        const teamPlayers = teams[teamKey];
        const retiredPlayers = [];

        for (let i = teamPlayers.length - 1; i >= 0; i--) {
            const player = teamPlayers[i];
            // 34세 기준 기본 1% 확률, 나이가 들수록 매년 0.5%씩 은퇴 확률 증가
            const retirementChance = 0.01 + (player.age - 34) * 0.005;
            if (player.age >= 34 && Math.random() < retirementChance) {
                retiredPlayers.push(player);

                // 1. 팀에서 선수 제거
                teamPlayers.splice(i, 1);

                // 2. 유저팀 선수였다면 스쿼드에서도 제거
                if (teamKey === gameData.selectedTeam) {
                    removePlayerFromSquad(player);
                }

                // 3. 환생 선수 생성
                const reincarnatedPlayer = {
                    name: player.name, // 이름 유지
                    position: player.position,
                    country: player.country,
                    age: 17,
                    rating: Math.floor(Math.random() * (71 - 57 + 1)) + 57, // 57~71
                    isReincarnated: true // 환생 선수 플래그
                };

                let message;
                // 4. 환생한 선수를 소속에 맞게 배치
                if (teamKey === gameData.selectedTeam) {
                    // 사용자 팀에서 은퇴한 경우, 유스팀으로 이동
                    gameData.youthSquad.push(reincarnatedPlayer);
                    message = `[은퇴/환생] 우리 팀의 전설 ${player.name}(${player.age}세)가 은퇴를 선언했습니다. 동시에 그의 재능을 이어받은 17세 유망주가 유스팀에서 발견되었습니다!`;
                } else {
                    // AI 팀에서 은퇴한 경우, 해당 AI 팀에 바로 추가
                    teams[teamKey].push(reincarnatedPlayer);

                    // AI 프레스티지 시스템에 등록
                    if (!gameData.aiPrestige[teamKey]) {
                        gameData.aiPrestige[teamKey] = [];
                    }
                    gameData.aiPrestige[teamKey].push(reincarnatedPlayer.name);

                    message = `[은퇴/환생] ${teamNames[teamKey]}의 전설적인 선수 ${player.name}(${player.age}세)가 은퇴했습니다. 그의 뒤를 이을 17세 유망주가 팀에 새롭게 등장했습니다.`;
                }

                // 5. SNS 알림 생성
                if (typeof snsManager !== 'undefined') {
                    if (typeof snsManager.generateRebirthPost === 'function') {
                        snsManager.generateRebirthPost(player.name, teamKey, player.age, message);
                    } else {
                        snsManager.posts.unshift({ id: snsManager.postIdCounter++, type: 'transfer_rumor', content: message, hashtags: ['#은퇴', '#환생', `#${snsManager.sanitizeHashtag(player.name)}`], timestamp: Date.now(), likes: Math.floor(Math.random() * 2000) + 500, comments: Math.floor(Math.random() * 300) + 50, shares: Math.floor(Math.random() * 100) + 20 });
                    }
                }
                console.log(message);
            }
        }
    });
}

// 전역 함수로 등록
window.saveToSlot = saveToSlot;
window.loadFromSlot = loadFromSlot;
window.deleteSlot = deleteSlot;



// 외부에서 호출할 수 있는 함수들
window.gameData = gameData;

function ensureMatchDramaDefaults() {
    if (!gameData.matchDrama) {
        gameData.matchDrama = {
            enabled: gameData.settings ? gameData.settings.immersionMode !== false : true,
            intensity: 'high'
        };
    }
    if (!['low', 'medium', 'high'].includes(gameData.matchDrama.intensity)) {
        gameData.matchDrama.intensity = 'high';
    }
    if (gameData.settings && gameData.settings.immersionMode === false && gameData.matchDrama.enabled !== false) {
        gameData.matchDrama.enabled = false;
    }
    return gameData.matchDrama;
}
window.ensureMatchDramaDefaults = ensureMatchDramaDefaults;
window.GameState = window.GameState || {
    get() {
        return gameData;
    },

    getSelectedTeamKey() {
        return gameData.selectedTeam;
    },

    getSelectedTeamPlayers() {
        const teamKey = gameData.selectedTeam;
        return teamKey && teams[teamKey] ? teams[teamKey] : [];
    },

    getUserTransferList() {
        if (!Array.isArray(gameData.userTransferList)) {
            gameData.userTransferList = [];
        }
        return gameData.userTransferList;
    },

    addUserTransferListEntry(entry) {
        const list = this.getUserTransferList();
        list.push(entry);
        return list;
    },

    removeUserTransferListByPlayer(playerName) {
        gameData.userTransferList = this.getUserTransferList().filter(entry => entry.player.name !== playerName);
        return gameData.userTransferList;
    },

    ensureTransferOffers() {
        if (!gameData.transferOffers) {
            gameData.transferOffers = {};
        }
        return gameData.transferOffers;
    },

    getTransferOffer(playerKey) {
        return this.ensureTransferOffers()[playerKey];
    },

    setTransferOffer(playerKey, offerData) {
        this.ensureTransferOffers()[playerKey] = offerData;
        return this.ensureTransferOffers()[playerKey];
    },

    clearTransferOffer(playerKey) {
        const offers = this.ensureTransferOffers();
        delete offers[playerKey];
        return offers;
    },

    addTeamMoney(amount) {
        gameData.teamMoney += amount;
        return gameData.teamMoney;
    },

    spendTeamMoney(amount) {
        gameData.teamMoney -= amount;
        return gameData.teamMoney;
    },

    clampTeamMoney(min = 0) {
        gameData.teamMoney = Math.max(min, gameData.teamMoney);
        return gameData.teamMoney;
    },

    adjustTeamMorale(delta) {
        gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale + delta));
        return gameData.teamMorale;
    },

    incrementMatchesPlayed() {
        gameData.matchesPlayed++;
        return gameData.matchesPlayed;
    },

    clearTemporaryStats() {
        gameData.temporaryStats = {};
        return gameData.temporaryStats;
    },

    advanceRound() {
        gameData.currentRound++;
        // 라운드 진행마다 자연스럽게 사기 소폭 감소 (난이도 UP: 시간 지날수록 관리 필요)
        if (typeof gameData.teamMorale === 'number') {
            const naturalDrop = 1; // 매 라운드 -1
            gameData.teamMorale = Math.max(0, gameData.teamMorale - naturalDrop);
            console.log(`라운드 진행 - 사기 자연 감소 -${naturalDrop} (현재 ${gameData.teamMorale})`);
        }
        return gameData.currentRound;
    },

    removePlayerFromUserSquad(playerName) {
        if (gameData.squad.gk && gameData.squad.gk.name === playerName) {
            gameData.squad.gk = null;
        }

        gameData.squad.df = gameData.squad.df.map(p =>
            p && p.name === playerName ? null : p
        );

        gameData.squad.mf = gameData.squad.mf.map(p =>
            p && p.name === playerName ? null : p
        );

        gameData.squad.fw = gameData.squad.fw.map(p =>
            p && p.name === playerName ? null : p
        );

        return gameData.squad;
    }
};
window.allTeams = allTeams; // 추가
window.teams = teams;
window.teamNames = teamNames; // [수정] teamNames 전역 노출 (월드컵 모드 호환성)
// window.teamNames = teamNames; // 삭제 또는 수정
window.generateFullSchedule = generateFullSchedule; // 추가
window.updateDisplay = updateDisplay;
window.setNextOpponent = setNextOpponent;
window.displayTeamPlayers = displayTeamPlayers;
window.updateFormationDisplay = updateFormationDisplay;
window.calculateTeamRating = calculateTeamRating;
window.calculateOpponentTeamRating = calculateOpponentTeamRating;
window.calculateTeamStrengthDifference = calculateTeamStrengthDifference;

// ... existing code ...
// ==================== 오디오 시스템 ====================

class AudioManager {
    constructor() {
        this.defaultPlaylist = [
            'assets/ost/[Bonus Track] Always Awake.mp3',
            'assets/ost/Aqua Man.mp3',
            'assets/ost/Bruno Mars - 24K Magic (Audio).mp3',
            'assets/ost/Caesars Palace - Jerk It Out (Official Video).mp3',
            'assets/ost/AEAO.mp3',
            'assets/ost/Glass Animals - Heat Waves (Lyrics).mp3',
            'assets/ost/Imagine Dragons - On Top Of The World (Lyric Video).mp3',
            'assets/ost/John Newman - Love Me Again.mp3',
            'assets/ost/Linkin Park - Battle Symphony [Lyrics].mp3',
            'assets/ost/Mark Ronson - Uptown Funk (Lyrics) ft. Bruno Mars.mp3',
            'assets/ost/MGMT - Kids (Lyrics).mp3',
            'assets/ost/SAINT MOTEL - My Type.mp3',
            'assets/ost/Song 2.mp3',
            'assets/ost/아비가 (AbigA).mp3',
            'assets/ost/정우성이정재 (Feat. 피식대학).mp3',
            'assets/ost/알면서도 (Although I Know).mp3',
            'assets/ost/다이나믹 듀오(Dynamic Duo) - BAAAM (Feat. Muzie of UV) (가사_lyrics).mp3',
            'assets/ost/Born Hater.mp3',
            'assets/ost/54321.mp3',
            'assets/ost/피타파 (Feat. pH-1, JUNNY).mp3',
            'assets/ost/SUPERBEEWHY (Feat. BewhY) (Prod. by BewhY).mp3',
            'assets/ost/Travel Again (Feat. Cautious Clay).mp3',
            'assets/ost/Jay Park (박재범), GRAY (그레이) - _EL TORNADO_ Lyrics (Color Coded Lyrics Han_Rom_Eng_가사) [BAnXszYMGSU].mp3'
        ];

        this.worldCupPlaylist = [
            'assets/WCost/BTS_Jungkook_Dreamers_Lyrics_FIFA_World_Cup_2022_Song.mp3',
            'assets/WCost/Hayya_Hayya_Better_Together_Lyrics_FIFA_World_Cup_2022_Trinidad_Cardona_DaVido_Aisha.mp3',
            'assets/WCost/The_Official_FIFA_World_Cup_26_Theme.mp3'
        ];

        this.bgmFiles = [...this.defaultPlaylist];
        this.currentTrackIndex = 0;
        this.audio = new Audio();
        this.isPlaying = false;
        this.initialized = false;
        this.sfxVolume = 50; // Default SFX volume (0-100)
        this.currentMode = 'default'; // 현재 모드 추적

        // 플레이리스트 셔플 (랜덤 재생)
        this.shufflePlaylist();

        this.createNowPlayingUI(); // UI 생성
    }

    init() {
        if (this.initialized) return;

        // 오디오 객체가 가비지 컬렉션되어 끊기는 현상 방지 (DOM에 추가)
        document.body.appendChild(this.audio);

        // 에러 발생 시 다음 곡 재생
        this.audio.addEventListener('error', (e) => {
            console.warn("Audio error, playing next:", e);
            if (!this._switching) {
                setTimeout(() => this.playNext(), 1000);
            }
        });

        this.audio.loop = false;
        // 한 곡이 끝나면 다음 곡 재생
        this.audio.addEventListener('ended', () => this.playNext());

        // 초기 설정 적용
        if (typeof gameData !== 'undefined' && gameData.settings) {
            this.applySettings(gameData.settings);
        }
        // CustomCursor가 이미 생성되어 있다면 SFX 볼륨을 적용
        if (window.customCursorInstance) {
            this.setSfxVolume(this.sfxVolume);
        }

        this.initialized = true;
    }

    // 플레이리스트 업데이트 (모드 변경 시 호출)
    updatePlaylist() {
        const isWorldCup = typeof gameData !== 'undefined' && gameData.isWorldCupMode;
        const newMode = isWorldCup ? 'worldcup' : 'default';

        if (this.currentMode !== newMode) {
            this.currentMode = newMode;
            this.bgmFiles = isWorldCup ? [...this.worldCupPlaylist] : [...this.defaultPlaylist];
            this.shufflePlaylist();
            this.currentTrackIndex = 0;

            console.log(`BGM 플레이리스트가 ${newMode} 모드로 변경되었습니다.`);

            // [수정] 소스를 강제로 변경하여 새 리스트의 곡이 나오도록 함
            if (this.bgmFiles.length > 0) {
                this.audio.src = this.bgmFiles[this.currentTrackIndex];

                // BGM이 켜져있다면 재생
                if (gameData.settings && gameData.settings.bgm) {
                    this.play();
                }
            }
        }
    }

    // 셔플 메서드
    shufflePlaylist() {
        for (let i = this.bgmFiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bgmFiles[i], this.bgmFiles[j]] = [this.bgmFiles[j], this.bgmFiles[i]];
        }
        console.log("BGM 플레이리스트가 셔플되었습니다.");
    }

    applySettings(settings) {
        if (!settings) return;

        const isMuted = settings.bgm === false; // bgm: true가 켜짐
        const volume = (settings.bgmVolume !== undefined ? settings.bgmVolume : 50) / 100;

        this.audio.muted = isMuted;
        this.audio.volume = volume;

        // [수정] SFX 볼륨 설정 적용 추가
        if (settings.sfxVolume !== undefined) {
            this.setSfxVolume(settings.sfxVolume);
        }

        if (!isMuted && !this.isPlaying && this.initialized) {
            this.play();
        } else if (isMuted && this.isPlaying) {
            this.pause();
        }

        // 저장된 게임의 모드에 맞춰 플레이리스트 업데이트
        this.updatePlaylist();
    }

    play() {
        if (this.bgmFiles.length === 0) return;
        if (this.audio.muted) return;

        // 소스가 없으면 설정
        if (!this.audio.src) {
            this.audio.src = this.bgmFiles[this.currentTrackIndex];
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                // 현재 재생 중인 곡 정보 표시
                this.showNowPlaying(this.bgmFiles[this.currentTrackIndex]);
            }).catch(error => {
                console.log("Audio play prevented (브라우저 정책):", error);
                this.isPlaying = false;
            });
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
    }

    playNext() {
        if (this._switching) return; // 이미 곡 전환 중이면 중복 실행 방지
        this._switching = true;

        this.currentTrackIndex++;
        if (this.currentTrackIndex >= this.bgmFiles.length) {
            this.currentTrackIndex = 0;
        }

        // 이전 재생을 완전히 멈추고 나서 새 소스 설정
        this.audio.pause();
        this.audio.src = this.bgmFiles[this.currentTrackIndex];
        this.audio.load();

        this.play();

        setTimeout(() => { this._switching = false; }, 300);
    }

    setVolume(value) {
        // value: 0 ~ 100
        const normalizedVolume = value / 100;
        this.audio.volume = normalizedVolume;
        if (gameData.settings) {
            gameData.settings.bgmVolume = value;
        }
    }

    // [신규] SFX 볼륨 설정
    setSfxVolume(value) {
        this.sfxVolume = value;
        if (gameData.settings) {
            gameData.settings.sfxVolume = value;
        }
        if (window.customCursorInstance) {
            window.customCursorInstance.hoverSound.volume = this.sfxVolume / 100;
            window.customCursorInstance.clickSound.volume = this.sfxVolume / 100;
        }
    }

    toggleBgm(isOn) {
        this.audio.muted = !isOn;
        if (gameData.settings) {
            gameData.settings.bgm = isOn;
        }

        if (isOn) {
            this.play();
        } else {
            this.pause();
        }
    }

    // [신규] SFX 재생 (CustomCursor에서 호출)
    playSfx(sound) {
        // SFX는 BGM mute 설정과 별개로 작동 (나중에 SFX mute 설정 추가 가능)
        // 현재는 BGM 볼륨 설정에 따라 SFX 볼륨도 조절되므로, 별도 mute는 필요 없음
        sound.currentTime = 0;
        sound.play().catch(e => console.log("SFX play failed:", e));
    }

    createNowPlayingUI() {
        if (document.getElementById('nowPlayingContainer')) return;

        const container = document.createElement('div');
        container.id = 'nowPlayingContainer';
        container.className = 'now-playing-card';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');

        const icon = document.createElement('span');
        icon.className = 'now-playing-icon';
        icon.innerHTML = typeof iconSVG === 'function' ? iconSVG('music') : '♪';

        const copy = document.createElement('span');
        copy.className = 'now-playing-copy';

        const eyebrow = document.createElement('span');
        eyebrow.className = 'now-playing-eyebrow';
        eyebrow.textContent = 'NOW PLAYING';

        const text = document.createElement('span');
        text.id = 'nowPlayingText';
        text.className = 'now-playing-title';

        const bars = document.createElement('span');
        bars.className = 'now-playing-bars';
        bars.setAttribute('aria-hidden', 'true');
        bars.innerHTML = '<i></i><i></i><i></i><i></i>';

        copy.append(eyebrow, text);
        container.append(icon, copy, bars);
        document.body.appendChild(container);
        this.nowPlayingElement = container;
        this.nowPlayingText = text;
    }

    showNowPlaying(filename) {
        if (!this.nowPlayingElement) return;

        let cleanName = filename.split('/').pop().replace('.mp3', '');

        // 불필요한 태그 제거 및 정리
        cleanName = cleanName
            .replace(/\(Lyrics\)/gi, '')
            .replace(/\(Official Video\)/gi, '')
            .replace(/\(Lyric Video\)/gi, '')
            .replace(/\(Audio\)/gi, '')
            .replace(/\[Lyrics\]/gi, '')
            .replace(/\(가사_lyrics\)/gi, '')
            .replace(/\| Lyrics_가사/gi, '')
            .trim();

        // 하이픈 포맷팅 (띄어쓰기 추가)
        if (cleanName.includes('-') && !cleanName.includes(' - ')) {
            cleanName = cleanName.replace('-', ' - ');
        }

        this.nowPlayingText.textContent = cleanName;

        // 표시 애니메이션
        this.nowPlayingElement.style.display = 'flex';
        void this.nowPlayingElement.offsetWidth; // reflow 강제

        this.nowPlayingElement.style.opacity = '1';
        this.nowPlayingElement.style.transform = 'translateY(0)';

        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
            this.nowPlayingElement.style.opacity = '0';
            this.nowPlayingElement.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (this.nowPlayingElement.style.opacity === '0') {
                    this.nowPlayingElement.style.display = 'none';
                }
            }, 500);
        }, 5000); // 5초간 표시
    }
}

const audioManager = new AudioManager();
window.audioManager = audioManager;

// ... existing code ...



// 설정 탭에 오디오 설정 UI 렌더링
function updateGameSliderFill(sliderEl, val) {
    if (!sliderEl) return;
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    sliderEl.style.background = `linear-gradient(to right, #38BDF8 0%, #38BDF8 ${num}%, #1E293B ${num}%, #1E293B 100%)`;
}

function renderAudioSettings() {
    const audioContainer = document.getElementById('audioSettings');
    if (!audioContainer) return;

    const isBgmOn = gameData.settings ? gameData.settings.bgm !== false : true;
    const volume = gameData.settings && gameData.settings.bgmVolume !== undefined ? gameData.settings.bgmVolume : 50;
    const sfxVolumeVal = gameData.settings && gameData.settings.sfxVolume !== undefined ? gameData.settings.sfxVolume : 50;

    const bgmToggle = document.getElementById('bgmToggle');
    const bgmStatusText = document.getElementById('bgmStatusText');
    const bgmVolume = document.getElementById('bgmVolume');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    const sfxVolumeInput = document.getElementById('sfxVolume');
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');

    if (bgmToggle) bgmToggle.checked = isBgmOn;
    if (bgmStatusText) bgmStatusText.textContent = `배경음악 ${isBgmOn ? 'ON' : 'OFF'}`;
    if (bgmVolume) {
        bgmVolume.value = volume;
        updateGameSliderFill(bgmVolume, volume);
    }
    if (bgmVolumeValue) bgmVolumeValue.textContent = `${volume}%`;
    if (sfxVolumeInput) {
        sfxVolumeInput.value = sfxVolumeVal;
        updateGameSliderFill(sfxVolumeInput, sfxVolumeVal);
    }
    if (sfxVolumeValue) sfxVolumeValue.textContent = `${sfxVolumeVal}%`;

    // 이벤트 리스너는 한 번만 등록
    if (!audioContainer.dataset.initialized) {
        audioContainer.dataset.initialized = 'true';

        if (bgmToggle) {
            bgmToggle.addEventListener('change', (e) => {
                const isOn = e.target.checked;
                audioManager.toggleBgm(isOn);
                if (bgmStatusText) bgmStatusText.textContent = `배경음악 ${isOn ? 'ON' : 'OFF'}`;
            });
        }

        if (bgmVolume && bgmVolumeValue) {
            bgmVolume.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                bgmVolumeValue.textContent = `${val}%`;
                updateGameSliderFill(bgmVolume, val);
                audioManager.setVolume(val);
            });
        }

        if (sfxVolumeInput && sfxVolumeValue) {
            sfxVolumeInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                sfxVolumeValue.textContent = `${val}%`;
                updateGameSliderFill(sfxVolumeInput, val);
                audioManager.setSfxVolume(val);
            });
        }
    }

    if (isBgmOn) {
        audioManager.play();
    }
}
window.renderAudioSettings = renderAudioSettings;

// 일반 설정 UI 렌더링
function renderGeneralSettings() {
    const generalContainer = document.getElementById('generalSettings');
    if (!generalContainer) return;

    const isCustomCursorOn = gameData.settings && gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : false;

    const isFacepackOn = gameData.settings && gameData.settings.useIdFacepack !== undefined ? gameData.settings.useIdFacepack : true;
    const facepackToggle = document.getElementById('facepackToggle');
    const facepackStatusText = document.getElementById('facepackStatusText');
    if (facepackToggle) facepackToggle.checked = isFacepackOn;
    if (facepackStatusText) facepackStatusText.textContent = `선수 ID 페이스팩 ${isFacepackOn ? 'ON' : 'OFF'} (p[ID].png/webp)`;
    const cursorToggle = document.getElementById('cursorToggle');
    const cursorStatusText = document.getElementById('cursorStatusText');
    const replayTutorialBtn = document.getElementById('replayTutorialBtn');

    if (cursorToggle) cursorToggle.checked = isCustomCursorOn;
    if (cursorStatusText) cursorStatusText.textContent = `마우스 스타일 ${isCustomCursorOn ? 'ON' : 'OFF'} (커스텀 커서)`;

    // 이벤트 리스너는 한 번만 등록
    if (!generalContainer.dataset.initialized) {
        generalContainer.dataset.initialized = 'true';

        if (replayTutorialBtn) {
            replayTutorialBtn.addEventListener('click', () => {
                if (window.tutorialSystem) {
                    window.tutorialSystem.currentStep = 0;
                    window.tutorialSystem.showTutorial();
                } else {
                    alert('튜토리얼을 실행할 수 없습니다.');
                }
            });
        }

        if (facepackToggle) {
            facepackToggle.addEventListener('change', (e) => {
                const isOn = e.target.checked;
                if (!gameData.settings) gameData.settings = {};
                gameData.settings.useIdFacepack = isOn;
                if (facepackStatusText) facepackStatusText.textContent = `선수 ID 페이스팩 ${isOn ? 'ON' : 'OFF'} (p[ID].png/webp)`;
                if (window.AutoSaveSystem) setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
            });
        }

        if (cursorToggle) {
            cursorToggle.addEventListener('change', (e) => {
                const isOn = e.target.checked;
                if (window.customCursorInstance) {
                    window.customCursorInstance.toggle(isOn);
                }
                if (cursorStatusText) cursorStatusText.textContent = `마우스 스타일 ${isOn ? 'ON' : 'OFF'} (커스텀 커서)`;
                if (gameData.settings) {
                    setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
                }
            });
        }
    }
}
window.renderGeneralSettings = renderGeneralSettings;

// [신규] 자동 스크롤 시스템 (경기 화면 전용, 조건 없음)
window.AutoScrollSystem = {
    scrollSpeed: 2.0,
    isPaused: false, // [추가] 일시 정지 플래그
    resumeTimer: null, // [추가] 재개 타이머

    init() {
        // [추가] 사용자 상호작용 감지 (휠, 터치, 키보드, 마우스 클릭)
        const events = ['wheel', 'touchmove', 'touchstart', 'keydown', 'mousedown'];
        events.forEach(eventType => {
            window.addEventListener(eventType, () => this.onUserInteraction(), { passive: true });
        });

        this.animate();
    },

    // [추가] 사용자 조작 시 호출
    onUserInteraction() {
        const matchScreen = document.getElementById('matchScreen');
        if (!matchScreen || !matchScreen.classList.contains('active')) return;

        this.isPaused = true; // 스크롤 멈춤

        if (this.resumeTimer) clearTimeout(this.resumeTimer);

        // 2초 뒤 다시 시작
        this.resumeTimer = setTimeout(() => {
            this.isPaused = false;
        }, 2000);
    },

    animate() {
        const matchScreen = document.getElementById('matchScreen');
        const eventList = document.getElementById('eventList');

        // 경기 화면이 활성화되어 있고 eventList가 존재하며, 일시 정지 상태가 아닐 때만 스크롤
        if (matchScreen && matchScreen.classList.contains('active') && eventList && !this.isPaused) {
            // [수정] 스크롤바가 어디에 생길지 모르므로 리스트와 부모 요소 모두 스크롤 시도
            eventList.scrollTop += this.scrollSpeed;
            if (eventList.parentElement) {
                eventList.parentElement.scrollTop += this.scrollSpeed;
            }
        }

        requestAnimationFrame(() => this.animate());
    }
};

// [신규] 데이터베이스 열람 시스템
function openDatabaseModal() {
    let modal = document.getElementById('databaseModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'databaseModal';
        modal.className = 'modal';
        modal.style.zIndex = '9999'; // 최상위

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = 'max-width: 800px; height: 80vh; display: flex; flex-direction: column; background: #2c3e50; color: white;';

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.style.cssText = 'color: white; align-self: flex-end; cursor: pointer; font-size: 28px;';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => {
            const dbModal = document.getElementById('databaseModal');
            if (dbModal) dbModal.style.display = 'none';
        };

        const title = document.createElement('h3');
        title.id = 'dbModalTitle';
        title.style.cssText = 'text-align: center; color: #ffd700; margin-bottom: 20px; margin-top: 0;';
        title.textContent = '데이터베이스';

        const content = document.createElement('div');
        content.id = 'dbModalContent';
        content.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px;';

        const controls = document.createElement('div');
        controls.id = 'dbModalControls';
        controls.style.cssText = 'margin-top: 15px; text-align: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);';

        const backBtn = document.createElement('button');
        backBtn.id = 'dbBackBtn';
        backBtn.className = 'btn';
        backBtn.style.cssText = 'display: none; background: #1E293B; border: 1px solid rgba(255,255,255,0.12);';
        backBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('arrow_left') : ''} <span>뒤로가기</span>`;
        controls.appendChild(backBtn);

        modalContent.append(closeBtn, title, content, controls);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // 뒤로가기 버튼 이벤트
        document.getElementById('dbBackBtn').addEventListener('click', () => {
            const currentView = modal.dataset.view;
            if (currentView === 'teams') {
                renderDatabaseLeagues();
            } else if (currentView === 'players') {
                const currentLeague = modal.dataset.league;
                renderDatabaseTeams(currentLeague);
            }
        });

        // 모달 바깥 클릭 시 닫기
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    modal.style.display = 'block';
    renderDatabaseLeagues();
}

function renderDatabaseLeagues() {
    const modal = document.getElementById('databaseModal');
    const content = document.getElementById('dbModalContent');
    const backBtn = document.getElementById('dbBackBtn');
    const title = document.getElementById('dbModalTitle');

    if (!modal || !content) return;
    modal.dataset.view = 'leagues';
    if (backBtn) backBtn.style.display = 'none';
    if (title) title.textContent = '리그 선택';

    content.replaceChildren();

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; gap: 15px;';

    const leagues = [
        [1, '1부 리그 (DIVISION 1)'],
        [2, '2부 리그 (DIVISION 2)'],
        [3, '3부 리그 (DIVISION 3)']
    ];
    leagues.forEach(([num, label]) => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.style.cssText = 'padding: 18px; font-size: 1.1rem; font-weight: 800; background: #111827; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; gap: 8px;';
        btn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''}<span>${label}</span>`;
        btn.onclick = () => renderDatabaseTeams(num);
        grid.appendChild(btn);
    });
    content.appendChild(grid);
}

function renderDatabaseTeams(league) {
    const modal = document.getElementById('databaseModal');
    const content = document.getElementById('dbModalContent');
    const backBtn = document.getElementById('dbBackBtn');
    const title = document.getElementById('dbModalTitle');

    if (!modal || !content) return;
    modal.dataset.view = 'teams';
    modal.dataset.league = league;
    if (backBtn) backBtn.style.display = 'inline-block';
    if (title) title.textContent = `${league}부 리그 팀 목록`;

    content.replaceChildren();

    const leagueTeams = Object.keys(allTeams).filter(key => allTeams[key].league == league);
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;';

    leagueTeams.forEach(teamKey => {
        const teamName = teamNames[teamKey] || teamKey;
        const currentPlayers = teams[teamKey] ? teams[teamKey].length : allTeams[teamKey].players.length;

        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; cursor: pointer; text-align: center; transition: background 0.2s; border: 1px solid rgba(255,255,255,0.1);';

        const nameDiv = document.createElement('div');
        nameDiv.style.cssText = 'font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; color: #fff;';
        nameDiv.textContent = teamName;

        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'font-size: 0.9rem; color: #aaa;';
        countDiv.textContent = `선수 ${currentPlayers}명`;

        card.append(nameDiv, countDiv);
        card.onclick = () => renderDatabasePlayers(teamKey);
        grid.appendChild(card);
    });

    content.appendChild(grid);
}

function renderDatabasePlayers(teamKey) {
    const modal = document.getElementById('databaseModal');
    const content = document.getElementById('dbModalContent');
    const backBtn = document.getElementById('dbBackBtn');
    const title = document.getElementById('dbModalTitle');

    if (!modal || !content) return;
    modal.dataset.view = 'players';
    if (backBtn) backBtn.style.display = 'inline-block';
    const teamName = teamNames[teamKey] || teamKey;
    if (title) title.textContent = `${teamName} 선수 명단`;

    content.replaceChildren();

    const players = teams[teamKey] || allTeams[teamKey].players;
    const posOrder = { 'GK': 1, 'DF': 2, 'MF': 3, 'FW': 4 };
    const sortedPlayers = [...players].sort((a, b) => (posOrder[a.position] || 5) - (posOrder[b.position] || 5) || b.rating - a.rating);

    const listDiv = document.createElement('div');
    listDiv.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    sortedPlayers.forEach(player => {
        let stats = { goals: 0, assists: 0, matches: 0, moms: 0 };
        if (typeof leagueBasedRecordsSystem !== 'undefined' && leagueBasedRecordsSystem.playerStats.has(player.name)) {
            const record = leagueBasedRecordsSystem.playerStats.get(player.name);
            if (record.team === teamKey) stats = record;
        }
        let posColor = player.position === 'FW' ? '#e74c3c' : player.position === 'MF' ? '#2ecc71' : player.position === 'DF' ? '#3498db' : '#f1c40f';

        const row = document.createElement('div');
        row.style.cssText = `background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${posColor};`;

        const leftDiv = document.createElement('div');
        leftDiv.style.flex = '1';

        const nameRow = document.createElement('div');
        nameRow.style.cssText = 'font-weight: bold; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;';

        const posTag = document.createElement('span');
        posTag.style.cssText = `color: ${posColor}; font-size: 0.9rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;`;
        posTag.textContent = player.position;

        nameRow.append(posTag, document.createTextNode(player.name));

        const metaRow = document.createElement('div');
        metaRow.style.cssText = 'font-size: 0.85rem; color: #ccc; margin-top: 6px;';
        const ovrSpan = document.createElement('span');
        ovrSpan.style.cssText = 'color: #ffd700; font-weight: bold;';
        ovrSpan.textContent = Math.floor(player.rating);
        metaRow.append(document.createTextNode(`${player.country || '국적 미상'} | ${player.age}세 | 오버롤 `), ovrSpan);

        leftDiv.append(nameRow, metaRow);

        const rightDiv = document.createElement('div');
        rightDiv.style.cssText = 'text-align: right; font-size: 0.85rem; color: #94A3B8; min-width: 110px; font-variant-numeric: tabular-nums;';

        const mDiv = document.createElement('div');
        mDiv.style.marginBottom = '2px';
        mDiv.textContent = `경기: ${stats.matches}`;

        const gDiv = document.createElement('div');
        gDiv.style.marginBottom = '2px';
        gDiv.textContent = `득점: ${stats.goals}`;

        const aDiv = document.createElement('div');
        aDiv.style.marginBottom = '2px';
        aDiv.textContent = `도움: ${stats.assists}`;

        const momDiv = document.createElement('div');
        momDiv.textContent = `MOM: ${stats.moms}`;

        rightDiv.append(mDiv, gDiv, aDiv, momDiv);
        row.append(leftDiv, rightDiv);
        listDiv.appendChild(row);
    });

    content.appendChild(listDiv);
}

// 전역 노출
window.openDatabaseModal = openDatabaseModal;
window.renderDatabaseTeams = renderDatabaseTeams;
window.renderDatabasePlayers = renderDatabasePlayers;

// [신규] 대시보드 표시 함수
function showDashboard() {
    // 가로 화면: 대시보드(벤토)를 쓰지 않고 현재 탭(없으면 스쿼드)을 우측 콘텐츠에 표시
    if (isLandscapeLayout()) {
        const activeBtn = document.querySelector('#main-tabs .tab-btn.active');
        showTab(activeBtn ? activeBtn.dataset.tab : 'squad');
        return;
    }

    const dashboardContainer = document.getElementById('dashboard-container');
    const tabContentArea = document.getElementById('tab-content-area');
    const homeBtn = document.getElementById('homeBtn');
    const lobbyTabs = document.getElementById('main-tabs');

    if (dashboardContainer) dashboardContainer.style.display = 'grid';
    if (tabContentArea) tabContentArea.style.display = 'none';
    if (homeBtn) homeBtn.style.display = 'none'; // 홈 화면에선 홈 버튼 숨김

    if (lobbyTabs) lobbyTabs.style.display = 'none';

    renderDashboard();
}

// 가로/세로 전환 시 로비 레이아웃 즉시 갱신
window.matchMedia(LANDSCAPE_LAYOUT_QUERY).addEventListener('change', () => {
    const lobby = document.getElementById('lobby');
    if (lobby && lobby.classList.contains('active')) showDashboard();
});

// [신규] 대시보드 렌더링
function renderDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return; // 안전 장치

    // 1. 다음 경기 카드
    const nextMatchCard = createDashboardCard('다음 경기', 'match', () => {
        const opponentName = gameData.currentOpponent ? (teamNames[gameData.currentOpponent] || gameData.currentOpponent) : '미정';
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const vsDiv = document.createElement('div');
        vsDiv.style.fontSize = '1.5rem';
        vsDiv.style.fontWeight = 'bold';
        vsDiv.style.marginBottom = '10px';
        vsDiv.append(document.createTextNode('VS '));
        if (gameData.currentOpponent) {
            vsDiv.appendChild(createTeamLogoElement(gameData.currentOpponent));
            vsDiv.append(document.createTextNode(' '));
        }
        vsDiv.append(document.createTextNode(opponentName));
        wrapper.appendChild(vsDiv);

        const typeDiv = document.createElement('div');
        typeDiv.style.color = '#94A3B8';
        typeDiv.textContent = gameData.isHomeGame ? '홈 경기' : '원정 경기';
        wrapper.appendChild(typeDiv);

        const readyDiv = document.createElement('div');
        readyDiv.style.marginTop = '15px';
        readyDiv.style.color = '#A3E635';
        readyDiv.style.fontWeight = 'bold';
        readyDiv.textContent = '킥오프 준비 완료';
        wrapper.appendChild(readyDiv);

        return wrapper;
    });

    // 2. 리그 순위 카드
    const leagueCard = createDashboardCard('리그 순위', 'league', () => {
        const league = gameData.currentLeague;
        const divisionKey = `division${league}`;
        const table = gameData.leagueData[divisionKey];

        const wrapper = document.createElement('div');
        if (!table) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.textAlign = 'center';
            emptyDiv.style.color = '#94A3B8';
            emptyDiv.textContent = '데이터 없음';
            return emptyDiv;
        }

        const standings = Object.keys(table).map(key => ({
            name: teamNames[key] || key,
            key: key,
            ...table[key],
            diff: table[key].goalsFor - table[key].goalsAgainst
        })).sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor);

        const myIndex = standings.findIndex(t => t.key === gameData.selectedTeam);

        const range = [myIndex - 1, myIndex, myIndex + 1];
        range.forEach(idx => {
            if (standings[idx]) {
                const team = standings[idx];
                const isMe = idx === myIndex;
                const row = document.createElement('div');
                row.className = `rank-row ${isMe ? 'my-team' : ''}`;

                const rankSpan = document.createElement('span');
                rankSpan.textContent = `${idx + 1}위`;

                const teamSpan = document.createElement('span');
                teamSpan.style.display = 'flex';
                teamSpan.style.alignItems = 'center';
                teamSpan.append(createTeamLogoElement(team.key), document.createTextNode(' ' + team.name));

                const ptsSpan = document.createElement('span');
                ptsSpan.textContent = `${team.points}pts`;

                row.append(rankSpan, teamSpan, ptsSpan);
                wrapper.appendChild(row);
            }
        });
        return wrapper;
    });

    // 3. 스쿼드 요약 카드
    const squadCard = createDashboardCard('스쿼드', 'squad', () => {
        const rating = typeof calculateTeamRating === 'function' ? calculateTeamRating().toFixed(1) : '0.0';
        const realInjuredCount = (typeof injurySystem !== 'undefined') ? injurySystem.getInjuredPlayers(gameData.selectedTeam).length : 0;

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const ratingDiv = document.createElement('div');
        const ratingLabel = document.createElement('div');
        ratingLabel.style.fontSize = '0.9rem';
        ratingLabel.style.color = '#94A3B8';
        ratingLabel.textContent = '평균 능력치';
        const ratingVal = document.createElement('div');
        ratingVal.style.fontSize = '2rem';
        ratingVal.style.fontWeight = '900';
        ratingVal.style.color = '#38BDF8';
        ratingVal.style.marginBottom = '15px';
        ratingVal.textContent = rating;
        ratingDiv.append(ratingLabel, ratingVal);

        const injDiv = document.createElement('div');
        const injLabel = document.createElement('div');
        injLabel.style.fontSize = '0.9rem';
        injLabel.style.color = '#94A3B8';
        injLabel.textContent = '부상자';
        const injVal = document.createElement('div');
        injVal.style.fontSize = '1.5rem';
        injVal.style.fontWeight = 'bold';
        injVal.style.color = realInjuredCount > 0 ? '#EF4444' : '#A3E635';
        injVal.textContent = `${realInjuredCount}명`;
        injDiv.append(injLabel, injVal);

        wrapper.append(ratingDiv, injDiv);
        return wrapper;
    });

    // 4. 이적 시장 카드
    const transferCard = createDashboardCard('이적 시장', 'transfer', () => {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const tipDiv = document.createElement('div');
        tipDiv.style.fontSize = '0.85rem';
        tipDiv.style.color = '#94A3B8';
        tipDiv.textContent = '이적 시장 자금과 주급 총합을 확인하세요';

        const moneyDiv = document.createElement('div');
        moneyDiv.style.fontSize = '2.2rem';
        moneyDiv.style.fontWeight = '900';
        moneyDiv.style.color = '#FBBF24';
        moneyDiv.style.margin = '5px 0';
        moneyDiv.textContent = `${formatFinanceVal(gameData.teamMoney)}억`;

        const budgetDiv = document.createElement('div');
        budgetDiv.style.fontSize = '1rem';
        budgetDiv.style.color = '#38BDF8';
        budgetDiv.style.fontWeight = 'bold';
        budgetDiv.textContent = `주급 자금: ${formatFinanceVal(gameData.wageBudget)}억`;

        const wageDiv = document.createElement('div');
        wageDiv.style.fontSize = '1.1rem';
        wageDiv.style.color = '#F87171';
        wageDiv.style.fontWeight = 'bold';
        wageDiv.textContent = `주급: ${formatFinanceVal(gameData.totalWeeklyWage)}억`;

        wrapper.append(tipDiv, moneyDiv, budgetDiv, wageDiv);
        return wrapper;
    });

    const financeCard = createDashboardCard('재정', 'finance', () => {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const tipDiv = document.createElement('div');
        tipDiv.style.fontSize = '0.85rem';
        tipDiv.style.color = '#94A3B8';
        tipDiv.textContent = '이적 자금 / 주급 자금 전환';

        const moneyDiv = document.createElement('div');
        moneyDiv.style.fontSize = '2rem';
        moneyDiv.style.fontWeight = '900';
        moneyDiv.style.color = '#FBBF24';
        moneyDiv.style.margin = '5px 0';
        moneyDiv.textContent = `${formatFinanceVal(gameData.teamMoney)}억`;

        const budgetDiv = document.createElement('div');
        budgetDiv.style.fontSize = '1rem';
        budgetDiv.style.color = '#38BDF8';
        budgetDiv.style.fontWeight = 'bold';
        budgetDiv.textContent = `주급 자금: ${formatFinanceVal(gameData.wageBudget)}억`;

        wrapper.append(tipDiv, moneyDiv, budgetDiv);
        return wrapper;
    });

    // 5. 기타 카드들
    const tacticsCard = createDashboardCard('전술/DNA', 'tactics', () => {
        const ts = (typeof TacticSystem !== 'undefined') ? new TacticSystem() : null;
        const tacticName = (ts && ts.tactics[gameData.currentTactic]) ? ts.tactics[gameData.currentTactic].name : gameData.currentTactic;

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const curDiv = document.createElement('div');
        curDiv.style.marginBottom = '5px';
        curDiv.append(document.createTextNode('현재 전술: '));
        const nameSpan = document.createElement('span');
        nameSpan.style.color = '#FBBF24';
        nameSpan.textContent = tacticName;
        curDiv.appendChild(nameSpan);

        const subDiv = document.createElement('div');
        subDiv.style.fontSize = '0.8rem';
        subDiv.style.color = '#94A3B8';
        subDiv.textContent = 'DNA 및 세부 전술 설정';

        wrapper.append(curDiv, subDiv);
        return wrapper;
    });

    // [추가] 개인 기록 카드
    const recordsCard = createDashboardCard('개인 기록', 'records', () => {
        let topScorerName = '-';
        let topScorerGoals = 0;

        if (typeof leagueBasedRecordsSystem !== 'undefined') {
            const scorers = leagueBasedRecordsSystem.getTopScorersByLeague(gameData.currentLeague, 1);
            if (scorers.length > 0) {
                topScorerName = scorers[0].name;
                topScorerGoals = scorers[0].goals;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '현재 득점 1위';

        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '1.2rem';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#38BDF8';
        nameDiv.style.margin = '5px 0';
        nameDiv.textContent = topScorerName;

        const goalsDiv = document.createElement('div');
        goalsDiv.style.fontSize = '0.9rem';
        goalsDiv.textContent = `${topScorerGoals}골`;

        wrapper.append(titleDiv, nameDiv, goalsDiv);
        return wrapper;
    });

    // [추가] SNS 카드
    const snsCard = createDashboardCard('SNS', 'sns', () => {
        let latestPost = "새로운 소식이 없습니다.";
        if (typeof snsManager !== 'undefined' && snsManager.posts.length > 0) {
            const raw = snsManager.posts[0].content || "";
            latestPost = raw.replace(/<[^>]+>/g, '').trim();
            if (latestPost.length > 18) latestPost = latestPost.substring(0, 18) + "...";
        }

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '최신 피드';

        const postDiv = document.createElement('div');
        postDiv.style.fontSize = '0.95rem';
        postDiv.style.marginTop = '5px';
        postDiv.textContent = `"${latestPost}"`;

        wrapper.append(titleDiv, postDiv);
        return wrapper;
    });

    // [추가] 이적 뉴스 카드
    const transferNewsCard = createDashboardCard('AI 이적 뉴스', 'transfer_news', () => {
        let latestNews = "이적 소식이 없습니다.";
        if (typeof transferSystem !== 'undefined' && transferSystem.transferNews.length > 0) {
            const news = transferSystem.transferNews[0];
            latestNews = `${news.name}: ${news.from} → ${news.to}`;
        }

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '최신 이적';

        const newsDiv = document.createElement('div');
        newsDiv.style.fontSize = '0.95rem';
        newsDiv.style.marginTop = '5px';
        newsDiv.textContent = latestNews;

        wrapper.append(titleDiv, newsDiv);
        return wrapper;
    });

    // [추가] 유스 카드
    const youthCard = createDashboardCard('유스/스카우트', 'youth', () => {
        const youthCount = gameData.youthSquad ? gameData.youthSquad.length : 0;
        const scoutStatus = gameData.hiredScout ? '고용 중' : '미고용';

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '유망주';

        const countDiv = document.createElement('div');
        countDiv.style.fontSize = '1.2rem';
        countDiv.style.fontWeight = 'bold';
        countDiv.style.color = '#A3E635';
        countDiv.style.margin = '5px 0';
        countDiv.textContent = `${youthCount}명`;

        const statusDiv = document.createElement('div');
        statusDiv.style.fontSize = '0.8rem';
        statusDiv.style.color = '#94A3B8';
        if (gameData.hiredScout) {
            const prog = gameData.hiredScout.progressMatches || 0;
            const target = gameData.hiredScout.targetInterval || 10;
            statusDiv.textContent = `스카우터: ${prog}/${target}경기`;
            statusDiv.style.color = '#38BDF8';
            statusDiv.style.fontWeight = '700';
        } else {
            statusDiv.textContent = `스카우터: 미고용`;
        }

        wrapper.append(titleDiv, countDiv, statusDiv);
        return wrapper;
    });

    // [추가] 스폰서 카드
    const sponsorCard = createDashboardCard('스폰서', 'sponsor', () => {
        const sponsorName = gameData.currentSponsor ? gameData.currentSponsor.name : '계약 없음';
        const remainingMatches = gameData.sponsorRemainingMatches || 0;

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '현재 스폰서';

        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '1.5rem';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#A3E635';
        nameDiv.style.margin = '10px 0';
        nameDiv.textContent = sponsorName;

        const subDiv = document.createElement('div');
        subDiv.style.fontSize = '0.9rem';
        subDiv.textContent = gameData.currentSponsor ? `남은 계약: ${remainingMatches}경기` : '새로운 계약을 찾아보세요';

        wrapper.append(titleDiv, nameDiv, subDiv);
        return wrapper;
    });

    const mailCard = createDashboardCard('메일함', 'mail', () => {
        const unread = (typeof mailManager !== 'undefined') ? mailManager.getUnreadCount() : 0;
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.append(document.createTextNode('읽지 않은 메일: '));
        const countSpan = document.createElement('span');
        countSpan.style.color = unread > 0 ? '#EF4444' : '#94A3B8';
        countSpan.style.fontWeight = 'bold';
        countSpan.textContent = `${unread}통`;
        wrapper.appendChild(countSpan);
        return wrapper;
    });

    const chatCard = createDashboardCard('대화', 'chat', () => {
        const state = ensureChatState();
        const activeContact = getChatContactById(state.activeContactId);
        const latestMessage = getLatestChatPreview();

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';
        wrapper.style.gap = '8px';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '현재 대화방';

        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '1.2rem';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#38BDF8';
        nameDiv.textContent = activeContact ? activeContact.name : '대화 없음';

        const msgDiv = document.createElement('div');
        msgDiv.style.fontSize = '0.88rem';
        msgDiv.style.color = '#CBD5E1';
        msgDiv.style.lineHeight = '1.4';
        msgDiv.textContent = latestMessage || '아직 나눈 대화가 없습니다.';

        wrapper.append(titleDiv, nameDiv, msgDiv);
        return wrapper;
    });

    const settingsCard = createDashboardCard('설정 / 저장', 'settings', () => {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.textContent = '게임 저장 및 불러오기';
        return wrapper;
    });

    const growthCard = createDashboardCard('성장 현황', 'growth', () => {
        const growingCount = gameData.playerGrowthData ? Object.keys(gameData.playerGrowthData).length : 0;

        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.9rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = '성장 중인 선수';

        const countDiv = document.createElement('div');
        countDiv.style.fontSize = '1.5rem';
        countDiv.style.fontWeight = 'bold';
        countDiv.style.color = '#38BDF8';
        countDiv.style.margin = '10px 0';
        countDiv.textContent = `${growingCount}명`;

        const subDiv = document.createElement('div');
        subDiv.style.fontSize = '0.8rem';
        subDiv.style.color = '#94A3B8';
        subDiv.textContent = '잠재력을 폭발시키세요';

        wrapper.append(titleDiv, countDiv, subDiv);
        return wrapper;
    });

    // [신규] 스타디움 카드
    const stadiumCard = createDashboardCard('홈 스타디움', 'stadium', () => {
        const stadium = (typeof stadiumSystem !== 'undefined') ? stadiumSystem.getUserStadium() : null;
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const nameDiv = document.createElement('div');
        nameDiv.style.fontSize = '1.15rem';
        nameDiv.style.fontWeight = 'bold';
        nameDiv.style.color = '#38BDF8';
        nameDiv.textContent = stadium ? stadium.name : '홈구장';

        const capDiv = document.createElement('div');
        capDiv.style.fontSize = '1.3rem';
        capDiv.style.fontWeight = '900';
        capDiv.style.color = '#F8FAFC';
        capDiv.style.margin = '4px 0';
        capDiv.textContent = stadium ? `${stadium.currentCapacity.toLocaleString()}석` : '0석';

        const tipDiv = document.createElement('div');
        tipDiv.style.fontSize = '0.8rem';
        tipDiv.style.color = '#A3E635';
        tipDiv.style.fontWeight = '700';
        tipDiv.textContent = '클릭하여 증축 & 시설 관리';

        wrapper.append(nameDiv, capDiv, tipDiv);
        return wrapper;
    });
    stadiumCard.onclick = () => {
        if (typeof stadiumSystem !== 'undefined') {
            stadiumSystem.openModal();
        }
    };

    // [신규] 컵 대회 카드 (국가별 FA컵 & UEFA 챔피언스리그)
    const faConfig = (typeof cupCompetitionManager !== 'undefined') ? cupCompetitionManager.getUserFACupConfig() : { name: 'FA컵' };
    const faCupCard = createDashboardCard(faConfig.name, 'facup', () => {
        const cup = gameData.faCup;
        const ucl = gameData.ucl;
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.justifyContent = 'center';
        wrapper.style.height = '100%';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontSize = '0.85rem';
        titleDiv.style.color = '#94A3B8';
        titleDiv.textContent = 'FA컵 & 챔피언스리그';

        const statusDiv = document.createElement('div');
        statusDiv.style.fontSize = '1.15rem';
        statusDiv.style.fontWeight = '900';
        statusDiv.style.margin = '4px 0';

        if (cup) {
            if (cup.champion === gameData.selectedTeam) {
                statusDiv.style.color = '#FBBF24';
                statusDiv.textContent = '🏆 컵 대회 챔피언';
            } else if (cup.isUserActive) {
                statusDiv.style.color = '#38BDF8';
                statusDiv.textContent = (typeof cupCompetitionManager !== 'undefined' ? cupCompetitionManager.faStageNames[cup.currentStage] : '진행 중') || '생존 중';
            } else {
                statusDiv.style.color = '#EF4444';
                statusDiv.textContent = `${(typeof cupCompetitionManager !== 'undefined' && cup.userEliminatedStage) ? cupCompetitionManager.faStageNames[cup.userEliminatedStage] : ''} 탈락`;
            }
        } else {
            statusDiv.style.color = '#94A3B8';
            statusDiv.textContent = '시즌 준비 중';
        }

        const subDiv = document.createElement('div');
        subDiv.style.fontSize = '0.75rem';
        subDiv.style.color = '#FBBF24';
        subDiv.style.fontWeight = '700';

        // UCL 상태 요약 표시
        if (ucl && ucl.teams && ucl.teams.includes(gameData.selectedTeam)) {
            const uclStageName = (typeof cupCompetitionManager !== 'undefined') ? (cupCompetitionManager.uclStageNames[ucl.currentStage] || ucl.currentStage) : '';
            subDiv.textContent = `⭐ UCL: ${ucl.champion === gameData.selectedTeam ? '우승' : (ucl.isUserActive ? uclStageName : '탈락')} (클릭)`;
        } else {
            subDiv.textContent = '클릭하여 컵 대회 센터 확인';
        }

        wrapper.append(titleDiv, statusDiv, subDiv);
        return wrapper;
    });
    faCupCard.onclick = () => {
        if (typeof cupCompetitionManager !== 'undefined') {
            cupCompetitionManager.openModal('fa');
        }
    };

    container.replaceChildren(
        nextMatchCard,
        leagueCard,
        faCupCard,
        squadCard,
        stadiumCard,
        growthCard,
        transferCard,
        tacticsCard,
        sponsorCard,
        youthCard,
        mailCard,
        chatCard,
        settingsCard,
        recordsCard,
        snsCard,
        transferNewsCard,
        financeCard
    );
}

function createDashboardCard(title, tabName, contentFn) {
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    card.id = `dashboard-${tabName}`;

    const h3 = document.createElement('h3');
    const titleWrap = document.createElement('span');
    titleWrap.style.cssText = 'display: inline-flex; align-items: center; gap: 8px;';
    if (typeof createIcon === 'function') {
        titleWrap.appendChild(createIcon(tabName));
    }
    titleWrap.appendChild(document.createTextNode(title));
    const arrow = document.createElement('span');
    arrow.innerHTML = typeof iconSVG === 'function' ? iconSVG('arrow_right') : '→';
    h3.append(titleWrap, arrow);
    card.appendChild(h3);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'dashboard-content';
    const content = contentFn();
    if (typeof content === 'string') {
        contentDiv.textContent = content;
    } else if (content instanceof Node) {
        contentDiv.appendChild(content);
    }
    card.appendChild(contentDiv);

    card.onclick = () => showTab(tabName);
    return card;
}

function ensureChatState() {
    if (!gameData.chatState || typeof gameData.chatState !== 'object') {
        gameData.chatState = { activeContactId: 'secretary', threads: {} };
    }
    if (!gameData.chatState.threads) gameData.chatState.threads = {};
    if (!gameData.chatState.activeContactId) gameData.chatState.activeContactId = 'secretary';
    return gameData.chatState;
}

function getChatContacts() {
    return [
        {
            id: 'secretary',
            name: `비서 ${gameData.secretaryName || '김지수'}`,
            role: '비서실',
            color: '#0284C7',
            avatar: 'SEC',
            icon: 'briefcase',
            description: '구단 운영과 일정, 민원과 제안을 정리합니다.'
        },
        {
            id: 'coach',
            name: '수석 코치',
            role: '전술실',
            color: '#2563EB',
            avatar: 'TAC',
            icon: 'tactics',
            description: '전술, 경기 준비, 선수 컨디션을 함께 점검합니다.'
        },
        {
            id: 'owner',
            name: '구단주',
            role: '운영실',
            color: '#D97706',
            avatar: 'OWN',
            icon: 'crown',
            description: '예산, 이적료, 계약 조건에 대한 최종 판단을 내립니다.'
        },
        {
            id: 'scout',
            name: '스카우트 팀장',
            role: '스카우팅',
            color: '#059669',
            avatar: 'SCT',
            icon: 'search',
            description: '이적시장과 유망주 보고서를 전달합니다.'
        }
    ];
}

function getChatContactById(contactId) {
    return getChatContacts().find(contact => contact.id === contactId) || getChatContacts()[0];
}

function getChatThread(contactId) {
    const state = ensureChatState();
    if (!state.threads[contactId]) {
        state.threads[contactId] = [];
    }
    return state.threads[contactId];
}

function addChatMessage(contactId, sender, text, options = {}) {
    const thread = getChatThread(contactId);
    thread.push({
        id: Date.now() + Math.random(),
        sender,
        text,
        time: options.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: options.type || 'text'
    });
    if (thread.length > 200) thread.shift();
}

function getLatestChatPreview() {
    const state = ensureChatState();
    const activeContactId = state.activeContactId || 'secretary';
    const thread = getChatThread(activeContactId);
    if (thread.length === 0) return '';
    const last = thread[thread.length - 1];
    return `${last.sender === 'user' ? '나' : getChatContactById(activeContactId).name}: ${last.text}`.slice(0, 42);
}

function renderChatTab() {
    const container = document.getElementById('chatContent');
    if (!container) return;

    const state = ensureChatState();
    const contacts = getChatContacts();
    const activeContact = getChatContactById(state.activeContactId);
    const thread = getChatThread(activeContact.id);

    const chatShell = document.createElement('div');
    chatShell.className = 'chat-shell';

    // Aside / Sidebar
    const aside = document.createElement('aside');
    aside.className = 'chat-sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'chat-sidebar-header';

    const sidebarTitle = document.createElement('div');
    sidebarTitle.className = 'chat-sidebar-title';
    sidebarTitle.textContent = '대화방';

    const sidebarSubtitle = document.createElement('div');
    sidebarSubtitle.className = 'chat-sidebar-subtitle';
    sidebarSubtitle.textContent = '구단 내부 실시간 메신저';

    sidebarHeader.append(sidebarTitle, sidebarSubtitle);
    aside.appendChild(sidebarHeader);

    const contactList = document.createElement('div');
    contactList.className = 'chat-contact-list';

    contacts.forEach(contact => {
        const contactThread = getChatThread(contact.id);
        const lastMessage = contactThread.length > 0 ? contactThread[contactThread.length - 1].text : contact.description;
        const isActive = contact.id === activeContact.id;

        const btn = document.createElement('button');
        btn.className = `chat-contact ${isActive ? 'active' : ''}`;
        btn.onclick = () => switchChatContact(contact.id);

        const avatar = document.createElement('div');
        avatar.className = 'chat-contact-avatar';
        avatar.style.background = contact.color;
        if (typeof createIcon === 'function' && contact.icon) {
            avatar.appendChild(createIcon(contact.icon));
        } else {
            avatar.textContent = contact.avatar;
        }

        const body = document.createElement('div');
        body.className = 'chat-contact-body';

        const top = document.createElement('div');
        top.className = 'chat-contact-top';
        const nameStrong = document.createElement('strong');
        nameStrong.textContent = contact.name;
        const roleSpan = document.createElement('span');
        roleSpan.textContent = contact.role;
        top.append(nameStrong, roleSpan);

        const preview = document.createElement('div');
        preview.className = 'chat-contact-preview';
        preview.textContent = lastMessage;

        body.append(top, preview);
        btn.append(avatar, body);
        contactList.appendChild(btn);
    });

    aside.appendChild(contactList);
    chatShell.appendChild(aside);

    // Main section
    const mainSection = document.createElement('section');
    mainSection.className = 'chat-main';

    const header = document.createElement('header');
    header.className = 'chat-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'chat-header-left';

    const headerAvatar = document.createElement('div');
    headerAvatar.className = 'chat-header-avatar';
    headerAvatar.style.background = activeContact.color;
    if (typeof createIcon === 'function' && activeContact.icon) {
        headerAvatar.appendChild(createIcon(activeContact.icon));
    } else {
        headerAvatar.textContent = activeContact.avatar;
    }

    const headerTitles = document.createElement('div');
    const headerTitle = document.createElement('div');
    headerTitle.className = 'chat-header-title';
    headerTitle.textContent = activeContact.name;

    const headerSubtitle = document.createElement('div');
    headerSubtitle.className = 'chat-header-subtitle';
    headerSubtitle.textContent = activeContact.description;

    headerTitles.append(headerTitle, headerSubtitle);
    headerLeft.append(headerAvatar, headerTitles);

    const headerMeta = document.createElement('div');
    headerMeta.className = 'chat-header-meta';
    headerMeta.textContent = '현재 대화 중';

    header.append(headerLeft, headerMeta);
    mainSection.appendChild(header);

    // Chat thread
    const threadContainer = document.createElement('div');
    threadContainer.id = 'chatThread';
    threadContainer.className = 'chat-thread';

    if (thread.length > 0) {
        thread.forEach(msg => {
            threadContainer.appendChild(renderChatBubble(msg, activeContact));
        });
    } else {
        const emptyState = document.createElement('div');
        emptyState.className = 'chat-empty-state';

        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'chat-empty-icon';
        emptyIcon.innerHTML = typeof iconSVG === 'function' ? iconSVG('lightbulb') : 'TIP';

        const emptyH3 = document.createElement('h3');
        emptyH3.textContent = '꿀팁 & FAQ를 확인하세요';

        const emptyP = document.createElement('p');
        emptyP.textContent = '아래 추천 질문을 클릭하시면 즉시 해당 내용에 대한 꿀팁과 답변을 확인하실 수 있습니다!';

        emptyState.append(emptyIcon, emptyH3, emptyP);
        threadContainer.appendChild(emptyState);
    }
    mainSection.appendChild(threadContainer);

    // Quick replies
    const quickReplies = document.createElement('div');
    quickReplies.className = 'chat-quick-replies';

    getChatQuickReplies(activeContact.id).forEach(text => {
        const chip = document.createElement('button');
        chip.className = 'chat-quick-chip';
        chip.textContent = text;
        chip.onclick = () => sendQuickChatMessage(text);
        quickReplies.appendChild(chip);
    });
    mainSection.appendChild(quickReplies);

    // Typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-typing';
    typingIndicator.id = 'chatTypingIndicator';
    typingIndicator.style.display = 'none';
    typingIndicator.textContent = `${activeContact.name}이(가) 입력 중...`;
    mainSection.appendChild(typingIndicator);

    // Composer
    const composer = document.createElement('div');
    composer.className = 'chat-composer';
    composer.style.display = 'none';

    const input = document.createElement('textarea');
    input.id = 'chatInput';
    input.className = 'chat-input';
    input.rows = 2;
    input.placeholder = '메시지를 입력하세요...';
    input.onkeydown = (event) => handleChatKeydown(event);

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn primary chat-send-btn';
    sendBtn.textContent = '전송';
    sendBtn.onclick = () => sendChatMessage();

    composer.append(input, sendBtn);
    mainSection.appendChild(composer);

    chatShell.appendChild(mainSection);

    container.replaceChildren(chatShell);
    scrollChatToBottom();
}

function renderChatBubble(message, contact) {
    const isUser = message.sender === 'user';
    const senderLabel = isUser ? '나' : contact.name;

    const row = document.createElement('div');
    row.className = `chat-row ${isUser ? 'user' : 'other'}`;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isUser ? 'user' : 'other'}`;

    const meta = document.createElement('div');
    meta.className = 'chat-bubble-meta';

    const senderSpan = document.createElement('span');
    senderSpan.className = 'chat-bubble-sender';
    senderSpan.textContent = senderLabel;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-bubble-time';
    timeSpan.textContent = message.time;

    meta.append(senderSpan, timeSpan);

    const textDiv = document.createElement('div');
    textDiv.className = 'chat-bubble-text';
    const lines = String(message.text || '').split('\n');
    lines.forEach((line, idx) => {
        if (idx > 0) textDiv.appendChild(document.createElement('br'));
        textDiv.appendChild(document.createTextNode(line));
    });

    bubble.append(meta, textDiv);
    row.appendChild(bubble);
    return row;
}

function escapeChatText(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\n/g, '<br>');
}

const CHAT_TEMPLATES = {
    secretary: [
        { q: '이게 뭐야?', a: '게임을 알려드리고 개발자만 아는 꿀팁도 알려드립니다.' },
        { q: '사기가 뭐야?', a: '[현재 팀 분위기 체크리스트]\n• 연패가 이어지면 사기가 빠르게 떨어집니다\n• 주급이 밀리거나 계약 기간이 얼마 안 남은 선수는 불만을 가질 수 있습니다\n• 인터뷰 답변으로 분위기를 올릴 수 있습니다\n\nTIP: 승리가 쌓이면 자연스럽게 분위기가 좋아집니다!' },
        { q: '돈이 없어ㅠㅜ', a: '[구단 자금 관리 꿀팁]\n1. 스폰서 계약은 최대한 높은 등급으로 유지하세요\n2. 불필요한 선수는 이적명단에 올리세요. 한번 관심 없어도 꾸준히 등록하면 오퍼가 온답니다\n3. 주급 예산을 넘어가지 않게 주의하세요\n\nTIP: 하위 리그에서는 싼 유망주를 사서 성장시킨 후 비싸게 파는 것도 좋은 전략입니다!' },
        { q: '초보자 추천 꿀팁', a: '[초보 감독님 필수 꿀팁]\n1. 처음에는 강팀을 선택해서 시스템을 익히세요\n2. 로테이션도 중요합니다\n3. 전술을 꼭 설정하세요! DNA 탭과 스쿼드>롤 정보에서 설정 가능합니다!\n4. 프리셋 설정 후 스스로 또 손보세요\n\nTIP: Ctrl+Shift+S로 5시즌 빠른 시뮬레이션!' },
        { q: '이적료/주급 관리 도와줘', a: '[선수 처리 비교]\n• 협상을 시도해 보세요!\n• 너무 깎아치진 말고 20 퍼센트정도만 줄이는 것을 추천합니다\n\n주의: 협상에 2번 실패하면 10경기 동안 그 선수에게 다시 제안할 수 없습니다!' },
        { q: '주급 관리 어떻게 해요?', a: '[주급 관리 노하우]\n1. 주급 예산 내에서 운영하는 게 가장 중요합니다\n2. 선수를 영입할때 주급 협상은 꼭 하세요\n3. 재정 탭에서 이적 예산과 주급예산을 조정하세요\n\nTIP: 계약 만료 6개월 전부터 미리미리 재계약하세요!' }
    ],
    coach: [
        { q: '전술 조언 부탁해', a: '[전술 선택 가이드]\n• balanced: 무전술- 절대하지마세요! 나머지는 맘대로 하세요\n• 전술 숙련도가 있으니 주의하세요!' },
        { q: '다음 경기 준비는?', a: '[경기 전 체크리스트]\n1. 상대팀 평균 능력치 확인\n2. 전술 설정' },
        { q: '선수 컨디션?', a: '[선수 컨디션 관리]\n• 연속 출전 시 피로도가 쌓입니다\n• 로테이션으로 선수들에게 휴식을 주세요\n\nTIP: 중요한 경기를 앞두고 있다면 전 경기에는 교체 출전시키는 게 좋습니다' },
        { q: '포메이션 추천해줘', a: '[포메이션 가이드]\n• 4-3-3: 기본형, 공격과 수비 밸런스 좋음\n• 4-4-2: 전통적인 밸런스형, 미드필더 많음\n• 3-5-2: 윙백 활용, 공격적\n• 5-3-2: 수비 중시, 상대 강팀 상대\n\nTIP: 우리 팀의 포지션별 선수 깊이에 맞춰 고르세요' },
        { q: '전술 뭘 고를까요', a: '[전술 추천]\n1. 높은 리그라면(혹은 강팀이라면): 토탈 풋볼 추천\n2. 약한 리그라면: 마음대로(토탈 풋볼 제외)' },
        { q: '치트 쓰는법', a: '치트:\n1. json으로 내보낸 후 값을 변경하세요(게임터질수도)\n2. 설정에서 포텐 확인이 가능합니다!' },
    ],
    owner: [
        { q: '예산 여유 있어?', a: '[예산 운영 원칙]\n• 팀 자금은 이적료와 주급 예산으로 나눠서 생각하세요\n• 스폰서 승점 보너스가 가장 큰 수입입니다\n\nTIP: 팀 오버롤을 높여서 더 높은 스폰서와 계약하세요' },
        { q: '이적료 협상 가능?', a: '[이적 협상 노하우]\n1. 선수 능력치, 나이, 남은 계약기간이 가격을 결정합니다\n2. 꼭 협상을 하세요\n3. 너무 비싼 선수는 돈모아서 사세요 그때가 제일 쌉니다\n\nTIP: 20세 이하 유망주는 가격대비 쌉니다' },
        { q: '주급 자금 더 필요해', a: '[주급 자금 늘리는 법]\n1. 스폰서 계약 등급 올리기\n2. 불필요한 고주급 선수 방출/이적\n3. 팀 순위가 오르면 자연스레 증액\n\nTIP: 승승장구하면 구단주가 특별 보너스를 줄 때도 있습니다!' },
        { q: '선수 비싸게 파는 법?', a: '[선수 매각 노하우]\n1. 능력치 상승 중인 선수가 가장 비쌉니다\n\nTIP: 팔때도 협상 하세요' },
        { q: '파산 직전이에요 도와줘', a: '[긴급 자금 구출 플랜]\n1. 고주급 베테랑 선수부터 방출/매각\n2. 선수 팔기\nTIP: 하위 리그로 강등돼도 다시 올라올 수 있으니 포기하지 마세요!' }
    ],
    scout: [
        { q: '유망주 보고서 줘', a: '[유망주 체크리스트]\n• 나이: 18-22세 사이가 가장 좋습니다\n• 현재 능력치 대비 성장 가능성 보기\n• 포지션별 필요성 확인\n\nTIP: 스카우트를 통해 영입된 선수는 포텐셜이 높을 가능성이 높아요.' },
        { q: '사야할 선수 있어?', a: '[이적 시장 타입]\n1. 즉전력: 지금 당장 필요한 포지션 보강\n2. 유망주: 미래를 위한 투자\n3. 저가 매물: 로테이션용 나이 좀 있는 선수\n\nTIP: 시즌 중간 이적 시즌에 맞춰 구매하는 게 유리합니다' },
        { q: '추천 선수 알려줘', a: '[각 포지션별 추천 선수]\n• GK: 본좌: 조안 가르시아, 슈발리에 / 유망주: 기욤 레스테스\n• DF: 본좌: 그바르디올 / 유망주: 쿠바르시\n• MF: 본좌: 무시알라, 주앙 네베스, 흐라벤베르흐 / 유망주: 옌스, 칼, 배승균\n• FW: 본좌: 비르츠, 호드리구, 홀란드 등 / 유망주: 프란치스코 카마르다\n\nTIP: 26세 이상은 성장 안해요! 또 노장 선수는 은퇴했을때 우리팀에서 회귀합니다.' },
        { q: '스카우터 고용해야 하나요?', a: '[스카우터 활용법]\n• 스카우터 고용 시 유망주가 스카우트됨\n• 여유가 있다면 추천\n\nTIP: 자금 여유가 된다면 빨리 고용하는 게 좋아요' },
        { q: '유망주 어떻게 키우나요?', a: '[유망주 성장 가이드]\n1. 3경기마다 성장합니다\n2. 교체에 박아놔도 성장합니다' },
        { q: '이적 시장 타이밍은?', a: '[이적 시장 골든 타이밍]\n• 이적시장에 나온 지 30일 이상 되면 가격이 내려가기 시작합니다!' }
    ]
};

function getChatQuickReplies(contactId) {
    const template = CHAT_TEMPLATES[contactId] || CHAT_TEMPLATES.secretary;
    return template.map(item => item.q);
}

function switchChatContact(contactId) {
    const state = ensureChatState();
    state.activeContactId = contactId;
    renderChatTab();
}

function fillChatInput(text) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = text;
        input.focus();
    }
}

function sendQuickChatMessage(text) {
    const state = ensureChatState();
    const activeContact = getChatContactById(state.activeContactId);

    addChatMessage(activeContact.id, 'user', text);
    renderChatTab();

    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) typingIndicator.style.display = 'block';

    setTimeout(() => {
        const reply = generateChatReply(activeContact.id, text);
        addChatMessage(activeContact.id, activeContact.name, reply);
        renderChatTab();
        const refreshedTyping = document.getElementById('chatTypingIndicator');
        if (refreshedTyping) refreshedTyping.style.display = 'none';
    }, 500 + Math.random() * 700);
}

function handleChatKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const state = ensureChatState();
    const activeContact = getChatContactById(state.activeContactId);

    addChatMessage(activeContact.id, 'user', text);
    input.value = '';
    renderChatTab();

    const typingIndicator = document.getElementById('chatTypingIndicator');
    if (typingIndicator) typingIndicator.style.display = 'block';

    setTimeout(() => {
        const reply = generateChatReply(activeContact.id, text);
        addChatMessage(activeContact.id, activeContact.name, reply);
        renderChatTab();
        const refreshedTyping = document.getElementById('chatTypingIndicator');
        if (refreshedTyping) refreshedTyping.style.display = 'none';
    }, 700 + Math.random() * 900);
}

function generateChatReply(contactId, text) {
    const template = CHAT_TEMPLATES[contactId] || CHAT_TEMPLATES.secretary;
    const found = template.find(item => item.q === text);
    if (found) return found.a;
    const contact = getChatContactById(contactId);
    return `감독님, ${contact.name}입니다. 아래 추천 질문 중 하나를 선택해주세요.`;
}

function scrollChatToBottom() {
    setTimeout(() => {
        const thread = document.getElementById('chatThread');
        if (thread) thread.scrollTop = thread.scrollHeight;
    }, 0);
}

window.renderChatTab = renderChatTab;
window.switchChatContact = switchChatContact;
window.fillChatInput = fillChatInput;
window.handleChatKeydown = handleChatKeydown;
window.sendChatMessage = sendChatMessage;
window.sendQuickChatMessage = sendQuickChatMessage;

function renderFinanceTab() {
    const container = document.getElementById('financeContent');
    if (!container) return;

    const transferBudget = formatFinanceVal(Math.max(0, gameData.teamMoney || 0));
    const wageBudget = formatFinanceVal(Math.max(0, typeof gameData.wageBudget === 'number' ? gameData.wageBudget : 0));
    const totalPool = transferBudget + wageBudget;
    const wageCoverage = gameData.totalWeeklyWage > 0 ? Math.round((wageBudget / gameData.totalWeeklyWage) * 100) : 0;
    const transferDefault = 0;

    const panel = document.createElement('div');
    panel.className = 'finance-panel';

    // 1. Hero
    const hero = document.createElement('div');
    hero.className = 'finance-hero';

    const heroCopy = document.createElement('div');
    heroCopy.className = 'finance-hero-copy';

    const kicker = document.createElement('div');
    kicker.className = 'finance-kicker';
    kicker.textContent = 'FINANCE MANAGEMENT';

    const heroH3 = document.createElement('h3');
    heroH3.textContent = '예산을 직접 조절하세요';

    const heroP = document.createElement('p');
    heroP.textContent = '슬라이더를 오른쪽으로 밀수록 주급 자금이 늘고, 왼쪽으로 밀수록 이적 자금이 늘어납니다. 전환은 52억 이적 자금 ↔ 1억 주급 자금 단위로 정확히 적용됩니다.';

    heroCopy.append(kicker, heroH3, heroP);

    const ratioChip = document.createElement('div');
    ratioChip.className = 'finance-ratio-chip';
    const ratioSpan = document.createElement('span');
    ratioSpan.textContent = '운영 가능 주급 커버';
    const ratioStrong = document.createElement('strong');
    ratioStrong.textContent = `${wageCoverage}%`;
    ratioChip.append(ratioSpan, ratioStrong);

    hero.append(heroCopy, ratioChip);
    panel.appendChild(hero);

    // 2. Summary grid
    const summaryGrid = document.createElement('div');
    summaryGrid.className = 'finance-summary-grid';

    const createSummaryCard = (label, valueText, valueClass) => {
        const card = document.createElement('div');
        card.className = 'finance-summary-card';
        const lbl = document.createElement('div');
        lbl.className = 'finance-label';
        lbl.textContent = label;
        const val = document.createElement('div');
        val.className = `finance-value ${valueClass}`;
        val.textContent = valueText;
        card.append(lbl, val);
        return card;
    };

    const availableWage = formatFinanceVal(Math.max(0, wageBudget - (gameData.totalWeeklyWage || 0)));

    summaryGrid.append(
        createSummaryCard('이적 자금', `${transferBudget}억`, 'transfer'),
        createSummaryCard('주급 예산 (한도)', `${wageBudget}억`, 'wage'),
        createSummaryCard('선수단 총 주급', `${formatFinanceVal(gameData.totalWeeklyWage)}억`, 'wage-debt'),
        createSummaryCard('가용 여유 주급', `${availableWage}억`, 'annual')
    );
    panel.appendChild(summaryGrid);

    // 3. Conversion card
    const convCard = document.createElement('div');
    convCard.className = 'finance-conversion-card';

    const convHeader = document.createElement('div');
    convHeader.className = 'finance-conversion-header';
    const convHeaderLeft = document.createElement('div');
    const convH4 = document.createElement('h4');
    convH4.textContent = '예산 슬라이더';
    const convP = document.createElement('p');
    convP.textContent = '가운데는 중립, 왼쪽은 이적 자금 강화, 오른쪽은 주급 자금 강화';
    convHeaderLeft.append(convH4, convP);
    const rateNote = document.createElement('div');
    rateNote.className = 'finance-rate-note';
    rateNote.textContent = '전환 단위 = 이적 52억 ↔ 주급 1억';
    convHeader.append(convHeaderLeft, rateNote);
    convCard.appendChild(convHeader);

    // Slider shell
    const sliderShell = document.createElement('div');
    sliderShell.className = 'finance-slider-shell';

    const sliderLabels = document.createElement('div');
    sliderLabels.className = 'finance-slider-labels';
    const tagTransfer = document.createElement('span');
    tagTransfer.className = 'budget-tag transfer';
    tagTransfer.textContent = '이적 자금';
    const tagNeutral = document.createElement('span');
    tagNeutral.className = 'budget-tag neutral';
    tagNeutral.textContent = '중립';
    const tagWage = document.createElement('span');
    tagWage.className = 'budget-tag wage';
    tagWage.textContent = '주급 자금';
    sliderLabels.append(tagTransfer, tagNeutral, tagWage);

    const sliderInput = document.createElement('input');
    sliderInput.id = 'financeBalanceSlider';
    sliderInput.className = 'finance-range';
    sliderInput.type = 'range';
    sliderInput.min = '-100';
    sliderInput.max = '100';
    sliderInput.step = '1';
    sliderInput.value = '0';
    sliderInput.oninput = () => updateFinanceBalancePreview(sliderInput.value);

    const scaleDiv = document.createElement('div');
    scaleDiv.className = 'finance-scale';
    const scaleMin = document.createElement('span');
    scaleMin.textContent = '-100';
    const scaleState = document.createElement('span');
    scaleState.id = 'financeBalanceState';
    scaleState.textContent = '중립 상태';
    const scaleMax = document.createElement('span');
    scaleMax.textContent = '+100';
    scaleDiv.append(scaleMin, scaleState, scaleMax);

    sliderShell.append(sliderLabels, sliderInput, scaleDiv);
    convCard.appendChild(sliderShell);

    // Preview grid
    const previewGrid = document.createElement('div');
    previewGrid.className = 'finance-preview-grid';

    const cardTransfer = document.createElement('div');
    cardTransfer.className = 'finance-preview-card transfer';
    const lblT = document.createElement('div');
    lblT.className = 'finance-preview-label';
    lblT.textContent = '이적 자금 변화';
    const valT = document.createElement('div');
    valT.id = 'financeTransferDelta';
    valT.className = 'finance-preview-value';
    valT.textContent = '0억';
    const subT = document.createElement('div');
    subT.id = 'financeTransferAfter';
    subT.className = 'finance-preview-sub';
    subT.textContent = '변동 없음';
    cardTransfer.append(lblT, valT, subT);

    const cardWage = document.createElement('div');
    cardWage.className = 'finance-preview-card wage';
    const lblW = document.createElement('div');
    lblW.className = 'finance-preview-label';
    lblW.textContent = '주급 자금 변화';
    const valW = document.createElement('div');
    valW.id = 'financeWageDelta';
    valW.className = 'finance-preview-value';
    valW.textContent = '0억';
    const subW = document.createElement('div');
    subW.id = 'financeWageAfter';
    subW.className = 'finance-preview-sub';
    subW.textContent = '변동 없음';
    cardWage.append(lblW, valW, subW);

    previewGrid.append(cardTransfer, cardWage);
    convCard.appendChild(previewGrid);

    // Action row
    const actionRow = document.createElement('div');
    actionRow.className = 'finance-action-row';
    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn primary finance-apply-btn';
    applyBtn.textContent = '선택한 예산 이동 적용';
    applyBtn.onclick = () => applyFinanceBalanceSlider();

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn finance-reset-btn';
    resetBtn.textContent = '슬라이더 초기화';
    resetBtn.onclick = () => resetFinanceSlider();

    actionRow.append(applyBtn, resetBtn);
    convCard.appendChild(actionRow);
    panel.appendChild(convCard);

    // 4. Insight grid
    const insightGrid = document.createElement('div');
    insightGrid.className = 'finance-insight-grid';

    const createInsightCard = (title, textBefore, boldText, textAfter) => {
        const card = document.createElement('div');
        card.className = 'finance-insight-card';
        const t = document.createElement('div');
        t.className = 'finance-insight-title';
        t.textContent = title;
        const body = document.createElement('div');
        body.className = 'finance-insight-text';
        const b = document.createElement('strong');
        b.textContent = boldText;
        body.append(document.createTextNode(textBefore), b, document.createTextNode(textAfter));
        card.append(t, body);
        return card;
    };

    insightGrid.append(
        createInsightCard('이적 운영 상태', '현재 팀의 이적 자금은 ', `${transferBudget}억`, '이며, 공격적인 영입을 원하면 왼쪽(이적 자금 방향)으로 슬라이더를 이동하세요.'),
        createInsightCard('주급 운영 상태', '현재 주급 자금은 ', `${wageBudget}억`, '입니다. 이 수치가 낮으면 연봉 협상과 선수 유지가 어려워집니다.')
    );
    panel.appendChild(insightGrid);

    // Note
    const noteDiv = document.createElement('div');
    noteDiv.className = 'finance-note';
    noteDiv.textContent = '주급 자금이 부족하면 협상 단계에서 계약이 막힙니다. 필요할 때만 자금을 이동시키고, 과도한 전환은 피하세요.';
    panel.appendChild(noteDiv);

    // 5. 구단 스타디움 증축 & 부대시설 바로가기 카드
    if (typeof stadiumSystem !== 'undefined') {
        const stad = stadiumSystem.getUserStadium();
        if (stad) {
            const stadCard = document.createElement('div');
            stadCard.className = 'finance-conversion-card';
            stadCard.style.marginTop = '18px';
            const upg = stad.upgrades || {};
            const installedCount = ['skybox', 'hybridPitch', 'megastore', 'trainingCenter'].filter(k => upg[k]).length;

            stadCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
                    <div>
                        <div style="font-size: 0.76rem; font-weight: 900; color: #38BDF8; letter-spacing: 0.06em; margin-bottom: 4px;">CLUB INFRASTRUCTURE & STADIUM</div>
                        <h4 style="margin: 0 0 6px; font-size: 1.15rem; color: #F8FAFC;">🏟️ ${stad.name} (Lv.${stad.level}) · 구단 설비 증축</h4>
                        <p style="margin: 0; font-size: 0.88rem; color: #94A3B8;">
                            현재 수용 인원: <strong style="color: #FBBF24;">${stad.currentCapacity.toLocaleString()}석</strong> · 부대시설 설치: <strong style="color: #34D399;">${installedCount} / 4개</strong> (스카이박스 · 온열잔디 · 메가스토어 · 유스 아카데미)
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" class="btn primary" style="padding: 10px 18px; font-weight: 800;"
                            onclick="showTab('stadium')">
                            🏟️ 구장/설비 탭 열기
                        </button>
                        <button type="button" class="btn" style="padding: 10px 16px; background: rgba(56, 189, 248, 0.16); border: 1px solid rgba(56, 189, 248, 0.45); color: #38BDF8; font-weight: 800;"
                            onclick="stadiumSystem.openModal()">
                            팝업 모달로 열기
                        </button>
                    </div>
                </div>
            `;
            panel.appendChild(stadCard);
        }
    }

    container.replaceChildren(panel);

    if (typeof updateFinanceBalancePreview === 'function') {
        updateFinanceBalancePreview(transferDefault);
        const slider = document.getElementById('financeBalanceSlider');
        if (slider) slider.value = transferDefault;
    }
}

function updateFinanceBalancePreview(rawValue) {
    const sliderValue = Number(rawValue) || 0;
    const transferBudget = formatFinanceVal(Math.max(0, gameData.teamMoney || 0));
    const wageBudget = formatFinanceVal(Math.max(0, typeof gameData.wageBudget === 'number' ? gameData.wageBudget : 0));
    const transferDeltaEl = document.getElementById('financeTransferDelta');
    const wageDeltaEl = document.getElementById('financeWageDelta');
    const transferAfterEl = document.getElementById('financeTransferAfter');
    const wageAfterEl = document.getElementById('financeWageAfter');
    const stateEl = document.getElementById('financeBalanceState');
    const slider = document.getElementById('financeBalanceSlider');

    const direction = sliderValue > 0 ? 'transferToWage' : sliderValue < 0 ? 'wageToTransfer' : 'neutral';
    const ratio = Math.abs(sliderValue) / 100;

    let transferDelta = 0;
    let wageDelta = 0;
    let statusText = '중립 상태';

    if (direction === 'transferToWage') {
        const maxUnits = Math.floor(transferBudget / 52);
        const units = Math.round(maxUnits * ratio);
        transferDelta = -(units * 52);
        wageDelta = units;
        statusText = units > 0 ? `오른쪽으로 이동 중: 주급 자금 +${units}억 강화` : '전환 가능한 이적 자금(최소 52억)이 부족합니다';
    } else if (direction === 'wageToTransfer') {
        const currentTotal = formatFinanceVal(gameData.totalWeeklyWage || 0);
        const availableWageBudget = Math.max(0, wageBudget - currentTotal);
        const maxUnits = Math.floor(availableWageBudget);
        const units = Math.round(maxUnits * ratio);
        wageDelta = -units;
        transferDelta = units * 52;
        statusText = units > 0 ? `왼쪽으로 이동 중: 이적 자금 +${units * 52}억 강화` : '전환 가능한 여유 주급 자금(최소 1억)이 부족합니다';
    }

    const nextTransfer = formatFinanceVal(Math.max(0, transferBudget + transferDelta));
    const nextWage = formatFinanceVal(Math.max(0, wageBudget + wageDelta));

    if (transferDeltaEl) transferDeltaEl.textContent = transferDelta === 0 ? '0억' : `${transferDelta > 0 ? '+' : ''}${transferDelta}억`;
    if (wageDeltaEl) wageDeltaEl.textContent = wageDelta === 0 ? '0억' : `${wageDelta > 0 ? '+' : ''}${wageDelta}억`;
    if (transferAfterEl) transferAfterEl.textContent = `전환 후 ${nextTransfer}억`;
    if (wageAfterEl) wageAfterEl.textContent = `전환 후 ${nextWage}억`;
    if (stateEl) stateEl.textContent = statusText;

    if (slider) {
        const percent = (sliderValue + 100) / 2;
        slider.style.background = `linear-gradient(90deg, rgba(251, 191, 36, 0.85) 0%, rgba(251, 191, 36, 0.85) ${percent}%, rgba(56, 189, 248, 0.85) ${percent}%, rgba(56, 189, 248, 0.85) 100%)`;
    }
}

function applyFinanceBalanceSlider() {
    const slider = document.getElementById('financeBalanceSlider');
    if (!slider) return;

    const sliderValue = Number(slider.value) || 0;
    if (sliderValue === 0) {
        alert('슬라이더를 왼쪽 또는 오른쪽으로 움직여 예산을 조정하세요.');
        return;
    }

    const ratio = Math.abs(sliderValue) / 100;
    const transferBudget = Math.max(0, gameData.teamMoney || 0);
    const wageBudget = Math.max(0, gameData.wageBudget || 0);

    if (sliderValue > 0) {
        const maxUnits = Math.floor(transferBudget / 52);
        const units = Math.round(maxUnits * ratio);
        const transferSource = units * 52;
        if (transferSource < 52) {
            alert('이적 자금은 최소 52억 단위(주급 자금 1억 단위)로만 전환할 수 있습니다.');
            return;
        }
        const result = transferSystem.convertTransferToWageBudget(transferSource);
        alert(result.message);
    } else {
        const availableWageBudget = Math.max(0, wageBudget - (gameData.totalWeeklyWage || 0));
        const maxUnits = Math.floor(availableWageBudget);
        const units = Math.round(maxUnits * ratio);
        if (units < 1) {
            alert('전환 가능한 여유 주급 자금(최소 1억 단위)이 부족합니다.\n현재 선수단 총 주급 이하로는 이적 자금으로 뺄 수 없습니다.');
            return;
        }
        const result = transferSystem.convertWageToTransferBudget(units);
        alert(result.message);
    }

    renderFinanceTab();
    updateDisplay();
}

function resetFinanceSlider() {
    const slider = document.getElementById('financeBalanceSlider');
    if (slider) {
        slider.value = 0;
        updateFinanceBalancePreview(0);
    }
}

// [신규] 다중 시즌 시뮬레이션 함수
async function simulateMultipleSeasons(count) {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'simLoading';
    loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(9,13,22,0.92);color:#F8FAFC;display:flex;justify-content:center;align-items:center;z-index:99999;font-size:2rem;flex-direction:column;';

    const countDiv = document.createElement('div');
    countDiv.textContent = `${count}시즌 시뮬레이션 진행 중...`;

    const progressEl = document.createElement('div');
    progressEl.id = 'simProgress';
    progressEl.style.cssText = 'font-size:1rem;margin-top:20px;';
    progressEl.textContent = '준비 중';

    loadingOverlay.append(countDiv, progressEl);
    document.body.appendChild(loadingOverlay);

    // UI 렌더링 대기
    await new Promise(r => setTimeout(r, 50));

    try {
        for (let s = 0; s < count; s++) {
            if (!gameData.schedule) generateFullSchedule();

            const divisionKey = `division${gameData.currentLeague}`;
            const uLId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(gameData.selectedTeam) : null;
            const schedule = (uLId && gameData.schedule[uLId]) ? gameData.schedule[uLId] : gameData.schedule[divisionKey];

            if (!schedule) break;

            const totalRounds = schedule.length;

            for (let r = 1; r <= totalRounds; r++) {
                gameData.currentRound = r;
                progressEl.textContent = `${s + 1}/${count} 시즌 - ${r}/${totalRounds} 라운드 진행 중...`;

                if (r % 5 === 0) await new Promise(res => setTimeout(res, 0));

                simulateAllMatchesInRound(r);
            }

            // 시즌 종료 (silent = true)
            endSeason(true);

            await new Promise(res => setTimeout(res, 10));
        }

        alert(`${count}시즌 시뮬레이션이 완료되었습니다!`);

    } catch (e) {
        console.error("시뮬레이션 중 오류:", e);
        alert("시뮬레이션 중 오류가 발생했습니다: " + e.message);
    } finally {
        if (loadingOverlay) loadingOverlay.remove();
        updateDisplay();
        if (typeof displayLeagueTable === 'function') displayLeagueTable();
        if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        if (typeof updateRecordsTab === 'function') updateRecordsTab();
    }
}

function simulateAllMatchesInRound(round) {
    for (let league = 1; league <= 3; league++) {
        const divisionKey = `division${league}`;
        const leagueSchedule = gameData.schedule[divisionKey];

        if (!leagueSchedule || round > leagueSchedule.length) continue;

        const matches = leagueSchedule[round - 1];

        matches.forEach(match => {
            if (typeof recordsSystem === 'undefined' || !recordsSystem) {
                if (typeof initRecordsSystemInstance === 'function') initRecordsSystemInstance();
            }

            if (recordsSystem) {
                const result = recordsSystem.simulateSingleAIMatch(match.home, match.away);
                recordsSystem.matchRecords.push(result);

                if (match.home === gameData.selectedTeam || match.away === gameData.selectedTeam) {
                    gameData.matchesPlayed++;
                    const isHome = match.home === gameData.selectedTeam;
                    const myScore = isHome ? result.score1 : result.score2;
                    const oppScore = isHome ? result.score2 : result.score1;

                    let moneyReward = 0;
                    if (myScore > oppScore) moneyReward = 50;
                    else if (myScore === oppScore) moneyReward = 15;
                    else moneyReward = 10;

                    gameData.teamMoney += moneyReward;
                }
            }
        });
    }

    if (typeof processPostMatchGrowth === 'function') processPostMatchGrowth();
    if (typeof updateTransferMarketPostMatch === 'function') updateTransferMarketPostMatch();
    if (typeof processRetirementsAndReincarnations === 'function') processRetirementsAndReincarnations();
}
