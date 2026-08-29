// 이적 시스템
console.log('📜 transfer.js 파일 로드 시작');

class TransferSystem {
    constructor() {
        this.transferMarket = [];
        this.transferNews = []; // [추가] 이적 뉴스 데이터 저장
        this.aiTransferCooldown = 0;
        this.aiSquadManagementCooldown = 0; // AI 지능적 영입 쿨타임
        this.basePrice = 600; // 기본 가격 600억으로 하향 조정 (요청사항 반영)
        this.aiTeamBudgets = {}; // AI 팀 현재 자금
        this.aiTeamWageBudgets = {}; // AI 팀 주급 자금Fㄹ

        // 타 리그 선수들
        this.extraPlayers = [

            { "name": "바르트 페르브뤼헌", "position": "GK", "country": "네덜란드", "rating": 85, "age": 22, "team": "외부리그" },
            { "name": "설영우", "position": "DF", "country": "대한민국", "rating": 77, "age": 27, "team": "외부리그" },
            { "name": "이한범", "position": "DF", "country": "대한민국", "rating": 78, "age": 23, "team": "외부리그" },/* 🇶🇦 카타르 */
            { "name": "아크람 아피프", "position": "FW", "country": "카타르", "rating": 79, "age": 29, "team": "외부리그" },
            { "name": "알모에즈 알리", "position": "FW", "country": "카타르", "rating": 78, "age": 29, "team": "외부리그" },
            { "name": "메샬 바르샴", "position": "GK", "country": "카타르", "rating": 74, "age": 27, "team": "외부리그" },
            { "name": "이재성", "position": "MF", "country": "대한민국", "rating": 81, "age": 33, "team": "외부리그" },
            { "name": "네이마르", "position": "FW", "country": "브라질", "rating": 86, "age": 34, "team": "외부리그" },
            /* 🇺🇿 우즈베키스탄 */
            { "name": "엘도르 쇼무로도프", "position": "FW", "country": "우즈베키스탄", "rating": 77, "age": 30, "team": "외부리그" },
            { "name": "압보스벡 파이줄라예프", "position": "MF", "country": "우즈베키스탄", "rating": 75, "age": 22, "team": "외부리그" },
            { "name": "오스톤 우루노프", "position": "MF", "country": "우즈베키스탄", "rating": 73, "age": 25, "team": "외부리그" },
            /* 🇯🇴 요르단 */
            { "name": "무사 알 타마리", "position": "FW", "country": "요르단", "rating": 79, "age": 28, "team": "외부리그" },
            { "name": "야잔 알 나이마트", "position": "FW", "country": "요르단", "rating": 75, "age": 26, "team": "외부리그" },
            /* 🇿🇦 남아프리카공화국 */
            { "name": "론웬 윌리엄스", "position": "GK", "country": "남아프리카공화국", "rating": 74, "age": 34, "team": "외부리그" },
            { "name": "퍼시 타우", "position": "FW", "country": "남아프리카공화국", "rating": 72, "age": 31, "team": "외부리그" },
            { "name": "테보호 모코에나", "position": "MF", "country": "남아프리카공화국", "rating": 68, "age": 29, "team": "외부리그" },
            /* 🇨🇼 퀴라소 */
            { "name": "타히트 총", "position": "MF", "country": "퀴라소", "rating": 77, "age": 26, "team": "외부리그" },
            { "name": "주니뇨 바쿠나", "position": "MF", "country": "퀴라소", "rating": 74, "age": 28, "team": "외부리그" },
            { "name": "랑헬로 장가", "position": "FW", "country": "퀴라소", "rating": 69, "age": 33, "team": "외부리그" },
            /* 🇨🇻 카보베르데 */
            { "name": "로건 코스타", "position": "DF", "country": "카보베르데", "rating": 78, "age": 24, "team": "외부리그" },
            { "name": "라이언 멘데스", "position": "FW", "country": "카보베르데", "rating": 71, "age": 36, "team": "외부리그" },
            { "name": "보지냐", "position": "GK", "country": "카보베르데", "rating": 80, "age": 40, "team": "외부리그" },
            { "name": "베베", "position": "FW", "country": "카보베르데", "rating": 70, "age": 35, "team": "외부리그" },
            { "name": "조던 픽포드", "position": "GK", "country": "잉글랜드", "rating": 83, "age": 31, "team": "외부리그" },
            { "name": "조규성", "position": "FW", "country": "대한민국", "rating": 80, "age": 27, "team": "외부리그" },
            { "name": "기욤 레스테스", "position": "GK", "country": "프랑스", "rating": 78, "age": 19, "team": "외부리그" },
            { "name": "토마소 마르티넬리", "position": "GK", "country": "이탈리아", "rating": 72, "age": 18, "team": "외부리그" },
            { "name": "윤도영", "position": "FW", "country": "대한민국", "rating": 77, "age": 19, "team": "외부리그" },
            { "name": "조르조 스칼비니", "position": "DF", "country": "이탈리아", "rating": 85, "age": 21, "team": "외부리그" },
            { "name": "우스망 디오망데", "position": "DF", "country": "코트디부아르", "rating": 83, "age": 21, "team": "외부리그" },
            { "name": "파비오 카발리", "position": "DF", "country": "이탈리아", "rating": 73, "age": 19, "team": "외부리그" },
            { "name": "아론 히키", "position": "DF", "country": "스코틀랜드", "rating": 80, "age": 22, "team": "외부리그" },
            { "name": "디오고 코스타", "position": "GK", "country": "포르투갈", "rating": 86, "age": 25, "team": "외부리그" },
            { "name": "후고 라르손", "position": "MF", "country": "스웨덴", "rating": 81, "age": 20, "team": "외부리그" },
            { "name": "아담 와튼", "position": "MF", "country": "잉글랜드", "rating": 84, "age": 20, "team": "외부리그" },
            { "name": "아산 우에드라오고", "position": "MF", "country": "독일", "rating": 78, "age": 18, "team": "외부리그" },
            { "name": "마틴 바투리나", "position": "MF", "country": "크로아티아", "rating": 79, "age": 21, "team": "외부리그" },
            { "name": "자비 게라", "position": "MF", "country": "스페인", "rating": 79, "age": 21, "team": "외부리그" },
            { "name": "옌스 카스트로프", "position": "MF", "country": "대한민국", "rating": 80, "age": 21, "team": "외부리그" },
            { "name": "히오르히 수다코프", "position": "MF", "country": "우크라이나", "rating": 82, "age": 22, "team": "외부리그" },
            { "name": "켄드리 파에스", "position": "MF", "country": "에콰도르", "rating": 76, "age": 17, "team": "외부리그" },
            { "name": "윌프리드 뇽토", "position": "FW", "country": "이탈리아", "rating": 79, "age": 20, "team": "외부리그" },
            { "name": "엘리에스 벤 세기르", "position": "FW", "country": "모로코", "rating": 80, "age": 19, "team": "외부리그" },
            { "name": "에반 퍼거슨", "position": "FW", "country": "아일랜드", "rating": 83, "age": 19, "team": "외부리그" },
            { "name": "카림 코네", "position": "FW", "country": "코트디부아르", "rating": 77, "age": 20, "team": "외부리그" },
            { "name": "엄지성", "position": "FW", "country": "대한민국", "rating": 72, "age": 22, "team": "외부리그" },
            { "name": "배준호", "position": "FW", "country": "대한민국", "rating": 75, "age": 21, "team": "외부리그" },
            { "name": "기성용", "position": "MF", "country": "대한민국", "rating": 80, "age": 37, "team": "외부리그" },
            { "name": "오현규", "position": "FW", "country": "대한민국", "rating": 75, "age": 23, "team": "외부리그" },
            { "name": "폴 포그바", "position": "MF", "country": "프랑스", "rating": 80, "age": 32, "team": "외부리그" },
            { "name": "황희찬", "position": "FW", "country": "대한민국", "rating": 82, "age": 29, "team": "외부리그" },
            { "name": "델레 알리", "position": "MF", "country": "잉글랜드", "rating": 79, "age": 29, "team": "외부리그" },
            { "name": "니코 파스", "position": "MF", "country": "아르헨티나", "rating": 85, "age": 21, "team": "외부리그" },
        ];
    }

    // [추가] 선수가 이미 우리 팀에 있는지 확인하는 헬퍼 메서드
    isPlayerInUserTeam(playerName) {
        if (typeof gameData === 'undefined' || !gameData.selectedTeam || typeof teams === 'undefined' || !teams[gameData.selectedTeam]) {
            return false;
        }
        return teams[gameData.selectedTeam].some(p => p.name === playerName);
    }

    // [추가] 이적 뉴스 추가
    addTransferNews(player, fromTeam, toTeam, fee) {
        this.transferNews.unshift({
            name: player.name,
            position: player.position,
            rating: player.rating,
            age: player.age,
            from: fromTeam,
            to: toTeam,
            fee: fee,
            timestamp: Date.now()
        });
        // 최대 50개까지만 저장
        if (this.transferNews.length > 50) this.transferNews.pop();

        // [SNS] 모든 이적 발생 시 SNS 포스트 생성 및 피드 갱신
        if (typeof snsManager !== 'undefined' && snsManager && typeof snsManager.onPlayerTransfer === 'function') {
            snsManager.onPlayerTransfer(player.name, fromTeam, toTeam, fee);
            if (document.getElementById('snsFeed')) {
                snsManager.displayFeed();
            }
        }
    }

    // 이적 시장 초기화
    initializeTransferMarket() {
        this.transferMarket = [];
        console.log('🔄 [Transfer] 이적 시장 데이터 생성 시작...');

        // 다른 팀의 일부 선수들을 이적 시장에 추가
        try {
            Object.keys(teams).forEach(teamKey => {
                if (teamKey !== gameData.selectedTeam) {
                    const teamPlayers = teams[teamKey];

                    // [안전 장치] teamPlayers가 배열인지 확인
                    if (!Array.isArray(teamPlayers)) {
                        console.warn(`⚠️ [Transfer] ${teamKey} 팀의 선수 데이터가 올바르지 않아 건너뜁니다.`);
                        return;
                    }

                    // 각 팀에서 20% 확률로 선수를 이적 시장에 내놓음
                    teamPlayers.forEach(player => {
                        // [수정] 이미 우리 팀에 있는 선수는 제외 (중복 방지)
                        if (this.isPlayerInUserTeam(player.name)) return;

                        if (Math.random() < 0.2) {
                            this.transferMarket.push({
                                ...player,
                                originalTeam: teamKey,
                                price: this.calculatePlayerPrice(player, teamKey),
                                daysOnMarket: Math.floor(Math.random() * 30)
                            });
                        }
                    });
                }
            });
        } catch (e) {
            console.error('❌ [Transfer] 팀 선수 로딩 중 오류:', e);
        }

        // 타 리그 선수들도 추가
        this.extraPlayers.forEach(player => {
            // [수정] 이미 우리 팀에 있는 선수는 제외 (중복 방지)
            if (this.isPlayerInUserTeam(player.name)) return;

            this.transferMarket.push({
                ...player,
                originalTeam: "외부리그",
                price: this.calculatePlayerPrice(player, "외부리그"),
                daysOnMarket: Math.floor(Math.random() * 30)
            });
        });

        console.log(`✅ [Transfer] 이적 시장 초기화 완료 (총 ${this.transferMarket.length}명)`);
    }

    // 선수 가격 계산 함수
    calculatePlayerPrice(player, teamKey = null) {
        let price = this.basePrice;

        // [수정] 리그 정보 확인 및 페널티 적용
        let league = 1;
        if (teamKey && typeof allTeams !== 'undefined' && allTeams[teamKey]) {
            league = allTeams[teamKey].league;
        } else if (player.originalTeam && typeof allTeams !== 'undefined' && allTeams[player.originalTeam]) {
            league = allTeams[player.originalTeam].league;
        }

        if (league === 3) {
            price *= 0.7; // 3부 리그 선수 30% 감가
        } else if (league === 2) {
            price *= 0.85; // 2부 리그 선수 15% 감가
        }

        // 레이팅에 따른 가격 조정 (핵심)
        let ratingMultiplier;

        if (player.rating >= 90) {
            ratingMultiplier = 3.0;
        } else if (player.rating >= 85) {
            ratingMultiplier = 2.0;
        } else if (player.rating >= 80) {
            ratingMultiplier = 1.2;
        } else if (player.rating >= 75) {
            ratingMultiplier = 0.5;
        } else if (player.rating >= 70) {
            ratingMultiplier = 0.2;
        } else {
            ratingMultiplier = 0.05;
        }

        price *= ratingMultiplier;

        // 나이에 따른 가격 조정
        let ageMultiplier = 1;
        if (player.age <= 19) {
            ageMultiplier = 1.7;
        } else if (player.age <= 26) {
            ageMultiplier = 1.5;
        } else if (player.age >= 35) {
            ageMultiplier = 0.2;
        } else if (player.age >= 32) {
            ageMultiplier = 0.5;
        }

        price *= ageMultiplier;

        // 포지션에 따른 가격 조정
        const positionMultiplier = {
            'GK': 1, 'DF': 1, 'MF': 1, 'FW': 1.2
        };
        price *= positionMultiplier[player.position] || 1;

        // 랜덤 요소
        const randomFactor = 0.9 + Math.random() * 0.2;
        price *= randomFactor;

        // [수정] 나이 많고 오버롤 낮은 경우 1억 미만(0)으로 처리
        if (player.rating < 70 && player.age >= 32) {
            price *= 0.1;
        }

        return Math.round(price);
    }

