// records.js
// 개인기록 시스템 구현
// gameData, teams, teamNames, allTeams 객체가 이미 정의되어 있다고 가정    
// 개인기록 시스템 (리그별)
class RecordsSystem {
    constructor() {
        this.playerStats = new Map();
        this.matchRecords = [];
        this.initialized = false;
        this.weeklyRatings = []; // [수정] 초기화 추가
        this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] }; // [수정] 4부(월드컵) 포함 초기화
        this.lastSimulatedRound = 0; // [신규] 중복 시뮬레이션 방지용 변수
    }

    initialize() {
        if (this.initialized) return;

        Object.keys(teams).forEach(teamKey => {
            teams[teamKey].forEach(player => {
                this.initializePlayer(player.name, teamKey, player.position);
            });
        });
        
        this.weeklyRatings = []; // 이번 주(라운드) 모든 선수 평점 저장
        this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] }; // [수정] 4부 포함

        this.initialized = true;
        console.log('개인기록 시스템이 초기화되었습니다.');
    }

    initializePlayer(playerName, teamKey, position) {
        if (!this.playerStats.has(playerName)) {
            this.playerStats.set(playerName, {
                name: playerName,
                team: teamKey,
                position: position,
                goals: 0,
                assists: 0,
                matches: 0,
                moms: 0, // MOM 횟수 추가
                totw: 0 // 라운드 베스트 11 선정 횟수 추가
            });
        }
    }

    addGoal(scorerName, assisterName = null, teamKey) {
        if (this.playerStats.has(scorerName)) {
            const scorerStats = this.playerStats.get(scorerName);
            scorerStats.goals++;
        } else {
            const player = this.findPlayerByName(scorerName, teamKey);
            if (player) {
                this.initializePlayer(scorerName, teamKey, player.position);
                const scorerStats = this.playerStats.get(scorerName);
                if (scorerStats) scorerStats.goals++;
            }
        }

        if (assisterName && this.playerStats.has(assisterName)) {
            const assisterStats = this.playerStats.get(assisterName);
            assisterStats.assists++;
        } else if (assisterName) {
            const player = this.findPlayerByName(assisterName, teamKey);
            if (player) {
                this.initializePlayer(assisterName, teamKey, player.position);
                const assisterStats = this.playerStats.get(assisterName);
                if (assisterStats) assisterStats.assists++;
            }
        }
    }

    addMatchAppearance(playerName, teamKey) {
        if (this.playerStats.has(playerName)) {
            const playerStats = this.playerStats.get(playerName);
            playerStats.matches++;
        } else {
            const player = this.findPlayerByName(playerName, teamKey);
            if (player) {
                this.initializePlayer(playerName, teamKey, player.position);
                const playerStats = this.playerStats.get(playerName);
                if (playerStats) playerStats.matches++;
            }
        }
    }

    findPlayerByName(playerName, teamKey) {
        if (teams[teamKey]) {
            return teams[teamKey].find(p => p.name === playerName);
        }

        for (const [key, teamPlayers] of Object.entries(teams)) {
            const player = teamPlayers.find(p => p.name === playerName);
            if (player) return player;
        }

        return null;
    }

    getTopScorers(limit = 5) {
        const scorers = Array.from(this.playerStats.values())
            .filter(player => player.goals > 0)
            .sort((a, b) => {
                if (b.goals !== a.goals) return b.goals - a.goals;
                return b.assists - a.assists;
            })
            .slice(0, limit);

        return scorers;
    }

    getTopAssisters(limit = 5) {
        const assisters = Array.from(this.playerStats.values())
            .filter(player => player.assists > 0)
            .sort((a, b) => {
                if (b.assists !== a.assists) return b.assists - a.assists;
                return b.goals - a.goals;
            })
            .slice(0, limit);

        return assisters;
    }

    // MOM 순위 가져오기
    getTopMOMs(limit = 5) {
        const moms = Array.from(this.playerStats.values())
            .filter(player => player.moms > 0)
            .sort((a, b) => {
                if (b.moms !== a.moms) return b.moms - a.moms;
                return b.goals - a.goals; // 동점 시 득점 순
            })
            .slice(0, limit);
        return moms;
    }

   recordUserMatchStats(matchEventsOrData) {
    this.addMatchAppearancesForUserTeam();

    // matchData 전체가 넘어올 경우 대비
    const matchEvents = Array.isArray(matchEventsOrData) 
        ? matchEventsOrData 
        : (matchEventsOrData?.events || []);

    matchEvents.forEach(event => {
        if (event.type === 'goal') {
            const teamKey = event.teamKey
                || (event.team === teamNames[gameData.selectedTeam] ? gameData.selectedTeam : gameData.currentOpponent);
            this.addGoal(event.scorer, event.assister, teamKey);
        }
    });

    this.simulateAllLeaguesMatches();
    
    // 라운드 종료 후 베스트 11 선정
    this.generateTeamOfTheWeek();
    
    this.updateRecordsDisplay();
}

    simulateAllLeaguesMatches() {
        // [신규] 중복 실행 방지 체크
        if (this.lastSimulatedRound === gameData.currentRound) {
            console.log(`⚠️ [Records] ${gameData.currentRound}라운드 AI 경기는 이미 시뮬레이션 되었습니다. 스킵합니다.`);
            return;
        }
        this.lastSimulatedRound = gameData.currentRound;

        console.log(`=== ${gameData.currentRound}라운드 AI 경기 시뮬레이션 ===`);
        
        // [수정] 현재 리그가 4부(월드컵)라면 4부까지, 아니면 3부까지 시뮬레이션
        const maxLeague = gameData.currentLeague === 4 ? 4 : 3;
        for (let league = 1; league <= maxLeague; league++) {
            const divisionKey = `division${league}`;
            const leagueSchedule = gameData.schedule[divisionKey];
            
            if (!leagueSchedule || gameData.currentRound > leagueSchedule.length) continue;
            
            const currentRoundMatches = leagueSchedule[gameData.currentRound - 1];
            
            console.log(`\n--- ${league}부리그 ---`);
            
            currentRoundMatches.forEach(match => {
                // 유저 경기는 이미 진행되었으므로 스킵
                if (match.home === gameData.selectedTeam || match.away === gameData.selectedTeam) return;

                const matchResult = this.simulateSingleAIMatch(match.home, match.away);
                this.matchRecords.push(matchResult);
                this.maybePostAIMatchToSNS(matchResult);

                console.log(`${match.home} ${matchResult.score1} - ${matchResult.score2} ${match.away}`);
            });
        }
        console.log('========================');
    }

  simulateSingleAIMatch(team1Key, team2Key) {
    const team1Rating = this.calculateAITeamRating(team1Key);
    const team2Rating = this.calculateAITeamRating(team2Key);
    const ratingDiff = team1Rating - team2Rating;
    // [수정] 이변 확률 감소 (8% -> 3%) : 강팀이 너무 자주 지는 현상 방지
    const upsetChance = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 0.02 : 0.03;
    const upsetOccurs = Math.random() < upsetChance;
    let team1WinChance = 0.375;
    let team2WinChance = 0.375;
    let drawChance = 0.25;

    // 전술 상성 반영
    if (typeof TacticSystem !== 'undefined') {
        const ts = new TacticSystem();
        const t1Tactic = ts.getOpponentTactic(team1Key);
        const t2Tactic = ts.getOpponentTactic(team2Key);
        const matchup = ts.getTacticMatchup(t1Tactic, t2Tactic);
        
        if (matchup.advantage > 0) {
            team1WinChance += 0.05;
            team2WinChance -= 0.03;
            drawChance -= 0.02;
        } else if (matchup.advantage < 0) {
            team1WinChance -= 0.03;
            team2WinChance += 0.05;
            drawChance -= 0.02;
        }
    }

    // [수정] 전력 차이 반영 비중 확대 (150 -> 100) : 전력 차이가 승패에 더 큰 영향을 주도록 변경
    const powerDivisor = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 50 : 100;
    const maxAdvantage = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 0.45 : 0.4;

    if (ratingDiff > 0) {
        const advantage = Math.min(maxAdvantage, ratingDiff / powerDivisor);
        team1WinChance += advantage;
        team2WinChance -= advantage * 0.7;
        drawChance -= advantage * 0.3;

        if (upsetOccurs) {
            const upsetBonus = 0.15 + (Math.random() * 0.15);
            team2WinChance += upsetBonus;
            team1WinChance -= upsetBonus * 0.6;
            drawChance -= upsetBonus * 0.4;
        }
    } else if (ratingDiff < 0) {
        const advantage = Math.min(maxAdvantage, Math.abs(ratingDiff) / (powerDivisor * 0.66)); // 약팀이 이길 확률은 더 낮게 보정
        team2WinChance += advantage;
        team1WinChance -= advantage * 0.7;
        drawChance -= advantage * 0.3;

        if (upsetOccurs) {
            const upsetBonus = 0.15 + (Math.random() * 0.15);
            team1WinChance += upsetBonus;
            team2WinChance -= upsetBonus * 0.6;
            drawChance -= upsetBonus * 0.4;
        }
    }

    team1WinChance = Math.max(0.05, team1WinChance);
    team2WinChance = Math.max(0.05, team2WinChance);
    drawChance = Math.max(0.05, drawChance);
    const total = team1WinChance + team2WinChance + drawChance;
    team1WinChance /= total;
    team2WinChance /= total;
    drawChance /= total;
    const resultRoll = Math.random();
    let score1, score2;

    if (resultRoll < team1WinChance) {
        [score1, score2] = this.generateRealisticScore(true, upsetOccurs && ratingDiff < 0);
    } else if (resultRoll < team1WinChance + team2WinChance) {
        [score2, score1] = this.generateRealisticScore(true, upsetOccurs && ratingDiff > 0);
    } else {
        [score1, score2] = this.generateDrawScore();
    }

    const goals = this.generateGoalEvents(team1Key, team2Key, score1, score2);
    goals.forEach(goal => {
        this.addGoal(goal.scorer, goal.assister, goal.team);
    });

    this.addMatchAppearancesForTeam(team1Key);
    this.addMatchAppearancesForTeam(team2Key);

    // 리그 테이블 업데이트 추가
    this.updateLeagueTableForAIMatch(team1Key, team2Key, score1, score2);

    // AI 경기 평점 및 MOM 시뮬레이션
    this.simulateAIMatchRatings(team1Key, team2Key, goals, score1, score2);

    return {
        team1: team1Key,
        team2: team2Key,
        score1: score1,
        score2: score2,
        goals: goals,
        minute: 90
    };
}

