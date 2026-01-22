import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizeable';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Users, MessageSquare, Dices, Map as MapIcon, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export const SessionRoom: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'players' | 'dice'>('chat');

    return (
        <div className="h-[calc(100vh-4rem)] bg-stone-950 overflow-hidden flex flex-col pt-16">
            <ResizablePanelGroup orientation="horizontal" className="h-full w-full rounded-lg border border-stone-800">

                {/* Board Area */}
                <ResizablePanel defaultSize={75} minSize={50} className="bg-stone-900/20 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600">
                        <MapIcon className="size-24 opacity-20 mb-4" />
                        <h2 className="text-2xl font-serif text-stone-500">Game Board Area</h2>
                        <p className="text-sm">Canvas / Map Rendering Surface</p>
                    </div>
                    {/* Floating controls could go here */}
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Side Panel */}
                <ResizablePanel defaultSize={25} minSize={20} className="bg-stone-900 border-l border-stone-800 flex flex-col">

                    {/* Panel Navigation */}
                    <div className="flex items-center border-b border-stone-800 bg-stone-950">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-amber-600 text-amber-500' : 'border-transparent text-stone-400 hover:text-stone-300'}`}
                        >
                            <MessageSquare className="size-4" />
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('players')}
                            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'players' ? 'border-amber-600 text-amber-500' : 'border-transparent text-stone-400 hover:text-stone-300'}`}
                        >
                            <Users className="size-4" />
                            Players
                        </button>
                        <button
                            onClick={() => setActiveTab('dice')}
                            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'dice' ? 'border-amber-600 text-amber-500' : 'border-transparent text-stone-400 hover:text-stone-300'}`}
                        >
                            <Dices className="size-4" />
                            Dice
                        </button>
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col">
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-2 items-start">
                                                <div className="size-2 mt-1.5 rounded-full bg-amber-500 shrink-0" />
                                                <div>
                                                    <span className="text-xs font-bold text-amber-500">DungeonMaster42</span>
                                                    <p className="text-sm text-stone-300">Welcome to the session! Roll for initiative.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-3 bg-stone-950 border-t border-stone-800 flex gap-2">
                                    <Input placeholder="Type a message..." className="bg-stone-900 border-stone-700 focus-visible:ring-amber-900" />
                                    <Button size="icon" className="bg-amber-800 hover:bg-amber-700 shrink-0">
                                        <Send className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'players' && (
                            <ScrollArea className="h-full p-4">
                                <h3 className="text-xs font-semibold text-stone-500 text-uppercase tracking-wider mb-4">Party Members</h3>
                                <div className="space-y-3">
                                    {["DungeonMaster42 (DM)", "ElfRanger", "DwarfFighter", "HumanWizard"].map((name, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-stone-800/50">
                                            <Avatar className="size-8">
                                                <AvatarFallback className="bg-stone-800 text-xs">{name.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-stone-300 font-medium">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {activeTab === 'dice' && (
                            <div className="h-full p-4 flex flex-col items-center justify-center text-center">
                                <Dices className="size-12 text-stone-600 mb-4" />
                                <h3 className="text-lg font-medium text-stone-400">Dice Roller</h3>
                                <p className="text-sm text-stone-500 mb-6">Select dice to roll</p>
                                <div className="grid grid-cols-3 gap-3 w-full max-w-[200px]">
                                    {['D4', 'D6', 'D8', 'D10', 'D12', 'D20'].map(d => (
                                        <Button key={d} variant="outline" className="border-stone-700 hover:bg-amber-950 hover:text-amber-500 hover:border-amber-900 transition-colors">
                                            {d}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
