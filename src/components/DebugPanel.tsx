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
            className="inline-flex items-center justify-center w-8 h-10 bg-gray-100 rounded text-[10px] font-bold border border-gray-300 mr-1 mb-1 shadow-sm"
        >
            <span className={card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-black'}>
                {card.rank}
                <span className="block text-[8px] leading-none">
                    {card.suit === 'spade' && '♠'}
                    {card.suit === 'heart' && '♥'}
                    {card.suit === 'diamond' && '♦'}
                    {card.suit === 'club' && '♣'}
                    {card.suit === 'joker' && (card.rank === 'joker_big' ? '🃏' : '🂿')}
                </span>
            </span>
        </div>
    );

    return (
        <>
            {/* 切换按钮 */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDebug}
                className="fixed top-4 right-20 md:right-32 z-50 btn-casino-secondary px-4 py-2 text-xs md:text-sm shadow-lg flex items-center gap-2"
            >
                <span>{showDebug ? '🚫' : '🔍'}</span>
                <span className="hidden md:inline">{showDebug ? 'HIDE DEBUG' : 'DEBUG MODE'}</span>
            </motion.button>

            {/* 调试面板 */}
            <AnimatePresence>
                {showDebug && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="fixed top-20 right-4 bottom-4 z-40 w-full max-w-md glass-panel overflow-hidden flex flex-col border border-[#d4af37]/30"
                    >
                        <div className="p-4 border-b border-white/10 bg-black/20">
                            <h2 className="text-lg font-bold text-gold-metallic flex items-center gap-2">
                                🔍 DEBUG CONSOLE
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                            {/* 游戏状态 */}
                            <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Game State</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="text-gray-400">Phase:</div>
                                    <div className="text-white font-mono">{gameState.phase}</div>
                                    <div className="text-gray-400">Trump:</div>
                                    <div className="text-gold-metallic font-mono font-bold">
                                        {gameState.mainRank || '-'} {gameState.mainSuit || ''}
                                    </div>
                                    <div className="text-gray-400">Level:</div>
                                    <div className="text-white font-mono">{gameState.level}</div>
                                    <div className="text-gray-400">Scores:</div>
                                    <div className="text-white font-mono">[{gameState.teamScores[0]}, {gameState.teamScores[1]}]</div>
                                </div>
                            </div>

                            {/* 所有玩家手牌 */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Player Hands</h3>
                                {gameState.players.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className={`rounded-xl p-3 border ${index === gameState.currentPlayerIndex
                                                ? 'bg-[#d4af37]/10 border-[#d4af37]/50'
                                                : 'bg-black/30 border-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${index === gameState.currentPlayerIndex ? 'text-gold-metallic' : 'text-gray-300'}`}>
                                                    {player.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({player.position})
                                                </span>
                                                {player.isAI && (
                                                    <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                                                        AI
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 font-mono">
                                                {player.hand.length} cards
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
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Play History</h3>
                                    <div className="space-y-2">
                                        {[...gameState.playHistory].reverse().map((play, index) => (
                                            <div key={index} className="bg-black/30 rounded-lg p-2 border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-mono text-gray-500">
                                                        #{gameState.playHistory!.length - index}
                                                    </span>
                                                    <span className="text-xs text-gold-metallic">
                                                        {play.type}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap scale-90 origin-top-left">
                                                    {play.cards.map((card, idx) => renderCard(card, idx))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
