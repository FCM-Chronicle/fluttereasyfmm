// deepenTactic.js  —  v3.0  COMPLETE REWRITE! (Flow-Based Architecture)
// External API preserved 100% compatible with visualizer/match UI
// ─────────────────────────────────────────────────────────────────────────────
//   window.RealSoccerEngine   (class)
//   window.DeepTacticManager  (object, .init(), .renderUI())
//   BallState                 (const object)
//   SimBall / SimPlayer       (classes)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// =============================================================================
// [SECTION 0]  CONSTANTS & UTILITIES
// =============================================================================

const BallState = { LOOSE: 0, CONTROLLED: 1, IN_FLIGHT: 2, DEAD: 3 };

const ROLE_BEHAVIOR = {
    // Forwards
    AF: { runBehind: 1.0, linkup: 0.2, hugLine: 0.0, pressBias: 0.9, attackBias: 1.0, defenseBias: 0.1 },
    CF: { runBehind: 0.6, linkup: 0.7, hugLine: 0.0, pressBias: 0.6, attackBias: 0.9, defenseBias: 0.2 },
    P: { runBehind: 0.95, linkup: 0.1, hugLine: 0.0, pressBias: 0.8, attackBias: 1.0, defenseBias: 0.0 },
    F9: { runBehind: 0.3, linkup: 1.0, hugLine: 0.0, pressBias: 0.5, attackBias: 0.9, defenseBias: 0.3 },
    TM: { runBehind: 0.2, linkup: 1.0, hugLine: 0.0, pressBias: 0.3, attackBias: 0.8, defenseBias: 0.2 },
    SS: { runBehind: 0.7, linkup: 0.5, hugLine: 0.2, pressBias: 0.6, attackBias: 0.95, defenseBias: 0.15 },
    PF: { runBehind: 0.5, linkup: 0.6, hugLine: 0.0, pressBias: 1.0, attackBias: 0.9, defenseBias: 0.5 },
    RD: { runBehind: 0.5, linkup: 0.5, hugLine: 0.0, pressBias: 0.7, attackBias: 0.85, defenseBias: 0.4 },
    W: { runBehind: 0.7, linkup: 0.1, hugLine: 1.0, pressBias: 0.5, attackBias: 0.9, defenseBias: 0.2 },
    IF: { runBehind: 0.8, linkup: 0.3, hugLine: 0.0, pressBias: 0.6, attackBias: 0.95, defenseBias: 0.2 },
    IW: { runBehind: 0.7, linkup: 0.3, hugLine: 0.1, pressBias: 0.6, attackBias: 0.9, defenseBias: 0.3 },
    WP: { runBehind: 0.4, linkup: 0.7, hugLine: 1.0, pressBias: 0.5, attackBias: 0.85, defenseBias: 0.3 },
    DLF: { runBehind: 0.3, linkup: 0.9, hugLine: 0.0, pressBias: 0.4, attackBias: 0.85, defenseBias: 0.3 },
    // Midfielders
    AP: { runBehind: 0.6, linkup: 0.6, hugLine: 0.0, pressBias: 0.5, attackBias: 0.95, defenseBias: 0.15 },
    AM: { runBehind: 0.6, linkup: 0.5, hugLine: 0.0, pressBias: 0.5, attackBias: 0.95, defenseBias: 0.15 },
    BBM: { runBehind: 0.8, linkup: 0.4, hugLine: 0.0, pressBias: 0.9, attackBias: 0.9, defenseBias: 0.7 },
    MEZ: { runBehind: 0.7, linkup: 0.4, hugLine: 0.3, pressBias: 0.7, attackBias: 0.9, defenseBias: 0.4 },
    CAR: { runBehind: 0.5, linkup: 0.6, hugLine: 0.0, pressBias: 0.8, attackBias: 0.85, defenseBias: 0.6 },
    REG: { runBehind: 0.3, linkup: 0.7, hugLine: 0.0, pressBias: 0.5, attackBias: 0.75, defenseBias: 0.4 },
    DLP: { runBehind: 0.1, linkup: 1.0, hugLine: 0.0, pressBias: 0.4, attackBias: 0.55, defenseBias: 0.45 },
    BWM: { runBehind: 0.3, linkup: 0.5, hugLine: 0.0, pressBias: 1.0, attackBias: 0.4, defenseBias: 0.95 },
    CM: { runBehind: 0.4, linkup: 0.5, hugLine: 0.0, pressBias: 0.6, attackBias: 0.7, defenseBias: 0.5 },
    LM: { runBehind: 0.6, linkup: 0.3, hugLine: 1.0, pressBias: 0.5, attackBias: 0.8, defenseBias: 0.4 },
    RM: { runBehind: 0.6, linkup: 0.3, hugLine: 1.0, pressBias: 0.5, attackBias: 0.8, defenseBias: 0.4 },
    WM: { runBehind: 0.5, linkup: 0.3, hugLine: 1.0, pressBias: 0.5, attackBias: 0.8, defenseBias: 0.4 },
    SV: { runBehind: 0.5, linkup: 0.5, hugLine: 0.0, pressBias: 0.6, attackBias: 0.8, defenseBias: 0.8 },
    ANC: { runBehind: 0.1, linkup: 0.8, hugLine: 0.0, pressBias: 0.7, attackBias: 0.3, defenseBias: 0.95 },
    DM: { runBehind: 0.1, linkup: 0.8, hugLine: 0.0, pressBias: 0.7, attackBias: 0.35, defenseBias: 0.9 },
    CDM: { runBehind: 0.05, linkup: 0.85, hugLine: 0.0, pressBias: 0.8, attackBias: 0.3, defenseBias: 0.95 },
    EG: { runBehind: 0.3, linkup: 0.7, hugLine: 0.0, pressBias: 0.5, attackBias: 0.7, defenseBias: 0.4 },
    // Defenders
    CD: { runBehind: 0.0, linkup: 0.2, hugLine: 0.0, pressBias: 0.5, attackBias: 0.05, defenseBias: 1.0 },
    BPD: { runBehind: 0.0, linkup: 0.4, hugLine: 0.0, pressBias: 0.4, attackBias: 0.2, defenseBias: 0.9 },
    NCB: { runBehind: 0.0, linkup: 0.1, hugLine: 0.0, pressBias: 0.6, attackBias: 0.1, defenseBias: 0.95 },
    LIB: { runBehind: 0.2, linkup: 0.4, hugLine: 0.0, pressBias: 0.3, attackBias: 0.3, defenseBias: 0.85 },
    FB: { runBehind: 0.3, linkup: 0.2, hugLine: 0.95, pressBias: 0.6, attackBias: 0.35, defenseBias: 0.85 },
    WB: { runBehind: 0.6, linkup: 0.2, hugLine: 1.0, pressBias: 0.5, attackBias: 0.55, defenseBias: 0.7 },
    CWB: { runBehind: 0.7, linkup: 0.1, hugLine: 1.0, pressBias: 0.5, attackBias: 0.7, defenseBias: 0.55 },
    IWB: { runBehind: 0.5, linkup: 0.3, hugLine: 0.3, pressBias: 0.5, attackBias: 0.5, defenseBias: 0.7 },
    GK: { runBehind: 0.0, linkup: 0.0, hugLine: 0.0, pressBias: 0.0, attackBias: 0.0, defenseBias: 1.0 }
};

const POSITION_STAT_WEIGHTS = {
    FW: { speed: 1.3, shooting: 1.5, passing: 0.9, defense: 0.4, decision: 1.1, physical: 1.0 },
    MF: { speed: 1.0, shooting: 0.8, passing: 1.4, defense: 0.9, decision: 1.3, physical: 0.9 },
    DF: { speed: 1.0, shooting: 0.3, passing: 0.9, defense: 1.6, decision: 1.0, physical: 1.2 },
    GK: { speed: 0.5, shooting: 0.1, passing: 0.7, defense: 1.8, decision: 1.1, physical: 1.0 }
};

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function deriveStatsFromOverall(overall, position) {
    const w = POSITION_STAT_WEIGHTS[position] || POSITION_STAT_WEIGHTS.MF;
    const out = {};
    for (const [k, weight] of Object.entries(w)) {
        const noise = (Math.random() - 0.5) * 4;
        out[k] = Math.max(10, Math.min(99, overall * weight + noise));
    }
    out.tackle = out.defense;
    return out;
}

// =============================================================================
// [SECTION 0.5]  DEEP TACTICS MANAGER  (unchanged UI)
// =============================================================================

function migrateDeepTactics() {
    if (typeof gameData === 'undefined' || !gameData.deepTactics) return false;
    const dt = gameData.deepTactics;
    const oldPress = typeof dt.pressingStrength === 'string' ? dt.pressingStrength : null;
    const oldTend = typeof dt.teamTendency === 'string' ? dt.teamTendency : null;
    const oldStyle = typeof dt.passStyle === 'string' ? dt.passStyle : null;
    const oldSide = typeof dt.attackingSide === 'string' ? dt.attackingSide : null;
    if (!('pressIntensity' in dt) && oldPress) {
        dt.pressIntensity = oldPress === 'high' ? 'high' : oldPress === 'low' ? 'low' : 'mid';
    }
    if (!('passTempo' in dt) && oldTend) {
        dt.passTempo = oldTend === 'offensive' ? 'fast' : oldTend === 'defensive' ? 'slow' : 'normal';
    }
    if (!('passLength' in dt) && oldStyle) {
        dt.passLength = oldStyle === 'long' ? 'long' : oldStyle === 'short' ? 'short' : 'mixed';
    }
    if (!('defensiveLine' in dt)) dt.defensiveLine = 'standard';
    if (!('attackFocus' in dt) && oldSide) {
        dt.attackFocus = oldSide === 'all' ? 'mixed' : oldSide;
    }
    if (typeof dt.passStyle === 'string') {
        const s = dt.passStyle;
        const r = s === 'short' ? [7, 3] : s === 'long' ? [3, 7] : [5, 5];
        dt.passStyle = { shortRatio: r[0], longRatio: r[1] };
    } else if (!dt.passStyle || typeof dt.passStyle !== 'object') {
        dt.passStyle = { shortRatio: 7, longRatio: 3 };
    }
    return true;
}

const DeepTacticManager = {
    init() {
        if (!gameData.deepTactics) {
            gameData.deepTactics = {
                attackFocus: 'mixed', passStyle: { shortRatio: 7, longRatio: 3 },
                pressIntensity: 'mid', defensiveLine: 'standard',
                passTempo: 'normal', passLength: 'mixed',
                attackStyle: 'mixed'
            };
        }
        if (!gameData.deepTactics.attackStyle) gameData.deepTactics.attackStyle = 'mixed';
        migrateDeepTactics();
        this.renderUI();
    },
    renderUI() {
        let c = document.getElementById('deepTacticsContainer');
        if (!c) {
            const t = document.getElementById('tactics');
            if (!t) return;
            c = document.createElement('div');
            c.id = 'deepTacticsContainer';
            c.style.cssText = 'margin-top:20px;padding:15px;background:rgba(255,255,255,0.05);border-radius:10px;';
            t.appendChild(c);
        }
        const dt = gameData.deepTactics;
        const opts = (k, arr) => arr.map(([v, l]) => `<option value="${v}"${dt[k] === v ? ' selected' : ''}>${l}</option>`).join('');
        const fields = [
            ['defensiveLine', '수비 라인', [['deep', '딥 (Deep)'], ['standard', '표준'], ['high', '하이 (High)']]],
            ['pressIntensity', '압박 강도', [['low', '낮음'], ['mid', '보통'], ['high', '높음']]],
            ['passTempo', '패스 템포', [['slow', '느림'], ['normal', '보통'], ['fast', '빠름']]],
            ['passLength', '패스 길이', [['short', '짧게'], ['mixed', '혼합'], ['long', '길게']]],
            ['attackStyle', '⚡ 공격 전개', [['counter', '역습 (Counter)'], ['mixed', '혼합 (Mixed)'], ['possession', '지공 (Possession)']]]
        ];
        c.innerHTML = `
            <h4 style="color:#ffd700;margin-top:0;">심층 전술 세부 설정</h4>
            ${fields.map(([k, label, options]) => `
            <div style="margin-bottom:10px;">
                <label style="display:block;margin-bottom:4px;color:#ccc;">${label}</label>
                <select id="dt-${k}" style="width:100%;padding:5px;background:#333;color:white;">
                    ${opts(k, options)}
                </select>
            </div>`).join('')}
            <div style="color:#aaa;font-size:0.8rem;">* 설정은 자동 적용됩니다</div>
        `;
        fields.forEach(([k]) => {
            document.getElementById(`dt-${k}`).addEventListener('change', e => { gameData.deepTactics[k] = e.target.value; });
        });
    }
};

// =============================================================================
// [SECTION 1]  SIMBALL / SIMPLAYER  (v3: lean + state for flow)
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
        this._flightOrigin = { x: 50, y: 50 };
    }
}

class SimPlayer {
    constructor(data, teamId, role, lineStats, morale = 50, tacticMultiplier = 1.0) {
        this.id = data.name;
        this.name = data.name;
        this.position = data.position;
        this.rating = data.rating;
        this.teamId = teamId;
        this.role = role;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.baseX = 0; this.baseY = 0;
        this.slotY = 0; // New: assigned vertical slot (for MF Y spread fix!)
        this.stamina = data.condition !== undefined ? data.condition : 100;
        this._stealCooldown = 0;
        this.burstTimer = 0;
        this.forceReturnTimer = 0;
        // v3 FLOW state for off-ball runs
        this._fwMode = 'shadow';  // shadow | burst | linkup
        this._fbMode = 'hold';    // hold | overlap | underlap
        this._timer = 0;         // general timer per player
        this._markTargetId = null;
        this.stats = this._buildStats(data, role, lineStats, morale, tacticMultiplier);
    }

    _buildStats(data, role, lineStats, morale, tacticMultiplier) {
        const moraleFactor = 1 + ((morale - 50) * 0.0005);
        if (lineStats && lineStats.attack) {
            let line;
            if (data.position === 'FW') line = 'attack';
            else if (data.position === 'MF') line = 'midfield';
            else line = 'defense';
            const bs = lineStats[line].stats;
            const map = { passing: 'technique', shooting: 'attack', defense: 'defense', speed: 'speed', decision: 'mentality', physical: 'physical' };
            const fs = {};
            for (const [ss, ds] of Object.entries(map)) {
                const v = bs[ds] || data.rating;
                const finalV = (typeof TacticsManager !== 'undefined') ? TacticsManager.calculateFinalPower(v, role, ds) : v;
                fs[ss] = finalV * moraleFactor * tacticMultiplier;
            }
            fs.tackle = fs.defense;
            return fs;
        }
        const overall = data.rating || 70;
        const d = deriveStatsFromOverall(overall, data.position);
        for (const k of Object.keys(d)) d[k] *= moraleFactor * tacticMultiplier;
        return d;
    }
}

// =============================================================================
// [SECTION 2]  REAL SOCCER ENGINE V3 — FLOW BASED ARCHITECTURE
// =============================================================================

class RealSoccerEngine {

    // ─────────────────────────────────────────────────────────────
    //  CONSTRUCTOR + TEAM INIT
    // ─────────────────────────────────────────────────────────────
    constructor(homeSquad, awaySquad, homeTactic = 'balanced', awayTactic = 'balanced') {
        this.players = [];
        this.ball = new SimBall();
        this.matchTime = 0;
        this.eventsQueue = [];
        this.pendingShot = null;

        this.celebrationTimer = 0;
        this.celebrationActor = null;
        this.celebrationTarget = null;
        this.celebrationType = null;
        this.lastScorerTeam = null;
        this.homeScore = 0;
        this.awayScore = 0;
        this.userStats = null;
        this.aiStats = null;

        this.teamTactics = { home: homeTactic, away: awayTactic };

        // Exit animation (post-match compatibility)
        this.exitAnimActive = false;
        this.exitAnimTicks = 0;
        this.exitAnimDone = false;
        this.exitWinner = null;

        // ⭐ V3 FLOW STATE (possession + phase + memories)
        this._possession = { teamId: null, duration: 0 };
        this._phase = { home: 'building', away: 'building' }; // building | progressing | finalThird | counter
        this._phaseTimer = { home: 0, away: 0 };
        this._attackProgressX = { home: 0, away: 0 }; // track how far we pushed, detect stuck
        this._attackMemories = { home: new Array(8).fill(null), away: new Array(8).fill(null) };
        this._attackMemIdx = { home: 0, away: 0 };
        this._fwBurstCooldown = 0;
        this._fwLinkupCooldown = 0;

        this.teamStrength = { home: 70, away: 70 };
        this.teamStrength.home = this.calcTeamStrength(homeSquad);
        this.teamStrength.away = this.calcTeamStrength(awaySquad);
        this.initTeam(homeSquad, 'home', homeTactic);
        this.initTeam(awaySquad, 'away', awayTactic);
        this._assignVerticalSlots();
        this.resetPositions('home');
    }