    // 모든 선수 검색 (이름 검색용)
    searchAllPlayers(searchName) {
        const allPlayers = [];
        const lowerSearchName = searchName.toLowerCase();

        // 1. 이적 시장 선수들
        this.transferMarket.forEach(player => {
            if (player.name.toLowerCase().includes(lowerSearchName)) {
                allPlayers.push({ ...player, inMarket: true });
            }
        });

        // 2. 다른 팀 선수들 (이적 시장에 없는)
        Object.keys(teams).forEach(teamKey => {
            if (teamKey !== gameData.selectedTeam) {
                teams[teamKey].forEach(player => {
                    if (player.name.toLowerCase().includes(lowerSearchName) &&
                        !this.transferMarket.some(p => p.name === player.name && p.originalTeam === teamKey)) {

                        allPlayers.push({
                            ...player,
                            originalTeam: teamKey,
                            price: this.calculatePlayerPrice(player, teamKey),
                            daysOnMarket: 0,
                            inMarket: false
                        });
                    }
                });
            }
        });

        // 3. 외부 리그 선수들 (이적 시장에 없는)
        this.extraPlayers.forEach(player => {
            if (player.name.toLowerCase().includes(lowerSearchName) &&
                !this.transferMarket.some(p => p.name === player.name && p.originalTeam === "외부리그") &&
                !this.isPlayerInUserTeam(player.name)) {

                allPlayers.push({
                    ...player,
                    originalTeam: "외부리그",
                    price: this.calculatePlayerPrice(player, "외부리그"),
                    daysOnMarket: 0,
                    inMarket: false
                });
            }
        });

        return allPlayers;
    }

    // 선수 검색
    searchPlayers(filters) {
        if (filters.name && filters.name.trim()) {
            let filteredPlayers = this.searchAllPlayers(filters.name);

            // 다른 필터 적용
            if (filters.position) {
                filteredPlayers = filteredPlayers.filter(player => player.position === filters.position);
            }
            if (filters.minRating) {
                filteredPlayers = filteredPlayers.filter(player => player.rating >= filters.minRating);
            }
            if (filters.maxAge) {
                filteredPlayers = filteredPlayers.filter(player => player.age <= filters.maxAge);
            }
            return filteredPlayers;
        }

        let filteredPlayers = [...this.transferMarket];

        // 포지션 필터
        if (filters.position) {
            filteredPlayers = filteredPlayers.filter(player =>
                player.position === filters.position
            );
        }

        // 최소 능력치 필터
        if (filters.minRating) {
            filteredPlayers = filteredPlayers.filter(player =>
                player.rating >= filters.minRating
            );
        }

        // 최대 나이 필터
        if (filters.maxAge) {
            filteredPlayers = filteredPlayers.filter(player =>
                player.age <= filters.maxAge
            );
        }

        return filteredPlayers;
    }

    // 이적 성공 확률 계산
    calculateTransferSuccessChance(player, buyerTeamKey = null) {
        if (!buyerTeamKey && typeof gameData !== 'undefined' && gameData.selectedTeam) {
            buyerTeamKey = gameData.selectedTeam;
        }

        let chance = 0.9; // 기본 성공 확률 90%에서 시작

        // 1. 능력치 페널티 (높을수록 거절 확률 증가)
        if (player.rating >= 90) chance -= 0.4;      // -40% (슈퍼스타)
        else if (player.rating >= 85) chance -= 0.25; // -25% (스타)
        else if (player.rating >= 80) chance -= 0.1;  // -10% (주전급)

        // 2. 나이 페널티 (어릴수록 거절 확률 증가 - 미래가 창창하므로)
        if (player.age <= 20) chance -= 0.3;      // -30% (유망주)
        else if (player.age <= 24) chance -= 0.15; // -15% (성장기)

        // 3. 나이 보너스 (노장일수록 이적 쉬움)
        if (player.age >= 33) chance += 0.1;      // +10%

        // 4. 하위 리그로의 이적 거절 로직 (핵심 선수 보호)
        if (buyerTeamKey && player.originalTeam && player.originalTeam !== "외부리그" && typeof allTeams !== 'undefined') {
            const buyerLeague = allTeams[buyerTeamKey] ? allTeams[buyerTeamKey].league : 3;
            const sellerLeague = allTeams[player.originalTeam] ? allTeams[player.originalTeam].league : 3;

            if (buyerLeague > sellerLeague) {
                // 구매팀이 더 하위 리그일 경우 (1이 1부, 2가 2부)
                const isCorePlayer = TeamUtils.isPlayerInBest11(player.originalTeam, player.name);
                if (isCorePlayer && player.age < 35) {
                    return 0; // 하위 리그 이적 절대 불가
                }
                // 핵심 선수가 아니어도 약간의 페널티
                chance -= (buyerLeague - sellerLeague) * 0.15;
            }
        }

        // 최소 5%, 최대 50% 제한
        return Math.max(0.05, Math.min(0.8, chance));
    }

    // 선수 연봉 협상 시작 금액 계산
    calculateNegotiatedWeeklyWage(player) {
        const baseWage = typeof calculatePlayerWage === 'function'
            ? calculatePlayerWage(player)
            : Math.max(0.2, parseFloat((Math.pow(player.rating / 75, 5) * 0.9).toFixed(2)));

        let wageMultiplier = 1.15;

        if (player.rating >= 90) wageMultiplier = 1.45;
        else if (player.rating >= 85) wageMultiplier = 1.32;
        else if (player.rating >= 80) wageMultiplier = 1.24;
        else if (player.rating >= 75) wageMultiplier = 1.16;
        else if (player.rating >= 70) wageMultiplier = 1.1;

        if (player.age <= 21) wageMultiplier += 0.05;
        else if (player.age >= 32) wageMultiplier -= 0.05;

        return Math.max(0.2, parseFloat((baseWage * wageMultiplier).toFixed(2)));
    }

    // 연봉 협상 성공 확률 계산
    calculateWageNegotiationChance(player, offeredWeeklyWage) {
        const baseWage = typeof calculatePlayerWage === 'function'
            ? calculatePlayerWage(player)
            : Math.max(0.2, parseFloat((Math.pow(player.rating / 75, 5) * 0.9).toFixed(2)));

        const wagePressure = offeredWeeklyWage / baseWage;

        // 너무 낮은 주급 제안 (기준 주급의 60% 미만)은 노예계약으로 간주하여 호감도 무관하게 무조건 거절 (확률 0)
        if (wagePressure < 0.6) {
            return 0;
        }

        let chance = 0.92;

        // 제안 주급에 따른 확률 보정 (기존 버그 수정: 적게 주면 확률 하락, 많이 주면 상승)
        if (wagePressure < 0.7) chance -= 0.6;
        else if (wagePressure < 0.85) chance -= 0.3;
        else if (wagePressure < 0.95) chance -= 0.1;
        else if (wagePressure >= 1.2) chance += 0.1; // 기준보다 많이 주면 확률 상승
        else if (wagePressure >= 1.1) chance += 0.05;

        // 선수 스탯에 따른 확률 보정
        if (player.rating >= 90) chance -= 0.1;
        else if (player.rating >= 85) chance -= 0.06;

        if (player.age <= 21) chance -= 0.05;
        else if (player.age >= 33) chance += 0.05;

        // 호감도(언플, 친목질) 반영
        if (typeof gameData !== 'undefined' && gameData.transferOffers) {
            const playerKey = `${player.name}_${player.originalTeam}`;
            const offerData = window.GameState ? window.GameState.getTransferOffer(playerKey) : gameData.transferOffers[playerKey];
            if (offerData && offerData.favorability) {
                chance += offerData.favorability;
            }
        }

        return Math.max(0, Math.min(0.8, chance));
    }

    getInitialTeamBudget(teamKey) {
        if (typeof allTeams !== 'undefined' && allTeams[teamKey] && typeof allTeams[teamKey].budget === 'number') {
            return allTeams[teamKey].budget;
        }

        const league = (typeof allTeams !== 'undefined' && allTeams[teamKey]) ? allTeams[teamKey].league : 3;
        if (league === 1) return 1000;
        if (league === 2) return 350;
        return 50;
    }

    estimateWeeklyWage(player) {
        if (typeof player.weeklyWage === 'number') {
            return player.weeklyWage;
        }

        if (typeof calculatePlayerWage === 'function') {
            return calculatePlayerWage(player);
        }

        const base = Math.pow(player.rating / 72, 6.2) * 1.0;
        let ageModifier = 1.0;
        if (player.age <= 20) ageModifier = 1.32;
        else if (player.age <= 24) ageModifier = 1.14;
        else if (player.age >= 35) ageModifier = 0.62;
        else if (player.age >= 32) ageModifier = 0.78;
        else if (player.age >= 29) ageModifier = 0.92;

        return Math.max(0.25, parseFloat((base * ageModifier).toFixed(2)));
    }

    calculateTeamWeeklyWage(teamKey) {
        const teamPlayers = teams[teamKey] || [];
        return parseFloat(teamPlayers.reduce((sum, player) => sum + this.estimateWeeklyWage(player), 0).toFixed(1));
    }

    initializeTeamBudgets() {
        if (typeof allTeams === 'undefined') return;

        Object.keys(allTeams).forEach(teamKey => {
            if (teamKey === gameData.selectedTeam) return;

            if (typeof this.aiTeamBudgets[teamKey] !== 'number') {
                const startingBudget = this.getInitialTeamBudget(teamKey);
                this.aiTeamBudgets[teamKey] = startingBudget;

                if (typeof allTeams[teamKey].budget !== 'number') {
                    allTeams[teamKey].budget = startingBudget;
                }
            }

            if (typeof this.aiTeamWageBudgets[teamKey] !== 'number') {
                this.aiTeamWageBudgets[teamKey] = this.calculateTeamWeeklyWage(teamKey);
            }
        });

        if (gameData.selectedTeam) {
            gameData.wageBudget = this.calculateTeamWeeklyWage(gameData.selectedTeam);
        }
    }

    getTeamBudget(teamKey) {
        if (teamKey === gameData.selectedTeam) {
            return window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        }

        if (typeof this.aiTeamBudgets[teamKey] !== 'number') {
            this.aiTeamBudgets[teamKey] = this.getInitialTeamBudget(teamKey);
        }

        return this.aiTeamBudgets[teamKey];
    }

    setTeamBudget(teamKey, amount) {
        const safeAmount = Math.max(0, amount);

        if (teamKey === gameData.selectedTeam) {
            gameData.teamMoney = safeAmount;
            return safeAmount;
        }

        this.aiTeamBudgets[teamKey] = safeAmount;
        return safeAmount;
    }

    addTeamBudget(teamKey, amount) {
        return this.setTeamBudget(teamKey, this.getTeamBudget(teamKey) + amount);
    }

    spendTeamBudget(teamKey, amount) {
        return this.setTeamBudget(teamKey, this.getTeamBudget(teamKey) - amount);
    }

    getTeamWageBudget(teamKey) {
        if (teamKey === gameData.selectedTeam) {
            if (typeof gameData.wageBudget !== 'number') {
                gameData.wageBudget = this.calculateTeamWeeklyWage(teamKey);
            }
            return gameData.wageBudget;
        }

        if (typeof this.aiTeamWageBudgets[teamKey] !== 'number') {
            this.aiTeamWageBudgets[teamKey] = this.calculateTeamWeeklyWage(teamKey);
        }

        return this.aiTeamWageBudgets[teamKey];
    }

    setTeamWageBudget(teamKey, amount) {
        const safeAmount = Math.max(0, parseFloat(Number(amount).toFixed(2)));

        if (teamKey === gameData.selectedTeam) {
            gameData.wageBudget = safeAmount;
            return safeAmount;
        }

        this.aiTeamWageBudgets[teamKey] = safeAmount;
        return safeAmount;
    }

