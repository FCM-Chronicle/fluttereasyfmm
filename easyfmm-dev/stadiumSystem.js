// stadiumSystem.js - 실제 구단 스타디움 및 관중/매치데이 수익 & 증축 시스템

const STADIUM_DATABASE = {
    // 1부 리그 (14팀)
    "바르셀로나": { name: "스포티파이 캄 노우", capacity: 99354, city: "바르셀로나", country: "스페인" },
    "레알_마드리드": { name: "산티아고 베르나베우", capacity: 84744, city: "마드리드", country: "스페인" },
    "맨체스터_시티": { name: "에티하드 스타디움", capacity: 53400, city: "맨체스터", country: "잉글랜드" },
    "리버풀": { name: "안필드", capacity: 61276, city: "리버풀", country: "잉글랜드" },
    "토트넘_홋스퍼": { name: "토트넘 홋스퍼 스타디움", capacity: 62850, city: "런던", country: "잉글랜드" },
    "파리_생제르맹": { name: "파르크 데 프랭스", capacity: 47929, city: "파리", country: "프랑스" },
    "AC_밀란": { name: "산 시로", capacity: 75817, city: "밀라노", country: "이탈리아" },
    "인터_밀란": { name: "스타디오 주세페 메아차", capacity: 75817, city: "밀라노", country: "이탈리아" },
    "아스널": { name: "에미레이트 스타디움", capacity: 60704, city: "런던", country: "잉글랜드" },
    "나폴리": { name: "스타디오 디에고 아르만도 마라도나", capacity: 54726, city: "나폴리", country: "이탈리아" },
    "첼시": { name: "스탬퍼드 브리지", capacity: 40341, city: "런던", country: "잉글랜드" },
    "바이에른_뮌헨": { name: "알리안츠 아레나", capacity: 75024, city: "뮌헨", country: "독일" },
    "아틀레티코_마드리드": { name: "리야드 에어 메트로폴리타노", capacity: 70460, city: "마드리드", country: "스페인" },
    "도르트문트": { name: "지그날 이두나 파크", capacity: 81365, city: "도르트문트", country: "독일" },

    // 2부 리그 (14팀)
    "맨체스터_유나이티드": { name: "올드 트래포드", capacity: 74310, city: "맨체스터", country: "잉글랜드" },
    "유벤투스": { name: "알리안츠 스타디움", capacity: 41507, city: "토리노", country: "이탈리아" },
    "뉴캐슬_유나이티드": { name: "세인트 제임스 파크", capacity: 52305, city: "뉴캐슬", country: "잉글랜드" },
    "아스톤_빌라": { name: "빌라 파크", capacity: 42657, city: "버밍엄", country: "잉글랜드" },
    "라이프치히": { name: "레드불 아레나", capacity: 47069, city: "라이프치히", country: "독일" },
    "세비야": { name: "라몬 산체스 피스후안", capacity: 43883, city: "세비야", country: "스페인" },
    "아약스": { name: "요한 크루이프 아레나", capacity: 55865, city: "암스테르담", country: "네덜란드" },
    "AS_로마": { name: "스타디오 올림피코", capacity: 70634, city: "로마", country: "이탈리아" },
    "레버쿠젠": { name: "바이아레나", capacity: 30210, city: "레버쿠젠", country: "독일" },
    "스포르팅_CP": { name: "이스타디우 조제 알발라드", capacity: 50095, city: "리스본", country: "포르투갈" },
    "벤피카": { name: "이스타디우 다 루스", capacity: 64642, city: "리스본", country: "포르투갈" },
    "셀틱": { name: "셀틱 파크", capacity: 60411, city: "글래스고", country: "스코틀랜드" },
    "페예노르트": { name: "더 카위프", capacity: 47500, city: "로테르담", country: "네덜란드" },
    "올랭피크_드_마르세유": { name: "스타드 벨로드롬", capacity: 67394, city: "마르세유", country: "프랑스" },

    // 3부 리그 (14팀)
    "FC_서울": { name: "서울월드컵경기장", capacity: 66704, city: "서울", country: "대한민국" },
    "갈라타사라이": { name: "RAMS 파크", capacity: 52280, city: "이스탄불", country: "튀르키예" },
    "알_힐랄": { name: "킹덤 아레나", capacity: 30000, city: "리야드", country: "사우디아라비아" },
    "알_이티하드": { name: "킹 압둘라 스포츠 시티", capacity: 62345, city: "제다", country: "사우디아라비아" },
    "알_나스르": { name: "알 아왈 파크", capacity: 25000, city: "리야드", country: "사우디아라비아" },
    "아르헨티나_연합": { name: "에스타디오 모누멘탈", capacity: 84567, city: "부에노스아이레스", country: "아르헨티나" },
    "미국_연합": { name: "메르세데스-벤츠 스타디움", capacity: 71000, city: "애틀랜타", country: "미국" },
    "멕시코_연합": { name: "에스타디오 아스테카", capacity: 83264, city: "멕시코시티", country: "멕시코" },
    "브라질_연합": { name: "마라카낭 스타디움", capacity: 78838, city: "리우데자네이루", country: "브라질" },
    "전북_현대": { name: "전주월드컵경기장", capacity: 36781, city: "전주", country: "대한민국" },
    "울산_현대": { name: "울산문수축구경기장", capacity: 44102, city: "울산", country: "대한민국" },
    "포항_스틸러스": { name: "포항스틸야드", capacity: 17443, city: "포항", country: "대한민국" },
    "광주_FC": { name: "광주축구전용구장", capacity: 10007, city: "광주", country: "대한민국" },
    "리옹": { name: "그루파마 스타디움", capacity: 59186, city: "리옹", country: "프랑스" },

    // 레전드 팀 (14팀)
    "Legend_Barcelona": { name: "스포티파이 캄 노우", capacity: 99354, city: "바르셀로나", country: "스페인" },
    "Legend_RealMadrid": { name: "산티아고 베르나베우", capacity: 84744, city: "마드리드", country: "스페인" },
    "Legend_ManUtd": { name: "올드 트래포드", capacity: 74310, city: "맨체스터", country: "잉글랜드" },
    "Legend_ACMilan": { name: "산 시로", capacity: 75817, city: "밀라노", country: "이탈리아" },
    "Legend_Arsenal": { name: "하이버리 스타디움", capacity: 60704, city: "런던", country: "잉글랜드" },
    "Legend_Chelsea": { name: "스탬퍼드 브리지", capacity: 40341, city: "런던", country: "잉글랜드" },
    "Legend_Liverpool": { name: "안필드", capacity: 61276, city: "리버풀", country: "잉글랜드" },
    "Legend_Bayern": { name: "올림피아슈타디온 뮌헨", capacity: 75024, city: "뮌헨", country: "독일" },
    "Legend_Inter": { name: "스타디오 주세페 메아차", capacity: 75817, city: "밀라노", country: "이탈리아" },
    "Legend_Juventus": { name: "스타디오 델레 알피", capacity: 67000, city: "토리노", country: "이탈리아" },
    "Legend_Ajax": { name: "요한 크루이프 아레나", capacity: 55865, city: "암스테르담", country: "네덜란드" },
    "Legend_Roma": { name: "스타디오 올림피코", capacity: 70634, city: "로마", country: "이탈리아" },
    "Legend_Tottenham": { name: "화이트 하트 레인", capacity: 62850, city: "런던", country: "잉글랜드" },
    "Legend_Napoli": { name: "스타디오 디에고 아르만도 마라도나", capacity: 54726, city: "나폴리", country: "이탈리아" }
};

