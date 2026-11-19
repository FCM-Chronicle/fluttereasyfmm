// cupCompetition.js - 국가별 FA컵 & UEFA 챔피언스리그(리그페이즈 + 토너먼트 트리) & 시즌 경기 일정 통합 관리 시스템

const CUP_CONFIGS = {
    // 1. 국가별 FA컵 설정
    faCups: {
        premier_league: {
            id: 'fa_england',
            leagueId: 'premier_league',
            name: '에미레이츠 FA컵',
            fullName: 'The Emirates FA Cup',
            country: '잉글랜드',
            flag: '🇬🇧',
            logo: 'assets/cup_logos/fa_cup.png',
            fallbackEmoji: '🏆'
        },
        efl_championship: {
            id: 'fa_england',
            leagueId: 'premier_league',
            name: '에미레이츠 FA컵',
            fullName: 'The Emirates FA Cup',
            country: '잉글랜드',
            flag: '🇬🇧',
            logo: 'assets/cup_logos/fa_cup.png',
            fallbackEmoji: '🏆'
        },
        laliga: {
            id: 'fa_spain',
            leagueId: 'laliga',
            name: '코파 델 레이',
            fullName: 'Copa del Rey',
            country: '스페인',
            flag: '🇪🇸',
            logo: 'assets/cup_logos/copa_del_rey.png',
            fallbackEmoji: '🏆'
        },
        bundesliga: {
            id: 'fa_germany',
            leagueId: 'bundesliga',
            name: 'DFB-포칼',
            fullName: 'DFB-Pokal',
            country: '독일',
            flag: '🇩🇪',
            logo: 'assets/cup_logos/dfb_pokal.png',
            fallbackEmoji: '🏆'
        },
        serie_a: {
            id: 'fa_italy',
            leagueId: 'serie_a',
            name: '코파 이탈리아',
            fullName: 'Coppa Italia Frecciarossa',
            country: '이탈리아',
            flag: '🇮🇹',
            logo: 'assets/cup_logos/coppa_italia.png',
            fallbackEmoji: '🏆'
        },
        ligue_1: {
            id: 'fa_france',
            leagueId: 'ligue_1',
            name: '쿠프 드 프랑스',
            fullName: 'Coupe de France',
            country: '프랑스',
            flag: '🇫🇷',
            logo: 'assets/cup_logos/coupe_de_france.png',
            fallbackEmoji: '🏆'
        },
        eredivisie: {
            id: 'fa_netherlands',
            leagueId: 'eredivisie',
            name: 'KNVB 베커',
            fullName: 'KNVB Beker',
            country: '네덜란드',
            flag: '🇳🇱',
            logo: 'assets/cup_logos/knvb_beker.png',
            fallbackEmoji: '🏆'
        },
        liga_portugal: {
            id: 'fa_portugal',
            leagueId: 'liga_portugal',
            name: '타사 드 포르투갈',
            fullName: 'Taça de Portugal',
            country: '포르투갈',
            flag: '🇵🇹',
            logo: 'assets/cup_logos/taca_portugal.png',
            fallbackEmoji: '🏆'
        },
        super_lig: {
            id: 'fa_turkey',
            leagueId: 'super_lig',
            name: '튀르키예 쿠파스',
            fullName: 'Türkiye Kupası',
            country: '튀르키예',
            flag: '🇹🇷',
            logo: 'assets/cup_logos/turkiye_kupasi.png',
            fallbackEmoji: '🏆'
        },
        kleague_1: {
            id: 'fa_korea',
            leagueId: 'kleague_1',
            name: '코리아컵',
            fullName: 'Korea Cup',
            country: '대한민국',
            flag: '🇰🇷',
            logo: 'assets/cup_logos/korea_cup.png',
            fallbackEmoji: '🏆'
        },
        mls: {
            id: 'fa_usa',
            leagueId: 'mls',
            name: 'US 오픈 컵',
            fullName: 'Lamar Hunt U.S. Open Cup',
            country: '미국',
            flag: '🇺🇸',
            logo: 'assets/cup_logos/us_open_cup.png',
            fallbackEmoji: '🏆'
        }
    },

    // 2. UEFA 챔피언스리그 설정
    ucl: {
        id: 'ucl',
        name: 'UEFA 챔피언스리그',
        fullName: 'UEFA Champions League',
        logo: 'assets/cup_logos/ucl.png',
        fallbackEmoji: '⭐'
    }
};

// 로고 렌더러 헬퍼
function getCupLogoHTML(logoPath, fallbackEmoji = '🏆', size = 26) {
    if (!logoPath) return `<span style="font-size:${size * 0.8}px; vertical-align:middle;">${fallbackEmoji}</span>`;
    return `
        <span class="cup-logo-box" style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; vertical-align:middle; flex-shrink:0;">
            <img src="${logoPath}" alt="logo" style="max-width:100%; max-height:100%; object-fit:contain; display:inline-block;" onerror="this.outerHTML='${fallbackEmoji}'">
        </span>
    `;
}

// 구단 미니 로고 HTML 헬퍼
function getClubMiniLogoHTML(teamKey, size = 18) {
    if (!teamKey || typeof teamKey !== 'string' || teamKey.startsWith('__TBD')) {
        return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:4px; background:rgba(148,163,184,0.15); color:#94A3B8; font-size:${Math.max(9, size - 7)}px; font-weight:800; flex-shrink:0;">?</span>`;
    }
    const team = (typeof allTeams !== 'undefined') ? allTeams[teamKey] : null;
    if (team && team.teamid) {
        return `<img src="assets/team_logos/L${team.teamid}.png" alt="${teamKey}" style="width:${size}px; height:${size}px; object-fit:contain; flex-shrink:0; vertical-align:middle;" onerror="this.style.display='none'">`;
    }
    if (team && team.logoCode && team.league && team.logoCode !== 'DFT' && !team.isCustom && !team.isIcon) {
        return `<img src="assets/logo/${team.league}/${team.logoCode}.webp" alt="${teamKey}" style="width:${size}px; height:${size}px; object-fit:contain; flex-shrink:0; vertical-align:middle;" onerror="this.style.display='none'">`;
    }
    const initials = teamKey.substring(0, 2);
    return `<span style="display:inline-flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:4px; background:rgba(56,189,248,0.2); color:#38BDF8; font-size:${Math.max(9, size - 7)}px; font-weight:800; flex-shrink:0;">${initials}</span>`;
}

class CupCompetitionManager {
    constructor() {
        this.faStages = ['R1', 'R32', 'R16', 'QF', 'SF', 'FINAL'];
        this.faStageNames = {
            'R1': '1라운드 (예선전)',
            'R32': '32강전 (본선)',
            'R16': '16강전',
            'QF': '8강전 (준준결승)',
            'SF': '4강전 (준결승)',
            'FINAL': '결승전 (FINAL)'
        };
        // 리그 라운드 직후 열리는 FA컵 스케줄
        this.faCupSchedule = {
            6: 'R1',
            9: 'R32',
            12: 'R16',
            18: 'QF',
            24: 'SF',
            30: 'FINAL'
        };

        // UCL 리그 페이즈 (8경기) + 플레이오프 + 16강 + 8강 + 4강 + 결승
        this.uclStages = ['LP1', 'LP2', 'LP3', 'LP4', 'LP5', 'LP6', 'LP7', 'LP8', 'PO', 'R16', 'QF', 'SF', 'FINAL'];
        this.uclStageNames = {
            'LP1': '리그 페이즈 1차전',
            'LP2': '리그 페이즈 2차전',
            'LP3': '리그 페이즈 3차전',
            'LP4': '리그 페이즈 4차전',
            'LP5': '리그 페이즈 5차전',
            'LP6': '리그 페이즈 6차전',
            'LP7': '리그 페이즈 7차전',
            'LP8': '리그 페이즈 최종전 (8R)',
            'PO': '16강 플레이오프',
            'R16': '16강전',
            'QF': '8강전 (준준결승)',
            'SF': '4강전 (준결승)',
            'FINAL': '결승전 (FINAL)'
        };
        this.uclSchedule = {
            4: 'LP1',
            8: 'LP2',
            11: 'LP3',
            15: 'LP4',
            17: 'LP5',
            21: 'LP6',
            23: 'LP7',
            26: 'LP8',
            28: 'PO',
            31: 'R16',
            33: 'QF',
            35: 'SF',
            37: 'FINAL'
        };

        // 이전 faCupManager 호환용 stageNames
        this.stageNames = this.faStageNames;

        // UI 뷰 상태
        this.activeModalTab = 'fa';        // 'fa' | 'ucl' | 'schedule'
        this.activeUCLSubTab = 'bracket';  // 'bracket' | 'schedule' | 'table'
        this.activeUCLScheduleStage = 'LP1';
        this.activeSeasonSchedMode = 'my'; // 'my' | 'round'
        this.activeSeasonSchedRound = null;
        this.activeSeasonSchedLeague = null;
    }

    // 유저 팀의 리그에 맞는 FA컵 정보 가져오기
    getUserFACupConfig() {
        const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
        const leagueId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(userTeam) : 'premier_league';
        return CUP_CONFIGS.faCups[leagueId] || CUP_CONFIGS.faCups.premier_league;
    }

    // 팀 평점 계산 헬퍼 (주전 Top 11 평균 기준 정밀 계산)
    getTeamRating(teamKey) {
        if (!teamKey || teamKey.startsWith('__TBD')) return 75;
        let players = null;
        if (typeof teams !== 'undefined' && teams[teamKey] && Array.isArray(teams[teamKey])) {
            players = teams[teamKey];
        } else if (typeof allTeams !== 'undefined' && allTeams[teamKey] && Array.isArray(allTeams[teamKey].players)) {
            players = allTeams[teamKey].players;
        }
        if (players && players.length > 0) {
            const sorted = [...players].sort((a, b) => (b.rating || 70) - (a.rating || 70));
            const top11 = sorted.slice(0, 11);
            return Math.round((top11.reduce((acc, p) => acc + (p.rating || 75), 0) / top11.length) * 10) / 10;
        }
        if (typeof allTeams !== 'undefined' && allTeams[teamKey]) {
            return allTeams[teamKey].reputation || 78;
        }
        return 75;
    }

    // 셔플 함수
    shuffle(arr) {
        return [...arr].sort(() => Math.random() - 0.5);
    }

