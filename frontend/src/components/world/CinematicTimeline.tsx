import React from 'react';
import { motion } from 'framer-motion';
import { Discovery, WorldEvent } from '../../types/world';
import { Clock, Eye, AlertCircle } from 'lucide-react';

interface CinematicTimelineProps {
    discoveries: Discovery[];
    worldEvents: WorldEvent[];
}

export const CinematicTimeline: React.FC<CinematicTimelineProps> = ({ discoveries, worldEvents }) => {
    // Combine and sort events
    const allEvents = [
        ...discoveries.map(d => ({ ...d, type: 'discovery' as const, date: new Date(d.discovered_at) })),
        ...worldEvents.map(e => ({ ...e, type: 'event' as const, date: new Date(e.created_at) }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="relative max-w-3xl mx-auto py-8">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-zinc-800" />
            
            <div className="space-y-12">
                {allEvents.map((item, index) => {
                    const isDiscovery = item.type === 'discovery';
                    const Icon = isDiscovery ? Eye : AlertCircle;
                    
                    return (
                        <motion.div
                            key={`${item.type}-${item.id}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-24 pr-4"
                        >
                            <div className={`absolute left-5 -translate-x-1/2 p-2 rounded-full border border-zinc-800 bg-zinc-950 z-10 ${
                                isDiscovery ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                                <Icon className="w-5 h-5" />
                            </div>

                            <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 mb-2">
                                <Clock className="w-3 h-3" />
                                <span>{item.date.toLocaleString()}</span>
                                {isDiscovery && (
                                    <span className="text-emerald-500">
                                        • DISCOVERY
                                    </span>
                                )}
                            </div>

                            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
                                {isDiscovery ? (
                                    <div className="text-zinc-300">
                                        <span className="text-emerald-400 font-medium">
                                            {(item as any).users?.display_name || 'A player'}
                                        </span> discovered a new {(item as Discovery).entity_type}.
                                    </div>
                                ) : (
                                    <div>
                                        <h4 className="text-lg font-medium text-red-100 mb-2">
                                            {(item as WorldEvent).title}
                                        </h4>
                                        <p className="text-zinc-400">
                                            {(item as WorldEvent).description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}

                {allEvents.length === 0 && (
                    <div className="text-center py-20 text-zinc-500 font-mono text-sm pl-16">
                        NO EVENTS RECORDED IN TIMELINE.
                    </div>
                )}
            </div>
        </div>
    );
};