class StadiumSystem {
    constructor() {
        this.maxCapacity = 120000; // 최대 증축 가능 한계 (12만 석)
    }

    // 팀 기본 스타디움 정보 조회
    getStadiumInfo(teamKey) {
        if (!teamKey) return { name: "메인 스타디움", capacity: 45000 };
        if (STADIUM_DATABASE[teamKey]) {
            return { ...STADIUM_DATABASE[teamKey] };
        }
        if (typeof allTeams !== 'undefined' && allTeams[teamKey] && allTeams[teamKey].stadium) {
            return { ...allTeams[teamKey].stadium };
        }
        return { name: `${teamKey} 스타디움`, capacity: 45000 };
    }

    // 현재 플레이어 구단의 스타디움 상태 조회 (증축 및 시설 업그레이드 포함)
    getUserStadium() {
        if (!gameData || !gameData.selectedTeam) return null;
        
        if (!gameData.stadiumInfo) {
            this.initUserStadium(gameData.selectedTeam);
        }
        return gameData.stadiumInfo;
    }

    // 플레이어 구단 스타디움 초기화
    initUserStadium(teamKey) {
        const base = this.getStadiumInfo(teamKey);
        gameData.stadiumInfo = {
            teamKey: teamKey,
            name: base.name,
            baseCapacity: base.capacity,
            currentCapacity: base.capacity,
            level: 1,
            upgrades: {
                skybox: false,          // VIP 스카이박스 (+15% 티켓 수입)
                hybridPitch: false,     // 하이브리드 온열 잔디 (홈 부상 -30%, 전술 버프)
                megastore: false,       // 구단 메가스토어 & 박물관 (경기당 굿즈 +2.5억)
                trainingCenter: false   // 최첨단 유스 훈련 아카데미 (유망주 풀포텐 100% 해금)
            },
            stats: {
                totalAttendance: 0,
                totalRevenue: 0,
                homeMatches: 0,
                selloutCount: 0
            }
        };
        console.log(`[Stadium] 스타디움 초기화 완료: ${base.name} (${base.capacity.toLocaleString()}석)`);
        return gameData.stadiumInfo;
    }

