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

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function segmentPointDistance(ax, ay, bx, by, px, py) {
    const vx = bx - ax, vy = by - ay;
    const wx = px - ax, wy = py - ay;
    const c1 = vx * wx + vy * wy;
    const c2 = vx * vx + vy * vy;
    const t = c2 ? clamp(c1 / c2, 0, 1) : 0;
    const qx = ax + vx * t, qy = ay + vy * t;
    return Math.hypot(px - qx, py - qy);
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
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.state = BallState.CONTROLLED;
        this.owner = null;

        // [FLR 물리 이식] 탄도학 비행 파라미터
        this.flight = null;
    }

    launchFlight(startX, startY, targetX, targetY, opts = {}) {
        const d = Math.hypot(targetX - startX, targetY - startY);
        // 비행 틱수: 거리에 따라 최소 4틱 ~ 최대 14틱 (자연스러운 체공 시간)
        const duration = opts.duration || Math.max(4, Math.min(14, Math.round(d / 4.8)));
        const maxHeight = opts.maxHeight !== undefined ? opts.maxHeight : (d > 16 ? Math.min(14, d * 0.38) : 0);

        this.state = BallState.IN_FLIGHT;
        this.owner = null;
        this.flight = {
            startX,
            startY,
            startZ: this.z || 0,
            targetX,
            targetY,
            targetZ: opts.targetZ || 0,
            targetPlayer: opts.targetPlayer || null,
            duration,
            elapsed: 0,
            maxHeight,
            style: opts.style || (maxHeight > 2 ? 'AERIAL' : 'GROUND')
        };
    }

    update() {
        if (this.state === BallState.IN_FLIGHT && this.flight) {
            this.flight.elapsed++;
            const t = clamp(this.flight.elapsed / this.flight.duration, 0, 1);

            // 수평 보간
            this.x = this.flight.startX + (this.flight.targetX - this.flight.startX) * t;
            this.y = this.flight.startY + (this.flight.targetY - this.flight.startY) * t;

            // 3D 포물선 탄도 공식: 4 * h * t * (1 - t)
            this.z = this.flight.maxHeight * 4 * t * (1 - t);

            if (t >= 1) {
                this.x = this.flight.targetX;
                this.y = this.flight.targetY;
                this.z = 0;
                if (this.flight.targetPlayer) {
                    this.state = BallState.CONTROLLED;
                    this.owner = this.flight.targetPlayer;
                } else {
                    this.state = BallState.LOOSE;
                    this.owner = null;
                }
                this.flight = null;
            }
        } else if (this.state === BallState.CONTROLLED && this.owner) {
            this.x = this.owner.x;
            this.y = this.owner.y;
            this.z = 0;
        }
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
        this.vx = 0;
        this.vy = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.stamina = (data.condition !== undefined) ? data.condition : 100;
        this.stats = this.calcStats(data, role, lineStats, teamMorale, tacticMultiplier);

        // [FLR 오프더볼/물리 이식]
        this.currentRun = null; // { type, duration, elapsed, targetX, targetY }
        this.sprint = false;
        this.bodyAngle = 0;

        // [FLR 골키퍼 다이빙 생애주기]
        this.gkDive = null; // { phase, targetX, targetY, startX, startY, elapsed, duration }
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

        // [신규] 전술 숙련도 버프/페널티 적용 (50% 미만 시 마이너스)
        if (typeof window !== 'undefined' && window.gameData && teamId === window.gameData.selectedTeam) {
            const mastery = (typeof window.getTacticMasteryPct === 'function')
                ? window.getTacticMasteryPct(tactic)
                : ((window.gameData.tacticMastery && typeof window.gameData.tacticMastery[tactic] === 'number') ? window.gameData.tacticMastery[tactic] : 50);
            const eff = (typeof window.getTacticMasteryEffect === 'function')
                ? window.getTacticMasteryEffect(mastery)
                : { chanceDelta: ((mastery - 50) / 50) * 0.04, pressDelta: ((mastery - 50) / 50) * 0.08, tempoDelta: ((mastery - 50) / 50) * 0.04 };
            base.chanceRate = Math.max(0.05, base.chanceRate + eff.chanceDelta);
            base.press = Math.max(0.3, base.press + eff.pressDelta);
            base.tempo = Math.max(0.5, base.tempo + eff.tempoDelta);
        }
        // [신규] 포메이션 시너지 반영
        const df = this.getPlayersByTeam(teamId, 'DF').length;
        const mf = this.getPlayersByTeam(teamId, 'MF').length;
        const fw = this.getPlayersByTeam(teamId, 'FW').length;
        const formStr = `${df}-${mf}-${fw}`;

        base.activeSynergy = null;
        base.activePenalty = null;

        // [ 시너지 버프]
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
        // [ 멸망 패널티]
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
        const df = this.getPlayersByTeam(team, 'DF');
        const oppDf = this.getPlayersByTeam(opp, 'DF');
        const gk = this.getPlayersByTeam(opp, 'GK');

        // [버그 수정] 캐리어가 이미 소유팀의 유효한 선수라면 불필요하게 뒤로 바꾸지 않고 소유권 유지!
        const carrierValid = this.carrier && this.carrier.teamId === team;

        if (this.phase === MatchPhase.BUILD_UP) {
            this.carrier = df.length ? pickRandom(df) : (mf.length ? pickRandom(mf) : pickRandom(this.getPlayersByTeam(team)));
        } else if (this.phase === MatchPhase.MIDFIELD) {
            if (!carrierValid || this.carrier.position === 'DF') {
                this.carrier = pickRandom(mf.length ? mf : fw) || pickRandom(this.getPlayersByTeam(team));
            }
        } else {
            // ATTACK/CHANCE/SUSPENSE: 골문 앞 공격수가 공을 쥐고 있으면 절대 뒤의 MF로 바꾸지 않음!
            if (!carrierValid || this.carrier.position !== 'FW') {
                this.carrier = pickRandom(fw.length ? fw : mf) || pickRandom(this.getPlayersByTeam(team));
            }
        }
        
        this.assister = mf.find(p => p !== this.carrier) || pickRandom(mf) || pickRandom(fw);
        this.shooter = (this.carrier && this.carrier.position === 'FW') ? this.carrier : (pickRandom(fw) || this.carrier);
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

    // [FLR 이식] 기하학 및 오프사이드 라인 산출
    offsideLine(attTeam) {
        const opp = attTeam === 'home' ? 'away' : 'home';
        const oppOutfield = this.players.filter(p => p.teamId === opp && p.position !== 'GK');
        if (!oppOutfield.length) return attTeam === 'home' ? 95 : 5;
        const xs = oppOutfield.map(p => p.x).sort((a, b) => a - b);
        if (attTeam === 'home') {
            return xs[xs.length - 2] !== undefined ? xs[xs.length - 2] : 90;
        }
        return xs[1] !== undefined ? xs[1] : 10;
    }

    laneBlockers(fromP, toP, oppTeam) {
        if (!fromP || !toP) return [];
        const oppPlayers = this.players.filter(p => p.teamId === oppTeam && p.position !== 'GK');
        return oppPlayers.filter(p => {
            const d = segmentPointDistance(fromP.x, fromP.y, toP.x, toP.y, p.x, p.y);
            const dFrom = dist(fromP, p);
            const dTo = dist(toP, p);
            return d < 3.2 && dFrom > 3.0 && dTo > 2.5;
        });
    }

    forwardSpace(carrier, oppTeam) {
        if (!carrier) return 0;
        const isHome = carrier.teamId === 'home';
        const oppPlayers = this.players.filter(p => p.teamId === oppTeam);
        let nearestX = 999;
        oppPlayers.forEach(q => {
            const forwardDist = isHome ? (q.x - carrier.x) : (carrier.x - q.x);
            const lateralDist = Math.abs(q.y - carrier.y);
            if (forwardDist > 0 && lateralDist < 14) {
                nearestX = Math.min(nearestX, forwardDist);
            }
        });
        return nearestX === 999 ? 40 : nearestX;
    }

    nearestOppDistance(player, oppTeam) {
        if (!player) return 99;
        const oppPlayers = this.players.filter(p => p.teamId === oppTeam);
        let minD = 99;
        oppPlayers.forEach(q => {
            minD = Math.min(minD, dist(player, q));
        });
        return minD;
    }

    // [FLR 이식] 포물선 탄도학 패스 발사
    passBall(fromP, toP, opts = {}) {
        if (!fromP || !toP) return;
        const isAerial = opts.aerial || opts.style === 'AERIAL' || opts.maxHeight > 0;
        const d = dist(fromP, toP);
        const maxHeight = opts.maxHeight !== undefined ? opts.maxHeight : (isAerial ? Math.min(14, Math.max(6, d * 0.35)) : 0);
        this.ball.launchFlight(fromP.x, fromP.y, toP.x, toP.y, {
            targetPlayer: toP,
            maxHeight,
            style: isAerial ? 'AERIAL' : 'GROUND',
            duration: opts.duration || Math.max(4, Math.min(12, Math.round(d / 5.0)))
        });
        this.carrier = toP;
    }

    // [FLR 이식] 슛 탄도 및 골키퍼 다이빙 연동
    shootBall(shooter, targetY, isGoal = false) {
        if (!shooter) return;
        const isHome = this.possessionTeam === 'home';
        const goalX = isHome ? 98 : 2;
        const goalY = targetY !== undefined ? targetY : (46 + Math.random() * 8);

        this.ball.launchFlight(shooter.x, shooter.y, goalX, goalY, {
            targetPlayer: isGoal ? null : this.goalkeeper,
            maxHeight: 7.0,
            style: 'SHOT',
            duration: 6
        });

        // 골키퍼 다이빙 생애주기 트리거 (FLR GK_DIVE_LIFECYCLE)
        const gk = this.goalkeeper;
        if (gk) {
            gk.gkDive = {
                phase: 'REACT',
                startX: gk.x,
                startY: gk.y,
                targetX: goalX,
                targetY: clamp(goalY, 36, 64),
                elapsed: 0,
                duration: 6,
                isGoal
            };
        }
    }

    resetPositions(kickoffTeam) {
        this.possessionTeam = kickoffTeam;
        this.phase = MatchPhase.BUILD_UP;
        this.attackDepth = kickoffTeam === 'home' ? 35 : 65;
        this.players.forEach(p => {
            p.x = p.baseX;
            p.y = p.baseY;
            p.targetX = p.baseX;
            p.targetY = p.baseY;
            p.vx = 0;
            p.vy = 0;
            p.sprint = false;
            p.currentRun = null;
            p.gkDive = null;
        });
        this.pickPhaseActors();
        this.syncBallToCarrier();
        this.ball.state = BallState.CONTROLLED;
        this.ball.flight = null;
    }

    syncBallToCarrier() {
        if (!this.carrier) return;
        this.ball.owner = this.carrier;
        this.ball.x = this.carrier.x;
        this.ball.y = this.carrier.y;
        this.ball.z = 0;
        this.ball.state = BallState.CONTROLLED;
        this.ball.flight = null;
    }

    updateVisualPositions() {
        // 1. 공 물리 및 탄도 갱신 (FLR 3D 비행 연산)
        this.ball.update();

        const isHome = this.possessionTeam === 'home';
        const oppTeam = isHome ? 'away' : 'home';
        const depthMap = {
            [MatchPhase.BUILD_UP]: isHome ? 40 : 60,
            [MatchPhase.MIDFIELD]: isHome ? 55 : 45,
            [MatchPhase.ATTACK]: isHome ? 75 : 25,
            [MatchPhase.CHANCE]: isHome ? 88 : 12,
            [MatchPhase.SUSPENSE]: isHome ? 92 : 8
        };
        this.attackDepth = depthMap[this.phase] || this.attackDepth;

        // 수비 전술 압박 계수
        const press = this.getTacticProfile(oppTeam).press;
        const defensivePressMultiplier = Math.min(press, 1.5);

        // [FLR 이식] 오프사이드 라인 계산
        const rawOffside = this.offsideLine(this.possessionTeam);
        // 안전 침투 한계선: 오프사이드 1.2m 앞
        const safeOffside = isHome ? Math.min(rawOffside - 1.2, 94) : Math.max(rawOffside + 1.2, 6);

        // --- 지능형 오프더볼 런 패턴 및 위치 계산 (FLR tactical_movement 이식) ---
        const getPlayerIntent = (player, isPossession) => {
            const isCenter = player.baseY > 32 && player.baseY < 68;
            let targetX = player.baseX;
            let targetY = player.baseY;
            let sprint = false;

            if (isPossession) {
                // ===== 공격팀 (POSSESSION TEAM) =====
                const baseProgress = this.attackDepth;

                switch (player.position) {
                    case 'FW': {
                        if (isCenter) {
                            // [FLR 런 패턴: RUN_IN_BEHIND] 중앙 스트라이커는 오프사이드 라인을 타고 채널 침투
                            if (this.phase === MatchPhase.ATTACK || this.phase === MatchPhase.CHANCE) {
                                targetX = safeOffside;
                                targetY = clamp(50 + (Math.sin(this.matchTime * 0.5) * 6), 38, 62);
                                sprint = true;
                            } else {
                                targetX = isHome ? Math.min(baseProgress + 16, safeOffside) : Math.max(baseProgress - 16, safeOffside);
                                targetY = 50;
                            }
                        } else {
                            // [FLR 런 패턴: DIAGONAL_RUN] 측면 윙어는 파이널 서드에서 중앙 하프스페이스로 컷인 침투
                            if (this.phase === MatchPhase.ATTACK || this.phase === MatchPhase.CHANCE) {
                                targetX = isHome ? Math.min(baseProgress + 12, safeOffside) : Math.max(baseProgress - 12, safeOffside);
                                targetY = player.baseY < 50 ? lerp(player.baseY, 40, 0.45) : lerp(player.baseY, 60, 0.45);
                                sprint = true;
                            } else {
                                targetX = isHome ? baseProgress + 10 : baseProgress - 10;
                                targetY = player.baseY;
                            }
                        }
                        break;
                    }
                    case 'MF': {
                        // [FLR 런 패턴: LATE_BOX_ARRIVAL] 미드필더는 공격 시 아크 서클 정면으로 쇄도
                        if (this.phase === MatchPhase.ATTACK || this.phase === MatchPhase.CHANCE) {
                            targetX = isHome ? Math.min(baseProgress - 4, 78) : Math.max(baseProgress + 4, 22);
                            targetY = clamp(player.baseY, 32, 68);
                            if (isCenter) targetY = 50;
                        } else {
                            targetX = isHome ? baseProgress - 8 : baseProgress + 8;
                            targetY = player.baseY;
                        }
                        break;
                    }
                    case 'DF': {
                        if (isCenter) {
                            // 센터백은 후방 빌드업 라인을 지키며 안전하게 처짐
                            targetX = isHome ? Math.max(baseProgress - 32, 14) : Math.min(baseProgress + 32, 86);
                            targetY = player.baseY;
                        } else {
                            // [FLR 런 패턴: OVERLAP_SURGE] 풀백은 공격 단계에서 전방 터치라인을 타고 오버래핑
                            if (this.phase === MatchPhase.ATTACK || this.phase === MatchPhase.CHANCE) {
                                targetX = isHome ? Math.min(baseProgress - 8, 72) : Math.max(baseProgress + 8, 28);
                                sprint = true;
                            } else {
                                targetX = isHome ? Math.max(baseProgress - 16, 20) : Math.min(baseProgress + 16, 80);
                            }
                            targetY = player.baseY < 50 ? 8 : 92;
                        }
                        break;
                    }
                    case 'GK': {
                        targetX = isHome ? 5 : 95;
                        targetY = 50;
                        break;
                    }
                }
            } else {
                // ===== 수비팀 (DEFENDING TEAM: 미드필더 전력 질주 깊은 2선 보호 + 공격수 전방 잔류 역습 대기) =====
                const isDefendingHome = player.teamId === 'home'; // 수비하는 팀이 홈팀(골대 0)인가?
                
                // 1. 수비 라인 (DF): 페널티 박스 바로 앞 최후방 저지선
                const defLine = isDefendingHome
                    ? clamp(14 + (defensivePressMultiplier * 2.5), 14, 22)
                    : clamp(100 - (14 + (defensivePressMultiplier * 2.5)), 78, 86);

                // 2. 미드필더 라인 (MF): 수비라인 바로 앞(6칸!)까지 완전히 깊숙이 내려와 박스 앞 2선 장벽 형성!
                const mfLine = isDefendingHome
                    ? clamp(defLine + 6, 20, 28)
                    : clamp(defLine - 6, 72, 80);

                // 3. 공격수 라인 (FW): 수비 시 거의 내려오지 않고, 상대 진영 하프라인(50) 너머에 여유롭게 잔류!
                // (골대 -> DF -> MF -> FW 순서가 완벽히 보장되어 절대 역전되지 않음)
                const fwWaitLine = isDefendingHome
                    ? (isCenter ? 58 : 52)
                    : (isCenter ? 42 : 48);

                switch (player.position) {
                    case 'FW': {
                        targetX = fwWaitLine;
                        targetY = player.baseY;
                        sprint = false;
                        break;
                    }
                    case 'MF': {
                        targetX = mfLine;
                        targetY = player.baseY;
                        sprint = true; // [FLR] 미드필더는 수비 전환 시 박스 앞 전력 질주 복귀!
                        break;
                    }
                    case 'DF': {
                        if (isCenter) {
                            targetX = defLine;
                            targetY = player.baseY;
                        } else {
                            targetX = isDefendingHome ? defLine + 3 : defLine - 3;
                            targetY = player.baseY;
                        }
                        sprint = true;
                        break;
                    }
                    case 'GK': {
                        targetX = isDefendingHome ? 5 : 95;
                        targetY = 50;
                        break;
                    }
                }
            }

            return { targetX: clamp(targetX, 3, 97), targetY: clamp(targetY, 4, 96), sprint };
        };

        // --- 선수 위치 업데이트 ---
        this.players.forEach(player => {
            const isPossessionPlayer = player.teamId === this.possessionTeam;
            const intent = getPlayerIntent(player, isPossessionPlayer);
            let targetX = intent.targetX;
            let targetY = intent.targetY;
            let sprint = intent.sprint;

            // 볼 캐리어: 목표 어택 뎁스로 드리블 진행
            if (player === this.carrier) {
                targetX = clamp(this.attackDepth, 6, 94);
                targetY = clamp(player.baseY + (Math.sin(this.matchTime * 0.8) * 4), 6, 94);
                sprint = (this.phase === MatchPhase.ATTACK || this.phase === MatchPhase.CHANCE);
            }

            // [FLR 압박자 지정]: 오직 지정된 1명의 압박자(defender)만 볼 캐리어를 향해 직접 돌진!
            if (player === this.defender && this.carrier) {
                targetX = this.carrier.x;
                targetY = this.carrier.y;
                sprint = true;
            }

            // [FLR 골키퍼 다이빙 생애주기 (GK_DIVE_LIFECYCLE) 갱신]
            if (player.position === 'GK' && player.gkDive) {
                const dive = player.gkDive;
                dive.elapsed++;
                const dt = clamp(dive.elapsed / dive.duration, 0, 1);
                targetX = dive.startX + (dive.targetX - dive.startX) * dt;
                targetY = dive.startY + (dive.targetY - dive.startY) * dt;
                player.x += (targetX - player.x) * 0.35;
                player.y += (targetY - player.y) * 0.35;
                if (dt >= 1) {
                    player.gkDive = null;
                }
                return;
            }

            // [FLR 물리 가감속]: 공격수 느린 전방 잔류 & 미드필더 전력 복귀
            let speed = sprint ? 0.22 : 0.14;
            if (player === this.carrier) {
                speed = 0.16;
            } else if (!isPossessionPlayer && player.position === 'FW') {
                // 수비 시 공격수는 전방에 머물며 아주 천천히 조깅 (FLR 원리: 속도 0.055)
                speed = 0.055;
            } else if (!isPossessionPlayer && player.position === 'MF') {
                // 수비 시 미드필더는 페널티 박스 앞으로 전력 질주 복귀 (속도 0.22)
                speed = 0.22;
            }

            player.x += (targetX - player.x) * speed;
            player.y += (targetY - player.y) * speed;
            player.x = clamp(player.x, 2, 98);
            player.y = clamp(player.y, 2, 98);
        });

        // 공이 비행 중이 아닐 때만 캐리어 발밑에 고정
        if (this.ball.state === BallState.CONTROLLED && this.carrier) {
            this.ball.x = this.carrier.x;
            this.ball.y = this.carrier.y;
            this.ball.z = 0;
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
            this.shootBall(shooter, 48 + (Math.random() * 4 - 2), true);
        } else if (roll < nGoal + nSave) {
            resolution = {
                type: 'save',
                gk: gk ? gk.name : '골키퍼',
                shooter: shooter.name
            };
            this.shootBall(shooter, 50 + (Math.random() * 6 - 3), false);
        } else if (roll < nGoal + nSave + nBlock) {
            resolution = {
                type: 'block',
                blocker: this.defender ? this.defender.name : '수비수',
                shooter: shooter.name
            };
            if (this.defender) {
                this.ball.launchFlight(shooter.x, shooter.y, this.defender.x, this.defender.y, { maxHeight: 2.5, duration: 4 });
            }
        } else {
            resolution = { type: 'miss', shooter: shooter.name };
            const isHome = team === 'home';
            this.ball.launchFlight(shooter.x, shooter.y, isHome ? 99 : 1, 50 + (Math.random() * 26 - 13), { maxHeight: 9, duration: 5 });
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
        const isHome = team === 'home';
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
                this.passBall(centerBack, fw, { aerial: true, maxHeight: 12 });
                // Long ball goes directly to ATTACK phase!
                this.phase = MatchPhase.ATTACK;
                this.pickPhaseActors(); // Update actors for new phase
            } else {
                // Option 2: Short pass from CB to MF
                const mfTarget = this.assister;
                this.eventsQueue.push({ type: 'perfectPass', team,
                    from: centerBack ? centerBack.name : '수비수',
                    to: mfTarget ? mfTarget.name : '미드필더' });
                this.passBall(centerBack, mfTarget, { aerial: false });
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
            const fSpace = this.forwardSpace(this.carrier, opp);
            if (fSpace > 14) openSpace = true;

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
                this.passBall(this.carrier, this.assister, { aerial: false });
            } else if (r < 0.45 * profile.directness) {
                // Long ball option
                this.eventsQueue.push({
                    type: 'pass',
                    from: this.carrier ? this.carrier.name : '선수',
                    to: this.shooter ? this.shooter.name : '공격수',
                    desc: `${this.carrier ? this.carrier.name : '선수'}가 롱 볼을 보냅니다!`
                });
                this.passBall(this.carrier, this.shooter, { aerial: true, maxHeight: 11 });
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
            const fSpace = this.forwardSpace(this.carrier, opp);
            if (fSpace > 12) openSpace = true;

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
            const isDeepInBox = isHome ? (this.carrier && this.carrier.x >= 74) : (this.carrier && this.carrier.x <= 26);

            if (isDeepInBox) {
                // [골문 앞 박스 도달]: 뒤로 공을 빼지 않고 곧바로 슈팅/찬스나 박스 안 돌파로 결정!
                if (attackR < 0.55) {
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '공격수',
                        desc: `${this.carrier ? this.carrier.name : '공격수'}! 골문 앞에서 직접 슈팅 찬스를 만듭니다!`
                    });
                    this.phase = MatchPhase.CHANCE;
                    this.pickPhaseActors();
                    return;
                } else if (attackR < 0.85) {
                    // 측면 크로스 또는 컷백
                    this.eventsQueue.push({ type: 'cross', player: this.carrier ? this.carrier.name : '선수', target: this.shooter ? this.shooter.name : '공격수', team });
                    if (this.shooter && this.shooter !== this.carrier) {
                        this.passBall(this.carrier, this.shooter, { aerial: true, maxHeight: 8, duration: 6 });
                    }
                    this.phase = MatchPhase.CHANCE;
                    this.pickPhaseActors();
                    return;
                }
            } else {
                // [파이널 서드 진입 전개]: 아직 박스 바깥일 때만 전방 패스/침투를 전개
                if (openSpace && attackR < 0.45) {
                    this.eventsQueue.push({
                        type: 'dribble',
                        player: this.carrier ? this.carrier.name : '선수',
                        desc: `수비가 거리를 두고 있습니다! ${this.carrier ? this.carrier.name : '선수'}가 빈 공간으로 치고 들어갑니다!`
                    });
                    this.phase = MatchPhase.CHANCE;
                    this.pickPhaseActors();
                } else if (attackR < 0.25) {
                    // Long ball
                    this.eventsQueue.push({
                        type: 'pass',
                        from: this.carrier ? this.carrier.name : '선수',
                        to: this.shooter ? this.shooter.name : '공격수',
                        desc: `${this.carrier ? this.carrier.name : '선수'}가 전방으로 볼을 보냅니다!`
                    });
                    this.passBall(this.carrier, this.shooter, { aerial: true, maxHeight: 11 });
                } else if (attackR < 0.55 * profile.width) {
                    // Cross
                    this.eventsQueue.push({ type: 'cross', player: this.carrier ? this.carrier.name : '선수', target: this.shooter ? this.shooter.name : '공격수', team });
                    this.passBall(this.carrier, this.shooter, { aerial: true, maxHeight: 14, duration: 8 });
                } else if (attackR < 0.75 * profile.directness) {
                    // Through pass
                    this.eventsQueue.push({
                        type: 'throughpass',
                        from: this.carrier ? this.carrier.name : '선수',
                        to: this.shooter ? this.shooter.name : '공격수'
                    });
                    if (this.carrier !== this.shooter) {
                        this.passBall(this.carrier, this.shooter, { aerial: false, maxHeight: 1.5 });
                    }
                } else {
                    this.eventsQueue.push({ type: 'siderun', player: this.carrier ? this.carrier.name : '선수', team });
                }
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
        el.replaceChildren();

        const h3 = document.createElement('h3');
        h3.style.cssText = 'color:#ffd700;margin-top:0;margin-bottom:18px;';
        h3.textContent = '세부 전술 지시';
        el.appendChild(h3);

        // [신규] 메인 전술 연동 원클릭 프리셋
        const presetWrap = document.createElement('div');
        presetWrap.style.cssText = 'margin-bottom:14px; background:rgba(255,215,0,0.1); padding:10px; border-radius:8px; border:1px solid rgba(255,215,0,0.3);';

        const presetLabel = document.createElement('label');
        presetLabel.style.cssText = 'display:block;margin-bottom:4px;font-size:0.85rem;color:#ffd700;font-weight:bold;';
        presetLabel.textContent = '메인 전술 기반 세부설정 자동 세팅';

        const presetSelect = document.createElement('select');
        presetSelect.id = 'dt-presetSelect';
        presetSelect.style.cssText = 'width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;cursor:pointer;';

        const presetOptions = [
            ['', '-- 메인 전술을 선택하면 세부 전술이 자동 세팅됩니다 --'],
            ['balanced', '기본 전술 (무전술)'],
            ['gegenpress', '게겐프레싱 (강한 압박, 다이렉트)'],
            ['twoLine', '다이렉트 축구 (롱볼, 넓은 측면)'],
            ['lavolpiana', '라볼피아나 (후방 빌드업, 측면)'],
            ['longBall', '롱볼 축구 (수비적 롱볼)'],
            ['possession', '점유율 축구 (점유율 기반)'],
            ['parkBus', '역습 축구 / 텐백 (극단적 수비)'],
            ['catenaccio', '카테나치오 (대인방어 기반 수비)'],
            ['totalFootball', '토탈 풋볼 (전원 공격/전원 수비)'],
            ['tikitaka', '티키타카 (짧은 패스, 중앙 집중)']
        ];
        presetOptions.forEach(([val, txt]) => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = txt;
            presetSelect.appendChild(opt);
        });
        presetWrap.append(presetLabel, presetSelect);
        el.appendChild(presetWrap);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;';

        const createField = (id, labelText, options, currentVal, isFullWidth = false) => {
            const fieldDiv = document.createElement('div');
            if (isFullWidth) fieldDiv.style.gridColumn = '1/-1';

            const lbl = document.createElement('label');
            lbl.style.cssText = 'display:block;margin-bottom:4px;font-size:0.85rem;color:#aaa;';
            lbl.textContent = labelText;

            const select = document.createElement('select');
            select.id = id;
            select.style.cssText = 'width:100%;padding:9px;background:#222;color:white;border:1px solid #444;border-radius:5px;';

            options.forEach(([val, txt]) => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = txt;
                if (val === currentVal) opt.selected = true;
                select.appendChild(opt);
            });

            fieldDiv.append(lbl, select);
            return fieldDiv;
        };

        grid.appendChild(createField('dt-attackingSide', '공격 방향', [
            ['all', '전체'], ['middle', '중앙'], ['left', '좌측'], ['right', '우측']
        ], dt.attackingSide));

        grid.appendChild(createField('dt-passStyle', '패스 스타일', [
            ['short', '짧은 패스'], ['long', '긴 패스'], ['direct', '직접적인 패스']
        ], dt.passStyle));

        grid.appendChild(createField('dt-teamTendency', '팀 성향', [
            ['defensive', '수비적'], ['balanced', '균형'], ['offensive', '공격적']
        ], dt.teamTendency));

        grid.appendChild(createField('dt-teamWidth', '팀 너비', [
            ['narrow', '좁게'], ['middle', '보통'], ['wide', '넓게']
        ], dt.teamWidth));

        grid.appendChild(createField('dt-pressingStrength', '압박 강도', [
            ['low', '약하게'], ['middle', '보통'], ['high', '강하게']
        ], dt.pressingStrength, true));

        el.appendChild(grid);

        const noteDiv = document.createElement('div');
        noteDiv.style.cssText = 'margin-top:14px;color:#888;font-size:0.78rem;';
        noteDiv.textContent = '* 세부 전술은 공격 전개, 찬스 생성, 골 직전 연출 확률에 실시간으로 영향을 줍니다.';
        el.appendChild(noteDiv);
            
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
