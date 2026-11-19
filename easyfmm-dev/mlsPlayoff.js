// mlsPlayoff.js - 미국 MLS 컨퍼런스 & MLS컵 플레이오프 시스템 (2025/26 규정)
// 와일드카드(8vs9 단판, PK직행) -> 1라운드(3판2선승, PK직행) -> 컨퍼런스 준결승/결승(단판, 연장+PK) -> MLS컵 결승(단판, 연장+PK)

const MLSPlayoffManager = {
    getTeamName(teamKey) {
        if (!teamKey) return '?';
        return (typeof teamNames !== 'undefined' && teamNames[teamKey]) ? teamNames[teamKey] : teamKey;
    },

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

    simulateMatchAI(homeKey, awayKey, allowExtraTime = false) {
        const rHome = this.getTeamRating(homeKey);
        const rAway = this.getTeamRating(awayKey);
        const diff = (rHome - rAway) / 10;
        let hg = Math.max(0, Math.min(5, Math.round((Math.random() * 2.2) + diff * 0.45 + 0.15)));
        let ag = Math.max(0, Math.min(5, Math.round((Math.random() * 2.1) - diff * 0.4)));
        let aet = false;
        let pk = null;
        let winner = null;

        if (hg === ag && allowExtraTime) {
            aet = true;
            const homeEtProb = Math.min(0.45, Math.max(0.12, 0.25 + diff * 0.08));
            const awayEtProb = Math.min(0.45, Math.max(0.12, 0.23 - diff * 0.08));
            if (Math.random() < homeEtProb) hg++;
            if (Math.random() < awayEtProb) ag++;
        }

        if (hg > ag) {
            winner = homeKey;
        } else if (ag > hg) {
            winner = awayKey;
        } else {
            const pkRes = this.rollPenaltyShootout(homeKey, awayKey);
            winner = pkRes.winner;
            pk = pkRes.pkText;
        }

        return {
            home: homeKey,
            away: awayKey,
            homeGoals: hg,
            awayGoals: ag,
            score: `${hg}-${ag}`,
            aet,
            pk,
            winner
        };
    },

    resolveUserMatch(matchData, allowExtraTime = false) {
        let hg = matchData.homeScore;
        let ag = matchData.awayScore;
        const homeKey = matchData.homeTeam;
        const awayKey = matchData.awayTeam;
        let aet = false;
        let pk = null;
        let winner = null;

        if (hg === ag && allowExtraTime) {
            aet = true;
            const rHome = this.getTeamRating(homeKey);
            const rAway = this.getTeamRating(awayKey);
            const diff = (rHome - rAway) / 10;
            const homeEtProb = Math.min(0.45, Math.max(0.12, 0.25 + diff * 0.08));
            const awayEtProb = Math.min(0.45, Math.max(0.12, 0.23 - diff * 0.08));
            if (Math.random() < homeEtProb) hg++;
            if (Math.random() < awayEtProb) ag++;
        }

        if (hg > ag) {
            winner = homeKey;
        } else if (ag > hg) {
            winner = awayKey;
        } else {
            const pkRes = this.rollPenaltyShootout(homeKey, awayKey);
            winner = pkRes.winner;
            pk = pkRes.pkText;
        }

        return {
            home: homeKey,
            away: awayKey,
            homeGoals: hg,
            awayGoals: ag,
            score: `${hg}-${ag}`,
            aet,
            pk,
            winner
        };
    },

    compareOverallRecord(po, teamA, teamB) {
        const recA = (po && po.overallStats && po.overallStats[teamA]) || { points: 0, goalDiff: 0, goalsFor: 0 };
        const recB = (po && po.overallStats && po.overallStats[teamB]) || { points: 0, goalDiff: 0, goalsFor: 0 };
        if (recA.points !== recB.points) return recA.points - recB.points;
        if (recA.goalDiff !== recB.goalDiff) return recA.goalDiff - recB.goalDiff;
        if (recA.goalsFor !== recB.goalsFor) return recA.goalsFor - recB.goalsFor;
        return 1; // 동률 시 동부(첫 인자) 홈 어드밴티지
    },

    createConferenceBracket(confStandings, confKey) {
        const top9 = confStandings.slice(0, 9);
        const seeds = {};
        const seedOf = {};
        top9.forEach((entry, idx) => {
            const seedNum = idx + 1;
            seeds[seedNum] = entry.team;
            seedOf[entry.team] = seedNum;
        });

        return {
            conf: confKey,
            seeds,
            seedOf,
            wc: {
                id: `${confKey}_WC`,
                high: seeds[8],
                low: seeds[9],
                highSeed: 8,
                lowSeed: 9,
                match: null,
                winner: null
            },
            r1: [
                { id: `${confKey}_R1_1`, high: seeds[1], low: null, highSeed: 1, lowSeed: null, games: [], highWins: 0, lowWins: 0, winner: null, winnerSeed: null },
                { id: `${confKey}_R1_2`, high: seeds[2], low: seeds[7], highSeed: 2, lowSeed: 7, games: [], highWins: 0, lowWins: 0, winner: null, winnerSeed: null },
                { id: `${confKey}_R1_3`, high: seeds[3], low: seeds[6], highSeed: 3, lowSeed: 6, games: [], highWins: 0, lowWins: 0, winner: null, winnerSeed: null },
                { id: `${confKey}_R1_4`, high: seeds[4], low: seeds[5], highSeed: 4, lowSeed: 5, games: [], highWins: 0, lowWins: 0, winner: null, winnerSeed: null }
            ],
            sf: [
                { id: `${confKey}_SF_1`, high: null, low: null, highSeed: null, lowSeed: null, match: null, winner: null, winnerSeed: null },
                { id: `${confKey}_SF_2`, high: null, low: null, highSeed: null, lowSeed: null, match: null, winner: null, winnerSeed: null }
            ],
            final: {
                id: `${confKey}_FINAL`,
                high: null,
                low: null,
                highSeed: null,
                lowSeed: null,
                match: null,
                winner: null,
                winnerSeed: null
            }
        };
    },

    init(eastStandings, westStandings, overallStandings) {
        if (!eastStandings || eastStandings.length < 9 || !westStandings || westStandings.length < 9) return null;

        const overallStats = {};
        (overallStandings || [...eastStandings, ...westStandings]).forEach((entry, idx) => {
            overallStats[entry.team] = {
                overallRank: idx + 1,
                points: entry.points || 0,
                goalDiff: entry.goalDiff !== undefined ? entry.goalDiff : ((entry.goalsFor || 0) - (entry.goalsAgainst || 0)),
                goalsFor: entry.goalsFor || 0
            };
        });

        const supportersShield = (overallStandings && overallStandings[0]) ? overallStandings[0].team : eastStandings[0].team;
        const po = {
            season: (typeof gameData !== 'undefined' && gameData.startYear) ? gameData.startYear : 2025,
            stage: 'WC',
            completed: false,
            supportersShield,
            overallStats,
            champion: null,
            runnerUp: null,
            eastChamp: null,
            westChamp: null,
            east: this.createConferenceBracket(eastStandings, 'east'),
            west: this.createConferenceBracket(westStandings, 'west'),
            cupFinal: { home: null, away: null, match: null, winner: null }
        };

        if (typeof gameData !== 'undefined') {
            gameData.mlsPlayoff = po;
        }

        const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
        const userInWC = userTeam && (
            po.east.wc.high === userTeam || po.east.wc.low === userTeam ||
            po.west.wc.high === userTeam || po.west.wc.low === userTeam
        );

        // 유저가 1~7위 직행 시드(또는 비플레이오프)라면 와일드카드를 즉시 AI 진행하고 1라운드(3판2선승)부터 시작
        if (!userInWC) {
            this.simulateWildCardMatches(po);
            po.stage = 'R1_G1';
        }

        return po;
    },

    isUserInPlayoffs(po, userTeam) {
        if (!po || !userTeam) return false;
        return !!(po.east.seedOf[userTeam] || po.west.seedOf[userTeam]);
    },

    getUserConference(po, userTeam) {
        if (!po || !userTeam) return null;
        if (po.east.seedOf[userTeam]) return po.east;
        if (po.west.seedOf[userTeam]) return po.west;
        return null;
    },

    simulateWildCardMatches(po) {
        [po.east, po.west].forEach(conf => {
            if (!conf.wc.winner) {
                const res = this.simulateMatchAI(conf.wc.high, conf.wc.low, false);
                conf.wc.match = res;
                conf.wc.winner = res.winner;
                const wSeed = conf.seedOf[res.winner] || (res.winner === conf.wc.high ? 8 : 9);
                conf.r1[0].low = res.winner;
                conf.r1[0].lowSeed = wSeed;
            }
        });
    },

    recordR1GameResult(series, res) {
        series.games.push(res);
        if (res.winner === series.high) series.highWins++;
        else series.lowWins++;

        if (series.highWins >= 2) {
            series.winner = series.high;
            series.winnerSeed = series.highSeed;
        } else if (series.lowWins >= 2) {
            series.winner = series.low;
            series.winnerSeed = series.lowSeed;
        }
    },

    populateConfSemifinals(po) {
        [po.east, po.west].forEach(conf => {
            const r1 = conf.r1;
            const pairSF = (sfSlot, sA, sB) => {
                if (!sA.winner || !sB.winner) return;
                // 컨퍼런스 시드 숫자가 작은 팀이 상위 시드(홈 어드밴티지)
                if (sA.winnerSeed <= sB.winnerSeed) {
                    sfSlot.high = sA.winner;
                    sfSlot.highSeed = sA.winnerSeed;
                    sfSlot.low = sB.winner;
                    sfSlot.lowSeed = sB.winnerSeed;
                } else {
                    sfSlot.high = sB.winner;
                    sfSlot.highSeed = sB.winnerSeed;
                    sfSlot.low = sA.winner;
                    sfSlot.lowSeed = sA.winnerSeed;
                }
            };
            pairSF(conf.sf[0], r1[0], r1[3]); // (1 vs WC) 승자 vs (4 vs 5) 승자
            pairSF(conf.sf[1], r1[1], r1[2]); // (2 vs 7) 승자 vs (3 vs 6) 승자
        });
    },

    populateConfFinals(po) {
        [po.east, po.west].forEach(conf => {
            const sA = conf.sf[0];
            const sB = conf.sf[1];
            if (!sA.winner || !sB.winner) return;
            if (sA.winnerSeed <= sB.winnerSeed) {
                conf.final.high = sA.winner;
                conf.final.highSeed = sA.winnerSeed;
                conf.final.low = sB.winner;
                conf.final.lowSeed = sB.winnerSeed;
            } else {
                conf.final.high = sB.winner;
                conf.final.highSeed = sB.winnerSeed;
                conf.final.low = sA.winner;
                conf.final.lowSeed = sA.winnerSeed;
            }
        });
    },

    populateMLSCupFinal(po) {
        const eChamp = po.east.final.winner;
        const wChamp = po.west.final.winner;
        if (!eChamp || !wChamp) return;
        po.eastChamp = eChamp;
        po.westChamp = wChamp;
        // 정규 시즌 통합 성적이 더 좋은 팀의 홈 구장에서 MLS컵 결승 단판 개최
        if (this.compareOverallRecord(po, eChamp, wChamp) >= 0) {
            po.cupFinal.home = eChamp;
            po.cupFinal.away = wChamp;
        } else {
            po.cupFinal.home = wChamp;
            po.cupFinal.away = eChamp;
        }
    },

    checkAndSetupMatch() {
        const po = (typeof gameData !== 'undefined') ? gameData.mlsPlayoff : null;
        const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
        if (!po || po.completed || !userTeam) {
            if (typeof gameData !== 'undefined') {
                gameData.isMLSPlayoffMatch = false;
            }
            return false;
        }

        const setMatch = (home, away, stageCode) => {
            gameData.isPlayoffMatch = true;
            gameData.isMLSPlayoffMatch = true;
            gameData.isFACupMatch = false;
            gameData.isUCLMatch = false;
            gameData.playoffStage = stageCode;
            gameData.currentOpponent = (home === userTeam) ? away : home;
            gameData.isHomeGame = (home === userTeam);
            return true;
        };

        const conf = this.getUserConference(po, userTeam);
        if (!conf && po.stage !== 'MLS_CUP') {
            gameData.isMLSPlayoffMatch = false;
            return false;
        }

        if (po.stage === 'WC' && conf) {
            if (!conf.wc.winner && (conf.wc.high === userTeam || conf.wc.low === userTeam)) {
                return setMatch(conf.wc.high, conf.wc.low, 'MLS_WC');
            }
        } else if ((po.stage === 'R1_G1' || po.stage === 'R1_G2' || po.stage === 'R1_G3') && conf) {
            const gameIdx = po.stage === 'R1_G1' ? 0 : (po.stage === 'R1_G2' ? 1 : 2);
            const series = conf.r1.find(s => !s.winner && (s.high === userTeam || s.low === userTeam));
            if (series && series.games.length === gameIdx) {
                // 1차전·3차전은 상위 시드 홈, 2차전은 하위 시드 홈
                const home = (gameIdx === 1) ? series.low : series.high;
                const away = (gameIdx === 1) ? series.high : series.low;
                return setMatch(home, away, `MLS_${po.stage}`);
            }
        } else if (po.stage === 'CONF_SF' && conf) {
            const tie = conf.sf.find(s => !s.winner && (s.high === userTeam || s.low === userTeam));
            if (tie) {
                return setMatch(tie.high, tie.low, 'MLS_CONF_SF');
            }
        } else if (po.stage === 'CONF_FINAL' && conf) {
            const f = conf.final;
            if (!f.winner && (f.high === userTeam || f.low === userTeam)) {
                return setMatch(f.high, f.low, 'MLS_CONF_FINAL');
            }
        } else if (po.stage === 'MLS_CUP') {
            const cf = po.cupFinal;
            if (!cf.winner && (cf.home === userTeam || cf.away === userTeam)) {
                return setMatch(cf.home, cf.away, 'MLS_CUP');
            }
        }

        gameData.isMLSPlayoffMatch = false;
        gameData.isPlayoffMatch = false;
        return false;
    },

    simulateRemainingAI() {
        const po = (typeof gameData !== 'undefined') ? gameData.mlsPlayoff : null;
        if (!po) return null;

        this.simulateWildCardMatches(po);

        // 1라운드 (Best-of-3) 미완료 시리즈 모두 마무리
        [po.east, po.west].forEach(conf => {
            conf.r1.forEach(series => {
                while (!series.winner && series.games.length < 3) {
                    const gIdx = series.games.length;
                    const home = (gIdx === 1) ? series.low : series.high;
                    const away = (gIdx === 1) ? series.high : series.low;
                    const res = this.simulateMatchAI(home, away, false);
                    this.recordR1GameResult(series, res);
                }
            });
        });

        this.populateConfSemifinals(po);
        [po.east, po.west].forEach(conf => {
            conf.sf.forEach(tie => {
                if (!tie.winner && tie.high && tie.low) {
                    const res = this.simulateMatchAI(tie.high, tie.low, true);
                    tie.match = res;
                    tie.winner = res.winner;
                    tie.winnerSeed = (res.winner === tie.high) ? tie.highSeed : tie.lowSeed;
                }
            });
        });

        this.populateConfFinals(po);
        [po.east, po.west].forEach(conf => {
            const f = conf.final;
            if (!f.winner && f.high && f.low) {
                const res = this.simulateMatchAI(f.high, f.low, true);
                f.match = res;
                f.winner = res.winner;
                f.winnerSeed = (res.winner === f.high) ? f.highSeed : f.lowSeed;
            }
        });

        this.populateMLSCupFinal(po);
        if (!po.cupFinal.winner && po.cupFinal.home && po.cupFinal.away) {
            const res = this.simulateMatchAI(po.cupFinal.home, po.cupFinal.away, true);
            po.cupFinal.match = res;
            po.cupFinal.winner = res.winner;
        }

        po.stage = 'DONE';
        po.completed = true;
        po.champion = po.cupFinal.winner;
        po.runnerUp = (po.champion === po.cupFinal.home) ? po.cupFinal.away : po.cupFinal.home;
        return po;
    },

    simulateAllAI(eastStandings, westStandings, overallStandings) {
        if (typeof gameData !== 'undefined' && !gameData.mlsPlayoff) {
            this.init(eastStandings, westStandings, overallStandings);
        }
        if (typeof gameData !== 'undefined' && gameData.mlsPlayoff && !gameData.mlsPlayoff.completed) {
            return this.simulateRemainingAI();
        }
        return (typeof gameData !== 'undefined') ? gameData.mlsPlayoff : null;
    },

    formatResultSuffix(res) {
        if (!res) return '';
        if (res.aet && res.pk) return ` (연장 후 ${res.pk})`;
        if (res.aet) return ' (연장)';
        if (res.pk) return ` (${res.pk})`;
        return '';
    },

    handleUserMatchEnd(matchData, silent = false) {
        const po = (typeof gameData !== 'undefined') ? gameData.mlsPlayoff : null;
        const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
        if (!po || !userTeam) return;

        const notify = (subject, body, sendMail = true) => {
            if (sendMail && typeof mailManager !== 'undefined') {
                mailManager.addMail(subject, 'MLS 사무국', body);
            }
            if (!silent && typeof alert === 'function') {
                alert(body);
            }
        };

        const conf = this.getUserConference(po, userTeam);

        if (po.stage === 'WC' && conf) {
            const res = this.resolveUserMatch(matchData, false);
            conf.wc.match = res;
            conf.wc.winner = res.winner;
            const wSeed = conf.seedOf[res.winner] || (res.winner === conf.wc.high ? 8 : 9);
            conf.r1[0].low = res.winner;
            conf.r1[0].lowSeed = wSeed;

            // 반대편 컨퍼런스 와일드카드 AI 시뮬레이션
            this.simulateWildCardMatches(po);

            const suf = this.formatResultSuffix(res);
            const scoreLine = `${this.getTeamName(res.home)} ${res.score} ${this.getTeamName(res.away)}${suf}`;
            if (res.winner === userTeam) {
                po.stage = 'R1_G1';
                const topOpp = this.getTeamName(conf.r1[0].high);
                notify(
                    '[MLS 플레이오프] 와일드카드 돌파! 1라운드 진출',
                    `🔥 [와일드카드 승리!]\n${scoreLine}\n극적인 승리를 거두고 컨퍼런스 1번 시드 ${topOpp}와(과)의 1라운드(3판 2선승제)에 진출했습니다!`
                );
            } else {
                this.simulateRemainingAI();
                notify(
                    '[MLS 플레이오프] 와일드카드 패배 및 시즌 종료',
                    `😢 [와일드카드 탈락]\n${scoreLine}\n아쉽게 와일드카드 단판 승부에서 패배하여 플레이오프 여정이 종료되었습니다.\n(MLS컵 최종 우승: ${this.getTeamName(po.champion)})`
                );
            }
        } else if ((po.stage === 'R1_G1' || po.stage === 'R1_G2' || po.stage === 'R1_G3') && conf) {
            const gameNum = po.stage === 'R1_G1' ? 1 : (po.stage === 'R1_G2' ? 2 : 3);
            const userSeries = conf.r1.find(s => !s.winner && (s.high === userTeam || s.low === userTeam));
            const res = this.resolveUserMatch(matchData, false);
            if (userSeries) {
                this.recordR1GameResult(userSeries, res);
            }

            // 같은 차수 AI 시리즈 진행
            [po.east, po.west].forEach(c => {
                c.r1.forEach(s => {
                    if (s === userSeries || s.winner) return;
                    if (s.games.length < gameNum) {
                        const gIdx = s.games.length;
                        const h = (gIdx === 1) ? s.low : s.high;
                        const a = (gIdx === 1) ? s.high : s.low;
                        const aiRes = this.simulateMatchAI(h, a, false);
                        this.recordR1GameResult(s, aiRes);
                    }
                });
            });

            const suf = this.formatResultSuffix(res);
            const scoreLine = `${this.getTeamName(res.home)} ${res.score} ${this.getTeamName(res.away)}${suf}`;
            const seriesScore = userSeries ? `${userSeries.highWins}-${userSeries.lowWins}` : '';

            if (po.stage === 'R1_G1') {
                po.stage = 'R1_G2';
                const statusTxt = res.winner === userTeam ? '1승 선점!' : '1차전 패배';
                notify(
                    `[MLS 플레이오프] 1라운드 1차전 결과 (${statusTxt})`,
                    `[MLS컵 1라운드 1차전 종료]\n${scoreLine}\n시리즈 전적(${this.getTeamName(userSeries.high)} 기준): ${seriesScore}\n이제 장소를 옮겨 2차전이 열립니다!`,
                    false
                );
            } else if (userSeries && userSeries.winner) {
                if (userSeries.winner === userTeam) {
                    // 유저가 2-0 또는 2-1로 통과 -> 1-1 상태인 다른 AI 시리즈 3차전 자동 마무리 후 준결승 진행
                    [po.east, po.west].forEach(c => {
                        c.r1.forEach(s => {
                            while (!s.winner && s.games.length < 3) {
                                const gIdx = s.games.length;
                                const h = (gIdx === 1) ? s.low : s.high;
                                const a = (gIdx === 1) ? s.high : s.low;
                                this.recordR1GameResult(s, this.simulateMatchAI(h, a, false));
                            }
                        });
                    });
                    this.populateConfSemifinals(po);
                    po.stage = 'CONF_SF';
                    const nextTie = conf.sf.find(t => t.high === userTeam || t.low === userTeam);
                    const nextOpp = nextTie ? (nextTie.high === userTeam ? nextTie.low : nextTie.high) : null;
                    notify(
                        '🔥 [MLS 플레이오프] 컨퍼런스 준결승 진출!',
                        `🔥 [1라운드 ${gameNum}차전 승리 · 컨퍼런스 준결승 진출!]\n${scoreLine}\n시리즈 전적 ${seriesScore}로 1라운드를 돌파했습니다!\n준결승(단판) 상대: ${this.getTeamName(nextOpp)}`
                    );
                } else {
                    this.simulateRemainingAI();
                    notify(
                        '[MLS 플레이오프] 1라운드 탈락',
                        `😢 [1라운드 ${gameNum}차전 패배 · 탈락]\n${scoreLine}\n시리즈 전적 ${seriesScore}로 아쉽게 컨퍼런스 준결승 진출에 실패했습니다.\n(MLS컵 최종 우승: ${this.getTeamName(po.champion)})`
                    );
                }
            } else {
                // 2차전 종료 후 1-1 동률 -> 운명의 3차전
                po.stage = 'R1_G3';
                notify(
                    '[MLS 플레이오프] 시리즈 1-1! 최종 3차전 돌입',
                    `⚡ [1라운드 2차전 종료 · 시리즈 1-1!]\n${scoreLine}\n시리즈가 1승 1패 원점이 되었습니다! 상위 시드 홈에서 운명의 3차전(단판)이 열립니다.`,
                    false
                );
            }
        } else if (po.stage === 'CONF_SF' && conf) {
            const userTie = conf.sf.find(s => !s.winner && (s.high === userTeam || s.low === userTeam));
            const res = this.resolveUserMatch(matchData, true);
            if (userTie) {
                userTie.match = res;
                userTie.winner = res.winner;
                userTie.winnerSeed = (res.winner === userTie.high) ? userTie.highSeed : userTie.lowSeed;
            }
            [po.east, po.west].forEach(c => {
                c.sf.forEach(t => {
                    if (!t.winner && t.high && t.low) {
                        const aiRes = this.simulateMatchAI(t.high, t.low, true);
                        t.match = aiRes;
                        t.winner = aiRes.winner;
                        t.winnerSeed = (aiRes.winner === t.high) ? t.highSeed : t.lowSeed;
                    }
                });
            });

            const suf = this.formatResultSuffix(res);
            const scoreLine = `${this.getTeamName(res.home)} ${res.score} ${this.getTeamName(res.away)}${suf}`;

            if (res.winner === userTeam) {
                this.populateConfFinals(po);
                po.stage = 'CONF_FINAL';
                const fOpp = (conf.final.high === userTeam) ? conf.final.low : conf.final.high;
                notify(
                    '🔥 [MLS 플레이오프] 컨퍼런스 결승 진출!',
                    `🔥 [컨퍼런스 준결승 승리!]\n${scoreLine}\n컨퍼런스 결승전(단판)에 진출했습니다!\n결승 상대: ${this.getTeamName(fOpp)}`
                );
            } else {
                this.simulateRemainingAI();
                notify(
                    '[MLS 플레이오프] 컨퍼런스 준결승 탈락',
                    `😢 [컨퍼런스 준결승 패배]\n${scoreLine}\n아쉽게 컨퍼런스 결승 문턱에서 탈락했습니다.\n(MLS컵 최종 우승: ${this.getTeamName(po.champion)})`
                );
            }
        } else if (po.stage === 'CONF_FINAL' && conf) {
            const f = conf.final;
            const res = this.resolveUserMatch(matchData, true);
            f.match = res;
            f.winner = res.winner;
            f.winnerSeed = (res.winner === f.high) ? f.highSeed : f.lowSeed;

            [po.east, po.west].forEach(c => {
                if (!c.final.winner && c.final.high && c.final.low) {
                    const aiRes = this.simulateMatchAI(c.final.high, c.final.low, true);
                    c.final.match = aiRes;
                    c.final.winner = aiRes.winner;
                    c.final.winnerSeed = (aiRes.winner === c.final.high) ? c.final.highSeed : c.final.lowSeed;
                }
            });

            const suf = this.formatResultSuffix(res);
            const scoreLine = `${this.getTeamName(res.home)} ${res.score} ${this.getTeamName(res.away)}${suf}`;

            if (res.winner === userTeam) {
                this.populateMLSCupFinal(po);
                po.stage = 'MLS_CUP';
                const cupOpp = (po.cupFinal.home === userTeam) ? po.cupFinal.away : po.cupFinal.home;
                const hostLoc = (po.cupFinal.home === userTeam) ? '우리 팀 홈구장' : `${this.getTeamName(cupOpp)} 원정`;
                notify(
                    '🏆 [MLS] 컨퍼런스 우승! MLS컵 파이널 진출!',
                    `🏆 [컨퍼런스 챔피언 등극!!]\n${scoreLine}\n컨퍼런스 정상에 올라 대망의 MLS컵 결승(MLS Cup Final)에 진출했습니다!\n상대: ${this.getTeamName(cupOpp)} (${hostLoc})`
                );
            } else {
                this.simulateRemainingAI();
                notify(
                    '[MLS 플레이오프] 컨퍼런스 결승 패배',
                    `😢 [컨퍼런스 결승 아쉽게 패배]\n${scoreLine}\n컨퍼런스 준우승으로 시즌을 마쳤습니다.\n(MLS컵 최종 우승: ${this.getTeamName(po.champion)})`
                );
            }
        } else if (po.stage === 'MLS_CUP') {
            const res = this.resolveUserMatch(matchData, true);
            po.cupFinal.match = res;
            po.cupFinal.winner = res.winner;
            po.stage = 'DONE';
            po.completed = true;
            po.champion = res.winner;
            po.runnerUp = (res.winner === po.cupFinal.home) ? po.cupFinal.away : po.cupFinal.home;

            const suf = this.formatResultSuffix(res);
            const scoreLine = `${this.getTeamName(res.home)} ${res.score} ${this.getTeamName(res.away)}${suf}`;
            if (res.winner === userTeam) {
                notify(
                    '🏆 [우승] MLS컵 최종 챔피언 등극!',
                    `🏆 [MLS컵 우승 확정!!]\n${scoreLine}\n미국 프로축구 최정상의 트로피 'MLS Cup'을 들어올렸습니다!!`
                );
            } else {
                notify(
                    '🥈 [준우승] MLS컵 파이널 아쉽게 패배',
                    `🥈 [MLS컵 준우승]\n${scoreLine}\n결승전 혈투 끝에 아쉽게 준우승에 머물렀습니다. (${this.getTeamName(po.champion)} 우승)`
                );
            }
        }

        if (typeof gameData !== 'undefined') {
            gameData.isPlayoffMatch = false;
            gameData.isMLSPlayoffMatch = false;
            gameData.playoffStage = null;
        }
    }
};

