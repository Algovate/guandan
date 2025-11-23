import type { Card, Play, Player } from './types';
import { createPlay, canBeat } from './CardTypes';
import { removeCardsFromHand } from '../utils/helpers';

/**
 * 验证出牌是否合法
 */
export class PlayValidator {
  /**
   * 验证玩家是否可以出这些牌
   * @param player 玩家
   * @param cards 要出的牌
   * @param lastPlay 上家出的牌（null表示首家出牌）
   * @returns 验证结果和Play对象
   */
  static validatePlay(
    player: Player,
    cards: Card[],
    lastPlay: Play | null
  ): { valid: boolean; play: Play | null; error?: string } {
    // 检查是否为空
    if (cards.length === 0) {
      return { valid: false, play: null, error: '请选择要出的牌' };
    }

    // 检查玩家是否拥有这些牌
    const hasAllCards = cards.every(card =>
      player.hand.some(h => h.id === card.id)
    );
    if (!hasAllCards) {
      return { valid: false, play: null, error: '您没有这些牌' };
    }

    // 识别牌型
    const play = createPlay(cards);
    if (!play) {
      return { valid: false, play: null, error: '不是合法的牌型' };
    }

    // 如果是首家出牌，直接合法
    if (!lastPlay) {
      return { valid: true, play };
    }

    // 检查是否能压过上家
    if (!canBeat(play, lastPlay)) {
      return { valid: false, play, error: '不能压过上家的牌' };
    }

    return { valid: true, play };
  }

  /**
   * 检查玩家是否可以不出
   * @param player 玩家
   * @param lastPlay 上家出的牌
   * @param isTeammateLastPlay 上家是否是队友
   * @returns 是否可以不出
   */
  static canPass(
    _player: Player,
    lastPlay: Play | null,
    isTeammateLastPlay: boolean
  ): boolean {
    // 如果没有上家出牌，不能不出
    if (!lastPlay) {
      return false;
    }

    // 如果是队友出的牌，可以不出
    if (isTeammateLastPlay) {
      return true;
    }

    // 检查是否有能压过的牌
    // 简化：总是允许不出（实际应该检查是否有能压过的牌）
    return true;
  }

  /**
   * 从手牌中移除已出的牌
   */
  static removePlayedCards(player: Player, cards: Card[]): Card[] {
    return removeCardsFromHand(player.hand, cards);
  }
}
