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
   */
  private checkRoundReset(): void {
    // 如果回到最后一个出牌的玩家，重置（所有人都pass或出完一轮）
    // 简化：连续3个玩家pass就重置
    // 实际应该跟踪pass次数
    if (this.state.currentPlayerIndex === this.state.lastPlayPlayerIndex && this.state.lastPlayPlayerIndex >= 0) {
      this.state.lastPlay = null;
      this.state.lastPlayPlayerIndex = -1;
      this.state.lastPlay = null;
      this.state.lastPlayPlayerIndex = -1;
      this.state.currentPlay = null;
      this.state.currentTrick = []; // 重置当前轮出牌记录
    }
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

    // 检查是否游戏结束
    // 规则：从2打到A，2不必打，A必打
    // 如果打到A，必须一名为头游，另一名不能为末游，才可以最终算过A赢得本局
    const currentLevelIndex = LEVEL_ORDER.indexOf(this.state.level);

    // 如果在A级，需要检查是否满足过A条件
    if (this.state.level === 'A') {
      // 简化实现：如果当前是A级且赢了，需要队友不是末游
      // 这里需要更复杂的逻辑来判断头游和末游，暂时简化处理
      // 如果A级赢了，游戏结束
      this.state.phase = GamePhase.GAME_END;
    } else if (currentLevelIndex >= LEVEL_ORDER.length - 1) {
      // 已经到A级了
      this.state.phase = GamePhase.GAME_END;
    } else {
      // 开始下一轮（升级）
      this.startNextRound();
    }
  }

  /**
   * 开始下一轮
   * 规则：双下升3级，对手有一家是末游升2级，自己对门是末游升1级
   * 简化实现：每次升1级（可以根据实际情况扩展）
   */
  private startNextRound(): void {
    // 升级
    const currentLevelIndex = LEVEL_ORDER.indexOf(this.state.level);

    // 2不必打，可以直接跳过
    if (this.state.level === '2') {
      // 如果当前是2级，直接升到3级（2不必打）
      if (currentLevelIndex < LEVEL_ORDER.length - 1) {
        this.state.level = LEVEL_ORDER[currentLevelIndex + 1];
      }
    } else {
      // 其他级别正常升级
      if (currentLevelIndex < LEVEL_ORDER.length - 1) {
        this.state.level = LEVEL_ORDER[currentLevelIndex + 1];
      }
    }

    // 重新发牌
    this.dealCards();
    this.state.phase = GamePhase.PLAYING;
    this.state.currentPlayerIndex = 0;
    this.state.lastPlay = null;
    this.state.lastPlayPlayerIndex = -1;
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
