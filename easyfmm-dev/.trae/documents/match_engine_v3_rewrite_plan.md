# 🎯 MATCH ENGINE V3 완전 재작성 계획서 (deepenTactic.js REWRITE)

## 1. 현재 deepenTactic.js 근본 문제점 분석 (ROOT CAUSE ANALYSIS)

### ❌ 문제 1: "중원에서 공만 계속 돌리다가 멈춤" — 가장 치명적인 문제
#### 원인 분석 (사고 실험):
```
패스 체인 분석:
  1. _scorePassOption → "FW에 전달" +35점, "백패스" -50으로 수치상 전방 유도.
  2. BUT _calcPassProb MF/FW 0.22 → 드리블로 전진.
  3. BUT _dribbleCarry targetX = player.x + moveDir*48 → _applyMovement에서
     MF BAND_MIN/MAX Home 35-85, Away 15-65로 CLAMP!
  4. MF가 85(Home) / 65(Away)에 도달하는 순간 →
     BAND_MAX_X에 걸려 _applyMovement에서 targetX가 85로 clamp 됨.
     → vx 감쇄 (v *= 0.2) → MF가 85선에서 정지!
  5. MF가 정지한 상태에서 드리블 targetX = 85 + 48 = 133 → clamp 85 → 제자리!
  6. _calcPassProb MF 0.22 * 0.7 (build-up zone 보정인데 MF는 85이므로 build-up아님)
     = 0.22 → 계속 드리블 선택 → 정지 상태 유지!
  7. FW는 ABS_FW_MIN_X=42~58에 갇혀있음 → MF가 85까지 왔는데 FW도 85에 있으면
     MF가 FW 뒤로 가야하므로 mfLimit = min(fwX)-10 = 75 → MF가 75로 후퇴!
  8. MF가 75로 왔는데 또 드리블 → 85 → clamp → 정지 → 무한 LOOP!
  9. 공은 75~85 구간에서 MF끼리 왔다갔다 → "공만 계속 돌리다 멈춤" 현상 발생!
```
#### 핵심 결론: POSITION BAND와 HARD STOP이 전진을 막는 주범! MF BAND를 유동화해야 함.

---

### ❌ 문제 2: 하드 포지셔닝 & 텔레포트 로직 남발로 인한 "동네축구 몰려다님"
- `_applyMovement` 최종 POST-CLAMP `p.x = BAND_MAX_X; vx *= 0.2` → 순간 벽에 부딪힘
- DF `keepGoalkeeperHome`, `gk.x = homeX` 하드 할당
- FW 수비 복귀 `p.x = Math.max(p.x, ABS_FLOOR)` 하드 할당
- MF `mfLimit = min(fwX)-10` 수시로 목표치 급변 → 갑자기 방향 전환

### ❌ 문제 3: 시간 기반 상태 없음 (NO TEMPORAL STATE)
- "공격 빌드업 3단계" (GK→CB→MF→FW) 같은 **진행 상태(progress state)**가 없음.
- 모든 프레임 `_getGameState`이 독립 → buildup/attack/counter 무작위 롤링.
- **패스 체인 메모리**가 없어서 give-and-go 스팸 방지만 있고, 조합 플레이가 안됨.

### ❌ 문제 4: 오프더볼 무빙이 "타겟 지점 추적"에 불과
- FW `_runKind`가 랜덤 롤링 + 타이머 → 공 위치와 **연계성 없음**.
- 패스가 "도착할 때 까지" receiver가 타겟X로 달리는데, 다른 팀원은 뭘 해야 할지 모름.
- 수비라인 높이가 `adjustDefensiveLines`에 있지만 볼과 선수간 연동이 안됨.

### ❌ 문제 5: 실제 축구의 "공간 & 채널" 개념 없음
- "하프 스페이스", "채널", "포켓" 개념이 전혀 없음 → 포지션 밴드 + 중원 몰림.
- 패스 레인 평가는 단순 라인 체크 + 피지컬 X → "중원 포화" 불가피.

