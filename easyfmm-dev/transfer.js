// 이적 시스템
console.log('[Transfer] transfer.js 파일 로드 시작');

class TransferSystem {
    constructor() {
        this.transferMarket = [];
        this.transferNews = []; // [추가] 이적 뉴스 데이터 저장
        this.aiTransferCooldown = 0;
        this.aiSquadManagementCooldown = 0; // AI 지능적 영입 쿨타임
        this.basePrice = 600; // 기본 가격 600억으로 하향 조정 (요청사항 반영)
        this.aiTeamBudgets = {}; // AI 팀 현재 자금
        this.aiTeamWageBudgets = {}; // AI 팀 주급 자금

        // 타 리그 선수들
        this.extraPlayers = [
            { "name": "바르트 페르브뤼헌", "position": "GK", "country": "네덜란드", "rating": 85, "age": 22, "team": "브라이튼" },
            { "name": "설영우", "position": "DF", "country": "대한민국", "rating": 77, "age": 27, "team": "츠르베나 즈베즈다" },
            { "name": "이한범", "position": "DF", "country": "대한민국", "rating": 78, "age": 23, "team": "미트윌란" },
            /* 카타르 */
            { "name": "아크람 아피프", "position": "FW", "country": "카타르", "rating": 79, "age": 29, "team": "알 사드" },
            { "name": "알모에즈 알리", "position": "FW", "country": "카타르", "rating": 78, "age": 29, "team": "알 두하일" },
            { "name": "메샬 바르샴", "position": "GK", "country": "카타르", "rating": 74, "age": 27, "team": "알 사드" },
            { "name": "이재성", "position": "MF", "country": "대한민국", "rating": 81, "age": 33, "team": "마인츠" },
            { "name": "네이마르", "position": "FW", "country": "브라질", "rating": 86, "age": 34, "team": "알 힐랄" },
            /* 우즈베키스탄 */
            { "name": "엘도르 쇼무로도프", "position": "FW", "country": "우즈베키스탄", "rating": 77, "age": 30, "team": "AS 로마" },
            { "name": "압보스벡 파이줄라예프", "position": "MF", "country": "우즈베키스탄", "rating": 75, "age": 22, "team": "CSKA 모스크바" },
            { "name": "오스톤 우루노프", "position": "MF", "country": "우즈베키스탄", "rating": 73, "age": 25, "team": "페르세폴리스" },
            /* 요르단 */
            { "name": "무사 알 타마리", "position": "FW", "country": "요르단", "rating": 79, "age": 28, "team": "몽펠리에" },
            { "name": "야잔 알 나이마트", "position": "FW", "country": "요르단", "rating": 75, "age": 26, "team": "알 아라비" },
            /* 남아프리카공화국 */
            { "name": "론웬 윌리엄스", "position": "GK", "country": "남아프리카공화국", "rating": 74, "age": 34, "team": "마멜로디 선다운스" },
            { "name": "퍼시 타우", "position": "FW", "country": "남아프리카공화국", "rating": 72, "age": 31, "team": "알 아흘리" },
            { "name": "테보호 모코에나", "position": "MF", "country": "남아프리카공화국", "rating": 68, "age": 29, "team": "마멜로디 선다운스" },
            /* 퀴라소 */
            { "name": "타히트 총", "position": "MF", "country": "퀴라소", "rating": 77, "age": 26, "team": "루턴 타운" },
            { "name": "주니뇨 바쿠나", "position": "MF", "country": "퀴라소", "rating": 74, "age": 28, "team": "알 와흐다" },
            { "name": "랑헬로 장가", "position": "FW", "country": "퀴라소", "rating": 69, "age": 33, "team": "FC 아인트호벤" },
            /* 카보베르데 */
            { "name": "로건 코스타", "position": "DF", "country": "카보베르데", "rating": 78, "age": 24, "team": "비야레알" },
            { "name": "라이언 멘데스", "position": "FW", "country": "카보베르데", "rating": 71, "age": 36, "team": "코자엘리스포르" },
            { "name": "보지냐", "position": "GK", "country": "카보베르데", "rating": 80, "age": 40, "team": "GD 샤베스" },
            { "name": "루카 부슈코비치", "position": "DF", "country": "크로아티아", "age": 18, "rating": 74, "team": "KVC 베스테를로" },
            { "name": "베베", "position": "FW", "country": "카보베르데", "rating": 70, "age": 35, "team": "라싱 페롤" },
            { "name": "조던 픽포드", "position": "GK", "country": "잉글랜드", "rating": 83, "age": 31, "team": "에버턴" },
            { "name": "조규성", "position": "FW", "country": "대한민국", "rating": 80, "age": 27, "team": "미트윌란" },
            { "name": "기욤 레스테스", "position": "GK", "country": "프랑스", "rating": 78, "age": 19, "team": "툴루즈" },
            { "name": "토마소 마르티넬리", "position": "GK", "country": "이탈리아", "rating": 72, "age": 18, "team": "피오렌티나" },
            { "name": "윤도영", "position": "FW", "country": "대한민국", "rating": 77, "age": 19, "team": "대전 하나 시티즌" },
            { "name": "조르조 스칼비니", "position": "DF", "country": "이탈리아", "rating": 85, "age": 21, "team": "아탈란타" },
            { "name": "우스망 디오망데", "position": "DF", "country": "코트디부아르", "rating": 83, "age": 21, "team": "스포르팅 CP" },
            { "name": "파비오 카발리", "position": "DF", "country": "이탈리아", "rating": 73, "age": 19, "team": "보루시아 묀헨글라트바흐" },
            { "name": "아론 히키", "position": "DF", "country": "스코틀랜드", "rating": 80, "age": 22, "team": "브렌트포드" },
            { "name": "디오고 코스타", "position": "GK", "country": "포르투갈", "rating": 86, "age": 25, "team": "FC 포르투" },
            { "name": "후고 라르손", "position": "MF", "country": "스웨덴", "rating": 81, "age": 20, "team": "프랑크푸르트" },
            { "name": "아담 와튼", "position": "MF", "country": "잉글랜드", "rating": 84, "age": 20, "team": "크리스탈 팰리스" },
            { "name": "마틴 바투리나", "position": "MF", "country": "크로아티아", "rating": 79, "age": 21, "team": "디나모 자그레브" },
            { "name": "자비 게라", "position": "MF", "country": "스페인", "rating": 79, "age": 21, "team": "발렌시아" },
            { "name": "옌스 카스트로프", "position": "MF", "country": "대한민국", "rating": 80, "age": 21, "team": "뉘른베르크" },
            { "name": "히오르히 수다코프", "position": "MF", "country": "우크라이나", "rating": 82, "age": 22, "team": "샤흐타르 도네츠크" },
            { "name": "켄드리 파에스", "position": "MF", "country": "에콰도르", "rating": 76, "age": 17, "team": "인디펜디엔테 델 바예" },
            { "name": "윌프리드 뇽토", "position": "FW", "country": "이탈리아", "rating": 79, "age": 20, "team": "리즈 유나이티드" },
            { "name": "엘리에스 벤 세기르", "position": "FW", "country": "모로코", "rating": 80, "age": 19, "team": "AS 모나코" },
            { "name": "카림 코네", "position": "FW", "country": "코트디부아르", "rating": 77, "age": 20, "team": "레드불 잘츠부르크" },
            { "name": "엄지성", "position": "FW", "country": "대한민국", "rating": 72, "age": 22, "team": "스완지 시티" },
            { "name": "배준호", "position": "FW", "country": "대한민국", "rating": 75, "age": 21, "team": "스토크 시티" },
            { "name": "오현규", "position": "FW", "country": "대한민국", "rating": 75, "age": 23, "team": "KRC 헹크" },
            { "name": "폴 포그바", "position": "MF", "country": "프랑스", "rating": 80, "age": 32, "team": "유벤투스" },
            { "name": "황희찬", "position": "FW", "country": "대한민국", "rating": 82, "age": 29, "team": "울버햄튼" },
            { "name": "델레 알리", "position": "MF", "country": "잉글랜드", "rating": 79, "age": 29, "team": "에버턴" },
            { "name": "니코 파스", "position": "MF", "country": "아르헨티나", "rating": 85, "age": 21, "team": "코모 1907" },
            { "name": "크리스티아누 호날두 JR", "position": "MF", "country": "아르헨티나", "rating": 62, "age": 16, "team": "알 나스르 U-17" },
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
        console.log('[Transfer] 이적 시장 데이터 생성 시작...');

        // 다른 팀의 일부 선수들을 이적 시장에 추가
        try {
            Object.keys(teams).forEach(teamKey => {
                if (teamKey !== gameData.selectedTeam) {
                    const teamPlayers = teams[teamKey];

                    // [안전 장치] teamPlayers가 배열인지 확인
                    if (!Array.isArray(teamPlayers)) {
                        console.warn(`[Transfer] ${teamKey} 팀의 선수 데이터가 올바르지 않아 건너뜁니다.`);
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
            console.error('[Transfer] 팀 선수 로딩 중 오류:', e);
        }

        // 타 리그 선수들도 추가
        this.extraPlayers.forEach(player => {
            // [수정] 이미 우리 팀에 있는 선수는 제외 (중복 방지)
            if (this.isPlayerInUserTeam(player.name)) return;

            this.transferMarket.push({
                ...player,
                originalTeam: player.team || "외부리그",
                price: this.calculatePlayerPrice(player, player.team || "외부리그"),
                daysOnMarket: Math.floor(Math.random() * 30)
            });
        });

        console.log(`[Transfer] 이적 시장 초기화 완료 (총 ${this.transferMarket.length}명)`);
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

        // [수정] 나이 많고 오버롤 낮은 경우 큰 폭 감가 (단, 최소 1억 보장)
        if (player.rating < 70 && player.age >= 32) {
            price *= 0.1;
        }

        // [수정] 최소 1억 보장 (0억 협상 불가 오류 방지)
        return Math.max(1, Math.round(price));
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
                !this.transferMarket.some(p => p.name === player.name) &&
                !this.isPlayerInUserTeam(player.name)) {

                allPlayers.push({
                    ...player,
                    originalTeam: player.team || "외부리그",
                    price: this.calculatePlayerPrice(player, player.team || "외부리그"),
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
        if (buyerTeamKey && player.originalTeam && typeof allTeams !== 'undefined' && allTeams[player.originalTeam]) {
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

    // [신규] 구단이 사용 가능한 잔여 여유 주급 계산 (주급 예산 한도 - 현재 선수단 총 주급)
    // 시작 시점에는 wageBudget == totalWeeklyWage 이므로 여유 주급이 정확히 0이 됨
    getAvailableWageBudget(teamKey) {
        const budget = this.getTeamWageBudget(teamKey);
        const currentTotal = (teamKey === gameData.selectedTeam && typeof calculateTotalWages === 'function')
            ? calculateTotalWages()
            : this.calculateTeamWeeklyWage(teamKey);
        return Math.max(0, parseFloat((budget - currentTotal).toFixed(2)));
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
        const units = Math.floor(Number(amount) / 52);
        if (!Number.isFinite(units) || units <= 0) {
            return { success: false, message: '이적 자금은 52억 단위(주급 자금 1억)로만 전환할 수 있습니다.' };
        }

        const value = units * 52;
        const converted = units;

        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < value) {
            return { success: false, message: '이적 자금이 부족합니다.' };
        }

        if (window.GameState) window.GameState.spendTeamMoney(value);
        else gameData.teamMoney = Math.round((gameData.teamMoney - value) * 100) / 100;
        this.addTeamWageBudget(gameData.selectedTeam, converted);

        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
        const finPanel = document.getElementById('finance');
        if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
            renderFinanceTab();
        }

        return { success: true, message: `${value}억 이적 자금을 주급 자금 ${converted}억으로 전환했습니다. (여유 주급 +${converted}억 확보)` };
    }

    convertWageToTransferBudget(amount) {
        const units = Math.floor(Number(amount));
        if (!Number.isFinite(units) || units <= 0) {
            return { success: false, message: '주급 자금은 1억 단위(이적 자금 52억)로만 전환할 수 있습니다.' };
        }

        const value = units;
        const availableWage = this.getAvailableWageBudget(gameData.selectedTeam);
        if (availableWage < value) {
            return { 
                success: false, 
                message: `전환 가능한 여유 주급 예산이 부족합니다.\n현재 잔여 여유 주급: ${availableWage}억 (전환 요구: ${value}억)\n선수단 총 주급 이하로는 주급 예산을 줄일 수 없습니다.` 
            };
        }

        const converted = value * 52;
        this.spendTeamWageBudget(gameData.selectedTeam, value);
        if (window.GameState) window.GameState.addTeamMoney(converted);
        else gameData.teamMoney = Math.round((gameData.teamMoney + converted) * 100) / 100;

        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
        const finPanel = document.getElementById('finance');
        if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
            renderFinanceTab();
        }

        return { success: true, message: `${value}억 주급 자금을 이적 자금 ${converted}억으로 전환했습니다.` };
    }

    promptPurchaseNegotiation(playerName, originalTeam, price, position, rating, age) {
        const foundPlayer = this.transferMarket.find(p => p.name === playerName && p.originalTeam === originalTeam)
            || { name: playerName, originalTeam, price, position, rating, age };

        foundPlayer.price = Math.max(1, Math.round(foundPlayer.price || 1));

        // 팀 인원 제한 및 쿨타임 체크
        const selectedTeamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];
        if (selectedTeamPlayers.length >= 50) {
            alert("팀 인원이 가득 찼습니다! (최대 50명)");
            return;
        }

        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        const playerKey = `${foundPlayer.name}_${foundPlayer.originalTeam}`;
        if (transferOffers[playerKey] && transferOffers[playerKey].attempts >= 2) {
            const matchesPassed = gameData.matchesPlayed - transferOffers[playerKey].lastFailedMatch;
            if (matchesPassed < 10) {
                alert(`협상 결렬 후 쿨타임 중입니다.\n${10 - matchesPassed}경기 후에 다시 제안할 수 있습니다.`);
                return;
            } else {
                transferOffers[playerKey].attempts = 0;
                delete transferOffers[playerKey].hasMediaPlayed;
                delete transferOffers[playerKey].hasSocialized;
                delete transferOffers[playerKey].favorability;
            }
        }

        if (this.isPlayerInUserTeam(foundPlayer.name)) {
            alert("이미 우리 팀에 소속된 선수입니다.");
            return;
        }

        const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
        if (currentMoney < (foundPlayer.price * 0.3)) {
            alert("자금이 너무 부족하여 협상 테이블에 앉을 수 없습니다.");
            return;
        }

        const suggestedWage = this.calculateNegotiatedWeeklyWage(foundPlayer);
        const expectedRoleIdx = this.getExpectedSquadRoleIndex(foundPlayer);
        const defaultYears = (foundPlayer.age <= 24) ? 4 : (foundPlayer.age >= 31 ? 2 : 3);

        this.chatState = {
            player: foundPlayer,
            step: 'FEE', // 'FEE' | 'WAGE' | 'RENEWAL' | 'WAITING'
            fee: 0,
            wage: 0,
            round: 1,
            maxRounds: 3,
            tension: 'LOW',
            counterFee: null,
            counterWage: null,
            demandedFee: foundPlayer.price,
            baseDemandedWage: suggestedWage,
            demandedWage: suggestedWage,
            contractYears: defaultYears,
            squadRoleIdx: expectedRoleIdx,
            expectedRoleIdx: expectedRoleIdx
        };

        this.openFcNegotiationUI('FEE');
    }

    // [신규] 기존 선수 재계약도 동일한 FC On Call UI로 오픈
    openRenewalNegotiation(player, demandData) {
        if (!player) return;
        const demand = demandData || (typeof contractSystem !== 'undefined' ? contractSystem.calculateRenewalDemand(player) : {
            currentWage: player.weeklyWage || 5,
            demandedWage: (player.weeklyWage || 5) * 1.2,
            extensionYears: 2,
            wageDiff: 1
        });

        const expectedRoleIdx = this.getExpectedSquadRoleIndex(player);

        this.chatState = {
            player: player,
            step: 'RENEWAL',
            fee: 0,
            wage: demand.demandedWage,
            round: 1,
            maxRounds: 3,
            tension: 'LOW',
            counterFee: null,
            counterWage: null,
            demandedFee: 0,
            baseDemandedWage: demand.demandedWage,
            demandedWage: demand.demandedWage,
            contractYears: demand.extensionYears || 2,
            squadRoleIdx: expectedRoleIdx,
            expectedRoleIdx: expectedRoleIdx,
            renewalDemand: demand
        };

        this.openFcNegotiationUI('RENEWAL');
    }

    // [신규] 우리 구단 선수 판매: 상대 구단 단장과의 FC On Call 이적료 밀당 협상 UI 오픈
    openSaleNegotiation(playerName, buyerTeamKey, initialOfferFee, mailId) {
        const teamPlayers = teams[gameData.selectedTeam];
        const player = teamPlayers.find(p => p.name === playerName);
        if (!player) {
            alert("해당 선수가 팀에 없습니다.");
            return;
        }

        const buyerDisplayName = (typeof teamNames !== 'undefined' && teamNames[buyerTeamKey]) || buyerTeamKey || '영입 희망 구단';
        const marketValue = this.calculatePlayerPrice(player, gameData.selectedTeam);
        const startingFee = Math.max(1, Math.round(initialOfferFee || (marketValue * 0.9)));

        this.chatState = {
            mode: 'SELL',
            step: 'SELL',
            player: player,
            buyerTeamKey: buyerTeamKey,
            buyerTeamName: buyerDisplayName,
            fee: startingFee,
            demandedFee: startingFee, // 상대 구단이 현재 제시한 이적료
            counterFee: null,
            marketValue: marketValue,
            round: 1,
            maxRounds: 3,
            tension: 'LOW',
            mailId: mailId
        };

        this.openFcNegotiationUI('SELL');
    }

    // 선수의 오버롤/팀 내 수준에 따른 기대 주전 위상 인덱스 (0: 유망주/후보, 1: 로테이션, 2: 주전, 3: 핵심 주전)
    getExpectedSquadRoleIndex(player) {
        const ovr = player.rating || 75;
        let myAvg = 78;
        if (typeof TeamUtils !== 'undefined' && typeof gameData !== 'undefined' && gameData.selectedTeam && teams[gameData.selectedTeam]) {
            myAvg = TeamUtils.calculateRating(teams[gameData.selectedTeam]) || 78;
        }
        const diff = ovr - myAvg;
        if (ovr >= 86 || diff >= 4) return 3; // CRUCIAL (핵심 주전)
        if (ovr >= 80 || diff >= 0) return 2; // IMPORTANT (주전)
        if (ovr >= 74 || diff >= -4) return 1; // ROTATION (로테이션)
        return 0; // PROSPECT / SPORADIC (후보/유망주)
    }

    getSquadRoleMeta(idx) {
        const roles = [
            { id: 'PROSPECT', label: 'PROSPECT (후보/백업)', short: '후보/백업' },
            { id: 'ROTATION', label: 'ROTATION (로테이션)', short: '로테이션' },
            { id: 'IMPORTANT', label: 'IMPORTANT (주전 보장)', short: '주전 보장' },
            { id: 'CRUCIAL', label: 'CRUCIAL (핵심 에이스)', short: '핵심 에이스' }
        ];
        return roles[Math.max(0, Math.min(3, idx))] || roles[2];
    }

    // 계약 기간(1~5년) 및 주전 위상(0~3) 변경에 따른 요구 주급 & 타결 보너스 재계산
    recalcPersonalTermsDemand() {
        if (!this.chatState) return;
        const state = this.chatState;
        const baseWage = state.baseDemandedWage || 5;
        const player = state.player;

        // 1) 주전 위상 차이 반영: 기대보다 낮은 역할을 주면 주급을 더 요구하고, 높은 역할을 약속하면 주급 요구 완화
        const roleDiff = state.squadRoleIdx - state.expectedRoleIdx;
        let wageMult = 1.0;
        if (roleDiff < 0) {
            // 기대보다 낮은 위상 (예: 에이스에게 로테이션 제의) -> 주급 +12% ~ +28% 보상 요구
            wageMult += Math.abs(roleDiff) * 0.13;
        } else if (roleDiff > 0) {
            // 기대보다 높은 위상 보장 -> 주급 -6% ~ -12% 감수
            wageMult -= roleDiff * 0.06;
        }

        // 2) 계약 기간(1~5년) 반영: 젊은 선수는 장기 계약 선호, 노장(31세+)은 단기/중기 선호
        const yrs = state.contractYears || 3;
        if (player.age >= 31 && yrs >= 4) {
            wageMult -= 0.05; // 노장에게 장기 계약 보장 시 주급 소폭 양보
        } else if (player.age <= 24 && yrs === 1) {
            wageMult += 0.08; // 젊은 유망주에게 1년 단기만 제시 시 주급 추가 요구
        } else if (yrs >= 4) {
            wageMult += (yrs - 3) * 0.04; // 장기 묶기 시 기본 주급 기대치 소폭 상승
        }

        state.demandedWage = Math.max(0.3, parseFloat((baseWage * wageMult).toFixed(2)));
    }

    // [신규] 상황별/성향별 초다양화 실감형 대사 생성기
    pickNegotiationLine(type, ctx = {}) {
        const state = this.chatState || {};
        const p = state.player || {};
        const name = p.name || '선수';
        const age = p.age || 25;
        const ovr = Math.floor(p.rating || 75);
        const pos = p.position || 'FW';
        const yrs = state.contractYears || 3;
        const roleMeta = this.getSquadRoleMeta(state.squadRoleIdx);
        const roleShort = roleMeta ? roleMeta.short : '주전';
        const clubName = (typeof teamNames !== 'undefined' && teamNames[p.originalTeam]) || p.originalTeam || '우리 구단';
        const myClub = (typeof teamNames !== 'undefined' && typeof gameData !== 'undefined' && teamNames[gameData.selectedTeam]) || '귀 구단';

        const isStar = ovr >= 86;
        const isYouth = age <= 22;
        const isVet = age >= 31;

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        switch (type) {
            case 'CLUB_GREETING': {
                const lines = [
                    `"반갑습니다 감독님. ${name} 영입 문의를 주셨군요. 우리 ${clubName}의 핵심 전력인 만큼 최소 ${p.price}억 원은 생각하고 있습니다."`,
                    `"연락 기다리고 있었습니다. ${name} 선수를 데려가시려면 ${p.price}억 원 수준의 이적료는 제시해 주셔야 보드진을 설득할 수 있습니다."`,
                    `"${myClub}에서 직접 전화를 주셨군요! 솔직히 ${name}를 쉽게 내줄 생각은 없습니다만, ${p.price}억 원 정도라면 대화를 시작할 수 있습니다."`,
                    `"여보세요, ${clubName} 단장입니다. 요즘 ${name}의 폼이 절정이라 문의가 많습니다. 기준 이적료는 ${p.price}억 원입니다."`,
                    `"안녕하십니까. 시간 끌 것 없이 단도직입적으로 말씀드리죠. ${name}의 바이아웃에 준하는 가치는 ${p.price}억 원입니다."`,
                    `"${name} 선수 건으로 전화 주셨군요. 팬들의 반발을 잠재우려면 최소 ${p.price}억 원 이상의 오퍼가 필요합니다."`
                ];
                return pick(lines);
            }

            case 'CLUB_COUNTER': {
                const { fee, counter, round } = ctx;
                if (round === 2) {
                    return pick([
                        `"${fee}억 원이라니요, 그 금액엔 협상 테이블을 유지하기 어렵습니다. 조금 양보해서 ${counter}억 원까지 맞춰주시면 수락하겠습니다."`,
                        `"감독님, ${name}의 가치를 너무 박하게 보시는군요. 우리 보드진의 마지노선은 ${counter}억 원입니다. 다시 검토해 보시죠."`,
                        `"솔직히 ${fee}억 원은 아쉬운 숫자입니다. 서로 한 발씩 물러서서 ${counter}억 원에 합의하는 건 어떻습니까?"`,
                        `"다른 구단에서도 눈독을 들이고 있는 선수입니다. ${counter}억 원 정도는 보장해 주셔야 이적을 승인할 수 있습니다."`,
                        `"에이, ${fee}억 원으론 대체자도 못 구합니다! 최소한 ${counter}억 원은 챙겨주셔야 도장을 찍죠."`
                    ]);
                } else {
                    return pick([
                        `"마지막 기회입니다 감독님. 더 이상 양보는 없습니다. ${counter}억 원, 이 금액이 아니면 통화를 종료하겠습니다."`,
                        `"보드진 회의 결과 ${counter}억 원 밑으로는 절대 불가하다는 결론이 났습니다. 마지막 결단을 내려주시죠."`,
                        `"우리도 인내심에 한계가 있습니다. ${counter}억 원을 수용하시든가, 아니면 여기서 협상을 접어야겠군요."`,
                        `"${fee}억 원은 여전히 부족합니다! 정말 마지막으로 ${counter}억 원까지 낮춰드리겠습니다. 어떻게 하시겠습니까?"`
                    ]);
                }
            }

            case 'CLUB_ACCEPT': {
                const { fee } = ctx;
                return pick([
                    `"좋습니다! ${fee}억 원이면 우리 구단도 만족스러운 거래입니다. 지금 바로 ${name} 선수와 직접 통화를 연결해 드리겠습니다."`,
                    `"결단력 있으시군요 감독님! ${fee}억 원 오퍼 수락합니다. 이제 선수 본인과 개인 조건을 조율해 보시죠."`,
                    `"합의 완료입니다. ${fee}억 원에 이적 동의서를 발송하겠습니다. ${name} 선수가 수화기 건너편에서 기다리고 있습니다."`,
                    `"훌륭한 비즈니스였습니다. ${fee}억 원에 손을 잡죠! 곧바로 선수 개인 회선으로 전환해 드립니다."`,
                    `"어렵게 내린 결정입니다. ${fee}억 원에 ${name}의 이적을 허가합니다. 선수와 좋은 대화 나누시길 바랍니다."`
                ]);
            }

            case 'CLUB_REJECT': {
                return pick([
                    `"이 정도 금액 차이라면 더 이상 시간 낭비할 필요가 없겠군요. 협상 결렬입니다. 이만 끊겠습니다."`,
                    `"장난 전화도 아니고, 그 액수로는 어림도 없습니다! ${name}는 우리 팀에 남습니다. 수고하십시오."`,
                    `"우리 구단과 선수를 무시하는 처사군요. 협상은 여기까지입니다. 당분간 다시 연락하지 마십시오."`,
                    `"입장 차이가 너무 큽니다. 아쉽지만 이번 이적 건은 없던 일로 하겠습니다. 통화 종료합니다."`
                ]);
            }

            case 'SELL_GREETING': {
                const bName = state.buyerTeamName || '상대 구단';
                const f = state.demandedFee || 100;
                return pick([
                    `"감독님 안녕하십니까! ${bName} 단장입니다. 귀 구단의 ${name} 선수를 영입하고자 ${f}억 원을 정식 제안합니다. 이 조건에 보내주시겠습니까?"`,
                    `"좋은 하루입니다 감독님! 우리 ${bName} 보드진에서 ${name} 선수를 절실히 원하고 있습니다. 제안 금액은 ${f}억 원입니다. 협의를 원하시면 말씀해 주십시오."`,
                    `"안녕하십니까! ${bName} 총괄 디렉터입니다. ${name} 선수의 뛰어난 기량을 높이 사서 ${f}억 원 공식 오퍼를 보냈습니다. 조건을 조율해 보시죠."`
                ]);
            }

            case 'SELL_COUNTER': {
                const { fee, counter, round } = ctx;
                const bName = state.buyerTeamName || '상대 구단';
                if (round === 2) {
                    return pick([
                        `"감독님, 요구하신 ${fee}억 원은 우리 구단 예산상 다소 부담스럽습니다. 서로 절충하여 ${counter}억 원에 합의하는 건 어떻습니까?"`,
                        `"솔직히 ${fee}억 원은 높게 느껴집니다. 하지만 ${name} 선수를 꼭 데려오고 싶으니 ${counter}억 원까지 올려서 제안하겠습니다."`,
                        `"보드진과 긴급 상의를 거쳤습니다. ${counter}억 원까지는 예산을 확대할 수 있습니다. 받아들이시겠습니까?"`
                    ]);
                } else {
                    return pick([
                        `"마지막 제안입니다 감독님. ${counter}억 원 이상은 구단 방침상 불가합니다. 결단을 내려주시죠."`,
                        `"우리 구단이 쓸 수 있는 한계치는 ${counter}억 원입니다. 이 금액이 아니면 이번 이적 건은 접어야겠군요."`,
                        `"정말 최종 오퍼입니다. ${counter}억 원에 도장을 찍으시겠습니까, 아니면 협상을 결렬시키겠습니까?"`
                    ]);
                }
            }

            case 'SELL_ACCEPT': {
                const { fee } = ctx;
                const bName = state.buyerTeamName || '상대 구단';
                return pick([
                    `"합의 완료입니다! 요구하신 ${fee}억 원에 ${name} 선수를 영입하겠습니다. 즉시 이적료를 송금하고 절차를 마무리하겠습니다!"`,
                    `"결단에 감사드립니다 감독님! ${fee}억 원에 합의하겠습니다. ${name} 선수는 우리 ${bName}에서 훌륭히 육성하겠습니다."`,
                    `"완벽한 비즈니스였습니다! ${fee}억 원 이적 계약서에 즉시 서명하겠습니다. 협조해 주셔서 감사합니다!"`
                ]);
            }

            case 'SELL_REJECT': {
                const bName = state.buyerTeamName || '상대 구단';
                return pick([
                    `"죄송하지만 그 금액은 저희 ${bName}의 재정 범위를 완전히 벗어납니다. 이번 협상은 여기서 중단하겠습니다."`,
                    `"입장 차이가 너무 커서 더 이상의 대화는 무의미하겠군요. ${name} 영입 제안을 철회하겠습니다."`,
                    `"우리 구단의 제안을 받아들이기 어려우시다면 협상은 여기까지입니다. 통화 종료하겠습니다."`
                ]);
            }

            case 'PLAYER_GREETING': {
                const { wage, isRenewal, remYears } = ctx;
                if (isRenewal) {
                    const renewalLines = [
                        `"감독님, 불러주셔서 감사합니다! 잔여 계약이 ${remYears}년 남았는데, [${roleShort}] 역할과 +${yrs}년 연장에 주급 ${wage}억 원을 희망합니다."`,
                        `"우리 팀과 팬들을 정말 사랑합니다. 앞으로 +${yrs}년 더 헌신하고 싶고, 제 활약에 걸맞은 주급 ${wage}억 원을 부탁드립니다."`,
                        `"재계약 연락을 기다리고 있었습니다 감독님! [${roleShort}] 입지와 주급 ${wage}억 원만 맞춰주시면 두말없이 남겠습니다."`
                    ];
                    if (isStar) {
                        renewalLines.push(`"팀의 에이스로서 트로피를 위해 남고 싶습니다. +${yrs}년 연장 계약과 주급 ${wage}억 원의 최고 대우를 기대합니다."`);
                    }
                    if (isVet) {
                        renewalLines.push(`"베테랑으로서 라커룸의 중심을 잡겠습니다. +${yrs}년 연장과 주급 ${wage}억 원이면 기쁘게 재계약하겠습니다."`);
                    }
                    return pick(renewalLines);
                }

                const lines = [
                    `"여보세요 감독님! 구단 간 합의 소식은 들었습니다. 저는 [${roleShort}] 보장과 ${yrs}년 계약, 주급 ${wage}억 원을 원합니다."`,
                    `"반갑습니다 감독님! 감독님 밑에서 뛰게 될 생각에 설레는군요. 제 희망 조건은 ${yrs}년 계약에 주급 ${wage}억 원입니다."`,
                    `"안녕하세요, ${name}입니다. 새로운 도전을 앞두고 있는 만큼 [${roleShort}] 역할과 주급 ${wage}억 원 정도는 보장받고 싶습니다."`
                ];
                if (isStar) {
                    lines.push(
                        `"빅클럽들의 오퍼가 많았지만 감독님의 프로젝트에 끌렸습니다. 제 이름값에 걸맞게 [${roleShort}] 대우와 주급 ${wage}억 원을 원합니다."`,
                        `"우승 트로피를 들어 올리러 왔습니다. ${yrs}년 계약에 주급 ${wage}억 원이면 주저 없이 합류하겠습니다."`
                    );
                }
                if (isYouth) {
                    lines.push(
                        `"감독님! 저를 주목해 주셔서 영광입니다! 크게 성장할 자신이 있습니다. ${yrs}년 계약에 주급 ${wage}억 원이면 열심히 뛰겠습니다!"`,
                        `"출전 기회를 얻고 발전하고 싶습니다. [${roleShort}] 입지와 주급 ${wage}억 원을 제안해 주시면 최선을 다하겠습니다!"`
                    );
                }
                if (isVet) {
                    lines.push(
                        `"제 축구 인생의 황혼기를 감독님과 함께하고 싶군요. ${yrs}년 계약과 주급 ${wage}억 원이면 노련미를 증명해 보이겠습니다."`
                    );
                }
                if (pos === 'FW') {
                    lines.push(`"득점왕 경쟁을 펼칠 준비가 되어 있습니다! 골로 보답할 테니 [${roleShort}] 보장과 주급 ${wage}억 원을 맞춰주십시오."`);
                } else if (pos === 'GK' || pos === 'DF') {
                    lines.push(`"뒷문을 든든하게 잠가드리겠습니다. ${yrs}년 계약과 주급 ${wage}억 원이면 당장 유니폼을 입겠습니다."`);
                }
                return pick(lines);
            }

            case 'YEARS_CHANGE': {
                const { isRenewal } = ctx;
                const yLabel = isRenewal ? `+${yrs}년 연장` : `${yrs}년 계약`;
                if (isVet && yrs >= 4) {
                    return pick([
                        `"제 나이에 ${yLabel}이라는 장기 보장이라니 감동입니다! 안정적인 만큼 주급은 ${state.demandedWage}억 원까지 낮춰서 받겠습니다."`,
                        `"은퇴할 때까지 믿고 맡겨주시는군요. ${yLabel} 조건이라면 주급 ${state.demandedWage}억 원에 기꺼이 합의하겠습니다."`
                    ]);
                }
                if (isYouth && yrs === 1) {
                    return pick([
                        `"음... ${yLabel}은 미래가 너무 불안정한데요. 그렇게 단기 계약이라면 주급은 최소 ${state.demandedWage}억 원은 주셔야 합니다."`,
                        `"1년 계약이라니 조금 서운하네요. 짧게 계약하는 대신 주급 ${state.demandedWage}억 원은 챙겨주셔야겠습니다."`
                    ]);
                }
                if (yrs >= 4) {
                    return pick([
                        `"${yLabel}으로 제 전성기를 바치는 거군요! 장기 계약인 만큼 주급 ${state.demandedWage}억 원 수준을 희망합니다."`,
                        `"오랫동안 팀의 프로젝트에 함께하라는 뜻이군요. ${yLabel}에 [${roleShort}] 조건이면 주급 ${state.demandedWage}억 원을 원합니다."`
                    ]);
                }
                if (yrs === 1) {
                    return pick([
                        `"${yLabel}로 짧고 굵게 증명하라는 말씀이시군요. 좋습니다, 주급은 ${state.demandedWage}억 원으로 맞춰주시죠."`,
                        `"단기 계약도 나쁘지 않죠. 1년 뒤 가치를 다시 평가받는 조건으로 주급 ${state.demandedWage}억 원을 희망합니다."`
                    ]);
                }
                return pick([
                    `"${yLabel}에 [${roleShort}] 조건이라면 합리적이네요. 주급은 ${state.demandedWage}억 원 수준을 원합니다."`,
                    `"좋습니다. 기간을 ${yLabel}으로 잡는다면 제 희망 주급은 ${state.demandedWage}억 원입니다."`,
                    `"${yLabel} 조건 확인했습니다. 에이전트와 상의해 보니 주급 ${state.demandedWage}억 원이 적당하겠군요."`
                ]);
            }

            case 'ROLE_CHANGE': {
                const { roleDiff } = ctx;
                if (roleDiff <= -2) {
                    return pick([
                        `"잠깐만요 감독님, 제 커리어에 [${roleShort}] 취급은 자존심이 상합니다! 정 그러시다면 주급이라도 ${state.demandedWage}억 원 이상 두둑이 챙겨주셔야 합니다."`,
                        `"벤치만 달구려고 이적하는 게 아닙니다! [${roleShort}] 역할을 감수하라는 거면 주급 ${state.demandedWage}억 원은 주셔야 사인합니다."`,
                        `"솔직히 충격이네요. 저를 [${roleShort}] 자원으로 보신다면 금전적 보상으로 주급 ${state.demandedWage}억 원은 맞춰주십시오."`,
                        `"에이전트가 당장 전화를 끊으라고 난리입니다. [${roleShort}] 조건을 받아들이려면 주급 ${state.demandedWage}억 원은 필수입니다."`
                    ]);
                } else if (roleDiff === -1) {
                    return pick([
                        `"[${roleShort}] 역할이라... 주전 경쟁이 꽤 험난하겠군요. 그렇다면 주급 ${state.demandedWage}억 원은 보장해 주셔야 마음이 동할 것 같습니다."`,
                        `"확실한 주전을 기대했는데 [${roleShort}] 조건이군요. 출전 시간이 줄어드는 만큼 주급은 ${state.demandedWage}억 원을 원합니다."`,
                        `"조금 아쉽긴 하지만 실력으로 증명하죠. 대신 [${roleShort}] 조건이라면 주급 ${state.demandedWage}억 원은 맞춰주십시오."`
                    ]);
                } else if (roleDiff >= 1) {
                    return pick([
                        `"와, 저를 팀의 [${roleShort}] 자원으로까지 믿어주시다니 감격스럽습니다! 주급을 ${state.demandedWage}억 원으로 양보해서라도 꼭 보답하겠습니다!"`,
                        `"감독님의 전폭적인 신뢰가 느껴집니다! [${roleShort}] 보장이라면 돈보다 명예죠. 주급 ${state.demandedWage}억 원에 당장 계약하겠습니다!"`,
                        `"선수로서 가장 듣고 싶던 말입니다. [${roleShort}] 대우에 감사드리며, 주급 요구액도 ${state.demandedWage}억 원으로 낮추겠습니다."`
                    ]);
                } else {
                    return pick([
                        `"[${roleShort}] 역할, 딱 제 실력에 맞는 합리적인 대우네요. 주급 ${state.demandedWage}억 원을 제안해 주시면 좋겠습니다."`,
                        `"네, 저 역시 팀에서 [${roleShort}] 역할을 맡는 게 이상적이라고 봅니다. 희망 주급은 ${state.demandedWage}억 원입니다."`,
                        `"[${roleShort}] 입지 조건 좋습니다. 주급 ${state.demandedWage}억 원만 맞춰주시면 흔쾌히 도장을 찍겠습니다."`
                    ]);
                }
            }

            case 'PLAYER_COUNTER': {
                const { wage, counter, round } = ctx;
                if (round === 2) {
                    return pick([
                        `"감독님, 주급 ${wage}억 원은 제 기대치보다 조금 낮습니다. ${counter}억 원 정도만 맞춰주시면 기분 좋게 사인하겠습니다."`,
                        `"에이전트와 계산기를 두드려 봤는데, 세금 빼고 나면 ${wage}억 원은 아쉽습니다. 주급 ${counter}억 원을 역제안드립니다."`,
                        `"팀 프로젝트는 마음에 들지만 프로는 연봉으로 말하는 법이죠. ${counter}억 원까지 올려주실 수 있나요?"`,
                        `"솔직히 다른 구단에서는 더 높은 주급을 불렀습니다. 감독님을 봐서 ${counter}억 원까지 양보할 테니 맞춰주십시오."`,
                        `"조금만 더 성의를 보여주시면 좋겠습니다 감독님. 주급 ${counter}억 원이면 두말없이 유니폼을 입겠습니다."`
                    ]);
                } else {
                    return pick([
                        `"저도 많이 양보했습니다 감독님. 주급 ${counter}억 원이 제 최종 마지노선입니다. 결단을 내려주세요!"`,
                        `"더 이상 주급을 깎는 건 어렵습니다. ${counter}억 원, 이 조건이 아니면 이번 계약은 없던 일로 해야 할 것 같습니다."`,
                        `"에이전트는 떠나자고 하지만 제가 마지막으로 붙잡았습니다. 주급 ${counter}억 원만 보장해 주십시오!"`,
                        `"진짜 마지막 제안입니다. 주급 ${counter}억 원에 합의하시죠. 그렇지 않으면 통화를 마쳐야 할 것 같습니다."`
                    ]);
                }
            }

            case 'PLAYER_ACCEPT': {
                const { isRenewal } = ctx;
                if (isRenewal) {
                    return pick([
                        `"최고의 대우에 감사드립니다 감독님! [${roleShort}]으로서 앞으로 +${yrs}년 더 이 구단에 뼈를 묻겠습니다!"`,
                        `"재계약 완료입니다! 팬들에게 곧바로 잔류 소식을 전하겠습니다. 이번 시즌 우승까지 달려보시죠!"`,
                        `"역시 감독님은 저를 믿어주실 줄 알았습니다! +${yrs}년 동안 경기장에서 모든 걸 쏟아붓겠습니다!"`,
                        `"서명 완료했습니다 감독님! 새 계약서 잉크가 마르기도 전에 다음 경기에서 득점포로 보답하겠습니다!"`
                    ]);
                }
                return pick([
                    `"${yrs}년 계약에 [${roleShort}] 조건, 완벽합니다! 지금 바로 계약서에 서명하겠습니다. 훈련장에서 뵙겠습니다 감독님!"`,
                    `"드디어 오피셜을 찍는군요! 감독님과 함께할 앞으로의 ${yrs}년이 정말 기대됩니다. 최선을 다하겠습니다!"`,
                    `"계약 성사입니다! 에이전트에게 당장 짐 싸라고 전하겠습니다. 팬들에게 최고의 퍼포먼스를 보여드리죠!"`,
                    `"믿고 영입해 주셔서 감사합니다 감독님. 제 발끝으로 왜 저를 선택하셨는지 증명해 보이겠습니다!"`,
                    `"합의 완료! 메디컬 테스트와 프로필 촬영 준비하겠습니다. 불러만 주십시오 감독님!"`
                ]);
            }

            case 'PLAYER_REJECT': {
                return pick([
                    `"제 가치를 너무 낮게 평가하시는군요. 이 조건으로는 도저히 사인할 수 없습니다. 통화를 종료하겠습니다."`,
                    `"아쉽지만 서로 생각하는 조건 차이가 너무 큽니다. 좋은 인연이 아닌 것 같네요. 안녕히 계십시오."`,
                    `"프로의 세계에서 이 정도 대우는 받아들이기 힘듭니다. 다른 구단의 오퍼를 알아보겠습니다. 이만 끊겠습니다."`,
                    `"기대하고 통화를 시작했는데 실망스럽군요. 협상은 여기서 끝내겠습니다. 수고하십시오 감독님."`
                ]);
            }

            default:
                return `"조건을 검토하고 있습니다..."`;
        }
    }

    adjustContractYears(delta) {
        if (!this.chatState || (this.chatState.step !== 'WAGE' && this.chatState.step !== 'RENEWAL')) return;
        const state = this.chatState;
        const isRenewal = (state.step === 'RENEWAL');
        const minY = 1;
        const maxY = isRenewal ? 4 : 5;

        const nextY = Math.max(minY, Math.min(maxY, (state.contractYears || 3) + delta));
        if (nextY === state.contractYears) return;
        state.contractYears = nextY;

        this.recalcPersonalTermsDemand();
        this.updatePersonalTermsRowUI();

        this.setFcDialogue(this.pickNegotiationLine('YEARS_CHANGE', { isRenewal }));
        this.setupChatInput(state.step);
        this.updateFcBudgetSummary();
    }

    adjustSquadRole(delta) {
        if (!this.chatState || (this.chatState.step !== 'WAGE' && this.chatState.step !== 'RENEWAL')) return;
        const state = this.chatState;
        const nextIdx = Math.max(0, Math.min(3, (state.squadRoleIdx ?? 2) + delta));
        if (nextIdx === state.squadRoleIdx) return;
        state.squadRoleIdx = nextIdx;

        this.recalcPersonalTermsDemand();
        this.updatePersonalTermsRowUI();

        const roleDiff = nextIdx - state.expectedRoleIdx;

        if (roleDiff <= -2) {
            this.updateTensionUI('HIGH', state.round);
        } else if (roleDiff === -1) {
            this.updateTensionUI('MEDIUM', state.round);
        } else {
            this.updateTensionUI('LOW', state.round);
        }

        this.setFcDialogue(this.pickNegotiationLine('ROLE_CHANGE', { roleDiff }));
        this.setupChatInput(state.step);
        this.updateFcBudgetSummary();
    }

    updatePersonalTermsRowUI() {
        if (!this.chatState) return;
        const state = this.chatState;
        const isRenewal = (state.step === 'RENEWAL');
        const stepVal1 = document.getElementById('fcRow1StepValue');
        const stepVal2 = document.getElementById('fcRow2StepValue');

        if (stepVal1) {
            stepVal1.textContent = isRenewal ? `+${state.contractYears} YEARS (연장)` : `${state.contractYears} YEARS (계약)`;
        }
        if (stepVal2) {
            const roleMeta = this.getSquadRoleMeta(state.squadRoleIdx);
            stepVal2.textContent = roleMeta.label;
        }
    }

    openFcNegotiationUI(mode) {
        const modal = document.getElementById('negotiationChatModal');
        if (!modal || !this.chatState) return;

        const state = this.chatState;
        const player = state.player;

        // 모달 표시
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.pointerEvents = 'auto';

        // 우측 선수 스펙 카드 세팅
        const posText = player.position || 'FW';
        const ovrVal = Math.floor(player.rating || 75);
        const estValue = player.price || Math.round(this.calculatePlayerPrice(player));
        const estWage = state.demandedWage || this.calculateNegotiatedWeeklyWage(player);

        const setElText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setElText('chatPlayerName', player.name);
        setElText('fcCardWatermark', posText);
        setElText('fcCardCountry', player.country ? player.country.substring(0, 3).toUpperCase() : 'PRO');
        setElText('fcCardAge', player.age || 24);
        setElText('fcCardPos', posText);
        setElText('fcCardOvr', ovrVal);
        setElText('fcCardValue', `${estValue}억 원`);
        setElText('fcCardWage', `${estWage}억 / 주`);

        const miniFace = document.getElementById('fcCardMiniFace');
        if (miniFace && typeof setPlayerPhoto === 'function') {
            setPlayerPhoto(miniFace, player);
        }

        // 단계별 UI 전환
        this.renderFcStage(mode);
    }

    renderFcStage(step) {
        if (!this.chatState) return;
        const state = this.chatState;
        const player = state.player;
        state.step = step;
        state.round = 1;
        state.tension = 'LOW';

        const avatarWrap = document.getElementById('fcCallerAvatar');
        const input = document.getElementById('chatFeeInput');
        const tacRow1 = document.getElementById('fcTacticalRow1');
        const tacRow2 = document.getElementById('fcTacticalRow2');
        const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
        if (acceptCounterBtn) acceptCounterBtn.style.display = 'none';

        const setElText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        const row1Ctrl = document.getElementById('fcRow1Control');
        const row1Val = document.getElementById('fcRow1Value');
        const row2Ctrl = document.getElementById('fcRow2Control');
        const row2Val = document.getElementById('fcRow2Value');

        if (step === 'FEE') {
            // 1단계: 구단 대 구단 이적료 협상 (상대 구단 로고 통화)
            const clubDisplayName = (typeof teamNames !== 'undefined' && teamNames[player.originalTeam]) || player.originalTeam || '소속 구단';
            setElText('fcStepTag', 'STEP 1 · CLUB TO CLUB NEGOTIATION');
            setElText('fcMainHeading', 'TRANSFER PLAYER');
            setElText('fcPhoneTopLabel', 'Club Boardroom Line');
            setElText('chatTeamName', clubDisplayName);
            setElText('fcCallerRole', `${clubDisplayName} Board Representative`);

            setElText('fcRow1Label', '합류 시점 (Start Date)');
            setElText('fcRow1Value', 'IMMEDIATE');
            if (row1Ctrl) row1Ctrl.style.display = 'none';
            if (row1Val) row1Val.style.display = 'inline';

            setElText('fcActiveTermLabel', '이적료 제안 (Transfer Fee)');
            setElText('fcAmountUnit', '억 원');
            setElText('fcRow2Label', '분할 지급 (Instalments)');
            setElText('fcRow2Value', 'NONE (일시불)');
            if (row2Ctrl) row2Ctrl.style.display = 'none';
            if (row2Val) row2Val.style.display = 'inline';

            setElText('fcRow3Label', '셀온 및 기타 조항');
            setElText('fcRow3Value', 'INCLUDED');

            if (tacRow1) tacRow1.style.display = 'flex';
            if (tacRow2) tacRow2.style.display = 'flex';

            // 상대 구단 로고 렌더링
            if (avatarWrap) {
                avatarWrap.replaceChildren();
                if (typeof createTeamLogoElement === 'function' && player.originalTeam && player.originalTeam !== '외부리그') {
                    const logoEl = createTeamLogoElement(player.originalTeam);
                    if (logoEl && logoEl.nodeType) {
                        avatarWrap.appendChild(logoEl);
                    }
                }
                if (!avatarWrap.hasChildNodes()) {
                    const fallbackBadge = document.createElement('div');
                    fallbackBadge.className = 'fc-caller-club-fallback';
                    fallbackBadge.textContent = clubDisplayName.substring(0, 2).toUpperCase();
                    avatarWrap.appendChild(fallbackBadge);
                }
            }

            if (input) {
                input.step = '10';
                input.min = '1';
                input.value = player.price;
            }

            this.setFcDialogue(this.pickNegotiationLine('CLUB_GREETING'));
        } else if (step === 'WAGE' || step === 'RENEWAL') {
            // 2단계: 선수 직접 통화 (주급 협상 / 재계약)
            const isRenewal = (step === 'RENEWAL');
            setElText('fcStepTag', isRenewal ? 'CONTRACT RENEWAL · DIRECT CALL' : 'STEP 2 · PERSONAL TERMS');
            setElText('fcMainHeading', isRenewal ? 'RENEW CONTRACT' : 'PLAYER CONTRACT');
            setElText('fcPhoneTopLabel', isRenewal ? 'Squad Contract Desk' : 'Player & Agent Line');
            setElText('chatTeamName', player.name);
            setElText('fcCallerRole', `${player.position} · OVR ${Math.floor(player.rating || 75)} · Personal Line`);

            setElText('fcRow1Label', isRenewal ? '연장 기간 (Extension)' : '계약 기간 (Contract Length)');
            if (row1Ctrl) row1Ctrl.style.display = 'inline-flex';
            if (row1Val) row1Val.style.display = 'none';

            setElText('fcActiveTermLabel', '주급 조건 (Weekly Wage)');
            setElText('fcAmountUnit', '억 / 주');
            setElText('fcRow2Label', '주전 위상 (Squad Role)');
            if (row2Ctrl) row2Ctrl.style.display = 'inline-flex';
            if (row2Val) row2Val.style.display = 'none';

            setElText('fcRow3Label', '클린시트/득점 수당');
            setElText('fcRow3Value', 'INCLUDED');

            if (tacRow1) tacRow1.style.display = 'none';
            if (tacRow2) tacRow2.style.display = 'none';

            // 계약 기간 & 주전 위상 UI 및 요구 주급 계산
            this.recalcPersonalTermsDemand();
            this.updatePersonalTermsRowUI();

            // 선수 실제 얼굴 사진 렌더링
            if (avatarWrap) {
                avatarWrap.replaceChildren();
                const faceImg = document.createElement('img');
                faceImg.className = 'fc-caller-face-img';
                faceImg.src = 'assets/players/default.webp';
                faceImg.alt = player.name;
                avatarWrap.appendChild(faceImg);
                if (typeof setPlayerPhoto === 'function') {
                    setPlayerPhoto(faceImg, player);
                }
            }

            const targetWage = state.demandedWage || this.calculateNegotiatedWeeklyWage(player);
            state.demandedWage = targetWage;

            if (input) {
                input.step = '0.2';
                input.min = '0.1';
                input.value = targetWage;
            }

            const remYears = (typeof contractSystem !== 'undefined') ? contractSystem.getPlayerContractYears(player) : 1;
            this.setFcDialogue(this.pickNegotiationLine('PLAYER_GREETING', {
                wage: targetWage,
                isRenewal,
                remYears
            }));
        } else if (step === 'SELL') {
            // [신규] 우리 구단 선수 판매: 상대 구단 단장과 이적료 밀당 협상
            const buyerDisplayName = state.buyerTeamName || '영입 희망 구단';
            setElText('fcStepTag', 'TRANSFER OUT · INCOMING OFFER');
            setElText('fcMainHeading', 'SELL PLAYER');
            setElText('fcPhoneTopLabel', 'Transfer Desk · Incoming Call');
            setElText('chatTeamName', buyerDisplayName);
            setElText('fcCallerRole', `${buyerDisplayName} 단장 (Head of Recruitment)`);

            setElText('fcRow1Label', '이적 형태 (Transfer Type)');
            setElText('fcRow1Value', 'PERMANENT (완전 이적)');
            if (row1Ctrl) row1Ctrl.style.display = 'none';
            if (row1Val) row1Val.style.display = 'inline';

            setElText('fcActiveTermLabel', '요구 이적료 (Demanded Transfer Fee)');
            setElText('fcAmountUnit', '억 원');
            setElText('fcRow2Label', '선수 시장 가치 (Market Value)');
            setElText('fcRow2Value', `${state.marketValue || 0}억 원`);
            if (row2Ctrl) row2Ctrl.style.display = 'none';
            if (row2Val) row2Val.style.display = 'inline';

            setElText('fcRow3Label', '대금 정산 방식');
            setElText('fcRow3Value', '전액 구단 자금 즉시 입금');

            if (tacRow1) tacRow1.style.display = 'none';
            if (tacRow2) tacRow2.style.display = 'none';

            // 구매 희망 구단 로고 렌더링
            if (avatarWrap) {
                avatarWrap.replaceChildren();
                if (typeof createTeamLogoElement === 'function' && state.buyerTeamKey && state.buyerTeamKey !== '외부리그') {
                    const logoEl = createTeamLogoElement(state.buyerTeamKey);
                    if (logoEl && logoEl.nodeType) {
                        avatarWrap.appendChild(logoEl);
                    }
                }
                if (!avatarWrap.hasChildNodes()) {
                    const fallbackBadge = document.createElement('div');
                    fallbackBadge.className = 'fc-caller-club-fallback';
                    fallbackBadge.textContent = buyerDisplayName.substring(0, 2).toUpperCase();
                    avatarWrap.appendChild(fallbackBadge);
                }
            }

            if (input) {
                input.step = '5';
                input.min = '1';
                input.value = state.demandedFee || 100;
            }

            this.setFcDialogue(this.pickNegotiationLine('SELL_GREETING'));
        }

        this.updateTensionUI('LOW', 1);
        this.setupChatInput(step);
        this.updateFcBudgetSummary();
    }

    setFcDialogue(text) {
        const diagEl = document.getElementById('fcDialogueText');
        if (diagEl) {
            diagEl.classList.remove('fc-diag-pop');
            void diagEl.offsetWidth;
            diagEl.textContent = text;
            diagEl.classList.add('fc-diag-pop');
        }
        const wave = document.getElementById('fcVoiceWave');
        if (wave) {
            wave.classList.add('speaking');
            clearTimeout(this._waveTimer);
            this._waveTimer = setTimeout(() => wave.classList.remove('speaking'), 2200);
        }
    }

    updateTensionUI(level, round) {
        const badge = document.getElementById('fcTensionBadge');
        const roundEl = document.getElementById('fcRoundBadge');
        if (badge) {
            badge.className = 'fc-tension-pill';
            if (level === 'LOW') {
                badge.classList.add('low');
                badge.textContent = 'Low Tension · 우호적';
            } else if (level === 'MEDIUM') {
                badge.classList.add('medium');
                badge.textContent = 'Medium Tension · 줄다리기 중';
            } else {
                badge.classList.add('high');
                badge.textContent = 'High Tension · 결렬 주의';
            }
        }
        if (roundEl && this.chatState) {
            roundEl.textContent = `Round ${round || this.chatState.round} / ${this.chatState.maxRounds}`;
        }
    }

    adjustOfferValue(direction) {
        if (!this.chatState || this.chatState.step === 'WAITING') return;
        const input = document.getElementById('chatFeeInput');
        if (!input) return;

        let current = parseFloat(input.value) || 0;
        if (this.chatState.step === 'FEE' || this.chatState.step === 'SELL') {
            const base = this.chatState.demandedFee || 100;
            const stepAmt = Math.max(5, Math.round((base * 0.05) / 5) * 5);
            current = Math.max(5, Math.round(current + direction * stepAmt));
            input.value = current;
        } else {
            const base = this.chatState.demandedWage || 5;
            const stepAmt = base >= 10 ? 0.5 : 0.2;
            current = Math.max(0.2, parseFloat((current + direction * stepAmt).toFixed(2)));
            input.value = current;
        }
        this.updateFcBudgetSummary();
    }

    onManualAmountInput() {
        this.updateFcBudgetSummary();
    }

    updateFcBudgetSummary() {
        if (!this.chatState) return;
        const state = this.chatState;
        const input = document.getElementById('chatFeeInput');
        const val = parseFloat(input ? input.value : 0) || 0;

        const setElText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        const val3El = document.getElementById('fcSummaryVal3');

        if (state.step === 'FEE') {
            const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
            const remaining = Math.round(currentMoney - val);
            setElText('fcSummaryLbl1', '제안 이적료 / 구단 기준가');
            setElText('fcSummaryVal1', `${Math.round(val)}억 / ${state.demandedFee}억`);
            setElText('fcSummaryLbl2', '상대 구단 역제안 (Counter)');
            setElText('fcSummaryVal2', state.counterFee ? `${state.counterFee}억 원 요구` : '없음 (첫 제안 대기)');
            setElText('fcSummaryLbl3', '타결 시 잔여 이적 자금');
            setElText('fcSummaryVal3', `${remaining}억 원`);
            if (val3El) val3El.style.color = remaining >= 0 ? '#F8FAFC' : '#EF4444';
        } else if (state.step === 'WAGE') {
            const availWage = this.getAvailableWageBudget(gameData.selectedTeam);
            const remaining = parseFloat((availWage - val).toFixed(2));
            setElText('fcSummaryLbl1', '제안 주급 / 선수 희망 주급');
            setElText('fcSummaryVal1', `${val}억 / ${state.demandedWage}억`);
            setElText('fcSummaryLbl2', '선수 측 역제안 (Counter)');
            setElText('fcSummaryVal2', state.counterWage ? `주급 ${state.counterWage}억 요구` : '없음 (협상 중)');
            setElText('fcSummaryLbl3', '타결 시 잔여 주급 여유분');
            setElText('fcSummaryVal3', `${remaining}억 / 주`);
            if (val3El) val3El.style.color = remaining >= 0 ? '#F8FAFC' : '#EF4444';
        } else if (state.step === 'RENEWAL') {
            const currentWage = state.player.weeklyWage || 0;
            const diff = parseFloat((val - currentWage).toFixed(2));
            const availWage = this.getAvailableWageBudget(gameData.selectedTeam);
            const remaining = parseFloat((availWage - diff).toFixed(2));
            setElText('fcSummaryLbl1', '제안 주급 / 현재 주급');
            setElText('fcSummaryVal1', `${val}억 / ${currentWage}억`);
            setElText('fcSummaryLbl2', '선수 요구 주급');
            setElText('fcSummaryVal2', `${state.counterWage || state.demandedWage}억 / 주`);
            setElText('fcSummaryLbl3', '재계약 후 잔여 주급 여유분');
            setElText('fcSummaryVal3', `${remaining}억 / 주`);
            if (val3El) val3El.style.color = remaining >= 0 ? '#F8FAFC' : '#EF4444';
        } else if (state.step === 'SELL') {
            const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;
            const projected = Math.round(currentMoney + val);
            setElText('fcSummaryLbl1', '우리 요구액 / 상대 제시액');
            setElText('fcSummaryVal1', `${Math.round(val)}억 / ${state.demandedFee}억`);
            setElText('fcSummaryLbl2', '상대 구단 제안 (Current Offer)');
            setElText('fcSummaryVal2', state.counterFee ? `${state.counterFee}억 원 제시` : `${state.demandedFee}억 원 (원 제안)`);
            setElText('fcSummaryLbl3', '타결 시 구단 보유 자금');
            setElText('fcSummaryVal3', `${projected}억 원 (+${Math.round(val)}억)`);
            if (val3El) val3El.style.color = '#10B981';
        }
    }

    acceptCounterOffer() {
        if (!this.chatState) return;
        const input = document.getElementById('chatFeeInput');
        if (!input) return;

        if (this.chatState.step === 'SELL') {
            const acceptedFee = this.chatState.counterFee || this.chatState.demandedFee;
            if (acceptedFee) {
                input.value = acceptedFee;
                this.updateFcBudgetSummary();
                this.sendNegotiationChat();
            }
        } else if (this.chatState.step === 'FEE' && this.chatState.counterFee) {
            input.value = this.chatState.counterFee;
            this.updateFcBudgetSummary();
            this.sendNegotiationChat();
        } else if ((this.chatState.step === 'WAGE' || this.chatState.step === 'RENEWAL') && this.chatState.counterWage) {
            input.value = this.chatState.counterWage;
            this.updateFcBudgetSummary();
            this.sendNegotiationChat();
        }
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
        if (messagesDiv) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${sender}`;
            msgDiv.innerText = text;
            messagesDiv.appendChild(msgDiv);
        }
        if (sender === 'ai' || sender === 'system') {
            this.setFcDialogue(`"${text}"`);
        }
    }

    setupChatInput(step) {
        const input = document.getElementById('chatFeeInput');
        const btn = document.getElementById('chatSendBtn');
        const quickReplies = document.getElementById('chatQuickReplies');
        const downBtn = document.getElementById('fcStepDownBtn');
        const upBtn = document.getElementById('fcStepUpBtn');

        if (!quickReplies || !this.chatState) return;
        quickReplies.replaceChildren();

        if (step === 'FEE') {
            if (input) input.disabled = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Make Offer · 이적료 제안';
            }
            if (downBtn) downBtn.disabled = false;
            if (upBtn) upBtn.disabled = false;

            const p = this.chatState.demandedFee || this.chatState.player.price;
            const presets = [
                { label: `100% (${p}억)`, val: p },
                { label: `90% (${Math.round(p * 0.9)}억)`, val: Math.round(p * 0.9) },
                { label: `80% (${Math.round(p * 0.8)}억)`, val: Math.round(p * 0.8) }
            ];
            presets.forEach(item => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'fc-preset-chip';
                chip.textContent = item.label;
                chip.onclick = () => {
                    if (input) input.value = item.val;
                    this.updateFcBudgetSummary();
                };
                quickReplies.appendChild(chip);
            });

            // 좌측 전술적 액션 슬롯 렌더링 (언론 유출 & 동포 설득)
            const targetPlayer = this.chatState.player;
            const playerKey = `${targetPlayer.name}_${targetPlayer.originalTeam}`;
            const offerData = window.GameState ? window.GameState.getTransferOffer(playerKey) : (gameData.transferOffers ? gameData.transferOffers[playerKey] : null);
            const hasMediaPlayed = !!(offerData && offerData.hasMediaPlayed);
            const hasSocialized = !!(offerData && offerData.hasSocialized);

            const mediaSlot = document.getElementById('fcMediaActionSlot');
            if (mediaSlot) {
                mediaSlot.replaceChildren();
                const mBtn = document.createElement('button');
                mBtn.type = 'button';
                mBtn.className = 'fc-tactical-chip' + (hasMediaPlayed ? ' done' : '');
                mBtn.textContent = hasMediaPlayed ? 'INCLUDED (완료)' : '언론 유출 실행';
                mBtn.disabled = hasMediaPlayed;
                mBtn.onclick = () => {
                    this.doMediaPlay(targetPlayer.name, targetPlayer.originalTeam, true);
                    mBtn.textContent = 'INCLUDED (완료)';
                    mBtn.classList.add('done');
                    mBtn.disabled = true;
                };
                mediaSlot.appendChild(mBtn);
            }

            const socialSlot = document.getElementById('fcSocialActionSlot');
            if (socialSlot) {
                socialSlot.replaceChildren();
                const myTeamPlayers = teams[gameData.selectedTeam];
                let persuader = null;
                if (myTeamPlayers && targetPlayer.country) {
                    const sameCountryPlayers = myTeamPlayers.filter(p => p.country === targetPlayer.country && p.name !== targetPlayer.name);
                    if (sameCountryPlayers.length > 0) {
                        persuader = sameCountryPlayers.sort((a, b) => b.rating - a.rating)[0];
                    }
                }

                const sBtn = document.createElement('button');
                sBtn.type = 'button';
                if (persuader) {
                    sBtn.className = 'fc-tactical-chip' + (hasSocialized ? ' done' : ' active');
                    sBtn.textContent = hasSocialized ? 'INCLUDED (완료)' : `${persuader.name} 통해 설득`;
                    sBtn.disabled = hasSocialized;
                    sBtn.onclick = () => {
                        this.doSocialize(targetPlayer.name, targetPlayer.originalTeam, true, persuader.name);
                        sBtn.textContent = 'INCLUDED (완료)';
                        sBtn.classList.add('done');
                        sBtn.disabled = true;
                    };
                } else {
                    sBtn.className = 'fc-tactical-chip disabled';
                    sBtn.textContent = 'NONE (동포 없음)';
                    sBtn.disabled = true;
                }
                socialSlot.appendChild(sBtn);
            }
        } else if (step === 'WAGE' || step === 'RENEWAL') {
            if (input) input.disabled = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = step === 'RENEWAL' ? 'Make Offer · 재계약 제안' : 'Make Offer · 주급 제안';
            }
            if (downBtn) downBtn.disabled = false;
            if (upBtn) upBtn.disabled = false;

            const w = this.chatState.demandedWage || this.calculateNegotiatedWeeklyWage(this.chatState.player);
            const presets = [
                { label: `요구액 (${w}억)`, val: w },
                { label: `95% (${parseFloat((w * 0.95).toFixed(2))}억)`, val: parseFloat((w * 0.95).toFixed(2)) },
                { label: `90% (${parseFloat((w * 0.9).toFixed(2))}억)`, val: parseFloat((w * 0.9).toFixed(2)) }
            ];
            presets.forEach(item => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'fc-preset-chip';
                chip.textContent = item.label;
                chip.onclick = () => {
                    if (input) input.value = item.val;
                    this.updateFcBudgetSummary();
                };
                quickReplies.appendChild(chip);
            });
        } else if (step === 'SELL') {
            if (input) input.disabled = false;
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Make Counter Offer · 역제안 전송';
            }
            if (downBtn) downBtn.disabled = false;
            if (upBtn) upBtn.disabled = false;

            const baseFee = this.chatState.demandedFee || 100;
            const presets = [
                { label: `원 제안 (${baseFee}억)`, val: baseFee },
                { label: `+10% (${Math.round(baseFee * 1.1)}억)`, val: Math.round(baseFee * 1.1) },
                { label: `+20% (${Math.round(baseFee * 1.2)}억)`, val: Math.round(baseFee * 1.2) },
                { label: `+30% (${Math.round(baseFee * 1.3)}억)`, val: Math.round(baseFee * 1.3) }
            ];
            presets.forEach(item => {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'fc-preset-chip';
                chip.textContent = item.label;
                chip.onclick = () => {
                    if (input) input.value = item.val;
                    this.updateFcBudgetSummary();
                };
                quickReplies.appendChild(chip);
            });

            const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
            if (acceptCounterBtn) {
                acceptCounterBtn.style.display = 'inline-flex';
                acceptCounterBtn.textContent = `현재 제안 수락 (${baseFee}억 원)`;
            }
        } else {
            if (input) input.disabled = true;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '상대방 응답 대기 중...';
            }
            if (downBtn) downBtn.disabled = true;
            if (upBtn) upBtn.disabled = true;
        }
    }

    sendNegotiationChat() {
        const input = document.getElementById('chatFeeInput');
        const val = parseFloat(input ? input.value : 0);

        if (isNaN(val) || val <= 0) {
            alert("올바른 금액을 입력하세요.");
            return;
        }

        const state = this.chatState;
        if (!state || state.step === 'WAITING') return;
        const player = state.player;
        const prevStep = state.step;

        if (prevStep === 'FEE') {
            const fee = Math.round(val);
            const currentMoney = window.GameState ? window.GameState.get().teamMoney : gameData.teamMoney;

            if (currentMoney < fee) {
                this.setFcDialogue(`"잠깐만요, 구단 보유 이적 자금(${currentMoney}억 원)이 제안 금액보다 부족합니다."`);
                return;
            }

            this.setupChatInput('WAITING');
            this.setFcDialogue(`"${fee}억 원 제안을 검토하고 있습니다..."`);

            setTimeout(() => {
                if (!this.chatState) return;
                const targetPrice = state.counterFee || state.demandedFee || player.price;
                let accepted = false;

                if (fee >= targetPrice) {
                    accepted = true;
                } else {
                    const sellerTeamKey = player.originalTeam;
                    let chance = this.calculateFeeNegotiationChance(sellerTeamKey, fee, player.price);
                    // 언론 플레이 및 설득 호감도 보너스 반영
                    const playerKey = `${player.name}_${player.originalTeam}`;
                    const offerData = window.GameState ? window.GameState.getTransferOffer(playerKey) : (gameData.transferOffers ? gameData.transferOffers[playerKey] : null);
                    if (offerData && offerData.favorability) {
                        chance += offerData.favorability * 0.5;
                    }
                    accepted = Math.random() <= chance;
                }

                if (accepted) {
                    state.fee = fee;
                    this.updateTensionUI('LOW', state.round);
                    this.setFcDialogue(this.pickNegotiationLine('CLUB_ACCEPT', { fee }));

                    const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                    if (acceptCounterBtn) acceptCounterBtn.style.display = 'none';

                    setTimeout(() => {
                        if (!this.chatState) return;
                        this.renderFcStage('WAGE');
                    }, 1500);
                } else {
                    // 너무 터무니없는 금액(65% 미만)이거나 3라운드 초과 시 결렬
                    const ratio = fee / player.price;
                    if (state.round >= state.maxRounds || ratio < 0.65) {
                        this.recordFailure(player);
                        this.updateTensionUI('HIGH', state.round);
                        this.setFcDialogue(this.pickNegotiationLine('CLUB_REJECT'));
                        setTimeout(() => this.closeNegotiationChat(), 2200);
                    } else {
                        // 멀티 라운드 카운터 오퍼 (밀당)
                        state.round++;
                        const discountFactor = state.round === 2 ? 0.95 : 0.91;
                        const newCounter = Math.max(fee + 5, Math.round(player.price * discountFactor));
                        state.counterFee = newCounter;

                        const nextTension = state.round >= 3 ? 'HIGH' : 'MEDIUM';
                        this.updateTensionUI(nextTension, state.round);
                        this.setFcDialogue(this.pickNegotiationLine('CLUB_COUNTER', {
                            fee,
                            counter: newCounter,
                            round: state.round
                        }));

                        const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                        if (acceptCounterBtn) {
                            acceptCounterBtn.style.display = 'inline-flex';
                            acceptCounterBtn.textContent = `역제안 수락 (${newCounter}억 원)`;
                        }

                        this.setupChatInput('FEE');
                        this.updateFcBudgetSummary();
                    }
                }
            }, 900);
        } else if (prevStep === 'WAGE' || prevStep === 'RENEWAL') {
            const isRenewal = (prevStep === 'RENEWAL');
            const wage = parseFloat(val.toFixed(2));
            const availableWageBudget = this.getAvailableWageBudget(gameData.selectedTeam);
            const neededWage = isRenewal ? Math.max(0, parseFloat((wage - (player.weeklyWage || 0)).toFixed(2))) : wage;

            if (availableWageBudget < neededWage) {
                this.setFcDialogue(`"구단 잔여 여유 주급(${availableWageBudget}억/주)이 부족합니다. (필요: ${neededWage}억/주) 재정 탭에서 이적 자금을 전환하거나 선수를 방출해 주세요."`);
                return;
            }

            this.setupChatInput('WAITING');
            this.setFcDialogue(`"주급 ${wage}억 원 조건을 검토 중입니다..."`);

            setTimeout(() => {
                if (!this.chatState) return;
                const targetWage = state.counterWage || state.demandedWage;
                let accepted = false;

                if (wage >= targetWage) {
                    accepted = true;
                } else {
                    const chance = this.calculateWageNegotiationChance(player, wage);
                    const transferChance = isRenewal ? 0.95 : this.calculateTransferSuccessChance(player);
                    const roleBonus = (state.squadRoleIdx - state.expectedRoleIdx) * 0.08;
                    const finalChance = Math.max(0.05, Math.min(0.95, (chance * transferChance) + roleBonus));
                    accepted = Math.random() <= finalChance;
                }

                if (accepted) {
                    state.wage = wage;
                    this.updateTensionUI('LOW', state.round);
                    const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                    if (acceptCounterBtn) acceptCounterBtn.style.display = 'none';
                    const roleMeta = this.getSquadRoleMeta(state.squadRoleIdx);

                    this.setFcDialogue(this.pickNegotiationLine('PLAYER_ACCEPT', { isRenewal }));

                    if (isRenewal) {
                        setTimeout(() => {
                            if (typeof contractSystem !== 'undefined') {
                                player.weeklyWage = wage;
                                player.contractYears = Math.min(5, contractSystem.getPlayerContractYears(player) + (state.contractYears || 2));
                                player.squadRole = roleMeta.id;
                                if (typeof calculateTotalWages === 'function') calculateTotalWages();
                                if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
                                if (typeof updateDisplay === 'function') updateDisplay();
                                if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
                                const finPanel = document.getElementById('finance');
                                if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
                                    renderFinanceTab();
                                }
                            }
                            this.closeNegotiationChat();
                        }, 1600);
                    } else {
                        setTimeout(() => {
                            this.finalizeChatTransfer(player, state.fee, state.wage, state.contractYears, roleMeta.id);
                            this.closeNegotiationChat();
                        }, 1600);
                    }
                } else {
                    const ratio = wage / state.demandedWage;
                    if (state.round >= state.maxRounds || ratio < 0.72) {
                        if (!isRenewal) this.recordFailure(player);
                        this.updateTensionUI('HIGH', state.round);
                        this.setFcDialogue(this.pickNegotiationLine('PLAYER_REJECT'));
                        setTimeout(() => this.closeNegotiationChat(), 2200);
                    } else {
                        state.round++;
                        const discountFactor = state.round === 2 ? 0.96 : 0.93;
                        const newCounterWage = Math.max( parseFloat((wage + 0.2).toFixed(2)), parseFloat((state.demandedWage * discountFactor).toFixed(2)) );
                        state.counterWage = newCounterWage;

                        const nextTension = state.round >= 3 ? 'HIGH' : 'MEDIUM';
                        this.updateTensionUI(nextTension, state.round);
                        this.setFcDialogue(this.pickNegotiationLine('PLAYER_COUNTER', {
                            wage,
                            counter: newCounterWage,
                            round: state.round
                        }));

                        const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                        if (acceptCounterBtn) {
                            acceptCounterBtn.style.display = 'inline-flex';
                            acceptCounterBtn.textContent = `역제안 수락 (${newCounterWage}억/주)`;
                        }

                        this.setupChatInput(prevStep);
                        this.updateFcBudgetSummary();
                    }
                }
            }, 900);
        } else if (prevStep === 'SELL') {
            const requestedFee = Math.round(val);
            const initialFee = state.demandedFee;
            const buyerTeamKey = state.buyerTeamKey;
            const buyerTeamName = state.buyerTeamName || '상대 구단';
            const marketValue = state.marketValue || 100;

            this.setupChatInput('WAITING');
            this.setFcDialogue(`"${buyerTeamName} 보드진이 요구액 ${requestedFee}억 원 조건을 검토 중입니다..."`);

            setTimeout(() => {
                if (!this.chatState) return;

                let accepted = false;
                if (requestedFee <= initialFee) {
                    accepted = true;
                } else {
                    const increaseRatio = (requestedFee - initialFee) / initialFee;
                    let chance = this.calculateFeeNegotiationChance(buyerTeamKey, requestedFee, marketValue);

                    if (increaseRatio <= 0.08) {
                        chance = Math.max(chance, 0.85);
                    } else if (increaseRatio <= 0.18) {
                        chance = Math.max(chance, 0.65);
                    } else if (increaseRatio <= 0.30) {
                        chance = Math.max(chance, 0.40);
                    } else {
                        chance = Math.min(chance, 0.20);
                    }

                    accepted = Math.random() <= chance;
                }

                if (accepted) {
                    state.fee = requestedFee;
                    this.updateTensionUI('LOW', state.round);
                    const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                    if (acceptCounterBtn) acceptCounterBtn.style.display = 'none';

                    this.setFcDialogue(this.pickNegotiationLine('SELL_ACCEPT', { fee: requestedFee }));

                    setTimeout(() => {
                        const result = this.finalizeUserTransfer(
                            player,
                            buyerTeamKey,
                            requestedFee,
                            state.mailId,
                            `${buyerTeamName}로의 이적 협상이 ${requestedFee}억 원에 타결되었습니다.`
                        );
                        if (!result.success) {
                            alert(result.message);
                        } else {
                            alert(`${player.name} 선수가 ${buyerTeamName}로 ${requestedFee}억 원에 이적 완료되었습니다!`);
                        }
                        this.closeNegotiationChat();
                        this.refreshAllUI();
                        if (typeof mailManager !== 'undefined') {
                            mailManager.renderList();
                            const openedMail = mailManager.mails.find(m => m.id === state.mailId);
                            if (openedMail) mailManager.openMail(openedMail);
                        }
                    }, 1800);
                } else {
                    const increaseRatio = (requestedFee - initialFee) / initialFee;
                    const marketRatio = requestedFee / marketValue;

                    if (state.round >= state.maxRounds || increaseRatio >= 0.50 || marketRatio >= 1.7) {
                        this.updateTensionUI('HIGH', state.round);
                        this.setFcDialogue(this.pickNegotiationLine('SELL_REJECT'));
                        setTimeout(() => {
                            alert(`${buyerTeamName}와의 협상이 결렬되었습니다.`);
                            this.closeNegotiationChat();
                        }, 2200);
                    } else {
                        state.round++;
                        const stepBonus = Math.max(2, Math.round((requestedFee - initialFee) * 0.45));
                        const newOffer = Math.min(requestedFee - 1, initialFee + stepBonus);
                        state.counterFee = newOffer;
                        state.demandedFee = newOffer;

                        const nextTension = state.round >= 3 ? 'HIGH' : 'MEDIUM';
                        this.updateTensionUI(nextTension, state.round);
                        this.setFcDialogue(this.pickNegotiationLine('SELL_COUNTER', {
                            fee: requestedFee,
                            counter: newOffer,
                            round: state.round
                        }));

                        const acceptCounterBtn = document.getElementById('fcAcceptCounterBtn');
                        if (acceptCounterBtn) {
                            acceptCounterBtn.style.display = 'inline-flex';
                            acceptCounterBtn.textContent = `역제안 수락 (${newOffer}억 원)`;
                        }

                        this.setupChatInput('SELL');
                        this.updateFcBudgetSummary();
                    }
                }
            }, 900);
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

    enrichPlayerData(player) {
        if (!player) return player;
        const enriched = { ...player };
        const name = player.name;

        let found = null;
        if (typeof allTeams !== 'undefined') {
            for (const t in allTeams) {
                found = (allTeams[t].players || []).find(x => x.name === name);
                if (found) break;
            }
        }
        if (!found && Array.isArray(this.extraPlayers)) {
            found = this.extraPlayers.find(x => x.name === name);
        }

        if (found) {
            const copyKeys = [
                'playerid', 'playerId', 'id', 'attributes', 'traits', 'detailPosition', 'otherPositions',
                'potential', 'preferredFoot', 'weakFoot', 'skillMoves', 'country', 'value'
            ];
            copyKeys.forEach(k => {
                if (enriched[k] === undefined && found[k] !== undefined) {
                    enriched[k] = found[k];
                }
            });
        }

        // id 및 playerid 상호 동기화 (페이스팩 assets/players/p[id].png/webp 렌더링 100% 보장)
        const pid = enriched.playerid || enriched.playerId || enriched.id;
        if (pid) {
            enriched.playerid = pid;
            enriched.id = pid;
        }

        return enriched;
    }

    finalizeChatTransfer(player, fee, wage, contractYears = 3, squadRole = 'IMPORTANT') {
        try {
            if (window.GameState) window.GameState.spendTeamMoney(fee);
            else gameData.teamMoney -= fee;

            // [수정] 영입 시 wageBudget(한도)을 차감하지 않음. 
            // 선수가 스쿼드에 추가되고 calculateTotalWages()가 호출되어 총 주급이 늘어나므로,
            // 가용 주급(wageBudget - totalWeeklyWage)이 자동으로 wage만큼 줄어듦.

            const selectedTeamPlayers = window.GameState ? window.GameState.getSelectedTeamPlayers() : teams[gameData.selectedTeam];

            const newPlayer = this.enrichPlayerData({
                ...player,
                name: player.name,
                position: player.position,
                rating: player.rating,
                age: player.age,
                weeklyWage: wage,
                contractYears: contractYears,
                squadRole: squadRole
            });
            selectedTeamPlayers.push(newPlayer);

            this.transferMarket = this.transferMarket.filter(p => !(p.name === player.name && p.originalTeam === player.originalTeam));

            const playerKey = `${player.name}_${player.originalTeam}`;
            if (window.GameState) window.GameState.clearTransferOffer(playerKey);
            else delete gameData.transferOffers[playerKey];

            if (player.originalTeam && player.originalTeam !== "외부리그" && typeof teams !== 'undefined' && teams[player.originalTeam]) {
                const originalTeamPlayers = teams[player.originalTeam];
                const playerIndex = originalTeamPlayers.findIndex(p => p.name === player.name && p.position === player.position);
                if (playerIndex !== -1) originalTeamPlayers.splice(playerIndex, 1);

                // [수정] 판매 구단에 이적료 입금 (선수가 빠져나가 총 주급이 줄어들므로 주급 한도 증액 불필요)
                this.addTeamBudget(player.originalTeam, fee);
            }

            if (typeof mailManager !== 'undefined') {
                const roleMeta = this.getSquadRoleMeta(['PROSPECT', 'ROTATION', 'IMPORTANT', 'CRUCIAL'].indexOf(squadRole));
                const content = `${player.name} 선수가 우리 팀에 합류했습니다.\n이적료: ${fee}억\n주급: ${wage}억/주\n계약 기간: ${contractYears}년\n팀 내 위상: ${roleMeta.short}\n포지션: ${player.position}`;
                mailManager.addMail(`[영입] ${player.name} 영입 완료`, '스카우트 팀장', content);
            }

            if (typeof calculateTotalWages === 'function') calculateTotalWages();
            this.addTransferNews(newPlayer, player.originalTeam, gameData.selectedTeam, fee);

            if (window.AutoSaveSystem) setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);

            if (window.GameState) window.GameState.clampTeamMoney();
            else gameData.teamMoney = Math.max(0, gameData.teamMoney);

            updateDisplay();
            if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
            const finPanel = document.getElementById('finance');
            if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
                renderFinanceTab();
            }
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
        const rawFee = Math.max(1, Math.round(marketValue * baseMultiplier));

        // [수정] 어떤 구단도 자기 실제 가용 예산의 95%를 초과하는 비현실적인 오퍼를 보낼 수 없음
        if (budget > 0) {
            const maxAffordable = Math.max(1, Math.round(budget * 0.95));
            return Math.min(rawFee, maxAffordable);
        }

        return rawFee;
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

        if (typeof calculateTotalWages === 'function') calculateTotalWages();

        if (window.GameState) window.GameState.addTeamMoney(fee);
        else gameData.teamMoney += fee;

        this.spendTeamBudget(targetTeamKey, fee);

        if (teams[targetTeamKey]) teams[targetTeamKey].push({ ...soldPlayer });

        if (window.GameState) window.GameState.removeUserTransferListByPlayer(player.name);
        else gameData.userTransferList = gameData.userTransferList.filter(entry => entry.player.name !== player.name);

        this.addTransferNews(soldPlayer, gameData.selectedTeam, targetTeamKey, fee);

        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
        const finPanel = document.getElementById('finance');
        if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
            renderFinanceTab();
        }

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

        const availableWageBudget = this.getAvailableWageBudget(gameData.selectedTeam);
        if (availableWageBudget < negotiatedWeeklyWage) {
            if (window.GameState) window.GameState.addTeamMoney(transferFee);
            else gameData.teamMoney += transferFee;
            return {
                success: false,
                message: `주급 예산이 부족합니다.\n필요 주급: ${negotiatedWeeklyWage}억/주 / 가용 여유 주급: ${availableWageBudget}억/주\n[재정] 탭에서 이적 자금을 주급 예산으로 전환하거나 잉여 선수를 처분하세요.`
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
                    message: `이적료 ${transferFee}억을 선지급했지만, 연봉 ${negotiatedWeeklyWage}억 협상이 결렬되어 계약이 무산되었습니다.\n(협상 성공 확률: ${Math.round(wageSuccessChance * 100)}%)\n\n[주의] 2회 연속 실패로 10경기 동안 제안이 불가능합니다.`
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
                return { success: false, message: `협상 결렬! 선수가 이적 제안을 거절했습니다.\n(성공 확률: ${successPercent}%)\n\n[주의] 2회 연속 실패로 10경기 동안 제안이 불가능합니다.` };
            }
            return { success: false, message: `협상 실패! 선수가 이적 제안을 거절했습니다.\n(성공 확률: ${successPercent}%)\n\n남은 기회: ${2 - offerData.attempts}회` };
        }

        // 선수를 팀에 추가 (페이스팩 ID 및 세부 스펙 attributes/traits 완전 보존 및 보충)
        const newPlayer = this.enrichPlayerData({
            ...player,
            name: player.name,
            position: player.position,
            rating: player.rating,
            age: player.age,
            weeklyWage: negotiatedWeeklyWage
        });

        selectedTeamPlayers.push(newPlayer);

        // 이적 시장에서 제거
        this.transferMarket = this.transferMarket.filter(p => !(p.name === player.name && p.originalTeam === player.originalTeam));

        // 성공 시 오퍼 기록 삭제 (나중에 다시 영입할 수도 있으므로)
        if (window.GameState) window.GameState.clearTransferOffer(playerKey);
        else delete gameData.transferOffers[playerKey];

        // AI 팀에서 선수 제거 (게임 내 리그 팀인 경우)
        if (player.originalTeam && typeof teams !== 'undefined' && teams[player.originalTeam]) {
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

        // [신규] 영입 후 주급 재계산 및 UI 동기화
        if (typeof calculateTotalWages === 'function') calculateTotalWages();
        if (typeof updateDisplay === 'function') updateDisplay();
        if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
        const finPanel = document.getElementById('finance');
        if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
            renderFinanceTab();
        }

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

            // 방출 메일 발송
            if (typeof mailManager !== 'undefined') {
                const content = `${player.name} 선수가 ${teamNames[randomTeam]}로 이적했습니다.\n이적료 수입: ${transferFee}억`;
                mailManager.addMail(`[이적] ${player.name} 이적 완료`, '단장', content);
            }

            // [신규] 방출 후 주급 재계산
            if (typeof calculateTotalWages === 'function') calculateTotalWages();
            if (typeof updateDisplay === 'function') updateDisplay();
            if (typeof updateFinanceDisplay === 'function') updateFinanceDisplay();
            const finPanel = document.getElementById('finance');
            if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
                renderFinanceTab();
            }

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

        // [수정] 30% 확률로 이적 시장 매물(외부 리그 스타 및 타 구단 등록 매물)에서 먼저 영입 시도
        if (Math.random() < 0.3 && this.transferMarket.length > 0) {
            const buyingBudget = this.getTeamBudget(buyingTeam);
            const marketCandidates = this.transferMarket.filter(p => {
                if (p.position !== targetPosition) return false;
                if (this.isPlayerInUserTeam(p.name)) return false;
                if (p.originalTeam === buyingTeam) return false;
                if (!isEmergency && (p.rating < targetRatingMin || p.rating > targetRatingMax)) return false;
                if (p.price > buyingBudget) return false;
                return true;
            });

            if (marketCandidates.length > 0) {
                marketCandidates.sort((a, b) => b.rating - a.rating);
                const pickIndex = Math.floor(Math.random() * Math.min(3, marketCandidates.length));
                const pickedPlayer = marketCandidates[pickIndex];

                // 시장에서 제거
                const mIdx = this.transferMarket.indexOf(pickedPlayer);
                if (mIdx > -1) this.transferMarket.splice(mIdx, 1);

                const fee = pickedPlayer.price;
                const weeklyWage = this.estimateWeeklyWage(pickedPlayer);
                const fromTeam = pickedPlayer.originalTeam || "외부리그";

                const newPlayer = {
                    name: pickedPlayer.name,
                    position: pickedPlayer.position,
                    rating: pickedPlayer.rating,
                    age: pickedPlayer.age,
                    weeklyWage: weeklyWage
                };
                teams[buyingTeam].push(newPlayer);

                this.spendTeamBudget(buyingTeam, fee);

                if (fromTeam !== "외부리그" && teams[fromTeam]) {
                    const originalPlayers = teams[fromTeam];
                    const pIdx = originalPlayers.findIndex(p => p.name === pickedPlayer.name);
                    if (pIdx > -1) originalPlayers.splice(pIdx, 1);
                    this.addTeamBudget(fromTeam, fee);
                }

                console.log(`[시장 AI 영입] ${pickedPlayer.name}(${pickedPlayer.position}, ${pickedPlayer.rating})이(가) ${teamNames[fromTeam] || fromTeam}에서 ${teamNames[buyingTeam]}로 이적했습니다.`);
                this.addTransferNews(pickedPlayer, fromTeam, buyingTeam, fee);
                return;
            }
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

            console.log(`AI 이적: ${transferCandidate.name}(${transferCandidate.position}, ${transferCandidate.rating})이(가) ${teamNames[sellingTeam]}에서 ${teamNames[buyingTeam]}로 이적했습니다.`);

            // 이적 뉴스 기록
            this.addTransferNews(transferCandidate, sellingTeam, buyingTeam, estimatedFee);
        }
    }

    // 팀의 상위 11명 평균 오버롤 계산 (구단 수준 판단용)
    getTeamTop11AvgRating(teamKey) {
        const roster = (typeof teams !== 'undefined' && teams[teamKey] && teams[teamKey].length > 0)
            ? teams[teamKey]
            : ((typeof allTeams !== 'undefined' && allTeams[teamKey] && allTeams[teamKey].players) ? allTeams[teamKey].players : []);
        if (!roster || roster.length === 0) return 70;
        const topRatings = roster
            .map(p => Number(p.rating) || 65)
            .sort((a, b) => b - a)
            .slice(0, 11);
        return topRatings.reduce((sum, r) => sum + r, 0) / topRatings.length;
    }

    // 선수 수준(오버롤/나이/포텐셜)과 예산에 맞는 현실적인 영입 희망 구단 목록 반환
    getRealisticBuyerTeams(player, candidateTeams, minAffordableBudget = 20) {
        const rating = Number(player.rating) || 65;
        const age = Number(player.age) || 25;
        const potential = Number(player.maxPotential || player.potential) || rating;

        // 유망주 여부: 22세 이하이면서 잠재력이 높거나(78+) 성장 여력이 큰(+7 이상) 경우
        const isProspect = age <= 22 && (potential >= 78 || (potential - rating) >= 7);
        const effectiveRating = isProspect
            ? Math.round(rating * 0.4 + potential * 0.6)
            : rating;

        // 비유망주 저오버롤 선수는 팀 평균 오버롤이 훨씬 높은 빅클럽(PL, PSG 등)에서 제외
        const maxTeamAvg = effectiveRating + (effectiveRating >= 78 ? 6 : 5);
        const minTeamAvg = (rating >= 78 && age <= 32) ? (rating - 10) : 0;

        const affordableTeams = candidateTeams.filter(t => this.getTeamBudget(t) >= minAffordableBudget);
        const levelPool = affordableTeams.length >= 3 ? affordableTeams : candidateTeams;

        let eligibleTeams = levelPool.filter(t => {
            const teamAvg = this.getTeamTop11AvgRating(t);
            return teamAvg <= maxTeamAvg && teamAvg >= minTeamAvg;
        });

        // 조건을 만족하는 구단이 부족하면 선수 수준과 가장 비슷한 구단들 순으로 보충
        if (eligibleTeams.length < 3) {
            eligibleTeams = [...levelPool]
                .sort((a, b) => {
                    const diffA = Math.abs(this.getTeamTop11AvgRating(a) - effectiveRating);
                    const diffB = Math.abs(this.getTeamTop11AvgRating(b) - effectiveRating);
                    return diffA - diffB;
                })
                .slice(0, Math.min(12, levelPool.length));
        }

        return eligibleTeams;
    }

    // [수정] 유저 선수를 위한 제안 생성 후 메일로 발송 (현실적인 구단 예산 및 구단 수준 반영)
    processUserTransferOffers(player) {
        const marketValue = this.calculatePlayerPrice(player, gameData.selectedTeam);
        const offers = [];
        const allOtherTeams = Object.keys(allTeams).filter(t => t !== gameData.selectedTeam);

        // 1. 해당 선수의 몸값과 수준(오버롤/유망주 여부)에 맞는 현실적인 구단만 엄선
        const minAffordableBudget = Math.max(20, Math.round(marketValue * 0.7));
        const eligibleTeams = this.getRealisticBuyerTeams(player, allOtherTeams, minAffordableBudget);

        const pickedTeams = new Set();
        const pickTeamFrom = (list) => {
            const avail = list.filter(t => !pickedTeams.has(t));
            if (avail.length === 0) return null;
            const chosen = avail[Math.floor(Math.random() * avail.length)];
            pickedTeams.add(chosen);
            return chosen;
        };

        // 1. 적정 구단 중 가장 자금력이 좋은 구단 오퍼 (최고 수준의 제안)
        const sortedByBudget = [...eligibleTeams].sort((a, b) => this.getTeamBudget(b) - this.getTeamBudget(a));
        const topTierPool = sortedByBudget.slice(0, Math.max(3, Math.ceil(sortedByBudget.length * 0.35)));
        const bigSpender = pickTeamFrom(topTierPool) || pickTeamFrom(eligibleTeams) || allOtherTeams[0];

        offers.push({
            teamKey: bigSpender,
            teamName: teamNames[bigSpender] || bigSpender,
            fee: this.calculateOfferFeeByBudget(bigSpender, marketValue, 1.0, 1.12),
            message: "우리는 선수의 뛰어난 기량을 높게 평가하며, 시장가에 걸맞은 최고 수준의 이적료를 공식 제안합니다."
        });

        // 2. 같은 리그 혹은 합리적 예산의 구단
        const userLeagueId = allTeams[gameData.selectedTeam] ? allTeams[gameData.selectedTeam].leagueId : null;
        const sameLeagueOrContenders = eligibleTeams.filter(t => 
            (userLeagueId && allTeams[t] && allTeams[t].leagueId === userLeagueId) ||
            (!userLeagueId && allTeams[t] && allTeams[t].league === gameData.currentLeague) || 
            this.getTeamBudget(t) >= marketValue * 0.85
        );
        const rational = pickTeamFrom(sameLeagueOrContenders) || pickTeamFrom(eligibleTeams) || allOtherTeams[1 % allOtherTeams.length];

        offers.push({
            teamKey: rational,
            teamName: teamNames[rational] || rational,
            fee: this.calculateOfferFeeByBudget(rational, marketValue, 0.88, 0.96),
            message: "선수 영입을 위해 구단 이사회 승인을 거쳐 합리적인 수준의 이적료를 공식 전달합니다."
        });

        // 3. 포지션 보강이 절실한 구단
        const needy = eligibleTeams.filter(t => {
            const pCount = (teams[t] || []).filter(p => p.position === player.position).length;
            return pCount <= 4;
        });
        const needyTeam = pickTeamFrom(needy) || pickTeamFrom(eligibleTeams) || allOtherTeams[2 % allOtherTeams.length];

        offers.push({
            teamKey: needyTeam,
            teamName: teamNames[needyTeam] || needyTeam,
            fee: this.calculateOfferFeeByBudget(needyTeam, marketValue, 0.78, 0.88),
            message: "우리 구단의 취약 포지션 보강을 위해 최대로 가용할 수 있는 예산을 투입하여 진정성 있게 제안합니다."
        });

        // 메일 발송 (현실적인 비서 보고 멘트)
        if (typeof mailManager !== 'undefined') {
            const mailTitle = `[이적 오퍼] ${player.name}에 대한 ${offers.length}개 구단 제안 도착`;
            const mailContent = `감독님, ${player.name} 선수에 대해 ${offers.length}개 구단에서 정식 영입 제안서를 보내왔습니다.\n\n` +
                `각 구단의 조건을 검토해 보시고 바로 수락하시거나, 마음에 드는 구단과 추가 이적료 협상을 진행해 보실 수 있습니다.`;
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
        this.openSaleNegotiation(playerName, targetTeamKey, currentFee, mailId);
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
            const teamPlayers = teams[gameData.selectedTeam] || [];
            // [수정] 오퍼 발생 확률 적용 및 방치된 오퍼 만료 처리를 위해 역순 순회
            for (let i = userTransferList.length - 1; i >= 0; i--) {
                const entry = userTransferList[i];

                // [안전 장치] 해당 선수가 더 이상 우리 팀에 없으면 리스트에서 즉시 제거
                if (!teamPlayers.some(p => p.name === entry.player.name)) {
                    userTransferList.splice(i, 1);
                    continue;
                }

                if (entry.waitRounds > 0) {
                    entry.waitRounds--;
                }
                // waitRounds가 0이 되는 즉시 확률 체크 후 발송
                if (entry.waitRounds === 0 && !entry.isOfferSent) {
                    // [수정] 오퍼 발생 확률을 20%로 대폭 하향 (안 올 가능성 80%)
                    // 선수 가치나 나이에 따라 추가 감산: 33세 이상 노장은 12%
                    let offerChance = 0.20;
                    if (entry.player && entry.player.age >= 33) offerChance = 0.12;

                    if (Math.random() < offerChance) {
                        this.processUserTransferOffers(entry.player);
                        entry.isOfferSent = true; // 중복 발송 방지
                        entry.expireRounds = 5; // 5경기 동안 응답 없으면 자동 만료
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
                } else if (entry.isOfferSent) {
                    // [고착 방지] 이미 오퍼가 발송된 상태에서 장기 방치된 경우 만료 카운트다운
                    if (typeof entry.expireRounds === 'number') {
                        entry.expireRounds--;
                        if (entry.expireRounds <= 0) {
                            userTransferList.splice(i, 1);
                        }
                    } else {
                        entry.expireRounds = 5;
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
                    console.log(`[AI Transfer] 지능적 이적: ${player.name} (${teamNames[teamKey]} -> ${teamNames[buyerTeamKey]})`);

                    // [추가] 이적 뉴스 기록
                    this.addTransferNews(player, teamKey, buyerTeamKey, estimatedFee);

                    return; // 한 포지션당 한 명만 영입하고 종료
                }
            }
            // 실패 시 다음 후보로 넘어감 (다른 팀의 비슷한 선수를 찾게 됨)
        }
    }

    // 판매 의사 확인 (핵심 선수 및 포지션 뎁스 보호)
    checkSellingWillingness(player, teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers || teamPlayers.length <= 18) return false; // 최소 인원 보호

        // [추가] 포지션별 최소 인원 보호 (골키퍼 1명 잔여 등 스쿼드 붕괴 방지)
        const posCount = teamPlayers.filter(p => p.position === player.position).length;
        if (player.position === 'GK' && posCount <= 2) return false;
        if (player.position === 'DF' && posCount <= 5) return false;
        if (player.position === 'MF' && posCount <= 5) return false;
        if (player.position === 'FW' && posCount <= 3) return false;

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
        console.log(`[AI Balance] ${teamNames[teamKey] || teamKey}에 ${name} (${position}, ${rating}) 생성됨.`);
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

        const playerKey = `${playerName}_${playerOriginalTeam}`;
        const transferOffers = window.GameState ? window.GameState.ensureTransferOffers() : (gameData.transferOffers ||= {});
        if (!transferOffers[playerKey]) transferOffers[playerKey] = { attempts: 0, lastFailedMatch: -100, favorability: 0 };
        const offerData = transferOffers[playerKey];

        // [중복 방지] 이미 언플을 시도한 경우 차단
        if (offerData.hasMediaPlayed) {
            const warnMsg = `이미 ${playerName} 선수를 향한 언론 작업을 진행했습니다.`;
            if (inChat) this.addChatMessage('system', warnMsg);
            else alert(warnMsg);
            return;
        }

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

        offerData.hasMediaPlayed = true;

        // 성공 여부 판별 (구단 명성이나 운에 따라)
        const success = Math.random() >= 0.5; // 50% 성공
        if (success) {
            offerData.favorability = (offerData.favorability || 0) + 0.15; // 15% 상승
            const mediaOkLines = [
                `"언론 보도를 봤습니다. 감독님께서 ${playerName}에게 그 정도로 진심이시라면 우리도 조금 더 유연하게 대화해 보죠."`,
                `"기사가 대서특필되었더군요! 선수 본인이 이적에 긍정적인 반응을 보여서 우리 보드진도 태도를 누그러뜨렸습니다."`,
                `"언론 플레이가 꽤 효과적이었군요. ${playerName} 측 에이전트도 협상 타결을 원하고 있습니다."`
            ];
            const msg = inChat
                ? mediaOkLines[Math.floor(Math.random() * mediaOkLines.length)]
                : `성공! 언론 플레이를 통해 ${playerName} 선수의 관심을 끌었습니다. (이적 수락 확률 대폭 상승)`;
            if (inChat) this.setFcDialogue(msg);
            else alert(msg);

            if (typeof snsManager !== 'undefined') {
                const post = {
                    id: snsManager.postIdCounter++,
                    type: "transfer_rumor",
                    content: `[루머] ${teamNames[gameData.selectedTeam]}가 ${playerName} 을 최우선 영입 대상으로 삼았습니다.`,
                    hashtags: ['#transfer', `#${snsManager.sanitizeHashtag(gameData.selectedTeam)}`, `#${snsManager.sanitizeHashtag(playerName)}`],
                    timestamp: Date.now(),
                    time: "방금 전",
                    likes: Math.floor(Math.random() * 500) + 50,
                    comments: Math.floor(Math.random() * 80) + 10,
                    shares: Math.floor(Math.random() * 30) + 2,
                    playerName: playerName,
                    toTeam: gameData.selectedTeam,
                    transferFee: '이적 협상 중'
                };
                snsManager.addPost(post);
            }
        } else {
            offerData.favorability = (offerData.favorability || 0) - 0.1; // 10% 하락
            const mediaFailLines = [
                `"지금 언론을 통해 우리 구단을 압박하시는 겁니까? 이런 식의 여론전은 협상에 전혀 도움이 안 됩니다!"`,
                `"사전 합의도 없이 언론에 정보를 흘리시다니 불쾌하군요. 보드진의 심기가 많이 불편해졌습니다."`,
                `"언론 플레이로 흔들어 보시겠다는 속셈 같은데, 오히려 역효과입니다. 정식 금액으로 승부하시죠."`
            ];
            const msg = inChat
                ? mediaFailLines[Math.floor(Math.random() * mediaFailLines.length)]
                : `실패... 지나친 언론 플레이로 인해 ${playerName} 선수가 반감을 가졌습니다. (이적 수락 확률 하락)`;
            if (inChat) {
                this.updateTensionUI('MEDIUM', this.chatState ? this.chatState.round : 1);
                this.setFcDialogue(msg);
            } else alert(msg);
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

        // [중복 방지] 이미 친목 설득을 시도한 경우 차단
        if (offerData.hasSocialized) {
            const warnMsg = `이미 ${persuaderName} 선수를 통해 설득을 시도했습니다.`;
            if (inChat) this.setFcDialogue(`"${warnMsg}"`);
            else alert(warnMsg);
            return;
        }

        offerData.hasSocialized = true;

        const success = Math.random() > 0.3; // 70% 성공
        if (success) {
            offerData.favorability = (offerData.favorability || 0) + 0.07; // 7% 상승
            const socOkLines = [
                `"방금 ${persuaderName} 선수에게서 연락을 받았다고 하더군요. 대표팀 동료가 있는 팀이라 ${playerName}도 무척 호감을 보이고 있습니다!"`,
                `"${persuaderName} 선수의 설득이 통했습니다! 선수 본인이 그쪽 합류를 강력히 희망해서 협상이 훨씬 수월해지겠군요."`,
                `"동포인 ${persuaderName} 선수가 구단 분위기를 극찬했다더군요. ${playerName}의 마음이 이미 많이 기울었습니다."`
            ];
            const msg = inChat
                ? socOkLines[Math.floor(Math.random() * socOkLines.length)]
                : `성공! ${persuaderName} 선수가 같은 국가 대표팀 인맥을 활용해 ${playerName} 선수를 설득했습니다. (수락 확률 상승)`;
            if (inChat) {
                this.updateTensionUI('LOW', this.chatState ? this.chatState.round : 1);
                this.setFcDialogue(msg);
            } else alert(msg);
        } else {
            offerData.favorability = (offerData.favorability || 0) - 0.05; // 5% 하락
            const socFailLines = [
                `"${persuaderName} 선수를 통해 사적으로 접촉하셨더군요. ${playerName}는 프로답게 공식 테이블에서만 얘기하길 원합니다."`,
                `"인맥을 동원한 설득은 오히려 선수에게 부담을 줬습니다. 조건으로만 대화를 이어가시죠."`
            ];
            const msg = inChat
                ? socFailLines[Math.floor(Math.random() * socFailLines.length)]
                : `실패... ${playerName} 선수가 ${persuaderName} 선수의 설득을 부담스러워 합니다. (수락 확률 하락)`;
            if (inChat) this.setFcDialogue(msg);
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

function createTransferPlayerCard(player, showMarketStatus = false) {
    const playerCard = document.createElement('div');
    const posLower = (player.position || 'mf').toLowerCase();
    playerCard.className = `transfer-player fc26-player-card pos-theme-${posLower}`;
    playerCard.style.cursor = 'pointer';
    playerCard.addEventListener('click', (ev) => {
        if (ev.target.closest('button, a, input, select')) return;
        if (typeof openPlayerDetail === 'function') openPlayerDetail(player, player.originalTeam);
    });

    const teamInfo = player.originalTeam === "외부리그" ?
        "외부리그" : (teamNames[player.originalTeam] || player.originalTeam);

    const wage = typeof calculatePlayerWage === 'function' ? calculatePlayerWage(player) : (Math.pow(player.rating / 75, 5) * 0.9).toFixed(2);
    const ovr = Math.floor(player.rating);

    const cardContent = document.createElement('div');
    cardContent.className = 'player-card-content fc26-card-layout';

    const cutoutWrap = document.createElement('div');
    cutoutWrap.className = 'fc26-cutout-wrap';

    const img = document.createElement('img');
    img.className = 'player-card-image fc26-cutout-img';
    img.loading = 'lazy';
    img.alt = player.name;
    setPlayerPhoto(img, player);

    const ratingBadge = document.createElement('div');
    ratingBadge.className = 'player-rating fc26-ovr-badge';
    ratingBadge.textContent = `${ovr}`;

    const posBadge = document.createElement('span');
    posBadge.className = `player-position pos-badge pos-${posLower}`;
    posBadge.textContent = player.position;

    const topBadgeCol = document.createElement('div');
    topBadgeCol.className = 'fc26-badge-stack';
    topBadgeCol.append(ratingBadge, posBadge);

    cutoutWrap.append(topBadgeCol, img);

    const infoText = document.createElement('div');
    infoText.className = 'player-info-text fc26-card-info';

    const headerRow = document.createElement('div');
    headerRow.className = 'fc26-info-top';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-name';
    nameDiv.textContent = player.name;

    const ageDiv = document.createElement('span');
    ageDiv.className = 'player-age fc26-age-pill';
    ageDiv.textContent = `${player.age}세`;

    headerRow.append(nameDiv, ageDiv);

    const teamDiv = document.createElement('div');
    teamDiv.className = 'player-team';
    teamDiv.textContent = teamInfo;

    const financeRow = document.createElement('div');
    financeRow.className = 'fc26-finance-row';

    const priceDiv = document.createElement('div');
    priceDiv.className = 'transfer-price';
    priceDiv.textContent = `${player.price}억`;

    const wageDiv = document.createElement('div');
    wageDiv.className = 'fc26-wage-pill';
    wageDiv.textContent = `주급 ${wage}억`;

    financeRow.append(priceDiv, wageDiv);

    const footerRow = document.createElement('div');
    footerRow.className = 'fc26-footer-row';

    if (showMarketStatus) {
        if (player.inMarket) {
            const mDays = document.createElement('div');
            mDays.className = 'market-days';
            mDays.textContent = `시장 등록 ${player.daysOnMarket}일째`;
            footerRow.appendChild(mDays);
        } else {
            const mStat = document.createElement('div');
            mStat.className = 'market-status';
            mStat.textContent = '비매물 (직접 협상)';
            footerRow.appendChild(mStat);
        }
    } else {
        const mDays = document.createElement('div');
        mDays.className = 'market-days';
        mDays.textContent = `시장 등록 ${player.daysOnMarket}일째`;
        footerRow.appendChild(mDays);
    }

    const negBtn = document.createElement('button');
    negBtn.className = 'btn primary fc26-neg-btn';
    if (typeof window.createIcon === 'function') {
        negBtn.appendChild(window.createIcon('handshake'));
    }
    const btnSpan = document.createElement('span');
    btnSpan.textContent = '영입 협상 시작';
    negBtn.appendChild(btnSpan);
    negBtn.onclick = (e) => {
        e.stopPropagation();
        transferSystem.promptPurchaseNegotiation(player.name, player.originalTeam, player.price, player.position, player.rating, player.age);
    };

    infoText.append(headerRow, teamDiv, financeRow, footerRow, negBtn);
    cardContent.append(cutoutWrap, infoText);
    playerCard.appendChild(cardContent);
    return playerCard;
}

// 이적 가능 선수 표시
function displayTransferPlayers() {
    const container = document.getElementById('transferPlayers');
    if (!container) return;
    const fragment = document.createDocumentFragment(); // [성능 개선]
    container.replaceChildren();
    const transferPlayers = transferSystem.getTransferMarketDisplay();

    if (transferPlayers.length === 0) {
        const p = document.createElement('p');
        p.textContent = '현재 이적 가능한 선수가 없습니다.';
        container.appendChild(p);
        return;
    }

    transferPlayers.forEach(player => {
        fragment.appendChild(createTransferPlayerCard(player, false));
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
    if (!container) return;
    const fragment = document.createDocumentFragment(); // [성능 개선]
    container.replaceChildren();

    const filteredPlayers = transferSystem.searchPlayers(filters);

    if (filteredPlayers.length === 0) {
        const p = document.createElement('p');
        p.textContent = '검색 조건에 맞는 선수가 없습니다.';
        container.appendChild(p);
        return;
    }

    filteredPlayers.forEach(player => {
        fragment.appendChild(createTransferPlayerCard(player, true));
    });
    container.appendChild(fragment); // [성능 개선]
}

// [추가] 이적 뉴스 표시 함수 (FM 고밀도 데이터 테이블 리스트)
function displayTransferNews() {
    const container = document.getElementById('transferNewsList');
    if (!container) return;

    container.replaceChildren();
    const newsList = transferSystem.transferNews;

    if (newsList.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.style.cssText = 'text-align: center; padding: 28px; color: #94A3B8;';
        emptyP.textContent = '아직 이적 소식이 없습니다.';
        container.appendChild(emptyP);
        return;
    }

    const tableWrap = document.createElement('div');
    tableWrap.className = 'fm-news-table';

    const headerRow = document.createElement('div');
    headerRow.className = 'fm-news-header';
    headerRow.innerHTML = `
        <div class="fm-col-player">선수 / 포지션·나이</div>
        <div class="fm-col-clubs">이전 구단 → 이적 구단</div>
        <div class="fm-col-ovr">OVR</div>
        <div class="fm-col-fee">이적료</div>
    `;
    tableWrap.appendChild(headerRow);

    newsList.forEach(news => {
        const newsRow = document.createElement('div');
        const isUserInvolved = news.from === gameData.selectedTeam || news.to === gameData.selectedTeam;
        const posLower = (news.position || 'mf').toLowerCase();

        newsRow.className = `news-card fm-news-row ${isUserInvolved ? 'user-transfer' : ''}`;

        const fromTeamName = news.from === "외부리그" ? "외부리그" : (teamNames[news.from] || news.from);
        const toTeamName = news.to === "외부리그" ? "외부리그" : (teamNames[news.to] || news.to);

        // Col 1: [선수명 / 포지션·나이]
        const colPlayer = document.createElement('div');
        colPlayer.className = 'fm-col-player news-player';

        const posBadge = document.createElement('span');
        posBadge.className = `pos-badge pos-${posLower}`;
        posBadge.textContent = news.position || 'MF';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'fm-news-player-name';
        nameSpan.textContent = news.name;

        const ageSpan = document.createElement('span');
        ageSpan.className = 'fm-news-player-age';
        ageSpan.textContent = news.age ? `${news.age}세` : '';

        colPlayer.append(posBadge, nameSpan, ageSpan);

        // Col 2: [이전 구단 -> 이적 구단]
        const colClubs = document.createElement('div');
        colClubs.className = 'fm-col-clubs news-detail';

        const fromSpan = document.createElement('span');
        fromSpan.className = 'fm-club-from';
        fromSpan.textContent = fromTeamName;

        const arrow = document.createElement('span');
        arrow.className = 'transfer-arrow';
        arrow.textContent = '→';

        const toSpan = document.createElement('span');
        toSpan.className = 'fm-club-to';
        toSpan.textContent = toTeamName;

        colClubs.append(fromSpan, arrow, toSpan);

        // Col 3: [OVR]
        const colOvr = document.createElement('div');
        colOvr.className = 'fm-col-ovr news-rating';
        const ovrBadge = document.createElement('span');
        ovrBadge.className = 'fm-ovr-pill';
        ovrBadge.textContent = news.rating ? `${Math.floor(news.rating)}` : '-';
        colOvr.appendChild(ovrBadge);

        // Col 4: [이적료 배지]
        const colFee = document.createElement('div');
        colFee.className = 'fm-col-fee news-fee';
        const feeBadge = document.createElement('span');
        feeBadge.className = 'fm-fee-pill';
        feeBadge.textContent = `${news.fee}억`;
        colFee.appendChild(feeBadge);

        newsRow.append(colPlayer, colClubs, colOvr, colFee);
        tableWrap.appendChild(newsRow);
    });

    container.appendChild(tableWrap);
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
    console.log('[Transfer] initTransfer 함수 실행 시작');

    // 필수 데이터 확인 (script.js에서 호출하므로 즉시 확인 가능)
    if (typeof teams === 'undefined' || typeof gameData === 'undefined') {
        console.error('[Transfer] 필수 데이터가 아직 로드되지 않았습니다. script.js 로딩 순서를 확인하세요.');
        return;
    }

    try {
        console.log('[Transfer] transfer.js: 초기화 로직 실행');

        // [안전 장치] 초기화 함수들을 개별 try-catch로 감싸서 하나가 실패해도 나머지는 실행되도록 함
        try { initializeTransferSystem(); } catch (e) { console.error('[Transfer] 이적 시장 초기화 실패:', e); }

        // 경기 종료 후 이적 시장 업데이트 연결
        if (window.GameEventBus && !initTransfer.matchEndListenerRegistered) {
            window.GameEventBus.on('match:end', () => {
                setTimeout(() => {
                    try { updateTransferMarketPostMatch(); }
                    catch (e) { console.error('[Transfer] 경기 후 이적 시장 업데이트 실패:', e); }
                }, 3000);
            });
            initTransfer.matchEndListenerRegistered = true;
            console.log('[Transfer] match:end 이벤트 연결 완료');
        }
        console.log('[Transfer] 모든 초기화 완료');
    } catch (error) {
        console.error('[Transfer] 초기화 중 치명적 오류:', error);
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

// [추가] 이적 뉴스 스타일 주입 (FM 스타일 고밀도 데이터 테이블)
const transferNewsStyle = document.createElement('style');
transferNewsStyle.textContent = `
    .fm-news-table {
        width: 100%;
        background: #111827;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }
    .fm-news-header {
        display: grid;
        grid-template-columns: minmax(180px, 1.4fr) minmax(200px, 1.8fr) 76px 120px;
        align-items: center;
        gap: 12px;
        padding: 8px 14px;
        background: #161F30;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.76rem;
        font-weight: 800;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 0.02em;
    }
    .news-card.fm-news-row {
        display: grid;
        grid-template-columns: minmax(180px, 1.4fr) minmax(200px, 1.8fr) 76px 120px;
        align-items: center;
        gap: 12px;
        padding: 6px 14px;
        min-height: 36px;
        margin: 0;
        border-radius: 0;
        background: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.15s ease;
        font-variant-numeric: tabular-nums;
    }
    .news-card.fm-news-row:nth-child(even) {
        background: rgba(255, 255, 255, 0.015);
    }
    .news-card.fm-news-row:hover {
        background: rgba(56, 189, 248, 0.06);
    }
    .news-card.fm-news-row.user-transfer {
        background: rgba(163, 230, 53, 0.08);
        border-left: 3px solid #A3E635;
    }
    .fm-col-player {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
    }
    .fm-news-player-name {
        font-weight: 800;
        font-size: 0.9rem;
        color: #F8FAFC;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .fm-news-player-age {
        font-size: 0.8rem;
        color: #94A3B8;
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
    }
    .fm-col-clubs {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.86rem;
        color: #CBD5E1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .fm-club-from {
        color: #94A3B8;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .fm-club-to {
        color: #F8FAFC;
        font-weight: 700;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .transfer-arrow {
        color: #38BDF8;
        font-weight: 800;
        margin: 0 2px;
        flex-shrink: 0;
    }
    .fm-col-ovr {
        text-align: center;
    }
    .fm-ovr-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 34px;
        padding: 2px 7px;
        border-radius: 5px;
        background: rgba(56, 189, 248, 0.14);
        border: 1px solid rgba(56, 189, 248, 0.35);
        color: #38BDF8;
        font-weight: 900;
        font-size: 0.86rem;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
    }
    .fm-col-fee {
        text-align: right;
    }
    .fm-fee-pill {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 5px;
        background: rgba(251, 191, 36, 0.14);
        border: 1px solid rgba(251, 191, 36, 0.35);
        color: #FBBF24;
        font-weight: 900;
        font-size: 0.85rem;
        letter-spacing: -0.03em;
        font-variant-numeric: tabular-nums;
    }
`;
document.head.appendChild(transferNewsStyle);

// [디버그/콘솔용 헬퍼] 원하는 선수(또는 이적 명단 등록 선수)에게 즉시 3개 구단 오퍼 발생
window.triggerOffer = function(playerName) {
    if (!gameData || !gameData.selectedTeam || !teams[gameData.selectedTeam]) {
        console.warn("[triggerOffer] 게임 데이터나 팀 정보를 찾을 수 없습니다.");
        return;
    }

    const teamPlayers = teams[gameData.selectedTeam];
    let targetPlayer = null;

    if (playerName) {
        targetPlayer = teamPlayers.find(p => p.name === playerName || p.name.includes(playerName));
    } else if (gameData.userTransferList && gameData.userTransferList.length > 0) {
        const entry = gameData.userTransferList.find(e => !e.isOfferSent) || gameData.userTransferList[0];
        targetPlayer = entry.player;
    } else {
        targetPlayer = teamPlayers[0];
    }

    if (!targetPlayer) {
        console.warn(`[triggerOffer] 대상 선수를 찾을 수 없습니다: ${playerName || '스쿼드 선수 없음'}`);
        return;
    }

    transferSystem.processUserTransferOffers(targetPlayer);
    if (typeof mailManager !== 'undefined') {
        mailManager.renderList();
        const latestMail = mailManager.mails[0]; // unshift로 들어가므로 0번 인덱스가 최신 메일
        if (latestMail) mailManager.openMail(latestMail);
        if (typeof showTab === 'function') showTab('mail');
    }
    console.log(`%c[이적 오퍼 생성] ${targetPlayer.name} 선수의 영입 제안 메일이 도착했습니다!`, 'color: #10b981; font-weight: bold; font-size: 13px;');
};
