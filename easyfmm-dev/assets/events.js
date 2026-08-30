// events.js - 라커룸 이벤트, 비서 상담, 주급 요구 등 랜덤 이벤트 및 처리 로직

class EventManager {
    constructor() {
        // 기존 기획안의 스탯 변동치를 1/3 수준으로 하향 조정하고, rating과 teamMorale로 매핑
        this.consultingScenarios = [
            {
                id: 'CONSULT_1',
                situation: '"발끝이 무거워요" (자신감 하락)',
                options: [
                    { text: "푹 쉬고 즐겨라.", result: { morale: 7, rating: -1 }, desc: "부담을 덜어주어 사기는 올랐지만 몸은 나태해졌습니다." },
                    { text: "남아서 100번 더 차!", result: { rating: 2, morale: -3 }, desc: "실력은 오르지만 선수는 피곤해합니다." },
                    { text: "나도 네 나이 땐 그랬어.", result: { morale: 2, rating: 0 }, desc: "유대감은 쌓였지만 실력 향상은 미미합니다." }
                ]
            },
            {
                id: 'CONSULT_2',
                situation: '"팬들 야유가 무서워요" (압박감 토로)',
                options: [
                    { text: "내가 다 책임질게.", result: { morale: 10, rating: -1 }, desc: "멘탈은 튼튼해졌지만 집중력이 느슨해졌습니다." },
                    { text: "야유를 환호로 바꿔라.", result: { rating: 2, morale: -1 }, desc: "독기가 올라 열심히 뛰지만 마음은 불안합니다." },
                    { text: "귀 막고 축구만 해.", result: { rating: 1, morale: 3 }, desc: "차분하게 자기 할 일은 수행하게 되었습니다." }
                ]
            },
            {
                id: 'CONSULT_3',
                situation: '"전술이 안 맞아요" (역할 불만)',
                options: [
                    { text: "네가 중심이야. 맞춰줄게.", result: { rating: 3, morale: -3 }, desc: "개인 기량은 뽐내지만 팀 전술에서 겉돌게 되었습니다." },
                    { text: "팀보다 위대한 선수는 없다.", result: { morale: 7, rating: -1 }, desc: "이타적인 플레이를 하지만 과감함이 사라졌습니다." },
                    { text: "비서랑 전술판 다시 봐.", result: { rating: 1, morale: 1 }, desc: "전술 이해도가 소폭 상승했습니다." }
                ]
            },
            {
                id: 'CONSULT_4',
                situation: '"몸싸움이 겁나요" (피지컬 열세)',
                options: [
                    { text: "넌 탱크야! 밀어붙여!", result: { rating: 3, morale: -1 }, desc: "투지 넘치게 뛰지만 다소 투박해졌습니다." },
                    { text: "영리하게 피해 다녀.", result: { rating: 2, morale: -1 }, desc: "충돌은 피하고 개인기로 승부합니다." },
                    { text: "근육은 폼이 아니야.", result: { rating: 1, morale: 1 }, desc: "기초 체력을 바탕으로 탄탄해졌습니다." }
                ]
            },
            {
                id: 'CONSULT_5',
                situation: '"실수할까 봐 불안해요" (결정력 저하)',
                options: [
                    { text: "실수해도 괜찮아, 쏴!", result: { rating: 2, morale: -1 }, desc: "난사하지만 득점 확률이 올라갔습니다." },
                    { text: "패스 위주로 안전하게 가.", result: { rating: 3, morale: -2 }, desc: "안정적이지만 공격적인 모습은 줄었습니다." },
                    { text: "자신 없으면 벤치 갈래?", result: { morale: 5, rating: 1 }, desc: "퇴출 공포에 눈에 불을 켜고 뛰게 되었습니다." }
                ]
            }
        ];

        this.lockerRoomEvents = [
            // A. 서포터즈 & 관중석 (팀 전체에 주로 영향)
            { id: 1, text: "물병 투척 사건: 지난 경기 판정에 분노한 서포터가 물병을 던졌습니다.", effect: { morale: 2, rating: 0 }, desc: "선수들이 분노로 똘똘 뭉쳤습니다." },
            { id: 2, text: "금손 피켓: 관중석에 선수를 찬양하는 화려한 피켓이 등장했습니다.", target: 'random', effect: { morale: 5, rating: 0 }, desc: "선수의 사기가 올랐습니다." },
            { id: 3, text: "응원가 떼창: 서포터즈가 전용 응원가를 만들었습니다.", target: 'random', effect: { morale: 3, rating: 1 }, desc: "선수가 힘을 냅니다." },
            { id: 4, text: "서포터즈 난투극: 우리 팬들과 상대 팬들이 다퉜습니다.", effect: { morale: -2, rating: 0 }, desc: "팀 분위기가 어수선합니다." },
            { id: 5, text: "훈련장 간식차: 팬클럽에서 간식차를 보냈습니다.", effect: { morale: 3, rating: 1 }, desc: "선수들이 에너지를 회복했습니다." },

            // B. 락커룸 시트콤 (선수 개인)
            { id: 11, text: "얼굴 낙서: 낮잠 자던 선수의 얼굴에 누군가 고양이 수염을 그렸습니다.", target: 'random', effect: { morale: 3, rating: 0 }, desc: "팀 분위기가 화기애애합니다." },
            { id: 14, text: "락커룸 댄스 배틀: 훈련 전 댄스 배틀이 열렸습니다.", effect: { morale: 5, rating: 0 }, desc: "팀워크가 상승했습니다." },
            { id: 15, text: "신발 끈 매듭: 누군가 축구화 끈을 묶어놨습니다.", effect: { morale: 2, rating: 1 }, desc: "가벼운 장난에 팀이 웃었습니다." },

            // C. 비서의 밀착 보고
            { id: 26, text: "얼리 버드: 오늘도 새벽에 출근해서 잔디에 물을 주었습니다.", target: 'random', effect: { morale: 0, rating: 1 }, desc: "성실함이 기량에 도움이 될 것입니다." },
            { id: 29, text: "지옥의 셔틀런: 혼자 운동장을 50바퀴 돌았습니다.", target: 'random', effect: { morale: -3, rating: 2 }, desc: "실력은 오르겠지만 체력이 조금 걱정됩니다." },
            { id: 33, text: "분위기 메이커: 오늘 훈련 분위기를 살렸습니다.", target: 'random', effect: { morale: 5, rating: 0 }, desc: "진짜 없으면 안 될 선수입니다." },
            { id: 38, text: "남아서 킥 연습: 비 오는데 남아서 프리킥 연습을 했습니다.", target: 'random', effect: { morale: 0, rating: 2 }, desc: "기술이 조금 상승했습니다." }
        ];
    }

