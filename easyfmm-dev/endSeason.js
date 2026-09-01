// endSeason.js - 승강제 시스템
// 다른 파일들의 의존성을 최소화하여 독립적으로 작동


// 리그 테이블에서 팀 제거
function removeFromLeagueTable(teamKey, league) {
    let leagueTable;
    if (league === 1) leagueTable = window.league1Table;
    else if (league === 2) leagueTable = window.league2Table;
    else if (league === 3) leagueTable = window.league3Table;
    
    if (leagueTable && leagueTable[teamKey]) {
        delete leagueTable[teamKey];
        console.log(`   🗑️ ${teamKey}를 ${league}부 테이블에서 삭제`);
    }
}

// 리그 테이블에 팀 추가
function addToLeagueTable(teamKey, league) {
    let leagueTable;
    if (league === 1) {
        if (!window.league1Table) window.league1Table = {};
        leagueTable = window.league1Table;
    } else if (league === 2) {
        if (!window.league2Table) window.league2Table = {};
        leagueTable = window.league2Table;
    } else if (league === 3) {
        if (!window.league3Table) window.league3Table = {};
        leagueTable = window.league3Table;
    }
    
    if (leagueTable) {
        leagueTable[teamKey] = {
            matches: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0
        };
        console.log(`   ➕ ${teamKey}를 ${league}부 테이블에 추가`);
    }
}

// 시즌 종료 조건 체크
function checkSeasonEnd() {
    // 현재 리그의 모든 팀이 26경기를 완료했는지 확인 (14팀 리그에서 홈&어웨이)
    const currentLeagueTeams = Object.keys(allTeams).filter(team => 
        allTeams[team].league === gameData.currentLeague
    );
    
    // 총 라운드 수 계산 (팀 수 - 1) * 2
    const totalRounds = (currentLeagueTeams.length - 1) * 2;
    
    const allTeamsFinished = currentLeagueTeams.every(teamKey => {
        const divisionKey = `division${gameData.currentLeague}`;
        const teamData = gameData.leagueData[divisionKey][teamKey];
        return teamData && teamData.matches >= totalRounds;
    });
    
    // [버그 수정] 유저가 이미 정규 라운드를 초과해서 진행해버린 경우(세이브 버그 등) 시즌 강제 종료
    if (allTeamsFinished || gameData.currentRound > totalRounds) {
        if (!allTeamsFinished) {
            console.warn(`⚠️ 일부 팀이 ${totalRounds}경기를 채우지 못했지만, 현재 라운드가 ${gameData.currentRound}이므로 시즌을 강제 종료합니다.`);
        }
        endSeason();
    }
}