maybePostAIMatchToSNS(matchResult) {
    if (typeof snsManager === 'undefined' || !matchResult) return;

    const team1Rating = this.calculateAITeamRating(matchResult.team1);
    const team2Rating = this.calculateAITeamRating(matchResult.team2);
    const totalGoals = matchResult.score1 + matchResult.score2;
    const winner = matchResult.score1 > matchResult.score2
        ? matchResult.team1
        : (matchResult.score2 > matchResult.score1 ? matchResult.team2 : null);
    const loser = matchResult.score1 > matchResult.score2
        ? matchResult.team2
        : (matchResult.score2 > matchResult.score1 ? matchResult.team1 : null);

    const isUpset = winner && (
        (winner === matchResult.team1 && team1Rating + 8 < team2Rating) ||
        (winner === matchResult.team2 && team2Rating + 8 < team1Rating)
    );
    const isHighScoring = totalGoals >= 5;
    const involvesUserLeagueRival = gameData.currentOpponent &&
        (matchResult.team1 === gameData.currentOpponent || matchResult.team2 === gameData.currentOpponent);

    if (!isUpset && !isHighScoring && !involvesUserLeagueRival) return;
    if (Math.random() > 0.35) return;

    const payload = {
        homeTeam: matchResult.team1,
        awayTeam: matchResult.team2,
        homeScore: matchResult.score1,
        awayScore: matchResult.score2,
        events: (matchResult.goals || []).map(g => ({
            type: 'goal',
            minute: g.minute || 0,
            scorer: g.scorer,
            assister: g.assister || null,
            team: teamNames[g.team] || g.team,
            teamKey: g.team
        }))
    };

    snsManager.generateMatchPost(payload);
}

// AI 경기 평점 시뮬레이션
simulateAIMatchRatings(team1Key, team2Key, goals, score1, score2) {
    const calcRating = (player, teamKey, goalsConceded) => {
        let rating = 6.5;
        // 득점/도움 반영
        const playerGoals = goals.filter(g => g.scorer === player.name).length;
        const playerAssists = goals.filter(g => g.assister === player.name).length;
        
        rating += playerGoals * 1.5;
        rating += playerAssists * 1.2;
        
        // 클린시트
        if (goalsConceded === 0 && (player.position === 'GK' || player.position === 'DF')) {
            rating += 0.5;
        }
        
        // 랜덤 변수 (-0.2 ~ +0.2)
        rating += (Math.random() * 0.4) - 0.2;

        // 승리 팀 보너스 (+0.3) / 패배 팀 페널티 (-0.2)
        const myScore = (teamKey === team1Key) ? score1 : score2;
        const oppScore = (teamKey === team1Key) ? score2 : score1;
        if (myScore > oppScore) {
            rating += 0.3;
        } else if (myScore < oppScore) {
            rating -= 0.2;
        }
        
        return {
            player: player,
            team: teamKey,
            rating: parseFloat(Math.max(3.0, Math.min(10.0, rating)).toFixed(1))
        };
    };

    const team1Players = teams[team1Key].sort((a, b) => b.rating - a.rating).slice(0, 11);
    const team2Players = teams[team2Key].sort((a, b) => b.rating - a.rating).slice(0, 11);

    const team1Ratings = team1Players.map(p => calcRating(p, team1Key, score2));
    const team2Ratings = team2Players.map(p => calcRating(p, team2Key, score1));

    // MOM 선정
    const allRatings = [...team1Ratings, ...team2Ratings];
    allRatings.sort((a, b) => b.rating - a.rating);
    const mom = allRatings[0];

    // MOM 기록 저장
    if (this.playerStats.has(mom.player.name)) {
        this.playerStats.get(mom.player.name).moms++;
    } else {
        this.initializePlayer(mom.player.name, mom.team, mom.player.position);
        const stats = this.playerStats.get(mom.player.name);
        if (stats) stats.moms++;
    }

    // 주간 평점 리스트에 추가 (TOTW용)
    if (!this.weeklyRatings) this.weeklyRatings = []; // [수정] 안전 장치 추가
    this.weeklyRatings.push(...allRatings);

    // [추가] 콘솔에 경기 상세 정보 출력
    console.log(`\n[경기 결과] ${teamNames[team1Key]} ${score1} : ${score2} ${teamNames[team2Key]}`);
    
    if (goals.length > 0) {
        console.log("⚽ 득점/도움:");
        goals.forEach(g => {
            const scorerTeam = teamNames[g.team] || g.team;
            let msg = ` - ${g.scorer} (${scorerTeam})`;
            if (g.assister) msg += ` (도움: ${g.assister})`;
            console.log(msg);
        });
    }

    console.log(`📊 ${teamNames[team1Key]} 평점:`);
    console.log(team1Ratings.map(r => `${r.player.name} ${r.rating}`).join(', '));

    console.log(`📊 ${teamNames[team2Key]} 평점:`);
    console.log(team2Ratings.map(r => `${r.player.name} ${r.rating}`).join(', '));
}