    addTeamWageBudget(teamKey, amount) {
        return this.setTeamWageBudget(teamKey, this.getTeamWageBudget(teamKey) + amount);
    }

    spendTeamWageBudget(teamKey, amount) {
        return this.setTeamWageBudget(teamKey, this.getTeamWageBudget(teamKey) - amount);
    }

    convertTransferToWageBudget(amount) {
        const value = Math.round(Number(amount));
        if (!Number.isFinite(value) || value <= 0) {
            return { success: false, message: '유효한 금액이 아닙니다.' };
        }

        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < value) {
            return { success: false, message: '이적 자금이 부족합니다.' };
        }

        const converted = parseFloat((value / 12).toFixed(2));
        if (window.GameState) window.GameState.spendTeamMoney(value);
        else gameData.teamMoney -= value;
        this.addTeamWageBudget(gameData.selectedTeam, converted);
        return { success: true, message: `${value}억 이적 자금을 주급 자금 ${converted}억으로 전환했습니다.` };
    }

    convertWageToTransferBudget(amount) {
        const value = Math.round(Number(amount));
        if (!Number.isFinite(value) || value <= 0) {
            return { success: false, message: '유효한 금액이 아닙니다.' };
        }

        const wageBudget = this.getTeamWageBudget(gameData.selectedTeam);
        if (wageBudget < value) {
            return { success: false, message: '주급 자금이 부족합니다.' };
        }

        const converted = value * 12;
        this.spendTeamWageBudget(gameData.selectedTeam, value);
        if (window.GameState) window.GameState.addTeamMoney(converted);
        else gameData.teamMoney += converted;
        return { success: true, message: `${value}억 주급 자금을 이적 자금 ${converted}억으로 전환했습니다.` };
    }

    promptPurchaseNegotiation(playerName, originalTeam, price, position, rating, age) {
        this.chatState = {
            player: this.transferMarket.find(p => p.name === playerName && p.originalTeam === originalTeam)
                || { name: playerName, originalTeam, price, position, rating, age },
            step: 'FEE',
            fee: 0,
            wage: 0
        };

        const player = this.chatState.player;

        // 팀 인원 제한 및 쿨타임 체크
        const selectedTeamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];
        if (selectedTeamPlayers.length >= 50) {
            alert("팀 인원이 가득 찼습니다! (최대 50명)");
            return;
        }

        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        const playerKey = `${player.name}_${player.originalTeam}`;
        if (transferOffers[playerKey] && transferOffers[playerKey].attempts >= 2) {
            const matchesPassed = gameData.matchesPlayed - transferOffers[playerKey].lastFailedMatch;
            if (matchesPassed < 10) {
                alert(`협상 결렬 후 쿨타임 중입니다.\n${10 - matchesPassed}경기 후에 다시 제안할 수 있습니다.`);
                return;
            } else {
                transferOffers[playerKey].attempts = 0;
            }
        }

        if (this.isPlayerInUserTeam(player.name)) {
            alert("이미 우리 팀에 소속된 선수입니다.");
            return;
        }

        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < (player.price * 0.3)) {
            alert("자금이 너무 부족하여 협상 테이블에 앉을 수 없습니다.");
            return;
        }

        const modal = document.getElementById('negotiationChatModal');
        document.getElementById('chatPlayerName').innerText = player.name;
        document.getElementById('chatTeamName').innerText = (teamNames[player.originalTeam] || player.originalTeam) + ` (요구 이적료: ${player.price}억)`;
        document.getElementById('chatMessages').innerHTML = '';

        modal.style.display = 'block';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';

        this.addChatMessage('system', `--- ${player.name} 영입 협상을 시작합니다 ---`);

        setTimeout(() => {
            this.addChatMessage('ai', `안녕하세요. ${player.name} 영입에 관심이 있으시군요. 저희가 생각하는 기본 이적료는 ${player.price}억 입니다. 얼마를 제안하시겠습니까?`);
            this.setupChatInput('FEE');
        }, 800);
    }

    closeNegotiationChat() {
        const modal = document.getElementById('negotiationChatModal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            modal.style.pointerEvents = 'none';
        }
        this.chatState = null;
    }

    addChatMessage(sender, text) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.innerText = text;
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    setupChatInput(step) {
        const input = document.getElementById('chatFeeInput');
        const btn = document.getElementById('chatSendBtn');
        const quickReplies = document.getElementById('chatQuickReplies');

        input.value = '';
        quickReplies.innerHTML = '';

        if (step === 'FEE') {
            input.style.display = 'block';
            input.placeholder = "제안할 이적료를 입력하세요 (단위: 억)";
            btn.style.display = 'block';

            const p = this.chatState.player.price;
            const amounts = [p, Math.round(p * 0.9), Math.round(p * 0.8)];
            amounts.forEach(amt => {
                const qBtn = document.createElement('button');
                qBtn.className = 'btn';
                qBtn.innerText = `${amt}억 제안`;
                qBtn.onclick = () => { input.value = amt; this.sendNegotiationChat(); };
                quickReplies.appendChild(qBtn);
            });

            // --- 언론 유출 및 선수 설득 버튼 ---
            const targetPlayer = this.chatState.player;
            const myTeamPlayers = teams[gameData.selectedTeam];
            let persuader = null;

            if (myTeamPlayers && targetPlayer.country) {
                const sameCountryPlayers = myTeamPlayers.filter(p => p.country === targetPlayer.country && p.name !== targetPlayer.name);
                if (sameCountryPlayers.length > 0) {
                    persuader = sameCountryPlayers.sort((a, b) => b.rating - a.rating)[0];
                }
            }

            const swayContainer = document.createElement('div');
            swayContainer.style.display = 'flex';
            swayContainer.style.gap = '5px';
            swayContainer.style.marginTop = '10px';
            swayContainer.style.width = '100%';

            const qBtnMedia = document.createElement('button');
            qBtnMedia.className = 'btn';
            qBtnMedia.style.flex = '1';
            qBtnMedia.style.background = '#3498db';
            qBtnMedia.style.fontSize = '0.8rem';
            qBtnMedia.innerText = '언론에 유출하기';
            qBtnMedia.onclick = () => {
                this.doMediaPlay(targetPlayer.name, targetPlayer.originalTeam, true);
                qBtnMedia.disabled = true;
                qBtnMedia.style.opacity = '0.5';
            };

            const qBtnSocial = document.createElement('button');
            qBtnSocial.className = 'btn';
            qBtnSocial.style.flex = '1';
            qBtnSocial.style.fontSize = '0.8rem';

            if (persuader) {
                qBtnSocial.style.background = '#2ecc71';
                qBtnSocial.innerText = `${persuader.name}을(를) 통해 설득하기`;
                qBtnSocial.onclick = () => {
                    this.doSocialize(targetPlayer.name, targetPlayer.originalTeam, true, persuader.name);
                    qBtnSocial.disabled = true;
                    qBtnSocial.style.opacity = '0.5';
                };
            } else {
                qBtnSocial.style.background = '#7f8c8d';
                qBtnSocial.innerText = '설득 불가능';
                qBtnSocial.disabled = true;
            }

            swayContainer.appendChild(qBtnMedia);
            swayContainer.appendChild(qBtnSocial);
            quickReplies.appendChild(swayContainer);
        } else if (step === 'WAGE') {
            input.style.display = 'block';
            input.placeholder = "제안할 주급을 입력하세요 (단위: 억)";
            btn.style.display = 'block';

            const suggestedWage = this.calculateNegotiatedWeeklyWage(this.chatState.player);

            const qBtn1 = document.createElement('button');
            qBtn1.className = 'btn';
            qBtn1.innerText = `${suggestedWage}억 수락`;
            qBtn1.onclick = () => { input.value = suggestedWage; this.sendNegotiationChat(); };
            quickReplies.appendChild(qBtn1);
        } else {
            input.style.display = 'none';
            btn.style.display = 'none';
        }
    }

    sendNegotiationChat() {
        const input = document.getElementById('chatFeeInput');
        const val = parseFloat(input.value);

        if (isNaN(val) || val <= 0) {
            alert("올바른 금액을 입력하세요.");
            return;
        }

        const state = this.chatState;
        const player = state.player;

        if (state.step === 'FEE') {
            const fee = Math.round(val);
            const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;

            if (currentMoney < fee) {
                this.addChatMessage('system', `자금이 부족합니다. (보유 자금: ${currentMoney}억)`);
                return;
            }

            this.addChatMessage('user', `이적료 ${fee}억을 제안합니다.`);
            this.setupChatInput('WAITING');

            setTimeout(() => {
                let accepted = false;
                if (fee >= player.price) {
                    accepted = true;
                } else {
                    const sellerTeamKey = player.originalTeam;
                    const chance = this.calculateFeeNegotiationChance(sellerTeamKey, fee, player.price);

                    accepted = Math.random() <= chance;
                }

                if (accepted) {
                    state.fee = fee;
                    state.step = 'WAGE';
                    this.addChatMessage('ai', `좋습니다. ${fee}억이면 합의할 수 있겠군요. 이제 선수 측과 주급 협상을 진행하시죠.`);

                    setTimeout(() => {
                        this.addChatMessage('system', `--- 선수 대리인과 연결되었습니다 ---`);
                        const suggestedWage = this.calculateNegotiatedWeeklyWage(player);
                        setTimeout(() => {
                            this.addChatMessage('ai', `안녕하세요. 우리 선수의 가치에 걸맞은 대우를 원합니다. 기본적으로 주급 ${suggestedWage}억을 원합니다.`);
                            this.setupChatInput('WAGE');
                        }, 800);
                    }, 1000);
                } else {
                    this.recordFailure(player);
                    this.addChatMessage('ai', `그 금액으로는 선수를 넘길 수 없습니다. 협상 결렬입니다.`);
                    setTimeout(() => this.closeNegotiationChat(), 2000);
                }
            }, 1000);
        } else if (state.step === 'WAGE') {
            const wage = parseFloat(val.toFixed(2));
            const availableWageBudget = this.getTeamWageBudget(gameData.selectedTeam);

            if (availableWageBudget < wage) {
                this.addChatMessage('system', `주급 자금이 부족합니다. (보유 자금: ${availableWageBudget}억)`);
                return;
            }

            this.addChatMessage('user', `주급 ${wage}억을 제안합니다.`);
            this.setupChatInput('WAITING');

            setTimeout(() => {
                const chance = this.calculateWageNegotiationChance(player, wage);
                const transferChance = this.calculateTransferSuccessChance(player);
                const finalChance = Math.min(0.8, chance * transferChance);

                if (Math.random() <= finalChance) {
                    state.wage = wage;
                    this.addChatMessage('ai', `조건이 마음에 드는군요! 계약에 동의합니다.`);
                    setTimeout(() => {
                        this.addChatMessage('system', `--- 협상 타결! 선수가 팀에 합류합니다 ---`);
                        this.finalizeChatTransfer(player, state.fee, state.wage);
                        setTimeout(() => this.closeNegotiationChat(), 2000);
                    }, 1000);
                } else {
                    this.recordFailure(player);
                    this.addChatMessage('ai', `이 조건으로는 계약할 수 없습니다. 죄송합니다.`);
                    setTimeout(() => this.closeNegotiationChat(), 2000);
                }
            }, 1500);
        }
    }

    recordFailure(player) {
        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        const playerKey = `${player.name}_${player.originalTeam}`;
        if (!transferOffers[playerKey]) {
            transferOffers[playerKey] = { attempts: 0, lastFailedMatch: -100 };
        }
        transferOffers[playerKey].attempts++;
        if (transferOffers[playerKey].attempts >= 2) {
            transferOffers[playerKey].lastFailedMatch = gameData.matchesPlayed;
        }
    }

    finalizeChatTransfer(player, fee, wage) {
        try {
            if (window.GameState) window.GameState.spendTeamMoney(fee);
            else gameData.teamMoney -= fee;

            this.spendTeamWageBudget(gameData.selectedTeam, wage);

            const selectedTeamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];

            const newPlayer = {
                name: player.name,
                position: player.position,
                rating: player.rating,
                age: player.age,
                weeklyWage: wage
            };
            selectedTeamPlayers.push(newPlayer);

            this.transferMarket = this.transferMarket.filter(p => !(p.name === player.name && p.originalTeam === player.originalTeam));

            const playerKey = `${player.name}_${player.originalTeam}`;
            if (window.GameState) window.GameState.clearTransferOffer(playerKey);
            else delete gameData.transferOffers[playerKey];

            if (player.originalTeam !== "외부리그") {
                const originalTeamPlayers = teams[player.originalTeam];
                const playerIndex = originalTeamPlayers.findIndex(p => p.name === player.name && p.position === player.position);
                if (playerIndex !== -1) originalTeamPlayers.splice(playerIndex, 1);
            }

            if (typeof mailManager !== 'undefined') {
                const content = `${player.name} 선수가 우리 팀에 합류했습니다.\n이적료: ${fee}억\n연봉: ${wage}억/주\n포지션: ${player.position}`;
                mailManager.addMail(`[영입] ${player.name} 영입 완료`, '스카우트 팀장', content);
            }

            if (typeof calculateTotalWages === 'function') calculateTotalWages();
            this.addTransferNews(newPlayer, player.originalTeam, gameData.selectedTeam, fee);

            if (window.AutoSaveSystem) setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);

            if (window.GameState) window.GameState.clampTeamMoney();
            else gameData.teamMoney = Math.max(0, gameData.teamMoney);

            updateDisplay();
            displayTransferPlayers();
            if (document.getElementById('squad') && document.getElementById('squad').classList.contains('active')) {
                displayTeamPlayers();
            }
            if (newPlayer.age <= 25 && typeof playerGrowthSystem !== 'undefined') {
                playerGrowthSystem.initializePlayerGrowth();
            }
        } catch (err) {
            console.error("finalizeChatTransfer 오류:", err);
        }
    }

    calculateOfferFeeByBudget(teamKey, marketValue, minMultiplier, maxMultiplier) {
        const budget = this.getTeamBudget(teamKey);
        const baseMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
        const budgetRatio = marketValue > 0 ? budget / marketValue : 1;

        let budgetMultiplier = 1.0;
        if (budget <= 0) budgetMultiplier = 0.72;
        else if (budgetRatio < 0.5) budgetMultiplier = 0.8;
        else if (budgetRatio < 1.0) budgetMultiplier = 0.9;
        else if (budgetRatio < 1.8) budgetMultiplier = 1.0;
        else if (budgetRatio < 3.0) budgetMultiplier = 1.08;
        else budgetMultiplier = 1.15;

        return Math.max(1, Math.round(marketValue * baseMultiplier * budgetMultiplier));
    }

    calculateFeeNegotiationChance(teamKey, targetFee, marketValue) {
        if (!marketValue || marketValue <= 0) return 0.5;

        const feeRatio = targetFee / marketValue;

        // 1. Buying: when user discounts the fee (targetFee <= marketValue)
        if (feeRatio <= 1.0) {
            if (feeRatio >= 1.0) return 1.0;

            // 0~10% discount: 50% ~ 100% chance (8~10% discount gives ~50-60%)
            if (feeRatio >= 0.90) {
                return 0.50 + ((feeRatio - 0.90) / 0.10) * 0.50;
            }

            // 10~20% discount: 10% ~ 50% chance (15% discount gives ~30%)
            if (feeRatio >= 0.80) {
                return 0.10 + ((feeRatio - 0.80) / 0.10) * 0.40;
            }

            // Over 20% discount: steep rejection (1% ~ 10%)
            return Math.max(0.01, 0.10 * (feeRatio / 0.80));
        }

        // 2. Selling: when user counter-offers higher fee (targetFee > marketValue)
        const budget = this.getTeamBudget(teamKey);
        if (targetFee > budget && budget > 0) {
            return 0.05; // Over budget
        }

        let chance = 0.75;
        if (feeRatio > 2.0) {
            chance -= 0.70;
        } else if (feeRatio > 1.5) {
            chance -= 0.50;
        } else if (feeRatio > 1.2) {
            chance -= 0.30;
        } else if (feeRatio > 1.0) {
            chance -= 0.15;
        }

        return Math.max(0.05, Math.min(0.95, chance));
    }





    finalizeUserTransfer(player, targetTeamKey, fee, mailId, resultMessage) {
        const teamPlayers = teams[gameData.selectedTeam];
        const playerIndex = teamPlayers.findIndex(p => p.name === player.name);

        if (playerIndex === -1) {
            return { success: false, message: "해당 선수가 팀에 없습니다." };
        }

        if (mailId && typeof mailManager !== 'undefined') {
            const mail = mailManager.mails.find(m => m.id === mailId);
            if (mail) {
                mail.isProcessed = true;
                mail.data.resultMessage = resultMessage;
            }
        }

        const soldPlayer = teamPlayers[playerIndex];
        teamPlayers.splice(playerIndex, 1);
        if (typeof removePlayerFromSquad === 'function') removePlayerFromSquad(soldPlayer);

        const restoredWage = this.estimateWeeklyWage(soldPlayer);
        this.addTeamWageBudget(gameData.selectedTeam, restoredWage);

        if (window.GameState) window.GameState.addTeamMoney(fee);
        else gameData.teamMoney += fee;

        this.spendTeamBudget(targetTeamKey, fee);

        if (teams[targetTeamKey]) teams[targetTeamKey].push({ ...soldPlayer });

        if (window.GameState) window.GameState.removeUserTransferListByPlayer(player.name);
        else gameData.userTransferList = gameData.userTransferList.filter(entry => entry.player.name !== player.name);

        this.addTransferNews(soldPlayer, gameData.selectedTeam, targetTeamKey, fee);

        return {
            success: true,
            player: soldPlayer,
            message: `${soldPlayer.name} 선수가 ${teamNames[targetTeamKey] || targetTeamKey}로 이적했습니다!\n이적료 ${fee}억원을 받았습니다.`
        };
    }

    // 선수 영입
    signPlayer(player, transferFee = player.price) {
        // 오퍼 기록 데이터 초기화
        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});

        const playerKey = `${player.name}_${player.originalTeam}`;

        // 해당 선수에 대한 오퍼 기록이 없으면 생성
        if (!transferOffers[playerKey]) {
            const initialOffer = { attempts: 0, lastFailedMatch: -100 };
            if (window.GameState) window.GameState.setTransferOffer(playerKey, initialOffer);
            else transferOffers[playerKey] = initialOffer;
        }

        const offerData = window.GameState ? window.GameState.getTransferOffer(playerKey) : transferOffers[playerKey];

        // 쿨타임 체크 (2번 실패 시 10경기 제한)
        if (offerData.attempts >= 2) {
            const matchesPassed = gameData.matchesPlayed - offerData.lastFailedMatch;
            if (matchesPassed < 10) {
                return {
                    success: false,
                    message: `협상 결렬 후 쿨타임 중입니다.\n${10 - matchesPassed}경기 후에 다시 제안할 수 있습니다.`
                };
            } else {
                // 10경기가 지났으면 횟수 초기화
                offerData.attempts = 0;
            }
        }

        // [추가] 이미 보유한 선수인지 최종 확인
        if (this.isPlayerInUserTeam(player.name)) {
            return { success: false, message: "이미 우리 팀에 소속된 선수입니다." };
        }

        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < transferFee) {
            return { success: false, message: "자금이 부족합니다!" };
        }

        // 팀 인원 제한 확인 (50명 제한)
        const selectedTeamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];
        if (selectedTeamPlayers.length >= 50) {
            return { success: false, message: "팀 인원이 가득 찼습니다! (최대 50명)" };
        }

        // 이적료 협상 단계 (낮춘 금액을 제시한 경우)
        if (transferFee < player.price) {
            const sellerTeamKey = player.originalTeam;
            const negotiationChance = this.calculateFeeNegotiationChance(sellerTeamKey, transferFee, player.price);

            if (Math.random() > negotiationChance) {
                return {
                    success: false,
                    message: `이적료 ${transferFee}억 제안이 거절되었습니다.\n(성공 확률: ${Math.round(negotiationChance * 100)}%)`
                };
            }
        }

        // 이적료 선지급
        if (window.GameState) window.GameState.spendTeamMoney(transferFee);
        else gameData.teamMoney -= transferFee;

        // 연봉 협상 단계
        const negotiatedWeeklyWage = this.calculateNegotiatedWeeklyWage(player);
        const wageSuccessChance = this.calculateWageNegotiationChance(player, negotiatedWeeklyWage);
        const wageRoll = Math.random();

        const availableWageBudget = this.getTeamWageBudget(gameData.selectedTeam);
        if (availableWageBudget < negotiatedWeeklyWage) {
            if (window.GameState) window.GameState.addTeamMoney(transferFee);
            else gameData.teamMoney += transferFee;
            return {
                success: false,
                message: `주급 자금이 부족합니다.\n필요 주급 자금: ${negotiatedWeeklyWage}억 / 보유 주급 자금: ${availableWageBudget}억`
            };
        }

        if (wageRoll > wageSuccessChance) {
            // 협상 실패 시 이적료 환불
            if (window.GameState) window.GameState.addTeamMoney(transferFee);
            else gameData.teamMoney += transferFee;

            offerData.attempts++;
            if (offerData.attempts >= 2) {
                offerData.lastFailedMatch = gameData.matchesPlayed;
                return {
                    success: false,
                    message: `이적료 ${transferFee}억을 선지급했지만, 연봉 ${negotiatedWeeklyWage}억 협상이 결렬되어 계약이 무산되었습니다.\n(협상 성공 확률: ${Math.round(wageSuccessChance * 100)}%)\n\n⚠️ 2회 연속 실패로 10경기 동안 제안이 불가능합니다.`
                };
            }

            return {
                success: false,
                message: `이적료 ${transferFee}억을 선지급했지만, 연봉 ${negotiatedWeeklyWage}억 협상에 실패했습니다. 계약은 무산되었고 이적료는 환불되었습니다.\n(협상 성공 확률: ${Math.round(wageSuccessChance * 100)}%)\n\n남은 기회: ${2 - offerData.attempts}회`
            };
        }

        // 확률 체크
        const successChance = this.calculateTransferSuccessChance(player);
        const roll = Math.random();
        const successPercent = Math.round(successChance * 100);

        if (roll > successChance) {
            // 실패 처리
            if (window.GameState) window.GameState.addTeamMoney(transferFee);
            else gameData.teamMoney += transferFee;

            offerData.attempts++;
            if (offerData.attempts >= 2) {
                offerData.lastFailedMatch = gameData.matchesPlayed;
                return { success: false, message: `협상 결렬! 선수가 이적 제안을 거절했습니다.\n(성공 확률: ${successPercent}%)\n\n⚠️ 2회 연속 실패로 10경기 동안 제안이 불가능합니다.` };
            }
            return { success: false, message: `협상 실패! 선수가 이적 제안을 거절했습니다.\n(성공 확률: ${successPercent}%)\n\n남은 기회: ${2 - offerData.attempts}회` };
        }

        // 주급 자금 차감
        this.spendTeamWageBudget(gameData.selectedTeam, negotiatedWeeklyWage);

        // 선수를 팀에 추가
        const newPlayer = {
            name: player.name,
            position: player.position,
            rating: player.rating,
            age: player.age,
            weeklyWage: negotiatedWeeklyWage
        };

        selectedTeamPlayers.push(newPlayer);

        // 이적 시장에서 제거
        this.transferMarket = this.transferMarket.filter(p => !(p.name === player.name && p.originalTeam === player.originalTeam));

        // 성공 시 오퍼 기록 삭제 (나중에 다시 영입할 수도 있으므로)
        if (window.GameState) window.GameState.clearTransferOffer(playerKey);
        else delete gameData.transferOffers[playerKey];

        // AI 팀에서 선수 제거 (외부리그가 아닌 경우)
        if (player.originalTeam !== "외부리그") {
            const originalTeamPlayers = teams[player.originalTeam];
            const playerIndex = originalTeamPlayers.findIndex(p =>
                p.name === player.name && p.position === player.position
            );
            if (playerIndex !== -1) {
                originalTeamPlayers.splice(playerIndex, 1);
            }
        }

        // 영입 메일 발송
        if (typeof mailManager !== 'undefined') {
            const content = `${player.name} 선수가 우리 팀에 합류했습니다.\n이적료: ${transferFee}억\n연봉: ${negotiatedWeeklyWage}억/주\n포지션: ${player.position}\n\n이적료를 먼저 지불한 뒤 연봉 협상까지 마무리했습니다.`;
            mailManager.addMail(`[영입] ${player.name} 영입 완료`, '스카우트 팀장', content);
        }

        // [신규] 영입 후 주급 재계산
        if (typeof calculateTotalWages === 'function') calculateTotalWages();

        // [추가] 이적 뉴스 기록
        this.addTransferNews(newPlayer, player.originalTeam, gameData.selectedTeam, transferFee);

        // [추가] 영입 후 자동 저장
        if (window.AutoSaveSystem) {
            setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
        }

        return {
            success: true,
            message: `${player.name}을(를) 이적료 ${transferFee}억 선지급 후 연봉 ${negotiatedWeeklyWage}억/주로 영입했습니다!`,
            player: newPlayer
        };
    }

    // 선수 방출
    releasePlayer(player, transferFee = 0) {
        const teamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];
        const playerIndex = teamPlayers.findIndex(p =>
            p.name === player.name && p.position === player.position
        );

        if (playerIndex === -1) {
            return { success: false, message: "해당 선수를 찾을 수 없습니다." };
        }

        // 스쿼드에서도 제거
        this.removePlayerFromSquad(player);

        // 팀에서 제거
        teamPlayers.splice(playerIndex, 1);
        const restoredWage = this.estimateWeeklyWage(player);
        this.addTeamWageBudget(gameData.selectedTeam, restoredWage);

        // 이적료 받기
        if (window.GameState) window.GameState.addTeamMoney(transferFee);
        else gameData.teamMoney += transferFee;

        // 무작위 팀으로 이적시키기
        const availableTeams = Object.keys(teams).filter(team => team !== gameData.selectedTeam);
        if (availableTeams.length > 0) {
            const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];

            // 선수를 무작위 팀에 추가
            teams[randomTeam].push({
                name: player.name,
                position: player.position,
                rating: player.rating,
                age: player.age
            });
            this.spendTeamBudget(randomTeam, transferFee);
            this.spendTeamWageBudget(randomTeam, restoredWage);

            // 방출 메일 발송
            if (typeof mailManager !== 'undefined') {
                const content = `${player.name} 선수가 ${teamNames[randomTeam]}로 이적했습니다.\n이적료 수입: ${transferFee}억`;
                mailManager.addMail(`[이적] ${player.name} 이적 완료`, '단장', content);
            }

            // [신규] 방출 후 주급 재계산
            if (typeof calculateTotalWages === 'function') calculateTotalWages();

            // [추가] 이적 뉴스 기록
            this.addTransferNews(player, gameData.selectedTeam, randomTeam, transferFee);

            // [추가] 방출 후 자동 저장
            if (window.AutoSaveSystem) {
                setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
            }

            return {
                success: true,
                message: `${player.name}을(를) 방출했습니다. ${teamNames[randomTeam]}로 이적했습니다.${transferFee > 0 ? ` (이적료: ${transferFee}억)` : ''}`
            };
        } else {
            // 다른 팀이 없을 경우 이적 시장에 추가
            this.transferMarket.push({
                ...player,
                originalTeam: "외부리그",
                price: Math.round(this.calculatePlayerPrice(player, gameData.selectedTeam) * 0.7), // 70% 가격으로
                daysOnMarket: 0
            });

            // 방출 메일 발송
            if (typeof mailManager !== 'undefined') {
                const content = `${player.name} 선수가 팀을 떠나 해외 리그로 이적했습니다.\n이적료 수입: ${transferFee}억`;
                mailManager.addMail(`[이적] ${player.name} 이적 완료`, '단장', content);
            }

            // [추가] 이적 뉴스 기록
            this.addTransferNews(player, gameData.selectedTeam, "외부리그", transferFee);

            // [추가] 방출 후 자동 저장
            if (window.AutoSaveSystem) {
                setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
            }

            return {
                success: true,
                message: `${player.name}을(를) 방출했습니다. 외부리그로 이적했습니다.${transferFee > 0 ? ` (이적료: ${transferFee}억)` : ''}`
            };
        }
    }

    // 스쿼드에서 선수 제거
    removePlayerFromSquad(player) {
        if (window.GameState) {
            window.GameState.removePlayerFromUserSquad(player.name);
        } else {
            if (gameData.squad.gk && gameData.squad.gk.name === player.name) {
                gameData.squad.gk = null;
            }

            gameData.squad.df = gameData.squad.df.map(p =>
                p && p.name === player.name ? null : p
            );

            gameData.squad.mf = gameData.squad.mf.map(p =>
                p && p.name === player.name ? null : p
            );

            gameData.squad.fw = gameData.squad.fw.map(p =>
                p && p.name === player.name ? null : p
            );
        }

        // [추가] 스쿼드에서 제거되었으므로 DNA 포인트 재계산
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
    }

    // AI 팀 간 이적 시뮬레이션
    simulateAITransfers() {
        this.aiTransferCooldown--;

        if (this.aiTransferCooldown <= 0 && Math.random() < 0.3) { // 30% 확률로 AI 이적 발생
            this.processAITransfer();
            this.aiTransferCooldown = 5; // 5경기 후 다시 시도
        }
    }


    // AI 팀 이적 처리
    processAITransfer() {
        const availableTeams = Object.keys(teams).filter(team => team !== gameData.selectedTeam);
        if (availableTeams.length < 2) return;

        // 1. 구매 팀 결정 (1부 리그 팀이 더 활발하게 이적 시장 참여)
        let buyingTeam;
        if (Math.random() < 0.5) {
            const league1Teams = availableTeams.filter(t => allTeams[t] && allTeams[t].league === 1);
            if (league1Teams.length > 0) {
                buyingTeam = league1Teams[Math.floor(Math.random() * league1Teams.length)];
            } else {
                buyingTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
            }
        } else {
            buyingTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        }

        const buyingLeague = allTeams[buyingTeam] ? allTeams[buyingTeam].league : 3;
        const buyingTeamPlayers = teams[buyingTeam];

        // 2. 구매 팀의 포지션별 분석 및 타겟 포지션 설정
        const positionCounts = { 'GK': 0, 'DF': 0, 'MF': 0, 'FW': 0 };
        const positionRatings = { 'GK': [], 'DF': [], 'MF': [], 'FW': [] };

        buyingTeamPlayers.forEach(p => {
            positionCounts[p.position]++;
            positionRatings[p.position].push(p.rating);
        });

        // 필요한 최소 인원 기준 (GK: 2, DF: 6, MF: 6, FW: 4)
        let targetPosition = null;
        let isEmergency = false;

        if (positionCounts['GK'] < 2) { targetPosition = 'GK'; isEmergency = true; }
        else if (positionCounts['DF'] < 6) { targetPosition = 'DF'; isEmergency = true; }
        else if (positionCounts['MF'] < 6) { targetPosition = 'MF'; isEmergency = true; }
        else if (positionCounts['FW'] < 4) { targetPosition = 'FW'; isEmergency = true; }

        // 최소 인원이 다 있다면, 가장 약한 포지션을 타겟으로 설정
        if (!targetPosition) {
            let lowestAvg = 999;
            for (let pos of ['GK', 'DF', 'MF', 'FW']) {
                // GK는 2명 이상이고, 그 중 베스트 GK가 충분히 좋으면 영입 제외
                if (pos === 'GK' && positionCounts['GK'] >= 2) {
                    const topGKRating = Math.max(...positionRatings['GK']);
                    const gkTargetScore = buyingLeague === 1 ? 80 : (buyingLeague === 2 ? 75 : 70);
                    if (topGKRating >= gkTargetScore) continue; // 이미 좋은 키퍼가 있음
                }

                const avg = positionRatings[pos].length > 0 ? (positionRatings[pos].reduce((a, b) => a + b, 0) / positionCounts[pos]) : 0;
                if (avg < lowestAvg) {
                    lowestAvg = avg;
                    targetPosition = pos;
                }
            }
        }

        // 모든 포지션이 훌륭하거나 데이터가 없으면 랜덤으로 타겟 설정
        if (!targetPosition) {
            const positions = ['GK', 'DF', 'MF', 'FW'];
            targetPosition = positions[Math.floor(Math.random() * positions.length)];
        }

        // 3. 판매 팀 선정
        const sellingTeams = availableTeams.filter(team => team !== buyingTeam);
        const sellingTeam = sellingTeams[Math.floor(Math.random() * sellingTeams.length)];
        const sellingTeamPlayers = teams[sellingTeam];

        // 최소 인원 15명 유지 방어
        if (sellingTeamPlayers.length <= 15) return;

        const sellingLeague = allTeams[sellingTeam] ? allTeams[sellingTeam].league : 3;

        // 4. 판매 대상 필터링
        // 타겟 리그 수준에 맞는 타겟 능력치 산정
        let targetRatingMin = 50;
        let targetRatingMax = 99;

        if (buyingLeague === 1) {
            targetRatingMin = 75; // 1부 리그는 75 이상 선호
        } else if (buyingLeague === 2) {
            targetRatingMin = 65;
            targetRatingMax = 82; // 2부 리그는 너무 높은 선수는 못 삼
        } else if (buyingLeague === 3) {
            targetRatingMax = 75; // 3부 리그는 75 이하 선호
        }

        let candidates = sellingTeamPlayers.filter(p => {
            // 포지션 일치 여부
            if (p.position !== targetPosition) return false;

            // 능력치 타겟 범위 확인 (긴급 상황이면 하한선 무시)
            if (!isEmergency && (p.rating < targetRatingMin || p.rating > targetRatingMax)) return false;

            // 상위 리그로 갈 때의 현실성 (3부->1부 직행은 매우 젊고 유망한 경우만)
            if (sellingLeague > buyingLeague && buyingLeague === 1 && p.rating < 78 && p.age > 24) return false;

            // 상위 리그에서 하위 리그로 이적 시 제한 (전성기/핵심 선수 하위리그 이동 금지)
            if (sellingLeague < buyingLeague) {
                const isCore = TeamUtils.isPlayerInBest11(p.originalTeam, p.name);
                if (isCore && p.age < 35) return false; // 핵심 선수는 나이가 아주 많지 않으면 안 감
                if (!isCore && p.age <= 29 && p.rating >= 75) return false; // 일반 주전급도 전성기면 하위 리그 기피
            }

            return true;
        });

        // 5. 판매 팀의 방어 로직 (핵심 선수 및 필수 인원 보호)
        if (candidates.length > 0) {
            // 해당 포지션의 남은 인원이 위험 수준이면 안 팜
            const sellingPosCount = sellingTeamPlayers.filter(p => p.position === targetPosition).length;
            if (targetPosition === 'GK' && sellingPosCount <= 2) candidates = [];
            else if (targetPosition === 'DF' && sellingPosCount <= 5) candidates = [];
            else if (targetPosition === 'MF' && sellingPosCount <= 5) candidates = [];
            else if (targetPosition === 'FW' && sellingPosCount <= 3) candidates = [];
        }

        // 핵심 선수 보호 (팀 내 능력치 상위 3명은 90% 확률로 이적 거부)
        if (candidates.length > 0) {
            const sortedSquad = [...sellingTeamPlayers].sort((a, b) => b.rating - a.rating);
            const corePlayers = sortedSquad.slice(0, 3).map(p => p.name);

            candidates = candidates.filter(p => {
                if (corePlayers.includes(p.name)) {
                    return Math.random() < 0.1; // 10% 확률로만 허용
                }
                return true;
            });
        }

        let transferCandidate = null;
        if (candidates.length > 0) {
            // 후보들 중 능력치가 가장 높은 쪽에 가중치를 두어 선택 (가장 낮은 선수를 고르던 버그 픽스)
            candidates.sort((a, b) => b.rating - a.rating);
            // 상위 3명 중 하나를 랜덤하게 픽 (무조건 1등만 데려가지 않게 약간의 랜덤성)
            const pickIndex = Math.floor(Math.random() * Math.min(3, candidates.length));
            transferCandidate = candidates[pickIndex];
        }

        if (transferCandidate && Math.random() < 0.7) { // 성공 확률 약간 상향
            // 이적 실행
            const playerIndex = sellingTeamPlayers.findIndex(p => p === transferCandidate);
            sellingTeamPlayers.splice(playerIndex, 1);

            teams[buyingTeam].push(transferCandidate);
            const estimatedFee = this.calculatePlayerPrice(transferCandidate, sellingTeam);
            this.spendTeamBudget(buyingTeam, estimatedFee);
            this.addTeamBudget(sellingTeam, estimatedFee);
            this.spendTeamWageBudget(buyingTeam, this.estimateWeeklyWage(transferCandidate));
            this.addTeamWageBudget(sellingTeam, this.estimateWeeklyWage(transferCandidate));

            console.log(`AI 이적: ${transferCandidate.name}(${transferCandidate.position}, ${transferCandidate.rating})이(가) ${teamNames[sellingTeam]}에서 ${teamNames[buyingTeam]}로 이적했습니다.`);

            // 이적 뉴스 기록
            this.addTransferNews(transferCandidate, sellingTeam, buyingTeam, estimatedFee);
        }
    }

    // [수정] 유저 선수를 위한 제안 생성 후 메일로 발송
    processUserTransferOffers(player) {
        const marketValue = this.calculatePlayerPrice(player, gameData.selectedTeam);
        const offers = [];
        const allOtherTeams = Object.keys(allTeams).filter(t => t !== gameData.selectedTeam);

        // 1. 빅클럽 제안
        const richTeams = allOtherTeams.filter(t => this.getTeamBudget(t) >= 1000 || allTeams[t].league === 1);
        const bigSpender = richTeams.length > 0 ? richTeams[Math.floor(Math.random() * richTeams.length)] : allOtherTeams[0];
        offers.push({
            teamKey: bigSpender,
            teamName: teamNames[bigSpender] || bigSpender,
            fee: this.calculateOfferFeeByBudget(bigSpender, marketValue, 1.0, 1.1),
            message: "우리는 해당 선수의 가치를 높게 평가하며, 시장가에 준하는 금액을 제시합니다."
        });

        // 2. 같은 리그 라이벌 혹은 중위권
        const sameLeague = allOtherTeams.filter(t => allTeams[t].league === gameData.currentLeague && t !== bigSpender);
        const rational = sameLeague.length > 0 ? sameLeague[Math.floor(Math.random() * sameLeague.length)] : allOtherTeams[1 % allOtherTeams.length];
        offers.push({
            teamKey: rational,
            teamName: teamNames[rational] || rational,
            fee: this.calculateOfferFeeByBudget(rational, marketValue, 0.85, 0.95),
            message: "이적 명단에 올라온 만큼, 합리적인 수준의 할인을 기대하고 있습니다."
        });

        // 3. 포지션 부족 팀
        const needy = allOtherTeams.filter(t => {
            if (t === bigSpender || t === rational) return false;
            const pCount = teams[t].filter(p => p.position === player.position).length;
            return pCount <= 4;
        });
        const needyTeam = needy.length > 0 ? needy[Math.floor(Math.random() * needy.length)] : allOtherTeams[2 % allOtherTeams.length];
        offers.push({
            teamKey: needyTeam,
            teamName: teamNames[needyTeam] || needyTeam,
            fee: this.calculateOfferFeeByBudget(needyTeam, marketValue, 0.75, 0.9),
            message: `현재 팀 사정이 넉넉지 않아 최대로 제안할 수 있는 금액은 여기까지입니다.`
        });

        // 메일 발송
        if (typeof mailManager !== 'undefined') {
            const mailTitle = `[이적 오퍼] ${player.name}에 대한 제안이 도착했습니다`;
            const mailContent = `${player.name} 선수에 대해 3개 구단이 영입 의사를 밝혀왔습니다. 아래 제안 중 하나를 선택해 주세요.`;
            mailManager.addMail(mailTitle, "비서 김지수", mailContent, 'user_transfer_list_offers', {
                playerName: player.name,
                offers: offers
            });
        }
    }

    // [수정] 제안 수락 처리 (메일 연동)
    acceptUserOffer(playerName, targetTeamKey, fee, mailId) {
        const teamPlayers = teams[gameData.selectedTeam];
        const playerIndex = teamPlayers.findIndex(p => p.name === playerName);

        if (playerIndex === -1) {
            alert("해당 선수가 팀에 없습니다.");
            return;
        }
        const player = teamPlayers[playerIndex];
        const result = this.finalizeUserTransfer(
            player,
            targetTeamKey,
            fee,
            mailId,
            `${teamNames[targetTeamKey] || targetTeamKey}로의 이적을 수락했습니다. (${fee}억 수령)`
        );

        if (!result.success) {
            alert(result.message);
            return;
        }

        alert(result.message);

        this.refreshAllUI();
        if (typeof mailManager !== 'undefined') mailManager.renderList();
    }

    negotiateUserOffer(playerName, targetTeamKey, currentFee, mailId) {
        const teamPlayers = teams[gameData.selectedTeam];
        const player = teamPlayers.find(p => p.name === playerName);

        if (!player) {
            alert("해당 선수가 팀에 없습니다.");
            return;
        }

        const marketValue = this.calculatePlayerPrice(player, gameData.selectedTeam);
        const suggestedFee = window.prompt(
            `${player.name}의 이적료를 협상합니다.\n시장가: ${marketValue}억\n현재 제안: ${currentFee}억\n\n원하는 이적료를 입력하세요.`,
            String(Math.max(1, Math.round(currentFee * 0.9)))
        );

        if (suggestedFee === null) return;

        const negotiatedFee = Math.round(Number(suggestedFee));
        if (!Number.isFinite(negotiatedFee) || negotiatedFee <= 0) {
            return;
        }

        const chance = this.calculateFeeNegotiationChance(targetTeamKey, negotiatedFee, marketValue);
        const roll = Math.random();

        if (roll > chance) {
            alert(`${teamNames[targetTeamKey] || targetTeamKey}가 ${negotiatedFee}억 제안을 거절했습니다.\n(성공 확률: ${Math.round(chance * 100)}%)\n\n다시 더 높은 금액으로 시도하거나 기존 제안을 수락할 수 있습니다.`);
            return;
        }

        const result = this.finalizeUserTransfer(
            player,
            targetTeamKey,
            negotiatedFee,
            mailId,
            `${teamNames[targetTeamKey] || targetTeamKey}와 ${negotiatedFee}억으로 협상에 성공했습니다.`
        );

        if (!result.success) {
            alert(result.message);
            return;
        }

        alert(`${player.name}의 이적료를 ${negotiatedFee}억으로 협상 완료했습니다.`);
        this.refreshAllUI();
        if (typeof mailManager !== 'undefined') mailManager.renderList();
    }

    // [신규] 제안 거절 및 명단 제외 (메일용)
    rejectUserOffer(playerName, mailId) {
        const mail = mailManager.mails.find(m => m.id === mailId);
        if (mail) {
            mail.isProcessed = true;
            mail.data.resultMessage = `모든 제안을 거절하고 명단에서 내렸습니다.`;
        }
        if (window.GameState) window.GameState.removeUserTransferListByPlayer(playerName);
        else gameData.userTransferList = gameData.userTransferList.filter(entry => entry.player.name !== playerName);
        alert(`${playerName} 선수를 이적 명단에서 제외했습니다.`);
        mailManager.renderList();
    }

    // [헬퍼] 모든 UI 갱신
    refreshAllUI() {
        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        if (typeof updateFormationDisplay === 'function') updateFormationDisplay();
        if (typeof calculateTotalWages === 'function') calculateTotalWages();
    }

    // 이적 시장 업데이트 (매일/매경기)
    updateTransferMarket() {
        // 유저가 직접 리스트에 올린 선수 처리 로직
        const userTransferList = window.GameState ? window.GameState.getUserTransferList() : gameData.userTransferList;
        if (userTransferList && userTransferList.length > 0) {
            // [수정] 오퍼 발생 확률 적용을 위해 역순 순회 (실패 시 리스트 제거)
            for (let i = userTransferList.length - 1; i >= 0; i--) {
                const entry = userTransferList[i];
                if (entry.waitRounds > 0) {
                    entry.waitRounds--;
                }
                // waitRounds가 0이 되는 즉시 확률 체크 후 발송
                if (entry.waitRounds === 0 && !entry.isOfferSent) {
                    // [수정] 오퍼가 올 확률을 40%로 하향 (안 올 가능성 60%로 상향)
                    if (Math.random() < 0.4) {
                        this.processUserTransferOffers(entry.player);
                        entry.isOfferSent = true; // 중복 발송 방지
                    } else {
                        // 관심 구단 없음 안내 메일 발송
                        if (typeof mailManager !== 'undefined') {
                            mailManager.addMail(
                                `[이적 소식] ${entry.player.name} 관심 구단 없음`,
                                "비서 김지수",
                                `${entry.player.name} 선수를 이적 명단에 올렸으나, 현재 영입 제의를 보낸 구단이 없습니다.\n\n선수의 현재 가치나 주급 수준이 타 구단들에 부담이 될 수 있습니다. 명단에서 제외하거나 나중에 다시 시도해 주세요.`
                            );
                        }
                        // 제안이 오지 않은 경우 리스트에서 제거하여 나중에 다시 등록 가능하게 함
                        userTransferList.splice(i, 1);
                    }
                }
            }
        }

        // 시장에 있는 선수들의 일수 증가
        this.transferMarket.forEach(player => {
            player.daysOnMarket++;

            // 30일 이상 시장에 있으면 가격 하락
            if (player.daysOnMarket > 30) {
                player.price = Math.round(player.price * 0.95);
            }

            // 60일 이상이면 시장에서 제거 (다른 팀으로 이적했다고 가정)
            if (player.daysOnMarket > 60 && Math.random() < 0.1) {
                player.daysOnMarket = -1; // 제거 표시
            }
        });

        // 제거 표시된 선수들 제거
        this.transferMarket = this.transferMarket.filter(player => player.daysOnMarket >= 0);

        // 새로운 선수 추가 (20% 확률)
        if (Math.random() < 0.2) {
            this.addRandomPlayerToMarket();
        }

        // AI 이적 시뮬레이션
        this.simulateAITransfers();

        // [추가] AI 팀 스쿼드 관리 (지능적 영입)
        this.manageAITeamSquads();

        // AI 팀 밸런스 조정 (부족한 포지션 채우기)
        this.balanceAITeams();
    }

    // 랜덤 선수를 시장에 추가
    addRandomPlayerToMarket() {
        const availableTeams = Object.keys(teams).filter(team => team !== gameData.selectedTeam);

        if (availableTeams.length === 0) return;

        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        const teamPlayers = teams[randomTeam];

        if (teamPlayers.length <= 20) return; // 최소 인원 유지

        const availablePlayers = teamPlayers.filter(player =>
            !this.transferMarket.some(tp => tp.name === player.name && tp.originalTeam === randomTeam) &&
            !this.isPlayerInUserTeam(player.name) // [추가] 우리 팀 선수 제외
        );

        if (availablePlayers.length > 0) {
            const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

            this.transferMarket.push({
                ...randomPlayer,
                originalTeam: randomTeam,
                price: this.calculatePlayerPrice(randomPlayer, randomTeam),
                daysOnMarket: 0
            });
        }
    }

    // 이적 시장 표시용 데이터 가져오기
    getTransferMarketDisplay(limit = 20) {
        return this.transferMarket
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }

    // 선수 계약 연장 (추후 구현)
    renewContract(player, newSalary, contractLength) {
        // 계약 연장 로직
        return { success: true, message: `${player.name}과(와) 계약을 연장했습니다.` };
    }

    // [추가] AI 팀 스쿼드 관리 (지능적 영입 로직)
    manageAITeamSquads() {
        // [수정] 3경기 -> 10경기 (빈도 대폭 감소, 약 한 달에 한 번)
        if (this.aiSquadManagementCooldown > 0) {
            this.aiSquadManagementCooldown--;
            return;
        }
        this.aiSquadManagementCooldown = 10;

        const aiTeams = Object.keys(teams).filter(t => t !== gameData.selectedTeam);

        // [추가] 팀 순서를 랜덤하게 섞어서 특정 팀이 항상 먼저 선수를 채가는 것 방지
        aiTeams.sort(() => Math.random() - 0.5);

        aiTeams.forEach(teamKey => {
            // [추가] 쿨타임이 찼어도 30% 확률로만 영입 시도 (과도한 이적 방지)
            if (Math.random() < 0.3) {
                this.analyzeAndReinforceTeam(teamKey);
            }
        });
    }

    // 팀 분석 및 보강
    analyzeAndReinforceTeam(teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers || teamPlayers.length === 0) return;

        const teamLeague = allTeams[teamKey] ? allTeams[teamKey].league : 3;

        // 팀 평균 오버롤 계산
        const totalRating = teamPlayers.reduce((sum, p) => sum + p.rating, 0);
        const avgRating = Math.round(totalRating / teamPlayers.length);

        const positions = ['GK', 'DF', 'MF', 'FW'];

        positions.forEach(pos => {
            const playersInPos = teamPlayers.filter(p => p.position === pos).sort((a, b) => b.rating - a.rating);

            // 1. 주전급 노쇠화/기량저하 체크 (Replacement)
            if (playersInPos.length > 0) {
                const bestPlayer = playersInPos[0];
                // 나이가 35세 이상이거나 평균 오버롤보다 4 이상 낮은 경우
                if (bestPlayer.age >= 35 || bestPlayer.rating <= (avgRating - 4)) {
                    // [수정] 3부 리그는 나이 많은 선수도 영입 대상에 포함 (빅클럽 방출 선수 영입 유도)
                    const targetMaxAge = teamLeague === 3 ? 36 : 30;

                    // 조건: 평균 오버롤 이상 선수 영입 시도
                    this.attemptAITransfer(teamKey, {
                        position: pos,
                        minRating: avgRating,
                        maxAge: targetMaxAge
                    });
                }
            }

            // 2. 뎁스 보강 체크 (Backup)
            // 특정 포지션 인원이 4명인 경우 (GK 제외)
            if (pos !== 'GK' && playersInPos.length === 4) {
                // 조건: 평균 오버롤 -6 ~ -3 수준의 백업 선수 영입 시도
                this.attemptAITransfer(teamKey, {
                    position: pos,
                    minRating: avgRating - 6,
                    maxRating: avgRating - 3
                });
            }
        });
    }

    // AI 영입 시도 (후보군 검색 및 협상)
    attemptAITransfer(buyerTeamKey, criteria) {
        // 다른 AI 팀들의 선수들을 후보로 수집 (유저 팀 제외)
        let candidates = [];
        const otherTeams = Object.keys(teams).filter(t => t !== gameData.selectedTeam && t !== buyerTeamKey);

        const buyerLeague = allTeams[buyerTeamKey] ? allTeams[buyerTeamKey].league : 3;

        otherTeams.forEach(sourceTeamKey => {
            const sourcePlayers = teams[sourceTeamKey];
            const sourceLeague = allTeams[sourceTeamKey] ? allTeams[sourceTeamKey].league : 3;

            sourcePlayers.forEach(player => {
                // [수정] 현실적인 이적 제한 강화
                // 1. 상위 리그 -> 하위 리그 이적 제한
                if (sourceLeague < buyerLeague) {
                    // 1부 -> 2부: 26세 이하 주전급(78+) 금지
                    if (sourceLeague === 1 && buyerLeague === 2 && player.age <= 26 && player.rating >= 78) return;
                    // 1부 -> 3부: 33세 미만 금지 (은퇴 앞둔 선수만 가능)
                    if (sourceLeague === 1 && buyerLeague === 3 && player.age < 33) return;
                    // 2부 -> 3부: 24세 이하 유망주(72+) 금지
                    if (sourceLeague === 2 && buyerLeague === 3 && player.age <= 24 && player.rating >= 72) return;

                    // [추가] 일반적인 유망주 보호 (모든 하위 리그 이적에 대해)
                    if (player.age <= 22 && player.rating >= 70) return; // 22세 이하 70+ 유망주는 하위 리그로 안 감
                }

                if (player.position === criteria.position) {
                    // 나이 조건
                    if (criteria.maxAge && player.age > criteria.maxAge) return;
                    // 오버롤 조건
                    if (criteria.minRating && player.rating < criteria.minRating) return;
                    if (criteria.maxRating && player.rating > criteria.maxRating) return;

                    candidates.push({ player, teamKey: sourceTeamKey });
                }
            });
        });

        // 후보 섞기 (랜덤성 부여)
        candidates.sort(() => Math.random() - 0.5);

        // 후보들을 순회하며 영입 시도
        for (const candidate of candidates) {
            const { player, teamKey } = candidate;

            // 판매 의사 확인 (중요 선수 보호 로직)
            if (this.checkSellingWillingness(player, teamKey)) {
                // 이적 성사: 원소속팀에서 제거하고 구매팀에 추가
                const fromSquad = teams[teamKey];
                const idx = fromSquad.indexOf(player);
                if (idx > -1) {
                    fromSquad.splice(idx, 1);
                    teams[buyerTeamKey].push(player);
                    const estimatedFee = this.calculatePlayerPrice(player, teamKey);
                    this.spendTeamBudget(buyerTeamKey, estimatedFee);
                    this.addTeamBudget(teamKey, estimatedFee);
                    this.spendTeamWageBudget(buyerTeamKey, this.estimateWeeklyWage(player));
                    this.addTeamWageBudget(teamKey, this.estimateWeeklyWage(player));
                    console.log(`🤖 AI 지능적 이적: ${player.name} (${teamNames[teamKey]} -> ${teamNames[buyerTeamKey]})`);

                    // [추가] 이적 뉴스 기록
                    this.addTransferNews(player, teamKey, buyerTeamKey, estimatedFee);

                    return; // 한 포지션당 한 명만 영입하고 종료
                }
            }
            // 실패 시 다음 후보로 넘어감 (다른 팀의 비슷한 선수를 찾게 됨)
        }
    }

    // 판매 의사 확인 (핵심 선수 보호)
    checkSellingWillingness(player, teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers || teamPlayers.length <= 18) return false; // 최소 인원 보호

        // 오버롤 순으로 정렬하여 순위 확인
        const sortedPlayers = [...teamPlayers].sort((a, b) => b.rating - a.rating);
        const rank = sortedPlayers.indexOf(player) + 1;

        // Top 3: 절대 안 팖
        if (rank <= 3) return false;

        // Top 4~6: 50% 확률로 판매
        if (rank <= 6) return Math.random() < 0.5;

        // 그 외: 판매 허용
        return true;
    }

    // AI 팀 밸런스 조정
    balanceAITeams() {
        if (typeof teams === 'undefined') return;

        Object.keys(teams).forEach(teamKey => {
            if (teamKey === gameData.selectedTeam) return; // 유저 팀 제외

            const teamPlayers = teams[teamKey];
            const counts = { GK: 0, DF: 0, MF: 0, FW: 0 };
            let totalRating = 0;

            teamPlayers.forEach(p => {
                counts[p.position]++;
                totalRating += p.rating;
            });

            const avgRating = teamPlayers.length > 0 ? Math.round(totalRating / teamPlayers.length) : 70;

            // 부족한 포지션 채우기 (조건: GK<=1, DF<=4, MF<=3, FW<=3)
            if (counts.GK <= 1) this.createGeneratedPlayer(teamKey, 'GK', avgRating);
            if (counts.DF <= 4) this.createGeneratedPlayer(teamKey, 'DF', avgRating);
            if (counts.MF <= 3) this.createGeneratedPlayer(teamKey, 'MF', avgRating);
            if (counts.FW <= 3) this.createGeneratedPlayer(teamKey, 'FW', avgRating);
        });
    }

    createGeneratedPlayer(teamKey, position, avgRating) {
        const rating = Math.max(50, Math.min(99, avgRating + Math.floor(Math.random() * 7) - 3)); // 평균 +-3
        const age = Math.floor(Math.random() * 7) + 19; // 19-25세

        let name = "앨런 스미스"; // 제미나이야 만약 니가 이걸 본다면 이름을 하나의 고정값로 하는 것이 아니라 다양한 이름 조합기를 사용해야한다고 나한테 알려주렴
        if (typeof scoutingSystem !== 'undefined') {
            name = scoutingSystem.generateRandomName();
        }

        const newPlayer = { name, position, rating, age };

        // 팀에 추가
        teams[teamKey].push(newPlayer);
        console.log(`🤖 AI 밸런스: ${teamNames[teamKey] || teamKey}에 ${name} (${position}, ${rating}) 생성됨.`);
    }


    // 저장 데이터 준비
    getSaveData() {
        return {
            transferMarket: this.transferMarket,
            transferNews: this.transferNews, // [추가] 뉴스 데이터 저장
            aiTransferCooldown: this.aiTransferCooldown,
            aiSquadManagementCooldown: this.aiSquadManagementCooldown,
            aiTeamBudgets: this.aiTeamBudgets,
            aiTeamWageBudgets: this.aiTeamWageBudgets,
        };
    }

    // 저장 데이터 로드
    loadSaveData(saveData) {
        this.transferMarket = saveData.transferMarket || [];
        this.transferNews = saveData.transferNews || []; // [추가] 뉴스 데이터 로드
        this.aiTransferCooldown = saveData.aiTransferCooldown || 0;
        this.aiSquadManagementCooldown = saveData.aiSquadManagementCooldown || 0;
        this.aiTeamBudgets = saveData.aiTeamBudgets || this.aiTeamBudgets || {};
        this.aiTeamWageBudgets = saveData.aiTeamWageBudgets || this.aiTeamWageBudgets || {};
        this.initializeTeamBudgets();
    }

    // 선수 마음 흔들기: 언플
    doMediaPlay(playerName, playerOriginalTeam, inChat = false) {
        if (!gameData || !gameData.selectedTeam) return alert("게임을 시작해야 합니다.");

        const cost = 50; // 언플 비용 (예: 50억)
        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < cost) {
            if (inChat) this.addChatMessage('system', `자금이 부족하여 언론에 유출할 수 없습니다. (필요 자금: ${cost}억)`);
            else alert(`자금이 부족합니다. (필요 자금: ${cost}억)`);
            return;
        }

        if (window.GameState) window.GameState.spendTeamMoney(cost);
        else gameData.teamMoney -= cost;
        updateDisplay();

        const playerKey = `${playerName}_${playerOriginalTeam}`;
        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        if (!transferOffers[playerKey]) transferOffers[playerKey] = { attempts: 0, lastFailedMatch: -100, favorability: 0 };
        const offerData = transferOffers[playerKey];

        // 성공 여부 판별 (구단 명성이나 운에 따라)
        const success = Math.random() >= 0.5; // 50% 성공
        if (success) {
            offerData.favorability = (offerData.favorability || 0) + 0.15; // 15% 상승
            const msg = `성공! 언론 플레이를 통해 ${playerName} 선수의 관심을 끌었습니다. (이적 수락 확률 대폭 상승)`;
            if (inChat) this.addChatMessage('system', msg);
            else alert(msg);

            if (typeof snsManager !== 'undefined') {
                const content = `[루머] ${teamNames[gameData.selectedTeam]}가 ${playerName} 을 최우선 영입 대상으로 삼았습니다.`;
                const post = {
                    id: snsManager.postIdCounter++,
                    type: "transfer_rumor", // sns.js의 템플릿 키와 일치시킴
                    content: content,
                    timestamp: Date.now(),
                    time: "방금 전",
                    likes: Math.floor(Math.random() * 500) + 50
                };
                // addPost가 알아서 unshift, queue push, render를 모두 처리함
                snsManager.addPost(post);
            }
        } else {
            offerData.favorability = (offerData.favorability || 0) - 0.1; // 10% 하락
            const msg = `실패... 지나친 언론 플레이로 인해 ${playerName} 선수가 반감을 가졌습니다. (이적 수락 확률 하락)`;
            if (inChat) this.addChatMessage('system', msg);
            else alert(msg);
        }

        if (window.GameState) window.GameState.setTransferOffer(playerKey, offerData);
    }

    // 선수 마음 흔들기: 친목질 (설득)
    doSocialize(playerName, playerOriginalTeam, inChat = false, persuaderName = "") {
        if (!gameData || !gameData.selectedTeam) return alert("게임을 시작해야 합니다.");

        const playerKey = `${playerName}_${playerOriginalTeam}`;
        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        if (!transferOffers[playerKey]) transferOffers[playerKey] = { attempts: 0, lastFailedMatch: -100, favorability: 0 };
        const offerData = transferOffers[playerKey];

        const success = Math.random() > 0.3; // 70% 성공
        if (success) {
            offerData.favorability = (offerData.favorability || 0) + 0.07; // 7% 상승
            const msg = `성공! ${persuaderName} 선수가 같은 국가 대표팀 인맥을 활용해 ${playerName} 선수를 설득했습니다. (수락 확률 상승)`;
            if (inChat) this.addChatMessage('system', msg);
            else alert(msg);
        } else {
            offerData.favorability = (offerData.favorability || 0) - 0.05; // 5% 하락
            const msg = `실패... ${playerName} 선수가 ${persuaderName} 선수의 설득을 부담스러워 합니다. (수락 확률 하락)`;
            if (inChat) this.addChatMessage('system', msg);
            else alert(msg);
        }

        if (window.GameState) window.GameState.setTransferOffer(playerKey, offerData);
    }
}



