// playerGrowth.js
// 선수 성장 시스템 구현 (12개월 기준 성장)

class PlayerGrowthSystem {
    constructor() {
        this.growthData = new Map(); // 선수별 성장 데이터 저장
        // [수정] 고정 포텐셜 현실화 디플레이션 (오버롤 인플레 방지)
        this.fixedPotentials = {
            "오현규": 82,
            "김민수": 85,
            "배준호": 84,
            "앙제요안 보니": 82,
            "조반니 레오니": 86,
            "트레이 뇨니": 81,
            "프란치스코 카마르다": 86,
            "옌스 카스트로프": 84,
            "조브 벨링엄": 85,
            "제라르 마르틴": 80,
            "마르크 베르날": 81,
            "루니 바르다그지": 79,
            "파우 쿠바르시": 87,
            "엔드릭": 86,
            "리코 루이스": 80,
            "코비 마이누": 84,
            "아론 바우만": 85,
            "조르티 모키오": 80,
            "부바 상가레": 84,
            "루카 부슈코비치": 87,
            "에단 은와네리": 82,
            "조시 아체암퐁": 82,
            "맥스 다우먼": 87,
            "리오 응구모하": 85,
            "레나르트 칼": 88,
            "배승균": 85,
            "카를로스 에스피": 86,
            "크리스티아누 호날두 JR": 88,
            "윤도영": 81,
            "강상윤": 79,
            "디스 얀서": 83,
            "켄드리 파에스": 84,
            "아산 우에드라오고": 85,
            "백인우": 81,
            "대릴 바콜라": 81,
            "파트리크 도르구": 85,
            "파쿤도 부오나오테": 82,
            "미카 고츠": 82,
            "양민혁": 87,
            "마이키 무어": 87,
            "다비데 바르테사기": 82,
            "루카 윌리엄스-바넷": 87,
            "드로": 84,
        };
    }

    // 게임 시작 시 25세 이하 선수들에게 성장 가능성 부여
    initializePlayerGrowth() {
        if (!gameData.selectedTeam) return;

        const teamPlayers = teams[gameData.selectedTeam];

        teamPlayers.forEach(player => {
            // [수정] 25세 미만만 성장 (25세 이상은 성장 안함)
            if (player.age < 25 && !this.growthData.has(player.name)) {
                const growthPotential = this.calculateGrowthPotential(player);

                // [수정] 포텐셜에 따라 성장 기간을 최소 1시즌(12턴=36경기) ~ 최대 5시즌(60턴=180경기)으로 설정
                const growthMonths = this._calculateGrowthMonths(growthPotential);
                const monthlyGrowth = growthPotential / growthMonths;

                this.growthData.set(player.name, {
                    currentRating: Math.round(player.rating),
                    maxGrowth: growthPotential,
                    remainingGrowth: growthPotential,
                    monthlyGrowth: monthlyGrowth,
                    growthMonths: growthMonths,
                    lastGrowthCheck: Date.now(),
                    history: [{ match: 0, rating: Math.round(player.rating * 10) / 10 }]
                });

                console.log(`${player.name}: 성장 가능성 ${growthPotential}, 성장 기간 ${growthMonths}개월, 월별 성장 ${monthlyGrowth.toFixed(2)}`);
            }
        });
    }

    /** 성장 가능성에 따른 성장 기간 계산 (1시즌=12턴 기준, 최소 1시즌 ~ 최대 5시즌) */
    _calculateGrowthMonths(growthPotential) {
        return Math.max(12, Math.min(60, Math.round(growthPotential * 2)));
    }

    // [신규] 구단 최첨단 훈련 시설 보유 여부 확인 (스타디움 시스템 연동)
    hasAdvancedTrainingFacility(teamKey = null) {
        const isUserTeam = !teamKey || (gameData && gameData.selectedTeam === teamKey);
        if (isUserTeam) {
            const stadium = (gameData && gameData.stadiumInfo) || 
                            (typeof window !== 'undefined' && window.stadiumSystem && window.stadiumSystem.getUserStadium());
            return !!(stadium && stadium.upgrades && stadium.upgrades.trainingCenter);
        }
        // AI 상위 명문 빅클럽은 훈련 시설 보유로 판정
        const eliteAI = ['레알_마드리드', '맨체스터_시티', '바이에른_뮌헨', '파리_생제르맹', '바르셀로나'];
        return eliteAI.includes(teamKey);
    }