function endSeason(silent = false) {
    // 1. 현재 리그 순위 및 기본 보상 계산
    const divisionKey = `division${gameData.currentLeague}`;
    const currentLeagueData = gameData.leagueData[divisionKey];
    
    if (!currentLeagueData) {
        console.error('리그 데이터를 찾을 수 없습니다:', divisionKey);
        return;
    }
    
    const standings = Object.keys(currentLeagueData).map(teamKey => ({
        team: teamKey,
        ...currentLeagueData[teamKey],
        goalDiff: currentLeagueData[teamKey].goalsFor - currentLeagueData[teamKey].goalsAgainst
    })).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
    });
    
    const userPosition = standings.findIndex(team => team.team === gameData.selectedTeam) + 1;
    let reward = 0;
    let achievement = '';
    
    if (userPosition === 1) {
        achievement = '우승';
        reward = 1500;
        // [신규] 감독 성과(우승) 기록
        if (typeof managerSystem !== 'undefined' && gameData.managerId) {
            managerSystem.updateManagerStats(gameData.managerId, { trophy: true });
        }
    } else if (userPosition <= 4) {
        achievement = '상위권';
        reward = 1000;
    } else if (userPosition <= 12) {
        achievement = '중위권';
        reward = 500;
    } else {
        achievement = '강등권';
        reward = 200;
    }
    
    gameData.teamMoney += reward;


    // 2. 올해의 선수상 시상
    let potyMessage = '';
    // [수정] 전역 변수 접근 방식 변경 (안전하게 window 객체 사용)
    const recordsSys = window.leagueBasedRecordsSystem || window.recordsSystem;

    if (recordsSys) {
        const poty = recordsSys.getPlayerOfTheSeason();
        if (poty) {
            const isMyPlayer = poty.team === gameData.selectedTeam;
            potyMessage = `\n\n🏆 [올해의 선수상]\n${poty.name} (${teamNames[poty.team] || poty.team})\nMOM 선정: ${poty.moms}회`;
            
            if (isMyPlayer) {
                potyMessage += "\n(우리 팀 선수가 수상했습니다! 상금 100억)";
                gameData.teamMoney += 100;
                // 메일 발송
                mailManager.addMail(`[수상] ${poty.name} 올해의 선수상 수상!`, '리그 사무국', `축하합니다!\n${poty.name} 선수가 이번 시즌 최고의 활약을 펼쳐 '올해의 선수상'을 수상했습니다.\n\n구단의 위상을 드높인 공로로 상금 100억원이 지급됩니다.`);
            }
        }
    }

    // 3. 승강제 데이터 계산 (3부리그 시스템 활성화 시)
    let promotionRelegationData = null;
    let userPromotionStatus = { status: 'stay' };
    let promotionMessage = '';

    if (typeof allTeams !== 'undefined' && Object.keys(allTeams).length > 19) {
        // 현재 상태의 상세 순위 계산 (데이터 변경 전)
        const detailedStandings = calculateDetailedStandings();
        promotionRelegationData = calculatePromotionRelegationNew(detailedStandings);
        userPromotionStatus = checkUserPromotionStatus(promotionRelegationData);

        // 추가 상금 계산 (리그별 차등)
        const additionalPrize = calculateAdditionalSeasonPrize(gameData.currentLeague, userPosition);
        if (additionalPrize > 0) {
            gameData.teamMoney += additionalPrize;
            reward += additionalPrize;
        }
        
        // 사용자 승격/강등 메시지 준비
        if (userPromotionStatus.status === 'promotion') {
            promotionMessage = `\n\n축하합니다! ${userPromotionStatus.newLeague}부리그 승격!`;
        } else if (userPromotionStatus.status === 'relegation') {
            promotionMessage = `\n\n아쉽게도 ${userPromotionStatus.newLeague}부리그 강등...`;
        }
    }
    
    // 4. 결과 알림 표시
    if (!silent) {
        alert(`시즌 종료!\n최종 순위: ${userPosition}위 (${achievement})\n보상: ${reward}억원${promotionMessage}${potyMessage}`);
    }
    
    // 5. 다른 팀 승강제 현황 표시
    if (!silent) {
        if (promotionRelegationData && (promotionRelegationData.promotions.length > 0 || promotionRelegationData.relegations.length > 0)) {
            showOtherTeamsPromotionStatus(promotionRelegationData);
        }
    }
    
    // 6. SNS 데이터 준비 (승강제 적용 전에 데이터 수집)
    const seasonResultData = {
        champions: [],
        promotions: [],
        relegations: [],
        topScorers: [],
        topAssisters: []
    };
    
    if (promotionRelegationData) {
        // 우승팀 데이터 (points 정보를 위해 standings 재사용)
        const detailedStandings = calculateDetailedStandings();
        seasonResultData.champions = promotionRelegationData.champions.map(champ => ({
            team: champ.team,
            league: champ.league,
            points: detailedStandings[`division${champ.league}`] ? detailedStandings[`division${champ.league}`][0].points : 0
        }));
        
        seasonResultData.promotions = promotionRelegationData.promotions;
        seasonResultData.relegations = promotionRelegationData.relegations;
        
        // 득점왕/도움왕 데이터 수집
        if (recordsSys) {
            for (let league = 1; league <= 3; league++) {
                const topScorer = recordsSys.getTopScorer(league);
                const topAssister = recordsSys.getTopAssister(league);
                if (topScorer) seasonResultData.topScorers.push(topScorer);
                if (topAssister) seasonResultData.topAssisters.push(topAssister);
            }
        }
    }

    // 7. 승강제 적용 (데이터 변경) - ★★★ 딱 한 번만 실행 ★★★
    if (promotionRelegationData) {
        applyPromotionRelegationNew(promotionRelegationData);
        
        // 사용자 리그 업데이트
        if (userPromotionStatus.status === 'promotion' || userPromotionStatus.status === 'relegation') {
            gameData.currentLeague = userPromotionStatus.newLeague;
        }
    }

    // 8. 시즌 마무리 공통 로직
    if (typeof advancePlayerAges === 'function') {
        advancePlayerAges();
    }

    if (typeof injurySystem !== 'undefined') {
        injurySystem.reset();
        console.log('🏥 시즌 종료: 모든 부상 선수가 회복되었습니다.');
    }

    if (typeof transferSystem !== 'undefined') {
        transferSystem.balanceAITeams();
    }

    if (recordsSys) {
        const currentYear = gameData.startYear || 2025;
        const seasonName = `${currentYear}/${currentYear + 1}`;
        recordsSys.archiveSeason(seasonName);
        recordsSys.resetSeason();
        recordsSys.initialize();
    }
    
    if (typeof initializeLeagueData === 'function') {
        initializeLeagueData();
    }
    gameData.matchesPlayed = 0;
    
    if (typeof generateFullSchedule === 'function') {
        generateFullSchedule(); // 새 시즌 스케줄 생성
    }
    
    if (!gameData.startYear) gameData.startYear = 2025;
    gameData.startYear++;

    // [추가] 시즌 카운트 증가
    if (!gameData.seasonCount) gameData.seasonCount = 1;
    gameData.seasonCount++;

    if (typeof setNextOpponent === 'function') {
        setNextOpponent();
    }
   
    // 9. SNS 업데이트 (지연 실행)
    setTimeout(() => {
        if (typeof snsManager !== 'undefined' && promotionRelegationData) {
            snsManager.onSeasonEnd(seasonResultData);
            if (document.getElementById('snsFeed')) {
                snsManager.displayFeed('snsFeed', 15);
            }
        }
    }, 3000);
}
    

