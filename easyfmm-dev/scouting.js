// scouting.js - 유스 스카우트 시스템 (상시 고용 & 10경기 주기 4단계 포텐셜)

const POTENTIAL_TIERS = {
    poor: {
        id: 'poor',
        name: '수준 이하',
        color: '#94A3B8',
        bg: 'rgba(148, 163, 184, 0.15)',
        border: 'rgba(148, 163, 184, 0.4)',
        minPot: 54,
        maxPot: 65,
        desc: '프로 1군 무대 적응이 어렵고 성장의 한계가 낮습니다.'
    },
    average: {
        id: 'average',
        name: '평범함',
        color: '#34D399',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.4)',
        minPot: 66,
        maxPot: 74,
        desc: '1부 리그 로테이션 및 백업 자원으로 활용 가능한 자원입니다.'
    },
    promising: {
        id: 'promising',
        name: '재능 있음',
        color: '#38BDF8',
        bg: 'rgba(56, 189, 248, 0.15)',
        border: 'rgba(56, 189, 248, 0.4)',
        minPot: 75,
        maxPot: 82,
        desc: '빅클럽 주전 및 리그 상위권급으로 도약할 확실한 재능입니다.'
    },
    wonderkid: {
        id: 'wonderkid',
        name: '원더키드',
        color: '#FBBF24',
        bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(168, 85, 247, 0.25))',
        border: 'rgba(251, 191, 36, 0.6)',
        minPot: 83,
        maxPot: 88,
        desc: '차세대 국가대표 및 세계적인 수준으로 성장할 극소수 초신성입니다.'
    }
};

