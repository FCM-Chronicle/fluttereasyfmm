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
    settings: { autoSave: false, bgm: true, bgmVolume: 50, sfxVolume: 50, immersionMode: true }, // 게임 설정 (오디오, SFX, 몰입 모드 추가)
    matchDrama: { enabled: true, intensity: 'high' }, // 골 직전 몰입 연출 (CM 스타일)
    playerRoles: {}, // [추가] 선수별 역할 데이터 초기화
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
                console.error(`[GameEventBus] '${eventName}' handler failed:`, error);
            }
        });
    }
};

// ==================== [신규] 자동 저장 시스템 ====================
window.AutoSaveSystem = {
    lastLoadedSlot: 1, // 기본값 슬롯 1

    init: function () {
        // UI 이벤트 바인딩 (설정 탭)
        const toggle = document.getElementById('autoSaveToggle');
        if (toggle) {
            // 기존 이벤트 제거를 위해 복제 후 교체
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);

            newToggle.addEventListener('change', (e) => {
                if (!gameData.settings) gameData.settings = {};
                gameData.settings.autoSave = e.target.checked;
                this.updateUI();

                // 켜는 순간 저장 한 번 실행
                if (gameData.settings.autoSave) {
                    this.triggerSave();
                }
            });
        }
        this.updateUI();
    },

    updateUI: function () {
        const toggle = document.getElementById('autoSaveToggle');
        const status = document.getElementById('autoSaveStatus');

        if (toggle && status) {
            const isEnabled = gameData.settings && gameData.settings.autoSave;
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

    triggerSave: function () {
        if (gameData.settings && gameData.settings.autoSave) {
            if (typeof window.saveToSlot === 'function') {
                console.log(`🔄 자동 저장 실행 (슬롯 ${this.lastLoadedSlot})`);
                // silent 모드로 저장 (알림창 없이)
                window.saveToSlot(this.lastLoadedSlot, true);
                this.showToast();
            }
        }
    },

    showToast: function () {
        const toast = document.createElement('div');
        toast.innerHTML = '💾 자동 저장됨';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(46, 204, 113, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            animation: fadeUp 2s ease forwards;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        // 애니메이션 스타일 추가 (중복 방지)
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.innerHTML = `
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

// 전역 헬퍼 (loadGame 등에서 호출)
window.updateAutoSaveUI = function () {
    if (window.AutoSaveSystem) {
        window.AutoSaveSystem.updateUI();
    }
};

const WORLD_CUP_FLAGS = {
    "대한민국": "🇰🇷", "일본": "🇯🇵", "중국": "🇨🇳", "호주": "🇦🇺", "사우디아라비아": "🇸🇦",
    "이란": "🇮🇷", "카타르": "🇶🇦", "우즈베키스탄": "🇺🇿", "이라크": "🇮🇶", "요르단": "🇯🇴", "UAE": "🇦🇪",
    "잉글랜드": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "프랑스": "🇫🇷", "독일": "🇩🇪", "스페인": "🇪🇸", "이탈리아": "🇮🇹",
    "네덜란드": "🇳🇱", "포르투갈": "🇵🇹", "벨기에": "🇧🇪", "크로아티아": "🇭🇷", "스위스": "🇨🇭",
    "덴마크": "🇩🇰", "오스트리아": "🇦🇹", "노르웨이": "🇳🇴", "스웨덴": "🇸🇪", "폴란드": "🇵🇱",
    "체코": "🇨🇿", "우크라이나": "🇺🇦", "스코틀랜드": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "웨일스": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "튀르키예": "🇹🇷", "루마니아": "🇷🇴",
    "브라질": "🇧🇷", "아르헨티나": "🇦🇷", "우루과이": "🇺🇾", "콜롬비아": "🇨🇴", "에콰도르": "🇪🇨",
    "파라과이": "🇵🇾", "칠레": "🇨🇱", "볼리비아": "🇧🇴", "페루": "🇵🇪",
    "미국": "🇺🇸", "멕시코": "🇲🇽", "캐나다": "🇨🇦", "파나마": "🇵🇦", "코스타리카": "🇨🇷", "아이티": "🇭🇹", "퀴라소": "🇨🇼",
    "모로코": "🇲🇦", "세네갈": "🇸🇳", "이집트": "🇪🇬", "알제리": "🇩🇿", "튀니지": "🇹🇳",
    "나이지리아": "🇳🇬", "카메룬": "🇨🇲", "가나": "🇬🇭", "코트디부아르": "🇨🇮", "남아공": "🇿🇦", "카보베르데": "🇨🇻",
    "뉴질랜드": "🇳🇿"
};

function getTeamLogoHTML(teamName) {
    if (!teamName) return '';

    // 월드컵 모드이거나 국가대표팀 국기가 존재하는 경우 국기 이모지 배지 표시
    if ((typeof gameData !== 'undefined' && gameData.isWorldCupMode) || WORLD_CUP_FLAGS[teamName]) {
        const flag = WORLD_CUP_FLAGS[teamName] || '🌐';
        return `<span class="team-logo-flag" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; font-size:1.35rem; margin-right:6px; flex-shrink:0; vertical-align:middle;">${flag}</span>`;
    }

    const team = allTeams[teamName];
    if (!team) return '';
    const code = team.logoCode || "DFT";

    // 레전드 팀
    if (teamName.startsWith("Legend_")) {
        return `<img src="assets/logo/legend/${code}.webp" class="team-logo" alt="${teamName}" onerror="this.outerHTML='<span class=\\'team-logo-fallback\\'>👑</span>'">`;
    }

    if (code === "DFT" || team.isCustom || team.isIcon || !team.league) {
        const initials = (teamNames[teamName] || teamName || 'FC').substring(0, 2).toUpperCase();
        return `<span class="team-logo-fallback" style="display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; background:linear-gradient(135deg, #ffd700, #f39c12); color:#000; border-radius:50%; font-weight:900; font-size:0.8rem; border:1px solid #ffd700; margin-right:6px; flex-shrink:0; vertical-align:middle;">${initials}</span>`;
    }

    return `<img src="assets/logo/${team.league}/${code}.webp" class="team-logo" alt="${teamName}" onerror="this.outerHTML='<span class=\\'team-logo-fallback\\' style=\\'display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; background:linear-gradient(135deg, #ffd700, #f39c12); color:#000; border-radius:50%; font-weight:900; font-size:0.8rem; border:1px solid #ffd700; margin-right:6px; flex-shrink:0; vertical-align:middle;\\'>⚽</span>'">`;
}




// 스폰서 데이터
const sponsors = [
    {
        name: "푸마",
        description: "빠르고 역동적인 스포츠 브랜드",
        payPerWin: 15,
        payPerLoss: 3,
        contractLength: 28,
        signingBonus: 80,
        requirements: { minRating: 70 }
    },
    {
        name: "나이키",
        description: "세계적인 스포츠 브랜드",
        payPerWin: 20,
        payPerLoss: 5,
        contractLength: 28,
        signingBonus: 100,
        requirements: { minRating: 75 }
    },
    {
        name: "뉴발란스",
        description: "전문성을 추구하는 스포츠 브랜드",
        payPerWin: 18,
        payPerLoss: 4,
        contractLength: 28,
        signingBonus: 120,
        requirements: { minRating: 78 }
    },
    {
        name: "아디다스",
        description: "독일의 프리미엄 스포츠 브랜드",
        payPerWin: 25,
        payPerLoss: 8,
        contractLength: 28,
        signingBonus: 150,
        requirements: { minRating: 80 }
    },
    {
        name: "넥센타이어",
        description: "한국의 타이어 브랜드",
        payPerWin: 30,
        payPerLoss: 10,
        contractLength: 28,
        signingBonus: 200,
        requirements: { minRating: 85 }
    },
    {
        name: "플라이 에미레이츠",
        description: "세계 최고의 항공사 중 하나",
        payPerWin: 40,
        payPerLoss: 15,
        contractLength: 28,
        signingBonus: 300,
        requirements: { minRating: 90 }
    },
    {
        name: "삼성",
        description: "세계 최고의 전자제품 생산 기업",
        payPerWin: 50,
        payPerLoss: 20,
        contractLength: 28,
        signingBonus: 300,
        requirements: { minRating: 98 }
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
}

// [신규] 선수 목록 클릭 핸들러
function handlePlayerListClick(e) {
    const card = e.target.closest('.player-card');
    if (!card) return;
    // 상세 정보 보기 등을 구현할 수 있음
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
    selector.style.cssText = `
        display: flex;
        justify-content: center;
        padding: 20px;
        margin-bottom: 20px;
        animation: fadeIn 0.5s ease;
    `;

    selector.innerHTML = `
        <div class="glass" style="display: flex; align-items: center; gap: 20px; padding: 10px 30px; border-radius: 50px; background: rgba(31, 31, 69, 0.9);">
            <span style="font-weight: bold; color: #ffd700;">🎮 모드 설정:</span>
            <div style="display: flex; gap: 10px;">
                <button id="btn-mode-direct" class="btn primary" style="padding: 8px 20px; font-size: 0.9rem;">다이렉트 모드</button>
                <button id="btn-mode-longtime" class="btn" style="padding: 8px 20px; font-size: 0.9rem; background: rgba(255,255,255,0.1);">롱타임 모드</button>
            </div>
        </div>
    `;

    // h1 다음에 삽입
    const h1 = screen.querySelector('h1');
    if (h1) h1.after(selector);
    else screen.prepend(selector);

    const btnDirect = document.getElementById('btn-mode-direct');
    const btnLong = document.getElementById('btn-mode-longtime');

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

    // [신규] 매치 엔진 가이드 모달
    const guideBtn = document.getElementById('openEngineGuideBtn');
    const guideModal = document.getElementById('engineGuideModal');
    const closeGuideBtn = document.getElementById('closeEngineGuideModal');

    if (guideBtn && guideModal) {
        guideBtn.addEventListener('click', () => guideModal.style.display = 'block');
        closeGuideBtn.addEventListener('click', () => guideModal.style.display = 'none');

        // 모달 바깥 클릭 시 닫기
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
    teamSelect.innerHTML = '';
    const league2Teams = Object.keys(allTeams).filter(key => allTeams[key].league === 2);
    league2Teams.forEach(teamKey => {
        const option = document.createElement('option');
        option.value = teamKey;
        option.textContent = teamNames[teamKey] || teamKey;
        teamSelect.appendChild(option);
    });

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
    listContainer.innerHTML = '';

    iconPlayersList.forEach((player, index) => {
        if (currentIconPosFilter !== "ALL" && player.position !== currentIconPosFilter) return;

        const isSelected = selectedIconIndices.has(index);
        const item = document.createElement('div');
        item.className = `icon-player-card-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="icon-player-info">
                <div class="icon-player-name">${player.name}</div>
                <div class="icon-player-meta">${player.country} · OVR 81</div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
                <span class="icon-pos-tag ${player.position}">${player.position}</span>
                <span class="check-mark" style="font-size: 1rem; ${isSelected ? '' : 'display:none;'}">✅</span>
            </div>
        `;

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
    select.innerHTML = '';

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
    container.innerHTML = '';

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
            div.innerHTML = `
                <span class="icon-pos-tag ${group.pos}">${group.pos} ${i}</span>
                <input type="text" class="custom-player-input" data-pos="${group.pos}" placeholder="선수 이름 입력" maxlength="12">
                <button type="button" class="dice-mini-btn" title="랜덤 이름 추천">🎲</button>
            `;
            const input = div.querySelector('input');
            const diceBtn = div.querySelector('.dice-mini-btn');
            diceBtn.onclick = () => randomizeSingleCustomPlayer(input, group.pos);
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

    document.getElementById('teamName').innerHTML = getTeamLogoHTML(teamKey) + ' ' + teamKey; // 로고 포함 표시

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
    if (typeof DNAManager !== 'undefined') {
        DNAManager.initialize(teams[teamKey]);
    }

    // 개인기록 시스템 초기화
    if (typeof recordsSystem !== 'undefined') {
        recordsSystem.initialize();
    }

    // 상대팀 설정 (같은 리그에서)
    setNextOpponent();

    // 스케줄이 없으면 생성
    if (!gameData.schedule) {
        generateFullSchedule();
    }

    // 로비로 이동
    showScreen('lobby');
    displayTeamPlayers();
    showScreen('lobby');
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

    // [신규] 랜덤 이벤트 트리거 (경기 전/후 등 적절한 시점에 호출 가능)
    if (typeof secretarySystem !== 'undefined') {
        // secretarySystem.triggerRandomEvent(); // 테스트용, 실제로는 경기 전후에 호출
    }
}

// 자동으로 스쿼드 채우기 함수
function autoFillSquad() {
    const teamPlayers = teams[gameData.selectedTeam];

    // 포지션별로 선수들을 분류하고 능력치 순으로 정렬
    const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
    const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
    const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
    const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);

    // 최고 능력치 선수들로 자동 배치
    if (gks.length > 0) {
        gameData.squad.gk = gks[0];
    }

    // 수비수 4명
    for (let i = 0; i < 4 && i < dfs.length; i++) {
        gameData.squad.df[i] = dfs[i];
    }

    // 미드필더 3명
    for (let i = 0; i < 3 && i < mfs.length; i++) {
        gameData.squad.mf[i] = mfs[i];
    }

    // 공격수 3명
    for (let i = 0; i < 3 && i < fws.length; i++) {
        gameData.squad.fw[i] = fws[i];
    }

    // 새 포메이션 시스템으로 화면 새로고침
    if (window.refreshFormation) {
        window.refreshFormation();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // [추가] 월드컵 모드 버튼 표시/숨김 처리
    const wcBtn = document.getElementById('worldCupBtn');
    if (wcBtn) {
        if (screenId === 'lobby') {
            // 로비 화면(게임 시작)에서는 버튼 숨기기
            wcBtn.style.display = 'none';
        } else if (screenId === 'teamSelection') {
            // 팀 선택 화면에서는 버튼 보이기
            // [수정] 레전드 모드 진행 중(팀 선택)일 때는 월드컵 버튼도 숨김
            if (typeof gameData !== 'undefined' && gameData.isLegendMode) {
                wcBtn.style.display = 'none';
            } else {
                wcBtn.style.display = 'block';
            }
        }
    }

    // [추가] 레전드 리그 버튼 표시/숨김 처리
    const legendBtn = document.getElementById('legendLeagueBtn');
    if (legendBtn) {
        if (screenId === 'lobby') {
            legendBtn.style.display = 'none';
        } else if (screenId === 'teamSelection') {
            // 레전드 모드가 활성화된 상태라면 버튼 숨김 (이미 진입했으므로)
            if (typeof gameData !== 'undefined' && gameData.isLegendMode) {
                legendBtn.style.display = 'none';
            } else {
                legendBtn.style.display = 'block';
            }
        }
    }
}

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
        // 차단된 탭: transfer, league, sponsor, youth, sns, transfer_news, mail
        const blockedTabs = ['transfer', 'league', 'sponsor', 'youth', 'sns', 'transfer_news', 'mail'];

        if (blockedTabs.includes(tabName)) {
            return;
        }

        // 'records' 탭 클릭 시 월드컵 기록 화면 표시
        if (tabName === 'records') {
            if (typeof WorldCupManager !== 'undefined') {
                WorldCupManager.renderRecordsTab();
            }
        }

        // 'callup' 탭 (이적 탭 자리에 대신 사용)
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

        // [추가] 전술 동기화 (DNA 탭에서 바뀐 전술 반영)
        const matchTacticSelect = document.getElementById('tacticSelect');
        if (matchTacticSelect) matchTacticSelect.value = gameData.currentTactic;
    }

    // 탭 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
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

        case 'chat':
            if (typeof renderChatTab === 'function') {
                renderChatTab();
            }
            break;

        case 'tactics': // 전술 탭 추가
            if (typeof DNAManager !== 'undefined') {
                console.log('🧬 Tactics tab opened, calling DNAManager.renderUI()');
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
                    feedContainer.innerHTML = '<div class="sns-empty">SNS 시스템을 초기화하는 중입니다...</div>';
                }

                // 잠시 후 다시 시도
                setTimeout(() => {
                    if (typeof snsManager !== 'undefined') {
                        snsManager.displayFeed('snsFeed', 15);
                    } else {
                        // 여전히 로드되지 않은 경우 에러 메시지
                        if (feedContainer) {
                            feedContainer.innerHTML = '<div class="sns-empty">SNS 시스템을 불러올 수 없습니다. 페이지를 새로고침해 주세요.</div>';
                        }
                    }
                }, 2000);
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
cursorStyle.textContent = `
    body.custom-cursor-active, body.custom-cursor-active * {
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

        const isEnabled = gameData.settings && gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : true;

        if (isEnabled && this.options.hideDefaultCursor) {
            document.body.classList.add('custom-cursor-active');
        }

        // [신규] 게임패드 연결 이벤트
        window.addEventListener("gamepadconnected", (e) => {
            this.gamepadIndex = e.gamepad.index;
            console.log("🎮 컨트롤러 연결됨:", e.gamepad.id);
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
                console.log("🎮 컨트롤러 연결 해제됨");
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
    const fragment = document.createDocumentFragment(); // [성능 개선] DocumentFragment 사용
    playerList.innerHTML = '';

    const teamPlayers = teams[gameData.selectedTeam];

    // [성능 개선] 스쿼드 선수 이름을 Set으로 만들어 O(1) 시간 복잡도로 조회
    const squadPlayerNames = new Set();
    if (gameData.squad.gk) squadPlayerNames.add(gameData.squad.gk.name);
    gameData.squad.df.forEach(p => p && squadPlayerNames.add(p.name));
    gameData.squad.mf.forEach(p => p && squadPlayerNames.add(p.name));
    gameData.squad.fw.forEach(p => p && squadPlayerNames.add(p.name));

    teamPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.dataset.playerName = player.name; // [성능 개선] 데이터 속성으로 선수 이름 저장

        const isUsed = squadPlayerNames.has(player.name);
        if (isUsed) {
            playerCard.classList.add('used');
        }

        const isInjured = typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, player.name);
        if (isInjured) {
            playerCard.classList.add('injured');
            const injuryInfo = injurySystem.getInjuredPlayers(gameData.selectedTeam).find(i => i.name === player.name);
            const gamesLeft = injuryInfo ? injuryInfo.gamesRemaining : '?';

            // 부상자는 체력바 대신 부상 표시
            playerCard.innerHTML = `
                <div class="player-card-content">
                    <img src="assets/players/${player.name}.webp" class="player-card-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
                    <div class="player-info-text">
                        <div class="name">${player.name}</div>
                        <div class="details">
                            <div>${player.position} | ★${Math.floor(player.rating)}</div>
                            <div style="color: #e74c3c; font-weight: bold; font-size: 0.8rem;">🚑 부상중 (${gamesLeft}경기)</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // [신규] 체력바 추가
            const condition = (player.condition !== undefined) ? player.condition : 100;
            let condColor = '#2ecc71';
            if (condition < 70) condColor = '#e74c3c';
            else if (condition < 90) condColor = '#f1c40f';

            playerCard.innerHTML = `
                <div class="player-card-content">
                    <img src="assets/players/${player.name}.webp" class="player-card-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
                    <div class="player-info-text">
                        <div class="name">${player.name}</div>
                        <div class="details">
                            <div>${player.position} | ★${Math.floor(player.rating)}</div>
                            <div class="player-list-condition" style="width: 100%; height: 4px; background: rgba(255,255,255,0.2); margin-top: 4px; border-radius: 2px;">
                                <div style="width: ${condition}%; height: 100%; background: ${condColor}; border-radius: 2px;"></div>
                            </div>
                            ${isUsed ? '<div style="color: #ffd700; font-size: 0.8rem;">★ 출전 중</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
        fragment.appendChild(playerCard);
    });

    playerList.appendChild(fragment); // [성능 개선] 한 번에 DOM에 추가
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

    modalPlayerList.innerHTML = '';

    const teamPlayers = teams[gameData.selectedTeam];
    const filteredPlayers = teamPlayers.filter(player =>
        !isPlayerInSquad(player)
    );

    if (filteredPlayers.length === 0) {
        modalPlayerList.innerHTML = '<p>배치 가능한 선수가 없습니다.</p>';
        modal.style.display = 'block';
    } else {
        filteredPlayers.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            playerCard.innerHTML = `
                <div class="name">${player.name}</div>
                <div class="details">능력치: ${player.rating} | 나이: ${player.age}</div>
            `;

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

    // ✅ 이 3줄만 추가
    if (typeof refreshFormation === 'function') {
        refreshFormation();
        return;
    }

    // GK 업데이트
    const gkSlot = document.getElementById('gk-slot');
    if (gameData.squad.gk) {
        gkSlot.innerHTML = `
            <div>${gameData.squad.gk.name}</div>
            <div>${Math.floor(gameData.squad.gk.rating)}</div>
        `;
        gkSlot.classList.add('filled');
    } else {
        gkSlot.innerHTML = 'GK';
        gkSlot.classList.remove('filled');
    }

    // DF 업데이트
    for (let i = 0; i < 4; i++) {
        const dfSlot = document.querySelector(`.df-${i + 1} .player-slot`);
        if (gameData.squad.df[i]) {
            dfSlot.innerHTML = `
                <div>${gameData.squad.df[i].name}</div>
                <div>${Math.floor(gameData.squad.df[i].rating)}</div>
            `;
            dfSlot.classList.add('filled');
        } else {
            dfSlot.innerHTML = 'DF';
            dfSlot.classList.remove('filled');
        }
    }

    // MF 업데이트
    for (let i = 0; i < 3; i++) {
        const mfSlot = document.querySelector(`.mf-${i + 1} .player-slot`);
        if (gameData.squad.mf[i]) {
            mfSlot.innerHTML = `
                <div>${gameData.squad.mf[i].name}</div>
                <div>${Math.floor(gameData.squad.mf[i].rating)}</div>
            `;
            mfSlot.classList.add('filled');
        } else {
            mfSlot.innerHTML = 'MF';
            mfSlot.classList.remove('filled');
        }
    }

    // FW 업데이트
    for (let i = 0; i < 3; i++) {
        const fwSlot = document.querySelector(`.fw-${i + 1} .player-slot`);
        if (gameData.squad.fw[i]) {
            fwSlot.innerHTML = `
                <div>${gameData.squad.fw[i].name}</div>
                <div>${Math.floor(gameData.squad.fw[i].rating)}</div>
            `;
            fwSlot.classList.add('filled');
        } else {
            fwSlot.innerHTML = 'FW';
            fwSlot.classList.remove('filled');
        }
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

    if (typeof gameData.wageBudget !== 'number' || gameData.wageBudget <= 0) {
        gameData.wageBudget = gameData.totalWeeklyWage || 0;
    }

    updateFinanceDisplay();
}

function updateFinanceDisplay() {
    const wageBudgetEl = document.getElementById('wageBudget');
    if (wageBudgetEl) wageBudgetEl.textContent = gameData.wageBudget + '억';
}

function convertTransferToWageBudget(amount) {
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value <= 0) return { success: false, message: '유효한 금액이 아닙니다.' };
    if (gameData.teamMoney < value) return { success: false, message: '이적 자금이 부족합니다.' };

    gameData.teamMoney -= value;
    gameData.wageBudget += value / 12;
    if (typeof updateDisplay === 'function') updateDisplay();
    updateFinanceDisplay();
    return { success: true, message: `${value}억 이적 자금을 주급 자금 ${parseFloat((value / 12).toFixed(2))}억으로 전환했습니다.` };
}

function convertWageToTransferBudget(amount) {
    const value = Math.round(Number(amount));
    if (!Number.isFinite(value) || value <= 0) return { success: false, message: '유효한 금액이 아닙니다.' };
    if (gameData.wageBudget < value) return { success: false, message: '주급 자금이 부족합니다.' };

    gameData.wageBudget -= value;
    gameData.teamMoney += value * 12;
    if (typeof updateDisplay === 'function') updateDisplay();
    updateFinanceDisplay();
    return { success: true, message: `${value}억 주급 자금을 이적 자금 ${value * 12}억으로 전환했습니다.` };
}

function promptBudgetConversion(direction) {
    const amountText = window.prompt(
        direction === 'transferToWage'
            ? `이적 자금을 주급 자금으로 바꿀 금액을 입력하세요.\n(1억 이적 자금 -> 1/12억 주급 자금)`
            : `주급 자금을 이적 자금으로 바꿀 금액을 입력하세요.\n(1억 주급 자금 -> 12억 이적 자금)`
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
    document.getElementById('currentSponsor').textContent =
        gameData.currentSponsor ? gameData.currentSponsor.name : '없음';

    // [신규] 주급 표시 업데이트 (HTML에 totalWages ID가 있다고 가정)
    const wageEl = document.getElementById('totalWages');
    if (wageEl) wageEl.textContent = gameData.totalWeeklyWage + '억';
    updateFinanceDisplay();

    if (gameData.currentOpponent) {
        document.getElementById('opponentName').innerHTML =
            getTeamLogoHTML(gameData.currentOpponent) + ' ' + teamNames[gameData.currentOpponent];
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

    gameData.schedule = {};
    for (let i = 1; i <= 3; i++) {
        const leagueTeams = Object.keys(allTeams).filter(key => allTeams[key] && allTeams[key].league === i);
        // 팀 목록 랜덤 셔플
        leagueTeams.sort(() => Math.random() - 0.5);
        gameData.schedule[`division${i}`] = generateLeagueSchedule(leagueTeams);
    }
    gameData.currentRound = 1;
    console.log("📅 새 시즌 스케줄 생성 완료");
}

function setNextOpponent() {
    if (!gameData.schedule) {
        generateFullSchedule();
    }

    const currentLeagueKey = `division${gameData.currentLeague}`;
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

    console.log('✅ 리그 데이터 및 테이블 완전 초기화 완료');
}

function displayLeagueTable() {
    const leagueTable = document.getElementById('leagueTable');

    // 현재 리그 확인
    const currentLeague = gameData.currentLeague;
    const divisionKey = `division${currentLeague}`;

    // 해당 리그 데이터 존재 여부 확인
    if (!gameData.leagueData || !gameData.leagueData[divisionKey]) {
        leagueTable.innerHTML = '<p>리그 데이터를 불러올 수 없습니다.</p>';
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

    let tableHTML = `
    <table class='league-table'>
        <thead>
            <tr>
                <th>순위</th>
                <th>팀</th>
                <th>경기</th>
                <th>승</th>
                <th>무</th>
                <th>패</th>
                <th>득점</th>
                <th>실점</th>
                <th>득실차</th>
                <th>승점</th>
            </tr>
        </thead>
        <tbody>
`;

    standings.forEach((team, index) => {
        const isUserTeam = team.team === gameData.selectedTeam;
        tableHTML += `
            <tr class="${isUserTeam ? 'user-team' : ''}">
                <td>${index + 1}</td>
                <td>${getTeamLogoHTML(team.team)} ${teamNames[team.team]}</td>
                <td>${team.matches}</td>
                <td>${team.wins}</td>
                <td>${team.draws}</td>
                <td>${team.losses}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td>${team.goalDiff > 0 ? '+' : ''}${team.goalDiff}</td>
                <td>${team.points}</td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    leagueTable.innerHTML = tableHTML;
}

// 스폰서 계약 체결 시 (기존 displaySponsors 함수 수정)
function displaySponsors() {
    const sponsorList = document.getElementById('sponsorList');
    sponsorList.innerHTML = '';

    const teamRating = calculateTeamRating();

    sponsors.forEach(sponsor => {
        const sponsorCard = document.createElement('div');
        const isAvailable = teamRating >= sponsor.requirements.minRating;
        const isContracted = gameData.currentSponsor && gameData.currentSponsor.name === sponsor.name;

        let cardClass = 'sponsor-card';
        if (isContracted) {
            cardClass += ' contracted';
        } else if (isAvailable && !gameData.currentSponsor) {
            cardClass += ' available';
        } else {
            cardClass += ' unavailable';
        }

        sponsorCard.className = cardClass;

        // 계약 중인 경우 남은 경기 수 표시
        let contractInfo = '';
        if (isContracted && gameData.sponsorRemainingMatches) {
            contractInfo = `<div style="color: #f39c12; font-weight: bold; margin-top: 10px;">남은 계약: ${gameData.sponsorRemainingMatches}경기</div>`;
        }

        sponsorCard.innerHTML = `
            <h4>${sponsor.name}</h4>
            <p>${sponsor.description}</p>
            <div class="sponsor-details">
                <div class="sponsor-detail">
                    <strong>승리당:</strong> ${sponsor.payPerWin}억
                </div>
                <div class="sponsor-detail">
                    <strong>패배당:</strong> ${sponsor.payPerLoss}억
                </div>
                <div class="sponsor-detail">
                    <strong>계약금:</strong> ${sponsor.signingBonus}억
                </div>
                <div class="sponsor-detail">
                    <strong>기간:</strong> ${sponsor.contractLength}경기
                </div>
            </div>
            <div class="sponsor-requirements">
                <strong>요구 능력치:</strong> ${sponsor.requirements.minRating} 
                <span style="color: ${teamRating >= sponsor.requirements.minRating ? '#2ecc71' : '#e74c3c'};">
                    (현재: ${teamRating.toFixed(1)})
                </span>
            </div>
            ${isContracted ? '<div style="color: #2ecc71; font-weight: bold; margin-top: 10px;">✓ 계약 중</div>' : ''}
            ${contractInfo}
        `;

        if (isAvailable && !gameData.currentSponsor) {
            sponsorCard.addEventListener('click', () => {
                // 계약 체결
                gameData.currentSponsor = sponsor;
                gameData.sponsorRemainingMatches = sponsor.contractLength; // 남은 경기 수 설정
                gameData.teamMoney += sponsor.signingBonus;

                updateDisplay();
                displaySponsors();
                alert(`${sponsor.name}와 계약을 체결했습니다! 계약금 ${sponsor.signingBonus}억을 받았습니다.`);

                // 스폰서 계약 메일 발송
                if (typeof mailManager !== 'undefined') {
                    mailManager.sendSponsorMail(sponsor);
                }
            });
        }

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
        console.log(`✅ 승리 - 사기 +${gain} (현재 ${gameData.teamMorale})`);
    } else if (matchResult === 'draw') {
        gameData.losingStreak = 0;
        const drop = 1 + Math.floor(Math.random() * 2); // -1 ~ -2
        gameData.teamMorale = Math.max(0, curMorale - drop);
        console.log(`🤝 무승부 - 사기 -${drop} (현재 ${gameData.teamMorale})`);
    } else if (matchResult === 'loss') {
        gameData.losingStreak++;
        // 연패 누적될수록 더 크게 떨어뜨림: 기본 -4 + 연패*2 (연패1=-6, 연패2=-8, 연패3=-10 ...)
        const baseDrop = 4 + (gameData.losingStreak * 2);
        const drop = baseDrop + Math.floor(Math.random() * 3);
        gameData.teamMorale = Math.max(0, curMorale - drop);
        console.log(`❌ 패배 (${gameData.losingStreak}연패) - 사기 -${drop} (현재 ${gameData.teamMorale})`);
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


// [신규] 불러오기 후 스쿼드 선수 객체 재연결 (Re-linking)
// 저장된 스쿼드의 선수 객체는 복사본이므로, 실제 teams의 선수 객체와 연결해줘야 함
function relinkSquadPlayers() {
    if (!gameData.squad || !gameData.selectedTeam || !teams[gameData.selectedTeam]) return;

    const teamPlayers = teams[gameData.selectedTeam];

    const findRealPlayer = (savedPlayer) => {
        if (!savedPlayer) return null;
        // 이름과 포지션으로 실제 선수 객체 찾기
        return teamPlayers.find(p => p.name === savedPlayer.name && p.position === savedPlayer.position) || savedPlayer;
    };

    if (gameData.squad.gk) gameData.squad.gk = findRealPlayer(gameData.squad.gk);
    gameData.squad.df = gameData.squad.df.map(p => findRealPlayer(p));
    gameData.squad.mf = gameData.squad.mf.map(p => findRealPlayer(p));
    gameData.squad.fw = gameData.squad.fw.map(p => findRealPlayer(p));

    console.log('✅ 스쿼드 선수 객체 재연결 완료');
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
        console.log('✅ teams 데이터를 allTeams에 동기화 완료 (AI 성장 반영)');
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

        const saveData = {
            gameData: gameData,
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
            if (!gameData.playerRoles) gameData.playerRoles = {}; // [추가] 구버전 세이브 호환성 보장
            if (!gameData.mentoringPairs) gameData.mentoringPairs = []; // [추가] 멘토링 세이브 호환성 보장
            if (typeof gameData.wageBudget !== 'number') {
                gameData.wageBudget = gameData.totalWeeklyWage || 0;
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
            document.getElementById('teamName').innerHTML = getTeamLogoHTML(gameData.selectedTeam) + ' ' + teamNames[gameData.selectedTeam];
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
            if (window.autoSaveSystem) {
                window.autoSaveSystem.hookMoney();
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

    container.innerHTML = '';
    let hasSave = false;

    for (let i = 1; i <= 3; i++) {
        const slotInfo = getSlotInfo(i);
        if (slotInfo) {
            hasSave = true;
            const slotDiv = document.createElement('div');
            slotDiv.className = 'main-load-slot';
            slotDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
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

            slotDiv.innerHTML = `
                <div style="font-size: 2rem;">💾</div>
                <div style="flex: 1;">
                    <div style="color: #ffd700; font-weight: bold; font-size: 1.1rem;">${slotInfo.teamName}</div>
                    <div style="font-size: 0.85rem; color: #ccc;">
                        시즌 ${slotInfo.season} | ${slotInfo.matchesPlayed}경기 진행<br>
                        <span style="color: #aaa;">${new Date(slotInfo.timestamp).toLocaleDateString()} 저장됨</span>
                    </div>
                </div>
                <div style="font-size: 1.5rem; color: #2ecc71;">▶</div>
            `;

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
    opponentEl.innerHTML = '';

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
            opponentEl.innerHTML = `VS <span style="color:#ffd700;">${oppName}</span>`;
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

// [신규] 메인 화면에 저장된 슬롯 렌더링
function renderMainSaveSlots() {
    const container = document.getElementById('mainLoadSlots');
    const section = document.getElementById('mainLoadSection');
    if (!container || !section) return;

    container.innerHTML = '';
    let hasSave = false;

    for (let i = 1; i <= 3; i++) {
        const slotInfo = getSlotInfo(i);
        if (slotInfo) {
            hasSave = true;
            const slotDiv = document.createElement('div');
            slotDiv.className = 'main-load-slot';
            slotDiv.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
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

            slotDiv.innerHTML = `
                <div style="font-size: 2rem;">💾</div>
                <div style="flex: 1;">
                    <div style="color: #ffd700; font-weight: bold; font-size: 1.1rem;">${slotInfo.teamName}</div>
                    <div style="font-size: 0.85rem; color: #ccc;">
                        시즌 ${slotInfo.season} | ${slotInfo.matchesPlayed}경기 진행<br>
                        <span style="color: #aaa;">${new Date(slotInfo.timestamp).toLocaleDateString()} 저장됨</span>
                    </div>
                </div>
                <div style="font-size: 1.5rem; color: #2ecc71;">▶</div>
            `;

            slotDiv.onclick = () => loadFromSlot(i);
            container.appendChild(slotDiv);
        }
    }

    section.style.display = hasSave ? 'block' : 'none';
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

// 전술 정보 버튼 이벤트 리스너 추가
document.getElementById('showTacticsBtn').addEventListener('click', showTacticsInfo);
document.getElementById('showTeamTacticsBtn').addEventListener('click', showTeamTacticsInfo);

// 전술 상성표 표시 함수
function showTacticsInfo() {
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

    document.getElementById('tacticsModalTitle').textContent = '🎯 전술 상성표';

    let content = '<div style="max-height: 500px; overflow-y: auto;">';

    Object.entries(tactics).forEach(([key, tactic]) => {
        content += `
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 15px;">
                <h4 style="color: #ffd700; font-size: 1.3rem; margin-bottom: 10px;">【${tactic.name}】</h4>
                <p style="margin-bottom: 15px; line-height: 1.4; opacity: 0.9;">📖 ${tactic.description}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: rgba(46, 204, 113, 0.2); padding: 10px; border-radius: 8px; border-left: 3px solid #2ecc71;">
                        <strong style="color: #2ecc71;">✅ 효과적 vs:</strong><br>
                        ${tactic.effective.map(t => tactics[t].name).join('<br>')}
                    </div>
                    <div style="background: rgba(231, 76, 60, 0.2); padding: 10px; border-radius: 8px; border-left: 3px solid #e74c3c;">
                        <strong style="color: #e74c3c;">❌ 비효과적 vs:</strong><br>
                        ${tactic.ineffective.map(t => tactics[t].name).join('<br>')}
                    </div>
                </div>
            </div>
        `;
    });

    content += `
        <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 10px; padding: 15px; margin-top: 20px; text-align: center;">
            <strong style="color: #ffd700;">💡 팁: 상대팀의 전술을 파악하고 유리한 전술을 선택하세요(비효과적 vs라는 건 상대가 그 전술일때 비효과적이라는 뜻)<strong>
        </div>
    </div>`;

    document.getElementById('tacticsModalContent').innerHTML = content;
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
        tacticGroups[tacticKey].push(teamNames[teamKey]);
    });

    let content = '<div style="max-height: 500px; overflow-y: auto;">';
    Object.entries(tacticGroups).forEach(([tacticKey, teams]) => {
        content += `
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 20px; margin-bottom: 15px;">
                <h4 style="color: #ffd700; font-size: 1.3rem; margin-bottom: 15px; display: flex; align-items: center;">
                    🎯 ${tacticNames[tacticKey]}
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    ${teams.map(team =>
            '<div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 255, 255, 0.2);">' +
            team +
            '</div>'
        ).join('')}
                </div>
            </div>
        `;
    });

    content += `
        <div style="background: rgba(255, 215, 0, 0.1); border: 1px solid rgba(255, 215, 0, 0.3); border-radius: 10px; padding: 15px; margin-top: 20px; text-align: center;">
            <strong style="color: #ffd700;">💡 경기 전에 상대팀의 전술을 확인하고 대응 전술을 준비하세요!</strong>
        </div>
    </div>`;

    document.getElementById('tacticsModalContent').innerHTML = content;
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
    const savedData = localStorage.getItem(saveKey);
    if (!savedData) return null;

    try {
        const data = JSON.parse(savedData);
        const selectedTeam = data.gameData.selectedTeam;
        const currentLeague = data.gameData.currentLeague;

        // 팀 순위 계산
        let teamRank = '-';
        const divisionKey = `division${currentLeague}`;

        if (data.gameData.leagueData && data.gameData.leagueData[divisionKey]) {
            const standings = Object.keys(data.gameData.leagueData[divisionKey]).map(teamKey => ({
                team: teamKey,
                ...data.gameData.leagueData[divisionKey][teamKey],
                goalDiff: data.gameData.leagueData[divisionKey][teamKey].goalsFor - data.gameData.leagueData[divisionKey][teamKey].goalsAgainst
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

    container.innerHTML = '';

    for (let i = 1; i <= 3; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'save-slot';
        slotDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const slotInfo = getSlotInfo(i);

        let infoHTML = '';
        if (slotInfo) {
            const date = new Date(slotInfo.timestamp);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

            infoHTML = `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px;">
                    <div style="color: #ffd700; font-weight: bold; font-size: 1.1rem; margin-bottom: 5px;">
                        ${slotInfo.teamName}
                    </div>
                    <div style="font-size: 0.9rem; opacity: 0.9;">
                        📅 ${formattedDate}<br>
                        🏆 시즌 ${slotInfo.season} | ${slotInfo.league}부 리그 ${slotInfo.rank}위<br>
                        ⚽ 경기 수: ${slotInfo.matchesPlayed}<br>
                        💰 자금: ${slotInfo.money}억<br>
                        🎯 다음 상대: ${slotInfo.nextOpponent}
                    </div>
                </div>
            `;
        } else {
            infoHTML = `
                <div style="text-align: center; padding: 20px; opacity: 0.5;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📁</div>
                    <div>비어있는 슬롯</div>
                </div>
            `;
        }

        slotDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #ffd700;">슬롯 ${i}</h4>
                ${slotInfo ? '<span style="color: #2ecc71; font-size: 0.9rem;">✓ 저장됨</span>' : '<span style="color: #95a5a6; font-size: 0.9rem;">빈 슬롯</span>'}
            </div>
            ${infoHTML}
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn" onclick="saveToSlot(${i})" style="padding: 8px;">
                    💾 저장
                </button>
                <button class="btn" onclick="loadFromSlot(${i})" style="padding: 8px;" ${!slotInfo ? 'disabled' : ''}>
                    📁 불러오기
                </button>
            </div>
            <button class="btn" onclick="deleteSlot(${i})" style="background: #e74c3c; padding: 8px;" ${!slotInfo ? 'disabled' : ''}>
                🗑️ 이 슬롯 삭제
            </button>
        `;

        container.appendChild(slotDiv);
    }
}

// 특정 슬롯에 저장
function saveToSlot(slotNumber, silent = false) {
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
                return;
            }
        }

        // [수정] 이적 시장 데이터 저장 (gameData에 통합)
        if (typeof transferSystem !== 'undefined') {
            gameData.transferSystemData = transferSystem.getSaveData();
        }

        // Records System에서 모든 득점/도움 데이터 수집
        const recordsData = {};

        if (typeof leagueBasedRecordsSystem !== 'undefined') {
            recordsData.recordsSystemData = leagueBasedRecordsSystem.getSaveData();
            recordsData.topScorersAll = leagueBasedRecordsSystem.getTopScorers(20);
            recordsData.topAssistersAll = leagueBasedRecordsSystem.getTopAssisters(20);

            recordsData.leagueTopScorers = {};
            recordsData.leagueTopAssisters = {};

            for (let league = 1; league <= 3; league++) {
                recordsData.leagueTopScorers[league] = leagueBasedRecordsSystem.getTopScorersByLeague(league, 10);
                recordsData.leagueTopAssisters[league] = leagueBasedRecordsSystem.getTopAssistersByLeague(league, 10);
            }
        }

        const saveData = {
            gameData: gameData,
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
        
        // 로컬스토리지에 저장
        localStorage.setItem(saveKey, JSON.stringify(saveData));

        if (!silent) {
            console.log(`슬롯 ${slotNumber}에 저장 완료`);
            alert(`슬롯 ${slotNumber}에 게임이 저장되었습니다!`);
        }

        // 슬롯 UI 새로고침
        createSaveSlots();

    } catch (error) {
        console.error(`슬롯 ${slotNumber} 저장 중 오류:`, error);

        // 용량 초과 에러 처리
        if (error.name === 'QuotaExceededError') {
            alert('브라우저 저장 공간이 부족합니다. 다른 슬롯을 삭제하거나 파일 저장을 이용해주세요.');
        } else {
            alert('저장 중 오류가 발생했습니다.');
        }
    }
}

// 특정 슬롯에서 불러오기
function loadFromSlot(slotNumber, overrideManagerId = null) {
    try {
        const managerId = overrideManagerId || gameData.managerId;
        const saveKey = managerId ? `fm_save_${managerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
        const savedData = localStorage.getItem(saveKey);

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
        if (!gameData.playerRoles) gameData.playerRoles = {};
        if (!gameData.mentoringPairs) gameData.mentoringPairs = [];
        if (typeof gameData.wageBudget !== 'number') {
            gameData.wageBudget = gameData.totalWeeklyWage || 0;
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
        document.getElementById('teamName').innerHTML = getTeamLogoHTML(gameData.selectedTeam) + ' ' + teamNames[gameData.selectedTeam];
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
        }

        // gameData 객체가 교체되었으므로 자동 저장 감지기 재설정
        if (window.autoSaveSystem) {
            window.autoSaveSystem.hookMoney();
        }

        // 자동 저장 UI 업데이트 (설정 복원)
        if (typeof window.updateAutoSaveUI === 'function') {
            window.updateAutoSaveUI();
        }

    } catch (error) {
        console.error(`슬롯 ${slotNumber} 불러오기 에러:`, error);
        alert('저장 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 특정 슬롯 삭제
function deleteSlot(slotNumber) {
    const slotInfo = getSlotInfo(slotNumber);

    if (!slotInfo) {
        alert(`슬롯 ${slotNumber}은(는) 이미 비어있습니다.`);
        return;
    }

    const confirmMessage = `슬롯 ${slotNumber}을(를) 삭제하시겠습니까?\n\n팀: ${slotInfo.teamName}\n경기 수: ${slotInfo.matchesPlayed}\n\n이 작업은 되돌릴 수 없습니다.`;

    if (confirm(confirmMessage)) {
        const managerId = gameData.managerId;
        const saveKey = managerId ? `fm_save_${managerId}_slot${slotNumber}` : `footballManagerSave_slot${slotNumber}`;
        localStorage.removeItem(saveKey);
        alert(`슬롯 ${slotNumber}이(가) 삭제되었습니다.`);

        // 슬롯 UI 새로고침
        createSaveSlots();
        if (typeof managerSystem !== 'undefined' && managerId) {
            managerSystem.renderSaveSlotsForManager(managerId);
        }
    }
}

// ==================== 유스 & 환생 시스템 ====================

// 유스팀 선수 표시
function displayYouthPlayers() {
    const container = document.getElementById('youthPlayerList');
    const fragment = document.createDocumentFragment(); // [성능 개선]
    container.innerHTML = '';
    console.log('🔄 displayYouthPlayers 호출됨. 현재 gameData.youthSquad:', gameData.youthSquad);

    if (gameData.youthSquad.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px;">현재 유스팀에 소속된 선수가 없습니다.</p>';
        return;
    }

    gameData.youthSquad.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.dataset.playerName = player.name; // [성능 개선] 데이터 속성 추가

        playerCard.innerHTML = `
            <div class="player-card-content">
                <img src="assets/players/${player.name}.webp" class="player-card-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
                <div class="player-info-text">
                    <div class="name">${player.name}</div>
                    <div class="details">
                        <div>${player.position} | 능력치: ${player.rating} | 나이: ${player.age}</div>
                        <div style="color: #2ecc71; font-size: 0.8rem;">유망주</div>
                    </div>
                </div>
            </div>
        `;
        playerCard.addEventListener('click', () => {
            // 콜업 로직으로 변경
            if (teams[gameData.selectedTeam].length >= 50) {
                alert('팀 인원이 가득 찼습니다! (최대 50명)\n기존 선수를 방출해야 콜업할 수 있습니다.');
                return;
            }

            if (confirm(`${player.name} 선수를 1군으로 콜업하시겠습니까?`)) {
                // 1. 1군에 선수 추가
                teams[gameData.selectedTeam].push(player);

                // 2. 유스팀에서 선수 제거
                gameData.youthSquad = gameData.youthSquad.filter(p => p.name !== player.name);

                // 3. 선수에게 성장 포텐셜 부여
                if (typeof playerGrowthSystem !== 'undefined') {
                    const potentialGranted = playerGrowthSystem.grantPotentialToPlayer(player);
                    if (potentialGranted) {
                        alert(`${player.name} 선수가 1군으로 콜업되었으며, 성장 시스템이 적용되었습니다!`);
                    } else {
                        alert(`${player.name} 선수가 1군으로 콜업되었습니다.`);
                    }
                }

                // 4. UI 새로고침
                displayYouthPlayers();
                displayTeamPlayers();
            }
        });
        fragment.appendChild(playerCard);
    });
    container.appendChild(fragment); // [성능 개선]
}

// 은퇴 및 환생 처리
function processRetirementsAndReincarnations() {
    console.log("🔄 은퇴 및 환생 시스템 작동...");
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
            console.log(`⏳ 라운드 진행 - 사기 자연 감소 -${naturalDrop} (현재 ${gameData.teamMorale})`);
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

            console.log(`🔀 BGM 플레이리스트가 ${newMode} 모드로 변경되었습니다.`);

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
        console.log("🔀 BGM 플레이리스트가 셔플되었습니다.");
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
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 12px 20px;
            border-radius: 30px;
            z-index: 10000;
            display: none;
            align-items: center;
            gap: 10px;
            font-size: 0.95rem;
            font-weight: 500;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: opacity 0.5s ease, transform 0.5s ease;
            opacity: 0;
            transform: translateY(-20px);
            pointer-events: none;
        `;

        const text = document.createElement('span');
        text.id = 'nowPlayingText';

        container.appendChild(text);
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

        this.nowPlayingText.textContent = `🎵 ${cleanName}`;

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
function renderAudioSettings() {
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;

    let audioContainer = document.getElementById('audioSettings');
    if (!audioContainer) {
        // ... (기존 코드 유지)
        audioContainer = document.createElement('div');
        audioContainer.id = 'audioSettings';
        audioContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // 설정 콘텐츠 영역(.settings-content)의 맨 위에 추가
        const settingsContent = settingsTab.querySelector('.settings-content');
        if (settingsContent) {
            settingsContent.insertBefore(audioContainer, settingsContent.firstChild);
        } else {
            settingsTab.appendChild(audioContainer);
        }
    }

    const isBgmOn = gameData.settings ? gameData.settings.bgm !== false : true;
    const volume = gameData.settings && gameData.settings.bgmVolume !== undefined ? gameData.settings.bgmVolume : 50;
    const sfxVolume = gameData.settings && gameData.settings.sfxVolume !== undefined ? gameData.settings.sfxVolume : 50;

    audioContainer.innerHTML = `
        <h4 style="color: #ffd700; margin-top: 0; margin-bottom: 15px;">🎵 배경음악 설정</h4>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <label class="switch">
                <input type="checkbox" id="bgmToggle" ${isBgmOn ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <span id="bgmStatusText">배경음악 ${isBgmOn ? 'ON' : 'OFF'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>BGM 볼륨:</span>
            <input type="range" id="bgmVolume" min="0" max="100" value="${volume}" style="flex-grow: 1; cursor: pointer;">
            <span id="bgmVolumeValue" style="width: 40px; text-align: right;">${volume}%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
            <span>SFX 볼륨:</span>
            <input type="range" id="sfxVolume" min="0" max="100" value="${sfxVolume}" style="flex-grow: 1; cursor: pointer;">
            <span id="sfxVolumeValue" style="width: 40px; text-align: right;">${sfxVolume}%</span>
        </div>
    `;

    // 기존에 JS로 주입하던 스타일 제거 (index.html의 CSS로 통합)
    const oldStyle = document.getElementById('audioStyles');
    if (oldStyle) oldStyle.remove();

    // 이벤트 리스너
    const bgmToggle = document.getElementById('bgmToggle');
    const bgmVolume = document.getElementById('bgmVolume');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    const bgmStatusText = document.getElementById('bgmStatusText');
    const sfxVolumeInput = document.getElementById('sfxVolume'); // Changed name to avoid conflict
    const sfxVolumeValue = document.getElementById('sfxVolumeValue');

    bgmToggle.addEventListener('change', (e) => {
        const isOn = e.target.checked;
        audioManager.toggleBgm(isOn);
        bgmStatusText.textContent = `배경음악 ${isOn ? 'ON' : 'OFF'}`;
    });
    // Initial play attempt for BGM (due to browser autoplay policies)
    if (isBgmOn) {
        audioManager.play();
    }

    bgmVolume.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        bgmVolumeValue.textContent = `${val}%`;
        audioManager.setVolume(val);
    });

    sfxVolumeInput.addEventListener('input', (e) => { // Use sfxVolumeInput
        const val = parseInt(e.target.value);
        sfxVolumeValue.textContent = `${val}%`;
        audioManager.setSfxVolume(val);
    });
}
window.renderAudioSettings = renderAudioSettings;

// 일반 설정 UI 렌더링
function renderGeneralSettings() {
    const settingsTab = document.getElementById('settings');
    if (!settingsTab) return;

    let generalContainer = document.getElementById('generalSettings');
    if (!generalContainer) {
        generalContainer = document.createElement('div');
        generalContainer.id = 'generalSettings';
        generalContainer.style.cssText = `
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        const settingsContent = settingsTab.querySelector('.settings-content');
        if (settingsContent) {
            const audioSettings = document.getElementById('audioSettings');
            if (audioSettings && audioSettings.parentNode === settingsContent) {
                settingsContent.insertBefore(generalContainer, audioSettings.nextSibling);
            } else {
                settingsContent.insertBefore(generalContainer, settingsContent.firstChild);
            }
        } else {
            settingsTab.appendChild(generalContainer);
        }
    }

    const isCustomCursorOn = gameData.settings && gameData.settings.customCursor !== undefined ? gameData.settings.customCursor : true;

    generalContainer.innerHTML = `
        <h4 style="color: #ffd700; margin-top: 0; margin-bottom: 15px;">⚙️ 일반 설정</h4>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <label class="switch">
                <input type="checkbox" id="cursorToggle" ${isCustomCursorOn ? 'checked' : ''}>
                <span class="slider round"></span>
            </label>
            <span id="cursorStatusText">마우스 스타일 ${isCustomCursorOn ? 'ON' : 'OFF'} (커스텀 커서)</span>
        </div>
        <button class="btn" id="replayTutorialBtn" style="width: 100%; margin-bottom: 10px;">튜토리얼 다시 보기</button>
        <button class="btn" onclick="openDatabaseModal()" style="width: 100%; background: linear-gradient(45deg, #3498db, #2980b9);">📚 데이터베이스 열람</button>
    `;

    document.getElementById('replayTutorialBtn').addEventListener('click', () => {
        if (window.tutorialSystem) {
            window.tutorialSystem.currentStep = 0;
            window.tutorialSystem.showTutorial();
        } else {
            alert('튜토리얼을 실행할 수 없습니다.');
        }
    });

    const cursorToggle = document.getElementById('cursorToggle');
    const cursorStatusText = document.getElementById('cursorStatusText');
    if (cursorToggle) {
        cursorToggle.addEventListener('change', (e) => {
            const isOn = e.target.checked;
            if (window.customCursorInstance) {
                window.customCursorInstance.toggle(isOn);
            }
            cursorStatusText.textContent = `마우스 스타일 ${isOn ? 'ON' : 'OFF'} (커스텀 커서)`;
            if (gameData.settings) {
                setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
            }
        });
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
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; height: 80vh; display: flex; flex-direction: column; background: #2c3e50; color: white;">
                <span class="close" onclick="document.getElementById('databaseModal').style.display='none'" style="color: white; align-self: flex-end; cursor: pointer; font-size: 28px;">&times;</span>
                <h3 id="dbModalTitle" style="text-align: center; color: #ffd700; margin-bottom: 20px; margin-top: 0;">데이터베이스</h3>
                <div id="dbModalContent" style="flex: 1; overflow-y: auto; padding: 10px;"></div>
                <div id="dbModalControls" style="margin-top: 15px; text-align: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <button id="dbBackBtn" class="btn" style="display: none; background: #7f8c8d;">⬅️ 뒤로가기</button>
                </div>
            </div>
        `;
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

    modal.dataset.view = 'leagues';
    backBtn.style.display = 'none';
    title.textContent = '리그 선택';

    content.innerHTML = `
        <div style="display: grid; gap: 15px;">
            <button class="btn" onclick="renderDatabaseTeams(1)" style="padding: 20px; font-size: 1.2rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">🏆 1부 리그</button>
            <button class="btn" onclick="renderDatabaseTeams(2)" style="padding: 20px; font-size: 1.2rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">⚽ 2부 리그</button>
            <button class="btn" onclick="renderDatabaseTeams(3)" style="padding: 20px; font-size: 1.2rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">🌟 3부 리그</button>
        </div>
    `;
}

function renderDatabaseTeams(league) {
    const modal = document.getElementById('databaseModal');
    const content = document.getElementById('dbModalContent');
    const backBtn = document.getElementById('dbBackBtn');
    const title = document.getElementById('dbModalTitle');

    modal.dataset.view = 'teams';
    modal.dataset.league = league;
    backBtn.style.display = 'inline-block';
    title.textContent = `${league}부 리그 팀 목록`;

    const leagueTeams = Object.keys(allTeams).filter(key => allTeams[key].league == league);

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;">';
    leagueTeams.forEach(teamKey => {
        const teamName = teamNames[teamKey] || teamKey;
        const currentPlayers = teams[teamKey] ? teams[teamKey].length : allTeams[teamKey].players.length;
        html += `
            <div onclick="renderDatabasePlayers('${teamKey}')" style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; cursor: pointer; text-align: center; transition: background 0.2s; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; color: #fff;">${teamName}</div>
                <div style="font-size: 0.9rem; color: #aaa;">선수 ${currentPlayers}명</div>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

function renderDatabasePlayers(teamKey) {
    const modal = document.getElementById('databaseModal');
    const content = document.getElementById('dbModalContent');
    const backBtn = document.getElementById('dbBackBtn');
    const title = document.getElementById('dbModalTitle');

    modal.dataset.view = 'players';
    backBtn.style.display = 'inline-block';
    const teamName = teamNames[teamKey] || teamKey;
    title.textContent = `${teamName} 선수 명단`;

    const players = teams[teamKey] || allTeams[teamKey].players;
    const posOrder = { 'GK': 1, 'DF': 2, 'MF': 3, 'FW': 4 };
    const sortedPlayers = [...players].sort((a, b) => (posOrder[a.position] || 5) - (posOrder[b.position] || 5) || b.rating - a.rating);

    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    sortedPlayers.forEach(player => {
        let stats = { goals: 0, assists: 0, matches: 0, moms: 0 };
        if (typeof leagueBasedRecordsSystem !== 'undefined' && leagueBasedRecordsSystem.playerStats.has(player.name)) {
            const record = leagueBasedRecordsSystem.playerStats.get(player.name);
            if (record.team === teamKey) stats = record;
        }
        let posColor = player.position === 'FW' ? '#e74c3c' : player.position === 'MF' ? '#2ecc71' : player.position === 'DF' ? '#3498db' : '#f1c40f';
        html += `
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${posColor};">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                        <span style="color: ${posColor}; font-size: 0.9rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${player.position}</span>
                        ${player.name}
                    </div>
                    <div style="font-size: 0.85rem; color: #ccc; margin-top: 6px;">
                        ${player.country || '국적 미상'} | ${player.age}세 | 오버롤 <span style="color: #ffd700; font-weight: bold;">${Math.floor(player.rating)}</span>
                    </div>
                </div>
                <div style="text-align: right; font-size: 0.85rem; color: #ddd; min-width: 100px;">
                    <div style="margin-bottom: 2px;">🏟️ 경기: ${stats.matches}</div>
                    <div style="margin-bottom: 2px;">⚽ 골: ${stats.goals}</div>
                    <div style="margin-bottom: 2px;">👟 도움: ${stats.assists}</div>
                    <div>⭐ MOM: ${stats.moms}</div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

// 전역 노출
window.openDatabaseModal = openDatabaseModal;
window.renderDatabaseTeams = renderDatabaseTeams;
window.renderDatabasePlayers = renderDatabasePlayers;

// [신규] 대시보드 표시 함수
function showDashboard() {
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

// [신규] 대시보드 렌더링
function renderDashboard() {
    const container = document.getElementById('dashboard-container');
    if (!container) return; // 안전 장치
    container.innerHTML = '';

    // 1. 다음 경기 카드
    const nextMatchCard = createDashboardCard('🏆 다음 경기', 'match', () => {
        const opponentName = gameData.currentOpponent ? teamNames[gameData.currentOpponent] : '미정';
        const opponentLogo = gameData.currentOpponent ? getTeamLogoHTML(gameData.currentOpponent) : '';
        return `
            <div style="text-align: center;">
                <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px;">VS ${opponentLogo} ${opponentName}</div>
                <div style="color: #aaa;">${gameData.isHomeGame ? '홈 경기' : '원정 경기'}</div>
                <div style="margin-top: 15px; color: #2ecc71; font-weight: bold;">킥오프 준비 완료</div>
            </div>
        `;
    });

    // 2. 리그 순위 카드
    const leagueCard = createDashboardCard('📊 리그 순위', 'league', () => {
        const league = gameData.currentLeague;
        const divisionKey = `division${league}`;
        const table = gameData.leagueData[divisionKey];

        if (!table) return '<div style="text-align:center; color:#aaa;">데이터 없음</div>';

        const standings = Object.keys(table).map(key => ({
            name: teamNames[key] || key,
            key: key,
            ...table[key],
            diff: table[key].goalsFor - table[key].goalsAgainst
        })).sort((a, b) => b.points - a.points || b.diff - a.diff || b.goalsFor - a.goalsFor);

        const myIndex = standings.findIndex(t => t.key === gameData.selectedTeam);
        let html = '';

        const range = [myIndex - 1, myIndex, myIndex + 1];
        range.forEach(idx => {
            if (standings[idx]) {
                const team = standings[idx];
                const isMe = idx === myIndex;
                html += `
                    <div class="rank-row ${isMe ? 'my-team' : ''}">
                        <span>${idx + 1}위</span>
                        <span style="display: flex; align-items: center;">${getTeamLogoHTML(team.key)} ${team.name}</span>
                        <span>${team.points}pts</span>
                    </div>
                `;
            }
        });
        return html;
    });

    // 3. 스쿼드 요약 카드
    const squadCard = createDashboardCard('👥 스쿼드', 'squad', () => {
        const rating = typeof calculateTeamRating === 'function' ? calculateTeamRating().toFixed(1) : '0.0';
        const realInjuredCount = (typeof injurySystem !== 'undefined') ? injurySystem.getInjuredPlayers(gameData.selectedTeam).length : 0;

        return `
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <div>
                    <div style="font-size: 0.9rem; color: #aaa;">평균 능력치</div>
                    <div style="font-size: 2rem; font-weight: bold; color: #3498db; margin-bottom: 15px;">${rating}</div>
                </div>
                <div>
                    <div style="font-size: 0.9rem; color: #aaa;">부상자</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${realInjuredCount > 0 ? '#e74c3c' : '#2ecc71'};">${realInjuredCount}명</div>
                </div>
            </div>
        `;
    });

    // 4. 이적 시장 카드
    const transferCard = createDashboardCard('💰 이적 시장', 'transfer', () => {
        return `
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <div style="font-size: 0.85rem; color: #aaa;">이적 시장 자금과 주급 총합을 확인하세요</div>
                <div style="font-size: 2.2rem; font-weight: bold; color: #f1c40f; margin: 5px 0;">${gameData.teamMoney}억</div>
                <div style="font-size: 1rem; color: #4fc3f7; font-weight: bold;">주급 자금: ${gameData.wageBudget}억</div>
                <div style="font-size: 1.1rem; color: #e74c3c; font-weight: bold;">주급: ${gameData.totalWeeklyWage}억</div>
            </div>
        `;
    });

    const financeCard = createDashboardCard('🏦 재정', 'finance', () => {
        return `
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <div style="font-size: 0.85rem; color: #aaa;">이적 자금 / 주급 자금 전환</div>
                <div style="font-size: 2rem; font-weight: bold; color: #f1c40f; margin: 5px 0;">${gameData.teamMoney}억</div>
                <div style="font-size: 1rem; color: #4fc3f7; font-weight: bold;">주급 자금: ${gameData.wageBudget}억</div>
            </div>
        `;
    });

    // 5. 기타 카드들
    const tacticsCard = createDashboardCard('🧬 전술/DNA', 'tactics', () => {
        const ts = (typeof TacticSystem !== 'undefined') ? new TacticSystem() : null;
        const tacticName = (ts && ts.tactics[gameData.currentTactic]) ? ts.tactics[gameData.currentTactic].name : gameData.currentTactic;
        return `
            <div style="text-align:center;">
                <div style="margin-bottom:5px;">현재 전술: <span style="color:#ffd700;">${tacticName}</span></div>
                <div style="font-size:0.8rem; color:#aaa;">DNA 및 세부 전술 설정</div>
            </div>
        `;
    });

    // [추가] 개인 기록 카드
    const recordsCard = createDashboardCard('🥇 개인 기록', 'records', () => {
        let topScorerName = '-';
        let topScorerGoals = 0;

        if (typeof leagueBasedRecordsSystem !== 'undefined') {
            const scorers = leagueBasedRecordsSystem.getTopScorersByLeague(gameData.currentLeague, 1);
            if (scorers.length > 0) {
                topScorerName = scorers[0].name;
                topScorerGoals = scorers[0].goals;
            }
        }

        return `
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #aaa;">현재 득점 1위</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #e74c3c; margin: 5px 0;">${topScorerName}</div>
                <div style="font-size: 0.9rem;">${topScorerGoals}골</div>
            </div>
        `;
    });

    // [추가] SNS 카드
    const snsCard = createDashboardCard('📱 SNS', 'sns', () => {
        let latestPost = "새로운 소식이 없습니다.";
        if (typeof snsManager !== 'undefined' && snsManager.posts.length > 0) {
            // HTML 태그 제거 및 길이 제한
            const div = document.createElement("div");
            div.innerHTML = snsManager.posts[0].content;
            latestPost = div.textContent || div.innerText || "";
            if (latestPost.length > 18) latestPost = latestPost.substring(0, 18) + "...";
        }
        return `
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #aaa;">최신 피드</div>
                <div style="font-size: 0.95rem; margin-top: 5px;">"${latestPost}"</div>
            </div>
        `;
    });

    // [추가] 이적 뉴스 카드
    const transferNewsCard = createDashboardCard('🌍 AI 이적 뉴스', 'transfer_news', () => {
        let latestNews = "이적 소식이 없습니다.";
        if (typeof transferSystem !== 'undefined' && transferSystem.transferNews.length > 0) {
            const news = transferSystem.transferNews[0];
            latestNews = `${news.name}: ${news.from} ➔ ${news.to}`;
        }
        return `
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #aaa;">최신 이적</div>
                <div style="font-size: 0.95rem; margin-top: 5px;">${latestNews}</div>
            </div>
        `;
    });

    // [추가] 유스 카드
    const youthCard = createDashboardCard('🌟 유스/스카우트', 'youth', () => {
        const youthCount = gameData.youthSquad ? gameData.youthSquad.length : 0;
        const scoutStatus = gameData.hiredScout ? '고용 중' : '미고용';
        return `
            <div style="text-align: center;">
                <div style="font-size: 0.9rem; color: #aaa;">유망주</div>
                <div style="font-size: 1.2rem; font-weight: bold; color: #2ecc71; margin: 5px 0;">${youthCount}명</div>
                <div style="font-size: 0.8rem; color: #aaa;">스카우터: ${scoutStatus}</div>
            </div>
        `;
    });

    // [추가] 스폰서 카드
    const sponsorCard = createDashboardCard('💼 스폰서', 'sponsor', () => {
        const sponsorName = gameData.currentSponsor ? gameData.currentSponsor.name : '계약 없음';
        const remainingMatches = gameData.sponsorRemainingMatches || 0;
        return `
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <div style="font-size: 0.9rem; color: #aaa;">현재 스폰서</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #2ecc71; margin: 10px 0;">${sponsorName}</div>
                ${gameData.currentSponsor ? `<div style="font-size: 0.9rem;">남은 계약: ${remainingMatches}경기</div>` : '<div style="font-size: 0.9rem;">새로운 계약을 찾아보세요</div>'}
            </div>
        `;
    });

    const mailCard = createDashboardCard('📬 메일함', 'mail', () => {
        const unread = (typeof mailManager !== 'undefined') ? mailManager.getUnreadCount() : 0;
        return `<div style="text-align:center;">읽지 않은 메일: <span style="color:${unread > 0 ? '#e74c3c' : '#aaa'}; font-weight:bold;">${unread}통</span></div>`;
    });
    const chatCard = createDashboardCard('💬 대화', 'chat', () => {
        const state = ensureChatState();
        const activeContact = getChatContactById(state.activeContactId);
        const latestMessage = getLatestChatPreview();
        return `
            <div style="text-align:center; display:flex; flex-direction:column; justify-content:center; height:100%; gap:8px;">
                <div style="font-size:0.9rem; color:#aaa;">현재 대화방</div>
                <div style="font-size:1.2rem; font-weight:bold; color:#4fc3f7;">${activeContact ? activeContact.name : '대화 없음'}</div>
                <div style="font-size:0.88rem; color:#ddd; line-height:1.4;">${latestMessage || '아직 나눈 대화가 없습니다.'}</div>
            </div>
        `;
    });
    const settingsCard = createDashboardCard('⚙️ 설정 / 저장', 'settings', () => `<div style="text-align:center;">게임 저장 및 불러오기</div>`);

    const growthCard = createDashboardCard('📈 성장 현황', 'growth', () => {
        const growingCount = gameData.playerGrowthData ? Object.keys(gameData.playerGrowthData).length : 0;
        return `
            <div style="text-align: center; display: flex; flex-direction: column; justify-content: center; height: 100%;">
                <div style="font-size: 0.9rem; color: #aaa;">성장 중인 선수</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #3498db; margin: 10px 0;">${growingCount}명</div>
                <div style="font-size: 0.8rem; color: #aaa;">잠재력을 폭발시키세요</div>
            </div>
        `;
    });

    container.appendChild(nextMatchCard);
    container.appendChild(leagueCard);
    container.appendChild(squadCard);
    container.appendChild(growthCard);
    container.appendChild(transferCard);
    container.appendChild(tacticsCard);
    container.appendChild(sponsorCard);
    container.appendChild(youthCard);
    container.appendChild(mailCard);
    container.appendChild(chatCard);
    container.appendChild(settingsCard);
    container.appendChild(recordsCard);
    container.appendChild(snsCard);
    container.appendChild(transferNewsCard);
    container.appendChild(financeCard);
}

function createDashboardCard(title, tabName, contentFn) {
    const card = document.createElement('div');
    card.className = 'dashboard-card';
    card.id = `dashboard-${tabName}`; // Bento UI를 위한 ID 추가
    card.innerHTML = `
        <h3>${title} <span>➔</span></h3>
        <div class="dashboard-content">${contentFn()}</div>
    `;
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
            color: '#8e44ad',
            avatar: '👩‍💼',
            description: '구단 운영과 일정, 민원과 제안을 정리합니다.'
        },
        {
            id: 'coach',
            name: '수석 코치',
            role: '전술실',
            color: '#3498db',
            avatar: '🧠',
            description: '전술, 경기 준비, 선수 컨디션을 함께 점검합니다.'
        },
        {
            id: 'owner',
            name: '구단주',
            role: '운영실',
            color: '#f39c12',
            avatar: '🏛️',
            description: '예산, 이적료, 계약 조건에 대한 최종 판단을 내립니다.'
        },
        {
            id: 'scout',
            name: '스카우트 팀장',
            role: '스카우팅',
            color: '#2ecc71',
            avatar: '🕵️',
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
    return escapeChatText(`${last.sender === 'user' ? '나' : getChatContactById(activeContactId).name}: ${last.text}`).slice(0, 42);
}

function renderChatTab() {
    const container = document.getElementById('chatContent');
    if (!container) return;

    const state = ensureChatState();
    const contacts = getChatContacts();
    const activeContact = getChatContactById(state.activeContactId);
    const thread = getChatThread(activeContact.id);

    container.innerHTML = `
        <div class="chat-shell">
            <aside class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <div class="chat-sidebar-title">대화방</div>
                    <div class="chat-sidebar-subtitle">구단 내부 실시간 메신저</div>
                </div>
                <div class="chat-contact-list">
                    ${contacts.map(contact => {
        const contactThread = getChatThread(contact.id);
        const lastMessage = contactThread.length > 0 ? contactThread[contactThread.length - 1].text : contact.description;
        const isActive = contact.id === activeContact.id;
        return `
                            <button class="chat-contact ${isActive ? 'active' : ''}" onclick="switchChatContact('${contact.id}')">
                                <div class="chat-contact-avatar" style="background:${contact.color};">${contact.avatar}</div>
                                <div class="chat-contact-body">
                                    <div class="chat-contact-top">
                                        <strong>${contact.name}</strong>
                                        <span>${contact.role}</span>
                                    </div>
                                    <div class="chat-contact-preview">${lastMessage}</div>
                                </div>
                            </button>
                        `;
    }).join('')}
                </div>
            </aside>

            <section class="chat-main">
                <header class="chat-header">
                    <div class="chat-header-left">
                        <div class="chat-header-avatar" style="background:${activeContact.color};">${activeContact.avatar}</div>
                        <div>
                            <div class="chat-header-title">${activeContact.name}</div>
                            <div class="chat-header-subtitle">${activeContact.description}</div>
                        </div>
                    </div>
                    <div class="chat-header-meta">현재 대화 중</div>
                </header>

                <div id="chatThread" class="chat-thread">
                    ${thread.length > 0 ? thread.map(message => renderChatBubble(message, activeContact)).join('') : `<div class="chat-empty-state"><div class="chat-empty-icon">💡</div><h3>꿀팁 & FAQ를 확인하세요</h3><p>아래 추천 질문을 클릭하시면 즉시 해당 내용에 대한 꿀팁과 답변을 확인하실 수 있습니다!</p></div>`}
                </div>

                <div class="chat-quick-replies">
                    ${getChatQuickReplies(activeContact.id).map(text => `<button class="chat-quick-chip" onclick='sendQuickChatMessage(${JSON.stringify(text)})'>${escapeChatText(text)}</button>`).join('')}
                </div>

                <div class="chat-typing" id="chatTypingIndicator" style="display:none;">${activeContact.name}이(가) 입력 중...</div>

                <div class="chat-composer" style="display:none;">
                    <textarea id="chatInput" class="chat-input" rows="2" placeholder="메시지를 입력하세요..." onkeydown="handleChatKeydown(event)"></textarea>
                    <button class="btn primary chat-send-btn" onclick="sendChatMessage()">전송</button>
                </div>
            </section>
        </div>
    `;

    scrollChatToBottom();
}

function renderChatBubble(message, contact) {
    const isUser = message.sender === 'user';
    const senderLabel = isUser ? '나' : contact.name;
    return `
        <div class="chat-row ${isUser ? 'user' : 'other'}">
            <div class="chat-bubble ${isUser ? 'user' : 'other'}">
                <div class="chat-bubble-meta">
                    <span class="chat-bubble-sender">${senderLabel}</span>
                    <span class="chat-bubble-time">${message.time}</span>
                </div>
                <div class="chat-bubble-text">${escapeChatText(message.text)}</div>
            </div>
        </div>
    `;
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
        { q: '사기가 뭐야?', a: '😊 현재 팀 분위기 체크리스트:\n• 연패가 이어지면 사기가 빠르게 떨어집니다\n• 주급이 밀리거나 계약 기간이 얼마 안 남은 선수는 불만을 가질 수 있습니다\n• 인터뷰 답변으로 분위기를 올릴 수 있습니다\n\n💡 꿀팁: 승리가 쌓이면 자연스럽게 분위기가 좋아집니다!' },
        { q: '돈이 없어ㅠㅜ', a: '💵 구단 자금 관리 꿀팁:\n1. 스폰서 계약은 최대한 높은 등급으로 유지하세요\n2. 불필요한 선수는 이적명단에 올리세요. 한번 관심 없어도 꾸준히 등록하면 오퍼가 온답니다\n3. 주급 예산을 넘어가지 않게 주의하세요\n\n💡 꿀팁: 하위 리그에서는 싼 유망주를 사서 성장시킨 후 비싸게 파는 것도 좋은 전략입니다!' },
        { q: '초보자 추천 꿀팁', a: '🎮 초보 감독님 필수 꿀팁:\n1. 처음에는 강팀을 선택해서 시스템을 익히세요\n2. 로테이션도 중요합니다\n3. 전술을 꼭 설정하세요! DNA 탭과 스쿼드>롤 정보에서 설정 가능합니다!\n4. 프리셋 설정 후 스스로 또 손보세요\n\n💡 꿀팁: Ctrl+Shift+S로 5시즌 빠른 시뮬레이션!' },
        { q: '이적료/주급 관리 도와줘', a: '💡 선수 처리 비교:\n• 협상을 시도해 보세요! \n• 너무 깎아치진 말고 20 퍼센트정도만 줄이는 것을 추천합니다\n\n💡 주의: 협상에 2번 실패하면 10경기 동안 그 선수에게 다시 제안할 수 없습니다!' },
        { q: '주급 관리 어떻게 해요?', a: '💰 주급 관리 노하우:\n1. 주급 예산 내에서 운영하는 게 가장 중요합니다\n2. 선수를 영입할때 주급 협상은 꼭 하세요\n3. 재정 탭에서 이적 예산과 주급예산을 조정하세요\n\n💡 꿀팁: 계약 만료 6개월 전부터 미리미리 재계약하세요!' }
    ],
    coach: [
        { q: '전술 조언 부탁해', a: '⚽ 전술 선택 가이드:\n• balanced: 무전술- 절대하지마세요! 나머지는 맘대로 하세요\n• 전술 숙련도가 있으니 주의하세요!' },
        { q: '다음 경기 준비는?', a: '📋 경기 전 체크리스트:\n1. 상대팀 평균 능력치 확인\n2. 전술 설정\n' },
        { q: '선수 컨디션?', a: '💪 선수 컨디션 관리:\n• 연속 출전 시 피로도가 쌓입니다\n• 로테이션으로 선수들에게 휴식을 주세요\n\n💡 꿀팁: 중요한 경기를 앞두고 있다면 전 경기에는 교체 출전시키는 게 좋습니다' },
        { q: '포메이션 추천해줘', a: '📐 포메이션 가이드:\n• 4-3-3: 기본형, 공격과 수비 밸런스 좋음\n• 4-4-2: 전통적인 밸런스형, 미드필더 많음\n• 3-5-2: 윙백 활용, 공격적\n• 5-3-2: 수비 중시, 상대 강팀 상대\n\n💡 꿀팁: 우리 팀의 포지션별 선수 깊이에 맞춰 고르세요' },
        { q: '전술 뭘 고를까요', a: '🏆 높은 리그라면(혹은 강팀이라면):\n토탈 풋볼 추천\n2. 약한 리그라면\n 마음대로(토탈 풋볼제외)' },
        { q: '치트 쓰는법', a: '치트:\n1. json으로 내보낸 후 값을 변경하세요(게임터질수도)\n2. 설정에서 포텐 확인이 가능합니다!' },
    ],
    owner: [
        { q: '예산 여유 있어?', a: '💵 예산 운영 원칙:\n• 팀 자금은 이적료와 주급 예산으로 나눠서 생각하세요\n• 스폰서 승점 보너스가 가장 큰 수입입니다\n\n💡 꿀팁: 팀 오버롤을 높여서 더 높은 스폰서와 계약하세요' },
        { q: '이적료 협상 가능?', a: '🤝 이적 협상 노하우:\n1. 선수 능력치, 나이, 남은 계약기간이 가격을 결정합니다\n2. 꼭 협상을 하세요\n3. 너무 비싼 선수는 돈모아서 사세요 그때가 제일 쌉니다\n\n💡 꿀팁: 20세 이하 유망주는 가격대비 쌉니다' },
        { q: '주급 자금 더 필요해', a: '💰 주급 자금 늘리는 법:\n1. 스폰서 계약 등급 올리기\n2. 불필요한 고주급 선수 방출/이적\n3. 팀 순위가 오르면 자연스레 증액\n\n💡 꿀팁: 승승장구하면 구단주가 특별 보너스를 줄 때도 있습니다!' },
        { q: '선수 비싸게 파는 법?', a: '💸 선수 매각 노하우:\n1. 능력치 상승 중인 선수가 가장 비쌉니다\n\n💡 꿀팁: 팔때도 협상 하세요' },
        { q: '파산 직전이에요 도와줘', a: '🚨 긴급 자금 구출 플랜:\n1. 고주급 베테랑 선수부터 방출/매각\n2. 선수 팔기\n💡 꿀팁: 하위 리그로 강등돼도 다시 올라올 수 있으니 포기하지 마세요!' }
    ],
    scout: [
        { q: '유망주 보고서 줘', a: '🌟 유망주 체크리스트:\n• 나이: 18-22세 사이가 가장 좋습니다\n• 현재 능력치 대비 성장 가능성 보기\n• 포지션별 필요성 확인\n\n💡 꿀팁: 스카우트를 통해 영입된 선수는 포텐셜이 높을 가능성이 높아요.' },
        { q: '사야할 선수 있어?', a: '📊 이적 시장 타입:\n1. 즉전력: 지금 당장 필요한 포지션 보강\n2. 유망주: 미래를 위한 투자\n3. 저가 매물: 로테이션용 나이 좀 있는 선수\n\n💡 꿀팁: 시즌 중간 이적 시즌에 맞춰 구매하는 게 유리합니다' },
        { q: '추천 선수 알려줘', a: '⭐ 각 포지션별 추천 선수:\n• GK: 본좌: 조안 가르시아, 슈발리에/유망주: 기욤 레스테스 찔러보기(안좋을수도)\n• DF: 본좌: 그바르디올/유망주:쿠바르시, \n• MF: 본좌: 무시알라, 주앙 네베스, 흐라벤베르흐/유망주:옌스, 칼, 배승균 \n• FW: 본좌: 비르츠,  호드리구, 홀란드 등 /유망주: 프란치스코 카마르다\n\n💡 꿀팁: 26세 이상는 성장 안해요! 또 노장 선수는 은퇴했을때 우리팀에서 회귀합니다. 호날두나 메시 등을 노려보는것도 방법' },
        { q: '스카우터 고용해야 하나요?', a: '🔍 스카우터 활용법:\n• 스카우터 고용 시 유망주가 스카우트됨 \n• 할거 없으면 추천\n• \n💡 꿀팁: 자금 여유가 된다면 빨리 고용하는 게 좋아요' },
        { q: '유망주 어떻게 키우나요?', a: '🌱 유망주 성장 가이드:\n1. 3경기마다 성장합니다\n2. 교체에 박아놔도 ㄱㅊ\n' },
        { q: '이적 시장 타이밍은?', a: '⏰ 이적 시장 골든 타이밍:\n• 이적시장에 나온 지 30일 이상 되면 가격이 내려가기 시작합니다!' }
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

    const transferBudget = Math.max(0, gameData.teamMoney || 0);
    const wageBudget = Math.max(0, typeof gameData.wageBudget === 'number' ? gameData.wageBudget : 0);
    const totalPool = transferBudget + wageBudget;
    const wageCoverage = gameData.totalWeeklyWage > 0 ? Math.round((wageBudget / gameData.totalWeeklyWage) * 100) : 0;
    const transferDefault = transferBudget > 0 ? Math.min(40, Math.max(10, Math.round((transferBudget / Math.max(1, totalPool)) * 50))) : 0;

    container.innerHTML = `
        <div class="finance-panel">
            <div class="finance-hero">
                <div class="finance-hero-copy">
                    <div class="finance-kicker">FINANCE MANAGEMENT</div>
                    <h3>예산을 직접 조절하세요</h3>
                    <p>슬라이더를 오른쪽으로 밀수록 주급 자금이 늘고, 왼쪽으로 밀수록 이적 자금이 늘어납니다. 전환은 각각 12배 / 1/12 배율로 적용됩니다.</p>
                </div>
                <div class="finance-ratio-chip">
                    <span>운영 가능 주급 커버</span>
                    <strong>${wageCoverage}%</strong>
                </div>
            </div>

            <div class="finance-summary-grid">
                <div class="finance-summary-card">
                    <div class="finance-label">이적 자금</div>
                    <div class="finance-value transfer">${transferBudget}억</div>
                </div>
                <div class="finance-summary-card">
                    <div class="finance-label">주급 자금</div>
                    <div class="finance-value wage">${wageBudget}억</div>
                </div>
                <div class="finance-summary-card">
                    <div class="finance-label">총 주급</div>
                    <div class="finance-value wage-debt">${gameData.totalWeeklyWage}억</div>
                </div>
                <div class="finance-summary-card">
                    <div class="finance-label">연간 예상 주급 지출</div>
                    <div class="finance-value annual">${Math.round(gameData.totalWeeklyWage * 52)}억</div>
                </div>
            </div>

            <div class="finance-conversion-card">
                <div class="finance-conversion-header">
                    <div>
                        <h4>예산 슬라이더</h4>
                        <p>가운데는 중립, 왼쪽은 이적 자금 강화, 오른쪽은 주급 자금 강화</p>
                    </div>
                    <div class="finance-rate-note">1억 이동 = 12억 / 1/12억</div>
                </div>

                <div class="finance-slider-shell">
                    <div class="finance-slider-labels">
                        <span class="budget-tag transfer">이적 자금</span>
                        <span class="budget-tag neutral">중립</span>
                        <span class="budget-tag wage">주급 자금</span>
                    </div>

                    <input
                        id="financeBalanceSlider"
                        class="finance-range"
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value="0"
                        oninput="updateFinanceBalancePreview(this.value)"
                    >

                    <div class="finance-scale">
                        <span>-100</span>
                        <span id="financeBalanceState">중립 상태</span>
                        <span>+100</span>
                    </div>
                </div>

                <div class="finance-preview-grid">
                    <div class="finance-preview-card transfer">
                        <div class="finance-preview-label">이적 자금 변화</div>
                        <div id="financeTransferDelta" class="finance-preview-value">0억</div>
                        <div id="financeTransferAfter" class="finance-preview-sub">변동 없음</div>
                    </div>
                    <div class="finance-preview-card wage">
                        <div class="finance-preview-label">주급 자금 변화</div>
                        <div id="financeWageDelta" class="finance-preview-value">0억</div>
                        <div id="financeWageAfter" class="finance-preview-sub">변동 없음</div>
                    </div>
                </div>

                <div class="finance-action-row">
                    <button class="btn primary finance-apply-btn" onclick="applyFinanceBalanceSlider()">선택한 예산 이동 적용</button>
                    <button class="btn finance-reset-btn" onclick="resetFinanceSlider()">슬라이더 초기화</button>
                </div>
            </div>

            <div class="finance-insight-grid">
                <div class="finance-insight-card">
                    <div class="finance-insight-title">이적 운영 상태</div>
                    <div class="finance-insight-text">현재 팀의 이적 자금은 <strong>${transferBudget}억</strong>이며, 공격적인 영입을 원하면 오른쪽 슬라이더를 높이세요.</div>
                </div>
                <div class="finance-insight-card">
                    <div class="finance-insight-title">주급 운영 상태</div>
                    <div class="finance-insight-text">현재 주급 자금은 <strong>${wageBudget}억</strong>입니다. 이 수치가 낮으면 연봉 협상과 선수 유지가 어려워집니다.</div>
                </div>
            </div>

            <div class="finance-note">
                주급 자금이 부족하면 협상 단계에서 계약이 막힙니다. 필요할 때만 자금을 이동시키고, 과도한 전환은 피하세요.
            </div>
        </div>
    `;

    if (typeof updateFinanceBalancePreview === 'function') {
        updateFinanceBalancePreview(transferDefault || 0);
        const slider = document.getElementById('financeBalanceSlider');
        if (slider) slider.value = transferDefault || 0;
    }
}

function updateFinanceBalancePreview(rawValue) {
    const sliderValue = Number(rawValue) || 0;
    const transferBudget = Math.max(0, gameData.teamMoney || 0);
    const wageBudget = Math.max(0, typeof gameData.wageBudget === 'number' ? gameData.wageBudget : 0);
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
    const transferSource = Math.max(0, Math.round(transferBudget * ratio));
    const wageSource = Math.max(0, Math.round(wageBudget * ratio));

    if (direction === 'transferToWage') {
        transferDelta = -transferSource;
        wageDelta = parseFloat((transferSource / 12).toFixed(2));
        statusText = transferSource > 0 ? '오른쪽으로 이동 중: 주급 자금 강화' : '이적 자금이 부족합니다';
    } else if (direction === 'wageToTransfer') {
        wageDelta = -wageSource;
        transferDelta = Math.round(wageSource * 12);
        statusText = wageSource > 0 ? '왼쪽으로 이동 중: 이적 자금 강화' : '주급 자금이 부족합니다';
    }

    const nextTransfer = Math.max(0, transferBudget + transferDelta);
    const nextWage = Math.max(0, wageBudget + wageDelta);

    if (transferDeltaEl) transferDeltaEl.textContent = transferDelta === 0 ? '0억' : `${transferDelta > 0 ? '+' : ''}${transferDelta}억`;
    if (wageDeltaEl) wageDeltaEl.textContent = wageDelta === 0 ? '0억' : `${wageDelta > 0 ? '+' : ''}${wageDelta}억`;
    if (transferAfterEl) transferAfterEl.textContent = `전환 후 ${nextTransfer}억`;
    if (wageAfterEl) wageAfterEl.textContent = `전환 후 ${nextWage}억`;
    if (stateEl) stateEl.textContent = statusText;

    if (slider) {
        const percent = (sliderValue + 100) / 2;
        slider.style.background = `linear-gradient(90deg, rgba(243, 156, 18, 0.85) 0%, rgba(243, 156, 18, 0.85) ${percent}%, rgba(79, 195, 247, 0.85) ${percent}%, rgba(79, 195, 247, 0.85) 100%)`;
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
    const transferSource = Math.max(0, Math.round((gameData.teamMoney || 0) * ratio));
    const wageSource = Math.max(0, Math.round((gameData.wageBudget || 0) * ratio));

    if (sliderValue > 0 && transferSource <= 0) {
        alert('이적 자금이 부족해서 주급 자금으로 이동할 수 없습니다.');
        return;
    }

    if (sliderValue < 0 && wageSource <= 0) {
        alert('주급 자금이 부족해서 이적 자금으로 이동할 수 없습니다.');
        return;
    }

    const result = sliderValue > 0
        ? transferSystem.convertTransferToWageBudget(transferSource)
        : transferSystem.convertWageToTransferBudget(wageSource);

    alert(result.message);
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
    loadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:white;display:flex;justify-content:center;align-items:center;z-index:99999;font-size:2rem;flex-direction:column;';
    loadingOverlay.innerHTML = `<div>⏳ ${count}시즌 시뮬레이션 중...</div><div id="simProgress" style="font-size:1rem;margin-top:20px;">준비 중</div>`;
    document.body.appendChild(loadingOverlay);

    const progressEl = document.getElementById('simProgress');

    // UI 렌더링 대기
    await new Promise(r => setTimeout(r, 50));

    try {
        for (let s = 0; s < count; s++) {
            if (!gameData.schedule) generateFullSchedule();

            const divisionKey = `division${gameData.currentLeague}`;
            const schedule = gameData.schedule[divisionKey];

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
