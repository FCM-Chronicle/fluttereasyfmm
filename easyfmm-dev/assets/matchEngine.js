// matchEngine.js
// CM-style phase-driven text match engine (legacy adapter surface preserved)
//
// COMPAT CONTRACT (do not break without updating tacticSystem.js / visibleMatch.js):
// - window.RealSoccerEngine(homeSquad, awaySquad, homeTactic, awayTactic)
// - engine.update(minute, isNewMinute) -> { ball, players, events, isCelebration, isSuspense }
// - engine.getSnapshot(), recalculateStaminaOnSub(playerOut)
// - engine.startExitAnimation(winner), updatePostMatch(), isExitAnimationDone()
// - events: goal|miss|pass|throughpass|save|block|tackle|dribble|preGoalSuspense
//   goal: { type, scorer, team, assister? }
//   miss: { type, shooter }
//   preGoalSuspense: { type, beat, totalBeats, shooter, team, intensity }

const BallState = {
    DEAD: 0,
    CONTROLLED: 1,
    IN_FLIGHT: 2,
    LOOSE: 3
};

const MatchPhase = {
    BUILD_UP: 'build_up',
    MIDFIELD: 'midfield',
    ATTACK: 'attack',
    CHANCE: 'chance',
    SUSPENSE: 'suspense',
    TURNOVER: 'turnover'
};

const TACTIC_PROFILES = {
    tikitaka:      { width: 0.82, tempo: 0.92, directness: 0.72, press: 0.78, attackRisk: 0.76, chanceRate: 0.14 },
    possession:    { width: 0.86, tempo: 0.82, directness: 0.62, press: 0.62, attackRisk: 0.68, chanceRate: 0.12 },
    lavolpiana:    { width: 0.90, tempo: 0.84, directness: 0.66, press: 0.58, attackRisk: 0.66, chanceRate: 0.13 },
    gegenpress:    { width: 0.92, tempo: 1.16, directness: 0.88, press: 1.28, attackRisk: 0.92, chanceRate: 0.16 },
    totalFootball: { width: 0.96, tempo: 1.04, directness: 0.82, press: 0.96, attackRisk: 0.88, chanceRate: 0.15 },
    counter:       { width: 1.08, tempo: 1.18, directness: 1.22, press: 0.56, attackRisk: 0.86, chanceRate: 0.17 },
    longBall:      { width: 1.05, tempo: 1.10, directness: 1.28, press: 0.50, attackRisk: 0.80, chanceRate: 0.15 },
    twoLine:       { width: 0.92, tempo: 0.92, directness: 0.86, press: 0.46, attackRisk: 0.62, chanceRate: 0.11 },
    parkBus:       { width: 0.80, tempo: 0.72, directness: 0.78, press: 0.34, attackRisk: 0.48, chanceRate: 0.09 },
    catenaccio:    { width: 0.82, tempo: 0.78, directness: 0.86, press: 0.38, attackRisk: 0.52, chanceRate: 0.08 },
    balanced:      { width: 0.92, tempo: 0.92, directness: 0.82, press: 0.62, attackRisk: 0.68, chanceRate: 0.12 }
};

const SUSPENSE_BEATS = {
    low: [
        '~~{shooter}의 슛!'
    ],
    medium: [
        '~~{shooter}의 슛!',
        '공이 골대를 향합니다!'
    ],
    high: [
        '~~{shooter}의 슛!',
        '골키퍼가 반응합니다...!'
    ]
};

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getMatchDramaConfig() {
    const defaults = { enabled: true, intensity: 'high' };
    if (typeof gameData === 'undefined') return defaults;
    if (gameData.matchDrama) {
        return {
            enabled: gameData.matchDrama.enabled !== false,
            intensity: gameData.matchDrama.intensity || 'high'
        };
    }
    if (gameData.settings && gameData.settings.immersionMode === false) {
        return { enabled: false, intensity: 'medium' };
    }
    return defaults;
}

class SimBall {
    constructor() {
        this.x = 50;
        this.y = 50;
        this.z = 0;
        this.state = BallState.CONTROLLED;
        this.owner = null;
    }
}

class SimPlayer {
    constructor(data, teamId, role, lineStats, teamMorale, tacticMultiplier) {
        this.id = data.name;
        this.name = data.name;
        this.position = data.position;
        this.rating = data.rating;
        this.teamId = teamId;
        this.role = role;
        this.x = 0;
        this.y = 0;
        this.baseX = 0;
        this.baseY = 0;
        this.stamina = (data.condition !== undefined) ? data.condition : 100;
        this.stats = this.calcStats(data, role, lineStats, teamMorale, tacticMultiplier);
    }

    calcStats(playerData, role, lineStats, teamMorale, tacticMultiplier) {
        if (!lineStats || !lineStats.attack) {
            const r = playerData.rating;
            return { passing: r, shooting: r, defense: r, speed: r, decision: r, physical: r };
        }
        const moraleFactor = 1 + ((teamMorale - 50) * 0.0005);
        let line;
        if (playerData.position === 'FW') line = 'attack';
        else if (playerData.position === 'MF') line = 'midfield';
        else line = 'defense';

        const baseStats = lineStats[line].stats;
        const finalStats = {};
        const statMapping = {
            passing: 'technique', shooting: 'attack', defense: 'defense',
            speed: 'speed', decision: 'mentality', physical: 'physical'
        };

        for (const [simStat, dnaStat] of Object.entries(statMapping)) {
            let val = TacticsManager.calculateFinalPower(baseStats[dnaStat] || playerData.rating, role, dnaStat);
            val = val * moraleFactor * tacticMultiplier;
            finalStats[simStat] = Math.round(val);
        }
        return finalStats;
    }
}

class RealSoccerEngine {
    constructor(homeSquad, awaySquad, homeTactic, awayTactic) {
        this.players = [];
        this.ball = new SimBall();
        this.matchTime = 0;
        this.eventsQueue = [];
        this.celebrationTimer = 0;
        this.lastScorerTeam = null;
        this.homeScore = 0;
        this.awayScore = 0;
        this.userStats = null;
        this.aiStats = null;
        this.teamTactics = { home: homeTactic, away: awayTactic };
        this.teamStrength = { home: 70, away: 70 };

        this.phase = MatchPhase.BUILD_UP;
        this.possessionTeam = Math.random() < 0.5 ? 'home' : 'away';
        this.attackDepth = 35;
        this.carrier = null;
        this.assister = null;
        this.defender = null;
        this.goalkeeper = null;
        this.shooter = null;

        this.suspenseTicksRemaining = 0;
        this.suspenseBeatIndex = 0;
        this.suspenseTotalBeats = 0;
        this.pendingResolution = null;
        this.isSuspenseActive = false;

        this.exitAnimActive = false;
        this.exitAnimTicks = 0;
        this.exitAnimDone = false;

        this.initTeam(homeSquad, 'home', homeTactic);
        this.initTeam(awaySquad, 'away', awayTactic);
        this.teamStrength.home = this.calcTeamStrength(homeSquad);
        this.teamStrength.away = this.calcTeamStrength(awaySquad);
        this.pickPhaseActors();
        this.resetPositions(this.possessionTeam);
        this.syncBallToCarrier();
    }

    calcTeamStrength(squad) {
        const all = [squad.gk, ...squad.df, ...squad.mf, ...squad.fw].filter(Boolean);
        if (!all.length) return 70;
        return all.reduce((s, p) => s + p.rating, 0) / all.length;
    }

    generateAIStats(squad, tactic = 'balanced') {
        const aiStats = { attack: { stats: {} }, midfield: { stats: {} }, defense: { stats: {} } };
        const calcAvg = (players) => players.length > 0
            ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length) : 70;

