// tactics.js

/**
 * @file tactics.js
 * '마스터 가이드라인'에 명시된 새로운 전술 시스템의 핵심 로직을 구현합니다.
 * - 역할(Role)에 따른 스탯 가중치 데이터 (RoleData)
 * - 라인별 스탯(DNA)과 역할을 결합하여 최종 파워를 계산하는 로직
 * - 체력 소모율 데이터
 */

// 1. FM 전문 역할(Role) 데이터 시스템
// 가이드라인에 명시된 6대 스탯 가중치를 그대로 객체로 구현합니다.
const RoleData = {
	// 1. 공격진 (ST, SS, LW, RW)
	attack: {
		AF: { name: "전진형 포워드", attack: 0.20, technique: -0.05, mobility: 0.20, defense: -0.20, physical: 0.05, mentality: 0.05, stamina: 'high' },
		CF: { name: "센터 포워드", attack: 0.15, technique: 0.15, mobility: 0.10, defense: 0.05, physical: 0.15, mentality: 0.10, stamina: 'very_high' },
		P:  { name: "포처", attack: 0.50, technique: -0.20, mobility: 0.10, defense: -0.35, physical: -0.05, mentality: 0.10, stamina: 'low' },
		DLF:{ name: "딥라잉 포워드", attack: 0.05, technique: 0.25, mobility: -0.10, defense: 0.05, physical: 0.15, mentality: 0.10, stamina: 'normal' },
		TM: { name: "타겟맨", attack: 0.10, technique: -0.15, mobility: -0.25, defense: 0.05, physical: 0.35, mentality: 0.10, stamina: 'normal' },
		F9: { name: "펄스 나인", attack: -0.05, technique: 0.30, mobility: 0.05, defense: 0, physical: -0.20, mentality: 0.25, stamina: 'high' },
		PF: { name: "압박형 포워드", attack: -0.05, technique: -0.05, mobility: 0.20, defense: 0.25, physical: 0.20, mentality: 0.15, stamina: 'very_high' },
		RD: { name: "라움도이터", attack: 0.25, technique: -0.10, mobility: -0.10, defense: -0.20, physical: -0.10, mentality: 0.35, stamina: 'low' },
		W:  { name: "윙어", attack: 0.05, technique: 0.20, mobility: 0.25, defense: -0.10, physical: -0.05, mentality: 0, stamina: 'high' },
		WP: { name: "와이드 플레이메이커", attack: 0.05, technique: 0.35, mobility: -0.10, defense: -0.10, physical: -0.10, mentality: 0.20, stamina: 'normal' },
		IW: { name: "인버티드 윙어", attack: 0.20, technique: 0.20, mobility: 0.10, defense: -0.10, physical: 0, mentality: 0.05, stamina: 'high' }
	},
	// 2. 미드필더진 (AM, CM, DM)
	midfield: {
		BBM: { name: "박스 투 박스", attack: 0.10, technique: 0.05, mobility: 0.15, defense: 0.10, physical: 0.15, mentality: 0.10, stamina: 'very_high' },
		MEZ: { name: "메짤라", attack: 0.25, technique: 0.20, mobility: 0.15, defense: -0.20, physical: -0.10, mentality: 0.05, stamina: 'very_high' },
		DLP: { name: "딥라잉 플레이메이커", attack: -0.10, technique: 0.30, mobility: -0.15, defense: 0.15, physical: 0.05, mentality: 0.25, stamina: 'low' },
		BWM: { name: "볼 위닝 미드필더", attack: -0.20, technique: -0.20, mobility: 0.15, defense: 0.35, physical: 0.25, mentality: 0.10, stamina: 'very_high' },
		AP:  { name: "전진형 플레이메이커", attack: 0.15, technique: 0.30, mobility: 0, defense: -0.25, physical: -0.15, mentality: 0.25, stamina: 'normal' },
		REG: { name: "레지스타", attack: 0.05, technique: 0.40, mobility: -0.15, defense: -0.25, physical: -0.20, mentality: 0.35, stamina: 'normal' },
		CAR: { name: "카릴레로", attack: -0.15, technique: 0.05, mobility: 0.05, defense: 0.20, physical: 0.10, mentality: 0.15, stamina: 'high' },
		EG:  { name: "엔간체", attack: 0.15, technique: 0.35, mobility: -0.60, defense: -0.30, physical: -0.20, mentality: 0.35, stamina: 'low' },
		SS:  { name: "섀도우 스트라이커", attack: 0.30, technique: 0.15, mobility: 0.15, defense: -0.25, physical: -0.05, mentality: 0.15, stamina: 'high' },
		ANC: { name: "앵커맨", attack: -0.20, technique: -0.10, mobility: -0.20, defense: 0.30, physical: 0.25, mentality: 0.25, stamina: 'low' },
		DM:  { name: "수비형 미드필더", attack: -0.10, technique: 0, mobility: 0.05, defense: 0.25, physical: 0.15, mentality: 0.10, stamina: 'high' },
		SV:  { name: "세군도 볼란테", attack: 0.15, technique: 0.10, mobility: 0.15, defense: 0.10, physical: 0.15, mentality: 0.10, stamina: 'very_high' },
		CM:  { name: "중앙 미드필더", attack: 0.05, technique: 0.10, mobility: 0.05, defense: 0.10, physical: 0.10, mentality: 0.10, stamina: 'normal' },
	},
	// 3. 수비진 (FB, WB, CB)
	defense: {
		BPD: { name: "볼 플레잉 수비수", attack: 0.05, technique: 0.25, mobility: 0, defense: 0.15, physical: 0.05, mentality: 0.20, stamina: 'normal' },
		CD:  { name: "중앙 수비수", attack: 0, technique: -0.05, mobility: 0, defense: 0.25, physical: 0.25, mentality: 0.10, stamina: 'normal' },
		NCB: { name: "안정형 수비수", attack: -0.30, technique: -0.30, mobility: -0.10, defense: 0.45, physical: 0.35, mentality: 0.15, stamina: 'low' },
		IWB: { name: "인버티드 윙백", attack: 0.05, technique: 0.25, mobility: 0.05, defense: 0.10, physical: 0, mentality: 0.20, stamina: 'high' },
		CWB: { name: "완성형 윙백", attack: 0.25, technique: 0.20, mobility: 0.20, defense: -0.20, physical: 0, mentality: 0.05, stamina: 'very_high' },
		LIB: { name: "리베로", attack: 0.15, technique: 0.30, mobility: 0.10, defense: 0.15, physical: 0, mentality: 0.25, stamina: 'high' },
		FB:  { name: "풀백", attack: -0.05, technique: 0.05, mobility: 0.10, defense: 0.20, physical: 0.10, mentality: 0.05, stamina: 'normal' },
		WB:  { name: "윙백", attack: 0.15, technique: 0.15, mobility: 0.20, defense: 0, physical: 0.05, mentality: 0.05, stamina: 'high' },
		GK:  { name: "골키퍼", attack: -0.4, technique: -0.2, mobility: -0.2, defense: 0.4, physical: 0.2, mentality: 0.2, stamina: 'low' }
	}
};