    // 성장 가능성 계산 (출전 시간과 훈련 시설에 따라 풀포텐 해금)
    calculateGrowthPotential(player, teamKey = null) {
        // [수정] this.fixedPotentials 사용
        if (this.fixedPotentials.hasOwnProperty(player.name)) {
            const targetRating = this.fixedPotentials[player.name];
            const maxGrowth = Math.max(0, targetRating - Math.round(player.rating));
            console.log(`[Growth] ${player.name}: 고정 포텐셜 적용 (목표: ${targetRating}, 필요 성장: ${maxGrowth})`);
            return maxGrowth;
        }

        // [신규] 유스 스카우트 4단계 포텐셜 적용
        if (player.maxPotential) {
            const maxGrowth = Math.max(0, player.maxPotential - Math.round(player.rating));
            console.log(`[Growth] ${player.name}: 유스 포텐셜 적용 (등급: ${player.potentialName || player.potentialTier}, 목표: ${player.maxPotential}, 필요 성장: ${maxGrowth})`);
            return maxGrowth;
        }

        // [밸런스 수정] 기본 성장 폭
        const baseGrowth = 2 + Math.random() * 5;

        // 나이에 따른 보정
        let ageModifier = 1;
        if (player.age <= 18) {
            ageModifier = 1.3;
        } else if (player.age <= 21) {
            ageModifier = 1.1;
        } else if (player.age <= 23) {
            ageModifier = 1.0;
        } else if (player.age <= 25) {
            ageModifier = 0.8;
        }

        // 현재 능력치에 따른 보정
        let ratingModifier = 1;
        const currentRating = Math.round(player.rating);
        if (currentRating < 70) {
            ratingModifier = 1.7;
        } else if (currentRating < 80) {
            ratingModifier = 1.4;
        } else if (currentRating >= 88) {
            // [밸런스 수정] 88 이상부터는 성장 속도 급감 (95 도달 어렵게)
            ratingModifier = 0.3;
            // 단, 21세 이하의 초신성(Wonderkid)은 페널티를 완화하여 95 도달 가능성을 열어줌
            if (player.age <= 21) {
                ratingModifier = 0.6; // 초신성 보너스 (성장 둔화 완화)
            } else {
                ratingModifier = 0.3; // 일반적인 고능력자는 성장 거의 멈춤
            }
        } else if (currentRating >= 85) {
            ratingModifier = 0.5;
        }

        // 세륜중학교 특별 보너스
        let teamModifier = 1;
        if (gameData.selectedTeam === 'seryu3') {
            teamModifier = 1.5 + Math.random() * 1.0; // 1.5 ~ 2.5배
            console.log(`세륜중학교 ${player.name}에게 특별 성장 보너스 적용: x${teamModifier.toFixed(2)}`);
        }

        // 아이콘 선수 특별 보너스
        if (player.isIcon) {
            teamModifier = 1.5;
            console.log(`[Growth] 아이콘 ${player.name}에게 전설적인 성장 보너스 적용`);
        }

        // 커스텀 선수 특별 보너스
        if (player.isCustom) {
            teamModifier = 2;
            console.log(`[Growth] 커스텀 ${player.name}에게 한계 돌파 성장 보너스 적용`);
        }

        // [신규] 20세 이하 & 오버롤 75 이하 유망주 특별 보너스
        let wonderkidBonus = 1.0;
        if (player.age <= 20 && currentRating <= 75) {
            wonderkidBonus = 1.5; // 성장 잠재력 50% 추가 부여
        }

        let finalGrowth = Math.round(baseGrowth * ageModifier * ratingModifier * teamModifier * wonderkidBonus);

        // 세륜중학교 선수들은 최소 성장 보장
        if (gameData.selectedTeam === 'seryu3') {
            finalGrowth = Math.max(finalGrowth, 15);
        }

        // 아이콘 선수는 최소 16 성장 보장
        if (player.isIcon) {
            finalGrowth = Math.max(finalGrowth, 16);
        }

        // 커스텀 선수는 105까지 크기 위해 충분한 잠재력 부여
        if (player.isCustom) {
            const gap = 98 - Math.round(player.rating);
            finalGrowth = Math.max(finalGrowth, gap + Math.floor(Math.random() * 5));
        }

        // [신규] 최종 포텐셜 상한선 체크 (일반 선수는 89를 넘기 힘들게)
        const projectedRating = currentRating + finalGrowth;
        const hardCap = player.isCustom || player.isIcon ? 98 : 89;

        if (projectedRating > hardCap) {
            return Math.max(0, hardCap - currentRating);
        }
        return Math.round(finalGrowth);
    }

    // 선수 성장 처리 (5경기 = 1개월마다 호출)
    processPlayerGrowth() {
        if (!gameData.selectedTeam) return;

        const teamPlayers = teams[gameData.selectedTeam];
        let growthOccurred = false;

        teamPlayers.forEach(player => {
            if (this.growthData.has(player.name)) {
                const growthInfo = this.growthData.get(player.name);

                if (this.shouldPlayerGrow(player, growthInfo)) {
                    const growthAmount = this.calculateGrowthAmount(player, growthInfo);

                    if (growthAmount > 0) {
                        this.applyGrowth(player, growthAmount, growthInfo);
                        growthOccurred = true;
                    }
                }
            }
        });

        if (growthOccurred) {
            this.updateSquadDisplay();
        }
    }

    // [수정] 성장 조건 확인 (3경기마다로 단축)
    shouldPlayerGrow(player, growthInfo) {
        if (growthInfo.remainingGrowth <= 0) {
            return false;
        }

        // 3경기마다 성장
        return gameData.matchesPlayed > 0 && gameData.matchesPlayed % 3 === 0;
    }

    _getPlayerMatchPerformanceBonus(playerName) {
        let bonus = 1.0;
        if (!window.recordsSys || !window.recordsSys.playerStats) return bonus;
        const s = window.recordsSys.playerStats.get(playerName);
        if (s) {
            const m = Math.max(1, s.matches || 1);
            bonus += (s.goals || 0) * 0.08 / m;
            bonus += (s.assists || 0) * 0.06 / m;
            bonus += (s.moms || 0) * 0.18;
            bonus += (s.totw || 0) * 0.08;
        }
        return Math.max(0.2, Math.min(2.0, bonus));
    }

    _getPlayerAppearanceFactor(player) {
        if (!gameData || !gameData.squad) return 1.0;
        const sq = gameData.squad;
        const first11 = [sq.gk, ...sq.df, ...sq.mf, ...sq.fw].filter(Boolean);
        const name = player.name;
        const isStarter = first11.some(p => p && p.name === name);
        if (isStarter) return 1.35; // 선발 출전 시 성장 35% 대폭 가속!
        const teamPlayers = teams[gameData.selectedTeam] || [];
        const isInTeam = teamPlayers.some(p => p.name === name);
        return isInTeam ? 0.70 : 0.15; // 벤치 후보 0.70x, 미소집 방치 0.15x (출전 없으면 정체)
    }

    // 성장량 계산 (출전 시간과 훈련 시설에 따라 풀포텐 해금)
    calculateGrowthAmount(player, growthInfo) {
        let growthAmount = growthInfo.monthlyGrowth;

        // [신규] 롱타임 모드일 경우 성장 속도 40% 감속
        if (gameData.gameMode === 'longtime') {
            growthAmount *= 0.6;
        }

        // [신규] 출장 여부 보정: 선발 1.35x / 후보 0.70x / 방출위기 0.15x
        growthAmount *= this._getPlayerAppearanceFactor(player);

        // [신규] 최첨단 훈련 시설 보너스: +30% 가속!
        const hasFacility = this.hasAdvancedTrainingFacility(gameData.selectedTeam);
        if (hasFacility) {
            growthAmount *= 1.30;
        } else if (growthInfo.maxGrowth > 0) {
            // 훈련시설 미보유 시 소프트 캡: 최대 잠재력의 70% 도달 후 성장 급격 둔화 (풀포텐 불가)
            const grown = growthInfo.maxGrowth - growthInfo.remainingGrowth;
            if ((grown / growthInfo.maxGrowth) >= 0.70) {
                growthAmount *= 0.20;
            }
        }

        // [신규] 경기 성적 보정: 득점/어시/MOM/TOTW 기반 ±~2x
        growthAmount *= this._getPlayerMatchPerformanceBonus(player.name);

        // [신규] 멘토링 보너스
        growthAmount *= this._getMentoringBonus(player);

        // 남은 성장량을 초과하지 않도록
        growthAmount = Math.min(growthAmount, growthInfo.remainingGrowth);

        return Math.max(0, growthAmount);
    }

