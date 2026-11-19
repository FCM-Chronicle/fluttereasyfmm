// contractSystem.js - 선수 계약 만료 및 따박따박 재계약 시스템

class ContractSystem {
    constructor() {
        this.initialized = false;
    }

    // 선수 계약 기간 초기화 및 조회 (미설정 시 나이/능력치 기반 자동 부여)
    getPlayerContractYears(player) {
        if (typeof player.contractYears === 'number' && !isNaN(player.contractYears)) {
            return player.contractYears;
        }

        // 기본 계약 기간 부여 (젊은 선수는 길게, 베테랑은 짧게)
        if (player.age <= 22) {
            // 22세 이하: 4~5년 랜덤
            player.contractYears = Math.floor(Math.random() * 2) + 4;
        } else if (player.age <= 29) {
            // 23~29세: 3~4년 랜덤
            player.contractYears = Math.floor(Math.random() * 2) + 3;
        } else {
            // 30세 이상: 1~3년 랜덤
            player.contractYears = Math.floor(Math.random() * 3) + 1;
        }

        return player.contractYears;
    }

    // 선수 재계약 요구 조건 계산 (오버롤 및 성적 반영)
    calculateRenewalDemand(player) {
        const currentWage = (typeof calculatePlayerWage === 'function') 
            ? calculatePlayerWage(player) 
            : (player.weeklyWage || 1.0);

        let wageMultiplier = 1.05; // 기본 5% 인상

        // 오버롤에 따른 인상률
        if (player.rating >= 92) {
            wageMultiplier = 1.40; // 월드클래스 종결 선수는 40% 대폭 인상 요구
        } else if (player.rating >= 88) {
            wageMultiplier = 1.25; // 25% 인상 요구
        } else if (player.rating >= 84) {
            wageMultiplier = 1.15; // 15% 인상 요구
        }

        // 베테랑 감가 (33세 이상은 동결 또는 소폭 감가 허용)
        if (player.age >= 34) {
            wageMultiplier = 0.90;
        } else if (player.age >= 32) {
            wageMultiplier = 1.0;
        }

        const demandedWage = Math.max(0.3, parseFloat((currentWage * wageMultiplier).toFixed(2)));
        const wageDiff = parseFloat((demandedWage - currentWage).toFixed(2));

        return {
            currentWage: currentWage,
            demandedWage: demandedWage,
            wageDiff: wageDiff,
            extensionYears: 2
        };
    }

    // 재계약 실행
    renewContract(playerName) {
        if (!gameData || !gameData.selectedTeam || !teams[gameData.selectedTeam]) {
            return { success: false, message: "구단 정보를 찾을 수 없습니다." };
        }

        const myTeam = teams[gameData.selectedTeam];
        const player = myTeam.find(p => p.name === playerName);
        if (!player) {
            return { success: false, message: "선수를 찾을 수 없습니다." };
        }

        const demand = this.calculateRenewalDemand(player);
        const currentTotal = (typeof calculateTotalWages === 'function') ? calculateTotalWages() : (gameData.totalWeeklyWage || 0);
        const projectedTotal = parseFloat((currentTotal + demand.wageDiff).toFixed(2));
        const wageBudget = (gameData.wageBudget || 0);

        // 주급 자금 한도 체크
        if (projectedTotal > wageBudget) {
            const shortAmount = parseFloat((projectedTotal - wageBudget).toFixed(2));
            return {
                success: false,
                message: `주급 예산이 부족합니다!\n\n` +
                         `- 선수 요구 주급: ${demand.demandedWage}억원/주\n` +
                         `- 재계약 후 총 주급: ${projectedTotal}억원/주\n` +
                         `- 현재 주급 예산: ${wageBudget}억원/주 (부족분: ${shortAmount}억원)\n\n` +
                         `[재정] 탭에서 이적 자금을 주급 자금으로 전환하거나, 잉여 선수를 처분해 주급 공간을 확보해야 합니다.`
            };
        }

        // 재계약 성공 적용
        player.weeklyWage = demand.demandedWage;
        player.contractYears = Math.min(4, (this.getPlayerContractYears(player) + demand.extensionYears));

        if (typeof calculateTotalWages === 'function') {
            calculateTotalWages();
        }

        if (typeof updateFinanceDisplay === 'function') {
            updateFinanceDisplay();
        }

        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }

        if (typeof displayTeamPlayers === 'function') {
            displayTeamPlayers();
        }

        const finPanel = document.getElementById('finance');
        if (finPanel && finPanel.classList.contains('active') && typeof renderFinanceTab === 'function') {
            renderFinanceTab();
        }