// 2. 체력(Stamina) 소모율 데이터
const StaminaConsumption = {
	low: 0.12,       // 분당 소모율 추가 하향
	normal: 0.20,
	high: 0.28,
	very_high: 0.35
};

// [신규] 체력 소모 대비 효율성 데이터 (체력을 덜 쓰면 효율이 떨어짐)
const StaminaEfficiency = {
	low: 0.9,       // [수정] 0.75 -> 0.9 (페널티 완화)
	normal: 1.0,     // 보통 -> 기준점
	high: 1.05,       // 높음 -> 효율 5% 증가 (보너스)
	very_high: 1.1   // 매우 높음 -> 효율 10% 증가 (보너스)
};

// 3. 전술 관련 로직을 관리하는 객체 (매니저)
// 이 객체는 나중에 게임의 메인 로직과 연결되어 사용됩니다.
const TacticsManager = {
    
    /**
     * 특정 역할(Role)에 대한 모든 스탯 가중치를 가져옵니다.
     * @param {string} roleKey - 역할 키 (예: 'AF', 'BBM')
     * @returns {object|null} 해당 역할의 가중치 객체 또는 null
     */
    getRoleData(roleKey) {
        for (const line in RoleData) {
            if (RoleData[line][roleKey]) {
                return RoleData[line][roleKey];
            }
        }
        console.warn(`[TacticsManager] '${roleKey}'에 해당하는 역할 데이터를 찾을 수 없습니다.`);
        return null;
    },

    /**
     * 라인별 기본 스탯과 역할을 기반으로 최종 파워를 계산합니다.
     * @param {number} baseStat - 라인의 기본 스탯 (예: 미드필더진의 기술 스탯 100)
     * @param {string} roleKey - 해당 라인에 적용된 역할 키 (예: 'REG')
     * @param {string} statType - 계산할 스탯 타입 (예: 'technique', 'attack')
     * @returns {number} 최종 계산된 파워 값
     */
    calculateFinalPower(baseStat, roleKey, statType) {
        // [신규] 밸런스 패치: 스탯 효율 체감/페널티 시스템 (몰빵 방지)
        let effectiveStat = baseStat;
        const overloadThreshold = 110; // 이 수치를 넘으면 효율 감소
        const weaknessThreshold = 40;  // 이 수치보다 낮으면 페널티 강화

        if (baseStat > overloadThreshold) {
            const excess = baseStat - overloadThreshold;
            // 110을 초과하는 스탯은 효율이 50%만 적용됨 (예: 130 -> 110 + 20*0.5 = 120)
            effectiveStat = overloadThreshold + (excess * 0.5);
        } else if (baseStat < weaknessThreshold) {
            const deficit = weaknessThreshold - baseStat;
            // 40 미만인 스탯은 페널티가 1.5배로 적용됨 (예: 20 -> 40 - 20*1.5 = 10)
            effectiveStat = weaknessThreshold - (deficit * 1.5);
        }

        const role = this.getRoleData(roleKey);
        if (!role) {
            return Math.round(effectiveStat); // 역할이 없으면 보정된 스탯 반환
        }

        // 가이드라인의 6대 스탯과 라인별 4대 핵심 스탯을 매핑합니다.
        // 'mobility'는 'speed'로 간주합니다.
        const statMap = {
            speed: 'mobility'
        };
        const mappedStatType = statMap[statType] || statType;

        // 해당 역할에 스탯 가중치가 정의되어 있는지 확인
        if (role[mappedStatType] === undefined) {
            // console.warn(`[TacticsManager] 역할 '${roleKey}'에 '${mappedStatType}' 스탯 가중치가 없습니다.`);
            return Math.round(effectiveStat);
        }

        const weight = role[mappedStatType];
        
        // [수정] 효율성 반영
		// 최종 파워 계산 공식: (라인 기본 스탯 * (1 + 롤 가중치)) * 체력 효율
		const staminaKey = role.stamina || 'normal';
		const efficiency = StaminaEfficiency[staminaKey] || 1.0;

		const finalPower = effectiveStat * (1 + weight) * efficiency;
        
		return Math.round(finalPower); // 계산 결과는 정수로 반환
	},

    /**
     * 특정 역할의 체력 소모 키를 반환합니다.
     * @param {string} roleKey - 역할 키
     * @returns {string|null} 체력 소모 키 ('low', 'normal', 'high', 'very_high')
     */
    getStaminaConsumptionKey(roleKey) {
        const role = this.getRoleData(roleKey);
        return role ? role.stamina : 'normal';
    },

    /**
     * 체력 소모 키에 해당하는 분당 소모율을 반환합니다.
     * @param {string} staminaKey - 체력 소모 키
     * @returns {number} 분당 체력 소모율
     */
    getStaminaConsumptionRate(staminaKey) {
		return StaminaConsumption[staminaKey] || StaminaConsumption.normal;
    },

    /**
     * [신규] 체력 소모 키에 해당하는 효율성을 반환합니다.
     * @param {string} staminaKey - 체력 소모 키
     * @returns {number} 효율성 계수 (예: 0.85, 1.0, 1.2)
     */
    getStaminaEfficiency(staminaKey) {
		return StaminaEfficiency[staminaKey] || 1.0;
    }
};

