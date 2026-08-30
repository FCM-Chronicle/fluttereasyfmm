// start.js - 팀 선택 화면 UI 로직 및 데이터 표시

// 전역 변수 selectionState가 script.js에 정의되어 있다고 가정 (없으면 초기화)
if (typeof selectionState === 'undefined') {
    window.selectionState = {
        league: 1,
        teamIndex: 0
    };
}

// 팀 선택 UI 렌더링 함수
function renderTeamSelectionUI() {
    // 데이터 로드 확인
    if (typeof allTeams === 'undefined' || typeof teamNames === 'undefined') return;

    const league = selectionState.league;
    const teamsInLeague = Object.keys(allTeams).filter(key => allTeams[key].league === league);
    
    // 인덱스 안전 장치
    if (selectionState.teamIndex >= teamsInLeague.length) selectionState.teamIndex = 0;
    if (selectionState.teamIndex < 0) selectionState.teamIndex = teamsInLeague.length - 1;

    const currentTeamKey = teamsInLeague[selectionState.teamIndex];
    const teamData = allTeams[currentTeamKey];
    const teamName = teamNames[currentTeamKey] || currentTeamKey;

    // 0. 리그 표시 업데이트
    const leagueNames = { 1: "🏆 1부 리그", 2: "⚽ 2부 리그", 3: "🌟 3부 리그" };
    const leagueNameEl = document.getElementById('ts-league-name');
    if (leagueNameEl) leagueNameEl.textContent = leagueNames[league];

    // 1. 좌측: Identity Section (로고, 이름, 별점)
    const logoContainer = document.getElementById('ts-team-logo-container');
    if (logoContainer && typeof getTeamLogoHTML === 'function') {
        logoContainer.innerHTML = getTeamLogoHTML(currentTeamKey);
        const logoImg = logoContainer.querySelector('img');
        if (logoImg) {
            logoImg.className = 'ts-team-logo'; // 스타일 클래스 적용
        }
    }

    const teamNameEl = document.getElementById('ts-team-name');
    if (teamNameEl) teamNameEl.textContent = teamName;
    
    // 별점 계산 (평균 오버롤 기반)
    const avgRating = calculateStaticTeamRating(currentTeamKey);
    let stars = '★★★☆☆';
    if (avgRating >= 85) stars = '★★★★★';
    else if (avgRating >= 80) stars = '★★★★☆';
    else if (avgRating >= 75) stars = '★★★☆☆';
    else if (avgRating >= 70) stars = '★★☆☆☆';
    else stars = '★☆☆☆☆';
    
    const starsEl = document.getElementById('ts-team-stars');
    if (starsEl) starsEl.textContent = stars;

    // 선택 버튼 이벤트 연결
    const selectBtn = document.getElementById('ts-select-btn');
    if (selectBtn) {
        selectBtn.onclick = () => {
            if (typeof selectTeam === 'function') {
                selectTeam(currentTeamKey);
            }
        };
    }

    // 2. 중앙: The Story Section (설명, 연고지, 자금)
    const descEl = document.getElementById('ts-team-desc');
    if (descEl) descEl.textContent = teamData.description || "전통의 강호이자 새로운 도전자";
    
    const cityEl = document.getElementById('ts-team-city');
    if (cityEl) {
        // teamCities는 script.js에 정의되어 있음
        const city = (typeof teamCities !== 'undefined' && teamCities[currentTeamKey]) ? teamCities[currentTeamKey] : "알 수 없음";
        cityEl.textContent = city;
    }

    // 시작 자금 설정 (데이터에 정의된 팀별 실제 예산 표시)
    const budget = (teamData.budget !== undefined ? teamData.budget : (league === 3 ? 10 : 1000)) + "억";
    const budgetEl = document.getElementById('ts-team-budget');
    if (budgetEl) budgetEl.textContent = budget;

    // 3. 우측: Key Assets Section (핵심 선수)
    const players = teamData.players;
    // 오버롤 순 정렬
    const sortedPlayers = [...players].sort((a, b) => b.rating - a.rating);
    
    // Key Player 1 & 2 업데이트
    // Key Player 1, 2, 3 업데이트
    updateKeyPlayerCard('ts-key-player-1', sortedPlayers[0]);
    updateKeyPlayerCard('ts-key-player-2', sortedPlayers[1]);
    updateKeyPlayerCard('ts-key-player-3', sortedPlayers[2]);
}

// 키 플레이어 카드 업데이트 헬퍼 함수
function updateKeyPlayerCard(elementId, player) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (!player) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = `
        <img src="assets/players/${player.name}.webp" class="ts-kp-img" onerror="this.src='assets/players/default.webp'">
        <div class="ts-kp-info">
            <div>${player.name}</div>
            <div>${player.position} | ${player.age}세</div>
        </div>
        <div class="ts-kp-ovr">${Math.floor(player.rating)}</div>
    `;
}

// 정적 팀 평점 계산 (allTeams 데이터 기반)
function calculateStaticTeamRating(teamKey) {
    if (typeof allTeams === 'undefined') return 0;
    const players = allTeams[teamKey].players;
    if (!players || players.length === 0) return 0;
    
    // 상위 11명 기준 평균
    const top11 = [...players].sort((a, b) => b.rating - a.rating).slice(0, 11);
    const sum = top11.reduce((acc, p) => acc + p.rating, 0);
    return sum / top11.length;
}

// 리그 변경 함수 (화살표용)
function changeLeague(direction) {
    if (typeof selectionState === 'undefined') return;
    
    let newLeague = selectionState.league + direction;
    if (newLeague > 3) newLeague = 1;
    if (newLeague < 1) newLeague = 3;
    
    selectionState.league = newLeague;
    selectionState.teamIndex = 0; // 리그 변경 시 첫 팀으로 리셋
    renderTeamSelectionUI();
}

// 팀 네비게이션 함수
function changeSelectionTeam(direction) {
    if (typeof selectionState === 'undefined' || typeof allTeams === 'undefined') return;

    const league = selectionState.league;
    const teamsInLeague = Object.keys(allTeams).filter(key => allTeams[key].league === league);
    
    selectionState.teamIndex += direction;
    
    // 순환 로직
    if (selectionState.teamIndex >= teamsInLeague.length) selectionState.teamIndex = 0;
    if (selectionState.teamIndex < 0) selectionState.teamIndex = teamsInLeague.length - 1;
    
    renderTeamSelectionUI();
}

// 전역 함수로 노출 (HTML onclick 속성에서 접근 가능하도록)
window.renderTeamSelectionUI = renderTeamSelectionUI;
window.changeLeague = changeLeague;
window.changeSelectionTeam = changeSelectionTeam;
