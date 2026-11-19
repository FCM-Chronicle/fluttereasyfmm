// formation.js - 새로운 자유 포메이션 시스템

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
            FW: document.getElementById('fw-area'),
            MF: document.getElementById('mf-area'),
            DF: document.getElementById('df-area'),
            GK: document.getElementById('gk-area'),
        };

        this.substitutionSheet = document.getElementById('substitutionSheet');
        this.sheetTitle = document.getElementById('sheetTitle');
        this.sheetPlayerList = document.getElementById('sheetPlayerList');
        const closeSheetBtn = document.getElementById('closeSubstitutionSheet');
        if (closeSheetBtn) closeSheetBtn.addEventListener('click', () => this.hideSubstitutionSheet());
        
        this.createControlButtons(); // [수정] 버튼 생성 함수 교체
        this.displayCurrentSquad();
        this.setupDragEvents();
    }
    
    // [수정] 컨트롤 버튼 생성 (수정 버튼 + 롤 정보 버튼)
    createControlButtons() {
        const container = document.querySelector('.squad-controls');
        if (!container) return;
        
        container.replaceChildren(); // 기존 내용 초기화

        // 버튼 컨테이너
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'formation-controls';
        

        // 1. 롤 정보 버튼 (왼쪽)
        const roleBtn = document.createElement('button');
        roleBtn.id = 'viewRoleBtn';
        roleBtn.className = 'btn btn-sm';
        roleBtn.textContent = '롤 정보';
        roleBtn.onclick = () => this.toggleRoleViewMode();

        // 2. 포메이션 수정 버튼 (오른쪽)
        const editBtn = document.createElement('button');
        editBtn.id = 'editFormationBtn';
        editBtn.className = 'btn btn-sm primary';
        editBtn.textContent = '포메이션 수정';
        editBtn.onclick = () => this.toggleEditMode();

        const titleSpan = document.createElement('span');
        titleSpan.className = 'formation-controls-title';
        titleSpan.textContent = '베스트 11 선발 라인업';
        const btnGroup = document.createElement('div');
        btnGroup.className = 'formation-controls-btns';
        btnGroup.append(roleBtn, editBtn);
        controlsDiv.append(titleSpan, btnGroup);
        container.appendChild(controlsDiv);
    }
    
    toggleEditMode() {
        if (this.isRoleViewMode) this.toggleRoleViewMode(); // 롤 보기 모드 끄기

        this.isEditMode = !this.isEditMode;
        const btn = document.getElementById('editFormationBtn');
        
        if (this.isEditMode) {
            btn.textContent = '수정 완료';
            btn.classList.add('confirm');
            this.field.classList.add('edit-mode');
            alert('포메이션 수정 모드가 활성화되었습니다. 선수를 드래그하여 위치를 자유롭게 변경하세요.');
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

    // [신규] 롤 정보 보기 모드 토글
    toggleRoleViewMode() {
        if (this.isEditMode) this.toggleEditMode(); // 수정 모드 끄기

        this.isRoleViewMode = !this.isRoleViewMode;
        const btn = document.getElementById('viewRoleBtn');
        const field = document.querySelector('.field');
        
        if (this.isRoleViewMode) {
            btn.textContent = '닫기';
            btn.classList.add('is-on');
            field.classList.add('role-view-mode'); // 커서 스타일 변경용 클래스
        } else {
            btn.textContent = '롤 정보';
            btn.classList.remove('is-on');
            field.classList.remove('role-view-mode');
            this.hideSubstitutionSheet();
        }
    }
    
    displayCurrentSquad() {
        Object.values(this.areas).forEach(area => area.replaceChildren());
        
        const squad = gameData.squad;
        const positions = ['GK', 'DF', 'MF', 'FW'];
        const positionMap = { GK: [squad.gk], DF: squad.df, MF: squad.mf, FW: squad.fw };
    
        positions.forEach(pos => {
            // null 값을 포함하여 전체 선수 배열을 가져옵니다.
            const playersWithNulls = positionMap[pos];
            if (!playersWithNulls) return;
    
            const total = playersWithNulls.length;
    
            playersWithNulls.forEach((player, index) => {
                const x = (100 / (total + 1)) * (index + 1);
                const y = pos === 'GK' ? 32 : 50;
                // player가 null이면 빈 슬롯을, 아니면 선수 슬롯을 생성합니다.
                this.createPlayerElement(player, pos, x, y, index);
            });
        });
    }
    
    createPlayerElement(player, positionType, x, y, index) {
        const slot = document.createElement('div');
        slot.className = 'player-slot';
        slot.style.left = x + '%';
        slot.style.top = y + '%';
        slot.dataset.index = index; // [추가] 교체를 위해 인덱스 정보 저장 (모든 슬롯)
    
        if (player) {
            // [추가] 역할 표시 로직
            let roleDisplay = '';
            if (positionType !== 'GK' && typeof gameData !== 'undefined') {
                // 1. 개별 역할 확인
                if (gameData.playerRoles && gameData.playerRoles[player.name]) {
                    roleDisplay = gameData.playerRoles[player.name];
                } 
                // 2. 없으면 기존 라인 역할(하위 호환) 또는 기본값
                else if (gameData.lineRoles) {
                    // 표시 안 함 (개별 설정 유도)
                }
            }

            // [신규] 체력바 색상 및 너비 계산
            const condition = (player.condition !== undefined) ? player.condition : 100;
            let condColor = '#A3E635';
            if (condition < 70) condColor = '#EF4444';
            else if (condition < 90) condColor = '#FBBF24';

            // 선수가 있는 경우 (어색한 하단 잘림 방지를 위한 아바타 래퍼 + 유리 네임플레이트 구조)
            const avatarWrap = document.createElement('div');
            avatarWrap.className = 'player-slot-avatar-wrap';

            const slotImg = document.createElement('img');
            slotImg.className = 'player-slot-image';
            slotImg.loading = 'lazy';
            slotImg.alt = player.name;
            setPlayerPhoto(slotImg, player);
            avatarWrap.appendChild(slotImg);

            const nameplate = document.createElement('div');
            nameplate.className = 'player-slot-nameplate';

            const nameRow = document.createElement('div');
            nameRow.className = 'player-slot-name-row';

            const slotRating = document.createElement('span');
            slotRating.className = 'player-rating';
            slotRating.textContent = Math.floor(player.rating);

            const slotName = document.createElement('span');
            slotName.className = 'player-name';
            slotName.textContent = player.name;
            slotName.title = player.name;

            nameRow.append(slotRating, slotName);

            const condBar = document.createElement('div');
            condBar.className = 'player-condition-bar';
            const condFill = document.createElement('div');
            condFill.className = 'condition-fill';
            condFill.style.width = `${condition}%`;
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
            slot.dataset.positionType = positionType;
            slot.classList.add('filled');
    
            // [수정] 클릭 이벤트 통합 (교체 및 롤 정보)
            slot.addEventListener('click', (e) => {
                if (this.isEditMode) return;

                if (this.isRoleViewMode) {
                    this.showRoleInfo(player, positionType);
                } else {
                    this.showSubstitutionSheet(player, positionType);
                }
            });

        } else {
            // 선수가 없는 경우 (공석)
            const nameplate = document.createElement('div');
            nameplate.className = 'player-slot-nameplate empty-plate';

            const nameRow = document.createElement('div');
            nameRow.className = 'player-slot-name-row';

            const emptyRating = document.createElement('span');
            emptyRating.className = 'player-rating';
            emptyRating.style.opacity = '0.6';
            emptyRating.textContent = positionType;

            const emptyName = document.createElement('span');
            emptyName.className = 'player-name';
            emptyName.style.opacity = '0.6';
            emptyName.textContent = '공석';

            nameRow.append(emptyRating, emptyName);
            nameplate.appendChild(nameRow);
            slot.appendChild(nameplate);
            slot.dataset.positionType = positionType;
            slot.classList.add('empty');
    
            // [수정] 클릭 이벤트 통합 (공석 교체)
            slot.addEventListener('click', (e) => {
                if (this.isEditMode) return;
                
                const dummyPlayer = { name: `공석 (${positionType})`, isDummy: true };
                this.showSubstitutionSheet(dummyPlayer, positionType);
            });
        }
    
        this.areas[positionType].appendChild(slot);
        return slot;
    }
    
    setupDragEvents() {
        this.field.addEventListener('mousedown', e => this.onDragStart(e));
        this.field.addEventListener('touchstart', e => this.onDragStart(e), { passive: false });

        document.addEventListener('mousemove', e => this.onDragMove(e));
        document.addEventListener('touchmove', e => this.onDragMove(e), { passive: false });

        document.addEventListener('mouseup', e => this.onDragEnd(e));
        document.addEventListener('touchend', e => this.onDragEnd(e.changedTouches[0]));
    }
    
    onDragStart(e) {
        const touch = e.touches ? e.touches[0] : e;
        const target = touch.target.closest('.player-slot');

        if (!target) return;

        // GK는 움직일 수 없음
        if (target.dataset.positionType === 'GK' && this.areas.GK.contains(target)) {
            if (this.isEditMode) alert('골키퍼는 교체만 가능하며, 필드 내에서 위치를 변경할 수 없습니다.');
            return;
        }

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
            if (navigator.vibrate) navigator.vibrate(50); // 햅틱 피드백
            this.isLongPressDrag = true;
            this.startDragging(e, target);
        }, this.longPressDuration);
    }

    startDragging(e, target) {
        // 드래그 시작 시 원래 선수 정보 저장
        this.originalDraggedPlayerInfo = {
            name: target.dataset.playerName,
            positionType: target.dataset.positionType
        };

        this.draggedPlayer = target;
        const rect = this.draggedPlayer.getBoundingClientRect();
        const fieldRect = this.field.getBoundingClientRect();

        const touch = e.touches ? e.touches[0] : e;

        // 드래그 시작 시 field를 기준으로 절대 위치 설정
        this.draggedPlayer.style.left = `${touch.clientX - fieldRect.left - (this.draggedPlayer.offsetWidth / 2)}px`;
        this.draggedPlayer.style.top = `${touch.clientY - fieldRect.top - (this.draggedPlayer.offsetHeight / 2)}px`;
        
        // 부모를 field로 옮겨서 영역의 제약에서 벗어남 (기존 로직 유지)
        this.field.appendChild(this.draggedPlayer);
        this.draggedPlayer.classList.add('dragging');
        
        this.offsetX = this.draggedPlayer.offsetWidth / 2;
        this.offsetY = this.draggedPlayer.offsetHeight / 2;
    }
    
    onDragMove(e) {
        const touch = e.touches ? e.touches[0] : e;

        // 롱프레스 대기 중 움직임 감지 시 타이머 취소
        if (this.longPressTimer && !this.isLongPressDrag) {
            const moveX = Math.abs(touch.clientX - this.startX);
            const moveY = Math.abs(touch.clientY - this.startY);
            if (moveX > 10 || moveY > 10) { // 10px 이상 움직이면 취소
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }

        if (!this.draggedPlayer) return;
        
        // passive: false가 제대로 동작하지 않는 브라우저를 위해 추가
        if (e.cancelable) {
            e.preventDefault();
        }

        const fieldRect = this.field.getBoundingClientRect();
        let x = touch.clientX - fieldRect.left - this.offsetX;
        let y = touch.clientY - fieldRect.top - this.offsetY;

        // 필드 경계 제한
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

        const touch = e.touches ? e.touches[0] : e;
        const dropX = touch.clientX;
        const dropY = touch.clientY;

        // [신규] 같은 포지션 내 선수 교체 (Swap) 감지
        this.draggedPlayer.style.display = 'none'; // 드래그 중인 요소를 숨겨서 아래 요소를 감지
        const elemBelow = document.elementFromPoint(dropX, dropY);
        this.draggedPlayer.style.display = ''; // 다시 표시

        const targetSlot = elemBelow ? elemBelow.closest('.player-slot') : null;

        if (targetSlot && targetSlot !== this.draggedPlayer) {
            const sourcePos = this.originalDraggedPlayerInfo.positionType;
            const targetPos = targetSlot.dataset.positionType;

            // 같은 포지션 그룹이고 GK가 아닌 경우 교체 (예: MF <-> MF)
            if (sourcePos === targetPos && sourcePos !== 'GK') {
                const sourceIndex = parseInt(this.draggedPlayer.dataset.index);
                const targetIndex = parseInt(targetSlot.dataset.index);

                if (!isNaN(sourceIndex) && !isNaN(targetIndex)) {
                    this.swapSquadIndices(sourcePos, sourceIndex, targetIndex);
                    this.finalizeDrag();
                    return;
                }
            }
        }

        let targetArea = null;
        for (const pos in this.areas) {
            const areaRect = this.areas[pos].getBoundingClientRect();
            if (dropX >= areaRect.left && dropX <= areaRect.right &&
                dropY >= areaRect.top && dropY <= areaRect.bottom) {
                targetArea = this.areas[pos];
                break;
            }
        }

        const newPositionType = targetArea ? targetArea.dataset.positionType : null;
        const oldPositionType = this.originalDraggedPlayerInfo.positionType;

        // 유효한 드롭 영역인지 확인 (필드 플레이어는 GK 영역으로 이동 불가)
        if (targetArea && (newPositionType !== 'GK' || oldPositionType === 'GK')) {
            // 포지션이 변경된 경우
            if (newPositionType !== oldPositionType) {
                const playerName = this.originalDraggedPlayerInfo.name;

                if (playerName) { // 실제 선수를 옮기는 경우
                    const playerObj = teams[gameData.selectedTeam].find(p => p.name === playerName);
                    if (playerObj) {
                        // 1. gameData에서 선수 이동
                        const oldPosKey = oldPositionType.toLowerCase();
                        if (oldPosKey === 'gk') {
                            gameData.squad.gk = null;
                        } else {
                            gameData.squad[oldPosKey] = gameData.squad[oldPosKey].filter(p => p && p.name !== playerObj.name);
                        }
                        const newPosKey = newPositionType.toLowerCase();
                        if (newPosKey === 'gk') {
                            gameData.squad.gk = playerObj;
                        } else {
                            gameData.squad[newPosKey].push(playerObj);
                        }
                    }
                } else { // 공석을 옮기는 경우
                    // 1. 이전 포지션에서 null 제거
                    const oldPosKey = oldPositionType.toLowerCase();
                    const nullIndex = gameData.squad[oldPosKey].indexOf(null);
                    if (nullIndex > -1) {
                        gameData.squad[oldPosKey].splice(nullIndex, 1);
                    }
                    // 2. 새로운 포지션에 null 추가
                    const newPosKey = newPositionType.toLowerCase();
                    gameData.squad[newPosKey].push(null);
                }
                // 2. 드래그된 원본 DOM 요소를 제거하여 복제 문제 방지
                this.draggedPlayer.remove();
                // 3. 화면 전체를 다시 그려서 데이터와 동기화 (자동 정렬 포함)
                this.displayCurrentSquad();
                
                // [추가] 스쿼드 변경 시 DNA 포인트 재계산
                if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
            } else { // 같은 포지션 내에서 위치만 변경된 경우
                targetArea.appendChild(this.draggedPlayer);
                const areaRect = targetArea.getBoundingClientRect();
                // Calculate newLeft and newTop relative to the targetArea's top-left corner.
                // These should be the coordinates of the *center* of the player slot, as transform: translate(-50%, -50%) will be applied.
                const newLeft = touch.clientX - areaRect.left;
                const newTop = touch.clientY - areaRect.top;
                this.draggedPlayer.style.left = `${(newLeft / areaRect.width) * 100}%`;
                this.draggedPlayer.style.top = `${(newTop / areaRect.height) * 100}%`;
            }
        } else {
            // 유효하지 않은 영역에 드롭 시, 드래그했던 DOM 요소를 제거하고 화면을 다시 그림
            // 이렇게 하면 선수가 복제되지 않고 원래 상태로 돌아감
            this.draggedPlayer.remove();
            this.displayCurrentSquad();
            if (targetArea && targetArea.id === 'gk-area') {
                alert('필드 플레이어는 GK 영역으로 이동할 수 없습니다.');
            }
        }

        this.finalizeDrag(false); // false means don't need to re-render if just removed (but here we removed and re-rendered in if/else blocks mostly)
        // Actually, the logic above handles re-rendering or removing.
        // Let's just clean up.
        this.originalDraggedPlayerInfo = null; // 드래그 정보 초기화
        this.draggedPlayer.classList.remove('dragging');
        this.draggedPlayer = null;
    }
    
    // [신규] 드래그 종료 후 처리 (스왑 시 사용)
    finalizeDrag() {
        this.draggedPlayer.remove();
        this.displayCurrentSquad();
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
        this.originalDraggedPlayerInfo = null;
        this.draggedPlayer = null;
    }

    // [신규] 스쿼드 배열 내 인덱스 교체
    swapSquadIndices(posType, idx1, idx2) {
        const key = posType.toLowerCase();
        const arr = gameData.squad[key];
        if (Array.isArray(arr)) {
            [arr[idx1], arr[idx2]] = [arr[idx2], arr[idx1]];
        }
    }

    // 포지션 검증 및 자동 교체 함수
    validateAndAutoCorrect() {
        console.log("[Formation] 포지션 검증 및 자동 교체 시작");
        let changesMade = false;
        const currentSquadOnField = this.getCurrentFieldSquad();
        const finalSquad = {
            gk: currentSquadOnField.GK[0] || null,
            df: [...currentSquadOnField.DF],
            mf: [...currentSquadOnField.MF],
            fw: [...currentSquadOnField.FW]
        };

        // 모든 포지션 영역을 순회
        for (const positionType of ['GK', 'DF', 'MF', 'FW']) {
            const playersInArea = currentSquadOnField[positionType];
            const originalCount = playersInArea.length;
            const correctedPlayers = []; // 수정된 선수 목록

            for (const player of playersInArea) {
                const originalPlayer = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players)
                    ? allTeams[gameData.selectedTeam].players.find(p => p.name === player.name)
                    : null;
                const fullPlayer = originalPlayer || player;

                if (!this.canPlayPosition(fullPlayer, positionType)) {
                    changesMade = true;
                    console.log(`- ${player.name}(원래 ${fullPlayer.position})가 ${positionType} 자리에 뛸 수 없어 잘못 배치되었습니다.`);

                    // 교체 선수 찾기
                    const replacement = this.findBestReplacement(positionType, finalSquad);
                    if (replacement) {
                        console.log(`  -> ${replacement.name}(${replacement.rating})으로 자동 교체합니다.`);
                        correctedPlayers.push(replacement);
                        // 교체된 선수는 더 이상 후보가 아님
                        this.addToTempSquad(finalSquad, replacement);
                    } else {
                        console.log(`  -> 교체할 ${positionType} 선수가 없어 공석으로 처리합니다.`);
                        correctedPlayers.push(null); // 자리를 비우기 위해 null 추가
                    }
                } else {
                    // 포지션 소화 가능한 선수는 그대로 유지
                    correctedPlayers.push(player);
                }
            }

            // 최종 스쿼드 업데이트
            if (positionType === 'GK') {
                finalSquad.gk = correctedPlayers[0] || null;
            } else {
                finalSquad[positionType.toLowerCase()] = correctedPlayers;
            }
        }

        if (changesMade) {
            console.log("[Formation] 자동 교체 완료. 최종 스쿼드를 반영합니다.");
            gameData.squad = finalSquad; // 선수 교체 및 공석이 반영된 스쿼드로 업데이트
            this.displayCurrentSquad(); // 변경된 스쿼드를 화면에 다시 그림
            displayTeamPlayers(); // 선수 목록도 새로고침
            
            // [추가] 자동 교체 후 DNA 포인트 재계산
            if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
            alert('포지션에 맞지 않는 선수들이 자동으로 교체되었습니다.');
        } else {
            console.log("[Formation] 모든 선수가 올바른 포지션에 있습니다.");
        }
    }

    // 현재 필드 위의 선수들을 객체로 반환하는 헬퍼 함수
    getCurrentFieldSquad() {
        const squad = { GK: [], DF: [], MF: [], FW: [] };
        for (const pos in this.areas) {
            const area = this.areas[pos];
            area.querySelectorAll('.player-slot').forEach(slot => {
                const player = allTeams[gameData.selectedTeam].players.find(p => p.name === slot.dataset.playerName);
                if (player) squad[pos].push(player);
            });
        }
        return squad;
    }

    // 최고의 교체 선수를 찾는 헬퍼 함수
    findBestReplacement(positionType, currentFinalSquad) {
        const allTeamPlayers = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players) || [];
        
        // 현재 최종 스쿼드에 포함된 선수들의 이름 목록
        const squadPlayerNames = new Set();
        if (currentFinalSquad.gk) squadPlayerNames.add(currentFinalSquad.gk.name);
        ['df', 'mf', 'fw'].forEach(posKey => {
            (currentFinalSquad[posKey] || []).forEach(p => p && squadPlayerNames.add(p.name));
        });

        const candidates = allTeamPlayers.filter(p =>
            this.canPlayPosition(p, positionType) && !squadPlayerNames.has(p.name)
        ).sort((a, b) => b.rating - a.rating);

        return candidates[0] || null;
    }

    // 임시 스쿼드에 선수를 추가하는 헬퍼 함수
    addToTempSquad(squad, player) {
        const posKey = player.position.toLowerCase();
        if (posKey === 'gk') {
            squad.gk = player;
        } else {
            squad[posKey].push(player);
        }
    }

    saveFormation() {
        // onDragEnd에서 gameData.squad가 이미 업데이트되었으므로, 여기서는 유효성 검사만 수행하고 저장 메시지를 표시합니다.
        alert(`포메이션이 저장되었습니다.\n(${gameData.squad.df.length}-${gameData.squad.mf.length}-${gameData.squad.fw.length})`);
        console.log('[Formation] 포메이션 저장 완료:', gameData.squad);
    }
    
    validate(isSaving = false) {
        const counts = { GK: 0, DF: 0, MF: 0, FW: 0 };
        let total = 0;

        // gameData.squad의 실제 선수(null이 아닌) 수를 기준으로 카운트
        if (gameData.squad.gk) {
            counts.GK++;
            total++;
        }
        ['df', 'mf', 'fw'].forEach(posKey => {
            const players = gameData.squad[posKey].filter(p => p !== null);
            counts[posKey.toUpperCase()] = players.length;
            total += players.length;
        });

        let message = '';

        if (total !== 11) {
            message = `선발 인원은 11명이어야 합니다. (현재 ${total}명)`;
        }

        if (message) {
            if (isSaving) alert('[포메이션 저장 실패]\n' + message);
            return { valid: false, message: message };
        }
        
        return { valid: true, message: '포메이션 검증 완료' };
    }

    // [신규] 선수가 해당 포지션 슬롯(GK, DF, MF, FW)에서 뛸 수 있는지 판정
    canPlayPosition(player, targetPositionType) {
        if (!player) return false;
        const target = (targetPositionType || '').toUpperCase();
        const basePos = (player.position || '').toUpperCase();
        if (basePos === target) return true;

        const detailPos = (player.detailPosition || '').toUpperCase();
        const otherPositions = Array.isArray(player.otherPositions)
            ? player.otherPositions.map(p => (p || '').toUpperCase())
            : [];

        // 공격수(FW) 슬롯: 원래 MF더라도 LW, RW, ST, CF, FW 등을 소화할 수 있으면 가능
        if (target === 'FW') {
            const attackPositions = ['FW', 'ST', 'CF', 'LW', 'RW'];
            if (attackPositions.includes(detailPos)) return true;
            if (otherPositions.some(p => attackPositions.includes(p))) return true;
        }
        // 미드필더(MF) 슬롯: CAM, CM, CDM, LM, RM, MF 등을 소화할 수 있으면 가능
        else if (target === 'MF') {
            const midPositions = ['MF', 'CAM', 'CM', 'CDM', 'LM', 'RM', 'AM', 'DM'];
            if (midPositions.includes(detailPos)) return true;
            if (otherPositions.some(p => midPositions.includes(p))) return true;
        }
        // 수비수(DF) 슬롯: CB, LB, RB, LWB, RWB, SW, DF 등을 소화할 수 있으면 가능
        else if (target === 'DF') {
            const defPositions = ['DF', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'];
            if (defPositions.includes(detailPos)) return true;
            if (otherPositions.some(p => defPositions.includes(p))) return true;
        }
        // 골키퍼(GK) 슬롯: GK만 가능
        else if (target === 'GK') {
            return basePos === 'GK' || detailPos === 'GK';
        }

        return false;
    }

    // 선수 교체 실행
    swapPlayers(playerOut, playerIn, positionType) {
        const posKey = positionType.toLowerCase();

        if (posKey === 'gk') {
            gameData.squad.gk = playerIn;
        } else {
            // 이름으로 선수를 찾아 교체 (공석이 아니면 해당 위치 선수를 교체)
            const index = gameData.squad[posKey].findIndex(p => 
                p && p.name === playerOut.name);
            if (index !== -1) {
                gameData.squad[posKey][index] = playerIn;
            }
        }

        // 화면 및 선수 목록 새로고침
        this.displayCurrentSquad();
        if (typeof displayTeamPlayers === 'function') {
            displayTeamPlayers();
        }
    }

    // 선수가 스쿼드에 있는지 확인하는 헬퍼 함수
    isPlayerInSquad(player) {
        const { gk, df, mf, fw } = gameData.squad;
        if (gk && gk.name === player.name) return true;
        const fieldPlayers = [...df, ...mf, ...fw].filter(p => p);
        return fieldPlayers.some(p => p.name === player.name);
    }

    // [신규] 교체용 바텀 시트 표시
    showSubstitutionSheet(playerOut, positionType) {
        this.sheetTitle.textContent = `${playerOut.name} 교체`;
        this.sheetPlayerList.replaceChildren();

        const teamPlayers = teams[gameData.selectedTeam];
        const candidates = teamPlayers.filter(p => {
            const originalPlayer = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players)
                ? allTeams[gameData.selectedTeam].players.find(pl => pl.name === p.name)
                : null;
            const fullPlayer = originalPlayer || p;

            const isInjured = typeof injurySystem !== 'undefined' && injurySystem.isInjured(gameData.selectedTeam, p.name);
            
            // 해당 포지션 슬롯(positionType)에서 뛸 수 있고, 현재 스쿼드에 없는 선수만 필터링
            // 단, playerOut이 더미(공석)가 아닐 경우, playerOut 자신은 후보에서 제외
            const notSelf = playerOut.isDummy ? true : p.name !== playerOut.name;
            const canPlay = this.canPlayPosition(fullPlayer, positionType);
            
            return canPlay && !this.isPlayerInSquad(p) && !isInjured && notSelf;
        });

        if (candidates.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.style.cssText = 'text-align: center; padding: 20px 0; color: #aaa;';
            emptyP.textContent = '교체 가능한 선수가 없습니다.';
            this.sheetPlayerList.appendChild(emptyP);
        } else {
            candidates.forEach(candidate => {
                const orig = (allTeams[gameData.selectedTeam] && allTeams[gameData.selectedTeam].players)
                    ? allTeams[gameData.selectedTeam].players.find(pl => pl.name === candidate.name)
                    : null;
                const full = orig || candidate;
                const posLower = (full.position || positionType || 'mf').toLowerCase();
                const displayPos = full.detailPosition || full.position || positionType;
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
                posBadge.className = `pos-badge pos-${posLower}`;
                posBadge.textContent = displayPos;

                const topBadgeCol = document.createElement('div');
                topBadgeCol.className = 'fc26-badge-stack';
                topBadgeCol.append(ratingBadge, posBadge);

                const img = document.createElement('img');
                img.className = 'player-card-image fc26-cutout-img';
                img.loading = 'lazy';
                img.alt = candidate.name;
                setPlayerPhoto(img, candidate);

                cutoutWrap.append(topBadgeCol, img);

                const infoText = document.createElement('div');
                infoText.className = 'player-info-text fc26-card-info';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'name player-name';
                nameDiv.textContent = candidate.name;

                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'details';
                detailsDiv.textContent = `${candidate.age}세 · 교체 대기`;

                infoText.append(nameDiv, detailsDiv);
                contentDiv.append(cutoutWrap, infoText);
                playerCard.appendChild(contentDiv);
                
                // [수정] 롱프레스(방출) 및 클릭(교체) 이벤트 처리
                let pressTimer;
                let isLongPress = false;

                const startPress = () => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        // 방출 함수 호출 (script.js에 정의됨)
                        if (typeof releasePlayerWithFee === 'function') {
                            releasePlayerWithFee(candidate);
                            this.hideSubstitutionSheet();
                        }
                    }, 600); // 600ms 롱프레스
                };

                const cancelPress = () => {
                    clearTimeout(pressTimer);
                };

                // 터치 및 마우스 이벤트 등록
                playerCard.addEventListener('mousedown', startPress);
                playerCard.addEventListener('touchstart', startPress, { passive: true });
                playerCard.addEventListener('mouseup', cancelPress);
                playerCard.addEventListener('mouseleave', cancelPress);
                playerCard.addEventListener('touchend', cancelPress);
                playerCard.addEventListener('touchmove', cancelPress);

                playerCard.onclick = (e) => {
                    if (isLongPress) return; // 롱프레스였으면 클릭 무시
                    this.swapPlayers(playerOut, candidate, positionType);
                    this.hideSubstitutionSheet();
                };
                
                // 우클릭 이벤트 (PC 방출 편의성)
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

    // [신규] 교체용 바텀 시트 숨기기
    hideSubstitutionSheet() {
        this.substitutionSheet.classList.remove('active');
    }

    // [신규] 롤 정보 표시 (바텀 시트 재사용)
    showRoleInfo(player, positionType) {
        const render = () => {
            // 포지션 타입을 라인(line)으로 변환
            let line = 'defense';
            if (positionType === 'FW') line = 'attack';
            else if (positionType === 'MF') line = 'midfield';
            else if (positionType === 'DF') line = 'defense';
            else if (positionType === 'GK') {
                this.showSheetContent(player.name, "골키퍼", "최후방을 사수하는 수문장입니다.", []);
                return;
            }

            // [수정] 개별 역할 가져오기
            if (!gameData.playerRoles) gameData.playerRoles = {};
            
            let currentRoleKey = gameData.playerRoles[player.name];
            
            // 설정된 역할이 없으면 기본값 할당
            if (!currentRoleKey) {
                if (line === 'attack') currentRoleKey = 'AF';
                else if (line === 'midfield') currentRoleKey = 'BBM';
                else currentRoleKey = 'BPD';
                
                // 기본값을 저장
                gameData.playerRoles[player.name] = currentRoleKey;
            }

            // 역할 데이터 가져오기
            const roleDataMap = window.RoleData ? window.RoleData[line] : null;
            if (!roleDataMap) return;

            const currentRoleData = roleDataMap[currentRoleKey];
            
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
            
            // [추가] 역할 변경 셀렉터 생성
            const selectorWrap = document.createElement('div');
            selectorWrap.style.cssText = 'margin-bottom: 20px; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);';

            const label = document.createElement('label');
            label.style.cssText = 'color: #FBBF24; font-size: 0.9rem; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; font-weight: bold;';
            if (typeof window.createIcon === 'function') {
                label.appendChild(window.createIcon('refresh'));
            }
            label.appendChild(document.createTextNode(`${player.name}의 역할 변경`));

            const selectContainer = document.createElement('div');
            selectContainer.style.position = 'relative';

            const select = document.createElement('select');
            select.id = 'roleSelector';
            select.style.cssText = 'width: 100%; padding: 12px; padding-right: 30px; background: #2c3e50; color: white; border: 1px solid #555; border-radius: 6px; font-size: 1rem; appearance: none; cursor: pointer; outline: none;';

            for (const [key, data] of Object.entries(roleDataMap)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = data.name;
                if (key === currentRoleKey) opt.selected = true;
                select.appendChild(opt);
            }

            const arrow = document.createElement('div');
            arrow.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #aaa;';
            arrow.textContent = '';

            selectContainer.append(select, arrow);

            const hint = document.createElement('p');
            hint.style.cssText = 'color: #aaa; font-size: 0.8rem; margin-top: 8px; margin-bottom: 0;';
            hint.textContent = '* 이 선수의 개인 전술 역할입니다.';

            selectorWrap.append(label, selectContainer, hint);

            const lineName = line === 'attack' ? '공격진' : line === 'midfield' ? '미드필더진' : '수비진';
            this.showSheetContent(player.name, currentRoleData ? currentRoleData.name : "역할 없음", currentRoleData ? `${lineName} 역할` : "", bonuses, selectorWrap);

            // 셀렉터 이벤트 바인딩
            select.addEventListener('change', (e) => {
                // [수정] 개별 선수 역할 저장
                gameData.playerRoles[player.name] = e.target.value;
                
                if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
                render(); // 변경 후 UI 갱신
                this.displayCurrentSquad(); // [추가] 필드 UI 즉시 갱신 (역할 태그 업데이트)
            });
        };
        render();
    }

    // [신규] 바텀 시트 내용 채우기 (롤 정보용)
    showSheetContent(title, subtitle, description, stats, extraEl = null) {
        this.sheetTitle.textContent = title;
        this.sheetPlayerList.replaceChildren();

        const wrap = document.createElement('div');
        wrap.style.cssText = 'padding: 20px; color: white;';

        if (extraEl) {
            wrap.appendChild(extraEl);
        }

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

// CSS 추가 (기존 style 태그 내용에 추가)
const newStyle = `
.player-slot.empty {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 18px;
    cursor: pointer;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    /* 빈 슬롯은 안으로 파인 느낌 (Pressed Clay) */
    box-shadow: inset 4px 4px 8px rgba(0,0,0,0.2), inset -4px -4px 8px rgba(255,255,255,0.1);
}
.player-slot.empty:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #ffd700;
}

/* 바텀 시트 스타일 강제 주입 (CSS 깨짐 방지) */
.bottom-sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(40, 50, 60, 0.65);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top-left-radius: 30px;
    border-top-right-radius: 30px;
    box-shadow: 0 -10px 40px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.1);
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    z-index: 2000; /* 모달보다 높게 */
    max-height: 80vh; /* 높이 증가 */
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
    background: rgba(0,0,0,0.2);
    border-radius: 15px 15px 0 0;
    flex-shrink: 0; /* 헤더 크기 고정 */
}
.sheet-header h4 { margin: 0; color: #ffd700; font-size: 1.2rem; }
.close-sheet-btn { font-size: 2rem; cursor: pointer; color: #aaa; line-height: 1; }
.close-sheet-btn:hover { color: white; }

.sheet-player-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    -webkit-overflow-scrolling: touch;
}
/* 스크롤바 스타일 */
.sheet-player-list::-webkit-scrollbar { width: 6px; }
.sheet-player-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
.sheet-player-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.field.role-view-mode .player-slot {
    cursor: help !important;
    border-color: #3498db !important;
    animation: pulse-border 2s infinite;
}
@keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(52, 152, 219, 0); }
    100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
}

.player-role {
    font-size: 0.7rem;
    color: #f1c40f;
    font-weight: bold;
    background-color: rgba(0, 0, 0, 0.6);
    padding: 1px 4px;
    border-radius: 3px;
    margin-top: 2px;
    line-height: 1;
    z-index: 5;
}

/* 체력바 스타일 */
.player-condition-bar {
    width: 80%;
    height: 4px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 2px;
    margin-top: 2px;
    overflow: hidden;
    z-index: 30;
}
.condition-fill {
    height: 100%;
    transition: width 0.3s ease;
}
`;

// 기존 스타일 태그를 찾아 새 스타일을 추가하거나, 없으면 새로 만듭니다.
let styleTag = document.querySelector('style');
if (styleTag) {
    styleTag.textContent += newStyle;
} else {
    styleTag = document.createElement('style');
    styleTag.textContent = newStyle;
    document.head.appendChild(styleTag);
}

// FormationSystem 클래스의 swapPlayers 메서드 수정
const originalSwapPlayers = FormationSystem.prototype.swapPlayers;
FormationSystem.prototype.swapPlayers = function(playerOut, playerIn, positionType) {
    if (playerOut.isDummy) {
        // 공석 채우기
        if (positionType === 'GK') {
            // 골키퍼 공석 채우기
            gameData.squad.gk = playerIn;
        } else {
            // 필드 플레이어 공석 채우기
            const posKey = positionType.toLowerCase();
            const emptyIndex = gameData.squad[posKey].findIndex(p => p === null);
            if (emptyIndex !== -1) {
                gameData.squad[posKey][emptyIndex] = playerIn;
            }
        }
    } else {
        // 기존 선수 교체 로직
        originalSwapPlayers.call(this, playerOut, playerIn, positionType);
    }

    // 화면 새로고침
    this.displayCurrentSquad();
    if (typeof displayTeamPlayers === 'function') {
        displayTeamPlayers();
    }
    
    // [추가] 선수 교체 시 DNA 포인트 재계산
    if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
};

// CSS
const style = document.createElement('style');
style.textContent = `
.field-wrapper {
    width: 100%;
    padding-top: 25%;
    position: relative;
    margin: 0 auto;
}
.field {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
}
.formation-container {
    padding: 0; 
}
.player-area {
    position: relative;
    border: 1px dashed rgba(255, 255, 255, 0.08);
}
#fw-area { flex-grow: 3.1; }
#mf-area { flex-grow: 3.1; }
#df-area { flex-grow: 3.1; }
#gk-area { flex-grow: 1.9; }

.field .player-area {
    border-color: rgba(255, 255, 255, 0.08);
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

.formation-container .player-slot::before,
.formation-container .player-slot::after {
    display: none !important;
    content: none !important;
}

.formation-container .player-slot:hover {
    transform: translate(-50%, -50%) scale(1.06);
    background: transparent !important;
    z-index: 25;
}

/* 골키퍼 슬롯 하단 잘림 방지 (하단 기준 안전 여백 고정) */
.formation-container .field:not(.edit-mode) #gk-area .player-slot {
    top: auto !important;
    bottom: 16px !important;
    transform: translateX(-50%) !important;
}

.formation-container .field:not(.edit-mode) #gk-area .player-slot:hover {
    transform: translateX(-50%) scale(1.06) !important;
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
    background: rgba(15, 23, 42, 0.88) !important;
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

.formation-container .player-slot:hover .player-slot-nameplate {
    border-color: rgba(56, 189, 248, 0.6) !important;
    background: rgba(15, 23, 42, 0.96) !important;
}

.formation-container .player-slot-name-row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    min-width: 0;
}

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
    font-size: 1.05rem !important;
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
    font-size: 0.92rem !important;
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
    background-color: rgba(255, 255, 255, 0.12);
    border-radius: 2px;
    margin: 0 !important;
    overflow: hidden;
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

@media (max-width: 768px) {
    .formation-container .player-slot {
        width: 82px;
        height: 74px;
    }
    .formation-container .field:not(.edit-mode) #gk-area .player-slot {
        bottom: 8px !important;
    }
    .formation-container .player-slot-avatar-wrap {
        width: 60px;
        height: 52px;
        overflow: visible !important;
        margin-bottom: -12px;
    }
    .formation-container .player-slot-image {
        width: 60px !important;
        height: 60px !important;
        object-fit: contain !important;
        object-position: center bottom !important;
        transform: scale(1.18) translateY(16px) !important;
        transform-origin: center bottom !important;
    }
    .formation-container .player-slot-nameplate {
        width: 82px;
        max-width: 84px;
        padding: 3px 5px;
    }
    .formation-container .player-slot .player-name {
        font-size: 0.68rem !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }
    .formation-container .player-slot .player-rating {
        font-size: 0.72rem !important;
    }
    .field-wrapper {
        padding-top: 65%;
    }
    .btn, button.btn {
        padding: 12px 16px !important;
        font-size: 1rem !important;
        min-height: 48px;
        margin-bottom: 5px;
    }
    .formation-controls .btn {
        flex: 1;
        padding: 10px 8px !important;
        font-size: 0.9rem !important;
        white-space: nowrap;
    }
    .dashboard-card {
        min-height: 110px !important;
        padding: 20px 15px !important;
    }
    .tab-btn {
        min-height: 50px !important;
        padding: 12px 5px !important;
    }
    .main-load-slot {
        padding: 15px !important;
    }
}
`;
document.head.appendChild(style);

let formationSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        formationSystem = new FormationSystem();
        window.formationSystem = formationSystem;
    }, 100);
});

window.refreshFormation = function() {
    if (formationSystem) {
        formationSystem.displayCurrentSquad();
    } else {
        formationSystem = new FormationSystem();
    }
};

window.validateFormationBeforeMatch = function() {
    if (!formationSystem) {
        alert('포메이션 시스템 오류!');
        return false;
    }
    
    // 저장하지 않고 현재 상태만 검증
    const result = formationSystem.validate(false);
    
    if (!result.valid) {
        alert(result.message);
        return false;
    }
    
    return true;
};

window.FormationSystem = FormationSystem;