// 유저 경기 평점 처리 (tacticSystem.js에서 호출)
processMatchRatings(ratings, matchData) {
    // MOM 기록
    const momPlayer = ratings.mom.player;
    const momTeam = ratings.home.find(r => r.player.name === momPlayer.name) ? matchData.homeTeam : matchData.awayTeam;
    
    if (this.playerStats.has(momPlayer.name)) {
        this.playerStats.get(momPlayer.name).moms++;
    }
    
    // 주간 평점 리스트에 추가
    const homeRatings = ratings.home.map(r => ({ player: r.player, team: matchData.homeTeam, rating: parseFloat(r.rating) }));
    const awayRatings = ratings.away.map(r => ({ player: r.player, team: matchData.awayTeam, rating: parseFloat(r.rating) }));
    
    if (!this.weeklyRatings) this.weeklyRatings = []; // [수정] 안전 장치 추가
    this.weeklyRatings.push(...homeRatings, ...awayRatings);
}

// 라운드 베스트 11 선정
generateTeamOfTheWeek() {
    if (this.weeklyRatings.length === 0) return;

    // 초기화
        this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] }; // [수정] 4부 포함

    // 리그별로 순회하며 베스트 11 선정
        for (let league = 1; league <= 4; league++) { // [수정] 4부까지 순회
        // 해당 리그의 평점 데이터만 필터링
        const leagueRatings = this.weeklyRatings.filter(r => {
            const teamData = allTeams[r.team];
            return teamData && teamData.league === league;
        });

        if (leagueRatings.length === 0) continue;

        // 포지션별 정렬
        const gks = leagueRatings.filter(r => r.player.position === 'GK').sort((a, b) => b.rating - a.rating);
        const dfs = leagueRatings.filter(r => r.player.position === 'DF').sort((a, b) => b.rating - a.rating);
        const mfs = leagueRatings.filter(r => r.player.position === 'MF').sort((a, b) => b.rating - a.rating);
        const fws = leagueRatings.filter(r => r.player.position === 'FW').sort((a, b) => b.rating - a.rating);

        // 3-4-3 포메이션 기준 선정 (GK 1, DF 3, MF 4, FW 3)
        const best11 = [
            gks[0],
            ...dfs.slice(0, 3),
            ...mfs.slice(0, 4),
            ...fws.slice(0, 3)
        ].filter(p => p); // undefined 제거

        this.currentBest11[league] = best11;

        // 라운드 베스트 11 선정 횟수(totw) 증가
        best11.forEach(item => {
            const playerName = item.player.name;
            let stats = this.playerStats.get(playerName);
            if (!stats) {
                this.initializePlayer(playerName, item.team, item.player.position);
                stats = this.playerStats.get(playerName);
            }
            stats.totw = (stats.totw || 0) + 1;
        });
    }

    console.log("🏆 이번 라운드 베스트 11 선정 완료");

    // 우리 팀 선수가 포함되었는지 확인 및 메일 발송
    const userLeague = gameData.currentLeague;
    const userBest11 = this.currentBest11[userLeague] || [];
    const myPlayers = userBest11.filter(r => r.team === gameData.selectedTeam);
    
    if (myPlayers.length > 0 && typeof mailManager !== 'undefined') {
        const playerNames = myPlayers.map(r => `${r.player.name}(${r.rating})`).join(', ');
        const content = `축하합니다!\n\n이번 라운드 베스트 11에 우리 팀 선수들이 선정되었습니다.\n\n[선정 명단]\n${playerNames}\n\n선수들의 활약이 대단합니다.`;
        mailManager.addMail(`[뉴스] 라운드 베스트 11 선정 알림`, '리그 사무국', content);
    }

    // 다음 라운드를 위해 초기화
    this.weeklyRatings = [];
}

// 올해의 선수 (시즌 MOM 최다)
getPlayerOfTheSeason() {
    const topMOM = this.getTopMOMs(1)[0];
    return topMOM;
}

// 시즌 베스트 11 선정 (라운드 베스트 11 최다 선정자 기준 3-4-3)
getSeasonBest11(league) {
    // 해당 리그 소속 선수들 필터링
    const leaguePlayers = [];
    this.playerStats.forEach(stat => {
        const team = allTeams[stat.team];
        if (team && team.league === league) {
            // 현재 능력치 가져오기
            const currentRating = teams[stat.team]?.find(p => p.name === stat.name)?.rating || 70;
            leaguePlayers.push({
                ...stat,
                rating: currentRating
            });
        }
    });

    // 선정 횟수(totw) 내림차순, 동점 시 능력치 내림차순 정렬
    const sortFn = (a, b) => (b.totw || 0) - (a.totw || 0) || b.rating - a.rating;

    const gks = leaguePlayers.filter(p => p.position === 'GK').sort(sortFn);
    const dfs = leaguePlayers.filter(p => p.position === 'DF').sort(sortFn);
    const mfs = leaguePlayers.filter(p => p.position === 'MF').sort(sortFn);
    const fws = leaguePlayers.filter(p => p.position === 'FW').sort(sortFn);

    // 3-4-3 포메이션 선발
    return [
        gks[0],
        ...dfs.slice(0, 3),
        ...mfs.slice(0, 4),
        ...fws.slice(0, 3)
    ].filter(p => p); // undefined 제거
}

