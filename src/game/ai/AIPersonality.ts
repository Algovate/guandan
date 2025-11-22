/**
 * AI性格类型
 */
export const PersonalityType = {
    AGGRESSIVE: 'aggressive',     // 激进型：喜欢压牌、早用炸弹
    CONSERVATIVE: 'conservative', // 保守型：谨慎出牌、保留大牌
    COOPERATIVE: 'cooperative',   // 优先配合队友
    BALANCED: 'balanced'          // 根据局面灵活调整
} as const;

export type PersonalityType = typeof PersonalityType[keyof typeof PersonalityType];

/**
 * AI性格配置
 */
export interface AIPersonality {
    type: PersonalityType;
    name: string;                    // 性格显示名称
    riskTolerance: number;           // 风险容忍度 0-1，越高越激进
    bombThreshold: number;           // 炸弹使用门槛 0-1，越低越容易用炸弹
    teamworkPriority: number;        // 配合优先级 0-1，越高越重视配合
    thinkingTimeMultiplier: number;  // 思考时间倍数
    aggressiveness: number;          // 进攻性 0-1
    description: string;             // 性格描述
}

/**
 * 预定义的AI性格
 */
export const AI_PERSONALITIES: Record<PersonalityType, AIPersonality> = {
    [PersonalityType.AGGRESSIVE]: {
        type: PersonalityType.AGGRESSIVE,
        name: '激进型',
        riskTolerance: 0.8,
        bombThreshold: 0.3,
        teamworkPriority: 0.3,
        thinkingTimeMultiplier: 0.7,
        aggressiveness: 0.9,
        description: '快速果断，喜欢压牌，早用炸弹'
    },
    [PersonalityType.CONSERVATIVE]: {
        type: PersonalityType.CONSERVATIVE,
        name: '保守型',
        riskTolerance: 0.3,
        bombThreshold: 0.8,
        teamworkPriority: 0.5,
        thinkingTimeMultiplier: 1.5,
        aggressiveness: 0.2,
        description: '谨慎稳重，深思熟虑，保留大牌'
    },
    [PersonalityType.COOPERATIVE]: {
        type: PersonalityType.COOPERATIVE,
        name: '配合型',
        riskTolerance: 0.5,
        bombThreshold: 0.5,
        teamworkPriority: 0.9,
        thinkingTimeMultiplier: 1.0,
        aggressiveness: 0.4,
        description: '团队至上，优先配合队友'
    },
    [PersonalityType.BALANCED]: {
        type: PersonalityType.BALANCED,
        name: '均衡型',
        riskTolerance: 0.5,
        bombThreshold: 0.5,
        teamworkPriority: 0.6,
        thinkingTimeMultiplier: 1.0,
        aggressiveness: 0.5,
        description: '灵活应变，根据局面调整策略'
    }
};

/**
 * 获取性格配置
 */
export function getPersonality(type: PersonalityType): AIPersonality {
    return AI_PERSONALITIES[type];
}

/**
 * 获取随机性格
 */
export function getRandomPersonality(): AIPersonality {
    const types = Object.values(PersonalityType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return AI_PERSONALITIES[randomType];
}

/**
 * 根据性格调整决策参数
 */
export function adjustDecisionByPersonality(
    baseValue: number,
    personality: AIPersonality,
    factor: 'risk' | 'bomb' | 'teamwork' | 'aggression'
): number {
    let multiplier = 1;

    switch (factor) {
        case 'risk':
            multiplier = personality.riskTolerance;
            break;
        case 'bomb':
            multiplier = 1 - personality.bombThreshold; // 门槛越低，越容易用
            break;
        case 'teamwork':
            multiplier = personality.teamworkPriority;
            break;
        case 'aggression':
            multiplier = personality.aggressiveness;
            break;
    }

    return baseValue * multiplier;
}

/**
 * 计算动态思考时间
 */
export function calculateThinkingTime(
    personality: AIPersonality,
    complexity: number, // 决策复杂度 0-1
    baseTime: number = 1000 // 基础时间（毫秒）
): number {
    const personalityFactor = personality.thinkingTimeMultiplier;
    const complexityFactor = 0.5 + complexity * 0.5; // 0.5-1.0

    const time = baseTime * personalityFactor * complexityFactor;

    // 限制在合理范围
    return Math.max(300, Math.min(3000, time));
}
