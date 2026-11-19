// faCupSystem.js - 1·2·3부 42개 전 구단 통합 FA컵 (Easy Cup) 토너먼트 시스템

class FACupManager {
    constructor() {
        this.stages = ['R1', 'R32', 'R16', 'QF', 'SF', 'FINAL'];
        this.stageNames = {
            'R1': '1라운드 (예선전)',
            'R32': '본선 32강',
            'R16': '16강전',
            'QF': '8강전 (준준결승)',
            'SF': '4강전 (준결승)',
            'FINAL': '결승전 (The Final)'
        };
        // 리그 라운드 직후 열리는 FA컵 주차 매핑
        this.cupSchedule = {
            4: 'R1',     // 리그 4R 후 예선
            8: 'R32',    // 리그 8R 후 32강
            13: 'R16',   // 리그 13R(전반기 끝) 후 16강
            18: 'QF',    // 리그 18R 후 8강
            22: 'SF',    // 리그 22R 후 4강
            26: 'FINAL'  // 리그 26R(최종전) 직후 결승전!
        };
    }

    // 새 시즌 시작 시 FA컵 토너먼트 데이터 초기화 및 대진표 생성
    initSeason() {
        if (!window.allTeams) return;

        const allTeamKeys = Object.keys(window.allTeams);
        // 리그별 분리
        const l1 = allTeamKeys.filter(k => window.allTeams[k].league === 1);
        const l2 = allTeamKeys.filter(k => window.allTeams[k].league === 2);
        const l3 = allTeamKeys.filter(k => window.allTeams[k].league === 3);

        // 셔플 함수
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

        // 시드 배정: 1부 14팀 전원 + 2부 8팀 (총 22팀) -> 32강 직행!
        const shuffledL2 = shuffle(l2);
        const seedTeams = [...l1, ...shuffledL2.slice(0, 8)];

        // 예선 출전: 2부 나머지 6팀 + 3부 14팀 (총 20팀) -> 10경기 맞대결
        const prelimTeams = shuffle([...shuffledL2.slice(8), ...l3]);

        const r1Matches = [];
        for (let i = 0; i < prelimTeams.length; i += 2) {
            r1Matches.push({
                home: prelimTeams[i],
                away: prelimTeams[i + 1],
                winner: null,
                score: null,
                pk: null
            });
        }

        gameData.faCup = {
            currentStage: 'R1',
            isUserActive: true, // 유저 생존 여부
            userEliminatedStage: null,
            champion: null,
            runnerUp: null,
            bracket: {
                'R1': r1Matches,
                'R32': [],
                'R16': [],
                'QF': [],
                'SF': [],
                'FINAL': []
            },
            seedTeams: seedTeams,
            matchPending: false // 현재 유저의 다음 경기가 FA컵인지 여부
        };

        // 유저 팀이 1라운드(예선) 대상인지 확인
        const userInR1 = r1Matches.some(m => m.home === gameData.selectedTeam || m.away === gameData.selectedTeam);
        if (!userInR1) {
            // 시드 배정팀이면 예선은 건너뛰고 32강부터 시작
            console.log(`[FA Cup] ${gameData.selectedTeam}은(는) 32강 본선 시드 배정팀입니다.`);
        } else {
            console.log(`[FA Cup] ${gameData.selectedTeam}은(는) 1라운드 예선전부터 출전합니다!`);
        }

        console.log('[FA Cup] 새 시즌 FA컵 토너먼트 대진 생성 완료');
    }

