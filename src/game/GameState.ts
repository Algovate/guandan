import type {
  GameState,
  Player,
  Card
} from './types';
import {
  GamePhase,
  PlayerPosition,
} from './types';
import { Deck } from './Deck';
import { PlayValidator } from './PlayValidator';
import { CARDS_PER_PLAYER, PLAYER_COUNT, LEVEL_ORDER } from '../utils/constants';
import { generateId } from '../utils/helpers';
import { getRandomPersonality } from './ai/AIPersonality';
import { selectRandomTeamThemes, type TeamTheme } from '../utils/teamNames';

/**
 * 游戏状态管理类
 */
export class GameStateManager {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * 创建初始游戏状态
   */
  private createInitialState(): GameState {
    // 随机选择两个队伍主题
    const [team0Theme, team1Theme] = selectRandomTeamThemes();

    return {
      phase: GamePhase.WAITING,
      players: this.createPlayers(team0Theme, team1Theme),
      currentPlayerIndex: 0,
      currentPlay: null,
      lastPlay: null,
      lastPlayPlayerIndex: -1,
      level: '2',
      deck: [],
      teamScores: [0, 0],
      teamNames: [team0Theme.teamName, team1Theme.teamName],
      roundWinner: null,
      playHistory: [], // 初始化出牌历史
      currentTrick: [], // 初始化当前轮出牌记录
    };
  }

  /**
   * 创建玩家
   */
  private createPlayers(team0Theme: TeamTheme, team1Theme: TeamTheme): Player[] {
    // 为每个AI玩家随机分配性格风格
    // 玩家位置分配：TOP (team 0), LEFT (team 1), RIGHT (team 1), BOTTOM (team 0)
    return [
      {
        id: generateId(),
        name: team0Theme.players[0],
        position: PlayerPosition.TOP,
        hand: [],
        isAI: true,
        team: 0,
        avatar: team0Theme.avatars?.[0] || '👤',
        personality: getRandomPersonality().type
      },
      {
        id: generateId(),
        name: team1Theme.players[0],
        position: PlayerPosition.LEFT,
        hand: [],
        isAI: true,
        team: 1,
        avatar: team1Theme.avatars?.[0] || '👤',
        personality: getRandomPersonality().type
      },
      {
        id: generateId(),
        name: team0Theme.players[1],
        position: PlayerPosition.BOTTOM,
        hand: [],
        isAI: false,
        team: 0,
        avatar: team0Theme.avatars?.[1] || '👤'
      },
      {
        id: generateId(),
        name: team1Theme.players[1],
        position: PlayerPosition.RIGHT,
        hand: [],
        isAI: true,
        team: 1,
        avatar: team1Theme.avatars?.[1] || '👤',
        personality: getRandomPersonality().type
      },
    ];
  }

  /**
   * 开始新游戏
   */
  startNewGame(): void {
    this.state = this.createInitialState();
    this.dealCards();
    this.state.phase = GamePhase.PLAYING;
  }

  /**
   * 发牌
   */
  private dealCards(): void {
    const deck = new Deck();
    deck.shuffle();

    // 发牌给每个玩家
    for (let i = 0; i < PLAYER_COUNT; i++) {
      this.state.players[i].hand = deck.deal(CARDS_PER_PLAYER);
    }

    this.state.deck = deck.allCards;
  }



