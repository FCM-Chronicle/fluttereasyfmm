// sns.js - SNS 시스템 구현

class SNSManager {
    constructor() {
        this.posts = [];
        this.postIdCounter = 1;
        this.templates = this.initializeTemplates();
        this.lastUpdateTime = Date.now();
    }

    // initializeTemplates 함수에서 템플릿 수정
    initializeTemplates() {
        return {
            // 이적 확정 템플릿
            transferConfirmed: [
                "[오피셜] {playerName}, {transferFee}에 {newTeam} 이적 확정!",
                "[오피셜] {playerName}, {transferFee}에 {newTeam} 합류!",
                "[오피셜] {playerName}, **{newTeam}**과 계약! 새로운 도전 시작!",
                "[오피셜] {playerName}, {transferFee}로 {newTeam} 이적 '충격'!",
                "[오피셜] {playerName}, **{newTeam}**과 동행!",
                "[오피셜] {playerName}, {transferFee}에 {newTeam} 이적!",
                "[오피셜] {playerName}, **{newTeam}**과 계약!",
                "[오피셜] {playerName}, {transferFee}에 {newTeam} 이적 '전격'!",
                "[오피셜] {playerName}, **{newTeam}**으로 '유턴'!",
                "[오피셜] {playerName}, {newTeam} 이적! '이변'의 주인공!",
                "HERE WE GO! {playerName}, {newTeam} 이적 확정! by 파브리치오 로마노"
            ],

            // 이적 루머 템플릿
            transferRumor: [
                "[루머] {newTeam}가 {playerName} 을 최우선 영입 대상으로 삼았습니다",
                "[이적 루머] {playerName}, {newTeam} 이적설 솔솔... {transferFee} 거론",
                "[이적설] {playerName}, {newTeam}으로 깜짝 이적하나?",
                "[이적시장] {playerName}, {newTeam} 이적 임박?",
                "[루머] {playerName}, {newTeam} '러브콜' 받았다!",
                "[이적 가십] {playerName}, {newTeam} 이적 '가능성' 제기!"
            ],

            // 경기 결과 템플릿 - 이변/충격 (약팀이 강팀을 이김)
            matchResultShocking: [
                "[경기 결과] 충격! {winTeam}이 {loseTeam}을 {score}로 격파!",
                "[경기 결과] 이변! {winTeam}, {loseTeam}을 {score}로 잡았다!",
                "[경기 결과] 믿을 수 없는 패배! {loseTeam}, {winTeam}에 {score} 패!",
                "[경기 결과] 대이변! {winTeam}, {loseTeam} 격침시키며 {score} 승리!",
                "[경기 결과] 센세이션! {winTeam}의 {loseTeam} {score} 격파!"
            ],

            // 경기 결과 템플릿 - 예상된 결과 (강팀이 약팀을 이김)
            matchResultExpected: [
                "[경기 결과] 예상대로! {winTeam}, {loseTeam}을 {score}로 완파!",
                "[경기 결과] 압도적인 승리! {winTeam}, {loseTeam}에 {score} 승리!",
                "[경기 결과] 순조로운 출발! {winTeam}, {loseTeam}에 {score} 승!",
                "[경기 결과] 무난한 승리! {winTeam}, {loseTeam} {score}로 제압!",
                "[경기 결과] {winTeam}, {loseTeam} 상대로 {score} 완승!"
            ],

            // 경기 결과 템플릿 - 일반적인 승부 결과 (winTeam/loseTeam 사용)
            matchResultNormal: [
                "[경기 결과] {winTeam}, {loseTeam}에 {score} 승리!",
                "[경기 결과] {winTeam}, {loseTeam} 꺾고 귀중한 승점 3점 획득!",
                "[경기 결과] {winTeam}, {loseTeam} 상대로 {score} 승리!",
                "[경기 결과] {winTeam}이 {loseTeam}을 {score}로 이겼습니다!"
            ],

            matchResultHighScoring: [
                "[경기 결과] 골 폭발! {homeTeam} {score} {awayTeam} — 화끈한 승부!",
                "[경기 결과] 미친 경기! {winTeam} vs {loseTeam}, 최종 {score}!",
                "[경기 결과] {score} 대혼전! {winTeam}이 {loseTeam}을 꺾었다!"
            ],

            matchResultUserWin: [
                "[경기 결과] 우리 팀 승리! {userTeam} {score} {opponentTeam}!",
                "[경기 결과] {userTeam}, {opponentTeam} 상대 {score} 승리! 팬들 환호!",
                "[경기 결과] 감독님 전술이 먹혔다! {userTeam} {score} {opponentTeam}"
            ],

            matchResultUserLoss: [
                "[경기 결과] 아쉬운 패배... {userTeam} {score} {opponentTeam}",
                "[경기 결과] {opponentTeam}에 {score} 패배. 다음 경기가 중요하다",
                "[경기 결과] {userTeam}, {opponentTeam}에 {score}로 고배..."
            ],

            // 경기 결과 템플릿 - 일반적인 무승부 (homeTeam/awayTeam 사용)
            matchResultDraw: [
                "[경기 결과] {homeTeam}와 {awayTeam}, {score} 무승부!",
                "[경기 결과] {homeTeam}과 {awayTeam}이 {score}로 비겼습니다!",
                "[경기 결과] {homeTeam} vs {awayTeam}, {score} 스코어리스 드로우!",
                "[경기 결과] 박빙의 승부! {homeTeam}과 {awayTeam} {score} 무승부!"
            ],

            // 무승부 - 충격적인 결과 (강팀이 약팀과 비김)
            matchResultDrawShocking: [
                "[경기 결과] 충격적인 무승부! {strongTeam}, {weakTeam}과 {score} 무승부!",
                "[경기 결과] 이변! {strongTeam}, {weakTeam}에 발목 잡혀 {score} 무승부!",
                "[경기 결과] {strongTeam}, {weakTeam} 상대로 {score} 무승부... 충격!"
            ],

            // 시즌 결과 - 우승
            seasonChampion: [
                "🏆 [시즌 종료] {team}, {league}부 리그 우승! 최종 {points}점으로 정상 등극!",
                "🏆 [시즌 종료] 우승! {team}이 {league}부 리그를 제패했습니다!",
                "🏆 [시즌 종료] {team}, {league}부 리그 챔피언 등극! {points}점 획득!",
                "👑 [시즌 종료] {team}의 시대! {league}부 리그 우승 달성!",
                "🎉 [시즌 종료] 완벽한 시즌! {team}, {league}부 리그 우승!"
            ],

            // 시즌 결과 - 승격
            seasonPromotion: [
                "⬆️ [시즌 종료] {team}, {newLeague}부 리그 승격 확정! 축하합니다!",
                "🎊 [시즌 종료] 승격의 주역! {team}, {newLeague}부 리그로!",
                "⬆️ [시즌 종료] {team}, {newLeague}부 리그 승격! 새로운 도전!",
                "🚀 [시즌 종료] {team}, {newLeague}부 리그 승격 성공!",
                "✨ [시즌 종료] 꿈의 승격! {team}, {newLeague}부 리그로 올라간다!"
            ],

            // 시즌 결과 - 강등
            seasonRelegation: [
                "⬇️ [시즌 종료] {team}, {newLeague}부 리그 강등... 재기를 노린다",
                "😢 [시즌 종료] {team}, {newLeague}부 리그 강등 확정...",
                "⬇️ [시즌 종료] 아쉬운 강등... {team}, {newLeague}부 리그로",
                "💔 [시즌 종료] {team}, {newLeague}부 리그 강등... 내년을 기약",
                "⬇️ [시즌 종료] {team}, {newLeague}부 리그로... 재도약 다짐"
            ],

            // 득점왕
            topScorer: [
                "⚽👑 [시즌 종료] 득점왕은 {playerName}({team})! {goals}골로 득점왕 수상!",
                "⚽ [시즌 종료] 골 제조기 {playerName}({team}), {goals}골로 득점왕!",
                "👟 [시즌 종료] {playerName}({team}), {goals}골로 {league}부 리그 득점왕 등극!",
                "⚽ [시즌 종료] 득점왕의 탄생! {playerName}({team}) {goals}골!",
                "🎯 [시즌 종료] {playerName}({team}), {goals}골로 득점왕 차지!"
            ],

            // 도움왕
            topAssister: [
                "🅰️👑 [시즌 종료] 도움왕은 {playerName}({team})! {assists}도움으로 도움왕!",
                "🅰️ [시즌 종료] 어시스트 머신 {playerName}({team}), {assists}도움!",
                "🎯 [시즌 종료] {playerName}({team}), {assists}도움으로 {league}부 리그 도움왕!",
                "🅰️ [시즌 종료] 도움왕 등극! {playerName}({team}) {assists}도움!",
                "✨ [시즌 종료] {playerName}({team}), {assists}도움으로 도움왕 차지!"
            ],

            // 시즌 종합 결과
            seasonSummary: [
                "📊 [시즌 종료] {league}부 리그 시즌 종료! 우승: {champion}, 득점왕: {topScorer}, 도움왕: {topAssister}",
                "🏁 [시즌 종료] {league}부 리그 막 내렸다! 챔피언 {champion} 등극!",
                "📋 [시즌 종료] {league}부 리그 최종 결과 발표! 우승팀은 {champion}!"
            ],

            // 유망주 발굴 템플릿
            youthDiscovery: [
                "와, 이 선수 물건인데? 제2의 {legendName}이 될 수 있을까?",
                "이 유망주 잘 키우면 대박날 것 같다! 기대된다!",
                "{legendName} 의 후계자라니 서사 지리네",
                "이 선수 포텐셜 미쳤다... 잘만 크면 월클 각인데?",
                "새로운 유망주 등장! 우리 팀의 미래가 밝다!",
                "이 선수 영상 봤는데 진짜 잘하더라. 빨리 1군에서 보고 싶다.",
                "기본기가 탄탄해 보이네. 잘 성장했으면 좋겠다.",
                "제발 근본론만 지키자",
                "선배님 따라서 열심히 하자 제발"
            ],
            
            rebirth: [
                "{message}"
            ]

        };
    }

