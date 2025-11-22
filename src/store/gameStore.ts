import { create } from 'zustand';
import type { GameState, Card } from '../game/types';
import { GameStateManager } from '../game/GameState';
import { AIDifficulty, GamePhase } from '../game/types';
import { AIPlayerManager } from '../ai/AIPlayer';
import { createPlay } from '../game/CardTypes';
import { PLAY_TYPE_NAMES } from '../utils/constants';

interface GameStore {
  // 游戏状态
  gameState: GameState | null;
  gameManager: GameStateManager | null;
  aiManager: AIPlayerManager | null;
  
  // UI状态
  selectedCards: Card[];
  aiDifficulty: AIDifficulty;
  showTutorial: boolean;
  showSettings: boolean;
  isAITurn: boolean;
  toastMessage: { message: string; type?: 'success' | 'error' | 'info' | 'warning' } | null;
  
  // Actions
  initGame: () => void;
  startGame: () => void;
  selectCard: (card: Card) => void;
  deselectCard: (card: Card) => void;
  clearSelection: () => void;
  playCards: (cards: Card[]) => { success: boolean; error?: string };
  pass: () => { success: boolean; error?: string };
  callMain: () => void;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  toggleTutorial: () => void;
  toggleSettings: () => void;
  updateGameState: () => void;
  processAITurn: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  gameManager: null,
  aiManager: null,
  selectedCards: [],
  aiDifficulty: AIDifficulty.MEDIUM,
  showTutorial: false,
  showSettings: false,
  isAITurn: false,
  toastMessage: null,
  
  initGame: () => {
    const { aiDifficulty } = get();
    const manager = new GameStateManager();
    const aiManager = new AIPlayerManager(aiDifficulty);
    set({ 
      gameManager: manager, 
      aiManager,
      gameState: manager.getState(), 
      selectedCards: [],
      isAITurn: false
    });
  },
  
  startGame: () => {
    const { gameManager, aiManager } = get();
    if (!gameManager) return;
    gameManager.startNewGame();
    gameManager.callMain();
    const newState = gameManager.getState();
    set({ gameState: newState });
    
    // 初始化AI管理器
    if (!aiManager) {
      const newAIManager = new AIPlayerManager(get().aiDifficulty);
      set({ aiManager: newAIManager });
    }
    
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
  
  playCards: (cards: Card[]) => {
    const { gameManager, gameState } = get();
    if (!gameManager || !gameState) {
      return { success: false, error: '游戏未初始化' };
    }
    
    // 找到玩家索引（bottom位置）
    const playerIndex = gameState.players.findIndex(p => !p.isAI);
    if (playerIndex === -1) {
      return { success: false, error: '找不到玩家' };
    }
    
    const result = gameManager.playCards(playerIndex, cards);
    if (result.success) {
      const newState = gameManager.getState();
      set({ 
        gameState: newState, 
        selectedCards: [] 
      });
      
      // 显示成功提示
      if (cards.length > 0) {
        const play = createPlay(cards, newState.mainRank || undefined, newState.mainSuit || undefined);
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
  
  setAIDifficulty: (difficulty: AIDifficulty) => {
    const { aiManager } = get();
    if (aiManager) {
      aiManager.setDifficulty(difficulty);
    }
    set({ aiDifficulty: difficulty });
  },
  
  toggleTutorial: () => {
    set(state => ({ showTutorial: !state.showTutorial }));
  },
  
  toggleSettings: () => {
    set(state => ({ showSettings: !state.showSettings }));
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
    const { gameState, gameManager, aiManager, isAITurn } = get();
    if (!gameState || !gameManager || !aiManager || isAITurn) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer || !currentPlayer.isAI) {
      set({ isAITurn: false });
      return;
    }
    
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
