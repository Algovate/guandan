import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../game/types';
import { RANK_NAMES, SUIT_NAMES } from '../utils/constants';
import { sortCards } from '../utils/helpers';

interface AllHandsProps {
    players: Player[];
    mainRank?: any;
    mainSuit?: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function AllHands({ players, mainRank, mainSuit, isOpen, onClose }: AllHandsProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[80vh] overflow-y-auto mx-4"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <div className="glass rounded-3xl shadow-2xl border-2 border-accent-gold/40 p-6 md:p-8 relative overflow-hidden"
                            style={{
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                            }}
                        >
                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/8 via-transparent to-ui-primary/8 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                {/* Title */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl">👁️</div>
                                        <div>
                                            <h2 className="text-3xl font-display font-bold text-gray-800">各家手牌</h2>
                                            <div className="text-sm text-gray-600 mt-1">教学模式专用</div>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold transition-colors"
                                    >
                                        ×
                                    </motion.button>
                                </div>

                                {/* Players' hands */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {players.map((player, index) => {
                                        const sortedHand = sortCards([...player.hand], mainRank, mainSuit);

                                        return (
                                            <motion.div
                                                key={player.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white/60 rounded-xl p-4 border border-gray-200"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-2xl">{player.avatar || '👤'}</span>
                                                    <div>
                                                        <div className="font-bold text-gray-800">{player.name}</div>
                                                        <div className="text-xs text-gray-600">
                                                            {player.position.toUpperCase()} · {player.hand.length} 张牌
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1">
                                                    {sortedHand.map((card, cardIndex) => (
                                                        <span
                                                            key={`${player.id}-${cardIndex}`}
                                                            className="inline-flex items-center gap-0.5 px-2 py-1 bg-white rounded border border-gray-300 text-xs font-medium"
                                                        >
                                                            <span className={card.suit === 'heart' || card.suit === 'diamond' ? 'text-red-600' : 'text-gray-800'}>
                                                                {SUIT_NAMES[card.suit]}
                                                            </span>
                                                            <span className="text-gray-800">{RANK_NAMES[card.rank]}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Close button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="btn-primary w-full mt-6 text-lg py-3"
                                >
                                    关闭
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