    // 단판 경기 시뮬레이션
    simulateMatch(team1, team2) {
        const r1 = this.getTeamRating(team1);
        const r2 = this.getTeamRating(team2);
        const diff = (r1 - r2) / 10;

        let s1 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, diff)));
        let s2 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, -diff)));

        if (s1 !== s2) {
            return {
                homeScore: s1,
                awayScore: s2,
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
            homeScore: s1,
            awayScore: s2,
            winner: pk1 > pk2 ? team1 : team2,
            score: `${s1} - ${s2}`,
            pk: `(PK ${pk1}-${pk2})`
        };
    }

    // 리그 페이즈 전용 경기 시뮬레이션 (무승부 허용)
    simulateLeaguePhaseMatch(team1, team2) {
        const r1 = this.getTeamRating(team1);
        const r2 = this.getTeamRating(team2);
        const diff = (r1 - r2) / 10;

        let s1 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, diff)));
        let s2 = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, -diff)));

        return {
            homeScore: s1,
            awayScore: s2,
            score: `${s1} - ${s2}`
        };
    }

    // ==========================================
    // 1. 시즌 초기화 (FA컵 & UCL 리그페이즈 동시 구축)
    // ==========================================
    initSeason() {
        if (typeof allTeams === 'undefined') return;

        this.initFACup();
        this.initUCL();
        console.log('[CupCompetitionManager] 국가별 FA컵 및 UCL 리그 페이즈 초기화 완료');
    }

    // ------------------------------------------
    // 1-1. 국가별 FA컵 초기화 (시드 팀 포함 토너먼트 대진 사전 편성)
    // ------------------------------------------
    initFACup() {
        const userTeam = gameData.selectedTeam;
        const faConfig = this.getUserFACupConfig();
        const leagueTeams = (typeof LeagueManager !== 'undefined') ? LeagueManager.getTeamsInLeague(faConfig.leagueId) : [];

        const teamCount = leagueTeams.length;
        let seedTeams = [];
        let r1Matches = [];
        const hasR32 = (faConfig.id === 'fa_england');

        if (hasR32) {
            // 잉글랜드 에미레이츠 FA컵 (총 44팀):
            // EFL 챔피언십 24팀 전원 R1 예선 (12경기) -> 승자 12팀 + 프리미어리그 20팀 전원 시드 = 32강 본선 (16경기)
            const champTeams = (typeof LeagueManager !== 'undefined')
                ? LeagueManager.getTeamsInLeague('efl_championship')
                : Object.keys(allTeams || {}).filter(k => allTeams[k] && allTeams[k].leagueId === 'efl_championship');
            const plTeams = (typeof LeagueManager !== 'undefined')
                ? LeagueManager.getTeamsInLeague('premier_league')
                : Object.keys(allTeams || {}).filter(k => allTeams[k] && allTeams[k].leagueId === 'premier_league');
            const r1Pool = this.shuffle(champTeams);
            seedTeams = this.shuffle(plTeams);

            for (let i = 0; i < r1Pool.length; i += 2) {
                if (r1Pool[i + 1]) {
                    r1Matches.push({
                        home: r1Pool[i],
                        away: r1Pool[i + 1],
                        winner: null,
                        score: null,
                        pk: null
                    });
                }
            }
        } else if (teamCount > 20) {
            // 30팀 리그 (미국 MLS US 오픈 컵 등)
            // 28팀 예선 (14경기) -> 승자 14팀 + 시드 2팀 = 16강 본선 (8경기)
            const r1MatchesCount = Math.min(Math.floor(teamCount / 2), teamCount - 16);
            const r1TeamCount = r1MatchesCount * 2;
            const shuffled = this.shuffle(leagueTeams);
            const r1Pool = shuffled.slice(0, r1TeamCount);
            seedTeams = shuffled.slice(r1TeamCount);

            for (let i = 0; i < r1Pool.length; i += 2) {
                r1Matches.push({
                    home: r1Pool[i],
                    away: r1Pool[i + 1],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
        } else if (teamCount === 20) {
            // 20팀 리그 (라리가, 세리에 A)
            // 8팀 예선 (4경기) -> 승자 4팀 + 시드 12팀 = 16강 본선 (8경기)
            const shuffled = this.shuffle(leagueTeams);
            const r1Pool = shuffled.slice(0, 8);
            seedTeams = shuffled.slice(8);

            for (let i = 0; i < r1Pool.length; i += 2) {
                r1Matches.push({
                    home: r1Pool[i],
                    away: r1Pool[i + 1],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
        } else if (teamCount === 18) {
            // 18팀 리그 (분데스리가, 리그 1, 에레디비시, 포르투갈, 튀르키예)
            // 4팀 예선 (2경기) -> 승자 2팀 + 시드 14팀 = 16강 본선 (8경기)
            const shuffled = this.shuffle(leagueTeams);
            const r1Pool = shuffled.slice(0, 4);
            seedTeams = shuffled.slice(4);

            for (let i = 0; i < r1Pool.length; i += 2) {
                r1Matches.push({
                    home: r1Pool[i],
                    away: r1Pool[i + 1],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
        } else {
            // 12팀 리그 (K리그 1)
            // 8팀 예선 (4경기) -> 승자 4팀 + 시드 4팀 = 8강 본선 (4경기)
            const shuffled = this.shuffle(leagueTeams);
            const r1Pool = shuffled.slice(0, 8);
            seedTeams = shuffled.slice(8); // 4팀

            for (let i = 0; i < r1Pool.length; i += 2) {
                r1Matches.push({
                    home: r1Pool[i],
                    away: r1Pool[i + 1],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
        }

        const userInR1 = r1Matches.some(m => m.home === userTeam || m.away === userTeam);

        gameData.faCup = {
            config: faConfig,
            currentStage: 'R1',
            isUserActive: true,
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
            matchPending: false,
            hasR32: hasR32,
            isShortBracket: (!hasR32 && teamCount === 12)
        };

        console.log(`[FA Cup] ${faConfig.name} (${faConfig.country}) 대진 생성 완료. 유저 1R 참가여부: ${userInR1}`);
    }

    // ------------------------------------------
    // 1-2. UEFA 챔피언스리그 (36팀 리그 페이즈) 초기화
    // ------------------------------------------
    initUCL() {
        const userTeam = gameData.selectedTeam;
        const allKeys = Object.keys(allTeams || {});

        const europeanLeagues = [
            'premier_league', 'laliga', 'bundesliga', 'serie_a',
            'ligue_1', 'liga_portugal', 'eredivisie', 'super_lig'
        ];
        const excludedKeys = ['브라질_연합', '알_힐랄', '알_나스르'];

        // 리그별 팀 분류 및 Top 11 OVR 정렬
        const leagueTeams = {};
        europeanLeagues.forEach(l => { leagueTeams[l] = []; });

        for (const key of allKeys) {
            const t = allTeams[key];
            if (!t || excludedKeys.includes(key)) continue;
            if (europeanLeagues.includes(t.leagueId)) {
                leagueTeams[t.leagueId].push({
                    key,
                    league: t.leagueId,
                    ovr: this.getTeamRating(key)
                });
            }
        }

        for (const l in leagueTeams) {
            leagueTeams[l].sort((a, b) => b.ovr - a.ovr);
        }

        const quotas = {
            premier_league: 5,
            laliga: 5,
            bundesliga: 5,
            serie_a: 5,
            ligue_1: 4,
            liga_portugal: 3,
            eredivisie: 3,
            super_lig: 2
        };

        const selected = [];
        const remaining = [];

        for (const l of europeanLeagues) {
            const q = quotas[l] || 2;
            const topTeams = leagueTeams[l].slice(0, q);
            selected.push(...topTeams);
            remaining.push(...leagueTeams[l].slice(q));
        }

        remaining.sort((a, b) => b.ovr - a.ovr);
        while (selected.length < 36 && remaining.length > 0) {
            selected.push(remaining.shift());
        }

        const isUserEuropean = allTeams[userTeam] && europeanLeagues.includes(allTeams[userTeam].leagueId);
        const userInSelected = selected.some(t => t.key === userTeam);
        if (isUserEuropean && !userInSelected) {
            selected[35] = {
                key: userTeam,
                league: allTeams[userTeam].leagueId,
                ovr: this.getTeamRating(userTeam)
            };
        }

        selected.sort((a, b) => b.ovr - a.ovr);
        const uclTeams = selected.map(t => t.key);

        const pot1 = uclTeams.slice(0, 9);
        const pot2 = uclTeams.slice(9, 18);
        const pot3 = uclTeams.slice(18, 27);
        const pot4 = uclTeams.slice(27, 36);

        const table = {};
        uclTeams.forEach(t => {
            table[t] = {
                team: t,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                gf: 0,
                ga: 0,
                gd: 0,
                points: 0
            };
        });

        const leagueMap = {};
        selected.forEach(t => { leagueMap[t.key] = t.league; });

        let scheduleRounds = null;
        for (let attempt = 0; attempt < 60; attempt++) {
            const tempSchedule = {};
            const teamOpponents = {};
            const homeCount = {};
            const awayCount = {};

            uclTeams.forEach(t => {
                teamOpponents[t] = new Set();
                homeCount[t] = 0;
                awayCount[t] = 0;
            });

            let success = true;
            for (let r = 1; r <= 8; r++) {
                const roundKey = `LP${r}`;
                const roundMatches = [];
                const available = [...uclTeams].sort(() => Math.random() - 0.5);

                let roundTries = 0;
                while (available.length > 0 && roundTries < 250) {
                    roundTries++;
                    const t1 = available[0];
                    let partnerIdx = -1;

                    for (let i = 1; i < available.length; i++) {
                        const t2 = available[i];
                        if (leagueMap[t1] && leagueMap[t2] && leagueMap[t1] === leagueMap[t2]) continue;
                        if (teamOpponents[t1].has(t2)) continue;

                        partnerIdx = i;
                        break;
                    }

                    if (partnerIdx === -1) {
                        success = false;
                        break;
                    }

                    const t2 = available.splice(partnerIdx, 1)[0];
                    available.shift();

                    let home, away;
                    if (homeCount[t1] < homeCount[t2]) {
                        home = t1; away = t2;
                    } else if (awayCount[t1] < awayCount[t2]) {
                        home = t2; away = t1;
                    } else {
                        home = (r % 2 === 1) ? t1 : t2;
                        away = (r % 2 === 1) ? t2 : t1;
                    }

                    homeCount[home]++;
                    awayCount[away]++;
                    teamOpponents[home].add(away);
                    teamOpponents[away].add(home);

                    roundMatches.push({
                        home,
                        away,
                        homeScore: null,
                        awayScore: null,
                        played: false
                    });
                }

                if (!success || roundMatches.length !== 18) {
                    success = false;
                    break;
                }
                tempSchedule[roundKey] = roundMatches;
            }

            if (success) {
                scheduleRounds = tempSchedule;
                break;
            }
        }

        if (!scheduleRounds) {
            scheduleRounds = {};
            for (let r = 1; r <= 8; r++) {
                const roundKey = `LP${r}`;
                const shuffled = this.shuffle(uclTeams);
                const roundMatches = [];
                for (let i = 0; i < shuffled.length; i += 2) {
                    roundMatches.push({
                        home: (r % 2 === 1) ? shuffled[i] : shuffled[i + 1],
                        away: (r % 2 === 1) ? shuffled[i + 1] : shuffled[i],
                        homeScore: null,
                        awayScore: null,
                        played: false
                    });
                }
                scheduleRounds[roundKey] = roundMatches;
            }
        }

        gameData.ucl = {
            config: CUP_CONFIGS.ucl,
            currentStage: 'LP1',
            teams: uclTeams,
            pots: { pot1, pot2, pot3, pot4 },
            table: table,
            schedule: scheduleRounds,
            bracket: {
                'PO': [],    // 9위~24위 16강 진출 플레이오프 (8경기)
                'R16': [],   // 16강 (8경기)
                'QF': [],    // 8강 (4경기)
                'SF': [],    // 4강 (2경기)
                'FINAL': []  // 결승 (1경기)
            },
            isUserActive: uclTeams.includes(userTeam),
            userEliminatedStage: uclTeams.includes(userTeam) ? null : '미참가',
            champion: null,
            runnerUp: null,
            matchPending: false
        };

        console.log(`[UCL] 최강 36개 명문 클럽 리그 페이즈 구축 완료. 유저(${userTeam}) 참가여부: ${gameData.ucl.isUserActive}`);
    }

    // ==========================================
    // 2. 컵 경기 일정 체크 및 세팅 (Match Flow 연동)
    // ==========================================
    checkAndSetupCupMatch() {
        if (!gameData || gameData.isWorldCupMode) return false;

        const currentRound = gameData.currentRound || 1;

        // 우선순위 1: UEFA 챔피언스리그 체크
        if (gameData.ucl) {
            const uclStage = this.uclSchedule[currentRound];
            if (uclStage && gameData.ucl.currentStage === uclStage) {
                const isUserUcl = this.checkAndSetupUCLMatch(uclStage);
                if (isUserUcl) return true;
            }
        }

        // 우선순위 2: 국가별 FA컵 체크
        if (gameData.faCup) {
            const faStage = this.faCupSchedule[currentRound];
            if (faStage && gameData.faCup.currentStage === faStage) {
                const isUserFa = this.checkAndSetupFACupMatch(faStage);
                if (isUserFa) return true;
            }
        }

        return false;
    }

    // ------------------------------------------
    // 2-1. FA컵 경기 체크 및 트리 유지 대진 생성
    // ------------------------------------------
    checkAndSetupFACupMatch(stage) {
        const cup = gameData.faCup;
        this.ensureFABracket(stage);

        const matches = cup.bracket[stage] || [];
        const userMatch = matches.find(m => (m.home === gameData.selectedTeam || m.away === gameData.selectedTeam) && !m.winner);

        if (userMatch && cup.isUserActive) {
            gameData.isFACupMatch = true;
            gameData.isUCLMatch = false;
            gameData.faCupStage = stage;
            gameData.cupType = 'FA';
            gameData.currentOpponent = (userMatch.home === gameData.selectedTeam) ? userMatch.away : userMatch.home;
            gameData.isHomeGame = (userMatch.home === gameData.selectedTeam);
            cup.matchPending = true;
            return true;
        } else {
            this.simulateFAStageAI(stage);
            this.advanceFANextStage();
            return false;
        }
    }

    // FA컵 토너먼트 트리 대진 확정 (트리 라인 순서 유지)
    ensureFABracket(stage) {
        const cup = gameData.faCup;
        if (cup.bracket[stage] && cup.bracket[stage].length > 0) return;

        if (stage === 'R32' && cup.hasR32) {
            (cup.bracket['R1'] || []).forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });
            const r1Winners = (cup.bracket['R1'] || []).map(m => m.winner || m.home);
            const seeds = cup.seedTeams || [];
            const r32Matches = [];

            // 시드 팀(EPL 20팀)과 1R 승자(EFL 12팀)를 트리 순서대로 매칭 (총 16경기)
            let wIdx = 0;
            let sIdx = 0;
            while (r32Matches.length < 16 && (sIdx < seeds.length || wIdx < r1Winners.length)) {
                if (wIdx < r1Winners.length && sIdx < seeds.length) {
                    r32Matches.push({
                        home: seeds[sIdx++],
                        away: r1Winners[wIdx++],
                        winner: null,
                        score: null,
                        pk: null
                    });
                } else if (sIdx + 1 < seeds.length) {
                    r32Matches.push({
                        home: seeds[sIdx++],
                        away: seeds[sIdx++],
                        winner: null,
                        score: null,
                        pk: null
                    });
                } else {
                    break;
                }
            }
            cup.bracket['R32'] = r32Matches;
        } else if (stage === 'R16' && !cup.hasR32) {
            (cup.bracket['R1'] || []).forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });
            const r1Winners = (cup.bracket['R1'] || []).map(m => m.winner || m.home);
            const seeds = cup.seedTeams || [];
            const r16Matches = [];

            // 시드 팀과 1R 승자를 트리 순서대로 매칭
            let wIdx = 0;
            let sIdx = 0;
            while (r16Matches.length < 8 && (sIdx < seeds.length || wIdx < r1Winners.length)) {
                if (wIdx < r1Winners.length && sIdx < seeds.length) {
                    r16Matches.push({
                        home: seeds[sIdx++],
                        away: r1Winners[wIdx++],
                        winner: null,
                        score: null,
                        pk: null
                    });
                } else if (sIdx + 1 < seeds.length) {
                    r16Matches.push({
                        home: seeds[sIdx++],
                        away: seeds[sIdx++],
                        winner: null,
                        score: null,
                        pk: null
                    });
                } else if (wIdx + 1 < r1Winners.length) {
                    r16Matches.push({
                        home: r1Winners[wIdx++],
                        away: r1Winners[wIdx++],
                        winner: null,
                        score: null,
                        pk: null
                    });
                } else {
                    break;
                }
            }
            cup.bracket['R16'] = r16Matches;
        } else if (stage === 'QF' && cup.isShortBracket && (!cup.bracket['R16'] || cup.bracket['R16'].length === 0)) {
            (cup.bracket['R1'] || []).forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });
            const r1Winners = (cup.bracket['R1'] || []).map(m => m.winner || m.home);
            const seeds = cup.seedTeams || [];
            const qfMatches = [];
            for (let i = 0; i < 4; i++) {
                qfMatches.push({
                    home: seeds[i] || r1Winners[i * 2],
                    away: r1Winners[i] || seeds[i],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
            cup.bracket['QF'] = qfMatches;
        } else {
            // 직전 라운드 매치 트리 순서 그대로 (0 vs 1, 2 vs 3...) 매칭하여 대진표 줄기 유지
            const prevStageIdx = this.faStages.indexOf(stage) - 1;
            const prevStage = this.faStages[prevStageIdx];
            const prevMatches = cup.bracket[prevStage] || [];

            prevMatches.forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });

            const winners = prevMatches.map(m => m.winner).filter(Boolean);
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

    simulateFAStageAI(stage) {
        const cup = gameData.faCup;
        if (!cup || !cup.bracket[stage]) return;

        cup.bracket[stage].forEach(m => {
            if (!m.winner) {
                const sim = this.simulateMatch(m.home, m.away);
                m.winner = sim.winner;
                m.score = sim.score;
                m.pk = sim.pk;
            }
        });
    }

    advanceFANextStage() {
        const cup = gameData.faCup;
        if (!cup) return;

        const curIdx = this.faStages.indexOf(cup.currentStage);
        if (curIdx < this.faStages.length - 1) {
            let nextStage = this.faStages[curIdx + 1];
            if (!cup.hasR32 && nextStage === 'R32') {
                nextStage = cup.isShortBracket ? 'QF' : 'R16';
            } else if (cup.isShortBracket && nextStage === 'R16') {
                nextStage = 'QF';
            }
            cup.currentStage = nextStage;
            cup.matchPending = false;
            gameData.isFACupMatch = false;
        } else {
            const finalMatch = (cup.bracket['FINAL'] || [])[0];
            if (finalMatch) {
                cup.champion = finalMatch.winner;
                cup.runnerUp = (finalMatch.winner === finalMatch.home) ? finalMatch.away : finalMatch.home;
            }
        }
    }

    // ------------------------------------------
    // 2-2. UEFA 챔피언스리그 경기 체크
    // ------------------------------------------
    checkAndSetupUCLMatch(stage) {
        const ucl = gameData.ucl;
        const userTeam = gameData.selectedTeam;

        if (stage.startsWith('LP')) {
            const matches = ucl.schedule[stage] || [];
            const userMatch = matches.find(m => (m.home === userTeam || m.away === userTeam) && !m.played);

            if (userMatch && ucl.isUserActive) {
                gameData.isUCLMatch = true;
                gameData.isFACupMatch = false;
                gameData.uclStage = stage;
                gameData.cupType = 'UCL';
                gameData.currentOpponent = (userMatch.home === userTeam) ? userMatch.away : userMatch.home;
                gameData.isHomeGame = (userMatch.home === userTeam);
                ucl.matchPending = true;
                return true;
            } else {
                this.simulateUCLStageAI(stage);
                this.advanceUCLNextStage();
                return false;
            }
        } else {
            this.ensureUCLBracket(stage);
            const matches = ucl.bracket[stage] || [];
            const userMatch = matches.find(m => (m.home === userTeam || m.away === userTeam) && !m.winner);

            if (userMatch && ucl.isUserActive) {
                gameData.isUCLMatch = true;
                gameData.isFACupMatch = false;
                gameData.uclStage = stage;
                gameData.cupType = 'UCL';
                gameData.currentOpponent = (userMatch.home === userTeam) ? userMatch.away : userMatch.home;
                gameData.isHomeGame = (userMatch.home === userTeam);
                ucl.matchPending = true;
                return true;
            } else {
                this.simulateUCLStageAI(stage);
                this.advanceUCLNextStage();
                return false;
            }
        }
    }

    getSortedUCLTable() {
        const ucl = gameData.ucl;
        if (!ucl || !ucl.table) return [];
        return Object.values(ucl.table).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.gd !== a.gd) return b.gd - a.gd;
            if (b.gf !== a.gf) return b.gf - a.gf;
            return a.team.localeCompare(b.team);
        });
    }

    // UCL 토너먼트 트리 대진 확정 (트리 라인 순서 유지)
    ensureUCLBracket(stage) {
        const ucl = gameData.ucl;
        if (ucl.bracket[stage] && ucl.bracket[stage].length > 0) return;

        if (stage === 'PO') {
            // 9위 ~ 24위 플레이오프 (9위 vs 24위, 10위 vs 23위 ... 시드 매칭)
            const sorted = this.getSortedUCLTable();
            const poTeams = sorted.slice(8, 24).map(r => r.team);
            const seeds = poTeams.slice(0, 8);      // 9~16위
            const unseeds = poTeams.slice(8, 16).reverse(); // 24~17위

            const poMatches = [];
            for (let i = 0; i < 8; i++) {
                poMatches.push({
                    home: unseeds[i],
                    away: seeds[i],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
            ucl.bracket['PO'] = poMatches;

            const userTeam = gameData.selectedTeam;
            const userRank = sorted.findIndex(r => r.team === userTeam) + 1;
            if (userRank > 24) {
                ucl.isUserActive = false;
                ucl.userEliminatedStage = `리그 페이즈 ${userRank}위`;
            }
        } else if (stage === 'R16') {
            // 1위 ~ 8위 직행 시드 + PO 승자 8팀 (트리 순서 유지)
            const sorted = this.getSortedUCLTable();
            const top8 = sorted.slice(0, 8).map(r => r.team);

            (ucl.bracket['PO'] || []).forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });
            const poWinners = (ucl.bracket['PO'] || []).map(m => m.winner);

            const r16Matches = [];
            for (let i = 0; i < 8; i++) {
                r16Matches.push({
                    home: poWinners[i],
                    away: top8[i],
                    winner: null,
                    score: null,
                    pk: null
                });
            }
            ucl.bracket['R16'] = r16Matches;
        } else {
            // 직전 라운드 매치 트리 순서 그대로 (0 vs 1, 2 vs 3...) 매칭
            const prevStageIdx = this.uclStages.indexOf(stage) - 1;
            const prevStage = this.uclStages[prevStageIdx];
            const prevMatches = ucl.bracket[prevStage] || [];

            prevMatches.forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });

            const winners = prevMatches.map(m => m.winner).filter(Boolean);
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
            ucl.bracket[stage] = newMatches;
        }
    }

    simulateUCLStageAI(stage) {
        const ucl = gameData.ucl;
        if (!ucl) return;

        if (stage.startsWith('LP')) {
            const matches = ucl.schedule[stage] || [];
            matches.forEach(m => {
                if (!m.played) {
                    const res = this.simulateLeaguePhaseMatch(m.home, m.away);
                    m.homeScore = res.homeScore;
                    m.awayScore = res.awayScore;
                    m.played = true;

                    this.updateUCLTable(m.home, m.away, res.homeScore, res.awayScore);
                }
            });
        } else {
            const matches = ucl.bracket[stage] || [];
            matches.forEach(m => {
                if (!m.winner) {
                    const sim = this.simulateMatch(m.home, m.away);
                    m.winner = sim.winner;
                    m.score = sim.score;
                    m.pk = sim.pk;
                }
            });
        }
    }

    updateUCLTable(homeTeam, awayTeam, hGoals, aGoals) {
        const ucl = gameData.ucl;
        if (!ucl || !ucl.table) return;

        const h = ucl.table[homeTeam];
        const a = ucl.table[awayTeam];
        if (!h || !a) return;

        h.played++;
        a.played++;
        h.gf += hGoals;
        h.ga += aGoals;
        h.gd = h.gf - h.ga;
        a.gf += aGoals;
        a.ga += hGoals;
        a.gd = a.gf - a.ga;

        if (hGoals > aGoals) {
            h.won++;
            h.points += 3;
            a.lost++;
        } else if (hGoals < aGoals) {
            a.won++;
            a.points += 3;
            h.lost++;
        } else {
            h.drawn++;
            a.drawn++;
            h.points += 1;
            a.points += 1;
        }
    }

    advanceUCLNextStage() {
        const ucl = gameData.ucl;
        if (!ucl) return;

        const curIdx = this.uclStages.indexOf(ucl.currentStage);
        if (curIdx < this.uclStages.length - 1) {
            let nextStage = this.uclStages[curIdx + 1];

            if (nextStage === 'PO' && ucl.isUserActive) {
                const sorted = this.getSortedUCLTable();
                const userRank = sorted.findIndex(r => r.team === gameData.selectedTeam) + 1;
                if (userRank >= 1 && userRank <= 8) {
                    console.log(`[UCL] 유저 팀 ${gameData.selectedTeam}은(는) 리그 ${userRank}위로 16강에 직행했습니다!`);
                }
            }

            ucl.currentStage = nextStage;
            ucl.matchPending = false;
            gameData.isUCLMatch = false;
        } else {
            const finalMatch = (ucl.bracket['FINAL'] || [])[0];
            if (finalMatch) {
                ucl.champion = finalMatch.winner;
                ucl.runnerUp = (finalMatch.winner === finalMatch.home) ? finalMatch.away : finalMatch.home;
            }
        }
    }

    // ==========================================
    // 3. 유저 경기 종료 후 처리
    // ==========================================
    handleUserMatchEnd(matchData) {
        if (gameData.isUCLMatch) {
            this.handleUserUCLMatchEnd(matchData);
        } else if (gameData.isFACupMatch) {
            this.handleUserFACupMatchEnd(matchData);
        }
    }

    handleUserFACupMatchEnd(matchData) {
        const cup = gameData.faCup;
        if (!cup) return;

        const stage = cup.currentStage;
        const userTeam = gameData.selectedTeam;
        const isUserHome = matchData.homeTeam === userTeam;
        const userScore = isUserHome ? matchData.homeScore : matchData.awayScore;
        const oppScore = isUserHome ? matchData.awayScore : matchData.homeScore;
        const oppTeam = isUserHome ? matchData.awayTeam : matchData.homeTeam;

        const matchRecord = (cup.bracket[stage] || []).find(m => m.home === userTeam || m.away === userTeam);

        if (userScore > oppScore) {
            this.processFAWin(matchRecord, userTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
        } else if (userScore < oppScore) {
            this.processFALoss(matchRecord, oppTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
        } else {
            this.runPenaltyShootout(matchData, matchRecord, userTeam, oppTeam, stage, 'FA');
        }

        this.simulateFAStageAI(stage);
        this.advanceFANextStage();
    }

    processFAWin(matchRecord, userTeam, scoreStr, pkStr, stage) {
        const cup = gameData.faCup;
        if (matchRecord) {
            matchRecord.winner = userTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }

        const prizeTable = { 'R1': 10, 'R32': 20, 'R16': 30, 'QF': 60, 'SF': 120, 'FINAL': 400 };
        const prize = prizeTable[stage] || 30;
        gameData.teamMoney = (gameData.teamMoney || 0) + prize;

        if (stage === 'FINAL') {
            cup.champion = userTeam;
            if (typeof managerSystem !== 'undefined' && gameData.managerId) {
                managerSystem.updateManagerStats(gameData.managerId, { trophy: true });
            }
            const msg = `🏆 축하합니다! ${cup.config.name} 결승에서 승리하여 컵 대회 우승 트로피를 차지했습니다!\n상금 +${prize}억원이 지급되었습니다.`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
        }
    }

    processFALoss(matchRecord, oppTeam, scoreStr, pkStr, stage) {
        const cup = gameData.faCup;
        if (matchRecord) {
            matchRecord.winner = oppTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }
        cup.isUserActive = false;
        cup.userEliminatedStage = stage;

        if (stage === 'FINAL') {
            cup.runnerUp = gameData.selectedTeam;
            const prize = 150;
            gameData.teamMoney = (gameData.teamMoney || 0) + prize;
            const msg = `🥈 아쉬운 준우승! ${cup.config.name} 결승전에서 석패했습니다.\n준우승 상금 +${prize}억원이 지급되었습니다.`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
        }
    }

    handleUserUCLMatchEnd(matchData) {
        const ucl = gameData.ucl;
        if (!ucl) return;

        const stage = ucl.currentStage;
        const userTeam = gameData.selectedTeam;

        if (stage.startsWith('LP')) {
            const matches = ucl.schedule[stage] || [];
            const userMatch = matches.find(m => (m.home === userTeam || m.away === userTeam) && !m.played);
            if (userMatch) {
                userMatch.homeScore = matchData.homeScore;
                userMatch.awayScore = matchData.awayScore;
                userMatch.played = true;
                this.updateUCLTable(userMatch.home, userMatch.away, matchData.homeScore, matchData.awayScore);
            }

            const isHome = matchData.homeTeam === userTeam;
            const uScore = isHome ? matchData.homeScore : matchData.awayScore;
            const oScore = isHome ? matchData.awayScore : matchData.homeScore;
            if (uScore > oScore) gameData.teamMoney = (gameData.teamMoney || 0) + 30;
            else if (uScore === oScore) gameData.teamMoney = (gameData.teamMoney || 0) + 10;

            this.simulateUCLStageAI(stage);
            this.advanceUCLNextStage();
        } else {
            const isHome = matchData.homeTeam === userTeam;
            const uScore = isHome ? matchData.homeScore : matchData.awayScore;
            const oScore = isHome ? matchData.awayScore : matchData.homeScore;
            const oppTeam = isHome ? matchData.awayTeam : matchData.homeTeam;
            const matchRecord = (ucl.bracket[stage] || []).find(m => m.home === userTeam || m.away === userTeam);

            if (uScore > oScore) {
                this.processUCLWin(matchRecord, userTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
            } else if (uScore < oScore) {
                this.processUCLLoss(matchRecord, oppTeam, `${matchData.homeScore} - ${matchData.awayScore}`, null, stage);
            } else {
                this.runPenaltyShootout(matchData, matchRecord, userTeam, oppTeam, stage, 'UCL');
            }

            this.simulateUCLStageAI(stage);
            this.advanceUCLNextStage();
        }
    }

    processUCLWin(matchRecord, userTeam, scoreStr, pkStr, stage) {
        const ucl = gameData.ucl;
        if (matchRecord) {
            matchRecord.winner = userTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }

        const prizeTable = { 'PO': 50, 'R16': 100, 'QF': 150, 'SF': 250, 'FINAL': 800 };
        const prize = prizeTable[stage] || 50;
        gameData.teamMoney = (gameData.teamMoney || 0) + prize;

        if (stage === 'FINAL') {
            ucl.champion = userTeam;
            if (typeof managerSystem !== 'undefined' && gameData.managerId) {
                managerSystem.updateManagerStats(gameData.managerId, { trophy: true });
            }
            const msg = `⭐ 유럽 챔피언 등극! UEFA 챔피언스리그 빅이어(Big Ear)를 들어올렸습니다!\n우승 상금 +${prize}억원이 지급되었습니다.`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
        }
    }

    processUCLLoss(matchRecord, oppTeam, scoreStr, pkStr, stage) {
        const ucl = gameData.ucl;
        if (matchRecord) {
            matchRecord.winner = oppTeam;
            matchRecord.score = scoreStr;
            matchRecord.pk = pkStr;
        }
        ucl.isUserActive = false;
        ucl.userEliminatedStage = stage;

        if (stage === 'FINAL') {
            ucl.runnerUp = gameData.selectedTeam;
            const prize = 400;
            gameData.teamMoney = (gameData.teamMoney || 0) + prize;
            const msg = `🥈 UCL 준우승! 유럽의 정상을 눈앞에 두고 아쉽게 패배했습니다.\n준우승 상금 +${prize}억원이 지급되었습니다.`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
        }
    }

    runPenaltyShootout(matchData, matchRecord, userTeam, oppTeam, stage, type = 'FA') {
        let pkUser = 0, pkOpp = 0;
        for (let i = 0; i < 5; i++) {
            if (Math.random() < 0.75) pkUser++;
            if (Math.random() < 0.75) pkOpp++;
        }
        while (pkUser === pkOpp) {
            if (Math.random() < 0.75) pkUser++;
            if (Math.random() < 0.75) pkOpp++;
        }

        const userWin = pkUser > pkOpp;
        const pkText = `(PK ${pkUser}-${pkOpp})`;
        const scoreText = `${matchData.homeScore} - ${matchData.awayScore}`;

        if (userWin) {
            const msg = `[승부차기 승리!] 긴장감 넘치는 PK 승부 끝에 ${pkUser}:${pkOpp}로 승리하여 다음 라운드에 진출합니다!`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
            if (type === 'FA') this.processFAWin(matchRecord, userTeam, scoreText, pkText, stage);
            else this.processUCLWin(matchRecord, userTeam, scoreText, pkText, stage);
        } else {
            const msg = `[승부차기 패배] 아쉽게도 PK 승부에서 ${pkUser}:${pkOpp}로 패배하여 탈락했습니다.`;
            if (typeof alert === 'function') alert(msg);
            else console.log(msg);
            if (type === 'FA') this.processFALoss(matchRecord, oppTeam, scoreText, pkText, stage);
            else this.processUCLLoss(matchRecord, oppTeam, scoreText, pkText, stage);
        }
    }

    // ==========================================
    // 4. 모달 & 인라인 UI (FA컵 대진표 / UCL 대진표 / 시즌 경기 일정)
    // ==========================================
    openModal(defaultTab = 'fa') {
        let modal = document.getElementById('cupCompetitionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cupCompetitionModal';
            modal.className = 'stadium-modal-backdrop';
            document.body.appendChild(modal);
        }

        this.activeModalTab = defaultTab;
        this.renderModalContent(modal);
        modal.style.display = 'flex';
    }

    renderModalContent(modal) {
        if (!modal) modal = document.getElementById('cupCompetitionModal');
        if (!modal) return;
        modal.innerHTML = this.buildModalHTML();
        this.bindModalEvents(modal);
    }

    bindModalEvents(modal) {
        const closeBtn = modal.querySelector('.stadium-modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        const tabBtns = modal.querySelectorAll('.cup-tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                const targetTab = btn.getAttribute('data-tab');
                this.activeModalTab = targetTab;
                this.renderModalContent(modal);
            };
        });

        this.bindInteractiveControls(modal, () => this.renderModalContent(modal));
    }

    // 모달뿐만 아니라 경기/리그 탭 내부 인라인 컨테이너에서도 동작하는 이벤트 바인더
    bindInteractiveControls(rootEl, rerenderFn) {
        if (!rootEl) return;

        // UCL 서브탭 전환 (토너먼트 대진표 / UCL 경기 일정 / 36팀 순위표)
        rootEl.querySelectorAll('[data-ucl-subtab]').forEach(btn => {
            btn.onclick = () => {
                this.activeUCLSubTab = btn.getAttribute('data-ucl-subtab');
                rerenderFn();
            };
        });

        // UCL 리그페이즈 라운드 선택 (LP1 ~ LP8)
        rootEl.querySelectorAll('[data-ucl-lp-stage]').forEach(btn => {
            btn.onclick = () => {
                this.activeUCLScheduleStage = btn.getAttribute('data-ucl-lp-stage');
                rerenderFn();
            };
        });

        // 시즌 경기 일정 모드 전환 (내 구단 전체 일정 / 리그 라운드별 대진표)
        rootEl.querySelectorAll('[data-sched-mode]').forEach(btn => {
            btn.onclick = () => {
                this.activeSeasonSchedMode = btn.getAttribute('data-sched-mode');
                rerenderFn();
            };
        });

        // 시즌 경기 일정 리그 선택
        rootEl.querySelectorAll('[data-sched-league]').forEach(btn => {
            btn.onclick = () => {
                this.activeSeasonSchedLeague = btn.getAttribute('data-sched-league');
                rerenderFn();
            };
        });

        // 시즌 경기 일정 라운드 변경
        rootEl.querySelectorAll('[data-sched-round]').forEach(btn => {
            btn.onclick = () => {
                const r = parseInt(btn.getAttribute('data-sched-round'), 10);
                if (!isNaN(r)) {
                    this.activeSeasonSchedRound = r;
                    rerenderFn();
                }
            };
        });

        const roundSelect = rootEl.querySelector('.sched-round-select');
        if (roundSelect) {
            roundSelect.onchange = (e) => {
                this.activeSeasonSchedRound = parseInt(e.target.value, 10) || 1;
                rerenderFn();
            };
        }
    }

    openBracketModal() {
        this.openModal('fa');
    }

    openUCLModal() {
        this.openModal('ucl');
    }

    openScheduleModal() {
        this.openModal('schedule');
    }

    openCupModal(defaultTab = 'fa') {
        this.openModal(defaultTab);
    }

    buildModalHTML() {
        const tab = this.activeModalTab || 'fa';
        const faConfig = this.getUserFACupConfig();
        const uclConfig = CUP_CONFIGS.ucl;

        const faLogoHTML = getCupLogoHTML(faConfig.logo, faConfig.flag, 22);
        const uclLogoHTML = getCupLogoHTML(uclConfig.logo, '⭐', 22);

        let bodyHTML = '';
        if (tab === 'fa') bodyHTML = this.buildFAContentHTML();
        else if (tab === 'ucl') bodyHTML = this.buildUCLContentHTML();
        else bodyHTML = this.buildSeasonScheduleHTML();

        return `
        <div class="stadium-modal-content" style="max-width: 1280px; width: 96%; max-height: 92vh; display: flex; flex-direction: column;">
            <div class="stadium-modal-header" style="flex-shrink:0;">
                <div class="stadium-title-box">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="stadium-badge" style="background: rgba(251, 191, 36, 0.15); color: #FBBF24; border-color: rgba(251, 191, 36, 0.4);">TOURNAMENT & SCHEDULE</span>
                        <h2 style="margin:0; font-size:1.35rem;">공식 토너먼트 대진표 & 시즌 경기 일정 센터</h2>
                    </div>
                    <p class="stadium-sub" style="margin-top:4px;">국가별 FA컵 토너먼트 트리 · UEFA 챔피언스리그 대진표 · 시즌 전체 경기 일정</p>
                </div>
                <button class="stadium-modal-close" title="닫기">&times;</button>
            </div>

            <!-- 상단 3대 메인 탭 -->
            <div class="cup-nav-tabs" style="display:flex; flex-wrap:wrap; gap:10px; margin: 12px 0; border-bottom: 1px solid #334155; padding-bottom: 10px; flex-shrink:0;">
                <button class="cup-tab-btn ${tab === 'fa' ? 'active' : ''}" data-tab="fa" style="display:flex; align-items:center; gap:8px; padding: 9px 18px; border-radius: 8px; border: 1px solid ${tab === 'fa' ? '#FBBF24' : '#334155'}; background: ${tab === 'fa' ? 'rgba(251,191,36,0.15)' : '#1E293B'}; color: ${tab === 'fa' ? '#FBBF24' : '#94A3B8'}; cursor:pointer; font-weight:800;">
                    ${faLogoHTML}
                    <span>🏆 ${faConfig.name} (토너먼트 대진표)</span>
                </button>
                <button class="cup-tab-btn ${tab === 'ucl' ? 'active' : ''}" data-tab="ucl" style="display:flex; align-items:center; gap:8px; padding: 9px 18px; border-radius: 8px; border: 1px solid ${tab === 'ucl' ? '#38BDF8' : '#334155'}; background: ${tab === 'ucl' ? 'rgba(56,189,248,0.15)' : '#1E293B'}; color: ${tab === 'ucl' ? '#38BDF8' : '#94A3B8'}; cursor:pointer; font-weight:800;">
                    ${uclLogoHTML}
                    <span>⭐ ${uclConfig.name} (토너먼트 대진표 & 순위)</span>
                </button>
                <button class="cup-tab-btn ${tab === 'schedule' ? 'active' : ''}" data-tab="schedule" style="display:flex; align-items:center; gap:8px; padding: 9px 18px; border-radius: 8px; border: 1px solid ${tab === 'schedule' ? '#10B981' : '#334155'}; background: ${tab === 'schedule' ? 'rgba(16,185,129,0.15)' : '#1E293B'}; color: ${tab === 'schedule' ? '#10B981' : '#94A3B8'}; cursor:pointer; font-weight:800;">
                    <span>📅 시즌 전체 경기 일정 (1R~38R)</span>
                </button>
            </div>

            <div style="flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px;">
                ${bodyHTML}
            </div>
        </div>
        `;
    }

    // ------------------------------------------
    // [공통 헬퍼] 토너먼트 매치 노드 카드 HTML 생성
    // ------------------------------------------
    renderTourneyMatchCardHTML(m, idx, stageLabel, accentColor = '#FBBF24') {
        const userTeam = (typeof gameData !== 'undefined') ? gameData.selectedTeam : null;
        const homeKey = m.home || null;
        const awayKey = m.away || null;
        const isMyMatch = (homeKey && homeKey === userTeam) || (awayKey && awayKey === userTeam);

        const formatTeamName = (k, fallbackLabel) => {
            if (!k || k.startsWith('__TBD')) return `<span style="color:#64748B; font-style:italic; font-size:0.78rem;">${fallbackLabel}</span>`;
            const dName = (typeof teamNames !== 'undefined' && teamNames[k]) ? teamNames[k] : k;
            const rankBadge = m.homeRank && k === homeKey ? `<span class="tourney-seed-tag">${m.homeRank}위</span>` :
                              (m.awayRank && k === awayKey ? `<span class="tourney-seed-tag">${m.awayRank}위</span>` : '');
            const myBadge = (k === userTeam) ? `<span class="tourney-my-tag">MY</span>` : '';
            return `<span class="tourney-team-label ${k === userTeam ? 'is-user' : ''}">${dName}</span>${rankBadge}${myBadge}`;
        };

        const homeScore = m.score ? m.score.split('-')[0].trim() : '';
        const awayScore = m.score ? m.score.split('-')[1].trim() : '';
        const homeWin = m.winner && homeKey && m.winner === homeKey;
        const awayWin = m.winner && awayKey && m.winner === awayKey;
        const homeLose = m.winner && homeKey && m.winner !== homeKey;
        const awayLose = m.winner && awayKey && m.winner !== awayKey;

        return `
            <div class="tourney-node-card ${isMyMatch ? 'my-cup-match' : ''} ${m.isProjected ? 'projected-node' : ''}">
                <div class="tourney-node-head">
                    <span class="tourney-match-no">${stageLabel} #${idx + 1}</span>
                    ${m.roundHint ? `<span class="tourney-round-hint">${m.roundHint}</span>` : ''}
                    ${m.pk ? `<span class="tourney-pk-pill">${m.pk}</span>` : ''}
                </div>
                <div class="tourney-team-row ${homeWin ? 'winner' : ''} ${homeLose ? 'eliminated' : ''}">
                    <div class="tourney-team-info">
                        ${getClubMiniLogoHTML(homeKey, 18)}
                        ${formatTeamName(homeKey, m.homePlaceholder || '미정 (TBD)')}
                    </div>
                    <strong class="tourney-score-box ${homeWin ? 'win-score' : ''}">${homeScore !== '' ? homeScore : '-'}</strong>
                </div>
                <div class="tourney-team-row ${awayWin ? 'winner' : ''} ${awayLose ? 'eliminated' : ''}">
                    <div class="tourney-team-info">
                        ${getClubMiniLogoHTML(awayKey, 18)}
                        ${formatTeamName(awayKey, m.awayPlaceholder || '미정 (TBD)')}
                    </div>
                    <strong class="tourney-score-box ${awayWin ? 'win-score' : ''}">${awayScore !== '' ? awayScore : '-'}</strong>
                </div>
            </div>
        `;
    }

    // ------------------------------------------
    // 4-1. FA컵 토너먼트 트리 데이터 조립 (빈 슬롯도 시드/진출 예정으로 완전 구축)
    // ------------------------------------------
    getResolvedFATree() {
        const cup = gameData.faCup;
        if (!cup) return null;

        const r1Actual = cup.bracket['R1'] || [];
        const seeds = cup.seedTeams || [];
        const hasR32 = !!cup.hasR32;
        const isShort = !!cup.isShortBracket;

        // 1) R1 (예선)
        const r1List = r1Actual.map((m, i) => ({
            ...m,
            roundHint: '6R 직후',
            homePlaceholder: `예선 참가팀`,
            awayPlaceholder: `예선 참가팀`
        }));

        // 1-2) R32 (32강, 16경기 - 잉글랜드 FA컵: EPL 20팀 시드 + EFL 1R 승자 12팀)
        let r32List = [];
        if (hasR32) {
            const r32Actual = cup.bracket['R32'] || [];
            if (r32Actual.length > 0) {
                r32List = r32Actual.map(m => ({ ...m, roundHint: '9R 직후' }));
            } else {
                let wIdx = 0;
                let sIdx = 0;
                for (let i = 0; i < 16; i++) {
                    if (wIdx < r1List.length && sIdx < seeds.length) {
                        const r1Match = r1List[wIdx];
                        const r1Winner = r1Match ? r1Match.winner : null;
                        r32List.push({
                            home: seeds[sIdx++],
                            away: r1Winner || null,
                            awayPlaceholder: `1R #${wIdx + 1} 승자`,
                            winner: null,
                            score: null,
                            pk: null,
                            roundHint: '9R 직후',
                            isProjected: !r1Winner
                        });
                        wIdx++;
                    } else if (sIdx + 1 < seeds.length) {
                        r32List.push({
                            home: seeds[sIdx++],
                            away: seeds[sIdx++],
                            winner: null,
                            score: null,
                            pk: null,
                            roundHint: '9R 직후',
                            isProjected: false
                        });
                    } else {
                        r32List.push({
                            home: null,
                            away: null,
                            homePlaceholder: `시드 #${i * 2 + 1}`,
                            awayPlaceholder: `시드 #${i * 2 + 2}`,
                            winner: null,
                            score: null,
                            roundHint: '9R 직후',
                            isProjected: true
                        });
                    }
                }
            }
        }

        // 2) R16 (8경기, 단 K리그 단축 브래킷은 스킵)
        let r16List = [];
        if (!isShort) {
            const r16Actual = cup.bracket['R16'] || [];
            if (r16Actual.length > 0) {
                r16List = r16Actual.map(m => ({ ...m, roundHint: '12R 직후' }));
            } else if (hasR32) {
                for (let i = 0; i < 8; i++) {
                    const mA = r32List[i * 2];
                    const mB = r32List[i * 2 + 1];
                    r16List.push({
                        home: (mA && mA.winner) ? mA.winner : null,
                        away: (mB && mB.winner) ? mB.winner : null,
                        homePlaceholder: `32강 #${i * 2 + 1} 승자`,
                        awayPlaceholder: `32강 #${i * 2 + 2} 승자`,
                        winner: null,
                        score: null,
                        roundHint: '12R 직후',
                        isProjected: true
                    });
                }
            } else {
                let wIdx = 0;
                let sIdx = 0;
                for (let i = 0; i < 8; i++) {
                    if (wIdx < r1List.length && sIdx < seeds.length) {
                        const r1Match = r1List[wIdx];
                        const r1Winner = r1Match ? r1Match.winner : null;
                        r16List.push({
                            home: seeds[sIdx++],
                            away: r1Winner || null,
                            awayPlaceholder: `1R #${wIdx + 1} 승자`,
                            winner: null,
                            score: null,
                            pk: null,
                            roundHint: '12R 직후',
                            isProjected: !r1Winner
                        });
                        wIdx++;
                    } else if (sIdx + 1 < seeds.length) {
                        r16List.push({
                            home: seeds[sIdx++],
                            away: seeds[sIdx++],
                            winner: null,
                            score: null,
                            pk: null,
                            roundHint: '12R 직후',
                            isProjected: false
                        });
                    } else if (wIdx + 1 < r1List.length) {
                        const r1A = r1List[wIdx];
                        const r1B = r1List[wIdx + 1];
                        const winA = r1A ? r1A.winner : null;
                        const winB = r1B ? r1B.winner : null;
                        r16List.push({
                            home: winA || null,
                            away: winB || null,
                            homePlaceholder: `1R #${wIdx + 1} 승자`,
                            awayPlaceholder: `1R #${wIdx + 2} 승자`,
                            winner: null,
                            score: null,
                            pk: null,
                            roundHint: '12R 직후',
                            isProjected: !(winA && winB)
                        });
                        wIdx += 2;
                    } else {
                        r16List.push({
                            home: null,
                            away: null,
                            homePlaceholder: `시드 #${i * 2 + 1}`,
                            awayPlaceholder: `시드 #${i * 2 + 2}`,
                            winner: null,
                            score: null,
                            roundHint: '12R 직후',
                            isProjected: true
                        });
                    }
                }
            }
        }

        // 3) QF (8강, 4경기)
        const qfActual = cup.bracket['QF'] || [];
        const qfList = [];
        for (let i = 0; i < 4; i++) {
            if (qfActual[i]) {
                qfList.push({ ...qfActual[i], roundHint: '18R 직후' });
            } else if (isShort) {
                const r1M = r1List[i];
                qfList.push({
                    home: seeds[i] || null,
                    away: (r1M && r1M.winner) ? r1M.winner : null,
                    homePlaceholder: `시드 #${i + 1}`,
                    awayPlaceholder: `1R #${i + 1} 승자`,
                    winner: null,
                    score: null,
                    roundHint: '18R 직후',
                    isProjected: true
                });
            } else {
                const mA = r16List[i * 2];
                const mB = r16List[i * 2 + 1];
                qfList.push({
                    home: (mA && mA.winner) ? mA.winner : null,
                    away: (mB && mB.winner) ? mB.winner : null,
                    homePlaceholder: `16강 #${i * 2 + 1} 승자`,
                    awayPlaceholder: `16강 #${i * 2 + 2} 승자`,
                    winner: null,
                    score: null,
                    roundHint: '18R 직후',
                    isProjected: true
                });
            }
        }

        // 4) SF (4강, 2경기)
        const sfActual = cup.bracket['SF'] || [];
        const sfList = [];
        for (let i = 0; i < 2; i++) {
            if (sfActual[i]) {
                sfList.push({ ...sfActual[i], roundHint: '24R 직후' });
            } else {
                const mA = qfList[i * 2];
                const mB = qfList[i * 2 + 1];
                sfList.push({
                    home: (mA && mA.winner) ? mA.winner : null,
                    away: (mB && mB.winner) ? mB.winner : null,
                    homePlaceholder: `8강 #${i * 2 + 1} 승자`,
                    awayPlaceholder: `8강 #${i * 2 + 2} 승자`,
                    winner: null,
                    score: null,
                    roundHint: '24R 직후',
                    isProjected: true
                });
            }
        }

        // 5) FINAL (결승, 1경기)
        const finalActual = cup.bracket['FINAL'] || [];
        const finalList = [];
        if (finalActual[0]) {
            finalList.push({ ...finalActual[0], roundHint: '30R 직후' });
        } else {
            const mA = sfList[0];
            const mB = sfList[1];
            finalList.push({
                home: (mA && mA.winner) ? mA.winner : null,
                away: (mB && mB.winner) ? mB.winner : null,
                homePlaceholder: `4강 #1 승자`,
                awayPlaceholder: `4강 #2 승자`,
                winner: null,
                score: null,
                roundHint: '30R 직후',
                isProjected: true
            });
        }

        return { r1List, r32List, r16List, qfList, sfList, finalList, hasR32, isShort };
    }

    // ------------------------------------------
    // 4-1B. FA컵 토너먼트 트리 HTML 빌더
    // ------------------------------------------
    buildFAContentHTML() {
        if (!gameData.faCup && !gameData.isWorldCupMode) {
            this.initFACup();
        }
        const cup = gameData.faCup;
        if (!cup) return '<div style="padding:20px; text-align:center; color:#94A3B8;">FA컵 데이터가 없습니다.</div>';

        const faConfig = cup.config || this.getUserFACupConfig();
        const activeTag = cup.isUserActive 
            ? `<span class="hired-badge-permanent">생존 중 (${this.faStageNames[cup.currentStage] || '진행 중'})</span>`
            : `<span style="color:#EF4444; font-weight:700;">탈락 (${this.faStageNames[cup.userEliminatedStage] || ''})</span>`;

        const tree = this.getResolvedFATree();
        const logoHeader = getCupLogoHTML(faConfig.logo, faConfig.flag, 32);

        const buildColumnHTML = (stKey, stTitle, roundDesc, list, shortLabel, hasConnector = true) => {
            const isCurrent = cup.currentStage === stKey;
            let pairsHTML = '';

            if (hasConnector && list.length >= 2 && list.length % 2 === 0) {
                for (let i = 0; i < list.length; i += 2) {
                    pairsHTML += `
                        <div class="tourney-pair-box">
                            <div class="tourney-pair-items">
                                ${this.renderTourneyMatchCardHTML(list[i], i, shortLabel)}
                                ${this.renderTourneyMatchCardHTML(list[i + 1], i + 1, shortLabel)}
                            </div>
                            <div class="tourney-connector-bridge"></div>
                        </div>
                    `;
                }
            } else {
                list.forEach((m, i) => {
                    pairsHTML += `
                        <div class="tourney-single-box">
                            ${this.renderTourneyMatchCardHTML(m, i, shortLabel)}
                        </div>
                    `;
                });
            }

            return `
                <div class="tourney-stage-col ${isCurrent ? 'active-stage-col' : ''}">
                    <div class="tourney-stage-header">
                        <div class="tourney-stage-title">${stTitle}</div>
                        <div class="tourney-stage-sub">${roundDesc} ${isCurrent ? '<span class="col-active-tag">진행 중</span>' : ''}</div>
                    </div>
                    <div class="tourney-stage-body">
                        ${pairsHTML}
                    </div>
                </div>
            `;
        };

        const champName = cup.champion ? ((typeof teamNames !== 'undefined' && teamNames[cup.champion]) ? teamNames[cup.champion] : cup.champion) : null;
        const roundScheduleText = tree.hasR32
            ? '6R / 9R / 12R / 18R / 24R / 30R 직후'
            : '6R / 12R / 18R / 24R / 30R 직후';
        const seedBannerText = tree.hasR32
            ? `32강 본선 직행 (EPL ${(cup.seedTeams || []).length}개 전 구단) + 1라운드 예선 (EFL 챔피언십 ${tree.r1List.length * 2}개 전 구단)`
            : `${tree.isShort ? '8강' : '16강'} 본선 직행 (${(cup.seedTeams || []).length}개 구단) + 1라운드 예선 (${tree.r1List.length * 2}개 구단)`;

        return `
            <div style="background:#0F172A; border:1px solid #334155; border-radius:10px; padding:12px 16px; margin-bottom:12px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${logoHeader}
                    <div>
                        <div style="font-weight:800; font-size:1.15rem; color:#F8FAFC;">${faConfig.fullName} (${faConfig.country}) 토너먼트 대진표</div>
                        <div style="font-size:0.85rem; color:#94A3B8;">단판 승부 (무승부 시 승부차기) · 개최 라운드: ${roundScheduleText} · 상태: ${activeTag}</div>
                    </div>
                </div>
                ${champName ? `<div style="background:rgba(251,191,36,0.15); border:1px solid #FBBF24; padding:6px 14px; border-radius:8px; color:#FBBF24; font-weight:800; font-size:0.95rem;">🏆 챔피언: ${champName}</div>` : ''}
            </div>

            <div class="facup-reward-banner">
                <div class="reward-pill">🏆 우승 상금: <strong>400억원</strong></div>
                <div class="reward-pill">🥈 준우승: <strong>150억원</strong></div>
                <div class="reward-pill">🎯 시드 배정: <strong>${seedBannerText}</strong></div>
            </div>

            <!-- 실제 토너먼트 브래킷 트리 -->
            <div class="tourney-tree-scroll">
                <div class="tourney-tree-grid">
                    ${buildColumnHTML('R1', '1라운드 (예선)', '리그 6R 직후', tree.r1List, '1R', false)}
                    ${tree.hasR32 ? buildColumnHTML('R32', '32강전 (Round of 32)', '리그 9R 직후', tree.r32List, '32강', true) : ''}
                    ${!tree.isShort ? buildColumnHTML('R16', '16강전 (Round of 16)', '리그 12R 직후', tree.r16List, '16강', true) : ''}
                    ${buildColumnHTML('QF', '8강전 (Quarter-Final)', '리그 18R 직후', tree.qfList, '8강', true)}
                    ${buildColumnHTML('SF', '4강전 (Semi-Final)', '리그 24R 직후', tree.sfList, '4강', true)}
                    <div class="tourney-stage-col ${cup.currentStage === 'FINAL' ? 'active-stage-col' : ''}">
                        <div class="tourney-stage-header">
                            <div class="tourney-stage-title" style="color:#FBBF24;">🏆 결승전 (THE FINAL)</div>
                            <div class="tourney-stage-sub">리그 30R 직후 ${cup.currentStage === 'FINAL' ? '<span class="col-active-tag">진행 중</span>' : ''}</div>
                        </div>
                        <div class="tourney-stage-body final-stage-body">
                            ${this.renderTourneyMatchCardHTML(tree.finalList[0], 0, 'FINAL')}
                            <div class="tourney-champion-podium ${champName ? 'crowned' : ''}">
                                <div class="podium-icon">🏆</div>
                                <div class="podium-label">${faConfig.name} 우승</div>
                                <div class="podium-team">
                                    ${cup.champion ? `${getClubMiniLogoHTML(cup.champion, 22)} <span>${champName}</span>` : '<span style="color:#64748B;">결승전 승리 구단</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ------------------------------------------
    // 4-2. UCL 토너먼트 트리 데이터 조립 (리그페이즈 중에도 실시간 순위 기반 예상 대진 트리 제공)
    // ------------------------------------------
    getResolvedUCLTree() {
        const ucl = gameData.ucl;
        if (!ucl) return null;

        const sorted = this.getSortedUCLTable();
        const top8 = sorted.slice(0, 8).map((r, i) => ({ team: r.team, rank: i + 1 }));
        const poSeeds = sorted.slice(8, 16).map((r, i) => ({ team: r.team, rank: i + 9 }));
        const poUnseeds = sorted.slice(16, 24).map((r, i) => ({ team: r.team, rank: i + 17 })).reverse();

        // 1) PO (8경기: 9~24위)
        const poActual = ucl.bracket['PO'] || [];
        const poList = [];
        for (let i = 0; i < 8; i++) {
            if (poActual[i]) {
                poList.push({ ...poActual[i], roundHint: '28R 직후' });
            } else {
                const u = poUnseeds[i];
                const s = poSeeds[i];
                poList.push({
                    home: u ? u.team : null,
                    away: s ? s.team : null,
                    homeRank: u ? u.rank : (24 - i),
                    awayRank: s ? s.rank : (9 + i),
                    homePlaceholder: `리그 ${24 - i}위`,
                    awayPlaceholder: `리그 ${9 + i}위`,
                    winner: null,
                    score: null,
                    roundHint: '28R 직후 (예상)',
                    isProjected: true
                });
            }
        }

        // 2) R16 (8경기: PO 승자 vs 1~8위 직행 시드)
        const r16Actual = ucl.bracket['R16'] || [];
        const r16List = [];
        for (let i = 0; i < 8; i++) {
            if (r16Actual[i]) {
                r16List.push({ ...r16Actual[i], roundHint: '31R 직후' });
            } else {
                const poM = poList[i];
                const seedObj = top8[i];
                r16List.push({
                    home: (poM && poM.winner) ? poM.winner : null,
                    away: seedObj ? seedObj.team : null,
                    awayRank: seedObj ? seedObj.rank : (i + 1),
                    homePlaceholder: `PO #${i + 1} 승자`,
                    awayPlaceholder: `리그 ${i + 1}위 직행`,
                    winner: null,
                    score: null,
                    roundHint: '31R 직후',
                    isProjected: true
                });
            }
        }

        // 3) QF (8강, 4경기)
        const qfActual = ucl.bracket['QF'] || [];
        const qfList = [];
        for (let i = 0; i < 4; i++) {
            if (qfActual[i]) {
                qfList.push({ ...qfActual[i], roundHint: '33R 직후' });
            } else {
                const mA = r16List[i * 2];
                const mB = r16List[i * 2 + 1];
                qfList.push({
                    home: (mA && mA.winner) ? mA.winner : null,
                    away: (mB && mB.winner) ? mB.winner : null,
                    homePlaceholder: `16강 #${i * 2 + 1} 승자`,
                    awayPlaceholder: `16강 #${i * 2 + 2} 승자`,
                    winner: null,
                    score: null,
                    roundHint: '33R 직후',
                    isProjected: true
                });
            }
        }

        // 4) SF (4강, 2경기)
        const sfActual = ucl.bracket['SF'] || [];
        const sfList = [];
        for (let i = 0; i < 2; i++) {
            if (sfActual[i]) {
                sfList.push({ ...sfActual[i], roundHint: '35R 직후' });
            } else {
                const mA = qfList[i * 2];
                const mB = qfList[i * 2 + 1];
                sfList.push({
                    home: (mA && mA.winner) ? mA.winner : null,
                    away: (mB && mB.winner) ? mB.winner : null,
                    homePlaceholder: `8강 #${i * 2 + 1} 승자`,
                    awayPlaceholder: `8강 #${i * 2 + 2} 승자`,
                    winner: null,
                    score: null,
                    roundHint: '35R 직후',
                    isProjected: true
                });
            }
        }

        // 5) FINAL (결승, 1경기)
        const finalActual = ucl.bracket['FINAL'] || [];
        const finalList = [];
        if (finalActual[0]) {
            finalList.push({ ...finalActual[0], roundHint: '37R 직후' });
        } else {
            const mA = sfList[0];
            const mB = sfList[1];
            finalList.push({
                home: (mA && mA.winner) ? mA.winner : null,
                away: (mB && mB.winner) ? mB.winner : null,
                homePlaceholder: `4강 #1 승자`,
                awayPlaceholder: `4강 #2 승자`,
                winner: null,
                score: null,
                roundHint: '37R 직후',
                isProjected: true
            });
        }

        return { poList, r16List, qfList, sfList, finalList };
    }

    // ------------------------------------------
    // 4-2B. UEFA 챔피언스리그 (토너먼트 트리 + 경기 일정 + 36팀 순위표) 빌더
    // ------------------------------------------
    buildUCLContentHTML() {
        if (!gameData.ucl && !gameData.isWorldCupMode) {
            this.initUCL();
        }
        const ucl = gameData.ucl;
        if (!ucl) return '<div style="padding:20px; text-align:center; color:#94A3B8;">챔피언스리그 데이터가 없습니다.</div>';

        const sortedTable = this.getSortedUCLTable();
        const userTeam = gameData.selectedTeam;
        const currentStageName = this.uclStageNames[ucl.currentStage] || ucl.currentStage;
        const logoHeader = getCupLogoHTML(ucl.config.logo, '⭐', 32);
        const subTab = this.activeUCLSubTab || 'bracket';

        let activeTag = '';
        if (!ucl.teams.includes(userTeam)) {
            activeTag = '<span style="color:#94A3B8; font-weight:700;">본선 미진출</span>';
        } else if (ucl.isUserActive) {
            activeTag = `<span class="hired-badge-permanent" style="background:#0284C7; color:#fff;">진출 중 (${currentStageName})</span>`;
        } else {
            activeTag = `<span style="color:#EF4444; font-weight:700;">탈락 (${this.uclStageNames[ucl.userEliminatedStage] || ucl.userEliminatedStage})</span>`;
        }

        const champName = ucl.champion ? ((typeof teamNames !== 'undefined' && teamNames[ucl.champion]) ? teamNames[ucl.champion] : ucl.champion) : null;

        let subContentHTML = '';
        if (subTab === 'bracket') {
            const tree = this.getResolvedUCLTree();
            const isInLP = ucl.currentStage.startsWith('LP');

            const buildUCLCol = (stKey, stTitle, roundDesc, list, shortLabel, hasConnector = true) => {
                const isCurrent = ucl.currentStage === stKey;
                let pairsHTML = '';
                if (hasConnector && list.length >= 2 && list.length % 2 === 0) {
                    for (let i = 0; i < list.length; i += 2) {
                        pairsHTML += `
                            <div class="tourney-pair-box">
                                <div class="tourney-pair-items">
                                    ${this.renderTourneyMatchCardHTML(list[i], i, shortLabel, '#38BDF8')}
                                    ${this.renderTourneyMatchCardHTML(list[i + 1], i + 1, shortLabel, '#38BDF8')}
                                </div>
                                <div class="tourney-connector-bridge ucl-bridge"></div>
                            </div>
                        `;
                    }
                } else {
                    list.forEach((m, i) => {
                        pairsHTML += `
                            <div class="tourney-single-box">
                                ${this.renderTourneyMatchCardHTML(m, i, shortLabel, '#38BDF8')}
                            </div>
                        `;
                    });
                }

                return `
                    <div class="tourney-stage-col ${isCurrent ? 'active-stage-col ucl-active-col' : ''}">
                        <div class="tourney-stage-header">
                            <div class="tourney-stage-title">${stTitle}</div>
                            <div class="tourney-stage-sub">${roundDesc} ${isCurrent ? '<span class="col-active-tag">진행 중</span>' : ''}</div>
                        </div>
                        <div class="tourney-stage-body">
                            ${pairsHTML}
                        </div>
                    </div>
                `;
            };

            subContentHTML = `
                ${isInLP ? `
                    <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.35); border-radius:8px; padding:9px 14px; margin-bottom:10px; font-size:0.83rem; color:#BAE6FD; display:flex; justify-content:space-between; align-items:center;">
                        <span>💡 현재 <strong>${currentStageName}</strong> 진행 중입니다. 아래 대진표는 <strong>실시간 리그 페이즈 순위(1~8위 16강 시드 · 9~24위 PO)</strong>를 반영한 예상 토너먼트 트리입니다.</span>
                        <span style="color:#38BDF8; font-weight:800;">리그 28R 직후 PO 확정</span>
                    </div>
                ` : ''}
                <div class="tourney-tree-scroll">
                    <div class="tourney-tree-grid">
                        ${buildUCLCol('PO', '16강 플레이오프 (9~24위)', '리그 28R 직후', tree.poList, 'PO', false)}
                        ${buildUCLCol('R16', '16강전 (Round of 16)', '리그 31R 직후', tree.r16List, '16강', true)}
                        ${buildUCLCol('QF', '8강전 (Quarter-Final)', '리그 33R 직후', tree.qfList, '8강', true)}
                        ${buildUCLCol('SF', '4강전 (Semi-Final)', '리그 35R 직후', tree.sfList, '4강', true)}
                        <div class="tourney-stage-col ${ucl.currentStage === 'FINAL' ? 'active-stage-col ucl-active-col' : ''}">
                            <div class="tourney-stage-header">
                                <div class="tourney-stage-title" style="color:#38BDF8;">⭐ 결승전 (THE FINAL)</div>
                                <div class="tourney-stage-sub">리그 37R 직후 ${ucl.currentStage === 'FINAL' ? '<span class="col-active-tag">진행 중</span>' : ''}</div>
                            </div>
                            <div class="tourney-stage-body final-stage-body">
                                ${this.renderTourneyMatchCardHTML(tree.finalList[0], 0, 'FINAL', '#38BDF8')}
                                <div class="tourney-champion-podium ucl-podium ${champName ? 'crowned' : ''}">
                                    <div class="podium-icon">⭐</div>
                                    <div class="podium-label">UEFA 챔피언스리그 우승</div>
                                    <div class="podium-team">
                                        ${ucl.champion ? `${getClubMiniLogoHTML(ucl.champion, 22)} <span>${champName}</span>` : '<span style="color:#64748B;">빅이어 주인공</span>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (subTab === 'schedule') {
            const curLP = this.activeUCLScheduleStage || (ucl.currentStage.startsWith('LP') ? ucl.currentStage : 'LP1');
            const lpRoundMap = { LP1: 4, LP2: 8, LP3: 11, LP4: 15, LP5: 17, LP6: 21, LP7: 23, LP8: 26 };

            // 내 팀의 UCL 8경기 요약
            let myUCLMatchesHTML = '';
            if (ucl.teams.includes(userTeam)) {
                let cards = '';
                for (let r = 1; r <= 8; r++) {
                    const st = `LP${r}`;
                    const mList = ucl.schedule[st] || [];
                    const myM = mList.find(m => m.home === userTeam || m.away === userTeam);
                    if (myM) {
                        const isHome = myM.home === userTeam;
                        const opp = isHome ? myM.away : myM.home;
                        const oppName = (typeof teamNames !== 'undefined' && teamNames[opp]) ? teamNames[opp] : opp;
                        const scoreStr = myM.played ? `${myM.homeScore} : ${myM.awayScore}` : `리그 ${lpRoundMap[st]}R 직후`;
                        let resColor = '#94A3B8';
                        if (myM.played) {
                            const myS = isHome ? myM.homeScore : myM.awayScore;
                            const opS = isHome ? myM.awayScore : myM.homeScore;
                            resColor = myS > opS ? '#10B981' : (myS < opS ? '#EF4444' : '#FBBF24');
                        }
                        cards += `
                            <div style="background:#0F172A; border:1px solid ${ucl.currentStage === st ? '#38BDF8' : '#334155'}; border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:4px;">
                                <div style="display:flex; justify-content:space-between; font-size:0.74rem; color:#94A3B8;">
                                    <strong style="color:#38BDF8;">${r}차전 (${isHome ? '홈' : '원정'})</strong>
                                    <span>${lpRoundMap[st]}R 직후</span>
                                </div>
                                <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:0.86rem; color:#F8FAFC;">
                                    ${getClubMiniLogoHTML(opp, 18)}
                                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${oppName}</span>
                                </div>
                                <div style="font-size:0.8rem; font-weight:800; color:${resColor};">${scoreStr}</div>
                            </div>
                        `;
                    }
                }
                myUCLMatchesHTML = `
                    <div style="background:#1E293B; border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:12px;">
                        <div style="font-weight:800; color:#38BDF8; font-size:0.92rem; margin-bottom:8px;">⭐ 내 구단 리그 페이즈 8경기 일정 (홈 4경기 · 원정 4경기)</div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap:8px;">
                            ${cards}
                        </div>
                    </div>
                `;
            }

            // LP1 ~ LP8 라운드 버튼
            let lpBtns = '';
            for (let r = 1; r <= 8; r++) {
                const st = `LP${r}`;
                const active = curLP === st;
                lpBtns += `
                    <button type="button" data-ucl-lp-stage="${st}" style="padding:6px 12px; border-radius:6px; border:1px solid ${active ? '#38BDF8' : '#334155'}; background:${active ? '#0284C7' : '#0F172A'}; color:${active ? '#fff' : '#CBD5E1'}; font-weight:700; font-size:0.82rem; cursor:pointer;">
                        ${r}차전 (${lpRoundMap[st]}R)
                    </button>
                `;
            }

            const lpMatches = ucl.schedule[curLP] || [];
            let lpGridHTML = '';
            lpMatches.forEach(m => {
                const isMy = m.home === userTeam || m.away === userTeam;
                const hName = (typeof teamNames !== 'undefined' && teamNames[m.home]) ? teamNames[m.home] : m.home;
                const aName = (typeof teamNames !== 'undefined' && teamNames[m.away]) ? teamNames[m.away] : m.away;
                lpGridHTML += `
                    <div style="background:${isMy ? 'rgba(56,189,248,0.14)' : '#0F172A'}; border:1px solid ${isMy ? '#38BDF8' : '#334155'}; border-radius:8px; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <div style="display:flex; align-items:center; gap:6px; flex:1; justify-content:flex-end; text-align:right; font-weight:${m.home === userTeam ? '800' : '600'}; color:${m.home === userTeam ? '#38BDF8' : '#F1F5F9'}; font-size:0.85rem;">
                            <span>${hName}</span>
                            ${getClubMiniLogoHTML(m.home, 18)}
                        </div>
                        <div style="min-width:64px; text-align:center; padding:3px 8px; border-radius:6px; background:#1E293B; font-weight:800; color:${m.played ? '#FBBF24' : '#94A3B8'}; font-size:0.85rem;">
                            ${m.played ? `${m.homeScore} : ${m.awayScore}` : 'VS'}
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; flex:1; justify-content:flex-start; text-align:left; font-weight:${m.away === userTeam ? '800' : '600'}; color:${m.away === userTeam ? '#38BDF8' : '#F1F5F9'}; font-size:0.85rem;">
                            ${getClubMiniLogoHTML(m.away, 18)}
                            <span>${aName}</span>
                        </div>
                    </div>
                `;
            });

            subContentHTML = `
                ${myUCLMatchesHTML}
                <div style="background:#1E293B; border:1px solid #334155; border-radius:10px; padding:12px;">
                    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; margin-bottom:12px;">
                        <div style="font-weight:800; color:#F8FAFC; font-size:0.95rem;">📅 ${this.uclStageNames[curLP]} 전체 대진 (총 18경기)</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${lpBtns}</div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap:8px;">
                        ${lpGridHTML}
                    </div>
                </div>
            `;
        } else {
            // 36개 팀 통합 순위표
            let tableRowsHTML = '';
            sortedTable.forEach((row, idx) => {
                const rank = idx + 1;
                const isUser = row.team === userTeam;
                let rankStyle = 'color:#94A3B8;';
                let rowBg = isUser ? 'background: rgba(56, 189, 248, 0.15);' : '';
                let zoneBadge = '';

                if (rank <= 8) {
                    rankStyle = 'color:#10B981; font-weight:800;';
                    zoneBadge = '<span style="font-size:0.7rem; color:#10B981; background:rgba(16,185,129,0.12); padding:1px 6px; border-radius:4px;">16강 직행</span>';
                } else if (rank <= 24) {
                    rankStyle = 'color:#F59E0B; font-weight:700;';
                    zoneBadge = '<span style="font-size:0.7rem; color:#F59E0B; background:rgba(245,158,11,0.12); padding:1px 6px; border-radius:4px;">16강 PO</span>';
                } else {
                    rankStyle = 'color:#64748B;';
                    zoneBadge = '<span style="font-size:0.7rem; color:#64748B;">탈락권</span>';
                }

                const displayName = (typeof teamNames !== 'undefined' && teamNames[row.team]) ? teamNames[row.team] : row.team;

                tableRowsHTML += `
                    <tr style="${rowBg} border-bottom: 1px solid #1E293B;">
                        <td style="padding: 7px 8px; text-align:center; ${rankStyle}">${rank}</td>
                        <td style="padding: 7px 8px; font-weight:${isUser ? '800' : '600'}; color:${isUser ? '#38BDF8' : '#F1F5F9'}; display:flex; align-items:center; gap:8px;">
                            ${getClubMiniLogoHTML(row.team, 18)}
                            <span>${displayName}</span>
                            ${isUser ? '<span style="font-size:0.72rem; background:#0284C7; color:#fff; padding:1px 5px; border-radius:4px;">MY</span>' : ''}
                        </td>
                        <td style="padding: 7px 8px; text-align:center;">${zoneBadge}</td>
                        <td style="padding: 7px 8px; text-align:center; color:#CBD5E1;">${row.played}</td>
                        <td style="padding: 7px 8px; text-align:center; color:#94A3B8;">${row.won}</td>
                        <td style="padding: 7px 8px; text-align:center; color:#94A3B8;">${row.drawn}</td>
                        <td style="padding: 7px 8px; text-align:center; color:#94A3B8;">${row.lost}</td>
                        <td style="padding: 7px 8px; text-align:center; color:#94A3B8;">${row.gf}:${row.ga}</td>
                        <td style="padding: 7px 8px; text-align:center; color:${row.gd > 0 ? '#10B981' : (row.gd < 0 ? '#EF4444' : '#94A3B8')};">${row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td style="padding: 7px 8px; text-align:center; font-weight:800; color:#FBBF24;">${row.points}</td>
                    </tr>
                `;
            });

            subContentHTML = `
                <div style="background:#1E293B; border:1px solid #334155; border-radius:10px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="font-weight:800; color:#38BDF8; font-size:0.95rem;">📊 UEFA 챔피언스리그 36개 팀 단일 리그 페이즈 순위표</div>
                        <div style="display:flex; gap:12px; font-size:0.78rem;">
                            <span style="color:#10B981;">■ 1~8위: 16강 본선 직행</span>
                            <span style="color:#F59E0B;">■ 9~24위: 녹아웃 PO 진출</span>
                            <span style="color:#64748B;">■ 25~36위: 탈락</span>
                        </div>
                    </div>
                    <div style="max-height:520px; overflow-y:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.83rem;">
                            <thead>
                                <tr style="border-bottom:1px solid #475569; color:#94A3B8; background:#0F172A;">
                                    <th style="padding:6px 8px; text-align:center;">순위</th>
                                    <th style="padding:6px 8px; text-align:left;">구단</th>
                                    <th style="padding:6px 8px; text-align:center;">진출권</th>
                                    <th style="padding:6px 8px; text-align:center;">경기</th>
                                    <th style="padding:6px 8px; text-align:center;">승</th>
                                    <th style="padding:6px 8px; text-align:center;">무</th>
                                    <th style="padding:6px 8px; text-align:center;">패</th>
                                    <th style="padding:6px 8px; text-align:center;">득:실</th>
                                    <th style="padding:6px 8px; text-align:center;">득실차</th>
                                    <th style="padding:6px 8px; text-align:center; color:#FBBF24;">승점</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRowsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        return `
            <div style="background:#0F172A; border:1px solid #334155; border-radius:10px; padding:12px 16px; margin-bottom:10px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${logoHeader}
                    <div>
                        <div style="font-weight:800; font-size:1.15rem; color:#38BDF8;">UEFA 챔피언스리그 (토너먼트 대진표 & 리그 페이즈)</div>
                        <div style="font-size:0.85rem; color:#94A3B8;">상위 8팀 16강 직행 · 9~24위 플레이오프 · 상태: ${activeTag}</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" data-ucl-subtab="bracket" style="padding:7px 14px; border-radius:8px; border:1px solid ${subTab === 'bracket' ? '#38BDF8' : '#334155'}; background:${subTab === 'bracket' ? '#0284C7' : '#1E293B'}; color:#fff; font-weight:800; font-size:0.83rem; cursor:pointer;">
                        🏆 토너먼트 대진표 (트리)
                    </button>
                    <button type="button" data-ucl-subtab="schedule" style="padding:7px 14px; border-radius:8px; border:1px solid ${subTab === 'schedule' ? '#38BDF8' : '#334155'}; background:${subTab === 'schedule' ? '#0284C7' : '#1E293B'}; color:#fff; font-weight:800; font-size:0.83rem; cursor:pointer;">
                        📅 UCL 경기 일정 (1~8차전)
                    </button>
                    <button type="button" data-ucl-subtab="table" style="padding:7px 14px; border-radius:8px; border:1px solid ${subTab === 'table' ? '#38BDF8' : '#334155'}; background:${subTab === 'table' ? '#0284C7' : '#1E293B'}; color:#fff; font-weight:800; font-size:0.83rem; cursor:pointer;">
                        📊 36개 팀 통합 순위표
                    </button>
                </div>
            </div>

            ${subContentHTML}
        `;
    }

    // ------------------------------------------
    // 4-3. 시즌 전체 경기 일정 뷰 빌더 (내 구단 전체 일정 & 리그 라운드별 전 경기 대진표)
    // ------------------------------------------
    buildSeasonScheduleHTML() {
        const userTeam = gameData.selectedTeam;
        const userLeagueId = (typeof LeagueManager !== 'undefined') ? LeagueManager.getLeagueIdByTeam(userTeam) : 'premier_league';
        const curRound = gameData.currentRound || 1;
        const mode = this.activeSeasonSchedMode || 'my';

        if (!this.activeSeasonSchedLeague) this.activeSeasonSchedLeague = userLeagueId;
        if (!this.activeSeasonSchedRound) this.activeSeasonSchedRound = curRound;

        const modeBarHTML = `
            <div style="background:#0F172A; border:1px solid #334155; border-radius:10px; padding:12px 16px; margin-bottom:12px; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px;">
                <div>
                    <div style="font-weight:800; font-size:1.12rem; color:#10B981;">📅 시즌 공식 경기 일정 & 결과 센터</div>
                    <div style="font-size:0.83rem; color:#94A3B8;">정규 리그 · UEFA 챔피언스리그 · FA컵 연간 스케줄 및 라운드별 매치업</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" data-sched-mode="my" style="padding:8px 16px; border-radius:8px; border:1px solid ${mode === 'my' ? '#10B981' : '#334155'}; background:${mode === 'my' ? 'rgba(16,185,129,0.2)' : '#1E293B'}; color:${mode === 'my' ? '#10B981' : '#CBD5E1'}; font-weight:800; cursor:pointer;">
                        📅 내 구단 시즌 전체 일정
                    </button>
                    <button type="button" data-sched-mode="round" style="padding:8px 16px; border-radius:8px; border:1px solid ${mode === 'round' ? '#38BDF8' : '#334155'}; background:${mode === 'round' ? 'rgba(56,189,248,0.2)' : '#1E293B'}; color:${mode === 'round' ? '#38BDF8' : '#CBD5E1'}; font-weight:800; cursor:pointer;">
                        🏟️ 리그 라운드별 전체 대진표
                    </button>
                </div>
            </div>
        `;

        if (mode === 'my') {
            const schedKey = (gameData.schedule && gameData.schedule[userLeagueId]) ? userLeagueId : `division${gameData.currentLeague || 1}`;
            const leagueSched = (gameData.schedule && gameData.schedule[schedKey]) ? gameData.schedule[schedKey] : [];
            const faConfig = this.getUserFACupConfig();

            let timelineItems = '';
            for (let r = 1; r <= leagueSched.length; r++) {
                const rMatches = leagueSched[r - 1] || [];
                const myLeagueMatch = rMatches.find(m => m && (m.home === userTeam || m.away === userTeam));

                // 1) 해당 라운드에 걸려있는 UCL 일정 체크
                const uclSt = this.uclSchedule[r];
                if (uclSt && gameData.ucl && gameData.ucl.teams && gameData.ucl.teams.includes(userTeam)) {
                    const ucl = gameData.ucl;
                    let uclOpp = null, uclIsHome = true, uclScore = null, uclPlayed = false;
                    if (uclSt.startsWith('LP')) {
                        const m = (ucl.schedule[uclSt] || []).find(x => x.home === userTeam || x.away === userTeam);
                        if (m) {
                            uclIsHome = m.home === userTeam;
                            uclOpp = uclIsHome ? m.away : m.home;
                            uclPlayed = !!m.played;
                            if (uclPlayed) uclScore = `${m.homeScore} : ${m.awayScore}`;
                        }
                    } else {
                        const m = (ucl.bracket[uclSt] || []).find(x => x.home === userTeam || x.away === userTeam);
                        if (m) {
                            uclIsHome = m.home === userTeam;
                            uclOpp = uclIsHome ? m.away : m.home;
                            uclPlayed = !!m.winner;
                            if (uclPlayed) uclScore = `${m.score}${m.pk ? ' ' + m.pk : ''}`;
                        }
                    }

                    if (uclOpp || (!uclSt.startsWith('LP') && ucl.isUserActive)) {
                        const oppLabel = uclOpp ? ((typeof teamNames !== 'undefined' && teamNames[uclOpp]) ? teamNames[uclOpp] : uclOpp) : '토너먼트 대진 예정';
                        const isNextNow = gameData.isUCLMatch && gameData.uclStage === uclSt;
                        timelineItems += `
                            <div class="season-fixture-card ucl-fixture ${isNextNow ? 'current-fixture' : ''}">
                                <div class="fixture-comp-badge ucl">⭐ UCL · ${this.uclStageNames[uclSt]}</div>
                                <div class="fixture-main-row">
                                    <span class="fixture-ha-tag ${uclIsHome ? 'home' : 'away'}">${uclIsHome ? 'HOME' : 'AWAY'}</span>
                                    ${uclOpp ? getClubMiniLogoHTML(uclOpp, 22) : ''}
                                    <strong class="fixture-opp-name">${oppLabel}</strong>
                                </div>
                                <div class="fixture-status-box">
                                    ${uclPlayed ? `<span class="fixture-score">${uclScore}</span>` : (isNextNow ? '<span class="fixture-next-pill">이번 경기</span>' : `<span class="fixture-upcoming">${r}R 주간</span>`)}
                                </div>
                            </div>
                        `;
                    }
                }

                // 2) 해당 라운드에 걸려있는 FA컵 일정 체크
                const faSt = this.faCupSchedule[r];
                if (faSt && gameData.faCup) {
                    const cup = gameData.faCup;
                    const skipStage = (!cup.hasR32 && faSt === 'R32') || (cup.isShortBracket && (faSt === 'R32' || faSt === 'R16'));
                    if (!skipStage) {
                        const m = (cup.bracket[faSt] || []).find(x => x.home === userTeam || x.away === userTeam);
                        if (m || (cup.isUserActive && r >= curRound)) {
                            const faIsHome = m ? (m.home === userTeam) : true;
                            const faOpp = m ? (faIsHome ? m.away : m.home) : null;
                            const seedBypassLabel = cup.hasR32 ? '32강 시드 직행 (예선 면제)' : (cup.isShortBracket ? '8강 시드 직행 (예선 면제)' : '16강 시드 직행 (예선 면제)');
                            const oppLabel = faOpp ? ((typeof teamNames !== 'undefined' && teamNames[faOpp]) ? teamNames[faOpp] : faOpp) : (faSt === 'R1' ? seedBypassLabel : '대진 추첨 예정');
                            const faPlayed = !!(m && m.winner);
                            const isNextNow = gameData.isFACupMatch && gameData.faCupStage === faSt;

                            if (m || faSt !== 'R1') {
                                timelineItems += `
                                    <div class="season-fixture-card fa-fixture ${isNextNow ? 'current-fixture' : ''}">
                                        <div class="fixture-comp-badge fa">🏆 ${faConfig.name} · ${this.faStageNames[faSt]}</div>
                                        <div class="fixture-main-row">
                                            <span class="fixture-ha-tag ${faIsHome ? 'home' : 'away'}">${faIsHome ? 'HOME' : 'AWAY'}</span>
                                            ${faOpp ? getClubMiniLogoHTML(faOpp, 22) : ''}
                                            <strong class="fixture-opp-name">${oppLabel}</strong>
                                        </div>
                                        <div class="fixture-status-box">
                                            ${faPlayed ? `<span class="fixture-score">${m.score}${m.pk ? ' ' + m.pk : ''}</span>` : (isNextNow ? '<span class="fixture-next-pill">이번 경기</span>' : `<span class="fixture-upcoming">${r}R 주간</span>`)}
                                        </div>
                                    </div>
                                `;
                            }
                        }
                    }
                }

                // 3) 정규 리그 라운드 일정
                if (myLeagueMatch) {
                    const isHome = myLeagueMatch.home === userTeam;
                    const opp = isHome ? myLeagueMatch.away : myLeagueMatch.home;
                    const oppName = (typeof teamNames !== 'undefined' && teamNames[opp]) ? teamNames[opp] : opp;
                    const isCurrentLeagueMatch = (r === curRound && !gameData.isUCLMatch && !gameData.isFACupMatch);
                    const isPlayed = !!myLeagueMatch.played || r < curRound;

                    let statusHTML = '';
                    if (myLeagueMatch.played && myLeagueMatch.homeScore !== undefined && myLeagueMatch.homeScore !== null) {
                        const myS = isHome ? myLeagueMatch.homeScore : myLeagueMatch.awayScore;
                        const opS = isHome ? myLeagueMatch.awayScore : myLeagueMatch.homeScore;
                        const resBadge = myS > opS ? '<span class="res-w">승</span>' : (myS < opS ? '<span class="res-l">패</span>' : '<span class="res-d">무</span>');
                        statusHTML = `${resBadge} <span class="fixture-score">${myLeagueMatch.homeScore} : ${myLeagueMatch.awayScore}</span>`;
                    } else if (isPlayed) {
                        statusHTML = `<span class="fixture-upcoming">종료</span>`;
                    } else if (isCurrentLeagueMatch) {
                        statusHTML = `<span class="fixture-next-pill">NEXT MATCH</span>`;
                    } else {
                        statusHTML = `<span class="fixture-upcoming">${r}라운드 예정</span>`;
                    }

                    timelineItems += `
                        <div class="season-fixture-card league-fixture ${isCurrentLeagueMatch ? 'current-fixture' : ''}">
                            <div class="fixture-comp-badge league">⚽ 정규 리그 ${r}R</div>
                            <div class="fixture-main-row">
                                <span class="fixture-ha-tag ${isHome ? 'home' : 'away'}">${isHome ? 'HOME' : 'AWAY'}</span>
                                ${getClubMiniLogoHTML(opp, 22)}
                                <strong class="fixture-opp-name">${oppName}</strong>
                            </div>
                            <div class="fixture-status-box">
                                ${statusHTML}
                            </div>
                        </div>
                    `;
                }
            }

            return `
                ${modeBarHTML}
                <div class="season-fixture-grid">
                    ${timelineItems || '<div style="padding:20px; color:#94A3B8;">생성된 시즌 스케줄이 없습니다.</div>'}
                </div>
            `;
        } else {
            // 리그 라운드별 전 경기 대진표
            const selLeague = this.activeSeasonSchedLeague || userLeagueId;
            const sched = (gameData.schedule && gameData.schedule[selLeague]) ? gameData.schedule[selLeague] : [];
            const maxRound = sched.length || 38;
            const selRound = Math.max(1, Math.min(maxRound, this.activeSeasonSchedRound || curRound));

            let leagueTabs = '';
            if (typeof LEAGUES_CONFIG !== 'undefined') {
                Object.keys(LEAGUES_CONFIG).forEach(lId => {
                    const cfg = LEAGUES_CONFIG[lId];
                    const active = selLeague === lId;
                    leagueTabs += `
                        <button type="button" data-sched-league="${lId}" style="padding:6px 12px; border-radius:6px; border:1px solid ${active ? '#FBBF24' : '#334155'}; background:${active ? '#FBBF24' : '#1E293B'}; color:${active ? '#090D16' : '#CBD5E1'}; font-weight:700; font-size:0.8rem; cursor:pointer; white-space:nowrap;">
                            ${cfg.flag} ${cfg.name.split(' ')[1] || cfg.name}
                        </button>
                    `;
                });
            }

            let roundOptions = '';
            for (let r = 1; r <= maxRound; r++) {
                const cupHint = this.uclSchedule[r] ? ` (⭐UCL ${this.uclStageNames[this.uclSchedule[r]]})` :
                                (this.faCupSchedule[r] ? ` (🏆FA컵 ${this.faStageNames[this.faCupSchedule[r]]})` : '');
                roundOptions += `<option value="${r}" ${r === selRound ? 'selected' : ''}>${r}라운드${r === curRound ? ' (현재)' : ''}${cupHint}</option>`;
            }

            const matches = sched[selRound - 1] || [];
            let matchesHTML = '';
            matches.forEach(m => {
                const isMy = m.home === userTeam || m.away === userTeam;
                const hName = (typeof teamNames !== 'undefined' && teamNames[m.home]) ? teamNames[m.home] : m.home;
                const aName = (typeof teamNames !== 'undefined' && teamNames[m.away]) ? teamNames[m.away] : m.away;
                const hasScore = m.played && m.homeScore !== undefined && m.homeScore !== null;

                matchesHTML += `
                    <div style="background:${isMy ? 'rgba(251,191,36,0.14)' : '#0F172A'}; border:1px solid ${isMy ? '#FBBF24' : '#334155'}; border-radius:8px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end; text-align:right; font-weight:${m.home === userTeam ? '800' : '600'}; color:${m.home === userTeam ? '#FBBF24' : '#F8FAFC'};">
                            <span>${hName}</span>
                            ${getClubMiniLogoHTML(m.home, 20)}
                        </div>
                        <div style="min-width:72px; text-align:center; padding:4px 10px; border-radius:6px; background:#1E293B; font-weight:800; color:${hasScore ? '#38BDF8' : '#94A3B8'};">
                            ${hasScore ? `${m.homeScore} : ${m.awayScore}` : 'VS'}
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-start; text-align:left; font-weight:${m.away === userTeam ? '800' : '600'}; color:${m.away === userTeam ? '#FBBF24' : '#F8FAFC'};">
                            ${getClubMiniLogoHTML(m.away, 20)}
                            <span>${aName}</span>
                        </div>
                    </div>
                `;
            });

            return `
                ${modeBarHTML}
                <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:10px; margin-bottom:10px;">
                    ${leagueTabs}
                </div>
                <div style="background:#1E293B; border:1px solid #334155; border-radius:10px; padding:14px;">
                    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:10px; margin-bottom:14px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <button type="button" data-sched-round="${Math.max(1, selRound - 1)}" class="btn btn-sm" style="padding:6px 12px;">◀ 이전 라운드</button>
                            <select class="sched-round-select" style="background:#0F172A; color:#F8FAFC; border:1px solid #475569; border-radius:6px; padding:6px 12px; font-weight:800; font-size:0.9rem;">
                                ${roundOptions}
                            </select>
                            <button type="button" data-sched-round="${Math.min(maxRound, selRound + 1)}" class="btn btn-sm" style="padding:6px 12px;">다음 라운드 ▶</button>
                            <button type="button" data-sched-round="${curRound}" class="btn btn-sm primary" style="padding:6px 12px;">현재 라운드 (${curRound}R)</button>
                        </div>
                        <div style="font-size:0.82rem; color:#94A3B8;">
                            ${this.uclSchedule[selRound] ? `<span style="color:#38BDF8; font-weight:700;">⭐ 이 라운드 주간 UCL: ${this.uclStageNames[this.uclSchedule[selRound]]}</span>` : ''}
                            ${this.faCupSchedule[selRound] ? `<span style="color:#FBBF24; font-weight:700; margin-left:8px;">🏆 이 라운드 주간 FA컵: ${this.faStageNames[this.faCupSchedule[selRound]]}</span>` : ''}
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:10px;">
                        ${matchesHTML || '<div style="padding:20px; color:#94A3B8;">해당 라운드 대진 데이터가 없습니다.</div>'}
                    </div>
                </div>
            `;
        }
    }
}

// 싱글톤 인스턴스 생성
const cupCompetitionManager = new CupCompetitionManager();
const faCupManager = cupCompetitionManager; // 기존 코드 100% 호환용 alias

if (typeof window !== 'undefined') {
    window.cupCompetitionManager = cupCompetitionManager;
    window.faCupManager = faCupManager;
    window.CUP_CONFIGS = CUP_CONFIGS;
    window.getCupLogoHTML = getCupLogoHTML;
    window.getClubMiniLogoHTML = getClubMiniLogoHTML;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CupCompetitionManager,
        cupCompetitionManager,
        faCupManager,
        CUP_CONFIGS,
        getCupLogoHTML,
        getClubMiniLogoHTML
    };
}
