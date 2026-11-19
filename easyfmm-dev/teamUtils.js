/**
 * TeamUtils.js - 팀 전력 계산, AI 최적 포메이션 연산 및 선수 관리 공통 유틸리티
 */

const TeamUtils = {
    // 1. 유저 지정 14종 정통 실축 포메이션 템플릿
    FORMATION_TEMPLATES: {
        // 1. 4-3-3 계열 (3종)
        '4-3-3 (플랫: 3 CM)': {
            name: '4-3-3 (플랫)',
            formationKey: '4-3-3',
            description: '3명의 중앙 미드필더와 와이드 3톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM3', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },
        '4-3-3 (홀딩: 1 CDM, 2 CM)': {
            name: '4-3-3 (홀딩)',
            formationKey: '4-3-3',
            description: '1볼란치 수비형 미드필더와 2중미, 와이드 3톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },
        '4-3-3 (어택: 1 CAM, 2 CM)': {
            name: '4-3-3 (어택)',
            formationKey: '4-3-3',
            description: '1공미와 2중미, 공격적인 와이드 3톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CAM', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 2. 4-4-2 (LM, CM, CM, RM)
        '4-4-2 (LM-CM-CM-RM)': {
            name: '4-4-2',
            formationKey: '4-4-2',
            description: '정통 플랫 4-4-2 (LM-CM-CM-RM 및 강력한 투톱)',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'LM', line: 'CM', role: 'LM', pos: 'LM' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'RM', line: 'CM', role: 'RM', pos: 'RM' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 3. 4-2-3-1
        '4-2-3-1': {
            name: '4-2-3-1',
            formationKey: '4-2-3-1',
            description: '더블 볼란치(2 CDM)와 2선 공격 편대(LW-CAM-RW)',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CDM1', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CDM2', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CAM', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 4. 4-5-1 (중원 강화)
        '4-5-1 (중원 강화)': {
            name: '4-5-1',
            formationKey: '4-5-1',
            description: '중원 압도 5미드필더 (LM-CM-CDM-CM-RM 및 원톱)',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'LM', line: 'CM', role: 'LM', pos: 'LM' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'RM', line: 'CM', role: 'RM', pos: 'RM' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 5. 4-2-4 (더블 볼란치 4톱)
        '4-2-4 (더블 볼란치 4톱)': {
            name: '4-2-4',
            formationKey: '4-2-4',
            description: '더블 볼란치(2 CDM)와 4인 공격진(LW-ST-ST-RW)',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CDM1', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CDM2', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' }
            ]
        },

        // 6. 4-2-2-2 (더블 10번)
        '4-2-2-2 (더블 10번)': {
            name: '4-2-2-2',
            formationKey: '4-2-2-2',
            description: '더블 볼란치와 더블 플레이메이커(2 CDM - 2 CAM - 2 ST)',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CDM1', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CDM2', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CAM1', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'CAM2', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 7. 3-4-3 (플랫: LM, CM, CM, RM)
        '3-4-3 (플랫)': {
            name: '3-4-3 (플랫)',
            formationKey: '3-4-3',
            description: '3백과 4인 미드필더(LM-CM-CM-RM), 와이드 3톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB3', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'LM', line: 'CM', role: 'LM', pos: 'LM' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'RM', line: 'CM', role: 'RM', pos: 'RM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 8. 3-4-3 (다이아몬드: LM, CDM, CAM, RM)
        '3-4-3 (다이아몬드)': {
            name: '3-4-3 (다이아몬드)',
            formationKey: '3-4-3',
            description: '3백과 다이아몬드 미드(LM-CDM-CAM-RM), 와이드 3톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB3', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'LM', line: 'CM', role: 'LM', pos: 'LM' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CAM', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'RM', line: 'CM', role: 'RM', pos: 'RM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 9. 3-5-2
        '3-5-2': {
            name: '3-5-2',
            formationKey: '3-5-2',
            description: '3백과 좌우 윙백, 중원 3인(CDM-CM-CAM) 및 투톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB3', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'LWB', line: 'DM', role: 'LWB', pos: 'LWB' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CM', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CAM', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'RWB', line: 'DM', role: 'RWB', pos: 'RWB' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 10. 5-2-3
        '5-2-3': {
            name: '5-2-3',
            formationKey: '5-2-3',
            description: '5백(LWB-3CB-RWB)의 철벽 수비와 3톱 역습',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LWB', line: 'DF', role: 'LWB', pos: 'LWB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB3', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RWB', line: 'DF', role: 'RWB', pos: 'RWB' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'LW', line: 'AM', role: 'LW', pos: 'LW' },
                { id: 'RW', line: 'AM', role: 'RW', pos: 'RW' },
                { id: 'ST', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 11. 5-3-2
        '5-3-2': {
            name: '5-3-2',
            formationKey: '5-3-2',
            description: '5백(LWB-3CB-RWB)과 중원 3인(CDM-CM-CM), 정밀 역습 투톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LWB', line: 'DF', role: 'LWB', pos: 'LWB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB3', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RWB', line: 'DF', role: 'RWB', pos: 'RWB' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'CM1', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'CM2', line: 'CM', role: 'CM', pos: 'CM' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        },

        // 12. 4-1-2-1-2 (다이아몬드)
        '4-1-2-1-2': {
            name: '4-1-2-1-2',
            formationKey: '4-1-2-1-2',
            description: '포백 위의 다이아몬드 미드(CDM-LM-RM-CAM)와 투톱',
            slots: [
                { id: 'GK', line: 'GK', role: 'GK', pos: 'GK' },
                { id: 'LB', line: 'DF', role: 'LB', pos: 'LB' },
                { id: 'CB1', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'CB2', line: 'DF', role: 'CB', pos: 'CB' },
                { id: 'RB', line: 'DF', role: 'RB', pos: 'RB' },
                { id: 'CDM', line: 'DM', role: 'CDM', pos: 'CDM' },
                { id: 'LM', line: 'CM', role: 'LM', pos: 'LM' },
                { id: 'RM', line: 'CM', role: 'RM', pos: 'RM' },
                { id: 'CAM', line: 'AM', role: 'CAM', pos: 'CAM' },
                { id: 'ST1', line: 'TOP', role: 'ST', pos: 'ST' },
                { id: 'ST2', line: 'TOP', role: 'ST', pos: 'ST' }
            ]
        }
    },

    // 엄격한 포지션 적합도 채점기 (오버롤 만능주의 철저 배제, 주 포지션 전문성 최우선)
    matchPlayerToRoleStrict(p, role) {
        if (!p) return -9999;
        const dp = (p.detailPosition || '').toUpperCase();
        const others = Array.isArray(p.otherPositions) ? p.otherPositions.map(x => (x || '').toUpperCase()) : [];
        const base = (p.position || '').toUpperCase();

        // 1. 골키퍼 (GK)
        if (role === 'GK') {
            if (dp === 'GK' || base === 'GK') return p.rating;
            return -9999;
        }
        if (dp === 'GK' || base === 'GK') return -9999;

        // 2. 좌측 풀백 (LB) - 전문 LB 최우선
        if (role === 'LB') {
            if (dp === 'LB') return p.rating + 3.0; // 주 포지션 전문성 우대
            if (others.includes('LB')) return p.rating - 1.0;
            if (dp === 'LWB') return p.rating - 1.2;
            if (others.includes('LWB')) return p.rating - 2.5;
            if (base === 'DF') return p.rating - 8.0; // 전문 풀백 부재 시 수비수 긴급 배치
            return -9999;
        }

        // 3. 우측 풀백 (RB) - 전문 RB 최우선
        if (role === 'RB') {
            if (dp === 'RB') return p.rating + 3.0;
            if (others.includes('RB')) return p.rating - 1.0;
            if (dp === 'RWB') return p.rating - 1.2;
            if (others.includes('RWB')) return p.rating - 2.5;
            if (base === 'DF') return p.rating - 8.0;
            return -9999;
        }

        // 4. 센터백 (CB) - 전문 CB 최우선
        if (role === 'CB') {
            if (dp === 'CB' || dp === 'SW') return p.rating + 3.0;
            if (others.includes('CB') || others.includes('SW')) return p.rating - 1.0;
            if (base === 'DF') return p.rating - 6.0;
            return -9999;
        }

        // 5. 좌측 윙백 (LWB) - 전문 LWB 또는 공격적 LB
        if (role === 'LWB') {
            if (dp === 'LWB') return p.rating + 3.0;
            if (others.includes('LWB')) return p.rating - 0.5;
            if (dp === 'LB') return p.rating - 0.8;
            if (others.includes('LB')) return p.rating - 1.5;
            if (base === 'DF') return p.rating - 8.0;
            return -9999;
        }

        // 6. 우측 윙백 (RWB) - 전문 RWB 또는 공격적 RB
        if (role === 'RWB') {
            if (dp === 'RWB') return p.rating + 3.0;
            if (others.includes('RWB')) return p.rating - 0.5;
            if (dp === 'RB') return p.rating - 0.8;
            if (others.includes('RB')) return p.rating - 1.5;
            if (base === 'DF') return p.rating - 8.0;
            return -9999;
        }

        // 7. 수비형 미드필더 (CDM) - 전문 CDM 최우선
        if (role === 'CDM') {
            if (dp === 'CDM' || dp === 'DM') return p.rating + 3.0;
            if (others.includes('CDM') || others.includes('DM')) return p.rating - 1.0;
            if (dp === 'CM') return p.rating - 3.0;
            if (base === 'MF') return p.rating - 6.0;
            return -9999;
        }

        // 8. 중앙 미드필더 (CM) - 전문 CM 최우선
        if (role === 'CM') {
            if (dp === 'CM') return p.rating + 3.0;
            if (others.includes('CM')) return p.rating - 1.0;
            if (dp === 'CDM' || others.includes('CDM')) return p.rating - 2.5;
            if (dp === 'CAM' || others.includes('CAM')) return p.rating - 2.5;
            if (base === 'MF') return p.rating - 6.0;
            return -9999;
        }

        // 9. 공격형 미드필더 (CAM) - 전문 CAM 최우선
        if (role === 'CAM') {
            if (dp === 'CAM' || dp === 'AM') return p.rating + 3.0;
            if (others.includes('CAM') || others.includes('AM')) return p.rating - 1.0;
            if (dp === 'CM' || others.includes('CM')) return p.rating - 2.5;
            if (dp === 'CF' || others.includes('CF')) return p.rating - 2.5;
            if (base === 'MF') return p.rating - 6.0;
            return -9999;
        }

        // 10. 좌측 미드필더 (LM) - 전문 LM 또는 윙어
        if (role === 'LM') {
            if (dp === 'LM') return p.rating + 3.0;
            if (others.includes('LM')) return p.rating - 0.8;
            if (dp === 'LW' || others.includes('LW')) return p.rating - 1.2;
            if (base === 'MF') return p.rating - 6.0;
            return -9999;
        }

        // 11. 우측 미드필더 (RM) - 전문 RM 또는 윙어
        if (role === 'RM') {
            if (dp === 'RM') return p.rating + 3.0;
            if (others.includes('RM')) return p.rating - 0.8;
            if (dp === 'RW' || others.includes('RW')) return p.rating - 1.2;
            if (base === 'MF') return p.rating - 6.0;
            return -9999;
        }

        // 12. 좌측 윙어 (LW) - 전문 LW 최우선
        if (role === 'LW') {
            if (dp === 'LW') return p.rating + 3.0;
            if (others.includes('LW')) return p.rating - 0.8;
            if (dp === 'LM' || others.includes('LM')) return p.rating - 1.5;
            if (base === 'FW') return p.rating - 6.0;
            return -9999;
        }

        // 13. 우측 윙어 (RW) - 전문 RW 최우선
        if (role === 'RW') {
            if (dp === 'RW') return p.rating + 3.0;
            if (others.includes('RW')) return p.rating - 0.8;
            if (dp === 'RM' || others.includes('RM')) return p.rating - 1.5;
            if (base === 'FW') return p.rating - 6.0;
            return -9999;
        }

        // 14. 중앙 공격수 (ST) - 전문 ST/CF 최우선
        if (role === 'ST') {
            if (dp === 'ST' || dp === 'CF') return p.rating + 3.0;
            if (others.includes('ST') || others.includes('CF')) return p.rating - 0.8;
            if (base === 'FW') return p.rating - 6.0;
            return -9999;
        }

        return -9999;
    },

    // 이전 API 호환
    scorePlayerForSlot(p, slot) {
        return this.matchPlayerToRoleStrict(p, slot.role || slot.pos);
    },

    // 특정 템플릿에 대해 구단 선수단 최적 11 선발 및 점수 계산 (희소 전문 포지션 우선 선발 알고리즘)
    evaluateFormation(teamPlayers, template) {
        const slots = template.slots;
        const assigned = new Set();
        const chosen = [];
        let totalScore = 0;
        let rawRatingSum = 0;

        // 슬롯 배치 우선순위: 풀백/윙백, 스트라이커, 윙어 등 희소 전문 포지션 먼저 선발!
        const slotPriority = {
            GK: 1,
            LB: 2, RB: 2, LWB: 2, RWB: 2,
            ST: 3,
            LW: 4, RW: 4,
            LM: 5, RM: 5,
            CDM: 6, CAM: 6,
            CB: 7, CM: 8
        };

        const sortedSlots = [...slots].sort((a, b) => {
            const roleA = a.role || a.pos;
            const roleB = b.role || b.pos;
            return (slotPriority[roleA] || 10) - (slotPriority[roleB] || 10);
        });

        for (const slot of sortedSlots) {
            let bestP = null;
            let bestScore = -9999;
            const role = slot.role || slot.pos;

            for (const p of teamPlayers) {
                if (assigned.has(p.name)) continue;
                const score = this.matchPlayerToRoleStrict(p, role);
                if (score > bestScore) {
                    bestScore = score;
                    bestP = p;
                }
            }

            // 해당 자리에 출전할 자격을 갖춘 선수가 없으면 이 포메이션은 부적합 탈락
            if (bestP && bestScore > 0) {
                assigned.add(bestP.name);
                chosen.push({ slot, player: bestP, score: bestScore });
                totalScore += bestScore;
                rawRatingSum += bestP.rating;
            } else {
                return null;
            }
        }

        // 5선 라인 데이터 구성 (슬롯 원래 정의 순서대로 유지)
        const squadLines = { TOP: [], AM: [], CM: [], DM: [], DF: [], GK: [] };
        slots.forEach(slot => {
            const item = chosen.find(c => c.slot.id === slot.id);
            if (item) {
                squadLines[slot.line].push(item.player);
            }
        });

        // 레거시 squad 동기화
        const squad = {
            gk: squadLines.GK[0] || null,
            df: [...squadLines.DF],
            mf: [...squadLines.DM, ...squadLines.CM],
            fw: [...squadLines.TOP]
        };
        squadLines.AM.forEach(p => {
            const dp = (p.detailPosition || p.position || '').toUpperCase();
            if (['LW', 'RW'].includes(dp)) squad.fw.push(p);
            else squad.mf.push(p);
        });

        const best11 = slots.map(slot => chosen.find(c => c.slot.id === slot.id).player);

        return {
            formation: template.formationKey || template.name,
            formationName: template.name,
            description: template.description,
            totalScore,
            averageRating: rawRatingSum / 11,
            best11,
            squadLines,
            squad
        };
    },

    // 구단의 선수단을 분석하여 가장 높은 전력을 발휘하는 '최적의 포메이션' 계산
    calculateBestFormation(teamKey) {
        const teamPlayers = (typeof teams !== 'undefined' && teams[teamKey]) ||
            (typeof allTeams !== 'undefined' && allTeams[teamKey] && allTeams[teamKey].players);

        if (!teamPlayers || !Array.isArray(teamPlayers) || teamPlayers.length === 0) {
            return null;
        }

        let bestResult = null;

        for (const k in this.FORMATION_TEMPLATES) {
            const result = this.evaluateFormation(teamPlayers, this.FORMATION_TEMPLATES[k]);
            if (result && (!bestResult || result.totalScore > bestResult.totalScore)) {
                bestResult = result;
            }
        }

        // 혹시 모든 템플릿 검증이 실패한 경우의 안전 기본값
        if (!bestResult) {
            const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
            const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
            const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
            const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);

            const b11 = [
                gks[0] || null,
                ...dfs.slice(0, 4),
                ...mfs.slice(0, 3),
                ...fws.slice(0, 3)
            ].filter(Boolean);

            bestResult = {
                formation: '4-3-3',
                formationName: '4-3-3 (플랫)',
                description: '기본 밸런스 포메이션',
                best11: b11,
                squadLines: {
                    TOP: fws.slice(0, 1),
                    AM: fws.slice(1, 3),
                    CM: mfs.slice(1, 3),
                    DM: mfs.slice(0, 1),
                    DF: dfs.slice(0, 4),
                    GK: gks.slice(0, 1)
                },
                squad: {
                    gk: gks[0] || null,
                    df: dfs.slice(0, 4),
                    mf: mfs.slice(0, 3),
                    fw: fws.slice(0, 3)
                },
                totalScore: b11.reduce((sum, p) => sum + p.rating, 0),
                averageRating: b11.length ? b11.reduce((sum, p) => sum + p.rating, 0) / b11.length : 70
            };
        }

        return bestResult;
    },
    // 게임 시작 시 모든 AI 팀의 최적 포메이션을 미리 일괄 계산하여 저장
    initializeAllAIFormations(force = false) {
        if (typeof gameData === 'undefined' || !gameData) return;
        if (!gameData.aiFormations) gameData.aiFormations = {};

        const teamSource = (typeof teams !== 'undefined') ? teams : (typeof allTeams !== 'undefined' ? allTeams : {});
        const teamKeys = Object.keys(teamSource);

        console.log(`[TeamUtils] 전체 AI 팀(${teamKeys.length}개)의 최적 포메이션 계산 시작...`);

        let count = 0;
        teamKeys.forEach(tKey => {
            // 이미 계산되어 있고 강제 갱신이 아니면 유지
            if (!force && gameData.aiFormations[tKey]) return;

            const best = this.calculateBestFormation(tKey);
            if (best) {
                gameData.aiFormations[tKey] = best;
                count++;
            }
        });

        console.log(`[TeamUtils] 총 ${count}개 AI 팀의 최적 포메이션 설정 완료`);
    },

    // AI 팀의 최적 스쿼드 데이터 조회 (squad + squadLines + formation 포함)
    getOptimalSquadData(teamKey) {
        if (!teamKey) return null;

        // 유저 팀인 경우 gameData.squad 반환
        if (typeof gameData !== 'undefined' && gameData && teamKey === gameData.selectedTeam) {
            return {
                ...gameData.squad,
                squadLines: gameData.squadLines,
                formation: '유저 포메이션'
            };
        }

        // 캐시된 AI 최적 포메이션 확인
        if (typeof gameData !== 'undefined' && gameData && gameData.aiFormations && gameData.aiFormations[teamKey]) {
            const data = gameData.aiFormations[teamKey];
            return {
                gk: data.squad.gk,
                df: data.squad.df,
                mf: data.squad.mf,
                fw: data.squad.fw,
                squadLines: data.squadLines,
                formation: data.formation,
                formationName: data.formationName,
                description: data.description
            };
        }

        // 없으면 즉석 계산
        const calculated = this.calculateBestFormation(teamKey);
        if (typeof gameData !== 'undefined' && gameData) {
            if (!gameData.aiFormations) gameData.aiFormations = {};
            gameData.aiFormations[teamKey] = calculated;
        }

        return calculated ? {
            gk: calculated.squad.gk,
            df: calculated.squad.df,
            mf: calculated.squad.mf,
            fw: calculated.squad.fw,
            squadLines: calculated.squadLines,
            formation: calculated.formation,
            formationName: calculated.formationName,
            description: calculated.description
        } : null;
    },

    // 1. 특정 팀의 베스트 11 선발 (최적 포메이션 기반 선발)
    getBestEleven(teamKey) {
        if (!teamKey) return [];

        // gameData에 미리 계산된 최적 포메이션이 있으면 즉시 반환
        if (typeof gameData !== 'undefined' && gameData && gameData.aiFormations && gameData.aiFormations[teamKey]) {
            return gameData.aiFormations[teamKey].best11;
        }

        const calculated = TeamUtils.calculateBestFormation(teamKey);
        if (typeof gameData !== 'undefined' && gameData) {
            if (!gameData.aiFormations) gameData.aiFormations = {};
            gameData.aiFormations[teamKey] = calculated;
        }

        return calculated ? calculated.best11 : [];
    },

    // 선수가 해당 팀의 베스트 11에 포함되는지 확인 (핵심 선수 판별용)
    isPlayerInBest11(teamKey, playerName) {
        if (!teamKey || teamKey === '외부리그') return false;
        const best11 = this.getBestEleven(teamKey);
        return best11.some(p => p && p.name === playerName);
    },

    // 2. 선수 목록 또는 스쿼드 객체의 평균 능력치 계산
    calculateRating(playersOrSquad) {
        let players = [];
        if (Array.isArray(playersOrSquad)) {
            players = playersOrSquad.filter(p => p);
        } else if (playersOrSquad && typeof playersOrSquad === 'object') {
            const s = playersOrSquad;
            if (s.gk) players.push(s.gk);
            if (s.df) players.push(...s.df.filter(p => p));
            if (s.mf) players.push(...s.mf.filter(p => p));
            if (s.fw) players.push(...s.fw.filter(p => p));
        }

        if (players.length === 0) return 0;
        const totalRating = players.reduce((sum, p) => sum + p.rating, 0);
        return totalRating / players.length;
    },

    // 3. 두 팀간의 전력 차이 분석
    getStrengthDifference(userRating, opponentRating) {
        const difference = userRating - opponentRating;
        return {
            userRating,
            opponentRating,
            difference,
            strengthGap: Math.abs(difference),
            userAdvantage: difference > 0
        };
    },

    // 4. 선수가 특정 스쿼드에 포함되어 있는지 확인
    isPlayerInSquad(player, squad) {
        if (!player || !squad) return false;
        if (squad.gk && squad.gk.name === player.name) return true;

        const fieldPositions = ['df', 'mf', 'fw'];
        for (const pos of fieldPositions) {
            if (squad[pos] && squad[pos].some(p => p && p.name === player.name)) {
                return true;
            }
        }
        return false;
    }
};

// 하위 호환성을 위해 전역 변수로 노출
window.TeamUtils = TeamUtils;

// 선수 페이스 사진 설정 헬퍼
function setPlayerPhoto(img, player) {
    if (!img) return;
    const name = typeof player === 'string' ? player : (player ? player.name : '');
    let id = player && (player.playerid || player.playerId || player.id);

    if (!id && name && typeof allTeams !== 'undefined') {
        for (const t in allTeams) {
            const found = (allTeams[t].players || []).find(x => x.name === name);
            if (found && (found.playerid || found.id)) {
                id = found.playerid || found.id;
                break;
            }
        }
    }

    const useId = !(typeof gameData !== 'undefined' && gameData.settings && gameData.settings.useIdFacepack === false);

    const candidates = [];
    if (useId && id) {
        const pid = 'p' + String(id).replace(/^p/i, '');
        candidates.push(`assets/players/${pid}.png`, `assets/players/${pid}.webp`);
    }
    if (name) {
        candidates.push(`assets/players/${name}.webp`);
    }
    candidates.push('assets/players/default.webp');

    let idx = 0;
    img.onerror = function () {
        idx++;
        if (idx < candidates.length) {
            this.src = candidates[idx];
        } else {
            this.onerror = null;
            this.src = 'assets/players/default.webp';
        }
    };
    img.src = candidates[0];
}

window.setPlayerPhoto = setPlayerPhoto;
TeamUtils.setPlayerPhoto = setPlayerPhoto;

window.calculateTeamRating = (playersOrSquad) => {
    if (typeof playersOrSquad === 'string') {
        return TeamUtils.calculateRating(TeamUtils.getBestEleven(playersOrSquad));
    }
    if (playersOrSquad !== undefined) {
        return TeamUtils.calculateRating(playersOrSquad);
    }
    if (typeof gameData !== 'undefined' && gameData.squad) {
        return TeamUtils.calculateRating(gameData.squad);
    }
    return 0;
};

window.getBestEleven = TeamUtils.getBestEleven.bind(TeamUtils);
window.calculateUserTeamRating = () => TeamUtils.calculateRating(gameData.squad);
window.calculateOpponentTeamRating = (teamKey) => TeamUtils.calculateRating(TeamUtils.getBestEleven(teamKey));
window.isPlayerInSquad = (player) => TeamUtils.isPlayerInSquad(player, gameData.squad);
window.calculateTeamStrengthDifference = () => TeamUtils.getStrengthDifference(window.calculateUserTeamRating(), window.calculateOpponentTeamRating(gameData.currentOpponent));