    addPost(post) {
        this.posts.unshift(post);
        this.enqueuePreGenerate(post);
    }

    enqueuePreGenerate(post) {
        if (!this.commentQueue) this.commentQueue = [];
        this.commentQueue.push(post);
        if (!this.isProcessingQueue) {
            this.processCommentQueue();
        }
    }

    async processCommentQueue() {
        this.isProcessingQueue = true;
        while (this.commentQueue && this.commentQueue.length > 0) {
            const post = this.commentQueue.shift();
            // 이미 AI 댓글로 최종 결정된 포스트는 건너뜁니다
            if (post.isAIFinalized) continue;

            const success = await this.preGenerateAIComments(post);
            if (!success) {
                post.aiRetryCount = (post.aiRetryCount || 0) + 1;
                // 실패 시 일단 임시 템플릿 댓글 적용
                if (!post.generatedComments) {
                    post.generatedComments = this.generateComments(post);
                }
                // 최대 3회까지 실패하면 큐 제일 뒤로 미뤄서 나중에 AI 댓글로 재시도
                if (post.aiRetryCount <= 3) {
                    this.commentQueue.push(post);
                }
            }

            // API 래이트 리밋 방지를 위한 800ms 딜레이
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        this.isProcessingQueue = false;
    }

    async preGenerateAIComments(post) {
        if (post.isAIFinalized) return true;
        if (post.isGeneratingComments) return false;
        
        post.isGeneratingComments = true;
        
        try {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = post.content;
            const cleanContent = tempDiv.textContent || tempDiv.innerText || "";
            
            const aiCommentsText = await this.callNvidiaForComments(cleanContent);
            
            if (aiCommentsText && aiCommentsText.length > 0) {
                post.generatedComments = aiCommentsText.slice(0, 3).map((text, index) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    author: this.generateRandomUsername ? this.generateRandomUsername() : '익명',
                    text: text,
                    likes: Math.floor(Math.random() * 100) + 1,
                    timestamp: post.timestamp + (index + 1) * 60000
                }));
                post.isAIFinalized = true;

                const commentsSection = document.getElementById(`comments-${post.id}`);
                if (commentsSection && commentsSection.style.display !== 'none') {
                    this.renderComments(commentsSection, post.generatedComments);
                }
                return true;
            }
            return false;
        } catch (e) {
            console.error('AI 댓글 자동 생성 실패:', e);
            return false;
        } finally {
            post.isGeneratingComments = false;
        }
    }

    generateRebirthPost(playerName, teamKey, age, message) {
        const template = this.getRandomTemplate('rebirth');
        const templateData = { message: message };
        
        const post = {
            id: this.postIdCounter++,
            type: 'rebirth',
            content: this.fillTemplate(template, templateData),
            hashtags: ['#은퇴', '#환생', `#${this.sanitizeHashtag(playerName)}`],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 2000) + 500,
            comments: Math.floor(Math.random() * 300) + 50,
            shares: Math.floor(Math.random() * 100) + 20,
            playerName: playerName,
            teamKey: teamKey
        };
        
        this.addPost(post);
        return post;
    }

    // SNSManager 클래스 내부에 추가

    // 시즌 우승 포스트 생성
    generateSeasonChampionPost(teamKey, league, points) {
        const template = this.getRandomTemplate('seasonChampion');
        const templateData = {
            team: this.getTeamName(teamKey),
            league: league,
            points: points
        };

        const post = {
            id: this.postIdCounter++,
            type: 'season_champion',
            content: this.fillTemplate(template, templateData),
            hashtags: [`#${league}부리그`, `#우승`, `#${this.sanitizeHashtag(teamKey)}`, '#챔피언'],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 2000) + 1000,
            comments: Math.floor(Math.random() * 500) + 100,
            shares: Math.floor(Math.random() * 200) + 50
        };

        this.addPost(post);
        return post;
    }

    // 시즌 승격 포스트 생성
    generateSeasonPromotionPost(teamKey, oldLeague, newLeague) {
        const template = this.getRandomTemplate('seasonPromotion');
        const templateData = {
            team: this.getTeamName(teamKey),
            newLeague: newLeague
        };

        const post = {
            id: this.postIdCounter++,
            type: 'season_promotion',
            content: this.fillTemplate(template, templateData),
            hashtags: [`#${newLeague}부리그`, `#승격`, `#${this.sanitizeHashtag(teamKey)}`],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 800) + 200,
            comments: Math.floor(Math.random() * 150) + 30,
            shares: Math.floor(Math.random() * 80) + 20
        };

        this.addPost(post);
        return post;
    }

    // 시즌 강등 포스트 생성
    generateSeasonRelegationPost(teamKey, oldLeague, newLeague) {
        const template = this.getRandomTemplate('seasonRelegation');
        const templateData = {
            team: this.getTeamName(teamKey),
            newLeague: newLeague
        };

        const post = {
            id: this.postIdCounter++,
            type: 'season_relegation',
            content: this.fillTemplate(template, templateData),
            hashtags: [`#${newLeague}부리그`, `#강등`, `#${this.sanitizeHashtag(teamKey)}`],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 400) + 100,
            comments: Math.floor(Math.random() * 100) + 20,
            shares: Math.floor(Math.random() * 30) + 5
        };

        this.addPost(post);
        return post;
    }

    // 득점왕 포스트 생성
    generateTopScorerPost(playerName, teamKey, goals, league) {
        const template = this.getRandomTemplate('topScorer');
        const templateData = {
            playerName: playerName,
            team: this.getTeamName(teamKey),
            goals: goals,
            league: league
        };

        const post = {
            id: this.postIdCounter++,
            type: 'top_scorer',
            content: this.fillTemplate(template, templateData),
            hashtags: [`#득점왕`, `#${this.sanitizeHashtag(playerName)}`, `#${league}부리그`, `#${this.sanitizeHashtag(teamKey)}`],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 1500) + 500,
            comments: Math.floor(Math.random() * 300) + 50,
            shares: Math.floor(Math.random() * 100) + 30
        };

        this.addPost(post);
        return post;
    }

    // 도움왕 포스트 생성
    generateTopAssisterPost(playerName, teamKey, assists, league) {
        const template = this.getRandomTemplate('topAssister');
        const templateData = {
            playerName: playerName,
            team: this.getTeamName(teamKey),
            assists: assists,
            league: league
        };

        const post = {
            id: this.postIdCounter++,
            type: 'top_assister',
            content: this.fillTemplate(template, templateData),
            hashtags: [`#도움왕`, `#${this.sanitizeHashtag(playerName)}`, `#${league}부리그`, `#${this.sanitizeHashtag(teamKey)}`],
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 1200) + 400,
            comments: Math.floor(Math.random() * 250) + 40,
            shares: Math.floor(Math.random() * 80) + 20
        };

        this.addPost(post);
        return post;
    }

    // 시즌 종료 이벤트 핸들러 (endSeason.js에서 호출)
    onSeasonEnd(seasonData) {
        console.log('📢 SNS: 시즌 종료 이벤트 처리 시작');

        // 1. 각 리그 우승팀 포스트
        if (seasonData.champions) {
            seasonData.champions.forEach(champion => {
                this.generateSeasonChampionPost(champion.team, champion.league, champion.points);
            });
        }

        // 2. 승격팀 포스트
        if (seasonData.promotions) {
            seasonData.promotions.forEach(promo => {
                this.generateSeasonPromotionPost(promo.team, promo.from, promo.to);
            });
        }

        // 3. 강등팀 포스트
        if (seasonData.relegations) {
            seasonData.relegations.forEach(rel => {
                this.generateSeasonRelegationPost(rel.team, rel.from, rel.to);
            });
        }

        // 4. 각 리그 득점왕 포스트
        if (seasonData.topScorers) {
            seasonData.topScorers.forEach(scorer => {
                this.generateTopScorerPost(scorer.playerName, scorer.team, scorer.goals, scorer.league);
            });
        }

        // 5. 각 리그 도움왕 포스트
        if (seasonData.topAssisters) {
            seasonData.topAssisters.forEach(assister => {
                this.generateTopAssisterPost(assister.playerName, assister.team, assister.assists, assister.league);
            });
        }

        console.log('✅ SNS: 시즌 종료 이벤트 처리 완료');
    }
    // 수정된 generateMatchPost 함수
    generateMatchPost(matchData) {
        const payload = (typeof window.buildMatchResultPayload === 'function')
            ? window.buildMatchResultPayload(matchData)
            : matchData;
        if (!payload || !gameData) return;

        const homeTeam = payload.homeTeam;
        const awayTeam = payload.awayTeam;
        const homeScore = payload.homeScore;
        const awayScore = payload.awayScore;
        const score = `${homeScore}-${awayScore}`;
        const isUserMatch = homeTeam === gameData.selectedTeam || awayTeam === gameData.selectedTeam;

        const homeRating = this.calculateTeamRating(homeTeam);
        const awayRating = this.calculateTeamRating(awayTeam);
        const strengthDiff = Math.abs(homeRating - awayRating);

        let template;
        let templateData = {};

        if (homeScore === awayScore) {
            if (strengthDiff > 10) {
                template = this.getRandomTemplate('matchResultDrawShocking');
                templateData = {
                    strongTeam: homeRating > awayRating ? this.getTeamName(homeTeam) : this.getTeamName(awayTeam),
                    weakTeam: homeRating < awayRating ? this.getTeamName(homeTeam) : this.getTeamName(awayTeam),
                    score: score
                };
            } else {
                template = this.getRandomTemplate('matchResultDraw');
                templateData = {
                    homeTeam: this.getTeamName(homeTeam),
                    awayTeam: this.getTeamName(awayTeam),
                    score: score
                };
            }
        } else {
            const winTeam = homeScore > awayScore ? homeTeam : awayTeam;
            const loseTeam = homeScore > awayScore ? awayTeam : homeTeam;
            const winnerRating = homeScore > awayScore ? homeRating : awayRating;
            const loserRating = homeScore > awayScore ? awayRating : homeRating;

            templateData = {
                winTeam: this.getTeamName(winTeam),
                loseTeam: this.getTeamName(loseTeam),
                homeTeam: this.getTeamName(homeTeam),
                awayTeam: this.getTeamName(awayTeam),
                score: score,
                userTeam: this.getTeamName(gameData.selectedTeam),
                opponentTeam: this.getTeamName(homeTeam === gameData.selectedTeam ? awayTeam : homeTeam)
            };

            const isUpset = winnerRating < loserRating;
            const totalGoals = homeScore + awayScore;

            if (isUserMatch && payload.userResult === 'win') {
                template = this.getRandomTemplate('matchResultUserWin');
            } else if (isUserMatch && payload.userResult === 'loss') {
                template = this.getRandomTemplate('matchResultUserLoss');
            } else if (totalGoals >= 5) {
                template = this.getRandomTemplate('matchResultHighScoring');
            } else if (isUpset && strengthDiff > 10) {
                template = this.getRandomTemplate('matchResultShocking');
            } else if (!isUpset && strengthDiff > 15) {
                template = this.getRandomTemplate('matchResultExpected');
            } else {
                template = this.getRandomTemplate('matchResultNormal');
            }
        }

        const hashtags = this.generateHashtags(homeTeam, awayTeam, payload);
        const goalRecords = this.buildGoalRecords(payload.goalEvents || payload.events, payload);
        if (payload.hadDrama) hashtags.push('#극적승부');

        let postContent = this.fillTemplate(template, templateData);
        if (goalRecords.length > 0) {
            postContent += '<br><br>⚽ 골 기록<br>' + goalRecords.join('<br>');
        }

        const post = {
            id: this.postIdCounter++,
            type: 'match_result',
            content: postContent,
            hashtags: hashtags,
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 1000) + 100 + (payload.totalGoals || 0) * 40,
            comments: Math.floor(Math.random() * 200) + 10,
            shares: Math.floor(Math.random() * 50) + 5,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            homeScore: homeScore,
            awayScore: awayScore,
            goalScorers: goalRecords.join(', '),
            goalRecords: goalRecords,
            isUserMatch: isUserMatch,
            userResult: payload.userResult || null
        };

        this.addPost(post);
        console.log(`[SNS] 경기 결과 포스트 생성: ${post.content}`);
        return post;
    }

    // 이적 포스트 생성
    generateTransferPost(playerName, fromTeam, toTeam, transferFee, isRumor = false) {
        const templateType = isRumor ? 'transferRumor' : 'transferConfirmed';
        const template = this.getRandomTemplate(templateType);

        const templateData = {
            playerName: playerName,
            newTeam: this.getTeamName(toTeam),
            originalTeam: this.getTeamName(fromTeam),
            transferFee: transferFee ? `${transferFee}억원` : '비공개 금액'
        };

        const hashtags = [
            `#transfer`,
            `#${this.sanitizeHashtag(fromTeam)}`,
            `#${this.sanitizeHashtag(toTeam)}`,
            `#${this.sanitizeHashtag(playerName)}`
        ];

        const post = {
            id: this.postIdCounter++,
            type: isRumor ? 'transfer_rumor' : 'transfer_confirmed',
            content: this.fillTemplate(template, templateData),
            hashtags: hashtags,
            timestamp: Date.now(),
            likes: Math.floor(Math.random() * 500) + 50,
            comments: Math.floor(Math.random() * 100) + 5,
            shares: Math.floor(Math.random() * 30) + 2,
            playerName: playerName,
            toTeam: toTeam,
            transferFee: templateData.transferFee
        };

        this.addPost(post);
        console.log(`[SNS] 이적 포스트 생성: ${post.content}`);
        return post;
    }

    generateRandomAINews() {
        const rand = Math.random();
        if (rand < 0.2) { // 20% 확률
            this.generateAIMatchPreview();
        } else if (rand < 0.3) { // 10% 확률로 루머
            this.generateRandomTransferRumor();
        }
    }

    generateRandomTransferRumor() {
        if (typeof allTeams === 'undefined' && typeof teams === 'undefined') return;
        
        const teamKeys = Object.keys(allTeams || teams);
        if (teamKeys.length < 2) return;
        
        let targetTeamKey;
        let newTeamKey;
        
        // 30% 확률로 유저 팀이 루머에 포함되도록 (타겟 또는 새 팀)
        if (Math.random() < 0.3 && typeof gameData !== 'undefined' && gameData.selectedTeam && teamKeys.includes(gameData.selectedTeam)) {
            if (Math.random() < 0.5) {
                targetTeamKey = gameData.selectedTeam;
                do { newTeamKey = teamKeys[Math.floor(Math.random() * teamKeys.length)]; } while (newTeamKey === targetTeamKey);
            } else {
                newTeamKey = gameData.selectedTeam;
                do { targetTeamKey = teamKeys[Math.floor(Math.random() * teamKeys.length)]; } while (newTeamKey === targetTeamKey);
            }
        } else {
            targetTeamKey = teamKeys[Math.floor(Math.random() * teamKeys.length)];
            do { newTeamKey = teamKeys[Math.floor(Math.random() * teamKeys.length)]; } while (newTeamKey === targetTeamKey);
        }
        
        const targetTeamPlayers = (allTeams && allTeams[targetTeamKey] ? allTeams[targetTeamKey].players : null) || (teams ? teams[targetTeamKey] : []);
        
        if (!targetTeamPlayers || targetTeamPlayers.length === 0) return;

        const player = targetTeamPlayers[Math.floor(Math.random() * targetTeamPlayers.length)];
        
        const transferFee = this.estimateTransferFee ? this.estimateTransferFee(player) : Math.floor(Math.random() * 500) + 100;

        this.generateTransferPost(player.name, targetTeamKey, newTeamKey, transferFee, true);
    }

    // AI 경기 미리보기 생성 (같은 디비전끼리만)
    generateAIMatchPreview() {
        // 현재 선택된 팀의 디비전 확인
        const currentDivision = gameData.currentLeague;

        // 같은 디비전의 다른 팀들만 필터링
        const sameLeagueTeams = Object.keys(allTeams).filter(teamKey => {
            // 현재 선택된 팀 제외
            if (teamKey === gameData.selectedTeam) return false;

            // 같은 리그(디비전)인지 확인
            const teamLeague = allTeams[teamKey].league || 1; // 기본값 1
            return teamLeague === currentDivision;
        });

        console.log(`현재 디비전: ${currentDivision}`);
        console.log('같은 디비전 팀들:', sameLeagueTeams);

        if (sameLeagueTeams.length >= 2) {
            const team1 = sameLeagueTeams[Math.floor(Math.random() * sameLeagueTeams.length)];
            const team2 = sameLeagueTeams.filter(t => t !== team1)[Math.floor(Math.random() * (sameLeagueTeams.length - 1))];

            const previews = [
                `🔥 주목할 만한 경기! ${this.getTeamName(team1)} vs ${this.getTeamName(team2)} 오늘 밤 대격돌!`,
                `⚡ 빅 매치 예고! ${this.getTeamName(team1)}과 ${this.getTeamName(team2)}의 운명적 대결`,
                `🎯 클래시코! ${this.getTeamName(team1)} 대 ${this.getTeamName(team2)}, 승자는?`,
                `⚽ 리그 주요 경기! ${this.getTeamName(team1)} vs ${this.getTeamName(team2)} 예상!`,
                `🏆 ${currentDivision}부 리그 경기! ${this.getTeamName(team1)} 대 ${this.getTeamName(team2)}`
            ];

            const post = {
                id: this.postIdCounter++,
                type: 'match_preview',
                content: previews[Math.floor(Math.random() * previews.length)],
                hashtags: [`#${this.sanitizeHashtag(team1)}`, `#${this.sanitizeHashtag(team2)}`, '#preview', `#${currentDivision}부리그`],
                timestamp: Date.now(),
                likes: Math.floor(Math.random() * 300) + 30,
                comments: Math.floor(Math.random() * 80) + 5,
                shares: Math.floor(Math.random() * 20) + 1,
                team1: team1,
                team2: team2
            };

            this.addPost(post);
            console.log('같은 디비전 경기 미리보기 생성:', post.content);
        } else {
            console.log('같은 디비전에 충분한 팀이 없어 경기 미리보기를 생성하지 않음');
        }
    }

    // 유틸리티 함수들
    getRandomTemplate(templateType) {
        const templates = this.templates[templateType];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    fillTemplate(template, data) {
        let result = template;
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            result = result.replace(regex, data[key]);
        });
        return result;
    }

    getTeamName(teamKey) {
        if (typeof teamNames !== 'undefined' && teamNames[teamKey]) {
            return teamNames[teamKey];
        }
        if (typeof allTeams !== 'undefined' && allTeams[teamKey]) {
            return teamKey.replace(/_/g, ' ');
        }
        return teamKey;
    }

    calculateTeamRating(teamKey) {
        if (teamKey === gameData.selectedTeam) {
            return window.calculateTeamRating ? window.calculateTeamRating() : 75;
        }
        return window.calculateOpponentTeamRating ? window.calculateOpponentTeamRating(teamKey) : 75;
    }

    extractGoalScorers(events) {
        if (!events) return [];

        const seen = new Set();
        return events
            .filter(event => event.type === 'goal' && event.scorer)
            .map(event => event.scorer)
            .filter(scorer => {
                if (seen.has(scorer)) return false;
                seen.add(scorer);
                return true;
            });
    }

    buildGoalRecords(events, matchData) {
        if (!events) return [];

        return events
            .filter(event => event.type === 'goal' && event.scorer)
            .sort((a, b) => (a.minute || 0) - (b.minute || 0))
            .map(event => {
                const isHome = event.teamKey
                    ? event.teamKey === matchData.homeTeam
                    : null;
                const side = isHome === null ? '' : (isHome ? '🏠 ' : '🛫 ');
                let text = `${side}${event.minute}' ${event.scorer}`;
                if (event.assister) text += ` (도움: ${event.assister})`;
                return text;
            });
    }

    generateHashtags(homeTeam, awayTeam, matchData) {
        const hashtags = [
            `#${this.sanitizeHashtag(homeTeam)}`,
            `#${this.sanitizeHashtag(awayTeam)}`
        ];

        if (matchData.homeScore === matchData.awayScore) {
            hashtags.push('#무승부');
        } else {
            hashtags.push('#승부');
        }

        return hashtags;
    }

    sanitizeHashtag(text) {
        return text.replace(/[^a-zA-Z0-9가-힣]/g, '');
    }

    estimateTransferFee(player) {
        let base = 500;
        const ratingFactor = Math.pow(player.rating / 70, 2);
        base *= ratingFactor;

        if (player.age <= 25) base *= 1.2;
        else if (player.age >= 30) base *= 0.8;

        return Math.round(base * (0.8 + Math.random() * 0.4));
    }

    // SNS 피드 표시
    displayFeed(containerId = 'snsFeed', limit = 10) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const postsToShow = this.posts.slice(0, limit);

        if (postsToShow.length === 0) {
            container.innerHTML = '<div class="sns-empty">아직 소식이 없습니다.</div>';
            return;
        }

        postsToShow.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });
    }

    createPostElement(post) {
        const postEl = document.createElement('div');
        postEl.className = `insta-post post-${post.type}`;

        const timeAgo = this.formatTimeAgo(post.timestamp);

        // 포스트 타입에 따라 '게시자(프로필)' 팀을 명확히 결정
        let postingTeam = gameData.selectedTeam;
        if (post.type === 'match_result') postingTeam = post.homeTeam;
        else if (post.type === 'match_preview') postingTeam = post.team1;
        else if (post.type === 'transfer_confirmed' || post.type === 'transfer_rumor') postingTeam = post.toTeam;
        else if (post.type === 'rebirth') postingTeam = post.teamKey;

        const teamName = this.getTeamName(postingTeam);
        const stadium = post.type === 'match_result' || post.type === 'match_preview' ? "📍 Official Stadium" : post.type === 'rebirth' ? "📍 Youth Academy" : "⚽ Transfer Market";

        let mediaHtml = '';
        if (post.type === 'match_result') {
            const homeLogo = getTeamLogoHTML(post.homeTeam);
            const awayLogo = getTeamLogoHTML(post.awayTeam);
            const bgUrl = `assets/bg/${post.homeTeam}.png`;

            mediaHtml = `
            <div class="insta-media match-result-card" style="background-image: url('${bgUrl}'), url('assets/bg/basic.png');">
                <div class="media-overlay-dark"></div>
                <div class="media-content">
                    <div class="result-score-row">
                        <div class="result-team">
                            ${homeLogo}
                            <span class="score-num">${post.homeScore}</span>
                        </div>
                        <div class="score-vs">:</div>
                        <div class="result-team">
                            <span class="score-num">${post.awayScore}</span>
                            ${awayLogo}
                        </div>
                    </div>
                    <div class="result-scorers">${post.goalScorers ? '⚽ ' + post.goalScorers : ''}</div>
                </div>
            </div>
        `;
        } else if (post.type === 'transfer_confirmed' || post.type === 'transfer_rumor') {
            const toTeamName = this.getTeamName(post.toTeam);
            const bgUrl = `assets/bg/${post.toTeam}.png`;
            const logoHtml = getTeamLogoHTML(post.toTeam);

            mediaHtml = `
            <div class="insta-media transfer-graphic-card" style="background-image: url('${bgUrl}'), url('assets/bg/basic.png');">
                <div class="transfer-card-overlay"></div>
                <img src="assets/players/${post.playerName}.webp" class="transfer-card-player" onerror="this.src='assets/players/default.webp'">
                <div class="transfer-card-price-badge">${post.transferFee}</div>
                <div class="transfer-card-footer">
                    <div class="transfer-footer-top">
                        ${logoHtml}
                        <span class="transfer-official-tag">[OFFICIAL]</span>
                    </div>
                    <div class="transfer-main-headline">
                        ${post.playerName}, ${toTeamName}으로 이적
                    </div>
                </div>
            </div>
        `;
        } else if (post.type === 'match_preview') {
            const bgUrl = `assets/bg/${post.team1}.png`;
            mediaHtml = `
            <div class="insta-media preview-graphic-card" style="background-image: url('${bgUrl}'), url('assets/bg/basic.png');">
                <div class="media-overlay-dark"></div>
                <div class="preview-headline">NEXT MATCH</div>
                <div class="preview-teams-row">
                    ${getTeamLogoHTML(post.team1)}
                    <span class="vs-text">V</span>
                    ${getTeamLogoHTML(post.team2)}
                </div>
            </div>
        `;
        } else if (post.type === 'rebirth') {
            const bgUrl = `assets/bg/${post.teamKey}.png`;
            mediaHtml = `
            <div class="insta-media preview-graphic-card" style="background-image: url('${bgUrl}'), url('assets/bg/basic.png'); display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
                <div class="media-overlay-dark" style="opacity: 0.3;"></div>
                <div style="z-index: 10; padding-bottom: 40px; color: white; font-weight: 900; font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align: center; line-height: 1.4;">
                    ${post.playerName} 은퇴,<br>이어받을 유망주 등장
                </div>
            </div>
        `;
        }

        postEl.innerHTML = `
        <div class="insta-header">
            <div class="insta-profile-pic">
                ${getTeamLogoHTML(postingTeam)}
            </div>
            <div class="insta-header-text">
                <div class="insta-username">${teamName}</div>
                <div class="insta-location">${stadium}</div>
            </div>
            <div class="insta-more">•••</div>
        </div>
        
        ${mediaHtml}

        <div class="insta-actions">
            <div class="actions-left">
                <span class="action-icon">❤️</span>
                <span class="action-icon sns-comments-btn" data-post-id="${post.id}">💬</span>
                <span class="action-icon">✈️</span>
            </div>
            <div class="actions-right">
                <span class="action-icon">🔖</span>
            </div>
        </div>

        <div class="insta-content">
            <div class="insta-likes-count">좋아요 ${post.likes.toLocaleString()}개</div>
            <div class="insta-caption">
                <span class="insta-username">${teamName}</span> ${post.content}
            </div>
            <div class="insta-hashtags">
                ${post.hashtags.join(' ')}
            </div>
            <div class="insta-view-comments sns-comments-btn" data-post-id="${post.id}">
                댓글 ${post.comments}개 모두 보기
            </div>
            <div class="insta-time">${timeAgo.toUpperCase()}</div>
        </div>
        <div class="sns-comments-section" id="comments-${post.id}" style="display: none;"></div>
    `;

        // 이벤트 리스너를 직접 추가
        const commentsBtn = postEl.querySelector('.sns-comments-btn');
        commentsBtn.addEventListener('click', () => {
            this.toggleComments(post.id);
        });

        return postEl;
    }

    // [수정] NVIDIA NIM API 호출 함수 (프록시 경유)
    async callNvidiaForComments(postContent) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            // 다시 Vercel 프록시로 복구합니다.
            const response = await fetch("https://easyfmm.vercel.app/api/groq", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: "🚨 [필독: 커뮤니티 밈(Meme) 동적 생성 규칙] AI 특유의 융통성 없는 텍스트 출력을 방지하기 위해 아래 규칙을 엄격히 따른다. 1. 접두사/접미사 동적 결합 규칙 (절대 숫자 '0'을 그대로 출력하지 말 것) 특정 밈('-대깨-', '-맘', '탈-', '-강점기')을 사용할 때는 대상 팀이나 선수의 커뮤니티 멸칭/애칭의 한 글자 또는 줄임말을 동적으로 결합해야 한다. 주어진 예시 외의 팀이 나와도 이 원리를 스스로 응용할 것. 작동 원리: 맨유(맹구) -> 맹 / 토트넘(닭집, 폐닭) -> 토 / 바르셀로나(꾸레) -> 꾸 / 아스널(개집) -> 개 / 첼시(첼강딱) -> 첼 / 레알 마드리드(매수마드리드) -> 얄, 마 올바른 출력 예시: 대깨맹(O), 탈개집(O), 꾸강점기(O), 토맘(O) 금지된 출력 예시: 대깨0(X), 대깨맨유(X), 00강점기(X) 2. 밈(Meme) 상황별 발동 조건 (Context Trigger) 밈의 뜻을 정확히 파악하고, 해당하는 경기 상황이 발생했을 때만 적절히 사용할 것. 아무 때나 남발하지 마라. 빅클럽 판독기: [발동 조건] 약팀은 잘 패면서 강팀(순위가 높은 팀)과의 경기에서 아무 활약 없이 졌을 때만 사용. (예: '결국 또 빅클럽 판독기 돌아가쥬? 강팀 만나니까 버로우 타네.') 위장팬: [발동 조건] 팬을 자처하면서 교묘하게 팀이나 감독을 까내리거나, 타 팀을 찬양하는 댓글을 구현할 때 사용. (예: '나 15년 차 골수팬인데 솔직히 오늘 전술은 감독 사퇴가 맞다. 차라리 옆동네가 축구는 잘함.') XX맘: 어떤 선수를 무지성으로 좋아하는(그래서 못한것도 다 칭찬하는)사람 탈00: 맨유면 맹, 토트넘이면 트넘 등 팀 이름을 넣어서 사용. 그 팀을 나가서 다른 팀으로 이적했을때 사용 행복축구: 어떤 선수가 말년에 돈받으러 변방 리그에 갈때 근본: 역사가 있거나 워크에식 같은 마인드가 제대로 된 선수일때 활동량도르 / 재능도르: [발동 조건] 평점과 스탯은 최악인데 뛴 거리만 많거나(활동량), 실속은 없는데 유망주 딱지가 붙어있을 때(재능) 비꼬는 용도로 사용. XX가 ㅈ으로 보이냐: [발동 조건] 어떤 한 선수(A라고 하자.)가 매우 못했을때, 어떤 댓글이 그 선수랑 평소에 실력이 좋지 않은 다른선수(B라고 하자.)랑 비교함. 그러면 그 대댓글에 XX(B)가 ㅈ으로 보이냐 면서 A를 더 까내리는 용도. 우승목격자 / 0갈자: [발동 조건] 우승은 했으나 버스를 탔을 때(우승목격자), 특정 팀으로 이적하느니 차라리 죽겠다는 극단적 비하가 필요할 때(0갈자) 사용. 순수실력 GOAT / JOAT: [발동 조건] 경기 결과에 따라 특정 선수를 무지성으로 신격화하거나 바닥까지 깎아내릴 때 사용. 대 0 0: 누군가가 되게 좋은 판단 혹은 좋은 활약을 보였을때 대 0 0 에다가 이름을 넣기(보통 한국인) XX는 태산같은 클럽: 어떤 클럽이 못하는 선수를 사가거나 과소비를 했을때 그 클럽을 비하하면서도 감사해하는 말 퇴물: 옛날엔 잘했지만 지금은 못하는 선수/감독 무지성 찬양: 다양한 바리에이션이 있음. 예를 들어: 세상에 70억 명의 XXX 팬이 있다면, 나는 그들 중 한 명일 것이다. 세상에 1억 명의 XXX 팬이 있다면, 나 또한 그들 중 한 명일 것이다. 세상에 천만 명의 XXX 팬이 있다면, 나는 여전히 그들 중 한 명일 것이다. 세상에 백 명의 XXX 팬이 있다면, 나는 아직도 그들 중 한 명일 것이다. 세상에 한 명의 XXX 팬이 있다면, 그 사람이 나다. 세상에 단 한 명의 XXX 팬도 없다면, 나는 그제서야 이 세상에 없는 것이다. 또 다른 예시(이건 첫번째랑 합쳐서 쓰기도 한다.) XXX, 나의 사랑. XXX, 나의 빛. XXX, 나의 어둠. XXX, 나의 삶. XXX, 나의 기쁨. XXX, 나의 슬픔. XXX, 나의 안식. XXX, 나의 영혼. XXX, 나. 또 다른 예시: 어제 XXX 카페 다녀왔습니다 XXX 카페가 열린 건 아니고요 그냥 카페에서 XXX 생각했습니다 카페에 간 건 아니고요 그냥 집에서 커피를 마셨습니다 사실 커피도 안마셨습니다 그냥 XXX인 상태입니다 또 다른 예시: 기사님이 의아한 표정으로 물었다. '학생, 1명인데 왜 2명찍어?' '제 마음속에는 언제나 XXX가 살고있기 때문이죠.' 기사 님이 웃으며 말했다. '학생, 우리들의 친절한 이웃 XXX는 요금을 안받는단다.' 이것들을 적절히 섞을 것. WEB발신 밈: [Web발신] 너는나를존중해야한다나는발롱도르5개와수많은개인트로피를들어올렸으며2016유로에서포르투갈을이끌고우승을차지했고동시에A매치역대최다득점자이다또한챔스역대최다득점자이자5번이나우승을차지한레알마드리드의상징이다또한36세의나이에도프리미어리그에서18골을기록하고챔스에서5경기연속골을기록하며내가세계최고임을증명해냈다은혜를모르는맨유보드진과팬들은내가맨유의골칫덩이라며쫓아냈지만내가세계최고이고내가팀보다위대하다는사실은바뀌지않는다내가사우디에간이유는메시에대한자격지심이아니라유럽에서이룰수있는모든것을이루었기에아시아를정복하기위해간것이지단지돈을위해서간것이아니다 이것은 원래 호날두를 조롱하는 밈이었으나, 위에 말했던 사생활? 라커룸 이벤트 혹은 다른 댓글 등에서 호날두를 조롱하거나 아니면 다른 선수를 조롱했을때 이런 것을 써붙여야해. 물론 다른 선수가 대상이 된다면 그사람의 업적과 이름으로 바꿔야겠지? 혹은 호날두가 골을 넣었을때도 사용 축구로 우울해할 필요 없어, 인생이 더 중요 - 미겔 아르테타: 경기에서 처참한 성적을 보인 선수들에게 겉으로는 칭찬처럼 보이지만 사실 비판할 때 사용됨. 험블해라: 콧대가 하늘을 찌르다가 경기에서 재앙급 활약을 보였을때 선수에게 네티즌들이 하는 말 이러다가 드토보도 모탄(잉글랜드, 17세), 벨루미 다인네(스코틀랜드, 18세)도 영입하겠네: 진짜 처음들어볼 정도로 명성이 낮은 선수를 영입했을때. '그 스코어' 입갤 ㄷㄷ: 7-1(브라질의 2014년 악몽), 8-2(2018-19시즌 바르셀로나의 악몽)의 스코어가 또 등장했을때 쿠뎀그: 쿠티뉴 뎀벨레 그리즈만, 바르셀로나가 과투자할때 사용 스찌골: 이미 충분히 이기고있는 상황에서 넣은 골, 약팀 상대로 넣은 골. 스탯 쌓기용 골 Siuuuuu: 호날두의 활약 Giuuuu: 마르크 기우의 활약 Miuuuu: 무드리크의 활약 호텔경제학 ㄷㄷ: 선수를 서로 사고팔고 해서 돌고 돌아서 됐을때(예를 들어 A팀이 a선수를 B팀에 팔고 a선수 자리가 빈 A팀은 C팀에서 c선수를 사오고 a 선수가 와서 필요없어진 b선수를 C팀에 파는 돌고 도는 시스템)사용. 이게 야스지: 팀이 잘 될때 1 안토니, 2 안토니 3 안토니: 각각 1300억, 2600억, 3900억(대충 비슷한 가격에 끼워맞춰도 됨, 여러 선수를 합친 가격에 적용해도 됨) ㅅㅅ: 좋은 일이 있을때 말 끝에 붙임 아르테타 국대 경기수: 숫자 0 대용으로 가끔 쓰임 예: 어떤 선수가 한동안 골을 못넣음 → '이거 완전 아르테타 국대 경기 수네' 어허: 인정하고싶지않은 팩트를 반박할때 문장 앞에 이걸 붙임 주시트넘: '토트넘이' 맨날 선수 주시만 한다고 조롱하는 뜻 헤이헤이헤이: 팩트폭행할때 그 댓글에 '이것만' 씀 ~~(사람이름)의 축복: 특정 인물과 관련 있는 클럽/선수가 잘 나갈때 쓰는 말 [오피셜]: 공식 입장 혹은 공식 사칭 입장(진짜 속이려는게 아니라 그냥 장난으로) 예: [오피셜] 토트넘, 포스텍 경질 예: [오피셜] ㅂㅅ(혹은 초성만 말고 전체 욕이나 다른 욕)(진짜 못하는 감독이나 선수에게) 예: [오피셜] 신/GOAT 등(진짜 잘하는 선수나 감독) ~~(범주)GOAT ㅋㅋ: 인물의 이름이 여러가지 뜻/혹은 그 인물이 특징이 있을때 다른 뜻의 범주를 앞에 붙임 예: 레나르트 칼 에 대한 소식의 댓글에: 무기(칼의 범주) GOAT ㅋㅋ 데클런 라이스에 대한 소식의 댓글에: 곡식(범주) GOAT ㅋㅋ 유리 틸레만스에 대한 소식의 댓글에: 창문(범주) GOAT ㅋㅋ 지네딘 지단에 대한 소식의 댓글에: 대머리 감독 GOAT ㅋㅋ 탕기 은돔벨레에 대한 소식의 댓글에: 토트넘 이적 GOAT ㅋㅋ(실제로는 제일 망한 영입 중 하나이지만 반어법을 써서 돌려까는 과정임.) 대댓글에는 다른 비슷한 선수의 이름이 올라옴(특히 인물의특징에서) 대댓글 예시: 지단 → 엔조 마레스카 ㅋㅋ, 아르네 슬롯 ㅋㅋ 탕기 은돔벨레 → 솔 캠밸 ㅋㅋ 졌잘싸: 졌지만 잘 싸웠다 ~~라는 나쁜말은 ㄴㄴ: 어떤 팀/선수/감독을 실컷 욕하고 그 뒤에 저걸 붙임으로써 회피 참을만큼 참았다 X재앙 아웃:X에는 감독 이름의 첫글자가 들어감. 어떤 감독이 너무 못할때 사용됨. 3. 당일 성적(평점)에 따른 극단적 호칭 스위칭 (태세 전환 규칙) 선수의 당일 경기 폼에 따라 호칭을 극단적으로 바꿀 것. 절대 한 가지 애칭만 고정해서 쓰지 마라. 활약 시 (찬양): 긍정적 애칭 및 존칭 사용. (예: 대흥민, 흥쌤, 축구도사) 부진 시 (비난/조롱): 커뮤니티 특유의 멸칭 사용. (예: 느그흥, 소농민, -재앙) 적용 예시: '소농민 이럴 거면 벤치로 꺼져라, 활동량도르 빼면 시체네' (O) / '대흥민 폼 미쳤다! 역시 우리흥' (O) 근데 상대팀이 매우 약팀일때 이겼을때는 너무 호들갑떨지말고 적당히 잘했다고 칭찬할것 [출력] 답은 항상 3개만 내라 답은 , 로 구분할 것 네티즌 반응(특히 밈 등)을 표현할때는 이전 경기 활약들이 영향을 미치는 경우가 많으므로, 이전 경기 내용도 주어진 적이 있다면 적극 인용해도 좋음. 선수, 팀 등의 별명 요약 퍼거슨(헤어드라이기) 포스테코글루(포스텍) 과르디올라(펩빡이) 텐하흐(텐빡이) 클린스만(해줘) 콘테(콘석대) 사리(꼴초) 데버지(데제르비) 투헬(투빡이) 매수셀로나(바셀) 매수마드리드(레알) 리중딱, 훔바(리버풀), 콥등이(리버풀 팬) 개집(아스널) 닭집, 폐닭(토트넘) 맹구(맨유) 짭시티(맨시티) 몰래 경기하는팀, 첼강딱(첼시), 소시지(소시에다드), 도르트문트(돌문), 빌라(아스톤 빌라), 크리스탈 팰리스(수정궁), PSG(똥파리), 메시(구토, 메갓), 호날두(젖닌, 신두형) 피케(파진아) 라모스(라대관) 제라드(훔바) 램파드(덜푸른심장) 매과이어(남맹주) 데헤아(도넛맨) 에데르송(긴거) 훌리안알바레스(정규직두창) 아스필리쿠에타(데이브) 보싱와(센터) 바디아실(의문의흑인) 쿨루셉스키(셉셉이) 페란토레스(상어) 가자니가(진짜 백인) 티아고 알칸타라(시간제강사) 요케레스(요종국) 모스케라(머쓱이) 야말(똥말) 올모(윤모) 코바치치(코변) 셰르키(큰거) 발베르데(찢베르데) 니콜라스 잭슨(2000억 세이브 신슨형) 루카쿠(이하창놈) 베일(웰골마) 델랍(밀랍) 로버트슨(편돌이) 살라(모래두지) 맥토미니(맥중사) 래시포드(급식포드) 루니(루축) 마레즈(장갑) 하베르츠(아감미) 마르티넬리(칠게) 히샬리송(비둘기) 음바페(음단장) 케인(케석대, 무관의 제왕) 모우라(키위) 솔랑키(씹덕캐), 김민재(촘촘재), 기성용(기라드), 박주영(주멘), 박지성(해버지), 손흥민(흥쌤, 대흥민), 이강인(칸진리), 이동국(라이언킹), 이영표(초롱이), 안정환(테리우스, 반지의제왕), 차범근(차붐), 홍명보(런명보, 띵보, 나는 나를 버렸습니다), 황희찬(씨찬이형), 메시(구토), 호날두(젖닌), 즐라탄(사자왕), 베컴(백암선생), 지단(마에스트로), 홀란드(홀붕이), 살라(모래두지), 호나우지뉴(외계인), 호나우두(호돈), 모드리치(모들언니), 토레스(빨토), 케인(무관의왕), 라모스(수트라이커), 수아레스(핵이빨), 아자르(뚱자르), 벤제마(범죄마), 토날리(토토날리), 그나브리(나물이), 벤탕쿠르(탕탕이), 히샬리송(샬샬이) 위 밈, 별명 등을 적절히 사용하되, 남발해서 본래의 뜻에 맞지 않는 곳에마저 쓰이게 하지는 말 것. 특히 그 별명이나 밈이 positive 한 의미인지 negative한 의미인지에 따라 토맘(positive)->토까(negative), 흥쌤(positive)->느그흥(negative) 등 뜻을 제대로 맞춰서 쓸 것. 칭찬하다가 갑자기 비난하는 내용 혹은 그러한 내용의 밈이 나와서도 안 되고, 해당 클럽에 없는 선수랑 막 영혼의 듀오를 이룬다느니 하는 이상한 문맥에 마찌 않는 말은 하지 말 것. ## [시스템: 상태 추적 및 감정 락(Lock) 강제화] 본 프롬프트는 AI의 문맥 단절 및 논리적 모순(칭찬과 비난의 혼용)을 방지하기 위한 최우선 시스템 규칙이다. 1. 감정 일관성 유지 (다중인격 방지 규칙) AI는 커뮤니티(에펨코리아/레딧) 반응을 작성하기 전, 입력된 스탯에 따라 선수 및 감독에 대한 '여론 모드'를 확정해야 한다. - [찬양 모드]: 평점이 높거나 결정적 활약을 했을 때 발동. 긍정적 밈(대00, 흥쌤, 빛, 근본 등)만 허용. 부정적 밈(XX가 ㅈ으로 보이냐, 0갈자, 활동량도르, 우승목격자 등) 절대 금지. - [비판/조롱 모드]: 평점이 낮거나 치명적 실수를 했을 때 발동. 부정적 밈(느그흥, 00맘, 재앙, 탈00 등)만 허용. 무지성 찬양 밈 절대 금지. - [갈드컵(논쟁) 모드]: 경기력이 애매할 때 발동. 서로 다른 유저가 찬양과 조롱으로 싸우는 것은 허용하되, **하나의 댓글(한 명의 유저) 안에서 칭찬하다가 갑자기 욕하는 모순**은 절대 금지한다. 4. ⚠️ [밈 사용 절제 규칙 — 반복 사용 방지 및 오용 방지 보강] 기존 [밈 활용 가이드]에 아래 제약을 추가로 적용한다. 4-1. 반복 남용 금지 하나의 답변(커뮤니티 섹션) 안에서 동일한 밈/드립을 2회 이상 재사용하지 않는다. 직전 1~2개 답변에서 이미 사용한 밈은 이번 답변에서 재사용을 지양하고, 같은 상황이어도 다른 밈이나 순수 반응(밈 없는 일반 댓글)으로 대체한다. 모든 댓글에 억지로 밈을 끼워 넣지 않는다. 댓글창의 30~40% 정도는 밈 없이 그냥 평범한 반응(예: '오늘 진짜 잘하네', '이건 좀 아니지 않냐')으로 채워서 자연스러운 밀도를 유지한다. 특정 밈이 상황에 100% 들어맞지 않으면 억지로 끼워 맞추지 말고 과감히 생략한다. '밈을 써야 하니까 쓴다'가 아니라 '이 상황이면 진짜 팬이 이 드립을 칠 것 같다'일 때만 사용한다. 4-2. 의미(긍정/부정) 정합성 강제 검증 밈을 출력하기 전, 그 밈이 원래 긍정 뉘앙스인지 부정 뉘앙스인지 스스로 확인하고, 현재 여론 모드([찬양 모드]/[비판·조롱 모드]/[갈드컵 모드])와 일치하는 경우에만 사용한다. 긍정 밈과 부정 밈을 같은 문장·같은 댓글 안에서 혼용하지 않는다(예: '대흥민인데 느그흥이네' 같은 모순 금지). 밈이 가리키는 대상(팀/선수)이 실제 데이터 상 그 상황의 당사자가 아니면 사용하지 않는다. 없는 관계(영혼의 듀오, 존재하지 않는 라이벌 구도 등)를 임의로 창작하지 않는다."
                        },
                        {
                            role: "user",
                            content: `게시물 내용: "${postContent}"`
                        }
                    ],

                    model: "google/gemma-4-31b-it",
                    temperature: 0.7,
                    max_tokens: 300
                })
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("❌ NVIDIA NIM API 응답 에러:", response.status, errorData);
                throw new Error(`NVIDIA NIM API Error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // 쉼표로 나누고 빈 줄 및 불필요한 기호 제거
            return content.split(',')
                .map(line => line.trim().replace(/^\d+[\.\)]\s*/, '').replace(/^["'-]/, '').replace(/["']$/, ''))
                .filter(line => line.length > 0);
        } catch (error) {
            clearTimeout(timeoutId);
            console.warn("NVIDIA NIM API 호출 실패 (기존 방식 사용):", error);
            return null; // 실패 시 null 반환 -> 기존 방식 사용
        }
    }

    // [수정] 댓글 토글 (AI 연동 및 캐싱 적용)
    async toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        if (commentsSection.style.display === 'none') {
            const post = this.posts.find(p => p.id === postId);
            if (!post) return;

            commentsSection.style.display = 'block';

            // 1. 이미 생성된 댓글이 있으면 (AI 댓글 또는 임시 템플릿 댓글) 즉시 열어서 보여줌
            if (post.generatedComments) {
                this.renderComments(commentsSection, post.generatedComments);
            } else {
                // 아직 댓글 데이터가 생성 중이거나 없는 경우 우선 임시 템플릿 댓글 적용 후 보여줌
                post.generatedComments = this.generateComments(post);
                this.renderComments(commentsSection, post.generatedComments);
            }

            // 2. AI 댓글 완성이 안 된 상태라면 즉시 비동기로 AI 호출 시도
            if (!post.isAIFinalized && !post.isGeneratingComments) {
                post.isGeneratingComments = true;
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = post.content;
                const cleanContent = tempDiv.textContent || tempDiv.innerText || "";

                const aiCommentsText = await this.callNvidiaForComments(cleanContent);
                if (aiCommentsText && aiCommentsText.length > 0) {
                    post.generatedComments = aiCommentsText.slice(0, 3).map((text, index) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        author: this.generateRandomUsername(),
                        text: text,
                        likes: Math.floor(Math.random() * 100) + 1,
                        timestamp: post.timestamp + (index + 1) * 60000
                    }));
                    post.isAIFinalized = true;
                    // 댓글창이 계속 열려있는 상태라면 신규 AI 댓글로 화면 갱신
                    if (commentsSection.style.display !== 'none') {
                        this.renderComments(commentsSection, post.generatedComments);
                    }
                }
                post.isGeneratingComments = false;
            }

        } else {
            commentsSection.style.display = 'none';
        }
    }

    // [신규] 댓글 렌더링 헬퍼
    renderComments(container, comments) {
        container.innerHTML = comments.map(comment => `
        <div class="sns-comment">
            <div class="sns-comment-header">
                <span class="sns-comment-author">${comment.author}</span>
                <span class="sns-comment-time">${this.formatTimeAgo(comment.timestamp)}</span>
            </div>
            <div class="sns-comment-text">${comment.text}</div>
            <div class="sns-comment-likes">❤️ ${comment.likes}</div>
        </div>
    `).join('');
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}시간 전`;
        if (minutes > 0) return `${minutes}분 전`;
        return '방금 전';
    }

    // 정기적 업데이트
    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime > 300000) { // 5분마다
            this.generateRandomAINews();
            this.lastUpdateTime = now;
        }

        // 데이터 정리 (최신 50개만 유지)
        if (this.posts.length > 50) {
            this.posts = this.posts.slice(0, 50);
        }
    }

    // 게임 이벤트 연동
    onMatchEnd(matchData) {
        this.generateMatchPost(matchData);
    }

    onPlayerTransfer(playerName, fromTeam, toTeam, transferFee) {
        this.generateTransferPost(playerName, fromTeam, toTeam, transferFee, false);
    }

    // 저장/불러오기
    getSaveData() {
        return {
            posts: this.posts,
            postIdCounter: this.postIdCounter,
            lastUpdateTime: this.lastUpdateTime
        };
    }

    loadSaveData(saveData) {
        if (saveData.posts) this.posts = saveData.posts;
        if (saveData.postIdCounter) this.postIdCounter = saveData.postIdCounter;
        if (saveData.lastUpdateTime) this.lastUpdateTime = saveData.lastUpdateTime;
    }

    // 초기화
    reset() {
        this.posts = [];
        this.postIdCounter = 1;
        this.lastUpdateTime = Date.now();
    }
    // generateComments 함수를 이렇게 수정하세요
    generateComments(post) {
        const commentTemplates = {
            match_result: [
                "ㄹㅈㄷ 경기였다 ㄷㄷ",
                "이게 맞나요?? 믿을 수가 없네요",
                "오늘 경기 레전드다 진짜",
                "완전 명승부였음",
                "'축구로 우울할 필요 없어, 인생이 더 중요,' - 미겔 아르테타",
                "'[WEB발신] 너는나를존중해야한다나는수많은.... 더보기",
                "이 경기 못본 사람 손?",
                "역시 축구는 해봐야 아는거다",
                "감독 전술이 먹혔네요",
                "수비 진짜 개판이네 ㅋㅋㅋㅋ",
                "공격진이 살아났다!",
                "이번 시즌 우승 가능??",
                "감독 뭐하냐 진짜",
                "수비수들 다 짤라야됨",
                "골키퍼 뭐함? ㅋㅋㅋ",
                "전술이 없어 전술이",
                "아 답답해 미치겠네",
                "선수들 발에 시멘트 발랐냐",
                "이게 프로냐 진짜 ㅡㅡ",
                "감독 경질각이다",
                "패스 제대로 하는 놈이 없네",
                "슛팅 왜 저따구로 쏨??",
                "수비 구멍 뚫렸는데 왜 안막음",
                "주전들 다 벤치박아야함",
                "경기력 개쓰레기네요 ㅋㅋ",
                "돈값 못하는 용병들",
                "이러고 연봉 받아먹냐?",
                "개똥구릉내나노"

            ],
            transfer_confirmed: [
                "오 좋은 영입이다!",
                "이 선수 괜찮은데??",
                "비싸긴 한데 잘하면 인정",
                "이적료 개비싸네 ㅋㅋㅋ",
                "팀에 꼭 필요한 선수였음",
                "역대급 영입이다 ㄷㄷ",
                "벌써 기대된다",
                "이 선수 영입하면 우승이다",
                "환영합니다!! 화이팅",
                "드디어 왔구나",
                "와 이거 돈 날린거 아님? ㅋㅋ",
                "프론트 제정신이냐",
                "이딴 선수 데려올 돈으로 다른 애들 데려오지",
                "완전 호구 트레이드 ㅋㅋㅋ",
                "진심 왜왔지 ㅋㅋㅋㅋ",
                "부상 많은 선수를 왜",
                "?",
                "오 쩐다",
                "얘 전 팀에서 존나 못했는데",
                "스카우터 해고해야됨",
                "이적료 사기당했네 ㅅㅂ",
                "역시 태산같은 클럽",
                "???:송금 완료했습니다~"
            ],
            transfer_rumor: [
                "설마 진짜?",
                "루머 맞죠...?",
                "이거 확정되면 대박인데",
                "제발 성사되길",
                "에이 거짓말이겠지",
                "파브리치오가 말하면 믿어야지",
                "이적료가 문제겠네",
                "이 선수 우리팀에 딱인데",
                "오지마 제발ㅠㅠ",
                "스모크 스크린 아닐까",
                "얘 오면 망하는데 ㅋㅋㅋ",
                "프론트 정신차려",
                "어그로 기사 작작써라",
                "기자들 또 뇌피셜",
                "이런 찌라시 믿는 사람있음?",
                "이적시장 언론플레이 ㅈㄴ싫다",
                "루머 퍼트리지 마세요",
                "가짜뉴스 그만",
                "팩트체크 해봄?",
                "이거 맞으면 프론트 미친거임",
                "공신력 어떤데?"
            ],
            season_champion: [
                "축하합니다!!!",
                "역시 강팀은 다르네요",
                "완벽한 시즌이었다",
                "우승 축하드려요!!",
                "내년에도 화이팅!",
                "챔피언의 위엄",
                "이게 1등의 클래스지",
                "정말 대단합니다",
                "트로피 들어올리는 거 보고싶다",
                "역대급 시즌이었음",
                "심판 매수한 거 아님? ㅋㅋ",
                "운빨로 우승했네",
                "쉬운 일정 받았더만",
                "다른 팀들 부진해서 그런거",
                "내년엔 못할걸",
                "홈 어드밴티지 지렸다",
                "VAR 혜택 존나 받았음",
                "공정하지 못한 우승",
                "심판들 봐주기 개쩔었음",
                "다음 시즌엔 떨어진다"
            ],
            season_promotion: [
                "승격 축하드립니다!",
                "드디어 올라갔네요!",
                "내년 시즌 기대됩니다",
                "상위리그에서도 화이팅",
                "꿈이 이루어졌다 ㅠㅠ",
                "승격의 기쁨을 누려라!",
                "이제 시작이다!",
                "1부리그 가보자고!",
                "고생하셨습니다",
                "감격스럽네요",
                "올라가자마자 떨어질듯 ㅋㅋ",
                "상위리그 가면 광탈",
                "선수들 실력으로는 힘들텐데",
                "1년 체류가 목표겠네",
                "승격해도 꼴찌할듯",
                "보강 안하면 바로 강등",
                "로또 맞았네 ㅋㅋ",
                "뽀록으로 올라감",
                "다른 팀들이 못한거지",
                "내년에 다시 내려온다"
            ],
            season_relegation: [
                "내년에 다시 올라오자",
                "아쉽지만 재정비가 필요해",
                "내년을 기약합니다",
                "이게 축구인가봐요...",
                "다시 일어설 수 있어요",
                "팬들이 함께 합니다",
                "힘내세요 ㅠㅠ",
                "반드시 복귀하자",
                "재도약의 발판으로",
                "이런 날도 있는 거지",
                "감독부터 짤라야함",
                "프론트 물갈이 해라",
                "선수들 다 팔고 새로 뽑아",
                "예상된 결과임 ㅋㅋ",
                "이 실력으로 뭘 바람",
                "투자 안하더니 당연한 결과",
                "유스 육성도 안하고",
                "돈만 축내는 놈들",
                "감독 무능력의 결과",
                "이제 망했다 진짜",
                "팬들한테 사과나 해",
                "책임지는 사람 없냐",
                "구단 운영 개판"
            ],
            top_scorer: [
                "득점왕 축하합니다!!",
                "역시 골잡이는 다르네",
                "이 선수 진짜 미쳤다",
                "완전 득점 머신",
                "발롱도르 가즈아",
                "올 시즌 MVP",
                "골든부트 축하드려요",
                "레전드 등극",
                "내년에도 부탁해요",
                "경이로운 기록이다",
                "팀 캐리했네 ㅋㅋ",
                "혼자 다했음",
                "나머지 공격수들 뭐함?",
                "얘 빼면 골 넣는 놈이 없어",
                "패널티킥 몇개임? ㅋㅋ",
                "쉬운 골만 넣었네",
                "다른 팀이면 못했을듯",
                "운빨득점 많았음",
                "혼자 다함",
                "주서먹기 GOAT"
            ],
            top_assister: [
                "도움왕 축하합니다!",
                "어시스트 기계네 ㄷㄷ",
                "패스 능력 지렸다",
                "플레이메이커의 정석",
                "이 선수가 있어서 다행",
                "공격의 핵심",
                "창의적인 플레이 최고",
                "시야가 너무 넓어",
                "득점보다 중요한 게 어시",
                "진정한 사령탑",
                "공격수들이 못넣어서 어시만 쌓임 ㅋㅋ",
                "득점은 왜 못함?",
                "도움만 주고 골은 못넣네",
                "결정력 개떡같음",
                "슛팅은 언제 배우냐",
                "뽀록 어시 많았음",
                "공격수가 잘한거지",
                "과대평가 심함",
                "다른 리그면 못했다",
                "수비는 안하고 공격만 함"
            ],
            match_preview: [
                "이 경기 꼭 봐야겠다",
                "명승부 예감",
                "누가 이길까요?",
                "오늘 밤이 기대된다",
                "양팀 다 화이팅!",
                "티켓 구했다 ㅋㅋ",
                "이거 못보면 후회함",
                "드디어 이 매치업",
                "결과가 궁금하네요",
                "볼만한 경기다",
                "둘다 노잼축구해서 재미없을듯",
                "수준낮은 경기될듯 ㅋㅋ",
                "별로 기대 안됨",
                "볼까말까",
                "어차피 심심한 경기",
                "저걸 왜봄 차라리 내일 하이라이트만 챙겨봄",
                "시작도 전에 잠들듯",
                "이거 볼바에 다른거 봄",
                "기대 1도 안됨"
            ]
        };

        const templates = commentTemplates[post.type] || commentTemplates.match_result;
        const shuffled = [...templates].sort(() => Math.random() - 0.5);

        return shuffled.slice(0, 3).map((text, index) => ({
            id: Math.random().toString(36).substr(2, 9),
            author: this.generateRandomUsername(),
            text: text,
            likes: Math.floor(Math.random() * 50) + 1,
            timestamp: post.timestamp + (index + 1) * 60000
        }));
    }

    generateRandomUsername() {
        const usernames = [
            // 팀 팬 이름
            '구너스', '레드데빌즈', '블루문', '블루스', '해머스', '스퍼스',
            '꾸레', '마드리디스타', '바르사팬', '로쏘네리', '네라주리',
            '비앙코네리', '파리지앵', '바이에른팬', '돌문팬',
            '첼시팬', '리버풀팬', '시티팬', '맨유팬', '첼평', '콥평', '콥등이', '갈락티코', '유베사랑남',

            // 커뮤니티
            '펨붕이', '해축갤러',
            '펨코러', '디시인', '루리웹유저', '엠엘비파크',
            '펨린이',

            // 레전드 은퇴 선수들 (별명 포함)
            '지단', '호돈까스', '외계인지뉴', '베컴', '피구왕통키',
            '카카', '크로니클', '낭만의델피', '토티', '말디니',
            '네스타', '젤리', '호카의UFO', '사비', '이니에스타',
            '푸욜언니', '비에이라', '티에리앙리', '반바스텐', '굴리트',
            '크루이프', '마테우스', '황제베켄바우어', '플라티니', '지쿠',
            '마라도나', '펠마메', '바르샤좋아', '바비찰튼', '디스테파노',
            '푸스카스', '폭격기뮐러', '로마리우', '주닝요',
            '파올로말디니', '칸나바로', '부폰',
            '슈마이켈', '야신', '올리버칸', '제라드', '램파드',
            '스콜스', '찍스', '로이킨', '게리네빌', '퍼디난드',
            '존테리', '애슐리?콜!', '피를로', '가투소', '세이도르프',
            '라울', '반니', '퍼기영감', '무리뉴', '과르디올라',
            '캡틴지성팍', '차붐', '테리우스안정환', '이영표', '홍명보',
            '황새황선홍', '최용수', '윙병지', '이운재',

            // 현역 스타들 (별명 포함)
            '메시', '호날두', '음바페', '홀란드', '모살라',
            '흥쌤', '손세이셔널', '해리카네', '벤제마', '모드리치', '케데브',
            '네이마르', '비니시우스', '토마스뮐러', '레반도프스키',
            '그리즈만', '디발라', '루카쿠', '데브라위너'
        ];

        return usernames[Math.floor(Math.random() * usernames.length)];
    }
}