---

## 2. V3 신규 아키텍처 구상 (THINKING PROCESS)

### ✅ 핵심 설계 철학: "축구 = 흐름(Flow) 기반 상태머신"
```
기존 (프레임 단위 독립):
  [매 프레임] → 개별 선수 혼자 판단 → 목표X,Y 계산 → 움직임
  
V3 (흐름/팀 단위 연계):
  [TEAM POSSESSION STATE] → (Building / Progressing / FinalThird / Chance)
         ↓ 공유되는 "공격 페이즈 + 공격 구역"
    [각 포지션별 STANDARD MOVEMENT TEMPLATE]
         ↓ (basePosition + roleOffset + flowShift)
    [개별 보정: 상대 수비 거리, 패스 레인, 런 타이밍]
         ↓
    [velocity 기반 smooth 보간 + minimal clamp]
```

---

## 3. V3 주요 모듈 (기능별 재설계)

```
REAL SOCCER ENGINE V3
├─ [0] CORE: 팀 소유권 & 시간 흐름 관리
│   ├─ _tickPossession(): 팀 소유권 지속시간 측정, 페이즈 판단
│   ├─ _calcTeamPhase(): Building(0-30) / Progressing(30-70) / FinalThird(70+) / Counter(transition)
│   └─ _attackMemories: 최근 8프레임 패스 체인 기록 (who→where→when)
│
├─ [1] ON-BALL DECISION: 공 소유자 판단 (이전보다 훨씬 스마트)
│   ├─ _scanForwardOptions(): FW/MF 중 누가 "가장 좋은 런을 하고 있는가?"
│   │   - 런 타이밍 점수: burst 시작 0~4 프레임 → +80
│   │   - 스페이스 점수: 반경 10m에 상대 0명 → +60
│   │   - 스루패스 레인: from→to 직선에 수비수 비율 → 점수화
│   ├─ _shouldDribbleForward(): "앞으로 가면 이득인가?"
│   │   ├─ isLaneClear(5-15m ahead) → 70% 이상 10-20m 드리블
│   │   ├─ 1v1 FW → speed>opp+10 → 돌파
│   │   └─ flank winger → hug line sprint + 30m 이후 cross
│   └─ _shootDecision(): 각도/거리/수비수 위치 3D 스코어링 (이전 로직 유지 + 보정)
│
├─ [2] OFF-BALL MOVEMENT: 포지션별 "스탠다드 템플릿" (역할 기반)
│   │  (기존 랜덤 _runKind → "role template + flow delta"로 완전 대체!)
│   ├─ [2-A] FORWARD (FW) MOVEMENT TEMPLATES
│   │   ├─ Target 1: DEFENSE LINE SHADOW (수비수 1~2m 바로 뒤)
│   │   │   └─ 상대 수비 x가 80이면 → home fw x = 78~79 (오프사이드 직전)
│   │   │   └─ y: 상대 CB 사이 "채널"에 자리 잡음 (45%|50%|55%)
│   │   ├─ Target 2: RUN BEHIND 타이밍
│   │   │   └─ [트리거] 우리 팀 MF가 65(Home)선 넘었을 때 & 공 소유 5프레임 이상
│   │   │   └─ → burst = 20 프레임 동안 offsideLimit-1 에서 +2m/s 속도
│   │   └─ Target 3: LINKUP DROP
│   │       └─ [트리거] CB/MF가 20프레임 동안 전진 못하고 멈춰있을 때
│   │       └─ → 18-30% 구간(수비진 바로 앞)까지 x를 낮춤, but ABS_MIN 48 유지
│   │
│   ├─ [2-B] MIDFIELDER (MF) MOVEMENT TEMPLATES ★★ 혼잡 해결 핵심!
│   │   ├─ 팀 페이즈별 기본 X:
│   │   │   ├─ Building(0-30): baseX - 0 (제자리)
│   │   │   ├─ Progressing(30-70): baseX + forward*8
│   │   │   └─ FinalThird(70+): baseX + forward*20 (단, FW보다 -8 뒤)
│   │   ├─ Y 분산 보장 (OVERSATURATION FIX):
│   │   │   ├─ MF 4명 → Y= 20 / 40 / 60 / 80 (고정 슬롯 배정)
│   │   │   ├─ MF 3명 → Y= 28 / 50 / 72
│   │   │   └─ ⭐ "공 Y 근처 MF"만 공 쪽으로 +-5 움직이고 나머지는 자기 슬롯 유지
│   │   ├─ DM(CDMcANC) 절대 규칙: 팀 내 DF 중 가장 높은 X의 5 뒤 (절대 안 올라감)
│   │   └─ AM(CM CAM etc) 규칙: FW 중 가장 낮은 X의 5 뒤 (페이즈에 따라 전진)
│   │
│   └─ [2-C] DEFENDER (DF) MOVEMENT TEMPLATES
│       ├─ CB: 4-4-2 / 4-3-3 등 밴드 유지 → 가장 높은 MF의 -20 뒤 유지 (defensive line height)
│       ├─ FB: 페이즈별
│       │   ├─ Building: baseX 유지
│       │   ├─ Progressing: baseX + forward*15, y 유지
│       │   └─ FinalThird: OVERLAP(바깥라인+x+25) / UNDERLAP(안쪽+x+15) / HOLD 中 랜덤 선택 후 15프레임 유지
│       └─ DEFENSIVE MARKING: 수비 시 ZONE FIRST → 인접 공격수만 마크, 중앙 침범 절대 안함
│
├─ [3] MOVEMENT PHYSICS: 속도 기반 부드러운 움직임
│   ├─ _physicsStep(p, desiredX, desiredY, accel):
│   │   ├─ 원하는 속도 = (desiredX-p.x, desiredY-p.y) * accel
│   │   ├─ vx += 원하는속도 * dt
│   │   ├─ vx *= 0.82 (댐핑)
│   │   ├─ p.x += vx
│   │   └─ ⭐ 클램프는 "경기장 밖"일 때 ONLY! 포지션 밴드는 targetX 단계에서만 제한!
│   └─ _resolveTeammateCollisions():
│       └─ 22명 페어 체크 → 거리 5 이하 → 서로 반발 벡터 추가 (중원 포화 2차 방지)
│
├─ [4] BUILD-UP PROGRESSION (빌드업 -> 중원 -> 공격진 자동 전개) ★★ 멈춤 해결 핵심!
│   ├─ 소유자가 CB일 때:
│   │   ├─ 5프레임 내 → FB이나 MF로 패스 (80% MF, 20% FB)
│   │   └─ FB이 공을 받으면 10~15m 드리블 (FB은 빌드업 시 측면 개척)
│   ├─ 소유자가 MF(Home 50~70 구간)일 때:
│   │   ├─ [체크] FW burst 진행 중? → THROUGH PASS 발동! (prob 0.70)
│   │   ├─ [체크] FB overlap 돌고 있으면 → SIDE SWITCH 패스
│   │   ├─ 그 외 15m 드리블 → 70 구간 돌파!
│   │   └─ MF 대 MF: 전방 패스 우선 (MF→MF 가로 패스는 최소화)
│   ├─ 소유자가 FW 또는 MF 70 넘은 구간:
│   │   ├─ 패널티 박스 진입 전까지 FW 드리블 유지
│   │   ├─ 윙 크로스 구역 Y<15 or Y>85 & x>78 → CROSS (FW box에 2명 이상 있을 때 높은 확률)
│   │   └─ 18m 이내 → SHOOT!
│   └─ ⭐⭐ MF가 85에서 "멈추지 않게" 하는 특수 룰:
│       MF가 BAND_MAX(85) 근처 3 이내 & 전방 10m에 상대 수비 < 2명 이면:
│       → BAND_MAX_X 임시 해제 → 95까지 돌파 허용 (FW가 뒤처졌을 경우에만!)
│
├─ [5] DEFENSIVE SHAPE (수비 대형 붕괴 방지)
│   ├─ Defensive Line = 가장 뒤 CB의 x ± defensiveLine 모드
│   ├─ Block Compactness: 수비 4명의 x 표준편차 < 8 → 블록 붕괴 아님
│   │   (표준편차 > 10 이면 가장 멀리 간 DF을 formation으로 복귀)
│   ├─ Pressing: 공격진에서 1~2명(가장 가까운 MF/FW)만 프레스, 나머지는 블록 유지
│   └─ Fullbacks: 절대 중앙 안 들어옴 (Y ± 10 벗어나면 즉시 baseY로 pullback)
│
└─ [6] TACKLE / INTERCEPTION / TURNOVER
    ├─ In-flight 패스: 수비수 궤적 근처 거리 3 → 인터셉트 확률 대폭 상향
    ├─ Turnover 시: Counter Transition 자동 발동!
    │   ├─ 소유권 바뀐 팀의 3명(FW+MF)이 동시 burst
    │   └─ 패스 타겟 점수 counter = 전방패스 +45 (가장 빠른 카운터)
    └─ Loose ball: 가장 가까운 1명만 뛰어가고 나머진 자기 포메이션 복귀
```

