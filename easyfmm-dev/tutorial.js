// tutorial.js
// 튜토리얼 시스템 구현
console.log('Tutorial system loaded');

class TutorialSystem {
    constructor() {
        this.steps = [
            {
                title: "감독 취임을 환영합니다! 🎉",
                content: "EasyFMM의 세계에 오신 것을 환영합니다.<br>이 튜토리얼에서는 게임의 주요 기능들을 빠르게 안내해 드립니다."
            },
            {
                title: "팀 관리 (스쿼드) 📋",
                content: "<b>스쿼드 탭</b>에서는 선발 라인업과 포메이션을 자유롭게 조정할 수 있습니다.<br>드래그 앤 드롭으로 선수의 위치를 변경하거나, 클릭하여 교체할 수 있습니다."
            },
            {
                title: "이적 시장 💰",
                content: "<b>이적 탭</b>에서 새로운 선수를 영입하여 전력을 보강하세요.<br>원하는 선수를 검색하거나, 우리 팀 선수를 방출하여 자금을 확보할 수도 있습니다."
            },
            {
                title: "리그 및 일정 🏆",
                content: "<b>리그 탭</b>에서 현재 순위와 경기 일정을 확인하세요.<br>승강제 시스템이 적용되어 있어 성적에 따라 상위 리그로 승격하거나 강등될 수 있습니다."
            },
            {
                title: "개인 기록 및 MOM 🥇",
                content: "<b>기록 탭</b>에서는 득점왕, 도움왕 경쟁을 확인할 수 있습니다.<br><b>MOM(Man of the Match)</b>은 경기 평점이 가장 높은 선수가 선정되며, 평점은 득점, 도움, 클린시트 등을 종합하여 계산됩니다."
            },
            {
                title: "유스 및 스카우트 🌱",
                content: "<b>유스 탭</b>에서 미래의 스타를 육성하세요.<br>스카우터를 고용하여 잠재력 높은 유망주를 발굴하고 1군으로 콜업할 수 있습니다."
            },
            {
                title: "설정 및 저장 ⚙️",
                content: "<b>설정 탭</b>에서 게임을 <b>저장</b>하거나 <b>불러올</b> 수 있습니다.<br>배경음악 볼륨 조절과 자동 저장 기능, 선수의 잠재력 확인도 여기서 관리합니다."
            },
            {
                title: "준비 되셨나요? ⚽",
                content: "이제 팀을 이끌고 우승을 향해 도전하세요!<br>행운을 빕니다, 감독님!"
            }
        ];
        this.currentStep = 0;
    }

    init() {
        // 로컬 스토리지 확인 (이미 튜토리얼을 봤는지 체크)
        try {
            if (!localStorage.getItem('easyfmm_tutorial_completed')) {
                this.showTutorial();
            }
        } catch (e) {
            console.warn('LocalStorage access failed:', e);
        }
    }

    showTutorial() {
        // UI 생성
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.id = 'tutorialOverlay';
        
        overlay.innerHTML = `
            <div class="tutorial-box">
                <div class="tutorial-step-indicator" id="tutorialStepIndicator">1 / ${this.steps.length}</div>
                <h3 class="tutorial-title" id="tutorialTitle"></h3>
                <div class="tutorial-content" id="tutorialContent"></div>
                <div class="tutorial-controls">
                    <button class="btn" id="tutorialSkipBtn" style="background: rgba(231, 76, 60, 0.8);">건너뛰기</button>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn" id="tutorialPrevBtn" style="display: none; background: rgba(255,255,255,0.2);">이전</button>
                        <button class="btn primary" id="tutorialNextBtn">다음</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 이벤트 리스너
        document.getElementById('tutorialNextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('tutorialPrevBtn').addEventListener('click', () => this.prevStep());
        document.getElementById('tutorialSkipBtn').addEventListener('click', () => this.completeTutorial());
        
        this.updateContent();
    }

    updateContent() {
        const step = this.steps[this.currentStep];
        document.getElementById('tutorialTitle').textContent = step.title;
        document.getElementById('tutorialContent').innerHTML = step.content;
        document.getElementById('tutorialStepIndicator').textContent = `${this.currentStep + 1} / ${this.steps.length}`;
        
        const prevBtn = document.getElementById('tutorialPrevBtn');
        const nextBtn = document.getElementById('tutorialNextBtn');
        
        prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? '시작하기' : '다음';
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateContent();
        } else {
            this.completeTutorial();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateContent();
        }
    }

    completeTutorial() {
        try {
            localStorage.setItem('easyfmm_tutorial_completed', 'true');
        } catch (e) {
            console.warn('LocalStorage access failed:', e);
        }
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

const tutorialSystem = new TutorialSystem();
window.tutorialSystem = tutorialSystem;
