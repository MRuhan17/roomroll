import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import { Dices, Map, Users, MessageSquare, ArrowLeft, X } from 'lucide-react';
import { Button } from './ui/button';

const GAME_DATA: Record<string, any> = {
  'lost-tomb': { title: 'The Lost Tomb' },
  'dragons-peak': { title: "Dragon's Peak Expedition" },
  'shadowfen': { title: 'Shadowfen Mystery' },
};

export function SessionRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const username = localStorage.getItem('dnd_username') || 'Adventurer';
  
  const game = gameId ? GAME_DATA[gameId] : null;

  useEffect(() => {
    if (!game) {
      navigate('/', { replace: true });
    }
  }, [game, navigate]);

  if (!game) {
    return null;
  }

  const handleBackToLobby = () => {
    navigate(`/lobby/${gameId}`);
  };

  const handleEndSession = () => {
    navigate('/');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // In a real app, this would send the message
      setMessage('');
    }
  };

  const partyMembers = [
    { name: username, class: 'Warrior', hp: '45/45', isYou: true },
    { name: 'Thorin Stonehelm', class: 'Cleric', hp: '38/50', isYou: false },
    { name: 'Lyra Silverwind', class: 'Ranger', hp: '42/45', isYou: false },
    { name: 'Ragnar Bloodfist', class: 'Barbarian', hp: '58/65', isYou: false },
  ];

  const recentActions = [
    `${username} joined the session`,
    'Thorin rolled Investigation: 18',
    'Lyra cast Hunter\'s Mark',
    'The ancient door creaks open...',
    'Ragnar rolled Stealth: 8 (with disadvantage)',
    'A skeleton warrior emerges from the shadows!',
  ];

  return (
    <div className="min-h-screen px-6 py-24 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl text-stone-100 tracking-wide mb-2">{game.title}</h1>
          <p className="text-stone-400">Session in progress</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={handleBackToLobby}
            className="text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleEndSession}
            className="bg-red-900/50 hover:bg-red-900/70 text-red-200"
          >
            <X className="w-4 h-4 mr-2" />
            End Session
          </Button>
        </div>
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
                <p className="text-xs text-stone-500 mt-1">Interactive battle map and tokens</p>
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
            <div className="mt-4 pt-4 border-t border-stone-300">
              <Button className="bg-amber-900 hover:bg-amber-800 text-amber-50">
                <Dices className="w-4 h-4 mr-2" />
                Roll Dice
              </Button>
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
                  <div className="text-stone-800">
                    {member.name} {member.isYou && <span className="text-stone-500 text-xs">(You)</span>}
                  </div>
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
              <p><span className="text-amber-400">Lyra:</span> I'll check for traps</p>
              <p><span className="text-amber-400">Thorin:</span> Stay close everyone</p>
              <p><span className="text-amber-400">DM:</span> Roll for initiative</p>
              <p><span className="text-amber-400">{username}:</span> Ready when you are!</p>
            </div>
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-3 py-2 bg-stone-900/50 border border-stone-600/50 rounded text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-1 focus:ring-amber-700/50"
              />
            </form>
          </ContentPanel>
        </div>
      </div>
    </div>
  );
}