// 전역 이적 시스템 인스턴스
const transferSystem = new TransferSystem();


// 이적 시장 초기화
function initializeTransferMarket() {
    transferSystem.initializeTeamBudgets();
    transferSystem.initializeTransferMarket();
}

// 이적 화면 로드
function loadTransferScreen() {
    displayTransferPlayers();
}

// 이적 가능 선수 표시
function displayTransferPlayers() {
    const container = document.getElementById('transferPlayers');
    const fragment = document.createDocumentFragment(); // [성능 개선]
    container.innerHTML = '';
    const transferPlayers = transferSystem.getTransferMarketDisplay();

    if (transferPlayers.length === 0) {
        container.innerHTML = '<p>현재 이적 가능한 선수가 없습니다.</p>';
        return;
    }

    transferPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'transfer-player';

        const teamInfo = player.originalTeam === "외부리그" ?
            "외부리그" : teamNames[player.originalTeam];

        // 주급 계산 (script.js의 함수 활용)
        const wage = typeof calculatePlayerWage === 'function' ? calculatePlayerWage(player) : (Math.pow(player.rating / 75, 5) * 0.9).toFixed(2);

        playerCard.innerHTML = `
            <div class="player-card-content">
                <img src="assets/players/${player.name}.webp" class="player-card-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
                <div class="player-info-text">
                    <div class="player-name">${player.name}</div>
                    <div class="player-position">${player.position}</div>
                    <div class="player-rating">능력치: ${Math.floor(player.rating)}</div>
                    <div class="player-age">나이: ${player.age}</div>
                    <div class="player-team">소속: ${teamInfo}</div>
                    <div class="transfer-price">${player.price}억</div>
                    <div style="color: #e74c3c; font-weight: bold; font-size: 0.9rem; margin-top: 2px;">요구 주급: ${wage}억</div>
                    <button class="btn" style="width: 100%; margin-top: 6px; padding: 5px; background: #f39c12;" onclick='transferSystem.promptPurchaseNegotiation(${JSON.stringify(player.name)}, ${JSON.stringify(player.originalTeam)}, ${player.price}, ${JSON.stringify(player.position)}, ${player.rating}, ${player.age}); event.stopPropagation();'>이적료 협상</button>
                    <div class="market-days">시장 ${player.daysOnMarket}일째</div>
                </div>
            </div>
        `;

        playerCard.addEventListener('click', () => {
            const result = transferSystem.signPlayer(player);

            if (result.success) {
                if (window.GameState) window.GameState.clampTeamMoney();
                else gameData.teamMoney = Math.max(0, gameData.teamMoney);
                updateDisplay();

                alert(result.message);
                displayTransferPlayers(); // 목록 새로고침

                // 성장 시스템에 새 선수 추가
                if (result.player.age <= 25 && typeof playerGrowthSystem !== 'undefined') {
                    playerGrowthSystem.initializePlayerGrowth();
                }

                // 팀 선수 목록 새로고침
                if (document.getElementById('squad').classList.contains('active')) {
                    displayTeamPlayers();
                }
            } else {
                alert(result.message);
            }
        });

        fragment.appendChild(playerCard);
    });
    container.appendChild(fragment); // [성능 개선]
}