// 리그 테이블 업데이트 메서드 (Records System 클래스에 추가)
updateLeagueTableForAIMatch(team1Key, team2Key, score1, score2) {
    // updateLeagueTableForAIMatch 함수 맨 첫 줄에 이것만 추가
    console.log(`리그 테이블 업데이트 호출: ${team1Key} vs ${team2Key}`);

    // 팀들의 리그 확인
    const team1League = allTeams[team1Key]?.league || 1;
    const team2League = allTeams[team2Key]?.league || 1;
    
    if (team1League !== team2League) {
        console.log(`리그가 다름: ${team1Key}(${team1League}부) vs ${team2Key}(${team2League}부)`);
        return;
    }
    
    // 1. gameData.leagueData 업데이트 (메인 데이터 - UI 표시용)
        const divisionKey = `division${team1League}`;
        let mainTable = null;
        if (gameData.leagueData && gameData.leagueData[divisionKey]) {
            mainTable = gameData.leagueData[divisionKey];
            this.applyMatchResultToTable(mainTable, team1Key, team2Key, score1, score2);
    }
    
    // 2. window.leagueXTable 업데이트 (호환성 유지)
        let legacyTable;
        if (team1League === 1) legacyTable = window.league1Table;
        else if (team1League === 2) legacyTable = window.league2Table;
        else if (team1League === 3) legacyTable = window.league3Table;
    
        // [수정] 중복 업데이트 방지: 로드된 게임의 경우 legacyTable과 mainTable이 같은 객체일 수 있음
        // 두 객체가 다를 때만 legacyTable을 별도로 업데이트함
        if (legacyTable && legacyTable !== mainTable) {
            this.applyMatchResultToTable(legacyTable, team1Key, team2Key, score1, score2);
        }
        
        console.log(`${team1League}부리그 테이블 업데이트: ${team1Key} ${score1}-${score2} ${team2Key}`);
    }

    // 테이블 업데이트 헬퍼 메서드
    applyMatchResultToTable(table, team1Key, team2Key, score1, score2) {
    [team1Key, team2Key].forEach((teamKey, index) => {
        const teamScore = index === 0 ? score1 : score2;
        const opponentScore = index === 0 ? score2 : score1;
        
        // 팀 데이터 초기화
        if (!table[teamKey]) {
                table[teamKey] = {
                matches: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0
            };
        }
        
        const teamStats = table[teamKey];
        teamStats.matches++;
        teamStats.goalsFor += teamScore;
        teamStats.goalsAgainst += opponentScore;
        
        if (teamScore > opponentScore) {
            teamStats.wins++;
            teamStats.points += 3;
        } else if (teamScore === opponentScore) {
            teamStats.draws++;
            teamStats.points += 1;
        } else {
            teamStats.losses++;
        }
    });
    
}

    calculateAITeamRating(teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers || teamPlayers.length === 0) return 70;
        const sortedPlayers = teamPlayers.sort((a, b) => b.rating - a.rating);
        const topPlayers = sortedPlayers.slice(0, 11);
        const totalRating = topPlayers.reduce((sum, player) => sum + player.rating, 0);
        return totalRating / topPlayers.length;
    }

    generateRealisticScore(isWin, isUpset) {
        if (isUpset) {
            const winScore = Math.floor(Math.random() * 2) + 1;
            const loseScore = Math.floor(Math.random() * 2);
            return [winScore, loseScore];
        }

        const goalType = Math.random();
        if (goalType < 0.4) {
            return [1, 0];
        } else if (goalType < 0.7) {
            return [2, Math.random() < 0.5 ? 0 : 1];
        } else if (goalType < 0.9) {
            return [Math.floor(Math.random() * 2) + 2, Math.floor(Math.random() * 2)];
        } else {
            return [Math.floor(Math.random() * 3) + 2, Math.floor(Math.random() * 3)];
        }
    }

    generateDrawScore() {
        const drawType = Math.random();
        if (drawType < 0.4) {
            return [0, 0];
        } else if (drawType < 0.7) {
            return [1, 1];
        } else if (drawType < 0.9) {
            return [2, 2];
        } else {
            const drawScore = Math.floor(Math.random() * 2) + 3;
            return [drawScore, drawScore];
        }
    }

    generateGoalEvents(team1Key, team2Key, score1, score2) {
        const goals = [];
        const totalGoals = score1 + score2;
        const goalTimes = [];
        for (let i = 0; i < totalGoals; i++) {
            goalTimes.push(Math.floor(Math.random() * 86) + 5);
        }
        goalTimes.sort((a, b) => a - b);
        let team1Goals = 0;
        let team2Goals = 0;

        goalTimes.forEach((minute, index) => {
            let scoringTeam;
            if (team1Goals < score1 && team2Goals < score2) {
                scoringTeam = Math.random() < 0.5 ? team1Key : team2Key;
            } else if (team1Goals < score1) {
                scoringTeam = team1Key;
            } else {
                scoringTeam = team2Key;
            }

            if (scoringTeam === team1Key) {
                team1Goals++;
            } else {
                team2Goals++;
            }
            const goalEvent = this.generateSingleGoal(scoringTeam, minute);
            goals.push(goalEvent);
        });
        return goals;
    }

    generateSingleGoal(teamKey, minute) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers || teamPlayers.length === 0) {
            return {
                minute: minute,
                team: teamKey,
                scorer: "알 수 없는 선수",
                assister: null
            };
        }

        const forwards = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);
        const midfielders = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
        const defenders = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
        const scorerPool = [];

        forwards.slice(0, 3).forEach(player => {
            for (let i = 0; i < 75; i++) scorerPool.push(player);
        });

        midfielders.slice(0, 3).forEach(player => {
            for (let i = 0; i < 21; i++) scorerPool.push(player);
        });

        defenders.slice(0, 4).forEach(player => {
            for (let i = 0; i < 4; i++) scorerPool.push(player);
        });

        const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
        let assister = null;

        if (Math.random() < 0.85) {
            const assisterPool = [];
            forwards.slice(0, 3).filter(p => p.name !== scorer.name).forEach(player => {
                for (let i = 0; i < 50; i++) assisterPool.push(player);
            });
            midfielders.slice(0, 3).filter(p => p.name !== scorer.name).forEach(player => {
                for (let i = 0; i < 45; i++) assisterPool.push(player);
            });
            defenders.slice(0, 4).filter(p => p.name !== scorer.name).forEach(player => {
                for (let i = 0; i < 5; i++) assisterPool.push(player);
            });

            if (assisterPool.length > 0) {
                assister = assisterPool[Math.floor(Math.random() * assisterPool.length)];
            }
        }

        return {
            minute: minute,
            team: teamKey,
            scorer: scorer ? scorer.name : "알 수 없는 선수",
            assister: assister ? assister.name : null
        };
    }

    addMatchAppearancesForTeam(teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers) return;

        const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
        const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
        const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
        const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);
        const starters = [];

        if (gks.length > 0) starters.push(gks[0]);
        for (let i = 0; i < 4 && i < dfs.length; i++) starters.push(dfs[i]);
        for (let i = 0; i < 3 && i < mfs.length; i++) starters.push(mfs[i]);
        for (let i = 0; i < 3 && i < fws.length; i++) starters.push(fws[i]);

        starters.forEach(player => {
            this.addMatchAppearance(player.name, teamKey);
        });
    }

    addMatchAppearancesForUserTeam() {
        const squad = gameData.squad;

        if (squad.gk) this.addMatchAppearance(squad.gk.name, gameData.selectedTeam);
        squad.df.forEach(player => {
            if (player) this.addMatchAppearance(player.name, gameData.selectedTeam);
        });
        squad.mf.forEach(player => {
            if (player) this.addMatchAppearance(player.name, gameData.selectedTeam);
        });
        squad.fw.forEach(player => {
            if (player) this.addMatchAppearance(player.name, gameData.selectedTeam);
        });
    }

    updateRecordsDisplay() {
        const topScorers = this.getTopScorers(5);
        const topAssisters = this.getTopAssisters(5);
        const topMOMs = this.getTopMOMs(5);
        this.displayTopScorers(topScorers);
        this.displayTopAssisters(topAssisters);
        this.displayTopMOMs(topMOMs);
        this.displayTeamOfTheWeek(gameData.currentLeague);
    }

    displayTopScorers(topScorers) {
        const container = document.getElementById('topScorers');
        if (!container) return;
        container.innerHTML = '';
        if (topScorers.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">아직 기록이 없습니다.</p>';
            return;
        }

        topScorers.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            rankingItem.innerHTML = `
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${teamNames[player.team] || '알 수 없음'}</div>
                </div>
                <div class="player-stats">${player.goals}</div>
            `;
            container.appendChild(rankingItem);
        });
    }

    displayTopAssisters(topAssisters) {
        const container = document.getElementById('topAssisters');
        if (!container) return;
        container.innerHTML = '';
        if (topAssisters.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">아직 기록이 없습니다.</p>';
            return;
        }

        topAssisters.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            rankingItem.innerHTML = `
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${teamNames[player.team] || '알 수 없음'}</div>
                </div>
                <div class="player-stats">${player.assists}</div>
            `;
            container.appendChild(rankingItem);
        });
    }

    displayTopMOMs(topMOMs) {
        const container = document.getElementById('topMOMs');
        if (!container) return;
        container.innerHTML = '';
        if (topMOMs.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">아직 기록이 없습니다.</p>';
            return;
        }

        topMOMs.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            rankingItem.innerHTML = `
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${teamNames[player.team] || '알 수 없음'}</div>
                </div>
                <div class="player-stats">${player.moms}회</div>
            `;
            container.appendChild(rankingItem);
        });
    }

    displayTeamOfTheWeek(league = gameData.currentLeague) {
        const container = document.getElementById('weeklyBest11');
        if (!container) return;
        
        container.innerHTML = '';
        
        const best11 = this.currentBest11[league];
        
        if (!best11 || best11.length === 0) {
            container.innerHTML = '<p style="text-align: center; opacity: 0.7;">아직 선정되지 않았습니다.</p>';
            return;
        }

        // 3-4-3 포메이션 UI 생성
        const pitch = document.createElement('div');
        pitch.className = 'best11-pitch';
        
        // 포지션별 분류
        const gks = best11.filter(r => r.player.position === 'GK');
        const dfs = best11.filter(r => r.player.position === 'DF');
        const mfs = best11.filter(r => r.player.position === 'MF');
        const fws = best11.filter(r => r.player.position === 'FW');

        const createRow = (players) => {
            const row = document.createElement('div');
            row.className = 'best11-row';
            players.forEach(data => {
                const isUserPlayer = data.team === gameData.selectedTeam;
                const card = document.createElement('div');
                card.className = `best11-player ${isUserPlayer ? 'user-player' : ''}`;
                card.innerHTML = `
                    <img src="assets/players/${data.player.name}.webp" class="best11-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
                    <div class="best11-rating">★${data.rating}</div>
                    <div class="best11-name">${data.player.name}</div>
                    <div class="best11-team">${teamNames[data.team] || data.team}</div>
                `;
                row.appendChild(card);
            });
            return row;
        };

        // 위에서부터 FW -> MF -> DF -> GK 순서로 배치
        pitch.appendChild(createRow(fws));
        pitch.appendChild(createRow(mfs));
        pitch.appendChild(createRow(dfs));
        pitch.appendChild(createRow(gks));
        
        container.appendChild(pitch);
    }

    getSaveData() {
        return {
            playerStats: Array.from(this.playerStats.entries()),
            matchRecords: this.matchRecords,
            initialized: this.initialized,
            currentBest11: this.currentBest11 // 베스트 11 데이터 저장
        };
    }

    loadSaveData(saveData) {
        if (saveData.playerStats) {
            this.playerStats = new Map(saveData.playerStats);
        }
        if (saveData.matchRecords) {
            this.matchRecords = saveData.matchRecords;
        }
        if (saveData.initialized) {
            this.initialized = saveData.initialized;
        }
        if (saveData.currentBest11) {
            // 호환성 체크: 배열이면(구버전) 객체로 초기화
            if (Array.isArray(saveData.currentBest11)) {
                this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] };
            } else {
                this.currentBest11 = saveData.currentBest11;
                // [수정] 4부 데이터가 없으면 추가
                if (!this.currentBest11[4]) this.currentBest11[4] = [];
            }
        } else {
            this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] };
        }
        
        // [수정] weeklyRatings는 저장되지 않는 임시 데이터이므로 로드 시 초기화 필수
        this.weeklyRatings = [];
    }

    resetSeason() {
        this.playerStats.clear();
        this.matchRecords = [];
        this.initialized = false;
        console.log('개인기록이 리셋되었습니다.');
    }
}

