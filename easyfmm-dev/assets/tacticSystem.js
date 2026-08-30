// c:\Users\jinuj\vsc\easyfmm\tacticSystem.js

// [전역 설정] 기본 롤(Role) 설정
if (!gameData.lineRoles) {
    gameData.lineRoles = {
        attack: 'AF',
        midfield: 'BBM',
        defense: 'BPD'
    };
}

// [신규] 팀 컬러 데이터 (주요 팀)
const TeamColors = {
    "바르셀로나": ["#a50044", "#004170"],
    "레알_마드리드": "#ffffff",
    "맨체스터_시티": "skyblue",
    "리버풀": "#c8102e",
    "토트넘_홋스퍼": "#ffffff",
    "파리_생제르맹": ["#004170", "#da291c"],
    "AC_밀란": ["#fb090b", "#000000"],
    "인터_밀란": ["#010e80", "#000000"],
    "아스널": ["#ef0107", "#ffffff"],
    "나폴리": "skyblue",
    "첼시": "#034694",
    "바이에른_뮌헨": "#dc052d",
    "아틀레티코_마드리드": ["#cb3524", "#ffffff"],
    "도르트문트": ["#fde100", "#000000"],
    "맨체스터_유나이티드": "#da291c",
    "FC_서울": ["#fc0000", "#000000"],
    "대한민국": "#ec0e27"
};

