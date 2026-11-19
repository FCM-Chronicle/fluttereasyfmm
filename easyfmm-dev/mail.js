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
            type: type, // 'normal', 'transfer_offer', 'user_transfer_list_offers'
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
        
        listContainer.replaceChildren();
        
        if (this.mails.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.cssText = 'padding: 20px; text-align: center; color: #aaa;';
            emptyDiv.textContent = '메일이 없습니다.';
            listContainer.appendChild(emptyDiv);
            return;
        }
        
        this.mails.forEach(mail => {
            const item = document.createElement('div');
            item.className = `mail-item ${mail.isRead ? 'read' : 'unread'}`;
            
            const header = document.createElement('div');
            header.className = 'mail-item-header';
            
            const senderSpan = document.createElement('span');
            senderSpan.textContent = mail.sender;
            
            const dateSpan = document.createElement('span');
            dateSpan.textContent = this.formatDate(mail.timestamp);
            
            header.append(senderSpan, dateSpan);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'mail-title';
            titleDiv.textContent = mail.title;
            
            item.append(header, titleDiv);
            
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
        
        detailContainer.replaceChildren();

        // 1. 메일 헤더 영역
        const contentHeader = document.createElement('div');
        contentHeader.className = 'mail-content-header';

        const h2 = document.createElement('h2');
        h2.style.cssText = 'margin-bottom: 10px; color: #ffd700;';
        h2.textContent = mail.title;

        const metaDiv = document.createElement('div');
        metaDiv.style.cssText = 'display: flex; justify-content: space-between; color: #aaa; font-size: 0.9rem;';

        const senderSpan = document.createElement('span');
        senderSpan.textContent = `보낸 사람: ${mail.sender}`;

        const dateSpan = document.createElement('span');
        dateSpan.textContent = this.formatDate(mail.timestamp);

        metaDiv.append(senderSpan, dateSpan);
        contentHeader.append(h2, metaDiv);

        // 2. 메일 본문 영역
        const mailBody = document.createElement('div');
        mailBody.className = 'mail-body';
        mailBody.style.cssText = 'white-space: pre-line; line-height: 1.6; margin: 12px 0 16px 0; font-size: 0.95rem; color: #cbd5e1;';
        let displayContent = mail.content;
        const mData = mail.data || {};
        const pName = mData.playerName || '선수';
        const offList = Array.isArray(mData.offers) ? mData.offers : [];
        if (mail.type === 'user_transfer_list_offers' && displayContent && displayContent.includes('■ 접수된 구단별 제안 내용:')) {
            displayContent = `감독님, ${pName} 선수에 대해 ${offList.length > 0 ? offList.length : 3}개 구단에서 정식 영입 제안서를 보내왔습니다.\n\n각 구단의 조건을 검토해 보시고 바로 수락하시거나, 마음에 드는 구단과 추가 이적료 협상을 진행해 보실 수 있습니다.`;
        }
        mailBody.textContent = displayContent;

        detailContainer.append(contentHeader, mailBody);

        // 3. 액션 버튼 영역
        if (mail.type === 'transfer_offer') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mail-actions';
            actionsDiv.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px;';

            const offerPrice = mData.price || 0;
            const targetTeam = mData.targetTeam || '';

            if (!mail.isProcessed) {
                const acceptBtn = document.createElement('button');
                acceptBtn.type = 'button';
                acceptBtn.style.cssText = 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; font-weight: 700; font-size: 0.92rem; padding: 11px 20px; border: none; border-radius: 9px; cursor: pointer; transition: all 0.15s ease; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);';
                acceptBtn.textContent = `제안 즉시 수락 (${offerPrice}억 원)`;
                acceptBtn.onmouseenter = () => { acceptBtn.style.transform = 'translateY(-1px) scale(1.02)'; acceptBtn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.42)'; };
                acceptBtn.onmouseleave = () => { acceptBtn.style.transform = 'none'; acceptBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.28)'; };
                acceptBtn.onmousedown = () => { acceptBtn.style.transform = 'scale(0.98)'; };
                acceptBtn.addEventListener('click', () => mailManager.acceptOffer(mail.id));

                const negBtn = document.createElement('button');
                negBtn.type = 'button';
                negBtn.style.cssText = 'background: rgba(245, 158, 11, 0.14); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5); font-weight: 700; font-size: 0.92rem; padding: 11px 20px; border-radius: 9px; cursor: pointer; transition: all 0.15s ease;';
                negBtn.textContent = '이적료 협상 (FC On Call)';
                negBtn.onmouseenter = () => { negBtn.style.transform = 'translateY(-1px) scale(1.02)'; negBtn.style.background = 'rgba(245, 158, 11, 0.24)'; negBtn.style.borderColor = '#fbbf24'; };
                negBtn.onmouseleave = () => { negBtn.style.transform = 'none'; negBtn.style.background = 'rgba(245, 158, 11, 0.14)'; negBtn.style.borderColor = 'rgba(245, 158, 11, 0.5)'; };
                negBtn.onmousedown = () => { negBtn.style.transform = 'scale(0.98)'; };
                negBtn.addEventListener('click', () => {
                    if (typeof transferSystem !== 'undefined' && typeof transferSystem.openSaleNegotiation === 'function') {
                        transferSystem.openSaleNegotiation(pName, targetTeam, offerPrice, mail.id);
                    } else {
                        alert('이적 협상 시스템을 불러올 수 없습니다.');
                    }
                });

                const rejectBtn = document.createElement('button');
                rejectBtn.type = 'button';
                rejectBtn.style.cssText = 'background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35); font-weight: 600; font-size: 0.92rem; padding: 11px 20px; border-radius: 9px; cursor: pointer; transition: all 0.15s ease;';
                rejectBtn.textContent = '제안 거절';
                rejectBtn.onmouseenter = () => { rejectBtn.style.background = 'rgba(239, 68, 68, 0.2)'; rejectBtn.style.color = '#fff'; };
                rejectBtn.onmouseleave = () => { rejectBtn.style.background = 'rgba(239, 68, 68, 0.1)'; rejectBtn.style.color = '#f87171'; };
                rejectBtn.onmousedown = () => { rejectBtn.style.transform = 'scale(0.98)'; };
                rejectBtn.addEventListener('click', () => mailManager.rejectOffer(mail.id));

                actionsDiv.append(acceptBtn, negBtn, rejectBtn);
            } else {
                const processedMsg = document.createElement('div');
                processedMsg.style.cssText = 'color: #94a3b8; font-style: italic; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.25); border-radius: 8px; width: 100%;';
                processedMsg.textContent = mData.resultMessage || '이미 처리된 제안입니다.';
                actionsDiv.appendChild(processedMsg);
            }
            detailContainer.appendChild(actionsDiv);
        } else if (mail.type === 'user_transfer_list_offers') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mail-actions';
            actionsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-top: 14px;';

            let offers = Array.isArray(mData.offers) ? mData.offers : [];
            const playerName = mData.playerName || pName;

            // [호환성 복원] 구형 메일이라 data.offers가 비어있다면 본문 텍스트에서 파싱 복원
            if (offers.length === 0 && mail.content) {
                const regex = /제안\s*\d+\.\s*\[(.*?)\]\s*-\s*제시\s*이적료:\s*(\d+)억/g;
                let match;
                while ((match = regex.exec(mail.content)) !== null) {
                    const tName = match[1].trim();
                    const feeVal = parseInt(match[2], 10);
                    let matchedKey = tName;
                    if (typeof teamNames !== 'undefined') {
                        const found = Object.keys(teamNames).find(k => teamNames[k] === tName);
                        if (found) matchedKey = found;
                    }
                    offers.push({
                        teamKey: matchedKey,
                        teamName: tName,
                        fee: feeVal,
                        message: "선수 영입을 희망하며 공식 제안서를 보냅니다."
                    });
                }
            }

            if (!mail.isProcessed && offers.length > 0) {
                offers.forEach((offer, idx) => {
                    const card = document.createElement('div');
                    card.style.cssText = 'background: linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%); padding: 16px 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 16px rgba(0,0,0,0.25); transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;';
                    card.onmouseenter = () => {
                        card.style.transform = 'translateY(-2px)';
                        card.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                        card.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45)';
                    };
                    card.onmouseleave = () => {
                        card.style.transform = 'none';
                        card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';
                    };

                    // 상단 헤더: 구단 로고 + 구단명 + 제시 이적료
                    const topRow = document.createElement('div');
                    topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

                    const leftMeta = document.createElement('div');
                    leftMeta.style.cssText = 'display: flex; align-items: center; gap: 10px;';

                    if (typeof createTeamLogoElement === 'function' && offer.teamKey) {
                        const logo = createTeamLogoElement(offer.teamKey);
                        if (logo && logo.nodeType) {
                            logo.style.width = '32px';
                            logo.style.height = '32px';
                            leftMeta.appendChild(logo);
                        }
                    }

                    const nameAndBadge = document.createElement('div');
                    const teamNameStrong = document.createElement('div');
                    teamNameStrong.style.cssText = 'color: #f8fafc; font-size: 1.12rem; font-weight: 700; display: flex; align-items: center; gap: 6px;';
                    teamNameStrong.innerHTML = `<span style="color: #fbbf24; font-size: 0.85rem; font-weight: 600;">#${idx + 1}</span> ${offer.teamName}`;

                    const leagueSub = document.createElement('div');
                    leagueSub.style.cssText = 'font-size: 0.76rem; color: #94a3b8; margin-top: 1px;';
                    const tObj = typeof allTeams !== 'undefined' ? allTeams[offer.teamKey] : null;
                    leagueSub.textContent = tObj ? `${tObj.country || '유럽'} · ${tObj.league === 1 ? '1부 리그' : (tObj.league === 2 ? '2부 리그' : '프로')}` : '정식 오퍼 구단';

                    nameAndBadge.append(teamNameStrong, leagueSub);
                    leftMeta.appendChild(nameAndBadge);

                    const feeWrap = document.createElement('div');
                    feeWrap.style.cssText = 'text-align: right;';
                    const feeLabel = document.createElement('div');
                    feeLabel.style.cssText = 'font-size: 0.72rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;';
                    feeLabel.textContent = 'OFFERED FEE';
                    const feeSpan = document.createElement('div');
                    feeSpan.style.cssText = 'color: #10b981; font-weight: 800; font-size: 1.45rem; line-height: 1.1; text-shadow: 0 0 14px rgba(16, 185, 129, 0.3);';
                    feeSpan.textContent = `${offer.fee}억 원`;
                    feeWrap.append(feeLabel, feeSpan);

                    topRow.append(leftMeta, feeWrap);

                    // 메시지 인용구
                    const msgP = document.createElement('p');
                    msgP.style.cssText = 'font-size: 0.86rem; color: #cbd5e1; margin: 4px 0 14px 0; background: rgba(0, 0, 0, 0.3); border-left: 3px solid #3b82f6; padding: 8px 12px; border-radius: 0 6px 6px 0; font-style: italic; line-height: 1.45;';
                    msgP.textContent = `"${offer.message}"`;

                    // 버튼 행
                    const btnRow = document.createElement('div');
                    btnRow.style.cssText = 'display: flex; gap: 10px;';

                    const acceptBtn = document.createElement('button');
                    acceptBtn.type = 'button';
                    acceptBtn.className = 'btn primary';
                    acceptBtn.style.cssText = 'flex: 1; padding: 10px 16px; font-weight: 700; font-size: 0.92rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 8px; color: #fff; cursor: pointer; box-shadow: 0 3px 10px rgba(16, 185, 129, 0.28); transition: all 0.15s ease;';
                    acceptBtn.textContent = `이 제안 즉시 수락 (${offer.fee}억)`;
                    acceptBtn.onmouseenter = () => { acceptBtn.style.transform = 'translateY(-1px) scale(1.02)'; acceptBtn.style.boxShadow = '0 5px 16px rgba(16, 185, 129, 0.45)'; };
                    acceptBtn.onmouseleave = () => { acceptBtn.style.transform = 'none'; acceptBtn.style.boxShadow = '0 3px 10px rgba(16, 185, 129, 0.28)'; };
                    acceptBtn.onmousedown = () => { acceptBtn.style.transform = 'scale(0.98)'; };
                    acceptBtn.addEventListener('click', () => transferSystem.acceptUserOffer(playerName, offer.teamKey, offer.fee, mail.id));

                    const negBtn = document.createElement('button');
                    negBtn.type = 'button';
                    negBtn.className = 'btn';
                    negBtn.style.cssText = 'flex: 1; padding: 10px 16px; background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; font-weight: 700; font-size: 0.92rem; border-radius: 8px; cursor: pointer; transition: all 0.15s ease;';
                    negBtn.textContent = '이적료 협상 (FC On Call)';
                    negBtn.onmouseenter = () => { negBtn.style.transform = 'translateY(-1px) scale(1.02)'; negBtn.style.background = 'rgba(245, 158, 11, 0.24)'; negBtn.style.borderColor = '#fbbf24'; };
                    negBtn.onmouseleave = () => { negBtn.style.transform = 'none'; negBtn.style.background = 'rgba(245, 158, 11, 0.14)'; negBtn.style.borderColor = 'rgba(245, 158, 11, 0.5)'; };
                    negBtn.onmousedown = () => { negBtn.style.transform = 'scale(0.98)'; };
                    negBtn.addEventListener('click', () => {
                        if (typeof transferSystem !== 'undefined' && typeof transferSystem.openSaleNegotiation === 'function') {
                            transferSystem.openSaleNegotiation(playerName, offer.teamKey, offer.fee, mail.id);
                        } else {
                            transferSystem.negotiateUserOffer(playerName, offer.teamKey, offer.fee, mail.id);
                        }
                    });

                    btnRow.append(acceptBtn, negBtn);
                    card.append(topRow, msgP, btnRow);
                    actionsDiv.appendChild(card);
                });

                const rejectAllBtn = document.createElement('button');
                rejectAllBtn.type = 'button';
                rejectAllBtn.style.cssText = 'width: 100%; background: rgba(239, 68, 68, 0.08); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 10px; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.15s ease; margin-top: 6px;';
                rejectAllBtn.textContent = '모든 제안 거절 및 이적 명단 제외';
                rejectAllBtn.onmouseenter = () => { rejectAllBtn.style.background = 'rgba(239, 68, 68, 0.18)'; rejectAllBtn.style.borderColor = '#ef4444'; rejectAllBtn.style.color = '#fff'; };
                rejectAllBtn.onmouseleave = () => { rejectAllBtn.style.background = 'rgba(239, 68, 68, 0.08)'; rejectAllBtn.style.borderColor = 'rgba(239, 68, 68, 0.25)'; rejectAllBtn.style.color = '#f87171'; };
                rejectAllBtn.onmousedown = () => { rejectAllBtn.style.transform = 'scale(0.98)'; };
                rejectAllBtn.addEventListener('click', () => transferSystem.rejectUserOffer(playerName, mail.id));

                actionsDiv.appendChild(rejectAllBtn);
            } else {
                const processedMsg = document.createElement('div');
                processedMsg.style.cssText = 'color: #94a3b8; font-style: italic; padding: 12px 16px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.25); border-radius: 8px;';
                processedMsg.textContent = mData.resultMessage || '이미 처리되었거나 만료된 제안입니다.';
                actionsDiv.appendChild(processedMsg);
            }
            detailContainer.appendChild(actionsDiv);
        } else if (mail.type === 'secretary_advice') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'mail-actions';

            if (!mail.isProcessed) {
                const acceptBtn = document.createElement('button');
                acceptBtn.className = 'btn primary';
                acceptBtn.textContent = '제안 수락';
                acceptBtn.addEventListener('click', () => mailManager.acceptSecretaryAdvice(mail.id));

                const laterBtn = document.createElement('button');
                laterBtn.className = 'btn';
                laterBtn.style.backgroundColor = '#7f8c8d';
                laterBtn.textContent = '나중에';
                laterBtn.addEventListener('click', () => mailManager.rejectOffer(mail.id));

                actionsDiv.append(acceptBtn, laterBtn);
            } else {
                const processedMsg = document.createElement('div');
                processedMsg.style.cssText = 'color: #aaa; font-style: italic; padding: 10px; border: 1px solid #444; border-radius: 5px;';
                processedMsg.textContent = mail.data.resultMessage || '처리된 제안입니다.';
                actionsDiv.appendChild(processedMsg);
            }
            detailContainer.appendChild(actionsDiv);
        }
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
        const topPlayersText = topPlayers.map((p, i) => `${i + 1}. ${p.name} (${p.position}, ${p.rating})`).join('\n');
        
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

        // [수정] 무작위 오퍼 확률 하향: 경기당 약 2.5% (시즌당 약 1회 발생 수준)
        if (Math.random() > 0.025) return;
        
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
        
        // 제안 팀 (선수 수준과 예산에 맞는 현실적인 구단 중 선택)
        const otherTeams = Object.keys(teams).filter(t => t !== gameData.selectedTeam);
        const realisticTeams = (typeof transferSystem !== 'undefined' && typeof transferSystem.getRealisticBuyerTeams === 'function')
            ? transferSystem.getRealisticBuyerTeams(targetPlayer, otherTeams, Math.max(20, Math.round(basePrice * 0.7)))
            : otherTeams;
        const candidatePool = realisticTeams.length > 0 ? realisticTeams : otherTeams;
        const offerTeamKey = candidatePool[Math.floor(Math.random() * candidatePool.length)];
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
        
        const opponentData = (typeof TeamUtils !== 'undefined' && typeof TeamUtils.getOptimalSquadData === 'function')
            ? TeamUtils.getOptimalSquadData(gameData.currentOpponent)
            : null;
        const opponentFormation = opponentData ? `${opponentData.formation} (${opponentData.description})` : '4-3-3';
        
        const content = `감독님, 다음 상대인 ${teamNames[gameData.currentOpponent]}의 전력 분석 보고서입니다.\n\n` +
            `• 상대 전술: '${ts.getTacticName(opponentTactic)}'\n` +
            `• 예상 포메이션: [${opponentFormation}]\n\n` +
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
            
            // UI 갱신 (전술 드롭다운 및 경기 탭 디스플레이)
            const tacticSelect = document.getElementById('tacticSelect');
            if (tacticSelect) tacticSelect.value = data.targetTactic;
            if (typeof window.updateMatchTabCurrentTacticDisplay === 'function') {
                window.updateMatchTabCurrentTacticDisplay();
            }
            
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
        
        // 4. 자금 및 주급 예산 동기화
        if (window.GameState) {
            window.GameState.addTeamMoney(price);
        } else {
            gameData.teamMoney += price;
        }

        if (typeof transferSystem !== 'undefined') {
            // 상대 AI 팀 이적료 지출
            transferSystem.spendTeamBudget(targetTeam, price);
            // 이적 뉴스 등록
            transferSystem.addTransferNews(player, gameData.selectedTeam, targetTeam, price);
        }

        // 이적 명단(userTransferList)에서도 제거
        if (window.GameState) {
            window.GameState.removeUserTransferListByPlayer(player.name);
        } else if (gameData.userTransferList) {
            gameData.userTransferList = gameData.userTransferList.filter(entry => entry.player.name !== player.name);
        }

        if (typeof calculateTotalWages === 'function') calculateTotalWages();
        if (typeof DNAManager !== 'undefined') DNAManager.recalculateLineOVRs();
        
        // 5. 처리 완료 표시
        mail.isProcessed = true;
        mail.data.resultMessage = `제안을 수락했습니다. (${price}억 수령)`;
        
        // 6. UI 갱신
        updateDisplay();
        if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        if (typeof updateFormationDisplay === 'function') updateFormationDisplay();
        if (window.AutoSaveSystem) setTimeout(() => window.AutoSaveSystem.triggerSave(), 500);
        
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
