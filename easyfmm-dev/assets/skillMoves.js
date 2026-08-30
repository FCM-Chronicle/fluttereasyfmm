// skillmoves.js - 선수들의 개인기(Skill Moves) 시스템 (능력치 제한 제거 버전)

const SkillMoveData = {
    MARSEILLE_TURN: {
        id: "MARSEILLE_TURN",
        name: "마르세유 턴",
        staminaCost: 3,
        successBonus: 1.25,
        desc: " 선수, 마르세유 턴! 수비수를 완벽하게 요리하며 벗겨냅니다!"
    },
    LA_CROQUETA: {
        id: "LA_CROQUETA",
        name: "라 크로케타",
        staminaCost: 2,
        successBonus: 1.15,
        desc: " 선수, 라 크로케타! 순식간에 수비 사이를 빠져나갑니다!"
    },
    ELASTICO: {
        id: "ELASTICO",
        name: "엘라스티코",
        staminaCost: 4,
        successBonus: 1.35,
        desc: " 선수, 엘라스티코! 환상적인 발재간에 수비수가 그대로 얼어붙습니다!"
    },
    DRAG_BACK: {
        id: "DRAG_BACK",
        name: "드래그백",
        staminaCost: 1.5,
        successBonus: 1.1,
        desc: " 노련하게 뒤로 뺍니다. 드래그백으로 압박을 무위로 돌립니다!"
    },
    STEPOVER: {
        id: "STEPOVER",
        name: "스텝오버",
        staminaCost: 2,
        successBonus: 1.15,
        desc: " 현란한 헛다리짚기! 수비수의 타이밍을 완벽하게 뺏고 돌파합니다!"
    },
    ROULETTE: {
        id: "ROULETTE",
        name: "룰렛",
        staminaCost: 3,
        successBonus: 1.25,
        desc: " 부드러운 룰렛 동작! 유연하게 수비벽을 허물어뜨리며 전진합니다!"
    },
    RAINBOW_FLICK: {
        id: "RAINBOW_FLICK",
        name: "사포",
        staminaCost: 5,
        successBonus: 1.5,
        desc: " 사포가 나옵니다! 수비수 키를 넘기는 대담한 플레이, 정말 대단합니다!"
    },
    RONALDO_CHOP: {
        id: "RONALDO_CHOP",
        name: "호날두 촙",
        staminaCost: 2.5,
        successBonus: 1.25,
        desc: " 강력한 촙 동작! 급격한 방향 전환에 수비가 완전히 속았습니다!"
    }
};

const SkillMoveManager = {
    attemptSkillMove(attacker, defender) {
        const tech = attacker.stats.passing;
        const availableMoves = Object.values(SkillMoveData);
        
        const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        attacker.stamina = Math.max(0, attacker.stamina - selectedMove.staminaCost);

        const atkRoll = tech * selectedMove.successBonus * (0.8 + Math.random() * 0.4);
        const defRoll = defender.stats.defense * (0.8 + Math.random() * 0.4);

        return {
            success: atkRoll > defRoll,
            move: selectedMove
        };
    }
};

window.SkillMoveManager = SkillMoveManager;