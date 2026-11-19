// 선수 상세 정보 모달 (별도 페이지 없이 현재 화면 위에 표시)

// ---- 잠재력 범위 시스템 -------------------------------------------------
// 실제 잠재력은 화면에 절대 노출하지 않고, 선수별로 "고정된" 범위만 보여준다.
// - 범위는 최초 조회 시 한 번만 정해져 저장된다(gameData.potentialRanges).
//   → 선수를 계속 열었다 닫아도 값이 바뀌지 않으므로 반복 조회로 실제 값을 좁힐 수 없다.
// - 실제 잠재력이 바뀐 경우(성장 등)에만 다시 계산한다.
// - 범위 폭은 10 (예: 실제 90 → 85~94 처럼 실제 값이 범위 안 임의 위치에 들어간다).
const _potentialFallback = new Map();

function _potentialStore() {
    if (typeof gameData !== 'undefined' && gameData) {
        if (!gameData.potentialRanges) gameData.potentialRanges = {};
        return {
            get: k => gameData.potentialRanges[k],
            set: (k, v) => { gameData.potentialRanges[k] = v; }
        };
    }
    return { get: k => _potentialFallback.get(k), set: (k, v) => _potentialFallback.set(k, v) };
}

function getPotentialRange(player) {
    const real = Number(player.potential);
    if (!isFinite(real) || real <= 0) return null;
    const key = String(player.playerid || player.playerId || player.name);
    const store = _potentialStore();
    let r = store.get(key);
    if (!r || r.real !== real) {
        // 실제 값이 범위 안 어디에 놓일지 무작위 (-2 ~ -7 하단 여유)
        const below = 2 + Math.floor(Math.random() * 6);
        let lo = real - below;
        let hi = lo + 9;
        if (hi > 99) { hi = 99; lo = Math.min(lo, 90); }
        lo = Math.max(40, lo);
        r = { real, lo, hi };
        store.set(key, r);
    }
    return { lo: r.lo, hi: r.hi };
}

