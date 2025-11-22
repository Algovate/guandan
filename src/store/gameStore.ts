import { create } from 'zustand';
import type { GameState, Card } from '../game/types';
import { GameStateManager } from '../game/GameState';
import { GamePhase, GameMode } from '../game/types';
import { AIPlayerManager } from '../ai/AIPlayer';
import { createPlay } from '../game/CardTypes';
import { PLAY_TYPE_NAMES } from '../utils/constants';
import { StrategyEngine } from '../game/ai/StrategyEngine';
import { soundManager, SoundEffect } from '../utils/SoundManager';
import { PersonalityType } from '../game/ai/AIPersonality';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  gameManager: GameStateManager | null;
  aiManager: AIPlayerManager | null;

  // UI状态
  selectedCards: Card[];
  gameMode: GameMode;
  showTutorial: boolean;
  showSettings: boolean;
  showDebug: boolean;
  isAITurn: boolean;
  toastMessage: { message: string; type?: 'success' | 'error' | 'info' | 'warning' } | null;
  soundEnabled: boolean;
  soundVolume: number;

  // Actions
  initGame: () => void;
  startGame: () => void;
  selectCard: (card: Card) => void;
  deselectCard: (card: Card) => void;
  clearSelection: () => void;
  playCards: () => { success: boolean; error?: string }; // Modified signature
  pass: () => { success: boolean; error?: string };
  callMain: () => void;
  setGameMode: (mode: GameMode) => void;
  getHint: () => void;
  toggleTutorial: () => void;
  toggleSettings: () => void;
  toggleDebug: () => void;
  updateGameState: () => void;
  processAITurn: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  gameManager: null,
  aiManager: null,
  selectedCards: [],
  gameMode: GameMode.COMPETITIVE,
  showTutorial: false,
  showSettings: false,
  showDebug: false,
  isAITurn: false,
  toastMessage: null,
  soundEnabled: true,
  soundVolume: 0.5,

  initGame: () => {
    const manager = new GameStateManager();
    // AI管理器会在需要时根据player的personality创建
    set({
      gameManager: manager,
      aiManager: null,
      gameState: manager.getState(),
      selectedCards: [],
      isAITurn: false
    });
  },

  startGame: () => {
    const { gameManager } = get();
    if (!gameManager) return;
    gameManager.startNewGame();
    gameManager.callMain();
    const newState = gameManager.getState();
    set({ gameState: newState });

    // 如果是AI轮次，开始处理
    if (newState.phase === GamePhase.PLAYING) {
      const currentPlayer = newState.players[newState.currentPlayerIndex];
      if (currentPlayer.isAI) {
        setTimeout(() => get().processAITurn(), 500);
      }
    }
  },

  selectCard: (card: Card) => {
    const { selectedCards } = get();
    const isSelected = selectedCards.some(c => c.id === card.id);

    soundManager.play(SoundEffect.CARD_SELECT);

    if (isSelected) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
    } else {
      set({ selectedCards: [...selectedCards, card] });
    }
  },

  deselectCard: (card: Card) => {
    const { selectedCards } = get();
    set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
  },

  clearSelection: () => {
    set({ selectedCards: [] });
  },

  playCards: () => { // Modified implementation
    const { gameManager, gameState, selectedCards } = get();
    if (!gameManager || !gameState) {
      return { success: false, error: '游戏未初始化' };
    }

    soundManager.play(SoundEffect.CARD_PLAY);

    // 找到玩家索引（bottom位置）
    const playerIndex = gameState.players.findIndex(p => !p.isAI);
    if (playerIndex === -1) {
      return { success: false, error: '找不到玩家' };
    }

    const result = gameManager.playCards(playerIndex, selectedCards); // Use selectedCards
    if (result.success) {
      const newState = gameManager.getState();
      set({
        gameState: newState,
        selectedCards: []
      });

      // 显示成功提示
      if (selectedCards.length > 0) {
        const play = createPlay(selectedCards, newState.mainRank || undefined, newState.mainSuit || undefined);
        if (play) {
          get().showToast(`出牌成功：${PLAY_TYPE_NAMES[play.type] || ''}`, 'success');
        }
      }

      // 触发AI轮次
      if (newState.phase === GamePhase.PLAYING && !get().isAITurn) {
        setTimeout(() => get().processAITurn(), 500);
      }
    } else if (result.error) {
      get().showToast(result.error, 'error');
    }
    return result;
  },

  pass: () => {
    const { gameManager, gameState } = get();
    if (!gameManager || !gameState) {
      return { success: false, error: '游戏未初始化' };
    }

    const playerIndex = gameState.players.findIndex(p => !p.isAI);
    if (playerIndex === -1) {
      return { success: false, error: '找不到玩家' };
    }

    const result = gameManager.pass(playerIndex);
    if (result.success) {
      const newState = gameManager.getState();
      set({ gameState: newState });
      get().showToast('已选择不出', 'info');

      // 触发AI轮次
      if (newState.phase === GamePhase.PLAYING && !get().isAITurn) {
        setTimeout(() => get().processAITurn(), 500);
      }
    } else if (result.error) {
      get().showToast(result.error, 'error');
    }
    return result;
  },

  callMain: () => {
    const { gameManager } = get();
    if (!gameManager) return;
    gameManager.callMain();
    set({ gameState: gameManager.getState() });
  },

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode });
    get().showToast(`已切换至${mode === GameMode.COMPETITIVE ? '竞技' : '教学'}模式`, 'success');
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    soundManager.setEnabled(enabled);
  },

  setSoundVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set({ soundVolume: clampedVolume });
    soundManager.setVolume(clampedVolume);
  },

  getHint: () => {
    const { gameState, gameMode } = get();
    if (!gameState || gameMode !== GameMode.TEACHING) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isAI) return;

    // 使用策略引擎获取建议（使用均衡型性格作为提示）
    const suggestedCards = StrategyEngine.decideMove(
      currentPlayer,
      gameState
    );

    if (suggestedCards && suggestedCards.length > 0) {
      set({ selectedCards: suggestedCards });
      get().showToast('已为您选择推荐牌型', 'info');
    } else {
      // 如果建议是过牌（null），且当前必须出牌（首出），这通常不应该发生，除非没牌了
      // 如果是跟牌且建议过牌，提示"建议不出"
      if (gameState.lastPlay && gameState.lastPlayPlayerIndex !== gameState.currentPlayerIndex) {
        get().showToast('建议不出', 'info');
        set({ selectedCards: [] });
      } else {
        get().showToast('没有更好的出牌建议', 'info');
      }
    }
  },

  toggleTutorial: () => {
    set(state => ({ showTutorial: !state.showTutorial }));
  },

  toggleSettings: () => {
    set(state => ({ showSettings: !state.showSettings }));
  },

  toggleDebug: () => {
    set(state => ({ showDebug: !state.showDebug }));
  },

  updateGameState: () => {
    const { gameManager } = get();
    if (gameManager) {
      const newState = gameManager.getState();
      set({ gameState: newState });

      // 检查是否是AI轮次
      if (newState.phase === GamePhase.PLAYING) {
        const currentPlayer = newState.players[newState.currentPlayerIndex];
        if (currentPlayer.isAI) {
          get().processAITurn();
        }
      }
    }
  },

  processAITurn: async () => {
    const { gameState, gameManager, isAITurn } = get();
    if (!gameState || !gameManager || isAITurn) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) {
      set({ isAITurn: false });
      return;
    }

    // 为当前AI玩家创建或获取AI管理器（根据player的personality）
    const personalityType = currentPlayer.personality 
      ? (currentPlayer.personality as PersonalityType)
      : undefined;
    const aiManager = new AIPlayerManager(personalityType);

    set({ isAITurn: true });

    try {
      await aiManager.makeMove(
        currentPlayer,
        gameState,
        (playerIndex, cards) => {
          const result = gameManager.playCards(playerIndex, cards);
          const newState = gameManager.getState();
          set({ gameState: newState, isAITurn: false });

          // 继续处理下一个玩家
          if (newState.phase === GamePhase.PLAYING && newState.players[newState.currentPlayerIndex]?.isAI) {
            setTimeout(() => get().processAITurn(), 500);
          }
          return result;
        },
        (playerIndex) => {
          const result = gameManager.pass(playerIndex);
          const newState = gameManager.getState();
          set({ gameState: newState, isAITurn: false });

          // 继续处理下一个玩家
          if (newState.phase === GamePhase.PLAYING && newState.players[newState.currentPlayerIndex]?.isAI) {
            setTimeout(() => get().processAITurn(), 500);
          }
          return result;
        }
      );
    } catch (error) {
      console.error('AI move error:', error);
      set({ isAITurn: false });
    }
  },

  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => {
    if (!message) return;
    set({ toastMessage: { message, type } });
    setTimeout(() => set({ toastMessage: null }), 3000);
  },
}));
