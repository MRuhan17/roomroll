import React from 'react';
import { AuthGuard } from '../components/auth/AuthGuard';
import { ContentPanel } from '../components/common/ContentPanel';
import { Shield, Crown, Sparkles } from 'lucide-react';

export const LobbyPage: React.FC = () => {
    const campaigns = [
        {
            name: 'Shadows of Eldoria',
            dm: 'Merrick the Wise',
            players: 3,
            maxPlayers: 5,
            level: '5-8',
            status: 'Recruiting'
        },
        {
            name: 'The Crimson Throne',
            dm: 'Lady Seraphine',
            players: 5,
            maxPlayers: 5,
            level: '12-15',
            status: 'Full'
        },
        {
            name: 'Whispers in the Deep',
            dm: 'Thorin Ironforge',
            players: 2,
            maxPlayers: 4,
            level: '1-3',
            status: 'New'
        },
    ];

    return (
        <AuthGuard>
            <div className="min-h-screen px-6 py-24 max-w-6xl mx-auto relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl text-stone-100 tracking-wide mb-2">Campaign Lobby</h1>
                    <p className="text-stone-400">Choose your next adventure</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <ContentPanel variant="wood" className="p-5 flex items-center gap-3">
                        <Shield className="w-8 h-8 text-amber-500" />
                        <div>
                            <div className="text-xl text-stone-100">24</div>
                            <div className="text-sm text-stone-400">Active Campaigns</div>
                        </div>
                    </ContentPanel>

                    <ContentPanel variant="wood" className="p-5 flex items-center gap-3">
                        <Crown className="w-8 h-8 text-amber-500" />
                        <div>
                            <div className="text-xl text-stone-100">156</div>
                            <div className="text-sm text-stone-400">Dungeon Masters</div>
                        </div>
                    </ContentPanel>

                    <ContentPanel variant="wood" className="p-5 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-amber-500" />
                        <div>
                            <div className="text-xl text-stone-100">892</div>
                            <div className="text-sm text-stone-400">Adventurers Online</div>
                        </div>
                    </ContentPanel>
                </div>

                <div className="space-y-4">
                    {campaigns.map((campaign, idx) => (
                        <ContentPanel key={idx} variant="parchment" className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-xl text-stone-800 mb-1">{campaign.name}</h3>
                                    <p className="text-sm text-stone-600">Led by {campaign.dm}</p>
                                </div>
                                <span className={`px-3 py-1 rounded text-xs ${campaign.status === 'New'
                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                        : campaign.status === 'Full'
                                            ? 'bg-red-100 text-red-800 border border-red-300'
                                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                                    }`}>
                                    {campaign.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-stone-600 mb-4">
                                <span>Level {campaign.level}</span>
                                <span>{campaign.players}/{campaign.maxPlayers} Players</span>
                            </div>

                            <button
                                className={`px-6 py-2 rounded transition-colors ${campaign.status === 'Full'
                                        ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                                        : 'bg-amber-900 hover:bg-amber-800 text-amber-50'
                                    }`}
                                disabled={campaign.status === 'Full'}
                            >
                                {campaign.status === 'Full' ? 'Campaign Full' : 'Join Campaign'}
                            </button>
                        </ContentPanel>
                    ))}
                </div>
            </div>
        </AuthGuard>
    );
};
