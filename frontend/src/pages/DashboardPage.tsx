import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ContentPanel } from '../components/common/ContentPanel';
import { Swords, Users, BookOpen, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    const stats = [
        { icon: Swords, label: 'Active Campaigns', value: '3' },
        { icon: Users, label: 'Party Members', value: '12' },
        { icon: BookOpen, label: 'Quests Completed', value: '47' },
        { icon: Clock, label: 'Hours Played', value: '156' },
    ];

    const recentSessions = [
        { title: 'The Lost Tomb', date: 'Yesterday', players: 4 },
        { title: 'Dragon\'s Peak', date: '3 days ago', players: 5 },
        { title: 'Shadowfen Swamp', date: '1 week ago', players: 4 },
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen px-6 py-24 max-w-6xl mx-auto z-10 relative">
                <div className="mb-8">
                    <h1 className="text-3xl text-stone-100 tracking-wide mb-2">Guild Hall</h1>
                    <p className="text-stone-400">Welcome back, {user?.name || 'Adventurer'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat) => (
                        <ContentPanel key={stat.label} variant="wood" className="p-5">
                            <stat.icon className="w-6 h-6 text-amber-500 mb-2" />
                            <div className="text-2xl text-stone-100 mb-1">{stat.value}</div>
                            <div className="text-sm text-stone-400">{stat.label}</div>
                        </ContentPanel>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ContentPanel variant="parchment" className="p-6">
                        <h2 className="text-xl text-stone-800 mb-4">Recent Sessions</h2>
                        <div className="space-y-3">
                            {recentSessions.map((session, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-300 last:border-0">
                                    <div>
                                        <div className="text-stone-800">{session.title}</div>
                                        <div className="text-sm text-stone-600">{session.date}</div>
                                    </div>
                                    <div className="text-sm text-stone-600">{session.players} players</div>
                                </div>
                            ))}
                        </div>
                    </ContentPanel>

                    <ContentPanel variant="parchment" className="p-6">
                        <h2 className="text-xl text-stone-800 mb-4">Active Quests</h2>
                        <div className="space-y-3">
                            <div className="p-3 bg-amber-100/50 rounded border border-amber-900/10">
                                <div className="text-stone-800">Retrieve the Crystal of Ages</div>
                                <div className="text-sm text-stone-600 mt-1">The wizard seeks a powerful artifact from the ancient ruins.</div>
                            </div>
                            <div className="p-3 bg-amber-100/50 rounded border border-amber-900/10">
                                <div className="text-stone-800">Defend the Northern Village</div>
                                <div className="text-sm text-stone-600 mt-1">Bandits threaten the peaceful settlement.</div>
                            </div>
                        </div>
                    </ContentPanel>
                </div>
            </div>
        </AuthGuard>
    );
};