// 리그별 개인기록 시스템
class LeagueBasedRecordsSystem extends RecordsSystem {
    constructor() {
        super();
        this.seasonHistory = []; // 역대 시즌 기록 저장
        this.leagueStats = {
            division1: new Map(),
            division2: new Map(), 
            division3: new Map()
        };
    }

    initialize() {
        if (this.initialized) return;
        
        // 리그 전환 버튼 추가
        this.addLeagueSwitchButtons();

        // 역대 기록 보기 버튼 추가
        this.addHistoryButton();
        
        // 부모 클래스의 initialize 호출
        super.initialize();
    }

    // 선수 초기화 시 리그별로 분류
    initializePlayer(playerName, teamKey, position) {
        // 기존 전체 통계
        super.initializePlayer(playerName, teamKey, position);
        
        // 리그별 통계
        if (allTeams && allTeams[teamKey]) {
            const league = allTeams[teamKey].league;
            const divisionKey = `division${league}`;
            
            // [수정] divisionKey가 없으면 초기화 (월드컵 모드 등 대비)
            if (!this.leagueStats[divisionKey]) {
                this.leagueStats[divisionKey] = new Map();
            }
            
            if (!this.leagueStats[divisionKey].has(playerName)) {
                this.leagueStats[divisionKey].set(playerName, {
                    name: playerName,
                    team: teamKey,
                    position: position,
                    league: league,
                    goals: 0,
                    assists: 0,
                    matches: 0
                });
            }
        }
    }

    // 골 기록 추가 (리그별)
    addGoal(scorerName, assisterName = null, teamKey) {
        // 기존 전체 통계 업데이트
        super.addGoal(scorerName, assisterName, teamKey);
        
        // 리그별 통계 업데이트
        if (allTeams && allTeams[teamKey]) {
            const league = allTeams[teamKey].league;
            const divisionKey = `division${league}`;
            
            // [수정] divisionKey가 없으면 초기화
            if (!this.leagueStats[divisionKey]) {
                this.leagueStats[divisionKey] = new Map();
            }
            
            // 득점자 리그별 기록
            if (this.leagueStats[divisionKey].has(scorerName)) {
                const scorerStats = this.leagueStats[divisionKey].get(scorerName);
                scorerStats.goals++;
            } else {
                const player = this.findPlayerByName(scorerName, teamKey);
                if (player) {
                    this.initializePlayer(scorerName, teamKey, player.position);
                    const scorerStats = this.leagueStats[divisionKey].get(scorerName);
                    if (scorerStats) scorerStats.goals++;
                }
            }

            // 어시스트 리그별 기록
            if (assisterName && this.leagueStats[divisionKey] && this.leagueStats[divisionKey].has(assisterName)) {
                const assisterStats = this.leagueStats[divisionKey].get(assisterName);
                assisterStats.assists++;
            } else if (assisterName) {
                const player = this.findPlayerByName(assisterName, teamKey);
                if (player) {
                    this.initializePlayer(assisterName, teamKey, player.position);
                    const assisterStats = this.leagueStats[divisionKey].get(assisterName);
                    if (assisterStats) assisterStats.assists++;
                }
            }
        }
    }

    // 경기 출전 기록 추가 (리그별)
    addMatchAppearance(playerName, teamKey) {
        // 기존 전체 통계 업데이트
        super.addMatchAppearance(playerName, teamKey);
        
        // 리그별 통계 업데이트
        if (allTeams && allTeams[teamKey]) {
            const league = allTeams[teamKey].league;
            const divisionKey = `division${league}`;
            
            // [수정] divisionKey가 없으면 초기화
            if (!this.leagueStats[divisionKey]) {
                this.leagueStats[divisionKey] = new Map();
            }
            
            if (this.leagueStats[divisionKey].has(playerName)) {
                const playerStats = this.leagueStats[divisionKey].get(playerName);
                playerStats.matches++;
            } else {
                const player = this.findPlayerByName(playerName, teamKey);
                if (player) {
                    this.initializePlayer(playerName, teamKey, player.position);
                    const playerStats = this.leagueStats[divisionKey].get(playerName);
                    if (playerStats) playerStats.matches++;
                }
            }
        }
    }

