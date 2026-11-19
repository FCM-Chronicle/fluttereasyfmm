// managerSystem.js - 프리미엄 감독 관리 및 생성 시스템

const MANAGER_AVATARS = [
    { id: "suit", emoji: "suit", icon: "user", label: "모던 수트" },
    { id: "tracksuit", emoji: "tracksuit", icon: "activity", label: "야전 지휘관" },
    { id: "glasses", emoji: "glasses", icon: "target", label: "지능파 전술가" },
    { id: "trench", emoji: "trench", icon: "shield", label: "카리스마 명장" },
    { id: "maestro", emoji: "maestro", icon: "crown", label: "마에스트로" },
    { id: "legend", emoji: "legend", icon: "trophy", label: "레전드 감독" },
    { id: "fire", emoji: "fire", icon: "flame", label: "열정의 지략가" },
    { id: "wizard", emoji: "wizard", icon: "sparkles", label: "전술 마법사" }
];

function getAvatarIconHTML(avatarKey) {
    const found = MANAGER_AVATARS.find(a => a.id === avatarKey || a.emoji === avatarKey);
    const iconName = found ? found.icon : 'user';
    return typeof iconSVG === 'function' ? iconSVG(iconName) : avatarKey;
}

const MANAGER_PHILOSOPHIES = {
    attacking: {
        id: "attacking",
        name: "닥공 & 게겐프레싱",
        icon: "zap",
        badge: "Heavy Metal",
        desc: "초고속 템포와 전방 압박으로 상대를 압도하며, 공격진의 사기 상승폭이 큽니다.",
        color: "#EF4444"
    },
    defensive: {
        id: "defensive",
        name: "철벽 수비 & 카테나치오",
        icon: "shield",
        badge: "Iron Wall",
        desc: "견고한 수비 블록으로 실점을 최소화하고 안정적인 승점을 확보합니다.",
        color: "#38BDF8"
    },
    youth: {
        id: "youth",
        name: "유스 육성 & 멘토링",
        icon: "sparkles",
        badge: "Youth Guru",
        desc: "23세 이하 유망주들의 잠재력 폭발 확률과 성장 속도가 20% 증가합니다.",
        color: "#A3E635"
    },
    moneyball: {
        id: "moneyball",
        name: "머니볼 & 협상 달인",
        icon: "briefcase",
        badge: "Mastermind",
        desc: "이적료 및 주급 협상 테이블에서 유리한 조건을 이끌어내는 능력을 발휘합니다.",
        color: "#FBBF24"
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
    "대한민국": "KOR",
    "잉글랜드": "ENG",
    "스페인": "ESP",
    "독일": "GER",
    "프랑스": "FRA",
    "이탈리아": "ITA",
    "브라질": "BRA",
    "아르헨티나": "ARG",
    "포르투갈": "POR",
    "네덜란드": "NED",
    "일본": "JPN",
    "기타": "INT"
};

const managerSystem = {
    managers: [],
    activeManagerId: null,
    editingManagerId: null,

    // 크리에이터 임시 상태
    creatorState: {
        name: "",
        nation: "대한민국",
        flag: "KOR",
        age: 45,
        avatar: "suit",
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
        const readSave = (k) => (typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(k) : localStorage.getItem(k));
        
        for (let i = 1; i <= 3; i++) {
            const save = readSave(`footballManagerSave_slot${i}`);
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
                flag: "KOR",
                age: 45,
                avatar: "suit",
                philosophy: "attacking",
                title: "전성기 명장",
                stats: { matches: 0, wins: 0, draws: 0, losses: 0, trophies: 0 },
                created: Date.now()
            };
            this.managers.push(legacyManager);
            this.saveManagers();

            legacySaves.forEach(item => {
                const newKey = `fm_save_${legacyManager.id}_slot${item.slot}`;
                const oldKey = `footballManagerSave_slot${item.slot}`;
                if (typeof SaveStorage !== 'undefined') {
                    SaveStorage.setItem(newKey, item.data).then(() => SaveStorage.removeItem(oldKey));
                } else {
                    localStorage.setItem(newKey, item.data);
                    localStorage.removeItem(oldKey);
                }
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
            this.creatorState.flag = opt.dataset.flag || NATION_FLAGS[opt.value] || "INT";
            this.updateLiveCard();
        });

        ageRange?.addEventListener('input', (e) => {
            this.creatorState.age = parseInt(e.target.value);
            const ageDisplay = document.getElementById('ageValueDisplay');
            if (ageDisplay) ageDisplay.textContent = `${this.creatorState.age}세`;
            const pct = Math.max(0, Math.min(100, ((this.creatorState.age - 32) / 40) * 100));
            ageRange.style.background = `linear-gradient(to right, #38BDF8 0%, #38BDF8 ${pct}%, #1E293B ${pct}%, #1E293B 100%)`;
            this.updateLiveCard();
        });
    },

    renderAvatarPicker() {
        const grid = document.getElementById('avatarPickerGrid');
        if (!grid) return;
        grid.replaceChildren();

        MANAGER_AVATARS.forEach(item => {
            const card = document.createElement('div');
            card.className = `avatar-card-opt ${this.creatorState.avatar === item.emoji ? 'active' : ''}`;

            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'opt-emoji';
            emojiSpan.innerHTML = getAvatarIconHTML(item.id);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'opt-name';
            nameSpan.textContent = item.label;

            card.append(emojiSpan, nameSpan);

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
        grid.replaceChildren();

        Object.values(MANAGER_PHILOSOPHIES).forEach(philo => {
            const card = document.createElement('div');
            card.className = `philosophy-card-opt ${this.creatorState.philosophy === philo.id ? 'active' : ''}`;

            const header = document.createElement('div');
            header.className = 'philo-opt-header';

            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = typeof iconSVG === 'function' ? iconSVG(philo.icon) : '';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = philo.name;

            header.append(iconSpan, nameSpan);

            const desc = document.createElement('div');
            desc.className = 'philo-opt-desc';
            desc.textContent = philo.desc;

            card.append(header, desc);

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
        if (flagEl) flagEl.textContent = NATION_FLAGS[this.creatorState.nation] || this.creatorState.flag;
        if (nationEl) nationEl.textContent = this.creatorState.nation;
        if (ageEl) ageEl.textContent = `${this.creatorState.age}세`;
        if (avatarEl) avatarEl.innerHTML = getAvatarIconHTML(this.creatorState.avatar);
        if (titleBadgeEl) titleBadgeEl.textContent = this.getTitleByAge(this.creatorState.age);

        const currentPhilo = MANAGER_PHILOSOPHIES[this.creatorState.philosophy] || MANAGER_PHILOSOPHIES.attacking;
        if (philoBadgeEl) {
            philoBadgeEl.replaceChildren();
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = typeof iconSVG === 'function' ? iconSVG(currentPhilo.icon) : '';
            philoBadgeEl.append(iconSpan, ` ${currentPhilo.name}`);
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
                    flag: NATION_FLAGS[manager.nation] || manager.flag || "KOR",
                    age: manager.age || 45,
                    avatar: manager.avatar || "suit",
                    philosophy: manager.philosophy || "attacking"
                };
            }
        } else {
            title.textContent = "새 감독 정식 등록";
            this.creatorState = {
                name: "",
                nation: "대한민국",
                flag: "KOR",
                age: 45,
                avatar: "suit",
                philosophy: "attacking"
            };
        }

        if (nameInput) nameInput.value = this.creatorState.name;
        if (nationSelect) nationSelect.value = this.creatorState.nation;
        if (ageRange) {
            ageRange.value = this.creatorState.age;
            const pct = Math.max(0, Math.min(100, ((this.creatorState.age - 32) / 40) * 100));
            ageRange.style.background = `linear-gradient(to right, #38BDF8 0%, #38BDF8 ${pct}%, #1E293B ${pct}%, #1E293B 100%)`;
        }
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
        const flag = NATION_FLAGS[nation] || this.creatorState.flag || "INT";
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
            const key = `fm_save_${managerId}_slot${i}`;
            if (typeof SaveStorage !== 'undefined') {
                SaveStorage.removeItem(key);
            } else {
                localStorage.removeItem(key);
            }
        }

        document.getElementById('managerProfileModal').style.display = 'none';
        this.renderManagerList();
    },

    renderManagerList() {
        const grid = document.getElementById('managerListGrid');
        const countBadge = document.getElementById('managerCountBadge');
        if (!grid) return;
        
        grid.replaceChildren();
        if (countBadge) countBadge.textContent = `${this.managers.length}명`;
        
        if (this.managers.length === 0) {
            const emptyBox = document.createElement('div');
            emptyBox.className = 'manager-empty-hero-card';

            const badgeTag = document.createElement('div');
            badgeTag.className = 'manager-empty-badge';
            badgeTag.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>CAREER MODE</span>`;

            const iconDiv = document.createElement('div');
            iconDiv.className = 'manager-empty-avatar-ring';
            iconDiv.innerHTML = getAvatarIconHTML('suit');

            const h2 = document.createElement('h2');
            h2.className = 'manager-empty-title';
            h2.textContent = '새로운 명장의 탄생을 기다리고 있습니다';

            const p = document.createElement('p');
            p.className = 'manager-empty-desc';
            p.textContent = '아직 등록된 감독 프로필이 없습니다. 나만의 전술 철학과 캐릭터를 설정하고 세계 무대에 도전해 보세요.';

            const featureRow = document.createElement('div');
            featureRow.className = 'manager-empty-features';
            featureRow.innerHTML = `
                <div class="mgr-feat-pill">${typeof iconSVG === 'function' ? iconSVG('activity') : ''} <span>실시간 전술 철학 시뮬레이션</span></div>
                <div class="mgr-feat-pill">${typeof iconSVG === 'function' ? iconSVG('shield') : ''} <span>독점 라이센스 ID 발급</span></div>
                <div class="mgr-feat-pill">${typeof iconSVG === 'function' ? iconSVG('briefcase') : ''} <span>구단 협상 & 머니볼</span></div>
            `;

            const btn = document.createElement('button');
            btn.className = 'manager-hero-cta-btn';
            btn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('sparkles') : ''} <span>새 감독 프로필 생성하기</span>`;
            btn.onclick = () => managerSystem.openEditModal();

            emptyBox.append(badgeTag, iconDiv, h2, p, featureRow, btn);
            grid.appendChild(emptyBox);
            return;
        }

        this.managers.forEach(manager => {
            const avatar = manager.avatar || "suit";
            const nation = manager.nation || "대한민국";
            const flag = NATION_FLAGS[nation] || manager.flag || "KOR";
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
                const key = `fm_save_${manager.id}_slot${i}`;
                const exists = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(key) : localStorage.getItem(key);
                if (exists) activeSlots++;
            }

            const card = document.createElement('div');
            card.className = 'manager-card-premium';
            card.onclick = () => this.openProfileModal(manager.id);

            const cardMain = document.createElement('div');

            const cardTop = document.createElement('div');
            cardTop.className = 'mgr-card-top';

            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'mgr-card-avatar';
            avatarDiv.innerHTML = getAvatarIconHTML(avatar);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'mgr-card-info';

            const nameH3 = document.createElement('h3');
            nameH3.textContent = manager.name;

            const metaDiv = document.createElement('div');
            metaDiv.className = 'mgr-card-meta';
            const flagNationSpan = document.createElement('span');
            flagNationSpan.textContent = `[${flag}] ${nation}`;
            const dotSpan = document.createElement('span');
            dotSpan.textContent = '•';
            const ageSpan = document.createElement('span');
            ageSpan.textContent = `${manager.age || 45}세`;
            metaDiv.append(flagNationSpan, dotSpan, ageSpan);

            infoDiv.append(nameH3, metaDiv);
            cardTop.append(avatarDiv, infoDiv);

            const badgesDiv = document.createElement('div');
            badgesDiv.style.cssText = 'display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;';

            const philoBadge = document.createElement('span');
            philoBadge.style.cssText = 'background: rgba(251,191,36,0.12); color: #FBBF24; border: 1px solid rgba(251,191,36,0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;';
            philoBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG(philo.icon) : ''} <span>${philo.name}</span>`;
            badgesDiv.appendChild(philoBadge);

            if (trophies > 0) {
                const trophyBadge = document.createElement('span');
                trophyBadge.style.cssText = 'background: rgba(163,230,53,0.15); color: #A3E635; border: 1px solid rgba(163,230,53,0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;';
                trophyBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>우승 ${trophies}회</span>`;
                badgesDiv.appendChild(trophyBadge);
            }

            const statsGrid = document.createElement('div');
            statsGrid.className = 'mgr-card-stats-grid';

            const statItem1 = document.createElement('div');
            statItem1.className = 'mgr-stat-item';
            const statLbl1 = document.createElement('span');
            statLbl1.className = 'stat-lbl';
            statLbl1.textContent = '통산 전적';
            const statVal1 = document.createElement('span');
            statVal1.className = 'stat-val';
            statVal1.textContent = `${matches}전 ${wins}승 ${draws}무 ${losses}패`;
            statItem1.append(statLbl1, statVal1);

            const statItem2 = document.createElement('div');
            statItem2.className = 'mgr-stat-item';
            const statLbl2 = document.createElement('span');
            statLbl2.className = 'stat-lbl';
            statLbl2.textContent = '승률';
            const statVal2 = document.createElement('span');
            statVal2.className = 'stat-val';
            statVal2.style.color = parseFloat(winRate) >= 50 ? '#A3E635' : '#FBBF24';
            statVal2.textContent = `${winRate}%`;
            statItem2.append(statLbl2, statVal2);

            statsGrid.append(statItem1, statItem2);

            cardMain.append(cardTop, badgesDiv, statsGrid);

            const cardFooter = document.createElement('div');
            cardFooter.className = 'mgr-card-footer';
            const slotSpan = document.createElement('span');
            slotSpan.style.cssText = 'color: #94A3B8; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;';
            slotSpan.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('save') : ''} <span>저장 슬롯 ${activeSlots}/3</span>`;
            const actionSpan = document.createElement('span');
            actionSpan.textContent = '커리어 관리 ->';
            cardFooter.append(slotSpan, actionSpan);

            card.append(cardMain, cardFooter);
            grid.appendChild(card);
        });
    },

    openProfileModal(managerId) {
        this.activeManagerId = managerId;
        const manager = this.managers.find(m => m.id === managerId);
        if (!manager) return;

        const avatar = manager.avatar || "suit";
        const nation = manager.nation || "대한민국";
        const flag = NATION_FLAGS[nation] || manager.flag || "KOR";
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

        if (nameEl) {
            nameEl.replaceChildren();
            const avatarSpan = document.createElement('span');
            avatarSpan.style.cssText = 'margin-right: 8px; display: inline-flex; align-items: center;';
            avatarSpan.innerHTML = getAvatarIconHTML(avatar);
            nameEl.append(avatarSpan, manager.name);
        }
        if (nationEl) nationEl.textContent = `[${flag}] ${nation}`;
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
        grid.replaceChildren();

        for (let i = 1; i <= 3; i++) {
            const slotKey = `fm_save_${managerId}_slot${i}`;
            const saveDataStr = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(slotKey) : localStorage.getItem(slotKey);
            
            const slotDiv = document.createElement('div');
            slotDiv.className = 'save-slot';
            slotDiv.style.cssText = `background: linear-gradient(145deg, #161F30, #111827);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
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
                    const sCount = gData.seasonCount || 1;
                    const money = gData.teamMoney || 1000;
                    const date = saveData.timestamp ? new Date(saveData.timestamp).toLocaleDateString() : '최근';

                    const contentWrap = document.createElement('div');

                    const headerRow = document.createElement('div');
                    headerRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';
                    const slotBadge = document.createElement('span');
                    slotBadge.style.cssText = 'color: #A3E635; font-weight: 800; font-size: 0.85rem;';
                    slotBadge.textContent = `SLOT 0${i}`;
                    const dateSpan = document.createElement('span');
                    dateSpan.style.cssText = 'font-size: 0.72rem; color: #94A3B8;';
                    dateSpan.textContent = date;
                    headerRow.append(slotBadge, dateSpan);

                    const teamRow = document.createElement('div');
                    teamRow.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 6px;';
                    if (teamKey && typeof createTeamLogoElement === 'function') {
                        teamRow.appendChild(createTeamLogoElement(teamKey));
                    }
                    const teamNameStrong = document.createElement('strong');
                    teamNameStrong.style.cssText = 'font-size: 1.05rem; color: #F8FAFC;';
                    teamNameStrong.textContent = tName;
                    teamRow.appendChild(teamNameStrong);

                    const metaRow = document.createElement('div');
                    metaRow.style.cssText = 'font-size: 0.8rem; color: #94A3B8; display: flex; gap: 10px;';
                    const seasonSpan = document.createElement('span');
                    seasonSpan.textContent = `시즌 ${sCount}`;
                    const moneySpan = document.createElement('span');
                    moneySpan.textContent = '자금: ';
                    const moneyBold = document.createElement('b');
                    moneyBold.style.color = '#FBBF24';
                    moneyBold.textContent = `${money}억`;
                    moneySpan.appendChild(moneyBold);
                    metaRow.append(seasonSpan, moneySpan);

                    contentWrap.append(headerRow, teamRow, metaRow);

                    const loadBtn = document.createElement('button');
                    loadBtn.className = 'btn primary small';
                    loadBtn.style.cssText = 'margin-top: 12px; width: 100%; font-weight: 800; padding: 8px;';
                    loadBtn.textContent = '이어하기';
                    loadBtn.onclick = () => managerSystem.loadGame(managerId, i);

                    slotDiv.append(contentWrap, loadBtn);
                } catch (e) {
                    const errDiv = document.createElement('div');
                    errDiv.textContent = `슬롯 ${i} 데이터 오류`;
                    slotDiv.appendChild(errDiv);
                }
            } else {
                const emptyBox = document.createElement('div');
                emptyBox.style.cssText = 'text-align: center; padding: 10px 0;';

                const icon = document.createElement('div');
                icon.style.cssText = 'font-size: 1.8rem; margin-bottom: 4px; opacity: 0.5; display: flex; justify-content: center; color: #94A3B8;';
                icon.innerHTML = typeof iconSVG === 'function' ? iconSVG('folder') : '';

                const label = document.createElement('div');
                label.style.cssText = 'color: #94A3B8; font-size: 0.85rem; font-weight: 600;';
                label.textContent = `빈 슬롯 0${i}`;

                emptyBox.append(icon, label);

                const newCareerBtn = document.createElement('button');
                newCareerBtn.className = 'btn success small';
                newCareerBtn.style.cssText = 'margin-top: 10px; width: 100%; font-weight: 800; padding: 8px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;';
                newCareerBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('sparkles') : ''} <span>새 커리어 시작</span>`;
                newCareerBtn.onclick = () => managerSystem.startNewCareer(managerId, i);

                slotDiv.append(emptyBox, newCareerBtn);
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

