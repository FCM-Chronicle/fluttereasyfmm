// managerSystem.js - 프리미엄 감독 관리 및 생성 시스템

const MANAGER_AVATARS = [
    { id: "suit", emoji: "👔", label: "모던 수트" },
    { id: "tracksuit", emoji: "🧢", label: "야전 지휘관" },
    { id: "glasses", emoji: "👓", label: "지능파 전술가" },
    { id: "trench", emoji: "🧥", label: "카리스마 명장" },
    { id: "maestro", emoji: "🦁", label: "마에스트로" },
    { id: "legend", emoji: "🎩", label: "레전드 감독" },
    { id: "fire", emoji: "🔥", label: "열정의 지략가" },
    { id: "wizard", emoji: "🧙‍♂️", label: "전술 마법사" }
];

const MANAGER_PHILOSOPHIES = {
    attacking: {
        id: "attacking",
        name: "닥공 & 게겐프레싱",
        icon: "⚡",
        badge: "Heavy Metal",
        desc: "초고속 템포와 전방 압박으로 상대를 압도하며, 공격진의 사기 상승폭이 큽니다.",
        color: "#e74c3c"
    },
    defensive: {
        id: "defensive",
        name: "철벽 수비 & 카테나치오",
        icon: "🛡️",
        badge: "Iron Wall",
        desc: "견고한 수비 블록으로 실점을 최소화하고 안정적인 승점을 확보합니다.",
        color: "#3498db"
    },
    youth: {
        id: "youth",
        name: "유스 육성 & 멘토링",
        icon: "🌟",
        badge: "Youth Guru",
        desc: "23세 이하 유망주들의 잠재력 폭발 확률과 성장 속도가 20% 증가합니다.",
        color: "#2ecc71"
    },
    moneyball: {
        id: "moneyball",
        name: "머니볼 & 협상 달인",
        icon: "💼",
        badge: "Mastermind",
        desc: "이적료 및 주급 협상 테이블에서 유리한 조건을 이끌어내는 능력을 발휘합니다.",
        color: "#f39c12"
    }
};

const RANDOM_MANAGER_NAMES = [
    // 한국 레전드 & 베테랑 명장
    "차범근", "허정무", "김학범", "조광래", "최강희", "박항서", "신태용", "황선홍", "홍명보", "최용수",
    "김도훈", "이장수", "정해성", "김판곤", "조성환", "남기일", "정정용", "서정원", "유상철", "최순호",
    
    // K리그 현역 & 신흥 전술가
    "이정효", "김기동", "박태하", "윤정환", "변성환", "박진섭", "김은중", "이민성", "염기훈", "설기현",
    "김남일", "이영표", "김병지", "안정환", "하석주", "이을용", "김상식", "이임생", "고정운", "김대의",

    // 글로벌 현역 트렌드 & 빅클럽 명장
    "펩 과르디올라", "위르겐 클롭", "카를로 안첼로티", "미켈 아르테타", "한지 플릭", "사비 알론소",
    "우나이 에메리", "루이스 엔리케", "아르네 슬롯", "루벤 아모림", "빈센트 콤파니", "엔조 마레스카",
    "티아고 모타", "율리안 나겔스만", "로베르토 데 제르비", "시모네 인자기", "지안 피에로 가스페리니",
    "세바스티안 회네스", "마르코 로제", "에딘 테르지치", "리오넬 스칼로니", "디디에 데샹",

    // 글로벌 명장 & 베테랑 승부사
    "조제 무리뉴", "지네딘 지단", "안토니오 콘테", "토마스 투헬", "디에고 시메오네", "사비 에르난데스",
    "에릭 텐하흐", "엔제 포스테코글루", "마우리시오 포체티노", "마시밀리아노 알레그리", "마우리치오 사리",
    "루이스 판 할", "라파엘 베니테스", "클라우디오 라니에리", "마르셀로 비엘사", "마르셀로 가야르도",

    // 축구사 레전드 & 한국 대표팀 인연
    "알렉스 퍼거슨", "아르센 벵거", "요한 크루이프", "아리고 사키", "리누스 미헬스", "밥 페이슬리",
    "마르첼로 리피", "파비오 카펠로", "비센테 델 보스케", "오트마어 히츠펠트", "거스 히딩크", "딕 아드보카트"
];