class ScoutingSystem {
    constructor() {
        this.scouts = {
            novice: {
                id: 'novice',
                name: '초급 스카우터 (1성)',
                stars: '★☆☆',
                cost: 100, // 100억원
                interval: 10,
                potChances: { poor: 0.70, average: 0.28, promising: 0.02, wonderkid: 0.00 },
                minRating: 48,
                maxRating: 60
            },
            professional: {
                id: 'professional',
                name: '프로 스카우터 (2성)',
                stars: '★★☆',
                cost: 300, // 300억원
                interval: 10,
                potChances: { poor: 0.45, average: 0.45, promising: 0.098, wonderkid: 0.002 },
                minRating: 54,
                maxRating: 66
            },
            worldClass: {
                id: 'worldClass',
                name: '월드클래스 스카우터 (3성)',
                stars: '★★★',
                cost: 700, // 700억원
                interval: 10,
                potChances: { poor: 0.25, average: 0.55, promising: 0.19, wonderkid: 0.01 },
                minRating: 60,
                maxRating: 72
            }
        };

        this.namesByNationality = {
            korean: {
                first: ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "송", "유", "한"],
                last: ["민준", "서준", "도윤", "예준", "시우", "하준", "지호", "주원", "건우", "성민", "현우", "정훈", "민규"]
            },
            brazilian: {
                first: ["Gabriel", "Lucas", "Matheus", "Pedro", "Guilherme", "Gustavo", "Rafael", "Felipe", "Bruno", "João"],
                last: ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Carvalho", "Almeida", "Ferreira", "Ribeiro"]
            },
            spanish: {
                first: ["García", "Rodriguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín"],
                last: ["Hugo", "Mateo", "Martín", "Lucas", "Leo", "Daniel", "Alejandro", "Manuel", "Pablo", "Álvaro"]
            },
            english: {
                first: ["Smith", "Jones", "Taylor", "Brown", "Williams", "Wilson", "Johnson", "Walker", "Robinson", "Thompson", "White", "Green"],
                last: ["Oliver", "George", "Noah", "Arthur", "Harry", "Leo", "Muhammad", "Jack", "Henry", "Charlie", "James", "Freddie"]
            }
        };
    }

    // 스카우터 상시 고용
    hireScout(tier) {
        if (gameData.hiredScout) {
            return { success: false, message: "이미 고용된 스카우터가 있습니다. 새 스카우터를 고용하려면 기존 스카우터를 해지하세요." };
        }

        const scout = this.scouts[tier];
        if (!scout) {
            return { success: false, message: "존재하지 않는 스카우터입니다." };
        }

        if (gameData.teamMoney < scout.cost) {
            return { success: false, message: `자금이 부족합니다. (필요: ${scout.cost}억원 / 보유: ${gameData.teamMoney}억원)` };
        }

        // 비용 차감
        gameData.teamMoney = Math.round((gameData.teamMoney - scout.cost) * 10) / 10;

        // 상시 고용 상태 저장 (유저가 능동적으로 해지하기 전까지 영구 유지)
        gameData.hiredScout = {
            tier: tier,
            name: scout.name,
            progressMatches: 0,
            targetInterval: scout.interval || 10,
            totalFound: 0,
            hiredAt: Date.now()
        };

        return {
            success: true,
            message: `🎉 [스카우터 고용 완료!]\n'${scout.name}'과(와) 상시 계약을 체결했습니다!\n감독님이 직접 해지하기 전까지 10경기마다 1명의 유망주를 발굴해옵니다.`
        };
    }

    // 스카우터 계약 능동적 해지
    fireScout() {
        if (!gameData.hiredScout) {
            return { success: false, message: "현재 고용된 스카우터가 없습니다." };
        }

        const scoutName = (this.scouts[gameData.hiredScout.tier] || {}).name || "스카우터";
        if (!confirm(`정말 '${scoutName}'과의 계약을 해지하시겠습니까?\n해지 시 진행 중이던 유망주 탐색 카운트는 초기화됩니다.`)) {
            return { success: false, cancelled: true };
        }

        gameData.hiredScout = null;
        return {
            success: true,
            message: `[계약 해지]\n${scoutName}과의 고용 계약이 정상적으로 해지되었습니다.`
        };
    }

    // 10경기 도달 시 선수 1명 확정 발굴
    discoverYouthPlayer() {
        if (!gameData.hiredScout) return null;

        const scout = this.scouts[gameData.hiredScout.tier] || this.scouts.novice;
        const newPlayer = this.generateYouthPlayer(scout);

        // 중복 이름 방지
        while (this.isPlayerNameDuplicate(newPlayer.name)) {
            newPlayer.name = this.generateRandomName();
        }

        if (!gameData.youthSquad) gameData.youthSquad = [];
        gameData.youthSquad.push(newPlayer);

        gameData.hiredScout.totalFound = (gameData.hiredScout.totalFound || 0) + 1;
        console.log(`[Scouting] 10경기 주기 유망주 발굴: ${newPlayer.name} (포텐: ${newPlayer.potentialName}, OVR: ${newPlayer.rating})`);

        return newPlayer;
    }

    // 4단계 포텐셜 기반 유망주 생성
    generateYouthPlayer(scout) {
        const positions = ['GK', 'DF', 'MF', 'FW'];
        const position = positions[Math.floor(Math.random() * positions.length)];
        const age = Math.floor(Math.random() * 3) + 16; // 16~18세

        // 1. 4단계 포텐셜 등급 결정
        const rand = Math.random();
        let cumulative = 0;
        let selectedTierKey = 'average';

        const chances = scout.potChances;
        for (const [tierKey, prob] of Object.entries(chances)) {
            cumulative += prob;
            if (rand <= cumulative) {
                selectedTierKey = tierKey;
                break;
            }
        }

        const tierInfo = POTENTIAL_TIERS[selectedTierKey];
        // 포텐셜 상한 산출
        const maxPotential = Math.floor(Math.random() * (tierInfo.maxPot - tierInfo.minPot + 1)) + tierInfo.minPot;

        // 2. 현재 오버롤 (rating) 산출 (스카우터 범위 내, 단 잠재력보다 최소 6~12 낮게 설정하여 성장 폭 보장)
        let rating = Math.floor(Math.random() * (scout.maxRating - scout.minRating + 1)) + scout.minRating;
        if (rating >= maxPotential - 5) {
            rating = Math.max(50, maxPotential - (6 + Math.floor(Math.random() * 6)));
        }

        return {
            name: this.generateRandomName(),
            position: position,
            rating: rating,
            age: age,
            potentialTier: selectedTierKey, // 'poor' | 'average' | 'promising' | 'wonderkid'
            potentialName: tierInfo.name,
            maxPotential: maxPotential,
            isWonderkid: selectedTierKey === 'wonderkid',
            scoutedAtRound: gameData.currentRound || 1
        };
    }

    // 랜덤 이름 생성
    generateRandomName() {
        const nationalities = Object.keys(this.namesByNationality);
        const randomNationality = nationalities[Math.floor(Math.random() * nationalities.length)];
        const nameSet = this.namesByNationality[randomNationality];

        const firstName = nameSet.first[Math.floor(Math.random() * nameSet.first.length)];
        const lastName = nameSet.last[Math.floor(Math.random() * nameSet.last.length)];

        if (randomNationality === 'korean') {
            return `${firstName}${lastName}`;
        } else if (randomNationality === 'spanish') {
            return `${lastName} ${firstName}`;
        } else {
            return `${firstName} ${lastName}`;
        }
    }

    // 중복 이름 방지
    isPlayerNameDuplicate(name) {
        if (typeof teams !== 'undefined') {
            for (const teamKey in teams) {
                if (teams[teamKey].some(p => p.name === name)) return true;
            }
        }
        if (gameData && gameData.youthSquad && gameData.youthSquad.some(p => p.name === name)) return true;
        if (typeof transferSystem !== 'undefined' && transferSystem.transferMarket && transferSystem.transferMarket.some(p => p.name === name)) return true;
        return false;
    }
}

