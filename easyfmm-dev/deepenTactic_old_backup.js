
// deepenTactic.js  —  v2.0  (full rewrite, drop-in compatible)
// ─────────────────────────────────────────────────────────────────────────────
// External API preserved:
//   window.RealSoccerEngine   (class)
//   window.DeepTacticManager  (object, .init(), .renderUI())
//   BallState                 (const object)
//   SimBall / SimPlayer       (classes)
//   RUN_TYPE / ROLE_RUN_TYPE  (const objects)
//   getPosByAngle()           (function)
// ─────────────────────────────────────────────────────────────────────────────

// =============================================================================
// [SECTION 0]  CONSTANTS & UTILITY
// =============================================================================

const BallState = {
    LOOSE:      0,
    CONTROLLED: 1,
    IN_FLIGHT:  2,
    DEAD:       3
};

const RUN_TYPE = {
    STRIKER_RUN:   'striker_run',
    SUPPORT_RUN:   'support_run',
    CHANNEL_RUN:   'channel_run',
    WIDE_RUN:      'wide_run',
    UNDERLAP_RUN:  'underlap_run',
    HOLD_POSITION: 'hold_position',
};

const ROLE_RUN_TYPE = {
    AF:'striker_run', CF:'support_run', P:'striker_run',
    DLF:'support_run', TM:'hold_position', F9:'support_run',
    PF:'channel_run', RD:'channel_run', W:'wide_run', IF:'underlap_run',
    WP:'support_run', IW:'underlap_run',
    BBM:'striker_run', MEZ:'underlap_run', DLP:'hold_position',
    BWM:'hold_position', AP:'support_run', REG:'hold_position',
    CAR:'support_run', EG:'hold_position', SS:'striker_run',
    ANC:'hold_position', DM:'hold_position', SV:'striker_run',
    BPD:'support_run', CD:'hold_position', NCB:'hold_position',
    IWB:'underlap_run', CWB:'wide_run', LIB:'support_run',
    FB:'hold_position', WB:'wide_run',
    GK:'hold_position'
};

function getPosByAngle(x, y, angleDeg, dist) {
    const rad = angleDeg * (Math.PI / 180);
    return {
        x: Math.max(2, Math.min(98, x + Math.cos(rad) * dist)),
        y: Math.max(2, Math.min(98, y + Math.sin(rad) * dist))
    };
}

// Position-based stat weight tables for "overall → derived stats"
// Each position maps stat-key → weight [0..2] (1.0 = neutral)
const POSITION_STAT_WEIGHTS = {
    FW: { speed: 1.3, shooting: 1.5, passing: 0.9, defense: 0.4, decision: 1.1, physical: 1.0 },
    MF: { speed: 1.0, shooting: 0.8, passing: 1.4, defense: 0.9, decision: 1.3, physical: 0.9 },
    DF: { speed: 1.0, shooting: 0.3, passing: 0.9, defense: 1.6, decision: 1.0, physical: 1.2 },
    GK: { speed: 0.5, shooting: 0.1, passing: 0.7, defense: 1.8, decision: 1.1, physical: 1.0 }
};

// Derive individual stats from a single overall value
function deriveStatsFromOverall(overall, position) {
    const weights = POSITION_STAT_WEIGHTS[position] || POSITION_STAT_WEIGHTS.MF;
    const derived = {};
    for (const [stat, w] of Object.entries(weights)) {
        // Add small noise so players feel distinct
        const noise = (Math.random() - 0.5) * 4;
        derived[stat] = Math.max(10, Math.min(99, overall * w + noise));
    }
    // tackle% mirrors defense for compatibility
    derived.tackle = derived.defense;
    return derived;
}

// Clamp helper
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// =============================================================================
// [SECTION 1]  DEEP TACTIC MANAGER  (UI, preserved interface)
// =============================================================================

// 기존(matchEngine.js DeepTacticManager) 스키마 → deepenTactic.js 스키마 마이그레이션.
// 멱등(idempotent): 이미 새 규격 필드가 있으면 덮어쓰지 않는다.
//   pressingStrength('low'|'middle'|'high')  → pressIntensity('low'|'mid'|'high')
//   teamTendency('offensive'|'balanced'|'defensive') → passTempo('fast'|'normal'|'slow')
//   passStyle('short'|'direct'|'long', 문자열)        → passLength('short'|'mixed'|'long')
//   attackingSide('all'|'middle'|'left'|'right')       → attackFocus('mixed'|'middle'|'left'|'right')
//   defensiveLine → 기존 대응 없음, 기본 'standard'
//   passStyle 문자열 → 객체 { shortRatio, longRatio } 정규화
function migrateDeepTactics() {
    if (typeof gameData === 'undefined' || !gameData.deepTactics) return false;
    const dt = gameData.deepTactics;

    const oldPress = typeof dt.pressingStrength === 'string' ? dt.pressingStrength : null; // low|middle|high
    const oldTend  = typeof dt.teamTendency   === 'string' ? dt.teamTendency   : null; // offensive|balanced|defensive
    const oldStyle = typeof dt.passStyle      === 'string' ? dt.passStyle      : null; // short|direct|long
    const oldSide  = typeof dt.attackingSide  === 'string' ? dt.attackingSide  : null; // all|middle|left|right

    if (!('pressIntensity' in dt) && oldPress) {
        dt.pressIntensity = oldPress === 'high' ? 'high'
                          : oldPress === 'low'  ? 'low'  : 'mid';
    }
    if (!('passTempo' in dt) && oldTend) {
        dt.passTempo = oldTend === 'offensive' ? 'fast'
                     : oldTend === 'defensive' ? 'slow' : 'normal';
    }
    if (!('passLength' in dt) && oldStyle) {
        dt.passLength = oldStyle === 'long'   ? 'long'
                      : oldStyle === 'short'  ? 'short' : 'mixed';
    }
    if (!('defensiveLine' in dt)) dt.defensiveLine = 'standard';
    if (!('attackFocus' in dt) && oldSide) {
        dt.attackFocus = oldSide === 'all' ? 'mixed' : oldSide;
    }
    // passStyle을 새 엔진이 기대하는 객체 형태로 정규화
    if (typeof dt.passStyle === 'string') {
        const s = dt.passStyle;
        const ratio = s === 'short' ? [7, 3] : s === 'long' ? [3, 7] : [5, 5]; // direct/기타 → [5,5]
        dt.passStyle = { shortRatio: ratio[0], longRatio: ratio[1] };
    } else if (!dt.passStyle || typeof dt.passStyle !== 'object') {
        dt.passStyle = { shortRatio: 7, longRatio: 3 };
    }
    return true;
}

const DeepTacticManager = {
    init() {
        if (!gameData.deepTactics) {
            gameData.deepTactics = {
                attackFocus:    'mixed',
                passStyle:      { shortRatio: 7, longRatio: 3 },
                pressIntensity: 'mid',      // low | mid | high
                defensiveLine:  'standard', // deep | standard | high
                passTempo:      'normal',   // slow | normal | fast
                passLength:     'mixed'     // short | mixed | long
            };
        }
        migrateDeepTactics();
        this.renderUI();
    },

    renderUI() {
        let container = document.getElementById('deepTacticsContainer');
        if (!container) {
            const tacticsTab = document.getElementById('tactics');
            if (!tacticsTab) return;
            container = document.createElement('div');
            container.id = 'deepTacticsContainer';
            container.style.cssText = `margin-top:20px;padding:15px;background:rgba(255,255,255,0.05);border-radius:10px;`;
            tacticsTab.appendChild(container);
        }
        const dt = gameData.deepTactics;
        container.innerHTML = `
            <h4 style="color:#ffd700;margin-top:0;">심층 전술 세부 설정</h4>

            <div style="margin-bottom:10px;">
                <label style="display:block;margin-bottom:4px;color:#ccc;">수비 라인</label>
                <select id="dt-defensiveLine" style="width:100%;padding:5px;background:#333;color:white;">
                    <option value="deep"     ${dt.defensiveLine==='deep'     ?'selected':''}>딥 (Deep)</option>
                    <option value="standard" ${dt.defensiveLine==='standard' ?'selected':''}>표준</option>
                    <option value="high"     ${dt.defensiveLine==='high'     ?'selected':''}>하이 (High)</option>
                </select>
            </div>

            <div style="margin-bottom:10px;">
                <label style="display:block;margin-bottom:4px;color:#ccc;">압박 강도</label>
                <select id="dt-pressIntensity" style="width:100%;padding:5px;background:#333;color:white;">
                    <option value="low"  ${dt.pressIntensity==='low'  ?'selected':''}>낮음</option>
                    <option value="mid"  ${dt.pressIntensity==='mid'  ?'selected':''}>보통</option>
                    <option value="high" ${dt.pressIntensity==='high' ?'selected':''}>높음</option>
                </select>
            </div>

            <div style="margin-bottom:10px;">
                <label style="display:block;margin-bottom:4px;color:#ccc;">패스 템포</label>
                <select id="dt-passTempo" style="width:100%;padding:5px;background:#333;color:white;">
                    <option value="slow"   ${dt.passTempo==='slow'   ?'selected':''}>느림</option>
                    <option value="normal" ${dt.passTempo==='normal' ?'selected':''}>보통</option>
                    <option value="fast"   ${dt.passTempo==='fast'   ?'selected':''}>빠름</option>
                </select>
            </div>

            <div style="margin-bottom:10px;">
                <label style="display:block;margin-bottom:4px;color:#ccc;">패스 길이</label>
                <select id="dt-passLength" style="width:100%;padding:5px;background:#333;color:white;">
                    <option value="short" ${dt.passLength==='short' ?'selected':''}>짧게</option>
                    <option value="mixed" ${dt.passLength==='mixed' ?'selected':''}>혼합</option>
                    <option value="long"  ${dt.passLength==='long'  ?'selected':''}>길게</option>
                </select>
            </div>

            <div style="color:#aaa;font-size:0.8rem;">* 설정은 자동 적용됩니다</div>
        `;
        ['defensiveLine','pressIntensity','passTempo','passLength'].forEach(key => {
            document.getElementById(`dt-${key}`)
                .addEventListener('change', e => { gameData.deepTactics[key] = e.target.value; });
        });
    }
};

// =============================================================================
// [SECTION 2]  SIM BALL
// =============================================================================

class SimBall {
    constructor() {
        this.x = 50; this.y = 50; this.z = 0;
        this.state = BallState.DEAD;
        this.owner = null;
        this.intendedReceiver = null;
        this.lastOwner = null;
        this.targetPos = { x: 50, y: 50 };
        this.velocity = { x: 0, y: 0 };
        // trajectory cache for in-flight interception
        this._flightOrigin = { x: 50, y: 50 };
    }
}

// =============================================================================
// [SECTION 3]  SIM PLAYER
// =============================================================================

class SimPlayer {
    constructor(data, teamId, role, lineStats, morale = 50, tacticMultiplier = 1.0) {
        this.id   = data.name;
        this.name = data.name;
        this.position = data.position;
        this.rating   = data.rating;
        this.teamId   = teamId;
        this.role     = role;

        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.baseX = 0; this.baseY = 0;

        this.stamina = (data.condition !== undefined) ? data.condition : 100;
        this._markTargetId = null;

        // Tactic-level state
        this.forceReturnTimer = 0;
        this.burstTimer       = 0;

        // Steal cooldown (anti-exploit)
        this._stealCooldown = 0;

        // Turnover recovery state: 'immediate' | 'delayed' | 'frozen'
        this._recoveryMode  = null;
        this._recoveryDelay = 0;

        this.stats = this._buildStats(data, role, lineStats, morale, tacticMultiplier);
    }

    _buildStats(playerData, role, lineStats, morale, tacticMultiplier) {
        const moraleFactor = 1 + ((morale - 50) * 0.0005);

        // ── Path A: rich lineStats object (user team) ──
        if (lineStats && lineStats.attack) {
            let line;
            if (playerData.position === 'FW')      line = 'attack';
            else if (playerData.position === 'MF')  line = 'midfield';
            else                                     line = 'defense';

            const baseStats = lineStats[line].stats;
            const statMapping = {
                passing:  'technique', shooting: 'attack', defense: 'defense',
                speed:    'speed',     decision: 'mentality', physical: 'physical'
            };
            const finalStats = {};
            for (const [simStat, dnaStat] of Object.entries(statMapping)) {
                const baseVal = baseStats[dnaStat] || playerData.rating;
                let val = (typeof TacticsManager !== 'undefined')
                    ? TacticsManager.calculateFinalPower(baseVal, role, dnaStat)
                    : baseVal;
                finalStats[simStat] = val * moraleFactor * tacticMultiplier;
            }
            finalStats.tackle = finalStats.defense;
            return finalStats;
        }

        // ── Path B: overall-only (AI team) ──
        const overall = playerData.rating || 70;
        const derived = deriveStatsFromOverall(overall, playerData.position);
        // Apply tactic + morale multipliers
        for (const k of Object.keys(derived)) {
            derived[k] = derived[k] * moraleFactor * tacticMultiplier;
        }
        return derived;
    }
}

// =============================================================================
// [SECTION 4]  REAL SOCCER ENGINE
// =============================================================================

class RealSoccerEngine {

    // ─────────────────────────────────────────────────────────────
    // 4.1  CONSTRUCTOR
    // ─────────────────────────────────────────────────────────────
    constructor(homeSquad, awaySquad, homeTactic = 'balanced', awayTactic = 'balanced') {
        this.players    = [];
        this.ball       = new SimBall();
        this.matchTime  = 0;
        this.eventsQueue = [];
        this.pendingShot = null;

        this.celebrationTimer  = 0;
        this.celebrationActor  = null;
        this.celebrationTarget = null;
        this.celebrationType   = null;
        this.lastScorerTeam    = null;

        this.homeScore = 0;
        this.awayScore = 0;
        this.userStats = null;
        this.aiStats   = null;

        this.teamTactics = { home: homeTactic, away: awayTactic };

        // Attack-route state machine (per team)
        this._attackRoute = { home: null, away: null };
        this._attackRouteTimer = { home: 0, away: 0 };

        this.initTeam(homeSquad, 'home', homeTactic);
        this.initTeam(awaySquad, 'away', awayTactic);
        this.resetPositions('home');
    }

