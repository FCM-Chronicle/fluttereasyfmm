/**
 * scoreboard.js — Premier League / EA Sports FC Broadcast Scorebug & Live Stats Drawer
 *
 * - Top broadcast scorebug with Competition Emblem, Match Timer Capsule, Home/Away Logos & Score
 * - Periodic TV Broadcast Lower-Third Drawer showing:
 *   1) Ball Possession (%)
 *   2) Total Fouls & Tackles
 *   3) Shots & On Target
 *   4) Player to Watch / Live Key Performer
 *   5) Goal Scorer Broadcast Banner on Goal
 */

(function () {
  "use strict";

  const STYLE = `
    @font-face {
      font-family: 'EFLBroadcast';
      src: url('assets/font/EFL-Bold.ttf') format('truetype');
      font-weight: 400 900;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'PremierSans';
      src: url('assets/font/Premier Sans.otf') format('opentype'),
           url('assets/font/Premier Sans.ttf') format('truetype');
      font-weight: 400 900;
      font-style: normal;
      font-display: swap;
    }

    #ingame-scoreboard {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
      user-select: none;
      font-family: 'Pretendard Variable', 'Pretendard', 'Inter', 'Noto Sans KR', sans-serif;
      filter: drop-shadow(0 10px 28px rgba(0, 0, 0, 0.58));
    }

    /* ── Main Broadcast Scorebug Bar ── */
    #sb-main-bar {
      display: flex;
      align-items: stretch;
      height: 44px;
      background: rgba(9, 13, 22, 0.94);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    /* ── Competition & Timer Left Capsule ── */
    #sb-clock-wing {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 13px;
      background: rgba(2, 132, 199, 0.18);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    #sb-comp-logo {
      width: 20px;
      height: 20px;
      object-fit: contain;
      display: none;
    }

    #sb-comp-tag {
      font-size: 0.68rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: #38BDF8;
      text-transform: uppercase;
    }

    #sb-timer-box {
      font-size: 0.84rem;
      font-weight: 800;
      color: #F8FAFC;
      letter-spacing: 0.05em;
      font-variant-numeric: tabular-nums;
      min-width: 46px;
      text-align: center;
    }

    /* ── Team Sections ── */
    .sb-team-section {
      display: flex;
      align-items: center;
      position: relative;
      min-width: 118px;
    }

    .sb-team-logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.6));
    }

    .sb-name-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 14px;
      font-size: clamp(0.76rem, 1.5vw, 0.88rem);
      font-weight: 800;
      letter-spacing: -0.01em;
      white-space: nowrap;
      color: #F8FAFC;
    }

    #sb-home .sb-name-box {
      justify-content: flex-end;
      width: 100%;
    }

    #sb-away .sb-name-box {
      justify-content: flex-start;
      width: 100%;
    }

    /* ── Center Score Capsule ── */
    #sb-score-center {
      display: flex;
      align-items: center;
      background: #1E293B;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0 4px;
      flex-shrink: 0;
    }

    .sb-score-box {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 34px;
      padding: 0 4px;
    }

    .sb-score-num {
      font-size: 1.32rem;
      font-weight: 900;
      color: #FFFFFF;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.25s;
    }

    .sb-score-num.scored {
      transform: scale(1.3);
      color: #FBBF24;
    }

    #sb-score-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
    }

    #sb-score-divider span {
      display: block;
      width: 6px;
      height: 2px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 1px;
    }

    /* ── Broadcast Lower-Third Drawer (Possession / Fouls / Player to Watch / Goal) ── */
    #sb-broadcast-drawer {
      margin-top: 5px;
      min-width: 340px;
      max-width: 480px;
      padding: 7px 16px;
      border-radius: 8px;
      background: rgba(9, 13, 22, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.2);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
      transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }

    #sb-broadcast-drawer.open {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    #sb-broadcast-drawer.mode-goal {
      background: linear-gradient(90deg, rgba(6, 78, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
      border-color: rgba(52, 211, 153, 0.5);
    }

    .sb-drawer-tag {
      font-size: 0.66rem;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.16);
      color: #38BDF8;
      white-space: nowrap;
      flex-shrink: 0;
    }

    #sb-broadcast-drawer.mode-goal .sb-drawer-tag {
      background: #10B981;
      color: #06281E;
    }

    #sb-broadcast-drawer.mode-watch .sb-drawer-tag {
      background: rgba(245, 158, 11, 0.2);
      color: #FBBF24;
    }

    .sb-drawer-body {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      font-size: 0.78rem;
      font-weight: 700;
      color: #F1F5F9;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sb-drawer-poss-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .sb-drawer-poss-track {
      flex: 1;
      height: 5px;
      background: rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      overflow: hidden;
      min-width: 90px;
    }

    .sb-drawer-poss-fill {
      height: 100%;
      background: #38BDF8;
      border-radius: 999px;
      transition: width 0.35s ease;
    }

    /* ── Goal Flash Animation ── */
    @keyframes sb-goal-flash {
      0%   { filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5)); }
      35%  { filter: drop-shadow(0 0 28px rgba(52, 211, 153, 0.75)); }
      100% { filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5)); }
    }

    #ingame-scoreboard.goal-flash {
      animation: sb-goal-flash 0.8s ease-out 2;
    }

    @media (max-width: 600px) {
      #sb-main-bar { height: 38px; }
      .sb-team-section { min-width: 84px; }
      .sb-name-box { padding: 0 8px; font-size: 0.72rem; }
      #sb-broadcast-drawer { min-width: 260px; padding: 5px 10px; }
    }

    /* ── Bundesliga Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="bundesliga"] {
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.48));
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-main-bar {
      font-family: 'Barlow Condensed', 'Pretendard Variable', sans-serif;
      display: grid;
      grid-template-columns: 74px 72px 72px;
      grid-template-rows: 26px 48px;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-clock-wing {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: grid;
      grid-template-rows: 26px 48px;
      padding: 0;
      gap: 0;
      background: transparent;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-timer-box {
      grid-row: 1;
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1b1b1b;
      color: #ffffff;
      font-size: 0.86rem;
      font-weight: 900;
      letter-spacing: 0.03em;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-comp-logo {
      grid-row: 2;
      width: 100%;
      height: 100%;
      padding: 5px 10px;
      box-sizing: border-box;
      background: #f4f4f4;
      object-fit: contain;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-comp-tag {
      grid-row: 2;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f4f4f4;
      color: #1b1b1b;
      font-size: 0.72rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-home {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      background: var(--sb-home-p, #004b93);
      border-left: 1px solid rgba(0, 0, 0, 0.2);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-away {
      grid-column: 3;
      grid-row: 1;
      min-width: 0;
      background: var(--sb-away-p, #d20515);
      border-left: 1px solid rgba(0, 0, 0, 0.18);
    }

    #ingame-scoreboard[data-comp="bundesliga"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="bundesliga"] .sb-name-box {
      justify-content: center !important;
      padding: 0 4px;
      font-size: 0.88rem;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-home .sb-name-box {
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-away .sb-name-box {
      color: var(--sb-away-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-score-center {
      display: contents;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-score-divider {
      display: none;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-home-score-box {
      grid-column: 2;
      grid-row: 2;
      min-width: 0;
      padding: 0;
      position: relative;
      background: var(--sb-home-p, #004b93);
      border-left: 1px solid rgba(0, 0, 0, 0.2);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-away-score-box {
      grid-column: 3;
      grid-row: 2;
      min-width: 0;
      padding: 0;
      position: relative;
      background: var(--sb-away-p, #d20515);
      border-left: 1px solid rgba(0, 0, 0, 0.18);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-home-score-box::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -7px;
      height: 4px;
      background: var(--sb-home-p, #004b93);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-away-score-box::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -7px;
      height: 4px;
      background: var(--sb-away-p, #d20515);
    }

    #ingame-scoreboard[data-comp="bundesliga"] .sb-score-num {
      font-size: 2.05rem;
      font-weight: 900;
      line-height: 1;
      transition: none;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-home-score-box .sb-score-num {
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-away-score-box .sb-score-num {
      color: var(--sb-away-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="bundesliga"] .sb-score-num.scored {
      transform: none;
    }

    #ingame-scoreboard[data-comp="bundesliga"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="bundesliga"] #sb-broadcast-drawer {
      margin-top: 13px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="bundesliga"] #sb-main-bar {
        grid-template-columns: 62px 60px 60px;
        grid-template-rows: 22px 40px;
      }
      #ingame-scoreboard[data-comp="bundesliga"] #sb-clock-wing {
        grid-template-rows: 22px 40px;
      }
      #ingame-scoreboard[data-comp="bundesliga"] #sb-timer-box {
        font-size: 0.74rem;
      }
      #ingame-scoreboard[data-comp="bundesliga"] .sb-name-box {
        font-size: 0.76rem;
      }
      #ingame-scoreboard[data-comp="bundesliga"] .sb-score-num {
        font-size: 1.65rem;
      }
    }

    /* ── Serie A Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="serie_a"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-main-bar {
      font-family: 'Rajdhani', 'Pretendard Variable', sans-serif;
      display: flex;
      align-items: center;
      height: 34px;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
      gap: 0;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-clock-wing {
      position: relative;
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 16px 0 30px;
      background: #ffffff;
      border-right: none;
      transform: skewX(-18deg);
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-comp-logo {
      position: absolute;
      left: -13px;
      top: 50%;
      width: 38px;
      height: 38px;
      transform: translateY(-50%) skewX(18deg);
      filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
      z-index: 2;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-comp-tag {
      transform: skewX(18deg);
      color: #0b162a;
      font-size: 0.66rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-timer-box {
      transform: skewX(18deg);
      color: #0b162a;
      font-size: 0.92rem;
      font-weight: 900;
      letter-spacing: 0.02em;
      min-width: 48px;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-home {
      position: relative;
      height: 32px;
      min-width: 66px;
      background: linear-gradient(180deg, #0a2a5e 0%, #051636 100%);
      transform: skewX(-18deg);
      margin-left: -1px;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-home::after {
      content: "";
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 2px;
      height: 3px;
      background: var(--sb-home-p, #ffffff);
      opacity: 0.92;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-away {
      position: relative;
      height: 32px;
      min-width: 72px;
      background: linear-gradient(180deg, #0a2a5e 0%, #051636 100%);
      transform: skewX(-18deg);
      border-right: 9px solid #ffffff;
      box-shadow: inset -3px 0 0 #051636;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-away::after {
      content: "";
      position: absolute;
      left: 10px;
      right: 12px;
      bottom: 2px;
      height: 3px;
      background: var(--sb-away-p, #e11d48);
      opacity: 0.92;
    }

    #ingame-scoreboard[data-comp="serie_a"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="serie_a"] .sb-name-box {
      transform: skewX(18deg);
      justify-content: center !important;
      padding: 0 12px;
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-score-center {
      height: 32px;
      background: #ffffff;
      border: none;
      padding: 0 8px;
      transform: skewX(-18deg);
      z-index: 1;
    }

    #ingame-scoreboard[data-comp="serie_a"] .sb-score-box {
      min-width: 18px;
      padding: 0 2px;
    }

    #ingame-scoreboard[data-comp="serie_a"] .sb-score-num {
      transform: skewX(18deg);
      color: #0b162a;
      font-size: 1.05rem;
      font-weight: 900;
      transition: none;
    }

    #ingame-scoreboard[data-comp="serie_a"] .sb-score-num.scored {
      transform: skewX(18deg);
      color: #0b162a;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-score-divider {
      width: 10px;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-score-divider span {
      transform: skewX(18deg);
      width: 5px;
      height: 2.5px;
      background: #0b162a;
      border-radius: 0;
    }

    #ingame-scoreboard[data-comp="serie_a"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="serie_a"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 4px;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="serie_a"] #sb-main-bar {
        height: 28px;
      }
      #ingame-scoreboard[data-comp="serie_a"] #sb-clock-wing,
      #ingame-scoreboard[data-comp="serie_a"] #sb-home,
      #ingame-scoreboard[data-comp="serie_a"] #sb-away,
      #ingame-scoreboard[data-comp="serie_a"] #sb-score-center {
        height: 26px;
      }
      #ingame-scoreboard[data-comp="serie_a"] #sb-clock-wing {
        padding: 0 10px 0 24px;
      }
      #ingame-scoreboard[data-comp="serie_a"] #sb-comp-logo {
        width: 32px;
        height: 32px;
        left: -10px;
      }
      #ingame-scoreboard[data-comp="serie_a"] #sb-home { min-width: 54px; }
      #ingame-scoreboard[data-comp="serie_a"] #sb-away { min-width: 58px; border-right-width: 7px; }
      #ingame-scoreboard[data-comp="serie_a"] .sb-name-box,
      #ingame-scoreboard[data-comp="serie_a"] #sb-timer-box { font-size: 0.78rem; }
      #ingame-scoreboard[data-comp="serie_a"] .sb-score-num { font-size: 0.88rem; }
    }

    /* ── EFL Championship / Playoff / English FA Cup Scorebug Theme ── */
    #ingame-scoreboard[data-comp="efl_championship"],
    #ingame-scoreboard[data-comp="playoff"],
    #ingame-scoreboard[data-comp="fa_cup_en"] {
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.42));
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-main-bar,
    #ingame-scoreboard[data-comp="playoff"] #sb-main-bar,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-main-bar {
      font-family: 'EFLBroadcast', 'Outfit', 'Pretendard Variable', sans-serif;
      display: flex;
      align-items: stretch;
      height: 36px;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: hidden;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-home,
    #ingame-scoreboard[data-comp="playoff"] #sb-home,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-home {
      order: 1;
      min-width: 74px;
      background: var(--sb-home-p, #034694);
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-score-center,
    #ingame-scoreboard[data-comp="playoff"] #sb-score-center,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-score-center {
      order: 2;
      background: #ebebeb;
      border: none;
      padding: 0 8px;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-away,
    #ingame-scoreboard[data-comp="playoff"] #sb-away,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-away {
      order: 3;
      min-width: 74px;
      background: var(--sb-away-p, #ef0107);
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-clock-wing,
    #ingame-scoreboard[data-comp="playoff"] #sb-clock-wing,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-clock-wing {
      order: 4;
      padding: 0 14px;
      gap: 0;
      background: #ebebeb;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="efl_championship"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="efl_championship"] .sb-team-logo,
    #ingame-scoreboard[data-comp="playoff"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="playoff"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="playoff"] .sb-team-logo,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="fa_cup_en"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="efl_championship"] .sb-name-box,
    #ingame-scoreboard[data-comp="playoff"] .sb-name-box,
    #ingame-scoreboard[data-comp="fa_cup_en"] .sb-name-box {
      justify-content: center !important;
      padding: 0 10px;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-home .sb-name-box,
    #ingame-scoreboard[data-comp="playoff"] #sb-home .sb-name-box,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-home .sb-name-box {
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-away .sb-name-box,
    #ingame-scoreboard[data-comp="playoff"] #sb-away .sb-name-box,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-away .sb-name-box {
      color: var(--sb-away-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="efl_championship"] .sb-score-box,
    #ingame-scoreboard[data-comp="playoff"] .sb-score-box,
    #ingame-scoreboard[data-comp="fa_cup_en"] .sb-score-box {
      min-width: 20px;
      padding: 0 2px;
    }

    #ingame-scoreboard[data-comp="efl_championship"] .sb-score-num,
    #ingame-scoreboard[data-comp="playoff"] .sb-score-num,
    #ingame-scoreboard[data-comp="fa_cup_en"] .sb-score-num {
      color: #121056;
      font-size: 1.16rem;
      font-weight: 900;
      transition: none;
    }

    #ingame-scoreboard[data-comp="efl_championship"] .sb-score-num.scored,
    #ingame-scoreboard[data-comp="playoff"] .sb-score-num.scored,
    #ingame-scoreboard[data-comp="fa_cup_en"] .sb-score-num.scored {
      transform: none;
      color: #121056;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-score-divider,
    #ingame-scoreboard[data-comp="playoff"] #sb-score-divider,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-score-divider {
      width: 12px;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-score-divider span,
    #ingame-scoreboard[data-comp="playoff"] #sb-score-divider span,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-score-divider span {
      width: 6px;
      height: 3px;
      background: #121056;
      border-radius: 0;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-timer-box,
    #ingame-scoreboard[data-comp="playoff"] #sb-timer-box,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-timer-box {
      color: #111111;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      min-width: 50px;
    }

    #ingame-scoreboard[data-comp="efl_championship"].goal-flash,
    #ingame-scoreboard[data-comp="playoff"].goal-flash,
    #ingame-scoreboard[data-comp="fa_cup_en"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="efl_championship"] #sb-broadcast-drawer,
    #ingame-scoreboard[data-comp="playoff"] #sb-broadcast-drawer,
    #ingame-scoreboard[data-comp="fa_cup_en"] #sb-broadcast-drawer {
      margin-top: 6px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="efl_championship"] #sb-main-bar,
      #ingame-scoreboard[data-comp="playoff"] #sb-main-bar,
      #ingame-scoreboard[data-comp="fa_cup_en"] #sb-main-bar {
        height: 30px;
      }
      #ingame-scoreboard[data-comp="efl_championship"] #sb-home,
      #ingame-scoreboard[data-comp="efl_championship"] #sb-away,
      #ingame-scoreboard[data-comp="playoff"] #sb-home,
      #ingame-scoreboard[data-comp="playoff"] #sb-away,
      #ingame-scoreboard[data-comp="fa_cup_en"] #sb-home,
      #ingame-scoreboard[data-comp="fa_cup_en"] #sb-away {
        min-width: 58px;
      }
      #ingame-scoreboard[data-comp="efl_championship"] .sb-name-box,
      #ingame-scoreboard[data-comp="efl_championship"] #sb-timer-box,
      #ingame-scoreboard[data-comp="playoff"] .sb-name-box,
      #ingame-scoreboard[data-comp="playoff"] #sb-timer-box,
      #ingame-scoreboard[data-comp="fa_cup_en"] .sb-name-box,
      #ingame-scoreboard[data-comp="fa_cup_en"] #sb-timer-box {
        font-size: 0.86rem;
      }
      #ingame-scoreboard[data-comp="efl_championship"] .sb-score-num,
      #ingame-scoreboard[data-comp="playoff"] .sb-score-num,
      #ingame-scoreboard[data-comp="fa_cup_en"] .sb-score-num {
        font-size: 0.96rem;
      }
    }

    /* ── UEFA Champions League (UCL) Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="ucl"] {
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.55));
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-main-bar {
      font-family: 'Barlow', 'Pretendard Variable', sans-serif;
      display: flex;
      align-items: stretch;
      height: 34px;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-clock-wing {
      padding: 0 12px 0 0;
      gap: 10px;
      background: #ffffff;
      border-right: none;
      margin-right: 6px;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-comp-logo {
      width: 34px;
      height: 34px;
      padding: 4px;
      box-sizing: border-box;
      background: #0028ff;
      object-fit: contain;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-comp-tag {
      padding-left: 10px;
      color: #050b3a;
      font-size: 0.7rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-timer-box {
      color: #050b3a;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      min-width: 50px;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-home {
      min-width: 72px;
      background: linear-gradient(90deg, #0b12a8 0%, #050966 100%);
      border-left: 5px solid var(--sb-home-p, #ffffff);
      position: relative;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-home::after {
      content: "";
      position: absolute;
      right: 0;
      top: 4px;
      bottom: 4px;
      width: 6px;
      border-right: 1px solid rgba(147, 197, 253, 0.25);
      border-radius: 50%;
      pointer-events: none;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-away {
      min-width: 72px;
      background: linear-gradient(90deg, #050966 0%, #0b12a8 100%);
      border-right: 5px solid var(--sb-away-p, #ef4444);
      position: relative;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-away::before {
      content: "";
      position: absolute;
      left: 0;
      top: 4px;
      bottom: 4px;
      width: 6px;
      border-left: 1px solid rgba(147, 197, 253, 0.25);
      border-radius: 50%;
      pointer-events: none;
    }

    #ingame-scoreboard[data-comp="ucl"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="ucl"] .sb-name-box {
      justify-content: center !important;
      padding: 0 12px;
      color: #ffffff;
      font-size: 0.98rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-score-center {
      background: linear-gradient(180deg, #04085e 0%, #02053d 100%);
      border: none;
      padding: 0 6px;
    }

    #ingame-scoreboard[data-comp="ucl"] .sb-score-box {
      min-width: 24px;
      padding: 0 3px;
    }

    #ingame-scoreboard[data-comp="ucl"] .sb-score-num {
      color: #ffffff;
      font-size: 1.12rem;
      font-weight: 700;
      transition: none;
    }

    #ingame-scoreboard[data-comp="ucl"] .sb-score-num.scored {
      transform: none;
      color: #ffffff;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-score-divider {
      width: 8px;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-score-divider span {
      width: 1px;
      height: 18px;
      background: rgba(147, 197, 253, 0.35);
      border-radius: 0;
    }

    #ingame-scoreboard[data-comp="ucl"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="ucl"] #sb-broadcast-drawer {
      margin-top: 6px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="ucl"] #sb-main-bar {
        height: 28px;
      }
      #ingame-scoreboard[data-comp="ucl"] #sb-clock-wing {
        padding: 0 8px 0 0;
        gap: 6px;
        margin-right: 4px;
      }
      #ingame-scoreboard[data-comp="ucl"] #sb-comp-logo {
        width: 28px;
        height: 28px;
      }
      #ingame-scoreboard[data-comp="ucl"] #sb-home,
      #ingame-scoreboard[data-comp="ucl"] #sb-away {
        min-width: 56px;
        border-width: 4px;
      }
      #ingame-scoreboard[data-comp="ucl"] .sb-name-box,
      #ingame-scoreboard[data-comp="ucl"] #sb-timer-box {
        font-size: 0.82rem;
        padding: 0 8px;
      }
      #ingame-scoreboard[data-comp="ucl"] .sb-score-num {
        font-size: 0.94rem;
      }
    }

    /* ── Liga Portugal Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="liga_portugal"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.48));
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-main-bar {
      font-family: 'Barlow', 'Pretendard Variable', sans-serif;
      display: grid;
      grid-template-columns: 92px 62px 46px;
      grid-template-rows: 38px 38px;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-clock-wing {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: grid;
      grid-template-rows: 50px 26px;
      padding: 0;
      gap: 0;
      background: transparent;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-comp-logo {
      grid-row: 1;
      width: 100%;
      height: 100%;
      padding: 4px 6px;
      box-sizing: border-box;
      background: #000000;
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      object-fit: contain;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-comp-tag {
      grid-row: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
      border-bottom: 1px solid rgba(255, 255, 255, 0.18);
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-timer-box {
      grid-row: 2;
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000000;
      color: #ffffff;
      font-size: 0.96rem;
      font-weight: 800;
      letter-spacing: 0.03em;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-home {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      background: var(--sb-home-p, #0c2f74);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-away {
      grid-column: 2;
      grid-row: 2;
      min-width: 0;
      background: var(--sb-away-p, #c81e2b);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] .sb-name-box {
      justify-content: center !important;
      padding: 0 4px;
      font-size: 0.96rem;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-home .sb-name-box {
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-away .sb-name-box {
      color: var(--sb-away-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-score-center {
      display: contents;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-score-divider {
      display: none;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-home-score-box {
      grid-column: 3;
      grid-row: 1;
      min-width: 0;
      padding: 0;
      position: relative;
      background: #ffffff;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-away-score-box {
      grid-column: 3;
      grid-row: 2;
      min-width: 0;
      padding: 0;
      position: relative;
      background: #ffffff;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-home-score-box::after {
      content: "";
      position: absolute;
      right: -8px;
      top: 0;
      bottom: 0;
      width: 6px;
      background: var(--sb-home-p, #0c2f74);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-away-score-box::after {
      content: "";
      position: absolute;
      right: -8px;
      top: 0;
      bottom: 0;
      width: 6px;
      background: var(--sb-away-p, #c81e2b);
    }

    #ingame-scoreboard[data-comp="liga_portugal"] .sb-score-num {
      color: #000000;
      font-size: 1.35rem;
      font-weight: 900;
      line-height: 1;
      transition: none;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] .sb-score-num.scored {
      transform: none;
      color: #000000;
    }

    #ingame-scoreboard[data-comp="liga_portugal"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="liga_portugal"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="liga_portugal"] #sb-main-bar {
        grid-template-columns: 76px 52px 38px;
        grid-template-rows: 31px 31px;
      }
      #ingame-scoreboard[data-comp="liga_portugal"] #sb-clock-wing {
        grid-template-rows: 40px 22px;
      }
      #ingame-scoreboard[data-comp="liga_portugal"] #sb-timer-box,
      #ingame-scoreboard[data-comp="liga_portugal"] .sb-name-box {
        font-size: 0.8rem;
      }
      #ingame-scoreboard[data-comp="liga_portugal"] .sb-score-num {
        font-size: 1.12rem;
      }
    }

    /* ── Turkish Super Lig Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="super_lig"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.55));
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-main-bar {
      font-family: 'Barlow', 'Pretendard Variable', sans-serif;
      display: flex;
      align-items: stretch;
      height: 34px;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
      gap: 0;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-clock-wing {
      padding: 0 14px;
      gap: 0;
      background: linear-gradient(180deg, #e11d1d 0%, #b91c1c 100%);
      border-right: none;
      transform: skewX(-16deg);
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="super_lig"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="super_lig"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-timer-box {
      transform: skewX(16deg);
      color: #ffffff;
      font-size: 0.94rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      min-width: 48px;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-home,
    #ingame-scoreboard[data-comp="super_lig"] #sb-away {
      position: relative;
      min-width: 68px;
      background: linear-gradient(180deg, #1b1d24 0%, #0b0c10 100%);
      transform: skewX(-16deg);
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-home::after {
      content: "";
      position: absolute;
      left: 6px;
      right: 6px;
      bottom: 2px;
      height: 3px;
      background: var(--sb-home-p, #facc15);
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-away::after {
      content: "";
      position: absolute;
      left: 6px;
      right: 6px;
      bottom: 2px;
      height: 3px;
      background: var(--sb-away-p, #e11d48);
    }

    #ingame-scoreboard[data-comp="super_lig"] .sb-name-box {
      transform: skewX(16deg);
      justify-content: center !important;
      padding: 0 12px;
      color: #ffffff;
      font-size: 0.96rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-score-center {
      background: linear-gradient(180deg, #dc2626 0%, #881337 65%, #3b0724 100%);
      border: none;
      padding: 0 8px;
      transform: skewX(-16deg);
      z-index: 1;
    }

    #ingame-scoreboard[data-comp="super_lig"] .sb-score-box {
      min-width: 22px;
      padding: 0 2px;
    }

    #ingame-scoreboard[data-comp="super_lig"] .sb-score-num {
      transform: skewX(16deg);
      color: #ffffff;
      font-size: 1.24rem;
      font-weight: 900;
      transition: none;
    }

    #ingame-scoreboard[data-comp="super_lig"] .sb-score-num.scored {
      transform: skewX(16deg);
      color: #ffffff;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-score-divider {
      width: 10px;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-score-divider span {
      transform: skewX(16deg);
      width: 1.5px;
      height: 16px;
      background: rgba(255, 255, 255, 0.55);
      border-radius: 0;
    }

    #ingame-scoreboard[data-comp="super_lig"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="super_lig"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 2px;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="super_lig"] #sb-main-bar {
        height: 28px;
      }
      #ingame-scoreboard[data-comp="super_lig"] #sb-clock-wing {
        padding: 0 10px;
      }
      #ingame-scoreboard[data-comp="super_lig"] #sb-home,
      #ingame-scoreboard[data-comp="super_lig"] #sb-away {
        min-width: 54px;
      }
      #ingame-scoreboard[data-comp="super_lig"] .sb-name-box,
      #ingame-scoreboard[data-comp="super_lig"] #sb-timer-box {
        font-size: 0.8rem;
        padding: 0 8px;
      }
      #ingame-scoreboard[data-comp="super_lig"] .sb-score-num {
        font-size: 1.02rem;
      }
    }

    /* ── Eredivisie Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="eredivisie"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-main-bar {
      font-family: 'Barlow Condensed', 'Barlow', 'Pretendard Variable', sans-serif;
      display: flex;
      align-items: center;
      height: 40px;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
      gap: 0;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-home {
      order: 1;
      height: 30px;
      min-width: 72px;
      background: linear-gradient(90deg, rgba(16, 18, 24, 0.94) 0%, var(--sb-home-p, #b91c1c) 100%);
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-score-center {
      order: 2;
      height: 40px;
      background: linear-gradient(90deg, #e5e7eb 50%, #d4d7dd 50%);
      border: none;
      padding: 0 6px;
      z-index: 1;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-away {
      order: 3;
      height: 30px;
      min-width: 72px;
      background: linear-gradient(90deg, var(--sb-away-p, #14532d) 0%, rgba(16, 18, 24, 0.94) 100%);
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-clock-wing {
      order: 4;
      height: 30px;
      padding: 0 12px;
      gap: 0;
      background: #e5e7eb;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="eredivisie"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="eredivisie"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="eredivisie"] .sb-name-box {
      justify-content: center !important;
      padding: 0 10px;
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    }

    #ingame-scoreboard[data-comp="eredivisie"] .sb-score-box {
      min-width: 24px;
      padding: 0 2px;
    }

    #ingame-scoreboard[data-comp="eredivisie"] .sb-score-num {
      color: #111827;
      font-size: 1.38rem;
      font-weight: 800;
      transition: none;
    }

    #ingame-scoreboard[data-comp="eredivisie"] .sb-score-num.scored {
      transform: none;
      color: #111827;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-score-divider {
      width: 4px;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-score-divider span {
      display: none;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-timer-box {
      color: #111827;
      font-size: 1.02rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      min-width: 46px;
    }

    #ingame-scoreboard[data-comp="eredivisie"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="eredivisie"] #sb-broadcast-drawer {
      margin-top: 6px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="eredivisie"] #sb-main-bar {
        height: 34px;
      }
      #ingame-scoreboard[data-comp="eredivisie"] #sb-home,
      #ingame-scoreboard[data-comp="eredivisie"] #sb-away,
      #ingame-scoreboard[data-comp="eredivisie"] #sb-clock-wing {
        height: 25px;
      }
      #ingame-scoreboard[data-comp="eredivisie"] #sb-score-center {
        height: 34px;
      }
      #ingame-scoreboard[data-comp="eredivisie"] #sb-home,
      #ingame-scoreboard[data-comp="eredivisie"] #sb-away {
        min-width: 56px;
      }
      #ingame-scoreboard[data-comp="eredivisie"] .sb-name-box,
      #ingame-scoreboard[data-comp="eredivisie"] #sb-timer-box {
        font-size: 0.86rem;
        padding: 0 8px;
      }
      #ingame-scoreboard[data-comp="eredivisie"] .sb-score-num {
        font-size: 1.15rem;
      }
    }

    /* ── K League 1 Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="kleague_1"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-main-bar {
      font-family: 'Pretendard Variable', 'Barlow', sans-serif;
      display: grid;
      grid-template-columns: auto auto auto;
      grid-template-rows: 34px 22px;
      justify-items: center;
      align-items: stretch;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-home {
      grid-column: 1;
      grid-row: 1;
      position: relative;
      z-index: 2;
      min-width: 82px;
      background: var(--sb-home-p, #d91920);
      border-radius: 6px 0 0 6px;
      clip-path: polygon(0 0, calc(100% - 11px) 0, 100% 50%, calc(100% - 11px) 100%, 0 100%);
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-home::before {
      content: "";
      position: absolute;
      left: 6px;
      top: 5px;
      bottom: 5px;
      width: 3px;
      background-image: radial-gradient(circle, currentColor 1.2px, transparent 1.3px);
      background-size: 3px 5px;
      color: var(--sb-home-fg, #ffffff);
      opacity: 0.75;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-away {
      grid-column: 3;
      grid-row: 1;
      position: relative;
      z-index: 2;
      min-width: 82px;
      background: var(--sb-away-p, #f8fafc);
      border-radius: 0 6px 6px 0;
      clip-path: polygon(11px 0, 100% 0, 100% 100%, 11px 100%, 0 50%);
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-away::after {
      content: "";
      position: absolute;
      right: 6px;
      top: 5px;
      bottom: 5px;
      width: 3px;
      background-image: radial-gradient(circle, currentColor 1.2px, transparent 1.3px);
      background-size: 3px 5px;
      color: var(--sb-away-fg, #111827);
      opacity: 0.55;
    }

    #ingame-scoreboard[data-comp="kleague_1"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="kleague_1"] .sb-name-box {
      justify-content: center !important;
      font-size: 0.86rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-home .sb-name-box {
      padding: 0 18px 0 16px;
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-away .sb-name-box {
      padding: 0 16px 0 18px;
      color: var(--sb-away-fg, #111827);
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-score-center {
      grid-column: 2;
      grid-row: 1;
      z-index: 1;
      margin: 0 -12px;
      padding: 0 16px;
      background: #13214b;
      border: none;
    }

    #ingame-scoreboard[data-comp="kleague_1"] .sb-score-box {
      min-width: 24px;
      padding: 0 2px;
    }

    #ingame-scoreboard[data-comp="kleague_1"] .sb-score-num {
      color: #ffffff;
      font-size: 1.24rem;
      font-weight: 900;
      transition: none;
    }

    #ingame-scoreboard[data-comp="kleague_1"] .sb-score-num.scored {
      transform: none;
      color: #ffffff;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-score-divider {
      width: 26px;
      height: 24px;
      background: url('assets/league_logos/kleague_1.png') center / contain no-repeat;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-score-divider span {
      display: none;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-clock-wing {
      grid-column: 2;
      grid-row: 2;
      height: 22px;
      padding: 0 14px;
      gap: 0;
      background: #13214b;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      border-right: none;
      border-radius: 0 0 6px 6px;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="kleague_1"] #sb-comp-tag {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-timer-box {
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      min-width: 44px;
    }

    #ingame-scoreboard[data-comp="kleague_1"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="kleague_1"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 6px;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="kleague_1"] #sb-main-bar {
        grid-template-rows: 28px 20px;
      }
      #ingame-scoreboard[data-comp="kleague_1"] #sb-home,
      #ingame-scoreboard[data-comp="kleague_1"] #sb-away {
        min-width: 64px;
      }
      #ingame-scoreboard[data-comp="kleague_1"] .sb-name-box {
        font-size: 0.76rem;
      }
      #ingame-scoreboard[data-comp="kleague_1"] #sb-home .sb-name-box { padding: 0 14px 0 13px; }
      #ingame-scoreboard[data-comp="kleague_1"] #sb-away .sb-name-box { padding: 0 13px 0 14px; }
      #ingame-scoreboard[data-comp="kleague_1"] .sb-score-num {
        font-size: 1.05rem;
      }
      #ingame-scoreboard[data-comp="kleague_1"] #sb-score-divider {
        width: 20px;
        height: 18px;
      }
      #ingame-scoreboard[data-comp="kleague_1"] #sb-timer-box {
        font-size: 0.7rem;
      }
    }

    /* ── MLS (Apple TV Season Pass) Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="mls"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.52));
    }

    #ingame-scoreboard[data-comp="mls"] #sb-main-bar {
      height: 36px;
      background: #E6E7EA;
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 2px;
      overflow: hidden;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-clock-wing {
      background: linear-gradient(180deg, #27292E 0%, #17191D 100%);
      border-right: none;
      padding: 0 14px;
      gap: 0;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="mls"] #sb-comp-tag,
    #ingame-scoreboard[data-comp="mls"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-timer-box {
      color: #F4F5F7;
      font-weight: 500;
      font-size: 0.96rem;
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      min-width: 48px;
    }

    #ingame-scoreboard[data-comp="mls"] .sb-team-section {
      min-width: 96px;
      background: linear-gradient(180deg, #ECEEEF 0%, #DFE1E5 100%);
      position: relative;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-home::before {
      content: "";
      display: block;
      width: 26px;
      height: 100%;
      flex-shrink: 0;
      background: var(--sb-home-p, #C5B358);
      box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.08);
    }

    #ingame-scoreboard[data-comp="mls"] #sb-away::after {
      content: "";
      display: block;
      width: 26px;
      height: 100%;
      flex-shrink: 0;
      background: var(--sb-away-p, #0D0E12);
      box-shadow: inset 1px 0 0 rgba(0, 0, 0, 0.08);
    }

    #ingame-scoreboard[data-comp="mls"] .sb-name-box {
      flex: 1;
      color: #111317;
      font-weight: 600;
      font-size: 0.95rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0 12px;
      justify-content: flex-start;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-away .sb-name-box {
      justify-content: flex-end;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-score-center {
      background: linear-gradient(180deg, #ECEEEF 0%, #DFE1E5 100%);
      border-left: none;
      border-right: none;
      padding: 0;
      gap: 0;
    }

    #ingame-scoreboard[data-comp="mls"] .sb-score-box {
      min-width: 32px;
      padding: 0 8px;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-score-divider {
      width: 1px;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06);
      margin: 0;
    }

    #ingame-scoreboard[data-comp="mls"] #sb-score-divider span {
      display: none;
    }

    #ingame-scoreboard[data-comp="mls"] .sb-score-num {
      color: #111317;
      font-weight: 600;
      font-size: 1.02rem;
    }

    #ingame-scoreboard[data-comp="mls"] .sb-score-num.scored {
      color: #111317;
    }

    /* ── Premier League (EPL) Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="premier_league"] {
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.55));
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-main-bar {
      font-family: 'PremierSans', 'Outfit', 'Pretendard Variable', sans-serif;
      display: grid;
      grid-template-columns: auto auto auto;
      grid-template-rows: 34px 26px;
      justify-items: center;
      align-items: stretch;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-home {
      grid-column: 1;
      grid-row: 1;
      position: relative;
      z-index: 2;
      min-width: 92px;
      background: var(--sb-home-p, #da291c);
      border-radius: 6px 0 0 6px;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-home::after {
      content: "";
      position: absolute;
      right: -11px;
      top: 0;
      bottom: 0;
      width: 12px;
      background: var(--sb-home-p, #da291c);
      clip-path: polygon(0 0, 35% 0, 95% 48%, 45% 52%, 100% 100%, 0 100%);
      pointer-events: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-away {
      grid-column: 3;
      grid-row: 1;
      position: relative;
      z-index: 2;
      min-width: 92px;
      background: var(--sb-away-p, #6cabdd);
      border-radius: 0 6px 6px 0;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-away::before {
      content: "";
      position: absolute;
      left: -11px;
      top: 0;
      bottom: 0;
      width: 12px;
      background: var(--sb-away-p, #6cabdd);
      clip-path: polygon(65% 0, 100% 0, 100% 100%, 0 100%, 55% 52%, 5% 48%);
      pointer-events: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="premier_league"] .sb-name-box {
      justify-content: center !important;
      font-size: 1.56rem;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-home .sb-name-box {
      padding: 0 10px;
      color: var(--sb-home-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-away .sb-name-box {
      padding: 0 10px;
      color: var(--sb-away-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-score-center {
      grid-column: 2;
      grid-row: 1;
      z-index: 1;
      position: relative;
      margin: 0;
      padding: 0;
      gap: 0;
      background: #37003c;
      border: none;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-home-score-box {
      min-width: 44px;
      height: 100%;
      padding: 0 8px 0 16px;
      background: var(--sb-home-s, #1e0a24);
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-away-score-box {
      min-width: 44px;
      height: 100%;
      padding: 0 16px 0 8px;
      background: var(--sb-away-s, #1e0a24);
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="premier_league"] .sb-score-num {
      position: relative;
      z-index: 4;
      font-size: 2.65rem;
      font-weight: 900;
      line-height: 0.78;
      transition: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-home-score-box .sb-score-num {
      color: var(--sb-home-s-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-away-score-box .sb-score-num {
      color: var(--sb-away-s-fg, #ffffff);
    }

    #ingame-scoreboard[data-comp="premier_league"] .sb-score-num.scored {
      transform: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-score-divider {
      position: relative;
      z-index: 3;
      width: 34px;
      height: 100%;
      margin: 0;
      background: #37003c;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-score-divider::after {
      content: "";
      position: absolute;
      left: 50%;
      top: -5px;
      transform: translateX(-50%);
      width: 36px;
      height: 42px;
      background: url('assets/league_logos/premier_league.png') center / contain no-repeat;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.55));
      pointer-events: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-score-divider span {
      display: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-clock-wing {
      grid-column: 2;
      grid-row: 2;
      width: 100%;
      box-sizing: border-box;
      height: 28px;
      padding: 0 14px;
      gap: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #37003c;
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      border-right: none;
      border-radius: 0 0 6px 6px;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-comp-logo,
    #ingame-scoreboard[data-comp="premier_league"] #sb-comp-tag {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-timer-box {
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      min-width: 0;
      text-align: center;
    }

    #ingame-scoreboard[data-comp="premier_league"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="premier_league"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 6px;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="premier_league"] #sb-main-bar {
        grid-template-rows: 32px 24px;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-home,
      #ingame-scoreboard[data-comp="premier_league"] #sb-away {
        min-width: 70px;
      }
      #ingame-scoreboard[data-comp="premier_league"] .sb-name-box {
        font-size: 1.05rem;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-home-score-box {
        min-width: 36px;
        padding: 0 8px 0 12px;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-away-score-box {
        min-width: 36px;
        padding: 0 12px 0 8px;
      }
      #ingame-scoreboard[data-comp="premier_league"] .sb-score-num {
        font-size: 1.55rem;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-score-divider {
        width: 26px;
        height: 100%;
        margin: 0;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-score-divider::after {
        width: 28px;
        height: 34px;
        top: -4px;
      }
      #ingame-scoreboard[data-comp="premier_league"] #sb-timer-box {
        font-size: 0.92rem;
      }
    }

    /* ── La Liga Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="laliga"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-main-bar {
      font-family: 'Barlow Condensed', 'Barlow', 'Pretendard Variable', sans-serif;
      display: grid;
      grid-template-columns: 78px 58px 54px;
      grid-template-rows: 36px 36px;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: hidden;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-clock-wing {
      grid-column: 1;
      grid-row: 1 / span 2;
      display: grid;
      grid-template-rows: 36px 36px;
      padding: 0;
      gap: 0;
      background: transparent;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-comp-logo {
      grid-row: 1;
      width: 100%;
      height: 100%;
      padding: 5px 10px;
      box-sizing: border-box;
      background: #ff3b30;
      object-fit: contain;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-comp-tag {
      grid-row: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ff3b30;
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-timer-box {
      grid-row: 2;
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      color: #080912;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-home {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      background: #080912;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-away {
      grid-column: 2;
      grid-row: 2;
      min-width: 0;
      background: #080912;
    }

    #ingame-scoreboard[data-comp="laliga"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="laliga"] .sb-name-box {
      justify-content: center !important;
      padding: 0 4px;
      color: #ffffff;
      font-size: 1.02rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-score-center {
      display: contents;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-score-divider {
      display: none;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-home-score-box {
      grid-column: 3;
      grid-row: 1;
      min-width: 0;
      padding: 0;
      background: #ffffff;
      border-left: 5px solid var(--sb-home-p, #f59e0b);
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-away-score-box {
      grid-column: 3;
      grid-row: 2;
      min-width: 0;
      padding: 0;
      background: #ffffff;
      border-left: 5px solid var(--sb-away-p, #ef4444);
      border-top: 1px solid #1f2937;
    }

    #ingame-scoreboard[data-comp="laliga"] .sb-score-num {
      color: #080912;
      font-size: 1.48rem;
      font-weight: 900;
      line-height: 1;
      transition: none;
    }

    #ingame-scoreboard[data-comp="laliga"] .sb-score-num.scored {
      transform: none;
      color: #080912;
    }

    #ingame-scoreboard[data-comp="laliga"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="laliga"] #sb-broadcast-drawer {
      margin-top: 8px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="laliga"] #sb-main-bar {
        grid-template-columns: 64px 48px 44px;
        grid-template-rows: 30px 30px;
      }
      #ingame-scoreboard[data-comp="laliga"] #sb-clock-wing {
        grid-template-rows: 30px 30px;
      }
      #ingame-scoreboard[data-comp="laliga"] #sb-timer-box,
      #ingame-scoreboard[data-comp="laliga"] .sb-name-box {
        font-size: 0.86rem;
      }
      #ingame-scoreboard[data-comp="laliga"] .sb-score-num {
        font-size: 1.22rem;
      }
    }

    /* ── Ligue 1 Broadcast Scorebug Theme ── */
    #ingame-scoreboard[data-comp="ligue_1"] {
      filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.5));
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-main-bar {
      font-family: 'Barlow Condensed', 'Barlow', 'Pretendard Variable', sans-serif;
      display: grid;
      grid-template-columns: 64px 58px 46px;
      grid-template-rows: 30px 30px 22px;
      height: auto;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      border-radius: 0;
      overflow: visible;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-clock-wing {
      grid-column: 1;
      grid-row: 1 / span 3;
      display: grid;
      grid-template-rows: 60px 22px;
      padding: 0;
      gap: 0;
      background: transparent;
      border-right: none;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-comp-logo {
      grid-row: 1;
      width: 100%;
      height: 100%;
      padding: 8px;
      box-sizing: border-box;
      background: #0057ff;
      object-fit: contain;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-comp-tag {
      grid-row: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0057ff;
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 900;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-timer-box {
      grid-row: 2;
      width: 100%;
      height: 100%;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f49be6;
      color: #111111;
      font-size: 0.94rem;
      font-weight: 800;
      letter-spacing: 0.03em;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-home {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      background: #25272d;
      border-bottom: 1px solid rgba(255, 255, 255, 0.35);
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-away {
      grid-column: 2;
      grid-row: 2;
      min-width: 0;
      background: #25272d;
    }

    #ingame-scoreboard[data-comp="ligue_1"] .sb-team-logo {
      display: none !important;
    }

    #ingame-scoreboard[data-comp="ligue_1"] .sb-name-box {
      justify-content: flex-start !important;
      padding: 0 4px 0 8px;
      color: #ffffff;
      font-size: 0.98rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-score-center {
      display: contents;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-score-divider {
      display: none;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-home-score-box {
      grid-column: 3;
      grid-row: 1;
      min-width: 0;
      padding: 0 6px 0 0;
      background: #25272d;
      border-bottom: 1px solid rgba(255, 255, 255, 0.35);
      border-right: 5px solid var(--sb-home-p, #0057ff);
      box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.45);
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-away-score-box {
      grid-column: 3;
      grid-row: 2;
      min-width: 0;
      padding: 0 6px 0 0;
      background: #25272d;
      border-right: 5px solid var(--sb-away-p, #ef4444);
      box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.45);
    }

    #ingame-scoreboard[data-comp="ligue_1"] .sb-score-num {
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 800;
      line-height: 1;
      transition: none;
    }

    #ingame-scoreboard[data-comp="ligue_1"] .sb-score-num.scored {
      transform: none;
      color: #ffffff;
    }

    #ingame-scoreboard[data-comp="ligue_1"].goal-flash {
      animation: none;
    }

    #ingame-scoreboard[data-comp="ligue_1"] #sb-broadcast-drawer {
      margin-top: 6px;
      border-radius: 0;
    }

    @media (max-width: 600px) {
      #ingame-scoreboard[data-comp="ligue_1"] #sb-main-bar {
        grid-template-columns: 54px 48px 38px;
        grid-template-rows: 25px 25px 18px;
      }
      #ingame-scoreboard[data-comp="ligue_1"] #sb-clock-wing {
        grid-template-rows: 50px 18px;
      }
      #ingame-scoreboard[data-comp="ligue_1"] #sb-timer-box,
      #ingame-scoreboard[data-comp="ligue_1"] .sb-name-box {
        font-size: 0.8rem;
      }
      #ingame-scoreboard[data-comp="ligue_1"] .sb-score-num {
        font-size: 0.98rem;
      }
    }

    /* ── Pre-Match Broadcast Starting XI 3D Pitch Intro ── */
    #sb-lineup-intro {
      position: absolute;
      left: 50%;
      top: 58px;
      transform: translateX(-50%);
      width: min(820px, 96%);
      height: min(460px, calc(100% - 68px));
      overflow: hidden;
      z-index: 95;
      background: linear-gradient(180deg, #0b1120 0%, #162036 42%, #0b2416 100%);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 12px;
      box-shadow: 0 22px 50px rgba(0, 0, 0, 0.72);
      color: #f8fafc;
      font-family: 'Pretendard Variable', 'Pretendard', sans-serif;
      display: none;
      pointer-events: auto;
    }

    #sb-lineup-intro.visible {
      display: flex;
      flex-direction: column;
      animation: sb-lineup-card-in 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes sb-lineup-card-in {
      from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.98); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }

    @keyframes sb-row-rise {
      0% {
        opacity: 0;
        transform: translateY(46px) scale(calc(var(--row-scale, 1) * 0.92));
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(var(--row-scale, 1));
      }
    }

    .sb-lineup-header {
      position: relative;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(7, 11, 20, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .sb-lineup-team-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .sb-lineup-team-logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .sb-lineup-team-name {
      font-size: 0.92rem;
      font-weight: 900;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sb-lineup-form {
      font-size: 0.72rem;
      font-weight: 900;
      color: #ffffff;
      background: var(--intro-accent, #38bdf8);
      padding: 2px 7px;
      border-radius: 4px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      flex-shrink: 0;
    }

    .sb-lineup-controls {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-shrink: 0;
    }

    .sb-lineup-tab {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #94a3b8;
      border-radius: 5px;
      padding: 3px 9px;
      font-size: 0.7rem;
      font-weight: 800;
      cursor: pointer;
    }

    .sb-lineup-tab.active {
      background: var(--intro-accent, #38bdf8);
      border-color: transparent;
      color: #ffffff;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    }

    .sb-lineup-close {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #cbd5e1;
      border-radius: 5px;
      padding: 3px 8px;
      font-size: 0.7rem;
      font-weight: 700;
      cursor: pointer;
    }

    .sb-lineup-close:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
    }

    .sb-pitch-stage {
      position: relative;
      flex: 1;
      overflow: hidden;
      perspective: 680px;
    }

    .sb-pitch-bg-title {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 1;
      opacity: 0.9;
      pointer-events: none;
    }

    .sb-pitch-bg-title img {
      height: 26px;
      object-fit: contain;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
    }

    .sb-pitch-bg-title span {
      font-size: 0.86rem;
      font-weight: 900;
      letter-spacing: 0.16em;
      color: rgba(255, 255, 255, 0.72);
      text-transform: uppercase;
    }

    .sb-pitch-floor {
      position: absolute;
      left: -8%;
      right: -8%;
      top: 38px;
      bottom: -36px;
      transform: rotateX(55deg);
      transform-origin: center bottom;
      background:
        repeating-linear-gradient(
          0deg,
          #166534 0px,
          #166534 26px,
          #14532d 26px,
          #14532d 52px
        );
      border-top: 2px solid rgba(255, 255, 255, 0.35);
      border-left: 2px solid rgba(255, 255, 255, 0.28);
      border-right: 2px solid rgba(255, 255, 255, 0.28);
      box-shadow: inset 0 40px 60px rgba(0, 0, 0, 0.45);
    }

    .sb-pitch-floor::before {
      content: "";
      position: absolute;
      left: 28%;
      right: 28%;
      top: 0;
      height: 26%;
      border: 2px solid rgba(255, 255, 255, 0.25);
      border-top: none;
    }

    .sb-pitch-cards {
      position: absolute;
      inset: 36px 12px 10px;
      z-index: 3;
    }

    .sb-pitch-row {
      position: absolute;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      gap: 14px;
      transform-origin: center center;
      opacity: 0;
      animation: sb-row-rise 0.46s calc(0.16s + var(--line-idx, 0) * 0.48s) cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .sb-pitch-row.row-GK { top: 4%;  --row-scale: 0.78; z-index: 1; }
    .sb-pitch-row.row-DF { top: 24%; --row-scale: 0.86; z-index: 2; }
    .sb-pitch-row.row-MF { top: 46%; --row-scale: 0.94; z-index: 3; }
    .sb-pitch-row.row-FW { top: 69%; --row-scale: 1.04; z-index: 4; }

    .sb-pcard {
      width: 82px;
      height: 98px;
      background: linear-gradient(180deg, #1e293b 0%, #090d16 100%);
      border: 1.5px solid var(--intro-accent, #38bdf8);
      border-radius: 8px 8px 16px 16px;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.72), inset 0 0 12px rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
      position: relative;
    }

    .sb-pcard-ovr {
      position: absolute;
      top: 4px;
      left: 5px;
      font-size: 0.72rem;
      font-weight: 900;
      color: #fbbf24;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
      z-index: 2;
    }

    .sb-pcard-pos {
      position: absolute;
      top: 4px;
      right: 5px;
      font-size: 0.62rem;
      font-weight: 900;
      color: #cbd5e1;
      z-index: 2;
    }

    .sb-pcard-photo {
      width: 66px;
      height: 70px;
      margin-top: 4px;
      object-fit: cover;
      object-position: top;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.55));
    }

    .sb-pcard-name {
      width: 100%;
      padding: 3px 4px 4px;
      box-sizing: border-box;
      background: rgba(5, 8, 15, 0.92);
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      font-size: 0.7rem;
      font-weight: 800;
      color: #ffffff;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: auto;
    }

    @media (max-width: 600px) {
      #sb-lineup-intro {
        top: 56px;
        height: min(350px, calc(100% - 64px));
      }
      .sb-pitch-row {
        gap: 6px;
      }
      .sb-pcard {
        width: 58px;
        height: 74px;
      }
      .sb-pcard-photo {
        width: 46px;
        height: 50px;
      }
      .sb-pcard-name {
        font-size: 0.56rem;
      }
    }
  `;

  function injectStyle() {
    if (!document.getElementById("sb-broadcast-fonts")) {
      const link = document.createElement("link");
      link.id = "sb-broadcast-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@600;700&family=Outfit:wght@700;800&family=Rajdhani:wght@700&display=swap";
      document.head.appendChild(link);
    }
    if (document.getElementById("sb-style")) return;
    const s = document.createElement("style");
    s.id = "sb-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function buildScoreboard() {
    const sb = document.createElement("div");
    sb.id = "ingame-scoreboard";

    const mainBar = document.createElement("div");
    mainBar.id = "sb-main-bar";

    // 좌측 대회 로고 & 타이머 캡슐
    const clockWing = document.createElement("div");
    clockWing.id = "sb-clock-wing";

    const compLogo = document.createElement("img");
    compLogo.id = "sb-comp-logo";
    compLogo.alt = "";

    const compTag = document.createElement("span");
    compTag.id = "sb-comp-tag";
    compTag.textContent = "LIVE";

    const timerBox = document.createElement("div");
    timerBox.id = "sb-timer-box";
    timerBox.textContent = "00:00";

    clockWing.append(compLogo, compTag, timerBox);

    // 홈팀
    const homeSection = document.createElement("div");
    homeSection.id = "sb-home";
    homeSection.className = "sb-team-section";
    const homeNameBox = document.createElement("div");
    homeNameBox.className = "sb-name-box";
    const homeLogo = document.createElement("img");
    homeLogo.id = "sb-home-logo";
    homeLogo.className = "sb-team-logo";
    homeLogo.src = "";
    homeLogo.alt = "";
    homeLogo.style.display = "none";
    const homeName = document.createElement("span");
    homeName.id = "sb-home-name";
    homeName.textContent = "홈팀";
    homeNameBox.append(homeLogo, homeName);
    homeSection.appendChild(homeNameBox);

    // 스코어
    const scoreCenter = document.createElement("div");
    scoreCenter.id = "sb-score-center";

    const homeScoreBox = document.createElement("div");
    homeScoreBox.id = "sb-home-score-box";
    homeScoreBox.className = "sb-score-box";
    const homeScore = document.createElement("span");
    homeScore.id = "sb-score-home";
    homeScore.className = "sb-score-num";
    homeScore.textContent = "0";
    homeScoreBox.appendChild(homeScore);

    const divider = document.createElement("div");
    divider.id = "sb-score-divider";
    divider.appendChild(document.createElement("span"));

    const awayScoreBox = document.createElement("div");
    awayScoreBox.id = "sb-away-score-box";
    awayScoreBox.className = "sb-score-box";
    const awayScore = document.createElement("span");
    awayScore.id = "sb-score-away";
    awayScore.className = "sb-score-num";
    awayScore.textContent = "0";
    awayScoreBox.appendChild(awayScore);

    scoreCenter.append(homeScoreBox, divider, awayScoreBox);

    // 어웨이팀
    const awaySection = document.createElement("div");
    awaySection.id = "sb-away";
    awaySection.className = "sb-team-section";
    const awayNameBox = document.createElement("div");
    awayNameBox.className = "sb-name-box";
    const awayName = document.createElement("span");
    awayName.id = "sb-away-name";
    awayName.textContent = "어웨이팀";
    const awayLogo = document.createElement("img");
    awayLogo.id = "sb-away-logo";
    awayLogo.className = "sb-team-logo";
    awayLogo.src = "";
    awayLogo.alt = "";
    awayLogo.style.display = "none";
    awayNameBox.append(awayName, awayLogo);
    awaySection.appendChild(awayNameBox);

    mainBar.append(clockWing, homeSection, scoreCenter, awaySection);

    // 하단 중계 드로어 (점유율 · 총 파울 · 슈팅 · 주목할 선수 · 골 배너)
    const drawer = document.createElement("div");
    drawer.id = "sb-broadcast-drawer";

    const drawerTag = document.createElement("span");
    drawerTag.id = "sb-drawer-tag";
    drawerTag.className = "sb-drawer-tag";
    drawerTag.textContent = "MATCH INFO";

    const drawerBody = document.createElement("div");
    drawerBody.id = "sb-drawer-body";
    drawerBody.className = "sb-drawer-body";

    drawer.append(drawerTag, drawerBody);

    sb.append(mainBar, drawer);
    return sb;
  }

  function getContrastTextColor(cssColor) {
    if (!cssColor) return "#ffffff";
    const ctx = getContrastTextColor._ctx || (getContrastTextColor._ctx = document.createElement("canvas").getContext("2d"));
    if (!ctx) return "#ffffff";
    ctx.fillStyle = "#000000";
    ctx.fillStyle = cssColor;
    const hex = ctx.fillStyle; // normalized #rrggbb
    if (hex.startsWith("#") && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.65 ? "#111827" : "#ffffff";
    }
    return "#ffffff";
  }

  function darkenColor(cssColor, factor = 0.38) {
    if (!cssColor) return "#111827";
    const ctx = getContrastTextColor._ctx || (getContrastTextColor._ctx = document.createElement("canvas").getContext("2d"));
    if (!ctx) return "#111827";
    ctx.fillStyle = "#000000";
    ctx.fillStyle = cssColor;
    const hex = ctx.fillStyle;
    if (hex.startsWith("#") && hex.length === 7) {
      const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
      const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
      const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return "#111827";
  }

  function applyTeamColors() {
    const sbEl = document.getElementById("ingame-scoreboard");
    if (!sbEl) return;

    const cs = getComputedStyle(document.body);
    let homePrimary = cs.getPropertyValue("--team-primary").trim() || "#e74c3c";
    let awayPrimary = cs.getPropertyValue("--away-team-primary").trim() || "#3498db";
    let homeSecondary = null;
    let awaySecondary = null;

    const md = window.currentMatchData;
    if (md && typeof window.getMatchKitColors === "function" && md.homeTeam && md.awayTeam) {
      const kits = window.getMatchKitColors(md.homeTeam, md.awayTeam);
      homePrimary = Array.isArray(kits.home) ? kits.home[0] : kits.home;
      awayPrimary = Array.isArray(kits.away) ? kits.away[0] : kits.away;
      if (Array.isArray(kits.home) && kits.home[1]) homeSecondary = kits.home[1];
      if (Array.isArray(kits.away) && kits.away[1]) awaySecondary = kits.away[1];
    } else if (md && typeof window.getTeamColor === "function") {
      if (md.homeTeam) {
        const hc = window.getTeamColor(md.homeTeam, "home");
        homePrimary = Array.isArray(hc) ? hc[0] : hc;
        if (Array.isArray(hc) && hc[1]) homeSecondary = hc[1];
      }
      if (md.awayTeam) {
        const ac = window.getTeamColor(md.awayTeam, "away");
        awayPrimary = Array.isArray(ac) ? ac[0] : ac;
        if (Array.isArray(ac) && ac[1]) awaySecondary = ac[1];
      }
    }

    if (!homeSecondary) homeSecondary = darkenColor(homePrimary, 0.38);
    if (!awaySecondary) awaySecondary = darkenColor(awayPrimary, 0.38);

    sbEl.style.setProperty("--sb-home-p", homePrimary);
    sbEl.style.setProperty("--sb-away-p", awayPrimary);
    sbEl.style.setProperty("--sb-home-fg", getContrastTextColor(homePrimary));
    sbEl.style.setProperty("--sb-away-fg", getContrastTextColor(awayPrimary));
    sbEl.style.setProperty("--sb-home-s", homeSecondary);
    sbEl.style.setProperty("--sb-away-s", awaySecondary);
    sbEl.style.setProperty("--sb-home-s-fg", getContrastTextColor(homeSecondary));
    sbEl.style.setProperty("--sb-away-s-fg", getContrastTextColor(awaySecondary));
  }

  let syncInterval = null;
  let prevHomeScore = -1;
  let prevAwayScore = -1;
  let lastLogoHomeKey = null;
  let lastLogoAwayKey = null;
  let lastDrawerMinute = -1;
  let drawerHideTimeout = null;
  let lastShownGoalTimestamp = 0;
  let lineupShown = false;
  let lineupDismissed = false;
  let lineupAutoSwitchTimer = null;

  const POS_ORDER = { GK: 0, DF: 1, MF: 2, FW: 3 };

  function hideLineupIntro() {
    if (lineupAutoSwitchTimer) {
      clearTimeout(lineupAutoSwitchTimer);
      lineupAutoSwitchTimer = null;
    }
    const el = document.getElementById("sb-lineup-intro");
    if (el) el.classList.remove("visible");
  }

  function resolvePlayerForPhoto(p, teamKey) {
    if (p && (p.playerid || p.playerId)) return p;
    const roster = (window.allTeams && teamKey && window.allTeams[teamKey] && window.allTeams[teamKey].players)
      ? window.allTeams[teamKey].players
      : null;
    if (roster) {
      const found = roster.find(x => x.name === p.name);
      if (found) return { ...p, ...found };
    }
    return p;
  }

  function renderPitchTeam(overlay, side, md) {
    const isAway = side === "away";
    const teamKey = isAway ? md.awayTeam : md.homeTeam;
    const players = md.engine.players.filter(p => p.teamId === (isAway ? "away" : "home"));
    const sorted = [...players].sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9));

    const dfCount = sorted.filter(p => p.position === "DF").length;
    const mfCount = sorted.filter(p => p.position === "MF").length;
    const fwCount = sorted.filter(p => p.position === "FW").length;

    const sbEl = document.getElementById("ingame-scoreboard");
    const homeAccent = (sbEl && getComputedStyle(sbEl).getPropertyValue("--sb-home-p").trim()) || "#38bdf8";
    const awayAccent = (sbEl && getComputedStyle(sbEl).getPropertyValue("--sb-away-p").trim()) || "#f87171";
    const accent = isAway ? awayAccent : homeAccent;

    const homeLogoEl = document.getElementById("sb-home-logo");
    const awayLogoEl = document.getElementById("sb-away-logo");
    const homeNameEl = document.getElementById("homeTeam");
    const awayNameEl = document.getElementById("awayTeam");
    const teamDisplayName = isAway
      ? ((awayNameEl && awayNameEl.textContent.trim()) || md.awayTeam || "어웨이팀")
      : ((homeNameEl && homeNameEl.textContent.trim()) || md.homeTeam || "홈팀");
    const logoSrc = isAway ? (awayLogoEl ? awayLogoEl.src : "") : (homeLogoEl ? homeLogoEl.src : "");

    const compLogoEl = document.getElementById("sb-comp-logo");
    const compLogoSrc = (compLogoEl && compLogoEl.style.display !== "none" && compLogoEl.src) ? compLogoEl.src : "";

    overlay.style.setProperty("--intro-accent", accent);
    overlay.replaceChildren();

    // 상단 팀 헤더 + 홈/어웨이 전환 + 닫기
    const header = document.createElement("div");
    header.className = "sb-lineup-header";

    const banner = document.createElement("div");
    banner.className = "sb-lineup-team-banner";
    if (logoSrc) {
      const tImg = document.createElement("img");
      tImg.className = "sb-lineup-team-logo";
      tImg.src = logoSrc;
      tImg.alt = teamDisplayName;
      tImg.onerror = function () { this.style.display = "none"; };
      banner.appendChild(tImg);
    }
    const tName = document.createElement("span");
    tName.className = "sb-lineup-team-name";
    tName.textContent = teamDisplayName;
    const formBadge = document.createElement("span");
    formBadge.className = "sb-lineup-form";
    formBadge.textContent = `${dfCount}-${mfCount}-${fwCount}`;
    banner.append(tName, formBadge);

    const controls = document.createElement("div");
    controls.className = "sb-lineup-controls";

    const homeTab = document.createElement("button");
    homeTab.type = "button";
    homeTab.className = `sb-lineup-tab ${!isAway ? "active" : ""}`;
    homeTab.textContent = "홈팀";
    homeTab.addEventListener("click", () => {
      if (lineupAutoSwitchTimer) { clearTimeout(lineupAutoSwitchTimer); lineupAutoSwitchTimer = null; }
      renderPitchTeam(overlay, "home", md);
    });

    const awayTab = document.createElement("button");
    awayTab.type = "button";
    awayTab.className = `sb-lineup-tab ${isAway ? "active" : ""}`;
    awayTab.textContent = "어웨이";
    awayTab.addEventListener("click", () => {
      if (lineupAutoSwitchTimer) { clearTimeout(lineupAutoSwitchTimer); lineupAutoSwitchTimer = null; }
      renderPitchTeam(overlay, "away", md);
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "sb-lineup-close";
    closeBtn.textContent = "닫기 ×";
    closeBtn.addEventListener("click", () => {
      lineupDismissed = true;
      hideLineupIntro();
    });

    controls.append(homeTab, awayTab, closeBtn);
    header.append(banner, controls);

    // 3D 원근 피치 스테이지
    const stage = document.createElement("div");
    stage.className = "sb-pitch-stage";

    const bgTitle = document.createElement("div");
    bgTitle.className = "sb-pitch-bg-title";
    if (compLogoSrc) {
      const cImg = document.createElement("img");
      cImg.src = compLogoSrc;
      cImg.alt = "";
      cImg.onerror = function () { this.style.display = "none"; };
      bgTitle.appendChild(cImg);
    }
    const bgSpan = document.createElement("span");
    bgSpan.textContent = "STARTING XI";
    bgTitle.appendChild(bgSpan);

    const floor = document.createElement("div");
    floor.className = "sb-pitch-floor";

    const cardsLayer = document.createElement("div");
    cardsLayer.className = "sb-pitch-cards";

    const lineKeys = ["GK", "DF", "MF", "FW"];
    lineKeys.forEach((lineKey, lineIdx) => {
      const linePlayers = sorted.filter(p => (["GK", "DF", "MF", "FW"].includes(p.position) ? p.position : "MF") === lineKey);
      if (linePlayers.length === 0) return;

      const row = document.createElement("div");
      row.className = `sb-pitch-row row-${lineKey}`;
      row.style.setProperty("--line-idx", String(lineIdx));

      linePlayers.forEach((p) => {
        const card = document.createElement("div");
        card.className = "sb-pcard";

        const ovr = document.createElement("span");
        ovr.className = "sb-pcard-ovr";
        const ratingVal = Math.round(p.baseRating || p.rating || 0);
        ovr.textContent = ratingVal > 0 ? String(ratingVal) : "";

        const pos = document.createElement("span");
        pos.className = "sb-pcard-pos";
        pos.textContent = lineKey;

        const photo = document.createElement("img");
        photo.className = "sb-pcard-photo";
        photo.alt = p.name || "";
        const fullP = resolvePlayerForPhoto(p, teamKey);
        if (typeof window.setPlayerPhoto === "function") {
          window.setPlayerPhoto(photo, fullP);
        }

        const pname = document.createElement("div");
        pname.className = "sb-pcard-name";
        pname.textContent = p.name || "";

        card.append(ovr, pos, photo, pname);
        row.appendChild(card);
      });

      cardsLayer.appendChild(row);
    });

    stage.append(bgTitle, floor, cardsLayer);
    overlay.append(header, stage);
  }

  function updateLineupIntro() {
    const md = window.currentMatchData;
    const container = document.getElementById("matchVisualizerContainer");
    if (!container || !md) return;

    if (md.isRunning || (md.minute || 0) > 0) {
      hideLineupIntro();
      return;
    }

    if (lineupDismissed || lineupShown) return;
    if (!md.engine || !Array.isArray(md.engine.players) || md.engine.players.length === 0) return;

    let overlay = document.getElementById("sb-lineup-intro");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sb-lineup-intro";
      container.appendChild(overlay);
    }

    renderPitchTeam(overlay, "home", md);
    overlay.classList.add("visible");
    lineupShown = true;

    // 홈팀 라인별 소개 후 자동으로 어웨이팀 소개로 전환
    if (lineupAutoSwitchTimer) clearTimeout(lineupAutoSwitchTimer);
    lineupAutoSwitchTimer = setTimeout(() => {
      if (!lineupDismissed && window.currentMatchData && !window.currentMatchData.isRunning) {
        renderPitchTeam(overlay, "away", window.currentMatchData);
      }
    }, 3600);
  }

  function applyTeamLogos() {
    const md = window.currentMatchData;
    const teams = window.allTeams;
    if (!md) return;

    const homeKey = md.homeTeam;
    const awayKey = md.awayTeam;

    if (homeKey === lastLogoHomeKey && awayKey === lastLogoAwayKey) return;

    // 대회 로고 / 태그 세팅 및 대회 테마(data-comp) 지정
    const sbRoot = document.getElementById("ingame-scoreboard");
    const compLogo = document.getElementById("sb-comp-logo");
    const compTag = document.getElementById("sb-comp-tag");
    let compKey = "default";
    if (compTag && window.gameData) {
      if (window.gameData.isMLSPlayoffMatch) {
        compKey = "mls";
        if (compLogo) {
          compLogo.src = "assets/league_logos/mls.png";
          compLogo.style.display = "block";
          compLogo.onerror = function () {
            this.style.display = "none";
            if (compTag) {
              compTag.textContent = "MLS CUP";
              compTag.style.display = "";
            }
          };
        }
        compTag.textContent = "";
        compTag.style.display = "none";
      } else if (window.gameData.isPlayoffMatch) {
        compKey = "playoff";
        if (compLogo) {
          compLogo.src = "assets/league_logos/efl_championship.png";
          compLogo.style.display = "block";
          compLogo.onerror = function () {
            this.style.display = "none";
            if (compTag) {
              compTag.textContent = "PLAYOFF";
              compTag.style.display = "";
            }
          };
        }
        compTag.textContent = "";
        compTag.style.display = "none";
      } else if (window.gameData.isUCLMatch) {
        compKey = "ucl";
        if (compLogo) {
          compLogo.src = (window.CUP_CONFIGS && window.CUP_CONFIGS.ucl && window.CUP_CONFIGS.ucl.logo)
            ? window.CUP_CONFIGS.ucl.logo
            : "assets/cup_logos/ucl.png";
          compLogo.style.display = "block";
          compLogo.onerror = function () {
            this.style.display = "none";
            if (compTag) {
              compTag.textContent = "UCL";
              compTag.style.display = "";
            }
          };
        }
        compTag.textContent = "";
        compTag.style.display = "none";
      } else if (window.gameData.isFACupMatch) {
        compKey = "fa_cup";
        let faLogo = "assets/cup_logos/fa_cup.png";
        if (typeof LeagueManager !== "undefined") {
          const lid = LeagueManager.getLeagueIdByTeam(homeKey);
          if (lid === "premier_league" || lid === "efl_championship") {
            compKey = "fa_cup_en";
          }
          if (window.CUP_CONFIGS && window.CUP_CONFIGS.faCups && window.CUP_CONFIGS.faCups[lid] && window.CUP_CONFIGS.faCups[lid].logo) {
            faLogo = window.CUP_CONFIGS.faCups[lid].logo;
          }
        }
        if (compLogo) {
          compLogo.src = faLogo;
          compLogo.style.display = "block";
          compLogo.onerror = function () {
            this.style.display = "none";
            if (compTag) {
              compTag.textContent = "FA CUP";
              compTag.style.display = "";
            }
          };
        }
        compTag.textContent = "";
        compTag.style.display = "none";
      } else if (typeof LeagueManager !== "undefined" && typeof LEAGUES_CONFIG !== "undefined") {
        const lid = LeagueManager.getLeagueIdByTeam(homeKey);
        if (lid) compKey = lid;
        const cfg = LEAGUES_CONFIG[lid];
        if (cfg && cfg.logo && compLogo) {
          compLogo.src = cfg.logo;
          compLogo.style.display = "block";
          compLogo.onerror = function () {
            this.style.display = "none";
            if (compTag) {
              compTag.textContent = "LEAGUE";
              compTag.style.display = "";
            }
          };
          compTag.textContent = "";
          compTag.style.display = "none";
        } else {
          compTag.textContent = "LEAGUE";
          compTag.style.display = "";
        }
      }
    }
    if (sbRoot) sbRoot.setAttribute("data-comp", compKey);

    const getTeamInfo = (key) => {
      if (key && key.startsWith("Legend_")) {
        const code = (window.LegendLeagueManager && window.LegendLeagueManager.legendLogoCodes && window.LegendLeagueManager.legendLogoCodes[key])
          || (window.LegendLeagueManager && window.LegendLeagueManager.legendTeams && window.LegendLeagueManager.legendTeams[key]?.logoCode)
          || "DFT";
        return { isLegend: true, logoCode: code };
      }
      return teams ? teams[key] : null;
    };

    const homeInfo = getTeamInfo(homeKey);
    const awayInfo = getTeamInfo(awayKey);
    if (!homeInfo || !awayInfo) return;

    if (sbRoot) {
      sbRoot.dataset.homeCode = homeInfo.logoCode || (homeKey ? homeKey.slice(0, 3).toUpperCase() : "HOM");
      sbRoot.dataset.awayCode = awayInfo.logoCode || (awayKey ? awayKey.slice(0, 3).toUpperCase() : "AWY");
    }
    applyTeamColors();

    const getLogoPath = (info) => {
      if (info.isLegend) return `assets/logo/legend/${info.logoCode}.webp`;
      if (info.teamid) return `assets/team_logos/L${info.teamid}.png`;
      return `assets/logo/${info.league || 1}/${info.logoCode || "DFT"}.webp`;
    };

    const homeLogo = document.getElementById("sb-home-logo");
    const awayLogo = document.getElementById("sb-away-logo");
    if (homeLogo) {
      homeLogo.src = getLogoPath(homeInfo);
      homeLogo.alt = homeKey;
      homeLogo.style.display = "";
      homeLogo.onerror = function () { this.style.display = "none"; };
    }
    if (awayLogo) {
      awayLogo.src = getLogoPath(awayInfo);
      awayLogo.alt = awayKey;
      awayLogo.style.display = "";
      awayLogo.onerror = function () { this.style.display = "none"; };
    }

    lastLogoHomeKey = homeKey;
    lastLogoAwayKey = awayKey;
  }

  function showBroadcastDrawer(mode, tagText, renderBodyFn, durationMs = 4400) {
    const drawer = document.getElementById("sb-broadcast-drawer");
    const tagEl = document.getElementById("sb-drawer-tag");
    const bodyEl = document.getElementById("sb-drawer-body");
    if (!drawer || !tagEl || !bodyEl) return;

    drawer.className = `open ${mode || ""}`.trim();
    tagEl.textContent = tagText;
    bodyEl.replaceChildren();
    renderBodyFn(bodyEl);

    if (drawerHideTimeout) clearTimeout(drawerHideTimeout);
    drawerHideTimeout = setTimeout(() => {
      drawer.classList.remove("open");
    }, durationMs);
  }

  function updateBroadcastDrawerCycle() {
    const md = window.currentMatchData;
    if (!md || !md.liveStats) return;
    const ls = md.liveStats;

    // 1. 득점 발생 시 즉시 골 배너 최우선 노출
    if (ls.lastGoalBanner && ls.lastGoalBanner.timestamp !== lastShownGoalTimestamp) {
      lastShownGoalTimestamp = ls.lastGoalBanner.timestamp;
      const g = ls.lastGoalBanner;
      showBroadcastDrawer("mode-goal", `⚽ GOAL · ${g.minute}'`, (body) => {
        const span = document.createElement("span");
        span.textContent = g.assister ? `${g.scorer} (도움: ${g.assister})` : `${g.scorer} 득점!`;
        body.appendChild(span);
      }, 5200);
      return;
    }

    // 2. 경기 진행 중 주기적 중계 팝업 (점유율 / 파울·태클 / 슈팅 / 주목할 선수)
    const min = md.minute || 0;
    if (min === lastDrawerMinute || min <= 0) return;

    // 2분(주목할 선수), 이후 7분 주기로 중계 그래픽 팝업
    if (min === 2 || min % 7 === 0) {
      lastDrawerMinute = min;
      const cycleIdx = (min === 2) ? 0 : (Math.floor(min / 7) % 4);

      if (cycleIdx === 0 && ls.currentSpotlight) {
        // 주목할 만한 선수 / 실시간 키플레이어
        showBroadcastDrawer("mode-watch", ls.currentSpotlight.tag || "PLAYER TO WATCH", (body) => {
          const span = document.createElement("span");
          span.textContent = ls.currentSpotlight.name;
          body.appendChild(span);
        }, 4800);
      } else if (cycleIdx === 1) {
        // 실시간 볼 점유율
        showBroadcastDrawer("mode-stat", "BALL POSSESSION", (body) => {
          const wrap = document.createElement("div");
          wrap.className = "sb-drawer-poss-wrap";

          const hTxt = document.createElement("span");
          hTxt.textContent = `${ls.possessionPct.home}%`;

          const track = document.createElement("div");
          track.className = "sb-drawer-poss-track";
          const fill = document.createElement("div");
          fill.className = "sb-drawer-poss-fill";
          fill.style.width = `${ls.possessionPct.home}%`;
          track.appendChild(fill);

          const aTxt = document.createElement("span");
          aTxt.textContent = `${ls.possessionPct.away}%`;

          wrap.append(hTxt, track, aTxt);
          body.appendChild(wrap);
        }, 4600);
      } else if (cycleIdx === 2) {
        // 총 파울 & 태클 성공
        showBroadcastDrawer("mode-stat", "FOULS & TACKLES", (body) => {
          const span = document.createElement("span");
          span.textContent = `총 파울 ${ls.fouls.home} : ${ls.fouls.away}   ·   태클 ${ls.tackles.home} : ${ls.tackles.away}`;
          body.appendChild(span);
        }, 4600);
      } else {
        // 슈팅 & 패스 통계
        showBroadcastDrawer("mode-stat", "ATTACK STATS", (body) => {
          const span = document.createElement("span");
          span.textContent = `슈팅(유효) ${ls.shots.home}(${ls.shotsOnTarget.home}) : ${ls.shots.away}(${ls.shotsOnTarget.away})  ·  패스 ${ls.passes.home} : ${ls.passes.away}`;
          body.appendChild(span);
        }, 4600);
      }
    }
  }

  function isMatchScreenActive() {
    const ms = document.getElementById("matchScreen");
    return !!(ms && ms.classList.contains("active"));
  }

  function stopScoreboardLoops() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    if (timerRAF) {
      cancelAnimationFrame(timerRAF);
      timerRAF = null;
    }
    lastRAFTime = null;
    if (drawerHideTimeout) {
      clearTimeout(drawerHideTimeout);
      drawerHideTimeout = null;
    }
    const drawer = document.getElementById("sb-broadcast-drawer");
    if (drawer) drawer.classList.remove("open");
    hideLineupIntro();
  }

  function resetMatchScoreboardState() {
    prevHomeScore = -1;
    prevAwayScore = -1;
    lastLogoHomeKey = null;
    lastLogoAwayKey = null;
    lastDrawerMinute = -1;
    lastShownGoalTimestamp = 0;
    lineupShown = false;
    lineupDismissed = false;
    hideLineupIntro();
    timerSec = 0;
    lastMinValue = -1;
    const sbTimer = document.getElementById("sb-timer-box");
    if (sbTimer) sbTimer.textContent = "00:00";
  }

  function syncData() {
    if (!isMatchScreenActive()) {
      stopScoreboardLoops();
      return;
    }

    applyTeamLogos();

    const sbRootForName = document.getElementById("ingame-scoreboard");
    const compNameMode = sbRootForName && sbRootForName.getAttribute("data-comp");
    const useShortCode = (
      compNameMode === "bundesliga" ||
      compNameMode === "serie_a" ||
      compNameMode === "efl_championship" ||
      compNameMode === "playoff" ||
      compNameMode === "fa_cup_en" ||
      compNameMode === "ucl" ||
      compNameMode === "liga_portugal" ||
      compNameMode === "super_lig" ||
      compNameMode === "eredivisie" ||
      compNameMode === "premier_league" ||
      compNameMode === "laliga" ||
      compNameMode === "ligue_1" ||
      compNameMode === "mls"
    );

    const homeTeamEl = document.getElementById("homeTeam");
    const awayTeamEl = document.getElementById("awayTeam");
    const sbHomeName = document.getElementById("sb-home-name");
    const sbAwayName = document.getElementById("sb-away-name");
    if (sbHomeName) {
      const fallbackHome = (homeTeamEl && homeTeamEl.textContent.trim()) || "홈팀";
      sbHomeName.textContent = (useShortCode && sbRootForName.dataset.homeCode) ? sbRootForName.dataset.homeCode : fallbackHome;
    }
    if (sbAwayName) {
      const fallbackAway = (awayTeamEl && awayTeamEl.textContent.trim()) || "어웨이팀";
      sbAwayName.textContent = (useShortCode && sbRootForName.dataset.awayCode) ? sbRootForName.dataset.awayCode : fallbackAway;
    }

    const scoreEl = document.getElementById("scoreDisplay");
    if (scoreEl) {
      const parts = scoreEl.textContent.split(/[-–]/);
      const h = parseInt(parts[0]) || 0;
      const a = parseInt(parts[1]) || 0;

      const sbScoreHome = document.getElementById("sb-score-home");
      const sbScoreAway = document.getElementById("sb-score-away");
      const sbRoot = document.getElementById("ingame-scoreboard");

      if (sbScoreHome && sbScoreAway) {
        if (h !== prevHomeScore) {
          sbScoreHome.textContent = h;
          if (prevHomeScore !== -1) flashScore(sbScoreHome, sbRoot);
          prevHomeScore = h;
        }
        if (a !== prevAwayScore) {
          sbScoreAway.textContent = a;
          if (prevAwayScore !== -1) flashScore(sbScoreAway, sbRoot);
          prevAwayScore = a;
        }
      }
    }

    updateLineupIntro();
    updateBroadcastDrawerCycle();
  }

  let timerSec = 0;
  let lastMinValue = -1;
  let timerRAF = null;
  let lastRAFTime = null;

  function startInternalTimer() {
    if (timerRAF) cancelAnimationFrame(timerRAF);
    lastRAFTime = null;

    function tick(now) {
      if (!isMatchScreenActive()) {
        stopScoreboardLoops();
        return;
      }
      if (lastRAFTime === null) lastRAFTime = now;
      const delta = now - lastRAFTime;
      if (delta >= 1000) {
        lastRAFTime = now - (delta % 1000);
        const timeEl = document.getElementById("matchTime");
        if (timeEl) {
          const mins = parseInt(timeEl.textContent) || 0;
          if (mins !== lastMinValue) {
            timerSec = mins * 60;
            lastMinValue = mins;
          } else {
            timerSec++;
          }
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

  function startScoreboardLoops() {
    if (!isMatchScreenActive()) {
      stopScoreboardLoops();
      return;
    }
    if (!timerRAF) {
      startInternalTimer();
    }
    if (!syncInterval) {
      syncInterval = setInterval(syncData, 100);
    }
  }

  function flashScore(el, root) {
    el.classList.remove("scored");
    root.classList.remove("goal-flash");
    void el.offsetWidth;
    el.classList.add("scored");
    root.classList.add("goal-flash");

    setTimeout(() => {
      el.classList.remove("scored");
      root.classList.remove("goal-flash");
    }, 1600);
  }

  function insertScoreboard() {
    const container = document.getElementById("matchVisualizerContainer");
    if (!container) return false;

    if (!document.getElementById("ingame-scoreboard")) {
      if (getComputedStyle(container).position === "static")
        container.style.position = "relative";

      const sb = buildScoreboard();
      container.appendChild(sb);
    }

    applyTeamColors();
    if (isMatchScreenActive()) {
      syncData();
      startScoreboardLoops();
    } else {
      stopScoreboardLoops();
    }
    return true;
  }

  function handleMatchScreenStateChange() {
    if (isMatchScreenActive()) {
      resetMatchScoreboardState();
      insertScoreboard();
      startScoreboardLoops();
    } else {
      stopScoreboardLoops();
    }
  }

  function observeMatchScreen() {
    const ms = document.getElementById("matchScreen");
    if (ms) {
      let wasActive = ms.classList.contains("active");
      new MutationObserver(() => {
        const nowActive = ms.classList.contains("active");
        if (nowActive !== wasActive) {
          wasActive = nowActive;
          handleMatchScreenStateChange();
        }
      }).observe(ms, { attributes: true, attributeFilter: ["class"] });
      return true;
    }
    return false;
  }

  function watchForContainer() {
    insertScoreboard();
    if (!observeMatchScreen()) {
      const obs = new MutationObserver(() => {
        insertScoreboard();
        if (observeMatchScreen()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  new MutationObserver(() => applyTeamColors())
    .observe(document.body, { attributes: true, attributeFilter: ["class", "style"] });

  injectStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchForContainer);
  } else {
    watchForContainer();
  }

})();
