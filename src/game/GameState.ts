import type {
  GameState,
  Player,
  Card
} from './types';
import {
  GamePhase,
  PlayerPosition,
  Rank,
  Suit
} from './types';
import { Deck } from './Deck';
import { PlayValidator } from './PlayValidator';
import { CARDS_PER_PLAYER, PLAYER_COUNT, LEVEL_ORDER } from '../utils/constants';
import { generateId } from '../utils/helpers';

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
    return {
      phase: GamePhase.WAITING,
      players: this.createPlayers(),
      currentPlayerIndex: 0,
      currentPlay: null,
      lastPlay: null,
      lastPlayPlayerIndex: -1,
      level: 'A',
      mainSuit: null,
      mainRank: null,
      deck: [],
      teamScores: [0, 0],
      roundWinner: null,
      playHistory: [], // 初始化出牌历史
    };
  }

  /**
   * 创建玩家
   */
  private createPlayers(): Player[] {
    return [
      {
        id: generateId(),
        name: '诸葛亮',
        position: PlayerPosition.TOP,
        hand: [],
        isAI: true,
        team: 0,
        avatar: '🧙‍♂️'
      },
      {
        id: generateId(),
        name: '曹操',
        position: PlayerPosition.LEFT,
        hand: [],
        isAI: true,
        team: 1,
        avatar: '😈'
      },
      {
        id: generateId(),
        name: '孙权',
        position: PlayerPosition.RIGHT,
        hand: [],
        isAI: true,
        team: 1,
        avatar: '🦁'
      },
      {
        id: generateId(),
        name: '刘备',
        position: PlayerPosition.BOTTOM,
        hand: [],
        isAI: false,
        team: 0,
        avatar: '👑'
      },
    ];
  }

  /**
   * 开始新游戏
   */
  startNewGame(): void {
    this.state = this.createInitialState();
    this.dealCards();
    this.state.phase = GamePhase.CALLING_MAIN;
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
   * 叫主（简化：自动选择第一个出现的A作为主牌）
   */
  callMain(): void {
    // 简化实现：找到第一个A作为主牌
    const player = this.state.players[this.state.currentPlayerIndex];
    const aceCard = player.hand.find(card => card.rank === Rank.ACE);

    if (aceCard) {
      this.state.mainRank = Rank.ACE;
      this.state.mainSuit = aceCard.suit;
    } else {
      // 如果没有A，随机选择一个花色
      const suits: Suit[] = [Suit.SPADE, Suit.HEART, Suit.DIAMOND, Suit.CLUB];
      this.state.mainRank = Rank.ACE;
      this.state.mainSuit = suits[Math.floor(Math.random() * suits.length)] || Suit.SPADE;
    }

    this.state.phase = GamePhase.PLAYING;
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
      this.state.lastPlay,
      this.state.mainRank || undefined,
      this.state.mainSuit || undefined
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
      this.state.currentPlay = null;
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

    // 检查是否游戏结束（先到K的队伍获胜）
    const currentLevelIndex = LEVEL_ORDER.indexOf(this.state.level);
    if (currentLevelIndex >= LEVEL_ORDER.length - 1) {
      this.state.phase = GamePhase.GAME_END;
    } else if (this.state.teamScores[winnerTeam] >= 2) {
      // 简化：得分达到2就结束
      this.state.phase = GamePhase.GAME_END;
    } else {
      // 开始下一轮
      this.startNextRound();
    }
  }

  /**
   * 开始下一轮
   */
  private startNextRound(): void {
    // 升级
    const currentLevelIndex = LEVEL_ORDER.indexOf(this.state.level);
    if (currentLevelIndex < LEVEL_ORDER.length - 1) {
      this.state.level = LEVEL_ORDER[currentLevelIndex + 1];
    }

    // 重新发牌
    this.dealCards();
    this.state.phase = GamePhase.CALLING_MAIN;
    this.state.currentPlayerIndex = 0;
    this.state.lastPlay = null;
    this.state.lastPlayPlayerIndex = -1;
    this.state.currentPlay = null;
    this.state.roundWinner = null;
    this.state.mainSuit = null;
    this.state.mainRank = null;
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
