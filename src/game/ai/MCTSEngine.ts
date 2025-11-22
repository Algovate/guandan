import type { Card, GameState, Play } from '../types';
import { findPossiblePlays } from '../CardTypes';

/**
 * MCTS树节点
 */
interface MCTSNode {
    gameState: GameState;
    play: Card[] | null;  // 到达此节点的出牌
    parent: MCTSNode | null;
    children: MCTSNode[];
    visits: number;
    wins: number;
    untriedPlays: Play[];  // 未尝试的出牌
}

/**
 * 蒙特卡洛树搜索引擎 - 用于困难AI的深度决策
 */
export class MCTSEngine {
    private explorationConstant = 1.414; // UCB1常数 (√2)
    private maxIterations = 100;  // 最大迭代次数
    private maxDepth = 10;        // 最大搜索深度

    /**
     * 执行MCTS搜索
     * @param gameState 当前游戏状态
     * @param timeLimit 时间限制（毫秒）
     * @returns 最佳出牌
     */
    search(gameState: GameState, timeLimit: number = 1000): Card[] | null {
        const startTime = Date.now();
        const rootNode = this.createNode(gameState, null, null);

        let iterations = 0;

        // 时间限制内进行迭代
        while (Date.now() - startTime < timeLimit && iterations < this.maxIterations) {
            // 1. 选择
            const node = this.selectNode(rootNode);

            // 2. 扩展
            const expandedNode = this.expandNode(node);

            // 3. 模拟
            const result = this.simulate(expandedNode.gameState);

            // 4. 回溯
            this.backPropagate(expandedNode, result);

            iterations++;
        }

        // 选择访问次数最多的子节点
        if (rootNode.children.length === 0) {
            return null;
        }

        const bestChild = rootNode.children.reduce((best, child) =>
            child.visits > best.visits ? child : best
        );

        return bestChild.play;
    }

    /**
     * 创建新节点
     */
    private createNode(
        gameState: GameState,
        play: Card[] | null,
        parent: MCTSNode | null
    ): MCTSNode {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const possiblePlays = findPossiblePlays(
            currentPlayer.hand,
            gameState.lastPlay,
            gameState.mainRank || undefined,
            gameState.mainSuit || undefined
        );

        return {
            gameState,
            play,
            parent,
            children: [],
            visits: 0,
            wins: 0,
            untriedPlays: [...possiblePlays]
        };
    }

    /**
     * 选择节点（UCB1算法）
     */
    private selectNode(node: MCTSNode): MCTSNode {
        let current = node;
        let depth = 0;

        // 选择到叶子节点或未完全扩展的节点
        while (current.untriedPlays.length === 0 && current.children.length > 0 && depth < this.maxDepth) {
            current = this.selectBestChild(current);
            depth++;
        }

        return current;
    }

    /**
     * 使用UCB1选择最佳子节点
     */
    private selectBestChild(node: MCTSNode): MCTSNode {
        return node.children.reduce((best, child) => {
            const ucb1 = this.calculateUCB1(child, node.visits);
            const bestUCB1 = this.calculateUCB1(best, node.visits);
            return ucb1 > bestUCB1 ? child : best;
        });
    }

    /**
     * 计算UCB1值
     */
    private calculateUCB1(node: MCTSNode, parentVisits: number): number {
        if (node.visits === 0) {
            return Infinity; // 优先探索未访问节点
        }

        const exploitation = node.wins / node.visits;
        const exploration = this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits);

        return exploitation + exploration;
    }

    /**
     * 扩展节点
     */
    private expandNode(node: MCTSNode): MCTSNode {
        // 如果还有未尝试的出牌，扩展一个
        if (node.untriedPlays.length > 0) {
            const play = node.untriedPlays.pop()!;
            const newGameState = this.applyPlay(node.gameState, play);
            const childNode = this.createNode(newGameState, play.cards, node);
            node.children.push(childNode);
            return childNode;
        }

        return node;
    }

    /**
     * 模拟游戏（快速走子）
     */
    private simulate(gameState: GameState): number {
        let currentState = this.cloneGameState(gameState);
        let depth = 0;
        const maxSimulationDepth = 20;

        // 快速模拟到游戏结束或达到深度限制
        while (!this.isTerminal(currentState) && depth < maxSimulationDepth) {
            const randomPlay = this.getRandomPlay(currentState);
            if (randomPlay) {
                currentState = this.applyPlay(currentState, randomPlay);
            } else {
                // 如果没有可出的牌，跳过
                currentState = this.applyPass(currentState);
            }
            depth++;
        }

        // 评估最终状态
        return this.evaluateState(currentState, gameState.currentPlayerIndex);
    }

    /**
     * 回溯更新
     */
    private backPropagate(node: MCTSNode, result: number): void {
        let current: MCTSNode | null = node;

        while (current !== null) {
            current.visits++;
            current.wins += result;
            current = current.parent;
        }
    }

    // ==================== 辅助方法 ====================

    /**
     * 应用出牌到游戏状态（简化版本）
     */
    private applyPlay(gameState: GameState, play: Play): GameState {
        const newState = this.cloneGameState(gameState);
        const currentPlayer = newState.players[newState.currentPlayerIndex];

        // 移除出的牌
        const playedIds = new Set(play.cards.map(c => c.id));
        currentPlayer.hand = currentPlayer.hand.filter(c => !playedIds.has(c.id));

        // 更新游戏状态
        newState.lastPlay = play;
        newState.lastPlayPlayerIndex = newState.currentPlayerIndex;
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;

        return newState;
    }

    /**
     * 应用过牌
     */
    private applyPass(gameState: GameState): GameState {
        const newState = this.cloneGameState(gameState);
        newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 4;
        return newState;
    }

    /**
     * 获取随机可出的牌
     */
    private getRandomPlay(gameState: GameState): Play | null {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const possiblePlays = findPossiblePlays(
            currentPlayer.hand,
            gameState.lastPlay,
            gameState.mainRank || undefined,
            gameState.mainSuit || undefined
        );

        if (possiblePlays.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * possiblePlays.length);
        return possiblePlays[randomIndex];
    }

    /**
     * 判断是否游戏结束
     */
    private isTerminal(gameState: GameState): boolean {
        return gameState.players.some(p => p.hand.length === 0);
    }

    /**
     * 评估游戏状态（从某个玩家角度）
     */
    private evaluateState(gameState: GameState, playerIndex: number): number {
        const player = gameState.players[playerIndex];
        const teammateIndex = (playerIndex + 2) % 4;
        const teammate = gameState.players[teammateIndex];

        // 如果我方获胜
        if (player.hand.length === 0 || teammate.hand.length === 0) {
            return 1;
        }

        // 如果对手获胜
        const opponent1 = gameState.players[(playerIndex + 1) % 4];
        const opponent2 = gameState.players[(playerIndex + 3) % 4];
        if (opponent1.hand.length === 0 || opponent2.hand.length === 0) {
            return 0;
        }

        // 中间状态：基于手牌数评估
        const myTeamCards = player.hand.length + teammate.hand.length;
        const opponentCards = opponent1.hand.length + opponent2.hand.length;

        // 归一化到0-1
        const totalCards = myTeamCards + opponentCards;
        if (totalCards === 0) return 0.5;

        return 1 - (myTeamCards / totalCards);
    }

    /**
     * 克隆游戏状态（深拷贝）
     */
    private cloneGameState(gameState: GameState): GameState {
        return {
            ...gameState,
            players: gameState.players.map(p => ({
                ...p,
                hand: [...p.hand]
            })),
            deck: [...gameState.deck],
            teamScores: [...gameState.teamScores] as [number, number]
        };
    }
}