// ---- 모달 ------------------------------------------------------------
const _PD_CSS = `
#playerDetailModal { background: rgba(4,7,14,.72); backdrop-filter: blur(6px); overflow-y: auto; }
#playerDetailModal .pd-card { position: relative; width: min(560px, 94vw); margin: 4vh auto; background: linear-gradient(180deg,#151c2b 0%,#0e1320 100%); border: 1px solid rgba(255,255,255,.08); border-radius: 22px; box-shadow: 0 30px 80px rgba(0,0,0,.55); overflow: hidden; color: #e8edf5; animation: pdIn .22s ease; }
@keyframes pdIn { from { opacity: 0; transform: translateY(14px) scale(.98); } to { opacity: 1; transform: none; } }
#playerDetailModal .pd-x { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: rgba(255,255,255,.08); color: #cbd5e1; font-size: 20px; cursor: pointer; z-index: 2; }
#playerDetailModal .pd-x:hover { background: rgba(255,255,255,.18); color: #fff; }
#playerDetailModal .pd-hero { display: flex; gap: 18px; align-items: flex-end; padding: 28px 26px 20px; background: radial-gradient(120% 140% at 0% 0%, var(--pd-accent) 0%, transparent 60%); }
#playerDetailModal .pd-photo { width: 104px; height: 104px; border-radius: 18px; object-fit: cover; object-position: top; background: rgba(255,255,255,.06); flex: none; }
#playerDetailModal .pd-name { font-size: 1.5rem; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; margin: 0 0 6px; }
#playerDetailModal .pd-meta { color: #94a3b8; font-size: .86rem; margin-bottom: 10px; }
#playerDetailModal .pd-tags { display: flex; gap: 6px; flex-wrap: wrap; }
#playerDetailModal .pd-tag { padding: 3px 10px; border-radius: 999px; font-size: .74rem; font-weight: 700; background: rgba(255,255,255,.1); }
#playerDetailModal .pd-tag.pos { background: var(--pd-pos); color: #0b0f17; }
#playerDetailModal .pd-tag.other-pos { background: rgba(255,255,255,.07); color: #cbd5e1; border: 1px dashed rgba(255,255,255,.25); }
#playerDetailModal .pd-ovr { margin-left: auto; text-align: center; padding-right: 30px; }
#playerDetailModal .pd-ovr b { display: block; font-size: 3rem; line-height: 1; font-weight: 900; color: var(--pd-ovr); }
#playerDetailModal .pd-ovr span { font-size: .68rem; color: #94a3b8; letter-spacing: .12em; }
#playerDetailModal .pd-body { padding: 4px 26px 26px; display: grid; gap: 18px; }
#playerDetailModal .pd-sec h4 { margin: 0 0 10px; font-size: .72rem; letter-spacing: .14em; color: #64748b; font-weight: 700; text-transform: uppercase; }
#playerDetailModal .pd-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
#playerDetailModal .pd-stat { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: 12px; }
#playerDetailModal .pd-stat span { display: block; font-size: .7rem; color: #94a3b8; margin-bottom: 4px; }
#playerDetailModal .pd-stat b { font-size: 1.05rem; }
#playerDetailModal .pd-pot { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: 14px; }
#playerDetailModal .pd-pot-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
#playerDetailModal .pd-pot-top b { font-size: 1.15rem; }
#playerDetailModal .pd-pot-top span { font-size: .72rem; color: #64748b; }
#playerDetailModal .pd-track { position: relative; height: 10px; border-radius: 6px; background: rgba(255,255,255,.08); }
#playerDetailModal .pd-range { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: repeating-linear-gradient(135deg, rgba(163,230,53,.55) 0 6px, rgba(163,230,53,.3) 6px 12px); }
#playerDetailModal .pd-now { position: absolute; top: -4px; width: 4px; height: 18px; border-radius: 2px; background: #fff; transform: translateX(-2px); }
#playerDetailModal .pd-scale { display: flex; justify-content: space-between; margin-top: 6px; font-size: .66rem; color: #475569; }
#playerDetailModal .pd-attrs { display: grid; grid-template-columns: 170px 1fr; gap: 14px; align-items: center; }
#playerDetailModal .pd-bars { display: grid; gap: 8px; }
#playerDetailModal .pd-bar { display: grid; grid-template-columns: 52px 1fr 28px; gap: 8px; align-items: center; font-size: .78rem; }
#playerDetailModal .pd-bar i { display: block; height: 6px; border-radius: 4px; background: rgba(255,255,255,.08); overflow: hidden; }
#playerDetailModal .pd-bar i u { display: block; height: 100%; border-radius: 4px; }
#playerDetailModal .pd-bar em { font-style: normal; text-align: right; font-weight: 700; }
#playerDetailModal .pd-traits { display: flex; flex-wrap: wrap; gap: 6px; }
#playerDetailModal .pd-trait { padding: 5px 11px; border-radius: 10px; font-size: .76rem; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.07); }
#playerDetailModal .pd-contract { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); }
#playerDetailModal .pd-contract.warn { background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.4); }
#playerDetailModal .pd-contract small { display: block; color: #94a3b8; font-size: .72rem; margin-bottom: 2px; }
#playerDetailModal .pd-contract b { font-size: 1rem; }
#playerDetailModal .pd-btn { border: 0; border-radius: 10px; padding: 9px 16px; font-weight: 800; cursor: pointer; background: #a3e635; color: #0b0f17; }
#playerDetailModal .pd-btn:hover { filter: brightness(1.08); }
@media (max-width: 520px) { #playerDetailModal .pd-attrs { grid-template-columns: 1fr; } #playerDetailModal .pd-stats { grid-template-columns: repeat(2,1fr); } }
`;

function _pdEnsureModal() {
    let modal = document.getElementById('playerDetailModal');
    if (modal) return modal;
    const st = document.createElement('style');
    st.textContent = _PD_CSS;
    document.head.appendChild(st);
    modal = document.createElement('div');
    modal.id = 'playerDetailModal';
    modal.className = 'modal';
    modal.style.zIndex = '5000';
    modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display === 'block') modal.style.display = 'none';
    });
    document.body.appendChild(modal);
    return modal;
}

function _pdEl(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function _pdRadar(attrs, keys, names) {
    const NS = 'http://www.w3.org/2000/svg';
    const size = 170, c = size / 2, R = 62;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    const pt = (i, r) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / keys.length;
        return [c + Math.cos(a) * r, c + Math.sin(a) * r];
    };
    [0.33, 0.66, 1].forEach(f => {
        const poly = document.createElementNS(NS, 'polygon');
        poly.setAttribute('points', keys.map((_, i) => pt(i, R * f).join(',')).join(' '));
        poly.setAttribute('fill', 'none');
        poly.setAttribute('stroke', 'rgba(255,255,255,.1)');
        svg.appendChild(poly);
    });
    const data = document.createElementNS(NS, 'polygon');
    data.setAttribute('points', keys.map((k, i) => pt(i, R * Math.max(0.05, (attrs[k] || 0) / 100)).join(',')).join(' '));
    data.setAttribute('fill', 'rgba(163,230,53,.28)');
    data.setAttribute('stroke', '#a3e635');
    data.setAttribute('stroke-width', '2');
    svg.appendChild(data);
    keys.forEach((k, i) => {
        const [x, y] = pt(i, R + 14);
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y + 3);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '9.5');
        t.setAttribute('fill', '#94a3b8');
        t.textContent = names[k];
        svg.appendChild(t);
    });
    return svg;
}

