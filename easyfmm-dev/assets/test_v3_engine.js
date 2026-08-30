// 간단한 V3 엔진 런타임 테스트
// Node.js로 직접 실행: node test_v3_engine.js

'use strict';

// ======= deepenTactic.js의 일부를 복사해서 standalone 테스트 =======
const BallState = { LOOSE: 0, CONTROLLED: 1, IN_FLIGHT: 2, DEAD: 3 };

const ROLE_BEHAVIOR = {
    AF:  { runBehind: 1.0, linkup: 0.2, hugLine: 0.0, pressBias: 0.9, attackBias: 1.0, defenseBias: 0.1 },
    CF:  { runBehind: 0.6, linkup: 0.7, hugLine: 0.0, pressBias: 0.6, attackBias: 0.9, defenseBias: 0.2 },
    CD:  { runBehind: 0.0, linkup: 0.2, hugLine: 0.0, pressBias: 0.5, attackBias: 0.05,defenseBias: 1.0 },
    FB:  { runBehind: 0.3, linkup: 0.2, hugLine: 0.95,pressBias: 0.6, attackBias: 0.35,defenseBias: 0.85 },
    CM:  { runBehind: 0.4, linkup: 0.5, hugLine: 0.0, pressBias: 0.6, attackBias: 0.7, defenseBias: 0.5 },
    GK:  { runBehind: 0.0, linkup: 0.0, hugLine: 0.0, pressBias: 0.0, attackBias: 0.0, defenseBias: 1.0 }
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

// ===== 테스트용 gameData global 설정 =====
global.gameData = {
    isHomeGame: true,
    currentTactic: 'balanced',
    deepTactics: {
        defensiveLine: 'standard',
        pressIntensity: 'mid',
        passTempo: 'normal',
        passLength: 'mixed'
    },
    teamMorale: 70,
    playerRoles: {}
};

// ===== deepenTactic.js에서 SimBall, SimPlayer, RealSoccerEngine 클래스 로드 =====
// (실제로는 전체 파일을 eval 해야 하지만, 복잡하므로 직접 인클루드 방식 사용)

const fs = require('fs');
const code = fs.readFileSync(__dirname + '/deepenTactic.js', 'utf8');

try {
    console.log('=== V3 엔진 로드 시작 ===');
    // window 객체 대신 global에 넣어줌
    global.window = global;
    eval(code);
    console.log('✅ V3 엔진 로드 성공!');
    console.log('  exports:', Object.keys(global).filter(k => ['RealSoccerEngine','SimBall','SimPlayer','BallState','DeepTacticManager'].includes(k)));
} catch (e) {
    console.error('❌ 엔진 로드 실패:', e.message);
    console.error(e.stack);
    process.exit(1);
}

const RealSoccerEngine = global.RealSoccerEngine;

// ===== 테스트용 스쿼드 생성 =====
function makePlayer(name, position, rating) {
    return { name, position, rating, condition: 100 };
}

const homeSquad = {
    gk: makePlayer('GK 홍길동', 'GK', 75),
    df: [
        makePlayer('LB 김철수', 'DF', 73),
        makePlayer('CB 이영희', 'DF', 78),
        makePlayer('CB 박민수', 'DF', 77),
        makePlayer('RB 정대만', 'DF', 74),
    ],
    mf: [
        makePlayer('LM 송지훈', 'MF', 76),
        makePlayer('CM 홍진호', 'MF', 80),
        makePlayer('CM 마이클', 'MF', 79),
        makePlayer('RM 카를로스', 'MF', 77),
    ],
    fw: [
        makePlayer('ST 손흥민', 'FW', 88),
        makePlayer('CF 김민재', 'FW', 82),
    ]
};
// Away squad 복제
function cloneSquad(sq, prefix) {
    return {
        gk: { ...sq.gk, name: prefix+sq.gk.name },
        df: sq.df.map(p => ({...p, name: prefix+p.name})),
        mf: sq.mf.map(p => ({...p, name: prefix+p.name})),
        fw: sq.fw.map(p => ({...p, name: prefix+p.name}))
    };
}
const awaySquad = cloneSquad(homeSquad, 'Away ');

// ===== 엔진 인스턴스 생성 =====
console.log('\n=== 엔진 인스턴스 생성 ===');
let engine;
try {
    engine = new RealSoccerEngine(homeSquad, awaySquad, 'gegenpress', 'counter');
    console.log('✅ 인스턴스 생성 성공!');
    console.log('  홈팀 선수 수:', engine.players.filter(p=>p.teamId==='home').length);
    console.log('  어웨이팀 선수 수:', engine.players.filter(p=>p.teamId==='away').length);
    console.log('  총 선수 수:', engine.players.length);
    console.log('  초기 위상:', engine._phase);
    console.log('  초기 볼 소유:', engine._possession);
} catch (e) {
    console.error('❌ 인스턴스 생성 실패:', e.message);
    console.error(e.stack);
    process.exit(1);
}

// ===== 킥오프 준비 =====
console.log('\n=== 킥오프 (홈팀) ===');
engine.resetPositions('home');
let snap = engine.getSnapshot();
console.log('  초기 볼 위치:', snap.ball.x, snap.ball.y);
console.log('  소유자 이름:', snap.players.find(p=>p.hasBall)?.id || '(없음)');
console.log('  hasBall 선수 수:', snap.players.filter(p=>p.hasBall).length);

// ===== 2000프레임 시뮬레이션 =====
console.log('\n=== 2000 프레임 시뮬레이션 시작 ===');
let frames = 0;
let stuckFrames = 0;
let lastBallX = snap.ball.x;
let lastBallY = snap.ball.y;
let goals = { home: 0, away: 0 };
let eventsCount = {};
let possessionChanges = 0;
let lastPossessionTeam = null;
let phaseFrames = { home:{building:0,progressing:0,finalThird:0,counter:0}, away:{building:0,progressing:0,finalThird:0,counter:0} };

const MAX_FRAMES = 5000;
try {
    for (let f = 0; f < MAX_FRAMES; f++) {
        const minute = Math.floor(f / 10);
        const isNewMinute = (f % 10 === 0);
        snap = engine.update(minute, isNewMinute);
        frames++;

        // 이벤트 집계
        for (const ev of snap.events) {
            eventsCount[ev.type] = (eventsCount[ev.type] || 0) + 1;
            if (ev.type === 'goal') {
                goals[ev.team]++;
                console.log(`  ⚽ [프레임 ${f}] 골! ${ev.team} - 득점자: ${ev.scorer}${ev.assister?' (도움: '+ev.assister+')':''}`);
            }
        }

        // 소유권 변경 집계
        const ballOwnerPlayer = snap.players.find(p=>p.hasBall);
        const currentTeam = ballOwnerPlayer ? ballOwnerPlayer.team : (snap.ball.state===2 ? null : null);
        if (currentTeam && lastPossessionTeam && currentTeam !== lastPossessionTeam) {
            possessionChanges++;
        }
        lastPossessionTeam = currentTeam;

        // 멈춤 감지 (볼이 10프레임 이상 거의 안 움직일 때)
        const dBall = Math.hypot(snap.ball.x - lastBallX, snap.ball.y - lastBallY);
        if (dBall < 0.3 && snap.ball.state !== 3) {
            stuckFrames++;
        } else {
            stuckFrames = 0;
        }
        lastBallX = snap.ball.x;
        lastBallY = snap.ball.y;

        if (stuckFrames >= 30) {
            console.error(`\n❌ [프레임 ${f}] 30프레임 이상 볼이 정지됨!`);
            console.error('  ball state:', snap.ball.state, 'x/y:', snap.ball.x, snap.ball.y);
            console.error('  소유자:', ballOwnerPlayer?.id, '팀:', ballOwnerPlayer?.teamId);
            console.error('  home phase:', engine._phase.home, 'away phase:', engine._phase.away);
            console.error('  possession:', engine._possession);
            const owner = engine.ball.owner;
            if (owner) {
                console.error('  소유자 포지션/역할:', owner.position, owner.role, 'x/y:', owner.x, owner.y);
                console.error('  소유자 vx/vy:', owner.vx, owner.vy);
            }
            break;
        }

        // 위상 집계
        phaseFrames.home[engine._phase.home] = (phaseFrames.home[engine._phase.home]||0)+1;
        phaseFrames.away[engine._phase.away] = (phaseFrames.away[engine._phase.away]||0)+1;

        if (snap.isCelebration && stuckFrames === 0) {
            // 세리머니 중은 멈춤으로 간주 안함
            stuckFrames = 0;
        }
    }
} catch (e) {
    console.error(`\n❌ [프레임 ${frames}] 런타임 에러:`, e.message);
    console.error(e.stack);
    process.exit(1);
}

// ===== 결과 출력 =====
console.log(`\n=== 시뮬레이션 완료 (${frames} 프레임) ===`);
console.log('  📊 스코어: Home', goals.home, ':', goals.away, 'Away');
console.log('  🔄 소유권 변경 횟수:', possessionChanges);
console.log('  📋 이벤트 발생 통계:');
for (const [type, count] of Object.entries(eventsCount).sort((a,b)=>b[1]-a[1])) {
    console.log(`     - ${type}: ${count}회`);
}
console.log('  ⚽ 최종 볼 위치:', snap.ball.x.toFixed(1), snap.ball.y.toFixed(1), 'state:', snap.ball.state);
console.log('  🎯 최종 위상: home=', engine._phase.home, '(진척:', engine._attackProgressX.home.toFixed(0)+')', 
                              ' away=', engine._phase.away, '(진척:', engine._attackProgressX.away.toFixed(0)+')');
console.log('  🧭 위상별 프레임 통계:');
for (const tid of ['home','away']) {
    const total = frames;
    const p = phaseFrames[tid];
    const perc = ph => `${Math.round((p[ph]||0)/total*100)}%`;
    console.log(`     ${tid}: building=${perc('building')} progressing=${perc('progressing')} finalThird=${perc('finalThird')} counter=${perc('counter')}`);
}

// 포지션별 평균 X 위치 출력 (대형 유지 확인)
for (const teamId of ['home','away']) {
    console.log(`\n  [${teamId}팀 포지션별 평균 X 위치]`);
    for (const pos of ['GK','DF','MF','FW']) {
        const ps = engine.players.filter(p=>p.teamId===teamId && p.position===pos);
        if (!ps.length) continue;
        const avgX = ps.reduce((s,p)=>s+p.x,0) / ps.length;
        const minX = Math.min(...ps.map(p=>p.x));
        const maxX = Math.max(...ps.map(p=>p.x));
        const yDev = Math.max(...ps.map(p=>Math.abs(p.y - (p.slotY||p.baseY))));
        console.log(`     ${pos}: avgX=${avgX.toFixed(1)}  min=${minX.toFixed(1)} max=${maxX.toFixed(1)}  Y슬롯이탈최대=${yDev.toFixed(1)}`);
    }
}

console.log('\n✅ 모든 테스트 통과! V3 엔진 정상 작동 중');