function renderMLSPlayoffBracketCard(eastStandings, westStandings, overallStandings) {
    const po = (typeof gameData !== 'undefined') ? (gameData.mlsPlayoff || gameData.lastMLSPlayoffBracket) : null;
    if ((!eastStandings || eastStandings.length < 9) && !po) return null;

    const tName = (k) => !k ? '?' : ((typeof teamNames !== 'undefined' && teamNames[k]) ? teamNames[k] : k);
    const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
    const hl = (k, label) => {
        const txt = label || tName(k);
        return (k && k === userTeam) ? `<span style="color:#FBBF24; font-weight:800;">★ ${txt}</span>` : txt;
    };

    const card = document.createElement('div');
    card.style.cssText = 'margin-top: 16px; padding: 16px; border-radius: 14px; background: linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,41,59,0.9)); border: 1px solid rgba(56,189,248,0.35);';

    const header = document.createElement('div');
    header.style.cssText = 'font-weight: 800; font-size: 0.98rem; color: #38BDF8; margin-bottom: 12px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;';

    if (po) {
        const stageLabels = {
            WC: '와일드카드 (단판)',
            R1_G1: '1라운드 1차전 (3판2선승)',
            R1_G2: '1라운드 2차전 (3판2선승)',
            R1_G3: '1라운드 최종 3차전',
            CONF_SF: '컨퍼런스 준결승 (단판)',
            CONF_FINAL: '컨퍼런스 결승 (단판)',
            MLS_CUP: 'MLS컵 파이널',
            DONE: `🏆 MLS컵 우승: ${tName(po.champion)}`
        };
        const statusColor = po.completed ? '#FBBF24' : '#34D399';
        header.innerHTML = `
            <span>🇺🇸 Audi MLS컵 플레이오프 대진표</span>
            <span style="font-size:0.82rem; color:${statusColor};">${stageLabels[po.stage] || '진행 중'}</span>
        `;
    } else {
        const shieldLeader = (overallStandings && overallStandings[0]) ? tName(overallStandings[0].team) : '-';
        header.innerHTML = `
            <span>🇺🇸 Audi MLS컵 플레이오프 예상 대진 (동·서부 상위 9팀)</span>
            <span style="font-size:0.78rem; color:#94A3B8;">34R 종료 후 진행 · 🛡️ 통합 1위: ${shieldLeader}</span>
        `;
    }
    card.appendChild(header);

    // 서포터스 실드 배너
    if (po && po.supportersShield) {
        const shieldBanner = document.createElement('div');
        shieldBanner.style.cssText = 'margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); font-size: 0.82rem; color: #FDE68A; display: flex; justify-content: space-between; align-items: center;';
        shieldBanner.innerHTML = `<span>🛡️ <strong>서포터스 실드 (정규리그 통합 1위)</strong>: ${hl(po.supportersShield)}</span><span style="color:#94A3B8; font-size:0.76rem;">정규리그 최다 승점</span>`;
        card.appendChild(shieldBanner);
    }

    const renderConfSection = (label, confData, projStandings) => {
        const box = document.createElement('div');
        box.style.cssText = 'background: rgba(15,23,42,0.68); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px;';

        if (confData) {
            const wc = confData.wc;
            const wcScore = wc.match ? `${wc.match.score}${wc.match.pk ? ` (${wc.match.pk})` : ''}` : '단판 (연장 없음·PK직행)';
            const wcWin = wc.winner ? `<span style="color:#34D399; font-weight:700;"> → ${hl(wc.winner)}</span>` : '';

            const r1HTML = confData.r1.map((s, idx) => {
                const oppLabel = s.low ? `${s.lowSeed}위 ${hl(s.low)}` : 'WC 승자';
                const gamesTxt = s.games.length > 0
                    ? s.games.map((g, gi) => `${gi + 1}차전 ${g.score}${g.pk ? `(${g.pk})` : ''}`).join(' · ')
                    : '3판 2선승 (무승부 시 PK직행)';
                const winBadge = s.winner ? `<span style="color:#34D399; font-weight:700;"> [${s.highWins}-${s.lowWins} ${hl(s.winner)}]</span>` : (s.games.length > 0 ? ` <span style="color:#FBBF24;">(${s.highWins}-${s.lowWins})</span>` : '');
                return `<div style="padding:6px 8px; border-radius:6px; background:rgba(30,41,59,0.65); margin-bottom:5px;">
                    <div style="font-weight:700; font-size:0.8rem;">1R-${idx + 1}: ${s.highSeed}위 ${hl(s.high)} vs ${oppLabel}${winBadge}</div>
                    <div style="font-size:0.73rem; color:#94A3B8; margin-top:2px;">${gamesTxt}</div>
                </div>`;
            }).join('');

            const sfHTML = confData.sf.map((t, idx) => {
                const matchup = (t.high && t.low) ? `${t.highSeed}위 ${hl(t.high)} vs ${t.lowSeed}위 ${hl(t.low)}` : `1R-${idx === 0 ? '1·4' : '2·3'} 승자`;
                const sc = t.match ? `${t.match.score}${MLSPlayoffManager.formatResultSuffix(t.match)} → <span style="color:#34D399; font-weight:700;">${hl(t.winner)}</span>` : '단판 (연장+PK)';
                return `<div style="padding:5px 8px; border-radius:6px; background:rgba(30,41,59,0.5); margin-bottom:4px; font-size:0.76rem;">
                    <strong>준결승 ${idx + 1}:</strong> ${matchup} <span style="color:#CBD5E1;">· ${sc}</span>
                </div>`;
            }).join('');

            const f = confData.final;
            const fMatch = (f.high && f.low) ? `${f.highSeed}위 ${hl(f.high)} vs ${f.lowSeed}위 ${hl(f.low)}` : '준결승 승자 간 대결';
            const fScore = f.match ? `${f.match.score}${MLSPlayoffManager.formatResultSuffix(f.match)} → <span style="color:#FBBF24; font-weight:800;">🏆 ${hl(f.winner)}</span>` : '단판 (연장+PK)';

            box.innerHTML = `
                <div style="font-weight:800; color:#E2E8F0; font-size:0.88rem; margin-bottom:8px;">${label}</div>
                <div style="padding:6px 8px; border-radius:6px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); margin-bottom:8px; font-size:0.78rem;">
                    <strong>와일드카드:</strong> 8위 ${hl(wc.high)} vs 9위 ${hl(wc.low)} · <span style="color:#CBD5E1;">${wcScore}</span>${wcWin}
                </div>
                ${r1HTML}
                <div style="margin-top:6px;">${sfHTML}</div>
                <div style="padding:6px 8px; border-radius:6px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); font-size:0.78rem;">
                    <strong>컨퍼런스 결승:</strong> ${fMatch} · <span style="color:#CBD5E1;">${fScore}</span>
                </div>
            `;
        } else if (projStandings && projStandings.length >= 9) {
            const s = (r) => hl(projStandings[r - 1].team);
            box.innerHTML = `
                <div style="font-weight:800; color:#E2E8F0; font-size:0.88rem; margin-bottom:8px;">${label}</div>
                <div style="padding:6px 8px; border-radius:6px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); margin-bottom:6px; font-size:0.78rem;">
                    <strong>와일드카드 (단판):</strong> 8위 ${s(8)} vs 9위 ${s(9)}
                </div>
                <div style="font-size:0.77rem; color:#CBD5E1; display:grid; gap:4px;">
                    <div>• 1R-1 (3판2선승): 1위 ${s(1)} vs WC 승자</div>
                    <div>• 1R-2 (3판2선승): 2위 ${s(2)} vs 7위 ${s(7)}</div>
                    <div>• 1R-3 (3판2선승): 3위 ${s(3)} vs 6위 ${s(6)}</div>
                    <div>• 1R-4 (3판2선승): 4위 ${s(4)} vs 5위 ${s(5)}</div>
                </div>
            `;
        }
        return box;
    };

    const confGrid = document.createElement('div');
    confGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px;';
    confGrid.appendChild(renderConfSection('🗽 동부 컨퍼런스 (Eastern)', po ? po.east : null, eastStandings));
    confGrid.appendChild(renderConfSection('🌴 서부 컨퍼런스 (Western)', po ? po.west : null, westStandings));
    card.appendChild(confGrid);

    // MLS컵 파이널 배너
    const finalBox = document.createElement('div');
    finalBox.style.cssText = 'margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: linear-gradient(90deg, rgba(251,191,36,0.14), rgba(56,189,248,0.12)); border: 1px solid rgba(251,191,36,0.38); font-size: 0.85rem; color: #F8FAFC; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px;';
    if (po && po.cupFinal && po.cupFinal.home && po.cupFinal.away) {
        const cf = po.cupFinal;
        const scTxt = cf.match ? `${cf.match.score}${MLSPlayoffManager.formatResultSuffix(cf.match)}` : '단판 결승 (정규성적 상위 홈)';
        const winTxt = cf.winner ? `<strong style="color:#FBBF24;">🏆 MLS컵 챔피언: ${hl(cf.winner)}</strong>` : '<span style="color:#94A3B8;">최종 우승 결정전</span>';
        finalBox.innerHTML = `<span>🏆 <strong>MLS컵 파이널:</strong> ${hl(cf.home)} (홈) vs ${hl(cf.away)} · ${scTxt}</span>${winTxt}`;
    } else {
        finalBox.innerHTML = `<span>🏆 <strong>MLS컵 파이널 (MLS Cup Final):</strong> 동부 컨퍼런스 챔피언 vs 서부 컨퍼런스 챔피언</span><span style="color:#94A3B8; font-size:0.78rem;">정규 성적 상위 팀 홈 단판</span>`;
    }
    card.appendChild(finalBox);

    return card;
}