    // 매치데이 관중 및 수익 계산
    calculateMatchday(homeTeamKey, awayTeamKey) {
        const isUserHome = (gameData && gameData.selectedTeam === homeTeamKey);
        const stadium = isUserHome ? this.getUserStadium() : this.getStadiumInfo(homeTeamKey);
        const capacity = stadium.currentCapacity || stadium.capacity || 45000;

        // 1. 관중 점유율 계산 (기본 80%)
        let occupancyRate = 80;

        // 홈팀 사기 보너스
        const morale = (gameData && isUserHome) ? (gameData.teamMorale || 50) : 60;
        occupancyRate += (morale - 50) * 0.15;

        // 리그 순위 보너스 (1부 상위권일수록 매진 임박)
        if (gameData && gameData.currentLeague === 1) {
            occupancyRate += 8;
        }

        // 빅매치 / 더비 보너스 (상대팀이 빅클럽인 경우)
        const bigClubs = ['바르셀로나', '레알_마드리드', '맨체스터_시티', '리버풀', '바이에른_뮌헨', '아스널', '파리_생제르맹'];
        if (bigClubs.includes(awayTeamKey) || bigClubs.includes(homeTeamKey)) {
            occupancyRate += 10;
        }

        // 약간의 랜덤 변동 (-3% ~ +5%)
        occupancyRate += (Math.random() * 8 - 3);
        occupancyRate = Math.min(100, Math.max(72, occupancyRate));

        // 실제 관중 수
        const attendance = Math.floor(capacity * (occupancyRate / 100));
        const isSellout = attendance >= capacity * 0.98;

        // 2. 수익 계산 (억 원 단위) - [수정] 현실적 밸런스 다이어트 (관중 1만명당 약 1.2억원)
        let ticketRevenue = Math.round((attendance * 0.00012) * 10) / 10;

        let skyboxRevenue = 0;
        let megastoreRevenue = 0;

        if (isUserHome && stadium.upgrades) {
            if (stadium.upgrades.skybox) {
                skyboxRevenue = Math.round((ticketRevenue * 0.15) * 10) / 10;
            }
            if (stadium.upgrades.megastore) {
                megastoreRevenue = 2.5; // 2.5억원 고정 굿즈 판매
            }
        }

        const totalRevenue = Math.round((ticketRevenue + skyboxRevenue + megastoreRevenue) * 10) / 10;

        return {
            stadiumName: stadium.name,
            capacity: capacity,
            attendance: attendance,
            occupancyRate: Math.round(occupancyRate * 10) / 10,
            isSellout: isSellout,
            ticketRevenue: ticketRevenue,
            skyboxRevenue: skyboxRevenue,
            megastoreRevenue: megastoreRevenue,
            totalRevenue: totalRevenue
        };
    }

