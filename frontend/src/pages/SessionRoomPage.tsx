import React from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ContentPanel } from '../components/common/ContentPanel';
import { Dices, Map, Users, MessageSquare } from 'lucide-react';

export const SessionRoomPage: React.FC = () => {
    const partyMembers = [
        { name: 'Aria Moonwhisper', class: 'Ranger', hp: '42/45' },
        { name: 'Grimwald Stonefist', class: 'Cleric', hp: '38/50' },
        { name: 'Zephyr Swiftblade', class: 'Rogue', hp: '28/32' },
        { name: 'Eldrin the Wise', class: 'Wizard', hp: '24/24' },
    ];

    const recentActions = [
        'Aria rolled Investigation: 18',
        'Grimwald cast Healing Word on Zephyr',
        'The ancient door creaks open...',
        'Zephyr rolled Stealth: 22',
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen px-6 py-24 max-w-7xl mx-auto relative z-10">
                <div className="mb-6">
                    <h1 className="text-3xl text-stone-100 tracking-wide mb-2">The Lost Tomb</h1>
                    <p className="text-stone-400">Session in progress</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content area */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map/Scene area */}
                        <ContentPanel variant="stone" className="p-6 h-80">
                            <div className="flex items-center gap-2 mb-4">
                                <Map className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg text-stone-100">Dungeon Map</h2>
                            </div>
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-2 border-stone-600 rounded mx-auto mb-3 flex items-center justify-center">
                                        <Map className="w-8 h-8 text-stone-500" />
                                    </div>
                                    <p className="text-sm">Map view would render here</p>
                                </div>
                            </div>
                        </ContentPanel>

                        {/* Narrative/Dice area */}
                        <ContentPanel variant="parchment" className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Dices className="w-5 h-5 text-amber-900" />
                                <h2 className="text-lg text-stone-800">Recent Actions</h2>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {recentActions.map((action, idx) => (
                                    <div key={idx} className="py-2 px-3 bg-amber-50 rounded border border-amber-900/10 text-sm text-stone-700">
                                        {action}
                                    </div>
                                ))}
                            </div>
                        </ContentPanel>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Party panel */}
                        <ContentPanel variant="parchment" className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-amber-900" />
                                <h2 className="text-lg text-stone-800">Party</h2>
                            </div>
                            <div className="space-y-3">
                                {partyMembers.map((member, idx) => (
                                    <div key={idx} className="pb-3 border-b border-stone-300 last:border-0">
                                        <div className="text-stone-800">{member.name}</div>
                                        <div className="flex justify-between text-sm text-stone-600 mt-1">
                                            <span>{member.class}</span>
                                            <span className="text-red-700">HP: {member.hp}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ContentPanel>

                        {/* Chat panel */}
                        <ContentPanel variant="wood" className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg text-stone-100">Party Chat</h2>
                            </div>
                            <div className="space-y-2 text-sm text-stone-300 mb-3 h-32 overflow-y-auto">
                                <p><span className="text-amber-400">Aria:</span> I'll check for traps</p>
                                <p><span className="text-amber-400">Grimwald:</span> Stay close everyone</p>
                                <p><span className="text-amber-400">DM:</span> Roll for initiative</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-3 py-2 bg-stone-900/50 border border-stone-600/50 rounded text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                            />
                        </ContentPanel>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};