    // 선수가 현재 스쿼드에 포함되어 있는지 확인
    isPlayerInSquad(player) {
        const squad = gameData.squad;

        if (squad.gk && squad.gk.name === player.name) return true;

        for (let df of squad.df) {
            if (df && df.name === player.name) return true;
        }

        for (let mf of squad.mf) {
            if (mf && mf.name === player.name) return true;
        }

        for (let fw of squad.fw) {
            if (fw && fw.name === player.name) return true;
        }

        return false;
    }

    // [수정] 성장 적용 (소수점 유지 + 성장 이력 기록)
    applyGrowth(player, growthAmount, growthInfo) {
        const oldRating = Math.floor(player.rating);

        const maxRating = player.isCustom ? 100 : (player.isIcon ? 99 : 95);
        player.rating = Math.min(maxRating, player.rating + growthAmount);

        const newRating = Math.floor(player.rating);

        growthInfo.remainingGrowth = Math.max(0, growthInfo.remainingGrowth - growthAmount);
        growthInfo.currentRating = newRating;
        growthInfo.lastGrowthCheck = Date.now();

        if (!growthInfo.history) growthInfo.history = [];
        growthInfo.history.push({
            match: gameData.matchesPlayed || 0,
            rating: Math.round(player.rating * 10) / 10
        });
        if (growthInfo.history.length > 40) growthInfo.history.shift();

        if (newRating > oldRating) {
            this.showGrowthNotification(player, oldRating, newRating);
        }

        this.growthData.set(player.name, growthInfo);

        if (growthInfo.remainingGrowth <= 0) {
            this.growthData.delete(player.name);
            console.log(`${player.name}의 성장이 완료되어 성장 데이터에서 제거되었습니다.`);
        }
    }

    // 성장 알림 표시
    showGrowthNotification(player, oldRating, newRating) {
        const growthAmount = newRating - oldRating;
        let message = `[성장 알림] ${player.name}의 능력치가 상승했습니다!\n${oldRating} → ${newRating} (+${growthAmount})`;

        setTimeout(() => {
            alert(message);
        }, 1000);

        console.log(message);
    }

    // 우리 팀 평균 오버롤 계산
    calculateTeamAverageRating() {
        if (!gameData.selectedTeam) return 75;

        const teamPlayers = teams[gameData.selectedTeam]; // Best 11 로직은 아님 (전체 평균)
        const totalRating = teamPlayers.reduce((sum, player) => sum + Math.round(player.rating), 0);
        return Math.round(totalRating / teamPlayers.length);
    }

    // [수정] AI 팀 성장 처리 (독립적 성장 시스템으로 변경)
    processAllTeamsGrowth() {
        // 5경기마다 성장 처리
        if (gameData.matchesPlayed % 5 !== 0) return;

        console.log("[Growth] AI 선수 성장 프로세스 시작...");

        // 유저 팀 평균 오버롤 계산 (비교용)
        const userTeamAvg = this.calculateTeamAverageRating();

        Object.keys(teams).forEach(teamKey => {
            if (teamKey !== gameData.selectedTeam) {
                const teamPlayers = teams[teamKey];

                // AI 팀 평균 오버롤 계산
                const aiTeamAvg = Math.round(teamPlayers.reduce((sum, p) => sum + p.rating, 0) / teamPlayers.length);

                // 밸런싱 계수 (유저 팀과의 격차에 따라 성장 속도 조절)
                let balanceFactor = 1.0;
                const diff = aiTeamAvg - userTeamAvg;

                // [수정] 5시즌 내 유저 최강팀 등극을 위한 밸런싱 (압도적 차이는 방지)
                if (diff > 2) {
                    balanceFactor = 0.4; // AI가 유저보다 강하면 성장 대폭 둔화 (유저 추격 지원)
                } else if (diff < -6) {
                    balanceFactor = 1.3; // 격차가 너무 벌어지면(6 이상) AI 부스트 (압도적 차이 방지)
                } else if (diff < 0) {
                    balanceFactor = 0.9; // 유저가 우위일 때는 AI 성장 소폭 둔화 (유저 우위 유지)
                }

                teamPlayers.forEach(player => {
                    const age = parseInt(player.age); // [수정] 나이 확실하게 숫자 변환

                    // [수정] 25세 미만 선수만 성장 (25세 이상은 성장 안함)
                    if (age < 25) {
                        // [신규] 고정 포텐셜 체크 (AI)
                        if (this.fixedPotentials.hasOwnProperty(player.name)) {
                            const targetRating = this.fixedPotentials[player.name];
                            if (player.rating >= targetRating) return; // 목표치 도달 시 성장 중단
                        }

                        // 기본 성장치 (5경기당 0.15 ~ 0.35로 감속하여 인플레 억제)
                        let growthAmount = 0.15 + Math.random() * 0.2;

                        // 1. 나이 보정 (어릴수록 빠름)
                        if (player.age <= 20) growthAmount *= 1.3;
                        else if (player.age <= 23) growthAmount *= 1.1;

                        // 2. 현재 능력치 보정 (낮을수록 빨리 큼 - 캐치업)
                        if (player.rating < 70) growthAmount *= 1.2;
                        else if (player.rating >= 85) growthAmount *= 0.3; // 85 이상은 성장 급감

                        // 3. 밸런싱 계수 적용 (신규)
                        growthAmount *= balanceFactor;

                        // AI 프레스티지 선수 보너스
                        const isPrestigePlayer = gameData.aiPrestige && gameData.aiPrestige[teamKey] && gameData.aiPrestige[teamKey].includes(player.name);

                        if (isPrestigePlayer) {
                            growthAmount += 0.3; // 프레스티지 추가 보너스
                        }

                        // 소수점 1자리까지 허용
                        growthAmount = Math.round(growthAmount * 10) / 10;

                        // AI 선수 성장 적용 (일반 선수는 최대 88로 캡, 15%만 풀포텐 도달)
                        const oldRating = player.rating;
                        const theoreticalCap = this.fixedPotentials.hasOwnProperty(player.name) ? this.fixedPotentials[player.name] : 88;
                        const playerRealizedCap = player._realizedCap || (player._realizedCap = (Math.random() < 0.15 ? theoreticalCap : Math.max(70, theoreticalCap - 2 - Math.floor(Math.random() * 4))));
                        const maxCap = Math.min(88, playerRealizedCap);
                        const newRating = Math.min(maxCap, player.rating + growthAmount);
                        player.rating = Math.round(newRating * 10) / 10; // 소수점 1자리

                        // 로그 출력 (성장폭이 0.5 이상일 때만)
                        if (growthAmount >= 0.5) {
                            console.log(`[Growth] ${player.name} (${teamNames[teamKey] || teamKey}): ${oldRating.toFixed(1)} -> ${player.rating.toFixed(1)} (+${growthAmount}) [밸런스: x${balanceFactor}]`);
                        }
                    }
                });
            }
        });
    }

