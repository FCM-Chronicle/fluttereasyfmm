/**
 * scoreboard.js — Redesigned Premium Scoreboard
 *
 * Modern broadcast-style scoreboard with frosted glass aesthetics.
 * Reads team colors from CSS custom properties on document.body:
 *   --team-primary / --team-secondary (홈)
 *   --away-team-primary / --away-team-secondary (어웨이)
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────
     1. CSS
  ───────────────────────────────────────── */
  const STYLE = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&family=Noto+Sans+KR:wght@500;700;900&display=swap');

    /* ── Root Container ── */
    #ingame-scoreboard {
      position: absolute;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      user-select: none;
      font-family: 'Inter', 'Noto Sans KR', -apple-system, sans-serif;
      filter: drop-shadow(0 6px 24px rgba(0,0,0,0.5));
    }

    /* ── Main Bar ── */
    #sb-main-bar {
      display: flex;
      align-items: stretch;
      height: 48px;
      background: rgba(12, 12, 16, 0.88);
      backdrop-filter: blur(16px) saturate(1.4);
      -webkit-backdrop-filter: blur(16px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      overflow: hidden;
      position: relative;
    }

    /* subtle top highlight line */
    #sb-main-bar::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20%;
      right: 20%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      z-index: 5;
    }

    /* ── Shared Team Section ── */
    .sb-team-section {
      display: flex;
      align-items: center;
      position: relative;
      min-width: 100px;
    }

    /* Team color accent bar (left edge for home, right edge for away) */
    .sb-team-section::before {
      content: '';
      position: absolute;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 2px;
      transition: background 0.3s;
    }

    #sb-home::before {
      left: 0;
      background: var(--sb-home-p, #e74c3c);
    }

    #sb-away::before {
      right: 0;
      background: var(--sb-away-p, #3498db);
    }

    /* ── Team Logo ── */
    .sb-team-logo {
      width: 26px;
      height: 26px;
      object-fit: contain;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 4px rgba(0,0,0,0.6)) drop-shadow(0 0 2px rgba(0,0,0,0.4));
    }

    /* ── Team Name Boxes ── */
    .sb-name-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      font-size: clamp(0.72rem, 1.6vw, 0.88rem);
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.88);
      transition: color 0.3s;
    }

    #sb-home .sb-name-box {
      padding-left: 12px;
    }

    #sb-away .sb-name-box {
      padding-right: 12px;
    }

    /* ── Score Container (center) ── */
    #sb-score-center {
      display: flex;
      align-items: center;
      gap: 1px;
      flex-shrink: 0;
    }

    .sb-score-box {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      padding: 0 4px;
      position: relative;
    }

    /* Home score has right border, away score has left border */
    #sb-home-score-box {
      border-right: 1px solid rgba(255, 255, 255, 0.06);
    }

    #sb-away-score-box {
      border-left: 1px solid rgba(255, 255, 255, 0.06);
    }

    .sb-score-num {
      font-size: clamp(1.35rem, 3.2vw, 1.7rem);
      font-weight: 900;
      color: #fff;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                  color 0.3s;
    }

    .sb-score-num.scored {
      transform: scale(1.35);
      color: #ffd700;
    }

    /* Score divider dash */
    #sb-score-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      flex-shrink: 0;
    }

    #sb-score-divider span {
      display: block;
      width: 8px;
      height: 2px;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 1px;
    }

    /* ── Timer Box ── */
    #sb-timer-box {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.65);
      font-size: clamp(0.64rem, 1.2vw, 0.74rem);
      font-weight: 700;
      letter-spacing: 0.14em;
      padding: 4px 24px;
      border-radius: 0 0 10px 10px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-top: none;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      min-width: 72px;
    }

    /* ── Goal Flash Animation ── */
    @keyframes sb-goal-flash {
      0%   { filter: drop-shadow(0 6px 24px rgba(0,0,0,0.5)); }
      30%  { filter: drop-shadow(0 0 30px rgba(255,215,0,0.8)) drop-shadow(0 0 60px rgba(255,215,0,0.3)); }
      100% { filter: drop-shadow(0 6px 24px rgba(0,0,0,0.5)); }
    }

    #ingame-scoreboard.goal-flash {
      animation: sb-goal-flash 0.8s ease-out 2;
    }

    /* Score number pulse ring on goal */
    @keyframes sb-score-pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.5); }
      70% { box-shadow: 0 0 0 12px rgba(255, 215, 0, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
    }

    .sb-score-box.pulse-ring {
      animation: sb-score-pulse 0.8s ease-out;
      border-radius: 6px;
    }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      #sb-main-bar {
        height: 40px;
        border-radius: 10px;
      }
      .sb-team-logo {
        width: 20px;
        height: 20px;
      }
      .sb-name-box {
        padding: 0 10px;
        font-size: 0.68rem;
        gap: 5px;
      }
      .sb-score-num {
        font-size: 1.2rem;
      }
      .sb-score-box {
        min-width: 32px;
      }
      #sb-score-divider {
        width: 18px;
      }
      #sb-timer-box {
        padding: 3px 18px;
        font-size: 0.6rem;
        border-radius: 0 0 8px 8px;
      }
      .sb-team-section::before {
        width: 2px;
      }
    }
  `;

  function injectStyle() {
    if (document.getElementById("sb-style")) return;
    const s = document.createElement("style");
    s.id = "sb-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────
     2. HTML 빌드
  ───────────────────────────────────────── */
  function buildScoreboard() {
    const sb = document.createElement("div");
    sb.id = "ingame-scoreboard";
    sb.innerHTML = `
      <div id="sb-main-bar">
        <!-- 홈팀 -->
        <div id="sb-home" class="sb-team-section">
          <div class="sb-name-box">
            <img id="sb-home-logo" class="sb-team-logo" src="" alt="" style="display:none;">
            <span id="sb-home-name">홈팀</span>
          </div>
        </div>

        <!-- 스코어 -->
        <div id="sb-score-center">
          <div id="sb-home-score-box" class="sb-score-box">
            <span id="sb-score-home" class="sb-score-num">0</span>
          </div>
          <div id="sb-score-divider"><span></span></div>
          <div id="sb-away-score-box" class="sb-score-box">
            <span id="sb-score-away" class="sb-score-num">0</span>
          </div>
        </div>

        <!-- 어웨이팀 -->
        <div id="sb-away" class="sb-team-section">
          <div class="sb-name-box">
            <span id="sb-away-name">어웨이팀</span>
            <img id="sb-away-logo" class="sb-team-logo" src="" alt="" style="display:none;">
          </div>
        </div>
      </div>
      <div id="sb-timer-box">00:00</div>
    `;
    return sb;
  }

  /* ─────────────────────────────────────────
     3. 팀 색상 적용
  ───────────────────────────────────────── */
  function applyTeamColors() {
    const sbEl = document.getElementById("ingame-scoreboard");
    if (!sbEl) return;

    const cs = getComputedStyle(document.body);
    const homePrimary   = cs.getPropertyValue("--team-primary").trim()        || "#e74c3c";
    const homeSecondary = cs.getPropertyValue("--team-secondary").trim()      || "#ffffff";
    const awayPrimary   = cs.getPropertyValue("--away-team-primary").trim()   || "#3498db";
    const awaySecondary = cs.getPropertyValue("--away-team-secondary").trim() || "#ffffff";

    sbEl.style.setProperty("--sb-home-p", homePrimary);
    sbEl.style.setProperty("--sb-home-s", homeSecondary);
    sbEl.style.setProperty("--sb-away-p", awayPrimary);
    sbEl.style.setProperty("--sb-away-s", awaySecondary);
  }

  /* ─────────────────────────────────────────
     4. 데이터 동기화
  ───────────────────────────────────────── */
  let syncInterval  = null;
  let prevHomeScore = -1;
  let prevAwayScore = -1;

  // 마지막으로 로고를 세팅한 팀 키를 기억해서, 경기가 바뀌면(팀 키가 달라지면) 다시 세팅한다.
  // "한 번만 적용" 플래그 방식은 스코어보드 DOM이 경기 사이에 재사용될 때
  // 새 경기의 팀으로 로고가 갱신되지 않는 버그가 있어 팀 키 비교 방식으로 변경.
  let lastLogoHomeKey = null;
  let lastLogoAwayKey = null;

  function applyTeamLogos() {
    const md = window.currentMatchData;
    const teams = window.allTeams;
    if (!md || !teams) return;

    const homeKey = md.homeTeam;
    const awayKey = md.awayTeam;

    // 이전과 팀 키가 동일하면 다시 그릴 필요 없음
    if (homeKey === lastLogoHomeKey && awayKey === lastLogoAwayKey) return;

    const homeInfo = teams[homeKey];
    const awayInfo = teams[awayKey];
    if (!homeInfo || !awayInfo) return;

    const homeCode = homeInfo.logoCode || "DFT";
    const awayCode = awayInfo.logoCode || "DFT";

    const homePath = homeKey.startsWith("Legend_")
      ? `assets/logo/legend/${homeCode}.webp`
      : `assets/logo/${homeInfo.league}/${homeCode}.webp`;
    const awayPath = awayKey.startsWith("Legend_")
      ? `assets/logo/legend/${awayCode}.webp`
      : `assets/logo/${awayInfo.league}/${awayCode}.webp`;

    const homeLogo = document.getElementById("sb-home-logo");
    const awayLogo = document.getElementById("sb-away-logo");
    if (homeLogo) { homeLogo.src = homePath; homeLogo.alt = homeKey; homeLogo.style.display = ""; }
    if (awayLogo) { awayLogo.src = awayPath; awayLogo.alt = awayKey; awayLogo.style.display = ""; }

    lastLogoHomeKey = homeKey;
    lastLogoAwayKey = awayKey;
  }

  function syncData() {
    const homeTeamEl = document.getElementById("homeTeam");
    const awayTeamEl = document.getElementById("awayTeam");
    const sbHomeName = document.getElementById("sb-home-name");
    const sbAwayName = document.getElementById("sb-away-name");
    if (homeTeamEl && sbHomeName) sbHomeName.textContent = homeTeamEl.textContent.trim() || "홈팀";
    if (awayTeamEl && sbAwayName) sbAwayName.textContent = awayTeamEl.textContent.trim() || "어웨이팀";

    // 매 tick마다 확인하되, 실제로 팀이 바뀐 경우에만 내부적으로 다시 그림
    applyTeamLogos();

    const scoreEl = document.getElementById("scoreDisplay");
    if (scoreEl) {
      const parts = scoreEl.textContent.split(/[-–]/);
      const h = parseInt(parts[0]) || 0;
      const a = parseInt(parts[1]) || 0;

      const sbScoreHome = document.getElementById("sb-score-home");
      const sbScoreAway = document.getElementById("sb-score-away");
      const sbRoot      = document.getElementById("ingame-scoreboard");

      if (sbScoreHome && sbScoreAway) {
        if (h !== prevHomeScore) {
          sbScoreHome.textContent = h;
          if (prevHomeScore !== -1) flashScore(sbScoreHome, sbRoot, "sb-home-score-box");
          prevHomeScore = h;
        }
        if (a !== prevAwayScore) {
          sbScoreAway.textContent = a;
          if (prevAwayScore !== -1) flashScore(sbScoreAway, sbRoot, "sb-away-score-box");
          prevAwayScore = a;
        }
      }
    }
  }

  /* ─────────────────────────────────────────
     5. 타이머
  ───────────────────────────────────────── */
  let timerSec     = 0;
  let lastMinValue = -1;
  let timerRAF     = null;
  let lastRAFTime  = null;

  function startInternalTimer() {
    if (timerRAF) cancelAnimationFrame(timerRAF);
    lastRAFTime = null;

    function tick(now) {
      if (lastRAFTime === null) lastRAFTime = now;
      const delta = now - lastRAFTime;
      if (delta >= 1000) {
        lastRAFTime = now - (delta % 1000);
        const timeEl = document.getElementById("matchTime");
        if (timeEl) {
          const mins = parseInt(timeEl.textContent) || 0;
          if (mins !== lastMinValue) { timerSec = mins * 60; lastMinValue = mins; }
          else timerSec++;
        }
        if (timerSec > 5999) timerSec = 5999;
        const sbTimer = document.getElementById("sb-timer-box");
        if (sbTimer) {
          const mm = String(Math.floor(timerSec / 60)).padStart(2, "0");
          const ss = String(timerSec % 60).padStart(2, "0");
          sbTimer.textContent = `${mm}:${ss}`;
        }
      }
      timerRAF = requestAnimationFrame(tick);
    }
    timerRAF = requestAnimationFrame(tick);
  }

  function flashScore(el, root, boxId) {
    // Score number animation
    el.classList.remove("scored");
    root.classList.remove("goal-flash");
    void el.offsetWidth;
    el.classList.add("scored");
    root.classList.add("goal-flash");

    // Pulse ring on score box
    const box = document.getElementById(boxId);
    if (box) {
      box.classList.remove("pulse-ring");
      void box.offsetWidth;
      box.classList.add("pulse-ring");
      setTimeout(() => box.classList.remove("pulse-ring"), 900);
    }

    setTimeout(() => {
      el.classList.remove("scored");
      root.classList.remove("goal-flash");
    }, 1600);
  }

  /* ─────────────────────────────────────────
     6. 삽입
  ───────────────────────────────────────── */
  function insertScoreboard() {
    const container = document.getElementById("matchVisualizerContainer");
    if (!container) return false;

    // 새 경기 → 점수 상태 리셋 (로고 키는 syncData/applyTeamLogos가 알아서 비교 갱신함)
    prevHomeScore = -1;
    prevAwayScore = -1;
    
    if (document.getElementById("ingame-scoreboard")) return true;

    if (getComputedStyle(container).position === "static")
      container.style.position = "relative";

    const sb = buildScoreboard();
    container.appendChild(sb);
    applyTeamColors();
    syncData();
    startInternalTimer();

    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(syncData, 100);
    return true;
  }

  /* ─────────────────────────────────────────
     7. Observer들
  ───────────────────────────────────────── */
  function watchForContainer() {
    if (insertScoreboard()) return;
    const obs = new MutationObserver(() => { if (insertScoreboard()) obs.disconnect(); });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  new MutationObserver(() => applyTeamColors())
    .observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

  /* ─────────────────────────────────────────
     8. 초기화
  ───────────────────────────────────────── */
  injectStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchForContainer);
  } else {
    watchForContainer();
  }

  new MutationObserver(() => {
    const ms = document.getElementById("matchScreen");
    if (ms && ms.classList.contains("active")) {
      setTimeout(() => {
        if (!document.getElementById("ingame-scoreboard")) insertScoreboard();
      }, 300);
    }
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });

})();