function openPlayerDetail(player, teamName) {
    if (!player) return;
    let p = Object.assign({}, player);

    // 상세 정보가 없으면 allTeams 원본에서 보충
    if (typeof allTeams !== 'undefined') {
        const id = player.playerid || player.playerId;
        let found = null;
        for (const t in allTeams) {
            found = (allTeams[t].players || []).find(x => (id && x.playerid === id) || x.name === player.name);
            if (found) break;
        }
        if (found) {
            ['attributes', 'traits', 'detailPosition', 'otherPositions', 'potential', 'preferredFoot', 'weakFoot', 'skillMoves', 'playerid', 'country', 'weeklyWage'].forEach(k => {
                if (p[k] === undefined && found[k] !== undefined) p[k] = found[k];
            });
        }
    }

    const range = getPotentialRange(p);
    const team = teamName || p.originalTeam || (typeof gameData !== 'undefined' ? gameData.selectedTeam : '') || '';
    const ovr = Math.floor(p.rating || 0);
    const ovrColor = ovr >= 85 ? '#a3e635' : ovr >= 78 ? '#facc15' : ovr >= 70 ? '#fb923c' : '#94a3b8';
    const posColors = { GK: '#F59E0B', DF: '#3B82F6', MF: '#10B981', FW: '#EF4444' };
    const dp = (p.detailPosition || p.position || '').toUpperCase();
    let posColor = posColors[p.position] || '#cbd5e1';
    if (['ST', 'CF', 'LW', 'RW', 'FW'].includes(dp)) posColor = '#EF4444'; // 공격: 빨강
    else if (['CAM', 'AM', 'CM', 'LM', 'RM', 'CDM', 'DM', 'MF'].includes(dp)) posColor = '#10B981'; // 미드: 초록
    else if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF', 'SW'].includes(dp)) posColor = '#3B82F6'; // 수비: 파랑
    else if (dp === 'GK') posColor = '#F59E0B'; // 키퍼: 노랑
    const stars = n => n ? '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)) : '-';
    const foot = f => f === 'Left' ? '왼발' : f === 'Right' ? '오른발' : (f || '-');
    const attrNames = { pace: '속력', shooting: '슈팅', passing: '패스', dribbling: '드리블', defending: '수비', physical: '피지컬' };
    const attrKeys = Object.keys(attrNames);

    const modal = _pdEnsureModal();
    modal.replaceChildren();

    const card = _pdEl('div', 'pd-card');
    card.style.setProperty('--pd-accent', posColor + '33');
    card.style.setProperty('--pd-pos', posColor);
    card.style.setProperty('--pd-ovr', ovrColor);

    const x = _pdEl('button', 'pd-x', '×');
    x.type = 'button';
    x.onclick = () => { modal.style.display = 'none'; };
    card.appendChild(x);

    // 히어로
    const hero = _pdEl('div', 'pd-hero');
    const img = _pdEl('img', 'pd-photo');
    img.alt = p.name;
    if (typeof setPlayerPhoto === 'function') setPlayerPhoto(img, p);
    const info = _pdEl('div');
    info.append(_pdEl('div', 'pd-name', p.name));
    info.append(_pdEl('div', 'pd-meta', [team, p.country, p.age != null ? p.age + '세' : null].filter(Boolean).join(' · ')));
    const tags = _pdEl('div', 'pd-tags');
    tags.append(_pdEl('span', 'pd-tag pos', p.position || '-'));
    if (p.detailPosition) tags.append(_pdEl('span', 'pd-tag', p.detailPosition));
    if (Array.isArray(p.otherPositions) && p.otherPositions.length > 0) {
        p.otherPositions.forEach(op => {
            tags.append(_pdEl('span', 'pd-tag other-pos', op));
        });
    }
    info.append(tags);
    const ovrBox = _pdEl('div', 'pd-ovr');
    ovrBox.append(_pdEl('b', null, ovr), _pdEl('span', null, 'OVR'));
    hero.append(img, info, ovrBox);
    card.appendChild(hero);

    const body = _pdEl('div', 'pd-body');

    // 계약 (우리 팀 선수일 때)
    const myTeam = (typeof gameData !== 'undefined' && gameData.selectedTeam && typeof teams !== 'undefined') ? teams[gameData.selectedTeam] : null;
    const myPlayer = myTeam ? myTeam.find(x => x.name === player.name) : null;
    if (myPlayer && typeof contractSystem !== 'undefined') {
        const years = contractSystem.getPlayerContractYears(myPlayer);
        const need = years <= 1;
        const currentWage = (typeof calculatePlayerWage === 'function') ? calculatePlayerWage(myPlayer) : (myPlayer.weeklyWage || 0);
        const box = _pdEl('div', 'pd-contract' + (need ? ' warn' : ''));
        const left = _pdEl('div');
        left.append(_pdEl('small', null, need ? '재계약 필요' : '계약 정보'), _pdEl('b', null, `잔여 ${years}년 · 주급 ${currentWage}억/주`));
        box.appendChild(left);
        const btn = _pdEl('button', 'pd-btn', '재계약 협상');
        btn.type = 'button';
        btn.onclick = () => {
            modal.style.display = 'none';
            contractSystem.openRenewalModal(myPlayer);
        };
        box.appendChild(btn);
        body.appendChild(box);
    }

    // 요약
    const playerWage = (typeof calculatePlayerWage === 'function') ? calculatePlayerWage(p) : (p.weeklyWage || 0);
    const sec1 = _pdEl('div', 'pd-sec');
    sec1.appendChild(_pdEl('h4', null, 'Profile'));
    const stats = _pdEl('div', 'pd-stats');
    [
        ['주급', `${playerWage}억/주`],
        ['주발', foot(p.preferredFoot)],
        ['약발', stars(p.weakFoot)],
        ['개인기', stars(p.skillMoves)]
    ].forEach(([l, v]) => {
        const s = _pdEl('div', 'pd-stat');
        s.append(_pdEl('span', null, l), _pdEl('b', null, v));
        stats.appendChild(s);
    });
    sec1.appendChild(stats);
    body.appendChild(sec1);

    // 잠재력 (범위만 표시)
    if (range) {
        const sec = _pdEl('div', 'pd-sec');
        sec.appendChild(_pdEl('h4', null, 'Potential'));
        const pot = _pdEl('div', 'pd-pot');
        const top = _pdEl('div', 'pd-pot-top');
        top.append(_pdEl('b', null, `${range.lo} ~ ${range.hi}`), _pdEl('span', null, '스카우트 추정 범위'));
        const track = _pdEl('div', 'pd-track');
        const rg = _pdEl('div', 'pd-range');
        const scale = v => Math.max(0, Math.min(100, (v - 40) / 59 * 100));
        rg.style.left = scale(range.lo) + '%';
        rg.style.width = (scale(range.hi) - scale(range.lo)) + '%';
        const now = _pdEl('div', 'pd-now');
        now.style.left = scale(ovr) + '%';
        now.title = '현재 능력치';
        track.append(rg, now);
        const sc = _pdEl('div', 'pd-scale');
        sc.append(_pdEl('span', null, '40'), _pdEl('span', null, '현재 능력치 ' + ovr), _pdEl('span', null, '99'));
        pot.append(top, track, sc);
        sec.appendChild(pot);
        body.appendChild(sec);
    }

    // 능력치
    if (p.attributes) {
        const sec = _pdEl('div', 'pd-sec');
        sec.appendChild(_pdEl('h4', null, 'Attributes'));
        const wrap = _pdEl('div', 'pd-attrs');
        wrap.appendChild(_pdRadar(p.attributes, attrKeys, attrNames));
        const bars = _pdEl('div', 'pd-bars');
        attrKeys.forEach(k => {
            const v = p.attributes[k];
            if (v == null) return;
            const col = v >= 85 ? '#a3e635' : v >= 75 ? '#facc15' : v >= 65 ? '#fb923c' : '#ef4444';
            const row = _pdEl('div', 'pd-bar');
            const bar = _pdEl('i');
            const fill = _pdEl('u');
            fill.style.width = v + '%';
            fill.style.background = col;
            bar.appendChild(fill);
            const val = _pdEl('em', null, v);
            val.style.color = col;
            row.append(_pdEl('span', null, attrNames[k]), bar, val);
            bars.appendChild(row);
        });
        wrap.appendChild(bars);
        sec.appendChild(wrap);
        body.appendChild(sec);
    }

    // 특성
    if (p.traits && p.traits.length) {
        const sec = _pdEl('div', 'pd-sec');
        sec.appendChild(_pdEl('h4', null, 'Traits'));
        const t = _pdEl('div', 'pd-traits');
        p.traits.forEach(x => t.appendChild(_pdEl('span', 'pd-trait', x)));
        sec.appendChild(t);
        body.appendChild(sec);
    }

    card.appendChild(body);
    modal.appendChild(card);
    modal.style.display = 'block';
    modal.scrollTop = 0;
}

window.openPlayerDetail = openPlayerDetail;
window.getPotentialRange = getPotentialRange;