// [신규] DNA 프리셋 데이터
const DNAPresets = {
    balanced: {
        name: "기본 전술",
        description: "모든 스탯에 균등하게 투자하여 약점이 없는 만능형입니다.",
        ratios: { attack: 1, speed: 1, technique: 1, physical: 1, defense: 1, mentality: 1 }
    },
    gegenpress: {
        name: "게겐프레싱",
        description: "강한 압박과 빠른 공수 전환을 위해 스피드와 피지컬을 강화합니다.",
        ratios: { attack: 1.05, speed: 1.1, technique: 0.9, physical: 1.1, defense: 1.0, mentality: 0.95 }
    },
    twoLine: {
        name: "다이렉트 축구",
        description: "직선적인 공격을 위해 스피드와 피지컬에 집중합니다.",
        ratios: { attack: 1.1, speed: 1.1, technique: 0.85, physical: 1.1, defense: 0.9, mentality: 0.95 }
    },
    lavolpiana: {
        name: "라볼피아나",
        description: "후방 빌드업과 측면 전개를 위해 기술과 스피드를 높입니다.",
        ratios: { attack: 1.0, speed: 1.05, technique: 1.15, physical: 0.85, defense: 0.9, mentality: 1.05 }
    },
    longBall: {
        name: "롱볼 축구",
        description: "공중볼 경합과 탄탄한 수비를 위해 피지컬과 수비력을 극대화합니다.",
        ratios: { attack: 0.9, speed: 0.9, technique: 0.8, physical: 1.15, defense: 1.15, mentality: 0.9 }
    },
    possession: {
        name: "점유율 축구",
        description: "공을 오래 소유하기 위해 기술과 정신력에 집중합니다.",
        ratios: { attack: 0.95, speed: 0.85, technique: 1.15, physical: 0.9, defense: 1.0, mentality: 1.15 }
    },
    parkBus: {
        name: "역습 축구",
        description: "극단적인 수비벽을 세우고 역습 한 방을 노리기 위해 수비와 스피드를 올립니다.",
        ratios: { attack: 0.85, speed: 1.1, technique: 0.8, physical: 1.05, defense: 1.25, mentality: 0.9 }
    },
    catenaccio: {
        name: "카테나치오",
        description: "대인 방어 기반의 끈적한 수비를 위해 정신력과 수비력을 강화합니다.",
        ratios: { attack: 0.8, speed: 0.9, technique: 0.85, physical: 1.1, defense: 1.2, mentality: 1.15 }
    },
    totalFootball: {
        name: "토탈 풋볼",
        description: "전원 공격 전원 수비를 위해 기술, 정신력, 스피드를 두루 올립니다.",
        ratios: { attack: 1.05, speed: 1.05, technique: 1.1, physical: 0.85, defense: 0.95, mentality: 1.1 }
    },
    tikitaka: {
        name: "티키타카",
        description: "짧은 패스 위주의 점유율 축구를 위해 기술과 정신력을 극대화합니다.",
        ratios: { attack: 0.95, speed: 0.9, technique: 1.2, physical: 0.8, defense: 0.95, mentality: 1.1 }
    }
};


