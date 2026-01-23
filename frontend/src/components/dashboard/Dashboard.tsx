import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useGameState } from '../../context/GameStateContext';
import { UserRole } from '../../models/GameState';

// Mock data for lobbies
const MOCK_LOBBIES = [
    { id: '1', name: "The Lost Mine", host: "DungeonMaster42", members: 3, maxMembers: 5 },
    { id: '2', name: "Curse of Strahd", host: "VampireHunter", members: 5, maxMembers: 6 },
    { id: '3', name: "One Shot: Tavern Brawl", host: "AleHouse", members: 2, maxMembers: 4 },
];

export const Dashboard: React.FC = () => {
    const { joinLobby } = useGameState();

    const handleCreateLobby = () => {
        // Simulating creating a new lobby and joining as DM
        joinLobby('lobby-' + Date.now(), UserRole.DM);
    };

    const handleJoinLobby = (lobbyId: string) => {
        // Simulating joining an existing lobby as Player
        joinLobby(lobbyId, UserRole.PLAYER);
    };

    return (
        <div className="pt-24 px-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-serif text-amber-50">Lobbies</h1>
                <Button
                    className="bg-amber-700 hover:bg-amber-600 text-white gap-2"
                    onClick={handleCreateLobby}
                >
                    <Plus className="size-4" />
                    Create Lobby
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_LOBBIES.map((lobby) => (
                    <Card key={lobby.id} className="bg-stone-900/50 border-stone-800 hover:border-amber-900/50 transition-colors">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl text-amber-100 font-serif">{lobby.name}</CardTitle>
                            <CardDescription className="text-stone-400">Host: <span className="text-amber-500/80">{lobby.host}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-500">
                                    Adventurers: <span className="text-stone-300">{lobby.members}/{lobby.maxMembers}</span>
                                </span>
                                <Button
                                    variant="ghost"
                                    className="text-amber-500 hover:text-amber-400 hover:bg-amber-950/20 h-auto py-1 px-3 text-xs"
                                    onClick={() => handleJoinLobby(lobby.id)}
                                >
                                    Join
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {MOCK_LOBBIES.length === 0 && (
                    <div className="col-span-full text-center py-12 text-stone-500">
                        No active lobbies found. Start your own adventure!
                    </div>
                )}
            </div>
        </div>
    );
};