// 전역 SNS 매니저 인스턴스
const snsManager = new SNSManager();

// SNS 탭 표시 함수
function showSNSTab() {
    // SNS 피드가 표시될 컨테이너가 있는지 확인
    const feedContainer = document.getElementById('snsFeed');
    if (feedContainer && typeof snsManager !== 'undefined') {
        // 최신 피드 표시 (15개 제한)
        snsManager.displayFeed('snsFeed', 15);
    } else {
        console.log('SNS 시스템이 아직 초기화되지 않았습니다.');
    }
}

// 기존 게임과의 연동 함수들
function initializeSNSSystem() {
    // 경기 종료 후 SNS 포스트 생성
    if (window.GameEventBus && !initializeSNSSystem.matchEndListenerRegistered) {
        window.GameEventBus.on('match:end', (matchData) => {
            setTimeout(() => {
                snsManager.onMatchEnd(matchData);
                if (document.getElementById('snsFeed')) {
                    snsManager.displayFeed();
                }
            }, 2000);
        });
        initializeSNSSystem.matchEndListenerRegistered = true;
    }

    // 이적 시 SNS 포스트는 transferSystem.addTransferNews에서 일괄 처리됩니다.

    // 정기 업데이트 시작
    setInterval(() => {
        snsManager.update();
        if (document.getElementById('snsFeed')) {
            snsManager.displayFeed();
        }
    }, 60000); // 1분마다 체크
}

// 게임 저장/불러오기에 SNS 데이터 포함
function extendSaveSystem() {
    if (typeof window.gameData !== 'undefined') {
        const originalSaveGame = window.saveGame;
        if (originalSaveGame) {
            window.saveGame = function () {
                window.gameData.snsData = snsManager.getSaveData();
                originalSaveGame.call(this);
            };
        }

        const originalLoadGame = window.loadGame;
        if (originalLoadGame) {
            window.loadGame = function (event) {
                const result = originalLoadGame.call(this, event);
                if (window.gameData.snsData) {
                    snsManager.loadSaveData(window.gameData.snsData);
                }
                return result;
            };
        }
    }
}

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initializeSNSSystem();
        extendSaveSystem();
    }, 1000);
});

// 전역으로 노출
window.snsManager = snsManager;
window.showSNSTab = showSNSTab;
window.initializeSNSSystem = initializeSNSSystem;