    // 홈 경기 종료 시 매치데이 수익 정산 처리
    processMatchdayRevenue(matchData) {
        if (!gameData || matchData.homeTeam !== gameData.selectedTeam) return null;

        const result = this.calculateMatchday(matchData.homeTeam, matchData.awayTeam);
        const stadium = this.getUserStadium();

        // 재정 지급
        gameData.teamMoney = Math.round((gameData.teamMoney + result.totalRevenue) * 10) / 10;

        // 통계 갱신
        if (stadium && stadium.stats) {
            stadium.stats.totalAttendance += result.attendance;
            stadium.stats.totalRevenue = Math.round((stadium.stats.totalRevenue + result.totalRevenue) * 10) / 10;
            stadium.stats.homeMatches += 1;
            if (result.isSellout) stadium.stats.selloutCount += 1;
        }

        console.log(`[Stadium] 홈 경기 수익 정산: ${result.attendance.toLocaleString()}명 (${result.occupancyRate}%) -> +${result.totalRevenue}억원 지급`);
        return result;
    }

    // 경기장 좌석 증축
    expandCapacity(seatsToAdd, cost) {
        const stadium = this.getUserStadium();
        if (!stadium) return { success: false, message: "스타디움 정보를 찾을 수 없습니다." };

        if (stadium.currentCapacity >= this.maxCapacity) {
            return { success: false, message: `스타디움이 이미 최대 수용 한도(${this.maxCapacity.toLocaleString()}석)에 도달했습니다!` };
        }

        if (gameData.teamMoney < cost) {
            return { success: false, message: `공사 자금이 부족합니다. (필요: ${cost}억원 / 보유: ${gameData.teamMoney}억원)` };
        }

        // 자금 차감 및 증축 적용
        gameData.teamMoney = Math.round((gameData.teamMoney - cost) * 10) / 10;
        const oldCapacity = stadium.currentCapacity;
        stadium.currentCapacity = Math.min(this.maxCapacity, stadium.currentCapacity + seatsToAdd);
        stadium.level += 1;

        if (typeof updateDisplay === 'function') updateDisplay();

        const msg = `🎉 [스타디움 증축 완료!]\n${stadium.name}의 관중석이 ${oldCapacity.toLocaleString()}석에서 ${stadium.currentCapacity.toLocaleString()}석으로 대폭 확장되었습니다!\n(공사비 ${cost}억원 지출)`;
        return { success: true, message: msg };
    }