    // ─────────────────────────────────────────────────────────────
    // 4.2  STAT HELPERS
    // ─────────────────────────────────────────────────────────────
    getEffectiveStat(player, statName) {
        let val = player.stats[statName];
        if (val === undefined) return 50;
        let factor = 1.0;
        if      (player.stamina < 50) factor = 0.50;
        else if (player.stamina < 60) factor = 0.75;
        else if (player.stamina < 70) factor = 0.90;
        return val * factor;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.3  AI STAT GENERATION  (for opponent squad)
    // ─────────────────────────────────────────────────────────────
    generateAIStats(squad) {
        const aiStats = {
            attack:   { stats: {} },
            midfield: { stats: {} },
            defense:  { stats: {} }
        };
        const calcAvg = arr => arr.length > 0
            ? Math.round(arr.reduce((s, p) => s + p.rating, 0) / arr.length)
            : 70;
        const fwOVR = calcAvg(squad.fw.filter(Boolean));
        const mfOVR = calcAvg(squad.mf.filter(Boolean));
        const dfOVR = calcAvg([...squad.df.filter(Boolean), squad.gk].filter(Boolean));

        for (const [line, ovr] of Object.entries({ attack: fwOVR, midfield: mfOVR, defense: dfOVR })) {
            const total  = ovr * 6;
            let   remain = total % 6;
            const base   = Math.floor(total / 6);
            for (const key of ['attack','speed','technique','physical','defense','mentality']) {
                aiStats[line].stats[key] = base + (remain-- > 0 ? 1 : 0);
            }
        }
        return aiStats;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.4  TEAM INIT
    // ─────────────────────────────────────────────────────────────
    initTeam(squad, teamId, tactic) {
        const tacticMultiplier = tactic === 'balanced' ? 0.85 : 1.0;

        const setupLine = (list, baseX) => {
            const isUserTeam = (teamId === 'home' &&  gameData.isHomeGame)
                            || (teamId === 'away' && !gameData.isHomeGame);
            let lineStats, teamMorale = 50;

            if (isUserTeam) {
                lineStats  = gameData.lineStats;
                this.userStats = lineStats;
                teamMorale = gameData.teamMorale;
            } else {
                lineStats  = this.aiStats || this.generateAIStats(squad);
                this.aiStats  = lineStats;
                teamMorale = 60 + Math.floor(Math.random() * 31);
            }

            list.forEach((p, i) => {
                if (!p) return;
                let role = (gameData.playerRoles && gameData.playerRoles[p.name])
                    ? gameData.playerRoles[p.name]
                    : this.getBestRoleForTactic(tactic, p.position, i);

                const simP = new SimPlayer(p, teamId, role, lineStats, teamMorale, tacticMultiplier);
                simP.baseX = baseX;
                simP.baseY = (100 / (list.length + 1)) * (i + 1);
                simP.x = simP.baseX;
                simP.y = simP.baseY;
                this.players.push(simP);
            });
        };

        if (teamId === 'home') {
            if (squad.gk) setupLine([squad.gk], 5);
            setupLine(squad.df, 20);
            setupLine(squad.mf, 42);
            setupLine(squad.fw, 72);
        } else {
            if (squad.gk) setupLine([squad.gk], 95);
            setupLine(squad.df, 80);
            setupLine(squad.mf, 58);
            setupLine(squad.fw, 28);
        }
    }

    getBestRoleForTactic(tactic, position, index) {
        if (position === 'GK') return 'GK';
        const roleMap = {
            tikitaka:     { FW:['F9','DLF'],       MF:['DLP','AP','MEZ'],     DF:['BPD','IWB']       },
            possession:   { FW:['DLF','CF'],        MF:['DLP','AP','CAR'],     DF:['BPD','WB']        },
            lavolpiana:   { FW:['F9','W'],          MF:['DLP','REG','MEZ'],    DF:['BPD','IWB']       },
            gegenpress:   { FW:['PF','AF'],         MF:['BBM','BWM','MEZ'],    DF:['CD','CWB']        },
            totalFootball:{ FW:['CF','F9'],         MF:['BBM','MEZ','AP'],     DF:['BPD','CWB','LIB'] },
            counter:      { FW:['AF','P'],          MF:['BWM','DLP'],          DF:['NCB','FB']        },
            longBall:     { FW:['TM','AF'],         MF:['BWM','CM'],           DF:['NCB','CD']        },
            twoLine:      { FW:['AF','P'],          MF:['BWM','CAR'],          DF:['CD','FB']         },
            parkBus:      { FW:['P','TM'],          MF:['BWM','DLP'],          DF:['NCB','CD']        },
            catenaccio:   { FW:['TM','P'],          MF:['BWM','DLP'],          DF:['NCB','LIB']       }
        };
        const def = { FW:['AF','CF'], MF:['BBM','AP'], DF:['CD','FB'] };
        const m   = roleMap[tactic] || def;
        const candidates = m[position] || def[position] || ['CD'];
        return candidates[index % candidates.length];
    }

    // ─────────────────────────────────────────────────────────────
    // 4.5  RESET / KICKOFF
    // ─────────────────────────────────────────────────────────────
    resetPositions(kickoffTeamId = null) {
        this.ball.x = 50; this.ball.y = 50;
        this.ball.lastOwner = null;
        this.ball._flightOrigin = { x: 50, y: 50 };

        let kicker = null;
        if (kickoffTeamId) {
            kicker = this.players.find(p => p.teamId === kickoffTeamId && p.position === 'FW')
                  || this.players.find(p => p.teamId === kickoffTeamId && p.position === 'MF')
                  || this.players.find(p => p.teamId === kickoffTeamId);
        }
        if (kicker) {
            this.ball.state = BallState.CONTROLLED;
            this.ball.owner = kicker;
            kicker.x = 50; kicker.y = 50;
        } else {
            this.ball.state = BallState.LOOSE;
            this.ball.owner = null;
        }

        this.players.forEach(p => {
            if (p === kicker) return;
            p.y = p.baseY; p.vx = 0; p.vy = 0;
            if (p.teamId === 'home') {
                const mx = p.position === 'MF' ? 40 : 48;
                p.x = Math.min(p.baseX, mx);
            } else {
                const mn = p.position === 'MF' ? 60 : 52;
                p.x = Math.max(p.baseX, mn);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.6  MAIN UPDATE LOOP
    // ─────────────────────────────────────────────────────────────
    update(minute, isNewMinute) {
        this.eventsQueue = [];
        if (isNewMinute) this.consumeStamina();

        // Tick steal cooldowns
        this.players.forEach(p => { if (p._stealCooldown > 0) p._stealCooldown--; });

        // Celebration phase
        if (this.celebrationTimer > 0) {
            this.processCelebrationMovement();
            this.celebrationTimer--;
            if (this.celebrationTimer <= 0) {
                const next = this.lastScorerTeam === 'home' ? 'away' : 'home';
                this.resetPositions(next);
            }
            return this.getSnapshot();
        }

        // Ball flight
        if (this.ball.state === BallState.IN_FLIGHT) {
            const BALL_SPEED = 4.2;
            const dx = this.ball.targetPos.x - this.ball.x;
            const dy = this.ball.targetPos.y - this.ball.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= BALL_SPEED) {
                this.ball.x = this.ball.targetPos.x;
                this.ball.y = this.ball.targetPos.y;
                this.ball.state = BallState.LOOSE;
                if (this.pendingShot) { this.handleShotResult(); return this.getSnapshot(); }
            } else {
                const ratio = BALL_SPEED / dist;
                this.ball.x += dx * ratio;
                this.ball.y += dy * ratio;
                this.checkInterception();   // in-flight interception every frame
            }
        }

        // Loose ball pickup
        if (this.ball.state === BallState.LOOSE) {
            let nearest = null, minD = 999;
            this.players.forEach(p => {
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (d < minD) { minD = d; nearest = p; }
            });
            if (nearest && minD < 2.5) {
                this.ball.state = BallState.CONTROLLED;
                this.ball.owner = nearest;
                this.ball.intendedReceiver = null;
                this.ball.x = nearest.x; this.ball.y = nearest.y;
            }
        }

        // On-ball decision
        if (this.ball.state === BallState.CONTROLLED && this.ball.owner) {
            this.processBallCarrierAI(this.ball.owner);
        }

        this.processOffBallAI();
        this.adjustDefensiveLines();

        return this.getSnapshot();
    }

    // ─────────────────────────────────────────────────────────────
    // 4.7  STAMINA
    // ─────────────────────────────────────────────────────────────
    consumeStamina() {
        const rates = { FW: 0.6, MF: 0.7, DF: 0.4, GK: 0.1 };
        this.players.forEach(p => {
            const r = rates[p.position] || 0.5;
            p.stamina = Math.max(0, p.stamina - r * (0.8 + Math.random() * 0.4));
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.8  SNAPSHOT
    // ─────────────────────────────────────────────────────────────
    getSnapshot() {
        return {
            ball: { x: this.ball.x, y: this.ball.y, z: this.ball.z, state: this.ball.state },
            players: this.players.map(p => ({
                id:      p.id,
                x:       p.x,
                y:       p.y,
                team:    p.teamId,
                hasBall: (this.ball.owner === p)
            })),
            events:        [...this.eventsQueue],
            isCelebration: this.celebrationTimer > 0
        };
    }

    // ─────────────────────────────────────────────────────────────
    // 4.9  TACTIC HELPERS
    // ─────────────────────────────────────────────────────────────
    getTeamTactic(teamId) {
        if (typeof gameData !== 'undefined') {
            const userSide = gameData.isHomeGame ? 'home' : 'away';
            if (teamId === userSide && gameData.currentTactic) return gameData.currentTactic;
        }
        return this.teamTactics?.[teamId] || 'balanced';
    }

    isGegenpressTeam(teamId) { return this.getTeamTactic(teamId) === 'gegenpress'; }

    getTacticProfile(teamId) {
        const profiles = {
            tikitaka:     { width:0.82, tempo:0.92, directness:0.72, press:0.78, boxPress:0.72, attackRisk:0.76 },
            possession:   { width:0.86, tempo:0.82, directness:0.62, press:0.62, boxPress:0.68, attackRisk:0.68 },
            lavolpiana:   { width:0.90, tempo:0.84, directness:0.66, press:0.58, boxPress:0.64, attackRisk:0.66 },
            gegenpress:   { width:0.92, tempo:1.16, directness:0.88, press:1.28, boxPress:1.12, attackRisk:0.92 },
            totalFootball:{ width:0.96, tempo:1.04, directness:0.82, press:0.96, boxPress:0.88, attackRisk:0.88 },
            counter:      { width:1.08, tempo:1.18, directness:1.22, press:0.56, boxPress:0.76, attackRisk:0.86 },
            longBall:     { width:1.05, tempo:1.10, directness:1.28, press:0.50, boxPress:0.72, attackRisk:0.80 },
            twoLine:      { width:0.92, tempo:0.92, directness:0.86, press:0.46, boxPress:0.82, attackRisk:0.62 },
            parkBus:      { width:0.80, tempo:0.72, directness:0.78, press:0.34, boxPress:0.92, attackRisk:0.48 },
            catenaccio:   { width:0.82, tempo:0.78, directness:0.86, press:0.38, boxPress:0.96, attackRisk:0.52 },
            balanced:     { width:0.92, tempo:0.92, directness:0.82, press:0.62, boxPress:0.72, attackRisk:0.68 }
        };
        return profiles[this.getTeamTactic(teamId)] || profiles.balanced;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.10  ATTACK ROUTE SELECTION
    // ─────────────────────────────────────────────────────────────
    _selectAttackRoute(teamId) {
        const dt       = gameData.deepTactics || {};
        const profile  = this.getTacticProfile(teamId);
        const haswinger = this.players.some(p =>
            p.teamId === teamId && this.getRoleBehavior(p.role).hugLine
        );

        // DRAMATICALLY increase pass/cross routes, DECREASE steal_shot route
        let w1 = 0.55;  // through pass from 0.35 to 0.55
        let w2 = haswinger ? 0.50 : 0.35; // cross increased
        let w3 = 0.10;  // press_steal_shot DECREASED from 0.25-0.45 to 0.10

        if (dt.passLength === 'long')  { w1 += 0.20; w2 += 0.10; }
        if (dt.passLength === 'short') { w1 -= 0.05; w3 += 0.02; }

        const total = w1 + w2 + w3;
        const roll  = Math.random() * total;
        if      (roll < w1)        return 'through_pass';
        else if (roll < w1 + w2)   return 'cross';
        else                       return 'press_steal_shot';
    }

    _getOrSelectRoute(teamId) {
        if (this._attackRouteTimer[teamId] > 0) {
            this._attackRouteTimer[teamId]--;
            return this._attackRoute[teamId];
        }
        const route = this._selectAttackRoute(teamId);
        this._attackRoute[teamId]       = route;
        this._attackRouteTimer[teamId]  = 12 + Math.floor(Math.random() * 10);
        return route;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.11  ON-BALL DECISION SCORING
    // ─────────────────────────────────────────────────────────────
    _scorePassOption(from, to, gameState) {
        const isHome  = from.teamId === 'home';
        const goalX   = isHome ? 100 : 0;
        const dist    = Math.hypot(from.x - to.x, from.y - to.y);
        const distToGoalFrom = Math.abs(from.x - goalX);
        const distToGoalTo   = Math.abs(to.x   - goalX);
        const isForward      = distToGoalTo < distToGoalFrom;
        const isBackward     = distToGoalTo > distToGoalFrom + 3; // True pass backwards
        const isLateral      = !isForward && !isBackward;

        let enemyInLane = false;
        for (const opp of this.players) {
            if (opp.teamId === from.teamId) continue;
            const tx = to.x - from.x, ty = to.y - from.y;
            const len2 = tx * tx + ty * ty;
            if (len2 < 0.001) continue;
            const t = clamp(((opp.x - from.x) * tx + (opp.y - from.y) * ty) / len2, 0, 1);
            const cx = from.x + t * tx, cy = from.y + t * ty;
            if (Math.hypot(opp.x - cx, opp.y - cy) < 5) { enemyInLane = true; break; }
        }

        const spaceAhead = !this.players.some(opp => {
            if (opp.teamId === from.teamId) return false;
            const aheadX = isHome ? to.x + 8 : to.x - 8;
            return Math.hypot(opp.x - aheadX, opp.y - to.y) < 6;
        });

        const dt = gameData.deepTactics || {};
        let passTypeScore = 0;
        if (dt.passLength === 'short' && dist > 25)  passTypeScore -= 15;
        if (dt.passLength === 'long'  && dist < 10)  passTypeScore -= 10;

        let score = 0;
        if (enemyInLane) score -= 18;

        // HEAVILY prefer forward passes, penalize backward/lateral
        if (isForward) score += 35;          // MAJOR boost for forward!
        else if (isLateral) score -= 12;     // Slight penalty for sideways
        else score -= 50;                    // MAJOR penalty for true back passes!

        score += (to.rating - 70) * 0.04;

        // Position-based scoring: Prefer MF/FW targets, discourage GK targets!
        if (to.position === 'GK') score -= 80;           // NEVER pass back to GK
        if (to.position === 'DF' && gameState !== 'buildup') score -= 30; // No DF passes in attack!
        if (to.position === 'FW') score += 20;           // Favor forwards
        if (to.position === 'MF') score += 10;           // Favor midfielders

        const stateWeight = {
            buildup: isForward ? 6 : 10,
            counter: isForward ? 40 : -20,  // Counters: MAX forward!
            attack:  isForward ? 30 : -20
        };
        score += stateWeight[gameState] || 10;
        if (spaceAhead) score += 10;

        const distToGoalAfter = Math.abs(to.x - goalX);
        if (distToGoalAfter < 25) score += 10;
        if (distToGoalAfter < 15) score += 20;

        const nearDef = this.findNearestDefender(to);
        if (nearDef && from.rating > nearDef.player.rating + 5) score += 5;

        score += passTypeScore;
        if (this.ball.lastOwner === to) score -= 60; // No give-and-go spam
        score += (Math.random() - 0.5) * 10;

        return score;
    }

    _getGameState(teamId) {
        const isHome = teamId === 'home';
        const ballX  = this.ball.x;
        if ((isHome && ballX > 65) || (!isHome && ballX < 35)) return 'attack';
        if (this.ball.lastOwner && this.ball.lastOwner.teamId !== teamId &&
            this.ball.state === BallState.CONTROLLED) return 'counter';
        return 'buildup';
    }

    // ─────────────────────────────────────────────────────────────
    // 4.12  PASS TEMPO MODIFIERS
    // ─────────────────────────────────────────────────────────────
    _getTempoModifiers() {
        const tempo = gameData.deepTactics?.passTempo || 'normal';
        if (tempo === 'fast') return { scanSpeedBonus: 1.3, passSuccessModifier: -5 };
        if (tempo === 'slow') return { scanSpeedBonus: 0.7, passSuccessModifier:  5 };
        return { scanSpeedBonus: 1.0, passSuccessModifier: 0 };
    }

    // ─────────────────────────────────────────────────────────────
    // 4.13  BALL CARRIER AI
    // ─────────────────────────────────────────────────────────────
    processBallCarrierAI(player) {
        if (player.position === 'GK') {
            this.processGoalkeeperAI(player, this._isUnderPressure(player));
            return;
        }

        const isHome      = player.teamId === 'home';
        const goalX       = isHome ? 100 : 0;
        const distToGoal  = Math.abs(player.x - goalX);
        const behavior    = this.getRoleBehavior(player.role);
        const isOnFlank   = player.y < 25 || player.y > 75;
        const nearestOpp  = this.findNearestDefender(player);
        const pressureDist = nearestOpp ? nearestOpp.dist : 999;
        const underPressure = pressureDist < 8;
        const moveDir     = isHome ? 1 : -1;
        const effectiveSpeed = this.getEffectiveStat(player, 'speed');
        const isWingerOnFlank = behavior.hugLine && isOnFlank;

        let shootChance = this._calcShootChance(player, goalX, distToGoal);
        if (shootChance > 0 && Math.random() < shootChance) {
            this.attemptShoot(player, goalX);
            return;
        }

        const gameState   = this._getGameState(player.teamId);
        const tempoMod    = this._getTempoModifiers();
        const teammates   = this.players.filter(p => p.teamId === player.teamId && p !== player);
        const route       = this._getOrSelectRoute(player.teamId);

        let scoredOptions = teammates.map(tm => ({
            player: tm,
            score:  this._scorePassOption(player, tm, gameState)
        }));

        scoredOptions.forEach(opt => {
            const tm = opt.player;
            if (route === 'through_pass') {
                if (tm.burstTimer > 5) opt.score += 30;
            } else if (route === 'cross') {
                if (this.getRoleBehavior(tm.role).hugLine) opt.score += 20;
                else if (tm.position === 'FW' && Math.abs(tm.y - 50) < 25) opt.score += 15;
            } else if (route === 'press_steal_shot') {
                if (Math.abs(tm.x - goalX) < Math.abs(player.x - goalX)) opt.score += 10;
            }
        });

        scoredOptions.sort((a, b) => b.score - a.score);
        const bestTarget = scoredOptions[0]?.player || null;

        let passProb = this._calcPassProb(player, underPressure, isWingerOnFlank, distToGoal, tempoMod);

        if (bestTarget && Math.random() < passProb) {
            this._executePassStyled(player, bestTarget, gameState);
            return;
        }

        if (nearestOpp && nearestOpp.dist < 7 && Math.random() < 0.05) {
            if (this.attemptTackle(nearestOpp.player, player)) return;
        }

        this._dribbleCarry(player, goalX, distToGoal, nearestOpp, underPressure, moveDir, effectiveSpeed, isWingerOnFlank);
    }

    _isUnderPressure(player) {
        return this.players.some(p =>
            p.teamId !== player.teamId &&
            Math.hypot(p.x - player.x, p.y - player.y) < 8
        );
    }

    _calcShootChance(player, goalX, distToGoal) {
        const isAngleBlocked = distToGoal < 35 && this.players.some(opp => {
            if (opp.teamId === player.teamId) return false;
            const d = Math.hypot(opp.x - player.x, opp.y - player.y);
            if (d > 12) return false;
            const dot   = (goalX - player.x) * (opp.x - player.x) + (50 - player.y) * (opp.y - player.y);
            const mag1  = Math.hypot(goalX - player.x, 50 - player.y);
            const mag2  = d;
            const angle = Math.acos(clamp(dot / (mag1 * mag2 + 0.001), -1, 1));
            return angle < 0.32;
        });

        // Only block if VERY blocked AND not FW
        if (isAngleBlocked && distToGoal > 14 && player.position !== 'FW' && Math.random() < 0.7) return 0;

        let base = 0;
        // MASSIVELY INCREASE SHOOT CHANCE AND DISTANCE!
        if      (distToGoal < 12) base = 0.98;
        else if (distToGoal < 20) base = clamp(1 / distToGoal * 18, 0, 0.85);
        else if (distToGoal < 30) base = clamp(1 / distToGoal * 10, 0, 0.25);
        else if (distToGoal < 38) base = clamp(1 / distToGoal * 3,  0, 0.08);
        else if (distToGoal < 45) base = 0.03; // Long shots!

        // FWs shoot more!
        if (player.position === 'FW') base *= 1.5;

        return Math.min(base, 0.98);
    }

    _calcPassProb(player, underPressure, isWingerOnFlank, distToGoal, tempoMod) {
        let prob = 0.5;
        const profile = this.getTacticProfile(player.teamId);
        const behavior = this.getRoleBehavior(player.role);

        if (player.position === 'DF') {
            // CB build-up은 여전히 빠른 패스, BUT FB 오버랩 뛸땐 드리블 가능!
            const isFullback = ['FB','WB','CWB','IWB'].includes(player.role);
            if (isFullback && !underPressure && distToGoal > 50) {
                prob = 0.35; // FB 빌드업 시 드리블로 전진 유도!
            } else {
                prob = underPressure ? 0.95 : 0.72; // CB는 적당히 빠르게 (85→72로 낮춤)
            }
        } else if (isWingerOnFlank && distToGoal < 28) {
            prob = 0.90; // 크로스 구역에 도달하면 패스/크로스!
        } else {
            // ⭐ MF/FW: 드리블로 침투/전진 하게 패스 확률 대폭 낮춤!
            prob = 0.22; // 기존 0.55 → 0.22! (78% 확률로 드리블!)
            if (underPressure) prob = 0.48; // 압박 시에도 48%만 패스! (기존 88%→48%)
            // FW 침투 상황: 패스 더 적게!
            if (player.position === 'FW' && !underPressure && distToGoal < 60) {
                prob *= 0.65; // FW는 드리블로 골대로 돌진!
            }
            // MF 빌드업 존(X: 30-50): 드리블로 전진하도록 더 낮춤
            const isHome = player.teamId === 'home';
            if (player.position === 'MF' && ((isHome && player.x < 55) || (!isHome && player.x > 45))) {
                prob *= 0.7;
            }
            // If player has dribble trait, pass even less!
            if (behavior.hugLine) prob *= 0.9;
        }

        prob = clamp(prob * (1.0 + profile.directness * 0.1), 0.1, 0.95);
        if (tempoMod.scanSpeedBonus > 1) prob = Math.min(prob + 0.04, 0.95);

        return prob;
    }

    _executePassStyled(from, to, gameState) {
        const isHome   = from.teamId === 'home';
        const goalX    = isHome ? 100 : 0;
        const dist     = Math.hypot(from.x - to.x, from.y - to.y);
        const distToGoalTo   = Math.abs(to.x - goalX);
        const distToGoalFrom = Math.abs(from.x - goalX);
        const isBehindLine   = this._isReceiverBehindDefLine(from, to);
        const dt             = gameData.deepTactics || {};

        let passKind = 'safe';
        if (isBehindLine && dist > 10 && distToGoalFrom > distToGoalTo) passKind = 'risky';
        else if (dt.passLength === 'long' || dist > 30) passKind = 'lateral_long';

        this.executePass(from, to, passKind);
    }

    _isReceiverBehindDefLine(from, to) {
        const isHome = from.teamId === 'home';
        const oppFieldPlayers = this.players.filter(p => p.teamId !== from.teamId && p.position !== 'GK');
        if (!oppFieldPlayers.length) return false;
        if (isHome) {
            const sorted = oppFieldPlayers.map(p => p.x).sort((a, b) => a - b);
            const lineX  = sorted.length >= 2 ? sorted[1] : sorted[0];
            return to.x > lineX;
        } else {
            const sorted = oppFieldPlayers.map(p => p.x).sort((a, b) => b - a);
            const lineX  = sorted.length >= 2 ? sorted[1] : sorted[0];
            return to.x < lineX;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4.14  DRIBBLE / CARRY
    // ─────────────────────────────────────────────────────────────
    _dribbleCarry(player, goalX, distToGoal, nearestOpp, underPressure, moveDir, effectiveSpeed, isWingerOnFlank) {
        const speedFactor   = effectiveSpeed / 75;
        const isBlocked     = this.checkFrontalBlock(player, goalX);
        const canOutrun     = nearestOpp
            ? effectiveSpeed > this.getEffectiveStat(nearestOpp.player, 'speed') + 5
            : true;
        const distToOpp     = nearestOpp?.dist ?? 999;
        const isOneOnOne    = distToOpp > 18;

        // ⭐ FORWARD DRIVE: 무조건 전진! 후진하는 일 없게!
        let moveSpeed = 0.70 * clamp(speedFactor, 0.75, 1.8); // 0.55→0.70!
        let targetX   = player.x + moveDir * 48; // 35→48! 더 멀리 전진!
        let targetY   = player.y;

        if (isWingerOnFlank) {
            // Winger: 무조건 바깥 라인을 따라 고속 질주!
            targetY   = player.y < 50 ? 6 : 94;
            targetX   = player.x + moveDir * 55;
            moveSpeed = 0.92; // 0.75→0.92!
        } else if (isOneOnOne && !isBlocked && player.position === 'FW') {
            // FW: 1v1 상황이면 골문으로 직격!
            targetX   = player.x + moveDir * 70; // 55→70!
            targetY   = player.y + (Math.random() * 18 - 9);
            moveSpeed = 0.95 * clamp(speedFactor, 0.9, 1.9); // 0.80→0.95!
        } else if (underPressure || isBlocked) {
            // 압박 또는 막혔을 때: 옆으로 피해서 계속 전진!
            const sideOffset = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random()*8);
            if (canOutrun && Math.random() < 0.85) {
                // 스피드 우위시 그냥 앞으로 돌파!
                targetX = player.x + moveDir * 52;
                targetY = player.y + sideOffset * 0.5;
                moveSpeed *= 1.55;
            } else {
                // 옆으로 빠지면서 전진 (절대 멈추거나 후진하지 않음!)
                targetY = player.y + sideOffset;
                targetX = player.x + moveDir * 32;
                moveSpeed *= 1.3;
            }
        } else {
            // 평시 드리블: 커브 + 무조건 전진!
            const curve = (Math.random() * 16 - 8);
            targetY = player.y + curve;
            // MF: 기본 드리블 거리도 더 길게!
            if (player.position === 'MF') {
                targetX = player.x + moveDir * 55;
                moveSpeed *= 1.15;
            }
        }

        // ⭐⭐ ABSOLUTE: NO BACKWARD DRIBBLING! 절대 후진하지 않음!
        targetX = (moveDir === 1) ? Math.max(targetX, player.x + 8) : Math.min(targetX, player.x - 8);

        targetY = clamp(targetY, 3, 97);

        // ⭐ USE _applyMovement for collision avoidance & position bands!
        // (기존 직접 vx/vy 조작 대신 _applyMovement로 통일해서 충돌+포지션 밴드 적용!)
        this._applyMovement(player, targetX, targetY, moveSpeed);

        // Ball follows carrier!
        this.ball.lastOwner = null;
        this.ball.x = player.x;
        this.ball.y = player.y;

        if (Math.random() < 0.28) this.eventsQueue.push({ type:'dribble', player: player.name });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.15  GOALKEEPER AI
    // ─────────────────────────────────────────────────────────────
    processGoalkeeperAI(gk, underPressure) {
        this.keepGoalkeeperHome(gk);

        const closestAttacker = this.players
            .filter(p => p.teamId !== gk.teamId && p.position === 'FW')
            .sort((a, b) => Math.hypot(a.x - gk.x, a.y - gk.y) - Math.hypot(b.x - gk.x, b.y - gk.y))[0];

        if (closestAttacker) {
            const distAtt = Math.hypot(closestAttacker.x - gk.x, closestAttacker.y - gk.y);
            if (distAtt < 20 && this.ball.owner === closestAttacker) {
                const isHome = gk.teamId === 'home';
                const advanceDir = isHome ? 1 : -1;
                const advanceX = clamp(gk.x + advanceDir * 2, isHome ? 5 : 85, isHome ? 15 : 95);
                gk.x = advanceX;
                gk.y = 50 + (closestAttacker.y - 50) * 0.4;
                if (this.ball.owner === gk) { this.ball.x = gk.x; this.ball.y = gk.y; }
                return;
            }
        }

        // ALWAYS PASS TO A DEFENDER FIRST (CENTER BACK)!
        const teammates = this.players.filter(p => p.teamId === gk.teamId && p !== gk);
        const dfs = teammates.filter(p => p.position === 'DF');
        let target = null;

        // Find CB first!
        if (dfs.length) {
            target = dfs.sort((a, b) => {
                // Center-back priority: CD/BPD > others
                const aPriority = (['CD','BPD','NCB'].includes(a.role)) ? 0 : 1;
                const bPriority = (['CD','BPD','NCB'].includes(b.role)) ? 0 : 1;
                if (aPriority !== bPriority) return aPriority - bPriority;
                // Then sort by closest to GK
                return Math.hypot(a.x-gk.x,a.y-gk.y) - Math.hypot(b.x-gk.x,b.y-gk.y);
            })[0];
        }

        // If no DFs, fall back to MF
        if (!target) {
            const mfs = teammates.filter(p => p.position === 'MF');
            if (mfs.length) target = mfs[0];
        }

        if (target) { this.executePass(gk, target, 'safe'); return; }
        this.clearBall(gk);
    }

    _findGKPassTarget(gk, mode) {
        const teammates = this.players.filter(p => p.teamId === gk.teamId && p !== gk);
        const isHome    = gk.teamId === 'home';
        const forwardX  = isHome ? 100 : 0;

        if (mode === 'safe') {
            const dfs = teammates.filter(p => p.position === 'DF');
            if (dfs.length) {
                return dfs.sort((a, b) =>
                    Math.hypot(a.x-gk.x,a.y-gk.y) - Math.hypot(b.x-gk.x,b.y-gk.y)
                )[0];
            }
            const mfs = teammates.filter(p => p.position === 'MF');
            if (mfs.length) {
                return mfs.sort((a, b) =>
                    Math.hypot(a.x-gk.x,a.y-gk.y) - Math.hypot(b.x-gk.x,b.y-gk.y)
                )[0];
            }
        } else {
            let best = null, bestScore = -Infinity;
            teammates.forEach(tm => {
                if (tm.position === 'GK') return;
                const dist = Math.hypot(gk.x - tm.x, gk.y - tm.y);
                if (dist > 50) return;
                const fwScore  = Math.abs(tm.x - forwardX) < Math.abs(gk.x - forwardX) ? 30 : -10;
                let   pressScore = 0;
                this.players.forEach(opp => {
                    if (opp.teamId !== gk.teamId) {
                        const d = Math.hypot(tm.x - opp.x, tm.y - opp.y);
                        if (d < 12) pressScore -= (12 - d) * 3;
                    }
                });
                const distScore = dist < 8 ? 20 : dist > 35 ? -(dist-35)*1.5 : 15;
                const total = fwScore + pressScore + distScore;
                if (total > bestScore) { bestScore = total; best = tm; }
            });
            return best;
        }
        return null;
    }

    keepGoalkeeperHome(gk) {
        const homeX = gk.baseX || (gk.teamId === 'home' ? 5 : 95);
        gk.x = homeX;
        gk.y = clamp(50 + (this.ball.y - 50) * 0.08, 42, 58);
        gk.vx = 0; gk.vy *= 0.2;
        if (this.ball.owner === gk) { this.ball.x = gk.x; this.ball.y = gk.y; }
    }

    // ─────────────────────────────────────────────────────────────
    // 4.16  PASS EXECUTION
    // ─────────────────────────────────────────────────────────────
    executePass(from, to, passKind = 'safe') {
        this.ball.state = BallState.IN_FLIGHT;
        this.ball._flightOrigin = { x: from.x, y: from.y };
        this.ball.lastOwner         = from;
        this.ball.intendedReceiver  = to;
        this.ball.owner             = null;

        const dist     = Math.hypot(from.x - to.x, from.y - to.y);
        const tempoMod = this._getTempoModifiers();
        let   accuracy = this.getEffectiveStat(from, 'passing');
        if (to.burstTimer > 0) accuracy += 30;
        accuracy += tempoMod.passSuccessModifier;

        let distPenalty = Math.max(0, (dist - 20) * 0.8);
        if (passKind === 'risky')  distPenalty *= 1.4;
        if (passKind === 'safe')   distPenalty *= 0.7;

        const isHome         = from.teamId === 'home';
        const forwardX       = isHome ? 100 : 0;
        const isBehindLine   = this._isReceiverBehindDefLine(from, to);
        const isThroughPass  = isBehindLine
            && (Math.abs(from.x - forwardX) > Math.abs(to.x - forwardX) + 5)
            && dist > 10 && dist <= 40
            && Math.abs(from.x - forwardX) < 65;

        let successChance = accuracy - distPenalty;
        if (from.position === 'GK' && dist > 50) successChance -= 15;
        if (isThroughPass && accuracy > 75)       successChance += (accuracy - 75) * 1.5;
        if (isThroughPass && to.burstTimer > 0)   successChance += 15;

        const isBadPass = Math.random() * 100 > successChance;
        const eventType = isThroughPass ? 'throughpass' : 'pass';

        if (isBadPass) {
            const errorMargin = dist * 0.25;
            const angle  = Math.random() * Math.PI * 2;
            const errDst = Math.random() * errorMargin + 5;
            this.ball.targetPos = {
                x: clamp(to.x + Math.cos(angle) * errDst, 2, 98),
                y: clamp(to.y + Math.sin(angle) * errDst, 2, 98)
            };
            this.eventsQueue.push({ type: eventType, from: from.name, to: to.name,
                desc: isThroughPass ? `${from.name}의 스루패스가 차단됩니다.` : `${from.name}, 패스 미스!` });
        } else {
            this.ball.targetPos = { x: to.x, y: to.y };
            const desc = isThroughPass
                ? `⚡ ${from.name}, ${to.name}에게 결정적인 스루패스!`
                : `${from.name}, ${to.name}에게 연결!`;
            this.eventsQueue.push({ type: eventType, from: from.name, to: to.name, desc });
        }
    }

    clearBall(player) {
        const isHome   = player.teamId === 'home';
        const fwd      = isHome ? 1 : -1;
        this.ball.state = BallState.IN_FLIGHT;
        this.ball._flightOrigin = { x: player.x, y: player.y };
        this.ball.owner     = null;
        this.ball.lastOwner = player;
        this.ball.targetPos = {
            x: clamp(50 + fwd * (Math.random() * 10), 2, 98),
            y: 20 + Math.random() * 60
        };
        this.eventsQueue.push({ type:'pass', from: player.name, to:'걷어내기',
            desc:`${player.name}, 위험 지역을 벗어나게 걷어냅니다.` });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.17  SHOOTING
    // ─────────────────────────────────────────────────────────────
    attemptShoot(shooter, goalX) {
        const oppTeamId = shooter.teamId === 'home' ? 'away' : 'home';
        const gk        = this.players.find(p => p.teamId === oppTeamId && p.position === 'GK');
        const gkRating  = gk ? this.getEffectiveStat(gk, 'defense') : 60;
        const dist      = Math.abs(shooter.x - goalX);

        const distFactor  = Math.max(0.7, 1.3 - dist / 40);
        const distY       = Math.abs(shooter.y - 50);
        let   angleFactor = 1.0;
        if (distY > 8) {
            const angle = Math.atan2(distY, Math.max(1, dist));
            angleFactor = angle > 1.2 ? 0.15 : angle > 0.9 ? 0.4 : angle > 0.6 ? 0.7 : 0.9;
        }

        const effectiveShooting = this.getEffectiveStat(shooter, 'shooting');
        const shotPower  = effectiveShooting * (0.8 + Math.random() * 0.4) * distFactor * angleFactor;
        const savePower  = gkRating * (0.8 + Math.random() * 0.5) + 5;
        let   goalChance = clamp(0.25 + (shotPower - savePower) * 0.0045, 0.04, 0.95);

        this.ball.state = BallState.IN_FLIGHT;
        this.ball._flightOrigin = { x: shooter.x, y: shooter.y };
        this.ball.owner     = null;
        this.ball.targetPos = { x: goalX, y: 45 + Math.random() * 10 };
        this.pendingShot    = { isGoal: Math.random() < goalChance, shooter, goalX };
    }

    handleShotResult() {
        const { isGoal, shooter, goalX } = this.pendingShot;
        this.pendingShot = null;

        if (isGoal) {
            if (shooter.teamId === 'home') this.homeScore++;
            else                           this.awayScore++;

            this.ball.intendedReceiver = null;
            const isHome   = shooter.teamId === 'home';
            const myScore  = isHome ? this.homeScore : this.awayScore;
            const oppScore = isHome ? this.awayScore : this.homeScore;
            const assister = (this.ball.lastOwner && this.ball.lastOwner.teamId === shooter.teamId
                           && this.ball.lastOwner.name !== shooter.name)
                ? this.ball.lastOwner.name : null;

            this.celebrationType   = myScore < oppScore ? 'quick_restart' : 'celebrate';
            this.celebrationActor  = shooter;
            if (this.celebrationType === 'quick_restart') {
                this.celebrationTarget = { x: 50, y: 50 };
            } else {
                this.celebrationTarget = { x: isHome ? 100 : 0, y: shooter.y < 50 ? 0 : 100 };
            }

            this.eventsQueue.push({ type:'goal', scorer: shooter.name, team: shooter.teamId, assister });
            this.lastScorerTeam   = shooter.teamId;
            this.celebrationTimer = 40;
            this.ball.state = BallState.DEAD; this.ball.lastOwner = null;

            this._triggerTurnoverRecovery(shooter.teamId === 'home' ? 'away' : 'home');

        } else {
            this.ball.intendedReceiver = null;
            shooter.forceReturnTimer = 60;

            const oppTeamId = shooter.teamId === 'home' ? 'away' : 'home';
            const isHomeAtt = shooter.teamId === 'home';
            const enemyGk   = this.players.find(p => p.teamId !== shooter.teamId && p.position === 'GK');

            const blockers = this.players.filter(p =>
                p.teamId === oppTeamId && p.position !== 'GK'
                && Math.abs(p.x - shooter.x) < 15 && Math.abs(p.y - shooter.y) < 5
                && (isHomeAtt ? p.x > shooter.x : p.x < shooter.x)
            );
            if (blockers.length > 0 && Math.random() < 0.1) {
                const blocker = blockers[0];
                this.eventsQueue.push({ type:'block', shooter: shooter.name, blocker: blocker.name,
                    desc:`🛡️ ${blocker.name}, 몸을 날려 슈팅을 막아냅니다!` });
                this.ball.state = BallState.LOOSE; this.ball.owner = null;
                this.ball.x = blocker.x + (isHomeAtt ? -5 :  5);
                this.ball.y = blocker.y + (Math.random() - 0.5) * 15;
                return;
            }

            if (enemyGk) {
                const gkBaseX    = enemyGk.teamId === 'home' ? 5 : 95;
                const newGkY     = clamp(this.ball.targetPos.y, 35, 65);
                enemyGk.x = gkBaseX; enemyGk.y = newGkY;
                this.ball.x = enemyGk.x; this.ball.y = enemyGk.y;

                if (Math.random() < 0.15) {
                    this.eventsQueue.push({ type:'save', shooter: shooter.name, gk: enemyGk.name,
                        desc:`🧤 ${enemyGk.name}, 슈팅을 펀칭으로 쳐냅니다!` });
                    this.ball.state = BallState.LOOSE; this.ball.owner = null;
                    this.ball.x = enemyGk.x + (isHomeAtt ? -10 : 10);
                    this.ball.y = enemyGk.y + (Math.random() - 0.5) * 30;
                } else {
                    this.eventsQueue.push({ type:'save', shooter: shooter.name, gk: enemyGk.name,
                        desc:`🧤 ${enemyGk.name}, 안정적으로 공을 잡아냅니다.` });
                    this.ball.state = BallState.CONTROLLED; this.ball.owner = enemyGk;
                    this.ball.x = enemyGk.x; this.ball.y = enemyGk.y;
                }
            } else {
                this.eventsQueue.push({ type:'miss', shooter: shooter.name,
                    desc:`🥅 ${shooter.name}의 슈팅이 골문을 벗어납니다.` });
                this.ball.state = BallState.LOOSE;
                this.ball.x = goalX === 0 ? 5 : 95; this.ball.y = 50;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4.18  TURNOVER REACTION
    // ─────────────────────────────────────────────────────────────
    _triggerTurnoverRecovery(losingTeamId) {
        this.players.forEach(p => {
            if (p.teamId !== losingTeamId) return;
            if      (p.position === 'DF') { p._recoveryMode = 'immediate'; p._recoveryDelay = 0; }
            else if (p.position === 'MF') {
                const roll = Math.random();
                if (roll < 0.6)       { p._recoveryMode = 'delayed';   p._recoveryDelay = 4 + Math.floor(Math.random() * 6); }
                else if (roll < 0.85) { p._recoveryMode = 'hold';      p._recoveryDelay = 8; }
                else                  { p._recoveryMode = 'immediate'; p._recoveryDelay = 0; }
            } else if (p.position === 'FW') {
                p._recoveryMode  = 'frozen';
                p._recoveryDelay = 6 + Math.floor(Math.random() * 8);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.19  IN-FLIGHT INTERCEPTION
    // ─────────────────────────────────────────────────────────────
    checkInterception() {
        if (this.ball.state !== BallState.IN_FLIGHT) return;
        if (this.pendingShot) return;

        const bx = this.ball.x, by = this.ball.y;
        const ox = this.ball._flightOrigin.x, oy = this.ball._flightOrigin.y;
        const tx = this.ball.targetPos.x,     ty = this.ball.targetPos.y;

        this.players.forEach(p => {
            if (this.ball.lastOwner && p.teamId === this.ball.lastOwner.teamId) return;
            if (p._stealCooldown > 0) return;

            const distToBall = Math.hypot(p.x - bx, p.y - by);
            if (distToBall > 6) return;

            const flx = tx - ox, fly = ty - oy;
            const fLen2 = flx * flx + fly * fly;
            let traj = 0;
            if (fLen2 > 0.001) {
                traj = clamp(((p.x - ox) * flx + (p.y - oy) * fly) / fLen2, 0, 1);
            }
            const nearX = ox + traj * flx, nearY = oy + traj * fly;
            const proximity = Math.hypot(p.x - nearX, p.y - nearY);

            const tackleStat = this.getEffectiveStat(p, 'tackle') || this.getEffectiveStat(p, 'defense');
            const speedStat  = this.getEffectiveStat(p, 'speed');
            const proximityBonus = Math.max(0, (6 - proximity) / 6);
            const chance = 0.004 + (tackleStat / 3000) + (speedStat / 5000) + proximityBonus * 0.025;

            if (Math.random() < chance) {
                this.ball.state = BallState.CONTROLLED;
                this.ball.owner = p;
                this.ball.intendedReceiver = null;
                this.ball.lastOwner = null;
                p._stealCooldown = 20;
                this.eventsQueue.push({ type:'tackle', player: p.name,
                    desc:`${p.name}, 날카로운 패스 차단!` });

                const losingTeam = (p.teamId === 'home') ? 'away' : 'home';
                this._triggerTurnoverRecovery(losingTeam);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // 4.20  OFF-BALL AI
    // ─────────────────────────────────────────────────────────────
    processOffBallAI() {
        let attackingTeam = null;
        if (this.ball.owner) attackingTeam = this.ball.owner.teamId;
        else if (this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner)
            attackingTeam = this.ball.lastOwner.teamId;

        const isLoose = !this.ball.owner && this.ball.state === BallState.LOOSE;

        let nearestHome = null, nearestAway = null;
        if (isLoose) {
            let dH = 999, dA = 999;
            this.players.forEach(p => {
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (p.teamId === 'home' && d < dH) { dH = d; nearestHome = p; }
                if (p.teamId === 'away' && d < dA) { dA = d; nearestAway = p; }
            });
        }

        let presser = null;
        if (this.ball.owner && attackingTeam) {
            let minD = 999;
            this.players.forEach(p => {
                if (p.teamId === attackingTeam) return;
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (d < minD) { minD = d; presser = p; }
            });
        }

        this.players.forEach(p => {
            if (p === this.ball.owner) return;

            // ── Recovery mode tick ──
            if (p._recoveryDelay > 0) {
                p._recoveryDelay--;
                if (p._recoveryMode === 'frozen') {
                    p.vx *= 0.3; p.vy *= 0.3;
                    p.x += p.vx; p.y += p.vy;
                    return;
                }
                if (p._recoveryMode === 'hold' || p._recoveryMode === 'delayed') {
                    const ax = (p.baseX - p.x) * 0.02;
                    const ay = (p.baseY - p.y) * 0.02;
                    p.vx = (p.vx + ax) * 0.7; p.vy = (p.vy + ay) * 0.7;
                    p.x += p.vx; p.y += p.vy;
                    return;
                }
            }
            if (p._recoveryDelay <= 0 && p._recoveryMode) p._recoveryMode = null;

            const behavior     = this.getRoleBehavior(p.role);
            const effectiveSpd = this.getEffectiveStat(p, 'speed');
            const speedFactor  = effectiveSpd / 75;
            let   moveSpeed    = 0.22 * clamp(speedFactor, 0.7, 1.4);

            // ── FW는 상대팀이 공을 가지고 있으면 무조건 수비 복귀 ──
            // attackingTeam 에 관계없이 공 소유 팀이 상대팀이면 수비 처리
            const oppHasBall = this.ball.owner && this.ball.owner.teamId !== p.teamId;
            const oppInFlight = this.ball.state === BallState.IN_FLIGHT &&
                                this.ball.lastOwner && this.ball.lastOwner.teamId !== p.teamId;
            const isDefending = oppHasBall || oppInFlight;

            const isAttacking  = !isDefending && (p.teamId === attackingTeam);
            const isHome       = p.teamId === 'home';
            const forwardDir   = isHome ? 1 : -1;
            const isHomeDef    = isHome;

            let targetX = p.x, targetY = p.y;

            // ──────────────────────────────────────────────────────────
            if (isLoose) {
                const isNearest = (p === nearestHome || p === nearestAway);
                if (isNearest) {
                    targetX = this.ball.x; targetY = this.ball.y; moveSpeed = 0.55;
                } else {
                    targetX = p.baseX + (this.ball.x - p.baseX) * 0.15;
                    targetY = p.baseY + (this.ball.y - p.baseY) * 0.15;
                    moveSpeed = 0.15;
                }

            } else if (isAttacking) {
                // ── ATTACKING OFF-BALL ──

                if (this.ball.state === BallState.IN_FLIGHT && p === this.ball.intendedReceiver) {
                    targetX = this.ball.targetPos.x; targetY = this.ball.targetPos.y; moveSpeed = 0.7;

                } else if (p === this.ball.lastOwner && p.position !== 'GK' &&
                           !['CD','BPD','NCB'].includes(p.role)) {
                    targetX = p.x + forwardDir * 15;
                    targetY = p.y + (this.ball.y - p.y) * 0.3;
                    moveSpeed = 0.4;

                } else if (p.position === 'FW') {
                    this._processAttackingFWMovement(p, isHome, forwardDir, speedFactor, behavior);
                    return;

                } else if (p.position === 'MF') {
                    const ab = behavior.attackBias || 0.5;
                    const db = behavior.defenseBias || 0;

                    // 🚫 NO BALL.Y CLUSTERING! 공 Y 따라 다같이 몰리는 현상 제거!
                    // baseY weight를 극대화! ballY는 아주 조금만 반영!
                    let ballW = clamp(0.3 + ab * 0.15 - db * 0.05, 0.2, 0.55); // 0.5~1.0 → 0.2~0.55로 크게 낮춤!
                    targetX = p.baseX * (1 - ballW) + this.ball.x * ballW;
                    // ⭐ targetY: baseY 우선! ball.y 영향 최소화!
                    let yBallW = behavior.hugLine ? 0.05 : 0.22; // hugLine이면 거의 베이스Y!
                    targetY = p.baseY * (1 - yBallW) + this.ball.y * yBallW;

                    // ⭐⭐ WIDE MF: FORCE hug line! 절대 센터로 몰려오지 않음!
                    if (behavior.hugLine) {
                        targetY = p.baseY < 50 ? 10 : 90; // 극단적으로 와이드 유지!
                    }

                    // PUSH MF HIGHER but ensure they STOP BEHIND FORWARDS!
                    targetX += forwardDir * (ab * 12 + 6);
                    // 살짝 Y 퍼트리기 (혹시 모를 겹침 방지)
                    if (Math.abs(p.y - this.ball.y) < 5) targetY += (p.baseY > 50 ? 6 : -6);

                    // ── MF HARD STOP: MUST stay BEHIND FWs! ──
                    const teammates = this.players.filter(q => q.teamId === p.teamId && q !== p);
                    const forwards = teammates.filter(q => q.position === 'FW');
                    if (forwards.length) {
                        const fwX = forwards.map(q => q.x);
                        const mfLimit = isHome
                            ? Math.max(Math.min(...fwX) - 10, 0)
                            : Math.min(Math.max(...fwX) + 10, 100);
                        targetX = isHome ? Math.min(targetX, mfLimit) : Math.max(targetX, mfLimit);
                    } else {
                        const mfMax = isHome ? 82 : 18;
                        targetX = isHome ? Math.min(targetX, mfMax) : Math.max(targetX, mfMax);
                    }

                    // MF X SPREAD: 공격진영에서는 MF를 X축으로도 퍼트려서 과포화 방지!
                    // (역할별 다른 X 깊이 유지: CM은 뒤, CAM/AM은 앞!)
                    const role = p.role || 'CM';
                    let depthShift = 0;
                    if (role.includes('AM') || role === 'CAM') depthShift = forwardDir * 5;
                    else if (role.includes('CM') || role === 'MEZ' || role === 'CAR') depthShift = forwardDir * 2;
                    else if (role.includes('DM') || role === 'CDM') depthShift = -forwardDir * 4;
                    else if (role.includes('WM') || role === 'LM' || role === 'RM') depthShift = forwardDir * 3;
                    targetX += depthShift;

                    moveSpeed = 0.38;

                    // NO DEFENDING MF PRESSING! Only press if HIGH intensity + high pressBias
                    const dt = gameData.deepTactics || {};
                    const pressOK = dt.pressIntensity === 'high' && behavior.pressBias > 0.5;
                    if (pressOK && this.ball.owner && this.ball.owner.teamId !== p.teamId) {
                        const dBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                        if (dBall < 15) { targetX = this.ball.x; targetY = this.ball.y; moveSpeed = 0.4; }
                    }

                } else if (p.position === 'DF') {
                    this._processAttackingDFMovement(p, isHome, forwardDir);
                    return;

                } else if (p.position === 'GK') {
                    targetX = p.baseX; targetY = clamp(50 + (this.ball.y - 50) * 0.05, 40, 60);
                }

                if (behavior.cutInside) targetY = 50 + (p.baseY - 50) * 0.5;
                else if (behavior.hugLine) targetY = p.baseY < 50 ? 5 : 95;

            } else {
                // ── DEFENSIVE OFF-BALL ──
                this._processDefensiveMovement(p, presser, isHomeDef, speedFactor, moveSpeed, behavior);
                return;
            }

            this._applyMovement(p, targetX, targetY, moveSpeed);
        });
    }

    _processAttackingFWMovement(p, isHome, forwardDir, speedFactor, behavior) {
        // Initialize run state
        if (!p.burstTimer) p.burstTimer = 0;
        if (!p.forceReturnTimer) p.forceReturnTimer = 0;
        if (p._runKind === undefined) p._runKind = 'neutral';   // 'burst','linkup','channel','neutral'
        if (p._runTimer === undefined) p._runTimer = 0;
        if (p._curvPhase === undefined) p._curvPhase = Math.random() * Math.PI * 2;

        const hasFriendlyBall = this.ball.owner && this.ball.owner.teamId === p.teamId;
        const ballOnSide = (this.ball.y < 40) ? 'left' : (this.ball.y > 60 ? 'right' : 'center');
        const offsideLimitX = this._calcOffsideLineX(isHome);

        // ---- 1) Return logic: SOFT return if ball EXTREMELY far behind, NO SNAP ----
        const ballFarBehind = isHome ? this.ball.x < p.x - 60 : this.ball.x > p.x + 60;
        if (p.forceReturnTimer > 0 || ballFarBehind) {
            if (p.forceReturnTimer > 0) p.forceReturnTimer--;
            p.burstTimer = 0;
            const safeX = this._getSafeReturnX(p, isHome);
            const pullSpeed = 0.5 * speedFactor; // VEEEERY slow pullback, smooth!
            this._pullBackFW(p, safeX, isHome, speedFactor, pullSpeed);
            return; // NO HARD CLAMP HERE -> let velocity move naturally!
        }

        // ---- 2) Decide run kind: opponent + position aware! ----
        if (p._runTimer <= 0 || p.burstTimer === 0) {
            // Only re-decide if timer expired
            p._curvPhase = Math.random() * Math.PI * 2;
            const isCentralFW = !behavior.hugLine;
            const nearestOpp = this.findNearestDefender(p);
            const oppDist = nearestOpp ? nearestOpp.dist : 999;

            // Find defensive line position (last defender x)
            const oppDf = this.players.filter(q => q.teamId !== p.teamId && q.position === 'DF');
            let defLineX;
            if (isHome) {
                defLineX = oppDf.length ? Math.min(...oppDf.map(q => q.x), 999) : 80;
            } else {
                defLineX = oppDf.length ? Math.max(...oppDf.map(q => q.x), -1) : 20;
            }
            const spaceBehindDefLine = isHome ? (offsideLimitX - defLineX > 10) : (defLineX - offsideLimitX > 10);

            // Decide!
            const roll = Math.random();
            if (behavior.runBehind && (spaceBehindDefLine || hasFriendlyBall) && roll < 0.45) {
                // (A) RUN IN BEHIND (스루패스 런)
                p._runKind = 'burst';
                p._runTimer = 40 + Math.floor(Math.random() * 20);
                p.burstTimer = p._runTimer;
            } else if (isCentralFW && oppDist < 8 && hasFriendlyBall && roll < 0.35) {
                // (B) DROP DEEP LINK-UP (수비수가 붙을 때 내려와서 패스 받기)
                p._runKind = 'linkup';
                p._runTimer = 28 + Math.floor(Math.random() * 15);
                p.burstTimer = 0;
            } else if (behavior.hugLine && roll < 0.40) {
                // (C) CHANNEL / CURVED WIDE RUN (커브드 런)
                p._runKind = 'channel';
                p._runTimer = 32 + Math.floor(Math.random() * 18);
                p.burstTimer = Math.floor(p._runTimer * 0.7);
            } else {
                // Default: drift position
                p._runKind = 'neutral';
                p._runTimer = 25;
                p.burstTimer = 0;
            }
        } else {
            p._runTimer--;
            if (p.burstTimer > 0) p.burstTimer--;
        }

        // ---- 3) Calculate targetX / targetY based on run kind! ----
        let targetX, targetY;
        let moveSpeed = 0.30 * speedFactor;
        const isCentralFW = !behavior.hugLine;

        // Defensive line reference
        const oppDf = this.players.filter(q => q.teamId !== p.teamId && q.position === 'DF');
        let defLineX;
        if (isHome) defLineX = oppDf.length ? Math.min(...oppDf.map(q => q.x)) : 80;
        else         defLineX = oppDf.length ? Math.max(...oppDf.map(q => q.x)) : 20;

        // ---- ABSOLUTE MINIMUM DEPTH: FWs NEVER go to defensive line! ----
        const ABS_FW_MIN_X = isHome ? 42 : 58; // No FW can go past midfield-ish!

        if (p._runKind === 'burst') {
            // RUN BEHIND defense line right before offside!
            targetX = isHome
                ? clamp(Math.max(defLineX + 8, this.ball.x + 20, ABS_FW_MIN_X), ABS_FW_MIN_X, offsideLimitX - 1)
                : clamp(Math.min(defLineX - 8, this.ball.x - 20, ABS_FW_MIN_X), offsideLimitX + 1, ABS_FW_MIN_X);
            const curv = Math.sin(p._curvPhase + (p._runTimer * 0.15)) * (isCentralFW ? 10 : 6);
            targetY = clamp(p.baseY + curv + (this.ball.y - 50) * 0.2, 
                p.baseY - (isCentralFW ? 18 : 5), 
                p.baseY + (isCentralFW ? 18 : 5));
            moveSpeed = 0.60 * speedFactor;
        } else if (p._runKind === 'linkup') {
            // DROP DEEP linkup: BUT NOT TOO DEEP! Cap at ABS_FW_MIN_X + 5!
            const maxDropX = isHome ? (ABS_FW_MIN_X + 5) : (ABS_FW_MIN_X - 5);
            const linkupX = isHome
                ? clamp(Math.max(this.ball.x + 4, defLineX - 18), ABS_FW_MIN_X, 95)
                : clamp(Math.min(this.ball.x - 4, defLineX + 18), 5, ABS_FW_MIN_X);
            // Hard cap to prevent dropping into defense!
            targetX = isHome ? Math.max(linkupX, maxDropX) : Math.min(linkupX, maxDropX);
            targetY = clamp(p.baseY * 0.3 + this.ball.y * 0.7, 
                p.baseY - 15, p.baseY + 15);
            moveSpeed = 0.42 * speedFactor;
        } else if (p._runKind === 'channel') {
            // CURVED WIDE RUN - never drop below min!
            const aheadDist = 22 + Math.random() * 10;
            targetX = isHome
                ? clamp(Math.max(this.ball.x + aheadDist, ABS_FW_MIN_X), ABS_FW_MIN_X, offsideLimitX - 1)
                : clamp(Math.min(this.ball.x - aheadDist, ABS_FW_MIN_X), offsideLimitX + 1, ABS_FW_MIN_X);
            const wideCurve = behavior.hugLine
                ? (p.baseY < 50 ? 6 : 94)
                : 50 + (p.baseY - 50) * 1.4;
            const channelMix = 0.5 + Math.sin(p._curvPhase + p._runTimer*0.08) * 0.4;
            targetY = clamp(p.baseY * (1 - channelMix) + wideCurve * channelMix, 4, 96);
            moveSpeed = 0.50 * speedFactor;
        } else {
            // Neutral: intelligent drift - STAY HIGH!
            const baseAheadX = this.ball.x + forwardDir * 18;
            const nearOpp = this.findNearestDefender(p);
            const oppNearby = nearOpp && nearOpp.dist < 7;
            let yOffset = 0;
            if (oppNearby) {
                yOffset = (p.y < nearOpp.player.y) ? -8 : 8;
            }
            const ballSidePull = behavior.hugLine ? 0 : (this.ball.y - 50) * 0.3;
            targetX = isHome 
                ? Math.max(baseAheadX, ABS_FW_MIN_X + 8)  // Stay ahead!
                : Math.min(baseAheadX, ABS_FW_MIN_X - 8);
            targetY = clamp(p.baseY + ballSidePull + yOffset,
                p.baseY - (isCentralFW ? 16 : 5),
                p.baseY + (isCentralFW ? 16 : 5));
            moveSpeed = 0.32 * speedFactor;
        }

        // Winger hug-line override when in final third
        if (behavior.hugLine && ((isHome && targetX > 75) || (!isHome && targetX < 25))) {
            targetY = p.baseY < 50 ? 7 : 93;
        }

        // Offside line - soft! Don't snap!
        if (isHome) targetX = Math.min(targetX, offsideLimitX - 1);
        else        targetX = Math.max(targetX, offsideLimitX + 1);

        // Ball-carrier check: if this FW is already really high & ball is still far, don't keep running
        if (Math.abs(p.x - targetX) < 3) moveSpeed *= 0.5;

        // ---- 4) Apply SMOOTH movement - NO HARD SNAP! ----
        // We don't do the post-clamp that kills velocity! Let physics work!
        this._applyMovement(p, targetX, targetY, moveSpeed);

        // Also don't reset velocity to 0 artificially! Let them glide naturally!
    }

    _processAttackingDFMovement(p, isHome, forwardDir) {
        const dt          = gameData.deepTactics || {};
        const lineTactic  = dt.defensiveLine || 'standard';
        let   safetyDist  = lineTactic === 'high' ? 10 : lineTactic === 'deep' ? 20 : 15;
        const isCB        = ['CD','BPD','NCB'].includes(p.role);
        const isFullback  = ['FB','WB','CWB','IWB'].includes(p.role);
        const ballX       = this.ball.x;
        const inAttackingThird = isHome ? ballX > 65 : ballX < 35;
        const ballSide = (this.ball.y < 45) ? 'left' : (this.ball.y > 55 ? 'right' : 'center');
        const ourSide = (p.baseY < 50) ? 'left' : 'right';
        const sameSide = ballSide === ourSide || ballSide === 'center';
        const hasFriendlyBall = this.ball.owner && this.ball.owner.teamId === p.teamId;

        // ---- 1) Initialize state variables ----
        if (p._fbRunKind === undefined) p._fbRunKind = 'hold';
        if (p._fbRunTimer === undefined) p._fbRunTimer = 0;
        if (p._fbCurvPhase === undefined) p._fbCurvPhase = Math.random() * Math.PI * 2;
        if (p._fbRunTimer > 0) p._fbRunTimer--;

        // ---- 2) Center Backs: stay central, shape-based ----
        if (isCB) {
            let targetX;
            if (isHome) targetX = clamp(Math.max(p.baseX, ballX - safetyDist), 0, 88);
            else        targetX = clamp(Math.min(p.baseX, ballX + safetyDist), 12, 100);
            const targetY = clamp(p.baseY * 0.7 + 50 * 0.3, 22, 78);
            this._applyMovement(p, targetX, targetY, 0.28);
            return;
        }

        // ---- 3) Fullbacks: DIVERSE RUNS ----
        if (isFullback) {
            // Decide run type when timer expired
            if (p._fbRunTimer <= 0) {
                p._fbCurvPhase = Math.random() * Math.PI * 2;
                const IWB_Prob = ['IWB','CWB','WB'].includes(p.role) ? 0.50 : 0.15;
                const overlapProb = 0.35;
                const underlapProb = IWB_Prob;
                const roll = Math.random();
                if (inAttackingThird && sameSide && hasFriendlyBall && roll < overlapProb) {
                    p._fbRunKind = 'overlap';   // OVERLAP: go wide & past winger
                    p._fbRunTimer = 36;
                } else if (inAttackingThird && roll < overlapProb + underlapProb) {
                    p._fbRunKind = 'underlap';  // UNDERLAP (IWB): cut inside to half-space
                    p._fbRunTimer = 32;
                } else {
                    p._fbRunKind = 'hold';      // HOLD: stay wide & high but not overcommit
                    p._fbRunTimer = 22;
                }
            }

            let targetX, targetY, moveSpeed = 0.32;

            // Pull to wide reference
            const wideRefY = p.baseY < 50 ? 6 : 94;

            if (p._fbRunKind === 'overlap') {
                // OVERLAP: sprint way up the touchline, PAST the forward/winger line!
                const overlapX = isHome
                    ? clamp(ballX + 20, 55, 95)
                    : clamp(ballX - 20, 5, 45);
                targetX = overlapX;
                // Curve slightly around players (not straight line!)
                const wave = Math.sin(p._fbCurvPhase + p._fbRunTimer * 0.12) * 2;
                targetY = clamp(p.baseY * 0.2 + wideRefY * 0.8 + wave, 4, 96);
                moveSpeed = 0.52;
            } else if (p._fbRunKind === 'underlap') {
                // UNDERLAP (inverted fullback): run INSIDE to the half-space / inside channel
                const underlapX = isHome
                    ? clamp(ballX + 12, 50, 90)
                    : clamp(ballX - 12, 10, 50);
                targetX = underlapX;
                // Pull Y inward (half-space: ~20% in from touchline towards center)
                const halfSpaceY = p.baseY < 50 ? 28 : 72;
                const curv = Math.sin(p._fbCurvPhase + p._fbRunTimer * 0.1) * 3;
                targetY = clamp(p.baseY * 0.55 + halfSpaceY * 0.45 + curv, 18, 82);
                moveSpeed = 0.44;
            } else {
                // HOLD POSITION: standard wide supporting position
                const holdX = isHome
                    ? clamp(Math.max(p.baseX, ballX - safetyDist + 3), 0, 85)
                    : clamp(Math.min(p.baseX, ballX + safetyDist - 3), 15, 100);
                targetX = holdX;
                targetY = clamp(p.baseY * 0.85 + wideRefY * 0.15, p.baseY - 5, p.baseY + 5);
                moveSpeed = 0.30;
            }

            // Safety: if opposition counter-attacking, drop back FAST
            if (!hasFriendlyBall && (isHome ? ballX < 40 : ballX > 60)) {
                targetX = isHome ? Math.min(targetX, 60) : Math.max(targetX, 40);
                moveSpeed = 0.40;
            }

            this._applyMovement(p, targetX, targetY, moveSpeed);
            return;
        }

        // Fallback (other DF roles)
        const fallbackX = isHome
            ? clamp(Math.max(p.baseX, ballX - safetyDist), 0, 85)
            : clamp(Math.min(p.baseX, ballX + safetyDist), 15, 100);
        this._applyMovement(p, fallbackX, p.baseY, 0.30);
    }

    _processDefensiveMovement(p, presser, isHomeDef, speedFactor, moveSpeed, behavior) {
        const isHome = p.teamId === 'home';
        const dt     = gameData.deepTactics || {};
        const isSpecial = !!this.pendingShot;
        const pressIntensity = dt.pressIntensity || 'mid';
        const inOwnThird = isHome ? this.ball.x < 33 : this.ball.x > 67;
        const inOwnHalf  = isHome ? this.ball.x < 50 : this.ball.x > 50;
        const hasOppBall = this.ball.owner && this.ball.owner.teamId !== p.teamId;
        const dBall = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);

        // ------------ FW DEFENSE: SMOOTH drop-back, NEVER DROP TO DEFENSE! ------------
        if (p.position === 'FW') {
            p.burstTimer = 0;
            const ABS_FLOOR_HOME = 50;  // FWs 절대 50 아래(home)로 내려가지 않음!
            const ABS_FLOOR_AWAY = 50;  // FWs 절대 50 위(away)로 내려가지 않음!
            const HALFLINE_HOME = 56;
            const HALFLINE_AWAY = 44;
            const halflineTarget = isHome ? HALFLINE_HOME : HALFLINE_AWAY;

            const targetY = p.baseY;
            let targetX = halflineTarget;

            // If opposition pressing low, FWs can stay HIGHER for counter
            if (pressIntensity === 'high' && inOwnThird) {
                targetX = isHome ? 58 : 42; // Stay HIGHER for transition!
            }
            // ABSOLUTE FLOOR!
            targetX = isHome ? Math.max(targetX, ABS_FLOOR_HOME) : Math.min(targetX, ABS_FLOOR_AWAY);

            const retSpeed = 0.55 * speedFactor;
            this._applyMovement(p, targetX, targetY, retSpeed);

            // POST-CLAMP: ABS FLOOR ENFORCED!
            if (isHome) {
                p.x = Math.max(p.x, ABS_FLOOR_HOME);
                p.x = Math.min(p.x, 65);
            } else {
                p.x = Math.min(p.x, ABS_FLOOR_AWAY);
                p.x = Math.max(p.x, 35);
            }
            return;
        }

        // ------------ MF DEFENSE: Smart zone + selective pressing ------------
        if (p.position === 'MF') {
            const shiftF = clamp(0.9 - (behavior.attackBias||0)*0.1, 0.6, 1.1);
            const refBallX = isSpecial ? 50 : clamp(this.ball.x, 20, 80);
            const baseFormX = p.baseX + (refBallX - 50) * shiftF;
            const baseFormY = p.baseY + (this.ball.y - 50) * 0.25;

            // SMART pressing probability!
            let stepProb = 0;
            if (p === presser) stepProb = 1.0;
            else if (pressIntensity === 'high' && inOwnHalf) stepProb = behavior.pressBias > 0.3 ? 0.55 : 0.25;
            else if (pressIntensity === 'mid' && inOwnHalf && dBall < 15) stepProb = 0.25;
            else if (pressIntensity === 'low') stepProb = 0.05;

            const shouldStep = Math.random() < stepProb && hasOppBall;

            if (shouldStep && dBall < 28) {
                this._stepTowardBall(p, speedFactor, presser);
            } else {
                // ZONE HOLD: return to formation smoothly!
                let finalX = baseFormX;
                let finalY = baseFormY;

                // If opponent dribbler nearby, shift laterally (not forward!)
                if (hasOppBall && dBall < 20 && this.ball.owner) {
                    const dribbler = this.ball.owner;
                    const lateralPull = (dribbler.y - p.y) * 0.5;
                    finalY = clamp(baseFormY + lateralPull, p.baseY - 18, p.baseY + 18);
                }

                const distFromFormation = Math.hypot(p.x - baseFormX, p.y - baseFormY);
                const retSpeed = distFromFormation > 18 ? 0.38 : 0.30;
                this._applyMovement(p, finalX, finalY, retSpeed);
            }
            return;
        }

        // ------------ DF DEFENSE: Smart marking aggro + smooth formation return ------------
        if (p.position === 'DF') {
            const lineTactic = dt.defensiveLine || 'standard';
            const lineOffset = lineTactic === 'high' ? -10 : lineTactic === 'deep' ? 10 : 0;
            const refBallX   = isSpecial ? 50 : clamp(this.ball.x, 30, 70);
            const shiftF     = 0.80;
            let   formationX = p.baseX + (refBallX - 50) * shiftF + lineOffset * (isHome ? -1 : 1);
            let   formationY = p.baseY + (this.ball.y - 50) * 0.05;

            const isCB = ['CD','BPD','NCB'].includes(p.role);
            const isFullback = ['FB','WB','CWB','IWB'].includes(p.role);

            if (isFullback) {
                const widePull = p.baseY < 50 ? 10 : 90;
                formationY = clamp(p.baseY * 0.85 + widePull * 0.15, p.baseY - 7, p.baseY + 7);
            }

            // Role-based marking assignment
            let markTarget = null;
            if (!isSpecial) {
                const alreadyMarked = new Set(
                    this.players
                        .filter(a => a.teamId === p.teamId && a !== p && typeof a._markTargetId === 'string')
                        .map(a => a._markTargetId)
                );
                let minM = 999;
                this.players.forEach(opp => {
                    if (opp.teamId !== p.teamId && opp.position !== 'GK') {
                        if (alreadyMarked.has(opp.id)) return;
                        if (isCB) {
                            const ob = this.getRoleBehavior(opp.role);
                            if (ob.hugLine || opp.y < 20 || opp.y > 80) return;
                        }
                        if (isFullback) {
                            const ob = this.getRoleBehavior(opp.role);
                            if (!ob.hugLine && opp.y >= 20 && opp.y <= 80) return;
                            if (p.baseY < 50 && opp.y > 55) return;
                            if (p.baseY > 50 && opp.y < 45) return;
                        }
                        const d = Math.hypot(p.x - opp.x, p.y - opp.y);
                        const inDanger = inOwnThird || (inOwnHalf && opp !== this.ball.owner);
                        if (inDanger && d < minM) { minM = d; markTarget = opp; }
                    }
                });
                p._markTargetId = markTarget ? markTarget.id : null;
            }

            // ------------ DEFENDER AGGRO DECISION ------------
            // CBs: only step if ball inches away in final third; FBs: only step vs wide dribbler on our side
            let aggroProb = 0;
            if (p === presser) aggroProb = 1.0;
            else if (isCB && inOwnThird && dBall < 10) aggroProb = 0.45;
            else if (isFullback && hasOppBall && this.ball.owner) {
                const dribbler = this.ball.owner;
                const dribblerIsWide = dribbler.y < 28 || dribbler.y > 72;
                const sameSide = (p.baseY < 50 && dribbler.y < 45) || (p.baseY > 50 && dribbler.y > 55);
                if (inOwnThird && dribblerIsWide && sameSide) aggroProb = 0.85;
                else if (inOwnHalf && sameSide && dBall < 14) aggroProb = 0.55;
            }
            const shouldStepToBall = Math.random() < aggroProb && hasOppBall;

            // 1) Step to ball (AGRO)
            if (shouldStepToBall && dBall < 25 && !isSpecial) {
                this._stepTowardBall(p, speedFactor, presser);
                return;
            }

            // 2) Mark opponent
            if (markTarget) {
                const gX     = isHome ? 0 : 100;
                const markX  = markTarget.x + (gX - markTarget.x) * 0.20;
                const isPen  = isHome ? markX < formationX : markX > formationX;
                const finalX = isPen
                    ? markX * 0.90 + formationX * 0.10
                    : markX * 0.35 + formationX * 0.65;

                let finalY = markTarget.y;
                if (isFullback) {
                    const widePull = p.baseY < 50 ? 12 : 88;
                    finalY = clamp(markTarget.y * 0.50 + widePull * 0.50, p.baseY - 10, p.baseY + 10);
                } else if (isCB) {
                    finalY = clamp(markTarget.y * 0.85 + 50 * 0.15, 22, 78);
                }
                const markSpeed = (p === presser) ? 0.40 : 0.34;
                this._applyMovement(p, finalX, finalY, markSpeed);
                return;
            }

            // 3) Beaten recovery: smooth return to formation (not snap!)
            const beaten = isHome ? this.ball.x < p.x - 3 : this.ball.x > p.x + 3;
            if (beaten && !isSpecial && inOwnHalf) {
                const rX = formationX;
                const rY = formationY;
                const dx = rX - p.x, dy = rY - p.y;
                const d  = Math.hypot(dx, dy);
                if (d > 0) { p.x += (dx/d)*1.8*speedFactor; p.y += (dy/d)*1.8*speedFactor; }
                return;
            }

            // 4) Smooth formation hold
            const distFromSpot = Math.hypot(p.x - formationX, p.y - formationY);
            const retSpeed = distFromSpot > 15 ? 0.34 : 0.26;
            this._applyMovement(p, formationX, formationY, retSpeed);
            return;
        }

        // GK
        if (p.position === 'GK') {
            const gX = isHome ? 5 : 95;
            this._applyMovement(p, gX, clamp(50 + (this.ball.y - 50) * 0.08, 38, 62), 0.22);
        }
    }

    _stepTowardBall(p, speedFactor, presser) {
        const isHome = p.teamId === 'home';
        const iX = this.ball.x * 0.9 + (isHome ? 0 : 100) * 0.1;
        const dx = iX - p.x, dy = (this.ball.y * 0.9 + 50 * 0.1) - p.y;
        const d  = Math.hypot(dx, dy);
        const sS = 2.3 * speedFactor;
        if (d > 0) { p.x += (dx/d)*sS; p.y += (dy/d)*sS; }

        const dB = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
        const tC = dB < 2 ? 0.2 : dB < 5 ? 0.1 : 0.05;
        if (dB < 5 && p._stealCooldown === 0 && Math.random() < tC) {
            this.attemptTackle(p, this.ball.owner);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4.21  MOVEMENT HELPERS
    // ─────────────────────────────────────────────────────────────
    _applyMovement(p, targetX, targetY, moveSpeed) {
        const isHome = p.teamId === 'home';

        // ============= 1) STRICT POSITION X BANDS (NON OVERLAPPING!) =============
        // 절대 넘어갈 수 없는 위치 밴드!
        let BAND_MIN_X, BAND_MAX_X;
        switch(p.position) {
            case 'GK':
                BAND_MIN_X = isHome ? 2 : 90;
                BAND_MAX_X = isHome ? 10 : 98;
                break;
            case 'DF': {
                const isFB = ['FB','WB','CWB','IWB'].includes(p.role);
                if (isFB) {
                    // Fullbacks can go slightly higher than CBs
                    BAND_MIN_X = isHome ? 10 : 5;
                    BAND_MAX_X = isHome ? 90 : 90;
                } else {
                    // Center backs: never past midfield much
                    BAND_MIN_X = isHome ? 5 : 10;
                    BAND_MAX_X = isHome ? 85 : 95;
                }
                break;
            }
            case 'MF':
                // MIDFIELD BAND: Strict! Never too high, never too low!
                BAND_MIN_X = isHome ? 35 : 15;
                BAND_MAX_X = isHome ? 85 : 65;
                break;
            case 'FW':
                // FORWARDS BAND: Never into defense!
                BAND_MIN_X = isHome ? 48 : 35;
                BAND_MAX_X = isHome ? 98 : 52;
                break;
            default:
                BAND_MIN_X = 2; BAND_MAX_X = 98;
        }
        // Clamp targetX FIRST to position band!
        targetX = clamp(targetX, BAND_MIN_X, BAND_MAX_X);

        const isCB = ['CD','BPD','NCB'].includes(p.role);
        if (isCB && p.position === 'DF') {
            const otherCBs = this.players.filter(q =>
                q.teamId === p.teamId && q !== p &&
                ['CD','BPD','NCB'].includes(q.role) && q.position === 'DF'
            );
            for (const cb2 of otherCBs) {
                const CB_GAP_MIN = 7;  // Minimum gap ↑
                const CB_GAP_MAX = 16; // Max gap ↑ a bit
                const dy  = targetY - cb2.y;
                const abs = Math.abs(dy);
                const dir = dy >= 0 ? 1 : -1;
                if (abs < CB_GAP_MIN) targetY = cb2.y + dir * CB_GAP_MIN;
                else if (abs > CB_GAP_MAX) targetY = cb2.y + dir * CB_GAP_MAX;
            }
        } else if (p.position === 'DF') {
            const allDF = this.players.filter(q => q.teamId === p.teamId && q !== p && q.position === 'DF');
            for (const tm of allDF) {
                const dy  = targetY - tm.y;
                const abs = Math.abs(dy);
                const dir = dy >= 0 ? 1 : -1;
                if (abs < 3.0) targetY = tm.y + dir * 3.0; // Gap ↑ to 3
            }
        }

        // ============= 2) STRONGER SAME-POSITION Y SEPARATION (PREVENT MIDFIELD CROWDING!) =============
        const samePos = this.players.filter(q =>
            q.teamId === p.teamId && q !== p && q.position === p.position
        );
        // Minimum Y gap: MFs need the MOST space (중원 과포화 방지!)
        let MIN_Y_GAP_SAME_POS = 3.5;
        if (p.position === 'MF') MIN_Y_GAP_SAME_POS = 9;   // MF: 매우 큰 최소 갭! (중원 몰림 방지!)
        else if (p.position === 'FW') MIN_Y_GAP_SAME_POS = 7;
        else if (p.position === 'DF') MIN_Y_GAP_SAME_POS = 4;
        for (const tm of samePos) {
            const dy  = targetY - tm.y;
            const abs = Math.abs(dy);
            const dir = dy >= 0 ? 1 : -1;
            if (abs < MIN_Y_GAP_SAME_POS) {
                targetY = tm.y + dir * MIN_Y_GAP_SAME_POS;
            }
        }

        // ============= 3) COLLISION AVOIDANCE (BIGGER RADIUS + Y PREFERENCE) =============
        const allTM = this.players.filter(q => q.teamId === p.teamId && q !== p);
        const COLLIDE_RADIUS = 6.5;  // 5 → 6.5, 더 큰 충돌 반경!
        for (const tm of allTM) {
            const d = Math.hypot(targetX - tm.x, targetY - tm.y);
            if (d < COLLIDE_RADIUS) {
                const gapNeed = COLLIDE_RADIUS - d;
                const a = Math.atan2(targetY - tm.y, targetX - tm.x);
                // Y separation priority, smaller X separation
                targetX += Math.cos(a) * gapNeed * 0.35;  // X 분리 작게
                targetY += Math.sin(a) * gapNeed * 1.2;   // Y 분리 크게 → 옆으로 퍼지게!
            }
        }

        // ============= 4) FINAL OFFSIDE PRE-CLAMP (FORWARDS) =============
        if (p.position === 'FW') {
            const limit = this._calcOffsideLineX(isHome);
            const offside = isHome ? targetX > limit : targetX < limit;
            if (offside) {
                targetX = isHome ? (limit - 1.5) : (limit + 1.5);
            }
        }

        targetX = clamp(targetX, BAND_MIN_X, BAND_MAX_X);
        targetY = clamp(targetY, 2, 98);

        // SMOOTH movement
        const aX = (targetX - p.x) * moveSpeed * 0.1;
        const aY = (targetY - p.y) * moveSpeed * 0.1;
        p.vx = (p.vx + aX) * 0.78;
        p.vy = (p.vy + aY) * 0.78;
        p.x += p.vx;
        p.y += p.vy;

        // FINAL POST CLAMP - NEVER escape the band! (soft, to keep some momentum)
        if (p.x < BAND_MIN_X) { p.x = BAND_MIN_X; if (p.vx < 0) p.vx *= 0.2; }
        if (p.x > BAND_MAX_X) { p.x = BAND_MAX_X; if (p.vx > 0) p.vx *= 0.2; }
        p.y = clamp(p.y, 2, 98);
    }

    _getSafeReturnX(p, isHome) {
        // FW return: NEVER let them drop to defensive line!
        const HALFLINE_HOME = 55;  // Even higher minimum return x!
        const HALFLINE_AWAY = 45;
        // ABSOLUTE FLOOR - FWs can never go lower than this!
        const ABS_FLOOR_HOME = 48;
        const ABS_FLOOR_AWAY = 52;

        const ourTeam = this.players.filter(q => q.teamId === p.teamId && q !== p);
        if (isHome) {
            const sorted = ourTeam.map(q => q.x).sort((a, b) => a - b);
            const teamRef = sorted[1] ?? sorted[0] ?? 50;
            const val = Math.min(teamRef, p.baseX, HALFLINE_HOME);
            return Math.max(val, ABS_FLOOR_HOME); // NEVER below ABS_FLOOR!
        } else {
            const sorted = ourTeam.map(q => q.x).sort((a, b) => b - a);
            const teamRef = sorted[1] ?? sorted[0] ?? 50;
            const val = Math.max(teamRef, p.baseX, HALFLINE_AWAY);
            return Math.min(val, ABS_FLOOR_AWAY); // NEVER above ABS_FLOOR!
        }
    }

    _pullBackFW(p, safeX, isHome, speedFactor, moveSpeed) {
        // SMOOTH pullback! NEVER let go below absolute floor!
        const ABS_FLOOR_HOME = 48;
        const ABS_FLOOR_AWAY = 52;
        const finalSafeX = isHome ? Math.max(safeX, ABS_FLOOR_HOME) : Math.min(safeX, ABS_FLOOR_AWAY);
        this._applyMovement(p, finalSafeX, p.baseY, moveSpeed * 1.1);
    }

    _enforceOffsideLine(player, isHomeFW) {
        const limit   = this._calcOffsideLineX(isHomeFW);
        const offside = isHomeFW ? player.x > limit : player.x < limit;
        if (offside) {
            // SMOOTH offside correction: NO hard player.x set, NO kill velocity!
            // Add small velocity pullback instead of instant teleport
            const pullAmt = 0.6;
            const target = isHomeFW ? (limit - 1.5) : (limit + 1.5);
            const diff = target - player.x;
            player.vx = (player.vx * 0.4) + (diff * 0.25); // Gradual correction, glide back
        }
        return limit;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.22  DEFENSIVE LINE ADJUSTMENT
    // ─────────────────────────────────────────────────────────────
    adjustDefensiveLines() {
        // Line shift is applied in _processDefensiveMovement/formationX calc above.
    }

    // ─────────────────────────────────────────────────────────────
    // 4.23  OFFSIDE HELPERS
    // ─────────────────────────────────────────────────────────────
    _calcOffsideLineX(isHomeFW) {
        const defendingTeamId = isHomeFW ? 'away' : 'home';
        const defenders = this.players.filter(q => q.teamId === defendingTeamId);
        if (isHomeFW) {
            const sorted = defenders.map(q => q.x).sort((a, b) => a - b);
            return Math.min(sorted[1] ?? sorted[0] ?? 90, 88);
        } else {
            const sorted = defenders.map(q => q.x).sort((a, b) => b - a);
            return Math.max(sorted[1] ?? sorted[0] ?? 10, 12);
        }
    }

    _enforceOffsideLine(player, isHomeFW) {
        const limit   = this._calcOffsideLineX(isHomeFW);
        const offside = isHomeFW ? player.x > limit : player.x < limit;
        if (offside) {
            player.x  = isHomeFW ? Math.min(player.x, limit - 1) : Math.max(player.x, limit + 1);
            player.vx *= 0.1;
        }
        return limit;
    }

    applyOffsideCheck(targetPos, player) {
        const oppTeamId = player.teamId === 'home' ? 'away' : 'home';
        const opponents = this.players.filter(p => p.teamId === oppTeamId);
        if (player.teamId === 'home') {
            opponents.sort((a, b) => b.x - a.x);
            if (opponents.length < 2) return targetPos;
            const limitX = Math.max(opponents[1].x, this.ball.x);
            if (targetPos.x > limitX) targetPos.x = limitX - 2;
        } else {
            opponents.sort((a, b) => a.x - b.x);
            if (opponents.length < 2) return targetPos;
            const limitX = Math.min(opponents[1].x, this.ball.x);
            if (targetPos.x < limitX) targetPos.x = limitX + 2;
        }
        return targetPos;
    }

    // ─────────────────────────────────────────────────────────────
    // 4.24  MISC HELPERS
    // ─────────────────────────────────────────────────────────────
    checkFrontalBlock(player, goalX) {
        const fwd = player.teamId === 'home' ? 1 : -1;
        const checkDist = 8, checkWidth = 4;
        const minY = player.y - checkWidth, maxY = player.y + checkWidth;
        const minX = fwd === 1 ? player.x          : player.x - checkDist;
        const maxX = fwd === 1 ? player.x + checkDist : player.x;
        return this.players.some(opp =>
            opp.teamId !== player.teamId &&
            opp.x >= minX && opp.x <= maxX &&
            opp.y >= minY && opp.y <= maxY
        );
    }

    findBestPassTarget(player, mode = 'aggressive') {
        const gameState = mode === 'safe' ? 'buildup' : this._getGameState(player.teamId);
        const teammates = this.players.filter(p => p.teamId === player.teamId && p !== player);
        if (!teammates.length) return null;
        return teammates
            .map(tm => ({ tm, score: this._scorePassOption(player, tm, gameState) * (mode === 'safe' ? -1 : 1) }))
            .sort((a, b) => b.score - a.score)[0].tm;
    }

    findNearestDefender(attacker) {
        let nearest = null, minD = 999;
        this.players.forEach(p => {
            if (p.teamId !== attacker.teamId) {
                const d = Math.hypot(p.x - attacker.x, p.y - attacker.y);
                if (d < minD) { minD = d; nearest = p; }
            }
        });
        return nearest ? { player: nearest, dist: minD } : null;
    }

    attemptTackle(defender, attacker) {
        if (!attacker) return false;
        if (defender._stealCooldown > 0) return false;

        const defStat  = this.getEffectiveStat(defender, 'defense');
        const atkStat  = this.getEffectiveStat(attacker,  'decision');
        const atkSpeed = this.getEffectiveStat(attacker,  'speed');
        const speedBonus = (atkSpeed / 100) * 30;

        if (defStat * Math.random() > (atkStat + speedBonus) * Math.random()) {
            this.ball.owner = defender;
            this.ball.lastOwner = null;
            defender._stealCooldown = 20;
            this.eventsQueue.push({ type:'tackle', player: defender.name,
                desc:`${defender.name}의 태클 성공!` });
            this._triggerTurnoverRecovery(attacker.teamId);
            return true;
        }
        return false;
    }

    getRoleBehavior(role) {
        const behaviors = {
            AF:  { runBehind:true,  shootBias:0.2, dribbleBias:0.1 },
            P:   { runBehind:true,  shootBias:0.3, passBias:-0.2 },
            DLF: { comeShort:true,  passBias:0.1 },
            F9:  { comeShort:true,  dribbleBias:0.1, passBias:0.1 },
            TM:  { comeShort:true,  holdUp:true },
            CF:  { comeShort:true,  shootBias:0.1 },
            W:   { hugLine:true,    dribbleBias:0.2, crossBias:0.2 },
            IF:  { cutInside:true,  shootBias:0.1, dribbleBias:0.2 },
            IW:  { cutInside:true,  dribbleBias:0.15 },
            WP:  { hugLine:true,    passBias:0.1 },
            PF:  { runBehind:true,  pressBias:0.3 },
            BBM: { pressBias:0.1,   attackBias:0.3, defenseBias:0.3 },
            MEZ: { cutInside:true,  attackBias:0.5, defenseBias:0.1 },
            DLP: { comeShort:true,  passBias:0.3, defenseBias:0.4 },
            AP:  { comeShort:true,  passBias:0.2, dribbleBias:0.1, attackBias:0.4, defenseBias:0.1 },
            BWM: { pressBias:0.3,   passBias:-0.1, defenseBias:0.5 },
            REG: { passBias:0.4,    defenseBias:0.3 },
            CAR: { comeShort:true,  defenseBias:0.4 },
            EG:  { comeShort:true,  attackBias:0.3 },
            SS:  { runBehind:true,  attackBias:0.6 },
            ANC: { defenseBias:0.6 },
            DM:  { defenseBias:0.5 },
            SV:  { runBehind:true,  attackBias:0.4, defenseBias:0.3 },
            BPD: { passBias:0.1 },
            CD:  { passBias:-0.1 },
            NCB: { passBias:-0.3 },
            WB:  { hugLine:true, overlap:true, dribbleBias:0.1 },
            CWB: { hugLine:true, overlap:true, dribbleBias:0.15 },
            FB:  { overlap:false },
            IWB: { cutInside:true },
            LIB: { passBias:0.1, defenseBias:0.2 },
            GK:  {}
        };
        return behaviors[role] || {};
    }

    getDefensiveLineX(opposingTeamId) {
        const rel = this.players.filter(p => p.teamId === opposingTeamId && p.position !== 'GK');
        const xs  = rel.map(p => p.x);
        if (!xs.length) return opposingTeamId === 'away' ? 80 : 20;
        return opposingTeamId === 'away' ? Math.min(...xs) : Math.max(...xs);
    }

    calcOffBallTarget(player, runType, roleStats) {
        const isHome     = player.teamId === 'home';
        const forwardDir = isHome ? 1 : -1;
        const attackBonus = (roleStats.attack || 0) * 10;
        switch (runType) {
            case RUN_TYPE.STRIKER_RUN: {
                const defLineX = this.getDefensiveLineX(isHome ? 'away' : 'home');
                return { x: defLineX + forwardDir * (5 + attackBonus), y: this.ball.y + (Math.random() - 0.5) * 20 };
            }
            case RUN_TYPE.SUPPORT_RUN:
                return { x: this.ball.x - forwardDir * 10, y: this.ball.y + (player.baseY < 50 ? -10 : 10) };
            case RUN_TYPE.CHANNEL_RUN: {
                const defLineX = this.getDefensiveLineX(isHome ? 'away' : 'home');
                return { x: defLineX + forwardDir * 2, y: this.ball.y < 50 ? 70 : 30 };
            }
            case RUN_TYPE.WIDE_RUN:
                return { x: this.ball.x + forwardDir * 5, y: player.baseY < 50 ? 5 : 95 };
            case RUN_TYPE.UNDERLAP_RUN: {
                const defLineX = this.getDefensiveLineX(isHome ? 'away' : 'home');
                return { x: defLineX + forwardDir * 5, y: player.baseY < 50 ? 30 : 70 };
            }
            default:
                return { x: player.baseX + (this.ball.x - player.baseX) * 0.2,
                         y: player.baseY + (this.ball.y - player.baseY) * 0.2 };
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 4.25  CELEBRATION & POST-MATCH
    // ─────────────────────────────────────────────────────────────
    processCelebrationMovement() {
        if (!this.celebrationActor || !this.celebrationTarget) return;
        const p  = this.celebrationActor;
        const tg = this.celebrationTarget;
        const dx = tg.x - p.x, dy = tg.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) { const s = 1.2; p.x += (dx/dist)*s; p.y += (dy/dist)*s; }
        if (this.celebrationType === 'quick_restart') { this.ball.x = p.x; this.ball.y = p.y; }
        this.players.forEach(tm => {
            if (tm.teamId !== p.teamId || tm === p) return;
            if (this.celebrationType === 'celebrate') {
                const ddx = p.x - tm.x, ddy = p.y - tm.y, d = Math.hypot(ddx, ddy);
                if (d > 3) { tm.x += (ddx/d)*0.9; tm.y += (ddy/d)*0.9; }
            } else {
                const ddx = tm.baseX - tm.x, ddy = tm.baseY - tm.y, d = Math.hypot(ddx, ddy);
                if (d > 1) { tm.x += (ddx/d)*1.0; tm.y += (ddy/d)*1.0; }
            }
        });
    }

    startExitAnimation(winnerId = null) {
        this.winningTeamId = winnerId;
        this.lapAngle = 0;
        if (winnerId === 'home') {
            this.postMatchPhase = 1;
            this.players.filter(p => p.teamId === 'home').forEach((p, i) => {
                p.lapOrder     = i * 0.2;
                p.radiusNoise  = (Math.random() - 0.5) * 6;
                const startA   = Math.PI / 2 + p.lapOrder;
                p.exitTargetX  = 50 + Math.cos(startA) * (35 + p.radiusNoise);
                p.exitTargetY  = 50 + Math.sin(startA) * (30 + p.radiusNoise);
            });
            this.players.filter(p => p.teamId !== 'home').forEach(p => {
                p.exitTargetX = 50 + (Math.random() - 0.5) * 40;
                p.exitTargetY = -20;
            });
        } else {
            this.initExitMovement();
        }
    }

    initExitMovement() {
        this.postMatchPhase = 3;
        const exitY = Math.random() < 0.5 ? -20 : 120;
        this.players.forEach(p => {
            p.exitTargetX = 50 + (Math.random() - 0.5) * 10;
            p.exitTargetY = exitY;
        });
    }

    updatePostMatch() {
        if (this.postMatchPhase === 1) {
            let allAligned = true;
            this.players.forEach(p => {
                if (p.teamId === 'home') {
                    const dx = p.exitTargetX - p.x, dy = p.exitTargetY - p.y;
                    const d  = Math.hypot(dx, dy);
                    if (d > 3) { p.x += (dx/d)*0.8; p.y += (dy/d)*0.8; allAligned = false; }
                } else { p.y -= 0.8; }
            });
            if (allAligned) { this.postMatchPhase = 2; this.lapAngle = Math.PI / 2; }
        } else if (this.postMatchPhase === 2) {
            this.lapAngle -= 0.015;
            this.players.forEach(p => {
                if (p.teamId === 'home') {
                    const a = this.lapAngle + p.lapOrder;
                    const tX = 50 + Math.cos(a) * (40 + p.radiusNoise);
                    const tY = 50 + Math.sin(a) * (35 + p.radiusNoise);
                    p.x += (tX - p.x) * 0.1; p.y += (tY - p.y) * 0.1;
                } else { p.y -= 0.8; }
            });
            if (this.lapAngle < -Math.PI * 1.5) this.initExitMovement();
        } else if (this.postMatchPhase === 3) {
            this.players.forEach(p => {
                const dx = p.exitTargetX - p.x, dy = p.exitTargetY - p.y;
                const d  = Math.hypot(dx, dy);
                if (d > 1) { p.x += (dx/d)*0.7; p.y += (dy/d)*0.7; }
            });
        }
        return this.getSnapshot();
    }

    isExitAnimationDone() {
        if (this.postMatchPhase !== 3) return false;
        return this.players.every(p => p.y < -10 || p.y > 110);
    }
}

// =============================================================================
// [SECTION 5]  GLOBAL REGISTRATION
// =============================================================================

window.RealSoccerEngine   = RealSoccerEngine;
window.DeepTacticManager  = DeepTacticManager;
window.migrateDeepTactics = migrateDeepTactics;

document.addEventListener('DOMContentLoaded', () => {
    const tacticsBtn = document.querySelector('[data-tab="tactics"]');
    if (tacticsBtn) tacticsBtn.addEventListener('click', () => setTimeout(() => DeepTacticManager.init(), 100));
    setTimeout(() => DeepTacticManager.init(), 1000);
});

