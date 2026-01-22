import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Copy, Shield, Crown, Play } from 'lucide-react';
import { Separator } from '../ui/separator';

const MOCK_MEMBERS = [
    { id: '1', name: "DungeonMaster42", role: 'dm', avatar: null },
    { id: '2', name: "ElfRanger", role: 'player', avatar: null },
    { id: '3', name: "DwarfFighter", role: 'player', avatar: null },
    { id: '4', name: "HumanWizard", role: 'player', avatar: null },
];

export const Lobby: React.FC = () => {
    // Mocking DM stats, in real app this comes from auth/room context
    const isDM = true;
    const inviteLink = "https://roomroll.com/lobby/xyz-789";

    const copyInvite = () => {
        navigator.clipboard.writeText(inviteLink);
        // Show toast ideally
    };

    return (
        <div className="pt-24 px-6 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-serif text-amber-50">The Lost Mine</h1>
                    <p className="text-stone-400 mt-1">Waiting for party to gather...</p>
                </div>
                {isDM && (
                    <Button className="bg-amber-700 hover:bg-amber-600 text-white gap-2 w-full md:w-auto">
                        <Play className="size-4" />
                        Start Session
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Members */}
                <Card className="md:col-span-2 bg-stone-900/50 border-stone-800">
                    <CardHeader>
                        <CardTitle className="text-amber-100 font-serif flex items-center justify-between">
                            Party Members
                            <Badge variant="outline" className="border-stone-700 text-stone-400">
                                {MOCK_MEMBERS.length}/5
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {MOCK_MEMBERS.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-stone-950/30 border border-stone-800/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="size-10 border border-stone-700">
                                        <AvatarImage src={member.avatar || undefined} />
                                        <AvatarFallback className="bg-stone-800 text-stone-400">
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-stone-200">{member.name}</p>
                                        <p className="text-xs text-stone-500 capitalize">{member.role === 'dm' ? 'Dungeon Master' : 'Adventurer'}</p>
                                    </div>
                                </div>
                                {member.role === 'dm' && <Crown className="size-4 text-amber-500" />}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Sidebar: Invite & Info */}
                <div className="space-y-6">
                    <Card className="bg-stone-900/50 border-stone-800">
                        <CardHeader>
                            <CardTitle className="text-amber-100 font-serif text-lg">Invite Adventurers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-stone-950 rounded border border-stone-800 break-all text-xs font-mono text-stone-400 select-all">
                                {inviteLink}
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-amber-100 gap-2"
                                onClick={copyInvite}
                            >
                                <Copy className="size-4" />
                                Copy Link
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="bg-amber-950/20 border border-amber-900/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Shield className="size-5 text-amber-600 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-200">Session Tip</p>
                                <p className="text-amber-200/60 mt-1">
                                    Ensure all players have their character sheets ready before venturing forth.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
