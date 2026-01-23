import React, { useState, useEffect } from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { useAuth } from '../context/AuthContext';
import { ContentPanel } from '../components/common/ContentPanel';
import { Dices, Map, Users, MessageSquare } from 'lucide-react';
import { DiceSystem } from '../systems/DiceSystem';
import { eventSystem } from '../systems/GameEventSystem';
import { GameEventType, type DiceRolledEvent } from '../models/GameEvents';

export const SessionRoomPage: React.FC = () => {
    const { user } = useAuth();
    const [diceNotation, setDiceNotation] = useState('1d20');
    const [logs, setLogs] = useState<string[]>([]);

    // Subscribe to Shared Game Events
    useEffect(() => {
        // Function to format event to log string
        const formatEvent = (event: DiceRolledEvent) => {
            const { userName, total, notation, rolls } = event.payload;
            return `${userName} rolled ${total} (${notation}) [${rolls.join(', ')}]`;
        };

        // 1. Load History
        const history = eventSystem.getEventsByType(GameEventType.DICE_ROLLED) as DiceRolledEvent[];
        const historyLogs = history.map(formatEvent).reverse(); // Newest first

        // Initialize Logs
        setLogs([
            ...historyLogs,
            'Session started...', // Marker
        ]);

        // 2. Subscribe to new events
        const unsubscribe = eventSystem.subscribe((event) => {
            if (event.type === GameEventType.DICE_ROLLED) {
                const logEntry = formatEvent(event as DiceRolledEvent);
                setLogs(prev => [logEntry, ...prev]);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleRoll = () => {
        if (!user) return;

        try {
            // 1. Calculate Result (Server-Authoritative Simulation)
            const result = DiceSystem.processRoll({
                userId: user.id,
                userName: user.name,
                notation: diceNotation
            });

            // 2. Publish Event (Shared Reality)
            eventSystem.publish({
                type: GameEventType.DICE_ROLLED,
                actorId: user.id,
                payload: result
            });

        } catch (error: any) {
            console.error('Roll failed:', error);
        }
    };

    const partyMembers = [
        { name: 'Aria Moonwhisper', class: 'Ranger', hp: '42/45' },
        { name: 'Grimwald Stonefist', class: 'Cleric', hp: '38/50' },
        { name: 'Zephyr Swiftblade', class: 'Rogue', hp: '28/32' },
        { name: 'Eldrin the Wise', class: 'Wizard', hp: '24/24' },
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen px-6 py-24 max-w-7xl mx-auto relative z-10">
                <div className="mb-6">
                    <h1 className="text-3xl text-stone-100 tracking-wide mb-2">The Lost Tomb</h1>
                    <p className="text-stone-400">Session in progress</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Left: Dice Tray */}
                    <div className="space-y-6">
                        <ContentPanel variant="parchment" className="p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                                <Dices className="w-5 h-5 text-amber-900" />
                                <h2 className="text-lg text-stone-800">Dice Tray</h2>
                            </div>

                            {/* Visual Dice Buttons */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((die) => (
                                    <button
                                        key={die}
                                        onClick={() => setDiceNotation('1' + die)}
                                        className={`py-2 px-1 rounded border border-stone-400 font-mono text-sm font-bold transition-all ${diceNotation === '1' + die
                                            ? 'bg-amber-800 text-amber-50 border-amber-900'
                                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                            }`}
                                    >
                                        {die.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    value={diceNotation}
                                    onChange={(e) => setDiceNotation(e.target.value)}
                                    className="px-2 py-2 text-sm border border-stone-400 rounded bg-white/50 text-stone-800 w-full font-mono focus:outline-none focus:border-amber-600 shadow-inner"
                                    placeholder="1d20"
                                />
                                <button
                                    onClick={handleRoll}
                                    className="px-4 py-2 bg-amber-800 text-amber-50 rounded font-medium text-sm hover:bg-amber-900 transition-colors shadow-sm"
                                >
                                    Roll
                                </button>
                            </div>

                            <div className="border-t border-stone-300 my-4"></div>

                            {/* Logs */}
                            <h3 className="text-sm font-bold text-stone-600 mb-2 uppercase tracking-wider">Recent Rolls</h3>
                            <div className="space-y-2 max-h-[calc(100vh-24rem)] overflow-y-auto pr-1 custom-scrollbar">
                                {logs.map((action, idx) => (
                                    <div key={idx} className="py-2 px-3 bg-white/60 rounded border border-stone-200 text-xs text-stone-700 shadow-sm">
                                        {action}
                                    </div>
                                ))}
                            </div>
                        </ContentPanel>
                    </div>

                    {/* Center: Map */}
                    <div className="lg:col-span-2 space-y-6">
                        <ContentPanel variant="stone" className="p-0 h-[600px] relative overflow-hidden flex flex-col">
                            <div className="absolute top-4 left-4 z-10 bg-stone-900/80 backdrop-blur px-3 py-1 rounded border border-stone-700 flex items-center gap-2">
                                <Map className="w-4 h-4 text-amber-500" />
                                <span className="text-stone-100 text-sm font-medium">Dungeon Map</span>
                            </div>
                            <div className="w-full h-full flex items-center justify-center text-stone-500 bg-stone-950">
                                <div className="text-center">
                                    <div className="w-20 h-20 border-2 border-stone-800 rounded-full mx-auto mb-4 flex items-center justify-center bg-stone-900">
                                        <Map className="w-8 h-8 text-stone-700" />
                                    </div>
                                    <p className="text-stone-400">Map View</p>
                                    <p className="text-xs text-stone-600 mt-1">Interactive map rendering area</p>
                                </div>
                            </div>
                        </ContentPanel>
                    </div>

                    {/* Right: Sidebar */}
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
                                        <div className="text-stone-800 font-medium">{member.name}</div>
                                        <div className="flex justify-between text-xs text-stone-600 mt-1">
                                            <span>{member.class}</span>
                                            <span className="text-red-700 font-bold">HP: {member.hp}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ContentPanel>

                        {/* Chat panel */}
                        <ContentPanel variant="wood" className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-amber-500" />
                                <h2 className="text-lg text-stone-100">Chat</h2>
                            </div>
                            <div className="space-y-2 text-xs text-stone-300 mb-3 h-48 overflow-y-auto">
                                <p><span className="text-amber-400 font-bold">Aria:</span> I'll check for traps</p>
                                <p><span className="text-amber-400 font-bold">Grimwald:</span> Stay close everyone</p>
                                <p><span className="text-amber-400 font-bold">DM:</span> Roll for initiative</p>
                            </div>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="w-full px-3 py-2 bg-stone-900/50 border border-stone-600/50 rounded text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
                            />
                        </ContentPanel>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
};
