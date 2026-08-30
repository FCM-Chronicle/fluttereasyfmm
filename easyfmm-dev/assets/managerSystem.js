// managerSystem.js

const managerSystem = {
    managers: [],
    activeManagerId: null,
    editingManagerId: null,

    init() {
        this.loadManagers();
        this.migrateLegacySaves(); // 마이그레이션 확인
        this.renderManagerList();
        this.setupEventListeners();
        if (typeof showScreen === 'function') {
            showScreen('managerSelectionScreen');
        }
    },

    loadManagers() {
        const stored = localStorage.getItem('fm_managers');
        if (stored) {
            this.managers = JSON.parse(stored);
        } else {
            this.managers = [];
        }
    },

    saveManagers() {
        localStorage.setItem('fm_managers', JSON.stringify(this.managers));
    },

    migrateLegacySaves() {
        let hasLegacySaves = false;
        const legacySaves = [];
        
        for (let i = 1; i <= 3; i++) {
            const save = localStorage.getItem(`footballManagerSave_slot${i}`);
            if (save) {
                hasLegacySaves = true;
                legacySaves.push({ slot: i, data: save });
            }
        }

        if (hasLegacySaves) {
            // "기존 감독" 생성
            const legacyManager = {
                id: `legacy_${Date.now()}`,
                name: "기존 감독 (Legacy)",
                nation: "알 수 없음",
                age: 40,
                stats: { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 },
                created: Date.now()
            };
            this.managers.push(legacyManager);
            this.saveManagers();

            // 기존 세이브 파일을 새로운 키 형식(fm_save_{id}_slot{i})으로 복사/이동
            legacySaves.forEach(item => {
                localStorage.setItem(`fm_save_${legacyManager.id}_slot${item.slot}`, item.data);
                localStorage.removeItem(`footballManagerSave_slot${item.slot}`); // 기존 슬롯 삭제
            });

            console.log("레거시 세이브 마이그레이션 완료", legacyManager);
        }
    },

    setupEventListeners() {
        document.getElementById('createNewManagerBtn')?.addEventListener('click', () => {
            this.openEditModal();
        });

        document.getElementById('closeManagerEditModal')?.addEventListener('click', () => {
            document.getElementById('managerEditModal').style.display = 'none';
        });

        document.getElementById('saveManagerInfoBtn')?.addEventListener('click', () => {
            this.saveManagerInfo();
        });

        document.getElementById('closeManagerProfileModal')?.addEventListener('click', () => {
            document.getElementById('managerProfileModal').style.display = 'none';
        });

        document.getElementById('editManagerProfileBtn')?.addEventListener('click', () => {
            document.getElementById('managerProfileModal').style.display = 'none';
            this.openEditModal(this.activeManagerId);
        });

        document.getElementById('deleteManagerBtn')?.addEventListener('click', () => {
            if (confirm("정말 이 감독과 관련된 모든 세이브 데이터를 삭제하시겠습니까?")) {
                this.deleteManager(this.activeManagerId);
            }
        });
    },

    openEditModal(managerId = null) {
        this.editingManagerId = managerId;
        const modal = document.getElementById('managerEditModal');
        const title = document.getElementById('managerEditTitle');
        const nameInput = document.getElementById('managerNameInput');
        const nationInput = document.getElementById('managerNationInput');
        const ageInput = document.getElementById('managerAgeInput');

        if (managerId) {
            title.textContent = "감독 정보 수정";
            const manager = this.managers.find(m => m.id === managerId);
            nameInput.value = manager.name;
            nationInput.value = manager.nation || "";
            ageInput.value = manager.age || 40;
        } else {
            title.textContent = "새 감독 생성";
            nameInput.value = "";
            nationInput.value = "";
            ageInput.value = "";
        }

        modal.style.display = 'flex';
    },

    saveManagerInfo() {
        const name = document.getElementById('managerNameInput').value.trim();
        const nation = document.getElementById('managerNationInput').value.trim();
        const age = parseInt(document.getElementById('managerAgeInput').value) || 40;

        if (!name) return alert("감독 이름을 입력하세요.");

        if (this.editingManagerId) {
            const manager = this.managers.find(m => m.id === this.editingManagerId);
            if (manager) {
                manager.name = name;
                manager.nation = nation;
                manager.age = age;
            }
        } else {
            const newManager = {
                id: `manager_${Date.now()}`,
                name: name,
                nation: nation,
                age: age,
                stats: { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 },
                created: Date.now()
            };
            this.managers.push(newManager);
            this.activeManagerId = newManager.id;
        }

        this.saveManagers();
        document.getElementById('managerEditModal').style.display = 'none';
        
        // 프로필 갱신 또는 리스트 갱신
        this.renderManagerList();
        if (this.editingManagerId) {
            this.openProfileModal(this.editingManagerId);
        } else {
            this.openProfileModal(this.activeManagerId);
        }
    },

    deleteManager(managerId) {
        this.managers = this.managers.filter(m => m.id !== managerId);
        this.saveManagers();
        
        // 관련 세이브 슬롯 삭제
        for(let i=1; i<=3; i++) {
            localStorage.removeItem(`fm_save_${managerId}_slot${i}`);
        }

        document.getElementById('managerProfileModal').style.display = 'none';
        this.renderManagerList();
    },

    renderManagerList() {
        const grid = document.getElementById('managerListGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (this.managers.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #aaa; padding: 40px;">등록된 감독이 없습니다. 새 감독을 생성해주세요.</div>`;
            return;
        }

        this.managers.forEach(manager => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(255,255,255,0.05); 
                border: 1px solid rgba(255,215,0,0.2); 
                border-radius: 10px; 
                padding: 20px; 
                cursor: pointer;
                transition: transform 0.2s, background 0.2s;
            `;
            card.onmouseover = () => {
                card.style.transform = 'translateY(-5px)';
                card.style.background = 'rgba(255,255,255,0.1)';
            };
            card.onmouseout = () => {
                card.style.transform = 'translateY(0)';
                card.style.background = 'rgba(255,255,255,0.05)';
            };
            card.onclick = () => this.openProfileModal(manager.id);

            card.innerHTML = `
                <h2 style="color: #ffd700; margin-top: 0;">${manager.name}</h2>
                <div style="font-size: 0.9rem; color: #ddd; display: grid; gap: 5px;">
                    <div>국적: ${manager.nation || '미상'}</div>
                    <div>우승: ${manager.stats?.trophies || 0}회</div>
                    <div>전적: ${manager.stats?.matches || 0}전 ${manager.stats?.wins || 0}승 ${manager.stats?.draws || 0}무 ${manager.stats?.losses || 0}패</div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openProfileModal(managerId) {
        this.activeManagerId = managerId;
        const manager = this.managers.find(m => m.id === managerId);
        if (!manager) return;

        document.getElementById('profileManagerName').textContent = manager.name;
        document.getElementById('profileManagerNation').textContent = manager.nation || "미상";
        document.getElementById('profileManagerAge').textContent = manager.age || "?";
        document.getElementById('profileManagerMatches').textContent = manager.stats?.matches || 0;
        document.getElementById('profileManagerWDL').textContent = `${manager.stats?.wins || 0} / ${manager.stats?.draws || 0} / ${manager.stats?.losses || 0}`;
        document.getElementById('profileManagerTrophies').textContent = manager.stats?.trophies || 0;

        this.renderSaveSlotsForManager(managerId);

        document.getElementById('managerProfileModal').style.display = 'flex';
    },

    renderSaveSlotsForManager(managerId) {
        const grid = document.getElementById('managerSaveSlotsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 1; i <= 3; i++) {
            const slotKey = `fm_save_${managerId}_slot${i}`;
            const saveDataStr = localStorage.getItem(slotKey);
            
            const slotDiv = document.createElement('div');
            slotDiv.className = 'save-slot';
            slotDiv.style.cssText = `
                background: rgba(0,0,0,0.3);
                border: 1px solid #444;
                border-radius: 8px;
                padding: 15px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 120px;
            `;

            if (saveDataStr) {
                try {
                    const saveData = JSON.parse(saveDataStr);
                    const gData = saveData.gameData || {};
                    const tName = gData.selectedTeam ? (typeof teamNames !== 'undefined' && teamNames[gData.selectedTeam] ? teamNames[gData.selectedTeam] : gData.selectedTeam) : '팀 없음';
                    const sCount = gData.seasonCount || 1;
                    const date = saveData.timestamp ? new Date(saveData.timestamp).toLocaleString() : '날짜 없음';

                    slotDiv.innerHTML = `
                        <div>
                            <h4 style="margin:0 0 5px 0; color:#2ecc71;">슬롯 ${i}</h4>
                            <div style="font-size:0.9rem;">${tName}</div>
                            <div style="font-size:0.8rem; color:#aaa;">시즌 ${sCount}</div>
                            <div style="font-size:0.75rem; color:#777; margin-top:5px;">${date}</div>
                        </div>
                        <button class="btn primary small" style="margin-top:10px;" onclick="managerSystem.loadGame('${managerId}', ${i})">불러오기</button>
                    `;
                } catch(e) {
                    slotDiv.innerHTML = `<div>슬롯 ${i} <br> 데이터 오류</div>`;
                }
            } else {
                slotDiv.innerHTML = `
                    <div style="color:#aaa; text-align:center; margin-bottom:10px;">빈 슬롯</div>
                    <button class="btn success small" onclick="managerSystem.startNewCareer('${managerId}', ${i})">새 커리어 시작</button>
                `;
            }
            grid.appendChild(slotDiv);
        }
    },

    loadGame(managerId, slotIndex) {
        // 전역 gameData에 현재 감독 ID 주입
        if (typeof gameData !== 'undefined') {
            gameData.managerId = managerId;
            gameData.saveSlotIndex = slotIndex;
        }
        
        document.getElementById('managerProfileModal').style.display = 'none';
        
        // 기존의 loadFromSlot 기능 활용
        if (typeof loadFromSlot === 'function') {
            loadFromSlot(slotIndex, managerId);
        }
    },

    startNewCareer(managerId, slotIndex) {
        if (typeof gameData !== 'undefined') {
            gameData.managerId = managerId;
            gameData.saveSlotIndex = slotIndex;
        }

        document.getElementById('managerProfileModal').style.display = 'none';
        
        if (typeof showScreen === 'function') {
            showScreen('teamSelection');
        }
    },

    updateManagerStats(managerId, resultObj) {
        const manager = this.managers.find(m => m.id === managerId);
        if (!manager) return;

        manager.stats = manager.stats || { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 };
        
        if (resultObj.win) manager.stats.wins++;
        else if (resultObj.draw) manager.stats.draws++;
        else if (resultObj.loss) manager.stats.losses++;
        
        if (resultObj.trophy) manager.stats.trophies++;
        
        manager.stats.matches++;
        this.saveManagers();
    }
};

window.managerSystem = managerSystem;