    // 시즌 종료 시 나이 증가 및 32세 이상 노화(에이징 커브) 적용
    advancePlayerAges() {
        const recordsSys = window.leagueBasedRecordsSystem || window.recordsSystem;
        const agingReport = [];

        Object.keys(teams).forEach(teamKey => {
            const isUserTeam = (gameData && gameData.selectedTeam === teamKey);
            teams[teamKey].forEach(player => {
                player.age++;

                // 1. 26세 이상이 되면 성장 데이터 제거
                if (this.growthData.has(player.name) && player.age > 25) {
                    this.growthData.delete(player.name);
                }

                // 2. [신규] 출전 시간 & 훈련 시설에 따른 성장 지속 vs 정체 (Plateau 판정)
                if (this.growthData.has(player.name)) {
                    const stats = (recordsSys && recordsSys.playerStats) ? recordsSys.playerStats.get(player.name) : null;
                    const matchCount = (stats && stats.ratingCount) ? stats.ratingCount : 0;
                    const hasFacility = this.hasAdvancedTrainingFacility(teamKey);

                    let shouldStagnate = false;
                    let stagnateReason = "";

                    // [조건 1] 완벽한 육성 환경: 시즌 10경기 이상 출전 + 최첨단 훈련 시설 보유
                    // -> 풀포텐 보장! 절대 조기 정체 없음!
                    if (matchCount >= 10 && hasFacility) {
                        shouldStagnate = false;
                    }
                    // [조건 2] 벤치 방치: 21세 이상인데 시즌 4경기 미만 출전 시 75% 확률로 성장 조기 중단!
                    else if (player.age >= 21 && matchCount < 4 && Math.random() < 0.75) {
                        shouldStagnate = true;
                        stagnateReason = "출전 시간 부족(벤치 방치)으로 인한 성장 조기 정체";
                    }
                    // [조건 3] 훈련 시설 미보유: 훈련소 한계로 22세 이상에서 50% 확률로 성장 한계 봉착!
                    else if (player.age >= 22 && !hasFacility && Math.random() < 0.50) {
                        shouldStagnate = true;
                        stagnateReason = "구단 훈련 시설 한계로 인한 성장 마감 (최첨단 훈련 아카데미 필요)";
                    }
                    // [조건 4] 출전 부족 & 훈련시설 미보유 복합: 85% 확률로 성장 실패
                    else if (player.age >= 21 && matchCount < 8 && !hasFacility && Math.random() < 0.85) {
                        shouldStagnate = true;
                        stagnateReason = "출전 기회 결핍 및 훈련 인프라 한계로 인한 성장 마감";
                    }

                    if (shouldStagnate) {
                        this.growthData.delete(player.name);
                        console.log(`[Growth] ${player.name} (${player.age}세): ${stagnateReason} (최종 OVR: ${Math.floor(player.rating)})`);
                    }
                }

                // 3. 32세부터 노화 (Aging Curve)
                if (player.age >= 32) {
                    const stats = (recordsSys && recordsSys.playerStats) ? recordsSys.playerStats.get(player.name) : null;
                    const hasStats = stats && stats.ratingCount && stats.ratingCount >= 5;
                    const avgRating = hasStats ? (stats.ratingSum / stats.ratingCount) : null;

                    let decline = 0;
                    let reason = "";

                    if (hasStats && avgRating >= 7.3) {
                        // [폼 방어] 시즌 평점 7.3 이상 월클급 맹활약!
                        if (player.age >= 36) {
                            decline = 0.5; // 36세 이상은 최소한의 세월 감쇠만
                            reason = `평점 ${avgRating.toFixed(2)} 맹활약으로 노쇠화 최소 방어 (-0.5)`;
                        } else {
                            decline = 0; // 32~35세는 완전 방어!
                            reason = `평점 ${avgRating.toFixed(2)} 맹활약으로 에이징 커브 완전 방어 (유지!)`;
                        }
                    } else if (hasStats && avgRating >= 6.8) {
                        // [평범한 주전] -1점 자연 감쇠
                        decline = (player.age >= 35) ? 1.5 : 1.0;
                        reason = `평점 ${avgRating.toFixed(2)} 주전 활약, 자연 노쇠화 (-${decline})`;
                    } else {
                        // [벤치 방치 or 부진] 출전 부족/부진으로 인한 노쇠화 직격탄 (-2 ~ -3)
                        decline = (player.age >= 35) ? 3.0 : 2.0;
                        const ratingTxt = hasStats ? `평점 ${avgRating.toFixed(2)} 부진` : '출전 기회 부족';
                        reason = `${ratingTxt}으로 노쇠화 직격탄 (-${decline})`;
                    }

                    if (decline > 0) {
                        const oldRating = Math.round(player.rating * 10) / 10;
                        player.rating = Math.max(50, Math.round((player.rating - decline) * 10) / 10);
                        if (isUserTeam) {
                            agingReport.push({
                                name: player.name,
                                age: player.age,
                                oldRating: oldRating,
                                newRating: player.rating,
                                decline: decline,
                                reason: reason
                            });
                        }
                    } else if (isUserTeam) {
                        agingReport.push({
                            name: player.name,
                            age: player.age,
                            oldRating: player.rating,
                            newRating: player.rating,
                            decline: 0,
                            reason: reason
                        });
                    }
                }
            });
        });

        // 유저 팀 에이징 커브 리포트 메일 발송
        if (agingReport.length > 0 && typeof mailManager !== 'undefined') {
            const reportLines = agingReport.map(r => {
                if (r.decline === 0) {
                    return `✨ ${r.name} (${r.age}세): OVR ${r.newRating} [유지] - ${r.reason}`;
                } else {
                    return `📉 ${r.name} (${r.age}세): OVR ${r.oldRating} → ${r.newRating} (-${r.decline}) - ${r.reason}`;
                }
            }).join('\n');

            mailManager.addMail(
                `[시즌 결산] 32세 이상 베테랑 에이징 커브 분석 보고서`,
                '구단 피지컬 코칭스태프',
                `감독님, 이번 시즌 종료에 따른 32세 이상 베테랑 선수단의 신체 능력 및 폼 분석 리포트입니다.\n\n` +
                `선수의 현 폼(시즌 평균 평점)에 따라 에이징 커브 방어 여부가 결정되었습니다.\n\n` +
                `${reportLines}\n\n` +
                `고령 선수의 급격한 기량 저하를 방지하려면 꾸준한 경기 출전과 높은 경기 평점 관리가 필수적입니다.`
            );
        }

        // 라인별 OVR 및 전술 DNA 재계산
        if (typeof DNAManager !== 'undefined') {
            DNAManager.recalculateLineOVRs();
        }

        console.log(`[Growth] 시즌 종료 후 남은 성장 중인 선수: ${this.growthData.size}명 (32세 이상 노화 적용 완료)`);
    }