// 개발/테스트용: 정규시즌을 34R까지 즉시 스킵하고 MLS컵 플레이오프로 바로 진입
// mode: 'top1' (1위 직행 테스트) | 'wc' (8위 와일드카드 테스트) | 'auto' (실력대로 시뮬레이션)
function debugJumpToMLSPlayoffs(mode = 'top1') {
    if (typeof gameData === 'undefined' || !gameData.selectedTeam || typeof LeagueManager === 'undefined') {
        console.warn('[MLS Debug] 게임이 시작된 상태에서 실행해주세요.');
        return false;
    }
    const uLId = LeagueManager.getLeagueIdByTeam(gameData.selectedTeam);
    if (uLId !== 'mls') {
        console.warn(`[MLS Debug] 현재 선택된 팀(${gameData.selectedTeam})은 MLS 소속이 아닙니다.`);
        return false;
    }
    if (!gameData.schedule || !gameData.schedule.mls) {
        LeagueManager.generateAllLeagueSchedules();
    }
    if (!gameData.leagueData || !gameData.leagueData.mls) {
        LeagueManager.initializeAllLeagueData();
    }

    const mlsSched = gameData.schedule.mls;
    const mlsTable = gameData.leagueData.mls;
    const userTeam = gameData.selectedTeam;

    for (let r = 1; r <= 34; r++) {
        const roundMatches = mlsSched[r - 1];
        if (!roundMatches) continue;
        roundMatches.forEach(m => {
            if (m.played) return;
            let res;
            if (mode === 'top1' && (m.home === userTeam || m.away === userTeam)) {
                res = (m.home === userTeam) ? { homeGoals: 3, awayGoals: 0 } : { homeGoals: 0, awayGoals: 3 };
            } else {
                res = MLSPlayoffManager.simulateMatchAI(m.home, m.away, false);
            }
            LeagueManager.applyMatchResult(mlsTable, m.home, m.away, res.homeGoals, res.awayGoals);
            m.homeScore = res.homeGoals;
            m.awayScore = res.awayGoals;
            m.played = true;
        });
    }

    // 와일드카드(8위) 테스트 모드일 경우 컨퍼런스 8위권 승점으로 맞춰줌
    if (mode === 'wc' && typeof getLeagueStandingsSorted === 'function') {
        const userConf = LeagueManager.getMLSConference(userTeam);
        const confStandings = getLeagueStandingsSorted('mls').filter(e => LeagueManager.getMLSConference(e.team) === userConf);
        const others = confStandings.filter(e => e.team !== userTeam);
        if (others.length >= 9) {
            const p7 = others[6].points;
            const p8 = others[7].points;
            const targetPts = Math.max(0, Math.min(p7, p8 + 1));
            mlsTable[userTeam].points = targetPts;
            mlsTable[userTeam].goalsFor = Math.max(mlsTable[userTeam].goalsFor, (others[7].goalsFor || 30) + 1);
        }
    }

    gameData.currentRound = 35;
    gameData.matchesPlayed = 34;
    gameData.mlsPlayoff = null;
    if (typeof checkSeasonEnd === 'function') checkSeasonEnd();
    if (typeof LeagueManager.renderLeagueStandingsUI === 'function') LeagueManager.renderLeagueStandingsUI();
    if (typeof updateDisplay === 'function') updateDisplay();

    console.log('[MLS Debug] 34R 스킵 완료! 현재 플레이오프 단계:', gameData.mlsPlayoff ? gameData.mlsPlayoff.stage : '미진출');
    return gameData.mlsPlayoff;
}

window.MLSPlayoffManager = MLSPlayoffManager;
window.renderMLSPlayoffBracketCard = renderMLSPlayoffBracketCard;
window.debugJumpToMLSPlayoffs = debugJumpToMLSPlayoffs;