// === 승강제 헬퍼 함수들 ===

// 리그별 상세 순위 계산
function calculateDetailedStandings() {
    const standings = {};
    
    for (let i = 1; i <= 3; i++) {
        const divisionKey = `division${i}`;
        if (gameData.leagueData[divisionKey]) {
            standings[divisionKey] = Object.keys(gameData.leagueData[divisionKey])
                .map(teamKey => ({
                    team: teamKey,
                    ...gameData.leagueData[divisionKey][teamKey],
                    goalDiff: gameData.leagueData[divisionKey][teamKey].goalsFor - 
                              gameData.leagueData[divisionKey][teamKey].goalsAgainst
                }))
                .sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                    return b.goalsFor - a.goalsFor;
                });
        }
    }
    
    return standings;
}

// 승강제 변동사항 계산
function calculatePromotionRelegationNew(standings) {
    const changes = {
        promotions: [],
        relegations: [],
        champions: []
    };
    
    // 각 리그 우승팀
    for (let i = 1; i <= 3; i++) {
        const divisionKey = `division${i}`;
        if (standings[divisionKey] && standings[divisionKey].length > 0) {
            changes.champions.push({
                team: standings[divisionKey][0].team,
                league: i,
                title: `${i}부리그 우승`
            });
        }
    }
    
    // 1부리그 → 2부리그 강등 (하위 2팀)
    if (standings.division1 && standings.division1.length >= 2) {
        const relegated = standings.division1.slice(-2);
        relegated.forEach(team => {
            changes.relegations.push({
                team: team.team,
                from: 1,
                to: 2,
                reason: "1부리그 강등"
            });
        });
    }
    
    // 2부리그 → 1부리그 승격 (상위 2팀)
    if (standings.division2 && standings.division2.length >= 2) {
        const promoted = standings.division2.slice(0, 2);
        promoted.forEach(team => {
            changes.promotions.push({
                team: team.team,
                from: 2,
                to: 1,
                reason: "1부리그 승격"
            });
        });
    }
    
    // 2부리그 → 3부리그 강등 (하위 2팀)
    if (standings.division2 && standings.division2.length >= 2) {
        const relegated = standings.division2.slice(-2);
        relegated.forEach(team => {
            changes.relegations.push({
                team: team.team,
                from: 2,
                to: 3,
                reason: "3부리그 강등"
            });
        });
    }
    
    // 3부리그 → 2부리그 승격 (상위 2팀)
    if (standings.division3 && standings.division3.length >= 2) {
        const promoted = standings.division3.slice(0, 2);
        promoted.forEach(team => {
            changes.promotions.push({
                team: team.team,
                from: 3,
                to: 2,
                reason: "2부리그 승격"
            });
        });
    }
    
    return changes;
}