    // 경기장 특수 시설 설치 (Money Sink)
    installFacility(facilityKey) {
        const stadium = this.getUserStadium();
        if (!stadium) return { success: false, message: "스타디움 정보를 찾을 수 없습니다." };

        const facilities = {
            skybox: { name: "VIP 프리미엄 스카이박스", cost: 800, desc: "매치데이 티켓 수입 +15% 영구 증가" },
            hybridPitch: { name: "최첨단 하이브리드 온열 잔디", cost: 600, desc: "홈 경기 선수 부상 위험 -30% & 패스 안정성 향상" },
            megastore: { name: "구단 공식 메가스토어 & 역사관", cost: 1000, desc: "홈 경기마다 공식 굿즈/유니폼 판매 수익 +2.5억원 고정 추가" },
            trainingCenter: { name: "최첨단 유스 훈련 아카데미", cost: 900, desc: "유망주 훈련 효율 +30% 및 출전 시 풀포텐(100%) 도달 완전 해금" }
        };

        const target = facilities[facilityKey];
        if (!target) return { success: false, message: "존재하지 않는 시설입니다." };

        if (stadium.upgrades[facilityKey]) {
            return { success: false, message: `이미 설치가 완료된 시설입니다: ${target.name}` };
        }

        if (gameData.teamMoney < target.cost) {
            return { success: false, message: `자금이 부족합니다. (필요: ${target.cost}억원 / 보유: ${gameData.teamMoney}억원)` };
        }

        // 차감 및 설치
        gameData.teamMoney = Math.round((gameData.teamMoney - target.cost) * 10) / 10;
        stadium.upgrades[facilityKey] = true;

        if (typeof updateDisplay === 'function') updateDisplay();

        return {
            success: true,
            message: `✨ [시설 준공 완료!]\n'${target.name}' 공사가 성공적으로 완료되었습니다!\n효과: ${target.desc}`
        };
    }

    // 스타디움 관리 모달 열기
    openModal() {
        const stadium = this.getUserStadium();
        if (!stadium) return;

        let modal = document.getElementById('stadiumManagementModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'stadiumManagementModal';
            modal.className = 'stadium-modal-backdrop';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this.buildModalHTML(stadium);
        modal.style.display = 'flex';

        // 이벤트 바인딩
        const closeBtn = modal.querySelector('.stadium-modal-close');
        if (closeBtn) closeBtn.onclick = () => this.closeModal();

        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal();
        };
    }

    closeModal() {
        const modal = document.getElementById('stadiumManagementModal');
        if (modal) modal.style.display = 'none';
        if (typeof renderDashboard === 'function') renderDashboard();
    }

    // 인라인 탭(구장/설비 탭) 내부에 스타디움 & 구단 설비 증축 UI 렌더링
    renderTab(containerId = 'stadiumTabContent') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const stadium = this.getUserStadium();
        if (!stadium) {
            container.innerHTML = '<div style="padding:30px; text-align:center; color:#94A3B8;">구단 스타디움 정보를 불러올 수 없습니다.</div>';
            return;
        }