    calcTeamStrength(squad) {
        const all = [squad.gk, ...squad.df, ...squad.mf, ...squad.fw].filter(Boolean);
        if (!all.length) return 70;
        return all.reduce((s, p) => s + p.rating, 0) / all.length;
    }

    getRoleBehavior(role) { return ROLE_BEHAVIOR[role] || ROLE_BEHAVIOR.CM; }

    getEffectiveStat(p, stat) {
        let v = p.stats[stat];
        if (v === undefined) return 50;
        let f = 1.0;
        if (p.stamina < 50) f = 0.5;
        else if (p.stamina < 60) f = 0.75;
        else if (p.stamina < 70) f = 0.9;
        return v * f;
    }

    generateAIStats(squad, tactic = 'balanced') {
        const s = { attack: { stats: {} }, midfield: { stats: {} }, defense: { stats: {} } };
        const avg = a => a.length > 0 ? Math.round(a.reduce((x, y) => x + y.rating, 0) / a.length) : 70;
        const fw = avg(squad.fw.filter(Boolean));
        const mf = avg(squad.mf.filter(Boolean));
        const df = avg([...squad.df.filter(Boolean), squad.gk].filter(Boolean));
        
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

        for (const [line, ovr] of Object.entries({ attack: fw, midfield: mf, defense: df })) {
            const total = ovr * 6, base = Math.floor(total / 6);
            let rem = total % 6;
            priorities.forEach((k, i) => {
                s[line].stats[k] = base + offsets[i] + (rem-- > 0 ? 1 : 0);
            });
        }
        return s;
    }

    initTeam(squad, teamId, tactic) {
        let mul = tactic === 'balanced' ? 0.60 : 1.0;
        // 전술 상성 효과 반영 (tacticSystem.js에서 계산한 teamStrength 보정치 활용)
        if (this.teamStrength && this.teamStrength[teamId] !== undefined) {
            mul *= 1 + ((this.teamStrength[teamId] - 70) * 0.01);
        }
        const setupLine = (list, baseX) => {
            const isUser = (teamId === 'home' && gameData.isHomeGame) || (teamId === 'away' && !gameData.isHomeGame);
            let lineStats, morale = 50;
            let finalMul = mul;
            
            if (isUser) { 
                lineStats = gameData.lineStats; 
                this.userStats = lineStats; 
                morale = gameData.teamMorale; 
            } else { 
                lineStats = this.aiStats || this.generateAIStats(squad, tactic); 
                this.aiStats = lineStats; 
                morale = 20 + Math.floor(Math.random() * 71); 
                finalMul *= 1.11; // [간단한 난이도 조정] AI 팀 능력치 15% 버프
            }
            
            list.forEach((p, i) => {
                if (!p) return;
                let role = (gameData.playerRoles && gameData.playerRoles[p.name])
                    ? gameData.playerRoles[p.name]
                    : this._bestRoleForTactic(tactic, p.position, i);
                const sp = new SimPlayer(p, teamId, role, lineStats, morale, finalMul);
                sp.baseX = baseX;
                sp.baseY = (100 / (list.length + 1)) * (i + 1);
                sp.slotY = sp.baseY;
                sp.x = sp.baseX; sp.y = sp.baseY;
                this.players.push(sp);
            });
        };
        if (teamId === 'home') {
            if (squad.gk) setupLine([squad.gk], 5);
            setupLine(squad.df, 22);
            setupLine(squad.mf, 45);
            setupLine(squad.fw, 72);
        } else {
            if (squad.gk) setupLine([squad.gk], 95);
            setupLine(squad.df, 78);
            setupLine(squad.mf, 55);
            setupLine(squad.fw, 28);
        }
    }

    _bestRoleForTactic(tactic, pos, i) {
        if (pos === 'GK') return 'GK';
        const map = {
            tikitaka: { FW: ['F9', 'DLF'], MF: ['DLP', 'AP', 'MEZ'], DF: ['BPD', 'IWB'] },
            possession: { FW: ['DLF', 'CF'], MF: ['DLP', 'AP', 'CAR'], DF: ['BPD', 'WB'] },
            lavolpiana: { FW: ['F9', 'W'], MF: ['DLP', 'REG', 'MEZ'], DF: ['BPD', 'IWB'] },
            gegenpress: { FW: ['PF', 'AF'], MF: ['BBM', 'BWM', 'MEZ'], DF: ['CD', 'CWB'] },
            totalFootball: { FW: ['CF', 'F9'], MF: ['BBM', 'MEZ', 'AP'], DF: ['BPD', 'CWB', 'LIB'] },
            counter: { FW: ['AF', 'P'], MF: ['BWM', 'DLP'], DF: ['NCB', 'FB'] },
            longBall: { FW: ['TM', 'AF'], MF: ['BWM', 'CM'], DF: ['NCB', 'CD'] },
            twoLine: { FW: ['AF', 'P'], MF: ['BWM', 'CAR'], DF: ['CD', 'FB'] },
            parkBus: { FW: ['P', 'TM'], MF: ['BWM', 'DLP'], DF: ['NCB', 'CD'] },
            catenaccio: { FW: ['TM', 'P'], MF: ['BWM', 'DLP'], DF: ['NCB', 'LIB'] }
        };
        const def = { FW: ['AF', 'CF'], MF: ['BBM', 'AP'], DF: ['CD', 'FB'] };
        const m = map[tactic] || def;
        const c = m[pos] || def[pos] || ['CD'];
        return c[i % c.length];
    }