    // 다음 경기가 FA컵 경기여야 하는지 체크
    checkAndSetupCupMatch() {
        if (!gameData || !gameData.faCup) return false;
        const currentRound = gameData.currentRound || 1;
        const scheduledStage = this.cupSchedule[currentRound];

        if (!scheduledStage) return false;

        const cup = gameData.faCup;
        // 이미 해당 스테이지를 치렀거나 종료된 경우
        if (cup.currentStage !== scheduledStage) return false;

        // 해당 스테이지 대진이 아직 생성되지 않았으면 생성
        this.ensureStageBracket(scheduledStage);

        // 유저의 경기 찾기
        const matches = cup.bracket[scheduledStage] || [];
        const userMatch = matches.find(m => (m.home === gameData.selectedTeam || m.away === gameData.selectedTeam) && !m.winner);

        if (userMatch && cup.isUserActive) {
            // 유저의 FA컵 경기 세팅!
            gameData.isFACupMatch = true;
            gameData.faCupStage = scheduledStage;
            gameData.currentOpponent = (userMatch.home === gameData.selectedTeam) ? userMatch.away : userMatch.home;
            gameData.isHomeGame = (userMatch.home === gameData.selectedTeam);
            cup.matchPending = true;
            return true;
        } else {
            // 유저는 이미 탈락했거나 시드로 패스된 경우 -> AI끼리 시뮬레이션하고 다음 라운드로 진행
            this.simulateStageAI(scheduledStage);
            this.advanceToNextStage();
            return false;
        }
    }