    // 주급 인상 요구 생성
    triggerWageDemand() {
        if (!gameData.selectedTeam) return null;

        const teamPlayers = teams[gameData.selectedTeam];
        if (!teamPlayers || teamPlayers.length === 0) return null;

        // 선발급 선수(rating 상위권) 중에서 랜덤 선택
        const sortedPlayers = [...teamPlayers].sort((a, b) => b.rating - a.rating);
        const topPlayers = sortedPlayers.slice(0, 5); // 상위 5명
        const randomPlayer = topPlayers[Math.floor(Math.random() * topPlayers.length)];

        // 현재 주급을 주급총합 기반으로 대략 추산하거나 랜덤 부여
        // 게임에 선수별 주급이 명확하지 않은 경우, 현재 능력치 비례로 설정
        const currentWage = randomPlayer.wage || Math.floor(randomPlayer.rating * 1.2);
        const demandedWage = Math.floor(currentWage * 1.3); // 약 30% 인상 요구

        return {
            type: 'wage_demand',
            player: randomPlayer,
            currentWage: currentWage,
            demandedWage: demandedWage,
            title: `[주급 인상 요구] ${randomPlayer.name} 면담 요청`,
            content: `감독님, ${randomPlayer.name} 선수가 제게 조용히 찾아와서 주급 인상을 요구하네요.\n\n현재 활약에 비해 너무 적게 받고 있다면서 주급을 ${demandedWage}만원으로 인상해 달라고 합니다.\n만약 거절하시면 엄청나게 실망할 것 같아요. 어떻게 할까요?`
        };
    }

    // 상담/라커룸 랜덤 이벤트 생성
    triggerRandomEvent() {
        const rand = Math.random();

        // 50% 확률로 상담 이벤트, 50% 확률로 라커룸 이벤트 발생
        if (rand < 0.5) {
            // 상담 이벤트
            if (!gameData.selectedTeam) return null;
            const teamPlayers = teams[gameData.selectedTeam];
            const randomPlayer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
            const scenario = this.consultingScenarios[Math.floor(Math.random() * this.consultingScenarios.length)];

            return {
                type: 'consulting',
                player: randomPlayer,
                scenario: scenario,
                title: `[면담 예약] ${randomPlayer.name} 선수의 고민`,
                content: `감독님, ${randomPlayer.name} 선수가 요즘 표정이 안 좋아서 물어봤더니 이렇게 말하네요.\n\n${scenario.situation}\n\n감독실로 불렀는데, 뭐라고 대답해주실 건가요?`
            };
        } else {
            // 라커룸 (자동 통보) 이벤트
            const event = this.lockerRoomEvents[Math.floor(Math.random() * this.lockerRoomEvents.length)];
            let targetPlayer = null;

            if (event.target === 'random' && gameData.selectedTeam) {
                const teamPlayers = teams[gameData.selectedTeam];
                targetPlayer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
            }

            return {
                type: 'locker_room',
                event: event,
                player: targetPlayer,
                title: `[팀 소식] ${targetPlayer ? targetPlayer.name + ' 관련 소식' : '라커룸 소식'}`,
                content: `감독님, ${targetPlayer ? targetPlayer.name + ' 선수가 ' : ''}${event.text}`
            };
        }
    }
    
