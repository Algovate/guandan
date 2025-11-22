import { useGameStore } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card } from '../game/types';

/**
 * 调试面板 - 显示所有玩家手牌和出牌历史
 */
export default function DebugPanel() {
    const { gameState, showDebug, toggleDebug } = useGameStore();

    if (!gameState) return null;

    const renderCard = (card: Card, index: number) => (
        <div
            key={`${card.id}-${index}`}
            className="inline-block px-2 py-1 bg-white rounded text-xs font-mono border border-gray-300 mr-1 mb-1"
        >
            <span className={card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-gray-800'}>
                {card.rank}
                {card.suit === 'spade' && '♠'}
                {card.suit === 'heart' && '♥'}
                {card.suit === 'diamond' && '♦'}
                {card.suit === 'club' && '♣'}
                {card.suit === 'joker' && (card.rank === 'joker_big' ? '🃏' : '🂿')}
            </span>
        </div>
    );

    return (
        <>
            {/* 切换按钮 */}
            <button
                onClick={toggleDebug}
                className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
                {showDebug ? '🔍 隐藏调试' : '🔍 调试模式'}
            </button>

            {/* 调试面板 */}
            <AnimatePresence>
                {showDebug && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-16 right-4 z-40 bg-white rounded-lg shadow-2xl border-2 border-gray-200 max-w-2xl max-h-[80vh] overflow-y-auto"
                    >
                        <div className="p-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                                🔍 调试信息
                            </h2>

                            {/* 所有玩家手牌 */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700">玩家手牌</h3>
                                {gameState.players.map((player, index) => (
                                    <div key={player.id} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${index === gameState.currentPlayerIndex ? 'text-green-600' : 'text-gray-700'}`}>
                                                    {player.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({player.position})
                                                </span>
                                                {player.isAI && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                        AI
                                                    </span>
                                                )}
                                                {index === gameState.currentPlayerIndex && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                        当前
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-600">
                                                {player.hand.length} 张牌
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap">
                                            {player.hand.map((card, idx) => renderCard(card, idx))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 出牌历史 */}
                            {gameState.playHistory && gameState.playHistory.length > 0 && (
                                <div className="mt-6 space-y-3">
                                    <h3 className="font-semibold text-gray-700">出牌历史</h3>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {[...gameState.playHistory].reverse().map((play, index) => (
                                            <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-gray-700">
                                                        #{gameState.playHistory!.length - index}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {play.type}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap">
                                                    {play.cards.map((card, idx) => renderCard(card, idx))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 游戏状态 */}
                            <div className="mt-6 bg-gray-50 rounded p-3">
                                <h3 className="font-semibold text-gray-700 mb-2">游戏状态</h3>
                                <div className="text-sm space-y-1 text-gray-600">
                                    <div>阶段: <span className="font-mono">{gameState.phase}</span></div>
                                    <div>主牌: <span className="font-mono">{gameState.mainRank || '未定'} {gameState.mainSuit || ''}</span></div>
                                    <div>等级: <span className="font-mono">{gameState.level}</span></div>
                                    <div>队伍得分: <span className="font-mono">[{gameState.teamScores[0]}, {gameState.teamScores[1]}]</span></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