// 사용자 팀 승강제 상태 확인
function checkUserPromotionStatus(promotionRelegationData) {
    // 승격 확인
    const promotion = promotionRelegationData.promotions.find(p => p.team === gameData.selectedTeam);
    if (promotion) {
        return {
            status: 'promotion',
            newLeague: promotion.to,
            message: promotion.reason
        };
    }
    
    // 강등 확인
    const relegation = promotionRelegationData.relegations.find(r => r.team === gameData.selectedTeam);
    if (relegation) {
        return {
            status: 'relegation',
            newLeague: relegation.to,
            message: relegation.reason
        };
    }
    
    return { status: 'stay' };
}

function applyPromotionRelegationNew(promotionRelegationData) {
    console.log('=== 승강제 적용 시작 ===');
    
    // 승격 적용
    promotionRelegationData.promotions.forEach(promotion => {
        if (allTeams[promotion.team]) {
            const oldLeague = promotion.from;
            const newLeague = promotion.to;
            
            // 1. allTeams 업데이트
            allTeams[promotion.team].league = newLeague;
            
            // 2. gameData.leagueData 업데이트
            const oldDivisionKey = `division${oldLeague}`;
            const newDivisionKey = `division${newLeague}`;
            
            // 이전 리그에서 삭제
            if (gameData.leagueData[oldDivisionKey] && gameData.leagueData[oldDivisionKey][promotion.team]) {
                delete gameData.leagueData[oldDivisionKey][promotion.team];
            }
            
            // 새 리그에 추가
            if (!gameData.leagueData[newDivisionKey]) {
                gameData.leagueData[newDivisionKey] = {};
            }
            gameData.leagueData[newDivisionKey][promotion.team] = {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
            
            // 3. 리그 테이블 업데이트
            removeFromLeagueTable(promotion.team, oldLeague);
            addToLeagueTable(promotion.team, newLeague);
            
            console.log(`✅ ${promotion.team}: ${oldLeague}부 → ${newLeague}부 승격 (모든 데이터 동기화 완료)`);
        }
    });
    
    // 강등 적용
    promotionRelegationData.relegations.forEach(relegation => {
        if (allTeams[relegation.team]) {
            const oldLeague = relegation.from;
            const newLeague = relegation.to;
            
            // 1. allTeams 업데이트
            allTeams[relegation.team].league = newLeague;
            
            // 2. gameData.leagueData 업데이트
            const oldDivisionKey = `division${oldLeague}`;
            const newDivisionKey = `division${newLeague}`;
            
            // 이전 리그에서 삭제
            if (gameData.leagueData[oldDivisionKey] && gameData.leagueData[oldDivisionKey][relegation.team]) {
                delete gameData.leagueData[oldDivisionKey][relegation.team];
            }
            
            // 새 리그에 추가
            if (!gameData.leagueData[newDivisionKey]) {
                gameData.leagueData[newDivisionKey] = {};
            }
            gameData.leagueData[newDivisionKey][relegation.team] = {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
            
            // 3. 리그 테이블 업데이트
            removeFromLeagueTable(relegation.team, oldLeague);
            addToLeagueTable(relegation.team, newLeague);
            
            console.log(`⬇️ ${relegation.team}: ${oldLeague}부 → ${newLeague}부 강등 (모든 데이터 동기화 완료)`);
        }
    });
    
    console.log('=== 승강제 적용 완료 ===');
}

// 추가 상금 계산 (리그별 차등)
function calculateAdditionalSeasonPrize(league, position) {
    const additionalPrizeTable = {
        1: {
            1: 500,  // 1부리그 우승 추가 상금
            2: 300,  // 준우승
            default: 0
        },
        2: {
            1: 300,  // 2부리그 우승 + 승격 보너스
            2: 200,  // 준우승 + 승격 보너스
            default: 0
        },
        3: {
            1: 200,  // 3부리그 우승 + 승격 보너스
            2: 100,  // 준우승 + 승격 보너스
            default: 0
        }
    };
    
    const leaguePrizes = additionalPrizeTable[league] || additionalPrizeTable[3];
    return leaguePrizes[position] || leaguePrizes.default;
}

// 다른 팀들의 승강제 현황 표시
function showOtherTeamsPromotionStatus(promotionRelegationData) {
    let message = '=== 승강제 현황 ===\n\n';
    
    if (promotionRelegationData.promotions.length > 0) {
        message += '승격 팀들:\n';
        promotionRelegationData.promotions.forEach(promo => {
            if (promo.team !== gameData.selectedTeam) {
                message += `- ${promo.team}: ${promo.reason}\n`;
            }
        });
        message += '\n';
    }
    
    if (promotionRelegationData.relegations.length > 0) {
        message += '강등 팀들:\n';
        promotionRelegationData.relegations.forEach(rel => {
            if (rel.team !== gameData.selectedTeam) {
                message += `- ${rel.team}: ${rel.reason}\n`;
            }
        });
        message += '\n';
    }
    
    if (promotionRelegationData.champions.length > 0) {
        message += '각 리그 우승팀:\n';
        promotionRelegationData.champions.forEach(champ => {
            message += `- ${champ.team}: ${champ.title}\n`;
        });
    }
    
    setTimeout(() => {
        alert(message);
    }, 2000); // 2초 후에 표시
}



// 디버깅용: 모든 리그 데이터 검증
function validateAllLeagueData() {
    console.log('=== 리그 데이터 검증 시작 ===');
    
    let hasError = false;
    const allTeamsInData = new Map();
    
    // 1. gameData.leagueData 검증
    for (let league = 1; league <= 3; league++) {
        const divisionKey = `division${league}`;
        if (gameData.leagueData[divisionKey]) {
            Object.keys(gameData.leagueData[divisionKey]).forEach(teamKey => {
                if (!allTeamsInData.has(teamKey)) {
                    allTeamsInData.set(teamKey, []);
                }
                allTeamsInData.get(teamKey).push(`gameData.${league}부`);
            });
        }
    }
    
    // 2. 리그 테이블 검증
    [
        { table: window.league1Table, name: 'league1Table', league: 1 },
        { table: window.league2Table, name: 'league2Table', league: 2 },
        { table: window.league3Table, name: 'league3Table', league: 3 }
    ].forEach(({ table, name, league }) => {
        if (table) {
            Object.keys(table).forEach(teamKey => {
                if (!allTeamsInData.has(teamKey)) {
                    allTeamsInData.set(teamKey, []);
                }
                allTeamsInData.get(teamKey).push(`${name}.${league}부`);
            });
        }
    });
    
    // 3. 중복 체크
    allTeamsInData.forEach((locations, teamKey) => {
        if (locations.length > 1) {
            console.error(`❌ ${teamKey}가 여러 곳에 존재: ${locations.join(', ')}`);
            hasError = true;
        }
        
        // 4. allTeams와 일치 여부 확인
        const actualLeague = allTeams[teamKey]?.league;
        if (actualLeague) {
            const shouldBeIn = `${actualLeague}부`;
            const isInCorrectPlace = locations.some(loc => loc.includes(shouldBeIn));
            
            if (!isInCorrectPlace) {
                console.error(`❌ ${teamKey}는 ${actualLeague}부리그에 있어야 하는데 ${locations.join(', ')}에 존재`);
                hasError = true;
            }
        }
    });
    
    if (!hasError) {
        console.log('✅ 모든 리그 데이터 검증 완료: 문제 없음');
    }
    
    console.log('=== 리그 데이터 검증 완료 ===');
    return !hasError;
}

// 전역으로 함수들 노출
window.endSeason = endSeason;
window.checkSeasonEnd = checkSeasonEnd;
window.calculatePromotionRelegationNew = calculatePromotionRelegationNew;
window.applyPromotionRelegationNew = applyPromotionRelegationNew;
window.removeFromLeagueTable = removeFromLeagueTable;  // ⭐ 추가
window.addToLeagueTable = addToLeagueTable;  // ⭐ 추가
window.validateAllLeagueData = validateAllLeagueData;  // ⭐ 추가