    // 스쿼드 화면 업데이트
    updateSquadDisplay() {
        if (document.getElementById('squad').classList.contains('active')) {
            displayTeamPlayers();
            updateFormationDisplay();
        }
    }

    // 유스 콜업 시 성장 가능성 부여
    grantPotentialToPlayer(player) {
        if (player.age < 25 && !this.growthData.has(player.name)) {
            let growthPotential = this.calculateGrowthPotential(player);

            // [수정] 콜업 보너스 제거 (실현율로 산출된 잠재력 그대로 적용)
            const callUpBonus = 0;
            growthPotential += callUpBonus;

            // [수정] 포텐셜에 따라 성장 기간을 최소 1시즌(12턴=36경기) ~ 최대 5시즌(60턴=180경기)으로 설정
            const growthMonths = this._calculateGrowthMonths(growthPotential);
            const monthlyGrowth = growthPotential / growthMonths;

            this.growthData.set(player.name, {
                currentRating: Math.round(player.rating),
                maxGrowth: growthPotential,
                remainingGrowth: growthPotential,
                monthlyGrowth: monthlyGrowth,
                growthMonths: growthMonths,
                lastGrowthCheck: Date.now(),
                history: [{ match: gameData.matchesPlayed || 0, rating: Math.round(player.rating * 10) / 10 }]
            });

            console.log(`[Growth] 유망주 콜업: ${player.name}에게 성장 가능성 ${growthPotential} 부여 완료 (성장 기간 ${growthMonths}개월, 콜업 보너스 +${callUpBonus})`);
            return true;
        }
        return false;
    }

    // [수동 매칭] 멘토 배정
    assignMentor(menteeName, mentorName) {
        if (!gameData.mentoringPairs) gameData.mentoringPairs = [];
        // 기존 멘토링 관계 제거 (1:1 보장, 한 선수가 멘토이면서 멘티일 수 없음)
        gameData.mentoringPairs = gameData.mentoringPairs.filter(p =>
            p && p.mentee !== menteeName && p.mentor !== menteeName &&
            p.mentee !== mentorName && p.mentor !== mentorName
        );
        gameData.mentoringPairs.push({ mentee: menteeName, mentor: mentorName });
        this.renderGrowthTab();
    }

    // [수동 매칭] 멘토 배정 해제
    removeMentor(menteeName) {
        if (!gameData.mentoringPairs) return;
        gameData.mentoringPairs = gameData.mentoringPairs.filter(p => p && p.mentee !== menteeName);
        this.renderGrowthTab();
    }

    // 수동으로 매칭된 멘토 찾기
    _findMentorFor(mentee) {
        if (!mentee || !gameData || !gameData.selectedTeam || !gameData.mentoringPairs || !Array.isArray(gameData.mentoringPairs)) return null;
        const pair = gameData.mentoringPairs.find(p => p && p.mentee === mentee.name);
        if (!pair) return null;

        const myTeam = teams[gameData.selectedTeam] || [];
        return myTeam.find(p => p && p.name === pair.mentor) || null;
    }

    _getMentoringBonus(player) {
        if (!player) return 1.0;
        const mentor = this._findMentorFor(player);
        if (!mentor) return 1.0;
        const base = 1.08;
        const samePosBonus = (mentor.position === player.position) ? 0.05 : 0;
        const sameCountryBonus = (mentor.country && player.country && mentor.country === player.country) ? 0.04 : 0;
        const ratingDiffBonus = Math.max(0, Math.min(0.08, ((mentor.rating || 0) - (player.rating || 0)) * 0.005));
        return Math.min(1.35, base + samePosBonus + sameCountryBonus + ratingDiffBonus);
    }

