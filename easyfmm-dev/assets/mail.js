// mail.js - 메일 시스템 구현

class MailManager {
    constructor() {
        this.mails = [];
        this.idCounter = 1;
        this.unreadCount = 0;
    }

    // 메일 추가 (공통 메서드)
    addMail(title, sender, content, type = 'normal', data = null) {
        const mail = {
            id: this.idCounter++,
            title: title,
            sender: sender,
            content: content,
            type: type, // 'normal', 'transfer_offer'
            data: data, // 이적 제안 시 선수 정보 등 저장
            timestamp: Date.now(),
            isRead: false,
            isProcessed: false // 오퍼 수락/거절 여부 확인용
        };
        
        this.mails.unshift(mail); // 최신 메일이 위로 오도록
        
        // [추가] 메일함 최대 50개 제한
        if (this.mails.length > 50) {
            this.mails.pop(); // 가장 오래된 메일 삭제
        }
        
        this.unreadCount++;
        this.updateBadge();
        
        // 현재 메일 탭이 열려있으면 리스트 갱신
        if (document.getElementById('mail') && document.getElementById('mail').classList.contains('active')) {
            this.renderList();
        }
    }

    // 뱃지(안 읽은 메일 수) 업데이트
    updateBadge() {
        const badge = document.getElementById('mailBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // 안 읽은 메일 수 반환
    getUnreadCount() {
        return this.unreadCount;
    }

    // 메일 목록 렌더링
    renderList() {
        const listContainer = document.getElementById('mailList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';
        
        if (this.mails.length === 0) {
            listContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #aaa;">메일이 없습니다.</div>';
            return;
        }
        
        this.mails.forEach(mail => {
            const item = document.createElement('div');
            item.className = `mail-item ${mail.isRead ? 'read' : 'unread'}`;
            item.innerHTML = `
                <div class="mail-item-header">
                    <span>${mail.sender}</span>
                    <span>${this.formatDate(mail.timestamp)}</span>
                </div>
                <div class="mail-title">${mail.title}</div>
            `;
            
            item.addEventListener('click', () => {
                this.openMail(mail);
                // 읽음 처리 스타일 업데이트
                item.classList.remove('unread');
                item.classList.add('read');
            });
            
            listContainer.appendChild(item);
        });
    }

    // 메일 내용 열기
    openMail(mail) {
        const detailContainer = document.getElementById('mailDetail');
        if (!detailContainer) return;
        
        // 읽음 처리
        if (!mail.isRead) {
            mail.isRead = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateBadge();
        }
        
        let actionButtons = '';
        
        // 이적 제안 메일이고 아직 처리되지 않았다면 버튼 표시
        if (mail.type === 'transfer_offer') {
            if (!mail.isProcessed) {
                actionButtons = `
                    <div class="mail-actions">
                        <button class="btn primary" onclick="mailManager.acceptOffer(${mail.id})">제안 수락 (이적료 ${mail.data.price}억)</button>
                        <button class="btn" onclick="mailManager.rejectOffer(${mail.id})" style="background-color: #e74c3c;">제안 거절</button>
                    </div>
                `;
            } else {
                actionButtons = `
                    <div class="mail-actions">
                        <div style="color: #aaa; font-style: italic; padding: 10px; border: 1px solid #444; border-radius: 5px;">
                            ${mail.data.resultMessage || '이미 처리된 제안입니다.'}
                        </div>
                    </div>
                `;
            }
        }
        // [추가] 유저가 직접 올린 이적 명단 오퍼 처리
        else if (mail.type === 'user_transfer_list_offers') {
            if (!mail.isProcessed) {
                let offersHtml = mail.data.offers.map(offer => `
                    <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color: #ffd700;">${offer.teamName}</strong>
                            <span style="color: #2ecc71; font-weight: bold;">${offer.fee}억</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #ccc; margin: 0 0 10px 0;">"${offer.message}"</p>
                        <button class="btn primary" style="width: 100%; padding: 5px;" onclick="transferSystem.acceptUserOffer('${mail.data.playerName}', '${offer.teamKey}', ${offer.fee}, ${mail.id})">이 제안 수락</button>
                        <button class="btn" style="width: 100%; padding: 5px; margin-top: 5px; background: #f39c12;" onclick="transferSystem.negotiateUserOffer('${mail.data.playerName}', '${offer.teamKey}', ${offer.fee}, ${mail.id})">이적료 협상</button>
                    </div>
                `).join('');
                
                actionButtons = `
                    <div class="mail-actions" style="display: block;">
                        ${offersHtml}
                        <button class="btn" style="width: 100%; background: #e74c3c; margin-top: 5px;" onclick="transferSystem.rejectUserOffer('${mail.data.playerName}', ${mail.id})">모든 제안 거절 및 명단 제외</button>
                    </div>
                `;
            } else {
                actionButtons = `<div class="mail-actions"><div style="color: #aaa; font-style: italic; padding: 10px; border: 1px solid #444; border-radius: 5px;">${mail.data.resultMessage}</div></div>`;
            }
        }
        // [추가] 비서 제안 메일
        else if (mail.type === 'secretary_advice') {
            if (!mail.isProcessed) {
                actionButtons = `
                    <div class="mail-actions">
                        <button class="btn primary" onclick="mailManager.acceptSecretaryAdvice(${mail.id})">제안 수락</button>
                        <button class="btn" onclick="mailManager.rejectOffer(${mail.id})" style="background-color: #7f8c8d;">나중에</button>
                    </div>
                `;
            } else {
                actionButtons = `
                    <div class="mail-actions">
                        <div style="color: #aaa; font-style: italic; padding: 10px; border: 1px solid #444; border-radius: 5px;">
                            ${mail.data.resultMessage || '처리된 제안입니다.'}
                        </div>
                    </div>
                `;
            }
        }

        detailContainer.innerHTML = `
            <div class="mail-content-header">
                <h2 style="margin-bottom: 10px; color: #ffd700;">${mail.title}</h2>
                <div style="display: flex; justify-content: space-between; color: #aaa; font-size: 0.9rem;">
                    <span>보낸 사람: ${mail.sender}</span>
                    <span>${this.formatDate(mail.timestamp)}</span>
                </div>
            </div>
            <div class="mail-body" style="white-space: pre-line; line-height: 1.6;">
                ${mail.content}
            </div>
            ${actionButtons}
        `;
    }

    // 날짜 포맷 유틸리티
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // ==================== 특수 메일 발송 메서드 ====================

    // 1. 환영 메시지 (취임 시)
    sendWelcomeMail() {
        if (!gameData.selectedTeam) return;
        
        const teamName = teamNames[gameData.selectedTeam] || gameData.selectedTeam;
        const players = teams[gameData.selectedTeam];
        
        // 상위 3명 선수 찾기 (능력치 내림차순)
        const topPlayers = [...players].sort((a, b) => b.rating - a.rating).slice(0, 3);
        const topPlayersText = topPlayers.map((p, i) => `${i + 1}. ${p.name} (${p.position}, ★${p.rating})`).join('\n');
        
        const content = `감독님, ${teamName}에 오신 것을 환영합니다!\n\n` +
            `현재 우리 선수단은 총 ${players.length}명으로 구성되어 있습니다.\n\n` +
            `[팀의 핵심 선수]\n${topPlayersText}\n\n` +
            `팬들의 기대가 큽니다. 팀을 잘 이끌어주시길 부탁드립니다.\n\n` +
            `감사합니다.\n구단주 올림`;
            
        this.addMail(`[환영] ${teamName} 감독 취임을 축하합니다`, '구단주', content);
    }

    // 2. 경기 결과 메일
    sendMatchResultMail(matchData) {
        const payload = (typeof window.buildMatchResultPayload === 'function')
            ? window.buildMatchResultPayload(matchData)
            : matchData;

        const isUserHome = payload.homeTeam === gameData.selectedTeam;
        
        const opponent = isUserHome 
            ? teamNames[payload.awayTeam] 
            : teamNames[payload.homeTeam];
            
        const myScore = payload.userScore !== undefined ? payload.userScore : (isUserHome ? payload.homeScore : payload.awayScore);
        const oppScore = payload.oppScore !== undefined ? payload.oppScore : (isUserHome ? payload.awayScore : payload.homeScore);
        
        const result = myScore > oppScore ? '승리' : (myScore < oppScore ? '패배' : '무승부');
        
        let details = '';
        const goals = payload.goalEvents || payload.events.filter(e => e.type === 'goal');
        
        if (goals.length > 0) {
            details = '\n[주요 기록]\n';
            goals.forEach(g => {
                const teamLabel = g.team || teamNames[g.teamKey] || '';
                details += `${g.minute}' ${g.scorer}${teamLabel ? ` (${teamLabel})` : ''}`;
                if (g.assister) details += ` (도움: ${g.assister})`;
                details += '\n';
            });
            if (payload.hadDrama) {
                details += '\n※ 골 직전 몰입 연출이 포함된 극적인 경기였습니다.\n';
            }
        } else {
            details = '\n[주요 기록]\n득점 없음\n';
        }
        
        const content = `지난 라운드 ${opponent}와의 경기 결과 보고입니다.\n\n` +
            `결과: ${myScore} - ${oppScore} (${result})\n` +
            `${details}\n` +
            `수고하셨습니다.`;
            
        this.addMail(`[경기 결과] vs ${opponent}`, '수석 코치', content);
    }

    // 3. 부상 보고 메일
    sendInjuryMail(injuryData) {
        const player = injuryData.player;
        const games = injuryData.gamesOut;
        
        const content = `안타까운 소식입니다.\n\n` +
            `${player.name} 선수가 경기 중 부상을 당했습니다.\n` +
            `정밀 검사 결과, 약 ${games}경기 동안 출전이 불가능할 것으로 보입니다.\n\n` +
            `의료진이 최선을 다해 치료하겠습니다.`;
            
        this.addMail(`[부상] ${player.name} 부상 보고`, '의무 팀장', content);
    }

    // 6. 부상 회복 메일 (추가)
    sendRecoveryMail(player) {
        const content = `기쁜 소식입니다.\n\n` +
            `${player.name} 선수가 부상에서 완전히 회복되었습니다.\n` +
            `이제 다시 경기에 출전할 수 있습니다.\n\n` +
            `선수의 컨디션을 확인하시고 기용해주시기 바랍니다.`;
            
        this.addMail(`[회복] ${player.name} 부상 회복 완료`, '의무 팀장', content);
    }

    // 4. 스폰서 계약 메일
    sendSponsorMail(sponsor) {
        const content = `새로운 스폰서 ${sponsor.name}와의 계약이 체결되었습니다.\n\n` +
            `[계약 조건]\n` +
            `- 계약금: ${sponsor.signingBonus}억\n` +
            `- 승리 수당: ${sponsor.payPerWin}억\n` +
            `- 패배 위로금: ${sponsor.payPerLoss}억\n` +
            `- 계약 기간: ${sponsor.contractLength}경기\n\n` +
            `구단 재정에 큰 도움이 될 것입니다.`;
            
        this.addMail(`[계약] ${sponsor.name} 스폰서 계약 체결`, '마케팅 팀장', content);
    }

    // 5. 이적 제안 체크 및 발송 (특수 상황)
    checkTransferOffer() {
        // [수정] 유저가 직접 명단에 올린 선수가 대기 중이면 무작위 오퍼는 잠시 중단 (혼동 방지)
        const hasPendingUserOffer = gameData.userTransferList && 
            gameData.userTransferList.some(entry => !entry.isOfferSent);
        if (hasPendingUserOffer) return;

        // 시즌당 약 3번 -> 약 8% 확률 (경기당)
        if (Math.random() > 0.08) return;
        
        const teamPlayers = teams[gameData.selectedTeam];
        // 최소 인원(16명) 이하일 때는 제안 안 옴
        if (teamPlayers.length <= 16) return; 
        
        // 랜덤 선수 선택
        const targetPlayer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
        
        // 가격 책정 (가치 + 100~500억)
        let basePrice = 0;
        if (typeof transferSystem !== 'undefined') {
            basePrice = transferSystem.calculatePlayerPrice(targetPlayer);
        } else {
            basePrice = targetPlayer.rating * 10; // fallback
        }
        
        const priceFactor = 0.9 + (Math.random() * 0.15); // 90% ~ 105% (시장가 근처)
        const offerPrice = Math.round(basePrice * priceFactor);
        
        // 제안 팀 (랜덤)
        const otherTeams = Object.keys(teams).filter(t => t !== gameData.selectedTeam);
        const offerTeamKey = otherTeams[Math.floor(Math.random() * otherTeams.length)];
        const offerTeamName = teamNames[offerTeamKey] || offerTeamKey;
        
        const content = `다른 구단으로부터 우리 선수에 대한 이적 제안이 도착했습니다.\n\n` +
            `대상 선수: ${targetPlayer.name} (${targetPlayer.position}, ${targetPlayer.rating})\n` +
            `제안 구단: ${offerTeamName}\n` +
            `제안 금액: ${offerPrice}억\n\n` +
            `현재 시장 상황을 고려했을 때 적정한 수준의 제안입니다. 이 제안을 수락하시겠습니까?`;
            
        this.addMail(
            `[제안] ${targetPlayer.name} 이적 제안 도착`, 
            '단장', 
            content, 
            'transfer_offer', 
            { 
                playerName: targetPlayer.name,
                price: offerPrice,
                targetTeam: offerTeamKey,
                targetTeamName: offerTeamName
            }
        );
    }

    // 6. 비서 보고서 체크 및 발송 (추가)
    checkSecretaryReport() {
        // 3경기마다 발송 (너무 자주 오지 않도록)
        if (gameData.matchesPlayed % 3 !== 0) return;

        const rand = Math.random();
        
        if (rand < 0.4) {
            this.sendTacticalAdviceMail();
        } else if (rand < 0.7) {
            this.sendMoraleAdviceMail();
        } else {
            this.sendTrainingAdviceMail();
        }
    }

    sendTacticalAdviceMail() {
        if (!gameData.currentOpponent) return;
        
        // 전술 시스템 접근
        if (typeof TacticSystem === 'undefined') return;
        const ts = new TacticSystem();
        const opponentTactic = ts.getOpponentTactic(gameData.currentOpponent);
        const recommendations = ts.getRecommendedTactic(opponentTactic);
        
        if (recommendations.length === 0) return;
        
        const recommended = recommendations[0];
        const secretaryName = gameData.secretaryName || "비서";
        
        const content = `감독님, 다음 상대인 ${teamNames[gameData.currentOpponent]}의 전력 분석 보고서입니다.\n\n` +
            `상대는 주로 '${ts.getTacticName(opponentTactic)}' 전술을 사용합니다.\n` +
            `이에 대한 대응책으로 '${recommended.name}' 전술을 추천드립니다.\n\n` +
            `전술을 변경하시겠습니까?`;
            
        this.addMail(
            `[보고] 다음 경기 전술 제안`, 
            secretaryName, 
            content, 
            'secretary_advice', 
            { 
                subType: 'tactic',
                targetTactic: recommended.key,
                tacticName: recommended.name
            }
        );
    }

    sendMoraleAdviceMail() {
        if (gameData.teamMorale >= 90) return; // 사기가 이미 높으면 스킵
        
        const secretaryName = gameData.secretaryName || "비서";
        const cost = 10;
        
        const content = `감독님, 최근 선수단의 분위기가 조금 가라앉은 것 같습니다.\n` +
            `팀 회식을 통해 사기를 북돋우는 것이 어떨까요?\n\n` +
            `비용: ${cost}억\n` +
            `예상 효과: 사기 +10`;
            
        this.addMail(
            `[건의] 팀 회식 제안`, 
            secretaryName, 
            content, 
            'secretary_advice', 
            { 
                subType: 'morale',
                cost: cost,
                moraleBoost: 10
            }
        );
    }

    sendTrainingAdviceMail() {
        const secretaryName = gameData.secretaryName || "비서";
        const lines = ['attack', 'midfield', 'defense'];
        const targetLine = lines[Math.floor(Math.random() * lines.length)];
        const lineName = targetLine === 'attack' ? '공격진' : (targetLine === 'midfield' ? '미드필더진' : '수비진');
        
        const content = `감독님, 다음 경기를 대비해 ${lineName} 집중 훈련을 진행하는 것이 좋겠습니다.\n` +
            `훈련을 진행하면 다음 경기에서 해당 라인의 능력치가 일시적으로 상승합니다.\n\n` +
            `특별 훈련을 지시하시겠습니까?`;
            
        this.addMail(
            `[건의] ${lineName} 집중 훈련 제안`, 
            secretaryName, 
            content, 
            'secretary_advice', 
            { 
                subType: 'training',
                targetLine: targetLine,
                lineName: lineName
            }
        );
    }

    // 비서 제안 수락 처리
    acceptSecretaryAdvice(mailId) {
        const mail = this.mails.find(m => m.id === mailId);
        if (!mail || mail.isProcessed) return;
        
        const data = mail.data;
        
        if (data.subType === 'tactic') {
            gameData.currentTactic = data.targetTactic;
            mail.data.resultMessage = `전술을 '${data.tacticName}'(으)로 변경했습니다.`;
            
            // UI 갱신 (전술 드롭다운이 있다면)
            const tacticSelect = document.getElementById('tacticSelect');
            if (tacticSelect) tacticSelect.value = data.targetTactic;
            
            alert(`전술이 '${data.tacticName}'(으)로 변경되었습니다.`);
        } else if (data.subType === 'morale') {
            if (gameData.teamMoney < data.cost) {
                alert("자금이 부족합니다.");
                return;
            }
            gameData.teamMoney -= data.cost;
            gameData.teamMorale = Math.min(100, gameData.teamMorale + data.moraleBoost);
            mail.data.resultMessage = `팀 회식을 진행했습니다. (사기 +${data.moraleBoost})`;
            alert(`팀 회식을 진행했습니다. 사기가 올랐습니다.`);
            if (typeof updateDisplay === 'function') updateDisplay();
        } else if (data.subType === 'training') {
            // 일시적 스탯 버프 (다음 경기만)
            if (!gameData.temporaryStats) gameData.temporaryStats = {};
            
            const squad = gameData.squad;
            let players = [];
            if (data.targetLine === 'attack') players = squad.fw;
            else if (data.targetLine === 'midfield') players = squad.mf;
            else if (data.targetLine === 'defense') players = [...squad.df, squad.gk];
            
            let count = 0;
            players.forEach(p => {
                if (p) {
                    if (!gameData.temporaryStats[p.name]) gameData.temporaryStats[p.name] = {};
                    // 모든 스탯 +2 (단기 버프)
                    const stats = ['attack', 'defense', 'technique', 'speed', 'physical', 'mentality'];
                    stats.forEach(s => {
                        gameData.temporaryStats[p.name][s] = (gameData.temporaryStats[p.name][s] || 0) + 2;
                    });
                    count++;
                }
            });
            
            mail.data.resultMessage = `${data.lineName} 집중 훈련을 완료했습니다. (다음 경기 능력치 상승)`;
            alert(`${data.lineName} 선수(${count}명)들의 컨디션이 일시적으로 상승했습니다.`);
        }
        
        mail.isProcessed = true;
        this.openMail(mail); // UI 갱신
    }

    // 이적 제안 수락 처리
    acceptOffer(mailId) {
        const mail = this.mails.find(m => m.id === mailId);
        if (!mail || mail.isProcessed) return;
        
        const { playerName, price, targetTeam, targetTeamName } = mail.data;
        const teamPlayers = teams[gameData.selectedTeam];
        
        // 선수 존재 여부 확인
        const playerIndex = teamPlayers.findIndex(p => p.name === playerName);
        if (playerIndex === -1) {
            alert('선수가 이미 팀에 없습니다.');
            mail.isProcessed = true;
            mail.data.resultMessage = '선수가 이미 팀을 떠났습니다.';
            this.openMail(mail); // UI 갱신
            return;
        }
        
        const player = teamPlayers[playerIndex];
        
        // 1. 팀에서 제거
        teamPlayers.splice(playerIndex, 1);
        
        // 2. 스쿼드에서 제거 (script.js의 전역 함수 사용)
        if (typeof removePlayerFromSquad === 'function') {
            removePlayerFromSquad(player);
        }
        
        // 3. 상대 팀에 추가
        if (teams[targetTeam]) {
            teams[targetTeam].push(player);
        }
        
        // 4. 돈 추가
        gameData.teamMoney += price;
        
        // 5. 처리 완료 표시
        mail.isProcessed = true;
        mail.data.resultMessage = `제안을 수락했습니다. (${price}억 수령)`;
        
        // 6. UI 갱신
        updateDisplay();
        if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        if (typeof updateFormationDisplay === 'function') updateFormationDisplay();
        
        alert(`${player.name} 선수를 ${targetTeamName}에 ${price}억으로 이적시켰습니다.`);
        this.openMail(mail); // 버튼 숨기기 위해 다시 렌더링
        
        // SNS 포스팅
        if (typeof snsManager !== 'undefined') {
            snsManager.generateTransferPost(player.name, gameData.selectedTeam, targetTeam, price);
        }
    }

    // 이적 제안 거절 처리
    rejectOffer(mailId) {
        const mail = this.mails.find(m => m.id === mailId);
        if (!mail || mail.isProcessed) return;
        
        mail.isProcessed = true;
        mail.data.resultMessage = '제안을 거절했습니다.';
        
        alert('이적 제안을 거절했습니다.');
        this.openMail(mail);
    }

    // 저장 데이터 준비
    getSaveData() {
        return {
            mails: this.mails,
            idCounter: this.idCounter,
            unreadCount: this.unreadCount
        };
    }

    // 저장 데이터 로드
    loadSaveData(data) {
        if (!data) return;
        this.mails = data.mails || [];
        this.idCounter = data.idCounter || 1;
        this.unreadCount = data.unreadCount || 0;
        this.updateBadge();
    }
}

// 전역 인스턴스 생성
const mailManager = new MailManager();
window.mailManager = mailManager;
