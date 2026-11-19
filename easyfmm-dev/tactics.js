/**
 * tactics.js — FM 스타일 통합 전술 시스템 (프리셋 · 8대 지침 · 커스텀 슬롯 · 전술 프로필 대시보드 · 미니 피치 & 선수 롤 적합도)
 */

// 1. FM 스타일 포지션/라인별 선수 역할(Role) 데이터 및 핵심 능력치 가중치
const RoleData = {
    attack: {
        AF: {
            name: '어드밴스드 포워드 (AF)',
            allowedPositions: ['ST', 'CF', 'FW'],
            attack: 0.15, mobility: 0.15, technique: 0.05, defense: -0.20, physical: -0.10, mentality: -0.05,
            keyAttrs: { pace: 0.25, acceleration: 0.20, finishing: 0.25, positioning: 0.20, dribbling: 0.10 },
            description: '수비 라인 어깨 위에서 뒷공간을 끊임없이 침투해 득점을 노리는 최전방 스트라이커입니다.'
        },
        P: {
            name: '포처 (P)',
            allowedPositions: ['ST', 'CF', 'FW'],
            attack: 0.25, mobility: 0.05, technique: -0.10, defense: -0.25, physical: -0.05, mentality: 0.10,
            keyAttrs: { finishing: 0.35, positioning: 0.30, reactions: 0.20, acceleration: 0.15 },
            description: '페널티 박스 안 결정력과 위치 선정에만 극단적으로 집중하는 순수 골잡이입니다.'
        },
        DLF: {
            name: '딥라잉 포워드 (DLF)',
            allowedPositions: ['ST', 'CF', 'FW'],
            attack: -0.05, technique: 0.15, mentality: 0.15, mobility: -0.15, defense: 0.05, physical: -0.15,
            keyAttrs: { shortPassing: 0.25, vision: 0.25, ballControl: 0.20, finishing: 0.15, strength: 0.15 },
            description: '2선으로 내려와 미드필드와 공격진을 연결하고 동료 침투 패스를 찔러주는 연계형 공격수입니다.'
        },
        TM: {
            name: '타겟 포워드 (TM)',
            allowedPositions: ['ST', 'CF', 'FW'],
            physical: 0.25, attack: 0.10, mobility: -0.20, technique: -0.15, defense: 0.05, mentality: -0.05,
            keyAttrs: { strength: 0.35, headingAccuracy: 0.25, jumping: 0.20, finishing: 0.20 },
            description: '강력한 피지컬과 제공권으로 롱볼을 지켜내고 주변 동료에게 떨궈주는 포스트플레이어입니다.'
        },
        PF: {
            name: '프레싱 포워드 (PF)',
            allowedPositions: ['ST', 'CF', 'FW'],
            mobility: 0.15, physical: 0.15, defense: 0.15, mentality: 0.10, technique: -0.15, attack: -0.05,
            keyAttrs: { stamina: 0.25, aggression: 0.20, pace: 0.20, finishing: 0.20, positioning: 0.15 },
            description: '최전방에서 상대 센터백과 골키퍼를 끈질기게 압박해 빌드업 실수를 유발하는 헌신적인 공격수입니다.'
        },
        F9: {
            name: '펄스 나인 (F9)',
            allowedPositions: ['ST', 'CF', 'CAM', 'FW'],
            technique: 0.20, mentality: 0.15, mobility: 0.05, attack: -0.15, physical: -0.25, defense: 0.0,
            keyAttrs: { vision: 0.25, dribbling: 0.25, shortPassing: 0.25, ballControl: 0.15, finishing: 0.10 },
            description: '미드필더 진영까지 깊숙이 내려와 상대 센터백을 끌어내고 2선 침투 공간을 여는 가짜 9번입니다.'
        },
        IF: {
            name: '인사이드 포워드 (IF)',
            allowedPositions: ['LW', 'RW', 'LM', 'RM', 'CAM', 'FW'],
            attack: 0.18, mobility: 0.15, technique: 0.10, defense: -0.20, physical: -0.15, mentality: -0.08,
            keyAttrs: { pace: 0.22, dribbling: 0.22, finishing: 0.24, acceleration: 0.18, longShots: 0.14 },
            description: '측면에서 중앙 페널티 박스로 과감히 파고들어 직접 슈팅과 득점을 노리는 크랙형 윙어입니다.'
        },
        IW: {
            name: '인버티드 윙어 (IW)',
            allowedPositions: ['LW', 'RW', 'LM', 'RM', 'CAM', 'FW'],
            technique: 0.18, mobility: 0.12, mentality: 0.10, attack: 0.08, defense: -0.15, physical: -0.15,
            keyAttrs: { dribbling: 0.25, vision: 0.22, shortPassing: 0.20, pace: 0.18, crossing: 0.15 },
            description: '측면에서 안쪽 하프스페이스로 접고 들어와 스루패스와 감아차기 기회를 함께 노리는 플레이메이킹 윙어입니다.'
        },
        W: {
            name: '정통 윙어 (W)',
            allowedPositions: ['LW', 'RW', 'LM', 'RM', 'FW'],
            mobility: 0.22, technique: 0.12, attack: 0.05, defense: -0.15, physical: -0.15, mentality: -0.09,
            keyAttrs: { pace: 0.28, acceleration: 0.24, crossing: 0.26, dribbling: 0.22 },
            description: '터치라인 끝까지 폭을 벌려 상대 풀백을 돌파하고 정확한 크로스를 올리는 클래식 측면 공격수입니다.'
        },
        SS: {
            name: '쉐도우 스트라이커 (SS)',
            allowedPositions: ['CAM', 'AM', 'CF', 'ST'],
            attack: 0.20, mobility: 0.12, mentality: 0.08, defense: -0.20, physical: -0.10, technique: -0.10,
            keyAttrs: { finishing: 0.26, positioning: 0.26, acceleration: 0.20, dribbling: 0.15, shortPassing: 0.13 },
            description: '2선 공격형 미드필더 위치에서 최전방 스트라이커를 추월해 박스 안으로 쇄도하는 득점형 2선 자원입니다.'
        }
    },
    midfield: {
        AP: {
            name: '어드밴스드 플레이메이커 (AP)',
            allowedPositions: ['CAM', 'AM', 'CM', 'LM', 'RM', 'MF'],
            technique: 0.20, mentality: 0.20, attack: 0.05, defense: -0.25, physical: -0.20, mobility: 0.0,
            keyAttrs: { vision: 0.30, shortPassing: 0.28, ballControl: 0.22, dribbling: 0.20 },
            description: '상대 수비와 미드필드 사이 공간(Zone 14)에서 결정적인 킬패스로 공격을 지휘하는 사령관입니다.'
        },
        MEZ: {
            name: '메짤라 (MEZ)',
            allowedPositions: ['CM', 'CAM', 'AM', 'LM', 'RM', 'MF'],
            attack: 0.15, technique: 0.15, mobility: 0.10, defense: -0.25, physical: -0.15, mentality: 0.0,
            keyAttrs: { dribbling: 0.24, shortPassing: 0.22, acceleration: 0.20, vision: 0.18, longShots: 0.16 },
            description: '중앙 미드필더에서 측면 하프스페이스로 넓게 침투해 윙어·풀백과 수적 우위를 만드는 하프윙어입니다.'
        },
        BBM: {
            name: '박스 투 박스 미드필더 (BBM)',
            allowedPositions: ['CM', 'CDM', 'CAM', 'LM', 'RM', 'MF'],
            mobility: 0.15, physical: 0.15, attack: 0.05, defense: 0.05, technique: -0.20, mentality: -0.20,
            keyAttrs: { stamina: 0.30, pace: 0.18, shortPassing: 0.18, standingTackle: 0.17, longShots: 0.17 },
            description: '왕성한 활동량으로 아군 박스의 수비 커버부터 상대 박스 침투까지 공수 전역을 오가는 엔진입니다.'
        },
        CM: {
            name: '중앙 미드필더 (CM)',
            allowedPositions: ['CM', 'CAM', 'CDM', 'LM', 'RM', 'MF'],
            technique: 0.10, mentality: 0.10, defense: 0.05, attack: 0.0, mobility: -0.10, physical: -0.15,
            keyAttrs: { shortPassing: 0.28, vision: 0.24, ballControl: 0.20, interceptions: 0.14, stamina: 0.14 },
            description: '공격 지원과 중원 수비 밸런스를 안정적으로 조율하는 표준 중앙 미드필더입니다.'
        },
        CAR: {
            name: '카릴레로 (CAR)',
            allowedPositions: ['CM', 'CDM', 'LM', 'RM', 'MF'],
            mobility: 0.12, defense: 0.12, mentality: 0.10, attack: -0.10, technique: -0.04, physical: 0.0,
            keyAttrs: { stamina: 0.28, interceptions: 0.24, shortPassing: 0.22, standingTackle: 0.16, positioning: 0.10 },
            description: '중원 좌우 셔틀 역할을 수행하며 풀백이 전진한 뒤의 측면 뒷공간을 성실히 커버하는 미드필더입니다.'
        },
        DLP: {
            name: '딥라잉 플레이메이커 (DLP)',
            allowedPositions: ['CDM', 'DM', 'CM', 'MF'],
            technique: 0.15, mentality: 0.25, defense: 0.05, mobility: -0.25, attack: -0.20, physical: 0.0,
            keyAttrs: { longPassing: 0.30, shortPassing: 0.25, vision: 0.28, composure: 0.17 },
            description: '3선 수비 라인 앞에서 정확한 장단패스와 방향 전환으로 후방 빌드업의 기점이 되는 사령탑입니다.'
        },
        BWM: {
            name: '볼 위닝 미드필더 (BWM)',
            allowedPositions: ['CDM', 'DM', 'CM', 'MF'],
            defense: 0.20, physical: 0.20, mentality: 0.05, technique: -0.25, attack: -0.20, mobility: 0.0,
            keyAttrs: { standingTackle: 0.28, interceptions: 0.24, aggression: 0.20, stamina: 0.18, strength: 0.10 },
            description: '중원에서 상대를 거칠게 압박해 공을 탈취하고 간단한 패스로 소유권을 넘기는 진공청소기입니다.'
        },
        ANC: {
            name: '앵커맨 / 홀딩 (ANC)',
            allowedPositions: ['CDM', 'DM', 'CM', 'MF'],
            defense: 0.24, mentality: 0.14, physical: 0.10, attack: -0.25, mobility: -0.10, technique: -0.13,
            keyAttrs: { interceptions: 0.30, defensiveAwareness: 0.28, standingTackle: 0.24, strength: 0.18 },
            description: '포백 바로 앞 공간을 절대 이탈하지 않고 상대 2선 공격수를 차단하며 포백을 보호하는 전문 수비형 미드필더입니다.'
        },
        W: {
            name: '와이드 미드필더 / 윙어 (W)',
            allowedPositions: ['LM', 'RM', 'LW', 'RW', 'CM'],
            mobility: 0.18, technique: 0.12, attack: 0.05, defense: -0.10, physical: -0.15, mentality: -0.10,
            keyAttrs: { pace: 0.26, crossing: 0.26, stamina: 0.20, dribbling: 0.18, shortPassing: 0.10 },
            description: '미드필드 측면 터치라인을 따라 공수를 오가며 크로스와 측면 전개를 책임집니다.'
        }
    },
    defense: {
        BPD: {
            name: '볼 플레잉 디펜더 (BPD)',
            allowedPositions: ['CB', 'SW', 'DF'],
            technique: 0.15, mentality: 0.15, defense: 0.05, physical: -0.10, mobility: -0.05, attack: -0.20,
            keyAttrs: { defensiveAwareness: 0.24, standingTackle: 0.22, shortPassing: 0.22, longPassing: 0.18, composure: 0.14 },
            description: '탄탄한 수비력과 함께 전방으로 찌르는 빌드업 패스 능력을 겸비한 현대적 센터백입니다.'
        },
        CD: {
            name: '중앙 수비수 (CD)',
            allowedPositions: ['CB', 'SW', 'DF'],
            defense: 0.20, physical: 0.10, mentality: 0.05, technique: -0.10, mobility: -0.05, attack: -0.20,
            keyAttrs: { defensiveAwareness: 0.30, standingTackle: 0.28, strength: 0.22, headingAccuracy: 0.20 },
            description: '안정적인 위치 선정과 대인 마크로 페널티 박스를 지키는 정통 센터백입니다.'
        },
        NCB: {
            name: '노 넌센스 센터백 (NCB)',
            allowedPositions: ['CB', 'DF'],
            defense: 0.25, physical: 0.25, technique: -0.30, mentality: -0.10, mobility: -0.10, attack: 0.0,
            keyAttrs: { strength: 0.30, standingTackle: 0.28, headingAccuracy: 0.22, jumping: 0.20 },
            description: '위험 지역에서 무리한 빌드업 대신 확실한 클리어링과 공중볼 경합을 최우선시하는 파이터형 수비수입니다.'
        },
        LIB: {
            name: '리베로 (LIB)',
            allowedPositions: ['CB', 'SW', 'DF'],
            technique: 0.18, mentality: 0.16, mobility: 0.08, defense: 0.06, physical: -0.12, attack: -0.10,
            keyAttrs: { shortPassing: 0.24, vision: 0.20, defensiveAwareness: 0.22, interceptions: 0.20, dribbling: 0.14 },
            description: '수비 시에는 최후방을 커버하고 빌드업 시에는 3선 미드필더처럼 전진해 볼 배급에 가담하는 스위퍼입니다.'
        },
        FB: {
            name: '풀백 (FB)',
            allowedPositions: ['LB', 'RB', 'LWB', 'RWB', 'DF'],
            defense: 0.15, mobility: 0.10, mentality: 0.05, attack: -0.10, technique: -0.10, physical: -0.10,
            keyAttrs: { standingTackle: 0.25, pace: 0.22, stamina: 0.20, defensiveAwareness: 0.20, crossing: 0.13 },
            description: '측면 수비 안정감을 최우선으로 유지하며 필요할 때만 측면 오버래핑을 지원하는 밸런스 풀백입니다.'
        },
        WB: {
            name: '윙백 (WB)',
            allowedPositions: ['LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'DF'],
            mobility: 0.20, attack: 0.10, technique: 0.10, defense: -0.15, physical: -0.15, mentality: -0.10,
            keyAttrs: { pace: 0.25, stamina: 0.25, crossing: 0.22, dribbling: 0.15, standingTackle: 0.13 },
            description: '터치라인 전체를 지배하며 공격 시 윙어처럼 높게 전진해 크로스를 공급하는 공격형 측면 수비수입니다.'
        },
        IWB: {
            name: '인버티드 윙백 (IWB)',
            allowedPositions: ['LB', 'RB', 'LWB', 'RWB', 'DF'],
            technique: 0.15, mentality: 0.15, defense: 0.05, mobility: 0.0, physical: -0.15, attack: -0.20,
            keyAttrs: { shortPassing: 0.26, vision: 0.22, interceptions: 0.22, ballControl: 0.16, pace: 0.14 },
            description: '공격 시 측면 대신 중앙 3선 미드필드로 좁혀 들어와 중원 수적 우위와 역습 차단막을 형성하는 현대식 풀백입니다.'
        },
        IFB: {
            name: '인버티드 풀백 (IFB)',
            allowedPositions: ['LB', 'RB', 'CB', 'DF'],
            defense: 0.22, physical: 0.14, mentality: 0.08, attack: -0.22, mobility: -0.04, technique: -0.08,
            keyAttrs: { defensiveAwareness: 0.28, standingTackle: 0.26, strength: 0.22, shortPassing: 0.14, pace: 0.10 },
            description: '반대편 풀백이 전진할 때 중앙으로 좁혀 후방 3백(레스트 디펜스)을 형성하는 수비 전담 풀백입니다.'
        }
    }
};

// 2. 전술 및 역할 적합도 계산 매니저 (TacticsManager)
const TacticsManager = {
    getRoleData(roleKey) {
        if (!roleKey) return null;
        for (const line in RoleData) {
            if (RoleData[line][roleKey]) {
                return RoleData[line][roleKey];
            }
        }
        return null;
    },

    getLineForSlot(lineKey, detailPos = '') {
        const dp = String(detailPos || '').toUpperCase();
        if (lineKey === 'TOP') return 'attack';
        if (lineKey === 'AM') return ['LW', 'RW', 'ST', 'CF', 'CAM', 'AM'].includes(dp) ? 'attack' : 'midfield';
        if (lineKey === 'CM' || lineKey === 'DM') return 'midfield';
        if (lineKey === 'DF') return 'defense';
        if (['ST', 'CF', 'LW', 'RW', 'FW'].includes(dp)) return 'attack';
        if (['CAM', 'AM', 'CM', 'LM', 'RM', 'CDM', 'DM', 'MF'].includes(dp)) return 'midfield';
        return 'defense';
    },

    getRolesForPosition(lineKey, detailPos = '') {
        const dp = String(detailPos || '').toUpperCase();
        const result = {};
        if (lineKey === 'TOP' || ['ST', 'CF'].includes(dp)) {
            ['AF', 'P', 'DLF', 'TM', 'PF', 'F9'].forEach(k => { if (RoleData.attack[k]) result[k] = RoleData.attack[k]; });
            return result;
        }
        if (['LW', 'RW'].includes(dp)) {
            ['IF', 'IW', 'W'].forEach(k => { if (RoleData.attack[k]) result[k] = RoleData.attack[k]; });
            return result;
        }
        if (lineKey === 'AM' || ['CAM', 'AM'].includes(dp)) {
            if (RoleData.midfield.AP) result.AP = RoleData.midfield.AP;
            if (RoleData.attack.SS) result.SS = RoleData.attack.SS;
            if (RoleData.attack.F9) result.F9 = RoleData.attack.F9;
            if (RoleData.midfield.MEZ) result.MEZ = RoleData.midfield.MEZ;
            if (RoleData.attack.IF) result.IF = RoleData.attack.IF;
            if (RoleData.attack.IW) result.IW = RoleData.attack.IW;
            return result;
        }
        if (['LM', 'RM'].includes(dp)) {
            if (RoleData.midfield.W) result.W = RoleData.midfield.W;
            if (RoleData.attack.IW) result.IW = RoleData.attack.IW;
            if (RoleData.attack.IF) result.IF = RoleData.attack.IF;
            if (RoleData.midfield.BBM) result.BBM = RoleData.midfield.BBM;
            if (RoleData.midfield.CAR) result.CAR = RoleData.midfield.CAR;
            return result;
        }
        if (['LWB', 'RWB'].includes(dp)) {
            ['WB', 'IWB', 'FB'].forEach(k => { if (RoleData.defense[k]) result[k] = RoleData.defense[k]; });
            return result;
        }
        if (lineKey === 'DM' || ['CDM', 'DM'].includes(dp)) {
            ['DLP', 'BWM', 'ANC', 'BBM', 'CAR'].forEach(k => { if (RoleData.midfield[k]) result[k] = RoleData.midfield[k]; });
            return result;
        }
        if (lineKey === 'CM' || ['CM', 'MF'].includes(dp)) {
            ['BBM', 'CM', 'AP', 'MEZ', 'DLP', 'BWM', 'CAR'].forEach(k => { if (RoleData.midfield[k]) result[k] = RoleData.midfield[k]; });
            return result;
        }
        if (['LB', 'RB'].includes(dp)) {
            ['FB', 'WB', 'IWB', 'IFB'].forEach(k => { if (RoleData.defense[k]) result[k] = RoleData.defense[k]; });
            return result;
        }
        if (lineKey === 'DF' || ['CB', 'SW', 'DF'].includes(dp)) {
            ['BPD', 'CD', 'NCB', 'LIB', 'FB', 'WB', 'IWB', 'IFB'].forEach(k => { if (RoleData.defense[k]) result[k] = RoleData.defense[k]; });
            return result;
        }
        const primaryLine = this.getLineForSlot(lineKey, dp);
        return RoleData[primaryLine] || RoleData.midfield;
    },

    // 선수의 FC27 세부 능력치(attributes) 기반 롤 적합도 산출 (점수 0~100, 별 1~5, 등급 S/A/B/C)
    calculateRoleSuitability(player, roleKey, slotPos = '') {
        if (!player || player.position === 'GK' || roleKey === 'GK') {
            return { score: 85, stars: 4, grade: 'A', label: '적합', color: '#34D399' };
        }
        const role = this.getRoleData(roleKey);
        if (!role) return { score: 75, stars: 3, grade: 'B', label: '무난', color: '#FBBF24' };

        const baseOvr = Math.max(50, Number(player.rating) || 75);
        let weightedAttr = baseOvr;

        if (player.attributes && role.keyAttrs) {
            const flat = {};
            ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].forEach(cat => {
                if (player.attributes[cat] && typeof player.attributes[cat] === 'object') {
                    Object.assign(flat, player.attributes[cat]);
                }
            });
            let sum = 0, wSum = 0;
            for (const [attrName, w] of Object.entries(role.keyAttrs)) {
                const v = Number(flat[attrName]);
                if (Number.isFinite(v)) {
                    sum += v * w;
                    wSum += w;
                }
            }
            if (wSum > 0) weightedAttr = sum / wSum;
        }

        // 선수의 주/부 포지션과 롤 허용 포지션 일치도 확인
        const dp = String(slotPos || player._tacticalSlotPos || player.detailPosition || player.position || '').toUpperCase();
        const natPos = String(player.detailPosition || player.position || '').toUpperCase();
        const subPos = Array.isArray(player.otherPositions) ? player.otherPositions.map(s => String(s).toUpperCase()) : [];

        let posPenalty = 0;
        if (Array.isArray(role.allowedPositions) && role.allowedPositions.length > 0) {
            const fitsSlot = !dp || role.allowedPositions.includes(dp);
            const fitsPlayer = role.allowedPositions.includes(natPos) || subPos.some(sp => role.allowedPositions.includes(sp));
            if (!fitsPlayer && !fitsSlot) posPenalty = 14;
            else if (!fitsPlayer) posPenalty = 6;
        }

        // 상대적 특화도 (선수의 OVR 대비 해당 롤 핵심 스탯이 얼마나 높은지 + 절대 능력치 반영)
        const relDiff = weightedAttr - (baseOvr - 3);
        const rawScore = clampSuitability(Math.round(74 + relDiff * 1.45 + (weightedAttr - 75) * 0.35 - posPenalty), 40, 99);

        let stars = 3, grade = 'B', label = '보통', color = '#FBBF24';
        if (rawScore >= 86) { stars = 5; grade = 'S'; label = '최적'; color = '#34D399'; }
        else if (rawScore >= 78) { stars = 4; grade = 'A'; label = '우수'; color = '#38BDF8'; }
        else if (rawScore >= 68) { stars = 3; grade = 'B'; label = '무난'; color = '#FBBF24'; }
        else { stars = 2; grade = 'C'; label = '어색'; color = '#F87171'; }

        return { score: rawScore, stars, grade, label, color };
    },

    getBestRoleForPlayer(player, lineKey, detailPos = '') {
        const candidates = this.getRolesForPosition(lineKey, detailPos || (player && player.detailPosition));
        let bestKey = Object.keys(candidates)[0] || 'CM';
        let bestScore = -1;
        for (const k of Object.keys(candidates)) {
            const suit = this.calculateRoleSuitability(player, k, detailPos);
            if (suit.score > bestScore) {
                bestScore = suit.score;
                bestKey = k;
            }
        }
        return bestKey;
    },

    calculateFinalPower(baseValue, roleKey, statType) {
        const role = this.getRoleData(roleKey);
        if (!role) return baseValue;
        const mappedStatType = statType === 'speed' ? 'mobility' : statType;
        const weight = role[mappedStatType];
        if (typeof weight !== 'number') return baseValue;
        return Math.round(baseValue * (1 + weight));
    }
};

