import React from 'react';
import { motion } from 'framer-motion';
import { LoreEntry } from '../../types/world';
import { BookOpen, Lock } from 'lucide-react';

interface LoreGridProps {
    lore: LoreEntry[];
    isDM: boolean;
    onDiscover?: (id: number) => void;
}

export const LoreGrid: React.FC<LoreGridProps> = ({ lore, isDM, onDiscover }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lore.map((entry) => (
                <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden ${
                        !entry.is_discovered && !isDM ? 'hidden' : ''
                    }`}
                >
                    {!entry.is_discovered && isDM && (
                        <div className="absolute top-4 right-4 text-red-500 flex items-center space-x-2 text-xs font-mono">
                            <Lock className="w-4 h-4" />
                            <span>Undiscovered</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                            <BookOpen className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-100">{entry.title}</h3>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">{entry.category}</p>
                        </div>
                    </div>
                    <div className="prose prose-invert prose-sm">
                        <p className="text-zinc-400 line-clamp-4">{entry.content}</p>
                    </div>
                    {isDM && !entry.is_discovered && (
                        <button
                            onClick={() => onDiscover?.(entry.id)}
                            className="mt-4 w-full py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors font-mono text-sm"
                        >
                            REVEAL TO PLAYERS
                        </button>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
