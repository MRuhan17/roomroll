import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWorldStore } from '@/store/useWorldStore';
import { useAuthStore } from '@/store/authStore';
import { LoreGrid } from '@/components/world/LoreGrid';
import { FactionNetwork } from '@/components/world/FactionNetwork';
import { CinematicTimeline } from '@/components/world/CinematicTimeline';
import { getCampaign } from '@/services/campaigns';
import { Globe, ArrowLeft, Book, Shield, Clock } from 'lucide-react';

export const WorldArchivePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const campaignId = parseInt(id!);
    
    const [activeTab, setActiveTab] = useState<'lore' | 'factions' | 'timeline'>('timeline');
    
    const { user } = useAuthStore();
    const { lore, factions, discoveries, worldEvents, fetchWorldData, discoverEntity } = useWorldStore();

    const { data: campaignData } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => getCampaign(campaignId),
        enabled: !isNaN(campaignId),
    });
    const currentCampaign = campaignData?.campaign;

    useEffect(() => {
        if (!isNaN(campaignId)) {
            fetchWorldData(campaignId);
        }
    }, [campaignId, fetchWorldData]);

    const isDM = currentCampaign?.dm_user_id === user?.id;

    const handleDiscover = (type: 'lore' | 'faction', entityId: number) => {
        discoverEntity(campaignId, type, entityId);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <button 
                        onClick={() => navigate(`/campaigns/${campaignId}`)}
                        className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-6 font-mono text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>BACK TO CAMPAIGN</span>
                    </button>
                    
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-900/20 rounded-xl border border-red-900/50">
                            <Globe className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">World Archive</h1>
                            <p className="text-zinc-400 mt-1">Lore, Factions, and Timeline for {currentCampaign?.name}</p>
                        </div>
                    </div>
                </header>

                <div className="flex space-x-2 border-b border-zinc-800 mb-8 pb-4 overflow-x-auto">
                    <TabButton 
                        active={activeTab === 'timeline'} 
                        onClick={() => setActiveTab('timeline')}
                        icon={<Clock className="w-4 h-4" />}
                        label="Timeline Feed"
                    />
                    <TabButton 
                        active={activeTab === 'lore'} 
                        onClick={() => setActiveTab('lore')}
                        icon={<Book className="w-4 h-4" />}
                        label="Lore Entries"
                    />
                    <TabButton 
                        active={activeTab === 'factions'} 
                        onClick={() => setActiveTab('factions')}
                        icon={<Shield className="w-4 h-4" />}
                        label="Factions"
                    />
                </div>

                <div className="min-h-[500px]">
                    {activeTab === 'timeline' && (
                        <CinematicTimeline discoveries={discoveries} worldEvents={worldEvents} />
                    )}
                    {activeTab === 'lore' && (
                        <LoreGrid lore={lore} isDM={isDM} onDiscover={(id: number) => handleDiscover('lore', id)} />
                    )}
                    {activeTab === 'factions' && (
                        <FactionNetwork factions={factions} isDM={isDM} onDiscover={(id: number) => handleDiscover('faction', id)} />
                    )}
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-mono text-sm whitespace-nowrap ${
            active ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);