        const lines = {
            attack: calcAvg(squad.fw.filter(p => p)),
            midfield: calcAvg(squad.mf.filter(p => p)),
            defense: calcAvg([...squad.df.filter(p => p), squad.gk].filter(p => p))
        };

        const dnaPriority = {
            tikitaka: ['technique', 'mentality', 'attack', 'speed', 'defense', 'physical'],
            possession: ['technique', 'mentality', 'physical', 'attack', 'defense', 'speed'],
            lavolpiana: ['technique', 'defense', 'mentality', 'speed', 'attack', 'physical'],
            gegenpress: ['physical', 'speed', 'defense', 'mentality', 'attack', 'technique'],
            totalFootball: ['mentality', 'technique', 'physical', 'speed', 'attack', 'defense'],
            counter: ['speed', 'attack', 'physical', 'mentality', 'defense', 'technique'],
            longBall: ['physical', 'attack', 'defense', 'speed', 'mentality', 'technique'],
            twoLine: ['speed', 'defense', 'attack', 'physical', 'mentality', 'technique'],
            parkBus: ['defense', 'physical', 'mentality', 'speed', 'attack', 'technique'],
            catenaccio: ['defense', 'mentality', 'physical', 'technique', 'attack', 'speed'],
            balanced: ['attack', 'speed', 'technique', 'physical', 'defense', 'mentality']
        };

        const priorities = dnaPriority[tactic] || dnaPriority.balanced;
        const offsets = [6, 3, 1, -1, -3, -6];