  /**
   * 玩家出牌
   */
  playCards(playerIndex: number, cards: Card[]): { success: boolean; error?: string } {
    const player = this.state.players[playerIndex];

    // 验证出牌
    const validation = PlayValidator.validatePlay(
      player,
      cards,
      this.state.lastPlay
    );

    if (!validation.valid || !validation.play) {
      return { success: false, error: validation.error };
    }

    // 移除手牌
    player.hand = PlayValidator.removePlayedCards(player, cards);

    // 更新游戏状态
    this.state.lastPlay = validation.play;
    this.state.lastPlayPlayerIndex = playerIndex;
    this.state.currentPlay = validation.play;

    // 记录出牌历史
    if (!this.state.playHistory) {
      this.state.playHistory = [];
    }
    this.state.playHistory.push(validation.play);

    // 更新当前轮出牌记录
    this.state.currentTrick.push({
      playerIndex: playerIndex,
      play: validation.play
    });

    // 检查是否有人出完牌
    if (player.hand.length === 0) {
      this.endRound(playerIndex);
      return { success: true };
    }

    // 移动到下一个玩家
    this.moveToNextPlayer();

    // 检查是否需要重置出牌（所有人都pass或出完一轮）
    this.checkRoundReset();

    return { success: true };
  }

  /**
   * 玩家不出
   */
  pass(playerIndex: number): { success: boolean; error?: string } {
    const player = this.state.players[playerIndex];

    // 如果没有上家出牌，不能不出
    if (!this.state.lastPlay) {
      return { success: false, error: '不能不出' };
    }

    const lastPlayer = this.state.lastPlayPlayerIndex >= 0
      ? this.state.players[this.state.lastPlayPlayerIndex]
      : null;

    const isTeammate = lastPlayer && lastPlayer.team === player.team;

    // 如果是队友出的牌，可以不出；否则检查是否有能压过的牌
    if (!isTeammate) {
      // 简化：允许不出
    }

    // 记录不出
    this.state.currentTrick.push({
      playerIndex: playerIndex,
      play: null
    });

    // 移动到下一个玩家
    this.moveToNextPlayer();

    // 检查是否需要重置出牌
    this.checkRoundReset();

    return { success: true };
  }

  /**
   * 移动到下一个玩家
   */
  private moveToNextPlayer(): void {
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % PLAYER_COUNT;
  }

  /**
   * 检查是否需要重置出牌轮次
   * 规则：当回到最后一个出牌的玩家时，表示所有人都pass或出完一轮，应重置出牌状态
   */
  private checkRoundReset(): void {
    // 如果回到最后一个出牌的玩家，重置（所有人都pass或出完一轮）
    if (this.state.currentPlayerIndex === this.state.lastPlayPlayerIndex && this.state.lastPlayPlayerIndex >= 0) {
      this.state.lastPlay = null;
      this.state.lastPlayPlayerIndex = -1;
      this.state.currentPlay = null;
      this.state.currentTrick = []; // 重置当前轮出牌记录
    }
  }

  /**
   * 计算玩家排名（根据手牌数，0张为头游，最多为末游）
   * @returns 玩家索引数组，按排名从高到低（头游到末游）
   */
  private calculatePlayerRankings(): number[] {
    // 创建玩家索引和手牌数的映射
    const playerCards = this.state.players.map((player, index) => ({
      index,
      cardCount: player.hand.length
    }));

    // 按手牌数排序（少的在前，多的在后）
    playerCards.sort((a, b) => a.cardCount - b.cardCount);

    // 返回排序后的玩家索引数组
    return playerCards.map(p => p.index);
  }

  /**
   * 结束一轮
   */
  private endRound(winnerIndex: number): void {
    const winner = this.state.players[winnerIndex];
    this.state.roundWinner = winnerIndex;
    this.state.phase = GamePhase.ROUND_END;

    // 更新队伍得分
    const winnerTeam = winner.team;
    this.state.teamScores[winnerTeam]++;

    // 计算玩家排名（头游到末游）
    const rankings = this.calculatePlayerRankings();
    const headPlayerIndex = rankings[0]; // 头游
    const lastPlayerIndex = rankings[rankings.length - 1]; // 末游

    // 检查是否游戏结束
    // 规则：从2打到A，2不必打，A必打
    // 如果打到A，必须一名为头游，另一名不能为末游，才可以最终算过A赢得本局
    if (this.state.level === 'A') {
      const headPlayer = this.state.players[headPlayerIndex];
      const lastPlayer = this.state.players[lastPlayerIndex];
      const headPlayerTeam = headPlayer.team;

      // 检查是否满足过A条件：头游是我方，且末游不是我方
      if (headPlayerTeam === winnerTeam && lastPlayer.team !== winnerTeam) {
        // 过A成功，游戏结束
        this.state.phase = GamePhase.GAME_END;
        return;
      } else {
        // 未过A，继续下一轮（不升级，继续打A）
        this.startNextRound(0); // 升0级，继续打A
        return;
      }
    }

    // 计算升级数
    const levelUp = this.calculateLevelUp(rankings, winnerTeam);
    
    // 开始下一轮（升级）
    this.startNextRound(levelUp);
  }

