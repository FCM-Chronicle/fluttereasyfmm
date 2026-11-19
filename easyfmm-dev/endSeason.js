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
        console.log(`    ${teamKey}를 ${league}부 테이블에서 삭제`);
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
        console.log(`    ${teamKey}를 ${league}부 테이블에 추가`);
    }
}

// 시즌 종료 조건 체크
function checkSeasonEnd() {
    if (typeof LeagueManager !== 'undefined') {
        const uLId = LeagueManager.getLeagueIdByTeam(gameData.selectedTeam);
        const targetRounds = (typeof LEAGUES_CONFIG !== 'undefined' && LEAGUES_CONFIG[uLId]) ? LEAGUES_CONFIG[uLId].rounds : 38;
        const leagueTeams = LeagueManager.getTeamsInLeague(uLId);
        const uTable = (gameData.leagueData && gameData.leagueData[uLId]) ? gameData.leagueData[uLId] : (gameData.leagueData ? gameData.leagueData.division1 : null);
        if (!uTable) return;
        const allDone = leagueTeams.every(k => uTable[k] && uTable[k].matches >= targetRounds);
        if (!allDone) return;

        // EFL 챔피언십 3~6위 승격 플레이오프 진행 중이거나 시작해야 하는 경우
        if (uLId === 'efl_championship' && typeof EFLPlayoffManager !== 'undefined') {
            if (gameData.eflPlayoff && !gameData.eflPlayoff.completed) {
                if (typeof setNextOpponent === 'function') setNextOpponent();
                return;
            }
            if (!gameData.eflPlayoff) {
                const standings = getLeagueStandingsSorted('efl_championship');
                const rank = standings.findIndex(e => e.team === gameData.selectedTeam) + 1;
                if (rank >= 3 && rank <= 6) {
                    EFLPlayoffManager.init(standings);
                    const tName = (typeof teamNames !== 'undefined' && teamNames[gameData.selectedTeam]) ? teamNames[gameData.selectedTeam] : gameData.selectedTeam;
                    const poMsg = `🔥 [EFL 챔피언십 승격 플레이오프 진출!]\n${tName}이(가) 정규리그 ${rank}위를 기록하여 프리미어리그 승격 플레이오프(3~6위)에 진출했습니다!\n준결승(홈 & 어웨이)을 거쳐 웸블리 결승전에 도전하세요!`;
                    if (typeof mailManager !== 'undefined') {
                        mailManager.addMail('[플레이오프] EFL 챔피언십 승격 플레이오프 진출!', 'EFL 사무국', poMsg);
                    }
                    if (typeof alert === 'function') alert(poMsg);
                    if (typeof setNextOpponent === 'function') setNextOpponent();
                    return;
                }
            }
        }

        // 미국 MLS 컨퍼런스 상위 9팀 MLS컵 플레이오프 진행 중이거나 시작해야 하는 경우
        if (uLId === 'mls' && typeof MLSPlayoffManager !== 'undefined') {
            if (gameData.mlsPlayoff && !gameData.mlsPlayoff.completed) {
                if (typeof setNextOpponent === 'function') setNextOpponent();
                return;
            }
            if (!gameData.mlsPlayoff) {
                const overallStandings = getLeagueStandingsSorted('mls');
                const eastStandings = overallStandings.filter(e => LeagueManager.getMLSConference(e.team) === 'east');
                const westStandings = overallStandings.filter(e => LeagueManager.getMLSConference(e.team) === 'west');
                const userConf = LeagueManager.getMLSConference(gameData.selectedTeam);
                const confStandings = (userConf === 'east') ? eastStandings : westStandings;
                const confLabel = (userConf === 'east') ? '동부 컨퍼런스' : '서부 컨퍼런스';
                const confRank = confStandings.findIndex(e => e.team === gameData.selectedTeam) + 1;

                if (confRank >= 1 && confRank <= 9) {
                    const po = MLSPlayoffManager.init(eastStandings, westStandings, overallStandings);
                    const tName = (typeof teamNames !== 'undefined' && teamNames[gameData.selectedTeam]) ? teamNames[gameData.selectedTeam] : gameData.selectedTeam;
                    const stageIntro = (confRank >= 8)
                        ? `8~9위 와일드카드 단판 승부(연장 없이 무승부 시 승부차기)부터 시작합니다!`
                        : `플레이오프 1라운드(3판 2선승제)에 직행했습니다!`;
                    const shieldNote = (po && po.supportersShield === gameData.selectedTeam)
                        ? `\n🛡️ 아울러 정규리그 통합 1위 '서포터스 실드'를 차지했습니다!`
                        : '';
                    const poMsg = `🇺🇸 [MLS컵 플레이오프 진출!]\n${tName}이(가) ${confLabel} ${confRank}위로 포스트시즌에 진출했습니다!\n${stageIntro}${shieldNote}`;
                    if (typeof mailManager !== 'undefined') {
                        mailManager.addMail('[MLS] MLS컵 플레이오프 진출!', 'MLS 사무국', poMsg);
                    }
                    if (typeof alert === 'function') alert(poMsg);
                    if (typeof setNextOpponent === 'function') setNextOpponent();
                    return;
                }
            }
        }

        endSeason();
        return;
    }
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
    
    if (allTeamsFinished) {
        endSeason();
    }
}