        for (const [line, ovr] of Object.entries(lines)) {
            const totalPoints = ovr * 6;
            const baseVal = Math.floor(totalPoints / 6);
            let rem = totalPoints % 6;
            
            priorities.forEach((k, i) => {
                aiStats[line].stats[k] = baseVal + offsets[i] + (rem > 0 ? 1 : 0);
                if (rem > 0) rem--;
            });
        }
        return aiStats;
    }

    getBestRoleForTactic(tactic, position, index) {
        if (position === 'GK') return 'GK';
        const roleMap = {
            tikitaka:      { FW: ['F9', 'DLF'], MF: ['DLP', 'AP'], DF: ['BPD', 'IWB'] },
            possession:    { FW: ['DLF', 'CF'], MF: ['DLP', 'AP'], DF: ['BPD', 'WB'] },
            lavolpiana:    { FW: ['F9', 'W'], MF: ['DLP', 'REG'], DF: ['BPD', 'IWB'] },
            gegenpress:    { FW: ['PF', 'AF'], MF: ['BBM', 'BWM'], DF: ['CD', 'CWB'] },
            totalFootball: { FW: ['CF', 'F9'], MF: ['BBM', 'MEZ'], DF: ['BPD', 'CWB'] },
            counter:       { FW: ['AF', 'P'], MF: ['BWM', 'DLP'], DF: ['NCB', 'FB'] },
            longBall:      { FW: ['TM', 'AF'], MF: ['BWM', 'CM'], DF: ['NCB', 'CD'] },
            twoLine:       { FW: ['AF', 'P'], MF: ['BWM', 'CAR'], DF: ['CD', 'FB'] },
            parkBus:       { FW: ['P', 'TM'], MF: ['BWM', 'DLP'], DF: ['NCB', 'CD'] },
            catenaccio:    { FW: ['TM', 'P'], MF: ['BWM', 'DLP'], DF: ['NCB', 'LIB'] }
        };
        const defaultRoles = { FW: ['AF', 'CF'], MF: ['BBM', 'AP'], DF: ['CD', 'FB'] };
        const selectedMap = roleMap[tactic] || defaultRoles;
        const candidates = selectedMap[position] || defaultRoles[position];
        return candidates[index % candidates.length];
    }

    initTeam(squad, teamId, tactic) {
        const tacticMultiplier = tactic === 'balanced' ? 0.60 : 1.0;
        const isUserTeam = (teamId === 'home' && gameData.isHomeGame) || (teamId === 'away' && !gameData.isHomeGame);

        let lineStats;
        let teamMorale = 50;
        if (isUserTeam) {
            lineStats = gameData.lineStats;
            this.userStats = lineStats;
            teamMorale = gameData.teamMorale || 50;
        } else {
            lineStats = this.aiStats || this.generateAIStats(squad, tactic);
            this.aiStats = lineStats;
            teamMorale = 20 + Math.floor(Math.random() * 71);
        }

        const setupLine = (list, baseX) => {
            const height = 100;
            list.forEach((p, i) => {
                if (!p) return;
                const role = (gameData.playerRoles && gameData.playerRoles[p.name])
                    ? gameData.playerRoles[p.name]
                    : this.getBestRoleForTactic(tactic, p.position, i);
                const simP = new SimPlayer(p, teamId, role, lineStats, teamMorale, tacticMultiplier);
                simP.baseX = baseX;
                simP.baseY = (height / (list.length + 1)) * (i + 1);
                simP.x = simP.baseX;
                simP.y = simP.baseY;
                this.players.push(simP);
            });
        };

        if (teamId === 'home') {
            if (squad.gk) setupLine([squad.gk], 5);
            setupLine(squad.df, 20);
            setupLine(squad.mf, 45);
            setupLine(squad.fw, 80);
        } else {
            if (squad.gk) setupLine([squad.gk], 95);
            setupLine(squad.df, 80);
            setupLine(squad.mf, 55);
            setupLine(squad.fw, 20);
        }
    }

    getTeamTactic(teamId) {
        if (typeof gameData !== 'undefined') {
            const userSide = gameData.isHomeGame ? 'home' : 'away';
            if (teamId === userSide && gameData.currentTactic) return gameData.currentTactic;
        }
        return this.teamTactics?.[teamId] || 'balanced';
    }

    getCustomSettings(teamId) {
        const cfg = { side: 'all', passing: 'short', tendency: 'balanced', width: 'middle', press: 'middle' };
        if (typeof gameData === 'undefined' || !gameData.deepTactics) return cfg;
        const dt = gameData.deepTactics;
        const userSide = gameData.isHomeGame ? 'home' : 'away';
        if (teamId !== userSide) return cfg;
        cfg.side = dt.attackingSide || 'all';
        cfg.passing = dt.passStyle || 'short';
        cfg.tendency = dt.teamTendency || 'balanced';
        cfg.width = dt.teamWidth || 'middle';
        cfg.press = dt.pressingStrength || 'middle';
        return cfg;
    }

    getTacticProfile(teamId) {
        const tactic = this.getTeamTactic(teamId);
        const base = { ...(TACTIC_PROFILES[tactic] || TACTIC_PROFILES.balanced) };
        const cfg = this.getCustomSettings(teamId);
        if (cfg.tendency === 'offensive') {
            base.attackRisk = Math.min(0.95, base.attackRisk + 0.12);
            base.tempo = Math.min(1.25, base.tempo + 0.08);
            base.chanceRate = Math.min(0.22, base.chanceRate + 0.03);
        } else if (cfg.tendency === 'defensive') {
            base.attackRisk = Math.max(0.35, base.attackRisk - 0.15);
            base.tempo = Math.max(0.60, base.tempo - 0.06);
            base.chanceRate = Math.max(0.06, base.chanceRate - 0.02);
        }
        if (cfg.passing === 'direct' || cfg.passing === 'long') base.directness = Math.min(1.3, base.directness + 0.1);
        if (cfg.press === 'high') base.press = Math.min(1.3, base.press + 0.15);

        // [신규] 전술 숙련도 버프 적용
        if (typeof window !== 'undefined' && window.gameData && teamId === window.gameData.selectedTeam && window.gameData.tacticMastery) {
            const mastery = window.gameData.tacticMastery[tactic] || 0;
            if (mastery > 0) {
                base.chanceRate += (mastery / 100) * 0.05; // 최대 0.05 보너스
                base.press += (mastery / 100) * 0.1; // 최대 0.1 보너스
                base.tempo += (mastery / 100) * 0.05; // 움직임 템포 향상
            }
        }
        // [신규] 포메이션 시너지 반영
        const df = this.getPlayersByTeam(teamId, 'DF').length;
        const mf = this.getPlayersByTeam(teamId, 'MF').length;
        const fw = this.getPlayersByTeam(teamId, 'FW').length;
        const formStr = `${df}-${mf}-${fw}`;

        base.activeSynergy = null;
        base.activePenalty = null;

        // [🟢 시너지 버프]
        if (formStr === '4-5-1' && tactic === 'gegenpress') {
            base.press += 0.3; base.chanceRate += 0.08;
            base.activeSynergy = '4-2-3-1_gegenpress';
        } else if (formStr === '3-5-2' && tactic === 'lavolpiana') {
            base.width += 0.3; base.chanceRate += 0.06;
            base.activeSynergy = '3-5-2_lavolpiana';
        } else if (formStr === '4-5-1' && (tactic === 'possession' || tactic === 'tikitaka')) {
            base.chanceRate += 0.1;
            base.activeSynergy = '4-1-4-1_halfspace';
        } else if (formStr === '3-4-3' && (tactic === 'twoLine' || tactic === 'parkBus')) { // parkBus는 역습 전술
            base.directness += 0.3; base.width += 0.2; base.attackRisk += 0.15;
            base.activeSynergy = '3-4-3_fast_transition';
        }
        // [🔴 멸망 패널티]
        else if (formStr === '4-3-3' && tactic === 'longBall') {
            base.chanceRate -= 0.06; base.attackRisk -= 0.1;
            base.activePenalty = '4-3-3_longball_fail';
        } else if (formStr === '5-3-2' && tactic === 'gegenpress') {
            base.press += 0.2; base.attackRisk -= 0.2; 
            base.activePenalty = '5-3-2_high_press_fail';
        } else if (formStr === '3-4-3' && tactic === 'possession') { // 3-4-3 텐백 패널티로 교체 (점유율이나 극단적 수비 시)
            base.chanceRate -= 0.08;
            base.activePenalty = '3-4-3_parkbus_fail';
        }
        // 기존 유지
        else if (formStr === '4-3-3' && tactic === 'tikitaka') {
            base.tempo += 0.1; base.chanceRate += 0.05;
        } else if (formStr === '4-4-2' && tactic === 'longBall') {
            base.directness += 0.15; base.chanceRate += 0.04;
        } else if (formStr === '3-5-2' && tactic === 'gegenpress') {
            base.press += 0.2; base.attackRisk += 0.05;
        } else if (formStr === '5-4-1' && tactic === 'parkBus') {
            base.press += 0.15; base.attackRisk -= 0.1;
        } else if (formStr === '4-2-4' && tactic === 'possession') {
            base.tempo -= 0.1; base.press -= 0.1; // Bad synergy
        }

        return base;
    }

    getPlayersByTeam(teamId, position) {
        return this.players.filter(p => p.teamId === teamId && (!position || p.position === position));
    }

    pickPhaseActors() {
        const team = this.possessionTeam;
        const opp = team === 'home' ? 'away' : 'home';
        const fw = this.getPlayersByTeam(team, 'FW');
        const mf = this.getPlayersByTeam(team, 'MF');
        const df = this.getPlayersByTeam(team, 'DF'); // Changed from opp to team!
        const oppDf = this.getPlayersByTeam(opp, 'DF');
        const gk = this.getPlayersByTeam(opp, 'GK');

        // --- Phase-specific carrier selection ---
        if (this.phase === MatchPhase.BUILD_UP) {
            // BUILD_UP: Always use center back (defender) as carrier!
            this.carrier = df.length ? pickRandom(df) : (mf.length ? pickRandom(mf) : pickRandom(this.getPlayersByTeam(team)));
        } else if (this.phase === MatchPhase.MIDFIELD) {
            // MIDFIELD: Midfielder carrier
            this.carrier = pickRandom(mf.length ? mf : fw) || pickRandom(this.getPlayersByTeam(team));
        } else {
            // ATTACK/CHANCE/SUSPENSE: Forward or MF carrier
            this.carrier = pickRandom(fw.length ? fw : mf) || pickRandom(this.getPlayersByTeam(team));
        }
        
        this.assister = pickRandom(mf) || pickRandom(fw);
        this.shooter = pickRandom(fw) || this.carrier;
        this.goalkeeper = gk[0] || null;

        // [개선] 페이즈에 맞는 논리적인 압박자(수비수) 선택 + 캐리어와 Y좌표가 가장 가까운 선수
        const oppFw = this.getPlayersByTeam(opp, 'FW');
        const oppMf = this.getPlayersByTeam(opp, 'MF');
        
        let pressers = oppDf;
        if (this.phase === MatchPhase.BUILD_UP) pressers = oppFw.length ? oppFw : oppMf;
        else if (this.phase === MatchPhase.MIDFIELD) pressers = oppMf.length ? oppMf : oppDf;
        else pressers = oppDf.length ? oppDf : oppMf;
        
        let bestPresser = pressers[0];
        let minDist = 999;
        if (this.carrier) {
            pressers.forEach(d => {
                const dist = Math.abs(d.baseY - this.carrier.baseY);
                if (dist < minDist) {
                    minDist = dist;
                    bestPresser = d;
                }
            });
        }
        this.defender = bestPresser || pickRandom(oppDf);

        if (this.assister === this.shooter) {
            const alt = mf.find(p => p !== this.shooter) || df[0];
            this.assister = alt || null;
        }
    }

    resetPositions(kickoffTeam) {
        this.possessionTeam = kickoffTeam;
        this.phase = MatchPhase.BUILD_UP;
        this.attackDepth = kickoffTeam === 'home' ? 35 : 65;
        this.players.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
        });
        this.pickPhaseActors();
        this.syncBallToCarrier();
        this.ball.state = BallState.CONTROLLED;
    }

    syncBallToCarrier() {
        if (!this.carrier) return;
        this.ball.owner = this.carrier;
        this.ball.x = this.carrier.x;
        this.ball.y = this.carrier.y;
        this.ball.z = 0;
        this.ball.state = BallState.CONTROLLED;
        this.players.forEach(p => { /* hasBall computed in snapshot */ });
    }

    updateVisualPositions() {
        const isHome = this.possessionTeam === 'home';
        const depthMap = {
            [MatchPhase.BUILD_UP]: isHome ? 40 : 60,
            [MatchPhase.MIDFIELD]: isHome ? 55 : 45,
            [MatchPhase.ATTACK]: isHome ? 75 : 25,
            [MatchPhase.CHANCE]: isHome ? 88 : 12,
            [MatchPhase.SUSPENSE]: isHome ? 92 : 8
        };
        this.attackDepth = depthMap[this.phase] || this.attackDepth;

        // Defensive depth line (for defending team)
        const press = this.getTacticProfile(this.possessionTeam === 'home' ? 'away' : 'home').press;
        const defensivePressMultiplier = Math.min(press, 1.5);

        // --- Position-specific offsets relative to attack depth ---
        const getTargetX = (player, isPossession) => {
            // 중앙(Center) 여부 확인 (baseY가 30~70 사이면 센터백/중앙 미드필더/중앙 공격수)
            const isCenter = player.baseY > 30 && player.baseY < 70;

            // [개선] 킥오프 시 양 팀 공격수 위치 분리 (소유팀은 서클 안, 수비팀은 밖)
            if (this.phase === MatchPhase.KICKOFF) {
                if (player.teamId === this.possessionTeam) {
                    if (player.position === 'FW') return isCenter ? 50 : (player.teamId === 'home' ? 42 : 58);
                    if (player.position === 'MF') return player.teamId === 'home' ? 35 : 65;
                    if (player.position === 'DF') return player.teamId === 'home' ? 20 : 80;
                    if (player.position === 'GK') return player.teamId === 'home' ? 5 : 95;
                } else {
                    if (player.position === 'FW') return player.teamId === 'home' ? 34 : 66; // 서클(반지름 15) 바깥
                    if (player.position === 'MF') return player.teamId === 'home' ? 22 : 78;
                    if (player.position === 'DF') return player.teamId === 'home' ? 12 : 88;
                    if (player.position === 'GK') return player.teamId === 'home' ? 5 : 95;
                }
            }

            if (isPossession) {
                // POSSESSION TEAM: Keep spacing relative to attackDepth, but don't drop behind GK
                let tX = this.attackDepth;
                if (isHome) {
                    if (player.position === 'FW') tX += 15;
                    else if (player.position === 'MF') tX -= 5;
                    else if (player.position === 'DF') {
                        // [개선] CB는 35칸 뒤로 깊게 처지고, FB는 더 공격적으로 올라가도록 10칸 뒤에 머묾
                        tX = isCenter ? Math.max(tX - 35, 12) : Math.max(tX - 10, 20);
                    }
                    else if (player.position === 'GK') tX = 5;
                } else {
                    if (player.position === 'FW') tX -= 15;
                    else if (player.position === 'MF') tX += 5;
                    else if (player.position === 'DF') {
                        tX = isCenter ? Math.min(tX + 35, 88) : Math.min(tX + 10, 80);
                    }
                    else if (player.position === 'GK') tX = 95;
                }
                return tX;
            } else {
                // DEFENDING TEAM: Properly ordered, realistic defensive lines
                // [개선] 전체적인 수비 라인을 골키퍼 쪽으로 더 내림 (CB 더 깊이)
                const defLine = isHome 
                    ? Math.max(100 - 5 - (defensivePressMultiplier * 5), 75)  // Away defends left (towards 100). CB drops to 90~75
                    : Math.min(5 + (defensivePressMultiplier * 5), 25);       // Home defends right (towards 0). CB drops to 10~25
                
                const mfLine = isHome ? defLine - 22 : defLine + 22;
                const fwPressLine = isHome ? mfLine - 20 : mfLine + 20;

                switch(player.position) {
                    case 'FW': 
                        // [요청 반영] 중앙 공격수는 수비 가담을 위해 내려오지 않고, 전방에 높게 머물며 역습 대기
                        return isCenter ? (isHome ? fwPressLine - 10 : fwPressLine + 10) : fwPressLine;
                    case 'MF': return mfLine; // MFs stay ahead of DFs, don't drop to CB
                    case 'DF': 
                        // [개선] 수비 시 풀백(측면)은 덜 내려가도록 오프셋 증가 (12 -> 20)
                        return isCenter ? defLine : (isHome ? defLine - 20 : defLine + 20);
                    case 'GK': return isHome ? 95 : 5;
                    default: return mfLine;
                }
            }
        };

        // --- Update ALL players together ---
        this.players.forEach(player => {
            const isPossessionPlayer = player.teamId === this.possessionTeam;
            let targetX = clamp(getTargetX(player, isPossessionPlayer), 5, 95);
            let targetY = player.baseY;

            // [개선] 캐리어는 어택뎁스로 향함
            if (player === this.carrier) {
                targetX = clamp(this.attackDepth, 5, 95);
                targetY = clamp(player.baseY + (Math.random() * 10 - 5), 5, 95);
            }

            // [개선] 수비수는 캐리어(공)를 향해 직접적으로 압박/태클!
            if (player === this.defender && this.carrier) {
                targetX = this.carrier.x;
                targetY = this.carrier.y;
            }

            // [개선] 선수들 논리적 이동 스피드 하향 (시각 엔진과 맞춤)
            let speed = 0.16; // 오프더볼
            if (player === this.carrier) speed = 0.12; // 캐리어
            else if (player === this.defender) speed = 0.20; // 태클러

            player.x += (targetX - player.x) * speed;
            player.y += (targetY - player.y) * speed;
            
            player.x = clamp(player.x, 2, 98);
            player.y = clamp(player.y, 2, 98);
        });

        // --- Update ball carrier ---
        if (this.carrier) {
            this.ball.x = this.carrier.x;
            this.ball.y = this.carrier.y;
        }

        // --- Update shooter in suspense phase ---
        if (this.shooter && this.phase === MatchPhase.SUSPENSE) {
            this.shooter.x = this.attackDepth;
            this.shooter.y = 50 + (Math.random() * 12 - 6);
            this.ball.x = this.shooter.x;
            this.ball.y = this.shooter.y;
            this.ball.z = 1.5;
            this.ball.state = BallState.IN_FLIGHT;
        }
    }

    getAttackModifier(teamId) {
        const profile = this.getTacticProfile(teamId);
        const str = this.teamStrength[teamId] || 70;
        const opp = teamId === 'home' ? 'away' : 'home';
        const oppStr = this.teamStrength[opp] || 70;
        const diff = (str - oppStr) / 100;
        return profile.attackRisk * (1 + diff * 0.35);
    }

    losePossession(reasonEvent) {
        if (reasonEvent) this.eventsQueue.push(reasonEvent);
        this.possessionTeam = this.possessionTeam === 'home' ? 'away' : 'home';
        this.phase = MatchPhase.BUILD_UP;
        this.attackDepth = this.possessionTeam === 'home' ? 35 : 65;
        this.pickPhaseActors();
        this.syncBallToCarrier();
    }

    startSuspense(resolution) {
        const drama = getMatchDramaConfig();
        const intensity = drama.enabled ? drama.intensity : 'low';
        const beats = SUSPENSE_BEATS[intensity] || SUSPENSE_BEATS.medium;
        this.pendingResolution = resolution;
        this.suspenseTotalBeats = beats.length;
        this.suspenseBeatIndex = 0;
        this.suspenseTicksRemaining = beats.length;
        this.isSuspenseActive = true;
        this.phase = MatchPhase.SUSPENSE;
        this.emitSuspenseBeat(beats, intensity);
    }

    emitSuspenseBeat(beats, intensity) {
        const template = beats[this.suspenseBeatIndex] || beats[beats.length - 1];
        const desc = template.replace('{shooter}', this.shooter ? this.shooter.name : '선수');
        this.eventsQueue.push({
            type: 'preGoalSuspense',
            beat: this.suspenseBeatIndex + 1,
            totalBeats: this.suspenseTotalBeats,
            shooter: this.shooter ? this.shooter.name : '선수',
            team: this.possessionTeam,
            intensity,
            desc
        });
    }

    processSuspenseTick() {
        this.suspenseTicksRemaining--;
        this.suspenseBeatIndex++;
        const drama = getMatchDramaConfig();
        const intensity = drama.enabled ? drama.intensity : 'low';
        const beats = SUSPENSE_BEATS[intensity] || SUSPENSE_BEATS.medium;

        if (this.suspenseTicksRemaining > 0) {
            this.emitSuspenseBeat(beats, intensity);
            this.updateVisualPositions();
            return;
        }

        this.isSuspenseActive = false;
        if (this.pendingResolution) {
            this.eventsQueue.push(this.pendingResolution);
            if (this.pendingResolution.type === 'goal') {
                this.lastGoalTime = this.matchTime;
                this.lastGoalTeam = this.possessionTeam;
                this.triggerCelebration(this.possessionTeam);
            } else {
                this.losePossession();
            }
            this.pendingResolution = null;
        }
        this.updateVisualPositions();
    }

    triggerCelebration(scoringTeam) {
        this.lastScorerTeam = scoringTeam;
        this.celebrationTimer = 8;
        this.ball.state = BallState.DEAD;
        this.ball.z = 0;
    }

    resolveChance() {
        const team = this.possessionTeam;
        const profile = this.getTacticProfile(team);
        const atkMod = this.getAttackModifier(team);
        const shooter = this.shooter || this.carrier;
        const gk = this.goalkeeper;
        const roll = Math.random();

        // 전술의 차이를 크게 만들고, 기본 골 확률 상향
        let goalChance = 0.28 * atkMod;
        let saveChance = 0.25;
        let blockChance = 0.13;
        let missChance = 0.34;

        if (profile.directness > 1.0) goalChance += 0.05;
        if (profile.attackRisk > 0.85) goalChance += 0.05;
        if (profile.press > 1.0) blockChance += 0.04;
        goalChance = clamp(goalChance, 0.15, 0.55);

        const total = goalChance + saveChance + blockChance + missChance;
        const nGoal = goalChance / total;
        const nSave = saveChance / total;
        const nBlock = blockChance / total;

        let resolution;
        if (roll < nGoal) {
            resolution = {
                type: 'goal',
                scorer: shooter.name,
                team,
                assister: this.assister && this.assister !== shooter ? this.assister.name : null
            };
        } else if (roll < nGoal + nSave) {
            resolution = {
                type: 'save',
                gk: gk ? gk.name : '골키퍼',
                shooter: shooter.name
            };
        } else if (roll < nGoal + nSave + nBlock) {
            resolution = {
                type: 'block',
                blocker: this.defender ? this.defender.name : '수비수',
                shooter: shooter.name
            };
        } else {
            resolution = { type: 'miss', shooter: shooter.name };
        }

        const drama = getMatchDramaConfig();
        const useSuspense = drama.enabled && resolution.type === 'goal' && Math.random() < 0.85;
        if (useSuspense) {
            this.startSuspense(resolution);
        } else if (resolution.type === 'goal') {
            this.lastGoalTime = this.matchTime;
            this.lastGoalTeam = team;
            this.eventsQueue.push(resolution);
            this.triggerCelebration(team);
        } else {
            this.eventsQueue.push(resolution);
            this.losePossession();
        }
    }

    advancePhase() {
        const team = this.possessionTeam;
        const opp = team === 'home' ? 'away' : 'home';
        const profile = this.getTacticProfile(team);
        const oppProfile = this.getTacticProfile(opp);
        const atkMod = this.getAttackModifier(team);
        const r = Math.random();

        // [신규] 세트피스 후 슛 확률 부스트
        const setPieceBoost = this._setPieceBoost || 0;
        if (this._setPieceBoost) this._setPieceBoost = 0; // 1회 소모

        // [개선] 턴오버 확률 계산 시 캐리어의 능력치(패스/판단)와 수비수의 능력치(수비) 비교
        const carrierStat = this.carrier ? (this.carrier.stats.passing || 70) : 70;
        let defenderStat = this.defender ? (this.defender.stats.defense || 70) : 70;

        // [신규] 체력 고갈 페널티 (70분 이후)
        if (this.matchTime >= 70 && this.defender && this.defender.stamina < 30) {
            defenderStat *= 0.6; // 체력 저하로 수비력 급감
        }

        let turnoverFactor = defenderStat / Math.max(1, carrierStat);
        
        // [신규] Physical DNA / Role 보정
        if (this.defender && this.defender.stats.physical > 85) turnoverFactor *= 1.15;
        if (this.defender && this.defender.role === 'BWM') turnoverFactor *= 1.1;

        // [신규] 실점 후 억제력 (Mental Shake)
        if (this.lastGoalTime && (this.matchTime - this.lastGoalTime <= 5) && this.lastGoalTeam === opp) {
            turnoverFactor *= 1.15; // 실점 팀의 턴오버 15% 증가
        }

        turnoverFactor = clamp(turnoverFactor, 0.4, 1.8);


        if (this.phase === MatchPhase.BUILD_UP) {
            // -------- BUILD UP: Always Center Back distributes --------
            // CB can: 1) Long ball to FW (50% if directness high), 2) Short pass to MF (50%)
            const buildUpR = Math.random();
            const centerBack = this.carrier; // This is always DF (CB) now!

            // [신규] BPD 롤 보정
            let localDirectness = profile.directness;
            if (centerBack && centerBack.role === 'BPD') localDirectness += 0.2;

            if (buildUpR < 0.55 * localDirectness) {
                // Option 1: Long ball from CB to FW
                const fw = this.shooter; // FW target
                this.eventsQueue.push({
                    type: 'pass',
                    from: centerBack ? centerBack.name : '수비수',
                    to: fw ? fw.name : '공격수',
                    desc: `${centerBack ? centerBack.name : '센터백'}가 공격수에게 롱 킥을 보냅니다!`
                });
                // Long ball goes directly to ATTACK phase!
                this.phase = MatchPhase.ATTACK;
                this.pickPhaseActors(); // Update actors for new phase
            } else {
                // Option 2: Short pass from CB to MF
                const mfTarget = this.assister;
                this.eventsQueue.push({ type: 'perfectPass', team,
                    from: centerBack ? centerBack.name : '수비수',
                    to: mfTarget ? mfTarget.name : '미드필더' });
                this.phase = MatchPhase.MIDFIELD;
                this.pickPhaseActors(); // Update actors for new phase (now MF carrier)
            }
            
            // [개선] 빌드업 과정에서 턴오버(패스미스/압박) 발생 확률 (스탯 반영)
            if (Math.random() < 0.05 * oppProfile.press * turnoverFactor) {
                const isIntercept = Math.random() < 0.5;
                this.losePossession({
                    type: 'tackle',
                    player: this.defender ? this.defender.name : '수비수',
                    desc: isIntercept ? `앗, 패스 미스! ${this.defender ? this.defender.name : '상대'}가 공을 낚아챕니다!` : `${this.defender ? this.defender.name : '상대'}의 전방 압박 성공! 공을 뺏어냅니다!`
                });
            }
            return;
        }

        if (this.phase === MatchPhase.MIDFIELD) {
            let openSpace = false;
            if (this.carrier && this.defender) {
                const space = this.possessionTeam === 'home' ? (this.defender.x - this.carrier.x) : (this.carrier.x - this.defender.x);
                if (space > 18) openSpace = true;
            }

            // MIDFIELD: Now MF is carrier, more options but still low pressure!
            // [신규] Speed DNA 및 역할 보정
            let dribbleProb = 0.6;
            if (this.carrier && this.carrier.stats.speed > 85) dribbleProb += 0.15;
            if (this.carrier && this.carrier.role === 'BBM') dribbleProb += 0.1;

            // [신규] 라스트 20분 교체 카드 어드밴티지
            let staminaDiff = (this.carrier ? this.carrier.stamina : 100) - (this.defender ? this.defender.stamina : 100);
            if (this.matchTime >= 70 && staminaDiff > 40 && this.carrier && this.carrier.stats.speed > 80) {
                dribbleProb += 0.3; // 체력 차이 + 스피드 DNA로 수비 유린
            }

            if (openSpace && Math.random() < dribbleProb) {
                // 공간이 열려있으면 높은 확률로 드리블 강행
                this.eventsQueue.push({
                    type: 'dribble',
                    player: this.carrier ? this.carrier.name : '선수',
                    desc: `앞 공간이 열려있습니다! ${this.carrier ? this.carrier.name : '선수'}가 공간을 향해 속도를 높여 드리블합니다!`
                });
                this.phase = MatchPhase.ATTACK;
                this.pickPhaseActors();
            } else if (r < 0.25 * profile.tempo) {
                // Tiki-taka short pass
                this.eventsQueue.push({ type: 'perfectPass', team,
                    from: this.carrier ? this.carrier.name : '선수',
                    to: this.assister ? this.assister.name : '동료' });
            } else if (r < 0.45 * profile.directness) {
                // Long ball option
                this.eventsQueue.push({
                    type: 'pass',
                    from: this.carrier ? this.carrier.name : '선수',
                    to: this.shooter ? this.shooter.name : '공격수',
                    desc: `${this.carrier ? this.carrier.name : '선수'}가 롱 볼을 보냅니다!`
                });
                if (Math.random() < 0.5) {
                    this.phase = MatchPhase.ATTACK;
                    this.pickPhaseActors();
                }
            } else if (r < 0.70) {
                // Dribble
                if (Math.random() < 0.4) {
                    const skills = ['MARSEILLE_TURN', 'ROULETTE', 'ELASTICO', 'LA_CROQUETA'];
                    const skill = pickRandom(skills);
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '선수',
                        skillId: skill,
                        desc: `${this.carrier ? this.carrier.name : '선수'}의 환상적인 개인기 돌파! 수비를 제칩니다!`
                    });
                    this.phase = (Math.random() < 0.5) ? MatchPhase.ATTACK : MatchPhase.CHANCE;
                    this.pickPhaseActors();
                } else {
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '선수',
                        desc: `${this.carrier ? this.carrier.name : '선수'}가 드리블로 전진합니다!`
                    });
                }
            } else if (r < 0.75 * profile.width) {
                // Side run / wide play
                this.eventsQueue.push({ type: 'siderun', player: this.carrier ? this.carrier.name : '선수', team });
            } else if (r < 0.85) {
                // Pressure escape
                const pressurePlayer = this.carrier;
                const presser = this.defender;
                if (pressurePlayer && presser) {
                    this.eventsQueue.push({ type: 'pressureEscape', player: pressurePlayer.name, presser: presser.name });
                }
            }

            // [개선] 턴오버(가로채기/태클)를 먼저 체크하도록 하여 수비 관여도 대폭 상향 (스탯 반영)
            if (Math.random() < 0.10 * oppProfile.press * turnoverFactor) {
                const isIntercept = Math.random() < 0.6;
                this.losePossession({
                    type: 'tackle',
                    player: this.defender ? this.defender.name : '수비수',
                    desc: isIntercept ? `중원에서 패스가 끊깁니다! ${this.defender ? this.defender.name : '상대'}의 영리한 커트!` : `${this.defender ? this.defender.name : '상대'}의 강한 태클이 정확히 들어갑니다!`
                });
                return;
            }

            // 페이즈 전환 (전진)
            if (Math.random() < 0.8 * profile.tempo) {
                this.phase = MatchPhase.ATTACK;
                this.pickPhaseActors(); // Update actors for attack phase
            }
        }

        if (this.phase === MatchPhase.ATTACK) {
            let openSpace = false;
            if (this.carrier && this.defender) {
                const space = this.possessionTeam === 'home' ? (this.defender.x - this.carrier.x) : (this.carrier.x - this.defender.x);
                if (space > 15) openSpace = true;
            }

            // [신규] 공격 중 파울 → 프리킥/코너 분기
            if (Math.random() < 0.1) {
                const fouler = this.defender ? this.defender.name : '수비수';
                const fouled = this.carrier ? this.carrier.name : '선수';
                this.eventsQueue.push({ type: 'foul', fouler, fouled, team: opp });
                if (Math.random() < 0.2) {
                    this.eventsQueue.push({ type: 'yellowcard', player: fouler, team: opp });
                }
                // 코너 50%, 프리킥 50%
                if (Math.random() < 0.5) {
                    this.eventsQueue.push({ type: 'corner', team, player: this.carrier ? this.carrier.name : '선수' });
                    this._setPieceBoost = 0.25;
                } else {
                    this.eventsQueue.push({ type: 'freekick', team, player: fouled });
                    this._setPieceBoost = 0.2;
                }
                return;
            }

            const attackR = Math.random();
            
            if (openSpace && attackR < 0.45) {
                this.eventsQueue.push({
                    type: 'dribble',
                    player: this.carrier ? this.carrier.name : '선수',
                    desc: `수비가 거리를 두고 있습니다! ${this.carrier ? this.carrier.name : '선수'}가 빈 공간으로 치고 들어갑니다!`
                });
                this.phase = MatchPhase.CHANCE;
                this.pickPhaseActors();
            } else if (attackR < 0.2) {
                // Long ball
                this.eventsQueue.push({
                    type: 'pass',
                    from: this.carrier ? this.carrier.name : '선수',
                    to: this.shooter ? this.shooter.name : '공격수',
                    desc: `${this.carrier ? this.carrier.name : '선수'}가 롱 볼을 보냅니다!`
                });
            } else if (attackR < 0.4 * profile.width) {
                // Cross!
                this.eventsQueue.push({ type: 'cross', player: this.carrier ? this.carrier.name : '선수', target: this.shooter ? this.shooter.name : '공격수', team });
            } else if (attackR < 0.65) {
                // Curved dribble or Breakthrough
                if (Math.random() < 0.4) {
                    const skills = ['MARSEILLE_TURN', 'ROULETTE', 'ELASTICO', 'LA_CROQUETA'];
                    const skill = pickRandom(skills);
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '선수',
                        skillId: skill,
                        desc: `${this.carrier ? this.carrier.name : '선수'}의 폭발적인 개인기! 공간을 허물어냅니다!`
                    });
                    this.phase = MatchPhase.CHANCE;
                    this.pickPhaseActors();
                } else {
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '선수',
                        desc: `${this.carrier ? this.carrier.name : '선수'}가 커브 드리블로 수비를 제칩니다!`
                    });
                }
            } else if (attackR < 0.7 * profile.directness) {
                // Through pass
                this.eventsQueue.push({
                    type: 'throughpass',
                    from: this.assister ? this.assister.name : this.carrier.name,
                    to: this.shooter ? this.shooter.name : '공격수'
                });
            } else if (attackR < 0.85) {
                // Side run
                this.eventsQueue.push({ type: 'siderun', player: this.carrier ? this.carrier.name : '선수', team });
            }

            // Chance phase 확률 (전술 반영도를 크게 높이고 클램프 범위 확장)
            let chanceThreshold = clamp((profile.chanceRate * 3.5 + setPieceBoost) * atkMod, 0.25, 0.85);
            // [신규] AF 롤 & Mentality DNA 보정 (클러치 타임 가속 포함)
            if (this.carrier && this.carrier.role === 'AF') chanceThreshold += 0.05;
            const myScore = team === 'home' ? this.homeScore : this.awayScore;
            const oppScore = team === 'home' ? this.awayScore : this.homeScore;
            if (myScore < oppScore && this.carrier && this.carrier.stats.decision > 85) {
                if (this.matchTime >= 80 && this.defender && this.defender.stamina < 30) {
                    chanceThreshold += 0.15; // 멘탈리티 발동 + 상대 수비 체력 고갈 시너지
                } else {
                    chanceThreshold += 0.08;
                }
            }

            if (Math.random() < chanceThreshold) {
                // 시너지 텍스트 발동 (기회 창출 시 가끔)
                if (Math.random() < 0.4 && profile.activeSynergy) {
                    let desc = '';
                    if (profile.activeSynergy === '4-2-3-1_gegenpress') desc = `[시너지 발동] 완벽한 전방 압박! 탈취하자마자 결정적인 찬스를 만듭니다!`;
                    else if (profile.activeSynergy === '3-5-2_lavolpiana') desc = `[시너지 발동] 메짜라와 윙백의 측면 과부하! 상대 수비 진형이 붕괴됩니다!`;
                    else if (profile.activeSynergy === '4-1-4-1_halfspace') desc = `[시너지 발동] 2선 미드필더의 하프 스페이스 공략! 수비 균열을 유발합니다!`;
                    else if (profile.activeSynergy === '3-4-3_fast_transition') desc = `[시너지 발동] 스리톱의 넓은 폭을 활용해 뒷공간을 한 번에 허무는 템포 폭발!`;
                    
                    if (desc) {
                        this.eventsQueue.push({ type: 'pass', desc, team });
                    }
                }

                this.phase = MatchPhase.CHANCE;
                this.pickPhaseActors();
            } else if (Math.random() < 0.16 * oppProfile.press * turnoverFactor) {
                // 패널티 텍스트 발동 (턴오버 시 가끔)
                const isIntercept = Math.random() < 0.6;
                let interceptDesc = isIntercept ? `공격 전개 실패! ${this.defender ? this.defender.name : '수비수'}가 길목을 차단합니다!` : `${this.defender ? this.defender.name : '수비수'}의 결정적인 태클!`;
                if (profile.activePenalty && Math.random() < 0.5) {
                    if (profile.activePenalty === '4-3-3_longball_fail') interceptDesc = `[패널티 발동] 투톱 부재로 전방이 고립되며 세컨볼을 그대로 내줍니다!`;
                    else if (profile.activePenalty === '5-3-2_high_press_fail') interceptDesc = `[패널티 발동] 수비와 중원의 간격이 벌어지며 압박이 쉽게 벗겨집니다!`;
                    else if (profile.activePenalty === '3-4-3_parkbus_fail') interceptDesc = `[패널티 발동] 공격진의 수비 가담 부족으로 중원에 과부하가 걸립니다!`;
                }

                this.losePossession({
                    type: 'tackle',
                    player: this.defender ? this.defender.name : '수비수',
                    desc: interceptDesc
                });
            }
            return;
        }

        if (this.phase === MatchPhase.CHANCE) {
            if (Math.random() < 0.35) {
                const skills = ['MARSEILLE_TURN', 'ROULETTE', 'ELASTICO', 'LA_CROQUETA'];
                const skill = pickRandom(skills);
                this.eventsQueue.push({
                    type: 'dribble',
                    player: this.shooter ? this.shooter.name : '공격수',
                    skillId: skill,
                    desc: `${this.shooter ? this.shooter.name : '공격수'}! 골키퍼 앞 환상적인 개인기 돌파!`
                });
            }
            this.resolveChance();
        }
    }

    consumeStamina() {
        const rates = { FW: 0.6, MF: 0.7, DF: 0.4, GK: 0.1 };
        this.players.forEach(p => {
            const profile = this.getTacticProfile(p.teamId);
            const tacticOverload = (profile.tempo + profile.press) / 2; // 전술 과부하 계수
            let rate = rates[p.position] || 0.5;
            rate = rate * tacticOverload;
            
            p.stamina = Math.max(0, p.stamina - (rate * (0.8 + Math.random() * 0.4)));
        });
    }

    recalculateStaminaOnSub(playerOut) {
        const userSide = gameData.isHomeGame ? 'home' : 'away';
        const lineX = { GK: 5, DF: 20, MF: 45, FW: 80 };
        const targetX = userSide === 'away'
            ? { GK: 95, DF: 80, MF: 55, FW: 20 }[playerOut.position] || 50
            : lineX[playerOut.position] || 50;
        const simP = this.players.find(p =>
            p.teamId === userSide &&
            p.position === playerOut.position &&
            Math.abs(p.baseX - targetX) < 8
        );
        if (simP) simP.stamina = 100;
    }

    startExitAnimation(winner) {
        this.exitAnimActive = true;
        this.exitAnimTicks = 0;
        this.exitAnimDone = false;
        this.exitWinner = winner;
        
        this.exitGroups = [];
        let pool = [...this.players];
        pool.sort(() => Math.random() - 0.5);
        while(pool.length > 0) {
            const groupSize = Math.floor(Math.random() * 3) + 3;
            const groupPlayers = pool.splice(0, groupSize);
            let cx = 0, cy = 0;
            groupPlayers.forEach(p => { cx += p.x; cy += p.y; });
            cx /= groupPlayers.length; cy /= groupPlayers.length;
            this.exitGroups.push({ players: groupPlayers, cx, cy, tx: 50 + (Math.random() * 10 - 5) });
        }
    }

    updatePostMatch() {
        if (!this.exitAnimActive) return this.getSnapshot();
        this.exitAnimTicks++;
        
        this.exitGroups.forEach(g => {
            g.cx += (g.tx - g.cx) * 0.05;
            g.cy += (100 - g.cy) * 0.02;
            g.players.forEach((p, idx) => {
                const ang = (idx * Math.PI * 2) / g.players.length + this.exitAnimTicks * 0.02;
                const r = 4;
                const ptx = g.cx + Math.cos(ang) * r;
                const pty = g.cy + Math.sin(ang) * r;
                p.x += (ptx - p.x) * 0.1;
                p.y += (pty - p.y) * 0.1;
            });
        });
        
        if (this.exitAnimTicks >= 150) this.exitAnimDone = true;
        return this.getSnapshot();
    }

    isExitAnimationDone() {
        return this.exitAnimDone;
    }

    update(minute, isNewMinute) {
        this.eventsQueue = [];
        this.matchTime = minute;

        if (this.exitAnimActive && !this.exitAnimDone) {
            return this.updatePostMatch();
        }

        if (this.celebrationTimer > 0) {
            this.celebrationTimer--;
            if (this.shooter) {
                this.shooter.x = this.possessionTeam === 'home' ? 88 : 12;
                this.shooter.y = 50;
            }
            if (this.celebrationTimer <= 0) {
                const nextKickoff = this.lastScorerTeam === 'home' ? 'away' : 'home';
                this.resetPositions(nextKickoff);
            }
            return this.getSnapshot();
        }

        if (isNewMinute) this.consumeStamina();

        if (this.suspenseTicksRemaining > 0) {
            this.processSuspenseTick();
            return this.getSnapshot();
        }

        this.advancePhase();
        this.updateVisualPositions();
        return this.getSnapshot();
    }

    getSnapshot() {
        return {
            ball: {
                x: this.ball.x,
                y: this.ball.y,
                z: this.ball.z,
                state: this.ball.state
            },
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                x: p.x,
                y: p.y,
                teamId: p.teamId,
                hasBall: this.ball.owner === p,
                stamina: p.stamina
            })),
            events: [...this.eventsQueue],
            isCelebration: this.celebrationTimer > 0,
            isSuspense: this.isSuspenseActive || this.suspenseTicksRemaining > 0,
            phase: this.phase,
            possessionTeam: this.possessionTeam
        };
    }
}