---

## 4. "멈추는 증상" 해결 전략 사고 실험

### 시나리오: 홈팀 4-3-3, 빌드업 시작
```
T=0  : GK → CB1 (x=20)
T=3  : CB1 → MF2 (CM, x=45)  [Building 종료 → Progressing 시작]
T=8  : MF2가 드리블 개시! desiredX=45+20=65, BAND_MAX Home=85 → 괜찮음!
       FW burst 트리거 발동! (MF가 65 넘음) → FW x = 80 까지 돌진
T=12 : MF2 x=65, FW x=78. MF2 패스 스캔 → FW burst 진행 중 → Through Pass!
T=15 : FW 리시브 → x=85, 드리블 20 더 → x=95 → 18m이내 → SHOOT!
     ⇒ 멈춤 없이 찬스까지 연결! 🎯
```

### 시나리오 2: MF가 80 구간에서 막힘 (수비가 6명 백집결)
```
T=20 : MF1이 80 정지
       → _attackMemories 10프레임 진척 없음 → "FW linkup" 트리거!
       → F9/FW이 ABS_FW_MIN_X + 18 = 60까지 내려옴
T=24 : MF1이 linkup FW 발견! Short pass!
T=26 : FW가 60에서 받자마자 → 다른 측면 MF나 FB로 스위치 패스!
       → 측면 FB overlap → cross!
     ⇒ 막혔을 때 자동으로 측면 전환! 동그라미 돌기 안함!
```

