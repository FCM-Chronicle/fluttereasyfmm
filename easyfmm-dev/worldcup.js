// c:\Users\jinuj\vsc\easyfmm\worldcup.js

const WorldCupManager = {
    wcPlayers: {}, // 월드컵 참가 선수 데이터
    nationalPools: {}, // 해당 국가의 전체 가용 선수 풀 (Real + Virtual)
    groups: {},    // 조 편성 데이터
    userTeam: null, // 유저가 선택한 팀
    tournamentBracket: [], // 토너먼트 대진표 데이터
    currentStage: 'group', // group, r32, r16, qf, sf, final
    isEliminated: false, // 유저 탈락 여부
    currentCallUpSort: 'ovr', // [추가] 차출 탭 정렬 기준 (ovr, name)
    currentSlotIndex: null, // 현재 플레이 중인 슬롯 번호
    // 해보자

    // [수정] 언어권별 이름 데이터베이스 (한글 표기)
    // 주요 국가(한국, 잉글랜드, 스페인, 독일, 이탈리아, 네덜란드)는 제외됨
    nameDatabase: {
        "Latin": { // 남미, 포르투갈, 기타 라틴어권
            first: ["안토니오", "호세", "마누엘", "프란시스코", "다비드", "후안", "하비에르", "다니엘", "카를로스", "헤수스", "루이스", "디에고", "가브리엘", "루카스", "마르코", "파울로", "페드로", "미겔", "앙헬"],
            last: ["가르시아", "곤잘레스", "로드리게스", "페르난데스", "로페즈", "마르티네즈", "산체스", "페레즈", "고메즈", "마틴", "실바", "산토스", "올리베이라", "수자", "페레이라", "코스타", "카르발류"]
        },
        "Germanic": { // 북유럽, 오스트리아, 스위스 등
            first: ["한스", "클라우스", "루카스", "얀", "피터", "에릭", "마그누스", "스벤", "올레", "칼", "토마스", "미카엘", "안드레아스", "마르틴", "요나스", "크리스티안"],
            last: ["뮐러", "슈미트", "슈나이더", "피셔", "베버", "마이어", "바그너", "베커", "한센", "요한센", "닐슨", "옌센", "안데르센", "라르손"]
        },
        "FrenchAfrican": { // 프랑스어권 아프리카, 벨기에 등
            first: ["장", "피에르", "미셸", "필립", "알랭", "루이", "마마두", "이브라힘", "모하메드", "알리", "오마르", "세이두", "무사", "아다마", "바카리"],
            last: ["마르탱", "베르나르", "토마", "프티", "로베르", "리샤르", "뒤랑", "뒤부아", "트라오레", "카마라", "디알로", "케이타", "시소코", "코네", "쿨리발리"]
        },
        "EasternEurope": { // 동유럽 (크로아티아, 세르비아, 폴란드 등)
            first: ["이반", "루카", "마르코", "니콜라", "다비드", "필립", "알렉산다르", "세르게이", "블라디미르", "안드레이", "드미트리", "로베르트", "도미니크", "마테오"],
            last: ["페트로비치", "이바노비치", "요바노비치", "코바치", "호르바트", "노바크", "스토야노비치", "포포비치", "디미트로프", "레반도프스키", "모드리치", "블라호비치"]
        },
        "MiddleEast": { // 중동 (사우디, 이란, 카타르 등)
            first: ["모하메드", "아흐메드", "알리", "하산", "후세인", "이브라힘", "오마르", "유세프", "압둘라", "칼리드", "살렘", "나세르", "파하드"],
            last: ["알리", "모하메드", "아흐메드", "하산", "이브라힘", "살라", "마흐무드", "사이드", "압델", "라만", "알도사리", "알셰흐리"]
        },
        "Japanese": { // 일본
            first: ["타쿠미", "쇼타", "켄타", "다이키", "유우키", "나오키", "료", "카이토", "타츠야", "카오루", "타케후사", "히로키", "아오", "리츠", "코이타쿠"],
            last: ["사토", "스즈키", "타카하시", "타나카", "와타나베", "이토", "야마모토", "나카무라", "코바야시", "카토", "미토마", "쿠보", "토미야스", "엔도", "카마다"]
        },
        "Chinese": { // 중국
            first: ["웨이", "하오", "레이", "양", "펑", "보", "린", "지에", "타오", "민", "준", "롱", "시", "카이"],
            last: ["리", "왕", "장", "류", "첸", "양", "자오", "황", "주", "우", "가오", "마", "궈"]
        },
        "English": { // 미국, 호주, 캐나다 등 (잉글랜드 제외)
            first: ["제임스", "존", "로버트", "마이클", "윌리엄", "데이비드", "리차드", "조셉", "토마스", "찰스", "해리", "올리버", "잭", "노아", "조지", "카일"],
            last: ["스미스", "존슨", "윌리엄스", "브라운", "존스", "밀러", "데이비스", "가르시아", "로저스", "윌슨", "워커", "케인", "엘리엇", "포든", "라이스"]
        }
    },
    
    // 월드컵 조 편성 데이터 (12개 조)
    groupDefinitions: {
        A: ["멕시코", "남아공", "대한민국", "PO_EU_D"],
        B: ["캐나다", "PO_EU_A", "카타르", "스위스"],
        C: ["브라질", "모로코", "아이티", "스코틀랜드"],
        D: ["미국", "파라과이", "호주", "PO_EU_C"],
        E: ["독일", "퀴라소", "코트디부아르", "에콰도르"],
        F: ["네덜란드", "일본", "PO_EU_B", "튀니지"],
        G: ["벨기에", "이집트", "이란", "뉴질랜드"],
        H: ["스페인", "카보베르데", "사우디아라비아", "우루과이"],
        I: ["프랑스", "세네갈", "PO_IC_2", "노르웨이"],
        J: ["아르헨티나", "알제리", "오스트리아", "요르단"],
        K: ["포르투갈", "PO_IC_1", "우즈베키스탄", "콜롬비아"],
        L: ["잉글랜드", "크로아티아", "가나", "파나마"]
    },

    // 플레이오프(PO) 후보군
    poCandidates: {
        "PO_EU_D": ["체코", "덴마크"],
        "PO_EU_A": ["이탈리아", "웨일스"],
        "PO_EU_C": ["튀르키예", "루마니아"],
        "PO_EU_B": ["우크라이나", "폴란드"],
        "PO_IC_2": ["이라크", "볼리비아"],
        "PO_IC_1": ["코스타리카", "아랍에미리트"]
    },

    init() {
        this.createWorldCupButton();
    },

    createWorldCupButton() {
        const existingBtn = document.getElementById('worldCupBtn');
        if (existingBtn) {
            existingBtn.onclick = () => this.openWorldCupMenu();
            return;
        }

        const btn = document.createElement('button');
        btn.id = 'worldCupBtn';
        btn.className = 'btn';
        btn.type = 'button';
        btn.title = 'FIFA 월드컵 모드 시작';
        btn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>월드컵 모드</span>`;
        btn.onclick = () => this.openWorldCupMenu();

        const container = document.querySelector('.team-selection-extra-modes') || document.getElementById('teamSelection') || document.body;
        container.appendChild(btn);
    },

    openWorldCupMenu() {
        let modal = document.getElementById('wcModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'wcModal';
            modal.className = 'modal';
            modal.style.zIndex = '10000';

            const content = document.createElement('div');
            content.className = 'modal-content';
            content.style.cssText = 'background: #111827; color: white; max-width: 600px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;';

            const closeSpan = document.createElement('span');
            closeSpan.className = 'close';
            closeSpan.textContent = '×';
            closeSpan.onclick = () => { modal.style.display = 'none'; };

            const h2 = document.createElement('h2');
            h2.style.cssText = 'color: #FBBF24; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;';
            h2.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>FIFA 월드컵 모드</span>`;

            const desc = document.createElement('p');
            desc.style.cssText = 'text-align: center; margin-bottom: 20px;';
            desc.textContent = '48개국이 펼치는 세계 최고의 축제!';

            const col = document.createElement('div');
            col.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

            const startBtn = document.createElement('button');
            startBtn.className = 'btn primary';
            startBtn.textContent = '새 월드컵 시작';
            startBtn.onclick = () => WorldCupManager.startNewWorldCup();

            const hr = document.createElement('hr');
            hr.style.cssText = 'border: 0; border-top: 1px solid rgba(255,255,255,0.1); width: 100%; margin: 10px 0;';

            const h4 = document.createElement('h4');
            h4.style.margin = '0';
            h4.textContent = '불러오기 (월드컵 전용 슬롯)';

            const slotsDiv = document.createElement('div');
            slotsDiv.id = 'wcSaveSlots';

            col.append(startBtn, hr, h4, slotsDiv);
            content.append(closeSpan, h2, desc, col);
            modal.appendChild(content);
            document.body.appendChild(modal);
        }
        this.renderSaveSlots();
        modal.style.display = 'block';
    },

    renderSaveSlots() {
        const container = document.getElementById('wcSaveSlots');
        if (!container) return;
        container.replaceChildren();
        for (let i = 1; i <= 3; i++) {
            const wcKey = `worldcup_save_${i}`;
            const slotData = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(wcKey) : localStorage.getItem(wcKey);
            const info = slotData ? JSON.parse(slotData).timestamp : null;
            const dateStr = info ? new Date(info).toLocaleString() : '비어있음';

            const slotBtn = document.createElement('div');
            slotBtn.style.cssText = `background: rgba(255,255,255,0.1); padding: 10px; margin-bottom: 5px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;`;

            const leftSpan = document.createElement('span');
            leftSpan.append(`슬롯 ${i} `);
            const dateSmall = document.createElement('small');
            dateSmall.style.color = '#aaa';
            dateSmall.textContent = `(${dateStr})`;
            leftSpan.appendChild(dateSmall);

            const btnWrap = document.createElement('div');
            btnWrap.style.cssText = 'display: flex; gap: 5px;';

            if (slotData) {
                const loadBtn = document.createElement('button');
                loadBtn.className = 'btn';
                loadBtn.style.cssText = 'padding: 5px 10px; font-size: 0.8rem;';
                loadBtn.textContent = '로드';
                loadBtn.onclick = () => WorldCupManager.loadWorldCup(i);

                const delBtn = document.createElement('button');
                delBtn.className = 'btn';
                delBtn.style.cssText = 'padding: 5px 10px; font-size: 0.8rem; background: #c0392b;';
                delBtn.textContent = '삭제';
                delBtn.onclick = () => WorldCupManager.deleteWorldCup(i);

                btnWrap.append(loadBtn, delBtn);
            }

            slotBtn.append(leftSpan, btnWrap);
            container.appendChild(slotBtn);
        }
    },

    startNewWorldCup() {
        if (!confirm('새로운 월드컵을 시작하시겠습니까?')) return;
        this.generateWorldCupData();
        
        // [추가] 데이터 생성 검증 (빈 데이터 저장 방지)
        if (!this.wcPlayers || Object.keys(this.wcPlayers).length === 0) {
            alert("월드컵 데이터 생성에 실패했습니다. (선수 데이터 없음)\n페이지를 새로고침 후 다시 시도해주세요.");
            console.error("generateWorldCupData failed: wcPlayers is empty");
            return;
        }

        this.setupGroups();
        // [수정] 팀 선택 전에는 저장하지 않음 (데이터 손상 방지)
        document.getElementById('wcModal').style.display = 'none';
        this.showGroupStageUI();
    },

    generateWorldCupData() {
        this.wcPlayers = {}; // 최종 스쿼드 (25인)
        this.nationalPools = {}; // 전체 선수 풀 (차출용)
        const countries = {};

        // 1. 기존 allTeams에서 국적별로 선수 분류 (아이콘 제외) - teamNames가 필요하므로 함께 확인
        if (typeof allTeams !== 'undefined') {
            Object.entries(allTeams).forEach(([teamKey, teamData]) => {
                teamData.players.forEach(p => {
                    // [수정] 레전드 선수(isIcon) 제외
                    if (p.isIcon) return;

                    if (p.country && p.country !== "국적 미상") {
                        if (!countries[p.country]) countries[p.country] = [];
                        countries[p.country].push({ ...p, originalClub: teamNames[teamKey] || teamKey });
                    }
                });
            });
        }

        // [추가] 2. transfer.js의 외부 리그(extraPlayers) 선수들도 국가별로 분류
        if (typeof transferSystem !== 'undefined' && Array.isArray(transferSystem.extraPlayers)) {
            transferSystem.extraPlayers.forEach(p => {
                // 레전드 선수(isIcon) 제외
                if (p.isIcon) return;

                if (p.country && p.country !== "국적 미상") {
                    if (!countries[p.country]) countries[p.country] = [];
                    countries[p.country].push({ ...p, originalClub: p.team || "외부 리그" });
                }
            });
        }

        // 2. 월드컵 참가국 목록 확정
        const participatingCountries = new Set();
        Object.values(this.groupDefinitions).forEach(group => {
            group.forEach(teamName => {
                if (this.poCandidates[teamName]) {
                    this.poCandidates[teamName].forEach(c => participatingCountries.add(c));
                } else {
                    participatingCountries.add(teamName);
                }
            });
        });

        // 3. 각 국가별 스쿼드 구성 (25인)
        participatingCountries.forEach(country => {
            let realPlayers = countries[country] || [];

            // [추가] 실제 선수들의 평균 오버롤 계산
            const totalRating = realPlayers.reduce((sum, p) => sum + p.rating, 0);
            const avgRating = realPlayers.length > 0 ? Math.round(totalRating / realPlayers.length) : 0;
            
            // 포지션별 분류 및 정렬
            const gks = realPlayers.filter(p => p.position === 'GK').sort((a, b) => b.rating - a.rating);
            const dfs = realPlayers.filter(p => p.position === 'DF').sort((a, b) => b.rating - a.rating);
            const mfs = realPlayers.filter(p => p.position === 'MF').sort((a, b) => b.rating - a.rating);
            const fws = realPlayers.filter(p => p.position === 'FW').sort((a, b) => b.rating - a.rating);

            const squad = [];
            const pool = [...realPlayers]; // 전체 풀

            // 필수 인원 선발 (GK 3, DF 6, MF 6, FW 6)
            const selectTop = (list, count) => {
                const selected = list.slice(0, count);
                squad.push(...selected);
                return selected;
            };

            const selectedGKs = selectTop(gks, 3);
            const selectedDFs = selectTop(dfs, 6);
            const selectedMFs = selectTop(mfs, 6);
            const selectedFWs = selectTop(fws, 6);

            // 부족한 인원 가상 선수로 채우기
            const fillVirtual = (pos, currentCount, targetCount) => {
                for (let i = currentCount; i < targetCount; i++) {
                    const vp = this.createVirtualPlayer(country, pos, avgRating);
                    squad.push(vp);
                    pool.push(vp); // 풀에도 추가
                }
            };

            fillVirtual('GK', selectedGKs.length, 3);
            fillVirtual('DF', selectedDFs.length, 6);
            fillVirtual('MF', selectedMFs.length, 6);
            fillVirtual('FW', selectedFWs.length, 6);

            // 와일드카드 4명 (남은 선수 중 오버롤 높은 순)
            const selectedNames = new Set(squad.map(p => p.name));
            const remaining = pool.filter(p => !selectedNames.has(p.name)).sort((a, b) => b.rating - a.rating);
            
            const wildcards = remaining.slice(0, 4);
            squad.push(...wildcards);

            // 와일드카드도 부족하면 가상 선수 (포지션 균형)
            if (wildcards.length < 4) {
                const needed = 4 - wildcards.length;
                for (let i = 0; i < needed; i++) {
                    const pos = ['DF', 'MF', 'FW'][i % 3];
                    const vp = this.createVirtualPlayer(country, pos, avgRating);
                    squad.push(vp);
                    pool.push(vp);
                }
            }

            this.wcPlayers[country] = squad;
            this.nationalPools[country] = pool;
        });
    },

    createVirtualPlayer(country, fixedPos = null, avgRating = 0) {
        // 언어권 기반 이름 생성 로직
        let region = "English"; // 기본값 (미국, 호주 등)

        if (["스페인", "포르투갈", "브라질", "아르헨티나", "멕시코", "콜롬비아", "우루과이", "파라과이", "칠레", "에콰도르", "볼리비아", "페루", "베네수엘라", "코스타리카", "파나마", "쿠바", "온두라스"].includes(country)) region = "Latin";
        else if (["프랑스", "벨기에", "세네갈", "카메룬", "코트디부아르", "모로코", "알제리", "튀니지", "가나", "나이지리아", "부르키나파소", "말리", "기니", "콩고"].includes(country)) region = "FrenchAfrican";
        else if (["독일", "오스트리아", "스위스", "네덜란드", "덴마크", "스웨덴", "노르웨이", "아이슬란드"].includes(country)) region = "Germanic";
        else if (["크로아티아", "세르비아", "폴란드", "우크라이나", "러시아", "체코", "슬로바키아", "헝가리", "루마니아", "불가리아", "보스니아", "슬로베니아"].includes(country)) region = "EasternEurope";
        else if (["사우디아라비아", "이란", "카타르", "UAE", "이라크", "요르단", "이집트"].includes(country)) region = "MiddleEast";
        else if (["일본"].includes(country)) region = "Japanese";
        else if (["중국", "북한", "베트남", "태국"].includes(country)) region = "Chinese";

        // 한국, 잉글랜드, 이탈리아 등은 DB에 충분하므로 가상 생성 시에는 기본값이나 근접한 지역 사용
        // (실제로는 DB가 충분하면 이 함수가 호출될 일이 거의 없음)

        const nameSet = this.nameDatabase[region] || this.nameDatabase["English"];
        const first = nameSet.first[Math.floor(Math.random() * nameSet.first.length)];
        const last = nameSet.last[Math.floor(Math.random() * nameSet.last.length)];
        
        // 동양권은 성+이름, 그 외는 이름+성
        const name = ["대한민국", "일본", "중국", "북한"].includes(country) ? `${last}${first}` : `${first} ${last}`;
        
        const positions = ['GK', 'DF', 'MF', 'FW'];
        const position = fixedPos || positions[Math.floor(Math.random() * positions.length)];
        
        let rating;
        if (avgRating === 0) {
            // 실제 선수가 한 명도 없는 경우: 65 ~ 76 사이
            rating = Math.floor(Math.random() * 12) + 65;
        } else {
            // 팀 평균 오버롤 기반: 평균 + (-7 ~ +2)
            const adjustment = Math.floor(Math.random() * 10) - 7;
            rating = Math.max(50, Math.min(99, avgRating + adjustment));
        }

        const age = Math.floor(Math.random() * 15) + 18;

        return { name, position, country, age, rating, isVirtual: true, originalClub: "FA" };
    },

    setupGroups() {
        this.groups = {};
        Object.keys(this.groupDefinitions).forEach(groupName => {
            const rawTeams = this.groupDefinitions[groupName];
            const resolvedTeams = rawTeams.map(team => {
                if (this.poCandidates[team]) {
                    const candidates = this.poCandidates[team];
                    return candidates[Math.floor(Math.random() * candidates.length)];
                }
                return team;
            });
            this.groups[groupName] = resolvedTeams;
        });
    },

    showGroupStageUI() {
        let modal = document.getElementById('wcGroupsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'wcGroupsModal';
            modal.className = 'modal';
            modal.style.zIndex = '10001';

            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.cssText = 'background: #2c3e50; color: white; max-width: 900px; max-height: 90vh; overflow-y: auto;';

            const closeBtn = document.createElement('span');
            closeBtn.className = 'close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => {
                const target = document.getElementById('wcGroupsModal');
                if (target) target.style.display = 'none';
            };

            const title = document.createElement('h2');
            title.style.cssText = 'color: #FBBF24; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;';
            title.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>조별리그 대진표</span>`;

            const subtitle = document.createElement('p');
            subtitle.style.cssText = 'text-align: center; font-size: 1.1rem; color: #2ecc71; margin-bottom: 20px;';
            subtitle.textContent = '감독을 맡을 국가대표팀을 클릭하세요! ';

            const groupsContainer = document.createElement('div');
            groupsContainer.id = 'wcGroupsContainer';
            groupsContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;';

            modalContent.append(closeBtn, title, subtitle, groupsContainer);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        }
        const container = document.getElementById('wcGroupsContainer');
        container.replaceChildren();
        Object.keys(this.groups).forEach(groupName => {
            const teams = this.groups[groupName];
            const groupDiv = document.createElement('div');
            groupDiv.style.cssText = 'background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);';

            const groupHeader = document.createElement('h3');
            groupHeader.style.cssText = 'color: #ffd700; margin-top: 0; border-bottom: 2px solid #ffd700; padding-bottom: 5px;';
            groupHeader.textContent = `${groupName}조`;
            groupDiv.appendChild(groupHeader);

            teams.forEach(t => {
                const teamItem = document.createElement('div');
                teamItem.style.cssText = 'padding: 8px; margin: 5px 0; border-radius: 5px; background: rgba(0,0,0,0.3); cursor: pointer; transition: all 0.2s; text-align: center; border: 1px solid transparent;';
                teamItem.textContent = t;
                teamItem.onclick = () => WorldCupManager.selectTeam(t);
                teamItem.onmouseover = () => {
                    teamItem.style.background = '#2980b9';
                    teamItem.style.borderColor = '#3498db';
                };
                teamItem.onmouseout = () => {
                    teamItem.style.background = 'rgba(0,0,0,0.3)';
                    teamItem.style.borderColor = 'transparent';
                };
                groupDiv.appendChild(teamItem);
            });
            container.appendChild(groupDiv);
        });
        modal.style.display = 'block';
    },

    selectTeam(teamName) {
        if (confirm(`'${teamName}'국가대표팀으로 월드컵에 참가하시겠습니까?`)) {
            this.userTeam = teamName;
            // [수정] 모드 진입(데이터 초기화) 후 저장해야 안전함
            this.enterWorldCupMode();
            this.tryInitialSave();
        }
    },

    enterWorldCupMode(isLoading = false) { // [수정] 로딩 여부 파라미터 추가
        console.log("[WorldCup] 월드컵 모드 진입 시작:", this.userTeam);

        // [수정] 1. UI 전환을 가장 먼저 수행 (화면이 멈춘 것처럼 보이지 않게 함)
        const groupsModal = document.getElementById('wcGroupsModal');
        if (groupsModal) groupsModal.style.display = 'none';
        
        const wcModal = document.getElementById('wcModal');
        if (wcModal) wcModal.style.display = 'none';

        try {
        // 1. 전역 데이터 설정
        Object.keys(this.wcPlayers).forEach(country => {
            if (!window.teams) window.teams = {};
            if (!window.teamNames) window.teamNames = {};
            if (!window.allTeams) window.allTeams = {};

            window.teams[country] = this.wcPlayers[country];
            window.teamNames[country] = country;
            window.allTeams[country] = { league: 4, players: this.wcPlayers[country], description: "National Team" };
        });

        // 2. 게임 데이터 초기화
        gameData.selectedTeam = this.userTeam;
        gameData.currentLeague = 4; // 월드컵 리그 ID
        gameData.teamMoney = 0;
        gameData.isWorldCupMode = true;
        
        // [추가] 월드컵 모드 진입 시 BGM 플레이리스트 변경
        if (typeof audioManager !== 'undefined') {
            audioManager.updatePlaylist();
        }
        
        // [수정] 로딩 중이 아닐 때만 초기화 (진행 상황 유지)
        if (!isLoading) {
            gameData.matchesPlayed = 0;
            gameData.seasonCount = 1;
            this.currentStage = 'group';
            this.isEliminated = false;
        }

        // 3. 리그 데이터 초기화
        if (!gameData.leagueData) gameData.leagueData = {};
        
        if (!isLoading) {
            gameData.leagueData.division4 = {};
            Object.keys(this.wcPlayers).forEach(teamKey => {
                gameData.leagueData.division4[teamKey] = { matches: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
            });
        }

        // 4. 스쿼드 자동 채우기
        gameData.squad = { gk: null, df: [null,null,null,null], mf: [null,null,null], fw: [null,null,null] };
        if (typeof window.autoFillSquad === 'function') {
            window.autoFillSquad();
        } else {
            console.warn("autoFillSquad 함수를 찾을 수 없습니다.");
        }

        // 5. DNA 초기화 (중요!)
        if (typeof DNAManager !== 'undefined') {
            DNAManager.initialize(window.teams[this.userTeam]);
        }

        // 5. 전체 조별리그 일정 생성 (로딩 중이 아닐 때만)
        if (!isLoading) {
            this.generateWCSchedule();
        }

        // 7. UI 전환 (탭 숨김/표시)
        this.updateWorldCupUI();

        // 6. UI 전환
        if (document.getElementById('teamName')) document.getElementById('teamName').textContent = this.userTeam;
        if (typeof window.updateDisplay === 'function') window.updateDisplay();
        if (typeof window.displayTeamPlayers === 'function') window.displayTeamPlayers();
        
        // [수정] 로비 화면으로 이동하고 스쿼드 탭 표시
        if (typeof window.showScreen === 'function') window.showScreen('lobby');
        if (typeof window.showTab === 'function') window.showTab('squad');

        alert(`[월드컵] ${this.userTeam} 감독 취임! 월드컵 조별리그가 시작됩니다.`);
        
        } catch (e) {
            console.error("월드컵 모드 진입 중 오류 발생:", e);
            alert("오류가 발생했습니다. 콘솔을 확인해주세요.");
        }
    },

    // [신규] 월드컵 모드 UI 업데이트 (탭 제어)
    updateWorldCupUI() {
        // 1. 불필요한 탭 숨기기
        const tabsToHide = ['transfer', 'sponsor', 'youth', 'transfer_news', 'league', 'sns', 'mail'];
        tabsToHide.forEach(t => {
            const btn = document.querySelector(`[data-tab="${t}"]`);
            if (btn) btn.style.display = 'none';
        });

        // 2. 차출 탭 (이적 탭 재활용)
        const transferBtn = document.querySelector(`[data-tab="transfer"]`);
        if (transferBtn) {
            transferBtn.style.display = '';
            window.setTabButtonLabel(transferBtn, 'transfer', '차출');
            transferBtn.dataset.tab = 'callup'; // 탭 ID 변경
        }

        // 3. 기록 탭 (이름 변경)
        const recordsBtn = document.querySelector(`[data-tab="records"]`);
        if (recordsBtn) {
            window.setTabButtonLabel(recordsBtn, 'records', '대회 기록');
        }
    },

    // [신규] 차출(Call-up) 탭 렌더링
    renderCallUpTab(sortType = null) {
        // 정렬 기준 업데이트
        if (sortType) this.currentCallUpSort = sortType;

        const container = document.getElementById('transferPlayers'); // 이적 탭 컨테이너 재활용
        if (!container) return;
        
        // 첫 경기 시작 전까지만 차출 가능
        if (gameData.matchesPlayed > 0) {
            container.replaceChildren();
            const endMsg = document.createElement('div');
            endMsg.style.cssText = 'text-align:center; padding: 50px; color:#EF4444;';
            const h3 = document.createElement('h3');
            h3.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('alert-triangle') : ''} <span>차출 기간 종료</span>`;
            const p = document.createElement('p');
            p.textContent = '대회가 시작되어 더 이상 선수를 교체할 수 없습니다.';
            endMsg.append(h3, p);
            container.appendChild(endMsg);
            return;
        }

        container.replaceChildren();

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = 'padding: 15px; background: rgba(0,0,0,0.2); margin-bottom: 15px; border-radius: 5px;';

        const topRow = document.createElement('div');
        topRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

        const headerTitle = document.createElement('h3');
        headerTitle.style.cssText = 'color: #FBBF24; margin: 0;';
        headerTitle.textContent = '국가대표 선수단 관리 (25인)';

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 5px;';

        const ovrBtn = document.createElement('button');
        ovrBtn.className = 'btn';
        ovrBtn.textContent = '능력치순';
        ovrBtn.style.cssText = `padding: 5px 10px; font-size: 0.8rem; background-color: ${this.currentCallUpSort === 'ovr' ? '#38BDF8' : '#1E293B'}; color: ${this.currentCallUpSort === 'ovr' ? '#090D16' : '#F8FAFC'};`;
        ovrBtn.onclick = () => WorldCupManager.renderCallUpTab('ovr');

        const nameBtn = document.createElement('button');
        nameBtn.className = 'btn';
        nameBtn.textContent = '이름순';
        nameBtn.style.cssText = `padding: 5px 10px; font-size: 0.8rem; background-color: ${this.currentCallUpSort === 'name' ? '#38BDF8' : '#1E293B'}; color: ${this.currentCallUpSort === 'name' ? '#090D16' : '#F8FAFC'};`;
        nameBtn.onclick = () => WorldCupManager.renderCallUpTab('name');

        btnGroup.append(ovrBtn, nameBtn);
        topRow.append(headerTitle, btnGroup);

        const subText = document.createElement('p');
        subText.style.cssText = 'color: #94A3B8; font-size: 0.9rem; margin: 0;';
        subText.textContent = '현재 스쿼드에 없는 선수를 클릭하여 스쿼드 내 선수와 교체할 수 있습니다.';

        headerDiv.append(topRow, subText);

        const list = document.createElement('div');
        list.id = 'callupList';
        list.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;';

        container.append(headerDiv, list);

        const pool = this.nationalPools[this.userTeam] || [];
        const currentSquad = window.teams[this.userTeam];
        const currentNames = new Set(currentSquad.map(p => p.name));

        // 스쿼드에 없는 선수들만 표시
        let candidates = pool.filter(p => !currentNames.has(p.name));

        // 정렬 적용
        if (this.currentCallUpSort === 'ovr') {
            candidates.sort((a, b) => b.rating - a.rating);
        } else if (this.currentCallUpSort === 'name') {
            candidates.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (candidates.length === 0) {
            const emptyP = document.createElement('p');
            emptyP.style.cssText = 'grid-column: 1/-1; text-align: center; color: #94A3B8;';
            emptyP.textContent = '교체 가능한 선수가 없습니다.';
            list.appendChild(emptyP);
            return;
        }

        candidates.forEach(player => {
            const card = document.createElement('div');
            card.className = 'player-card fc26-player-card';

            const layout = document.createElement('div');
            layout.className = 'player-info-container fc26-card-layout';

            const cutoutWrap = document.createElement('div');
            cutoutWrap.className = 'fc26-cutout-wrap';

            const topBadgeCluster = document.createElement('div');
            topBadgeCluster.className = 'fc26-badge-cluster';

            const ovrBadge = document.createElement('div');
            ovrBadge.className = 'fc26-ovr-badge';
            ovrBadge.textContent = player.rating;

            const posClass = (player.position || 'mf').toLowerCase();
            const posBadge = document.createElement('span');
            posBadge.className = `pos-badge pos-${posClass}`;
            posBadge.textContent = player.position;

            topBadgeCluster.append(ovrBadge, posBadge);

            const playerImage = document.createElement('img');
            playerImage.alt = player.name;
            playerImage.className = 'player-card-image fc26-cutout-img';
            playerImage.loading = 'lazy';
            setPlayerPhoto(playerImage, player);

            cutoutWrap.append(topBadgeCluster, playerImage);

            const infoText = document.createElement('div');
            infoText.className = 'player-info-text fc26-card-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'name';
            nameDiv.textContent = player.name;

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'details';

            const ageSpan = document.createElement('span');
            ageSpan.className = 'meta-chip';
            ageSpan.textContent = `${player.age}세`;

            const clubSpan = document.createElement('span');
            clubSpan.className = 'player-team';
            clubSpan.textContent = player.originalClub;

            detailsDiv.append(ageSpan, clubSpan);
            infoText.append(nameDiv, detailsDiv);

            layout.append(cutoutWrap, infoText);
            card.appendChild(layout);
            card.onclick = () => this.swapSquadPlayer(player);
            list.appendChild(card);
        });
    },

    swapSquadPlayer(newPlayer) {
        // 교체 대상 선택 (스쿼드 내 선수 목록 팝업)
        const currentSquad = window.teams[this.userTeam];
        let options = currentSquad.map((p, idx) => `${idx + 1}. ${p.name} (${p.position}, ${p.rating})`).join('\n');
        
        const input = prompt(`[${newPlayer.name}] 선수와 교체할 스쿼드 선수의 번호를 입력하세요:\n\n${options}`);
        const idx = parseInt(input) - 1;

        if (!isNaN(idx) && idx >= 0 && idx < currentSquad.length) {
            const oldPlayer = currentSquad[idx];
            
            // 교체 실행
            currentSquad[idx] = newPlayer;
            
            // gameData.squad(선발/후보)에서도 제거해야 함
            if (typeof removePlayerFromSquad === 'function') {
                removePlayerFromSquad(oldPlayer);
            }

            alert(`교체 완료: ${oldPlayer.name} OUT -> ${newPlayer.name} IN`);
            this.renderCallUpTab(); // UI 갱신
            if (typeof displayTeamPlayers === 'function') displayTeamPlayers();
        }
    },

    // [신규] 대회 기록 탭 렌더링
    renderRecordsTab() {
        const container = document.querySelector('.records-content');
        if (!container) return;

        container.replaceChildren();
        container.style.display = 'block'; // 그리드 대신 블록으로

        // 1. 조별리그 순위표
        const groupSection = document.createElement('div');
        const groupHeader = document.createElement('h3');
        groupHeader.style.cssText = 'color: #FBBF24; border-bottom: 2px solid #FBBF24; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;';
        groupHeader.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('trophy') : ''} <span>조별리그 현황</span>`;
        groupSection.appendChild(groupHeader);

        const standings = this.calculateAllGroupStandings();
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 15px;';
    
        Object.keys(standings).sort().forEach(group => {
            const table = document.createElement('div');
            table.style.cssText = 'background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;';

            const title = document.createElement('h4');
            title.style.cssText = 'margin: 0 0 10px 0; color: #3498db;';
            title.textContent = `${group}조`;
            table.appendChild(title);

            standings[group].forEach((t, i) => {
                const row = document.createElement('div');
                row.style.cssText = `display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1); ${t.team === this.userTeam ? 'color: #2ecc71; font-weight: bold;' : ''}`;

                const rankSpan = document.createElement('span');
                rankSpan.style.width = '20px';
                rankSpan.textContent = i + 1;

                const teamSpan = document.createElement('span');
                teamSpan.style.cssText = 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
                teamSpan.textContent = t.team;

                const ptsSpan = document.createElement('span');
                ptsSpan.style.cssText = 'width: 30px; text-align: center;';
                ptsSpan.textContent = t.points;

                const gdSpan = document.createElement('span');
                gdSpan.style.cssText = 'width: 30px; text-align: center;';
                gdSpan.textContent = t.goalDiff;

                row.append(rankSpan, teamSpan, ptsSpan, gdSpan);
                table.appendChild(row);
            });

            grid.appendChild(table);
        });
        groupSection.appendChild(grid);
        container.appendChild(groupSection);

        // 2. 토너먼트 대진표
        if (this.currentStage !== 'group') {
            const bracketSection = document.createElement('div');
            bracketSection.style.marginTop = '30px';

            const bracketTitle = document.createElement('h3');
            bracketTitle.style.cssText = 'color: #FBBF24; border-bottom: 2px solid #FBBF24; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;';
            bracketTitle.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('swords') : ''} <span>토너먼트 대진</span>`;
            bracketSection.appendChild(bracketTitle);

            const bracketEl = this.renderTournamentBracket();
            if (bracketEl) {
                bracketSection.appendChild(bracketEl);
            }

            container.appendChild(bracketSection);
        }
    },

    renderTournamentBracket() {
        if (!this.tournamentBracket || Object.keys(this.tournamentBracket).length === 0) return null;

        const stages = ['r32', 'r16', 'qf', 'sf', 'final'];
        const container = document.createElement('div');
        container.className = 'bracket-container';

        stages.forEach(stage => {
            const matches = this.tournamentBracket[stage];
            if (matches && matches.length > 0) {
                const roundDiv = document.createElement('div');
                roundDiv.className = `round round-${stage}`;

                const roundTitle = document.createElement('h4');
                roundTitle.className = 'round-title';
                roundTitle.textContent = this.getStageKoreanName(stage);
                roundDiv.appendChild(roundTitle);

                matches.forEach(match => {
                    const isUserMatch = match.home === this.userTeam || match.away === this.userTeam;
                    const matchDiv = document.createElement('div');
                    matchDiv.className = `match ${isUserMatch ? 'user-match' : ''}`.trim();

                    const homeTeam = document.createElement('div');
                    homeTeam.className = 'team';
                    homeTeam.textContent = match.home || '?';

                    const vsDiv = document.createElement('div');
                    vsDiv.className = 'vs';
                    vsDiv.textContent = 'vs';

                    const awayTeam = document.createElement('div');
                    awayTeam.className = 'team';
                    awayTeam.textContent = match.away || '?';

                    matchDiv.append(homeTeam, vsDiv, awayTeam);
                    roundDiv.appendChild(matchDiv);
                });
                container.appendChild(roundDiv);
            }
        });

        return container;
    },

    simulateAITournamentMatch(team1, team2) {
        const team1Rating = typeof calculateOpponentTeamRating !== 'undefined' ? calculateOpponentTeamRating(team1) : 75;
        const team2Rating = typeof calculateOpponentTeamRating !== 'undefined' ? calculateOpponentTeamRating(team2) : 75;
        const ratingDiff = team1Rating - team2Rating;

        // [수정] 전력 차이 반영 비중 대폭 상향 (0.015 -> 0.04)
        // 예: 전력차 5 -> 승률 70%, 전력차 10 -> 승률 90%
        let team1WinChance = 0.5 + (ratingDiff * 0.04);
        team1WinChance = Math.max(0.05, Math.min(0.95, team1WinChance)); // 최소 5%, 최대 95%

        return Math.random() < team1WinChance ? team1 : team2;
    },

    // [수정] 조별리그 전체 일정 생성 (모든 조 포함)
    generateWCSchedule() {
        const schedule = [[], [], []]; // 3라운드

        Object.entries(this.groups).forEach(([groupName, teams]) => {
            // teams: [t1, t2, t3, t4]
            // Round 1: t1 vs t2, t3 vs t4
            // Round 2: t1 vs t3, t2 vs t4
            // Round 3: t1 vs t4, t2 vs t3
            const matches = [
                [{h: teams[0], a: teams[1]}, {h: teams[2], a: teams[3]}],
                [{h: teams[0], a: teams[2]}, {h: teams[1], a: teams[3]}],
                [{h: teams[0], a: teams[3]}, {h: teams[1], a: teams[2]}]
            ];

            matches.forEach((roundMatches, roundIndex) => {
                roundMatches.forEach(m => {
                    schedule[roundIndex].push({
                        home: m.h,
                        away: m.a,
                        isGroupMatch: true,
                        group: groupName
                    });
                });
            });
        });

        // 경기 순서 섞기 (유저 경기가 항상 맨 위나 아래에 있지 않도록)
        schedule.forEach(round => round.sort(() => Math.random() - 0.5));

        gameData.schedule = { division4: schedule };
        gameData.currentRound = 1;
        
        if (typeof window.setNextOpponent === 'function') window.setNextOpponent();
    },

    // 경기 종료 후 호출되는 핸들러
    handleMatchEnd(matchData) {
        // [추가] 경기 종료 후 자동 저장
        this.autoSave();

        // 1. 조별리그 종료 체크
        if (this.currentStage === 'group') {
            const div4Data = (gameData.leagueData && gameData.leagueData.division4) ? gameData.leagueData.division4 : {};
            const userStats = div4Data[this.userTeam];
            const userMatches = userStats ? userStats.matches : gameData.matchesPlayed;

            if (userMatches >= 3) {
                // 조별리그 종료 즉시 32강 동기 생성
                this.startKnockoutStage();
            }
        } 
        // 2. 토너먼트 진행 중일 때
        else {
            this.handleKnockoutMatchEnd(matchData);
        }
    },

    // 토너먼트 경기 종료 처리 (승부차기 포함)
    handleKnockoutMatchEnd(matchData) {
        const userScore = matchData.homeTeam === this.userTeam ? matchData.homeScore : matchData.awayScore;
        const oppScore = matchData.homeTeam === this.userTeam ? matchData.awayScore : matchData.homeScore;
        
        if (userScore > oppScore) {
            alert(`승리! ${this.getNextStageName()}에 진출합니다!`);
            this.advanceTournament(true);
        } else if (userScore < oppScore) {
            this.isEliminated = true;
            this.showEliminationModal("토너먼트 탈락", `${this.getStageKoreanName(this.currentStage)}에서 아쉽게 패배하여 월드컵 여정을 마칩니다.`);
        } else {
            // 무승부 -> 승부차기
            this.simulatePenaltyShootout(matchData);
        }
    },

    simulatePenaltyShootout(matchData) {
        let userScore = 0;
        let oppScore = 0;
        let userKicks = "";
        let oppKicks = "";
        
        // 기본 성공률 75%
        const baseChance = 0.75;
        
        // 5번의 정규 키커
        for (let i = 1; i <= 5; i++) {
            if (Math.random() < baseChance) {
                userScore++;
                userKicks += "[O] ";
            } else {
                userKicks += "[X] ";
            }
            
            if (Math.random() < baseChance) {
                oppScore++;
                oppKicks += "[O] ";
            } else {
                oppKicks += "[X] ";
            }
        }
        
        // 동점일 경우 서든데스
        while (userScore === oppScore) {
            if (Math.random() < baseChance) {
                userScore++;
                userKicks += "[O] ";
            } else {
                userKicks += "[X] ";
            }
            
            if (Math.random() < baseChance) {
                oppScore++;
                oppKicks += "[O] ";
            } else {
                oppKicks += "[X] ";
            }
            
            if (userKicks.length > 40) break; 
        }
        
        const won = userScore > oppScore;
        const opponentName = matchData.homeTeam === this.userTeam ? (teamNames[matchData.awayTeam] || matchData.awayTeam) : (teamNames[matchData.homeTeam] || matchData.homeTeam);
        
        const msg = `[승부차기 결과]\n\n` +
                    `${this.userTeam}: ${userKicks} (${userScore})\n` +
                    `${opponentName}: ${oppKicks} (${oppScore})\n\n` +
                    (won ? "승부차기 승리! 다음 라운드로 진출합니다!" : "승부차기 패배... 탈락했습니다.");
        
        alert(msg);
        
        if (won) {
            this.advanceTournament(true);
        } else {
            this.isEliminated = true;
            this.showEliminationModal("승부차기 탈락", `${this.getStageKoreanName(this.currentStage)} 승부차기 접전 끝에 아쉽게 탈락했습니다.`);
        }
    },

    getStageKoreanName(stage) {
        const names = {
            'group': '조별리그',
            'r32': '32강',
            'r16': '16강',
            'qf': '8강',
            'sf': '4강',
            'final': '결승'
        };
        return names[stage] || stage;
    },

    getNextStageName() {
        const stages = ['r32', 'r16', 'qf', 'sf', 'final'];
        const idx = stages.indexOf(this.currentStage);
        if (idx < stages.length - 1) {
            return this.getStageKoreanName(stages[idx + 1]);
        }
        return "우승";
    },

    // 32강 토너먼트 시작 (조별리그 종료 후)
    startKnockoutStage() {
        alert("[월드컵] 조별리그 종료! 32강 진출팀을 확정하고 토너먼트를 시작합니다.");
        
        // 1. 모든 조 순위 산정
        const standings = this.calculateAllGroupStandings();
        
        // 2. 진출팀 분류 (1위, 2위, 3위)
        const firsts = [];
        const seconds = [];
        const thirds = [];
        
        Object.keys(standings).sort().forEach(group => {
            const groupTeams = standings[group];
            if (groupTeams && groupTeams.length >= 3) {
                firsts.push({ ...groupTeams[0], group });
                seconds.push({ ...groupTeams[1], group });
                thirds.push({ ...groupTeams[2], group });
            }
        });

        // 3. 3위 팀 서열 정리 (상위 8팀 진출)
        thirds.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
            if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
            return b.wins - a.wins;
        });
        
        const bestThirds = thirds.slice(0, 8);
        
        // 유저 탈락 여부 확인
        const userRank = this.getUserGroupRank(standings);
        if (userRank > 3 || (userRank === 3 && !bestThirds.find(t => t.team === this.userTeam))) {
            this.isEliminated = true;
            this.showEliminationModal("조별리그 탈락", `${this.userTeam}은(는) 조 ${userRank}위로 아쉽게 32강 진출에 실패했습니다.`);
            return;
        }

        // 4. 32강 대진표 생성
        const bracket = this.generateBracket(firsts, seconds, bestThirds);
        this.tournamentBracket = { r32: [], r16: [], qf: [], sf: [], final: [] };
        this.tournamentBracket.r32 = bracket;
        this.currentStage = 'r32';

        // 5. 일정 설정
        this.setKnockoutSchedule(bracket);

        // 32강 대진표 확정 후 자동 저장
        this.autoSave();

        alert("[토너먼트] 32강 토너먼트 대진표가 완성되었습니다! 다음 상대를 확인하세요.");
    },

    calculateAllGroupStandings() {
        const standings = {};
        const data = (gameData.leagueData && gameData.leagueData.division4) ? gameData.leagueData.division4 : {};

        Object.entries(this.groups).forEach(([group, teams]) => {
            const groupTeams = teams.map(team => {
                const s = data[team] || { matches: 0, wins: 0, draws: 0, losses: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
                return {
                    team: team,
                    ...s,
                    goalDiff: (s.goalsFor || 0) - (s.goalsAgainst || 0)
                };
            });

            // 정렬: 승점 > 득실 > 다득점
            groupTeams.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
                return b.goalsFor - a.goalsFor;
            });

            standings[group] = groupTeams;
        });
        return standings;
    },

    getUserGroupRank(standings) {
        for (const group in standings) {
            const rank = standings[group].findIndex(t => t.team === this.userTeam);
            if (rank !== -1) return rank + 1;
        }
        return 4;
    },

    // 32강 대진표 생성 알고리즘
    generateBracket(firsts, seconds, thirds) {
        const matches = [];

        // 1. 2위 vs 2위 고정 매칭
        for (let i = 0; i < seconds.length; i += 2) {
            if (seconds[i+1]) {
                matches.push({ home: seconds[i].team, away: seconds[i+1].team });
            }
        }

        // 2. 1위 vs 3위 매칭
        firsts.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);

        const unmatchedFirsts = [...firsts];
        const unmatchedThirds = [...thirds];

        const top8Firsts = unmatchedFirsts.slice(0, 8);
        const bottom4Firsts = unmatchedFirsts.slice(8);

        for (let i = 0; i < top8Firsts.length; i++) {
            const first = top8Firsts[i];
            let thirdIndex = 0;

            while (thirdIndex < unmatchedThirds.length) {
                if (unmatchedThirds[thirdIndex].group !== first.group) {
                    break;
                }
                thirdIndex++;
            }

            if (thirdIndex >= unmatchedThirds.length) thirdIndex = 0;

            const third = unmatchedThirds.splice(thirdIndex, 1)[0];
            if (third) {
                matches.push({ home: first.team, away: third.team });
            }
        }

        // 3. 남은 1위 vs 1위
        for (let i = 0; i < bottom4Firsts.length; i += 2) {
            if (bottom4Firsts[i+1]) {
                matches.push({ home: bottom4Firsts[i].team, away: bottom4Firsts[i+1].team });
            }
        }

        return matches;
    },

    setKnockoutSchedule(matches) {
        if (!gameData.schedule) gameData.schedule = {};
        gameData.schedule.division4 = [matches];
        gameData.currentRound = 1;
        if (typeof window.setNextOpponent === 'function') window.setNextOpponent();
    },

    advanceTournament(userWon) {
        const stages = ['r32', 'r16', 'qf', 'sf', 'final'];
        const currentIndex = stages.indexOf(this.currentStage);

        if (currentIndex < stages.length - 1) {
            this.currentStage = stages[currentIndex + 1];
            this.generateNextRound(userWon);
            this.autoSave();
            alert(`[토너먼트] ${this.getStageKoreanName(this.currentStage)} 진출! 다음 상대를 확인하세요.`);
        } else {
            this.showEliminationModal("FIFA 월드컵 우승!", `축하합니다! ${this.userTeam}이(가) 세계 최정상에 올랐습니다!`);
        }
    },

    showEliminationModal(title, msg) {
        let modal = document.getElementById('wcResultModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'wcResultModal';
            modal.className = 'modal';
            modal.style.zIndex = '100005';
            document.body.appendChild(modal);
        }
        modal.replaceChildren();

        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = 'background: linear-gradient(135deg, #161F30, #090D16); color: white; max-width: 500px; text-align: center; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); padding: 30px;';

        const iconDiv = document.createElement('div');
        iconDiv.style.cssText = 'font-size: 2.5rem; margin-bottom: 10px; color: #FBBF24; display: flex; justify-content: center;';
        iconDiv.innerHTML = typeof iconSVG === 'function' ? iconSVG(this.isEliminated ? 'shield' : 'trophy') : '';

        const titleEl = document.createElement('h2');
        titleEl.style.cssText = 'color: #FBBF24; margin: 0 0 10px 0;';
        titleEl.textContent = title;

        const msgEl = document.createElement('p');
        msgEl.style.cssText = 'color: #CBD5E1; font-size: 1rem; line-height: 1.6; margin-bottom: 25px;';
        msgEl.textContent = msg;

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 10px; justify-content: center;';

        const recordsBtn = document.createElement('button');
        recordsBtn.className = 'btn';
        recordsBtn.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 10px 20px; display: inline-flex; align-items: center; gap: 6px;';
        recordsBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('bar-chart') : ''} <span>대회 기록</span>`;
        recordsBtn.onclick = () => {
            WorldCupManager.renderRecordsTab();
            const targetModal = document.getElementById('wcResultModal');
            if (targetModal) targetModal.style.display = 'none';
            if (typeof showTab === 'function') showTab('records');
        };

        const exitBtn = document.createElement('button');
        exitBtn.className = 'btn primary';
        exitBtn.style.cssText = 'padding: 10px 20px; display: inline-flex; align-items: center; gap: 6px;';
        exitBtn.innerHTML = `${typeof iconSVG === 'function' ? iconSVG('home') : ''} <span>메인 메뉴로 복귀</span>`;
        exitBtn.onclick = () => {
            WorldCupManager.exitWorldCupMode();
            const targetModal = document.getElementById('wcResultModal');
            if (targetModal) targetModal.style.display = 'none';
        };

        btnGroup.append(recordsBtn, exitBtn);
        content.append(iconDiv, titleEl, msgEl, btnGroup);
        modal.appendChild(content);
        modal.style.display = 'block';
    },

    exitWorldCupMode() {
        gameData.isWorldCupMode = false;
        this.isEliminated = false;
        
        // 국대 팀들을 allTeams에서 정리
        if (window.allTeams) {
            Object.keys(window.allTeams).forEach(key => {
                if (window.allTeams[key] && window.allTeams[key].league === 4) {
                    delete window.allTeams[key];
                }
            });
        }
        
        // UI 탭 원상 복구
        const tabsToShow = ['transfer', 'sponsor', 'youth', 'transfer_news', 'league', 'sns', 'mail'];
        tabsToShow.forEach(t => {
            const btn = document.querySelector(`[data-tab="${t}"]`);
            if (btn) btn.style.display = '';
        });
        
        const transferBtn = document.querySelector(`[data-tab="callup"]`);
        if (transferBtn) {
            window.setTabButtonLabel(transferBtn, 'transfer', '이적');
            transferBtn.dataset.tab = 'transfer';
        }
        
        const recordsBtn = document.querySelector(`[data-tab="records"]`);
        if (recordsBtn) {
            window.setTabButtonLabel(recordsBtn, 'records', '기록');
        }
        
        // 팀 선택 화면으로 안전하게 이동
        if (typeof showScreen === 'function') {
            showScreen('teamSelection');
        }
        if (typeof renderTeamSelectionUI === 'function') {
            renderTeamSelectionUI();
        }
    },

    generateNextRound(userWon) {
        const stages = ['r32', 'r16', 'qf', 'sf', 'final'];
        const prevStageIndex = stages.indexOf(this.currentStage) - 1;
        if (prevStageIndex < 0) return;

        const prevStage = stages[prevStageIndex];
        const prevMatches = this.tournamentBracket[prevStage];
        const winners = [];

        // 이전 라운드 모든 경기의 승자 결정
        prevMatches.forEach(match => {
            let winner;
            if (match.home === this.userTeam || match.away === this.userTeam) {
                // 유저의 경기. userWon이 true이므로 유저가 승자.
                winner = this.userTeam;
            } else {
                // AI vs AI 경기 시뮬레이션
                winner = this.simulateAITournamentMatch(match.home, match.away);
            }
            winners.push(winner);
        });

        // 승자들로 다음 라운드 대진 생성
        const nextMatches = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (winners[i + 1]) {
                nextMatches.push({ home: winners[i], away: winners[i + 1] });
            }
        }

        this.tournamentBracket[this.currentStage] = nextMatches;
        this.setKnockoutSchedule(nextMatches);
    },

    async saveWorldCup(slotIndex, silent = false) {
        const data = {
            wcPlayers: this.wcPlayers,
            groups: this.groups,
            userTeam: this.userTeam,
            currentStage: this.currentStage,
            timestamp: Date.now(),
            // [추가] 진행 상황 상세 데이터 저장
            leagueData: gameData.leagueData ? gameData.leagueData.division4 : {},
            schedule: gameData.schedule ? gameData.schedule.division4 : [],
            tournamentBracket: this.tournamentBracket,
            matchesPlayed: gameData.matchesPlayed,
            currentRound: gameData.currentRound,
            isEliminated: this.isEliminated
        };
        const wcKey = `worldcup_save_${slotIndex}`;
        const serialized = JSON.stringify(data);
        try {
            if (typeof SaveStorage !== 'undefined') {
                await SaveStorage.setItem(wcKey, serialized);
            } else {
                localStorage.setItem(wcKey, serialized);
            }
            if (!silent) alert(`월드컵 슬롯 ${slotIndex}에 저장되었습니다.`);
            this.renderSaveSlots();
        } catch (err) {
            console.error('월드컵 저장 중 오류:', err);
            if (!silent) {
                alert(err && err.name === 'QuotaExceededError'
                    ? '브라우저 저장 공간이 부족합니다.'
                    : '월드컵 저장 중 오류가 발생했습니다.');
            }
        }
    },

    tryInitialSave() {
        for (let i = 1; i <= 3; i++) {
            const wcKey = `worldcup_save_${i}`;
            const exists = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(wcKey) : localStorage.getItem(wcKey);
            if (!exists) {
                this.currentSlotIndex = i;
                this.saveWorldCup(i, true);
                return;
            }
        }
        alert("저장 슬롯(1~3)이 모두 꽉 찼습니다.\n기존 데이터를 삭제해야 자동 저장이 가능합니다.");
        this.currentSlotIndex = null;
    },

    autoSave() {
        if (this.currentSlotIndex) {
            this.saveWorldCup(this.currentSlotIndex, true);
        }
    },

    loadWorldCup(slotIndex) {
        const wcKey = `worldcup_save_${slotIndex}`;
        const dataStr = typeof SaveStorage !== 'undefined' ? SaveStorage.getItem(wcKey) : localStorage.getItem(wcKey);
        if (!dataStr) {
            alert(`슬롯 ${slotIndex}에 저장된 데이터가 없습니다.`);
            return;
        }
        try {
            const data = JSON.parse(dataStr);

            // [수정] 저장 데이터 유효성 검사
            let errorMsg = "";
            if (!data) errorMsg = "데이터가 비어있습니다.";
            else if (!data.wcPlayers || Object.keys(data.wcPlayers).length === 0) errorMsg = "선수 데이터가 손상되었습니다.";
            else if (!data.userTeam) errorMsg = "팀 정보가 없습니다.";

            if (errorMsg) {
                alert(`오류: 월드컵 슬롯 ${slotIndex}의 데이터가 손상되었습니다.\n원인: ${errorMsg}\n\n이 슬롯을 삭제하고 새로운 월드컵을 시작해주세요.`);
                console.error("손상된 월드컵 데이터:", data);
                return;
            }

            this.wcPlayers = data.wcPlayers;
            this.groups = data.groups;
            this.userTeam = data.userTeam;
            this.currentStage = data.currentStage || 'group';
            this.currentSlotIndex = slotIndex; // 현재 슬롯 설정
            // [추가] 진행 상황 복원
            this.tournamentBracket = data.tournamentBracket || {};
            this.isEliminated = data.isEliminated || false;
            
            document.getElementById('wcModal').style.display = 'none';
            this.enterWorldCupMode(true); // [수정] 로딩 모드로 진입 (초기화 방지)

            // [추가] 게임 데이터 상세 복원
            if (data.leagueData) {
                if (!gameData.leagueData) gameData.leagueData = {};
                gameData.leagueData.division4 = data.leagueData;
            }
            
            if (data.schedule) {
                if (!gameData.schedule) gameData.schedule = {};
                gameData.schedule.division4 = data.schedule;
            } else {
                // 스케줄이 없는 경우 (구버전 세이브 등) 재생성
                this.generateWCSchedule();
            }
            
            if (data.matchesPlayed !== undefined) gameData.matchesPlayed = data.matchesPlayed;
            if (data.currentRound !== undefined) gameData.currentRound = data.currentRound;
            
            if (typeof window.setNextOpponent === 'function') window.setNextOpponent();
            if (typeof window.updateDisplay === 'function') window.updateDisplay();
            this.updateWorldCupUI();
        } catch (e) {
            alert(`오류: 월드컵 슬롯 ${slotIndex}의 데이터를 읽는 중 오류가 발생했습니다. 파일이 손상되었을 수 있습니다.`);
            console.error("월드컵 저장 데이터 파싱 오류:", e);
        }
    },
    
    async deleteWorldCup(slotIndex) {
        if (confirm(`정말 월드컵 슬롯 ${slotIndex} 데이터를 삭제하시겠습니까?`)) {
            const wcKey = `worldcup_save_${slotIndex}`;
            if (typeof SaveStorage !== 'undefined') {
                await SaveStorage.removeItem(wcKey);
            } else {
                localStorage.removeItem(wcKey);
            }
            this.renderSaveSlots();
        }
    }
};

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        WorldCupManager.init();
    }, 500);
});

window.WorldCupManager = WorldCupManager;

// 월드컵 모드 전용 스타일
const wcStyle = document.createElement('style');
wcStyle.id = 'worldcup-styles';
wcStyle.textContent = `
    .bracket-container {
        display: flex;
        overflow-x: auto;
        padding: 20px;
        background: rgba(0,0,0,0.2);
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.1);
    }
    .round {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        flex-shrink: 0;
        min-width: 220px;
        margin-right: 40px;
    }
    .round-title {
        text-align: center;
        color: #ffd700;
        margin-bottom: 20px;
    }
    .match {
        background: rgba(255,255,255,0.05);
        padding: 12px;
        border-radius: 5px;
        margin-bottom: 25px;

    }
    .match.user-match {

        background: rgba(46, 204, 113, 0.1);
    }
    .team { text-align: center; font-weight: bold; }
    .vs { text-align: center; color: #aaa; font-size: 0.8rem; margin: 4px 0; }
`;
if (!document.getElementById('worldcup-styles')) {
    document.head.appendChild(wcStyle);
}
