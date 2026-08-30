// playerGrowth.js
// 선수 성장 시스템 구현 (12개월 기준 성장)

class PlayerGrowthSystem {
    constructor() {
        this.growthData = new Map(); // 선수별 성장 데이터 저장
        // [이동] 고정 포텐셜 명단 (이름: 목표 오버롤)
        this.fixedPotentials = {
            "오현규": 88,
            "김민수": 92,
            "배준호": 90,
            "앙제요안 보니": 88,
            "조반니 레오니": 93,
            "트레이 뇨니": 86,
            "프란치스코 카마르다": 92,
            "옌스 카스트로프": 92,
            "조브 벨링엄": 92,
            "제라르 마르틴": 84,
            "마르크 베르날": 85,
            "루니 바르다그지": 83,
            "파우 쿠바르시": 93,
            "엔드릭": 90,
            "리코 루이스": 83,
            "코비 마이누": 88,
            "아론 바우만": 91,
            "조르티 모키오": 84,
            "부바 상가레": 90,
            "루카 부슈코비치": 94,
            "에단 은와네리": 86,
            "조시 아체암퐁": 87,
            "맥스 다우먼": 93,
            "리오 응구모하": 90,
            "레나르트 칼": 95,
            "배승균": 92,
            "윤도영": 87,
            "강상윤": 92,
            "디스 얀서": 89,
            "켄드리 파에스": 89,
            "아산 우에드라오고": 92,
            "백인우": 87,
            "대릴 바콜라": 86,
            "파트리크 도르구": 92,
            "파쿤도 부오나오테": 87,
            "미카 고츠": 88,
            "양민혁": 94,
            "마이키 무어": 94,
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

                // [수정] 포텐셜에 따라 성장 기간을 3~12개월로 다르게 설정
                const growthMonths = Math.max(3, Math.min(12, Math.round(growthPotential / 2.5)));
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

    // 성장 가능성 계산 (3-15 사이의 랜덤 값)
    calculateGrowthPotential(player) {
        // [수정] this.fixedPotentials 사용
        if (this.fixedPotentials.hasOwnProperty(player.name)) {
            const targetRating = this.fixedPotentials[player.name];
            const growthNeeded = Math.max(0, targetRating - Math.round(player.rating));
            console.log(`🔒 ${player.name}: 고정 포텐셜 적용 (목표: ${targetRating}, 필요 성장: ${growthNeeded})`);
            return growthNeeded;
        }

        // [밸런스 수정] 기본 성장 폭 하향 (인플레 방지)
        // 기존: 3~13 -> 수정: 2~8
        const baseGrowth = 2 + Math.random() * 8;

        // 나이에 따른 보정
        let ageModifier = 1;
        if (player.age <= 18) {
            ageModifier = 1.3; // 1.5 -> 1.3
        } else if (player.age <= 21) {
            ageModifier = 1.1; // 1.3 -> 1.1
        } else if (player.age <= 23) {
            ageModifier = 1.0; // 1.1 -> 1.0
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
            console.log(`⭐ 아이콘 ${player.name}에게 전설적인 성장 보너스 적용`);
        }

        // 커스텀 선수 특별 보너스
        if (player.isCustom) {
            teamModifier = 2;
            console.log(`🛠️ 커스텀 ${player.name}에게 한계 돌파 성장 보너스 적용`);
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

        // [신규] 최종 포텐셜 상한선 체크 (일반 선수는 95를 넘기 힘들게)
        const projectedRating = currentRating + finalGrowth;
        const hardCap = player.isCustom || player.isIcon ? 100 : 95;

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
        if (isStarter) return 1.15;
        const teamPlayers = teams[gameData.selectedTeam] || [];
        const isInTeam = teamPlayers.some(p => p.name === name);
        return isInTeam ? 0.85 : 0.2;
    }

    // 성장량 계산 (월별 성장량 그대로 사용 + 출장/성적 보정)
    calculateGrowthAmount(player, growthInfo) {
        let growthAmount = growthInfo.monthlyGrowth;

        // [신규] 롱타임 모드일 경우 성장 속도 40% 감속
        if (gameData.gameMode === 'longtime') {
            growthAmount *= 0.6;
        }

        // [신규] 출장 여부 보정: 선발 1.15x / 후보 0.85x / 방출위기 0.2x
        growthAmount *= this._getPlayerAppearanceFactor(player);

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
        let message = `🌟 ${player.name}의 능력치가 상승했습니다!\n${oldRating} → ${newRating} (+${growthAmount})`;

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

        console.log("🤖 AI 선수 성장 프로세스 시작...");

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

                        // 기본 성장치 (5경기당 0.3 ~ 0.7)
                        let growthAmount = 0.3 + Math.random() * 0.4;

                        // 1. 나이 보정 (어릴수록 빠름)
                        if (player.age <= 20) growthAmount *= 1.5;
                        else if (player.age <= 23) growthAmount *= 1.2;

                        // 2. 현재 능력치 보정 (낮을수록 빨리 큼 - 캐치업)
                        if (player.rating < 70) growthAmount *= 1.3;
                        else if (player.rating > 90) growthAmount *= 0.5; // 고능력치는 성장 둔화

                        // 3. 밸런싱 계수 적용 (신규)
                        growthAmount *= balanceFactor;

                        // AI 프레스티지 선수 보너스
                        const isPrestigePlayer = gameData.aiPrestige && gameData.aiPrestige[teamKey] && gameData.aiPrestige[teamKey].includes(player.name);

                        if (isPrestigePlayer) {
                            growthAmount += 0.5; // 프레스티지 추가 보너스
                        }

                        // 소수점 1자리까지 허용
                        growthAmount = Math.round(growthAmount * 10) / 10;

                        // AI 선수 성장 적용
                        const oldRating = player.rating;
                        const maxCap = this.fixedPotentials.hasOwnProperty(player.name) ? this.fixedPotentials[player.name] : 99;
                        const newRating = Math.min(maxCap, player.rating + growthAmount);
                        player.rating = Math.round(newRating * 10) / 10; // 소수점 1자리

                        // 로그 출력 (성장폭이 0.5 이상일 때만)
                        if (growthAmount >= 0.5) {
                            console.log(`📈 ${player.name} (${teamNames[teamKey] || teamKey}): ${oldRating.toFixed(1)} -> ${player.rating.toFixed(1)} (+${growthAmount}) [밸런스: x${balanceFactor}]`);
                        }
                    }
                });
            }
        });
    }

    // 시즌 종료 시 나이 증가
    advancePlayerAges() {
        Object.keys(teams).forEach(teamKey => {
            teams[teamKey].forEach(player => {
                player.age++;

                // 26세 이상이 되면 성장 데이터 제거
                if (this.growthData.has(player.name) && player.age > 25) {
                    console.log(`${player.name}의 나이 초과(${player.age}세) - 성장 데이터 삭제`);
                    this.growthData.delete(player.name);
                }
            });
        });

        console.log(`✅ 시즌 종료 후 남은 성장 중인 선수: ${this.growthData.size}명`);
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

            // 유스 콜업 보너스: 3~6 추가
            const callUpBonus = 3 + Math.floor(Math.random() * 4);
            growthPotential += callUpBonus;

            // [수정] 포텐셜에 따라 성장 기간을 3~12개월로 다르게 설정
            const growthMonths = Math.max(3, Math.min(12, Math.round(growthPotential / 2.5)));
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

            console.log(`🌟 유망주 콜업: ${player.name}에게 성장 가능성 ${growthPotential} 부여 완료 (성장 기간 ${growthMonths}개월, 콜업 보너스 +${callUpBonus})`);
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
        // console.log("🔧 오버롤 정수화 기능이 비활성화되었습니다 (소수점 유지).");
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

        return summary.sort((a, b) => b.maxPotential - a.maxPotential);
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
            listEl.innerHTML = '<div class="growth-list-empty">아직 성장 중인 선수가 없어요<br>유스 콜업 또는 육성 시스템을 확인해 보세요</div>';
            if (emptyEl) { emptyEl.style.display = 'flex'; emptyEl.querySelector('h4').textContent = '아직 성장 데이터가 없어요'; }
            if (detailEl) detailEl.style.display = 'none';
        } else {
            listEl.innerHTML = summary.map(s => `
                <div class="growth-player-item ${this._selectedGrowthPlayer === s.name ? 'active' : ''}" data-name="${s.name}">
                    <div class="growth-player-main">
                        <div class="growth-player-avatar">${this._posEmoji(s.position)}</div>
                        <div class="growth-player-info">
                            <strong>${s.name}</strong>
                            <div class="growth-player-sub">${s.position} · ${s.age}세 · ${s.currentRating} → ${s.maxPotential}</div>
                        </div>
                    </div>
                    <div class="growth-player-progress">
                        <div class="player-progress-bar"><div style="width:${Math.min(100, Math.round((s.maxGrowth - s.remainingGrowth) / Math.max(0.1, s.maxGrowth) * 100))}%"></div></div>
                        <span>+${s.monthlyGrowth.toFixed(2)}/턴</span>
                    </div>
                </div>
            `).join('');

            listEl.querySelectorAll('.growth-player-item').forEach(el => {
                el.addEventListener('click', () => {
                    const name = el.dataset.name;
                    this._selectedGrowthPlayer = name;
                    this.renderGrowthTab();
                });
            });
        }

        const mentoringSummary = this.getTeamMentoringSummary();
        if (mentoringListEl) {
            if (mentoringSummary.length === 0) {
                mentoringListEl.innerHTML = `<div class="mentoring-empty" style="color:#aaa; font-size:0.85rem; padding:10px 4px;">멘토링 진행 중인 쌍이 없어요<br>28세 이상 베테랑이 있으면 수동 매칭 가능합니다.</div>`;
            } else {
                mentoringListEl.innerHTML = mentoringSummary.map(m => `
                    <div class="mentoring-item">
                        <div class="mentoring-pair">
                            <span class="mentee-tag">멘티</span>
                            <strong>${m.menteeName}</strong>
                            <span class="mentee-pos">(${m.menteePosition})</span>
                        </div>
                        <div class="mentoring-arrow">⬇️</div>
                        <div class="mentoring-pair">
                            <span class="mentor-tag">멘토</span>
                            <strong>${m.mentorName}</strong>
                            <span class="mentor-pos">(${m.mentorPosition})</span>
                        </div>
                        <div class="mentoring-badge-row">
                            ${m.samePosition ? '<span class="mentoring-chip good">동일 포지션</span>' : ''}
                            ${m.sameCountry ? '<span class="mentoring-chip good">동일 국적</span>' : ''}
                            <span class="mentoring-chip bonus">+${m.bonusPct}% 성장</span>
                        </div>
                    </div>
                `).join('');
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
        if (pos === 'GK') return '🧤';
        if (pos === 'DF') return '🛡️';
        if (pos === 'MF') return '🎯';
        if (pos === 'FW') return '⚡';
        return '👤';
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

        if (tEl) tEl.textContent = `${this._posEmoji(s.position)} ${s.name}`;
        if (mEl) mEl.textContent = `${s.position} | ${s.age}세 | 최대 잠재 성장량 +${s.maxGrowth}`;
        if (cEl) cEl.textContent = s.currentRating;
        if (pEl) pEl.textContent = s.maxPotential;
        if (rEl) rEl.textContent = `+${s.remainingGrowth}`;
        if (rateEl) rateEl.textContent = `+${s.monthlyGrowth.toFixed(2)}/3경기`;

        const progressPct = Math.max(0, Math.min(100, Math.round((s.maxGrowth - s.remainingGrowth) / Math.max(0.1, s.maxGrowth) * 100)));
        if (pFill) pFill.style.width = progressPct + '%';
        if (pText) pText.textContent = progressPct + '% 진행 (' + (s.maxGrowth - s.remainingGrowth).toFixed(1) + ' / ' + s.maxGrowth + ')';

        // [신규] 멘토 지정 UI 렌더링
        const mentorUI = document.getElementById('mentorAssignUI');
        if (mentorUI) {
            const currentMentor = this._findMentorFor({ name: s.name });
            if (currentMentor) {
                mentorUI.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="color:#aaa; font-size:0.9rem;">현재 멘토:</span>
                            <strong style="margin-left:8px; font-size:1.1rem;">${currentMentor.name}</strong> (${currentMentor.position})
                        </div>
                        <button class="btn btn-danger" onclick="playerGrowthSystem.removeMentor('${s.name}')" style="padding:5px 10px; font-size:0.9rem;">해제</button>
                    </div>
                `;
            } else {
                const myTeam = teams[gameData.selectedTeam] || [];
                const availableMentors = myTeam.filter(p =>
                    p.age >= 28 &&
                    (!gameData.mentoringPairs || !gameData.mentoringPairs.some(pair => pair.mentor === p.name || pair.mentee === p.name))
                );

                if (availableMentors.length > 0) {
                    const options = availableMentors.map(m =>
                        `<option value="${m.name}">${this._posEmoji(m.position)} ${m.name} · ${m.position} · OVR ${Math.round(m.rating)} · ${m.age}세</option>`
                    ).join('');

                    mentorUI.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <span style="color:#aaa; font-size:0.9rem;">멘토 지정 (28세 이상 베테랑)</span>
                        <div style="display:flex; gap:10px;">
                            <div class="mentor-select-wrap">
                                <select id="mentorSelect_${s.name}" class="mentor-select">
                                    ${options}
                                </select>
                            </div>
                            <button class="mentor-assign-btn" onclick="playerGrowthSystem.assignMentor('${s.name}', document.getElementById('mentorSelect_${s.name}').value)">배정</button>
                        </div>
                    </div>
                `;
                } else {
                    mentorUI.innerHTML = `
                    <div style="color:#aaa; font-size:0.9rem; text-align:center;">
                        배정 가능한 멘토가 없습니다. (28세 이상 베테랑 필요)
                    </div>
                `;
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
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f39c12',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: `목표 잠재력 (${s.maxPotential})`,
                    data: labels.map(() => s.maxPotential),
                    borderColor: '#2ecc71',
                    borderDash: [6, 4],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#ddd', font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 30, 0.95)',
                        borderColor: '#f39c12',
                        borderWidth: 1,
                        titleColor: '#fff',
                        bodyColor: '#eee'
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#aaa', maxRotation: 0, autoSkipPadding: 12 },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        min: minY,
                        max: maxY,
                        ticks: { color: '#aaa', stepSize: 1 },
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

    let message = `📈 선수 성장 현황\n\n`;

    summary.forEach((player, index) => {
        message += `${index + 1}. ${player.name} (${player.age}세)\n`;
        message += `   현재: ${player.currentRating} → 최대: ${player.maxPotential}\n`;
        message += `   남은 성장: ${player.remainingGrowth} (월 +${player.monthlyGrowth})\n\n`;
    });

    alert(message);
}

// 경기 종료 후 성장 처리를 전역으로 노출
window.processPostMatchGrowth = processPostMatchGrowth;
window.showGrowthSummary = showGrowthSummary;
window.playerGrowthSystem = playerGrowthSystem;