function endSeason(silent = false) {
    // 1. 현재 리그 순위 및 기본 보상 계산
    const userLeagueId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(gameData.selectedTeam) : null;
    const divisionKey = `division${gameData.currentLeague}`;
    const currentLeagueData = (userLeagueId && gameData.leagueData && gameData.leagueData[userLeagueId])
        ? gameData.leagueData[userLeagueId]
        : (gameData.leagueData ? (gameData.leagueData[divisionKey] || gameData.leagueData.division1) : null);
    
    if (!currentLeagueData) {
        console.error('리그 데이터를 찾을 수 없습니다:', userLeagueId || divisionKey);
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
    
    // MLS 정규시즌 잔여 라운드 및 MLS컵 플레이오프 AI 완료 (타 리그 유저거나 유저 PO 미진출 시에도 우승팀 결정)
    if (typeof LeagueManager !== 'undefined' && typeof MLSPlayoffManager !== 'undefined' && gameData.leagueData && gameData.leagueData.mls) {
        simulateRemainingLeagueRounds('mls');
        const mlsOverall = getLeagueStandingsSorted('mls');
        const mlsEast = mlsOverall.filter(e => LeagueManager.getMLSConference(e.team) === 'east');
        const mlsWest = mlsOverall.filter(e => LeagueManager.getMLSConference(e.team) === 'west');
        MLSPlayoffManager.simulateAllAI(mlsEast, mlsWest, mlsOverall);
    }

    const userPosition = standings.findIndex(team => team.team === gameData.selectedTeam) + 1;
    let reward = 0;
    let achievement = '';
    let isMLSChampion = false;

    if (userLeagueId === 'mls') {
        const po = gameData.mlsPlayoff;
        const userConf = (typeof LeagueManager !== 'undefined') ? LeagueManager.getMLSConference(gameData.selectedTeam) : 'east';
        const confList = standings.filter(e => (typeof LeagueManager !== 'undefined' ? LeagueManager.getMLSConference(e.team) : 'east') === userConf);
        const confRank = confList.findIndex(e => e.team === gameData.selectedTeam) + 1;
        const confName = userConf === 'east' ? '동부' : '서부';

        if (po && po.champion === gameData.selectedTeam) {
            isMLSChampion = true;
            achievement = `MLS컵 우승 🏆 (${confName} ${confRank}위)`;
            reward = 1500;
            if (typeof managerSystem !== 'undefined' && gameData.managerId) {
                managerSystem.updateManagerStats(gameData.managerId, { trophy: true });
            }
        } else if (po && po.runnerUp === gameData.selectedTeam) {
            achievement = `MLS컵 준우승 🥈 (${confName} ${confRank}위)`;
            reward = 1200;
        } else if (confRank <= 7) {
            achievement = `플레이오프 본선 (${confName} ${confRank}위)`;
            reward = 850;
        } else if (confRank <= 9) {
            achievement = `플레이오프 와일드카드 (${confName} ${confRank}위)`;
            reward = 600;
        } else {
            achievement = `플레이오프 탈락 (${confName} ${confRank}위 · 승강제 없음)`;
            reward = 350;
        }

        if (po && po.supportersShield === gameData.selectedTeam) {
            reward += 300;
            achievement += ' + 🛡️ 서포터스 실드';
        }
    } else if (userPosition === 1) {
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

    // [신규] 통합 FA컵과의 더블(Double) 달성 체크
    let doubleMessage = '';
    const isFaCupChamp = (gameData.faCup && gameData.faCup.champion === gameData.selectedTeam);
    const isLeagueChampForDouble = (userLeagueId === 'mls') ? isMLSChampion : (userPosition === 1);
    if (isLeagueChampForDouble && isFaCupChamp && gameData.currentLeague === 1) {
        reward += 500;
        doubleMessage = '\n\n✨ [역사적인 더블(Double) 달성!]\n1부 리그와 통합 FA컵을 동시 제패했습니다! (더블 보너스 +500억원)';
        if (typeof mailManager !== 'undefined') {
            mailManager.addMail(
                `[신화] 1부리그 & FA컵 동시 석권! 시즌 더블(Double) 위업 달성!`,
                '리그 & FA컵 연맹',
                `위대한 감독님의 지도력 아래 구단이 한 시즌에 1부 리그 챔피언과 FA컵 챔피언을 동시에 거머쥐는 '더블(Double)' 신화를 완성했습니다!\n\n` +
                `- 1부리그 최종 우승\n- 통합 FA컵 최종 우승 (The Double)\n- 특별 축하 상금: +500억원 지급\n\n구단의 전설로 영원히 기억될 것입니다!`
            );
        }
    }
    
    gameData.teamMoney += reward;


    // 2. 발롱도르 (올해의 선수상 - 1부리그) 시상
    let potyMessage = '';
    let seasonPoty = null;
    // [수정] 전역 변수 접근 방식 변경 (안전하게 window 객체 사용)
    const recordsSys = window.leagueBasedRecordsSystem || window.recordsSystem;

    if (recordsSys) {
        const poty = recordsSys.getPlayerOfTheSeason();
        seasonPoty = poty;
        if (poty) {
            const isMyPlayer = poty.team === gameData.selectedTeam;
            const titles = [];
            if (poty.isUclChampion) titles.push('UCL 챔피언⭐');
            if (poty.isLeagueChampion) titles.push('리그 우승🏆');
            if (poty.isFaCupChampion) titles.push('FA컵 우승🏆');
            const champTag = titles.length > 0 ? ` · [${titles.join(' / ')}]` : '';
            const ratingTag = poty.avgRating ? `평점 ${poty.avgRating} · ` : '';
            potyMessage = `\n\n [발롱도르 (Ballon d'Or)]\n${poty.name} (${(typeof teamNames !== 'undefined' && teamNames[poty.team]) ? teamNames[poty.team] : poty.team})\n${ratingTag}${poty.goals || 0}골 ${poty.assists || 0}도움 · MOM ${poty.moms || 0}회${champTag}`;
            
            if (isMyPlayer) {
                potyMessage += "\n(우리 팀 선수가 발롱도르를 수상했습니다!)";
                // 메일 발송
                const titleDesc = titles.length > 0 ? `\n- 트로피 프리미엄: ${titles.join(', ')} 달성 반영` : '';
                mailManager.addMail(`[수상] ${poty.name} 발롱도르(올해의 선수) 수상!`, '세계 축구 연맹', `축하합니다!\n세계 최고의 선수를 가리는 발롱도르(Ballon d'Or)에서 ${poty.name} 선수가 영예의 수상자로 선정되었습니다.\n\n[시즌 기록]\n- 평균 평점: ${poty.avgRating || '-'}\n- 공격 포인트: ${poty.goals || 0}골 ${poty.assists || 0}도움 (MOM ${poty.moms || 0}회)${titleDesc}\n\n구단의 위상을 드높인 최고의 영예입니다.`);
            }
        }
    }

    // 3. 승강제 데이터 계산 (LeagueManager 잉글랜드 승강제 + 플레이오프 / 레거시 3부리그)
    let promotionRelegationData = null;
    let englandPromoRel = null;
    let userPromotionStatus = { status: 'stay' };
    let promotionMessage = '';

    if (typeof LeagueManager !== 'undefined' && typeof allTeams !== 'undefined') {
        // EFL 챔피언십이 아직 46R 미완료인 경우(예: EPL 38R 종료 시점) 남은 라운드 자동 진행
        simulateRemainingLeagueRounds('efl_championship');
        englandPromoRel = calculateEnglandPromotionRelegation(silent);
        if (englandPromoRel) {
            promotionRelegationData = englandPromoRel.legacyView;
            userPromotionStatus = englandPromoRel.userStatus;
            if (userPromotionStatus.status === 'promotion') {
                const promoBonus = 600;
                gameData.teamMoney += promoBonus;
                reward += promoBonus;
                promotionMessage = `\n\n🎉 축하합니다! 잉글랜드 프리미어리그 승격 확정! (${userPromotionStatus.reason}, 승격 지원금 +${promoBonus}억원)`;
            } else if (userPromotionStatus.status === 'relegation') {
                promotionMessage = `\n\n😢 아쉽게도 EFL 챔피언십으로 강등되었습니다... (${userPromotionStatus.reason})`;
            } else if (userLeagueId === 'efl_championship' && userPosition >= 3 && userPosition <= 6 && englandPromoRel.playoffChampion) {
                const poChampName = (typeof teamNames !== 'undefined' && teamNames[englandPromoRel.playoffChampion]) ? teamNames[englandPromoRel.playoffChampion] : englandPromoRel.playoffChampion;
                promotionMessage = `\n\n🔥 승격 플레이오프 최종 우승: ${poChampName} (다음 시즌 PL 합류)`;
            }
        }
    } else if (typeof LeagueManager === 'undefined' && typeof allTeams !== 'undefined' && Object.keys(allTeams).length > 19) {
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
        alert(`시즌 종료!\n최종 순위: ${userPosition}위 (${achievement})\n보상: ${reward}억원${promotionMessage}${doubleMessage}${potyMessage}`);
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
    
    if (englandPromoRel) {
        seasonResultData.champions = englandPromoRel.legacyView.champions;
        seasonResultData.promotions = englandPromoRel.legacyView.promotions;
        seasonResultData.relegations = englandPromoRel.legacyView.relegations;
        if (recordsSys && typeof LEAGUES_CONFIG !== 'undefined') {
            Object.keys(LEAGUES_CONFIG).forEach(lid => {
                const topScorer = recordsSys.getTopScorer(lid);
                const topAssister = recordsSys.getTopAssister(lid);
                if (topScorer) seasonResultData.topScorers.push(topScorer);
                if (topAssister) seasonResultData.topAssisters.push(topAssister);
            });
        }
    } else if (promotionRelegationData) {
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

    // 이번 시즌 NXGN 10대 유망주 BEST 10 선정
    let seasonNXGN = null;
    if (recordsSys && typeof recordsSys.generateNXGNTop10 === 'function') {
        seasonNXGN = recordsSys.generateNXGNTop10();
        const myNxgnPlayers = seasonNXGN.filter(p => p.team === gameData.selectedTeam);
        if (myNxgnPlayers.length > 0) {
            const bestNxgn = myNxgnPlayers[0];
            potyMessage += `\n\n [NXGN 세계 10대 유망주]\n우리 팀 ${bestNxgn.name} 선수가 세계 ${bestNxgn.rank}위에 선정되었습니다!`;
            if (typeof mailManager !== 'undefined') {
                const namesText = myNxgnPlayers.map(p => `- ${p.rank}위: ${p.name} (${p.position}, ${p.age}세)`).join('\n');
                mailManager.addMail(
                    `[NXGN] 우리 구단 유망주 ${bestNxgn.name} 외 TOP 10 선정!`,
                    'NXGN 글로벌 어워즈',
                    `축하합니다!\n전 세계 축구 전문가들이 선정한 이번 시즌 'NXGN 세계 10대 유망주 BEST 10'에 우리 구단 선수가 이름을 올렸습니다!\n\n[선정 명단]\n${namesText}\n\n구단의 유망주 육성 철학이 전 세계의 주목을 받고 있습니다.`
                );
            }
        }
    }

    // 승강제 및 AI 이적으로 팀/리그 소속이 바뀌기 전에 이번 시즌 기록 아카이빙
    if (recordsSys) {
        const currentYear = gameData.startYear || 2025;
        const seasonName = `${currentYear}/${currentYear + 1}`;
        recordsSys.archiveSeason(seasonName, seasonPoty, seasonNXGN);
    }

    // 7. 승강제 적용 (데이터 변경) -  딱 한 번만 실행 
    if (englandPromoRel) {
        applyEnglandPromotionRelegation(englandPromoRel);
        if (userPromotionStatus.status === 'promotion' || userPromotionStatus.status === 'relegation') {
            gameData.currentLeague = userPromotionStatus.newLeague;
        }
        if (typeof LeagueManager !== 'undefined') {
            LeagueManager.activeViewLeague = LeagueManager.getLeagueIdByTeam(gameData.selectedTeam);
        }
    } else if (promotionRelegationData) {
        applyPromotionRelegationNew(promotionRelegationData);
        
        // 사용자 리그 업데이트
        if (userPromotionStatus.status === 'promotion' || userPromotionStatus.status === 'relegation') {
            gameData.currentLeague = userPromotionStatus.newLeague;
        }
    }

    if (gameData.eflPlayoff) {
        gameData.lastPlayoffBracket = gameData.eflPlayoff;
    }
    if (gameData.mlsPlayoff) {
        gameData.lastMLSPlayoffBracket = gameData.mlsPlayoff;
    }
    gameData.eflPlayoff = null;
    gameData.mlsPlayoff = null;
    gameData.isPlayoffMatch = false;
    gameData.isMLSPlayoffMatch = false;
    gameData.playoffStage = null;

    // 8. 시즌 마무리 공통 로직
    if (typeof advancePlayerAges === 'function') {
        advancePlayerAges();
    }

    // [신규] 계약 만료 및 따박따박 재계약/FA 방출 처리
    if (typeof contractSystem !== 'undefined' && typeof contractSystem.processSeasonEndContracts === 'function') {
        contractSystem.processSeasonEndContracts();
    }

    if (typeof injurySystem !== 'undefined') {
        injurySystem.reset();
        console.log('시즌 종료: 모든 부상 선수가 회복되었습니다.');
    }

    if (typeof transferSystem !== 'undefined') {
        transferSystem.balanceAITeams();
    }

    if (recordsSys) {
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

    // [신규] 새 시즌 통합 FA컵 토너먼트 재구성
    if (typeof faCupManager !== 'undefined' && !gameData.isWorldCupMode) {
        faCupManager.initSeason();
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
            
            console.log(` ${promotion.team}: ${oldLeague}부 → ${newLeague}부 승격 (모든 데이터 동기화 완료)`);
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
            
            console.log(`⬇ ${relegation.team}: ${oldLeague}부 → ${newLeague}부 강등 (모든 데이터 동기화 완료)`);
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
    const labelOf = (k) => (typeof teamNames !== 'undefined' && teamNames[k]) ? teamNames[k] : k;
    
    if (promotionRelegationData.promotions.length > 0) {
        message += '승격 팀들:\n';
        promotionRelegationData.promotions.forEach(promo => {
            if (promo.team !== gameData.selectedTeam) {
                message += `- ${labelOf(promo.team)}: ${promo.reason}\n`;
            }
        });
        message += '\n';
    }
    
    if (promotionRelegationData.relegations.length > 0) {
        message += '강등 팀들:\n';
        promotionRelegationData.relegations.forEach(rel => {
            if (rel.team !== gameData.selectedTeam) {
                message += `- ${labelOf(rel.team)}: ${rel.reason}\n`;
            }
        });
        message += '\n';
    }
    
    if (promotionRelegationData.champions.length > 0) {
        message += '각 리그 우승팀:\n';
        promotionRelegationData.champions.forEach(champ => {
            message += `- ${labelOf(champ.team)}: ${champ.title}\n`;
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
            console.error(` ${teamKey}가 여러 곳에 존재: ${locations.join(', ')}`);
            hasError = true;
        }
        
        // 4. allTeams와 일치 여부 확인
        const actualLeague = allTeams[teamKey]?.league;
        if (actualLeague) {
            const shouldBeIn = `${actualLeague}부`;
            const isInCorrectPlace = locations.some(loc => loc.includes(shouldBeIn));
            
            if (!isInCorrectPlace) {
                console.error(` ${teamKey}는 ${actualLeague}부리그에 있어야 하는데 ${locations.join(', ')}에 존재`);
                hasError = true;
            }
        }
    });
    
    if (!hasError) {
        console.log('모든 리그 데이터 검증 완료: 문제 없음');
    }
    
    console.log('=== 리그 데이터 검증 완료 ===');
    return !hasError;
}

// === 잉글랜드 승강제 및 EFL 챔피언십 플레이오프 시스템 ===

function getLeagueStandingsSorted(leagueId) {
    const table = (gameData && gameData.leagueData && gameData.leagueData[leagueId]) ? gameData.leagueData[leagueId] : {};
    const teamKeys = (typeof LeagueManager !== 'undefined') ? LeagueManager.getTeamsInLeague(leagueId) : Object.keys(table);
    return teamKeys.map(k => {
        const s = table[k] || { matches: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
        return {
            team: k,
            ...s,
            goalDiff: (s.goalsFor || 0) - (s.goalsAgainst || 0)
        };
    }).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return (b.wins || 0) - (a.wins || 0);
    });
}

function simulateRemainingLeagueRounds(leagueId) {
    if (typeof LeagueManager === 'undefined' || !gameData || !gameData.schedule || !gameData.schedule[leagueId]) return;
    const sched = gameData.schedule[leagueId];
    const table = (gameData.leagueData && gameData.leagueData[leagueId]) ? gameData.leagueData[leagueId] : null;
    if (!table) return;

    const leagueTeams = LeagueManager.getTeamsInLeague(leagueId);
    if (leagueTeams.length === 0) return;

    const minMatches = Math.min(...leagueTeams.map(k => (table[k] && table[k].matches) || 0));
    const targetRounds = sched.length;
    if (minMatches >= targetRounds) return;

    for (let r = minMatches + 1; r <= targetRounds; r++) {
        LeagueManager.simulateAllLeaguesRound(r, leagueId);
    }
}

const EFLPlayoffManager = {
    getTeamRating(teamKey) {
        if (typeof cupCompetitionManager !== 'undefined' && typeof cupCompetitionManager.getTeamRating === 'function') {
            return cupCompetitionManager.getTeamRating(teamKey);
        }
        const sq = (typeof teams !== 'undefined' && teams[teamKey]) ? teams[teamKey]
            : ((typeof allTeams !== 'undefined' && allTeams[teamKey]) ? allTeams[teamKey].players : []);
        if (!sq || sq.length === 0) return 70;
        const sorted = [...sq].sort((a, b) => (b.rating || 70) - (a.rating || 70)).slice(0, 11);
        return sorted.reduce((acc, p) => acc + (p.rating || 70), 0) / sorted.length;
    },

    simulateMatchAI(homeKey, awayKey, allowDraw = false) {
        const rHome = this.getTeamRating(homeKey);
        const rAway = this.getTeamRating(awayKey);
        const diff = (rHome - rAway) / 10;
        let hg = Math.max(0, Math.min(5, Math.round((Math.random() * 2.2) + diff * 0.45 + 0.15)));
        let ag = Math.max(0, Math.min(5, Math.round((Math.random() * 2.1) - diff * 0.4)));
        let pk = null;
        let winner = null;
        if (!allowDraw && hg === ag) {
            const pkRes = this.rollPenaltyShootout(homeKey, awayKey);
            winner = pkRes.winner;
            pk = pkRes.pkText;
        } else if (hg > ag) {
            winner = homeKey;
        } else if (ag > hg) {
            winner = awayKey;
        }
        return { home: homeKey, away: awayKey, homeGoals: hg, awayGoals: ag, score: `${hg}-${ag}`, pk, winner };
    },

    rollPenaltyShootout(teamA, teamB) {
        let pkA = 0, pkB = 0;
        for (let i = 0; i < 5; i++) {
            if (Math.random() < 0.75) pkA++;
            if (Math.random() < 0.75) pkB++;
        }
        while (pkA === pkB) {
            if (Math.random() < 0.75) pkA++;
            if (Math.random() < 0.75) pkB++;
        }
        const winner = pkA > pkB ? teamA : teamB;
        return { pkA, pkB, winner, pkText: `PK ${pkA}-${pkB}` };
    },

    init(standings) {
        if (!standings || standings.length < 6) return null;
        const s3 = standings[2].team;
        const s4 = standings[3].team;
        const s5 = standings[4].team;
        const s6 = standings[5].team;
        gameData.eflPlayoff = {
            season: gameData.startYear || 2025,
            stage: 'SF_LEG1',
            completed: false,
            champion: null,
            runnerUp: null,
            seeds: [s3, s4, s5, s6],
            sf1: { high: s3, low: s6, highRank: 3, lowRank: 6, leg1: null, leg2: null, winner: null, pk: null },
            sf2: { high: s4, low: s5, highRank: 4, lowRank: 5, leg1: null, leg2: null, winner: null, pk: null },
            final: { home: null, away: null, homeGoals: 0, awayGoals: 0, score: null, winner: null, pk: null }
        };
        return gameData.eflPlayoff;
    },

    checkAndSetupMatch() {
        const po = gameData ? gameData.eflPlayoff : null;
        const userTeam = gameData ? gameData.selectedTeam : null;
        if (!po || po.completed || !userTeam) {
            if (gameData) {
                gameData.isPlayoffMatch = false;
                gameData.playoffStage = null;
            }
            return false;
        }

        const setMatch = (home, away, stage) => {
            gameData.isPlayoffMatch = true;
            gameData.isFACupMatch = false;
            gameData.isUCLMatch = false;
            gameData.playoffStage = stage;
            gameData.currentOpponent = (home === userTeam) ? away : home;
            gameData.isHomeGame = (home === userTeam);
            return true;
        };

        if (po.stage === 'SF_LEG1') {
            for (const tie of [po.sf1, po.sf2]) {
                if (!tie.leg1 && (tie.high === userTeam || tie.low === userTeam)) {
                    return setMatch(tie.low, tie.high, 'SF_LEG1'); // 하위 시드 홈에서 1차전
                }
            }
        } else if (po.stage === 'SF_LEG2') {
            for (const tie of [po.sf1, po.sf2]) {
                if (!tie.leg2 && (tie.high === userTeam || tie.low === userTeam)) {
                    return setMatch(tie.high, tie.low, 'SF_LEG2'); // 상위 시드 홈에서 2차전
                }
            }
        } else if (po.stage === 'FINAL' && po.final && !po.final.winner) {
            if (po.final.home === userTeam || po.final.away === userTeam) {
                return setMatch(po.final.home, po.final.away, 'FINAL');
            }
        }

        gameData.isPlayoffMatch = false;
        return false;
    },

    resolveTieWinner(tie) {
        if (!tie.leg1 || !tie.leg2) return null;
        // 1차전: low(home) vs high(away), 2차전: high(home) vs low(away)
        const aggHigh = tie.leg1.awayGoals + tie.leg2.homeGoals;
        const aggLow = tie.leg1.homeGoals + tie.leg2.awayGoals;
        tie.aggHigh = aggHigh;
        tie.aggLow = aggLow;
        if (aggHigh > aggLow) {
            tie.winner = tie.high;
        } else if (aggLow > aggHigh) {
            tie.winner = tie.low;
        } else {
            const pkRes = this.rollPenaltyShootout(tie.high, tie.low);
            tie.winner = pkRes.winner;
            tie.pk = pkRes.pkText;
        }
        return tie.winner;
    },

    simulateRemainingAI() {
        const po = gameData ? gameData.eflPlayoff : null;
        if (!po) return null;
        [po.sf1, po.sf2].forEach(tie => {
            if (!tie.leg1) tie.leg1 = this.simulateMatchAI(tie.low, tie.high, true);
            if (!tie.leg2) tie.leg2 = this.simulateMatchAI(tie.high, tie.low, true);
            if (!tie.winner) this.resolveTieWinner(tie);
        });
        if (!po.final.home) {
            po.final.home = po.sf1.winner;
            po.final.away = po.sf2.winner;
        }
        if (!po.final.winner) {
            const fRes = this.simulateMatchAI(po.final.home, po.final.away, false);
            po.final = { ...fRes };
        }
        po.stage = 'DONE';
        po.completed = true;
        po.champion = po.final.winner;
        po.runnerUp = (po.final.winner === po.final.home) ? po.final.away : po.final.home;
        return po;
    },

    handleUserMatchEnd(matchData, silent = false) {
        const po = gameData ? gameData.eflPlayoff : null;
        const userTeam = gameData ? gameData.selectedTeam : null;
        if (!po || !userTeam) return;

        const homeGoals = matchData.homeScore;
        const awayGoals = matchData.awayScore;
        const legResult = {
            home: matchData.homeTeam,
            away: matchData.awayTeam,
            homeGoals,
            awayGoals,
            score: `${homeGoals}-${awayGoals}`
        };
        const tLabel = (k) => (typeof teamNames !== 'undefined' && teamNames[k]) ? teamNames[k] : k;

        if (po.stage === 'SF_LEG1') {
            const userTie = (po.sf1.high === userTeam || po.sf1.low === userTeam) ? po.sf1 : po.sf2;
            const otherTie = (userTie === po.sf1) ? po.sf2 : po.sf1;
            userTie.leg1 = legResult;
            if (!otherTie.leg1) otherTie.leg1 = this.simulateMatchAI(otherTie.low, otherTie.high, true);
            po.stage = 'SF_LEG2';

            const msg = `[플레이오프 준결승 1차전 종료] ${tLabel(legResult.home)} ${homeGoals} - ${awayGoals} ${tLabel(legResult.away)}\n이제 2차전이 진행됩니다!`;
            if (!silent && typeof alert === 'function') alert(msg);
        } else if (po.stage === 'SF_LEG2') {
            const userTie = (po.sf1.high === userTeam || po.sf1.low === userTeam) ? po.sf1 : po.sf2;
            const otherTie = (userTie === po.sf1) ? po.sf2 : po.sf1;
            userTie.leg2 = legResult;
            if (!otherTie.leg2) otherTie.leg2 = this.simulateMatchAI(otherTie.high, otherTie.low, true);

            const uWinner = this.resolveTieWinner(userTie);
            this.resolveTieWinner(otherTie);

            po.final.home = po.sf1.winner;
            po.final.away = po.sf2.winner;

            if (uWinner === userTeam) {
                po.stage = 'FINAL';
                const pkInfo = userTie.pk ? ` (${userTie.pk})` : '';
                const msg = `🔥 [결승 진출!] 준결승 합계 ${userTie.aggHigh}:${userTie.aggLow}${pkInfo}로 웸블리 플레이오프 결승전에 진출했습니다!\n결승 상대: ${tLabel(userTie === po.sf1 ? po.sf2.winner : po.sf1.winner)}`;
                if (typeof mailManager !== 'undefined') mailManager.addMail('[플레이오프] 웸블리 결승 진출!', 'EFL 사무국', msg);
                if (!silent && typeof alert === 'function') alert(msg);
            } else {
                // 유저 준결승 탈락 -> 결승전 AI 시뮬레이션 후 플레이오프 완료
                this.simulateRemainingAI();
                const msg = `😢 [플레이오프 준결승 탈락] 합계 ${userTie.aggHigh}:${userTie.aggLow}${userTie.pk ? ` (${userTie.pk})` : ''}로 결승 진출에 실패했습니다.\n(결승 우승: ${tLabel(po.champion)})`;
                if (typeof mailManager !== 'undefined') mailManager.addMail('[플레이오프] 준결승 탈락', 'EFL 사무국', msg);
                if (!silent && typeof alert === 'function') alert(msg);
            }
        } else if (po.stage === 'FINAL') {
            let winner = (homeGoals > awayGoals) ? matchData.homeTeam : (awayGoals > homeGoals ? matchData.awayTeam : null);
            let pk = null;
            if (!winner) {
                const pkRes = this.rollPenaltyShootout(matchData.homeTeam, matchData.awayTeam);
                winner = pkRes.winner;
                pk = pkRes.pkText;
            }
            po.final = { ...legResult, winner, pk };
            po.stage = 'DONE';
            po.completed = true;
            po.champion = winner;
            po.runnerUp = (winner === matchData.homeTeam) ? matchData.awayTeam : matchData.homeTeam;

            const pkInfo = pk ? ` (${pk})` : '';
            if (winner === userTeam) {
                const msg = `🏆 [프리미어리그 승격 확정!!] 웸블리 플레이오프 결승에서 ${tLabel(legResult.home)} ${homeGoals}-${awayGoals} ${tLabel(legResult.away)}${pkInfo} 승리를 거두며 다음 시즌 잉글랜드 프리미어리그에 승격합니다!`;
                if (typeof mailManager !== 'undefined') mailManager.addMail('🏆 [승격 확정] 웸블리 플레이오프 우승 · PL 승격!', 'EFL & 프리미어리그', msg);
                if (!silent && typeof alert === 'function') alert(msg);
            } else {
                const msg = `😢 [플레이오프 결승 패배] ${tLabel(legResult.home)} ${homeGoals}-${awayGoals} ${tLabel(legResult.away)}${pkInfo}로 아쉽게 준우승에 머물렀습니다. (${tLabel(winner)} 승격)`;
                if (typeof mailManager !== 'undefined') mailManager.addMail('[플레이오프] 결승전 아쉽게 패배', 'EFL 사무국', msg);
                if (!silent && typeof alert === 'function') alert(msg);
            }
        }
        gameData.isPlayoffMatch = false;
        gameData.playoffStage = null;
    },

    simulateAllAI(standings) {
        if (!gameData.eflPlayoff) {
            this.init(standings);
        }
        if (gameData.eflPlayoff && !gameData.eflPlayoff.completed) {
            return this.simulateRemainingAI();
        }
        return gameData.eflPlayoff;
    }
};

function calculateEnglandPromotionRelegation() {
    if (typeof LeagueManager === 'undefined' || !gameData || !gameData.leagueData) return null;
    if (!gameData.leagueData.premier_league || !gameData.leagueData.efl_championship) return null;

    const plStandings = getLeagueStandingsSorted('premier_league');
    const champStandings = getLeagueStandingsSorted('efl_championship');
    if (plStandings.length < 20 || champStandings.length < 6) return null;

    const poResult = EFLPlayoffManager.simulateAllAI(champStandings);
    const autoPromoted = [champStandings[0].team, champStandings[1].team];
    const poWinner = poResult ? poResult.champion : champStandings[2].team;
    const promotedFromChamp = [...autoPromoted];
    if (poWinner && !promotedFromChamp.includes(poWinner)) promotedFromChamp.push(poWinner);

    const relegatedFromPL = plStandings.slice(-3).map(e => e.team);

    const promotions = promotedFromChamp.map((team, idx) => ({
        team,
        fromLeague: 2,
        toLeague: 1,
        fromLeagueId: 'efl_championship',
        toLeagueId: 'premier_league',
        reason: idx < 2 ? `EFL 챔피언십 ${idx + 1}위 자동 승격` : 'EFL 챔피언십 승격 플레이오프 우승'
    }));

    const relegations = relegatedFromPL.map((team, idx) => ({
        team,
        fromLeague: 1,
        toLeague: 2,
        fromLeagueId: 'premier_league',
        toLeagueId: 'efl_championship',
        reason: `프리미어리그 ${18 + idx}위 강등`
    }));

    const champions = [];
    if (typeof LEAGUES_CONFIG !== 'undefined') {
        Object.keys(LEAGUES_CONFIG).forEach(lid => {
            const st = getLeagueStandingsSorted(lid);
            if (lid === 'mls' && gameData.mlsPlayoff && gameData.mlsPlayoff.champion) {
                const champKey = gameData.mlsPlayoff.champion;
                const champEntry = st.find(e => e.team === champKey);
                champions.push({
                    team: champKey,
                    league: LEAGUES_CONFIG[lid].tier || 1,
                    leagueId: lid,
                    points: champEntry ? champEntry.points : 0,
                    title: '미국 MLS컵 우승'
                });
            } else if (st.length > 0) {
                champions.push({
                    team: st[0].team,
                    league: LEAGUES_CONFIG[lid].tier || 1,
                    leagueId: lid,
                    points: st[0].points || 0,
                    title: `${LEAGUES_CONFIG[lid].name} 우승`
                });
            }
        });
    }

    const userTeam = gameData.selectedTeam;
    let userStatus = { status: 'stay' };
    const uPromo = promotions.find(p => p.team === userTeam);
    const uRel = relegations.find(r => r.team === userTeam);
    if (uPromo) {
        userStatus = { status: 'promotion', newLeague: 1, newLeagueId: 'premier_league', reason: uPromo.reason };
    } else if (uRel) {
        userStatus = { status: 'relegation', newLeague: 2, newLeagueId: 'efl_championship', reason: uRel.reason };
    }

    return {
        promotedFromChamp,
        relegatedFromPL,
        playoffChampion: poWinner,
        userStatus,
        legacyView: { promotions, relegations, champions }
    };
}

function applyEnglandPromotionRelegation(data) {
    if (!data || typeof allTeams === 'undefined') return;
    data.promotedFromChamp.forEach(teamKey => {
        if (allTeams[teamKey]) {
            allTeams[teamKey].leagueId = 'premier_league';
            allTeams[teamKey].league = 1;
        }
    });
    data.relegatedFromPL.forEach(teamKey => {
        if (allTeams[teamKey]) {
            allTeams[teamKey].leagueId = 'efl_championship';
            allTeams[teamKey].league = 2;
        }
    });
}

function renderEFLPlayoffBracketCard(standings) {
    const po = (typeof gameData !== 'undefined') ? (gameData.eflPlayoff || gameData.lastPlayoffBracket) : null;
    if (!standings || standings.length < 6) return null;

    const tName = (k) => !k ? '?' : ((typeof teamNames !== 'undefined' && teamNames[k]) ? teamNames[k] : k);
    const card = document.createElement('div');
    card.style.cssText = 'margin-top: 14px; padding: 14px 16px; border-radius: 12px; background: linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.88)); border: 1px solid rgba(251,191,36,0.35);';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 800; font-size: 0.96rem; color: #FBBF24; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;';
    if (po) {
        const statusText = po.completed ? `우승: ${tName(po.champion)} 🔺` : `진행 중 (${po.stage === 'FINAL' ? '웸블리 결승' : (po.stage === 'SF_LEG2' ? '준결승 2차전' : '준결승 1차전')})`;
        title.innerHTML = `<span>🔥 EFL 챔피언십 승격 플레이오프 대진표</span><span style="font-size:0.8rem; color:#34D399;">${statusText}</span>`;
    } else {
        title.innerHTML = `<span>🔥 EFL 챔피언십 승격 플레이오프 예상 대진 (현재 3~6위)</span><span style="font-size:0.78rem; color:#94A3B8;">46R 종료 후 진행</span>`;
    }
    card.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; font-size: 0.84rem; color: #E2E8F0;';

    if (po && po.sf1 && po.sf2) {
        const formatSF = (label, tie) => {
            const l1 = tie.leg1 ? `1차전 ${tie.leg1.score}` : '1차전 예정';
            const l2 = tie.leg2 ? `2차전 ${tie.leg2.score}` : '2차전 예정';
            const agg = (tie.leg1 && tie.leg2) ? ` · 합계 ${tie.aggHigh}:${tie.aggLow}${tie.pk ? ` (${tie.pk})` : ''}` : '';
            const win = tie.winner ? `<div style="color:#34D399; font-weight:700; margin-top:4px;">진출: ${tName(tie.winner)}</div>` : '';
            return `<div style="background:rgba(15,23,42,0.7); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                <div style="color:#94A3B8; font-size:0.75rem; margin-bottom:4px;">${label}</div>
                <div style="font-weight:700;">${tie.highRank}위 ${tName(tie.high)} vs ${tie.lowRank}위 ${tName(tie.low)}</div>
                <div style="color:#CBD5E1; font-size:0.78rem; margin-top:4px;">${l1} / ${l2}${agg}</div>${win}</div>`;
        };
        const finalHome = po.final && po.final.home ? tName(po.final.home) : 'SF1 승자';
        const finalAway = po.final && po.final.away ? tName(po.final.away) : 'SF2 승자';
        const finalScore = (po.final && po.final.score) ? `${po.final.score}${po.final.pk ? ` (${po.final.pk})` : ''}` : '단판 결승 (웸블리)';
        const finalWin = (po.final && po.final.winner) ? `<div style="color:#FBBF24; font-weight:800; margin-top:4px;">🏆 PL 승격: ${tName(po.final.winner)}</div>` : '';
        grid.innerHTML = formatSF('준결승 1 (3위 vs 6위)', po.sf1)
            + formatSF('준결승 2 (4위 vs 5위)', po.sf2)
            + `<div style="background:rgba(251,191,36,0.08); padding:10px; border-radius:8px; border:1px solid rgba(251,191,36,0.3);">
                <div style="color:#FBBF24; font-size:0.75rem; margin-bottom:4px;">웸블리 결승전</div>
                <div style="font-weight:700;">${finalHome} vs ${finalAway}</div>
                <div style="color:#CBD5E1; font-size:0.78rem; margin-top:4px;">${finalScore}</div>${finalWin}</div>`;
    } else {
        const s3 = tName(standings[2].team), s4 = tName(standings[3].team), s5 = tName(standings[4].team), s6 = tName(standings[5].team);
        grid.innerHTML = `
            <div style="background:rgba(15,23,42,0.7); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                <div style="color:#94A3B8; font-size:0.75rem;">준결승 1 (홈 & 어웨이)</div>
                <div style="font-weight:700; margin-top:4px;">3위 ${s3} vs 6위 ${s6}</div>
            </div>
            <div style="background:rgba(15,23,42,0.7); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
                <div style="color:#94A3B8; font-size:0.75rem;">준결승 2 (홈 & 어웨이)</div>
                <div style="font-weight:700; margin-top:4px;">4위 ${s4} vs 5위 ${s5}</div>
            </div>
            <div style="background:rgba(251,191,36,0.08); padding:10px; border-radius:8px; border:1px solid rgba(251,191,36,0.3);">
                <div style="color:#FBBF24; font-size:0.75rem;">웸블리 결승전</div>
                <div style="font-weight:700; margin-top:4px;">승자 간 단판 → PL 승격</div>
            </div>`;
    }
    card.appendChild(grid);
    return card;
}

// 전역으로 함수들 노출
window.endSeason = endSeason;
window.checkSeasonEnd = checkSeasonEnd;
window.calculatePromotionRelegationNew = calculatePromotionRelegationNew;
window.applyPromotionRelegationNew = applyPromotionRelegationNew;
window.removeFromLeagueTable = removeFromLeagueTable;  //  추가
window.addToLeagueTable = addToLeagueTable;  //  추가
window.validateAllLeagueData = validateAllLeagueData;  //  추가
window.EFLPlayoffManager = EFLPlayoffManager;
window.getLeagueStandingsSorted = getLeagueStandingsSorted;
window.simulateRemainingLeagueRounds = simulateRemainingLeagueRounds;
window.calculateEnglandPromotionRelegation = calculateEnglandPromotionRelegation;
window.applyEnglandPromotionRelegation = applyEnglandPromotionRelegation;
window.renderEFLPlayoffBracketCard = renderEFLPlayoffBracketCard;