        container.innerHTML = this.buildModalHTML(stadium, true);
    }

    // 모달 내부 또는 탭 내부 HTML 생성
    buildModalHTML(stadium, isInlineTab = false) {
        const stats = stadium.stats || { totalAttendance: 0, totalRevenue: 0, homeMatches: 0, selloutCount: 0 };
        const avgAttendance = stats.homeMatches > 0 ? Math.round(stats.totalAttendance / stats.homeMatches) : 0;
        const progressPct = Math.min(100, Math.round((stadium.currentCapacity / this.maxCapacity) * 100));

        const isMaxCapacity = stadium.currentCapacity >= this.maxCapacity;

        return `
        <div class="${isInlineTab ? 'stadium-inline-panel' : 'stadium-modal-content'}" style="${isInlineTab ? 'max-width: 1100px; margin: 0 auto;' : ''}">
            <div class="stadium-modal-header">
                <div class="stadium-title-box">
                    <span class="stadium-badge">HOME STADIUM & CLUB FACILITIES</span>
                    <h2>${stadium.name}</h2>
                    <p class="stadium-sub">${(typeof teamNames !== 'undefined' && teamNames[stadium.teamKey]) ? teamNames[stadium.teamKey] : stadium.teamKey}의 홈 그라운드 & 구단 설비 센터 · Lv.${stadium.level}</p>
                </div>
                ${isInlineTab ? '' : '<button class="stadium-modal-close" title="닫기">&times;</button>'}
            </div>

            <!-- 스타디움 메인 스탯 배너 -->
            <div class="stadium-stats-banner">
                <div class="stadium-stat-item">
                    <span class="stat-label">현재 수용 인원</span>
                    <span class="stat-val highlight">${stadium.currentCapacity.toLocaleString()} <small>석</small></span>
                    <div class="capacity-bar-wrap">
                        <div class="capacity-bar-fill" style="width: ${progressPct}%"></div>
                    </div>
                    <span class="stat-footnote">최대 ${this.maxCapacity.toLocaleString()}석 중 ${progressPct}%</span>
                </div>
                <div class="stadium-stat-item">
                    <span class="stat-label">평균 홈 관중</span>
                    <span class="stat-val">${avgAttendance.toLocaleString()} <small>명</small></span>
                    <span class="stat-footnote">총 ${stats.homeMatches}경기 중 매진 ${stats.selloutCount}회</span>
                </div>
                <div class="stadium-stat-item">
                    <span class="stat-label">누적 매치데이 수익</span>
                    <span class="stat-val profit">+${stats.totalRevenue.toLocaleString()} <small>억원</small></span>
                    <span class="stat-footnote">티켓 및 구단 굿즈 합산</span>
                </div>
            </div>

            <!-- 구단 인프라 투자 섹션 (머니 싱크) -->
            <div class="stadium-section-title">
                <h3>관중석 증축 공사</h3>
                <span class="user-budget-display">보유 예산: <strong>${gameData.teamMoney.toLocaleString()}억원</strong></span>
            </div>

            <div class="stadium-upgrade-grid">
                <!-- 5,000석 증축 -->
                <div class="stadium-upgrade-card ${isMaxCapacity ? 'disabled' : ''}">
                    <div class="upgrade-info">
                        <h4>+5,000석 스탠드 확장</h4>
                        <p>일반 관중석을 확장하여 홈 경기 티켓 판매량을 늘립니다.</p>
                        <span class="upgrade-cost">공사비 1,200억원</span>
                    </div>
                    <button class="btn-stadium-action primary" onclick="stadiumSystem.handleExpand(5000, 1200)" ${isMaxCapacity || gameData.teamMoney < 1200 ? 'disabled' : ''}>
                        ${isMaxCapacity ? '최대치 도달' : '증축 시작'}
                    </button>
                </div>

                <!-- 10,000석 대규모 증축 -->
                <div class="stadium-upgrade-card ${isMaxCapacity ? 'disabled' : ''}">
                    <div class="upgrade-info">
                        <h4>+10,000석 메인 스탠드 대개축</h4>
                        <p>구장 2층/3층 스탠드를 대규모로 증축하여 매머드급 구장으로 도약합니다.</p>
                        <span class="upgrade-cost">공사비 2,500억원</span>
                    </div>
                    <button class="btn-stadium-action primary gold" onclick="stadiumSystem.handleExpand(10000, 2500)" ${isMaxCapacity || gameData.teamMoney < 2500 ? 'disabled' : ''}>
                        ${isMaxCapacity ? '최대치 도달' : '대개축 시작'}
                    </button>
                </div>
            </div>

            <!-- 특수 시설 업그레이드 -->
            <div class="stadium-section-title" style="margin-top: 20px;">
                <h3>스타디움 최고급 부대시설</h3>
            </div>

            <div class="stadium-facility-grid">
                <!-- VIP 스카이박스 -->
                <div class="facility-card ${stadium.upgrades.skybox ? 'purchased' : ''}">
                    <div class="facility-header">
                        <h4>VIP 스카이박스</h4>
                        <span class="facility-status-pill">${stadium.upgrades.skybox ? '보유중' : '800억원'}</span>
                    </div>
                    <p class="facility-desc">최고급 라운지를 설치하여 매치데이 티켓 수입을 15% 영구 증폭시킵니다.</p>
                    <button class="btn-stadium-action secondary" onclick="stadiumSystem.handleFacility('skybox')" ${stadium.upgrades.skybox || gameData.teamMoney < 800 ? 'disabled' : ''}>
                        ${stadium.upgrades.skybox ? '설치 완료' : '시설 구매'}
                    </button>
                </div>

                <!-- 하이브리드 잔디 -->
                <div class="facility-card ${stadium.upgrades.hybridPitch ? 'purchased' : ''}">
                    <div class="facility-header">
                        <h4>하이브리드 온열 잔디</h4>
                        <span class="facility-status-pill">${stadium.upgrades.hybridPitch ? '보유중' : '600억원'}</span>
                    </div>
                    <p class="facility-desc">사계절 최고 품질의 잔디를 유지해 홈 경기 부상 위험을 30% 낮추고 패스 성공률을 높입니다.</p>
                    <button class="btn-stadium-action secondary" onclick="stadiumSystem.handleFacility('hybridPitch')" ${stadium.upgrades.hybridPitch || gameData.teamMoney < 600 ? 'disabled' : ''}>
                        ${stadium.upgrades.hybridPitch ? '설치 완료' : '시설 구매'}
                    </button>
                </div>

                <!-- 메가스토어 -->
                <div class="facility-card ${stadium.upgrades.megastore ? 'purchased' : ''}">
                    <div class="facility-header">
                        <h4>공식 메가스토어 & 박물관</h4>
                        <span class="facility-status-pill">${stadium.upgrades.megastore ? '보유중' : '1,000억원'}</span>
                    </div>
                    <p class="facility-desc">구단 공식 굿즈와 유니폼을 판매하여 홈 경기마다 고정 2.5억원의 추가 수익을 창출합니다.</p>
                    <button class="btn-stadium-action secondary" onclick="stadiumSystem.handleFacility('megastore')" ${stadium.upgrades.megastore || gameData.teamMoney < 1000 ? 'disabled' : ''}>
                        ${stadium.upgrades.megastore ? '설치 완료' : '시설 구매'}
                    </button>
                </div>

                <!-- 유스 훈련 아카데미 -->
                <div class="facility-card ${stadium.upgrades.trainingCenter ? 'purchased' : ''}">
                    <div class="facility-header">
                        <h4>최첨단 유스 훈련 아카데미</h4>
                        <span class="facility-status-pill">${stadium.upgrades.trainingCenter ? '보유중' : '900억원'}</span>
                    </div>
                    <p class="facility-desc">최고급 훈련 피치와 데이터 분석실을 구비하여, 유망주 훈련 효율 +30% 및 출전 시 풀포텐(100%) 도달을 보장합니다.</p>
                    <button class="btn-stadium-action secondary" onclick="stadiumSystem.handleFacility('trainingCenter')" ${stadium.upgrades.trainingCenter || gameData.teamMoney < 900 ? 'disabled' : ''}>
                        ${stadium.upgrades.trainingCenter ? '설치 완료' : '시설 구매'}
                    </button>
                </div>
            </div>
        </div>
        `;
    }

    handleExpand(seats, cost) {
        const res = this.expandCapacity(seats, cost);
        alert(res.message);
        if (res.success) {
            const modal = document.getElementById('stadiumManagementModal');
            if (modal && modal.style.display === 'flex') {
                this.openModal();
            }
            this.renderTab();
            if (typeof renderFinanceTab === 'function') renderFinanceTab();
        }
    }

    handleFacility(facilityKey) {
        const res = this.installFacility(facilityKey);
        alert(res.message);
        if (res.success) {
            const modal = document.getElementById('stadiumManagementModal');
            if (modal && modal.style.display === 'flex') {
                this.openModal();
            }
            this.renderTab();
            if (typeof renderFinanceTab === 'function') renderFinanceTab();
        }
    }
}

// 전역 인스턴스 생성 및 노출
const stadiumSystemInstance = new StadiumSystem();
if (typeof window !== 'undefined') {
    window.stadiumSystem = stadiumSystemInstance;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StadiumSystem, stadiumSystem: stadiumSystemInstance, STADIUM_DATABASE };
}