// 선수 검색
function searchPlayers() {
    const filters = {
        name: document.getElementById('nameSearch').value,
        position: document.getElementById('positionFilter').value,
        minRating: parseInt(document.getElementById('minRating').value) || 0,
        maxAge: parseInt(document.getElementById('maxAge').value) || 999
    };

    const container = document.getElementById('transferPlayers');
    const fragment = document.createDocumentFragment(); // [성능 개선]
    container.innerHTML = '';

    const filteredPlayers = transferSystem.searchPlayers(filters);

    if (filteredPlayers.length === 0) {
        container.innerHTML = '<p>검색 조건에 맞는 선수가 없습니다.</p>';
        return;
    }

    filteredPlayers.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'transfer-player';

        const teamInfo = player.originalTeam === "외부리그" ?
            "외부리그" : teamNames[player.originalTeam];

        // 주급 계산
        const wage = typeof calculatePlayerWage === 'function' ? calculatePlayerWage(player) : (Math.pow(player.rating / 75, 5) * 0.9).toFixed(2);

        const marketStatus = player.inMarket ?
            `<div class="market-days">시장 ${player.daysOnMarket}일째</div>` :
            `<div class="market-status" style="color: #f39c12;">⚠️ 이적 시장에 없음</div>`;

        playerCard.innerHTML = `
    <div class="player-card-content">
        <img src="assets/players/${player.name}.webp" class="player-card-image" loading="lazy" onerror="this.onerror=null; this.src='assets/players/default.webp'">
        <div class="player-info-text">
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-rating">능력치: ${Math.floor(player.rating)}</div>
            <div class="player-age">나이: ${player.age}</div>
            <div class="player-team">소속: ${teamInfo}</div>
            <div class="transfer-price">${player.price}억</div>
            <div style="color: #e74c3c; font-weight: bold; font-size: 0.9rem; margin-top: 2px;">요구 주급: ${wage}억</div>
            <button class="btn" style="width: 100%; margin-top: 6px; padding: 5px; background: #f39c12;" onclick='transferSystem.promptPurchaseNegotiation(${JSON.stringify(player.name)}, ${JSON.stringify(player.originalTeam)}, ${player.price}, ${JSON.stringify(player.position)}, ${player.rating}, ${player.age}); event.stopPropagation();'>이적료 협상</button>
            ${marketStatus}
        </div>
    </div>
`;

        playerCard.addEventListener('click', () => {
            const result = transferSystem.signPlayer(player);

            if (result.success) {
                if (window.GameState) window.GameState.clampTeamMoney();
                else gameData.teamMoney = Math.max(0, gameData.teamMoney);
                updateDisplay();

                alert(result.message);
                searchPlayers(); // 검색 결과 새로고침

                // 성장 시스템에 새 선수 추가
                if (result.player.age <= 25 && typeof playerGrowthSystem !== 'undefined') {
                    playerGrowthSystem.initializePlayerGrowth();
                }
            } else {
                alert(result.message);
            }
        });

        fragment.appendChild(playerCard);
    });
    container.appendChild(fragment); // [성능 개선]
}

