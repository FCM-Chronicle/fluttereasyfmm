// formation.js - 5선 라인 세부 포메이션 시스템 (최전방 / 2선 / 중앙 / 3선 / 후방 / 골키퍼)

// 포메이션 5선 + GK 라인 정의
const FORMATION_LINES = {
    TOP: {
        key: 'TOP',
        name: '최전방',
        subName: 'ST · CF',
        positions: ['ST', 'CF', 'FW'],
        color: '#EF4444' // 빨강 (공격)
    },
    AM: {
        key: 'AM',
        name: '2선',
        subName: 'CAM · LW · RW',
        positions: ['CAM', 'LW', 'RW', 'AM'],
        color: '#EF4444' // 빨강 (공격/2선)
    },
    CM: {
        key: 'CM',
        name: '중앙',
        subName: 'CM · LM · RM',
        positions: ['CM', 'LM', 'RM', 'MF'],
        color: '#10B981' // 초록 (미드)
    },
    DM: {
        key: 'DM',
        name: '3선',
        subName: 'CDM · LWB · RWB',
        positions: ['CDM', 'LWB', 'RWB', 'DM'],
        color: '#10B981' // 초록 (미드)
    },
    DF: {
        key: 'DF',
        name: '후방',
        subName: 'CB · LB · RB',
        positions: ['CB', 'LB', 'RB', 'DF', 'SW'],
        color: '#3B82F6' // 파랑 (수비)
    },
    GK: {
        key: 'GK',
        name: '골키퍼',
        subName: 'GK',
        positions: ['GK'],
        color: '#F59E0B' // 노랑 (키퍼)
    }
};

class FormationSystem {
    constructor() {
        this.field = null;
        this.areas = {};
        this.isEditMode = false;
        this.draggedPlayer = null;
        this.originalDraggedPlayerInfo = null; // 드래그 시작 시 선수 정보 저장
        this.longPressTimer = null;
        this.longPressDuration = 500; // 500ms for a long press
        this.isLongPressDrag = false; // 롱프레스 드래그 상태
        this.startX = 0;
        this.startY = 0;
        this.isRoleViewMode = false; // [신규] 롤 정보 보기 모드 플래그
        
        this.init();
    }
    
    init() {
        this.field = document.querySelector('.field');
        if (!this.field) return;

        this.areas = {
            TOP: document.getElementById('top-area'),
            AM: document.getElementById('am-area'),
            CM: document.getElementById('cm-area'),
            DM: document.getElementById('dm-area'),
            DF: document.getElementById('df-area'),
            GK: document.getElementById('gk-area')
        };

        this.substitutionSheet = document.getElementById('substitutionSheet');
        this.sheetTitle = document.getElementById('sheetTitle');
        this.sheetPlayerList = document.getElementById('sheetPlayerList');
        const closeSheetBtn = document.getElementById('closeSubstitutionSheet');
        if (closeSheetBtn) closeSheetBtn.addEventListener('click', () => this.hideSubstitutionSheet());
        
        this.createControlButtons();
        this.ensureSquadLines();
        this.displayCurrentSquad();
        this.setupDragEvents();
    }
    