    // 리그별 득점왕 순위
    getTopScorersByLeague(league, limit = 5) {
        const divisionKey = `division${league}`;
        if (!this.leagueStats[divisionKey]) return [];
        
        const scorers = Array.from(this.leagueStats[divisionKey].values())
            .filter(player => player.goals > 0)
            .sort((a, b) => {
                if (b.goals !== a.goals) return b.goals - a.goals;
                return b.assists - a.assists;
            })
            .slice(0, limit);

        return scorers;
    }

    // 리그별 도움왕 순위
    getTopAssistersByLeague(league, limit = 5) {
        const divisionKey = `division${league}`;
        if (!this.leagueStats[divisionKey]) return [];
        
        const assisters = Array.from(this.leagueStats[divisionKey].values())
            .filter(player => player.assists > 0)
            .sort((a, b) => {
                if (b.assists !== a.assists) return b.assists - a.assists;
                return b.goals - a.goals;
            })
            .slice(0, limit);

        return assisters;
    }

    // 리그별 MOM 순위 (추가됨)
    getTopMOMsByLeague(league, limit = 5) {
        const moms = Array.from(this.playerStats.values())
            .filter(player => {
                if (player.moms <= 0) return false;
                // 해당 선수의 팀이 현재 조회하려는 리그인지 확인
                const teamData = allTeams[player.team];
                return teamData && teamData.league === league;
            })
            .sort((a, b) => {
                if (b.moms !== a.moms) return b.moms - a.moms;
                return b.goals - a.goals; // 동점 시 득점 순
            })
            .slice(0, limit);
        return moms;
    }