// 싱글톤 인스턴스
const scoutingSystem = new ScoutingSystem();
if (typeof window !== 'undefined') {
    window.scoutingSystem = scoutingSystem;
}

// 스카우팅 화면 UI 표시 및 갱신
function displayScoutingScreen() {
    const hiredScoutInfo = document.getElementById('hiredScoutInfo');

    if (hiredScoutInfo) {
        if (gameData && gameData.hiredScout) {
            const scout = scoutingSystem.scouts[gameData.hiredScout.tier];
            const currentProgress = gameData.hiredScout.progressMatches || 0;
            const target = gameData.hiredScout.targetInterval || 10;
            const progressPct = Math.min(100, Math.round((currentProgress / target) * 100));

            hiredScoutInfo.style.display = 'block';
            hiredScoutInfo.innerHTML = `
                <div class="hired-scout-top-row">
                    <div class="hired-scout-title-wrap">
                        <span class="hired-badge-permanent">상시 고용 중</span>
                        <strong class="hired-scout-title">${scout ? scout.name : '스카우터'}</strong>
                        <span class="hired-scout-total">누적 발굴: ${gameData.hiredScout.totalFound || 0}명</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-fire-scout" onclick="fireScoutAndRefresh()">
                        계약 해지
                    </button>
                </div>
                <div class="scout-progress-container">
                    <div class="scout-progress-labels">
                        <span>유망주 발굴 진행도</span>
                        <strong>${currentProgress} / ${target} 경기 (${Math.max(0, target - currentProgress)}경기 후 1명 발굴)</strong>
                    </div>
                    <div class="scout-progress-bar-wrap">
                        <div class="scout-progress-bar-fill" style="width: ${progressPct}%"></div>
                    </div>
                </div>
            `;
        } else {
            hiredScoutInfo.style.display = 'none';
        }
    }

    // 스카우터 목록 UI 버튼 활성화/비활성화 처리
    const scoutList = document.getElementById('scoutList');
    if (scoutList) {
        const isHired = !!(gameData && gameData.hiredScout);
        const cards = scoutList.querySelectorAll('.scout-card');
        cards.forEach(card => {
            card.classList.toggle('disabled', isHired);
            const btn = card.querySelector('button');
            if (btn) {
                btn.disabled = isHired;
                btn.textContent = isHired ? '고용 중인 스카우터 있음' : '스카우터 고용';
            }
        });
    }
}

// 스카우터 고용
function hireScoutAndRefresh(tier) {
    const result = scoutingSystem.hireScout(tier);
    alert(result.message);

    if (result.success) {
        if (typeof updateDisplay === 'function') updateDisplay();
        displayScoutingScreen();
    }
}

// 스카우터 해지
function fireScoutAndRefresh() {
    const result = scoutingSystem.fireScout();
    if (result.cancelled) return;
    alert(result.message);

    if (result.success) {
        if (typeof updateDisplay === 'function') updateDisplay();
        displayScoutingScreen();
    }
}

// 4단계 포텐셜 뱃지 HTML 헬퍼 함수
function getPotentialBadgeHTML(tierKey) {
    const tier = POTENTIAL_TIERS[tierKey] || POTENTIAL_TIERS.average;
    return `<span class="potential-badge tier-${tier.id}" style="background: ${tier.bg}; color: ${tier.color}; border: 1px solid ${tier.border}; padding: 2px 7px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 3px;">
        ${tier.id === 'wonderkid' ? '★ ' : ''}${tier.name}
    </span>`;
}

// 전역 함수 노출
if (typeof window !== 'undefined') {
    window.displayScoutingScreen = displayScoutingScreen;
    window.hireScoutAndRefresh = hireScoutAndRefresh;
    window.fireScoutAndRefresh = fireScoutAndRefresh;
    window.getPotentialBadgeHTML = getPotentialBadgeHTML;
    window.POTENTIAL_TIERS = POTENTIAL_TIERS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScoutingSystem, scoutingSystem, POTENTIAL_TIERS, getPotentialBadgeHTML };
}