    // 컨트롤 버튼 생성 (FM 포메이션 프리셋 선택 + 롤 정보 버튼 + 최적 추천 버튼 + 포메이션 수정 버튼)
    createControlButtons() {
        const container = document.querySelector('.squad-controls');
        if (!container) return;
        
        container.replaceChildren();

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'formation-controls';

        // 0. FM 포메이션 템플릿 드롭다운
        const presetSelect = document.createElement('select');
        presetSelect.id = 'formationPresetSelect';
        presetSelect.style.cssText = 'background: #1E293B; color: #F8FAFC; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 6px 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer;';
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '📋 FM 포메이션 프리셋...';
        presetSelect.appendChild(defOpt);
        if (typeof TeamUtils !== 'undefined' && TeamUtils.FORMATION_TEMPLATES) {
            Object.keys(TeamUtils.FORMATION_TEMPLATES).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = TeamUtils.FORMATION_TEMPLATES[k].name;
                if (typeof gameData !== 'undefined' && gameData && gameData.currentFormationTemplate === k) {
                    opt.selected = true;
                }
                presetSelect.appendChild(opt);
            });
        }
        presetSelect.onchange = (e) => {
            const tplKey = e.target.value;
            if (!tplKey) return;
            this.applyFormationTemplate(tplKey);
        };

        // 1. 롤 정보 버튼
        const roleBtn = document.createElement('button');
        roleBtn.id = 'viewRoleBtn';
        roleBtn.className = 'btn btn-sm';
        roleBtn.textContent = '롤 변경 모드';
        roleBtn.onclick = () => this.toggleRoleViewMode();

        // 2. 최적 포메이션 자동 설정 버튼
        const autoBtn = document.createElement('button');
        autoBtn.id = 'autoOptimizeBtn';
        autoBtn.className = 'btn btn-sm';
        autoBtn.textContent = '⚡ 최적 포메이션';
        autoBtn.title = '구단 선수단에 가장 이상적인 실축 포메이션으로 자동 재배치합니다.';
        autoBtn.onclick = () => {
            if (confirm('현재 구단 선수단에 가장 어울리는 최적의 실축 포메이션으로 자동 재정렬하시겠습니까?')) {
                if (typeof autoFillSquad === 'function') {
                    autoFillSquad();
                } else if (typeof TeamUtils !== 'undefined') {
                    const best = TeamUtils.calculateBestFormation(gameData.selectedTeam);
                    if (best) {
                        gameData.squad = best.squad;
                        gameData.squadLines = best.squadLines;
                        this.normalizeLineSlotPositions();
                        this.displayCurrentSquad();
                    }
                }
                const fName = this.getFormationDisplayName();
                alert(`최적 실축 포메이션 [${fName}] 설정이 완료되었습니다!`);
                this.updateTitle();
            }
        };

        // 3. 포메이션 수정 버튼
        const editBtn = document.createElement('button');
        editBtn.id = 'editFormationBtn';
        editBtn.className = 'btn btn-sm primary';
        editBtn.textContent = '포메이션 수정';
        editBtn.onclick = () => this.toggleEditMode();

        const titleSpan = document.createElement('span');
        titleSpan.id = 'formationControlsTitle';
        titleSpan.className = 'formation-controls-title';
        titleSpan.textContent = `베스트 11: ${this.getFormationDisplayName()}`;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'formation-controls-btns';
        btnGroup.append(presetSelect, roleBtn, autoBtn, editBtn);
        controlsDiv.append(titleSpan, btnGroup);
        container.appendChild(controlsDiv);
    }

    // 선택한 FM 포메이션 템플릿으로 스쿼드 배치 적용
    applyFormationTemplate(templateKey) {
        if (typeof TeamUtils === 'undefined' || !TeamUtils.FORMATION_TEMPLATES || !TeamUtils.FORMATION_TEMPLATES[templateKey]) return false;
        const tpl = TeamUtils.FORMATION_TEMPLATES[templateKey];
        const allTeamPlayers = (typeof allTeams !== 'undefined' && allTeams[gameData.selectedTeam]?.players)
            || (typeof teams !== 'undefined' && teams[gameData.selectedTeam]) || [];
        if (!allTeamPlayers.length) return false;

        // 부상자 제외 가용 선수에서 해당 템플릿 평가, 실패 시 전체 선수에서 최적 배정
        const availPlayers = allTeamPlayers.filter(p => !(typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, p.name)));
        let evalRes = TeamUtils.evaluateFormation(availPlayers, tpl);
        if (!evalRes) {
            // 포지션 유연 매칭 폴백: 현재 선발 11인 또는 가용 상위 선수들을 슬롯에 매칭
            const pool = [...availPlayers].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            const used = new Set();
            const newLines = { TOP: [], AM: [], CM: [], DM: [], DF: [], GK: [] };
            tpl.slots.forEach(slot => {
                let pick = pool.find(p => !used.has(p.name) && this.getPlayerAllPositions(p).includes(slot.pos));
                if (!pick) pick = pool.find(p => !used.has(p.name) && this.canPlayLine(p, slot.line));
                if (!pick) pick = pool.find(p => !used.has(p.name) && (slot.line === 'GK' ? p.position === 'GK' : p.position !== 'GK'));
                if (pick) {
                    used.add(pick.name);
                    pick._tacticalSlotPos = slot.pos;
                    newLines[slot.line].push(pick);
                }
            });
            gameData.squadLines = newLines;
        } else {
            // evaluateFormation 결과를 기반으로 각 슬롯의 정확한 pos(_tacticalSlotPos) 부여
            gameData.squadLines = evalRes.squadLines;
            const usedForPos = new Set();
            tpl.slots.forEach(slot => {
                const lineArr = gameData.squadLines[slot.line] || [];
                const p = lineArr.find(x => x && !usedForPos.has(x.name) && this.getPlayerAllPositions(x).includes(slot.pos))
                    || lineArr.find(x => x && !usedForPos.has(x.name));
                if (p) {
                    usedForPos.add(p.name);
                    p._tacticalSlotPos = slot.pos;
                }
            });
        }

        gameData.currentFormationTemplate = templateKey;
        this.normalizeLineSlotPositions();
        this.syncLegacySquad();

        // 각 선수의 슬롯 포지션에 맞는 최적 롤 자동 보정
        if (typeof TacticsManager !== 'undefined') {
            if (!gameData.playerRoles) gameData.playerRoles = {};
            ['TOP', 'AM', 'CM', 'DM', 'DF'].forEach(lk => {
                (gameData.squadLines[lk] || []).forEach(p => {
                    if (!p) return;
                    const slotPos = p._tacticalSlotPos || this.getDisplayPositionForLine(p, lk);
                    gameData.playerRoles[p.name] = TacticsManager.getBestRoleForPlayer(p, lk, slotPos);
                });
            });
        }

        this.displayCurrentSquad();
        if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        this.updateTitle();
        return true;
    }

    updateTitle() {
        const titleSpan = document.getElementById('formationControlsTitle');
        if (titleSpan) {
            titleSpan.textContent = `베스트 11: ${this.getFormationDisplayName()}`;
        }
    }
    
    toggleEditMode() {
        if (this.isRoleViewMode) this.toggleRoleViewMode();

        this.isEditMode = !this.isEditMode;
        const btn = document.getElementById('editFormationBtn');
        
        if (this.isEditMode) {
            btn.textContent = '수정 완료';
            btn.classList.add('confirm');
            this.field.classList.add('edit-mode');
            alert('포메이션 수정 모드가 활성화되었습니다. 선수를 원하는 라인으로 드래그하거나 위치를 교체하세요.');
        } else {
            // 1. 포지션 검사 및 자동 교체 먼저 실행
            this.validateAndAutoCorrect();

            // 2. 자동 교체 후 최종 포메이션으로 유효성 검사
            if (this.validate(true)) {
                this.saveFormation();
                btn.textContent = '포메이션 수정';
                btn.classList.remove('confirm');
                this.field.classList.remove('edit-mode');
            } else {
                // 검증 실패 시 편집 모드 유지
                this.isEditMode = true;
            }
        }
    }

    // 롤 정보 보기 모드 토글
    toggleRoleViewMode() {
        if (this.isEditMode) this.toggleEditMode();

        this.isRoleViewMode = !this.isRoleViewMode;
        const btn = document.getElementById('viewRoleBtn');
        const field = document.querySelector('.field');
        
        if (this.isRoleViewMode) {
            btn.textContent = '닫기';
            btn.classList.add('is-on');
            field.classList.add('role-view-mode');
        } else {
            btn.textContent = '롤 정보';
            btn.classList.remove('is-on');
            field.classList.remove('role-view-mode');
            this.hideSubstitutionSheet();
        }
    }

    // 5선 라인 데이터(gameData.squadLines) 보장 및 동기화
    ensureSquadLines() {
        if (typeof gameData === 'undefined' || !gameData) return;
        if (!gameData.squad) {
            gameData.squad = { gk: null, df: [], mf: [], fw: [] };
        }

        const keys = ['TOP', 'AM', 'CM', 'DM', 'DF', 'GK'];

        // 현재 gameData.squad의 유효 선수 목록
        const currentSquadPlayers = [
            gameData.squad.gk,
            ...(Array.isArray(gameData.squad.df) ? gameData.squad.df : []),
            ...(Array.isArray(gameData.squad.mf) ? gameData.squad.mf : []),
            ...(Array.isArray(gameData.squad.fw) ? gameData.squad.fw : [])
        ].filter(Boolean);

        const currentSquadNames = new Set(currentSquadPlayers.map(p => p.name));

        // 이미 squadLines가 온전하고 squad와 잘 일치하는 경우 유지
        if (gameData.squadLines && typeof gameData.squadLines === 'object') {
            const hasAllKeys = keys.every(k => Array.isArray(gameData.squadLines[k]));
            if (hasAllKeys) {
                const linesPlayers = [];
                keys.forEach(k => {
                    (gameData.squadLines[k] || []).forEach(p => { if (p) linesPlayers.push(p); });
                });
                const linesNames = new Set(linesPlayers.map(p => p.name));

                let matchCount = 0;
                linesNames.forEach(name => {
                    if (currentSquadNames.has(name)) matchCount++;
                });

                // 스쿼드 변경이 없으면(공석 포함 0~11명 모두) 기존 squadLines 유지
                if (linesPlayers.length === currentSquadNames.size && matchCount === currentSquadNames.size) {
                    this.syncLegacySquad();
                    return;
                }
            }
        }

        // squadLines 새로 분배 생성
        const lines = {
            TOP: [],
            AM: [],
            CM: [],
            DM: [],
            DF: [],
            GK: []
        };

        // 1. GK
        if (gameData.squad.gk) {
            lines.GK.push(gameData.squad.gk);
        } else {
            lines.GK.push(null);
        }

        // 2. DF 분배 (기본 CB, LB, RB -> DF / 윙백 LWB, RWB -> 3선 DM)
        const dfs = Array.isArray(gameData.squad.df) ? gameData.squad.df : [];
        dfs.forEach(p => {
            if (!p) {
                lines.DF.push(null);
                return;
            }
            const dp = (p.detailPosition || '').toUpperCase();
            if (['LWB', 'RWB'].includes(dp)) {
                lines.DM.push(p);
            } else {
                lines.DF.push(p);
            }
        });

        // 3. MF 분배 (CDM -> 3선 DM / CAM -> 2선 AM / CM, LM, RM -> 중앙 CM)
        const mfs = Array.isArray(gameData.squad.mf) ? gameData.squad.mf : [];
        mfs.forEach(p => {
            if (!p) {
                lines.CM.push(null);
                return;
            }
            const dp = (p.detailPosition || '').toUpperCase();
            if (['CDM', 'DM'].includes(dp)) {
                lines.DM.push(p);
            } else if (['CAM', 'AM'].includes(dp)) {
                lines.AM.push(p);
            } else {
                lines.CM.push(p);
            }
        });

        // 4. FW 분배 (LW, RW -> 2선 AM / ST, CF -> 최전방 TOP)
        const fws = Array.isArray(gameData.squad.fw) ? gameData.squad.fw : [];
        fws.forEach(p => {
            if (!p) {
                lines.TOP.push(null);
                return;
            }
            const dp = (p.detailPosition || '').toUpperCase();
            if (['LW', 'RW'].includes(dp)) {
                lines.AM.push(p);
            } else {
                lines.TOP.push(p);
            }
        });

        gameData.squadLines = lines;
        this.syncLegacySquad();
    }

    // gameData.squadLines -> 레거시 gameData.squad 동기화 (기존 시스템 100% 호환)
    syncLegacySquad() {
        if (!gameData || !gameData.squadLines) return;
        if (!gameData.squad) {
            gameData.squad = { gk: null, df: [], mf: [], fw: [] };
        }

        const lines = gameData.squadLines;
        gameData.squad.gk = (lines.GK && lines.GK[0]) || null;

        const df = [];
        const mf = [];
        const fw = [];

        (lines.DF || []).forEach(p => df.push(p));
        (lines.DM || []).forEach(p => mf.push(p));
        (lines.CM || []).forEach(p => mf.push(p));
        (lines.AM || []).forEach(p => {
            if (!p) {
                mf.push(p);
                return;
            }
            const dp = (p.detailPosition || p.position || '').toUpperCase();
            if (['LW', 'RW'].includes(dp)) {
                fw.push(p);
            } else {
                mf.push(p);
            }
        });
        (lines.TOP || []).forEach(p => fw.push(p));

        gameData.squad.df = df;
        gameData.squad.mf = mf;
        gameData.squad.fw = fw;
    }

    // 선수가 소화 가능한 모든 포지션 추출 (주 포지션 + 세부 포지션 + otherPositions)
    getPlayerAllPositions(player) {
        if (!player) return [];
        const list = [];
        if (player.detailPosition) list.push(player.detailPosition.toUpperCase());
        if (Array.isArray(player.otherPositions)) {
            player.otherPositions.forEach(p => {
                if (p) list.push(p.toUpperCase());
            });
        }
        if (player.position) list.push(player.position.toUpperCase());
        return [...new Set(list)];
    }

    // 해당 라인(TOP, AM, CM, DM, DF, GK)에 출전 가능한지 판정
    canPlayLine(player, lineKey) {
        if (!player) return false;
        const lk = (lineKey || '').toUpperCase();
        const config = FORMATION_LINES[lk];
        if (!config) return false;

        // 골키퍼 라인은 GK만 가능
        if (lk === 'GK') {
            const base = (player.position || '').toUpperCase();
            const detail = (player.detailPosition || '').toUpperCase();
            return base === 'GK' || detail === 'GK';
        }

        // 골키퍼 선수는 필드 라인 출전 불가
        if ((player.position || '').toUpperCase() === 'GK' || (player.detailPosition || '').toUpperCase() === 'GK') {
            return false;
        }

        const allPositions = this.getPlayerAllPositions(player);

        // 허용 포지션 중 하나라도 소화 가능하면 참
        if (allPositions.some(p => config.positions.includes(p))) {
            return true;
        }

        // 세부 포지션이 없고 주 포지션(position)만 있는 경우를 위한 기본 폴백
        if (!player.detailPosition) {
            const basePos = (player.position || '').toUpperCase();
            if (basePos === 'FW' && (lk === 'TOP' || lk === 'AM')) return true;
            if (basePos === 'MF' && (lk === 'CM' || lk === 'DM' || lk === 'AM')) return true;
            if (basePos === 'DF' && lk === 'DF') return true;
        }

        return false;
    }

    // 하위 호환용 레거시 검증 메서드
    canPlayPosition(player, targetPositionType) {
        const target = (targetPositionType || '').toUpperCase();
        if (FORMATION_LINES[target]) return this.canPlayLine(player, target);
        if (target === 'FW') return this.canPlayLine(player, 'TOP') || this.canPlayLine(player, 'AM');
        if (target === 'MF') return this.canPlayLine(player, 'CM') || this.canPlayLine(player, 'DM') || this.canPlayLine(player, 'AM');
        if (target === 'DF') return this.canPlayLine(player, 'DF') || this.canPlayLine(player, 'DM');
        if (target === 'GK') return this.canPlayLine(player, 'GK');
        return false;
    }

    // 선수가 해당 라인에 섰을 때 가장 적합한 세부 포지션 태그 산출 (_tacticalSlotPos 우선 반영)
    getDisplayPositionForLine(player, lineKey) {
        if (!player) return lineKey;
        const config = FORMATION_LINES[lineKey];
        if (!config) return player._tacticalSlotPos || player.detailPosition || player.position || lineKey;

        const slotPos = (player._tacticalSlotPos || '').toUpperCase();
        if (slotPos && config.positions.includes(slotPos)) return slotPos;

        const dp = (player.detailPosition || '').toUpperCase();
        if (config.positions.includes(dp)) return dp;

        const others = Array.isArray(player.otherPositions) ? player.otherPositions : [];
        const match = others.find(p => config.positions.includes((p || '').toUpperCase()));
        if (match) return match.toUpperCase();

        return player.detailPosition || player.position || lineKey;
    }

    // 해당 라인에서 선수가 소화 가능한 구체적 세부 포지션 목록 반환
    getPlayablePositionsInLine(player, lineKey) {
        if (!player) return [];
        const config = FORMATION_LINES[lineKey];
        if (!config) return [];
        const genericTags = new Set(['FW', 'AM', 'MF', 'DM', 'DF', 'SW']);
        const concreteLinePositions = config.positions.filter(p => !genericTags.has(p));
        const allPos = this.getPlayerAllPositions(player);
        const playable = concreteLinePositions.filter(p => allPos.includes(p));
        if (playable.length === 0) {
            const current = this.getDisplayPositionForLine(player, lineKey);
            return current ? [current] : [];
        }
        return playable;
    }

    // 라인 내 선수의 슬롯 포지션(_tacticalSlotPos)을 직접 변경
    changePlayerSlotPosition(player, lineKey, targetPos) {
        if (!player || !lineKey || !targetPos || !gameData || !gameData.squadLines) return false;
        const lineArr = gameData.squadLines[lineKey];
        if (!Array.isArray(lineArr)) return false;

        const target = targetPos.toUpperCase();
        const oldPos = this.getDisplayPositionForLine(player, lineKey).toUpperCase();
        if (oldPos === target) return true;

        const prevSlots = lineArr.map(p => (p ? p._tacticalSlotPos : undefined));
        const uniqueSidePositions = new Set(['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB', 'LB', 'RB']);

        if (uniqueSidePositions.has(target)) {
            const conflictPlayer = lineArr.find(p =>
                p && p.name !== player.name && this.getDisplayPositionForLine(p, lineKey).toUpperCase() === target
            );
            if (conflictPlayer) {
                const conflictPlayable = this.getPlayablePositionsInLine(conflictPlayer, lineKey);
                if (conflictPlayable.includes(oldPos)) {
                    conflictPlayer._tacticalSlotPos = oldPos;
                } else {
                    alert(`[포지션 배치 제한]\n${target} 자리에 이미 ${conflictPlayer.name} 선수가 배치되어 있습니다.\n(${conflictPlayer.name} 선수는 ${oldPos} 포지션을 소화할 수 없어 자동 교대가 불가능합니다.)`);
                    return false;
                }
            }
        }

        player._tacticalSlotPos = target;

        if (lineKey !== 'GK' && typeof TacticsManager !== 'undefined') {
            if (!gameData.playerRoles) gameData.playerRoles = {};
            const roleMap = typeof TacticsManager.getRolesForPosition === 'function'
                ? TacticsManager.getRolesForPosition(lineKey, target)
                : null;
            const curRole = gameData.playerRoles[player.name];
            if (!curRole || (roleMap && !roleMap[curRole])) {
                gameData.playerRoles[player.name] = TacticsManager.getBestRoleForPlayer(player, lineKey, target);
            }
        }

        const constraintErr = this.checkLineSlotConstraints(gameData.squadLines, { enforceMinDefenders: false });
        if (constraintErr) {
            lineArr.forEach((p, idx) => {
                if (!p) return;
                if (prevSlots[idx] === undefined) delete p._tacticalSlotPos;
                else p._tacticalSlotPos = prevSlots[idx];
            });
            alert(`[포지션 배치 제한]\n${constraintErr}`);
            return false;
        }

        this.syncLegacySquad();
        this.displayCurrentSquad();
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        return true;
    }

    // 시트 상단에 표시할 슬롯 포지션 직접 변경 UI 생성
    createSlotPositionSelector(player, lineKey, onChanged) {
        if (!player || player.isDummy || lineKey === 'GK') return null;
        const playable = this.getPlayablePositionsInLine(player, lineKey);
        if (playable.length <= 1) return null;

        const currentPos = this.getDisplayPositionForLine(player, lineKey).toUpperCase();
        const box = document.createElement('div');
        box.style.cssText = 'margin-bottom: 14px; padding: 12px 14px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;';

        const title = document.createElement('div');
        title.style.cssText = 'font-size: 0.85rem; color: #cbd5e1; margin-bottom: 8px; font-weight: 600;';
        title.textContent = `${player.name} 배치 포지션 변경 (현재: ${currentPos})`;

        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px;';

        playable.forEach(pos => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isActive = pos === currentPos;
            btn.textContent = pos;
            btn.style.cssText = isActive
                ? 'padding: 6px 14px; border-radius: 6px; border: 1px solid #fbbf24; background: #fbbf24; color: #0f172a; font-weight: 700; font-size: 0.85rem; cursor: default;'
                : 'padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.22); background: rgba(15,23,42,0.7); color: #f8fafc; font-weight: 600; font-size: 0.85rem; cursor: pointer;';
            if (!isActive) {
                btn.addEventListener('click', () => {
                    if (this.changePlayerSlotPosition(player, lineKey, pos) && typeof onChanged === 'function') {
                        onChanged(pos);
                    }
                });
            }
            btnRow.appendChild(btn);
        });

        box.append(title, btnRow);
        return box;
    }

    // 라인 내 중복 측면 포지션(예: LW 2명, RW 2명, LB 2명 등) 방지 및 슬롯 포지션 정규화
    normalizeLineSlotPositions() {
        if (typeof gameData === 'undefined' || !gameData || !gameData.squadLines) return;
        const l = gameData.squadLines;

        // 1) AM 라인 정규화: LW 최대 1명, RW 최대 1명, CAM 최대 2명
        if (Array.isArray(l.AM)) {
            let lwUsed = 0, rwUsed = 0, camUsed = 0;
            l.AM.forEach(p => {
                if (!p) return;
                const allPos = this.getPlayerAllPositions(p);
                let raw = this.getDisplayPositionForLine(p, 'AM');
                if (raw === 'AM') raw = 'CAM';

                if (raw === 'LW') {
                    if (lwUsed < 1) { p._tacticalSlotPos = 'LW'; lwUsed++; }
                    else if (rwUsed < 1 && (allPos.includes('RW') || allPos.includes('RM'))) { p._tacticalSlotPos = 'RW'; rwUsed++; }
                    else if (camUsed < 2 && (allPos.includes('CAM') || allPos.includes('AM') || allPos.includes('CM') || allPos.includes('CF'))) { p._tacticalSlotPos = 'CAM'; camUsed++; }
                    else { p._tacticalSlotPos = 'LW'; lwUsed++; }
                } else if (raw === 'RW') {
                    if (rwUsed < 1) { p._tacticalSlotPos = 'RW'; rwUsed++; }
                    else if (lwUsed < 1 && (allPos.includes('LW') || allPos.includes('LM'))) { p._tacticalSlotPos = 'LW'; lwUsed++; }
                    else if (camUsed < 2 && (allPos.includes('CAM') || allPos.includes('AM') || allPos.includes('CM') || allPos.includes('CF'))) { p._tacticalSlotPos = 'CAM'; camUsed++; }
                    else { p._tacticalSlotPos = 'RW'; rwUsed++; }
                } else {
                    if (camUsed < 2) { p._tacticalSlotPos = 'CAM'; camUsed++; }
                    else if (lwUsed < 1 && allPos.includes('LW')) { p._tacticalSlotPos = 'LW'; lwUsed++; }
                    else if (rwUsed < 1 && allPos.includes('RW')) { p._tacticalSlotPos = 'RW'; rwUsed++; }
                    else { p._tacticalSlotPos = 'CAM'; camUsed++; }
                }
            });
        }

        // 2) CM 라인 정규화: LM 최대 1명, RM 최대 1명, CM 최대 3명
        if (Array.isArray(l.CM)) {
            let lmUsed = 0, rmUsed = 0;
            l.CM.forEach(p => {
                if (!p) return;
                const allPos = this.getPlayerAllPositions(p);
                let raw = this.getDisplayPositionForLine(p, 'CM');
                if (raw === 'LM') {
                    if (lmUsed < 1) { p._tacticalSlotPos = 'LM'; lmUsed++; }
                    else if (rmUsed < 1 && allPos.includes('RM')) { p._tacticalSlotPos = 'RM'; rmUsed++; }
                    else if (allPos.includes('CM') || allPos.includes('CAM') || allPos.includes('CDM')) { p._tacticalSlotPos = 'CM'; }
                    else { p._tacticalSlotPos = 'LM'; lmUsed++; }
                } else if (raw === 'RM') {
                    if (rmUsed < 1) { p._tacticalSlotPos = 'RM'; rmUsed++; }
                    else if (lmUsed < 1 && allPos.includes('LM')) { p._tacticalSlotPos = 'LM'; lmUsed++; }
                    else if (allPos.includes('CM') || allPos.includes('CAM') || allPos.includes('CDM')) { p._tacticalSlotPos = 'CM'; }
                    else { p._tacticalSlotPos = 'RM'; rmUsed++; }
                } else {
                    p._tacticalSlotPos = 'CM';
                }
            });
        }

        // 3) DM 라인 정규화: LWB 최대 1명, RWB 최대 1명, CDM 최대 2명
        if (Array.isArray(l.DM)) {
            let lwbUsed = 0, rwbUsed = 0;
            l.DM.forEach(p => {
                if (!p) return;
                let raw = this.getDisplayPositionForLine(p, 'DM');
                if (raw === 'LWB') {
                    if (lwbUsed < 1) { p._tacticalSlotPos = 'LWB'; lwbUsed++; }
                    else { p._tacticalSlotPos = 'CDM'; }
                } else if (raw === 'RWB') {
                    if (rwbUsed < 1) { p._tacticalSlotPos = 'RWB'; rwbUsed++; }
                    else { p._tacticalSlotPos = 'CDM'; }
                } else {
                    p._tacticalSlotPos = 'CDM';
                }
            });
        }

        // 4) DF 라인 정규화: LB 최대 1명, RB 최대 1명, CB 최대 3명
        if (Array.isArray(l.DF)) {
            let lbUsed = 0, rbUsed = 0;
            l.DF.forEach(p => {
                if (!p) return;
                const allPos = this.getPlayerAllPositions(p);
                let raw = this.getDisplayPositionForLine(p, 'DF');
                if (raw === 'LB') {
                    if (lbUsed < 1) { p._tacticalSlotPos = 'LB'; lbUsed++; }
                    else if (rbUsed < 1 && allPos.includes('RB')) { p._tacticalSlotPos = 'RB'; rbUsed++; }
                    else if (allPos.includes('CB')) { p._tacticalSlotPos = 'CB'; }
                    else { p._tacticalSlotPos = 'LB'; lbUsed++; }
                } else if (raw === 'RB') {
                    if (rbUsed < 1) { p._tacticalSlotPos = 'RB'; rbUsed++; }
                    else if (lbUsed < 1 && allPos.includes('LB')) { p._tacticalSlotPos = 'LB'; lbUsed++; }
                    else if (allPos.includes('CB')) { p._tacticalSlotPos = 'CB'; }
                    else { p._tacticalSlotPos = 'RB'; rbUsed++; }
                } else {
                    p._tacticalSlotPos = 'CB';
                }
            });
        }

        // 5) TOP / GK 정규화
        if (Array.isArray(l.TOP)) {
            l.TOP.forEach(p => {
                if (!p) return;
                const raw = (p.detailPosition || 'ST').toUpperCase();
                p._tacticalSlotPos = ['ST', 'CF'].includes(raw) ? raw : 'ST';
            });
        }
        if (Array.isArray(l.GK)) {
            l.GK.forEach(p => { if (p) p._tacticalSlotPos = 'GK'; });
        }
    }

    // 세부 포지션 및 라인별 정원 위반 검사 (LW<=1, RW<=1, CAM<=2, LB<=1, RB<=1, DF>=3 등)
    checkLineSlotConstraints(squadLines, options = {}) {
        const l = squadLines || (typeof gameData !== 'undefined' && gameData ? gameData.squadLines : null);
        if (!l) return '스쿼드 라인 데이터가 없습니다.';

        this.normalizeLineSlotPositions();

        const totalFilled = ['TOP', 'AM', 'CM', 'DM', 'DF', 'GK']
            .reduce((sum, k) => sum + (l[k] || []).filter(Boolean).length, 0);
        const enforceMinDefenders = (options.enforceMinDefenders !== undefined)
            ? options.enforceMinDefenders
            : (totalFilled >= 11);

        const amList = (l.AM || []).filter(Boolean);
        let lwCount = 0, rwCount = 0, camCount = 0;
        amList.forEach(p => {
            const pos = (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'AM')).toUpperCase();
            if (pos === 'LW') lwCount++;
            else if (pos === 'RW') rwCount++;
            else camCount++;
        });
        if (lwCount > 1) return `좌측 윙어(LW)는 최대 1명까지만 배치할 수 있습니다. (현재 ${lwCount}명)`;
        if (rwCount > 1) return `우측 윙어(RW)는 최대 1명까지만 배치할 수 있습니다. (현재 ${rwCount}명)`;
        if (camCount > 2) return `2선 공격형 미드필더(CAM/AM)는 최대 2명까지만 배치할 수 있습니다. (현재 ${camCount}명)`;
        if (amList.length > 4) return `2선(AM) 라인에는 최대 4명까지만 배치할 수 있습니다. (현재 ${amList.length}명)`;

        const topList = (l.TOP || []).filter(Boolean);
        if (topList.length > 3) return `최전방(ST/CF)에는 최대 3명까지만 배치할 수 있습니다. (현재 ${topList.length}명)`;

        const cmList = (l.CM || []).filter(Boolean);
        const lmCount = cmList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'CM')).toUpperCase() === 'LM').length;
        const rmCount = cmList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'CM')).toUpperCase() === 'RM').length;
        if (lmCount > 1) return `좌측 미드필더(LM)는 최대 1명까지만 배치할 수 있습니다. (현재 ${lmCount}명)`;
        if (rmCount > 1) return `우측 미드필더(RM)는 최대 1명까지만 배치할 수 있습니다. (현재 ${rmCount}명)`;

        const dmList = (l.DM || []).filter(Boolean);
        const lwbCount = dmList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'DM')).toUpperCase() === 'LWB').length;
        const rwbCount = dmList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'DM')).toUpperCase() === 'RWB').length;
        if (lwbCount > 1) return `좌측 윙백(LWB)은 최대 1명까지만 배치할 수 있습니다. (현재 ${lwbCount}명)`;
        if (rwbCount > 1) return `우측 윙백(RWB)은 최대 1명까지만 배치할 수 있습니다. (현재 ${rwbCount}명)`;

        const dfList = (l.DF || []).filter(Boolean);
        if (enforceMinDefenders && dfList.length < 3) return `후방 수비(DF) 라인은 최소 3명 이상이어야 합니다. (현재 ${dfList.length}명)`;
        if (dfList.length > 5) return `후방 수비(DF) 라인은 최대 5명까지만 배치할 수 있습니다. (현재 ${dfList.length}명)`;
        const lbCount = dfList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'DF')).toUpperCase() === 'LB').length;
        const rbCount = dfList.filter(p => (p._tacticalSlotPos || this.getDisplayPositionForLine(p, 'DF')).toUpperCase() === 'RB').length;
        if (lbCount > 1) return `좌측 풀백(LB)은 최대 1명까지만 배치할 수 있습니다. (현재 ${lbCount}명)`;
        if (rbCount > 1) return `우측 풀백(RB)은 최대 1명까지만 배치할 수 있습니다. (현재 ${rbCount}명)`;

        return '';
    }
    
    // 현재 스쿼드 라인 구성을 분석하여 실축 포메이션 명칭 산출
    getFormationDisplayName() {
        if (!gameData || !gameData.squadLines) return '기본 포메이션';
        const l = gameData.squadLines;
        const df = (l.DF || []).filter(Boolean).length;
        const dm = (l.DM || []).filter(Boolean).length;
        const cm = (l.CM || []).filter(Boolean).length;
        const am = (l.AM || []).filter(Boolean).length;
        const top = (l.TOP || []).filter(Boolean).length;

        // 정규 실축 포메이션 식별
        if (df === 4 && dm === 1 && cm === 2 && am === 2 && top === 1) return '4-3-3 (홀딩)';
        if (df === 4 && dm === 0 && cm === 3 && am === 2 && top === 1) return '4-3-3 (플랫)';
        if (df === 4 && dm === 0 && cm === 2 && am === 3 && top === 1) return '4-3-3 (어택)';
        if (df === 4 && dm === 2 && cm === 0 && am === 3 && top === 1) return '4-2-3-1';
        if (df === 4 && dm === 0 && cm === 4 && am === 0 && top === 2) return '4-4-2';
        if (df === 4 && dm === 2 && cm === 0 && am === 2 && top === 2) {
            const hasWingers = (l.AM || []).some(p => p && ['LW', 'RW'].includes((p.detailPosition || '').toUpperCase()));
            return hasWingers ? '4-2-4' : '4-2-2-2';
        }
        if (df === 4 && dm === 1 && cm === 2 && am === 1 && top === 2) return '4-1-2-1-2';
        if (df === 4 && dm === 1 && cm === 4 && am === 0 && top === 1) return '4-5-1';
        if (df === 3 && dm === 3 && cm === 1 && am === 1 && top === 2) return '3-5-2';
        if (df === 5 && dm === 0 && cm === 2 && am === 2 && top === 1) return '5-2-3';
        if (df === 5 && dm === 1 && cm === 2 && am === 0 && top === 2) return '5-3-2';
        if (df === 3 && cm === 4 && am === 2 && top === 1) return '3-4-3';

        // 4-1-1-2-2 같은 비정규 라인 배치 감지 시 친절한 실축 명칭 제공
        if (df === 4 && top === 2 && (dm + cm + am) === 4) {
            return '4-4-2 (변형)';
        }
        if (df === 4 && top === 1 && (dm + cm + am) === 5) {
            return '4-5-1 (변형)';
        }

        return `${df}-${dm + cm + am}-${top}`;
    }

    // 각 라인 내 선수들을 좌측 -> 중앙 -> 우측 순서로 정렬하기 위한 가중치
    getPlayerLateralOrder(player, lineKey) {
        if (!player) return 50;
        const slotPos = (player._tacticalSlotPos || '').toUpperCase();
        if (['LB', 'LWB', 'LM', 'LW'].includes(slotPos)) return 8;
        if (['RB', 'RWB', 'RM', 'RW'].includes(slotPos)) return 92;
        if (['CAM', 'AM', 'CM', 'CDM', 'CB', 'ST', 'CF'].includes(slotPos)) return 50;

        const dp = (player.detailPosition || player.position || '').toUpperCase();
        const others = Array.isArray(player.otherPositions) ? player.otherPositions.map(x => (x || '').toUpperCase()) : [];

        // 좌측 자원: LB, LWB, LM, LW
        if (['LB', 'LWB', 'LM', 'LW'].includes(dp)) return 10;
        if (others.some(p => ['LB', 'LWB', 'LM', 'LW'].includes(p))) return 20;

        // 우측 자원: RB, RWB, RM, RW
        if (['RB', 'RWB', 'RM', 'RW'].includes(dp)) return 90;
        if (others.some(p => ['RB', 'RWB', 'RM', 'RW'].includes(p))) return 80;

        // 중앙 자원: CB, CDM, CM, CAM, ST, GK
        return 50;
    }

    // 라인 내 선수들을 좌측(왼쪽) -> 우측(오른쪽) 순서로 정렬
    sortLinePlayersLeftToRight(lineKey) {
        if (!gameData || !gameData.squadLines || !Array.isArray(gameData.squadLines[lineKey])) return;
        const arr = gameData.squadLines[lineKey];
        if (arr.length <= 1) return;

        arr.sort((a, b) => {
            const oa = this.getPlayerLateralOrder(a, lineKey);
            const ob = this.getPlayerLateralOrder(b, lineKey);
            return oa - ob;
        });
    }

    // 피치 슬롯의 가로 좌표(x %) 계산 - LW, RW는 CAM이 없어도 양 측면(18%, 82%)으로 넓게 배치!
    getSlotXCoordinate(player, lineKey, index, total, linePlayers) {
        if (!player) return (100 / (total + 1)) * (index + 1);
        const getSlotPos = (p) => (p._tacticalSlotPos || p.detailPosition || p.position || '').toUpperCase();
        const dp = getSlotPos(player);

        // 1. 최전방 라인 (TOP)
        if (lineKey === 'TOP') {
            if (total === 1) return 50;
            if (total === 2) return index === 0 ? 36 : 64;
            if (total === 3) return index === 0 ? 25 : (index === 1 ? 50 : 75);
            return (100 / (total + 1)) * (index + 1);
        }

        // 2. 2선 라인 (AM: CAM, LW, RW)
        if (lineKey === 'AM') {
            const hasLW = linePlayers.some(p => p && ['LW', 'LM'].includes(getSlotPos(p)));
            const hasRW = linePlayers.some(p => p && ['RW', 'RM'].includes(getSlotPos(p)));
            const hasCAM = linePlayers.some(p => p && ['CAM', 'AM', 'CM', 'CF'].includes(getSlotPos(p)));

            // LW와 RW만 있는 경우 (중간에 CAM 없음): 양 측면 터치라인으로 완전히 벌려줌!
            if (total === 2 && hasLW && hasRW && !hasCAM) {
                return index === 0 ? 18 : 82;
            }

            // LW - CAM - RW 3인 편대
            if (total === 3 && hasLW && hasRW) {
                if (['LW', 'LM'].includes(dp) || index === 0) return 18;
                if (['RW', 'RM'].includes(dp) || index === 2) return 82;
                return 50; // CAM
            }

            // 더블 공미 (4-2-2-2)
            if (total === 2 && !hasLW && !hasRW) {
                return index === 0 ? 33 : 67;
            }

            if (['LW', 'LM'].includes(dp)) return 18;
            if (['RW', 'RM'].includes(dp)) return 82;
            if (['CAM', 'AM'].includes(dp) && total === 1) return 50;

            return (100 / (total + 1)) * (index + 1);
        }

        // 3. 중앙 라인 (CM: LM, CM, RM)
        if (lineKey === 'CM') {
            const hasLM = linePlayers.some(p => p && ['LM', 'LW'].includes(getSlotPos(p)));
            const hasRM = linePlayers.some(p => p && ['RM', 'RW'].includes(getSlotPos(p)));

            // 다이아몬드의 LM과 RM만 있는 경우 (중앙 비움)
            if (total === 2 && hasLM && hasRM) {
                return index === 0 ? 18 : 82;
            }

            // 4-4-2 플랫 (LM - CM1 - CM2 - RM)
            if (total === 4 && hasLM && hasRM) {
                if (index === 0) return 16;
                if (index === 1) return 39;
                if (index === 2) return 61;
                return 84;
            }

            if (total === 1) return 50;
            if (total === 2) return index === 0 ? 36 : 64;
            if (total === 3) return index === 0 ? 28 : (index === 1 ? 50 : 72);

            return (100 / (total + 1)) * (index + 1);
        }

        // 4. 3선 라인 (DM: LWB, CDM, RWB)
        if (lineKey === 'DM') {
            const hasLWB = linePlayers.some(p => p && ['LWB', 'LB'].includes(getSlotPos(p)));
            const hasRWB = linePlayers.some(p => p && ['RWB', 'RB'].includes(getSlotPos(p)));

            // 3-5-2에서 LWB - CDM - RWB
            if (total === 3 && hasLWB && hasRWB) {
                if (index === 0) return 16;
                if (index === 1) return 50;
                return 84;
            }

            // 2 윙백 (LWB, RWB)
            if (total === 2 && hasLWB && hasRWB) {
                return index === 0 ? 16 : 84;
            }

            if (total === 1) return 50;
            if (total === 2) return index === 0 ? 36 : 64;

            return (100 / (total + 1)) * (index + 1);
        }

        // 5. 후방 라인 (DF: LB, CB, RB)
        if (lineKey === 'DF') {
            // 4백 (LB - CB - CB - RB)
            if (total === 4) {
                if (index === 0) return 16;
                if (index === 1) return 39;
                if (index === 2) return 61;
                return 84;
            }

            // 5백 (LWB - CB - CB - CB - RWB)
            if (total === 5) {
                if (index === 0) return 14;
                if (index === 1) return 32;
                if (index === 2) return 50;
                if (index === 3) return 68;
                return 86;
            }

            // 3백 (CB - CB - CB)
            if (total === 3) {
                return index === 0 ? 28 : (index === 1 ? 50 : 72);
            }

            if (total === 2) return index === 0 ? 36 : 64;
            return (100 / (total + 1)) * (index + 1);
        }

        // 6. 골키퍼 (GK)
        if (lineKey === 'GK') return 50;

        return (100 / (total + 1)) * (index + 1);
    }
    
    displayCurrentSquad() {
        this.ensureSquadLines();
        this.normalizeLineSlotPositions();

        Object.keys(this.areas).forEach(lineKey => {
            const area = this.areas[lineKey];
            if (!area) return;

            area.replaceChildren();

            // 라인 라벨 추가
            const config = FORMATION_LINES[lineKey];
            const labelSpan = document.createElement('span');
            labelSpan.className = 'area-line-label';
            labelSpan.textContent = config ? `${config.name} (${config.subName})` : lineKey;
            area.appendChild(labelSpan);

            // 좌측 -> 우측 순서로 정렬
            this.sortLinePlayersLeftToRight(lineKey);

            const players = (typeof gameData !== 'undefined' && gameData && gameData.squadLines && gameData.squadLines[lineKey]) || [];
            const total = players.length;

            players.forEach((player, index) => {
                const x = this.getSlotXCoordinate(player, lineKey, index, total, players);
                const y = lineKey === 'GK' ? 44 : 50;
                this.createPlayerElement(player, lineKey, x, y, index);
            });
        });

        this.updateTitle();
    }
    
    createPlayerElement(player, lineKey, x, y, index) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.style.left = `${x}%`;
        slot.style.top = `${y}%`;
        slot.dataset.index = index;
        slot.dataset.lineKey = lineKey;
        slot.dataset.positionType = lineKey;

        const config = FORMATION_LINES[lineKey];

        if (player) {
            const displayPos = this.getDisplayPositionForLine(player, lineKey);
            let roleDisplay = '';
            if (lineKey !== 'GK' && typeof gameData !== 'undefined') {
                if (!gameData.playerRoles) gameData.playerRoles = {};
                if (!gameData.playerRoles[player.name] && typeof TacticsManager !== 'undefined') {
                    gameData.playerRoles[player.name] = TacticsManager.getBestRoleForPlayer(player, lineKey, displayPos);
                }
                if (gameData.playerRoles && gameData.playerRoles[player.name]) {
                    roleDisplay = gameData.playerRoles[player.name];
                }
            }

            const condition = (player.condition !== undefined) ? player.condition : 100;
            let condColor = '#A3E635';
            if (condition < 70) condColor = '#EF4444';
            else if (condition < 90) condColor = '#FBBF24';

            const posClass = `pos-tag-${displayPos.toLowerCase()}`;

            const avatarWrap = document.createElement('div');
            avatarWrap.className = 'player-slot-avatar-wrap';

            const slotImg = document.createElement('img');
            slotImg.className = 'player-slot-image';
            slotImg.loading = 'lazy';
            slotImg.alt = player.name;
            if (typeof setPlayerPhoto === 'function') {
                setPlayerPhoto(slotImg, player);
            }
            avatarWrap.appendChild(slotImg);

            const nameplate = document.createElement('div');
            nameplate.className = 'player-slot-nameplate';

            const nameRow = document.createElement('div');
            nameRow.className = 'player-slot-name-row';

            const posBadge = document.createElement('span');
            posBadge.className = `slot-pos-badge ${posClass}`;
            posBadge.textContent = displayPos;

            const slotRating = document.createElement('span');
            slotRating.className = 'player-rating';
            slotRating.textContent = Math.floor(player.rating);

            const slotName = document.createElement('span');
            slotName.className = 'player-name';
            slotName.textContent = player.name;
            slotName.title = `${player.name} (${displayPos})`;

            nameRow.append(posBadge, slotRating, slotName);

            const condBar = document.createElement('div');
            condBar.className = 'player-condition-bar';
            condBar.title = `체력: ${Math.round(condition)}%`;
            const condFill = document.createElement('div');
            condFill.className = 'condition-fill';
            condFill.style.width = `${condition}%`;
            condFill.style.height = '100%';
            condFill.style.backgroundColor = condColor;
            condBar.appendChild(condFill);

            nameplate.append(nameRow, condBar);
            slot.append(avatarWrap, nameplate);

            if (roleDisplay) {
                const roleDiv = document.createElement('div');
                roleDiv.className = 'player-role';
                roleDiv.textContent = roleDisplay;
                slot.appendChild(roleDiv);
            }

            slot.dataset.playerName = player.name;
            slot.classList.add('filled');

            slot.addEventListener('click', () => {
                if (this.isEditMode) return;
                if (this.isRoleViewMode) {
                    this.showRoleInfo(player, lineKey);
                } else {
                    this.showSubstitutionSheet(player, lineKey);
                }
            });
        } else {
            // 공석
            const nameplate = document.createElement('div');
            nameplate.className = 'player-slot-nameplate empty-plate';

            const nameRow = document.createElement('div');
            nameRow.className = 'player-slot-name-row';

            const emptyRating = document.createElement('span');
            emptyRating.className = 'player-rating';
            emptyRating.style.opacity = '0.7';
            emptyRating.textContent = config ? config.name : lineKey;

            const emptyName = document.createElement('span');
            emptyName.className = 'player-name';
            emptyName.style.opacity = '0.7';
            emptyName.textContent = '공석';

            nameRow.append(emptyRating, emptyName);
            nameplate.appendChild(nameRow);
            slot.appendChild(nameplate);
            slot.classList.add('empty');

            slot.addEventListener('click', () => {
                if (this.isEditMode) return;
                const dummyPlayer = { name: `${config ? config.name : lineKey} 공석`, isDummy: true };
                this.showSubstitutionSheet(dummyPlayer, lineKey);
            });
        }

        if (this.areas[lineKey]) {
            this.areas[lineKey].appendChild(slot);
        }
        return slot;
    }
    
    setupDragEvents() {
        this.field.addEventListener('mousedown', e => this.onDragStart(e));
        this.field.addEventListener('touchstart', e => this.onDragStart(e), { passive: false });

        document.addEventListener('mousemove', e => this.onDragMove(e));
        document.addEventListener('touchmove', e => this.onDragMove(e), { passive: false });

        document.addEventListener('mouseup', e => this.onDragEnd(e));
        document.addEventListener('touchend', e => this.onDragEnd(e.changedTouches ? e.changedTouches[0] : e));
    }
    
    onDragStart(e) {
        const touch = e.touches ? e.touches[0] : e;
        const target = touch.target.closest('.player-slot');

        if (!target) return;

        // 시작 좌표 저장 (롱프레스 감지용)
        this.startX = touch.clientX;
        this.startY = touch.clientY;

        // 수정 모드일 때 즉시 드래그 시작
        if (this.isEditMode) {
            this.startDragging(e, target);
            return;
        }

        // 롤 보기 모드일 때는 드래그 방지
        if (this.isRoleViewMode) return;

        // 롱프레스 타이머 시작
        this.longPressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            this.isLongPressDrag = true;
            this.startDragging(e, target);
        }, this.longPressDuration);
    }

    startDragging(e, target) {
        this.originalDraggedPlayerInfo = {
            name: target.dataset.playerName,
            lineKey: target.dataset.lineKey || target.dataset.positionType,
            positionType: target.dataset.positionType,
            index: parseInt(target.dataset.index)
        };

        this.draggedPlayer = target;
        const fieldRect = this.field.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;

        this.draggedPlayer.style.left = `${touch.clientX - fieldRect.left - (this.draggedPlayer.offsetWidth / 2)}px`;
        this.draggedPlayer.style.top = `${touch.clientY - fieldRect.top - (this.draggedPlayer.offsetHeight / 2)}px`;
        
        this.field.appendChild(this.draggedPlayer);
        this.draggedPlayer.classList.add('dragging');
        
        this.offsetX = this.draggedPlayer.offsetWidth / 2;
        this.offsetY = this.draggedPlayer.offsetHeight / 2;
    }
    
    onDragMove(e) {
        const touch = e.touches ? e.touches[0] : e;

        if (this.longPressTimer && !this.isLongPressDrag) {
            const moveX = Math.abs(touch.clientX - this.startX);
            const moveY = Math.abs(touch.clientY - this.startY);
            if (moveX > 10 || moveY > 10) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }

        if (!this.draggedPlayer) return;
        
        if (e.cancelable) {
            e.preventDefault();
        }

        const fieldRect = this.field.getBoundingClientRect();
        let x = touch.clientX - fieldRect.left - this.offsetX;
        let y = touch.clientY - fieldRect.top - this.offsetY;

        x = Math.max(0, Math.min(x, fieldRect.width - this.draggedPlayer.offsetWidth));
        y = Math.max(0, Math.min(y, fieldRect.height - this.draggedPlayer.offsetHeight));

        this.draggedPlayer.style.left = `${x}px`;
        this.draggedPlayer.style.top = `${y}px`;
    }
    
    onDragEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }

        if (this.isLongPressDrag) {
            this.isLongPressDrag = false;
        }

        if (!this.draggedPlayer) return;

        const touch = (e.touches && e.touches[0]) || e;
        const dropX = touch.clientX;
        const dropY = touch.clientY;

        // 드래그 중인 요소를 일시적으로 숨겨 아래 위치한 슬롯 감지
        this.draggedPlayer.style.display = 'none';
        const elemBelow = document.elementFromPoint(dropX, dropY);
        this.draggedPlayer.style.display = '';

        const targetSlot = elemBelow ? elemBelow.closest('.player-slot') : null;

        // 1. 다른 슬롯 위에 드롭했을 때 (스왑 교체)
        if (targetSlot && targetSlot !== this.draggedPlayer) {
            const sourceLine = this.originalDraggedPlayerInfo.lineKey;
            const targetLine = targetSlot.dataset.lineKey || targetSlot.dataset.positionType;
            const sourceIdx = parseInt(this.draggedPlayer.dataset.index);
            const targetIdx = parseInt(targetSlot.dataset.index);

            // 같은 라인 내 위치 스왑
            if (sourceLine === targetLine) {
                this.swapSquadIndices(sourceLine, sourceIdx, targetIdx);
                this.finalizeDrag();
                return;
            } else {
                // 다른 라인 간 스왑
                if (sourceLine === 'GK' || targetLine === 'GK') {
                    alert('골키퍼는 필드 플레이어와 직접 맞교환할 수 없습니다.');
                    this.finalizeDrag();
                    return;
                }

                const pSource = gameData.squadLines[sourceLine][sourceIdx];
                const pTarget = gameData.squadLines[targetLine][targetIdx];

                const sourceCanTarget = !pSource || this.canPlayLine(pSource, targetLine);
                const targetCanSource = !pTarget || this.canPlayLine(pTarget, sourceLine);

                if (sourceCanTarget && targetCanSource) {
                    gameData.squadLines[sourceLine][sourceIdx] = pTarget;
                    gameData.squadLines[targetLine][targetIdx] = pSource;
                    this.syncLegacySquad();
                    this.finalizeDrag();
                    return;
                } else {
                    const errors = [];
                    if (pSource && !sourceCanTarget) errors.push(`${pSource.name}은(는) ${FORMATION_LINES[targetLine].name} 라인 불가`);
                    if (pTarget && !targetCanSource) errors.push(`${pTarget.name}은(는) ${FORMATION_LINES[sourceLine].name} 라인 불가`);
                    alert(`선수 위치를 맞교환할 수 없습니다:\n${errors.join('\n')}`);
                    this.finalizeDrag();
                    return;
                }
            }
        }

        // 2. 영역(Line Area)에 드롭했을 때 (라인 간 이동)
        let targetArea = null;
        for (const lineKey in this.areas) {
            const areaEl = this.areas[lineKey];
            if (!areaEl) continue;
            const areaRect = areaEl.getBoundingClientRect();
            if (dropX >= areaRect.left && dropX <= areaRect.right &&
                dropY >= areaRect.top && dropY <= areaRect.bottom) {
                targetArea = areaEl;
                break;
            }
        }

        const newLineKey = targetArea ? (targetArea.dataset.positionType || targetArea.id.replace('-area', '').toUpperCase()) : null;
        const oldLineKey = this.originalDraggedPlayerInfo.lineKey;
        const playerName = this.originalDraggedPlayerInfo.name;

        if (targetArea && newLineKey) {
            if (newLineKey === 'GK' && oldLineKey !== 'GK') {
                alert('필드 플레이어는 GK 영역으로 이동할 수 없습니다.');
                this.finalizeDrag();
                return;
            }
            if (oldLineKey === 'GK' && newLineKey !== 'GK') {
                alert('골키퍼는 필드 플레이어 영역으로 이동할 수 없습니다.');
                this.finalizeDrag();
                return;
            }

            if (newLineKey !== oldLineKey) {
                if (playerName) {
                    const allTeamPlayers = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players) || teams[gameData.selectedTeam] || [];
                    const playerObj = allTeamPlayers.find(p => p.name === playerName);
                    if (playerObj) {
                        if (!this.canPlayLine(playerObj, newLineKey)) {
                            const allPos = this.getPlayerAllPositions(playerObj);
                            alert(`${playerObj.name} 선수는 ${FORMATION_LINES[newLineKey].name}(${newLineKey}) 라인에서 뛸 수 없습니다.\n가능한 포지션: ${allPos.join(', ')}`);
                            this.finalizeDrag();
                            return;
                        }

                        // 이전 라인에서 제거하고 새 라인에 추가
                        const oldArr = gameData.squadLines[oldLineKey] || [];
                        const oldIdx = oldArr.findIndex(p => p && p.name === playerObj.name);
                        if (oldIdx !== -1) oldArr.splice(oldIdx, 1);

                        if (!gameData.squadLines[newLineKey]) gameData.squadLines[newLineKey] = [];
                        gameData.squadLines[newLineKey].push(playerObj);

                        this.syncLegacySquad();
                        this.finalizeDrag();
                        return;
                    }
                } else {
                    // 공석 이동
                    const oldArr = gameData.squadLines[oldLineKey] || [];
                    const nullIdx = oldArr.indexOf(null);
                    if (nullIdx !== -1) oldArr.splice(nullIdx, 1);

                    if (!gameData.squadLines[newLineKey]) gameData.squadLines[newLineKey] = [];
                    gameData.squadLines[newLineKey].push(null);

                    this.syncLegacySquad();
                    this.finalizeDrag();
                    return;
                }
            }
        }

        // 유효하지 않거나 같은 자리 드롭 시 복귀
        this.finalizeDrag();
    }
    
    finalizeDrag() {
        if (this.draggedPlayer) {
            this.draggedPlayer.remove();
            this.draggedPlayer = null;
        }
        this.originalDraggedPlayerInfo = null;
        this.displayCurrentSquad();
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
    }

    swapSquadIndices(lineKey, idx1, idx2) {
        const arr = gameData.squadLines && gameData.squadLines[lineKey];
        if (Array.isArray(arr) && arr[idx1] !== undefined && arr[idx2] !== undefined) {
            [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
            this.syncLegacySquad();
        }
    }

    // 포지션 검증 및 자동 교체 함수
    validateAndAutoCorrect() {
        console.log("[Formation] 5선 포지션 검증 및 자동 교체 시작");
        this.ensureSquadLines();
        let changesMade = false;

        const keys = ['TOP', 'AM', 'CM', 'DM', 'DF', 'GK'];

        keys.forEach(lineKey => {
            const lineArr = gameData.squadLines[lineKey] || [];
            for (let i = 0; i < lineArr.length; i++) {
                const player = lineArr[i];
                if (!player) continue;

                const allTeamPlayers = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players) || teams[gameData.selectedTeam] || [];
                const fullPlayer = allTeamPlayers.find(p => p.name === player.name) || player;

                if (!this.canPlayLine(fullPlayer, lineKey)) {
                    changesMade = true;
                    console.log(`- ${player.name} 선수가 ${lineKey} 라인에 부적합하여 교체를 진행합니다.`);

                    const replacement = this.findBestReplacement(lineKey);
                    if (replacement) {
                        console.log(`  -> ${replacement.name}으로 교체`);
                        lineArr[i] = replacement;
                    } else {
                        console.log(`  -> 적합한 후보가 없어 공석 처리`);
                        lineArr[i] = null;
                    }
                }
            }
        });

        if (changesMade) {
            this.normalizeLineSlotPositions();
            this.syncLegacySquad();
            this.displayCurrentSquad();
            if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
            if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
            alert('포지션에 맞지 않는 선수들이 자동으로 교체되었습니다.');
        } else {
            this.normalizeLineSlotPositions();
            console.log("[Formation] 모든 선수가 올바른 라인 포지션에 배치되어 있습니다.");
        }
    }

    findBestReplacement(lineKey) {
        const allTeamPlayers = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players) || teams[gameData.selectedTeam] || [];
        const inSquadNames = new Set();

        if (gameData.squadLines) {
            Object.values(gameData.squadLines).forEach(arr => {
                (arr || []).forEach(p => { if (p) inSquadNames.add(p.name); });
            });
        }

        const candidates = allTeamPlayers.filter(p => {
            const isInjured = typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, p.name);
            return this.canPlayLine(p, lineKey) && !inSquadNames.has(p.name) && !isInjured;
        }).sort((a, b) => b.rating - a.rating);

        return candidates[0] || null;
    }

    saveFormation() {
        this.ensureSquadLines();
        const l = typeof gameData !== 'undefined' && gameData ? gameData.squadLines : null;
        if (!l) return;
        const top = (l.TOP || []).filter(Boolean).length;
        const am = (l.AM || []).filter(Boolean).length;
        const cm = (l.CM || []).filter(Boolean).length;
        const dm = (l.DM || []).filter(Boolean).length;
        const df = (l.DF || []).filter(Boolean).length;
        const fName = this.getFormationDisplayName();
        alert(`포메이션이 저장되었습니다.\n전술: ${fName} (수비 ${df} · 미드 ${dm + cm + am} · 공격 ${top})`);
        console.log('[Formation] 5선 포메이션 저장 완료:', gameData.squadLines);
        this.updateTitle();
    }
    
    validate(isSaving = false) {
        this.ensureSquadLines();
        const l = typeof gameData !== 'undefined' && gameData ? gameData.squadLines : null;
        if (!l) return { valid: false, message: '게임 데이터가 없습니다.' };
        let total = 0;
        let gkCount = 0;

        ['TOP', 'AM', 'CM', 'DM', 'DF', 'GK'].forEach(k => {
            const count = (l[k] || []).filter(p => p !== null).length;
            total += count;
            if (k === 'GK') gkCount = count;
        });

        let message = '';
        if (total !== 11) {
            message = `선발 인원은 11명이어야 합니다. (현재 ${total}명)`;
        } else if (gkCount !== 1) {
            message = `골키퍼는 반드시 1명이어야 합니다. (현재 ${gkCount}명)`;
        } else {
            message = this.checkLineSlotConstraints(l, { enforceMinDefenders: true });
        }

        if (message) {
            if (isSaving) alert('[포메이션 저장 실패]\n' + message);
            return { valid: false, message: message };
        }
        
        return { valid: true, message: '포메이션 검증 완료' };
    }

    // 선수 교체 실행 (세부 포지션 중복 제한 검증 포함)
    swapPlayers(playerOut, playerIn, lineKey) {
        this.ensureSquadLines();
        const lk = lineKey || 'CM';
        const arr = gameData.squadLines[lk];
        if (!arr) return;

        // 스냅샷 백업 (제약 위반 시 롤백용)
        const backup = {};
        for (const k in gameData.squadLines) {
            backup[k] = [...(gameData.squadLines[k] || [])];
        }

        if (playerOut && playerOut.isDummy) {
            const nullIdx = arr.indexOf(null);
            if (nullIdx !== -1) {
                arr[nullIdx] = playerIn;
            } else {
                arr.push(playerIn);
            }
        } else {
            const idx = arr.findIndex(p => p && p.name === playerOut.name);
            if (idx !== -1) {
                arr[idx] = playerIn;
            } else {
                for (const k in gameData.squadLines) {
                    const subIdx = gameData.squadLines[k].findIndex(p => p && p.name === playerOut.name);
                    if (subIdx !== -1) {
                        gameData.squadLines[k][subIdx] = playerIn;
                        break;
                    }
                }
            }
        }

        if (playerIn) delete playerIn._tacticalSlotPos;
        const constraintErr = this.checkLineSlotConstraints(gameData.squadLines, { enforceMinDefenders: false });
        if (constraintErr) {
            for (const k in backup) {
                gameData.squadLines[k] = backup[k];
            }
            this.normalizeLineSlotPositions();
            alert(`[포지션 배치 제한]\n${constraintErr}`);
            return;
        }

        this.syncLegacySquad();
        this.displayCurrentSquad();
        if (typeof displayTeamPlayers === 'function') {
            displayTeamPlayers();
        }
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
    }

    // 선수가 스쿼드에 있는지 확인
    isPlayerInSquad(player) {
        if (!player) return false;
        if (gameData.squadLines) {
            for (const k in gameData.squadLines) {
                if ((gameData.squadLines[k] || []).some(p => p && p.name === player.name)) return true;
            }
        }
        const { gk, df, mf, fw } = gameData.squad || {};
        if (gk && gk.name === player.name) return true;
        const fieldPlayers = [...(df || []), ...(mf || []), ...(fw || [])].filter(Boolean);
        return fieldPlayers.some(p => p.name === player.name);
    }

    // 교체용 바텀 시트 표시
    showSubstitutionSheet(playerOut, lineKey) {
        const config = FORMATION_LINES[lineKey];
        const lineTitle = config ? `${config.name} (${config.subName})` : lineKey;
        this.sheetTitle.textContent = playerOut.isDummy ? `${lineTitle} 선수 기용` : `${playerOut.name} 교체 (${lineTitle})`;
        this.sheetPlayerList.replaceChildren();

        const posSelector = this.createSlotPositionSelector(playerOut, lineKey, () => {
            this.showSubstitutionSheet(playerOut, lineKey);
        });
        if (posSelector) {
            this.sheetPlayerList.appendChild(posSelector);
        }

        const allTeamPlayers = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players) || teams[gameData.selectedTeam] || [];
        const candidates = allTeamPlayers.filter(p => {
            const isInjured = typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, p.name);
            const notSelf = playerOut.isDummy ? true : p.name !== playerOut.name;
            const canPlay = this.canPlayLine(p, lineKey);
            return canPlay && !this.isPlayerInSquad(p) && !isInjured && notSelf;
        }).sort((a, b) => b.rating - a.rating);

        if (candidates.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.style.cssText = 'text-align: center; padding: 25px 0; color: #94a3b8; font-size: 0.95rem;';
            emptyP.textContent = `${lineTitle} 포지션을 소화할 수 있는 대기 선수가 없습니다.`;
            this.sheetPlayerList.appendChild(emptyP);
        } else {
            candidates.forEach(candidate => {
                const posLower = (candidate.position || 'mf').toLowerCase();
                const displayPos = candidate.detailPosition || candidate.position || lineKey;
                const matchPos = this.getDisplayPositionForLine(candidate, lineKey);

                const playerCard = document.createElement('div');
                playerCard.className = `player-card fc26-player-card pos-theme-${posLower}`;

                const contentDiv = document.createElement('div');
                contentDiv.className = 'player-card-content fc26-card-layout';

                const cutoutWrap = document.createElement('div');
                cutoutWrap.className = 'fc26-cutout-wrap';

                const ratingBadge = document.createElement('div');
                ratingBadge.className = 'player-rating fc26-ovr-badge';
                ratingBadge.textContent = `${Math.floor(candidate.rating)}`;

                const posBadge = document.createElement('span');
                posBadge.className = `pos-badge pos-${matchPos.toLowerCase()}`;
                posBadge.textContent = matchPos;

                const topBadgeCol = document.createElement('div');
                topBadgeCol.className = 'fc26-badge-stack';
                topBadgeCol.append(ratingBadge, posBadge);

                const img = document.createElement('img');
                img.className = 'player-card-image fc26-cutout-img';
                img.loading = 'lazy';
                img.alt = candidate.name;
                if (typeof setPlayerPhoto === 'function') {
                    setPlayerPhoto(img, candidate);
                }

                cutoutWrap.append(topBadgeCol, img);

                const infoText = document.createElement('div');
                infoText.className = 'player-info-text fc26-card-info';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name player-name';
                nameDiv.textContent = candidate.name;

                const allPos = this.getPlayerAllPositions(candidate);
                const condVal = (candidate.condition !== undefined) ? candidate.condition : 100;
                let condColor = '#A3E635';
                if (condVal < 70) condColor = '#EF4444';
                else if (condVal < 90) condColor = '#FBBF24';

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'details';
                detailsDiv.textContent = `${candidate.age}세 · 체력 ${Math.round(condVal)}% · 가능: ${allPos.join(', ')}`;

                const condBar = document.createElement('div');
                condBar.className = 'player-list-condition';
                condBar.style.cssText = 'width: 100%; height: 4px; background: rgba(255,255,255,0.12); margin-top: 6px; border-radius: 2px; overflow: hidden;';
                const condFill = document.createElement('div');
                condFill.style.cssText = `width: ${condVal}%; height: 100%; background: ${condColor}; border-radius: 2px;`;
                condBar.appendChild(condFill);
                detailsDiv.appendChild(condBar);

                infoText.append(nameDiv, detailsDiv);
                contentDiv.append(cutoutWrap, infoText);
                playerCard.appendChild(contentDiv);
                
                // 롱프레스(방출) 및 클릭(교체) 이벤트
                let pressTimer;
                let isLongPress = false;

                const startPress = () => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        if (typeof releasePlayerWithFee === 'function') {
                            releasePlayerWithFee(candidate);
                            this.hideSubstitutionSheet();
                        }
                    }, 600);
                };

                const cancelPress = () => clearTimeout(pressTimer);

                playerCard.addEventListener('mousedown', startPress);
                playerCard.addEventListener('touchstart', startPress, { passive: true });
                playerCard.addEventListener('mouseup', cancelPress);
                playerCard.addEventListener('mouseleave', cancelPress);
                playerCard.addEventListener('touchend', cancelPress);
                playerCard.addEventListener('touchmove', cancelPress);

                playerCard.onclick = () => {
                    if (isLongPress) return;
                    this.swapPlayers(playerOut, candidate, lineKey);
                    this.hideSubstitutionSheet();
                };
                
                playerCard.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (typeof releasePlayerWithFee === 'function') {
                        releasePlayerWithFee(candidate);
                        this.hideSubstitutionSheet();
                    }
                };

                this.sheetPlayerList.appendChild(playerCard);
            });
        }

        this.substitutionSheet.classList.add('active');
    }

    hideSubstitutionSheet() {
        this.substitutionSheet.classList.remove('active');
    }

    // 롤 정보 표시
    showRoleInfo(player, lineKey) {
        const render = () => {
            if (lineKey === 'GK') {
                this.showSheetContent(player.name, "골키퍼 (GK)", "최후방을 사수하는 수문장입니다.", []);
                return;
            }

            if (!gameData.playerRoles) gameData.playerRoles = {};
            const slotPos = this.getDisplayPositionForLine(player, lineKey);
            let currentRoleKey = gameData.playerRoles[player.name];

            const roleDataMap = (typeof TacticsManager !== 'undefined' && typeof TacticsManager.getRolesForPosition === 'function')
                ? TacticsManager.getRolesForPosition(lineKey, slotPos)
                : (window.RoleData ? window.RoleData[lineKey === 'TOP' ? 'attack' : (lineKey === 'DF' ? 'defense' : 'midfield')] : null);
            if (!roleDataMap) return;

            if (!currentRoleKey || !roleDataMap[currentRoleKey]) {
                currentRoleKey = (typeof TacticsManager !== 'undefined')
                    ? TacticsManager.getBestRoleForPlayer(player, lineKey, slotPos)
                    : Object.keys(roleDataMap)[0];
                gameData.playerRoles[player.name] = currentRoleKey;
            }

            const currentRoleData = roleDataMap[currentRoleKey] || (typeof TacticsManager !== 'undefined' ? TacticsManager.getRoleData(currentRoleKey) : null);
            const curSuit = (typeof TacticsManager !== 'undefined')
                ? TacticsManager.calculateRoleSuitability(player, currentRoleKey, slotPos)
                : { score: 80, stars: 4, grade: 'A', label: '적합', color: '#38BDF8' };

            const bonuses = [];
            const displayNames = {
                attack: "공격", technique: "기술", mobility: "스피드",
                defense: "수비", physical: "피지컬", mentality: "정신력"
            };
            
            if (currentRoleData) {
                for (const [key, value] of Object.entries(currentRoleData)) {
                    if (typeof value === 'number' && value !== 0 && displayNames[key]) {
                        const sign = value > 0 ? '+' : '';
                        bonuses.push({ name: displayNames[key], value: `${sign}${Math.round(value * 100)}%`, isPositive: value > 0 });
                    }
                }
            }
            
            const selectorWrap = document.createElement('div');
            selectorWrap.style.cssText = 'margin-bottom: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);';

            const posSelector = this.createSlotPositionSelector(player, lineKey, () => {
                render();
            });
            if (posSelector) {
                selectorWrap.appendChild(posSelector);
            }

            const label = document.createElement('label');
            label.style.cssText = 'color: #FBBF24; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; font-weight: bold;';
            label.textContent = `${player.name} (${slotPos}) 역할 변경 · 적합도 ${curSuit.grade} (★${curSuit.stars} · ${curSuit.score}점)`;

            const selectContainer = document.createElement('div');
            selectContainer.style.position = 'relative';

            const select = document.createElement('select');
            select.id = 'roleSelector';
            select.style.cssText = 'width: 100%; padding: 12px; padding-right: 30px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 6px; font-size: 1rem; appearance: none; cursor: pointer; outline: none;';

            for (const [key, data] of Object.entries(roleDataMap)) {
                const opt = document.createElement('option');
                opt.value = key;
                const s = (typeof TacticsManager !== 'undefined')
                    ? TacticsManager.calculateRoleSuitability(player, key, slotPos)
                    : { stars: 4, score: 80 };
                opt.textContent = `${data.name} — [★${s.stars} · ${s.score}점]`;
                if (key === currentRoleKey) opt.selected = true;
                select.appendChild(opt);
            }

            const arrow = document.createElement('div');
            arrow.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #aaa;';
            arrow.textContent = '▼';

            selectContainer.append(select, arrow);

            const hint = document.createElement('p');
            hint.style.cssText = 'color: #cbd5e1; font-size: 0.82rem; margin-top: 10px; margin-bottom: 0; line-height: 1.45;';
            hint.textContent = currentRoleData && currentRoleData.description
                ? currentRoleData.description
                : '* 이 선수의 인게임 개인 전술 역할입니다.';

            selectorWrap.append(label, selectContainer, hint);

            const lineName = `${slotPos} 슬롯 FM 역할`;
            this.showSheetContent(player.name, currentRoleData ? currentRoleData.name : "역할 없음", lineName, bonuses, selectorWrap);

            select.addEventListener('change', (e) => {
                gameData.playerRoles[player.name] = e.target.value;
                if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
                render();
                this.displayCurrentSquad();
            });
        };
        render();
    }

    showSheetContent(title, subtitle, description, stats, extraEl = null) {
        this.sheetTitle.textContent = title;
        this.sheetPlayerList.replaceChildren();

        const wrap = document.createElement('div');
        wrap.style.cssText = 'padding: 20px; color: white;';

        if (extraEl) wrap.appendChild(extraEl);

        const h3 = document.createElement('h3');
        h3.style.cssText = 'color: #ffd700; margin-top: 0; margin-bottom: 10px;';
        h3.textContent = subtitle;

        const p = document.createElement('p');
        p.style.cssText = 'color: #ccc; font-size: 0.9rem; margin-bottom: 20px;';
        p.textContent = description;

        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px;';

        stats.forEach(s => {
            const statCard = document.createElement('div');
            statCard.style.cssText = 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;';

            const nameSpan = document.createElement('span');
            nameSpan.style.fontSize = '0.9rem';
            nameSpan.textContent = s.name;

            const valSpan = document.createElement('span');
            valSpan.style.color = s.isPositive ? '#2ecc71' : '#e74c3c';
            valSpan.style.fontWeight = 'bold';
            valSpan.textContent = s.value;

            statCard.append(nameSpan, valSpan);
            grid.appendChild(statCard);
        });

        wrap.append(h3, p, grid);
        this.sheetPlayerList.appendChild(wrap);
        this.substitutionSheet.classList.add('active');
    }
}