window.RealSoccerEngine = RealSoccerEngine;

window.DeepTacticManager = {
    init() {
        if (!gameData.deepTactics) {
            gameData.deepTactics = {
                attackingSide: 'all',
                passStyle: 'short',
                teamTendency: 'balanced',
                teamWidth: 'middle',
                pressingStrength: 'middle'
            };
        }
        this.renderUI();
    },
    renderUI() {
        const container = document.getElementById('deepTacticsContainer');
        if (!container) {
            const tacticsTab = document.getElementById('tactics');
            if (!tacticsTab) return;
            const nc = document.createElement('div');
            nc.id = 'deepTacticsContainer';
            nc.style.cssText = 'margin-top:20px;padding:20px;background:rgba(0,0,0,0.4);border-radius:15px;border:1px solid rgba(255,255,255,0.1);';
            tacticsTab.appendChild(nc);
        }
        const el = document.getElementById('deepTacticsContainer');
        const dt = gameData.deepTactics;
        el.innerHTML = `
            <h3 style="color:#ffd700;margin-top:0;margin-bottom:18px;">세부 전술 지시</h3>
            
            <!-- [신규] 메인 전술 연동 원클릭 프리셋 -->
            <div style="margin-bottom:14px; background:rgba(255,215,0,0.1); padding:10px; border-radius:8px; border:1px solid rgba(255,215,0,0.3);">
                <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#ffd700;font-weight:bold;">✨ 메인 전술 기반 세부설정 자동 세팅</label>
                <select id="dt-presetSelect" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;cursor:pointer;">
                    <option value="">-- 메인 전술을 선택하면 세부 전술이 자동 세팅됩니다 --</option>
                    <option value="balanced">기본 전술 (무전술)</option>
                    <option value="gegenpress">게겐프레싱 (강한 압박, 다이렉트)</option>
                    <option value="twoLine">다이렉트 축구 (롱볼, 넓은 측면)</option>
                    <option value="lavolpiana">라볼피아나 (후방 빌드업, 측면)</option>
                    <option value="longBall">롱볼 축구 (수비적 롱볼)</option>
                    <option value="possession">점유율 축구 (점유율 기반)</option>
                    <option value="parkBus">역습 축구 / 텐백 (극단적 수비)</option>
                    <option value="catenaccio">카테나치오 (대인방어 기반 수비)</option>
                    <option value="totalFootball">토탈 풋볼 (전원 공격/전원 수비)</option>
                    <option value="tikitaka">티키타카 (짧은 패스, 중앙 집중)</option>
                </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div>
                    <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;">공격 방향</label>
                    <select id="dt-attackingSide" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;">
                        <option value="all" ${dt.attackingSide==='all'?'selected':''}>전체</option>
                        <option value="middle" ${dt.attackingSide==='middle'?'selected':''}>중앙</option>
                        <option value="left" ${dt.attackingSide==='left'?'selected':''}>좌측</option>
                        <option value="right" ${dt.attackingSide==='right'?'selected':''}>우측</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;">패스 스타일</label>
                    <select id="dt-passStyle" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;">
                        <option value="short" ${dt.passStyle==='short'?'selected':''}>짧은 패스</option>
                        <option value="long" ${dt.passStyle==='long'?'selected':''}>긴 패스</option>
                        <option value="direct" ${dt.passStyle==='direct'?'selected':''}>직접적인 패스</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;">팀 성향</label>
                    <select id="dt-teamTendency" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;">
                        <option value="defensive" ${dt.teamTendency==='defensive'?'selected':''}>수비적</option>
                        <option value="balanced" ${dt.teamTendency==='balanced'?'selected':''}>균형</option>
                        <option value="offensive" ${dt.teamTendency==='offensive'?'selected':''}>공격적</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;">팀 너비</label>
                    <select id="dt-teamWidth" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;">
                        <option value="narrow" ${dt.teamWidth==='narrow'?'selected':''}>좁게</option>
                        <option value="middle" ${dt.teamWidth==='middle'?'selected':''}>보통</option>
                        <option value="wide" ${dt.teamWidth==='wide'?'selected':''}>넓게</option>
                    </select>
                </div>
                <div style="grid-column:1/-1;">
                    <label style="display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;">압박 강도</label>
                    <select id="dt-pressingStrength" style="width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;">
                        <option value="low" ${dt.pressingStrength==='low'?'selected':''}>약하게</option>
                        <option value="middle" ${dt.pressingStrength==='middle'?'selected':''}>보통</option>
                        <option value="high" ${dt.pressingStrength==='high'?'selected':''}>강하게</option>
                    </select>
                </div>
            </div>
            <div style="margin-top:14px;color:#888;font-size:0.78rem;">
                * 세부 전술은 공격 전개, 찬스 생성, 골 직전 연출 확률에 실시간으로 영향을 줍니다.
            </div>`;
            
        document.getElementById('dt-presetSelect').onchange = (e) => {
            const v = e.target.value;
            if(!v) return;
            const p = {
                balanced: { teamTendency: 'balanced', passStyle: 'short', teamWidth: 'middle', pressingStrength: 'middle', attackingSide: 'all' },
                gegenpress: { teamTendency: 'offensive', passStyle: 'direct', teamWidth: 'narrow', pressingStrength: 'high', attackingSide: 'all' },
                twoLine: { teamTendency: 'balanced', passStyle: 'long', teamWidth: 'wide', pressingStrength: 'middle', attackingSide: 'all' },
                lavolpiana: { teamTendency: 'offensive', passStyle: 'short', teamWidth: 'wide', pressingStrength: 'middle', attackingSide: 'left' },
                longBall: { teamTendency: 'defensive', passStyle: 'long', teamWidth: 'narrow', pressingStrength: 'middle', attackingSide: 'all' },
                possession: { teamTendency: 'balanced', passStyle: 'short', teamWidth: 'wide', pressingStrength: 'high', attackingSide: 'all' },
                parkBus: { teamTendency: 'defensive', passStyle: 'long', teamWidth: 'narrow', pressingStrength: 'low', attackingSide: 'middle' },
                catenaccio: { teamTendency: 'defensive', passStyle: 'direct', teamWidth: 'narrow', pressingStrength: 'low', attackingSide: 'middle' },
                totalFootball: { teamTendency: 'offensive', passStyle: 'short', teamWidth: 'wide', pressingStrength: 'high', attackingSide: 'all' },
                tikitaka: { teamTendency: 'offensive', passStyle: 'short', teamWidth: 'narrow', pressingStrength: 'high', attackingSide: 'middle' }
            }[v];
            if(p) {
                Object.assign(gameData.deepTactics, p);
                DeepTacticManager.renderUI();
                document.getElementById('dt-presetSelect').value = v;
                if (window.triggerAutoSave) window.triggerAutoSave();
            }
        };

        document.getElementById('dt-attackingSide').onchange = (e) => { dt.attackingSide = e.target.value; if (window.triggerAutoSave) window.triggerAutoSave(); };
        document.getElementById('dt-passStyle').onchange = (e) => { dt.passStyle = e.target.value; if (window.triggerAutoSave) window.triggerAutoSave(); };
        document.getElementById('dt-teamTendency').onchange = (e) => { dt.teamTendency = e.target.value; if (window.triggerAutoSave) window.triggerAutoSave(); };
        document.getElementById('dt-teamWidth').onchange = (e) => { dt.teamWidth = e.target.value; if (window.triggerAutoSave) window.triggerAutoSave(); };
        document.getElementById('dt-pressingStrength').onchange = (e) => { dt.pressingStrength = e.target.value; if (window.triggerAutoSave) window.triggerAutoSave(); };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const tacticsBtn = document.querySelector('[data-tab="tactics"]');
    if (tacticsBtn) {
        tacticsBtn.addEventListener('click', () => setTimeout(() => DeepTacticManager.init(), 100));
    }
});

window.getMatchDramaConfig = getMatchDramaConfig;