function clampSuitability(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// 3. FM 스타일 프리셋 정의 (하위 호환용 DNAPresets 유지)
const DNAPresets = {
    gegenpress: {
        name: "게겐프레싱",
        tag: "HIGH PRESS · COUNTERPRESS",
        description: "볼 상실 직후 높은 라인에서 즉각 재압박(게겐프레싱)을 가해 상대 진영에서 찬스를 창출합니다.",
        attack: { attack: 1.1, speed: 1.2, technique: 0.9, physical: 1.0, defense: 0.8, mentality: 1.0 },
        midfield: { attack: 1.0, speed: 1.2, technique: 0.9, physical: 1.1, defense: 0.9, mentality: 0.9 },
        defense: { attack: 0.7, speed: 1.3, technique: 0.8, physical: 1.1, defense: 1.1, mentality: 1.0 }
    },
    tikitaka: {
        name: "티키타카",
        tag: "SHORT PASS · EXTREME POSSESSION",
        description: "촘촘한 간격과 짧은 원투패스 삼각 대형으로 볼 점유율을 극대화하며 상대 수비 블록을 허뭅니다.",
        attack: { attack: 1.0, speed: 0.9, technique: 1.3, physical: 0.7, defense: 0.9, mentality: 1.2 },
        midfield: { attack: 1.0, speed: 0.8, technique: 1.4, physical: 0.7, defense: 0.9, mentality: 1.2 },
        defense: { attack: 0.8, speed: 1.0, technique: 1.2, physical: 0.8, defense: 1.0, mentality: 1.2 }
    },
    verticalTikitaka: {
        name: "수직 티키타카",
        tag: "VERTICAL PASS · HALF-SPACE",
        description: "짧은 패스 빌드업을 유지하되 횡패스 대신 전진 패스와 하프스페이스 침투 템포를 높인 현대 전술입니다.",
        attack: { attack: 1.15, speed: 1.1, technique: 1.2, physical: 0.8, defense: 0.75, mentality: 1.0 },
        midfield: { attack: 1.1, speed: 1.0, technique: 1.25, physical: 0.85, defense: 0.8, mentality: 1.0 },
        defense: { attack: 0.8, speed: 1.05, technique: 1.15, physical: 0.9, defense: 1.05, mentality: 1.05 }
    },
    possession: {
        name: "컨트롤 포제션",
        tag: "PATIENT BUILD-UP · CONTROL",
        description: "무리한 전진 패스를 자제하고 안정적인 볼 순환과 템포 조절로 경기 흐름을 완벽히 통제합니다.",
        attack: { attack: 1.0, speed: 0.8, technique: 1.2, physical: 0.9, defense: 0.9, mentality: 1.2 },
        midfield: { attack: 0.9, speed: 0.7, technique: 1.3, physical: 0.9, defense: 1.0, mentality: 1.2 },
        defense: { attack: 0.7, speed: 0.8, technique: 1.2, physical: 1.0, defense: 1.1, mentality: 1.2 }
    },
    wingPlay: {
        name: "윙 플레이",
        tag: "WIDE OVERLAP · CROSSING",
        description: "공격 폭을 넓게 벌려 윙어와 풀백의 오버래핑, 빠른 크로스로 박스 안 타겟을 집중 공략합니다.",
        attack: { attack: 1.15, speed: 1.2, technique: 1.05, physical: 1.1, defense: 0.6, mentality: 0.9 },
        midfield: { attack: 1.05, speed: 1.15, technique: 1.05, physical: 1.0, defense: 0.85, mentality: 0.9 },
        defense: { attack: 0.85, speed: 1.15, technique: 0.95, physical: 1.0, defense: 1.05, mentality: 1.0 }
    },
    directCounter: {
        name: "플루이드 역습",
        tag: "MID-BLOCK · FAST TRANSITION",
        description: "조직적인 중저 블록으로 상대를 유인한 뒤 볼 탈취 즉시 전방 공간으로 빠르게 역습을 전개합니다.",
        attack: { attack: 1.2, speed: 1.25, technique: 0.95, physical: 1.0, defense: 0.65, mentality: 0.95 },
        midfield: { attack: 0.95, speed: 1.15, technique: 1.0, physical: 1.05, defense: 0.95, mentality: 0.9 },
        defense: { attack: 0.6, speed: 1.05, technique: 0.85, physical: 1.15, defense: 1.25, mentality: 1.1 }
    },
    lowBlockCounter: {
        name: "로우 블록",
        tag: "DEEP BLOCK · LONG COUNTER",
        description: "수비 라인을 깊게 내리고 박스 주변 공간을 철저히 잠근 뒤 최전방 스피드를 활용해 한 방을 노립니다.",
        attack: { attack: 1.2, speed: 1.3, technique: 0.9, physical: 1.0, defense: 0.6, mentality: 1.0 },
        midfield: { attack: 0.8, speed: 1.1, technique: 0.9, physical: 1.1, defense: 1.1, mentality: 1.0 },
        defense: { attack: 0.5, speed: 0.9, technique: 0.7, physical: 1.3, defense: 1.4, mentality: 1.2 }
    },
    catenaccio: {
        name: "카테나치오",
        tag: "ULTRA SOLID · ZONAL LOCK",
        description: "이탈리아식 빗장수비로 중앙 수비 밀도와 대인 마크를 극대화해 실점을 원천 봉쇄합니다.",
        attack: { attack: 1.1, speed: 1.2, technique: 0.9, physical: 0.9, defense: 0.8, mentality: 1.1 },
        midfield: { attack: 0.7, speed: 0.9, technique: 0.9, physical: 1.2, defense: 1.2, mentality: 1.1 },
        defense: { attack: 0.4, speed: 0.9, technique: 0.7, physical: 1.3, defense: 1.5, mentality: 1.2 }
    },
    routeOne: {
        name: "루트 원 롱볼",
        tag: "DIRECT LONG BALL · SECOND BALL",
        description: "중원 빌드업을 생략하고 최전방 타겟맨과 뒷공간으로 곧바로 긴 패스를 투입해 세컨볼 승부를 겁니다.",
        attack: { attack: 1.2, speed: 1.1, technique: 0.7, physical: 1.3, defense: 0.7, mentality: 1.0 },
        midfield: { attack: 0.9, speed: 1.0, technique: 0.9, physical: 1.2, defense: 1.0, mentality: 1.0 },
        defense: { attack: 0.6, speed: 0.8, technique: 0.7, physical: 1.4, defense: 1.3, mentality: 1.2 }
    },
    totalFootball: {
        name: "토탈 풋볼",
        tag: "FLUID SWITCHING · ALL-ROUND",
        description: "전원 공격·전원 수비 철학으로 포지션 구분 없이 유기적으로 공간을 메우고 압박합니다.",
        attack: { attack: 1.0, speed: 1.0, technique: 1.1, physical: 1.0, defense: 0.9, mentality: 1.0 },
        midfield: { attack: 1.0, speed: 1.0, technique: 1.1, physical: 1.0, defense: 1.0, mentality: 0.9 },
        defense: { attack: 0.9, speed: 1.0, technique: 1.1, physical: 1.0, defense: 1.0, mentality: 1.0 }
    },
    balanced: {
        name: "밸런스",
        tag: "STANDARD · FLEXIBLE",
        description: "공수 밸런스와 패스·라인 높이를 표준으로 유지하며 상대 전술에 유연하게 대응합니다.",
        attack: { attack: 1.0, speed: 1.0, technique: 1.0, physical: 1.0, defense: 1.0, mentality: 1.0 },
        midfield: { attack: 1.0, speed: 1.0, technique: 1.0, physical: 1.0, defense: 1.0, mentality: 1.0 },
        defense: { attack: 1.0, speed: 1.0, technique: 1.0, physical: 1.0, defense: 1.0, mentality: 1.0 }
    }
};

// 4. 전술 보드 & 미니 피치 매니저 (DNAManager — 기존 글로벌 인터페이스 100% 유지)
const DNAManager = {
    charts: {},
    selectedPitchPlayerName: null,

    initialize(teamPlayers) {
        if (typeof gameData === 'undefined' || !gameData) return;
        const normFn = typeof window.normalizeTacticKey === 'function' ? window.normalizeTacticKey : (k => k || 'balanced');
        gameData.currentTactic = normFn(gameData.currentTactic || 'balanced');
        if (!gameData.tacticMentality) gameData.tacticMentality = 'balanced';

        // 하위 호환용 lineStats 조용히 유지 (FC27 attributes 미보유 선수 fallback 대비)
        if (!gameData.lineStats) {
            gameData.lineStats = {
                attack: this.createDefaultLineData(75),
                midfield: this.createDefaultLineData(75),
                defense: this.createDefaultLineData(75)
            };
        }
        this.recalculateLineOVRs(false);
        if (gameData.lineStats.attack.usedPoints === 0) this.autoDistribute('attack');
        if (gameData.lineStats.midfield.usedPoints === 0) this.autoDistribute('midfield');
        if (gameData.lineStats.defense.usedPoints === 0) this.autoDistribute('defense');
    },

    createDefaultLineData(ovr) {
        return {
            ovr: ovr,
            totalPoints: ovr * 6,
            usedPoints: 0,
            stats: { attack: 0, speed: 0, technique: 0, physical: 0, defense: 0, mentality: 0 }
        };
    },

    recalculateLineOVRs(shouldRender = false) {
        if (typeof gameData === 'undefined' || !gameData || !gameData.squad || !gameData.lineStats) return;
        const { df = [], mf = [], fw = [] } = gameData.squad;
        const calcAvg = (arr) => {
            const valid = (arr || []).filter(p => p !== null);
            if (!valid.length) return 70;
            return Math.round(valid.reduce((sum, p) => sum + (p.rating || 70), 0) / valid.length);
        };
        this.setLineOVR('attack', calcAvg(fw));
        this.setLineOVR('midfield', calcAvg(mf));
        this.setLineOVR('defense', calcAvg(df));
        if (shouldRender && document.getElementById('tactics')?.classList.contains('active')) {
            this.renderUI();
        }
    },

    setLineOVR(line, ovr) {
        if (!gameData.lineStats || !gameData.lineStats[line]) return;
        gameData.lineStats[line].ovr = ovr;
        gameData.lineStats[line].totalPoints = ovr * 6;
    },

    autoDistribute(line) {
        const lineData = gameData.lineStats?.[line];
        if (!lineData) return;
        const avg = Math.floor(lineData.totalPoints / 6);
        let rem = lineData.totalPoints % 6;
        for (const k in lineData.stats) {
            lineData.stats[k] = avg + (rem > 0 ? 1 : 0);
            if (rem > 0) rem--;
        }
        lineData.usedPoints = lineData.totalPoints;
    },

    applyPreset(line, presetKey) {
        const normKey = typeof window.normalizeTacticKey === 'function' ? window.normalizeTacticKey(presetKey) : presetKey;
        const preset = DNAPresets[normKey] || DNAPresets.balanced;
        const lineData = gameData.lineStats?.[line];
        if (!preset || !lineData) return;
        const weights = preset[line];
        const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
        let totalUsed = 0;
        const keys = Object.keys(lineData.stats);
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            const pts = Math.min(99, Math.max(1, Math.round((lineData.totalPoints * weights[k]) / weightSum)));
            lineData.stats[k] = pts;
            totalUsed += pts;
        }
        const lastKey = keys[keys.length - 1];
        lineData.stats[lastKey] = Math.min(99, Math.max(1, lineData.totalPoints - totalUsed));
        lineData.usedPoints = Object.values(lineData.stats).reduce((a, b) => a + b, 0);
    },

    // 현재 8대 전술 지침 + 경기 성향으로 4대 프로필 수치(0~100) 산출
    computeTacticalMetrics(ts, mentality = 'balanced') {
        let attackPower = 55;
        let defenseSolid = 58;
        let pressTrans = 55;
        let staminaLoad = 48;

        if (ts.buildUp === 'short') { attackPower += 5; defenseSolid += 4; }
        else if (ts.buildUp === 'back3') { attackPower += 8; defenseSolid += 6; }
        else if (ts.buildUp === 'direct') { attackPower += 6; pressTrans += 8; defenseSolid -= 3; }

        if (ts.defensiveLine === 'high') { attackPower += 10; pressTrans += 14; defenseSolid -= 10; staminaLoad += 12; }
        else if (ts.defensiveLine === 'low') { defenseSolid += 16; attackPower -= 8; pressTrans -= 8; staminaLoad -= 8; }

        if (ts.pressIntensity === 'aggressive') { pressTrans += 18; attackPower += 6; staminaLoad += 22; defenseSolid -= 5; }
        else if (ts.pressIntensity === 'cautious') { defenseSolid += 10; pressTrans -= 14; staminaLoad -= 14; }

        if (ts.offensiveTrans === 'counter') { attackPower += 9; pressTrans += 12; staminaLoad += 7; }
        else if (ts.offensiveTrans === 'hold') { defenseSolid += 7; staminaLoad -= 5; }

        if (ts.defensiveTrans === 'counterpress') { pressTrans += 14; attackPower += 6; staminaLoad += 14; defenseSolid -= 4; }
        else if (ts.defensiveTrans === 'regroup') { defenseSolid += 12; staminaLoad -= 6; }

        if (ts.passLength === 'direct') { pressTrans += 6; attackPower += 4; }
        else if (ts.passLength === 'short') { defenseSolid += 4; attackPower += 4; }

        if (ts.tempo === 'fast') { attackPower += 8; pressTrans += 8; staminaLoad += 12; defenseSolid -= 4; }
        else if (ts.tempo === 'slow') { defenseSolid += 6; staminaLoad -= 10; pressTrans -= 6; }

        if (ts.width === 'wide') { attackPower += 7; staminaLoad += 5; defenseSolid -= 4; }
        else if (ts.width === 'narrow') { defenseSolid += 7; attackPower += 2; }

        if (mentality === 'veryDefensive') { defenseSolid += 14; attackPower -= 14; staminaLoad -= 8; }
        else if (mentality === 'defensive') { defenseSolid += 7; attackPower -= 7; staminaLoad -= 4; }
        else if (mentality === 'attacking') { attackPower += 9; defenseSolid -= 6; staminaLoad += 6; }
        else if (mentality === 'veryAttacking') { attackPower += 16; defenseSolid -= 14; staminaLoad += 12; }

        const cl = (v) => Math.max(18, Math.min(98, Math.round(v)));
        return {
            attackPower: cl(attackPower),
            defenseSolid: cl(defenseSolid),
            pressTrans: cl(pressTrans),
            staminaLoad: cl(staminaLoad)
        };
    },

    renderUI() {
        const container = document.getElementById('tacticsContent');
        if (!container || typeof gameData === 'undefined' || !gameData) return;

        if (!gameData.lineStats) this.initialize();
        const normFn = typeof window.normalizeTacticKey === 'function' ? window.normalizeTacticKey : (k => k || 'balanced');
        gameData.currentTactic = normFn(gameData.currentTactic || 'balanced');
        if (!gameData.tacticMentality) gameData.tacticMentality = 'balanced';

        const defaultFn = typeof window.getDefaultTacticSettings === 'function'
            ? window.getDefaultTacticSettings
            : () => ({ buildUp: 'short', defensiveLine: 'mid', pressIntensity: 'balanced', offensiveTrans: 'counter', defensiveTrans: 'regroup', passLength: 'mixed', tempo: 'standard', width: 'standard' });

        if (!gameData.tacticSettings) {
            gameData.tacticSettings = defaultFn(gameData.currentTactic);
        } else {
            gameData.tacticSettings = Object.assign({}, defaultFn(gameData.currentTactic), gameData.tacticSettings);
        }

        const ts = gameData.tacticSettings;
        const curTac = gameData.currentTactic;
        const curPresetInfo = DNAPresets[curTac] || DNAPresets.balanced;
        const masteryPct = (typeof window.getTacticMasteryPct === 'function')
            ? window.getTacticMasteryPct(curTac)
            : Math.min(100, Math.max(0, Number(gameData.tacticMastery?.[curTac] ?? 50)));
        const masteryEff = (typeof window.getTacticMasteryEffect === 'function')
            ? window.getTacticMasteryEffect(masteryPct)
            : {
                tier: masteryPct >= 85 ? '완벽 체화' : (masteryPct >= 65 ? '숙련' : (masteryPct > 50 ? '적응 완료' : (masteryPct === 50 ? '적응 중 (기준)' : '미숙 (페널티)'))),
                signedText: `${masteryPct - 50 > 0 ? '+' : ''}${(((masteryPct - 50) / 50) * 5).toFixed(1)}%`,
                color: masteryPct < 50 ? '#F87171' : (masteryPct === 50 ? '#FBBF24' : '#34D399')
            };
        const masteryBonusTxt = masteryEff.signedText;
        const masteryTier = masteryEff.tier;

        container.replaceChildren();

        // ─────────────────────────────────────────────────────────────
        // [SECTION A] 상단: FM 전술 철학 프리셋 + 전술 숙련도 + 커스텀 슬롯 3개
        // ─────────────────────────────────────────────────────────────
        const topShell = document.createElement('div');
        topShell.style.cssText = 'background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(56, 189, 248, 0.22); border-radius: 16px; padding: 20px; margin-bottom: 20px;';

        const headerRow = document.createElement('div');
        headerRow.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 16px;';

        const titleBlock = document.createElement('div');
        const badgeSpan = document.createElement('span');
        badgeSpan.style.cssText = 'display: inline-block; font-size: 0.72rem; font-weight: 800; color: #38BDF8; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); padding: 3px 9px; border-radius: 999px; margin-bottom: 6px; letter-spacing: 0.05em;';
        badgeSpan.textContent = curPresetInfo.tag || 'FM TACTICAL SYSTEM';

        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin: 0; color: #F8FAFC; font-size: 1.2rem; font-weight: 800;';
        const customSlotBadge = (typeof gameData.activeCustomSlot === 'number' && gameData.customTactics?.[gameData.activeCustomSlot])
            ? ` · ★ ${gameData.customTactics[gameData.activeCustomSlot].name}`
            : '';
        h4.textContent = `전술 철학: ${curPresetInfo.name}${customSlotBadge}`;

        const subDesc = document.createElement('p');
        subDesc.style.cssText = 'margin: 4px 0 0 0; color: #94A3B8; font-size: 0.86rem;';
        subDesc.textContent = curPresetInfo.description;
        titleBlock.append(badgeSpan, h4, subDesc);

        // 전술 숙련도(Familiarity) 박스
        const masteryBox = document.createElement('div');
        masteryBox.style.cssText = 'min-width: 255px; background: rgba(2, 6, 23, 0.72); border: 1px solid rgba(56, 189, 248, 0.32); border-radius: 12px; padding: 11px 15px;';
        const mTop = document.createElement('div');
        mTop.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 6px; gap: 10px;';
        const mLabel = document.createElement('span');
        mLabel.style.cssText = 'color: #E2E8F0; font-weight: 800;';
        mLabel.textContent = `🎯 현재 전술 숙련도 (${masteryTier})`;
        const mVal = document.createElement('span');
        mVal.style.cssText = `color: ${masteryEff.color}; font-weight: 800;`;
        mVal.textContent = `${masteryPct}% (전술 효율 ${masteryBonusTxt})`;
        mTop.append(mLabel, mVal);

        const mTrack = document.createElement('div');
        mTrack.style.cssText = 'height: 8px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden;';
        const mFill = document.createElement('div');
        const mFillGrad = masteryPct < 50
            ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
            : (masteryPct === 50 ? 'linear-gradient(90deg, #F59E0B, #38BDF8)' : 'linear-gradient(90deg, #38BDF8, #34D399)');
        mFill.style.cssText = `height: 100%; width: ${masteryPct}%; background: ${mFillGrad}; border-radius: 999px;`;
        mTrack.appendChild(mFill);
        masteryBox.append(mTop, mTrack);

        headerRow.append(titleBlock, masteryBox);
        topShell.appendChild(headerRow);

        // FM 전술 철학 버튼 그리드 (각 전술별 숙련도 % 함께 표시)
        const presetGrid = document.createElement('div');
        presetGrid.style.cssText = 'display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;';
        for (const [key, preset] of Object.entries(DNAPresets)) {
            const isActive = (curTac === key && gameData.activeCustomSlot == null);
            const pMastery = (typeof window.getTacticMasteryPct === 'function')
                ? window.getTacticMasteryPct(key)
                : Math.min(100, Math.max(0, Number(gameData.tacticMastery?.[key] || 20)));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-sm';
            btn.style.cssText = isActive
                ? 'background: #38BDF8; color: #0F172A; font-weight: 800; border: 1px solid #38BDF8; padding: 7px 13px; border-radius: 8px; cursor: pointer;'
                : 'background: rgba(30, 41, 59, 0.75); color: #CBD5E1; border: 1px solid rgba(148, 163, 184, 0.22); padding: 7px 13px; border-radius: 8px; cursor: pointer;';
            btn.textContent = `${preset.name} (${pMastery}%)`;
            btn.onclick = () => this.handlePresetApply(key);
            presetGrid.appendChild(btn);
        }
        topShell.appendChild(presetGrid);

        // 기본 경기 성향(Mentality) 5단계 바 + 커스텀 전술 슬롯 3개
        const subControlRow = document.createElement('div');
        subControlRow.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; padding-top: 14px; border-top: 1px solid rgba(148, 163, 184, 0.14);';

        // (1) 5단계 기본 경기 성향
        const mentalityCard = document.createElement('div');
        mentalityCard.style.cssText = 'background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 12px; padding: 12px;';
        const mTitle = document.createElement('div');
        mTitle.style.cssText = 'font-size: 0.82rem; font-weight: 800; color: #E2E8F0; margin-bottom: 8px;';
        mTitle.textContent = '기본 경기 성향 (Mentality · 경기 중 실시간 변경 가능)';
        const mBtnsWrap = document.createElement('div');
        mBtnsWrap.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;';
        const mentalities = [
            { val: 'veryDefensive', label: '극단적 수비' },
            { val: 'defensive', label: '수비적' },
            { val: 'balanced', label: '균형' },
            { val: 'attacking', label: '공격적' },
            { val: 'veryAttacking', label: '총공세' }
        ];
        mentalities.forEach(m => {
            const b = document.createElement('button');
            b.type = 'button';
            const active = (gameData.tacticMentality || 'balanced') === m.val;
            b.style.cssText = active
                ? 'background: rgba(245, 158, 11, 0.22); color: #FBBF24; border: 1px solid #F59E0B; border-radius: 7px; padding: 7px 4px; font-size: 0.78rem; font-weight: 800; cursor: pointer;'
                : 'background: rgba(30, 41, 59, 0.6); color: #94A3B8; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 7px; padding: 7px 4px; font-size: 0.78rem; cursor: pointer;';
            b.textContent = m.label;
            b.onclick = () => {
                gameData.tacticMentality = m.val;
                if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
                this.renderUI();
            };
            mBtnsWrap.appendChild(b);
        });
        mentalityCard.append(mTitle, mBtnsWrap);

        // (2) 유저 커스텀 전술 슬롯 3개
        const slotCard = document.createElement('div');
        slotCard.style.cssText = 'background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 12px; padding: 12px;';
        const sTitle = document.createElement('div');
        sTitle.style.cssText = 'font-size: 0.82rem; font-weight: 800; color: #E2E8F0; margin-bottom: 8px;';
        sTitle.textContent = '★ 커스텀 전술 플랜 슬롯 (최대 3개 저장 · 경기 중 즉시 호출)';
        const slotsWrap = document.createElement('div');
        slotsWrap.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;';

        const slots = (typeof window.CustomTacticSlots !== 'undefined') ? window.CustomTacticSlots.ensureSlots() : [];
        slots.forEach((slot, idx) => {
            const isSlotActive = gameData.activeCustomSlot === idx;
            const hasSaved = Boolean(slot && slot.settings);
            const box = document.createElement('div');
            box.style.cssText = `background: ${isSlotActive ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.7)'}; border: 1px solid ${isSlotActive ? '#38BDF8' : 'rgba(148, 163, 184, 0.18)'}; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; gap: 6px;`;

            const nameRow = document.createElement('div');
            nameRow.style.cssText = 'font-size: 0.78rem; font-weight: 800; color: #F8FAFC; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            nameRow.textContent = slot.name || `플랜 ${idx + 1}`;

            const subTxt = document.createElement('div');
            subTxt.style.cssText = 'font-size: 0.7rem; color: #94A3B8;';
            subTxt.textContent = hasSaved ? (DNAPresets[slot.baseStyle]?.name || '커스텀') : '비어 있음';

            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display: flex; gap: 4px;';

            const saveBtn = document.createElement('button');
            saveBtn.type = 'button';
            saveBtn.style.cssText = 'flex: 1; background: rgba(52, 211, 153, 0.16); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 5px; padding: 4px 0; font-size: 0.72rem; font-weight: 700; cursor: pointer;';
            saveBtn.textContent = '저장';
            saveBtn.onclick = () => {
                const newName = prompt(`슬롯 ${idx + 1}의 전술 플랜 이름을 입력하세요:`, slot.name || `커스텀 플랜 ${idx + 1}`);
                if (newName === null) return;
                window.CustomTacticSlots.saveToSlot(idx, newName);
                this.renderUI();
            };

            const loadBtn = document.createElement('button');
            loadBtn.type = 'button';
            loadBtn.disabled = !hasSaved;
            loadBtn.style.cssText = hasSaved
                ? 'flex: 1; background: rgba(56, 189, 248, 0.18); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 5px; padding: 4px 0; font-size: 0.72rem; font-weight: 700; cursor: pointer;'
                : 'flex: 1; background: rgba(30, 41, 59, 0.4); color: #475569; border: 1px solid rgba(71, 85, 105, 0.2); border-radius: 5px; padding: 4px 0; font-size: 0.72rem; cursor: not-allowed;';
            loadBtn.textContent = '적용';
            loadBtn.onclick = () => {
                if (!hasSaved) return;
                window.CustomTacticSlots.loadFromSlot(idx);
                this.renderUI();
            };

            btnRow.append(saveBtn, loadBtn);
            box.append(nameRow, subTxt, btnRow);
            slotsWrap.appendChild(box);
        });
        slotCard.append(sTitle, slotsWrap);

        subControlRow.append(mentalityCard, slotCard);
        topShell.appendChild(subControlRow);
        container.appendChild(topShell);

        // ─────────────────────────────────────────────────────────────
        // [SECTION B] 중단: 팀 전술 8대 지침 보드 (100% 매치엔진 실시간 연동)
        // ─────────────────────────────────────────────────────────────
        const boardSection = document.createElement('div');
        boardSection.style.cssText = 'background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 16px; padding: 20px; margin-bottom: 20px;';

        const boardHeader = document.createElement('div');
        boardHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;';
        const boardTitle = document.createElement('h4');
        boardTitle.style.cssText = 'margin: 0; color: #FBBF24; font-size: 1.05rem; font-weight: 800;';
        boardTitle.textContent = '팀 전술 8대 핵심 지침 (인게임 빌드업 · 전환 · 수비 라인 직결)';
        const resetPresetBtn = document.createElement('button');
        resetPresetBtn.type = 'button';
        resetPresetBtn.className = 'btn btn-sm';
        resetPresetBtn.style.cssText = 'background: rgba(148, 163, 184, 0.14); color: #CBD5E1; border: 1px solid rgba(148, 163, 184, 0.25); font-size: 0.76rem; padding: 5px 10px; border-radius: 7px; cursor: pointer;';
        resetPresetBtn.textContent = '현재 철학 기본값 복원';
        resetPresetBtn.onclick = () => {
            gameData.tacticSettings = defaultFn(gameData.currentTactic);
            if (typeof window.migrateDeepTactics === 'function') window.migrateDeepTactics();
            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            this.renderUI();
        };
        boardHeader.append(boardTitle, resetPresetBtn);
        boardSection.appendChild(boardHeader);

        const optionsConfig = [
            {
                key: 'buildUp', title: '1. 후방 빌드업 구조',
                choices: [
                    { val: 'short', label: '짧은 빌드업', desc: '포백과 중원이 좁혀 안전하게 패스 전개' },
                    { val: 'back3', label: '라볼피아나 (3백 변형)', desc: '수비형 미드필더/풀백이 후방 3백 형성' },
                    { val: 'direct', label: '다이렉트 전개', desc: '후방 위험을 피하고 전방으로 빠르게 투입' }
                ]
            },
            {
                key: 'defensiveLine', title: '2. 수비 라인 높이',
                choices: [
                    { val: 'low', label: '로우 블록', desc: '박스 보호 및 뒷공간 차단 최우선' },
                    { val: 'mid', label: '미드 블록', desc: '공수 간격을 표준으로 유지' },
                    { val: 'high', label: '하이 라인', desc: '하프라인 부근까지 올려 전방 압박 지원 (뒷공간 주의)' }
                ]
            },
            {
                key: 'pressIntensity', title: '3. 압박 강도',
                choices: [
                    { val: 'cautious', label: '지공/지역 방어', desc: '대형 유지 및 체력 소모 최소화' },
                    { val: 'balanced', label: '균형 압박', desc: '블록 진입 시 조직적 협력 압박' },
                    { val: 'aggressive', label: '극한 전방 압박', desc: '강한 압박으로 볼 탈취 증가 (후반 체력 소모 큼)' }
                ]
            },
            {
                key: 'offensiveTrans', title: '4. 공격 전환 (볼 획득 시)',
                choices: [
                    { val: 'hold', label: '대형 유지 · 지공', desc: '안전하게 볼을 돌리며 동료 전진 대기' },
                    { val: 'counter', label: '즉각 역습', desc: '탈취 즉시 최전방 뒷공간으로 스루패스/질주' }
                ]
            },
            {
                key: 'defensiveTrans', title: '5. 수비 전환 (볼 상실 직후)',
                choices: [
                    { val: 'regroup', label: '즉시 대형 복귀', desc: '볼 상실 시 빠르게 수비 위치로 내려와 역습 차단' },
                    { val: 'counterpress', label: '게겐프레싱 (즉각 재압박)', desc: '상실 후 3초간 주변 인원이 즉시 재압박 (체력 소모 증가)' }
                ]
            },
            {
                key: 'passLength', title: '6. 패스 길이 성향',
                choices: [
                    { val: 'short', label: '짧은 패스 위주', desc: '높은 패스 성공률과 짧은 삼각 연계' },
                    { val: 'mixed', label: '혼합 패스', desc: '상황에 맞춰 짧은 패스와 전환 패스 병행' },
                    { val: 'direct', label: '직선적 롱패스', desc: '전방 공격수에게 빠른 침투/롱패스 시도' }
                ]
            },
            {
                key: 'tempo', title: '7. 공격 전개 템포',
                choices: [
                    { val: 'slow', label: '느린 템포', desc: '체력을 아끼며 확실한 공간이 열릴 때까지 대기' },
                    { val: 'standard', label: '표준 템포', desc: '공수 균형 잡힌 기본 전개 속도' },
                    { val: 'fast', label: '빠른 템포', desc: '원터치 패스와 빠른 슈팅 판단 (패스 미스·체력 소모 증가)' }
                ]
            },
            {
                key: 'width', title: '8. 팀 좌우 폭',
                choices: [
                    { val: 'narrow', label: '좁은 폭 (중앙 밀집)', desc: '하프스페이스·중앙 수적 우위 및 촘촘한 수비 간격' },
                    { val: 'standard', label: '표준 폭', desc: '측면과 중앙을 고르게 활용' },
                    { val: 'wide', label: '넓은 폭 (측면 극대화)', desc: '터치라인 끝까지 벌려 상대 수비 블록을 좌우로 흔듦' }
                ]
            }
        ];

        const grid8 = document.createElement('div');
        grid8.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;';

        optionsConfig.forEach(opt => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(2, 6, 23, 0.55); border: 1px solid rgba(148, 163, 184, 0.14); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;';

            const cTitle = document.createElement('div');
            cTitle.style.cssText = 'color: #E2E8F0; font-size: 0.85rem; font-weight: 800; margin-bottom: 8px;';
            cTitle.textContent = opt.title;

            const btnGroup = document.createElement('div');
            btnGroup.style.cssText = 'display: flex; gap: 6px; margin-bottom: 8px;';

            const activeVal = ts[opt.key];
            let activeDesc = '';

            opt.choices.forEach(ch => {
                const isSelected = activeVal === ch.val;
                if (isSelected) activeDesc = ch.desc;
                const b = document.createElement('button');
                b.type = 'button';
                b.style.cssText = isSelected
                    ? 'flex: 1; background: rgba(56, 189, 248, 0.22); color: #38BDF8; border: 1px solid #38BDF8; border-radius: 7px; padding: 7px 4px; font-size: 0.77rem; font-weight: 800; cursor: pointer;'
                    : 'flex: 1; background: rgba(30, 41, 59, 0.6); color: #94A3B8; border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 7px; padding: 7px 4px; font-size: 0.77rem; cursor: pointer;';
                b.textContent = ch.label;
                b.onclick = () => {
                    gameData.tacticSettings[opt.key] = ch.val;
                    if (typeof window.migrateDeepTactics === 'function') window.migrateDeepTactics();
                    if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
                    this.renderUI();
                };
                btnGroup.appendChild(b);
            });

            const descEl = document.createElement('div');
            descEl.style.cssText = 'font-size: 0.74rem; color: #94A3B8; line-height: 1.35;';
            descEl.textContent = activeDesc;

            card.append(cTitle, btnGroup, descEl);
            grid8.appendChild(card);
        });

        boardSection.appendChild(grid8);
        container.appendChild(boardSection);

        // ─────────────────────────────────────────────────────────────
        // [SECTION C] 하단 2열: (좌) 팀 전술 프로필 대시보드 / (우) 포메이션 미니 피치 & 선수 롤 적합도
        // ─────────────────────────────────────────────────────────────
        const bottomGrid = document.createElement('div');
        bottomGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;';

        bottomGrid.append(
            this.buildProfileDashboard(ts, gameData.tacticMentality || 'balanced'),
            this.buildMiniPitchAndRolesPanel()
        );

        container.appendChild(bottomGrid);
    },

    buildProfileDashboard(ts, mentality) {
        const panel = document.createElement('div');
        panel.style.cssText = 'background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 16px;';

        const title = document.createElement('h4');
        title.style.cssText = 'margin: 0; color: #38BDF8; font-size: 1.05rem; font-weight: 800;';
        title.textContent = '📊 팀 전술 프로필 & 리스크 진단';
        panel.appendChild(title);

        const metrics = this.computeTacticalMetrics(ts, mentality);
        const gaugeSpecs = [
            { label: '공격 파괴력 & 침투성', val: metrics.attackPower, color: '#F87171', sub: '찬스 창출 빈도 및 박스 안 침투 인원' },
            { label: '수비 블록 견고함', val: metrics.defenseSolid, color: '#38BDF8', sub: '라인 간격 유지 및 뒷공간·박스 보호력' },
            { label: '압박 강도 & 전환 속도', val: metrics.pressTrans, color: '#34D399', sub: '볼 탈취력 및 공수 전환 다이렉트성' },
            { label: '경기당 체력 소모 부하', val: metrics.staminaLoad, color: metrics.staminaLoad >= 75 ? '#EF4444' : '#FBBF24', sub: metrics.staminaLoad >= 75 ? '⚠️ 높음: 후반 65분 이후 급격한 탈진 주의 (교체 필수)' : '적정: 90분 내내 안정적인 기동력 유지 가능' }
        ];

        const gaugesWrap = document.createElement('div');
        gaugesWrap.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
        gaugeSpecs.forEach(g => {
            const row = document.createElement('div');
            row.style.cssText = 'background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 10px; padding: 10px 12px;';
            const top = document.createElement('div');
            top.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.82rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;';
            const lSpan = document.createElement('span');
            lSpan.textContent = g.label;
            const vSpan = document.createElement('span');
            vSpan.style.color = g.color;
            vSpan.textContent = `${g.val} / 100`;
            top.append(lSpan, vSpan);

            const track = document.createElement('div');
            track.style.cssText = 'height: 8px; background: rgba(255,255,255,0.08); border-radius: 999px; overflow: hidden; margin-bottom: 4px;';
            const fill = document.createElement('div');
            fill.style.cssText = `height: 100%; width: ${g.val}%; background: ${g.color}; border-radius: 999px;`;
            track.appendChild(fill);

            const sub = document.createElement('div');
            sub.style.cssText = 'font-size: 0.73rem; color: #94A3B8;';
            sub.textContent = g.sub;

            row.append(top, track, sub);
            gaugesWrap.appendChild(row);
        });
        panel.appendChild(gaugesWrap);

        // 인과관계 진단 카드
        const diagBox = document.createElement('div');
        diagBox.style.cssText = 'background: rgba(56, 189, 248, 0.07); border: 1px solid rgba(56, 189, 248, 0.24); border-radius: 12px; padding: 14px;';
        const dTitle = document.createElement('div');
        dTitle.style.cssText = 'color: #38BDF8; font-weight: 800; font-size: 0.85rem; margin-bottom: 8px;';
        dTitle.textContent = '💡 현재 전술 인과관계 분석';

        const notes = [];
        if (ts.defensiveLine === 'high' && ts.defensiveTrans === 'counterpress') {
            notes.push('• [하이 라인 + 게겐프레싱] 상대 진영에서 공을 되찾아 연속 공격을 퍼붓지만, 원터치 롱패스 역습에 뒷공간이 노출될 수 있습니다. 발 빠른 센터백(BPD/CD)이 필수입니다.');
        } else if (ts.defensiveLine === 'low' && ts.offensiveTrans === 'counter') {
            notes.push('• [로우 블록 + 즉각 역습] 수비 공간은 매우 견고하나 공격 숫자가 부족할 수 있습니다. 최전방에 어드밴스드 포워드(AF)나 인사이드 포워드(IF)를 배치하세요.');
        }
        if (ts.passLength === 'short' && ts.width === 'narrow') {
            notes.push('• [짧은 패스 + 좁은 폭] 중앙 점유율과 원투패스 연계가 극대화되지만, 텐백(밀집 수비) 상대로는 측면 윙백(WB)이나 윙어(W)로 폭을 넓혀주는 것이 유리합니다.');
        }
        if (ts.pressIntensity === 'aggressive' && ts.tempo === 'fast') {
            notes.push('• [극한 압박 + 빠른 템포] 전반전 주도권 장악력이 최상이지만 65분 이후 미드필더 체력이 급감합니다. 경기 중 리드 시 [시간 끌기]나 [균형 압박]으로 조절하세요.');
        }
        if (notes.length === 0) {
            notes.push('• 공수 간격과 체력 소모가 고르게 조율된 밸런스 세팅입니다. 상대의 라인 높이에 따라 경기 중 5단계 성향(Mentality)으로 승부수를 던지세요.');
        }

        notes.forEach(txt => {
            const p = document.createElement('div');
            p.style.cssText = 'font-size: 0.79rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 6px;';
            p.textContent = txt;
            diagBox.appendChild(p);
        });
        panel.appendChild(diagBox);

        return panel;
    },

    buildMiniPitchAndRolesPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = 'background: rgba(15, 23, 42, 0.78); border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px;';

        if (typeof window.formationSystem !== 'undefined' && window.formationSystem) {
            window.formationSystem.ensureSquadLines();
        }
        if (!gameData.playerRoles) gameData.playerRoles = {};

        // 상단 헤더 + 포메이션 프리셋 즉시 선택 + 최적 롤 자동 배정 버튼
        const topRow = document.createElement('div');
        topRow.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;';

        const title = document.createElement('h4');
        title.style.cssText = 'margin: 0; color: #34D399; font-size: 1.05rem; font-weight: 800;';
        const fDisp = (typeof window.formationSystem !== 'undefined' && window.formationSystem)
            ? window.formationSystem.getFormationDisplayName()
            : '4-3-3';
        title.textContent = `⚽ 포메이션 (${fDisp}) & 개인 롤(Role) 설정`;

        const ctrlWrap = document.createElement('div');
        ctrlWrap.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-wrap: wrap;';

        // FM 포메이션 템플릿 선택 드롭다운
        if (typeof TeamUtils !== 'undefined' && TeamUtils.FORMATION_TEMPLATES) {
            const fSelect = document.createElement('select');
            fSelect.style.cssText = 'background: #1E293B; color: #F8FAFC; border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 7px; padding: 5px 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer;';
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '포메이션 프리셋 변경...';
            fSelect.appendChild(placeholder);

            Object.keys(TeamUtils.FORMATION_TEMPLATES).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = TeamUtils.FORMATION_TEMPLATES[k].name;
                if (gameData.currentFormationTemplate === k) opt.selected = true;
                fSelect.appendChild(opt);
            });
            fSelect.onchange = (e) => {
                const tplKey = e.target.value;
                if (!tplKey) return;
                if (typeof window.formationSystem !== 'undefined' && typeof window.formationSystem.applyFormationTemplate === 'function') {
                    window.formationSystem.applyFormationTemplate(tplKey);
                }
                this.renderUI();
            };
            ctrlWrap.appendChild(fSelect);
        }

        const autoRoleBtn = document.createElement('button');
        autoRoleBtn.type = 'button';
        autoRoleBtn.style.cssText = 'background: rgba(52, 211, 153, 0.16); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.35); border-radius: 7px; padding: 5px 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer;';
        autoRoleBtn.textContent = '★ 최적 롤 자동 배정';
        autoRoleBtn.onclick = () => {
            const lines = gameData.squadLines || {};
            ['TOP', 'AM', 'CM', 'DM', 'DF'].forEach(lk => {
                (lines[lk] || []).forEach(p => {
                    if (!p) return;
                    const slotPos = p._tacticalSlotPos || p.detailPosition || p.position;
                    gameData.playerRoles[p.name] = TacticsManager.getBestRoleForPlayer(p, lk, slotPos);
                });
            });
            if (typeof window.formationSystem !== 'undefined' && window.formationSystem) {
                window.formationSystem.displayCurrentSquad();
            }
            if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
            this.renderUI();
        };
        ctrlWrap.appendChild(autoRoleBtn);

        topRow.append(title, ctrlWrap);
        panel.appendChild(topRow);

        // 미니 피치 렌더링
        const pitch = document.createElement('div');
        pitch.style.cssText = 'background: linear-gradient(180deg, #064E3B 0%, #065F46 50%, #064E3B 100%); border: 2px solid rgba(255,255,255,0.22); border-radius: 14px; padding: 12px 10px; display: flex; flex-direction: column; gap: 8px; position: relative;';

        const lineOrder = ['TOP', 'AM', 'CM', 'DM', 'DF', 'GK'];
        const linesData = gameData.squadLines || {};
        let selectedPlayerObj = null;
        let selectedPlayerLine = 'CM';

        lineOrder.forEach(lk => {
            const playersInLine = (linesData[lk] || []).filter(Boolean);
            if (playersInLine.length === 0) return;

            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-around; align-items: center; gap: 6px; min-height: 46px;';

            playersInLine.forEach(p => {
                const slotPos = p._tacticalSlotPos || p.detailPosition || p.position;
                let roleKey = gameData.playerRoles[p.name];
                if (!roleKey && lk !== 'GK') {
                    roleKey = TacticsManager.getBestRoleForPlayer(p, lk, slotPos);
                    gameData.playerRoles[p.name] = roleKey;
                }
                if (!this.selectedPitchPlayerName && lk !== 'GK') {
                    this.selectedPitchPlayerName = p.name;
                }
                if (this.selectedPitchPlayerName === p.name) {
                    selectedPlayerObj = p;
                    selectedPlayerLine = lk;
                }

                const suit = lk === 'GK'
                    ? { score: 90, stars: 5, grade: 'S', label: 'GK', color: '#FBBF24' }
                    : TacticsManager.calculateRoleSuitability(p, roleKey, slotPos);
                const isSelected = this.selectedPitchPlayerName === p.name;

                const token = document.createElement('button');
                token.type = 'button';
                token.style.cssText = `background: ${isSelected ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.82)'}; border: 2px solid ${isSelected ? '#38BDF8' : suit.color}; border-radius: 10px; padding: 5px 8px; min-width: 78px; max-width: 115px; cursor: pointer; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35);`;

                const topBadge = document.createElement('div');
                topBadge.style.cssText = 'display: flex; justify-content: center; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 800; margin-bottom: 2px;';
                const posSpan = document.createElement('span');
                posSpan.style.color = '#94A3B8';
                posSpan.textContent = slotPos;
                const roleSpan = document.createElement('span');
                roleSpan.style.color = suit.color;
                roleSpan.textContent = lk === 'GK' ? 'GK' : `${roleKey} ★${suit.stars}`;
                topBadge.append(posSpan, roleSpan);

                const nameDiv = document.createElement('div');
                nameDiv.style.cssText = 'color: #F8FAFC; font-size: 0.76rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                nameDiv.textContent = p.name;

                token.append(topBadge, nameDiv);
                token.onclick = () => {
                    this.selectedPitchPlayerName = p.name;
                    this.renderUI();
                };
                row.appendChild(token);
            });

            pitch.appendChild(row);
        });

        panel.appendChild(pitch);

        // 선택된 선수의 롤 변경 & 적합도 상세 카드
        const inspector = document.createElement('div');
        inspector.style.cssText = 'background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 12px; padding: 12px;';

        if (selectedPlayerObj && selectedPlayerLine !== 'GK') {
            const slotPos = selectedPlayerObj._tacticalSlotPos || selectedPlayerObj.detailPosition || selectedPlayerObj.position;
            const curRoleKey = gameData.playerRoles[selectedPlayerObj.name] || TacticsManager.getBestRoleForPlayer(selectedPlayerObj, selectedPlayerLine, slotPos);
            const availableRoles = TacticsManager.getRolesForPosition(selectedPlayerLine, slotPos);
            const curRoleData = TacticsManager.getRoleData(curRoleKey);
            const curSuit = TacticsManager.calculateRoleSuitability(selectedPlayerObj, curRoleKey, slotPos);

            const head = document.createElement('div');
            head.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;';
            const pInfo = document.createElement('div');
            pInfo.style.cssText = 'font-size: 0.86rem; font-weight: 800; color: #F8FAFC;';
            pInfo.textContent = `🎯 ${selectedPlayerObj.name} (${slotPos} · OVR ${selectedPlayerObj.rating}) 개인 롤 설정`;

            const suitBadge = document.createElement('span');
            suitBadge.style.cssText = `font-size: 0.76rem; font-weight: 800; color: ${curSuit.color}; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px;`;
            suitBadge.textContent = `적합도 ${curSuit.grade}등급 (${curSuit.score}점 · ${'★'.repeat(curSuit.stars)})`;
            head.append(pInfo, suitBadge);

            const roleBtns = document.createElement('div');
            roleBtns.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;';

            for (const [rKey, rData] of Object.entries(availableRoles)) {
                const s = TacticsManager.calculateRoleSuitability(selectedPlayerObj, rKey, slotPos);
                const isAct = rKey === curRoleKey;
                const b = document.createElement('button');
                b.type = 'button';
                b.style.cssText = isAct
                    ? `background: rgba(56, 189, 248, 0.22); color: #38BDF8; border: 1px solid #38BDF8; border-radius: 7px; padding: 6px 10px; font-size: 0.76rem; font-weight: 800; cursor: pointer;`
                    : `background: rgba(30, 41, 59, 0.65); color: #CBD5E1; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 7px; padding: 6px 10px; font-size: 0.76rem; cursor: pointer;`;
                b.textContent = `${rData.name} [★${s.stars}]`;
                b.onclick = () => {
                    gameData.playerRoles[selectedPlayerObj.name] = rKey;
                    if (typeof window.formationSystem !== 'undefined' && window.formationSystem) {
                        window.formationSystem.displayCurrentSquad();
                    }
                    if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
                    this.renderUI();
                };
                roleBtns.appendChild(b);
            }

            const roleDesc = document.createElement('div');
            roleDesc.style.cssText = 'font-size: 0.76rem; color: #94A3B8; line-height: 1.4;';
            roleDesc.textContent = curRoleData ? curRoleData.description : '';

            inspector.append(head, roleBtns, roleDesc);
        } else {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'font-size: 0.8rem; color: #94A3B8; text-align: center; padding: 8px;';
            emptyMsg.textContent = '위 미니 피치에서 필드 플레이어를 클릭하면 포지션별 FM 개인 롤과 능력치 적합도(★)를 즉시 설정할 수 있습니다.';
            inspector.appendChild(emptyMsg);
        }

        panel.appendChild(inspector);
        return panel;
    },

    handlePresetApply(presetKey) {
        const normKey = typeof window.normalizeTacticKey === 'function' ? window.normalizeTacticKey(presetKey) : presetKey;
        if (!DNAPresets[normKey]) return;

        gameData.currentTactic = normKey;
        gameData.activeCustomSlot = null;

        if (typeof window.getDefaultTacticSettings === 'function') {
            gameData.tacticSettings = window.getDefaultTacticSettings(normKey);
        }
        if (typeof window.migrateDeepTactics === 'function') {
            window.migrateDeepTactics();
        }
        this.applyPreset('attack', normKey);
        this.applyPreset('midfield', normKey);
        this.applyPreset('defense', normKey);

        if (typeof window.updateCurrentTacticPanelUI === 'function') {
            window.updateCurrentTacticPanelUI(normKey);
        }
        const legacySel = document.getElementById('tacticSelect');
        if (legacySel) legacySel.value = normKey;

        if (typeof window.triggerAutoSave === 'function') window.triggerAutoSave();
        this.renderUI();
    }
};

window.RoleData = RoleData;
window.TacticsManager = TacticsManager;
window.DNAPresets = DNAPresets;
window.DNAManager = DNAManager;
