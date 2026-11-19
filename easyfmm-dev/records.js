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
                totw: 0, // 라운드 베스트 11 선정 횟수 추가
                ratingSum: 0, // 시즌 누적 평점 합계
                ratingCount: 0 // 평점 기록 경기 수
            });
        }
    }

    recordPlayerMatchRating(player, teamKey, ratingVal) {
        if (!player || !player.name) return;
        const numRating = parseFloat(ratingVal);
        if (isNaN(numRating)) return;
        if (!this.playerStats.has(player.name)) {
            this.initializePlayer(player.name, teamKey, player.position);
        }
        const stats = this.playerStats.get(player.name);
        if (stats) {
            stats.ratingSum = (stats.ratingSum || 0) + numRating;
            stats.ratingCount = (stats.ratingCount || 0) + 1;
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
            console.log(`[Records] ${gameData.currentRound}라운드 AI 경기는 이미 시뮬레이션 되었습니다. 스킵합니다.`);
            return;
        }
        this.lastSimulatedRound = gameData.currentRound;
        if (typeof LeagueManager !== 'undefined') {
            LeagueManager.simulateAllLeaguesRound(gameData.currentRound);
            return;
        }

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
    // [수정] 현실적 홈 어드밴티지 및 무승부 확률 반영 (홈 44%, 원정 30%, 무 26% 기준)
    const upsetChance = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 0.02 : 0.03;
    const upsetOccurs = Math.random() < upsetChance;
    let team1WinChance = 0.44; // 홈팀 기본 승률
    let team2WinChance = 0.30; // 원정팀 기본 승률
    let drawChance = 0.26;

    // [신규] 홈 구장 관중 위압감 (빅클럽 홈 어드밴티지 강화)
    if (typeof stadiumSystem !== 'undefined') {
        const stadiumRes = stadiumSystem.calculateMatchday(team1Key, team2Key);
        if (stadiumRes && stadiumRes.attendance >= 50000) {
            team1WinChance += 0.04;
            team2WinChance -= 0.03;
            drawChance -= 0.01;
        }
    }

    // 전술 상성에 따른 인위적 승률 가감 제거 (순수 전력·홈이점 기반 공정 시뮬레이션)

    // [수정] 전력 차이 반영 비중 현실화 (100 -> 24) : 강팀 우승 승점 80~90점대 및 상위/하위권 격차 반영
    const powerDivisor = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 30 : 24;
    const maxAdvantage = (typeof gameData !== 'undefined' && gameData.isWorldCupMode) ? 0.50 : 0.50;

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
        const advantage = Math.min(maxAdvantage, Math.abs(ratingDiff) / (powerDivisor * 0.9)); // 원정 강팀도 전력차 충분히 반영
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

    // 선수별 시즌 누적 평점 기록
    allRatings.forEach(r => this.recordPlayerMatchRating(r.player, r.team, r.rating));

    // 주간 평점 리스트에 추가 (TOTW용)
    if (!this.weeklyRatings) this.weeklyRatings = []; // [수정] 안전 장치 추가
    this.weeklyRatings.push(...allRatings);

    // [추가] 콘솔에 경기 상세 정보 출력
    console.log(`\n[경기 결과] ${teamNames[team1Key]} ${score1} : ${score2} ${teamNames[team2Key]}`);
    
    if (goals.length > 0) {
        console.log("득점/도움:");
        goals.forEach(g => {
            const scorerTeam = teamNames[g.team] || g.team;
            let msg = ` - ${g.scorer} (${scorerTeam})`;
            if (g.assister) msg += ` (도움: ${g.assister})`;
            console.log(msg);
        });
    }

    console.log(` ${teamNames[team1Key]} 평점:`);
    console.log(team1Ratings.map(r => `${r.player.name} ${r.rating}`).join(', '));

    console.log(` ${teamNames[team2Key]} 평점:`);
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
    
    [...homeRatings, ...awayRatings].forEach(r => this.recordPlayerMatchRating(r.player, r.team, r.rating));

    if (!this.weeklyRatings) this.weeklyRatings = []; // [수정] 안전 장치 추가
    this.weeklyRatings.push(...homeRatings, ...awayRatings);
}