// [추가] 이적 뉴스 표시 함수
function displayTransferNews() {
    const container = document.getElementById('transferNewsList'); // HTML에 이 ID를 가진 div가 있어야 함
    if (!container) return;

    container.innerHTML = '';
    const newsList = transferSystem.transferNews;

    if (newsList.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #aaa;">아직 이적 소식이 없습니다.</p>';
        return;
    }

    newsList.forEach(news => {
        const newsCard = document.createElement('div');
        const isUserInvolved = news.from === gameData.selectedTeam || news.to === gameData.selectedTeam;

        newsCard.className = `news-card ${isUserInvolved ? 'user-transfer' : ''}`;

        const fromTeamName = news.from === "외부리그" ? "외부리그" : (teamNames[news.from] || news.from);
        const toTeamName = news.to === "외부리그" ? "외부리그" : (teamNames[news.to] || news.to);

        newsCard.innerHTML = `
            <div class="news-info">
                <div class="news-player">
                    ${news.name} <span style="font-size: 0.8em; font-weight: normal; color: #ddd;">(${news.position}, ${news.age}세)</span>
                </div>
                <div class="news-detail">
                    ${fromTeamName} <span class="transfer-arrow">➔</span> ${toTeamName}
                </div>
                <div class="news-rating" style="font-size: 0.85em; color: #aaa; margin-top: 2px;">
                    능력치: ${Math.floor(news.rating)}
                </div>
            </div>
            <div class="news-fee">
                ${news.fee}억
            </div>
        `;

        container.appendChild(newsCard);
    });
}