    // 우리 팀 멘토링 현황 요약 (성장 탭에서 표시)
    getTeamMentoringSummary() {
        if (!gameData || !gameData.selectedTeam) return [];
        if (!gameData.mentoringPairs) gameData.mentoringPairs = [];
        const myTeam = teams[gameData.selectedTeam] || [];
        const out = [];

        // gameData.mentoringPairs 순회
        if (Array.isArray(gameData.mentoringPairs)) {
            // 유효하지 않은 쌍(이적 등으로 선수가 팀에 없는 경우)을 정리하기 위해 필터링
            gameData.mentoringPairs = gameData.mentoringPairs.filter(pair => {
                if (!pair || !pair.mentee || !pair.mentor) return false;
                const mentee = myTeam.find(p => p && p.name === pair.mentee);
                const mentor = myTeam.find(p => p && p.name === pair.mentor);

                if (mentee && mentor) {
                    const bonus = Math.round((this._getMentoringBonus(mentee) - 1) * 100);
                    out.push({
                        menteeName: mentee.name,
                        menteePosition: mentee.position || '',
                        menteeRating: Math.round(mentee.rating || 0),
                        mentorName: mentor.name,
                        mentorPosition: mentor.position || '',
                        mentorRating: Math.round(mentor.rating || 0),
                        samePosition: mentor.position === mentee.position,
                        sameCountry: !!(mentor.country && mentee.country && mentor.country === mentee.country),
                        bonusPct: bonus
                    });
                    return true;
                }
                return false; // 둘 중 하나라도 팀에 없으면 쌍 삭제
            });
        }

        return out.sort((a, b) => b.bonusPct - a.bonusPct);
    }

    // [수정] 우리 팀 선수 오버롤 정수 처리 (삭제 또는 비활성화)
    normalizeOurTeamRatings() {
        // 소수점 유지를 위해 기능 비활성화
    }

    // 선수 성장 정보 조회
    getPlayerGrowthInfo(playerName) {
        return this.growthData.get(playerName) || null;
    }

    // 팀의 모든 선수 성장 정보 조회 (성장그래프를 위해 history 포함)
    getTeamGrowthSummary() {
        if (!gameData.selectedTeam) return [];

        const teamPlayers = teams[gameData.selectedTeam];
        const summary = [];

        teamPlayers.forEach(player => {
            if (this.growthData.has(player.name)) {
                const growthInfo = this.growthData.get(player.name);
                const currentRating = Math.round(player.rating * 10) / 10;
                const maxPotential = currentRating + growthInfo.remainingGrowth;

                summary.push({
                    name: player.name,
                    position: player.position,
                    age: player.age,
                    currentRating: currentRating,
                    maxPotential: Math.round(maxPotential * 10) / 10,
                    remainingGrowth: Math.round(growthInfo.remainingGrowth * 10) / 10,
                    monthlyGrowth: Math.round(growthInfo.monthlyGrowth * 100) / 100,
                    maxGrowth: growthInfo.maxGrowth,
                    history: growthInfo.history || [{ match: 0, rating: currentRating }]
                });
            }
        });

        return summary.sort((a, b) => (a.age - b.age) || (b.currentRating - a.currentRating));
    }

    // 성장 시스템 리셋
    resetGrowthSystem() {
        this.growthData.clear();
    }

    // 성장 데이터 저장
    getSaveData() {
        return {
            growthData: Array.from(this.growthData.entries())
        };
    }

    // 성장 데이터 로드 (구버전 세이브 파일 및 다양한 저장 형식 지원)
    loadSaveData(data) {
        this.growthData.clear();
        if (!data) return;

        if (data.growthData && Array.isArray(data.growthData)) {
            this.growthData = new Map(data.growthData);
        } else if (Array.isArray(data)) {
            this.growthData = new Map(data);
        } else if (typeof data === 'object') {
            const entries = Object.entries(data).filter(([k, v]) => k !== 'growthData' && typeof v === 'object');
            if (entries.length > 0) {
                this.growthData = new Map(entries);
            }
        }
    }

    // ============ 성장 탭 UI 렌더러 ============
    _selectedGrowthPlayer = null;
    _growthChartInstance = null;

    renderGrowthTab() {
        const listEl = document.getElementById('growthPlayerList');
        const mentoringListEl = document.getElementById('mentoringList');
        const badgeEl = document.getElementById('growth-count-badge');
        const emptyEl = document.getElementById('growthEmpty');
        const detailEl = document.getElementById('growthDetail');
        if (!listEl) return;

        const summary = this.getTeamGrowthSummary();
        if (badgeEl) badgeEl.textContent = summary.length;

        if (summary.length === 0) {
            listEl.replaceChildren();
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'growth-list-empty';
            emptyDiv.append('아직 성장 중인 선수가 없어요', document.createElement('br'), '유스 콜업 또는 육성 시스템을 확인해 보세요');
            listEl.appendChild(emptyDiv);
            if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.querySelector('h4').textContent = '아직 성장 데이터가 없어요'; }
            if (detailEl) detailEl.style.display = 'none';
        } else {
            listEl.replaceChildren();
            summary.forEach(s => {
                const item = document.createElement('div');
                item.className = `growth-player-item ${this._selectedGrowthPlayer === s.name ? 'active' : ''}`.trim();
                item.dataset.name = s.name;

                const mainDiv = document.createElement('div');
                mainDiv.className = 'growth-player-main';

                const avatarDiv = document.createElement('div');
                const posLower = (s.position || 'mf').toLowerCase();
                avatarDiv.className = `growth-player-avatar pos-badge pos-${posLower}`;
                avatarDiv.textContent = s.position || 'MF';

                const infoDiv = document.createElement('div');
                infoDiv.className = 'growth-player-info';

                const strong = document.createElement('strong');
                strong.textContent = s.name;

                const subDiv = document.createElement('div');
                subDiv.className = 'growth-player-sub';
                subDiv.textContent = `${s.position} · ${s.age}세 · OVR ${s.currentRating}`;

                infoDiv.append(strong, subDiv);
                mainDiv.append(avatarDiv, infoDiv);

                const progressDiv = document.createElement('div');
                progressDiv.className = 'growth-player-progress';

                const barWrap = document.createElement('div');
                barWrap.className = 'player-progress-bar';

                const barInner = document.createElement('div');
                barInner.style.width = `${Math.min(100, Math.round((s.maxGrowth - s.remainingGrowth) / Math.max(0.1, s.maxGrowth) * 100))}%`;
                barWrap.appendChild(barInner);

                const spanRate = document.createElement('span');
                spanRate.textContent = `+${s.monthlyGrowth.toFixed(2)}/턴`;

                progressDiv.append(barWrap, spanRate);
                item.append(mainDiv, progressDiv);

                item.addEventListener('click', () => {
                    this._selectedGrowthPlayer = s.name;
                    this.renderGrowthTab();
                });

                listEl.appendChild(item);
            });
        }