// 라운드 베스트 11 선정
generateTeamOfTheWeek() {
    if (this.weeklyRatings.length === 0) return;

    // 초기화
        this.currentBest11 = { 1: [], 2: [], 3: [], 4: [] }; // [수정] 4부 포함

    // 리그별로 순회하며 베스트 11 선정
        const bestLeagues = [...(typeof LEAGUES_CONFIG !== 'undefined' ? Object.keys(LEAGUES_CONFIG) : []), 'all', 4];
        for (const league of bestLeagues) { // 9개 리그 + 리그 전체 + 월드컵(4)
        // 해당 리그의 평점 데이터만 필터링
        const leagueRatings = this.weeklyRatings.filter(r => {
            const teamData = allTeams[r.team];
            return teamData && (league === 'all' || (typeof league === 'string' ? teamData.leagueId === league : teamData.league === league));
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
        (league === 'all' ? [] : best11).forEach(item => {
            const playerName = item.player.name;
            let stats = this.playerStats.get(playerName);
            if (!stats) {
                this.initializePlayer(playerName, item.team, item.player.position);
                stats = this.playerStats.get(playerName);
            }
            stats.totw = (stats.totw || 0) + 1;
        });
    }

    console.log("이번 라운드 베스트 11 선정 완료");

    // 우리 팀 선수가 포함되었는지 확인 및 메일 발송
    const userLeague = (typeof LeagueManager !== 'undefined' && gameData.selectedTeam && !gameData.isWorldCupMode) ? LeagueManager.getLeagueIdByTeam(gameData.selectedTeam) : gameData.currentLeague;
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

// 발롱도르 / 올해의 선수 선정 (평균 평점 + 리그별 계수 + 정규리그 우승 + FA컵/UCL 트로피 + 득점 + 도움 + MOM 종합 평가)
getPlayerOfTheSeason() {
    const LEAGUE_BALLON_COEFF = {
        premier_league: 1.20,
        laliga: 1.16,
        bundesliga: 1.10,
        serie_a: 1.10,
        ligue_1: 1.02,
        liga_portugal: 0.90,
        eredivisie: 0.88,
        super_lig: 0.82,
        mls: 0.78,
        efl_championship: 0.75,
        kleague_1: 0.72
    };

    // 1. 전 리그 순위표 산정 (리그별 구단 순위 정확 매핑)
    const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
    const userLeagueId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(userTeam) : 'premier_league';

    const sortLeagueMap = (tbl) => {
        const ranks = {};
        if (!tbl) return ranks;
        const sortedTeams = Object.keys(tbl)
            .map(teamKey => ({
                team: teamKey,
                points: tbl[teamKey]?.points || 0,
                goalDiff: (tbl[teamKey]?.goalsFor || 0) - (tbl[teamKey]?.goalsAgainst || 0),
                goalsFor: tbl[teamKey]?.goalsFor || 0
            }))
            .sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                return b.goalsFor - a.goalsFor;
            });
        sortedTeams.forEach((item, idx) => {
            ranks[item.team] = idx + 1;
        });
        return ranks;
    };

    const teamRanksByLeague = {};
    if (typeof gameData !== 'undefined' && gameData.leagueData) {
        Object.keys(gameData.leagueData).forEach(lid => {
            teamRanksByLeague[lid] = sortLeagueMap(gameData.leagueData[lid]);
        });
    }
    let leagueData = teamRanksByLeague[userLeagueId] ? gameData.leagueData[userLeagueId] : null;
    if (!leagueData && typeof gameData !== 'undefined' && gameData.leagueData) {
        leagueData = gameData.leagueData.division1 || null;
    }
    if (!leagueData && typeof window !== 'undefined') {
        leagueData = window[`${userLeagueId}Table`] || window.league1Table || null;
    }
    const fallbackRanks = sortLeagueMap(leagueData);

    // 2. 컵 대회 결과 확인 (FA컵 및 UEFA 챔피언스리그)
    const faCupChamp = (typeof gameData !== 'undefined' && gameData.faCup) ? gameData.faCup.champion : null;
    const faCupRunnerUp = (typeof gameData !== 'undefined' && gameData.faCup) ? gameData.faCup.runnerUp : null;
    const uclChamp = (typeof gameData !== 'undefined' && gameData.ucl) ? gameData.ucl.champion : null;
    const uclRunnerUp = (typeof gameData !== 'undefined' && gameData.ucl) ? gameData.ucl.runnerUp : null;
    const mlsCupChamp = (typeof gameData !== 'undefined' && gameData.mlsPlayoff) ? gameData.mlsPlayoff.champion : null;

    // 3. 후보 선수 풀 구성
    const candidates = Array.from(this.playerStats.values()).filter(stat => {
        if (!stat.team) return false;
        // 등록된 1부 리그 팀 소속 확인
        if (typeof allTeams !== 'undefined' && allTeams[stat.team]) return true;
        if (leagueData && Object.prototype.hasOwnProperty.call(leagueData, stat.team)) return true;
        return false;
    });

    if (candidates.length === 0) return null;

    // 최소 출전 경기 기준
    const maxMatches = candidates.reduce((m, s) => Math.max(m, s.matches || 0), 0);
    const minRequiredMatches = Math.max(1, Math.min(5, Math.floor(maxMatches * 0.3)));

    let pool = candidates.filter(s => {
        const matches = s.matches || 0;
        return matches >= minRequiredMatches && (matches > 0 || (s.goals || 0) > 0 || (s.assists || 0) > 0 || (s.moms || 0) > 0);
    });
    if (pool.length === 0) pool = candidates;

    // 4. 발롱도르 종합 점수 산출 (리그별 계수 반영)
    const scored = pool.map(stat => {
        const goals = stat.goals || 0;
        const assists = stat.assists || 0;
        const matches = stat.matches || 0;
        const moms = stat.moms || 0;
        const totw = stat.totw || 0;

        const statLeagueId = (typeof allTeams !== 'undefined' && allTeams[stat.team] && allTeams[stat.team].leagueId)
            ? allTeams[stat.team].leagueId
            : userLeagueId;
        const leagueCoeff = LEAGUE_BALLON_COEFF[statLeagueId] || 1.0;

        // 평균 평점
        let avgRating;
        if ((stat.ratingCount || 0) > 0) {
            avgRating = stat.ratingSum / stat.ratingCount;
        } else {
            const denom = Math.max(8, matches || 1);
            avgRating = Math.min(9.2, 6.6 + ((goals * 1.3) + (assists * 1.0) + (moms * 0.6)) / denom);
        }

        const leagueRankMap = teamRanksByLeague[statLeagueId] || fallbackRanks;
        const rawTeamRank = leagueRankMap[stat.team] || 99;
        const isTeamMLSCupChamp = (statLeagueId === 'mls' && mlsCupChamp && stat.team === mlsCupChamp);
        const teamRank = (statLeagueId === 'mls' && mlsCupChamp)
            ? (isTeamMLSCupChamp ? 1 : Math.max(2, rawTeamRank))
            : rawTeamRank;
        const isLeagueChampion = (statLeagueId === 'mls' && mlsCupChamp) ? isTeamMLSCupChamp : (teamRank === 1);
        const isFaCupChampion = (stat.team === faCupChamp);
        const isFaCupRunnerUp = (stat.team === faCupRunnerUp);
        const isUclChampion = (stat.team === uclChamp);
        const isUclRunnerUp = (stat.team === uclRunnerUp);

        // [가중치 산출]
        // 1. 개인 활약 점수 (리그 수준 계수 적용)
        const ratingScore = Math.max(0, (avgRating - 6.0) * 25);
        const attackScore = (goals * 2.2) + (assists * 1.8);
        const impactScore = (moms * 2.5) + (totw * 1.0);
        const weightedPerfScore = (ratingScore + attackScore + impactScore) * leagueCoeff;

        // 2. 대회 타이틀 가중치 (정규리그·자국컵은 리그 계수 반영, UCL은 최고 권위 1.0배 유지)
        const baseLeagueTitle = (teamRank === 1 ? 18 : (teamRank === 2 ? 6 : (teamRank === 3 ? 3 : 0)));
        const leagueTitleScore = baseLeagueTitle * leagueCoeff;

        let faTitleScore = 0;
        if (isFaCupChampion) faTitleScore += 15 * leagueCoeff;
        else if (isFaCupRunnerUp) faTitleScore += 5 * leagueCoeff;

        // - UEFA 챔피언스리그 (최고 권위 빅이어!): 우승 +35점, 준우승 +15점
        let uclTitleScore = 0;
        if (isUclChampion) uclTitleScore += 35;
        else if (isUclRunnerUp) uclTitleScore += 15;

        // - 멀티 트로피 보너스 (더블/트레블 프리미엄)
        let multiTitleBonus = 0;
        if (isLeagueChampion && isFaCupChampion && isUclChampion) {
            multiTitleBonus += 25; // 🏆 유러피언 트레블 보너스!
        } else if (isLeagueChampion && isUclChampion) {
            multiTitleBonus += 12; // 🏆 리그 + UCL 더블!
        } else if (isLeagueChampion && isFaCupChampion) {
            multiTitleBonus += 12 * leagueCoeff; // 🏆 국내 더블!
        }

        const totalTitleScore = leagueTitleScore + faTitleScore + uclTitleScore + multiTitleBonus;
        const ballonScore = weightedPerfScore + totalTitleScore;

        return {
            ...stat,
            leagueId: statLeagueId,
            leagueCoeff,
            goals,
            assists,
            matches,
            moms,
            totw,
            avgRating: Number(avgRating.toFixed(2)),
            teamRank,
            isLeagueChampion,
            isFaCupChampion,
            isUclChampion,
            totalTitleScore: Number(totalTitleScore.toFixed(2)),
            ballonScore: Number(ballonScore.toFixed(2))
        };
    });

    scored.sort((a, b) => {
        if (b.ballonScore !== a.ballonScore) return b.ballonScore - a.ballonScore;
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return (b.goals + b.assists) - (a.goals + a.assists);
    });

    return scored[0] || null;
}

// 시즌 베스트 11 선정 (라운드 베스트 11 최다 선정자 기준 3-4-3)
getSeasonBest11(league) {
    // 해당 리그 소속 선수들 필터링
    const leaguePlayers = [];
    this.playerStats.forEach(stat => {
        const team = allTeams[stat.team];
        if (team && (league === 'all' || (typeof league === 'string' ? team.leagueId === league : team.league === league))) {
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
    if (typeof LeagueManager !== 'undefined') {
        const lId1 = LeagueManager.getLeagueIdByTeam(team1Key);
        if (gameData.leagueData && gameData.leagueData[lId1]) {
            this.applyMatchResultToTable(gameData.leagueData[lId1], team1Key, team2Key, score1, score2);
        }
        return;
    }
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
        const lowPref = (typeof MatchTuning !== 'undefined' && MatchTuning.aiLowScorePreference !== undefined)
            ? MatchTuning.aiLowScorePreference : 0.70;
        const maxGoals = (typeof MatchTuning !== 'undefined' && MatchTuning.aiMaxTeamGoals !== undefined)
            ? MatchTuning.aiMaxTeamGoals : 4;

        if (isUpset) {
            const winScore = Math.floor(Math.random() * 2) + 1;
            const loseScore = Math.floor(Math.random() * 2);
            return [winScore, loseScore];
        }

        const goalType = Math.random();
        if (goalType < lowPref * 0.65) {
            return [1, 0];
        } else if (goalType < lowPref + 0.12) {
            return [2, Math.random() < 0.6 ? 0 : 1];
        } else if (goalType < 0.93) {
            return [Math.min(maxGoals, Math.floor(Math.random() * 2) + 2), Math.floor(Math.random() * 2)];
        } else {
            return [Math.min(maxGoals, Math.floor(Math.random() * 2) + 3), Math.floor(Math.random() * 2) + 1];
        }
    }

    generateDrawScore() {
        const lowPref = (typeof MatchTuning !== 'undefined' && MatchTuning.aiLowScorePreference !== undefined)
            ? MatchTuning.aiLowScorePreference : 0.70;

        const drawType = Math.random();
        if (drawType < lowPref * 0.65) {
            return [0, 0];
        } else if (drawType < lowPref + 0.18) {
            return [1, 1];
        } else if (drawType < 0.96) {
            return [2, 2];
        } else {
            return [3, 3];
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
        container.replaceChildren();
        if (topScorers.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 기록이 없습니다.';
            container.appendChild(p);
            return;
        }

        topScorers.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;

            const rankDiv = document.createElement('div');
            rankDiv.className = 'player-rank';
            rankDiv.textContent = index + 1;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;
            const teamDiv = document.createElement('div');
            teamDiv.className = 'player-team';
            teamDiv.textContent = teamNames[player.team] || '알 수 없음';
            infoDiv.append(nameDiv, teamDiv);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.textContent = player.goals;

            rankingItem.append(rankDiv, infoDiv, statsDiv);
            container.appendChild(rankingItem);
        });
    }

    displayTopAssisters(topAssisters) {
        const container = document.getElementById('topAssisters');
        if (!container) return;
        container.replaceChildren();
        if (topAssisters.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 기록이 없습니다.';
            container.appendChild(p);
            return;
        }

        topAssisters.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;

            const rankDiv = document.createElement('div');
            rankDiv.className = 'player-rank';
            rankDiv.textContent = index + 1;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;
            const teamDiv = document.createElement('div');
            teamDiv.className = 'player-team';
            teamDiv.textContent = teamNames[player.team] || '알 수 없음';
            infoDiv.append(nameDiv, teamDiv);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.textContent = player.assists;

            rankingItem.append(rankDiv, infoDiv, statsDiv);
            container.appendChild(rankingItem);
        });
    }

    displayTopMOMs(topMOMs) {
        const container = document.getElementById('topMOMs');
        if (!container) return;
        container.replaceChildren();
        if (topMOMs.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 기록이 없습니다.';
            container.appendChild(p);
            return;
        }

        topMOMs.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;

            const rankDiv = document.createElement('div');
            rankDiv.className = 'player-rank';
            rankDiv.textContent = index + 1;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;
            const teamDiv = document.createElement('div');
            teamDiv.className = 'player-team';
            teamDiv.textContent = teamNames[player.team] || '알 수 없음';
            infoDiv.append(nameDiv, teamDiv);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.textContent = `${player.moms}회`;

            rankingItem.append(rankDiv, infoDiv, statsDiv);
            container.appendChild(rankingItem);
        });
    }

    displayTeamOfTheWeek(league = gameData.currentLeague) {
        const container = document.getElementById('weeklyBest11');
        if (!container) return;
        
        container.replaceChildren();
        
        const best11 = this.currentBest11[league];
        
        if (!best11 || best11.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 선정되지 않았습니다.';
            container.appendChild(p);
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

                const avatarWrap = document.createElement('div');
                avatarWrap.className = 'best11-avatar-wrap';

                const img = document.createElement('img');
                img.className = 'best11-image';
                img.loading = 'lazy';
                setPlayerPhoto(img, data.player);

                const ratingDiv = document.createElement('div');
                ratingDiv.className = 'best11-rating';
                ratingDiv.textContent = `${data.rating}`;

                avatarWrap.append(img, ratingDiv);

                const nameplate = document.createElement('div');
                nameplate.className = 'best11-nameplate';

                const nameDiv = document.createElement('div');
                nameDiv.className = 'best11-name';
                nameDiv.textContent = data.player.name;

                const teamDiv = document.createElement('div');
                teamDiv.className = 'best11-team';
                teamDiv.textContent = teamNames[data.team] || data.team;

                nameplate.append(nameDiv, teamDiv);
                card.append(avatarWrap, nameplate);
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
        this.nxgnHistory = []; // 역대 NXGN 10대 유망주 Best 10 저장
        this.currentSubtab = 'current';
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

        // 서브탭 초기화
        this.initRecordsSubtabs();
        
        // 부모 클래스의 initialize 호출
        super.initialize();
    }

    // [신규] 팀 → 리그 키 (9개국 리그 기준: leagueId)
    getLeagueKey(teamKey) {
        const t = allTeams && allTeams[teamKey];
        if (!t) return 'division1';
        return t.leagueId || `division${t.league}`;
    }

    // [신규] 숫자(구 division) 또는 leagueId 문자열 → 저장 키
    toDivisionKey(league) {
        if (typeof league === 'string') return league;
        // 구 division 번호는 LeagueManager 호환 매핑과 동일하게 변환
        if (league === 1) return this.getUserLeagueId();
        if (league === 2) return 'efl_championship';
        if (league === 3) return 'bundesliga';
        return `division${league}`;
    }

    // [신규] 리그 표시 이름
    getLeagueLabel(league) {
        if (league === 'all') return '리그 전체';
        if (typeof league === 'string' && typeof LEAGUES_CONFIG !== 'undefined' && LEAGUES_CONFIG[league]) return LEAGUES_CONFIG[league].name;
        return `${league}부리그`;
    }

    // [신규] 리그별 기록 목록 ('all' 이면 9개 리그 합산)
    getLeagueEntries(league) {
        if (league === 'all') {
            let keys = Object.keys(this.leagueStats).filter(k => typeof LEAGUES_CONFIG !== 'undefined' && LEAGUES_CONFIG[k]);
            if (keys.length === 0) keys = Object.keys(this.leagueStats);
            const out = [];
            keys.forEach(k => out.push(...this.leagueStats[k].values()));
            return out;
        }
        const m = this.leagueStats[this.toDivisionKey(league)];
        return m ? Array.from(m.values()) : [];
    }

    // [신규] 유저 리그 ID
    getUserLeagueId() {
        try {
            if (typeof LeagueManager !== 'undefined' && gameData.selectedTeam) return LeagueManager.getLeagueIdByTeam(gameData.selectedTeam);
        } catch (e) {}
        return 'premier_league';
    }

    // [신규] 베스트11(division 인덱스 기반 저장) 키 변환
    toBest11Key(league) {
        return league;
    }

    // 선수 초기화 시 리그별로 분류
    initializePlayer(playerName, teamKey, position) {
        // 기존 전체 통계
        super.initializePlayer(playerName, teamKey, position);
        
        // 리그별 통계
        if (allTeams && allTeams[teamKey]) {
            const league = allTeams[teamKey].league;
            const divisionKey = this.getLeagueKey(teamKey);
            
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
            const divisionKey = this.getLeagueKey(teamKey);
            
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
            const divisionKey = this.getLeagueKey(teamKey);
            
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
        const divisionKey = this.toDivisionKey(league);
        
        const scorers = this.getLeagueEntries(league)
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
        const divisionKey = this.toDivisionKey(league);
        
        const assisters = this.getLeagueEntries(league)
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
                return teamData && (league === 'all' || (typeof league === 'string' ? teamData.leagueId === league : teamData.league === league));
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
        
        container.replaceChildren();
        
        // 리그 헤더 추가
        const leagueHeader = document.createElement('div');
        leagueHeader.className = 'league-records-header';
        const h5 = document.createElement('h5');
        h5.textContent = `${this.getLeagueLabel(league)} 득점왕`;
        leagueHeader.appendChild(h5);
        container.appendChild(leagueHeader);
        
        if (topScorers.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 기록이 없습니다.';
            container.appendChild(p);
            return;
        }
        
        topScorers.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            
            const rankDiv = document.createElement('div');
            rankDiv.className = 'player-rank';
            rankDiv.textContent = index + 1;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;
            const teamDiv = document.createElement('div');
            teamDiv.className = 'player-team';
            teamDiv.textContent = teamNames[player.team] || player.team;
            infoDiv.append(nameDiv, teamDiv);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.textContent = player.goals;

            rankingItem.append(rankDiv, infoDiv, statsDiv);
            container.appendChild(rankingItem);
        });
    }

    // 리그 정보 포함한 도움왕 표시
    displayTopAssistersWithLeague(topAssisters, league) {
        const container = document.getElementById('topAssisters');
        if (!container) return;
        
        container.replaceChildren();
        
        // 리그 헤더 추가
        const leagueHeader = document.createElement('div');
        leagueHeader.className = 'league-records-header';
        const h5 = document.createElement('h5');
        h5.textContent = `${this.getLeagueLabel(league)} 도움왕`;
        leagueHeader.appendChild(h5);
        container.appendChild(leagueHeader);
        
        if (topAssisters.length === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align: center; opacity: 0.7;';
            p.textContent = '아직 기록이 없습니다.';
            container.appendChild(p);
            return;
        }
        
        topAssisters.forEach((player, index) => {
            const isUserPlayer = player.team === gameData.selectedTeam;
            const rankingItem = document.createElement('div');
            rankingItem.className = `ranking-item ${isUserPlayer ? 'user-player' : ''}`;
            
            const rankDiv = document.createElement('div');
            rankDiv.className = 'player-rank';
            rankDiv.textContent = index + 1;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.name;
            const teamDiv = document.createElement('div');
            teamDiv.className = 'player-team';
            teamDiv.textContent = teamNames[player.team] || player.team;
            infoDiv.append(nameDiv, teamDiv);

            const statsDiv = document.createElement('div');
            statsDiv.className = 'player-stats';
            statsDiv.textContent = player.assists;

            rankingItem.append(rankDiv, infoDiv, statsDiv);
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
        buttonContainer.style.cssText = `display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
            flex-wrap: wrap;
        `;
        
        const activeLeague = this.viewLeague || this.getUserLeagueId();
        const leagueIds = ['all', ...((typeof LEAGUES_CONFIG !== 'undefined') ? Object.keys(LEAGUES_CONFIG) : ['premier_league'])];
        leagueIds.forEach(id => {
            const cfg = (typeof LEAGUES_CONFIG !== 'undefined') ? LEAGUES_CONFIG[id] : null;
            const isActive = id === activeLeague;
            const button = document.createElement('button');
            button.className = `league-switch-btn ${isActive ? 'active' : ''}`;
            button.dataset.league = id;
            button.textContent = id === 'all' ? '🌍 리그 전체' : (cfg ? `${cfg.flag || ''} ${cfg.name}`.trim() : id);
            button.style.cssText = `padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 20px;
                background: ${isActive ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            button.addEventListener('click', () => {
                this.switchToLeague(id);
            });
            buttonContainer.appendChild(button);
        });
        
        recordsContent.insertBefore(buttonContainer, recordsContent.firstChild);
    }

        // 서브탭 초기화 및 이벤트 연결
    initRecordsSubtabs() {
        const subtabBtns = document.querySelectorAll('.records-subtab-btn');
        subtabBtns.forEach(btn => {
            btn.onclick = () => {
                this.switchRecordsSubtab(btn.dataset.subtab);
            };
        });
    }

    // 기록 탭 서브탭 전환
    switchRecordsSubtab(subtabName) {
        this.currentSubtab = subtabName;
        document.querySelectorAll('.records-subtab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subtab === subtabName);
        });

        const currentView = document.getElementById('recordsCurrentView');
        const historyView = document.getElementById('historyView');
        const nxgnView = document.getElementById('nxgnView');

        if (currentView) currentView.style.display = subtabName === 'current' ? 'block' : 'none';
        if (historyView) historyView.style.display = subtabName === 'history' ? 'block' : 'none';
        if (nxgnView) nxgnView.style.display = subtabName === 'nxgn' ? 'block' : 'none';

        if (subtabName === 'history') {
            this.displayHistory();
        } else if (subtabName === 'nxgn') {
            this.displayNXGNView();
        } else {
            this.updateRecordsDisplay();
        }
    }

    // NXGN 스카우팅 평가 코멘트 생성 (다양하고 현실감 넘치는 멘트 풀)
    generateNXGNBlurb(p, stats, ovr, ceiling) {
        const { goals = 0, assists = 0, moms = 0, avgRating = 0 } = stats;
        const age = p.age || 18;
        const pos = p.position || 'MF';

        // 선수 이름과 나이를 조합한 결정적 시드 (동일 선수에게 일관되면서도 고유한 멘트 매칭)
        let hash = 0;
        const str = (p.name || '') + age;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        const pick = (arr) => arr[Math.abs(hash) % arr.length];

        // 1. 경기 지배자 / 특급 MOM 스타 (MOM 2회 이상 or 평점 7.2 이상)
        if (moms >= 2 || avgRating >= 7.2) {
            const clutchList = [
                '경기마다 결정적인 차이를 만들어내는 클러치 플레이어! 빅매치에 유독 강한 대담함',
                '매 경기 팀의 핵심으로 활약하며 유럽 빅클럽 스카우터들의 리포트를 뜨겁게 달구고 있는 특급 에이스',
                '어린 나이에도 팀의 승리를 직접 짊어지는 승부사 기질과 탁월한 위기 대처 능력',
                '중요한 순간마다 번뜩이는 플레이로 승부의 추를 기울이는 타고난 게임 체인저'
            ];
            return pick(clutchList);
        }

        // 2. 포지션별 세부 멘트
        if (pos === 'FW') {
            if (ovr >= 85) {
                const eliteList = [
                    '이미 빅리그 정상급 수비진을 초토화하고 있는 세계 최고의 10대 스트라이커',
                    '축구계의 모든 스포트라이트를 독식하는 슈퍼 탤런트! 차세대 발롱도르 0순위',
                    '경이로운 스피드와 파괴적인 피니시로 무결점 공격수의 탄생을 알린 괴물 크랙'
                ];
                return pick(eliteList);
            }
            if (goals >= 4) {
                const goalList = [
                    '문전 앞에서의 얼음장 같은 냉혹함! 10대라는 나이가 믿기지 않는 천재 골잡이',
                    '수비 라인을 허무는 동물적인 침투 본능과 폭발적인 결정력을 지닌 차세대 피니셔',
                    '양발을 가리지 않는 강력한 슈팅과 박스 안 위치 선정으로 골망을 찢는 킬러',
                    '골 냄새를 맡는 탁월한 후각! 상대 수비진의 집중 견제 속에서도 기어코 득점을 올리는 골게터'
                ];
                return pick(goalList);
            }
            if (assists >= 3) {
                const assistList = [
                    '폭발적인 주력과 번뜩이는 1대1 돌파로 상대 측면을 완전히 붕괴시키는 차세대 크랙',
                    '마치 중력을 거스르는 듯한 화려한 드리블과 정교한 컷백으로 공격을 이끄는 테크니션',
                    '현란한 방향 전환과 가속으로 상대 풀백을 절망에 빠뜨리는 현대 축구형 윙어'
                ];
                return pick(assistList);
            }
            if (age <= 17) {
                const youngList = [
                    '나이를 잊게 만드는 대담한 플레이! 유스 무대를 평정하고 성인 무대에 센세이션을 일으킨 신성',
                    '10년에 한 번 나올까 말까 한 세기의 원더키드! 전 세계 메가클럽들이 눈독 들이는 보석'
                ];
                return pick(youngList);
            }
            const generalFw = [
                '탁월한 축구 센스와 날카로운 슈팅 궤적으로 미래가 더욱 기대되는 다이아몬드 원석',
                '전방에서의 성실한 압박과 민첩한 공간 창출로 팀 공격에 활력을 불어넣는 신예 스트라이커',
                '유연한 연계 플레이와 침착한 퍼스트 터치를 겸비한 잠재력 만점의 타깃맨',
                '탁월한 센스와 득점 감각을 자랑하며 차세대 주포로 급부상한 특급 공격수'
            ];
            return pick(generalFw);
        } else if (pos === 'MF') {
            if (ovr >= 82) {
                const eliteList = [
                    '넓은 시야와 우아한 볼 컨트롤로 이미 성인 무대 중원을 장악한 차세대 월드클래스',
                    '압도적인 축구 지능과 탈압박 기술을 뽐내며 팀의 전술 그 자체가 된 중원의 마에스트로',
                    '마치 그라운드 전체를 위에서 내려다보는 듯한 시야! 제2의 지단/모드리치로 평가받는 신동'
                ];
                return pick(eliteList);
            }
            if (assists >= 3) {
                const assistList = [
                    '압박 속에서도 여유롭게 킬패스를 찔러넣는 현대 축구의 교과서적인 플레이메이커',
                    '상대 수비 블록의 틈을 정확하게 베어내는 명품 스루패스로 찬스를 제조하는 마법사',
                    '경기의 템포를 손바닥 위에 올려두고 조율하는 차세대 중원 사령관'
                ];
                return pick(assistList);
            }
            if (goals >= 3) {
                const scoringMid = [
                    '기습적인 박스 침투와 강력한 중거리포로 골까지 뽑아내는 완성형 미들라이커',
                    '공격 가담과 중원 지배를 완벽히 겸비한 현대 축구 최적화 육각형 미드필더'
                ];
                return pick(scoringMid);
            }
            if (age <= 17) {
                const youngList = [
                    '10대 초반부터 축구 천재로 불린 특급 유망주! 전술 이해도가 베테랑 수준에 달한다',
                    '차세대 국가대표 중원을 10년 이상 책임질 세기의 테크니션'
                ];
                return pick(youngList);
            }
            const generalMf = [
                '기동력과 테크닉을 겸비한 다재다능한 신성 플레이메이커',
                '경쾌한 발밑 기술과 유기적인 원터치 패스로 공격 전개의 기점이 되는 보석',
                '지치지 않는 심장과 압도적인 활동량으로 그라운드 전역을 누비는 다재다능한 엔진',
                '탄탄한 기본기와 성실한 활동량을 바탕으로 무서운 속도로 성장 중인 미드필더'
            ];
            return pick(generalMf);
        } else if (pos === 'DF') {
            if (ovr >= 82) {
                const eliteList = [
                    '나이를 잊은 침착한 빌드업과 대인 방어력을 지닌 차세대 월드클래스 센터백',
                    '수비수로서 갖추어야 할 모든 툴을 완벽히 흡수한 10대 최고의 후방 지휘관',
                    '압도적인 피지컬과 영리한 인터셉트 능력으로 통곡의 벽을 쌓아올린 대형 수비수'
                ];
                return pick(eliteList);
            }
            if (assists >= 2) {
                const attackingDf = [
                    '폭발적인 주력으로 측면 전체를 지배하는 현대 축구 맞춤형 공격형 윙백',
                    '정교한 얼리 크로스와 날카로운 오버래핑으로 팀 공격에 결정적인 옵션을 제공한다',
                    '공수 전환 속도가 경이적인 수준! 왕성한 활동량으로 측면을 집어삼키는 특급 풀백'
                ];
                return pick(attackingDf);
            }
            if (age <= 17) {
                const youngDf = [
                    '어린 나이에도 흔들림 없는 침착함! 대형 센터백 계보를 이을 특급 유망주',
                    '성인 공격수들과의 거친 몸싸움에서도 절대 밀리지 않는 피지컬 괴물'
                ];
                return pick(youngDf);
            }
            const generalDf = [
                '우수한 피지컬과 뛰어난 상황 판단력을 갖춘 미래의 후방 수호자',
                '침착한 커버 플레이와 기민한 라인 조절로 후방을 안정시키는 든든한 센터백',
                '상대 공격수의 패스 길목을 완벽히 읽고 차단하는 경이로운 인터셉트 스페셜리스트',
                '빠른 주력으로 뒷공간 커버에 능한 미래의 수비 핵심 자원'
            ];
            return pick(generalDf);
        } else {
            const gkList = [
                '동물적인 반사신경과 눈부신 슈퍼세이브로 수 차례 팀을 위기에서 구해낸 거미손',
                '넓은 페널티 박스 장악력과 스위퍼 키퍼로서의 뛰어난 발밑 기술을 겸비한 수문장',
                '나이답지 않은 침착한 포지셔닝과 공중볼 처리로 안정감을 뽐내는 차세대 No.1',
                '골문 앞에서의 압도적인 존재감! 1대1 찬스에서도 끝까지 각도를 좁히는 철벽 골키퍼'
            ];
            return pick(gkList);
        }
    }

    // NXGN 세계 10대 유망주 BEST 10 선정 (만 19세 이하)
    generateNXGNTop10() {
        const candidates = [];
        const visited = new Set();
        const growthSys = typeof playerGrowthSystem !== 'undefined' ? playerGrowthSystem : null;
        const fixedPots = (growthSys && growthSys.fixedPotentials) ? growthSys.fixedPotentials : {};

        const allTeamKeys = Object.keys(typeof allTeams !== 'undefined' ? allTeams : (typeof teams !== 'undefined' ? teams : {}));
        allTeamKeys.forEach(tKey => {
            const pList = (typeof teams !== 'undefined' && teams[tKey]) || (typeof allTeams !== 'undefined' && allTeams[tKey] && allTeams[tKey].players) || [];
            pList.forEach(p => {
                if (!p || !p.name || visited.has(p.name)) return;
                visited.add(p.name);
                const age = p.age || 18;
                if (age <= 19) {
                    const pStat = this.playerStats.get(p.name) || { goals: 0, assists: 0, matches: 0, moms: 0, ratingCount: 0, ratingSum: 0 };
                    const goals = pStat.goals || 0;
                    const assists = pStat.assists || 0;
                    const matches = pStat.matches || 0;
                    const moms = pStat.moms || 0;
                    let avgRating = (pStat.ratingCount && pStat.ratingCount > 0) ? (pStat.ratingSum / pStat.ratingCount) : null;
                    const ovr = Math.floor(p.rating || 70);
                    const ceiling = (fixedPots && fixedPots[p.name]) || (ovr + 10);

                    // NXGN 종합 평가 점수
                    // 1) 기본 능력치 가중치: ovr * 1.5
                    // 2) 나이 가중치 (17, 18세 등 어릴수록 높은 평가): (20 - age) * 2.5
                    // 3) 내부 잠재력 가중치: ceiling * 0.8
                    // 4) 시즌 활약 보너스: 골(2.0), 도움(1.5), MOM(2.5), 평점 6.5 초과분
                    let score = (ovr * 1.5) + ((20 - age) * 2.5) + (ceiling * 0.8);
                    score += (goals * 2.0) + (assists * 1.5) + (moms * 2.5);
                    if (avgRating && avgRating > 6.5) {
                        score += (avgRating - 6.5) * 10;
                    }

                    // 스카우팅 평가 코멘트 (다채로운 멘트 생성)
                    const blurb = this.generateNXGNBlurb(p, { goals, assists, matches, moms, avgRating: avgRating || 0 }, ovr, ceiling);

                    candidates.push({
                        name: p.name,
                        team: tKey,
                        teamName: (typeof teamNames !== 'undefined' && teamNames[tKey]) || tKey,
                        position: p.position,
                        age: age,
                        rating: ovr,
                        goals: goals,
                        assists: assists,
                        matches: matches,
                        moms: moms,
                        avgRating: avgRating ? Number(avgRating.toFixed(2)) : '-',
                        blurb: blurb,
                        score: Number(score.toFixed(1)),
                        isMyPlayer: typeof gameData !== 'undefined' && tKey === gameData.selectedTeam
                    });
                }
            });
        });

        candidates.sort((a, b) => b.score - a.score || b.rating - a.rating);
        return candidates.slice(0, 10).map((c, idx) => ({
            rank: idx + 1,
            ...c
        }));
    }

    // NXGN 유망주 TOP 10 화면 표시
    displayNXGNView(seasonIdx = null) {
        const container = document.getElementById('nxgnList');
        if (!container) return;
        container.replaceChildren();

        // 1. 표시할 시즌 데이터 선정
        let seasonData = null;
        let seasonLabel = '';
        let top10 = [];

        if (this.seasonHistory && this.seasonHistory.length > 0) {
            const idx = (seasonIdx !== null && this.seasonHistory[seasonIdx]) ? seasonIdx : 0;
            seasonData = this.seasonHistory[idx];
            seasonLabel = `${seasonData.season} 시즌`;
            top10 = seasonData.nxgnTop10 || [];
        }

        // 시즌 히스토리가 없거나 비어있으면 실시간 풀에서 생성
        if (!top10 || top10.length === 0) {
            top10 = this.generateNXGNTop10();
            const curYear = (typeof gameData !== 'undefined' && gameData.startYear) ? gameData.startYear : 2025;
            seasonLabel = `${curYear}/${curYear + 1} 시즌`;
        }

        // 2. 배너 헤더 생성
        const banner = document.createElement('div');
        banner.className = 'nxgn-banner';

        const bannerTitle = document.createElement('h4');
        bannerTitle.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('sparkles') : ''} <span>NXGN 세계 10대 유망주 BEST 10</span>`;

        const bannerDesc = document.createElement('p');
        bannerDesc.textContent = `[${seasonLabel}] 전 세계 만 19세 이하 최고의 유망주들을 선정합니다. 현재 실력, 경기 활약도, 잠재성을 종합 평가한 랭킹입니다.`;

        banner.append(bannerTitle, bannerDesc);

        // 시즌 선택 셀렉터 추가 (시즌이 2개 이상일 때)
        if (this.seasonHistory && this.seasonHistory.length > 1) {
            const selectWrap = document.createElement('div');
            selectWrap.className = 'nxgn-season-select-wrap';
            const selectEl = document.createElement('select');
            selectEl.className = 'nxgn-season-select';

            this.seasonHistory.forEach((sh, sIndex) => {
                const opt = document.createElement('option');
                opt.value = sIndex;
                opt.textContent = `${sh.season} 시즌 NXGN`;
                if ((seasonIdx === null && sIndex === 0) || seasonIdx === sIndex) opt.selected = true;
                selectEl.appendChild(opt);
            });

            selectEl.onchange = (e) => {
                this.displayNXGNView(parseInt(e.target.value, 10));
            };
            selectWrap.appendChild(selectEl);
            banner.appendChild(selectWrap);
        }

        container.appendChild(banner);

        // 3. TOP 10 카드 리스트
        const listWrap = document.createElement('div');
        listWrap.className = 'nxgn-grid';

        top10.forEach(player => {
            const card = document.createElement('div');
            card.className = `nxgn-card rank-${player.rank} ${player.isMyPlayer ? 'user-player' : ''}`;

            // 헤더: 순위 뱃지 + 우리 구단 뱃지 + 오버롤
            const cardHeader = document.createElement('div');
            cardHeader.className = 'nxgn-card-header';

            const rankBadge = document.createElement('div');
            rankBadge.className = 'nxgn-rank-badge';
            if (player.rank === 1) rankBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('crown') : ''} <span>1위 WINNER</span>`;
            else if (player.rank === 2) rankBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('award') : ''} <span>2위</span>`;
            else if (player.rank === 3) rankBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('award') : ''} <span>3위</span>`;
            else rankBadge.textContent = `${player.rank}위`;

            const rightWrap = document.createElement('div');
            rightWrap.style.cssText = 'display: flex; align-items: center; gap: 8px;';

            if (player.isMyPlayer) {
                const userBadge = document.createElement('span');
                userBadge.className = 'nxgn-user-badge';
                userBadge.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('star') : ''} <span>우리 구단</span>`;
                rightWrap.appendChild(userBadge);
            }

            const ovrBadge = document.createElement('span');
            ovrBadge.className = 'nxgn-ovr-badge';
            ovrBadge.textContent = `OVR ${player.rating}`;
            rightWrap.appendChild(ovrBadge);

            cardHeader.append(rankBadge, rightWrap);

            // 바디: 사진 + 선수 기본 정보
            const cardBody = document.createElement('div');
            cardBody.className = 'nxgn-card-body';

            const img = document.createElement('img');
            img.className = 'nxgn-avatar';
            img.loading = 'lazy';
            setPlayerPhoto(img, player);

            const infoWrap = document.createElement('div');
            infoWrap.className = 'nxgn-info';

            const nameEl = document.createElement('div');
            nameEl.className = 'nxgn-name';
            nameEl.textContent = player.name;

            const metaEl = document.createElement('div');
            metaEl.className = 'nxgn-meta';
            metaEl.textContent = `${player.position} · ${player.age}세 · ${player.teamName}`;

            const statsEl = document.createElement('div');
            statsEl.className = 'nxgn-stats';
            const statsText = player.matches > 0 
                ? `시즌 ${player.matches}경기 ${player.goals}골 ${player.assists}도움 (평점 ${player.avgRating})`
                : '1군 정규 출전 대기 중';
            statsEl.textContent = statsText;

            infoWrap.append(nameEl, metaEl, statsEl);
            cardBody.append(img, infoWrap);

            // 푸터: 스카우팅 코멘트
            const cardFooter = document.createElement('div');
            cardFooter.className = 'nxgn-card-footer';
            cardFooter.textContent = `"${player.blurb}"`;

            card.append(cardHeader, cardBody, cardFooter);
            listWrap.appendChild(card);
        });

        container.appendChild(listWrap);
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
            seasonHistory: this.seasonHistory,
            nxgnHistory: this.nxgnHistory
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
        if (saveData.nxgnHistory) {
            this.nxgnHistory = saveData.nxgnHistory;
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
    archiveSeason(seasonName, potyOverride = null, nxgnOverride = null) {
        const nxgnData = nxgnOverride || this.generateNXGNTop10();
        const seasonData = {
            season: seasonName,
            poty: potyOverride || this.getPlayerOfTheSeason(),
            nxgnTop10: nxgnData,
            leagues: {}
        };
        this.nxgnHistory.unshift({ season: seasonName, top10: nxgnData });

        for (let i = 1; i <= 3; i++) {
            seasonData.leagues[i] = {
                topScorer: this.getTopScorer(i),
                topAssister: this.getTopAssister(i),
                best11: this.getSeasonBest11(i) // 시즌 베스트 11 메서드 사용
            };
        }

        // [신규] 9개국 리그별 + 리그 전체 기록
        seasonData.leaguesById = {};
        const archiveIds = [...((typeof LEAGUES_CONFIG !== 'undefined') ? Object.keys(LEAGUES_CONFIG) : []), 'all'];
        archiveIds.forEach(id => {
            seasonData.leaguesById[id] = {
                topScorer: this.getTopScorer(id),
                topAssister: this.getTopAssister(id),
                best11: this.getSeasonBest11(id).map(p => ({ name: p.name, position: p.position, team: p.team }))
            };
        });

        this.seasonHistory.unshift(seasonData); // 최신 시즌이 앞으로
        console.log(`[Records] ${seasonName} 시즌 기록 아카이빙 완료`);
    }

    // 역대 기록 표시
    displayHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;
        
        container.replaceChildren();

        // [신규] 역대기록 리그 필터 (리그 전체 + 9개국)
        const selLeague = this.historyLeague || 'all';
        const filterBar = document.createElement('div');
        filterBar.style.cssText = 'display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin:0 0 20px;';
        const filterIds = ['all', ...((typeof LEAGUES_CONFIG !== 'undefined') ? Object.keys(LEAGUES_CONFIG) : [])];
        filterIds.forEach(id => {
            const cfg = (typeof LEAGUES_CONFIG !== 'undefined') ? LEAGUES_CONFIG[id] : null;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'league-switch-btn' + (id === selLeague ? ' active' : '');
            b.textContent = id === 'all' ? '🌍 리그 전체' : (cfg ? `${cfg.flag || ''} ${cfg.name}`.trim() : id);
            b.style.cssText = 'padding:6px 14px; border:1px solid rgba(255,255,255,0.3); border-radius:20px; color:white; cursor:pointer; background:' + (id === selLeague ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)');
            b.addEventListener('click', () => { this.historyLeague = id; this.displayHistory(); });
            filterBar.appendChild(b);
        });
        container.appendChild(filterBar);

        
        if (this.seasonHistory.length === 0) {
            const emptyBox = document.createElement('div');
            emptyBox.style.cssText = 'text-align: center; padding: 50px; color: #94A3B8;';

            const icon = document.createElement('div');
            icon.style.cssText = 'font-size: 2.5rem; margin-bottom: 20px; color: #38BDF8; display: flex; justify-content: center;';
            icon.innerHTML = typeof iconSVG === 'function' ? iconSVG('trophy') : '';

            const h3 = document.createElement('h3');
            h3.textContent = '아직 명예의 전당에 등록된 시즌이 없습니다.';

            const p = document.createElement('p');
            p.textContent = '한 시즌을 완료하면 이곳에 영광스러운 기록이 남습니다.';

            emptyBox.append(icon, h3, p);
            container.appendChild(emptyBox);
            return;
        }

        this.seasonHistory.forEach(data => {
            const seasonCard = document.createElement('div');
            seasonCard.className = 'history-card';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'history-header';
            const seasonH4 = document.createElement('h4');
            seasonH4.textContent = `${data.season} 시즌`;
            headerDiv.appendChild(seasonH4);
            seasonCard.appendChild(headerDiv);

            if (data.poty) {
                const potyDiv = document.createElement('div');
                potyDiv.className = 'history-poty';

                const potyIcon = document.createElement('div');
                potyIcon.className = 'poty-icon';
                potyIcon.innerHTML = typeof iconSVG === 'function' ? iconSVG('crown') : '';

                const potyInfo = document.createElement('div');
                potyInfo.className = 'poty-info';

                const potyLabel = document.createElement('div');
                potyLabel.className = 'history-label';
                potyLabel.textContent = "올해의 선수 (Ballon d'Or)";

                const potyVal = document.createElement('div');
                potyVal.className = 'history-value player-name';
                potyVal.textContent = data.poty.name;

                const potySub = document.createElement('div');
                potySub.className = 'history-sub';
                const teamLabel = teamNames[data.poty.team] || data.poty.team;
                const detailParts = [teamLabel];
                if (data.poty.avgRating) detailParts.push(`평균 평점 ${data.poty.avgRating}`);
                if (typeof data.poty.goals === 'number' || typeof data.poty.assists === 'number') {
                    detailParts.push(`${data.poty.goals || 0}골 ${data.poty.assists || 0}도움`);
                }
                if (data.poty.moms) detailParts.push(`MOM ${data.poty.moms}회`);
                if (data.poty.isChampion) detailParts.push('1부리그 우승');
                potySub.textContent = detailParts.join(' · ');

                potyInfo.append(potyLabel, potyVal, potySub);
                potyDiv.append(potyIcon, potyInfo);
                seasonCard.appendChild(potyDiv);
            }

            const leaguesContainer = document.createElement('div');
            leaguesContainer.className = 'history-leagues';

            const histEntries = [];
            if (data.leaguesById) {
                histEntries.push([this.getLeagueLabel(selLeague), data.leaguesById[selLeague]]);
            } else if (selLeague === 'all') {
                for (let i = 1; i <= 3; i++) histEntries.push([`${i}부 리그`, data.leagues && data.leagues[i]]);
            }
            for (const [histTitle, leagueData] of histEntries) {
                
                if (!leagueData) continue;

                const leagueSection = document.createElement('div');
                leagueSection.className = 'history-league-section';

                const leagueTitle = document.createElement('h5');
                leagueTitle.className = 'league-title';
                leagueTitle.textContent = histTitle;
                leagueSection.appendChild(leagueTitle);

                const statsGrid = document.createElement('div');
                statsGrid.className = 'history-stats-grid';

                // 득점왕
                const scorerStat = document.createElement('div');
                scorerStat.className = 'history-stat';
                const scorerLabel = document.createElement('span');
                scorerLabel.className = 'label';
                scorerLabel.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('football') : ''} <span>득점왕</span>`;
                const scorerVal = document.createElement('span');
                scorerVal.className = 'value';
                scorerVal.textContent = leagueData.topScorer ? `${leagueData.topScorer.playerName}` : '-';
                const scorerSub = document.createElement('span');
                scorerSub.className = 'sub-value';
                scorerSub.textContent = leagueData.topScorer ? `${leagueData.topScorer.goals}골` : '';
                scorerStat.append(scorerLabel, scorerVal, scorerSub);

                // 도움왕
                const assisterStat = document.createElement('div');
                assisterStat.className = 'history-stat';
                const assisterLabel = document.createElement('span');
                assisterLabel.className = 'label';
                assisterLabel.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('award') : ''} <span>도움왕</span>`;
                const assisterVal = document.createElement('span');
                assisterVal.className = 'value';
                assisterVal.textContent = leagueData.topAssister ? `${leagueData.topAssister.playerName}` : '-';
                const assisterSub = document.createElement('span');
                assisterSub.className = 'sub-value';
                assisterSub.textContent = leagueData.topAssister ? `${leagueData.topAssister.assists}도움` : '';
                assisterStat.append(assisterLabel, assisterVal, assisterSub);

                statsGrid.append(scorerStat, assisterStat);
                leagueSection.appendChild(statsGrid);

                // 베스트 11
                if (leagueData.best11 && leagueData.best11.length > 0) {
                    const best11Sec = document.createElement('div');
                    best11Sec.className = 'history-best11-section';
                    const best11Title = document.createElement('div');
                    best11Title.className = 'best11-title';
                    best11Title.textContent = 'BEST 11';
                    const best11Grid = document.createElement('div');
                    best11Grid.className = 'best11-grid';

                    leagueData.best11.forEach(p => {
                        const bItem = document.createElement('div');
                        bItem.className = 'best11-item';
                        const posSpan = document.createElement('span');
                        posSpan.className = 'pos';
                        posSpan.textContent = p.position;
                        const nameSpan = document.createElement('span');
                        nameSpan.className = 'name';
                        nameSpan.textContent = p.name;
                        bItem.append(posSpan, nameSpan);
                        best11Grid.appendChild(bItem);
                    });

                    best11Sec.append(best11Title, best11Grid);
                    leagueSection.appendChild(best11Sec);
                }

                leaguesContainer.appendChild(leagueSection);
            }

            seasonCard.appendChild(leaguesContainer);
            container.appendChild(seasonCard);
        });
    }

    // LeagueBasedRecordsSystem 클래스 내부에 추가

// 특정 리그의 득점왕 1명 반환
getTopScorer(league) {
    const divisionKey = this.toDivisionKey(league);
    
    const scorers = this.getLeagueEntries(league)
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
    const divisionKey = this.toDivisionKey(league);
    
    const assisters = this.getLeagueEntries(league)
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
        console.log('Records System 인스턴스가 생성되었습니다.');
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
        console.error('Records system이 초기화되지 않았습니다!');
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
        console.error('Records system이 초기화되지 않았습니다!');
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

//  핵심: 모든 스크립트 로드 완료 후 자동 생성
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM 로드 완료, Records System 초기화 시도...');
        initRecordsSystemInstance();
    });
} else {
    // 이미 로드된 경우 즉시 실행
    console.log('이미 로드됨, Records System 초기화 시도...');
    initRecordsSystemInstance();
}

