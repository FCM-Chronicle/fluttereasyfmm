/**
 * TeamUtils.js - 팀 전력 계산 및 선수 관리 공통 유틸리티
 */
const TeamUtils = {
    // 1. 특정 팀의 베스트 11 선발 (포지션 고려)
    getBestEleven(teamKey) {
        const teamPlayers = teams[teamKey];
        if (!teamPlayers) return [];

        const gks = teamPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
        const dfs = teamPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
        const mfs = teamPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
        const fws = teamPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);

        const best11 = [];
        if (gks.length > 0) best11.push(gks[0]);
        for (let i = 0; i < 4 && i < dfs.length; i++) best11.push(dfs[i]);
        for (let i = 0; i < 3 && i < mfs.length; i++) best11.push(mfs[i]);
        for (let i = 0; i < 3 && i < fws.length; i++) best11.push(fws[i]);

        // 11명이 부족할 경우 나머지 포지션에서 보충
        if (best11.length < 11) {
            const remaining = teamPlayers.filter(p => !best11.includes(p)).sort((a, b) => b.rating - a.rating);
            for (let i = 0; i < remaining.length && best11.length < 11; i++) {
                best11.push(remaining[i]);
            }
        }
        return best11;
    },

    // 선수가 해당 팀의 베스트 11에 포함되는지 확인 (핵심 선수 판별용)
    isPlayerInBest11(teamKey, playerName) {
        if (!teamKey || teamKey === '외부리그') return false;
        const best11 = this.getBestEleven(teamKey);
        return best11.some(p => p.name === playerName);
    },

    // 2. 선수 목록 또는 스쿼드 객체의 평균 능력치 계산
    calculateRating(playersOrSquad) {
        let players = [];
        if (Array.isArray(playersOrSquad)) {
            players = playersOrSquad.filter(p => p);
        } else if (playersOrSquad && typeof playersOrSquad === 'object') {
            // 스쿼드 객체 (gk, df[], mf[], fw[]) 처리
            const s = playersOrSquad;
            if (s.gk) players.push(s.gk);
            if (s.df) players.push(...s.df.filter(p => p));
            if (s.mf) players.push(...s.mf.filter(p => p));
            if (s.fw) players.push(...s.fw.filter(p => p));
        }

        if (players.length === 0) return 0;
        const totalRating = players.reduce((sum, p) => sum + p.rating, 0);
        return totalRating / players.length;
    },

    // 3. 두 팀간의 전력 차이 분석
    getStrengthDifference(userRating, opponentRating) {
        const difference = userRating - opponentRating;
        return {
            userRating,
            opponentRating,
            difference,
            strengthGap: Math.abs(difference),
            userAdvantage: difference > 0
        };
    },

    // 4. 선수가 특정 스쿼드에 포함되어 있는지 확인
    isPlayerInSquad(player, squad) {
        if (!player || !squad) return false;
        if (squad.gk && squad.gk.name === player.name) return true;
        
        const fieldPositions = ['df', 'mf', 'fw'];
        for (const pos of fieldPositions) {
            if (squad[pos] && squad[pos].some(p => p && p.name === player.name)) {
                return true;
            }
        }
        return false;
    }
};

// 하위 호환성을 위해 전역 변수로 노출 (기존 코드 대응)
window.TeamUtils = TeamUtils;
window.calculateTeamRating = (playersOrSquad) => {
    if (typeof playersOrSquad === 'string') {
        return TeamUtils.calculateRating(TeamUtils.getBestEleven(playersOrSquad));
    }

    if (playersOrSquad !== undefined) {
        return TeamUtils.calculateRating(playersOrSquad);
    }

    if (typeof gameData !== 'undefined' && gameData.squad) {
        return TeamUtils.calculateRating(gameData.squad);
    }

    return 0;
};
window.getBestEleven = TeamUtils.getBestEleven;
window.calculateUserTeamRating = () => TeamUtils.calculateRating(gameData.squad);
window.calculateOpponentTeamRating = (teamKey) => TeamUtils.calculateRating(TeamUtils.getBestEleven(teamKey));
window.isPlayerInSquad = (player) => TeamUtils.isPlayerInSquad(player, gameData.squad);
window.calculateTeamStrengthDifference = () => TeamUtils.getStrengthDifference(window.calculateUserTeamRating(), window.calculateOpponentTeamRating(gameData.currentOpponent));