const NATION_FLAGS = {
    "대한민국": "🇰🇷",
    "잉글랜드": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "스페인": "🇪🇸",
    "독일": "🇩🇪",
    "프랑스": "🇫🇷",
    "이탈리아": "🇮🇹",
    "브라질": "🇧🇷",
    "아르헨티나": "🇦🇷",
    "포르투갈": "🇵🇹",
    "네덜란드": "🇳🇱",
    "일본": "🇯🇵",
    "기타": "🌐"
};

const managerSystem = {
    managers: [],
    activeManagerId: null,
    editingManagerId: null,

    // 크리에이터 임시 상태
    creatorState: {
        name: "",
        nation: "대한민국",
        flag: "🇰🇷",
        age: 45,
        avatar: "👔",
        philosophy: "attacking"
    },

    init() {
        this.loadManagers();
        this.migrateLegacySaves();
        this.renderManagerList();
        this.setupEventListeners();
        this.setupCreatorInteractions();
        if (typeof showScreen === 'function') {
            showScreen('managerSelectionScreen');
        }
    },

    loadManagers() {
        const stored = localStorage.getItem('fm_managers');
        if (stored) {
            try {
                this.managers = JSON.parse(stored);
            } catch (e) {
                this.managers = [];
            }
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

        if (hasLegacySaves && this.managers.length === 0) {
            const legacyManager = {
                id: `legacy_${Date.now()}`,
                name: "기존 감독 (Legacy)",
                nation: "대한민국",
                flag: "🇰🇷",
                age: 45,
                avatar: "👔",
                philosophy: "attacking",
                title: "전성기 명장",
                stats: { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 },
                created: Date.now()
            };
            this.managers.push(legacyManager);
            this.saveManagers();

            legacySaves.forEach(item => {
                localStorage.setItem(`fm_save_${legacyManager.id}_slot${item.slot}`, item.data);
                localStorage.removeItem(`footballManagerSave_slot${item.slot}`);
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

        document.getElementById('backToManagerBtn')?.addEventListener('click', () => {
            if (typeof showScreen === 'function') {
                showScreen('managerSelectionScreen');
            }
        });

        document.getElementById('randomNameBtn')?.addEventListener('click', () => {
            this.pickRandomName();
        });
    },

    setupCreatorInteractions() {
        const nameInput = document.getElementById('managerNameInput');
        const nationSelect = document.getElementById('managerNationSelect');
        const ageRange = document.getElementById('managerAgeRange');

        nameInput?.addEventListener('input', (e) => {
            this.creatorState.name = e.target.value;
            this.updateLiveCard();
        });

        nationSelect?.addEventListener('change', (e) => {
            const opt = e.target.selectedOptions[0];
            this.creatorState.nation = opt.value;
            this.creatorState.flag = opt.dataset.flag || NATION_FLAGS[opt.value] || "🌐";
            this.updateLiveCard();
        });

        ageRange?.addEventListener('input', (e) => {
            this.creatorState.age = parseInt(e.target.value);
            const ageDisplay = document.getElementById('ageValueDisplay');
            if (ageDisplay) ageDisplay.textContent = `${this.creatorState.age}세`;
            this.updateLiveCard();
        });
    },

    renderAvatarPicker() {
        const grid = document.getElementById('avatarPickerGrid');
        if (!grid) return;
        grid.innerHTML = '';

        MANAGER_AVATARS.forEach(item => {
            const card = document.createElement('div');
            card.className = `avatar-card-opt ${this.creatorState.avatar === item.emoji ? 'active' : ''}`;
            card.innerHTML = `
                <span class="opt-emoji">${item.emoji}</span>
                <span class="opt-name">${item.label}</span>
            `;
            card.onclick = () => {
                this.creatorState.avatar = item.emoji;
                grid.querySelectorAll('.avatar-card-opt').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
                this.updateLiveCard();
            };
            grid.appendChild(card);
        });
    },

    renderPhilosophyPicker() {
        const grid = document.getElementById('philoPickerGrid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.values(MANAGER_PHILOSOPHIES).forEach(philo => {
            const card = document.createElement('div');
            card.className = `philosophy-card-opt ${this.creatorState.philosophy === philo.id ? 'active' : ''}`;
            card.innerHTML = `
                <div class="philo-opt-header">
                    <span>${philo.icon}</span>
                    <span>${philo.name}</span>
                </div>
                <div class="philo-opt-desc">${philo.desc}</div>
            `;
            card.onclick = () => {
                this.creatorState.philosophy = philo.id;
                grid.querySelectorAll('.philosophy-card-opt').forEach(el => el.classList.remove('active'));
                card.classList.add('active');
                this.updateLiveCard();
            };
            grid.appendChild(card);
        });
    },

    getTitleByAge(age) {
        if (age < 40) return "젊은 혁신가";
        if (age < 50) return "전성기 명장";
        if (age < 60) return "노련한 지략가";
        return "백전노장 마에스트로";
    },

    updateLiveCard() {
        const nameEl = document.getElementById('prevName');
        const flagEl = document.getElementById('prevFlag');
        const nationEl = document.getElementById('prevNation');
        const ageEl = document.getElementById('prevAge');
        const avatarEl = document.getElementById('prevAvatar');
        const titleBadgeEl = document.getElementById('prevTitleBadge');
        const philoBadgeEl = document.getElementById('prevPhiloBadge');

        const name = this.creatorState.name.trim() || "신임 감독";
        if (nameEl) nameEl.textContent = name;
        if (flagEl) flagEl.textContent = this.creatorState.flag;
        if (nationEl) nationEl.textContent = this.creatorState.nation;
        if (ageEl) ageEl.textContent = `${this.creatorState.age}세`;
        if (avatarEl) avatarEl.textContent = this.creatorState.avatar;
        if (titleBadgeEl) titleBadgeEl.textContent = this.getTitleByAge(this.creatorState.age);

        const currentPhilo = MANAGER_PHILOSOPHIES[this.creatorState.philosophy] || MANAGER_PHILOSOPHIES.attacking;
        if (philoBadgeEl) {
            philoBadgeEl.innerHTML = `<span>${currentPhilo.icon}</span> ${currentPhilo.name}`;
            philoBadgeEl.style.borderColor = currentPhilo.color;
            philoBadgeEl.style.color = currentPhilo.color;
        }
    },

    pickRandomName() {
        const randomName = RANDOM_MANAGER_NAMES[Math.floor(Math.random() * RANDOM_MANAGER_NAMES.length)];
        this.creatorState.name = randomName;
        const nameInput = document.getElementById('managerNameInput');
        if (nameInput) nameInput.value = randomName;
        this.updateLiveCard();
    },

    openEditModal(managerId = null) {
        this.editingManagerId = managerId;
        const modal = document.getElementById('managerEditModal');
        const title = document.getElementById('managerEditTitle');
        const nameInput = document.getElementById('managerNameInput');
        const nationSelect = document.getElementById('managerNationSelect');
        const ageRange = document.getElementById('managerAgeRange');
        const ageDisplay = document.getElementById('ageValueDisplay');

        if (managerId) {
            title.textContent = "감독 프로필 수정";
            const manager = this.managers.find(m => m.id === managerId);
            if (manager) {
                this.creatorState = {
                    name: manager.name || "",
                    nation: manager.nation || "대한민국",
                    flag: manager.flag || NATION_FLAGS[manager.nation] || "🇰🇷",
                    age: manager.age || 45,
                    avatar: manager.avatar || "👔",
                    philosophy: manager.philosophy || "attacking"
                };
            }
        } else {
            title.textContent = "새 감독 정식 등록";
            this.creatorState = {
                name: "",
                nation: "대한민국",
                flag: "🇰🇷",
                age: 45,
                avatar: "👔",
                philosophy: "attacking"
            };
        }

        if (nameInput) nameInput.value = this.creatorState.name;
        if (nationSelect) nationSelect.value = this.creatorState.nation;
        if (ageRange) ageRange.value = this.creatorState.age;
        if (ageDisplay) ageDisplay.textContent = `${this.creatorState.age}세`;

        this.renderAvatarPicker();
        this.renderPhilosophyPicker();
        this.updateLiveCard();

        modal.style.display = 'flex';
    },

    saveManagerInfo() {
        const name = this.creatorState.name.trim();
        if (!name) return alert("감독 이름을 입력해주세요.");

        const nation = this.creatorState.nation;
        const flag = this.creatorState.flag || NATION_FLAGS[nation] || "🌐";
        const age = this.creatorState.age;
        const avatar = this.creatorState.avatar;
        const philosophy = this.creatorState.philosophy;
        const title = this.getTitleByAge(age);

        if (this.editingManagerId) {
            const manager = this.managers.find(m => m.id === this.editingManagerId);
            if (manager) {
                manager.name = name;
                manager.nation = nation;
                manager.flag = flag;
                manager.age = age;
                manager.avatar = avatar;
                manager.philosophy = philosophy;
                manager.title = title;
            }
        } else {
            const newManager = {
                id: `manager_${Date.now()}`,
                name: name,
                nation: nation,
                flag: flag,
                age: age,
                avatar: avatar,
                philosophy: philosophy,
                title: title,
                stats: { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 },
                created: Date.now()
            };
            this.managers.push(newManager);
            this.activeManagerId = newManager.id;
        }

        this.saveManagers();
        document.getElementById('managerEditModal').style.display = 'none';
        
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
        
        for (let i = 1; i <= 3; i++) {
            localStorage.removeItem(`fm_save_${managerId}_slot${i}`);
        }

        document.getElementById('managerProfileModal').style.display = 'none';
        this.renderManagerList();
    },

    renderManagerList() {
        const grid = document.getElementById('managerListGrid');
        const countBadge = document.getElementById('managerCountBadge');
        if (!grid) return;
        
        grid.innerHTML = '';
        if (countBadge) countBadge.textContent = `${this.managers.length}명`;
        
        if (this.managers.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #aaa; padding: 60px 20px; background: rgba(255,255,255,0.03); border-radius: 20px; border: 1px dashed rgba(255,215,0,0.2);">
                    <div style="font-size: 3.5rem; margin-bottom: 12px;">👔</div>
                    <h3 style="color: #fff; margin-bottom: 8px;">등록된 감독이 없습니다</h3>
                    <p style="color: #888; margin-bottom: 20px;">'새 감독 생성' 버튼을 눌러 여러분만의 사령탑을 등록하고 축구 세계를 제패하세요!</p>
                    <button class="btn primary" onclick="managerSystem.openEditModal()" style="font-weight: 800; padding: 12px 28px;">✨ 첫 감독 생성하기</button>
                </div>
            `;
            return;
        }

        this.managers.forEach(manager => {
            const avatar = manager.avatar || "👔";
            const flag = manager.flag || NATION_FLAGS[manager.nation] || "🇰🇷";
            const nation = manager.nation || "대한민국";
            const philo = MANAGER_PHILOSOPHIES[manager.philosophy] || MANAGER_PHILOSOPHIES.attacking;
            const matches = manager.stats?.matches || 0;
            const wins = manager.stats?.wins || 0;
            const draws = manager.stats?.draws || 0;
            const losses = manager.stats?.losses || 0;
            const trophies = manager.stats?.trophies || 0;
            const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : "0.0";

            // 세이브 슬롯 사용 개수 확인
            let activeSlots = 0;
            for (let i = 1; i <= 3; i++) {
                if (localStorage.getItem(`fm_save_${manager.id}_slot${i}`)) activeSlots++;
            }

            const card = document.createElement('div');
            card.className = 'manager-card-premium';
            card.onclick = () => this.openProfileModal(manager.id);

            card.innerHTML = `
                <div>
                    <div class="mgr-card-top">
                        <div class="mgr-card-avatar">${avatar}</div>
                        <div class="mgr-card-info">
                            <h3>${manager.name}</h3>
                            <div class="mgr-card-meta">
                                <span>${flag} ${nation}</span>
                                <span>•</span>
                                <span>${manager.age || 45}세</span>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;">
                        <span style="background: rgba(255,215,0,0.12); color: #ffd700; border: 1px solid rgba(255,215,0,0.3); padding: 3px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;">
                            ${philo.icon} ${philo.name}
                        </span>
                        ${trophies > 0 ? `<span style="background: rgba(46,204,113,0.15); color: #2ecc71; border: 1px solid rgba(46,204,113,0.3); padding: 3px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;">🏆 우승 ${trophies}회</span>` : ''}
                    </div>

                    <div class="mgr-card-stats-grid">
                        <div class="mgr-stat-item">
                            <span class="stat-lbl">통산 전적</span>
                            <span class="stat-val">${matches}전 ${wins}승 ${draws}무 ${losses}패</span>
                        </div>
                        <div class="mgr-stat-item">
                            <span class="stat-lbl">승률</span>
                            <span class="stat-val" style="color: ${parseFloat(winRate) >= 50 ? '#2ecc71' : '#ffd700'};">${winRate}%</span>
                        </div>
                    </div>
                </div>

                <div class="mgr-card-footer">
                    <span style="color: #aaa; font-size: 0.75rem;">💾 저장 슬롯 ${activeSlots}/3</span>
                    <span>커리어 관리 ➔</span>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    openProfileModal(managerId) {
        this.activeManagerId = managerId;
        const manager = this.managers.find(m => m.id === managerId);
        if (!manager) return;

        const avatar = manager.avatar || "👔";
        const flag = manager.flag || NATION_FLAGS[manager.nation] || "🇰🇷";
        const nation = manager.nation || "대한민국";
        const philo = MANAGER_PHILOSOPHIES[manager.philosophy] || MANAGER_PHILOSOPHIES.attacking;
        const matches = manager.stats?.matches || 0;
        const wins = manager.stats?.wins || 0;
        const draws = manager.stats?.draws || 0;
        const losses = manager.stats?.losses || 0;
        const trophies = manager.stats?.trophies || 0;

        const nameEl = document.getElementById('profileManagerName');
        const nationEl = document.getElementById('profileManagerNation');
        const ageEl = document.getElementById('profileManagerAge');
        const matchesEl = document.getElementById('profileManagerMatches');
        const wdlEl = document.getElementById('profileManagerWDL');
        const trophiesEl = document.getElementById('profileManagerTrophies');

        if (nameEl) nameEl.innerHTML = `<span style="margin-right: 8px;">${avatar}</span>${manager.name}`;
        if (nationEl) nationEl.textContent = `${flag} ${nation}`;
        if (ageEl) ageEl.textContent = manager.age || 45;
        if (matchesEl) matchesEl.textContent = matches;
        if (wdlEl) wdlEl.textContent = `${wins} / ${draws} / ${losses}`;
        if (trophiesEl) trophiesEl.textContent = trophies;

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
                background: linear-gradient(145deg, rgba(25, 25, 38, 0.9), rgba(15, 15, 25, 0.95));
                border: 1px solid rgba(255, 215, 0, 0.2);
                border-radius: 14px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                min-height: 150px;
                transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
            `;

            if (saveDataStr) {
                try {
                    const saveData = JSON.parse(saveDataStr);
                    const gData = saveData.gameData || {};
                    const teamKey = gData.selectedTeam;
                    const tName = teamKey ? (typeof teamNames !== 'undefined' && teamNames[teamKey] ? teamNames[teamKey] : teamKey) : '팀 없음';
                    const logoHtml = (teamKey && typeof getTeamLogoHTML === 'function') ? getTeamLogoHTML(teamKey) : '';
                    const sCount = gData.seasonCount || 1;
                    const money = gData.teamMoney || 1000;
                    const date = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : '최근';

                    slotDiv.innerHTML = `
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="color: #2ecc71; font-weight: 800; font-size: 0.85rem;">SLOT 0${i}</span>
                                <span style="font-size: 0.72rem; color: #888;">${date}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                ${logoHtml}
                                <strong style="font-size: 1.05rem; color: #fff;">${tName}</strong>
                            </div>
                            <div style="font-size: 0.8rem; color: #aaa; display: flex; gap: 10px;">
                                <span>시즌 ${sCount}</span>
                                <span>자금: <b style="color:#ffd700;">${money}억</b></span>
                            </div>
                        </div>
                        <button class="btn primary small" style="margin-top: 12px; width: 100%; font-weight: 800; padding: 8px;" onclick="managerSystem.loadGame('${managerId}', ${i})">▶ 이어하기</button>
                    `;
                } catch (e) {
                    slotDiv.innerHTML = `<div>슬롯 ${i} <br> 데이터 오류</div>`;
                }
            } else {
                slotDiv.innerHTML = `
                    <div style="text-align: center; padding: 10px 0;">
                        <div style="font-size: 1.8rem; margin-bottom: 4px; opacity: 0.5;">📂</div>
                        <div style="color: #888; font-size: 0.85rem; font-weight: 600;">빈 슬롯 0${i}</div>
                    </div>
                    <button class="btn success small" style="margin-top: 10px; width: 100%; font-weight: 800; padding: 8px;" onclick="managerSystem.startNewCareer('${managerId}', ${i})">✨ 새 커리어 시작</button>
                `;
            }
            grid.appendChild(slotDiv);
        }
    },

    loadGame(managerId, slotIndex) {
        if (typeof gameData !== 'undefined') {
            gameData.managerId = managerId;
            gameData.saveSlotIndex = slotIndex;
        }
        
        document.getElementById('managerProfileModal').style.display = 'none';
        
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