    // 모달을 표시하는 기능 추가
    showEventModal(eventData, callback) {
        if (!eventData) {
            if (callback) callback();
            return;
        }

        const modalId = 'randomEventModal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';
            modal.style.zIndex = '9999'; // 가장 위
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';

        // 선수 사진 HTML
        let playerImgHtml = '';
        if (eventData.player) {
            playerImgHtml = `<img src="assets/players/${eventData.player.name}.webp" onerror="this.onerror=null; this.src='assets/players/default.webp'" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #ffd700; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">`;
        }

        let optionsHtml = '';
        
        if (eventData.type === 'consulting') {
            optionsHtml = eventData.scenario.options.map((opt, idx) => `
                <button class="btn primary" style="display: block; width: 100%; margin-bottom: 12px; padding: 15px; font-size: 1.1rem; text-align: left;" onclick="window.eventManager.handleEventChoice(${idx})">
                    <div style="margin-bottom: 5px;">${opt.text}</div>
                    <span style="font-size: 0.85rem; color: #ffeb3b;">(효과: ${opt.desc})</span>
                </button>
            `).join('');
        } else if (eventData.type === 'locker_room') {
            let effectText = '';
            if (eventData.event.effect.morale !== 0) effectText += `팀 사기 ${eventData.event.effect.morale > 0 ? '+' : ''}${eventData.event.effect.morale} `;
            if (eventData.event.effect.rating !== 0) effectText += `능력치 ${eventData.event.effect.rating > 0 ? '+' : ''}${eventData.event.effect.rating} `;
            
            optionsHtml = `
                <div style="margin-bottom: 25px; padding: 15px; background: rgba(46, 204, 113, 0.2); border-radius: 8px; border: 1px solid rgba(46, 204, 113, 0.5); color: #2ecc71; font-weight: bold; font-size: 1.1rem;">
                    [발생 효과] ${eventData.event.desc} <br><span style="color: #ffd700; font-size: 0.95rem;">(${effectText})</span>
                </div>
                <button class="btn" style="width: 100%; padding: 15px; font-size: 1.1rem;" onclick="window.eventManager.closeEventModal()">확인</button>
            `;
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; text-align: center; padding: 40px; background: #222; border: 2px solid #555;">
                ${playerImgHtml}
                <h2 style="margin: 0 0 20px 0; font-size: 1.8rem; color: #fff;">${eventData.title}</h2>
                <p style="font-size: 1rem; color: #ddd; margin-bottom: 30px; line-height: 1.6; white-space: pre-wrap; text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px;">${eventData.content}</p>
                <div style="font-size: 1.1rem;">
                    ${optionsHtml}
                </div>
            </div>
        `;

        this.currentEvent = eventData;
        this.onCloseCallback = callback;
    }

    handleEventChoice(optionIndex) {
        if (!this.currentEvent || this.currentEvent.type !== 'consulting') return;
        
        const option = this.currentEvent.scenario.options[optionIndex];
        const player = this.currentEvent.player;
        
        if (typeof gameData !== 'undefined') {
            if (!gameData.tempEventBuffs) gameData.tempEventBuffs = { morale: 0, players: [] };
            
            if (player) {
                const boost = option.result.rating;
                player.rating = Math.max(1, Math.min(99, player.rating + boost));
                gameData.tempEventBuffs.players.push({ name: player.name, boost: boost });
            }
            
            const moraleBoost = option.result.morale;
            if (window.GameState) {
                window.GameState.adjustTeamMorale(moraleBoost);
            } else {
                gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale + moraleBoost));
            }
            gameData.tempEventBuffs.morale += moraleBoost;
        }
        
        this.closeEventModal();
    }

    closeEventModal() {
        const modal = document.getElementById('randomEventModal');
        if (modal) modal.style.display = 'none';
        
        if (this.currentEvent && this.currentEvent.type === 'locker_room') {
            const effect = this.currentEvent.event.effect;
            
            if (typeof gameData !== 'undefined') {
                if (!gameData.tempEventBuffs) gameData.tempEventBuffs = { morale: 0, players: [] };
                
                if (this.currentEvent.player) {
                    const boost = effect.rating;
                    this.currentEvent.player.rating = Math.max(1, Math.min(99, this.currentEvent.player.rating + boost));
                    gameData.tempEventBuffs.players.push({ name: this.currentEvent.player.name, boost: boost });
                }
                
                const moraleBoost = effect.morale;
                if (window.GameState) {
                    window.GameState.adjustTeamMorale(moraleBoost);
                } else {
                    gameData.teamMorale = Math.max(0, Math.min(100, gameData.teamMorale + moraleBoost));
                }
                gameData.tempEventBuffs.morale += moraleBoost;
            }
        }

        // [추가] 사기나 능력치 변동 후 화면 갱신 (상단바 UI 업데이트)
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }

        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
        this.currentEvent = null;
    }
}

window.eventManager = new EventManager();