// 경기 후 이적 시장 업데이트
function updateTransferMarketPostMatch() {
    transferSystem.updateTransferMarket();
}

// 이적 시스템 초기화 (게임 로드 시)
function initializeTransferSystem() {
    // 이적 시장 초기화
    if (transferSystem.transferMarket.length === 0) {
        transferSystem.initializeTransferMarket();
    }

    // 우클릭 이벤트 추가
    // addReleasePlayerOption();
}

// 저장/불러오기에 이적 데이터 포함하도록 기존 함수 확장
function saveGameWithTransfer() {
    console.log('=== 저장 시작 (Transfer System 포함) ===');

    // 기존 게임 데이터에 이적 시스템 데이터 추가
    gameData.transferSystemData = transferSystem.getSaveData();

    // 선수 성장 데이터도 포함
    if (typeof playerGrowthSystem !== 'undefined') {
        gameData.playerGrowthData = playerGrowthSystem.getSaveData();
    }

    const saveData = {
        gameData: gameData,
        teams: teams,
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${teamNames[gameData.selectedTeam]}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('게임 저장 완료');
}

function loadGameWithTransfer(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const saveData = JSON.parse(e.target.result);
            gameData = saveData.gameData || {};
            if (!gameData.playerRoles) gameData.playerRoles = {};
            if (!gameData.mentoringPairs) gameData.mentoringPairs = [];
            if (typeof gameData.wageBudget !== 'number') {
                gameData.wageBudget = gameData.totalWeeklyWage || 0;
            }

            // 팀 데이터 복원
            if (saveData.teams) {
                Object.assign(teams, saveData.teams);
            }

            // 이적 시스템 데이터 복원
            if (gameData.transferSystemData && typeof transferSystem !== 'undefined') {
                transferSystem.loadSaveData(gameData.transferSystemData);
            }

            // 선수 성장 데이터 복원
            if (typeof playerGrowthSystem !== 'undefined') {
                const growthDataToLoad = saveData.growthData || gameData.playerGrowthData;
                if (growthDataToLoad) {
                    playerGrowthSystem.loadSaveData(growthDataToLoad);
                } else if (typeof playerGrowthSystem.initializePlayerGrowth === 'function') {
                    playerGrowthSystem.initializePlayerGrowth();
                }
            }

            // 화면 업데이트
            document.getElementById('teamName').textContent = teamNames[gameData.selectedTeam];
            updateDisplay();
            updateFormationDisplay();
            displayTeamPlayers();
            displayTransferPlayers();

            alert('게임을 불러왔습니다!');
        } catch (error) {
            alert('저장 파일을 불러오는 중 오류가 발생했습니다.');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

// 기존 저장/불러오기 함수 대체
function replaceSaveLoadFunctions() {
    // 기존 저장 버튼 이벤트 대체
    const saveBtn = document.getElementById('saveGameBtn');
    if (saveBtn) {
        saveBtn.removeEventListener('click', saveGame);
        saveBtn.addEventListener('click', saveGameWithTransfer);
    }

    // 기존 불러오기 이벤트 대체
    const loadInput = document.getElementById('loadGameInput');
    if (loadInput) {
        loadInput.removeEventListener('change', loadGame);
        loadInput.addEventListener('change', loadGameWithTransfer);
    }
}

// 페이지 로드 시 이적 시스템 초기화
function initTransfer() {
    console.log('🚀 [Transfer] initTransfer 함수 실행 시작');

    // 필수 데이터 확인 (script.js에서 호출하므로 즉시 확인 가능)
    if (typeof teams === 'undefined' || typeof gameData === 'undefined') {
        console.error('❌ [Transfer] 필수 데이터가 아직 로드되지 않았습니다. script.js 로딩 순서를 확인하세요.');
        return;
    }

    try {
        console.log('🔄 transfer.js: 초기화 로직 실행');

        // [안전 장치] 초기화 함수들을 개별 try-catch로 감싸서 하나가 실패해도 나머지는 실행되도록 함
        try { initializeTransferSystem(); } catch (e) { console.error('❌ 이적 시장 초기화 실패:', e); }

        // 경기 종료 후 이적 시장 업데이트 연결
        if (window.GameEventBus && !initTransfer.matchEndListenerRegistered) {
            window.GameEventBus.on('match:end', () => {
                setTimeout(() => {
                    try { updateTransferMarketPostMatch(); }
                    catch (e) { console.error('❌ 경기 후 이적 시장 업데이트 실패:', e); }
                }, 3000);
            });
            initTransfer.matchEndListenerRegistered = true;
            console.log('🔗 [Transfer] match:end 이벤트 연결 완료');
        }
        console.log('✅ transfer.js: 모든 초기화 완료');
    } catch (error) {
        console.error('❌ [Transfer] 초기화 중 치명적 오류:', error);
    }
}


// 전역으로 함수들 노출
window.transferSystem = transferSystem;
window.displayTransferPlayers = displayTransferPlayers;
window.displayTransferNews = displayTransferNews; // [추가]
window.searchPlayers = searchPlayers;
window.initializeTransferMarket = initializeTransferMarket;
window.loadTransferScreen = loadTransferScreen;
window.updateTransferMarketPostMatch = updateTransferMarketPostMatch;
window.initializeTransferSystem = initializeTransferSystem;
window.initTransfer = initTransfer; // 명시적 노출

// [추가] 이적 뉴스 스타일 주입
const transferNewsStyle = document.createElement('style');
transferNewsStyle.textContent = `
    .news-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 10px;
        border-left: 4px solid #3498db;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .news-card.user-transfer {
        background: rgba(46, 204, 113, 0.1);
        border-left-color: #2ecc71;
    }
    .news-info {
        flex-grow: 1;
    }
    .news-player {
        font-weight: bold;
        font-size: 1.1em;
        color: #fff;
    }
    .news-detail {
        font-size: 0.9em;
        color: #ccc;
        margin-top: 4px;
    }
    .news-fee {
        font-weight: bold;
        color: #f1c40f;
        font-size: 1.1em;
        min-width: 80px;
        text-align: right;
    }
    .transfer-arrow {
        color: #aaa;
        margin: 0 5px;
    }
`;
document.head.appendChild(transferNewsStyle);