---

## 5. 실제 구현 순서 (단계별 테스트 가능)

### STAGE 1: BASE STRUCTURE (파일 전체 백업 후 새로 쓰기)
1. 새 파일에 클래스 뼈대 작성: RealSoccerEngine, SimPlayer, SimBall
2. `update()` 메인 루프 → ① 볼 업데이트 ② 소유권 페이즈 판단 ③ 선수 AI ④ 물리/충돌

### STAGE 2: POSSESSION STATE & FLOW PHASE (가장 중요!)
3. `_tickPossession()` 구현 → 팀 소유권 1초 이상 유지 시 페이즈 확정
4. `_calcTeamPhase()` → 구간 X로 Building/Progressing/FinalThird 분류 + transition 카운터
5. `_attackMemories[]` (8-slot ring buffer) 패스 이벤트 기록 → 막힘 감지

### STAGE 3: MF MOVEMENT OVERHAUL (혼잡 + 멈춤 해결)
6. MF 템플릿: 슬롯 기반 Y 고정 + 페이즈별 X 이동
7. MF X BAND 유동화: Progressing 이상 & 전방 수비 적을 때 BAND 10 추가
8. DM/AM 뎁스 시프트 자동화

### STAGE 4: FW MOVEMENT (기존 런타입 → 트리거형)
9. "Defense Line Shadow" 기본 자세 + burst 타이밍 트리거 + linkup 트리거
10. ABS_MIN_X=48은 계속 유지 (수비진 침범 안함)