function getTeamColor(teamName) {
    if (TeamColors[teamName]) return TeamColors[teamName];
    // 팀 데이터가 없으면 이름 해시로 고유 색상 생성 (파스텔톤)
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
        hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

// =========================================================================================
// [PART 1] 유틸리티 함수 (전력 계산, 베스트 11 등)
// =========================================================================================


function updateTeamStrength() {
    if (gameData.selectedTeam && gameData.currentOpponent) {
        const strengthData = calculateTeamStrengthDifference();
        const strengthDisplay = document.getElementById('strengthDisplay');
        if (strengthDisplay) {
            strengthDisplay.innerHTML = `
                <div>우리팀 전력: ${strengthData.userRating.toFixed(1)}</div>
                <div>상대팀 전력: ${strengthData.opponentRating.toFixed(1)}</div>
                <div>전력 차이: ${strengthData.difference > 0 ? '+' : ''}${strengthData.difference.toFixed(1)}</div>
                <div>상대적 우위: ${strengthData.userAdvantage ? '유리' : '불리'}</div>
            `;
        }
        return strengthData;
    }
    return null;
}

setInterval(() => updateTeamStrength(), 5000);

// =========================================================================================
// [PART 2] 전술 시스템 (TacticSystem)
// =========================================================================================

class TacticSystem {
    constructor() {
        this.tactics = {
            balanced: { name: "기본 전술 (무전술)", effective: [], ineffective: ["gegenpress", "twoLine", "lavolpiana", "longBall", "possession", "parkBus", "catenaccio", "totalFootball", "tikitaka"], description: "특별한 전술 지시가 없는 상태입니다. 조직력이 크게 떨어집니다." },
            gegenpress: { name: "게겐프레싱", effective: ["tikitaka", "possession", "lavolpiana"], ineffective: ["parkBus", "longBall", "catenaccio", "twoLine"], description: "높은 압박으로 빠른 역습을 노리는 전술" },
            twoLine: { name: "다이렉트 축구", effective: ["gegenpress", "totalFootball"], ineffective: ["tikitaka", "possession", "lavolpiana"], description: "긴 패스로 상대의 공간을 파고드는 전술" },
            lavolpiana: { name: "라볼피아나", effective: ["parkBus", "catenaccio", "twoLine", "longBall"], ineffective: ["gegenpress", "totalFootball"], description: "측면 공격과 크로스를 중심으로 한 전술" },
            longBall: { name: "롱볼 축구", effective: ["gegenpress", "totalFootball"], ineffective: ["tikitaka", "possession", "lavolpiana"], description: "긴 패스로 빠르게 공격을 전개하는 전술" },
            possession: { name: "점유율 축구", effective: ["parkBus", "catenaccio", "twoLine", "longBall"], ineffective: ["gegenpress", "totalFootball"], description: "공을 오래 소유하며 천천히 공격 기회를 만드는 전술" },
            parkBus: { name: "역습 축구", effective: ["gegenpress", "totalFootball"], ineffective: ["tikitaka", "possession", "lavolpiana"], description: "수비에 집중하고 호시탐탐 역습을 노리는 전술" },
            catenaccio: { name: "카테나치오", effective: ["gegenpress", "totalFootball"], ineffective: ["tikitaka", "possession", "lavolpiana"], description: "이탈리아식 견고한 수비 전술" },
            totalFootball: { name: "토탈 풋볼", effective: ["tikitaka", "possession", "catenaccio", "parkBus"], ineffective: ["twoLine", "longBall"], description: "모든 선수가 공격과 수비에 참여하는 전술" },
            tikitaka: { name: "티키타카", effective: ["parkBus", "catenaccio", "twoLine", "longBall"], ineffective: ["gegenpress", "totalFootball"], description: "짧은 패스를 연결하며 공간을 만드는 전술" }
        };
        // 팀별 전술은 script.js의 teamTactics 객체 또는 LegendLeagueManager를 참조한다고 가정
        // 여기서는 메서드만 제공
    }

    getOpponentTactic(opponentTeam) {
        if (typeof teamTactics !== 'undefined' && teamTactics[opponentTeam]) {
            return teamTactics[opponentTeam];
        }
        return 'possession'; // 기본값
    }

    calculateTacticEffect(userTactic, opponentTactic) {
        const userTacticData = this.tactics[userTactic];
        if (!userTacticData) return 0;

        let effect = 0;
        if (userTacticData.effective.includes(opponentTactic)) effect += 5;
        else if (userTacticData.ineffective.includes(opponentTactic)) effect -= 5;

        // [신규] 전술 숙련도 낭만 보너스 적용 (숙련도 100일 경우 최대 +5 상쇄/추가)
        if (window.gameData && window.gameData.tacticMastery && window.gameData.tacticMastery[userTactic]) {
            const mastery = window.gameData.tacticMastery[userTactic];
            const masteryBonus = Math.floor(mastery / 20); // 0 ~ 5
            effect += masteryBonus;
        }

        return effect;
    }

    getTacticMatchup(userTactic, opponentTactic) {
        const userTacticData = this.tactics[userTactic];
        const opponentTacticData = this.tactics[opponentTactic];

        if (!userTacticData) return { result: "알 수 없음", advantage: 0, description: "정보 없음" };

        let result = "중립";
        let advantage = 0;

        if (userTacticData.effective.includes(opponentTactic)) {
            result = "유리";
            advantage = 5;
        } else if (userTacticData.ineffective.includes(opponentTactic)) {
            result = "불리";
            advantage = -3;
        }

        return {
            result: result,
            advantage: advantage,
            userTacticName: userTacticData.name,
            opponentTacticName: opponentTacticData ? opponentTacticData.name : opponentTactic,
            description: `${userTacticData.name} vs ${opponentTacticData ? opponentTacticData.name : opponentTactic}: ${result}`
        };
    }

    // [신규] 모든 전술 목록 가져오기
    getAllTactics() {
        return Object.keys(this.tactics).map(key => ({
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

    // 5. 전술 효과 적용
    const tacticSystem = new TacticSystem();
    const opponentTactic = tacticSystem.getOpponentTactic(gameData.currentOpponent);
    const tacticEffect = tacticSystem.calculateTacticEffect(gameData.currentTactic, opponentTactic);
    if (window.GameState) {
        window.GameState.adjustTeamMorale(tacticEffect);
    } else {
        gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale + tacticEffect));
    }

    // 6. UI 업데이트
    document.getElementById('homeTeam').textContent = teamNames[matchData.homeTeam];
    document.getElementById('awayTeam').textContent = teamNames[matchData.awayTeam];
    document.getElementById('scoreDisplay').textContent = "0 - 0";
    document.getElementById('matchTime').textContent = "0분";
    document.getElementById('eventList').innerHTML = '';

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

    // [신규] 전술 상성 효과를 팀 전력(Team Strength)에 직접 반영 (약하게 적용)
    // tacticEffect: 유리 +5, 불리 -5 (약 60% 반영으로 팀 전력 격차 상쇄)
    if (matchData.homeTeam === gameData.selectedTeam) {
        engine.teamStrength.home += (tacticEffect * 0.6);
        engine.teamStrength.away -= (tacticEffect * 0.6);
    } else {
        engine.teamStrength.away += (tacticEffect * 0.6);
        engine.teamStrength.home -= (tacticEffect * 0.6);
    }

    // [신규] 전술 상성 효과를 실제 선수 스탯에 직접 주입 (진짜 체감 버프)
    const userTeamId = matchData.homeTeam === gameData.selectedTeam ? 'home' : 'away';
    engine.applyTacticBoost(userTeamId, tacticEffect * 0.02);

    matchData.engine = engine; // 엔진 참조 저장

    // [수정] 팀 컬러 가져오기 및 충돌 방지 (유니폼 색상 겹침 해결)
    const homeColor = getTeamColor(matchData.homeTeam);
    let awayColor = getTeamColor(matchData.awayTeam);

    // 주 색상 추출 헬퍼 (배열이면 첫 번째 색상, 문자열이면 그대로)
    const getPrimaryColor = (c) => Array.isArray(c) ? c[0] : c;

    const hPrimary = getPrimaryColor(homeColor);
    const aPrimary = getPrimaryColor(awayColor);

    // 색상이 같으면 원정 팀 색상 변경
    if (hPrimary.toLowerCase() === aPrimary.toLowerCase()) {
        // 홈이 흰색이면 원정은 검정, 아니면 원정은 흰색
        if (hPrimary.toLowerCase() === '#ffffff' || hPrimary.toLowerCase() === 'white') {
            awayColor = '#000000';
        } else {
            awayColor = '#ffffff';
        }
        console.log(`🎨 유니폼 색상 충돌 감지! 원정팀 색상을 ${awayColor}로 변경합니다.`);
    }

    // 비주얼라이저 초기화
    if (window.matchVisualizer) {
        // [수정] 팀 컬러 전달
        window.matchVisualizer.init('matchVisualizerContainer', engine.players, { home: homeColor, away: awayColor });
    } else {
        // 비주얼라이저가 없으면 캔버스 영역을 숨기거나 텍스트 모드로 동작
        console.warn("matchVisualizer not found. Playing in text mode.");
    }

    // 8. 킥오프 버튼 표시
    showKickoffButton(matchData, engine);
}

function showKickoffButton(matchData, engine) {
    const eventList = document.getElementById('eventList');
    const kickoffInfo = document.createElement('div');
    kickoffInfo.className = 'event-card kickoff-ready';
    kickoffInfo.innerHTML = `
        <div class="event-time">준비 완료</div>
        <div>경기 시작 준비가 완료되었습니다.</div>
        <button id="kickoffBtn" class="btn primary" style="margin-top: 15px; padding: 12px 30px; font-size: 1.1rem; font-weight: bold; width: 100%;">⚽ 킥오프</button>
    `;
    eventList.appendChild(kickoffInfo);

    document.getElementById('kickoffBtn').addEventListener('click', () => {
        startMatchSimulation(matchData, engine);
        kickoffInfo.remove();
    });
}

function startMatchSimulation(matchData, engine) {
    console.log('⚽ [Match] 경기 시뮬레이션 시작');
    matchData.isRunning = true;

    const kickoffEvent = {
        minute: 0,
        type: 'kickoff',
        description: `🟢 경기 시작! ${teamNames[matchData.homeTeam]} vs ${teamNames[matchData.awayTeam]}`
    };
    displayEvent(kickoffEvent, matchData);

    simulateMatch(matchData, engine);
}

function simulateMatch(matchData, engine) {
    let tickCount = 0;
    matchData.seconds = 0; // [신규] 초 단위 정밀 시간 계산용
    const tickDuration = 60; // [수정] 140ms -> 60ms (약 16FPS 연산) : 훨씬 부드러운 움직임

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
        // [수정] 현재 분과 1분 경과 여부(seconds가 0일 때)를 엔진에 전달하여 체력 소모 로직 트리거
        const snapshot = engine.update(matchData.minute, matchData.seconds === 0);

        // [추가] 경기 중 실시간 라인 체력(숫자) 업데이트
        if (gameData.lineStats) {
            if (document.getElementById('atkStamina')) document.getElementById('atkStamina').textContent = Math.floor(gameData.lineStats.attack.stamina);
            if (document.getElementById('midStamina')) document.getElementById('midStamina').textContent = Math.floor(gameData.lineStats.midfield.stamina);
            if (document.getElementById('defStamina')) document.getElementById('defStamina').textContent = Math.floor(gameData.lineStats.defense.stamina);
        }

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
            if (injuryResult.isUserTeam) handleForcedSubstitution(injuryResult.player, matchData);
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
        return gameData.squad;
    } else {
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
        "⚡ {desc}",
        "🔥 {desc}"
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
    } else if (engineEvent.type === 'preGoalSuspense') {
        const desc = engineEvent.desc || '결정적인 순간이 다가옵니다...';
        return {
            minute: matchData.minute,
            type: 'preGoalSuspense',
            description: getRandomCommentary('preGoalSuspense', { desc })
        };
    }
    return null;
}

function displayEvent(event, matchData) {
    const eventList = document.getElementById('eventList');
    if (!eventList) return;

    eventList.innerHTML = `
        <div class="event-card ${event.type}">
            <span class="event-time">${event.minute}분</span>
            <span class="event-desc">${event.description}</span>
        </div>
    `;

    if (event.type === 'preGoalSuspense' && window.customCursorInstance && typeof window.customCursorInstance.triggerVibration === 'function') {
        window.customCursorInstance.triggerVibration(180, 0.35, 0.25);
    }

    matchData.events.push(event);
}

// =========================================================================================
// [PART 4] 경기 종료 및 후처리
// =========================================================================================

function endMatch(matchData) {
    console.log('🏁 [Match] 경기 종료 처리');
    document.getElementById('endMatchBtn').style.display = 'block';
    document.getElementById('substituteBtn').style.display = 'none';

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
        console.log('🔄 이벤트 일회성 버프 원상 복구:', gameData.tempEventBuffs);
        
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

    // 리그 데이터 업데이트
    updateLeagueData(matchData, points);
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

    // [신규] 전술 숙련도(낭만) 증가 로직 (+2%)
    if (!gameData.tacticMastery) {
        gameData.tacticMastery = {};
    }
    const currentTac = gameData.currentTactic || 'balanced';
    gameData.tacticMastery[currentTac] = Math.min(100, (gameData.tacticMastery[currentTac] || 0) + 2);
    // 理쒖쥌 硫붿떆吏
    const strengthDiff = matchData.strengthDiff || { userAdvantage: false };
    let finalMsg = `경기 종료! ${result} (${userScore}-${oppScore})`;
    if ((result === '승리' && !strengthDiff.userAdvantage) || (result === '패배' && strengthDiff.userAdvantage)) {
        finalMsg += result === '승리' ? `\n🎉 대이변! 불리한 전력을 뒤집고 승리!` : `\n😱 충격! 유리한 경기에서 패배...`;
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

    // [蹂듦뎄] 寃쎄린 ???ㅼ뭅?고듃 ?쒕룞 泥섎━
    if (!gameData.isWorldCupMode && gameData.hiredScout && typeof scoutingSystem !== 'undefined') {
        const scout = scoutingSystem.scouts[gameData.hiredScout.tier];
        if (scout && Math.random() < scout.chance) {
            const result = scoutingSystem.scoutForPlayers(gameData.hiredScout.tier);
            if (result.success) {
                setTimeout(() => {
                    alert(`[스카우트 보고서]\n${result.message}`);
                    if (typeof displayScoutedPlayers === 'function') displayScoutedPlayers(result.players);
                    if (typeof displayYouthPlayers === 'function') displayYouthPlayers();
                }, 1500);
            }
        }
        gameData.hiredScout.remainingMatches--;
        if (gameData.hiredScout.remainingMatches <= 0) {
            setTimeout(() => {
                alert(`[계약 만료] ${scout.name}과의 계약이 만료되었습니다.`);
                gameData.hiredScout = null;
            }, 2000);
        }
    }

    // ?꾩쿂由?(?깆옣, 遺???뚮났 ??
    if (typeof processPostMatchGrowth === 'function') setTimeout(processPostMatchGrowth, 1000);

    // [以묒슂] 媛쒖씤湲곕줉 ?낅뜲?댄듃 諛?AI ?쒕??덉씠???ㅽ뻾 (simulateOtherMatches ?泥?
    if (typeof updateRecordsAfterMatch === 'function') {
        updateRecordsAfterMatch(resultPayload);
    }

    injurySystem.removeInjuredFromSquad();

    // [蹂듦뎄] ?쇱떆???ㅽ꺈 珥덇린??
    if (gameData.temporaryStats) {
        if (window.GameState) window.GameState.clearTemporaryStats();
        else gameData.temporaryStats = {};
    }

    // ?ㅼ쓬 ?쇱슫??以鍮?
    if (window.GameState) window.GameState.advanceRound();
    else gameData.currentRound++;
    setNextOpponent();

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
                    const recovered = Math.min(100, Math.floor(remaining + (100 - remaining) * (5 / 6)));

                    realPlayer.condition = recovered;
                }
            }
        });

        // 2. 寃쎄린 ?????좎닔 ?먯쭊???뚮났 (+25)
        userPlayers.forEach(p => {
            if (!playedPlayerNames.has(p.name)) {
                const current = p.condition !== undefined ? p.condition : 100;
                p.condition = Math.min(100, current + 25);
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
    const divisionKey = `division${gameData.currentLeague}`;
    const userData = gameData.leagueData[divisionKey][gameData.selectedTeam];
    const oppData = gameData.leagueData[divisionKey][gameData.currentOpponent];

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
}

// =========================================================================================
// [PART 5] 인터뷰 및 평점 시스템
// =========================================================================================

function startInterview(result, userScore, opponentScore, strengthDiff) {
    // 부상자 업데이트
    injurySystem.updateInjuries();
    injurySystem.removeInjuredFromSquad();

    showScreen('interviewScreen');

    const questions = getInterviewQuestions(result, userScore, opponentScore, strengthDiff);
    const q = questions[Math.floor(Math.random() * questions.length)];

    document.getElementById('interviewQuestion').textContent = q.question;
    const btns = document.querySelectorAll('.interview-btn');

    q.options.forEach((opt, i) => {
        if (btns[i]) {
            btns[i].textContent = opt.text;
            btns[i].dataset.morale = opt.morale;
            btns[i].style.display = 'block';
        }
    });
    for (let i = q.options.length; i < btns.length; i++) btns[i].style.display = 'none';
}


function getInterviewQuestions(result, userScore, oppScore, strengthDiff) {
    const scoreDiff = Math.abs(userScore - oppScore);
    // strengthDiff가 없을 경우 대비
    const safeStrengthDiff = strengthDiff || { userAdvantage: false, strengthGap: 0 };
    // 이변 여부: 내가 불리한데 이겼거나, 유리한데 졌을 때
    const isUpset = (result === '승리' && !safeStrengthDiff.userAdvantage) ||
        (result === '패배' && safeStrengthDiff.userAdvantage);

    if (result === '승리') {
        if (isUpset) {
            // 업셋 승리 (불리한 전력으로 승리)
            return [{
                question: "객관적인 전력의 열세를 뒤집고 훌륭한 승리를 거뒀습니다. 오늘 경기의 승인(勝因)은 무엇입니까?",
                options: [
                    { text: "선수들의 투지가 만들어낸 기적입니다. 그들은 운동장에서 모든 것을 쏟아부었고, 불가능을 가능으로 만들었습니다.", morale: 20 },
                    { text: "우리가 준비한 맞춤형 전술이 완벽하게 적중했습니다. 상대의 허점을 파고든 것이 주효했습니다.", morale: 15 },
                    { text: "운이 꽤 좋았던 경기였습니다. 하지만 결과에 만족하며 승점 3점을 챙긴 것에 의의를 둡니다.", morale: 5 }
                ]
            }];
        } else if (scoreDiff >= 3) {
            // 대승 (3점차 이상)
            return [{
                question: "압도적인 경기력으로 대승을 거두셨습니다. 오늘 경기력에 대해 어떻게 평가하시나요?",
                options: [
                    { text: "완벽에 가까운 경기였습니다. 공수 모든 면에서 우리가 원하던 플레이가 나왔고, 선수들이 자랑스럽습니다.", morale: 15 },
                    { text: "우리의 본실력을 보여준 경기였습니다. 이 기세를 몰아 다음 경기에서도 좋은 모습을 보여드리겠습니다.", morale: 10 },
                    { text: "상대가 오늘 유독 부진했던 것 같습니다. 점수 차만큼의 실력 차이는 아니었다고 생각합니다.", morale: 0 }
                ]
            }];
        } else {
            // 일반 승리
            return [{
                question: "치열한 접전 끝에 귀중한 승리를 챙겼습니다. 오늘 경기를 총평해주신다면?",
                options: [
                    { text: "선수들이 끝까지 집중력을 잃지 않고 뛰어준 덕분입니다. 팀워크가 빛난 승리였습니다.", morale: 10 },
                    { text: "힘든 경기였지만 결과적으로 승리했다는 것이 중요합니다. 우리는 승점 3점을 얻을 자격이 있었습니다.", morale: 7 },
                    { text: "몇몇 장면에서는 실수가 있었지만, 결과를 가져온 것에 만족합니다. 보완할 점은 훈련을 통해 고쳐나가겠습니다.", morale: 3 }
                ]
            }];
        }
    } else if (result === '패배') {
        if (isUpset) {
            // 충격패 (유리한 전력으로 패배)
            return [{
                question: "전력상 우위가 예상되었음에도 불구하고 충격적인 패배를 당했습니다. 팬들의 실망이 클 텐데, 어떻게 생각하십니까?",
                options: [
                    { text: "오늘 패배의 모든 책임은 감독인 저에게 있습니다. 전술적 준비가 미흡했고, 선수들을 제대로 이끌지 못했습니다.", morale: 10 }, // 책임 감수 -> 사기 상승(보호)
                    { text: "몇몇 선수들의 안일한 플레이가 실망스러웠습니다. 프로라면 경기장에서 증명해야 합니다. 정신력 재무장이 필요합니다.", morale: -15 }, // 선수 비난 -> 사기 하락
                    { text: "축구에서는 일어날 수 있는 일입니다. 상대가 오늘 매우 잘 준비해왔고, 우리는 운이 따르지 않았습니다.", morale: -5 }
                ]
            }];
        } else if (scoreDiff >= 3) {
            // 대패
            return [{
                question: "무기력한 경기 끝에 대패를 당했습니다. 무엇이 가장 큰 문제였다고 보십니까?",
                options: [
                    { text: "팬 여러분께 죄송합니다. 오늘 우리는 아무것도 보여주지 못했습니다. 철저히 분석하여 다시는 이런 경기를 하지 않겠습니다.", morale: 5 },
                    { text: "상대와의 실력 차이를 인정할 수밖에 없습니다. 우리는 아직 부족하고, 배워야 할 점이 많습니다.", morale: -5 },
                    { text: "초반 실점 이후 팀이 급격히 무너졌습니다. 수비 조직력을 처음부터 다시 점검해야 할 것 같습니다.", morale: -10 }
                ]
            }];
        } else {
            // 일반 패배 (아쉬운 패배)
            return [{
                question: "아쉽게 패배하며 승점을 얻지 못했습니다. 오늘 경기에서 긍정적인 부분을 찾을 수 있었나요?",
                options: [
                    { text: "패배는 언제나 쓰라리지만, 선수들이 끝까지 포기하지 않고 뛴 점은 높이 평가합니다.", morale: 5 },
                    { text: "결정력 부족이 아쉽습니다. 찬스는 만들었지만 마무리하지 못하면 이길 수 없습니다.", morale: -5 },
                    { text: "상대가 우리보다 조금 더 이길 자격이 있었습니다. 패배를 인정하고 다음 경기를 준비하겠습니다.", morale: 0 }
                ]
            }];
        }
    }

    // 무승부
    if (safeStrengthDiff.userAdvantage && safeStrengthDiff.strengthGap > 10) {
        // 강한 팀이 무승부 (실망스러운 무승부)
        return [{
            question: "반드시 잡아야 할 경기에서 무승부에 그쳤습니다. 결과에 만족하시나요?",
            options: [
                { text: "전혀 만족스럽지 않습니다. 우리는 이길 수 있는 경기를 놓쳤고, 승점 2점을 잃은 기분입니다.", morale: -5 },
                { text: "상대가 작정하고 수비적으로 나왔을 때 뚫어내지 못한 우리의 책임입니다. 더 창의적인 공격 해법을 찾아야 합니다.", morale: 0 },
                { text: "아쉽지만 원정에서 승점 1점도 나쁘지 않습니다. 리그는 장기 레이스니까요.", morale: 2 }
            ]
        }];
    } else if (!safeStrengthDiff.userAdvantage && safeStrengthDiff.strengthGap > 10) {
        // 약한 팀이 무승부 (값진 무승부)
        return [{
            question: "강팀을 상대로 대등한 경기를 펼치며 무승부를 기록했습니다. 오늘 경기를 어떻게 보셨습니까?",
            options: [
                { text: "선수들이 자랑스럽습니다. 강팀을 상대로 물러서지 않고 우리의 축구를 보여줬습니다. 승리만큼 값진 무승부입니다.", morale: 10 },
                { text: "수비적으로 잘 버텨줬습니다. 계획대로 승점을 챙길 수 있어서 다행입니다.", morale: 5 },
                { text: "이길 수도 있었던 경기라 조금 아쉬움이 남습니다. 하지만 선수들의 자신감은 확실히 올라갔을 것입니다.", morale: 8 }
            ]
        }];
    } else {
        // 비슷한 전력 간 무승부
        return [{
            question: "팽팽한 접전 끝에 승부를 가리지 못했습니다. 경기 내용에 대해 어떻게 생각하십니까?",
            options: [
                { text: "양 팀 모두 좋은 경기를 했습니다. 무승부가 공정한 결과라고 생각합니다.", morale: 3 },
                { text: "우리가 조금 더 우세했다고 생각하지만, 골 결정력이 아쉬웠습니다. 다음에는 반드시 승리하겠습니다.", morale: 0 },
                { text: "팬들에게 승리를 선물하지 못해 죄송합니다. 다음 경기에서는 더 공격적인 모습으로 보답하겠습니다.", morale: 2 }
            ]
        }];
    }
}

function handleInterview(option) {
    const moraleChange = parseInt(document.querySelector(`[data-option="${option}"]`).dataset.morale);
    if (window.GameState) window.GameState.adjustTeamMorale(moraleChange);
    else gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale + moraleChange));

    checkSeasonEnd();
    showScreen('lobby');
    updateDisplay();
    alert(`인터뷰 완료! 팀 사기 ${moraleChange > 0 ? '+' : ''}${moraleChange}`);
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
        el.innerHTML = '';
        list.forEach(r => {
            const div = document.createElement('div');
            div.className = 'rating-row';
            let stats = '';
            if (r.goals > 0) stats += ` ⚽${r.goals})`;
            if (r.assists > 0) stats += ` 👟(${r.assists})`;

            div.innerHTML = `
                <span>${r.player.name}${stats}</span>
                <span>${r.rating}</span>
            `;
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

        startInterview(result, userScore, oppScore, diff);
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
        description: `🚑 ${injury.teamName}의 ${injury.player.name}, 부상으로 교체됩니다! (${injury.gamesOut}경기 결장 예상)`
    };
}

// [교체 시스템 구현]
let selectedFieldPlayer = null;
let selectedBenchPlayer = null;

function createSubPlayerElement(player) {
    const el = document.createElement('div');
    el.className = 'substitution-player';
    el.dataset.playerName = player.name;
    el.innerHTML = `
        <div class="name">${player.name} (${player.position})</div>
        <div class="details">OVR ${Math.floor(player.rating)}</div>
    `;
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
    fieldPlayersList.innerHTML = '';
    benchPlayersList.innerHTML = '';
    selectedFieldPlayer = null;
    selectedBenchPlayer = null;

    subsLeftEl.textContent = `남은 교체 횟수: ${5 - matchData.substitutionsMade}`;
    modalTitle.textContent = isForced ? `🚨 부상 선수 교체` : '선수 교체';

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

    // 2. 벤치 선수 목록 (전체 선수 중 필드/부상 제외)
    const allPlayers = teams[gameData.selectedTeam];
    const fieldPlayerNames = new Set(fieldPlayers.map(p => p.name));

    const benchPlayers = allPlayers.filter(p =>
        !fieldPlayerNames.has(p.name) &&
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
    // 1. gameData.squad ?낅뜲?댄듃
    const squad = gameData.squad;
    if (squad.gk && squad.gk.name === playerOut.name) squad.gk = playerIn;
    else {
        ['df', 'mf', 'fw'].forEach(pos => {
            const idx = squad[pos].findIndex(p => p && p.name === playerOut.name);
            if (idx !== -1) squad[pos][idx] = playerIn;
        });
    }

    // 2. 엔진 데이터 업데이트 (SimPlayer 교체)
    if (matchData.engine) {
        const simPlayers = matchData.engine.players;
        const simPlayerIndex = simPlayers.findIndex(p => p.id === playerOut.name);

        if (simPlayerIndex !== -1) {
            const simPlayer = simPlayers[simPlayerIndex];

            // 기존 SimPlayer 객체를 새 선수 정보로 갱신
            simPlayer.id = playerIn.name;
            simPlayer.name = playerIn.name;
            simPlayer.rating = playerIn.rating;
            // [수정] 교체 투입 선수 체력 반영
            simPlayer.stamina = (playerIn.condition !== undefined) ? playerIn.condition : 100;

            // 능력치 업데이트
            simPlayer.stats = {
                speed: playerIn.rating,
                passing: playerIn.rating,
                shooting: playerIn.rating,
                defense: playerIn.rating,
                decision: playerIn.rating
            };

            // 역할 재설정
            let role = 'CM';
            if (gameData.playerRoles && gameData.playerRoles[playerIn.name]) {
                role = gameData.playerRoles[playerIn.name];
            } else {
                if (playerIn.position === 'FW') role = 'AF';
                else if (playerIn.position === 'MF') role = 'BBM';
                else if (playerIn.position === 'DF') role = 'CD';
                else if (playerIn.position === 'GK') role = 'GK';
            }
            simPlayer.role = role;

            // [시각화 동기화] 비주얼라이저 유닛 업데이트
            if (window.matchVisualizer && window.matchVisualizer.units[playerOut.name]) {
                const unit = window.matchVisualizer.units[playerOut.name];
                delete window.matchVisualizer.units[playerOut.name];
                unit.id = playerIn.name;
                unit.name = playerIn.name;
                window.matchVisualizer.units[playerIn.name] = unit;
            }
        }

        // 스테미나 재계산 (엔진 메서드 호출)
        if (typeof matchData.engine.recalculateStaminaOnSub === 'function') {
            matchData.engine.recalculateStaminaOnSub(playerOut);
        }
    }

    // 3. 기록 및 이벤트
    matchData.substitutionsMade++;
    const subEvent = {
        minute: matchData.minute,
        type: 'substitution',
        description: `🔄 교체: ${playerOut.name} OUT / ${playerIn.name} IN`
    };
    displayEvent(subEvent, matchData);

    // 4. 모달 닫기 및 경기 재개
    document.getElementById('substitutionModal').style.display = 'none';
    selectedFieldPlayer = null;
    selectedBenchPlayer = null;

    if (matchData.isPausedForInjury) {
        matchData.isPausedForInjury = false;
        matchData.isRunning = true;
        console.log('⚽ 부상 교체 완료, 경기 재개');
    }
}

// 모달 닫기 버튼
function closeSubstitutionModal() {
    if (window.currentMatchData && window.currentMatchData.isPausedForInjury) {
        alert("🚨 부상 선수가 있어 반드시 교체해야 합니다!");
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
        alert(`🚨 ${player.name} 부상 발생! 경기를 뛸 수 없어 교체가 필요합니다.`);
        openSubstitutionModal(matchData, true, player);
    }, 100);
}

// 전역 인스턴스
const injurySystem = new InjurySystem();
window.injurySystem = injurySystem;
window.startMatch = startMatch;
window.handleInterview = handleInterview;

// [신규] 경기 속도 조절 치트키 (Shift + F)
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
});