// 5선 라인 UI 및 슬롯 스타일 주입
const formationStyle = document.createElement('style');
formationStyle.textContent = `
.field-wrapper {
    width: 100%;
    position: relative;
    margin: 0 auto;
}
.field {
    position: relative;
    display: flex;
    flex-direction: column;
}
.formation-container {
    padding: 0; 
}

/* 5선 + GK 라인 비율 배분 */
.player-area {
    position: relative;
    border: 1px dashed rgba(255, 255, 255, 0.08);
}
#top-area { flex-grow: 2.1; min-height: 85px; }
#am-area  { flex-grow: 2.1; min-height: 85px; }
#cm-area  { flex-grow: 2.0; min-height: 85px; }
#dm-area  { flex-grow: 2.0; min-height: 85px; }
#df-area  { flex-grow: 2.1; min-height: 85px; }
#gk-area  { flex-grow: 1.6; min-height: 80px; }

/* 라인 이름 라벨 태그 */
.area-line-label {
    position: absolute;
    left: 10px;
    top: 5px;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    color: rgba(255, 255, 255, 0.32);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    pointer-events: none;
    z-index: 2;
    user-select: none;
}

.formation-container .player-slot {
    position: absolute;
    width: 132px;
    height: 128px;
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center; 
    justify-content: flex-end; 
    transform: translate(-50%, -50%);
    color: #F8FAFC;
    user-select: none;
    cursor: default;
    transition: transform 0.18s ease;
    box-shadow: none !important;
    z-index: 10;
    overflow: visible;
    padding: 0;
}

.formation-container .player-slot:hover {
    transform: translate(-50%, -50%) scale(1.06);
    background: transparent !important;
    z-index: 25;
}

.formation-container .player-slot.empty {
    width: 110px;
    height: 38px;
    cursor: pointer;
}
.formation-container .player-slot.empty:hover {
    transform: translate(-50%, -50%) scale(1.05);
}

.formation-container .player-slot-avatar-wrap {
    width: 110px;
    height: 96px;
    overflow: visible !important;
    position: relative;
    z-index: 15;
    margin-bottom: -22px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    pointer-events: none;
    border-radius: 8px 8px 0 0;
}

.formation-container .player-slot-image {
    width: 110px !important;
    height: 110px !important;
    object-fit: contain !important;
    object-position: center bottom !important;
    transform: scale(1.48) translateY(30px) !important;
    transform-origin: center bottom !important;
    pointer-events: none;
    position: static !important;
    margin: 0 !important;
    z-index: 15;
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.75));
}

.formation-container .player-slot-nameplate {
    width: 128px;
    max-width: 132px;
    background: rgba(15, 23, 42, 0.90) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    border: 1px solid rgba(255, 255, 255, 0.18) !important;
    border-radius: 8px;
    padding: 5px 8px;
    position: relative;
    z-index: 25;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.formation-container .player-slot-nameplate.empty-plate {
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px dashed rgba(255, 255, 255, 0.3) !important;
}
.formation-container .player-slot.empty:hover .empty-plate {
    border-color: #FBBF24 !important;
    background: rgba(15, 23, 42, 0.85) !important;
}

.formation-container .player-slot:hover .player-slot-nameplate {
    border-color: rgba(56, 189, 248, 0.6) !important;
    background: rgba(15, 23, 42, 0.96) !important;
}

.formation-container .player-slot-name-row {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    min-width: 0;
}

/* 세부 포지션 뱃지 */
.slot-pos-badge {
    font-size: 0.62rem !important;
    font-weight: 900 !important;
    padding: 1px 4px !important;
    border-radius: 3px !important;
    line-height: 1.1 !important;
    color: #ffffff !important;
    flex-shrink: 0 !important;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    box-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
/* 공격 (빨강) */
.pos-tag-st, .pos-tag-cf, .pos-tag-fw, .pos-tag-lw, .pos-tag-rw { background: #EF4444 !important; color: #ffffff !important; }
/* 미드 (초록) */
.pos-tag-cam, .pos-tag-am, .pos-tag-cm, .pos-tag-lm, .pos-tag-rm, .pos-tag-cdm, .pos-tag-dm, .pos-tag-mf { background: #10B981 !important; color: #ffffff !important; }
/* 수비 (파랑) */
.pos-tag-cb, .pos-tag-lb, .pos-tag-rb, .pos-tag-lwb, .pos-tag-rwb, .pos-tag-df, .pos-tag-sw { background: #3B82F6 !important; color: #ffffff !important; }
/* 키퍼 (노랑) */
.pos-tag-gk { background: #F59E0B !important; color: #1e293b !important; font-weight: 900 !important; }

.formation-container .field .player-slot {
    cursor: grab;
}

.formation-container .field .player-slot.dragging {
    transform: none;
    cursor: grabbing;
    z-index: 1000;
    width: 132px;
    height: 128px;
}

.formation-container .field .player-slot.dragging .player-slot-nameplate {
    border-color: #FBBF24 !important;
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.45);
}

.formation-container .player-slot .player-rating {
    font-size: 0.98rem !important;
    font-weight: 900 !important;
    letter-spacing: -0.03em;
    font-variant-numeric: tabular-nums;
    color: #38BDF8 !important;
    margin: 0 !important;
    line-height: 1.1;
    flex-shrink: 0;
    position: static !important;
}

.formation-container .player-slot .player-name {
    font-size: 0.88rem !important;
    font-weight: 800 !important;
    color: #F8FAFC !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 100% !important;
    flex: 1;
    min-width: 0;
    margin: 0 !important;
    line-height: 1.15;
    text-align: left;
    position: static !important;
}

.formation-container .player-slot .player-condition-bar {
    width: 100% !important;
    height: 4px !important;
    background-color: rgba(255, 255, 255, 0.16);
    border-radius: 2px;
    margin: 2px 0 0 0 !important;
    overflow: hidden;
}

.formation-container .player-slot .condition-fill,
.condition-fill {
    height: 100% !important;
    display: block !important;
    border-radius: 2px;
    transition: width 0.3s ease;
}

.formation-container .player-slot .player-role {
    position: absolute;
    top: 2px;
    right: 6px;
    font-size: 0.65rem;
    color: #090D16;
    font-weight: 900;
    background-color: #FBBF24;
    padding: 2px 5px;
    border-radius: 4px;
    line-height: 1;
    z-index: 30;
    box-shadow: 0 2px 6px rgba(0,0,0,0.45);
}

#editFormationBtn.confirm {
    background: #A3E635;
    color: #090D16;
}

/* 바텀 시트 스타일 */
.bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(30, 41, 59, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    z-index: 2000;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    color: white;
}
.bottom-sheet.active {
    transform: translateY(0);
}
.sheet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.25);
    border-radius: 24px 24px 0 0;
    flex-shrink: 0;
}
.sheet-header h4 { margin: 0; color: #ffd700; font-size: 1.15rem; font-weight: 800; }
.close-sheet-btn { font-size: 2rem; cursor: pointer; color: #aaa; line-height: 1; }
.close-sheet-btn:hover { color: white; }

.sheet-player-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    -webkit-overflow-scrolling: touch;
}
.sheet-player-list::-webkit-scrollbar { width: 6px; }
.sheet-player-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
.sheet-player-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.field.role-view-mode .player-slot {
    cursor: help !important;
    border-color: #38bdf8 !important;
}

@media (max-width: 768px) {
    #top-area, #am-area, #cm-area, #dm-area, #df-area { min-height: 64px; }
    #gk-area { min-height: 56px; }
    .formation-container .player-slot {
        width: 82px;
        height: 72px;
    }
    .formation-container .player-slot.empty {
        width: 72px;
        height: 30px;
    }
    .formation-container .player-slot-avatar-wrap {
        width: 60px;
        height: 50px;
        margin-bottom: -12px;
    }
    .formation-container .player-slot-image {
        width: 60px !important;
        height: 60px !important;
        transform: scale(1.18) translateY(16px) !important;
    }
    .formation-container .player-slot-nameplate {
        width: 82px;
        max-width: 84px;
        padding: 3px 4px;
    }
    .slot-pos-badge {
        font-size: 0.55rem !important;
        padding: 1px 3px !important;
    }
    .formation-container .player-slot .player-name {
        font-size: 0.68rem !important;
    }
    .formation-container .player-slot .player-rating {
        font-size: 0.72rem !important;
    }
    .area-line-label {
        font-size: 0.58rem;
        left: 6px;
        top: 2px;
    }
}
`;
document.head.appendChild(formationStyle);

let formationSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        formationSystem = new FormationSystem();
        window.formationSystem = formationSystem;
    }, 100);
});

window.refreshFormation = function() {
    if (formationSystem) {
        formationSystem.ensureSquadLines();
        formationSystem.displayCurrentSquad();
    } else {
        formationSystem = new FormationSystem();
        window.formationSystem = formationSystem;
    }
};

window.validateFormationBeforeMatch = function() {
    if (!formationSystem) {
        alert('포메이션 시스템 오류!');
        return false;
    }
    const result = formationSystem.validate(false);
    if (!result.valid) {
        alert(result.message);
        return false;
    }
    return true;
};

window.FormationSystem = FormationSystem;