### STAGE 5: DF MOVEMENT + FORMATION KEEPING
11. CB 블록 컴팩트니스 감시 + FB overlap/underlap/hold 상태 머신
12. 수비: Zone → Mark → Recovery 순서 (FB 중앙 절대 금지)

### STAGE 6: ON-BALL DECISION (드리블 vs 패스 스마트 판단)
13. `_shouldDribble()`: laneClear & speed 우위 → 드리블 우선
14. `_scanForwardOptions()`: burst + through lane + space 종합 점수
15. 빌드업: GK→CB→MF/FB; progressing: MF→FW(through or linkup); final: dribble/cross/shoot

### STAGE 7: PHYSICS & COLLISIONS (부드러움)
16. `_physicsStep()`: 속도→가속→댐핑→위치 (포지션 밴드는 desiredX에서만!)
17. `_resolveTeammateCollisions()`: 페어 반발 벡터 → 혼잡 2차 해결
18. _enforceOffsideLine: velocity 기반 gradual glide (기존 유지 + 강화)

### STAGE 8: TEST & EXTERNAL COMPATIBILITY
19. 인터페이스 그대로 유지 확인: `window.RealSoccerEngine`, `update(minute,isNewMinute)`, `getSnapshot()`
20. matchVisualizer 등 외부 UI 로직이 변화없이 동작하는지 이벤트 포맷 검증

---

## 6. 리스크 및 완화 방안

| 리스크 | 완화 |
|:--|:--|
| 너무 과감한 리라이트로 동작 안할 수 있음 | `deepenTactic_old_backup.js` 자동 백업 후 새파일 작성 |
| 기존 UI 호환 깨짐 | 이벤트 type 목록 (pass/throughpass/shot/goal/cross/tackle/save/block/dribble) 그대로 유지 |
| 골이 너무 많이 나옴 | shootDecision의 distFactor를 0.85→0.7로 조금 보정 |
| 카운터가 너무 강함 | transition burst를 2명으로 제한 |
| 팀 포지션이 초기화 안됨 | `resetPositions()`는 기존 로직 유지 + kickoff 팀 오프셋만 50+5 |

---

## 7. 최종 예상 결과

### ✅ 기존 문제 해결 확인 체크리스트
- [ ] 중원에서 공만 맴도는 현상 → 빌드업 페이즈 자동 전개로 찬스까지 연결
- [ ] 몇분 지나면 멈추는 현상 → "막힘 감지 → FW linkup → 측면 스위치"로 해소
- [ ] 동네축구처럼 몰려다님 → MF 슬롯 고정 + DF 컴팩트 블록 + 충돌 반발 벡터
- [ ] 중원 과포화 → Y 슬롯 배정 + 동일 포지션 최소 간격 + 측면 FB 활용
- [ ] 선수들 순간이동/갑자기멈춤 → _physicsStep velocity 기반 + POST-CLAMP 제거 + minimal clamp
- [ ] FW가 수비라인까지 내려감 → ABS_MIN_X=48 + linkup 시 최소 60 이상 유지

### ✅ 진짜 축구 같은 플레이 체크리스트
- [ ] GK → CB → MF → FW 조합 플레이 자동 전개
- [ ] 스루패스 타이밍 맞춰 FW burst 런
- [ ] 측면 FB 오버랩 → 크로스 (중앙에 FW 2명 이상일 때)
- [ ] 중원 막힐 때 → FW이 내려와서 받고 side switch
- [ ] 역습 시 2-3명 burst 전개
- [ ] 수비 대형 제대로 유지 (FB은 측면, CB는 중앙)