    // ⭐⭐⭐ NEW: Assign fixed vertical slots per position band!
    // 이게 중원 과포화 & 몰려다님을 해결하는 핵심!
    _assignVerticalSlots() {
        for (const teamId of ['home', 'away']) {
            const mfs = this.players.filter(p => p.teamId === teamId && p.position === 'MF').sort((a, b) => a.baseY - b.baseY);
            const n = mfs.length;
            for (let i = 0; i < n; i++) {
                if (n === 2) mfs[i].slotY = n === 2 ? [33, 67][i] : mfs[i].baseY;
                else if (n === 3) mfs[i].slotY = [25, 50, 75][i];
                else if (n === 4) mfs[i].slotY = [20, 40, 60, 80][i];
                else if (n === 5) mfs[i].slotY = [18, 34, 50, 66, 82][i];
                else mfs[i].slotY = mfs[i].baseY;
            }
            // CBs also have a slot for central spacing
            const dfs = this.players.filter(p => p.teamId === teamId && p.position === 'DF').sort((a, b) => a.baseY - b.baseY);
            const fbs = dfs.filter(p => ['FB', 'WB', 'CWB', 'IWB'].includes(p.role));
            const cbs = dfs.filter(p => ['CD', 'BPD', 'NCB', 'LIB'].includes(p.role));
            if (cbs.length === 2) { cbs[0].slotY = 38; cbs[1].slotY = 62; }
            if (fbs.length === 2) { fbs[0].slotY = 10; fbs[1].slotY = 90; }
            // FWs
            const fws = this.players.filter(p => p.teamId === teamId && p.position === 'FW').sort((a, b) => a.baseY - b.baseY);
            const nfw = fws.length;
            for (let i = 0; i < nfw; i++) {
                if (nfw === 2) fws[i].slotY = [40, 60][i];
                else if (nfw === 3) fws[i].slotY = [18, 50, 82][i];
                else if (nfw === 4) fws[i].slotY = [15, 38, 62, 85][i];
                else fws[i].slotY = fws[i].baseY;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  RESET / KICKOFF
    // ─────────────────────────────────────────────────────────────
    resetPositions(kickoffTeamId = null) {
        this.ball.x = 50; this.ball.y = 50;
        this.ball.lastOwner = null; this.ball._flightOrigin = { x: 50, y: 50 };
        this.ball.intendedReceiver = null;
        this._possession = { teamId: null, duration: 0 };
        this._phase = { home: 'building', away: 'building' };
        this._phaseTimer = { home: 0, away: 0 };
        this._attackProgressX = { home: 0, away: 0 };
        this._attackMemories = { home: new Array(8).fill(null), away: new Array(8).fill(null) };
        this._attackMemIdx = { home: 0, away: 0 };
        this._fwBurstCooldown = 0;
        this._fwLinkupCooldown = 0;
        this.players.forEach(p => { p.burstTimer = 0; p.forceReturnTimer = 0; p._timer = 0; p._fwMode = 'shadow'; p._fbMode = 'hold'; });

        let kicker = null;
        if (kickoffTeamId) {
            kicker = this.players.find(p => p.teamId === kickoffTeamId && p.position === 'FW')
                || this.players.find(p => p.teamId === kickoffTeamId && p.position === 'MF')
                || this.players.find(p => p.teamId === kickoffTeamId);
        }
        if (kicker) {
            this.ball.state = BallState.CONTROLLED;
            this.ball.owner = kicker;
            kicker.x = 50; kicker.y = 50; kicker.vx = 0; kicker.vy = 0;
        } else {
            this.ball.state = BallState.LOOSE;
            this.ball.owner = null;
        }
        this.players.forEach(p => {
            if (p === kicker) return;
            p.vx = 0; p.vy = 0;
            p.y = p.slotY || p.baseY;  // Use SLOT! not arbitrary baseY!
            if (p.teamId === 'home') {
                const mx = p.position === 'FW' ? 48 : (p.position === 'MF' ? 42 : 50);
                p.x = Math.min(p.baseX, mx);
            } else {
                const mn = p.position === 'FW' ? 52 : (p.position === 'MF' ? 58 : 50);
                p.x = Math.max(p.baseX, mn);
            }
        });
    }

    consumeStamina() {
        const rates = { FW: 0.6, MF: 0.7, DF: 0.4, GK: 0.1 };
        this.players.forEach(p => {
            const r = rates[p.position] || 0.5;
            p.stamina = Math.max(0, p.stamina - r * (0.8 + Math.random() * 0.4));
            if (p._stealCooldown > 0) p._stealCooldown--;
            if (p.burstTimer > 0) p.burstTimer--;
            if (p.forceReturnTimer > 0) p.forceReturnTimer--;
            if (p._timer > 0) p._timer--;
        });
    }

    getTeamTactic(teamId) {
        if (typeof gameData !== 'undefined') {
            const u = gameData.isHomeGame ? 'home' : 'away';
            if (teamId === u && gameData.currentTactic) return gameData.currentTactic;
        }
        return this.teamTactics?.[teamId] || 'balanced';
    }

    getTacticProfile(teamId) {
        const profiles = {
            tikitaka: { width: 0.82, tempo: 0.92, directness: 0.72, press: 0.78, boxPress: 0.72, attackRisk: 0.76 },
            possession: { width: 0.86, tempo: 0.82, directness: 0.62, press: 0.62, boxPress: 0.68, attackRisk: 0.68 },
            lavolpiana: { width: 0.90, tempo: 0.84, directness: 0.66, press: 0.58, boxPress: 0.64, attackRisk: 0.66 },
            gegenpress: { width: 0.92, tempo: 1.16, directness: 0.88, press: 1.28, boxPress: 1.12, attackRisk: 0.92 },
            totalFootball: { width: 0.96, tempo: 1.04, directness: 0.82, press: 0.96, boxPress: 0.88, attackRisk: 0.88 },
            counter: { width: 1.08, tempo: 1.18, directness: 1.22, press: 0.56, boxPress: 0.76, attackRisk: 0.86 },
            longBall: { width: 1.05, tempo: 1.10, directness: 1.28, press: 0.50, boxPress: 0.72, attackRisk: 0.80 },
            twoLine: { width: 0.92, tempo: 0.92, directness: 0.86, press: 0.46, boxPress: 0.82, attackRisk: 0.62 },
            parkBus: { width: 0.80, tempo: 0.72, directness: 0.78, press: 0.34, boxPress: 0.92, attackRisk: 0.48 },
            catenaccio: { width: 0.82, tempo: 0.78, directness: 0.86, press: 0.38, boxPress: 0.96, attackRisk: 0.52 },
            balanced: { width: 0.92, tempo: 0.92, directness: 0.82, press: 0.62, boxPress: 0.72, attackRisk: 0.68 }
        };
        return profiles[this.getTeamTactic(teamId)] || profiles.balanced;
    }

    // ─────────────────────────────────────────────────────────────
    //  MAIN UPDATE LOOP
    // ─────────────────────────────────────────────────────────────
    update(minute, isNewMinute) {
        this.eventsQueue = [];
        if (isNewMinute) { this.consumeStamina(); this.matchTime = minute; }
        this.players.forEach(p => {
            if (p._stealCooldown > 0) p._stealCooldown--;
        });

        // Exit animation (post-match)
        if (this.exitAnimActive && !this.exitAnimDone) {
            return this.updatePostMatch();
        }

        // Celebration
        if (this.celebrationTimer > 0) {
            this._processCelebration();
            this.celebrationTimer--;
            if (this.celebrationTimer <= 0) {
                const next = this.lastScorerTeam === 'home' ? 'away' : 'home';
                this.resetPositions(next);
            }
            return this.getSnapshot();
        }

        // 1) BALL FLIGHT
        if (this.ball.state === BallState.IN_FLIGHT) {
            this._stepBallFlight();
            if (this.ball.state === BallState.LOOSE && this.pendingShot) { this._handleShotResult(); return this.getSnapshot(); }
        }

        // 2) LOOSE BALL PICKUP
        if (this.ball.state === BallState.LOOSE) {
            let nearest = null, minD = 999;
            this.players.forEach(p => {
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (d < minD) { minD = d; nearest = p; }
            });
            if (nearest && minD < 3.4) {
                this.ball.state = BallState.CONTROLLED;
                this.ball.owner = nearest;
                this.ball.intendedReceiver = null;
                this.ball.x = nearest.x; this.ball.y = nearest.y;
                this._triggerTurnover(nearest.teamId);
            }
        }

        // 3) ⭐⭐⭐ V3 POSSESSION + PHASE TICK (flow!)
        this._tickPossessionAndPhase();

        // 4) ON-BALL DECISION
        if (this.ball.state === BallState.CONTROLLED && this.ball.owner) {
            this._onBallDecision(this.ball.owner);
        }

        // 5) OFF-BALL AI (ALL players)
        this._processAllOffBall();

        // 6) ⭐ V3: TEAMMATE COLLISION RESOLUTION (passive, no teleport!)
        this._resolveTeammateCollisions();

        // 7) Defensive line adjust + offside enforcement (smooth)
        this._adjustDefensiveLines();
        this._enforceAllOffside();

        return this.getSnapshot();
    }

    getSnapshot() {
        return {
            ball: { x: this.ball.x, y: this.ball.y, z: this.ball.z, state: this.ball.state },
            players: this.players.map(p => ({
                id: p.id, x: p.x, y: p.y, team: p.teamId, hasBall: this.ball.owner === p
            })),
            events: [...this.eventsQueue],
            isCelebration: this.celebrationTimer > 0,
            isSuspense: false
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  [V3 CORE]  POSSESSION + PHASE MANAGEMENT (FLOW)
    // ─────────────────────────────────────────────────────────────
    _tickPossessionAndPhase() {
        const teamId = this.ball.owner ? this.ball.owner.teamId
            : (this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner ? this.ball.lastOwner.teamId : null);
        if (teamId && teamId === this._possession.teamId) {
            this._possession.duration++;
        } else if (teamId) {
            this._possession = { teamId, duration: 0 };
        } else {
            this._possession.duration = Math.max(0, this._possession.duration - 1);
            if (this._possession.duration <= 0) this._possession.teamId = null;
        }

        // Phase for each team: based on where ball is located when team has it
        for (const tid of ['home', 'away']) {
            const have = this._possession.teamId === tid;
            const ballX = this.ball.x;
            const myGoalX = tid === 'home' ? 0 : 100;
            const theirGoalX = 100 - myGoalX;
            const distFromMyGoal = Math.abs(ballX - myGoalX);

            if (this._phaseTimer[tid] > 0) this._phaseTimer[tid]--;
            const prev = this._phase[tid];

            if (have) {
                // Determine phase from progression
                let newPhase;
                if (distFromMyGoal < 35) newPhase = 'building';
                else if (distFromMyGoal < 70) newPhase = 'progressing';
                else newPhase = 'finalThird';
                if (newPhase !== prev) { this._phase[tid] = newPhase; this._phaseTimer[tid] = 15; }
                // Track attack progress vs stuck detection
                const prog = distFromMyGoal;
                if (prog > this._attackProgressX[tid] + 3) this._attackProgressX[tid] = prog;
            } else {
                // Not having ball: if phase was 'counter' timer, keep else revert to building
                if (prev === 'counter' && this._phaseTimer[tid] > 0) {
                    // keep
                } else if (this._phase[tid] !== 'building') {
                    this._phase[tid] = 'building';
                    this._attackProgressX[tid] = 0;
                }
            }
        }
    }

    _isAttackStuck(teamId) {
        // true if 20+ frames of possession AND no progress for 15+ frames
        if (this._possession.teamId !== teamId || this._possession.duration < 25) return false;
        const prog = teamId === 'home' ? this.ball.x : (100 - this.ball.x);
        return prog < this._attackProgressX[teamId] + 5;
    }

    _getAdvancedSupportPlayer(teamId, position) {
        const fwd = teamId === 'home' ? 1 : -1;
        const pool = this.players.filter(p => p.teamId === teamId && p.position === position && p !== this.ball.owner);
        if (!pool.length) return null;
        return pool.slice().sort((a, b) => {
            const ab = this.getRoleBehavior(a.role);
            const bb = this.getRoleBehavior(b.role);
            const ax = a.x * fwd + ((ab.attackBias || 0) + (ab.runBehind || 0)) * 8 - Math.abs(a.slotY - this.ball.y) * 0.08;
            const bx = b.x * fwd + ((bb.attackBias || 0) + (bb.runBehind || 0)) * 8 - Math.abs(b.slotY - this.ball.y) * 0.08;
            return bx - ax;
        })[0];
    }

    _findKillerPassTarget(from, phase) {
        const isHome = from.teamId === 'home';
        const goalX = isHome ? 100 : 0;
        const candidates = this.players.filter(p =>
            p.teamId === from.teamId &&
            p !== from &&
            (p.position === 'FW' || p.position === 'MF')
        );
        let best = null;
        let bestScore = -Infinity;
        for (const to of candidates) {
            const dist = Math.hypot(from.x - to.x, from.y - to.y);
            if (dist < 16 || dist > 42) continue;
            const progressive = isHome ? (to.x - from.x) : (from.x - to.x);
            if (progressive < 12) continue;
            if (this._numOpponentsAhead(to, 6, 14) > 1) continue;
            let score = this._scorePass(from, to, phase);
            if (to._fwMode === 'burst') score += 28;
            if (to.position === 'FW') score += 18;
            if (to.position === 'MF' && ['AM', 'AP', 'SS', 'MEZ', 'BBM'].includes(to.role)) score += 12;
            if (this._isReceiverBehindDefLine(from, to)) score += 16;
            if (Math.abs(to.x - goalX) < 30) score += 10;
            if (score > bestScore) { bestScore = score; best = to; }
        }
        return best ? { target: best, score: bestScore } : null;
    }

    // [NEW] Long Ball target finder (지공 모드 롱킥 시스템)
    // Finds a FW making a channel run for a long diagonal / switch of play
    _findLongBallTarget(from, phase) {
        const isHome = from.teamId === 'home';
        const tid = from.teamId;
        const goalX = isHome ? 100 : 0;
        const candidates = this.players.filter(p =>
            p.teamId === tid &&
            p !== from &&
            p.position === 'FW'
        );
        let best = null;
        let bestScore = -Infinity;
        for (const to of candidates) {
            const dist = Math.hypot(from.x - to.x, from.y - to.y);
            if (dist < 28 || dist > 68) continue;
            const progressive = isHome ? (to.x - from.x) : (from.x - to.x);
            if (progressive < 18) continue;
            // Check space around target
            const oppNear = this.players.filter(p =>
                p.teamId !== tid && p.position !== 'GK' &&
                Math.hypot(p.x - to.x, p.y - to.y) < 14
            ).length;
            if (oppNear > 2) continue;
            let score = progressive * 1.4 - oppNear * 14;
            // Prefer wide channels for long diagonal
            if (to.y < 22 || to.y > 78) score += 12;
            // Burst FW bonus
            if (to._fwMode === 'burst') score += 35;
            // Proximity to goal
            score += Math.max(0, 42 - Math.abs(to.x - goalX)) * 0.6;
            // Check lane is not too congested
            const laneBlocked = this._numOpponentsAhead(from, 10, 20) >= 3;
            if (laneBlocked) score -= 20;
            if (score > bestScore) { bestScore = score; best = to; }
        }
        return best && bestScore > 18 ? { target: best, score: bestScore } : null;
    }

    _chooseDribbleYTarget(player, phase, nDef, preferWide = false) {
        const isHome = player.teamId === 'home';
        const probeX = isHome ? player.x + 12 : player.x - 12;
        let upCrowd = 0, downCrowd = 0;
        for (const opp of this.players) {
            if (opp.teamId === player.teamId || opp.position === 'GK') continue;
            if (Math.abs(opp.x - probeX) > 16) continue;
            if (opp.y < player.y) upCrowd++;
            else downCrowd++;
        }
        let dir;
        if (preferWide) dir = player.y < 50 ? -1 : 1;
        else if (upCrowd === downCrowd) dir = nDef ? (nDef.player.y > player.y ? -1 : 1) : (player.y < 50 ? 1 : -1);
        else dir = upCrowd < downCrowd ? -1 : 1;

        let span = 8;
        if (phase === 'building') span = 5;
        else if (phase === 'progressing') span = 9;
        else span = 7;
        return clamp(player.y + dir * span, 8, 92);
    }

    _getTeamBlockLines(teamId) {
        const isHome = teamId === 'home';
        const fwd = isHome ? 1 : -1;
        const phase = this._phase[teamId];
        const dt = gameData.deepTactics || {};
        const profile = this.getTacticProfile(teamId);
        // 전술별 기본 라인 성향 (게겐프레싱=하이라인, 파크버스/카테나치오=딥라인)
        const tacticLineBias = (profile.press - 0.62) * 10;
        const lineBias = (dt.defensiveLine === 'high' ? 4 : (dt.defensiveLine === 'deep' ? -4 : 0)) + tacticLineBias;
        const ballX = this.ball.x;
        const haveBall = this._possession.teamId === teamId ||
            (this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner && this.ball.lastOwner.teamId === teamId);
        const threatX = !haveBall && this.ball.state === BallState.IN_FLIGHT && this.ball.targetPos
            ? this.ball.targetPos.x
            : ballX;

        let dfX, mfX, fwX;
        if (haveBall) {
            const phasePush = phase === 'building' ? 3 : (phase === 'progressing' ? 11 : (phase === 'finalThird' ? 16 : 13));
            fwX = isHome ? clamp(ballX + 21 + phasePush, 58, 92)
                : clamp(ballX - 21 - phasePush, 8, 42);
            mfX = fwX - fwd * (phase === 'building' ? 13 : 11);
            dfX = mfX - fwd * (phase === 'building' ? 14 : 12);
        } else {
            // [개선] 수비 시 수비 라인(CB 기준)이 골대 쪽으로 더 깊이 내려가도록 간격 조정 (18 -> 24)
            dfX = isHome ? clamp(threatX - 24 + lineBias, 5, 42)
                : clamp(threatX + 24 - lineBias, 58, 95);
            mfX = dfX + fwd * 15; // 미드필더와 센터백 사이의 간격을 늘려서 미드필더는 덜 내려가게 조율
            fwX = mfX + fwd * 12;
        }

        return {
            dfX: clamp(dfX, 4, 96),
            mfX: clamp(mfX, 4, 96),
            fwX: clamp(fwX, 4, 96),
            haveBall
        };
    }

    // ─────────────────────────────────────────────────────────────
    //  [V3 CORE]  ON-BALL DECISION (build-up → progress → final)
    // ─────────────────────────────────────────────────────────────
    _onBallDecision(player) {
        if (player.position === 'GK') { this._gkAI(player); return; }

        const isHome = player.teamId === 'home';
        const tid = player.teamId;
        const goalX = isHome ? 100 : 0;
        const moveDir = isHome ? 1 : -1;
        const phase = this._phase[tid];
        const distToGoal = Math.abs(player.x - goalX);
        const behavior = this.getRoleBehavior(player.role);
        const onFlank = player.y < 25 || player.y > 75;
        const nDef = this._nearestOpponent(player);
        const underPressure = nDef && nDef.dist < 8;
        const effectSpeed = this.getEffectiveStat(player, 'speed');
        const isWinger = behavior.hugLine && onFlank;

        // 2) PASS OR DRIBBLE based on PHASE + role!
        const teammates = this.players.filter(p => p.teamId === tid && p !== player);
        let bestPassTarget = null;
        let bestPassScore = -Infinity;
        for (const tm of teammates) {
            const s = this._scorePass(player, tm, phase);
            if (s > bestPassScore) { bestPassScore = s; bestPassTarget = tm; }
        }
        const killerPass = this._findKillerPassTarget(player, phase);
        if (killerPass && killerPass.score > bestPassScore + 6) {
            bestPassTarget = killerPass.target;
            bestPassScore = killerPass.score;
        }

        // [NEW] attackStyle integration
        const atkStyle = (typeof gameData !== 'undefined' && gameData.deepTactics) ? (gameData.deepTactics.attackStyle || 'mixed') : 'mixed';
        // Possession mode: try long ball when in progressing/finalThird
        if (atkStyle === 'possession' && (phase === 'progressing' || phase === 'finalThird' || phase === 'counter')) {
            const longBall = this._findLongBallTarget(player, phase);
            if (longBall && longBall.score > bestPassScore - 5) {
                bestPassTarget = longBall.target;
                bestPassScore = longBall.score + 18;
            }
        }
        // Counter mode: strongly prefer forward passes, boost burst FW target
        if (atkStyle === 'counter' && phase === 'counter') {
            const counterBurst = this.players.find(p =>
                p.teamId === tid && p._fwMode === 'burst' && p.position === 'FW'
            );
            if (counterBurst) {
                const cs = this._scorePass(player, counterBurst, phase);
                if (cs > bestPassScore - 12) { bestPassTarget = counterBurst; bestPassScore = cs + 25; }
            }
        }

        // [BUG FIX] Emergency shoot: player is right at the goal line
        // Prevents freeze where player oscillates at x=97-98 and never shoots
        if (distToGoal <= 6 && player.position !== 'GK') {
            this._attemptShoot(player, goalX);
            return;
        }

        if (distToGoal < 30) {
            const sc = this._shootChance(player, goalX, distToGoal);
            const shootScore = sc * 100
                + (player.position === 'FW' ? 10 : 0)
                - (bestPassTarget ? Math.max(0, bestPassScore - 38) * 0.5 : 0)
                - (underPressure ? 8 : 0);
            // [TUNED] Even higher threshold: strongly prefer box entry, almost never shoot from 28+ unless wide open
            const shootThreshold = distToGoal > 28 ? 88 : (distToGoal > 22 ? 72 : 46);
            if (shootScore >= Math.max(bestPassScore, shootThreshold)) {
                this._attemptShoot(player, goalX);
                return;
            }
        }

        // Situation-first choice: compare best pass with carry value instead of coin-flip.
        const passProb = this._calcPassProbV3(player, phase, underPressure, isWinger, distToGoal, nDef);
        const carryScore = this._scoreCarryChoice(player, phase, underPressure, isWinger, distToGoal, nDef);
        const passScore = bestPassScore + passProb * 18;
        const bestPassProgressive = bestPassTarget
            ? (isHome ? bestPassTarget.x > player.x + 2 : bestPassTarget.x < player.x - 2)
            : false;
        const bestPassLateral = bestPassTarget
            ? Math.abs(bestPassTarget.x - player.x) <= 5
            : false;
        const frontCrowd = this._numOpponentsAhead(player, 10, 18);
        if (bestPassTarget && player.position !== 'DF' && !underPressure && frontCrowd <= 1 && (!bestPassProgressive || bestPassLateral)) {
            this._dribbleV3(player, goalX, moveDir, phase, underPressure, isWinger, distToGoal, nDef, effectSpeed);
            return;
        }
        if (bestPassTarget && passScore >= carryScore) {
            this._executePassV3(player, bestPassTarget, phase);
            return;
        }

        // 3) Tackle by opponent (low probability)
        if (nDef && nDef.dist < 6.5 && Math.random() < 0.035) {
            if (this._attemptTackle(nDef.player, player)) return;
        }

        // 4) DRIBBLE CARRY — phase/role driven! (V3: NEVER dribble in place!)
        this._dribbleV3(player, goalX, moveDir, phase, underPressure, isWinger, distToGoal, nDef, effectSpeed);
    }

    _gkAI(gk) {
        const under = this._isUnderPressure(gk);
        const tid = gk.teamId;
        const isHome = tid === 'home';
        gk.vx *= 0.3; gk.vy *= 0.3;
        const homeX = gk.baseX || (isHome ? 5 : 95);
        gk.x += (homeX - gk.x) * 0.25 + gk.vx;
        gk.y += (clamp(50 + (this.ball.y - 50) * 0.08, 42, 58) - gk.y) * 0.25 + gk.vy;
        if (this.ball.owner === gk) { this.ball.x = gk.x; this.ball.y = gk.y; }
        const mates = this.players.filter(p => p.teamId === tid && p !== gk);
        const dfs = mates.filter(p => p.position === 'DF');
        let target = null;
        if (dfs.length) {
            target = dfs.slice().sort((a, b) => {
                const ap = ['CD', 'BPD', 'NCB'].includes(a.role) ? 0 : 1;
                const bp = ['CD', 'BPD', 'NCB'].includes(b.role) ? 0 : 1;
                if (ap !== bp) return ap - bp;
                return Math.hypot(a.x - gk.x, a.y - gk.y) - Math.hypot(b.x - gk.x, b.y - gk.y);
            })[0];
        }
        if (!target) target = mates.find(p => p.position === 'MF') || mates[0];
        if (target) { this._executePassV3(gk, target, 'building'); return; }
    }

    _isUnderPressure(player) {
        return this.players.some(p => p.teamId !== player.teamId && Math.hypot(p.x - player.x, p.y - player.y) < 8);
    }

    _nearestOpponent(player) {
        let best = null, bd = 9999;
        for (const p of this.players) {
            if (p.teamId === player.teamId) continue;
            if (p.position === 'GK') continue;
            const d = Math.hypot(p.x - player.x, p.y - player.y);
            if (d < bd) { bd = d; best = p; }
        }
        return best ? { player: best, dist: bd } : null;
    }

    // ─────────────────────────────────────────────────────────────
    //  PASS SCORING + PROBABILITY V3 (FLOW AWARE!)
    // ─────────────────────────────────────────────────────────────
    _scorePass(from, to, phase) {
        const isHome = from.teamId === 'home';
        const tid = from.teamId;
        const goalX = isHome ? 100 : 0;
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        const dFromGoal = Math.abs(from.x - goalX);
        const dToGoal = Math.abs(to.x - goalX);
        const forward = dToGoal < dFromGoal - 1;
        const back = dToGoal > dFromGoal + 4;
        const later = !forward && !back;
        const fromUnderPressure = this.players.some(opp =>
            opp.teamId !== tid &&
            opp.position !== 'GK' &&
            Math.hypot(opp.x - from.x, opp.y - from.y) < 7.5
        );

        // Lane check
        let laneBlock = 0;
        for (const opp of this.players) {
            if (opp.teamId === tid) continue;
            if (opp.position === 'GK') continue;
            const tx = to.x - from.x, ty = to.y - from.y;
            const len2 = tx * tx + ty * ty;
            if (len2 < 0.01) continue;
            const t = clamp(((opp.x - from.x) * tx + (opp.y - from.y) * ty) / len2, 0, 1);
            const cx = from.x + t * tx, cy = from.y + t * ty;
            if (Math.hypot(opp.x - cx, opp.y - cy) < 4.5) laneBlock += 1;
        }

        // Space around receiver
        let oppNearRecv = 0;
        for (const opp of this.players) {
            if (opp.teamId === tid || opp.position === 'GK') continue;
            if (Math.hypot(opp.x - to.x, opp.y - to.y) < 9) oppNearRecv++;
        }

        let score = 0;
        // Distance penalty (very short passes ok in buildup, but not spamming)
        if (dist < 5) score -= 8;
        if (dist > 60) score -= 12;
        // [신규] 하프스페이스 간 대각선/횡패스 페널티: Y축 이동이 크고 전진성이 약할수록 감점
        const yShift = Math.abs(to.y - from.y);
        if (yShift > 30 && !forward) score -= 40;
        else if (yShift > 20 && !forward) score -= 20;
        // Direction: huge forward bonus, hard back/lat penalty in final/progress
        if (forward) score += phase === 'building' ? 22 : (phase === 'progressing' ? 35 : 45);
        else if (later) score += (phase === 'building' ? -5 : -10);
        else if (back) {
            // [신규] 압박 탈출용 백패스 (티키타카)
            if (fromUnderPressure && oppNearRecv === 0 && laneBlock === 0 && (to.position === 'DF' || to.position === 'MF')) {
                score += 45; // 압박 갇혔을 때 열려있는 뒤쪽 동료에게 빼면 큰 가산점
            } else {
                // [TUNED] Back passes are dangerous — strong penalty
                if (phase === 'building') score -= 36;
                else if (phase === 'progressing') score -= 62;
                else score -= 78; // finalThird: almost never go back
            }
        }
        // GK never pass target
        if (to.position === 'GK') score -= 120;

        // ⭐⭐ BUILDING PHASE SUBDIVISION: early vs late (fixes buildup stagnation!)
        const isHomeFr = from.teamId === 'home';
        const distFromOwnGoal = isHomeFr ? from.x : (100 - from.x);
        const inLateBuild = (phase === 'building' && distFromOwnGoal >= 22);

        // Prefer position based on phase
        if (phase === 'building') {
            if (inLateBuild && from.position !== 'GK') {
                // Late build-up (x=22~35): behave almost like progressing, push to FW!
                if (to.position === 'FW') score += 42;
                else if (to.position === 'MF') score += 22;
                else if (to.position === 'DF') score += from.position === 'DF' ? 8 : -25;
                if (to._fwMode === 'linkup') score += 22;
            } else {
                // Early build-up (GK/CB area): safe distribution to DF/MF
                if (to.position === 'DF') score += 18;
                else if (to.position === 'MF') score += 35;
                else if (to.position === 'FW') score += 12;
            }
        } else if (phase === 'progressing') {
            if (to.position === 'FW') score += 45;
            else if (to.position === 'MF') score += 15;
            else if (to.position === 'DF') score -= 35;
            // Burst FW trigger → through pass bonus!
            if (to._fwMode === 'burst' && to.burstTimer > 5) score += 60;
            if (to._fwMode === 'linkup') score += 10;
            // FB overlap bonus
            if (to.position === 'DF' && to._fbMode === 'overlap') score += 25;
        } else {
            // finalThird
            if (to.position === 'FW') score += 55;
            else if (to.position === 'MF') score += 10;
            else score -= 60;
            if (to._fwMode === 'burst') score += 75;
            
            // [신규] 측면 크로스 & 컷백 로직
            const isWinger = Math.abs(from.y - 50) > 25;
            if (isWinger && dFromGoal < 25) {
                // 크로스 타겟 (박스 안쪽 깊숙한 곳의 FW)
                if (Math.abs(to.y - 50) < 15 && dToGoal < 15 && to.position === 'FW') {
                    score += 85; 
                }
                // 컷백 타겟 (박스 모서리 부근의 2선 침투 MF나 FW)
                else if (Math.abs(to.y - 50) < 25 && dToGoal >= 15 && dToGoal <= 28) {
                    score += 65; 
                }
            } else {
                // 일반적인 골문 앞 패스 보너스
                if (Math.abs(to.y - 50) < 25 && dToGoal < 20) score += 30;
            }
        }
        // Lane
        if (laneBlock >= 2) score -= 50;
        else if (laneBlock === 1) score -= 20;
        else score += 10;
        // Space
        if (oppNearRecv === 0) score += 30;
        else if (oppNearRecv === 1) score += 10;
        else score -= 15;
        // Rating small
        score += (to.rating - 70) * 0.03;
        // Avoid same-last-owner loops
        if (this.ball.lastOwner === to) score -= 55;
        // Winger cross target: FW inside box → boost
        if (this.getRoleBehavior(from.role).hugLine && dToGoal < 28) {
            if (to.position === 'FW' && Math.abs(to.y - 50) < 35) score += 40;
        }
        // Escape press: favor outlet / diagonal / forward options over lazy backpasses
        if (fromUnderPressure) {
            if (forward) score += 22;
            if (back) score -= 40;  // [TUNED] Under pressure, back pass is very dangerous
            if (later && dist > 8) score += 8;
            if (to.position === 'FW') score += 18;
            else if (to.position === 'MF') score += 12;
            if (oppNearRecv === 0) score += 14;
            if (laneBlock === 0 && dist > 10) score += 10;
            // Bonus for short support pass to free nearby teammate
            if (dist < 12 && oppNearRecv === 0 && !back) score += 12;
        }
        if (phase !== 'finalThird' && to.position === 'DF' && from.position !== 'DF') score -= 10;

        // [NEW] Wing-to-wing pass: from one wide flank to the opposite wide flank
        // (e.g., left winger to right winger) — nearly impossible in real football
        const fromFarLeft  = from.y < 24;
        const fromFarRight = from.y > 76;
        const toFarLeft    = to.y < 24;
        const toFarRight   = to.y > 76;
        const isOppositeFlanks = (fromFarLeft && toFarRight) || (fromFarRight && toFarLeft);
        if (isOppositeFlanks) score -= 85; // Hard veto: cross-field winger-to-winger

        // [NEW] MF as playmaker: when MF has ball, boost pass to FW runs
        if (from.position === 'MF' && to.position === 'FW') {
            score += 12; // MF naturally looks for FW first
            if (to._fwMode === 'burst') score += 20; // Extra if FW is already running
        }

        // [NEW] attackStyle modifiers on pass score
        const atkStyle2 = (typeof gameData !== 'undefined' && gameData.deepTactics) ? (gameData.deepTactics.attackStyle || 'mixed') : 'mixed';
        if (atkStyle2 === 'counter' && forward && (phase === 'counter' || phase === 'progressing')) score += 22;
        if (atkStyle2 === 'possession' && !back) score += 6; // patient: reward safe options
        if (atkStyle2 === 'possession' && back && phase === 'building') score += 8; // recycling is fine
        return score;
    }

    _calcPassProbV3(player, phase, underPressure, isWinger, distToGoal, nDef) {
        const role = player.role;
        const pos = player.position;
        const isCB_def = pos === 'DF' && ['CD', 'BPD', 'NCB'].includes(role);
        const isFB = pos === 'DF' && ['FB', 'WB', 'CWB', 'IWB'].includes(role);
        const ph = player.teamId === 'home' ? player.x : (100 - player.x);
        const lateBuild = (phase === 'building' && ph >= 22);
        let p = 0.4;
        // ⭐ BUILD-UP (GK/CB/MF deep): pass a lot to get out
        if (phase === 'building') {
            if (pos === 'GK') p = 0.99;
            else if (isCB_def) {
                p = underPressure ? 0.96 : (lateBuild ? 0.7 : 0.78);
            } else if (isFB) {
                p = underPressure ? 0.92 : (lateBuild ? 0.4 : 0.55);
            } else if (pos === 'MF') {
                // Late build MF: DRIBBLE through (almost like progressing!)
                p = underPressure ? (lateBuild ? 0.72 : 0.88) : (lateBuild ? 0.34 : 0.55);
            } else {
                p = underPressure ? 0.6 : 0.42;
            }
        } else if (phase === 'progressing') {
            // ⭐⭐ Progressing: DRIBBLE a lot to advance! MF dribble, CB mostly pass
            if (isCB_def) p = 0.9;
            else if (isFB) p = underPressure ? 0.78 : 0.32;  // FB drives!
            else if (pos === 'MF') {
                p = 0.28;  // 72% dribble to advance!
                if (underPressure) p = 0.62;
                // If MF near 65 line → look for FW burst pass → higher prob pass
                const nearFinal = (player.teamId === 'home' && player.x > 62) || (player.teamId === 'away' && player.x < 38);
                if (nearFinal) p += 0.18;
            } else {
                p = 0.25; // FW progressing: drive
                if (underPressure) p = 0.58;
            }
        } else {
            // finalThird: shoot or cross or final pass
            if (isWinger && distToGoal < 30) p = 0.9; // cross
            else if (pos === 'FW') p = 0.28; // mostly shoot/dribble
            else if (pos === 'MF') p = 0.45;
            else p = 0.5;
        }
        const dt = gameData.deepTactics || {};
        if (dt.passTempo === 'fast') p = Math.min(0.98, p + 0.06);
        if (dt.passTempo === 'slow') p = Math.max(0.12, p - 0.06);
        // 메인 전술 반영: tempo 높으면 패스 확률↑(빠른전개), directness 높으면 드리블 대신 전진패스↑
        const profile = this.getTacticProfile(player.teamId);
        p += (profile.tempo - 0.92) * 0.25;
        // [NEW] attackStyle pass probability modifier
        const atkStyle3 = dt.attackStyle || 'mixed';
        if (atkStyle3 === 'counter' && (phase === 'counter' || phase === 'progressing')) p = Math.min(0.98, p + 0.16);
        if (atkStyle3 === 'possession' && phase === 'building') p = Math.min(0.98, p + 0.14);
        if (atkStyle3 === 'possession' && underPressure) p = Math.min(0.98, p + 0.10); // quick release under pressure
        return clamp(p, 0.08, 0.98);
    }

    _scoreCarryChoice(player, phase, underPressure, isWinger, distToGoal, nDef) {
        let score = 0;
        const speed = this.getEffectiveStat(player, 'speed');
        const decision = this.getEffectiveStat(player, 'decision');
        const blockedAhead = this._numOpponentsAhead(player, 10, 18);
        if (phase === 'building') score += player.position === 'MF' ? 24 : 10;
        else if (phase === 'progressing') score += player.position === 'MF' ? 46 : 34;
        else score += player.position === 'FW' ? 42 : 24;
        if (isWinger) score += 14;
        if (player.position === 'FW') score += 10;
        if (player.position !== 'DF' && !underPressure) score += 8;
        if (underPressure) score -= 18;
        if (blockedAhead >= 2) score -= 22;
        else if (blockedAhead === 1) score -= 8;
        if (distToGoal < 28 && player.position !== 'FW') score -= 10;
        score += (speed - 70) * 0.25 + (decision - 70) * 0.18;
        if (nDef && speed > this.getEffectiveStat(nDef.player, 'speed') + 5) score += 12;
        return score;
    }

    _executePassV3(from, to, phase) {
        this.ball.state = BallState.IN_FLIGHT;
        this.ball._flightOrigin = { x: from.x, y: from.y };
        this.ball.lastOwner = from;
        this.ball.intendedReceiver = to;
        this.ball.owner = null;
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        const tid = from.teamId;
        const goalX = tid === 'home' ? 100 : 0;
        const dToGoalTo = Math.abs(to.x - goalX);
        const dToGoalFr = Math.abs(from.x - goalX);
        const isBehind = this._isReceiverBehindDefLine(from, to);

        // V3: record in attack memory!
        const idx = (this._attackMemIdx[tid]++) % 8;
        this._attackMemories[tid][idx] = { fromId: from.id, toId: to.id, x: to.x, t: this.matchTime * 100 + Date.now() % 100 };

        let passKind = 'safe';
        const isThrough = isBehind && dToGoalFr > dToGoalTo + 5 && dist > 10 && dist < 45;
        // [신규] 크로스 판정 범위 확대
        const isCross = Math.abs(from.y - 50) > 25 && Math.abs(to.y - 50) < 30 && dToGoalTo < 25 && dToGoalFr > 15;
        if (isThrough) passKind = 'risky';
        else if (isCross) passKind = 'cross';
        else if (dist > 30) passKind = 'lateral_long';
        
        this.ball.isCross = isCross; // 수신자가 공중볼 경합이나 다이렉트 헤딩을 할 수 있도록 플래그 저장

        // accuracy
        let acc = this.getEffectiveStat(from, 'passing');
        if (to._fwMode === 'burst' && to.burstTimer > 0) acc += 25;
        if (isCross) acc += this.getRoleBehavior(from.role).hugLine ? 15 : -5;
        let distPen = Math.max(0, (dist - 20) * 0.7);
        if (passKind === 'risky') distPen *= 1.4;
        if (passKind === 'safe') distPen *= 0.7;
        if (from.position === 'GK' && dist > 40) distPen += 15;
        const success = Math.random() * 100 <= clamp(acc - distPen + (isThrough ? 6 : 0), 20, 99);

        if (success) {
            const lead = isThrough || (dist > 24 && (to.position === 'FW' || to._fwMode === 'burst')) ? 6 : 0;
            const moveDir = to.teamId === 'home' ? 1 : -1;
            this.ball.targetPos = {
                x: clamp(to.x + moveDir * lead, 2, 98),
                y: clamp(to.y + (to.slotY - to.y) * 0.2, 2, 98)
            };
            if (isThrough) this.eventsQueue.push({ type: 'throughpass', from: from.name, to: to.name, desc: `⚡ ${from.name}, 결정적 스루패스!` });
            else if (isCross) this.eventsQueue.push({ type: 'pass', from: from.name, to: to.name, desc: `↗️ ${from.name}, 크로스 올립니다!` });
            else this.eventsQueue.push({ type: 'pass', from: from.name, to: to.name, desc: `${from.name}, ${to.name}에게 연결!` });
        } else {
            const err = dist * 0.22;
            const a = Math.random() * Math.PI * 2;
            const ed = Math.random() * err + 4;
            this.ball.targetPos = { x: clamp(to.x + Math.cos(a) * ed, 2, 98), y: clamp(to.y + Math.sin(a) * ed, 2, 98) };
            const ev = isThrough ? 'throughpass' : 'pass';
            const desc = isThrough ? `${from.name}의 스루패스가 차단됩니다.` : `${from.name}, 패스 미스!`;
            this.eventsQueue.push({ type: ev, from: from.name, to: to.name, desc });
        }
    }

    _isReceiverBehindDefLine(from, to) {
        const isHome = from.teamId === 'home';
        const lim = this._calcOffsideLineX(isHome);
        return isHome ? to.x > lim : to.x < lim;
    }

    // ─────────────────────────────────────────────────────────────
    //  DRIBBLE V3 (NEVER STOP!)
    // ─────────────────────────────────────────────────────────────
    _dribbleV3(player, goalX, moveDir, phase, underPressure, isWinger, distToGoal, nDef, effSpeed) {
        const sf = effSpeed / 75;
        const isBlockedFront = this._isFrontalBlocked(player, goalX);
        const canOutrun = nDef ? (effSpeed > (this.getEffectiveStat(nDef.player, 'speed') + 6)) : true;
        let targetX, targetY, moveSpd;

        if (isWinger) {
            // Winger: sprint along touchline
            targetX = player.x + moveDir * 55;
            targetY = player.y < 50 ? 8 : 92;
            moveSpd = 0.85 * clamp(sf, 0.8, 1.8);
            if (distToGoal < 35) { moveSpd *= 0.85; }
        } else if (player.position === 'FW' && !underPressure && distToGoal < 65) {
            // FW drive: attack diagonal towards goal
            targetX = player.x + moveDir * 65;
            targetY = clamp(player.y + (player.y < 50 ? 8 : -8), 12, 88);
            moveSpd = 0.9 * clamp(sf, 0.85, 1.95);
        } else if (underPressure || isBlockedFront) {
            // [버그 픽스] 벌벌 떠는 현상(Trembling) 방지: 수비수와의 Y축 거리가 너무 가까울 때는 
            // 매 프레임마다 evadeSign이 반전되어 위아래로 진동하는 것을 막기 위해 기존 vy 방향을 우선하거나, 중앙을 향하도록 고정.
            let evadeSign = 1;
            if (nDef) {
                if (Math.abs(nDef.player.y - player.y) < 1.5) {
                    evadeSign = (player.vy !== 0 && Math.abs(player.vy) > 0.1) ? Math.sign(player.vy) : (player.y < 50 ? 1 : -1);
                } else {
                    evadeSign = nDef.player.y > player.y ? -1 : 1;
                }
            } else {
                evadeSign = player.y < 50 ? 1 : -1;
            }

            if (canOutrun) {
                // Outrun diagonally away from nearest defender
                targetX = player.x + moveDir * 42;
                targetY = player.y + evadeSign * 12;
                moveSpd = 0.78 * clamp(sf, 0.8, 1.8);
            } else {
                // side step then still forward
                targetY = player.y + evadeSign * 10;
                targetX = player.x + moveDir * 28;
                moveSpd = 0.7 * clamp(sf, 0.75, 1.7);
            }
        } else if (phase === 'progressing') {
            // Progressing: push hard forward
            targetX = player.x + moveDir * 52;
            targetY = clamp(player.y + (player.y < 50 ? 6 : -6), 8, 92);
            moveSpd = 0.78 * clamp(sf, 0.8, 1.8);
        } else if (phase === 'building') {
            // Building: walk forward
            targetX = player.x + moveDir * 32;
            targetY = clamp(player.y + (player.y < 50 ? 4 : -4), 10, 90);
            moveSpd = 0.55 * clamp(sf, 0.7, 1.5);
        } else {
            // finalThird: push to byline or shoot area
            targetX = player.x + moveDir * 40;
            targetY = clamp(player.y + (player.y < 50 ? 6 : -6), 10, 90);
            moveSpd = 0.75 * clamp(sf, 0.78, 1.8);
        }

        // NO BACKWARD DRIBBLING: prevent backward movement, but respect pitch boundary clamp
        // [BUG FIX] When player.x is near 97-98, forcing x+6 would exceed clamp(97), creating
        // a targetX < player.x situation that causes physics oscillation at the goal line.
        const boundX_hi = 97, boundX_lo = 3;
        if (moveDir === 1) targetX = Math.min(boundX_hi, Math.max(targetX, Math.min(player.x + 6, boundX_hi)));
        else targetX = Math.max(boundX_lo, Math.min(targetX, Math.max(player.x - 6, boundX_lo)));

        // Final MF unstuck! If player near MF band edge and free ahead, let pass through
        const isMF = player.position === 'MF';
        const nearBand = (player.teamId === 'home' && player.x > 82 && targetX > player.x)
            || (player.teamId === 'away' && player.x < 18 && targetX < player.x);
        if (isMF && nearBand && !underPressure && !this._numOpponentsAhead(player, 10, 18)) {
            targetX += moveDir * 12; // let break through
        }

        targetX = clamp(targetX, 3, 97);
        targetY = clamp(targetY, 4, 96);

        this._physicsStep(player, targetX, targetY, moveSpd);

        this.ball.x = player.x; this.ball.y = player.y;
        this.ball.lastOwner = null;
        if (Math.random() < 0.26) this.eventsQueue.push({ type: 'dribble', player: player.name });
    }

    _isFrontalBlocked(player, goalX) {
        const isHome = player.teamId === 'home';
        const checkX = isHome ? player.x + 10 : player.x - 10;
        return this.players.some(p =>
            p.teamId !== player.teamId && p.position !== 'GK' &&
            Math.abs(p.x - checkX) < 10 && Math.abs(p.y - player.y) < 10
        );
    }

    _numOpponentsAhead(player, xAhead, yBand) {
        const isHome = player.teamId === 'home';
        const cx = isHome ? player.x + xAhead : player.x - xAhead;
        let n = 0;
        for (const p of this.players) {
            if (p.teamId === player.teamId || p.position === 'GK') continue;
            if (Math.abs(p.x - cx) < 15 && Math.abs(p.y - player.y) < yBand) n++;
        }
        return n;
    }

    // ─────────────────────────────────────────────────────────────
    //  SHOOT / TACKLE
    // ─────────────────────────────────────────────────────────────
    _shootChance(player, goalX, dToGoal) {
        // Angle block
        const isBlockAngle = dToGoal < 40 && this.players.some(o => {
            if (o.teamId === player.teamId) return false;
            const d = Math.hypot(o.x - player.x, o.y - player.y);
            if (d > 14) return false;
            const dot = (goalX - player.x) * (o.x - player.x) + (50 - player.y) * (o.y - player.y);
            const m1 = Math.hypot(goalX - player.x, 50 - player.y);
            const ang = Math.acos(clamp(dot / (m1 * d + 0.001), -1, 1));
            return ang < 0.3;
        });
        if (isBlockAngle && dToGoal > 16 && player.position !== 'FW' && Math.random() < 0.5) return 0;

        // ⭐ 신규: 각도 페널티 (모든 포지션 공통 적용, 폭이 크면 슈팅 확률 급감)
        const dY = Math.abs(player.y - 50);
        const shotAngle = Math.atan2(dY, Math.max(1, dToGoal));
        let angleFactor = 1.0;
        if (shotAngle > 1.1) angleFactor = 0.15;
        else if (shotAngle > 0.85) angleFactor = 0.4;
        else if (shotAngle > 0.6) angleFactor = 0.7;
        else if (shotAngle > 0.4) angleFactor = 0.9;
        // [BUG FIX] Very close to goal line: angle matters much less (can still tap in)
        if (dToGoal <= 8) angleFactor = Math.max(angleFactor, 0.5);

        let b = 0;
        // [MODE-AWARE] In fast-forward the goal rate is already fine.
        // Only boost shoot chance in normal (real-time) mode to prevent perpetual 0:0.
        const _isFastFwd = (typeof window !== 'undefined' && window.currentMatchData) ? !!window.currentMatchData.isFastForward : false;
        const _shootMult = _isFastFwd ? 1.0 : 1.35; // ~+35% only in normal mode
        if (dToGoal < 14) b = 0.99;
        else if (dToGoal < 22) b = clamp(1 / dToGoal * 30, 0.14, 0.92);
        else if (dToGoal < 32) b = clamp(1 / dToGoal * 14, 0.08, 0.32); // [TUNED] Long range: reduced
        else if (dToGoal < 40) b = clamp(1 / dToGoal * 5,  0.02, 0.10); // [TUNED] Very long: rare
        else if (dToGoal < 48) b = 0.03; // [TUNED] Only top-stat players will try from here
        b *= _shootMult;

        if (player.position === 'FW') b *= 1.5;

        b *= angleFactor; // ⭐ 각도 반영

        return Math.min(b, 0.98);
    }

    _attemptShoot(shooter, goalX) {
        const opp = shooter.teamId === 'home' ? 'away' : 'home';
        const gk = this.players.find(p => p.teamId === opp && p.position === 'GK');
        const gkV = gk ? this.getEffectiveStat(gk, 'defense') : 60;
        const d = Math.abs(shooter.x - goalX);
        const dF = clamp(0.7, 1.35 - d / 45, 1.35);
        const dY = Math.abs(shooter.y - 50);
        let aF = 1.0;
        if (dY > 10) {
            const ang = Math.atan2(dY, Math.max(1, d));
            aF = ang > 1.2 ? 0.12 : ang > 0.9 ? 0.38 : ang > 0.6 ? 0.7 : 0.9;
        }
        const effSh = this.getEffectiveStat(shooter, 'shooting');
        const sp = effSh * (0.8 + Math.random() * 0.4) * dF * aF;
        const sv = gkV * (0.8 + Math.random() * 0.4) + 5; // [TUNED] Restored some GK dominance
        // [TUNED] Base lowered from 0.52 to 0.40. Scale lowered from 0.009 to 0.0075.
        // Floor lowered to 0.15. This is halfway between the original (0.35) and the extreme (0.52).
        const goalChance = clamp(0.40 + (sp - sv) * 0.0075, 0.15, 0.95);
        this.ball.state = BallState.IN_FLIGHT;
        this.ball._flightOrigin = { x: shooter.x, y: shooter.y };
        this.ball.owner = null;
        this.ball.targetPos = { x: goalX, y: 42 + Math.random() * 16 };
        this.pendingShot = { isGoal: Math.random() < goalChance, shooter, goalX };
    }

    _handleShotResult() {
        const { isGoal, shooter, goalX } = this.pendingShot;
        this.pendingShot = null;
        if (isGoal) {
            if (shooter.teamId === 'home') this.homeScore++;
            else this.awayScore++;
            const isHome = shooter.teamId === 'home';
            const myS = isHome ? this.homeScore : this.awayScore;
            const opS = isHome ? this.awayScore : this.homeScore;
            const ast = (this.ball.lastOwner && this.ball.lastOwner.teamId === shooter.teamId && this.ball.lastOwner.name !== shooter.name)
                ? this.ball.lastOwner.name : null;
            
            this.celebrationActor = shooter;
            if (myS < opS) {
                this.celebrationType = 'quick_restart';
                this.celebrationTarget = { x: 50, y: 50 };
                this.celebrationTimer = 40;
            } else {
                const types = ['corner_slide', 'camera', 'dance', 'manager_hug', 'run_around', 'center_slide', 'inside_goal', 'siu'];
                this.celebrationType = types[Math.floor(Math.random() * types.length)];
                
                if (this.celebrationType === 'manager_hug') { this.celebrationTarget = { x: isHome ? 35 : 65, y: 5 }; this.celebrationTimer = 140; }
                else if (this.celebrationType === 'center_slide') { this.celebrationTarget = { x: 50, y: 50 }; this.celebrationTimer = 110; }
                else if (this.celebrationType === 'inside_goal') { this.celebrationTarget = { x: isHome ? 98 : 2, y: 50 }; this.celebrationTimer = 90; }
                else if (this.celebrationType === 'camera' || this.celebrationType === 'dance') { this.celebrationTarget = { x: shooter.x, y: shooter.y < 50 ? 5 : 95 }; this.celebrationTimer = 120; }
                else if (this.celebrationType === 'siu') { this.celebrationTarget = { x: isHome ? 100 : 0, y: shooter.y < 50 ? 0 : 100 }; this.celebrationTimer = 130; }
                else if (this.celebrationType === 'run_around') { this.celebrationTarget = { x: 50, y: 50 }; this.celebrationTimer = 150; }
                else { this.celebrationTarget = { x: isHome ? 100 : 0, y: shooter.y < 50 ? 0 : 100 }; this.celebrationTimer = 100; } // corner_slide
                
                this.celebrationState = 0;
            }
            this.eventsQueue.push({ type: 'goal', scorer: shooter.name, team: shooter.teamId, assister: ast });
            this.lastScorerTeam = shooter.teamId;
            this.ball.state = BallState.DEAD; this.ball.lastOwner = null;
        } else {
            shooter.forceReturnTimer = 60;
            const opp = shooter.teamId === 'home' ? 'away' : 'home';
            const isHomeAtt = shooter.teamId === 'home';
            const egk = this.players.find(p => p.teamId !== shooter.teamId && p.position === 'GK');
            const blockers = this.players.filter(p =>
                p.teamId === opp && p.position !== 'GK' &&
                Math.abs(p.x - shooter.x) < 16 && Math.abs(p.y - shooter.y) < 6 &&
                (isHomeAtt ? p.x > shooter.x : p.x < shooter.x)
            );
            if (blockers.length > 0 && Math.random() < 0.12) {
                const bl = blockers[0];
                this.eventsQueue.push({ type: 'block', shooter: shooter.name, blocker: bl.name, desc: `🛡️ ${bl.name}, 몸을 날려 슈팅을 막아냅니다!` });
                this.ball.state = BallState.LOOSE; this.ball.owner = null;
                this.ball.x = bl.x + (isHomeAtt ? -5 : 5); this.ball.y = bl.y + (Math.random() - 0.5) * 16;
                this._triggerTurnover(opp);
                return;
            }
            if (egk) {
                const gkBase = egk.teamId === 'home' ? 5 : 95;
                egk.x = gkBase; egk.y = clamp(this.ball.targetPos.y, 32, 68);
                this.ball.x = egk.x; this.ball.y = egk.y;
                if (Math.random() < 0.18) {
                    this.eventsQueue.push({ type: 'save', shooter: shooter.name, gk: egk.name, desc: `🧤 ${egk.name}, 슈팅을 펀칭!` });
                    this.ball.state = BallState.LOOSE; this.ball.owner = null;
                    this.ball.x = egk.x + (isHomeAtt ? -10 : 10); this.ball.y = egk.y + (Math.random() - 0.5) * 32;
                    this._triggerTurnover(opp);
                } else {
                    this.eventsQueue.push({ type: 'save', shooter: shooter.name, gk: egk.name, desc: `🧤 ${egk.name}, 안정적으로 캐치!` });
                    this.ball.state = BallState.CONTROLLED; this.ball.owner = egk;
                    this.ball.x = egk.x; this.ball.y = egk.y;
                    this._triggerTurnover(opp);
                }
            } else {
                this.eventsQueue.push({ type: 'miss', shooter: shooter.name, desc: `🥅 ${shooter.name}의 슈팅이 벗어납니다!` });
                this.ball.state = BallState.LOOSE;
                this.ball.x = goalX === 0 ? 5 : 95; this.ball.y = 50;
            }
        }
    }

    _attemptTackle(def, att) {
        const tDef = this.getEffectiveStat(def, 'tackle');
        const dAtt = this.getEffectiveStat(att, 'decision');
        const roleBonus = def.position === 'DF' ? 0.05 : (def.position === 'MF' ? 0.02 : 0);
        const p = clamp((tDef - dAtt + 10) * 0.01 + 0.16 + roleBonus, 0.1, 0.62);
        if (Math.random() > p) return false;
        this.ball.state = BallState.CONTROLLED; this.ball.owner = def;
        this.ball.x = def.x; this.ball.y = def.y;
        this.ball.intendedReceiver = null; this.ball.lastOwner = null;
        def._stealCooldown = 16;
        this.eventsQueue.push({ type: 'tackle', player: def.name, desc: `${def.name}, 인터셉트!` });
        this._triggerTurnover(def.teamId);
        return true;
    }

    _triggerTurnover(winningTeamId) {
        this._attackProgressX = { home: 0, away: 0 };
        const losing = winningTeamId === 'home' ? 'away' : 'home';
        const atkStyle = (typeof gameData !== 'undefined' && gameData.deepTactics) ? (gameData.deepTactics.attackStyle || 'mixed') : 'mixed';
        // Auto set counter phase for winner (duration varies by attackStyle)
        this._phase[winningTeamId] = 'counter';
        const counterDuration = atkStyle === 'counter' ? 65 : (atkStyle === 'possession' ? 8 : 30);
        this._phaseTimer[winningTeamId] = counterDuration;
        this._attackMemories[winningTeamId] = new Array(8).fill(null);
        this._attackMemIdx[winningTeamId] = 0;
        // trigger burst for forwards of winning team (more bursts in counter, fewer in possession)
        const burstCount = atkStyle === 'counter' ? 3 : (atkStyle === 'possession' ? 1 : 2);
        const burstDur = atkStyle === 'counter' ? 48 : 28;
        const toBurst = this.players.filter(p => p.teamId === winningTeamId && (p.position === 'FW' || (p.position === 'MF' && this.getRoleBehavior(p.role).runBehind > 0.6)))
            .sort((a, b) => Math.hypot(b.x - (winningTeamId === 'home' ? 100 : 0), b.y - 50) - Math.hypot(a.x - (winningTeamId === 'home' ? 100 : 0), a.y - 50))
            .slice(0, burstCount);
        for (const p of toBurst) { if (p.position === 'FW') { p._fwMode = 'burst'; p.burstTimer = burstDur; p._timer = burstDur; } }
    }

    // ─────────────────────────────────────────────────────────────
    //  BALL FLIGHT STEP + INTERCEPTION
    // ─────────────────────────────────────────────────────────────
    _stepBallFlight() {
        const BS = 4.8; // Slightly faster than original (4.2) but not as extreme as 5.8
        const dx = this.ball.targetPos.x - this.ball.x;
        const dy = this.ball.targetPos.y - this.ball.y;
        const d = Math.hypot(dx, dy);
        if (d <= BS) {
            this.ball.x = this.ball.targetPos.x;
            this.ball.y = this.ball.targetPos.y;
            this.ball.state = BallState.LOOSE;
            if (this.pendingShot) return;
            // Intended receiver auto pickup if close
            const r = this.ball.intendedReceiver;
            if (r && Math.hypot(r.x - this.ball.x, r.y - this.ball.y) < 4.5) { // 약간 판정 반경 넓힘
                // [신규] 크로스 다이렉트 헤더 슈팅
                if (this.ball.isCross && r.position === 'FW') {
                    this.ball.isCross = false;
                    const isHome = r.teamId === 'home';
                    const goalX = isHome ? 100 : 0;
                    
                    // 곧바로 슛 시도 (일반 슈팅 대신 헤더 슛)
                    this._attemptShoot(r, goalX);
                    
                    // 이벤트 메시지를 슛팅 이벤트에 맞춤
                    this.eventsQueue.push({ type: 'shoot', player: r.name, desc: `💥 ${r.name}, 크로스를 받아 다이렉트 헤더 슛!!` });
                    return;
                }

                this.ball.state = BallState.CONTROLLED;
                this.ball.owner = r;
                this.ball.intendedReceiver = null;
                this.ball.isCross = false; // 플래그 초기화
                this.ball.x = r.x; this.ball.y = r.y;
            }
        } else {
            const r = BS / d;
            this.ball.x += dx * r;
            this.ball.y += dy * r;
            this._checkInFlightInterception();
        }
    }

    _checkInFlightInterception() {
        if (this.pendingShot) return;
        const bx = this.ball.x, by = this.ball.y;
        const ox = this.ball._flightOrigin.x, oy = this.ball._flightOrigin.y;
        const tx = this.ball.targetPos.x, ty = this.ball.targetPos.y;
        this.players.forEach(p => {
            if (this.ball.lastOwner && p.teamId === this.ball.lastOwner.teamId) return;
            if (p._stealCooldown > 0) return;
            const db = Math.hypot(p.x - bx, p.y - by);
            if (db > 5.5) return;
            const flx = tx - ox, fly = ty - oy;
            const fL2 = flx * flx + fly * fly;
            let traj = 0;
            if (fL2 > 0.001) traj = clamp(((p.x - ox) * flx + (p.y - oy) * fly) / fL2, 0, 1);
            const nx = ox + traj * flx, ny = oy + traj * fly;
            const prox = Math.hypot(p.x - nx, p.y - ny);
            const ts = this.getEffectiveStat(p, 'tackle') || this.getEffectiveStat(p, 'defense');
            const ss = this.getEffectiveStat(p, 'speed');
            const pB = Math.max(0, (5.5 - prox) / 5.5);
            // [TUNED] Slightly increased interception probability
            const chance = 0.005 + ts / 3800 + ss / 5800 + pB * 0.030;
            if (Math.random() < chance) {
                this.ball.state = BallState.CONTROLLED; this.ball.owner = p;
                this.ball.intendedReceiver = null; this.ball.lastOwner = null;
                p._stealCooldown = 14;
                this.eventsQueue.push({ type: 'tackle', player: p.name, desc: `${p.name}, 날카로운 패스 차단!` });
                this._triggerTurnover(p.teamId);
            }
        });
    }

    _attemptTackle(tackler, carrier) {
        if (tackler._stealCooldown > 0) return false;
        const tackleStat = this.getEffectiveStat(tackler, 'tackle') || this.getEffectiveStat(tackler, 'defense');
        const dribbleStat = this.getEffectiveStat(carrier, 'dribble');
        
        // Probability based on stats
        const chance = 0.2 + (tackleStat - dribbleStat) * 0.005;
        if (Math.random() < clamp(chance, 0.05, 0.85)) {
            // Success
            this.ball.state = BallState.CONTROLLED;
            this.ball.owner = tackler;
            this.ball.lastOwner = null;
            this.ball.intendedReceiver = null;
            tackler._stealCooldown = 18;
            this.eventsQueue.push({ type: 'tackle', player: tackler.name, desc: `🛡️ ${tackler.name}, 깔끔한 태클로 공을 탈취합니다!` });
            this._triggerTurnover(tackler.teamId);
            return true;
        } else {
            // Fail (carrier gets away, tackler cooldown)
            tackler._stealCooldown = 25;
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  OFF-BALL AI V3 (TEMPLATE + TRIGGER BASED)
    // ─────────────────────────────────────────────────────────────
    _processAllOffBall() {
        let attacking = null;
        if (this.ball.owner) attacking = this.ball.owner.teamId;
        else if (this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner) attacking = this.ball.lastOwner.teamId;
        const isLoose = !this.ball.owner && this.ball.state === BallState.LOOSE;
        let nearestH = null, nearestA = null, dH = 999, dA = 999;
        if (isLoose) {
            this.players.forEach(p => {
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (p.teamId === 'home' && d < dH) { dH = d; nearestH = p; }
                if (p.teamId === 'away' && d < dA) { dA = d; nearestA = p; }
            });
        }
        let presser = null;
        if (this.ball.owner && attacking) {
            let mD = 999;
            this.players.forEach(p => {
                if (p.teamId === attacking) return;
                const d = Math.hypot(p.x - this.ball.x, p.y - this.ball.y);
                if (d < mD) { mD = d; presser = p; }
            });
        }
        this.players.forEach(p => {
            if (p === this.ball.owner) return;
            if (p.position === 'GK') { this._gkOffBall(p); return; }

            const behavior = this.getRoleBehavior(p.role);
            const effSpd = this.getEffectiveStat(p, 'speed');
            const speedFactor = effSpd / 75;
            const isHome = p.teamId === 'home';
            const fwd = isHome ? 1 : -1;
            const oppHas = this.ball.owner && this.ball.owner.teamId !== p.teamId;
            const oppInFlight = this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner && this.ball.lastOwner.teamId !== p.teamId;
            const isDefending = oppHas || oppInFlight;
            const isAttacking = !isDefending && (p.teamId === attacking);

            let tx = p.x, ty = p.y, ms = 0.2 * clamp(speedFactor, 0.7, 1.5);

            if (isLoose) {
                const lines = this._getTeamBlockLines(p.teamId);
                const nr = (p === nearestH || p === nearestA);
                if (nr) { tx = this.ball.x; ty = this.ball.y; ms = 0.6; }
                else {
                    tx = p.position === 'FW' ? lines.fwX : (p.position === 'MF' ? lines.mfX : lines.dfX);
                    ty = p.slotY + (this.ball.y - p.slotY) * 0.12;
                    ms = 0.2;
                }
                this._physicsStep(p, tx, ty, ms);
                return;
            }

            if (this.ball.state === BallState.IN_FLIGHT && p === this.ball.intendedReceiver) {
                tx = this.ball.targetPos.x; ty = this.ball.targetPos.y; ms = 0.85;
                this._physicsStep(p, tx, ty, ms); return;
            }

            if (this.ball.state === BallState.IN_FLIGHT && this.ball.lastOwner === p && p.position !== 'DF') {
                const lines = this._getTeamBlockLines(p.teamId);
                const chaseX = p.position === 'FW' ? lines.fwX - fwd * 3 : lines.mfX - fwd * 1;
                tx = isHome ? Math.min(p.x + 8, chaseX) : Math.max(p.x - 8, chaseX);
                ty = p.slotY + (this.ball.y - p.slotY) * 0.18;
                ms = 0.28;
                this._physicsStep(p, tx, ty, ms); return;
            }

            if (isAttacking) {
                // ⭐ V3: Template based movement!
                if (p.position === 'FW') this._offBallFW_V3(p, isHome, fwd, behavior, speedFactor);
                else if (p.position === 'MF') this._offBallMF_V3(p, isHome, fwd, behavior, speedFactor, attacking);
                else if (p.position === 'DF') this._offBallDF_V3(p, isHome, fwd, behavior, speedFactor, attacking);
                return;
            } else if (isDefending) {
                this._offBallDefend_V3(p, presser, isHome, speedFactor, ms, behavior);
                return;
            }
            this._physicsStep(p, tx, ty, ms);
        });
    }

    _gkOffBall(gk) {
        const isHome = gk.teamId === 'home';
        const homeX = gk.baseX || (isHome ? 5 : 95);
        gk.vx *= 0.3; gk.vy *= 0.3;
        gk.x += (homeX - gk.x) * 0.2 + gk.vx;
        gk.y += (clamp(50 + (this.ball.y - 50) * 0.08, 42, 58) - gk.y) * 0.2 + gk.vy;
    }

    // ═══════════════════════════════════════════════════════════════
    //  OFF-BALL FW V3 (trigger-based modes: shadow / burst / linkup)
    // ═══════════════════════════════════════════════════════════════
    _offBallFW_V3(p, isHome, fwd, bhv, sf) {
        const tid = p.teamId;
        const phase = this._phase[tid];
        const lines = this._getTeamBlockLines(tid);
        const oppDFs = this.players.filter(q => q.teamId !== tid && q.position === 'DF' && q.position !== 'GK');
        const teamFWs = this.players
            .filter(q => q.teamId === tid && q.position === 'FW' && q !== this.ball.owner)
            .slice()
            .sort((a, b) => {
                const ra = this.getRoleBehavior(a.role);
                const rb = this.getRoleBehavior(b.role);
                const runDiff = (rb.runBehind + rb.attackBias * 0.3) - (ra.runBehind + ra.attackBias * 0.3);
                if (Math.abs(runDiff) > 0.02) return runDiff;
                return Math.abs(a.slotY - this.ball.y) - Math.abs(b.slotY - this.ball.y);
            });
        const fwRank = Math.max(0, teamFWs.indexOf(p));
        const isPrimaryRunner = fwRank === 0;
        // Opponent defensive line x
        let defLineX = isHome ? (oppDFs.length ? Math.min(...oppDFs.map(q => q.x)) : 80) : (oppDFs.length ? Math.max(...oppDFs.map(q => q.x)) : 20);
        const offX = this._calcOffsideLineX(isHome);

        // ⭐⭐ PHASE-BASED ABS_MIN: FW MUST NOT cluster in midfield!
        // (Fixes: V3 bug where both teams FW hung around x=45~46)
        let ABS_MIN;
        if (phase === 'building') {
            ABS_MIN = isHome ? 56 : 44;
        } else if (phase === 'progressing' || phase === 'counter') {
            ABS_MIN = isHome ? 60 : 40;
        } else {
            ABS_MIN = isHome ? 68 : 32;
        }
        // ⭐⭐ ABS_MIN vs Offside Safe-Zone Mediation
        // Rule: if offside line is too deep (opp D-line dropped back), we still
        // don't want FW dropping below a midfield threshold. So we bound:
        //   home ABS_MIN ∈ [ midfieldThreshold=54 , min(phaseABS, offX-5) ]
        //   away ABS_MIN ∈ [ max(phaseABS, offX+5) , midfieldThreshold=46 ]
        // This guarantees FW stays at least 4 units in front of midfield line
        // while still respecting offside physics when possible.
        const MID_THRESH = isHome ? 54 : 46;
        const OFFSIDE_BOUND = isHome ? (offX - 5) : (offX + 5);
        ABS_MIN = isHome
            ? Math.max(Math.min(ABS_MIN, OFFSIDE_BOUND), MID_THRESH)
            : Math.min(Math.max(ABS_MIN, OFFSIDE_BOUND), MID_THRESH);

        // 🟢 BURST TRIGGER (when to run behind)
        if (p._fwMode !== 'burst' && this._fwBurstCooldown <= 0 && isPrimaryRunner) {
            const carriers = this.players.filter(q => q.teamId === tid && this.ball.owner === q);
            const carr = carriers[0];
            // [EXPANDED] Original zone: MF zone (x>62). Now also triggers when carrier is MF position
            // regardless of position — so FWs burst when MF picks up ball in central midfield
            const rightZone = carr && (
                (isHome && carr.x > 62 && carr.x < 80) || (!isHome && carr.x < 38 && carr.x > 20)
            );
            // [NEW] MF carrier zone: even from deep midfield, FW should make runs
            const mfCarrierZone = carr && carr.position === 'MF' && (
                (isHome && carr.x > 50) || (!isHome && carr.x < 50)
            );
            const burstBiasOk = bhv.runBehind > 0.45;
            const phaseOk = phase === 'progressing' || phase === 'finalThird' || phase === 'counter';
            const laneOpen = !this._numOpponentsAhead(p, 8, 16);
            const carrUnder = carr ? this._isUnderPressure(carr) : false;
            if (carr && (rightZone || mfCarrierZone) && burstBiasOk && phaseOk && (laneOpen || carrUnder)) {
                p._fwMode = 'burst';
                p.burstTimer = 32; // slightly longer when triggered by MF
                p._timer = 32;
                this._fwBurstCooldown = 8;
            }
        }
        if (this._fwBurstCooldown > 0) this._fwBurstCooldown--;

        // 🟡 LINKUP TRIGGER (when STUCK and behavior.linkup high)
        if (p._fwMode !== 'linkup' && p._fwMode !== 'burst' && this._fwLinkupCooldown <= 0) {
            const carr = this.ball.owner && this.ball.owner.teamId === tid ? this.ball.owner : null;
            const carrUnder = carr ? this._isUnderPressure(carr) : false;
            if ((this._isAttackStuck(tid) || carrUnder) && bhv.linkup >= 0.6 && !isPrimaryRunner) {
                p._fwMode = 'linkup';
                p._timer = 40;
                this._fwLinkupCooldown = 25;
            }
        }
        if (this._fwLinkupCooldown > 0) this._fwLinkupCooldown--;

        // Mode timeout
        if (p._timer <= 0 && p._fwMode !== 'shadow') { p._fwMode = 'shadow'; }

        let tx, ty, ms = 0.46 * clamp(sf, 0.82, 1.75);

        // ---- Range normalization helpers: ensure lo <= hi before clamp ----
        // (Fixes stuck tx when offside line dropped below ABS_MIN)
        const hh = (v, lo, hi) => { const L = Math.min(lo, hi), H = Math.max(lo, hi); return clamp(v, L, H); };
        const aa = (v, lo, hi) => { const L = Math.min(lo, hi), H = Math.max(lo, hi); return clamp(v, L, H); };

        if (p._fwMode === 'burst') {
            // Sprint behind defensive line, just before offside
            // [TUNED] Push 2 units deeper toward goal for more box penetration
            tx = isHome ? hh(defLineX + 12, 58, offX - 1.5)
                : aa(defLineX - 12, offX + 1.5, 42);
            // Y: slot based + curve towards goal center
            const curve = Math.sin(p._timer * 0.35) * (this.getRoleBehavior(p.role).hugLine ? 3 : 8);
            ty = clamp(p.slotY + curve + (50 - p.slotY) * 0.15,
                p.slotY - 14, p.slotY + 14);
            if (this.getRoleBehavior(p.role).hugLine) ty = p.slotY < 50 ? 10 : 90;
            ms = 0.88 * clamp(sf, 0.9, 1.9);
        } else if (p._fwMode === 'linkup') {
            // Drop between midfield and defense to receive
            const linkBase = isPrimaryRunner ? lines.mfX + fwd * 8 : lines.mfX + fwd * 4;
            const drop = isHome ? Math.max(linkBase, defLineX - 18)
                : Math.min(linkBase, defLineX + 18);
            tx = hh(drop, ABS_MIN + 6, isHome ? 90 : 10);
            ty = clamp(p.slotY * 0.55 + this.ball.y * 0.45, p.slotY - 12, p.slotY + 12);
            ms = 0.48 * clamp(sf, 0.75, 1.7);
        } else {
            // Shadow mode: DEFENSE LINE SHADOW (1-3 behind D line)
            const sLo = ABS_MIN;
            const sHi = isHome ? Math.max(offX - 2, ABS_MIN) : Math.min(offX + 2, 100 - ABS_MIN);
            // [TUNED] Push shadow position closer to goal: +4 compared to original
            tx = isHome ? hh(defLineX + 1, sLo, sHi)
                : aa(defLineX - 1, 100 - sHi, 100 - sLo);
            // Y: move into channels between CBs + slight follow ball
            const followW = 0.18;
            ty = clamp(p.slotY + (this.ball.y - 50) * followW, p.slotY - 10, p.slotY + 10);
            if (bhv.hugLine) ty = p.slotY < 50 ? 12 : 88;
            ms = 0.34 * clamp(sf, 0.7, 1.5); // slightly faster shadow movement
        }

        // [신규] 측면 돌파 시 크로스 타겟 침투 (FW)
        const carr = this.ball.owner && this.ball.owner.teamId === tid ? this.ball.owner : null;
        const isWingerCrossSituation = carr && Math.abs(carr.y - 50) > 25 && (isHome ? carr.x > 75 : carr.x < 25);
        if (isWingerCrossSituation) {
            // 크로스 타겟을 위해 박스 중앙(골대 앞 6-15야드 부근)으로 쇄도
            const crossTx = isHome ? 91 : 9;
            // 2명의 FW가 있다면 하나는 니어포스트, 하나는 파포스트
            const postOffset = isPrimaryRunner ? (carr.y < 50 ? -8 : 8) : (carr.y < 50 ? 8 : -8);
            const crossTy = 50 + postOffset;
            
            // 기존 tx, ty보다 우선하여 덮어씀
            tx = (tx * 0.3) + (crossTx * 0.7);
            ty = (ty * 0.3) + (crossTy * 0.7);
            ms = 0.7 * clamp(sf, 0.8, 1.8);
        }

        if (!isPrimaryRunner) {
            const supportX = lines.fwX - fwd * (bhv.linkup >= 0.6 ? 6 : 4);
            tx = isHome ? Math.min(tx, supportX) : Math.max(tx, supportX);
            ty = clamp(ty + (this.ball.y - p.slotY) * 0.12, p.slotY - 12, p.slotY + 12);
        } else {
            const leadX = lines.fwX + fwd * 4;
            tx = isHome ? Math.max(tx, leadX) : Math.min(tx, leadX);
        }

        // ABSOLUTE FLOOR
        tx = isHome ? Math.max(tx, ABS_MIN) : Math.min(tx, ABS_MIN);
        tx = clamp(tx, 4, 96);
        ty = clamp(ty, 4, 96);
        this._physicsStep(p, tx, ty, ms);
    }

    // ═══════════════════════════════════════════════════════════════
    //  OFF-BALL MF V3 (SLOT FIXED! NO OVERSATURATION!)
    // ═══════════════════════════════════════════════════════════════
    _offBallMF_V3(p, isHome, fwd, bhv, sf, attackingTeamId) {
        const tid = p.teamId;
        const phase = this._phase[tid];
        const lines = this._getTeamBlockLines(tid);
        const isDM = ['DM', 'CDM', 'ANC'].includes(p.role);
        const isAM = ['AP', 'AM', 'SS', 'BBM', 'MEZ'].includes(p.role);
        const mates = this.players.filter(q => q.teamId === tid && q !== p);
        const advancedMF = this._getAdvancedSupportPlayer(tid, 'MF');

        let tx = lines.mfX;
        if (phase === 'building') tx += fwd * (isDM ? -6 : (isAM ? 2 : 0));
        else if (phase === 'progressing') tx += fwd * (isDM ? -2 : (isAM ? 6 : 2));
        else if (phase === 'finalThird') tx += fwd * (isDM ? 1 : (isAM ? 10 : 4));
        else tx += fwd * (isDM ? 0 : 5);
        if (lines.haveBall) {
            if (!isDM) tx += fwd * (isAM ? 4 : 3);
            if (phase === 'progressing' || phase === 'finalThird') tx += fwd * 2;
            if (advancedMF === p && !isDM) tx += fwd * (phase === 'building' ? 2 : 5);
        }

        // 🛑 MF HARD STOP: Must stay BEHIND frontmost FW!
        const fws = mates.filter(q => q.position === 'FW');
        if (fws.length) {
            const fwXs = fws.map(q => q.x);
            const limit = isHome ? Math.max(Math.min(...fwXs) - 8, 0)
                : Math.min(Math.max(...fwXs) + 8, 100);
            tx = isHome ? Math.min(tx, limit) : Math.max(tx, limit);
        } else {
            const mx = isHome ? 84 : 16;
            tx = isHome ? Math.min(tx, mx) : Math.max(tx, mx);
        }

        // DM: Always 5 behind highest CB
        const cbs = mates.filter(q => q.position === 'DF' && ['CD', 'BPD', 'NCB', 'LIB'].includes(q.role));
        if (isDM && cbs.length) {
            const hiCB = isHome ? Math.max(...cbs.map(q => q.x)) : Math.min(...cbs.map(q => q.x));
            tx = isHome ? Math.min(tx, hiCB + 7) : Math.max(tx, hiCB - 7);
        }

        // ⭐⭐ Y: USE ASSIGNED SLOT! (no ball.y clustering!)
        let ty = p.slotY;  // <— THIS IS THE FIX! MF ALWAYS goes to its slot first!
        // Only the MF CLOSEST to ball's Y gets +-6 toward ball
        const teamMFs = this.players.filter(q => q.teamId === tid && q.position === 'MF');
        const closestToBallY = teamMFs.slice().sort((a, b) => Math.abs(a.slotY - this.ball.y) - Math.abs(b.slotY - this.ball.y))[0];
        if (closestToBallY === p && !bhv.hugLine) {
            ty += clamp(this.ball.y - ty, -8, 8);
            tx += fwd * (phase === 'building' ? 2 : 5);
        }
        if (bhv.hugLine) ty = p.slotY < 50 ? 12 : 88;

        // FB overlap trigger: if attacking FB overlap, inside MF slides out? (simpler: MEZ/CM slight shift)
        if (bhv.cutInside || p.role === 'MEZ') {
            ty = 50 + (p.slotY - 50) * 0.45;
        }

        // [NEW] Support run: if ball carrier is isolated (under pressure), nearby MF drifts closer
        // to offer a short pass outlet — prevents dangerous backpasses
        const ballOwner = this.ball.owner;
        if (ballOwner && ballOwner.teamId === tid && ballOwner !== p) {
            const carrierIsolated = this._isUnderPressure(ballOwner);
            const distToCarrier = Math.hypot(p.x - ballOwner.x, p.y - ballOwner.y);
            const noForwardFree = this._numOpponentsAhead(ballOwner, 8, 18) >= 3;
            if (carrierIsolated && noForwardFree && distToCarrier > 6 && distToCarrier < 22) {
                // Move to a support position: slightly behind & to the side of the carrier
                const supportX = isHome ? Math.min(ballOwner.x - 3, tx) : Math.max(ballOwner.x + 3, tx);
                const supportY = p.slotY + (ballOwner.y - p.slotY) * 0.5;
                tx = tx * 0.45 + supportX * 0.55;
                ty = ty * 0.55 + supportY * 0.45;
            }
        }

        // [신규] 측면 돌파 시 컷백 타겟 침투 (MF - 특히 공격형 미드필더 AM, SS 등)
        const carr = this.ball.owner && this.ball.owner.teamId === tid ? this.ball.owner : null;
        const isWingerCrossSituation = carr && Math.abs(carr.y - 50) > 25 && (isHome ? carr.x > 75 : carr.x < 25);
        if (isWingerCrossSituation && (isAM || p.role === 'CM')) {
            // 박스 외곽(아크 서클 부근)으로 침투하여 컷백 대기
            const cutbackTx = isHome ? 80 + Math.random() * 5 : 20 - Math.random() * 5;
            const cutbackTy = clamp(carr.y < 50 ? 35 : 65, 30, 70); // 윙어와 가까운 하프스페이스 쪽 모서리
            
            tx = (tx * 0.4) + (cutbackTx * 0.6);
            ty = (ty * 0.4) + (cutbackTy * 0.6);
        }

        let ms = 0.38 * clamp(sf, 0.7, 1.6);
        tx = clamp(tx, 4, 96);
        ty = clamp(ty, 4, 96);
        this._physicsStep(p, tx, ty, ms);
    }

    // ═══════════════════════════════════════════════════════════════
    //  OFF-BALL DF V3 (compact block + FB overlap state machine)
    // ═══════════════════════════════════════════════════════════════
    _offBallDF_V3(p, isHome, fwd, bhv, sf, attackingId) {
        const tid = p.teamId;
        const phase = this._phase[tid];
        const lines = this._getTeamBlockLines(tid);
        const isCB = ['CD', 'BPD', 'NCB', 'LIB'].includes(p.role);
        const isFB = ['FB', 'WB', 'CWB', 'IWB'].includes(p.role);
        const mates = this.players.filter(q => q.teamId === tid && q !== p);
        const teamMFs = mates.filter(q => q.position === 'MF');
        const mfFront = teamMFs.length
            ? (isHome ? Math.max(...teamMFs.map(q => q.x)) : Math.min(...teamMFs.map(q => q.x)))
            : (isHome ? 45 : 55);

        // FB state choice: deterministic by side/phase instead of random.
        if (isFB) {
            const sameSide = (p.slotY < 50 && this.ball.y < 45) || (p.slotY > 50 && this.ball.y > 55);
            // [FIX] Coordinate both FBs: if the OTHER FB is already overlapping, this one holds back
            // Prevents the "one FB up, one FB down" asymmetric look
            const otherFB = mates.find(q => q.position === 'DF' && ['FB', 'WB', 'CWB', 'IWB'].includes(q.role));
            const otherOverlapping = otherFB && (otherFB._fbMode === 'overlap' || otherFB._fbMode === 'underlap');
            if (phase === 'building') p._fbMode = 'hold';
            else if (otherOverlapping) p._fbMode = 'hold'; // [NEW] If partner FB is up, stay back
            else if (phase === 'finalThird' && sameSide && bhv.attackBias >= 0.5) p._fbMode = 'overlap';
            else if (phase === 'progressing' && sameSide && (bhv.cutInside || p.role === 'IWB')) p._fbMode = 'underlap';
            else if (phase === 'progressing' && sameSide) p._fbMode = 'overlap';
            else p._fbMode = 'hold';
        }

        let tx, ty;
        if (isCB) {
            tx = lines.dfX + fwd * (phase === 'building' ? -2 : 0);
            const mfCap = isHome ? mfFront - 7 : mfFront + 7;
            tx = isHome ? Math.min(tx, mfCap) : Math.max(tx, mfCap);
            tx = clamp(tx, isHome ? 8 : 5, isHome ? 80 : 92);
            ty = p.slotY;
            // Keep 7-15 vertical gap from other CB
            const otherCBs = mates.filter(q => q.position === 'DF' && ['CD', 'BPD', 'NCB', 'LIB'].includes(q.role));
            for (const o of otherCBs) {
                const dY = ty - o.y; const a = Math.abs(dY); const s = dY >= 0 ? 1 : -1;
                if (a < 7) ty = o.y + s * 7;
                else if (a > 18) ty = o.y + s * 18;
            }
            // [TUNED] CB return speed increased so they can run back faster than FBs
            const isRetreating = isHome ? (tx < p.x - 2) : (tx > p.x + 2);
            const cbSpd = isRetreating ? 0.45 : 0.35;
            this._physicsStep(p, tx, ty, cbSpd * clamp(sf, 0.7, 1.5)); return;
        }
        if (isFB) {
            // Y: Keep EXTREME WIDE (never center!)
            ty = p.slotY < 50 ? 10 : 90;
            if (p._fbMode === 'underlap') ty = p.slotY < 50 ? 28 : 72;
            let xShift = 0;
            if (phase === 'building') xShift = 1;
            // [FIX] Hold mode: position at midfield level (between CB and MF), NOT next to CBs
            // The hold FB should look like a defensive MF, not a 3rd CB
            else if (phase === 'progressing') xShift = p._fbMode === 'hold' ? 10 : (p._fbMode === 'overlap' ? 14 : 12);
            else if (phase === 'finalThird') xShift = p._fbMode === 'hold' ? 12 : (p._fbMode === 'overlap' ? 16 : 14);
            else xShift = 9; // counter — don't rush too far forward
            tx = lines.dfX + fwd * xShift;
            const cbLine = mates.filter(q => q.position === 'DF' && ['CD', 'BPD', 'NCB', 'LIB'].includes(q.role));
            const cbMean = cbLine.length
                ? cbLine.reduce((s, q) => s + q.x, 0) / cbLine.length
                : lines.dfX;
            // [FIX] Floor: hold FB must be at LEAST 8 units ahead of CB mean
            // (prevents hold FB from sitting right next to CBs)
            const minAheadCB = isHome ? cbMean + 8 : cbMean - 8;
            tx = isHome ? Math.max(tx, minAheadCB) : Math.min(tx, minAheadCB);
            // FB movement: smoothed, no aggressive sprinting up and down
            tx = clamp(tx, isHome ? 8 : 5, isHome ? 92 : 92);
            const ms = (p._fbMode === 'overlap' ? 0.30 : 0.22) * clamp(sf, 0.65, 1.25);
            this._physicsStep(p, tx, ty, ms); return;
        }
        // Fallback
        this._physicsStep(p, p.baseX, p.slotY, 0.3);
    }

    // ═══════════════════════════════════════════════════════════════
    //  OFF-BALL DEFEND V3 (zone-first + controlled aggro)
    // ═══════════════════════════════════════════════════════════════
    _offBallDefend_V3(p, presser, isHome, sf, ms, bhv) {
        const tid = p.teamId;
        const fwd = isHome ? 1 : -1;
        const lines = this._getTeamBlockLines(tid);
        const dt = gameData.deepTactics || {};
        const profile = this.getTacticProfile(tid);
        // 전술별 압박 성향을 세부설정에 곱연산으로 반영
        let pressInt = dt.pressIntensity || 'mid';
        if (profile.press > 1.05 && pressInt !== 'high') pressInt = 'high';
        else if (profile.press < 0.45 && pressInt !== 'low') pressInt = 'low';
        const ballX = this.ball.x, ballY = this.ball.y;
        const inOwnThird = isHome ? ballX < 33 : ballX > 67;
        const dBall = Math.hypot(p.x - ballX, p.y - ballY);
        const pressIsMe = (presser === p);
        const owner = this.ball.owner;

        if (owner && owner.teamId !== tid && p._stealCooldown <= 0) {
            const tackleRange = p.position === 'DF' ? 4.4 : (p.position === 'MF' ? 4.0 : 3.5);
            const canStep = (p.position === 'DF' && inOwnThird) || pressIsMe || (inOwnThird && p.position === 'MF');
            if (canStep && dBall < tackleRange && this._attemptTackle(p, owner)) return;
        }

        // 1) FW DEFENSE (high press only if intensity high)
        if (p.position === 'FW') {
            p.burstTimer = 0; p._fwMode = 'shadow';
            const tidDFs = this.players.filter(q => q.teamId === tid && q.position === 'DF');
            const dfTop = isHome ? (tidDFs.length ? Math.max(...tidDFs.map(q => q.x)) : 25)
                : (tidDFs.length ? Math.min(...tidDFs.map(q => q.x)) : 75);
            // ⭐ FW must track back with defensive line! (fixes offside line distortion)
            // Home FW max forward x: dfTop + 12 (12 ahead of own deepest CB)
            // Away FW min forward x: dfTop - 12
            const ABS_FW_FWD_LIMIT = isHome ? Math.max(dfTop + 12, lines.fwX - 4) : Math.min(dfTop - 12, lines.fwX + 4);
            let tx, ty, s;
            const tgX = isHome ? Math.max(lines.fwX, dfTop + 10) : Math.min(lines.fwX, dfTop - 10);
            tx = isHome ? Math.max(tgX, 45) : Math.min(tgX, 55);
            if (pressInt === 'high' && dBall < 18 && Math.random() < (bhv.pressBias || 0.5) * 0.7) {
                tx = ballX; ty = ballY; s = 0.5;
            } else {
                ty = p.slotY; s = 0.4;
            }
            this._physicsStep(p, tx, ty, s);
            // Post-clamp: FW can't drift past own defensive track-back limit
            if (isHome) { p.x = Math.min(p.x, ABS_FW_FWD_LIMIT); }
            else { p.x = Math.max(p.x, ABS_FW_FWD_LIMIT); }
            return;
        }

        // 2) MF DEFENSE
        if (p.position === 'MF') {
            const tidDFs = this.players.filter(q => q.teamId === tid && q.position === 'DF');
            const dfTop = isHome ? (tidDFs.length ? Math.max(...tidDFs.map(q => q.x)) : 25) : (tidDFs.length ? Math.min(...tidDFs.map(q => q.x)) : 75);
            const minX = isHome ? Math.max(dfTop + 3, lines.mfX - 4) : Math.min(dfTop - 3, lines.mfX + 4);
            let tx = lines.mfX + fwd * (bhv.defenseBias > 0.8 ? -2 : 0);
            let ty = p.slotY;

            // Selective pressing: ONLY one (presser) MF/FW presses from midfield up, others hold shape
            const canPress = (pressInt === 'high' || (pressInt === 'mid' && !inOwnThird)) && bhv.pressBias > 0.45;
            if (canPress && pressIsMe && dBall < 17) {
                tx = ballX; ty = ballY; ms = 0.55;
            } else if (!inOwnThird && Math.abs(p.slotY - ballY) < 18 && Math.random() < 0.05 * (bhv.pressBias || 0.5)) {
                // Lateral shift toward ball
                ty += clamp(ballY - ty, -10, 10);
                ms = 0.38;
            } else {
                // Hold formation between defensive line and ball line
                const targetLane = (isHome ? ballX - 8 : ballX + 8);
                if (isHome) tx = clamp(tx, minX, Math.max(targetLane, minX));
                else tx = clamp(tx, Math.min(targetLane, minX), minX);
            }
            this._physicsStep(p, clamp(tx, 4, 96), clamp(ty, 4, 96), 0.4 * clamp(sf, 0.7, 1.6));
            return;
        }

        // 3) DF DEFENSE (CB compact, FB aggressive only same-side flank)
        if (p.position === 'DF') {
            const isCB = ['CD', 'BPD', 'NCB', 'LIB'].includes(p.role);
            const isFB_role = ['FB', 'WB', 'CWB', 'IWB'].includes(p.role);
            const tidDFs = this.players.filter(q => q.teamId === tid && q.position === 'DF');
            let tx = lines.dfX;
            // 풀백은 센터백보다 수비 시 덜 내려가도록 오프셋 적용
            if (isFB_role) tx += fwd * 10;
            tx = isHome ? Math.min(tx, p.baseX + 12) : Math.max(tx, p.baseX - 12);
            let ty = p.slotY;
            ms = 0.4 * clamp(sf, 0.7, 1.6);

            if (isCB) {
                // CB: defend line first, only step when ball enters CB corridor.
                const centralThreat = Math.abs(ballY - p.slotY) < 16 || Math.abs(ballY - 50) < 12;
                if (inOwnThird && dBall < 11 && centralThreat) {
                    const stepX = isHome ? Math.min(ballX + 1.0, lines.dfX + 1.5) : Math.max(ballX - 1.0, lines.dfX - 1.5);
                    tx = stepX; ty += clamp(ballY - ty, -4, 4); ms = 0.45;
                } else {
                    // Mark nearest opposite FW if close enough to CB zone
                    const oppFW = this._findMarkTargetForDF(p, 'FW');
                    if (oppFW) {
                        const markW = clamp(0.5 + (inOwnThird ? 0.3 : 0), 0.3, 0.85);
                        ty = p.slotY * (1 - markW) + oppFW.y * markW;
                        if (Math.abs(oppFW.y - p.slotY) > 22) ty = p.slotY; // Don't chase wide
                        tx = isHome ? Math.max(tx, oppFW.x - 2) : Math.min(tx, oppFW.x + 2);
                    }
                }
                // Keep CB gap (6-17)
                const otherCB = tidDFs.filter(q => q !== p && ['CD', 'BPD', 'NCB', 'LIB'].includes(q.role));
                for (const o of otherCB) {
                    const dY = ty - o.y; const a = Math.abs(dY); const s = dY >= 0 ? 1 : -1;
                    if (a < 6) ty = o.y + s * 6;
                    else if (a > 18) ty = o.y + s * 18;
                }
            } else if (isFB_role) {
                // FB: CHASE only same-side wide dribblers! Never go central!
                const sameSide = (p.slotY < 50 && ballY < 40) || (p.slotY > 50 && ballY > 60);
                const shouldChase = sameSide && ((inOwnThird && dBall < 15) || dBall < 10);
                if (shouldChase) {
                    tx = ballX; ty = clamp(ballY, p.slotY - 10, p.slotY + 10);
                } else {
                    // Mark wide opponents, stay wide!
                    const wingerOpp = this._findMarkTargetForDF(p, 'wide');
                    if (wingerOpp) {
                        ty = p.slotY * 0.5 + clamp(wingerOpp.y, 5, 22) * 0.5;
                        if (p.slotY > 50) ty = p.slotY * 0.5 + clamp(wingerOpp.y, 78, 95) * 0.5;
                    }
                }
                // ⭐ FORCE WIDE: FB never in central 30-70 band when defending!
                ty = clamp(ty, p.slotY < 50 ? 3 : 73, p.slotY < 50 ? 27 : 97);
            }

            this._physicsStep(p, clamp(tx, 2, 90), clamp(ty, 3, 97), ms);
            return;
        }
    }

    _findMarkTargetForDF(p, kind) {
        const opps = this.players.filter(q => q.teamId !== p.teamId && q.position !== 'GK');
        if (kind === 'FW') {
            return opps.filter(o => o.position === 'FW' && Math.abs(o.y - p.slotY) < 25)
                .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || null;
        } else {
            // wide
            return opps.filter(o =>
                ((p.slotY < 50 && o.y < 35) || (p.slotY > 50 && o.y > 65)) &&
                (o.position === 'FW' || o.position === 'MF')
            ).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] || null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  PHYSICS + COLLISION V3 (MINIMAL CLAMPS, SMOOTH)
    // ─────────────────────────────────────────────────────────────
    _physicsStep(p, desiredX, desiredY, accel) {
        const accelEff = clamp(accel, 0.1, 1.8);
        const dx = clamp(desiredX - p.x, -18, 18);
        const dy = clamp(desiredY - p.y, -14, 14);
        const dvx = dx * accelEff * 0.085;
        const dvy = dy * accelEff * 0.085;
        p.vx = p.vx * 0.72 + dvx;
        p.vy = p.vy * 0.72 + dvy;
        const maxSpd = 1.6 + accelEff * 1.25;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > maxSpd) {
            const s = maxSpd / (spd || 1);
            p.vx *= s;
            p.vy *= s;
        }
        p.x += p.vx;
        p.y += p.vy;
        // ONLY clamp for PITCH BOUNDARIES. Position band enforcement done via desiredX only!
        if (p.x < 2) { p.x = 2; if (p.vx < 0) p.vx *= 0.25; }
        if (p.x > 98) { p.x = 98; if (p.vx > 0) p.vx *= 0.25; }
        if (p.y < 2) { p.y = 2; if (p.vy < 0) p.vy *= 0.25; }
        if (p.y > 98) { p.y = 98; if (p.vy > 0) p.vy *= 0.25; }
    }

    _resolveTeammateCollisions() {
        // Pair-wise soft repulsion (prevents all stacking / oversaturation)
        const MIN = 4.8;
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                const a = this.players[i], b = this.players[j];
                if (a.teamId !== b.teamId) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.hypot(dx, dy);
                if (d < MIN && d > 0.01) {
                    const overlap = MIN - d;
                    const nx = dx / d, ny = dy / d;
                    // Push apart — Y preferred to keep X structure
                    a.x -= nx * overlap * 0.3;
                    a.y -= ny * overlap * 0.7;
                    b.x += nx * overlap * 0.3;
                    b.y += ny * overlap * 0.7;
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  DEFENSIVE LINES + OFFSIDE (SMOOTH)
    // ─────────────────────────────────────────────────────────────
    _adjustDefensiveLines() {
        // Defensive line height enforcement for CBs: keep tight band
        for (const tid of ['home', 'away']) {
            const cbs = this.players.filter(p => p.teamId === tid && p.position === 'DF' && ['CD', 'BPD', 'NCB', 'LIB'].includes(p.role));
            if (cbs.length < 2) continue;
            const xs = cbs.map(q => q.x);
            const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
            const maxDev = 6; // CBs max 6 X apart
            const lines = this._getTeamBlockLines(tid);
            for (const cb of cbs) {
                if (Math.abs(cb.x - mean) > maxDev) {
                    // gentle pull toward mean (no hard teleport!)
                    cb.x += (mean - cb.x) * 0.05;
                }
                if (!lines.haveBall) {
                    // Defensive retreat sync: CBs must recover with the line, not hang high
                    cb.x += (lines.dfX - cb.x) * 0.08;
                }
            }
        }
    }

    _calcOffsideLineX(isHomeFW) {
        const opp = isHomeFW ? 'away' : 'home';
        // ⭐⭐⭐ DEFENDERS-ONLY OFFSIDE LINE (realistic + trackback bug immune)
        // FIFA rule = 2nd-to-last player including GK.
        // We use DF + GK pool only: this matches reality because forward players
        // pressing high should NOT artificially flatten the offside trap line.
        // This also removes the offside distortion caused by lazy FWs stuck in midfield.
        const defs = this.players.filter(p =>
            p.teamId === opp && (p.position === 'GK' || p.position === 'DF')
        );
        // If defensive pool too small (e.g. red cards), fall back to all outfield + GK
        let pool;
        if (defs.length >= 2) {
            pool = defs;
        } else {
            pool = this.players.filter(p => p.teamId === opp);
        }
        if (pool.length < 2) return isHomeFW ? 95 : 5;
        const xs = pool.map(p => p.x).slice().sort((a, b) => isHomeFW ? a - b : b - a);
        return xs[1];
    }

    _enforceAllOffside() {
        for (const p of this.players) {
            if (p.position !== 'FW') continue;
            const isHomeFW = p.teamId === 'home';
            const lim = this._calcOffsideLineX(isHomeFW);
            const bad = isHomeFW ? p.x > lim : p.x < lim;
            if (bad) {
                const t = isHomeFW ? lim - 1.5 : lim + 1.5;
                // SMOOTH: accelerate toward line, no teleport!
                p.vx = p.vx * 0.35 + (t - p.x) * 0.28;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    //  CELEBRATION + MISC
    // ─────────────────────────────────────────────────────────────
    _processCelebration() {
        if (!this.celebrationActor) return;
        const a = this.celebrationActor, t = this.celebrationTarget;
        const tx = t.x, ty = t.y;
        this.celebrationState = (this.celebrationState || 0) + 1;
        
        this.players.forEach((p, i) => {
            if (p.teamId === a.teamId) {
                if (p === a) {
                    if (this.celebrationType === 'run_around') {
                        const phase = this.celebrationState;
                        let targetX = 50, targetY = 50;
                        if (phase < 30) { targetX = p.teamId === 'home' ? 100 : 0; targetY = 5; }
                        else if (phase < 60) { targetX = 50; targetY = 5; }
                        else if (phase < 90) { targetX = 50; targetY = 50; }
                        this._physicsStep(p, targetX, targetY, 0.6);
                    } else if (this.celebrationType === 'siu') {
                        if (this.celebrationState < 40) {
                            this._physicsStep(p, tx, ty, 0.6);
                        } else if (this.celebrationState < 60) {
                            const ang = this.celebrationState * 0.5;
                            p.x += Math.cos(ang) * 1.5; p.y += Math.sin(ang) * 1.5;
                        } else {
                            p.vx = 0; p.vy = 0;
                        }
                    } else if (this.celebrationType === 'center_slide' || this.celebrationType === 'corner_slide' || this.celebrationType === 'inside_goal') {
                        if (this.celebrationState < 40) this._physicsStep(p, tx, ty, 0.7);
                        else { p.x += (tx - p.x) * 0.05; p.y += (ty - p.y) * 0.05; }
                    } else {
                        this._physicsStep(p, tx, ty, 0.5);
                    }
                } else if (p.position === 'GK') {
                    // GK stays back and just jumps
                    if (this.celebrationType !== 'quick_restart') {
                        if (this.celebrationState % 12 < 6) p.y -= 0.5; else p.y += 0.5;
                        p.x += (p.baseX - p.x) * 0.1;
                    } else {
                        this._physicsStep(p, p.baseX, p.slotY, 0.4);
                    }
                } else {
                    if (this.celebrationType === 'dance') {
                        if (i % 2 === 0 && i < 10) {
                            const r = 4;
                            const ang = (i * Math.PI) / 3 + this.celebrationState * 0.1;
                            this._physicsStep(p, clamp(tx + Math.cos(ang) * r, 4, 96), clamp(ty + Math.sin(ang) * r, 4, 96), 0.5);
                        } else {
                            const r = 15 + (i % 3) * 5;
                            this._physicsStep(p, clamp(tx + Math.cos(i) * r, 4, 96), clamp(ty + Math.sin(i) * r, 4, 96), 0.2);
                        }
                    } else if (this.celebrationType === 'manager_hug') {
                        if (i % 3 === 0) {
                            const r = 5 + (i%3)*2;
                            this._physicsStep(p, clamp(tx + Math.random()*r - r/2, 4, 96), clamp(ty + Math.random()*r, 4, 96), 0.45);
                        } else {
                            this._physicsStep(p, p.baseX, p.slotY, 0.2);
                        }
                    } else if (this.celebrationType === 'siu') {
                         if (this.celebrationState < 60) {
                            const r = 10 + (i%5)*2;
                            this._physicsStep(p, clamp(a.x + Math.cos(i) * r, 4, 96), clamp(a.y + Math.sin(i) * r, 4, 96), 0.4);
                         } else {
                            if (this.celebrationState % 10 < 5) p.y -= 1; else p.y += 1;
                         }
                    } else if (this.celebrationType === 'quick_restart') {
                         this._physicsStep(p, p.baseX, p.slotY, 0.4);
                    } else {
                        const targetX = (this.celebrationState > 40) ? a.x : tx;
                        const targetY = (this.celebrationState > 40) ? a.y : ty;
                        const r = 8 + Math.random() * 6;
                        const ang = Math.random() * Math.PI * 2;
                        this._physicsStep(p, clamp(targetX + Math.cos(ang) * r, 4, 96), clamp(targetY + Math.sin(ang) * r, 4, 96), 0.45);
                    }
                }
            } else {
                this._physicsStep(p, p.baseX, p.slotY, 0.15);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    //  COMPATIBILITY API (tacticSystem.js hooks)
    // ─────────────────────────────────────────────────────────────
    recalculateStaminaOnSub(playerOut) {
        const userSide = (typeof gameData !== 'undefined' && gameData.isHomeGame) ? 'home' : 'away';
        const lineX = { GK: 5, DF: 22, MF: 45, FW: 72 };
        const targetX = userSide === 'away'
            ? { GK: 95, DF: 78, MF: 55, FW: 28 }[playerOut.position] || 50
            : lineX[playerOut.position] || 50;
        const simP = this.players.find(p =>
            p.teamId === userSide &&
            p.position === playerOut.position &&
            Math.abs(p.baseX - targetX) < 12
        );
        if (simP) simP.stamina = 100;
    }

    applyTacticBoost(userTeamId, boostPercent) {
        this.players.forEach(p => {
            const factor = p.teamId === userTeamId ? (1 + boostPercent) : (1 - boostPercent * 0.6);
            for (const k in p.stats) {
                if (typeof p.stats[k] === 'number') p.stats[k] *= factor;
            }
        });
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

}

// =============================================================================
// [SECTION END]  EXPORTS (window globals — required compatibility!)
// =============================================================================

if (typeof window !== 'undefined') {
    window.RealSoccerEngine = RealSoccerEngine;
    window.DeepTacticManager = DeepTacticManager;
    window.BallState = BallState;
    window.SimBall = SimBall;
    window.SimPlayer = SimPlayer;
}
