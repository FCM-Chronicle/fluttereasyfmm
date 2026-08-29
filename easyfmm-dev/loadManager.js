// loadManager.js - 게임 리소스 및 시스템 로딩 관리자

const LoadManager = {
    progress: 0,
    // 각 로딩 단계 정의
    tasks: [
        { name: "리그 데이터베이스 동기화", weight: 10, action: () => initializeLeagueData() },
        { name: "글로벌 이벤트 리스너 바인딩", weight: 15, action: () => setupEventListeners() },
        { name: "이적 시장 시스템 가동", weight: 15, action: () => { if (typeof initTransfer === 'function') initTransfer(); } },
        { name: "시즌 스케줄 알고리즘 생성", weight: 10, action: () => { if (!gameData.schedule) generateFullSchedule(); } },
        { name: "오디오 엔진 및 에셋 로드", weight: 10, action: () => { if (typeof audioManager !== 'undefined') audioManager.init(); } },
        { name: "메인 인터페이스 빌드", weight: 15, action: () => {
            renderMainSaveSlots();
            addGameModeSelectorUI();
            renderTeamSelectionUI();
        }},
        { name: "보조 서브시스템 가동", weight: 15, action: () => {
            if (window.AutoSaveSystem) window.AutoSaveSystem.init();
            if (window.AutoScrollSystem) window.AutoScrollSystem.init();
            if (typeof CustomCursor !== 'undefined') window.customCursorInstance = new CustomCursor();
        }},
        { name: "엔진 최적화 완료", weight: 10, action: () => {} }
    ],

    init() {
        this.createLoadingScreen();
        // 약간의 지연 후 작업을 시작하여 오버레이가 먼저 뜨도록 함
        setTimeout(() => this.runTasks(), 100);
    },

    createLoadingScreen() {
        const overlay = document.createElement('div');
        overlay.id = 'game-loader-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #12122b 0%, #1a1a3e 100%);
            z-index: 999999; display: flex; flex-direction: column; 
            align-items: center; justify-content: center;
            transition: opacity 0.8s ease, visibility 0.8s;
            font-family: 'Segoe UI', sans-serif;
        `;

        overlay.innerHTML = `
        <div style="text-align: center;">
        <div class="loader-logo" style="margin-bottom: 25px;">
        <h1 style="color: #ffd700; font-size: 3.5rem; margin: 0; letter-spacing: -2px; text-shadow: 0 0 30px rgba(255,215,0,0.3);">EasyFMM</h1>
        <div style="color: #a46dff; font-size: 0.8rem; letter-spacing: 5px; font-weight: bold; margin-top: 5px;">NEXT GEN MANAGER</div>
        <div style="color: rgba(255,255,255,0.4); font-size: 0.65rem; font-weight: normal; margin-top: 6px;">꿀팁을 원한다면 채팅으로 여러 사람들과 이야기를 나눠 보세요!</div>
        </div>
        <div style="width: 280px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
        <div id="loader-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #a46dff, #7c4dff); box-shadow: 0 0 15px rgba(164,109,255,0.6); transition: width 0.4s cubic-bezier(0.1, 0.7, 0.1, 1);"></div>
        </div>
        <div id="loader-status" style="margin-top: 20px; color: #fff; font-size: 0.85rem; opacity: 0.7; font-weight: 300; text-transform: uppercase;">데이터 분석 중...</div>
        <div style="position: absolute; bottom: 40px; color: rgba(255,255,255,0.2); font-size: 0.7rem;">
        © 2026 FCM_CHRONICLE. ALL SYSTEMS OPERATIONAL.
        </div>
        </div>
        `;

        document.body.appendChild(overlay);
    },

    async runTasks() {
        const progressBar = document.getElementById('loader-progress-bar');
        const statusText = document.getElementById('loader-status');
        let completedWeight = 0;
        const totalWeight = this.tasks.reduce((sum, task) => sum + task.weight, 0);

        for (const task of this.tasks) {
            statusText.textContent = task.name;
            
            // 실제 연산과 시각적 효과를 위해 최소 대기 시간을 줌
            await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 200));

            try {
                task.action();
            } catch (e) {
                console.error(`[LoadManager] '${task.name}' 실행 중 오류:`, e);
            }

            completedWeight += task.weight;
            const percent = (completedWeight / totalWeight) * 100;
            if (progressBar) progressBar.style.width = `${percent}%`;
        }

        setTimeout(() => this.complete(), 600);
    },

    complete() {
        const overlay = document.getElementById('game-loader-overlay');
        const statusText = document.getElementById('loader-status');

        if (statusText) {
            statusText.textContent = "INITIALIZATION COMPLETE";
            statusText.style.color = "#2ecc71";
            statusText.style.opacity = "1";
        }

        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            
            // 로딩 종료 후 감독 선택 화면으로 진입 (매니저 시스템)
            if (typeof managerSystem !== 'undefined') {
                managerSystem.init();
            } else if (typeof showScreen === 'function') {
                showScreen('teamSelection');
            }
            
            setTimeout(() => overlay.remove(), 800);
        }, 1000);
    }
};

// [개선] 1. 배경 화면(UI)은 스크립트가 읽히자마자 즉시 생성하여 빈 화면 차단
if (document.body) {
    LoadManager.createLoadingScreen();
} else {
    document.addEventListener('DOMContentLoaded', () => LoadManager.createLoadingScreen());
}

// [개선] 2. 실제 초기화 작업(Tasks)은 다른 모든 스크립트가 로드된 후에 시작
window.addEventListener('load', () => {
    // 약간의 여유를 두어 로딩 애니메이션을 부드럽게 시작
    setTimeout(() => LoadManager.runTasks(), 200);
});