    // 리그 정보 포함한 득점왕 표시
    displayTopScorersWithLeague(topScorers, league) {
        const container = document.getElementById('topScorers');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 리그 헤더 추가
        const leagueHeader = document.createElement('div');
        leagueHeader.className = 'league-records-header';
        leagueHeader.innerHTML = `<h5>${league}부리그 득점왕</h5>`;
        container.appendChild(leagueHeader);
        
        if (topScorers.length === 0) {
            container.innerHTML += '<p style="text-align: center; opacity: 0.7;">아직 기록이 없습니다.</p>';
            return;
        }
        
        topScorers.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            
            rankingItem.innerHTML = `
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${teamNames[player.team] || player.team}</div>
                </div>
                <div class="player-stats">${player.goals}</div>
            `;
            
            container.appendChild(rankingItem);
        });
    }

    // 리그 정보 포함한 도움왕 표시
    displayTopAssistersWithLeague(topAssisters, league) {
        const container = document.getElementById('topAssisters');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 리그 헤더 추가
        const leagueHeader = document.createElement('div');
        leagueHeader.className = 'league-records-header';
        leagueHeader.innerHTML = `<h5>${league}부리그 도움왕</h5>`;
        container.appendChild(leagueHeader);
        
        if (topAssisters.length === 0) {
            container.innerHTML += '<p style="text-align: center; opacity: 0.7;">아직 기록이 없습니다.</p>';
            return;
        }
        
        topAssisters.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            
            rankingItem.innerHTML = `
                <div class="player-rank">${index + 1}</div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${teamNames[player.team] || player.team}</div>
                </div>
                <div class="player-stats">${player.assists}</div>
            `;
            
            container.appendChild(rankingItem);
        });
    }

    // 리그 전환 버튼 추가
    addLeagueSwitchButtons() {
        const recordsContent = document.querySelector('.records-content');
        if (!recordsContent) return;
        
        // 기존 버튼 제거
        const existingButtons = recordsContent.querySelector('.league-switch-buttons');
        if (existingButtons) {
            existingButtons.remove();
        }
        
        // 새 버튼 추가
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'league-switch-buttons';
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        `;
        
        for (let i = 1; i <= 3; i++) {
            const button = document.createElement('button');
            button.className = `league-switch-btn ${i === gameData.currentLeague ? 'active' : ''}`;
            button.textContent = `${i}부리그`;
            button.style.cssText = `
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 20px;
                background: ${i === gameData.currentLeague ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            button.addEventListener('click', () => {
                this.switchToLeague(i);
            });
            
            buttonContainer.appendChild(button);
        }
        
        recordsContent.insertBefore(buttonContainer, recordsContent.firstChild);
    }

    // 역대 기록 보기 버튼 추가
    addHistoryButton() {
        const recordsHeader = document.querySelector('.records-header');
        if (!recordsHeader || document.getElementById('viewHistoryBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'viewHistoryBtn';
        btn.className = 'btn';
        btn.textContent = '🏆 명예의 전당';
        btn.style.marginTop = '10px';
        // 스타일 강화
        btn.style.background = 'linear-gradient(45deg, #f1c40f, #d35400)';
        btn.style.color = 'white';
        btn.style.fontWeight = 'bold';
        btn.style.boxShadow = '0 4px 15px rgba(241, 196, 15, 0.3)';
        btn.onclick = () => this.toggleHistoryView();
        
        recordsHeader.appendChild(btn);
    }

    toggleHistoryView() {
        const currentView = document.querySelector('.records-content');
        let historyView = document.getElementById('historyView');
        
        // historyView가 없으면 생성 (안전 장치)
        if (!historyView && currentView && currentView.parentNode) {
            historyView = document.createElement('div');
            historyView.id = 'historyView';
            historyView.className = 'history-view';
            historyView.style.display = 'none';
            historyView.innerHTML = '<div id="historyList"></div>';
            currentView.parentNode.insertBefore(historyView, currentView.nextSibling);
        }
        
        if (currentView && historyView) {
            const isHistoryVisible = historyView.style.display === 'block';
            currentView.style.display = isHistoryVisible ? 'grid' : 'none';
            historyView.style.display = isHistoryVisible ? 'none' : 'block';
            
            const btn = document.getElementById('viewHistoryBtn');
            if (btn) {
                if (isHistoryVisible) {
                    btn.textContent = '🏆 명예의 전당';
                    btn.style.background = 'linear-gradient(45deg, #f1c40f, #d35400)';
                } else {
                    btn.textContent = '📊 현재 시즌 보기';
                    btn.style.background = '#34495e';
                }
            }
            
            if (!isHistoryVisible) {
                this.displayHistory();
            }
        }
    }

    // 리그 전환
    switchToLeague(league) {
        const topScorers = this.getTopScorersByLeague(league, 5);
        const topAssisters = this.getTopAssistersByLeague(league, 5);
        const topMOMs = this.getTopMOMsByLeague(league, 5); // 리그별 MOM 가져오기
        
        this.displayTopScorersWithLeague(topScorers, league);
        this.displayTopAssistersWithLeague(topAssisters, league);
        this.displayTopMOMs(topMOMs); // MOM 표시 업데이트
        
        // 버튼 활성화 상태 업데이트
        document.querySelectorAll('.league-switch-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index + 1 === league);
            btn.style.background = index + 1 === league ? 
                'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        });
        
        // 베스트 11도 해당 리그로 전환
        this.displayTeamOfTheWeek(league);
    }

    // 개인기록 표시 업데이트 (리그별)
    updateRecordsDisplay() {
        // 현재 사용자의 리그 확인
        const userLeague = gameData.currentLeague || 1;
        
        // 사용자 리그의 기록 표시
        const topScorers = this.getTopScorersByLeague(userLeague, 5);
        const topAssisters = this.getTopAssistersByLeague(userLeague, 5);
        const topMOMs = this.getTopMOMsByLeague(userLeague, 5); // 리그별 MOM으로 변경
        
        this.displayTopScorersWithLeague(topScorers, userLeague);
        this.displayTopAssistersWithLeague(topAssisters, userLeague);
        this.displayTopMOMs(topMOMs);
        this.displayTeamOfTheWeek(userLeague);
    }

    // 저장 데이터 준비 (리그별 포함)
    getSaveData() {
        const baseData = super.getSaveData();
        const leagueData = {};
        
        Object.keys(this.leagueStats).forEach(divisionKey => {
            leagueData[divisionKey] = Array.from(this.leagueStats[divisionKey].entries());
        });
        
        return {
            ...baseData,
            leagueStats: leagueData,
            seasonHistory: this.seasonHistory // 역대 기록 저장
        };
    }

    // 저장 데이터 로드 (리그별 포함)
    loadSaveData(saveData) {
        super.loadSaveData(saveData);
        
        if (saveData.leagueStats) {
            Object.keys(saveData.leagueStats).forEach(divisionKey => {
                this.leagueStats[divisionKey] = new Map(saveData.leagueStats[divisionKey]);
            });
        }
        if (saveData.seasonHistory) {
            this.seasonHistory = saveData.seasonHistory;
        }
    }

    // 시즌 리셋 (리그별 포함)
    resetSeason() {
        super.resetSeason();
        
        Object.keys(this.leagueStats).forEach(divisionKey => {
            this.leagueStats[divisionKey].clear();
        });
        
        console.log('리그별 개인기록이 리셋되었습니다.');
    }

    // 시즌 기록 아카이빙 (endSeason.js에서 호출)
    archiveSeason(seasonName) {
        const seasonData = {
            season: seasonName,
            poty: this.getPlayerOfTheSeason(),
            leagues: {}
        };

        for (let i = 1; i <= 3; i++) {
            seasonData.leagues[i] = {
                topScorer: this.getTopScorer(i),
                topAssister: this.getTopAssister(i),
                best11: this.getSeasonBest11(i) // 시즌 베스트 11 메서드 사용
            };
        }

        this.seasonHistory.unshift(seasonData); // 최신 시즌이 앞으로
        console.log(`📚 ${seasonName} 시즌 기록 아카이빙 완료`);
    }

    // 역대 기록 표시
    displayHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.seasonHistory.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #aaa;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🏛️</div>
                    <h3>아직 명예의 전당에 등록된 시즌이 없습니다.</h3>
                    <p>한 시즌을 완료하면 이곳에 영광스러운 기록이 남습니다.</p>
                </div>`;
            return;
        }

        this.seasonHistory.forEach(data => {
            const seasonCard = document.createElement('div');
            seasonCard.className = 'history-card';
            
            let potyHtml = '';
            if (data.poty) {
                potyHtml = `
                    <div class="history-poty">
                        <div class="poty-icon">👑</div>
                        <div class="poty-info">
                            <div class="history-label">올해의 선수 (Ballon d'Or)</div>
                            <div class="history-value player-name">${data.poty.name}</div>
                            <div class="history-sub">${teamNames[data.poty.team] || data.poty.team}</div>
                        </div>
                    </div>
                `;
            }

            let leaguesHtml = '';
            for (let i = 1; i <= 3; i++) {
                const leagueData = data.leagues[i];
                if (!leagueData) continue;

                // 베스트 11 HTML 생성
                let best11Html = '';
                if (leagueData.best11 && leagueData.best11.length > 0) {
                    best11Html = `
                        <div class="history-best11-section">
                            <div class="best11-title">BEST 11</div>
                            <div class="best11-grid">
                    `;
                    leagueData.best11.forEach(p => {
                        best11Html += `
                            <div class="best11-item">
                                <span class="pos">${p.position}</span>
                                <span class="name">${p.name}</span>
                            </div>
                        `;
                    });
                    best11Html += `</div></div>`;
                }

                leaguesHtml += `
                    <div class="history-league-section">
                        <h5 class="league-title">${i}부 리그</h5>
                        <div class="history-stats-grid">
                            <div class="history-stat">
                                <span class="label">⚽ 득점왕</span>
                                <span class="value">${leagueData.topScorer ? `${leagueData.topScorer.playerName}` : '-'}</span>
                                <span class="sub-value">${leagueData.topScorer ? `${leagueData.topScorer.goals}골` : ''}</span>
                            </div>
                            <div class="history-stat">
                                <span class="label">👟 도움왕</span>
                                <span class="value">${leagueData.topAssister ? `${leagueData.topAssister.playerName}` : '-'}</span>
                                <span class="sub-value">${leagueData.topAssister ? `${leagueData.topAssister.assists}도움` : ''}</span>
                            </div>
                        </div>
                        ${best11Html}
                    </div>
                `;
            }

            seasonCard.innerHTML = `
                <div class="history-header">
                    <h4>${data.season} 시즌</h4>
                </div>
                ${potyHtml}
                <div class="history-leagues">
                    ${leaguesHtml}
                </div>
            `;
            
            container.appendChild(seasonCard);
        });
    }

    // LeagueBasedRecordsSystem 클래스 내부에 추가

// 특정 리그의 득점왕 1명 반환
getTopScorer(league) {
    const divisionKey = `division${league}`;
    if (!this.leagueStats[divisionKey]) return null;
    
    const scorers = Array.from(this.leagueStats[divisionKey].values())
        .filter(player => player.goals > 0)
        .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return b.assists - a.assists;
        });
    
    if (scorers.length === 0) return null;
    
    return {
        playerName: scorers[0].name,
        team: scorers[0].team,
        goals: scorers[0].goals,
        league: league
    };
}

// 특정 리그의 도움왕 1명 반환
getTopAssister(league) {
    const divisionKey = `division${league}`;
    if (!this.leagueStats[divisionKey]) return null;
    
    const assisters = Array.from(this.leagueStats[divisionKey].values())
        .filter(player => player.assists > 0)
        .sort((a, b) => {
            if (b.assists !== a.assists) return b.assists - a.assists;
            return b.goals - a.goals;
        });
    
    if (assisters.length === 0) return null;
    
    return {
        playerName: assisters[0].name,
        team: assisters[0].team,
        assists: assisters[0].assists,
        league: league
    };
}
    
    
}




// records.js 맨 아래 부분

// 인스턴스를 담을 변수만 선언
let leagueBasedRecordsSystem = null;

// 모든 스크립트 로드 후 초기화
function initRecordsSystemInstance() {
    if (!leagueBasedRecordsSystem) {
        // 의존성 체크
        if (typeof teams === 'undefined' || typeof allTeams === 'undefined') {
            console.warn('teams 또는 allTeams가 아직 로드되지 않았습니다.');
            return false;
        }
        
        leagueBasedRecordsSystem = new LeagueBasedRecordsSystem();
        window.recordsSystem = leagueBasedRecordsSystem;
        window.leagueBasedRecordsSystem = leagueBasedRecordsSystem;
        console.log('✅ Records System 인스턴스가 생성되었습니다.');
        return true;
    }
    return true;
}

function initializeRecordsSystem() {
    // 인스턴스가 없으면 먼저 생성
    if (!initRecordsSystemInstance()) {
        return false;
    }
    
    return leagueBasedRecordsSystem.initialize();
}

function updateRecordsAfterMatch(matchEvents) {
    if (!leagueBasedRecordsSystem) {
        console.error('❌ Records system이 초기화되지 않았습니다!');
        initRecordsSystemInstance();
    }
    if (leagueBasedRecordsSystem) {
        leagueBasedRecordsSystem.recordUserMatchStats(matchEvents);
        if (window.GameEventBus) {
            window.GameEventBus.emit('records:updated', matchEvents);
        }
    }
}

function updateRecordsTab() {
    if (!leagueBasedRecordsSystem) {
        console.error('❌ Records system이 초기화되지 않았습니다!');
        initRecordsSystemInstance();
    }
    if (leagueBasedRecordsSystem) {
        leagueBasedRecordsSystem.updateRecordsDisplay();
    }
}

// 전역으로 함수들 노출
window.initializeRecordsSystem = initializeRecordsSystem;
window.updateRecordsAfterMatch = updateRecordsAfterMatch;
window.updateRecordsTab = updateRecordsTab;
window.initRecordsSystemInstance = initRecordsSystemInstance;

// 🎯 핵심: 모든 스크립트 로드 완료 후 자동 생성
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📂 DOM 로드 완료, Records System 초기화 시도...');
        initRecordsSystemInstance();
    });
} else {
    // 이미 로드된 경우 즉시 실행
    console.log('📂 이미 로드됨, Records System 초기화 시도...');
    initRecordsSystemInstance();
}

// ✅ 반응형 스타일 추가 (개인기록 탭 전용)
const recordsStyle = document.createElement('style');
recordsStyle.textContent = `
    /* 기록 컨테이너 그리드 레이아웃 */
    .records-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 10px;
    }

    /* 랭킹 아이템 스타일 */
    .ranking-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.05);
        margin-bottom: 8px;
        border-radius: 8px;
        transition: background 0.2s;
    }
    
    .ranking-item:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .ranking-item.user-player {
        background: rgba(46, 204, 113, 0.15);
        border: 1px solid rgba(46, 204, 113, 0.3);
    }

    .player-rank {
        width: 30px;
        font-weight: bold;
        color: #ffd700;
        text-align: center;
        font-size: 1.1em;
    }

    .player-info {
        flex-grow: 1;
        margin-left: 15px;
        overflow: hidden;
    }

    .player-name {
        font-weight: bold;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.95em;
    }

    .player-team {
        font-size: 0.8em;
        color: #aaa;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    .player-stats {
        font-weight: bold;
        color: #2ecc71;
        min-width: 50px;
        text-align: right;
        font-size: 1.1em;
    }

    /* 주간 베스트 11 피치 스타일 */
    .best11-pitch {
        background: linear-gradient(180deg, #27ae60 0%, #2ecc71 100%);
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 550px;
        position: relative;
        box-shadow: inset 0 0 50px rgba(0,0,0,0.3);
        margin-top: 10px;
    }
    
    /* 피치 장식 (중앙선, 센터서클) */
    .best11-pitch::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        border: 2px solid rgba(255,255,255,0.2);
        border-radius: 50%;
        pointer-events: none;
    }
    
    .best11-pitch::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 2px;
        background: rgba(255,255,255,0.2);
        transform: translateY(-50%);
        pointer-events: none;
    }

    .best11-row {
        display: flex;
        justify-content: center;
        gap: 20px;
        z-index: 1;
        position: relative;
    }

    .best11-player {
        background: rgba(0, 0, 0, 0.6);
        border-radius: 8px;
        padding: 8px 5px;
        width: 90px;
        text-align: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: transform 0.2s;
        backdrop-filter: blur(2px);
    }
    
    .best11-player:hover {
        transform: translateY(-5px) scale(1.05);
        background: rgba(0, 0, 0, 0.8);
        border-color: #ffd700;
        z-index: 10;
    }
    
    .best11-player.user-player {
        border-color: #ffd700;
        background: rgba(255, 215, 0, 0.25);
    }

    .best11-rating {
        color: #ffd700;
        font-weight: bold;
        font-size: 0.85em;
        margin-bottom: 4px;
    }

    .best11-name {
        font-size: 0.85em;
        font-weight: bold;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #fff;
    }

    .best11-team {
        font-size: 0.7em;
        color: #ddd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* 모바일 반응형 스타일 */
    @media (max-width: 768px) {
        .records-content {
            grid-template-columns: 1fr; /* 모바일에서는 1열로 */
            gap: 15px;
            padding: 5px;
        }
        
        .best11-pitch {
            min-height: 450px;
            padding: 15px 5px;
        }
        
        .best11-row {
            gap: 8px;
        }
        
        .best11-player {
            width: 70px;
            padding: 5px 2px;
        }
        
        .best11-name {
            font-size: 0.75em;
        }
        
        .best11-team {
            display: none; /* 공간 부족 시 팀명 숨김 */
        }
        
        .best11-rating {
            font-size: 0.8em;
        }
        
        .ranking-item {
            padding: 10px;
        }
        
        .player-info {
            margin-left: 10px;
        }
    }

    /* 명예의 전당 스타일 */
    .history-view {
        padding: 10px;
    }
    
    .history-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        margin-bottom: 30px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .history-header {
        background: linear-gradient(90deg, #2c3e50, #34495e);
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .history-header h4 {
        margin: 0;
        color: #ffd700;
        font-size: 1.4em;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    .history-poty {
        display: flex;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, rgba(241, 196, 15, 0.1), rgba(211, 84, 0, 0.1));
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .poty-icon {
        font-size: 3em;
        margin-right: 20px;
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
    }
    
    .poty-info .history-label {
        color: #f39c12;
        font-size: 0.9em;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .poty-info .player-name {
        font-size: 1.8em;
        font-weight: bold;
        color: white;
        margin: 5px 0;
    }
    
    .poty-info .history-sub {
        color: #aaa;
    }
    
    .history-leagues {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
    }
    
    .history-league-section {
        background: rgba(0,0,0,0.2);
        border-radius: 10px;
        padding: 15px;
    }
    
    .league-title {
        margin: 0 0 15px 0;
        color: #3498db;
        font-size: 1.2em;
        border-bottom: 2px solid #3498db;
        padding-bottom: 5px;
        display: inline-block;
    }
    
    .history-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .history-stat {
        background: rgba(255,255,255,0.05);
        padding: 10px;
        border-radius: 8px;
        text-align: center;
    }
    
    .history-stat .label {
        display: block;
        font-size: 0.8em;
        color: #aaa;
        margin-bottom: 5px;
    }
    
    .history-stat .value {
        display: block;
        font-weight: bold;
        color: #fff;
        font-size: 1.1em;
    }
    
    .history-stat .sub-value {
        display: block;
        font-size: 0.8em;
        color: #2ecc71;
    }
    
    .history-best11-section {
        margin-top: 15px;
        background: rgba(0,0,0,0.3);
        border-radius: 8px;
        padding: 10px;
    }
    
    .best11-title {
        font-size: 0.8em;
        color: #aaa;
        text-align: center;
        margin-bottom: 8px;
        font-weight: bold;
    }
    
    .best11-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: center;
    }
    
    .best11-item {
        background: rgba(255,255,255,0.1);
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 0.85em;
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .best11-item .pos {
        color: #f1c40f;
        font-weight: bold;
        font-size: 0.8em;
    }
    
    .best11-item .name {
        color: #ddd;
    }
`;
document.head.appendChild(recordsStyle);