    // 특정 스테이지의 대진 생성 (이전 라운드 승자들 매칭)
    ensureStageBracket(stage) {
        const cup = gameData.faCup;
        if (cup.bracket[stage] && cup.bracket[stage].length > 0) return;

        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

        if (stage === 'R32') {
            // 1라운드 승자 10팀 + 시드 22팀 = 32팀
            const r1Winners = (cup.bracket['R1'] || []).map(m => m.winner || m.home);
            let pool = [...cup.seedTeams, ...r1Winners];
            if (pool.length > 32) {
                const uTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
                const poolNoUser = pool.filter(t => t !== uTeam);
                pool = uTeam ? [uTeam, ...shuffle(poolNoUser).slice(0, 31)] : shuffle(pool).slice(0, 32);
            }
            const all32 = shuffle(pool);
            const r32Matches = [];
            for (let i = 0; i < all32.length; i += 2) {
                r32Matches.push({
                    home: all32[i],
                    away: all32[i + 1],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
            cup.bracket['R32'] = r32Matches;
        } else {
            // 이전 스테이지의 승자들을 모아 대진 구성
            const prevStageIndex = this.stages.indexOf(stage) - 1;
            const prevStage = this.stages[prevStageIndex];
            const prevMatches = cup.bracket[prevStage] || [];

            // 아직 이전 스테이지가 안 끝났으면 AI 시뮬레이션
            prevMatches.forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateAIMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });

            const winners = shuffle(prevMatches.map(m => m.winner));
            const newMatches = [];
            for (let i = 0; i < winners.length; i += 2) {
                if (winners[i + 1]) {
                    newMatches.push({
                        home: winners[i],
                        away: winners[i + 1],
                        winner: null,
                        score: null,
                        pk: null
                    });
                }
            }
            cup.bracket[stage] = newMatches;
        }
    }

    // AI 간의 단판 토너먼트 경기 시뮬레이션 (승부차기 포함)
    simulateAIMatch(team1, team2) {
        const getRating = (teamKey) => {
            if (!window.teams || !window.teams[teamKey]) return 75;
            const players = window.teams[teamKey];
            const sum = players.reduce((acc, p) => acc + (p.rating || 75), 0);
            return sum / (players.length || 1);
        };

        const r1 = getRating(team1);
        const r2 = getRating(team2);

        // 기본 골 수 (능력치 기반)
        const diff = (r1 - r2) / 10;
        let s1 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, diff)));
        let s2 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, -diff)));

        if (s1 !== s2) {
            return {
                winner: s1 > s2 ? team1 : team2,
                score: `${s1} - ${s2}`,
                pk: null
            };
        }

        // 동점 시 승부차기 진행
        let pk1 = 0, pk2 = 0;
        for (let i = 0; i < 5; i++) {
            if (Math.random() < 0.75) pk1++;
            if (Math.random() < 0.75) pk2++;
        }
        while (pk1 === pk2) {
            if (Math.random() < 0.75) pk1++;
            if (Math.random() < 0.75) pk2++;
        }

        return {
            winner: pk1 > pk2 ? team1 : team2,
            score: `${s1} - ${s2}`,
            pk: `(PK ${pk1}-${pk2})`
        };
    }

    // 해당 스테이지의 모든 미완료 AI 경기 일괄 시뮬레이션
    simulateStageAI(stage) {
        const cup = gameData.faCup;
        if (!cup || !cup.bracket[stage]) return;

        cup.bracket[stage].forEach(m => {
            if (!m.winner) {
                const sim = this.simulateAIMatch(m.home, m.away);
                m.winner = sim.winner;
                m.score = sim.score;
                m.pk = sim.pk;
            }
        });
    }

    // 다음 스테이지로 진행
    advanceToNextStage() {
        const cup = gameData.faCup;
        if (!cup) return;

        const curIdx = this.stages.indexOf(cup.currentStage);
        if (curIdx < this.stages.length - 1) {
            cup.currentStage = this.stages[curIdx + 1];
            cup.matchPending = false;
            gameData.isFACupMatch = false;
        } else {
            // 결승전 종료!
            const finalMatch = (cup.bracket['FINAL'] || [])[0];
            if (finalMatch) {
                cup.champion = finalMatch.winner;
                cup.runnerUp = (finalMatch.winner === finalMatch.home) ? finalMatch.away : finalMatch.home;
            }
        }
    }

    // 유저의 FA컵 경기 종료 후 처리 (승부차기 및 다음 라운드 진출)
    handleUserMatchEnd(matchData) {
        const cup = gameData.faCup;
        if (!cup || !gameData.isFACupMatch) return;

        const stage = cup.currentStage;
        const userTeam = gameData.selectedTeam;
        const isUserHome = matchData.homeTeam === userTeam;
        const userScore = isUserHome ? matchData.homeScore : matchData.awayScore;
        const oppScore = isUserHome ? matchData.awayScore : matchData.homeScore;
        const oppTeam = isUserHome ? matchData.awayTeam : matchData.homeTeam;

        const matchRecord = (cup.bracket[stage] || []).find(m => m.home === userTeam || m.away === userTeam);

        // 1. 정규 시간 승부 갈림
        if (userScore > oppScore) {
            this.processWin(matchRecord, userTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
        } else if (userScore < oppScore) {
            this.processLoss(matchRecord, oppTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
        } else {
            // 2. 무승부 -> 즉시 승부차기(PK전) 진행!
            this.runPenaltyShootout(matchData, matchRecord, userTeam, oppTeam, stage);
        }

        // 해당 스테이지의 나머지 AI 경기들 시뮬레이션
        this.simulateStageAI(stage);
        this.advanceToNextStage();
    }

    // 유저 승리 처리
    processWin(matchRecord, userTeam, scoreStr, pkStr, stage) {
        const cup = gameData.faCup;
        if (matchRecord) {
            matchRecord.winner = userTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }

        const prizeTable = {
            'R1': 10,
            'R32': 20,
            'R16': 40,
            'QF': 80,
            'SF': 150,
            'FINAL': 500 // 우승 상금 500억원!
        };

        const prize = prizeTable[stage] || 20;
        gameData.teamMoney += prize;

        if (stage === 'FINAL') {
            // 🏆 FA컵 최종 우승!
            cup.champion = userTeam;
            if (typeof managerSystem !== 'undefined' && gameData.managerId) {
                managerSystem.updateManagerStats(gameData.managerId, { trophy: true });
            }

            // 트레블/더블 체크
            const isLeagueChamp = (gameData.leagueData && gameData.leagueData.division1 && gameData.leagueData.division1[userTeam]);
            const isDouble = (gameData.currentLeague === 1); // 1부 우승 시 더블

            let titleMsg = `🏆 [FA컵 우승!] 축하합니다!\n${teamNames[userTeam] || userTeam}이(가) FA컵 정상에 올랐습니다!\n우승 상금: +${prize}억원 지급!`;
            if (isDouble) {
                titleMsg += `\n\n✨ [역사적인 더블(Double) 달성!]\n리그와 FA컵을 동시에 제패하며 구단 역사상 최고의 한 해를 완성했습니다!`;
            }

            setTimeout(() => alert(titleMsg), 1000);

            if (typeof mailManager !== 'undefined') {
                mailManager.addMail(
                    `[우승] ${teamNames[userTeam] || userTeam} FA컵 제패! 역사적 트로피 획득!`,
                    'FA컵 대회 조직위원회',
                    `축하합니다!\n결승전에서 승리하며 제${gameData.seasonCount || 1}회 통합 FA컵 트로피의 주인공이 되었습니다!\n\n` +
                    `- 대회: 통합 FA컵 (Easy Cup)\n- 우승 상금: +${prize}억원 (구단 금고 지급 완료)\n- 감독 명예의 전당 공식 트로피 기록 추가\n\n구단의 위대한 업적에 전 세계 축구 팬들이 찬사를 보내고 있습니다.`
                );
            }
        } else {
            const nextStageName = this.stageNames[this.stages[this.stages.indexOf(stage) + 1]] || '다음 라운드';
            setTimeout(() => {
                alert(`🎉 [FA컵 승리!]\n${this.stageNames[stage]}에서 승리하여 ${nextStageName}에 진출했습니다!\n진출 상금: +${prize}억원 획득!`);
            }, 1000);
        }
    }

    // 유저 패배 처리
    processLoss(matchRecord, oppTeam, scoreStr, pkStr, stage) {
        const cup = gameData.faCup;
        cup.isUserActive = false;
        cup.userEliminatedStage = stage;

        if (matchRecord) {
            matchRecord.winner = oppTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }

        const runnerUpPrize = stage === 'FINAL' ? 200 : 0;
        if (runnerUpPrize > 0) gameData.teamMoney += runnerUpPrize;

        const extra = stage === 'FINAL' ? `\n아쉽게 준우승을 차지했습니다. (준우승 상금: +${runnerUpPrize}억원)` : '\n아쉽게도 이번 시즌 FA컵 여정을 마감합니다.';
        setTimeout(() => {
            alert(`[FA컵 탈락]\n${this.stageNames[stage]}에서 패배하였습니다.${extra}`);
        }, 1000);
    }

    // 승부차기(PK전) 시뮬레이션
    runPenaltyShootout(matchData, matchRecord, userTeam, oppTeam, stage) {
        let uScore = 0, oScore = 0;
        let uKicks = '', oKicks = '';

        for (let i = 1; i <= 5; i++) {
            if (Math.random() < 0.75) { uScore++; uKicks += 'O '; } else { uKicks += 'X '; }
            if (Math.random() < 0.75) { oScore++; oKicks += 'O '; } else { oKicks += 'X '; }
        }

        // 서든데스
        while (uScore === oScore) {
            if (Math.random() < 0.75) { uScore++; uKicks += 'O '; } else { uKicks += 'X '; }
            if (Math.random() < 0.75) { oScore++; oKicks += 'O '; } else { oKicks += 'X '; }
        }

        const userWon = uScore > oScore;
        const pkStr = `(PK ${uScore}-${oScore})`;
        const scoreStr = `${matchData.homeScore} - ${matchData.awayScore}`;

        const pkSummary = `⚽ [승부차기 결과]\n` +
                          `우리 팀: ${uKicks} [${uScore}]\n` +
                          `상대 팀: ${oKicks} [${oScore}]\n\n` +
                          (userWon ? `승부차기 ${uScore}-${oScore} 극적인 승리!` : `승부차기 ${uScore}-${oScore} 아쉬운 패배...`);

        alert(pkSummary);

        if (userWon) {
            this.processWin(matchRecord, userTeam, scoreStr, pkStr, stage);
        } else {
            this.processLoss(matchRecord, oppTeam, scoreStr, pkStr, stage);
        }
    }

    // 대진표(Bracket) 모달 열기
    openBracketModal() {
        let modal = document.getElementById('faCupBracketModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'faCupBracketModal';
            modal.className = 'stadium-modal-backdrop';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this.buildBracketHTML();
        modal.style.display = 'flex';

        const closeBtn = modal.querySelector('.stadium-modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // 대진표 HTML 렌더링
    buildBracketHTML() {
        const cup = gameData.faCup;
        if (!cup) return '<div class="stadium-modal-content"><p>FA컵 데이터가 없습니다.</p></div>';

        const activeTag = cup.isUserActive ? `<span class="hired-badge-permanent">생존 중 (${this.stageNames[cup.currentStage] || '진행 중'})</span>` : `<span style="color:#EF4444; font-weight:700;">탈락 (${this.stageNames[cup.userEliminatedStage] || ''})</span>`;

        let stagesHTML = '';
        const displayStages = ['R32', 'R16', 'QF', 'SF', 'FINAL'];

        displayStages.forEach(stKey => {
            const matches = cup.bracket[stKey] || [];
            const stName = this.stageNames[stKey];
            const isCurrent = cup.currentStage === stKey;

            let matchesHTML = '';
            if (matches.length === 0) {
                matchesHTML = '<div class="bracket-empty-slot">이전 라운드 진행 후 편성됩니다</div>';
            } else {
                matches.forEach(m => {
                    const isMyMatch = (m.home === gameData.selectedTeam || m.away === gameData.selectedTeam);
                    const homeName = teamNames[m.home] || m.home;
                    const awayName = teamNames[m.away] || m.away;
                    const homeWin = m.winner === m.home;
                    const awayWin = m.winner === m.away;

                    matchesHTML += `
                        <div class="bracket-match-node ${isMyMatch ? 'my-cup-match' : ''}">
                            <div class="node-team ${homeWin ? 'winner' : ''}">
                                <span>${homeName}</span>
                                <strong>${m.score ? m.score.split('-')[0] : ''}</strong>
                            </div>
                            <div class="node-team ${awayWin ? 'winner' : ''}">
                                <span>${awayName}</span>
                                <strong>${m.score ? m.score.split('-')[1] : ''}</strong>
                            </div>
                            ${m.pk ? `<span class="node-pk-text">${m.pk}</span>` : ''}
                        </div>
                    `;
                });
            }

            stagesHTML += `
                <div class="bracket-col ${isCurrent ? 'current-round-col' : ''}">
                    <div class="bracket-col-header">
                        <h4>${stName}</h4>
                        ${isCurrent ? '<span class="col-active-tag">진행 중</span>' : ''}
                    </div>
                    <div class="bracket-col-body">
                        ${matchesHTML}
                    </div>
                </div>
            `;
        });

        return `
        <div class="stadium-modal-content" style="max-width: 1050px; width: 95%;">
            <div class="stadium-modal-header">
                <div class="stadium-title-box">
                    <span class="stadium-badge" style="background: rgba(251, 191, 36, 0.15); color: #FBBF24; border-color: rgba(251, 191, 36, 0.4);">TOURNAMENT</span>
                    <h2>통합 FA컵 (Easy Cup) 대진표</h2>
                    <p class="stadium-sub">1·2·3부 42개 전 구단 참가 · 단판 승부 토너먼트 · 상태: ${activeTag}</p>
                </div>
                <button class="stadium-modal-close" title="닫기">&times;</button>
            </div>

            <!-- 우승 보상 배너 -->
            <div class="facup-reward-banner">
                <div class="reward-pill">🏆 우승 상금: <strong>500억원</strong></div>
                <div class="reward-pill">🥈 준우승: <strong>200억원</strong></div>
                <div class="reward-pill">✨ 리그 1부 + FA컵 동시 석권 시 <strong>[더블 챔피언]</strong> 달성</div>
            </div>

            <!-- 토너먼트 브라켓 스크롤 뷰 -->
            <div class="facup-bracket-scroll-wrap">
                <div class="facup-bracket-grid">
                    ${stagesHTML}
                </div>
            </div>
        </div>
        `;
    }
}

// 싱글톤 노출
const faCupManager = new FACupManager();
if (typeof window !== 'undefined') {
    window.faCupManager = faCupManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FACupManager, faCupManager };
}