// 4. DNA (라인별 스탯) 관리자
const DNAManager = {
    charts: {}, // 차트 인스턴스 저장용

    // 라인별 기본 스탯 정의 (한글 표시명 매핑)
    statDefinitions: {
        attack: {
            attack: "공격",
            speed: "스피드",
            technique: "기술",
            physical: "피지컬",
            defense: "수비",
            mentality: "정신력"
        },
        midfield: {
            technique: "기술",
            attack: "공격",
            defense: "수비",
            mentality: "정신력",
            speed: "스피드",
            physical: "피지컬"
        },
        defense: {
            defense: "수비",
            speed: "스피드",
            physical: "피지컬",
            mentality: "정신력",
            attack: "공격",
            technique: "기술"
        }
    },

    // [수정] 팀 선택 시 초기화 (베스트 11 기반)
    initialize(teamPlayers) {
        console.log('🧬 DNAManager.initialize() called.');
        if (!gameData.lineStats) {
            gameData.lineStats = {
                attack: { ovr: 0, totalPoints: 0, usedPoints: 0, stats: { attack: 0, speed: 0, technique: 0, physical: 0, defense: 0, mentality: 0 }, stamina: 100, lastUpdate: 0 },
                midfield: { ovr: 0, totalPoints: 0, usedPoints: 0, stats: { technique: 0, attack: 0, defense: 0, mentality: 0, speed: 0, physical: 0 }, stamina: 100, lastUpdate: 0 },
                defense: { ovr: 0, totalPoints: 0, usedPoints: 0, stats: { defense: 0, speed: 0, physical: 0, mentality: 0, attack: 0, technique: 0 }, stamina: 100, lastUpdate: 0 }
            };
        }

        this.recalculateLineOVRs(teamPlayers);

        // 3. 초기 스탯 자동 분배 (균등하게) - 이미 분배된 적이 없으면 실행
        if (gameData.lineStats.attack.usedPoints === 0) this.autoDistribute('attack');
        if (gameData.lineStats.midfield.usedPoints === 0) this.autoDistribute('midfield');
        if (gameData.lineStats.defense.usedPoints === 0) this.autoDistribute('defense');
    },

    // [신규] 라인별 OVR 재계산 (베스트 11 기준)
    recalculateLineOVRs(teamPlayers) {
        // [수정] 현재 스쿼드(gameData.squad)가 있으면 그것을 기준으로 계산
        if (gameData.squad) {
            const fws = gameData.squad.fw.filter(p => p);
            const mfs = gameData.squad.mf.filter(p => p);
            const dfs = gameData.squad.df.filter(p => p);
            const gks = gameData.squad.gk ? [gameData.squad.gk] : [];

            // 스쿼드에 선수가 배치되어 있다면 스쿼드 기준 계산
            if (fws.length + mfs.length + dfs.length + gks.length > 0) {
                const calcAvg = (players) => players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length) : 0;

                this.setLinePoints('attack', calcAvg(fws));
                this.setLinePoints('midfield', calcAvg(mfs));
                this.setLinePoints('defense', calcAvg([...dfs, ...gks]));
                
                console.log('🧬 DNA 포인트 재계산 완료 (현재 스쿼드 기준)');
                return;
            }
        }

        // 스쿼드가 비어있을 경우(초기화 전 등) 기존 로직(전체 선수 중 베스트) 사용
        if (!teamPlayers) teamPlayers = teams[gameData.selectedTeam];
        if (!teamPlayers) return;

        // 포지션별 상위 선수 추출 (베스트 11 기준: FW 3, MF 3, DF 4, GK 1)
        const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating).slice(0, 3);
        const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating).slice(0, 3);
        const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating).slice(0, 4);
        const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating).slice(0, 1);

        const fwPlayers = fws;
        const mfPlayers = mfs;
        const dfPlayers = [...dfs, ...gks]; // 수비진은 DF + GK 평균

        const calcAvg = (players) => players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length) : 70;

        const attackOVR = calcAvg(fwPlayers);
        const midfieldOVR = calcAvg(mfPlayers);
        const defenseOVR = calcAvg(dfPlayers);

        // 총 포인트 설정 (OVR * 4)
        this.setLinePoints('attack', attackOVR);
        this.setLinePoints('midfield', midfieldOVR);
        this.setLinePoints('defense', defenseOVR);
    },

    setLinePoints(line, ovr) {
        gameData.lineStats[line].ovr = ovr;
        // [수정] 6개 스탯 기준으로 총 포인트 변경 (OVR * 6)
        gameData.lineStats[line].totalPoints = ovr * 6;
    },

    // 포인트를 균등하게 자동 분배 (초기화용)
    autoDistribute(line) {
        const lineData = gameData.lineStats[line];
        const total = lineData.totalPoints;
        const statKeys = Object.keys(lineData.stats); // 6개 스탯 키
        const baseValue = Math.floor(total / statKeys.length);
        let remainder = total % statKeys.length;

        statKeys.forEach(key => {
            lineData.stats[key] = baseValue;
            if (remainder > 0) {
                lineData.stats[key]++;
                remainder--;
            }
        });
        lineData.usedPoints = total;
    },

    // [수정] 스탯 변경 (UI에서 호출) - 밸런스 제한 추가
    updateStat(line, statKey, change) {
        const lineData = gameData.lineStats[line];
        const currentVal = lineData.stats[statKey];
        const newTotalUsed = lineData.usedPoints + change;

        // 유효성 검사
        if (currentVal + change < 0) return false; // 0 미만 불가
        if (newTotalUsed > lineData.totalPoints) {
            alert(`총 포인트(${lineData.totalPoints})를 초과할 수 없습니다.`);
            return false;
        }

        // [추가] 밸런스 붕괴 방지 (최소/최대 제한)
        // [수정] 최소값: 평균(OVR)에서 30포인트 이상 낮출 수 없음
        const minLimit = Math.max(0, lineData.ovr - 30);
        if (currentVal + change < minLimit) {
            alert(`특정 스탯을 평균(${lineData.ovr})보다 30포인트 이상 낮게 설정할 수 없습니다. (최소 ${minLimit})`);
            return false;
        }
        // 최대값: 평균(OVR)의 170% 초과할 수 없음
        const maxLimit = Math.ceil(lineData.ovr * 1.7);
        if (currentVal + change > maxLimit) {
            alert(`특정 스탯을 너무 높게 설정할 수 없습니다. (최대 ${maxLimit})`);
            return false;
        }

        // 값 적용
        lineData.stats[statKey] += change;
        lineData.usedPoints += change;
        return true;
    },

    // [신규] 프리셋 적용 함수
    applyPreset(line, presetKey) {
        const preset = DNAPresets[presetKey];
        if (!preset) return;

        const lineData = gameData.lineStats[line];
        const totalPoints = lineData.totalPoints;
        const ratios = preset.ratios;

        // 비율 총합 계산
        const totalRatio = Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0);

        let distributedPoints = 0;
        const statKeys = Object.keys(lineData.stats);

        // 비율에 따라 포인트 분배
        statKeys.forEach(key => {
            const points = Math.round((totalPoints * ratios[key]) / totalRatio);
            lineData.stats[key] = points;
            distributedPoints += points;
        });

        // 반올림 오차 보정 (가장 높은 비율의 스탯에 나머지 추가)
        const remainder = totalPoints - distributedPoints;
        const mainStat = Object.keys(ratios).reduce((a, b) => ratios[a] > ratios[b] ? a : b);
        lineData.stats[mainStat] += remainder;
        lineData.usedPoints = totalPoints;
    },

    // UI 렌더링
    renderUI() {
        console.log('🧬 DNAManager.renderUI() called.');
        const container = document.getElementById('tacticsContent');
        if (!container) {
            console.error('Error: #tacticsContent element not found!');
            return;
        }

        // [수정] 스크롤 위치 저장 (UI 갱신 시 스크롤 초기화 방지)
        const scrollPos = container.scrollTop;
        const parentScrollPos = container.parentElement ? container.parentElement.scrollTop : 0;

        // 데이터 유효성 검사 추가
        if (!gameData || !gameData.lineStats) {
            container.innerHTML = '<p style="color: #e74c3c; text-align: center; padding: 20px;">⚠️ 팀 DNA 데이터가 초기화되지 않았습니다. 팀 선택 화면으로 돌아가 다시 팀을 선택해주세요.</p>';
            console.error('Error: gameData.lineStats is not initialized. Cannot render DNA UI.');
            return;
        }

        container.innerHTML = '';

        // [신규] 메인 전술 선택 UI 추가
        const tacticSelectionContainer = document.createElement('div');
        tacticSelectionContainer.className = 'tactic-selection-container';
        tacticSelectionContainer.style.marginBottom = '20px';

        const tacticSystem = new TacticSystem();
        const allTactics = tacticSystem.getAllTactics();

        let tacticOptions = '';
        allTactics.forEach(tactic => {
            tacticOptions += `<option value="${tactic.key}" ${gameData.currentTactic === tactic.key ? 'selected' : ''}>${tactic.name}</option>`;
        });

        tacticSelectionContainer.innerHTML = `
            <h4 style="color: #ffd700; margin-top: 0; margin-bottom: 10px;">📋 메인 전술</h4>
            <select id="dnaTacticSelect" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 5px;">
                ${tacticOptions}
            </select>
        `;
        container.appendChild(tacticSelectionContainer);

        // 전술 변경 이벤트 리스너 추가
        document.getElementById('dnaTacticSelect').addEventListener('change', function() {
            gameData.currentTactic = this.value;
            
            // [추가] 경기 탭의 전술 선택 드롭다운과 동기화
            const matchTacticSelect = document.getElementById('tacticSelect');
            if (matchTacticSelect) matchTacticSelect.value = this.value;

            // [추가] 전술 변경 시 자동 저장 및 UI 즉시 갱신
            if (typeof window.triggerAutoSave === 'function') {
                window.triggerAutoSave();
            }
            DNAManager.renderUI(); 
        });

        // [신규] DNA 프리셋 선택 UI
        const presetContainer = document.createElement('div');
        presetContainer.className = 'dna-preset-container';
        presetContainer.style.cssText = 'background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; margin-bottom: 20px;';
        let presetButtonsHtml = '<h4 style="color: #ffd700; margin-top: 0; margin-bottom: 10px;">💡 추천 DNA 분배 (프리셋)</h4><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        for (const [key, preset] of Object.entries(DNAPresets)) {
            presetButtonsHtml += `<button class="btn" onclick="DNAManager.handlePresetApply('${key}')" title="${preset.description}" style="background: #4a4a4a;">${preset.name}</button>`;
        }
        presetButtonsHtml += '</div><p style="font-size: 0.8rem; color: #aaa; margin-top: 10px;">* 프리셋을 적용하면 모든 라인(공격/미드/수비)의 포인트가 해당 컨셉에 맞게 재분배됩니다.</p>';
        presetContainer.innerHTML = presetButtonsHtml;
        container.appendChild(presetContainer);


        ['attack', 'midfield', 'defense'].forEach(line => {
            const lineData = gameData.lineStats[line];
            if (!lineData) {
                console.error(`Error: gameData.lineStats for '${line}' is missing.`);
                return;
            }
            const definitions = this.statDefinitions[line];
            const lineName = line === 'attack' ? '공격진 (FW)' : line === 'midfield' ? '미드필더진 (MF)' : '수비진 (DF/GK)';
            
            const section = document.createElement('div');
            section.className = 'dna-section';
            section.innerHTML = `
                <div class="dna-header">
                    <h4 style="margin-bottom: 5px;">${lineName} - OVR: ${lineData.ovr}</h4>
                    <div class="dna-points">
                        사용 포인트: <span class="${lineData.usedPoints === lineData.totalPoints ? 'text-green' : 'text-red'}">${lineData.usedPoints}</span> / ${lineData.totalPoints}
                    </div>
                </div>
                <div class="dna-body">
                    <div class="dna-chart-container">
                        <canvas id="chart-${line}"></canvas>
                    </div>
                    <div class="dna-stats-grid"></div>
                </div>
            `;

            const grid = section.querySelector('.dna-stats-grid');

            Object.keys(definitions).forEach(statKey => {
                const statName = definitions[statKey];
                const statValue = lineData.stats[statKey];

                const row = document.createElement('div');
                row.className = 'dna-stat-row';
                row.innerHTML = `
                    <div class="stat-label">${statName}</div>
                    <div class="stat-controls">
                        <button class="btn-control" onclick="DNAManager.handleUpdate('${line}', '${statKey}', -10)">-10</button>
                        <button class="btn-control" onclick="DNAManager.handleUpdate('${line}', '${statKey}', -1)">-1</button>
                        <span class="stat-value">${statValue}</span>
                        <button class="btn-control" onclick="DNAManager.handleUpdate('${line}', '${statKey}', 1)">+1</button>
                        <button class="btn-control" onclick="DNAManager.handleUpdate('${line}', '${statKey}', 10)">+10</button>
                    </div>
                `;
                grid.appendChild(row);
            });

            container.appendChild(section);

            // DOM에 추가 후 차트 생성
            this.createOrUpdateChart(line);
        });

        // [수정] 스크롤 위치 복원
        if (scrollPos > 0) container.scrollTop = scrollPos;
        if (parentScrollPos > 0 && container.parentElement) container.parentElement.scrollTop = parentScrollPos;
    },

    createOrUpdateChart(line) {
        const lineData = gameData.lineStats[line];
        const ctx = document.getElementById(`chart-${line}`);
        if (!ctx) return;

        const labels = Object.values(this.statDefinitions[line]);
        const data = Object.keys(this.statDefinitions[line]).map(statKey => lineData.stats[statKey]);

        // 기존 차트가 있으면 파괴
        if (this.charts[line]) {
            this.charts[line].destroy();
        }

        this.charts[line] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '스탯 분포',
                    data: data,
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                        pointLabels: {
                            color: '#fff',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            color: '#fff',
                            backdropColor: 'rgba(0, 0, 0, 0.5)',
                            stepSize: 25,
                            display: false
                        },
                        suggestedMin: 0
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    handleUpdate(line, statKey, change) {
        if (this.updateStat(line, statKey, change)) {
            this.renderUI(); // 성공 시 UI 갱신
            // [추가] 스탯 변경 시 자동 저장 트리거
            if (typeof window.triggerAutoSave === 'function') {
                window.triggerAutoSave();
            }
        }
    },

    // [신규] 프리셋 적용 핸들러
    handlePresetApply(presetKey) {
        if (confirm(`'${DNAPresets[presetKey].name}' 프리셋을 모든 라인에 적용하시겠습니까?\n기존에 설정한 포인트는 초기화됩니다.`)) {
            ['attack', 'midfield', 'defense'].forEach(line => {
                this.applyPreset(line, presetKey);
            });

            // [추가] 프리셋 적용 시 메인 전술 드롭다운도 자동으로 동기화 (사용자 편의성)
            const tacticMapping = { 'parkTheBus': 'parkBus', 'direct': 'twoLine' };
            const mappedTactic = tacticMapping[presetKey] || presetKey;
            
            const ts = new TacticSystem();
            if (ts.tactics[mappedTactic]) {
                gameData.currentTactic = mappedTactic;
            }

            this.renderUI(); // UI 전체 새로고침 (차트 및 수치 반영)
            
            // [추가] 변경 사항 즉시 저장
            if (typeof window.triggerAutoSave === 'function') {
                window.triggerAutoSave();
            }
        }
    },

    // [추가] 역할 설명 텍스트 생성
    getRoleDescription(line, roleKey) {
        const role = RoleData[line][roleKey];
        if (!role) return '';

        const displayNames = {
            attack: "공격",
            technique: "기술",
            mobility: "스피드",
            defense: "수비",
            physical: "피지컬",
            mentality: "정신력"
        };

        const bonuses = [];
        for (const [key, value] of Object.entries(role)) {
            if (typeof value === 'number' && value !== 0 && displayNames[key]) {
                const sign = value > 0 ? '+' : '';
                bonuses.push(`${displayNames[key]} ${sign}${Math.round(value * 100)}%`);
            }
        }
        return bonuses.join(', ');
    }
};

// 이 파일을 다른 스크립트에서 사용할 수 있도록 전역으로 노출 (필요 시)
window.RoleData = RoleData;
window.TacticsManager = TacticsManager;
window.DNAManager = DNAManager;