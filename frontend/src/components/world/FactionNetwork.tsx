import React from 'react';
import { motion } from 'framer-motion';
import { Faction } from '../../types/world';
import { Shield, Lock } from 'lucide-react';

interface FactionNetworkProps {
    factions: Faction[];
    isDM: boolean;
    onDiscover?: (id: number) => void;
}

export const FactionNetwork: React.FC<FactionNetworkProps> = ({ factions, isDM, onDiscover }) => {
    return (
        <div className="space-y-6">
            {factions.map((faction) => (
                <motion.div
                    key={faction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm ${
                        !faction.is_discovered && !isDM ? 'hidden' : ''
                    }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-900/20 rounded-xl border border-red-900/50">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-100">{faction.name}</h3>
                                <p className="text-sm text-zinc-500">Leader: <span className="text-zinc-300">{faction.leader}</span></p>
                            </div>
                        </div>
                        {!faction.is_discovered && isDM && (
                            <button
                                onClick={() => onDiscover?.(faction.id)}
                                className="px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-lg transition-colors flex items-center space-x-2 font-mono text-sm"
                            >
                                <Lock className="w-4 h-4" />
                                <span>REVEAL FACTION</span>
                            </button>
                        )}
                    </div>
                    <p className="text-zinc-400 mb-6">{faction.description}</p>
                    
                    {faction.relationships && Object.keys(faction.relationships).length > 0 && (
                        <div className="bg-zinc-950 rounded-lg p-4">
                            <h4 className="text-xs font-mono text-zinc-500 mb-3 uppercase tracking-wider">Known Relationships</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(faction.relationships).map(([target, status]) => (
                                    <div key={target} className="flex justify-between items-center bg-zinc-900 p-2 rounded">
                                        <span className="text-zinc-300 text-sm">{target}</span>
                                        <span className={`text-xs font-mono px-2 py-1 rounded ${
                                            status === 'Hostile' ? 'bg-red-900/30 text-red-400' :
                                            status === 'Allied' ? 'bg-emerald-900/30 text-emerald-400' :
                                            'bg-zinc-800 text-zinc-400'
                                        }`}>
                                            {status as string}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