//  반응형 스타일 추가 (개인기록 탭 전용)
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
        color: #CBD5E1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
    }

    .player-stats {
        font-weight: 800;
        color: #A3E635;
        min-width: 50px;
        text-align: right;
        font-size: 1.1em;
        font-variant-numeric: tabular-nums;
    }

    /* 주간 베스트 11 피치 스타일 */
    .best11-pitch {
        background: radial-gradient(circle at 50% 50%, #143627 0%, #0b2218 75%, #071710 100%);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 8px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 550px;
        position: relative;
        box-shadow: inset 0 0 50px rgba(0,0,0,0.45);
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
        border: 1.5px solid rgba(255,255,255,0.14);
        border-radius: 50%;
        pointer-events: none;
    }
    
    .best11-pitch::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1.5px;
        background: rgba(255,255,255,0.14);
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
        background: transparent;
        border: none;
        width: 120px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: transform 0.2s;
    }
    
    .best11-player:hover {
        transform: translateY(-4px) scale(1.04);
        z-index: 10;
    }

    .best11-avatar-wrap {
        position: relative;
        width: 100px;
        height: 90px;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        overflow: visible !important;
        border-radius: 8px 8px 0 0;
        background: linear-gradient(180deg, rgba(17, 24, 39, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-bottom: none;
        margin-bottom: -16px;
    }

    .best11-player.user-player .best11-avatar-wrap {
        border-color: rgba(251, 191, 36, 0.65);
    }

    .best11-image {
        width: 100px !important;
        height: 100px !important;
        object-fit: contain !important;
        object-position: center bottom !important;
        transform: scale(1.45) translateY(24px) !important;
        transform-origin: center bottom !important;
        display: block;
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.75));
    }

    .best11-rating {
        position: absolute;
        top: 3px;
        left: 4px;
        background: rgba(9, 13, 22, 0.9);
        color: #FBBF24;
        font-weight: 900;
        font-size: 0.82rem;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(251, 191, 36, 0.35);
        font-variant-numeric: tabular-nums;
        line-height: 1.1;
    }

    .best11-nameplate {
        width: 118px;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 7px;
        padding: 5px 8px;
        margin-top: -2px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .best11-player.user-player .best11-nameplate {
        border-color: rgba(251, 191, 36, 0.65);
    }

    .best11-name {
        font-size: 0.88rem;
        font-weight: 800;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #F8FAFC;
    }

    .best11-team {
        font-size: 0.72rem;
        color: #CBD5E1;
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