        return {
            success: true,
            message: `[재계약 성공!]\n${player.name} 선수와 계약을 2년 연장했습니다!\n\n` +
                     `- 신규 주급: ${player.weeklyWage}억원/주\n` +
                     `- 잔여 계약: ${player.contractYears}년`
        };
    }

    // 시즌 종료 시 계약 연수 차감 및 만료(FA) 처리 (endSeason.js 연동)
    processSeasonEndContracts() {
        if (!gameData || !gameData.selectedTeam || !teams[gameData.selectedTeam]) return;

        const myTeam = teams[gameData.selectedTeam];
        const expiredPlayers = [];
        const warningPlayers = [];

        // 1. 유저 팀 계약 차감
        for (let i = myTeam.length - 1; i >= 0; i--) {
            const player = myTeam[i];
            const years = this.getPlayerContractYears(player);
            player.contractYears = years - 1;

            if (player.contractYears <= 0) {
                // 계약 만료 -> FA 방출
                expiredPlayers.push(player);
                myTeam.splice(i, 1);
                if (typeof removePlayerFromSquad === 'function') {
                    removePlayerFromSquad(player);
                }
            } else if (player.contractYears === 1) {
                // 1년 남음 경고
                warningPlayers.push(player);
            }
        }

        // 2. AI 팀 계약 차감 및 자가 갱신
        Object.keys(teams).forEach(teamKey => {
            if (teamKey === gameData.selectedTeam) return;
            const aiTeam = teams[teamKey] || [];
            for (let i = aiTeam.length - 1; i >= 0; i--) {
                const p = aiTeam[i];
                p.contractYears = (typeof p.contractYears === 'number' ? p.contractYears : 2) - 1;
                if (p.contractYears <= 0) {
                    if (p.rating >= 78) {
                        // AI 핵심 선수는 2년 자가 재계약
                        p.contractYears = 2;
                    } else {
                        // 노후/저성과 선수는 AI도 FA 방출
                        aiTeam.splice(i, 1);
                    }
                }
            }
        });

        // 3. 유저 팀 주급 재계산 및 UI 동기화
        if (typeof calculateTotalWages === 'function') {
            calculateTotalWages();
        }
        if (typeof updateFinanceDisplay === 'function') {
            updateFinanceDisplay();
        }
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }

        // 4. 메일 발송
        if (typeof mailManager !== 'undefined') {
            if (expiredPlayers.length > 0) {
                const expiredNames = expiredPlayers.map(p => `- ${p.name} (${p.position}, OVR ${Math.floor(p.rating)})`).join('\n');
                mailManager.addMail(
                    `[계약 만료] 선수 ${expiredPlayers.length}명 자유계약(FA) 방출 안내`,
                    '구단 법무/선수계약팀',
                    `감독님, 이번 시즌을 끝으로 계약이 만료된 다음 선수들이 재계약 없이 구단을 떠났습니다:\n\n` +
                    `${expiredNames}\n\n` +
                    `이들은 자유계약(FA) 신분이 되어 이적료 없이 팀을 떠났습니다. 스쿼드 공백을 메우기 위해 유망주 콜업 또는 이적시장 영입을 검토하세요.`
                );
            }

            if (warningPlayers.length > 0) {
                const warningNames = warningPlayers.map(p => `- ${p.name} (${p.position}, ${p.age}세, OVR ${Math.floor(p.rating)})`).join('\n');
                mailManager.addMail(
                    `[경고] 계약 만료 1년 전 선수단 (${warningPlayers.length}명) 재계약 요망`,
                    '구단 법무/선수계약팀',
                    `감독님, 다음 선수들의 계약 기간이 이제 1년밖에 남지 않았습니다:\n\n` +
                    `${warningNames}\n\n` +
                    `이번 시즌 내에 스쿼드 탭에서 [재계약]을 완료하지 않으면, 다음 시즌 종료 시 이적료 없이 FA로 팀을 떠나게 됩니다. 서둘러 재계약을 진행해 주세요!`
                );
            }
        }

        console.log(`[Contract] 계약 연수 차감 완료: FA 방출 ${expiredPlayers.length}명, 1년 잔여 경고 ${warningPlayers.length}명`);
    }

    // 재계약 협상 모달 UI 열기 (EA FC On Call 통화 UI로 통합)
    openRenewalModal(player) {
        if (!player) return;
        const demand = this.calculateRenewalDemand(player);

        if (typeof transferSystem !== 'undefined' && typeof transferSystem.openRenewalNegotiation === 'function') {
            transferSystem.openRenewalNegotiation(player, demand);
            return;
        }
    }
}

const contractSystem = new ContractSystem();
if (typeof window !== 'undefined') {
    window.contractSystem = contractSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContractSystem, contractSystem };
}