  /**
   * 计算升级数
   * 规则：
   * - 双下（对手两家都是末游）：升3级
   * - 对手有一家是末游：升2级
   * - 自己对门是末游：升1级
   * @param rankings 玩家排名数组（头游到末游）
   * @param winnerTeam 获胜队伍
   * @returns 升级数
   */
  private calculateLevelUp(rankings: number[], winnerTeam: number): number {
    // 获取末游玩家
    const lastPlayerIndex = rankings[rankings.length - 1];
    const lastPlayer = this.state.players[lastPlayerIndex];
    const lastPlayerTeam = lastPlayer.team;

    // 获取倒数第二的玩家（如果有）
    const secondLastPlayerIndex = rankings[rankings.length - 2];
    const secondLastPlayer = this.state.players[secondLastPlayerIndex];
    const secondLastPlayerTeam = secondLastPlayer.team;

    // 判断是否双下（对手两家都是末游）
    if (lastPlayerTeam !== winnerTeam && secondLastPlayerTeam !== winnerTeam) {
      return 3; // 双下升3级
    }

    // 判断对手是否有一家是末游
    if (lastPlayerTeam !== winnerTeam) {
      return 2; // 对手末游升2级
    }

    // 判断自己对门是否是末游
    // 找到队友索引（对面是队友）
    const winnerIndex = rankings[0]; // 头游是获胜者
    const teammateIndex = (winnerIndex + 2) % PLAYER_COUNT;
    if (lastPlayerIndex === teammateIndex) {
      return 1; // 对门末游升1级
    }

    // 默认升1级（正常情况下不应该到这里）
    return 1;
  }

  /**
   * 开始下一轮
   * @param levelUp 升级数（0表示不升级，继续当前级别）
   */
  private startNextRound(levelUp: number): void {
    const currentLevelIndex = LEVEL_ORDER.indexOf(this.state.level);

    // 如果当前是2级，2不必打，直接升到3级
    if (this.state.level === '2') {
      if (currentLevelIndex < LEVEL_ORDER.length - 1) {
        this.state.level = LEVEL_ORDER[currentLevelIndex + 1]; // 升到3级
      }
    } else if (levelUp > 0) {
      // 根据升级数升级
      const newLevelIndex = Math.min(currentLevelIndex + levelUp, LEVEL_ORDER.length - 1);
      this.state.level = LEVEL_ORDER[newLevelIndex];
    }
    // 如果 levelUp === 0，保持当前级别（用于A级未过的情况）

    // 重新发牌
    this.dealCards();
    this.state.phase = GamePhase.PLAYING;
    this.state.currentPlayerIndex = 0;
    this.state.lastPlay = null;
    this.state.lastPlayPlayerIndex = -1;
    this.state.currentPlay = null;
    this.state.currentTrick = []; // 重置当前轮出牌记录
    this.state.roundWinner = null;
  }

  /**
   * 获取当前游戏状态
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * 获取当前玩家
   */
  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  /**
   * 获取玩家
   */
  getPlayer(index: number): Player {
    return this.state.players[index];
  }

  /**
   * 更新玩家手牌（用于AI）
   */
  updatePlayerHand(playerIndex: number, hand: Card[]): void {
    this.state.players[playerIndex].hand = hand;
  }
}