        const mentoringSummary = this.getTeamMentoringSummary();
        if (mentoringListEl) {
            mentoringListEl.replaceChildren();
            if (mentoringSummary.length === 0) {
                const emptyM = document.createElement('div');
                emptyM.className = 'mentoring-empty';
                emptyM.style.cssText = 'color:#aaa; font-size:0.85rem; padding:10px 4px;';
                emptyM.append('멘토링 진행 중인 쌍이 없어요', document.createElement('br'), '28세 이상 베테랑이 있으면 수동 매칭 가능합니다.');
                mentoringListEl.appendChild(emptyM);
            } else {
                mentoringSummary.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'mentoring-item';

                    // mentee
                    const menteePair = document.createElement('div');
                    menteePair.className = 'mentoring-pair';
                    const menteeTag = document.createElement('span');
                    menteeTag.className = 'mentee-tag';
                    menteeTag.textContent = '멘티';
                    const menteeName = document.createElement('strong');
                    menteeName.textContent = m.menteeName;
                    const menteePos = document.createElement('span');
                    menteePos.className = 'mentee-pos';
                    menteePos.textContent = `(${m.menteePosition})`;
                    menteePair.append(menteeTag, menteeName, menteePos);

                    const arrow = document.createElement('div');
                    arrow.className = 'mentoring-arrow';
                    if (typeof window.createIcon === 'function') {
                        arrow.appendChild(window.createIcon('arrow_down'));
                    } else {
                        arrow.textContent = '↓';
                    }

                    // mentor
                    const mentorPair = document.createElement('div');
                    mentorPair.className = 'mentoring-pair';
                    const mentorTag = document.createElement('span');
                    mentorTag.className = 'mentor-tag';
                    mentorTag.textContent = '멘토';
                    const mentorName = document.createElement('strong');
                    mentorName.textContent = m.mentorName;
                    const mentorPos = document.createElement('span');
                    mentorPos.className = 'mentor-pos';
                    mentorPos.textContent = `(${m.mentorPosition})`;
                    mentorPair.append(mentorTag, mentorName, mentorPos);

                    // badges
                    const badgeRow = document.createElement('div');
                    badgeRow.className = 'mentoring-badge-row';
                    if (m.samePosition) {
                        const chip = document.createElement('span');
                        chip.className = 'mentoring-chip good';
                        chip.textContent = '동일 포지션';
                        badgeRow.appendChild(chip);
                    }
                    if (m.sameCountry) {
                        const chip = document.createElement('span');
                        chip.className = 'mentoring-chip good';
                        chip.textContent = '동일 국적';
                        badgeRow.appendChild(chip);
                    }
                    const bonusChip = document.createElement('span');
                    bonusChip.className = 'mentoring-chip bonus';
                    bonusChip.textContent = `+${m.bonusPct}% 성장`;
                    badgeRow.appendChild(bonusChip);

                    item.append(menteePair, arrow, mentorPair, badgeRow);
                    mentoringListEl.appendChild(item);
                });
            }
        }

        const selectedSummary = summary.find(s => s.name === this._selectedGrowthPlayer) || summary[0];
        if (selectedSummary) {
            if (emptyEl) emptyEl.style.display = 'none';
            if (detailEl) detailEl.style.display = 'block';
            this._renderGrowthDetail(selectedSummary);
        } else {
            if (emptyEl) emptyEl.style.display = 'flex';
            if (detailEl) detailEl.style.display = 'none';
        }
    }

    _posEmoji(pos) {
        if (pos === 'GK') return 'GK';
        if (pos === 'DF') return 'DF';
        if (pos === 'MF') return 'MF';
        if (pos === 'FW') return 'FW';
        return 'PL';
    }

    _renderGrowthDetail(s) {
        const tEl = document.getElementById('growthPlayerTitle');
        const mEl = document.getElementById('growthPlayerMeta');
        const cEl = document.getElementById('growthStatCurrent');
        const pEl = document.getElementById('growthStatPotential');
        const rEl = document.getElementById('growthStatRemain');
        const rateEl = document.getElementById('growthStatRate');
        const pFill = document.getElementById('growthProgressFill');
        const pText = document.getElementById('growthProgressText');

        if (tEl) {
            tEl.replaceChildren();
            const posBadge = document.createElement('span');
            posBadge.className = `pos-badge pos-${(s.position || 'mf').toLowerCase()}`;
            posBadge.style.marginRight = '8px';
            posBadge.textContent = s.position || 'MF';
            tEl.append(posBadge, document.createTextNode(s.name));
        }
        if (mEl) mEl.textContent = `${s.position} · ${s.age}세 · 체계적 성장 훈련 진행 중`;
        if (cEl) cEl.textContent = s.currentRating;

        const stageEl = document.getElementById('growthStatStage') || document.getElementById('growthStatPotential');
        const trendEl = document.getElementById('growthStatTrend') || document.getElementById('growthStatRemain');
        if (stageEl) {
            if (s.age <= 19) stageEl.textContent = '원더키드';
            else if (s.age <= 22) stageEl.textContent = '급성장기';
            else if (s.age <= 26) stageEl.textContent = '발전기';
            else stageEl.textContent = '베테랑';
        }
        if (trendEl) {
            trendEl.textContent = s.monthlyGrowth >= 0.25 ? '가속 성장 ' : '안정 성장 ';
        }
        if (rateEl) rateEl.textContent = `+${s.monthlyGrowth.toFixed(2)}/3경기`;

        const progressPct = Math.max(15, Math.min(100, Math.round((s.maxGrowth - s.remainingGrowth) / Math.max(0.1, s.maxGrowth) * 100)));
        if (pFill) pFill.style.width = progressPct + '%';
        if (pText) {
            pText.style.wordBreak = 'keep-all';
            pText.style.whiteSpace = 'nowrap';
            pText.textContent = `${progressPct}% (개인 맞춤 훈련 진행 중)`;
        }

        // [신규] 멘토 지정 UI 렌더링
        const mentorUI = document.getElementById('mentorAssignUI');
        if (mentorUI) {
            mentorUI.replaceChildren();
            const currentMentor = this._findMentorFor({ name: s.name });
            if (currentMentor) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

                const leftDiv = document.createElement('div');
                const lbl = document.createElement('span');
                lbl.style.cssText = 'color:#aaa; font-size:0.9rem;';
                lbl.textContent = '현재 멘토:';
                const nameEl = document.createElement('strong');
                nameEl.style.cssText = 'margin-left:8px; font-size:1.1rem;';
                nameEl.textContent = currentMentor.name;
                const posEl = document.createTextNode(` (${currentMentor.position})`);
                leftDiv.append(lbl, nameEl, posEl);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-danger';
                removeBtn.style.cssText = 'padding:5px 10px; font-size:0.9rem;';
                removeBtn.textContent = '해제';
                removeBtn.onclick = () => playerGrowthSystem.removeMentor(s.name);

                wrap.append(leftDiv, removeBtn);
                mentorUI.appendChild(wrap);
            } else {
                const myTeam = teams[gameData.selectedTeam] || [];
                const availableMentors = myTeam.filter(p =>
                    p.age >= 28 &&
                    (!gameData.mentoringPairs || !gameData.mentoringPairs.some(pair => pair.mentor === p.name || pair.mentee === p.name))
                );

                if (availableMentors.length > 0) {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'display:flex; flex-direction:column; gap:10px;';

                    const lbl = document.createElement('span');
                    lbl.style.cssText = 'color:#aaa; font-size:0.9rem;';
                    lbl.textContent = '멘토 지정 (28세 이상 베테랑)';

                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; gap:10px;';

                    const selectWrap = document.createElement('div');
                    selectWrap.className = 'mentor-select-wrap';

                    const select = document.createElement('select');
                    select.id = `mentorSelect_${s.name}`;
                    select.className = 'mentor-select';

                    availableMentors.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.name;
                        opt.textContent = `[${m.position}] ${m.name} · OVR ${Math.round(m.rating)} · ${m.age}세`;
                        select.appendChild(opt);
                    });
                    selectWrap.appendChild(select);

                    const assignBtn = document.createElement('button');
                    assignBtn.className = 'mentor-assign-btn';
                    assignBtn.textContent = '배정';
                    assignBtn.onclick = () => {
                        const sel = document.getElementById(`mentorSelect_${s.name}`);
                        if (sel) playerGrowthSystem.assignMentor(s.name, sel.value);
                    };

                    row.append(selectWrap, assignBtn);
                    wrap.append(lbl, row);
                    mentorUI.appendChild(wrap);
                } else {
                    const emptyNote = document.createElement('div');
                    emptyNote.style.cssText = 'color:#aaa; font-size:0.9rem; text-align:center;';
                    emptyNote.textContent = '배정 가능한 멘토가 없습니다. (28세 이상 베테랑 필요)';
                    mentorUI.appendChild(emptyNote);
                }
            }
        }

        this._renderChart(s);
    }

    _renderChart(s) {
        const canvas = document.getElementById('growthChartCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (this._growthChartInstance) {
            try { this._growthChartInstance.destroy(); } catch (e) { /* noop */ }
            this._growthChartInstance = null;
        }
        const ChartCtor = window.Chart;
        if (!ChartCtor) {
            ctx.fillStyle = '#444';
            ctx.font = '14px sans-serif';
            ctx.fillText('Chart.js 라이브러리를 불러올 수 없습니다.', 10, 30);
            return;
        }
        const hist = (s.history && s.history.length > 0) ? s.history : [{ match: 0, rating: s.currentRating }];
        const labels = hist.map(h => `#${h.match}`);
        const dataVals = hist.map(h => h.rating);
        const minY = Math.max(40, Math.floor(Math.min.apply(null, dataVals) - 3));
        const maxY = Math.min(100, Math.ceil(Math.max.apply(null, dataVals) + 3));

        this._growthChartInstance = new ChartCtor(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${s.name} 오버롤 추이`,
                    data: dataVals,
                    borderColor: '#38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#F8FAFC',
                    pointBorderColor: '#38BDF8',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#F8FAFC', font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        borderColor: '#38BDF8',
                        borderWidth: 1,
                        titleColor: '#F8FAFC',
                        bodyColor: '#CBD5E1'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94A3B8', maxRotation: 0, autoSkipPadding: 12 },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        min: minY,
                        max: maxY,
                        ticks: { color: '#94A3B8', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
    }
}

// 전역 성장 시스템 인스턴스
const playerGrowthSystem = new PlayerGrowthSystem();

// 게임 초기화 시 성장 시스템 초기화
function initializePlayerGrowth() {
    playerGrowthSystem.initializePlayerGrowth();
}

// 경기 후 성장 처리
function processPostMatchGrowth() {
    playerGrowthSystem.processPlayerGrowth();
    playerGrowthSystem.processAllTeamsGrowth();

    // [신규] 성장으로 인한 주급 변동 반영
    if (typeof calculateTotalWages === 'function') calculateTotalWages();

    // playerGrowthSystem.normalizeOurTeamRatings(); // [수정] 소수점 유지를 위해 주석 처리

    // [추가] 성장 후 DNA 포인트 재계산 (실시간 반영)
    if (typeof DNAManager !== 'undefined') {
        DNAManager.recalculateLineOVRs();
    }
}

// 시즌 종료 시 나이 증가
function advancePlayerAges() {
    playerGrowthSystem.advancePlayerAges();
}

// 성장 정보 표시 함수
function showGrowthSummary() {
    const summary = playerGrowthSystem.getTeamGrowthSummary();

    if (summary.length === 0) {
        alert("현재 성장 중인 선수가 없습니다.");
        return;
    }

    let message = `[선수 성장 현황]\n\n`;

    summary.forEach((player, index) => {
        message += `${index + 1}. ${player.name} (${player.age}세)\n`;
        message += `현재 오버롤: ${player.currentRating} · 월 성장: +${player.monthlyGrowth}\n\n`;
    });

    alert(message);
}

// 경기 종료 후 성장 처리를 전역으로 노출
window.processPostMatchGrowth = processPostMatchGrowth;
window.showGrowthSummary = showGrowthSummary;
window.playerGrowthSystem = playerGrowthSystem;
