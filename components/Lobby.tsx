import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import { Shield, Crown, Users, ArrowLeft, Play } from 'lucide-react';
import { Button } from './ui/button';

const GAME_DATA: Record<string, any> = {
  'lost-tomb': {
    title: 'The Lost Tomb',
    dm: 'Gandor the Wise',
    difficulty: 'Medium',
    level: '5-8',
    description: 'Venture into the ancient tomb of a forgotten king. Beware of traps, undead guardians, and the curse that protects the royal treasure.',
    maxPlayers: 5,
  },
  'dragons-peak': {
    title: "Dragon's Peak Expedition",
    dm: 'Elara Moonwhisper',
    difficulty: 'Hard',
    level: '12-15',
    description: 'Scale the treacherous Dragon\'s Peak to confront an ancient red dragon threatening nearby villages. Only the bravest adventurers dare attempt this quest.',
    maxPlayers: 6,
  },
  'shadowfen': {
    title: 'Shadowfen Mystery',
    dm: 'Thrain Ironforge',
    difficulty: 'Easy',
    level: '1-3',
    description: 'Investigate strange disappearances in the misty Shadowfen Swamp. Perfect for beginning adventurers seeking their first real challenge.',
    maxPlayers: 4,
  },
};

export function Lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
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

  const handleStartSession = () => {
    if (isReady) {
      navigate(`/session/${gameId}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Mock connected players
  const players = [
    { name: username, ready: isReady, isYou: true },
    { name: 'Thorin Stonehelm', ready: true, isYou: false },
    { name: 'Lyra Silverwind', ready: true, isYou: false },
    { name: 'Ragnar Bloodfist', ready: false, isYou: false },
  ];

  return (
    <div className="min-h-screen px-6 py-24 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        onClick={handleBack}
        className="mb-6 text-stone-400 hover:text-stone-200 hover:bg-stone-800/50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Guild Hall
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl text-stone-100 tracking-wide mb-2">{game.title}</h1>
        <p className="text-stone-400">Preparing for adventure</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ContentPanel variant="parchment" className="p-6">
            <h2 className="text-xl text-stone-800 mb-4">Campaign Details</h2>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-stone-700">
                <Crown className="w-4 h-4" />
                <span className="text-sm">Dungeon Master:</span>
                <span>{game.dm}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Difficulty:</span>
                <span>{game.difficulty}</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <Users className="w-4 h-4" />
                <span className="text-sm">Recommended Level:</span>
                <span>{game.level}</span>
              </div>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed">
              {game.description}
            </p>
          </ContentPanel>

          <ContentPanel variant="wood" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-stone-100">Party Members</h2>
              <span className="text-sm text-stone-400">{players.length}/{game.maxPlayers}</span>
            </div>
            <div className="space-y-3">
              {players.map((player, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-3 bg-stone-900/30 rounded border border-stone-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500">
                      {player.name[0]}
                    </div>
                    <span className="text-stone-200">
                      {player.name} {player.isYou && <span className="text-stone-500 text-sm">(You)</span>}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    player.ready 
                      ? 'bg-green-900/30 text-green-400 border border-green-700/50' 
                      : 'bg-stone-700/30 text-stone-400 border border-stone-600/50'
                  }`}>
                    {player.ready ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}
            </div>
          </ContentPanel>
        </div>

        <div className="space-y-6">
          <ContentPanel variant="parchment" className="p-6">
            <h2 className="text-xl text-stone-800 mb-4">Ready Check</h2>
            <p className="text-sm text-stone-600 mb-4">
              Mark yourself as ready when you're prepared to begin the adventure.
            </p>
            <Button 
              onClick={() => setIsReady(!isReady)}
              className={`w-full mb-3 ${
                isReady 
                  ? 'bg-green-700 hover:bg-green-600 text-white' 
                  : 'bg-amber-900 hover:bg-amber-800 text-amber-50'
              }`}
            >
              {isReady ? 'Ready!' : 'Mark as Ready'}
            </Button>
            
            <div className="pt-4 border-t border-stone-300">
              <Button 
                onClick={handleStartSession}
                disabled={!isReady}
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4 mr-2" />
                Enter Session
              </Button>
              <p className="text-xs text-stone-500 text-center mt-2">
                You must be ready to enter
              </p>
            </div>
          </ContentPanel>

          <ContentPanel variant="parchment" className="p-6">
            <h2 className="text-xl text-stone-800 mb-4">Rules Reminder</h2>
            <ul className="text-sm text-stone-600 space-y-2">
              <li>• Respect your fellow players</li>
              <li>• Listen to your Dungeon Master</li>
              <li>• Stay in character when appropriate</li>
              <li>• Have fun and be creative!</li>
            </ul>
          </ContentPanel>
        </div>
      </div>
    </div>
  );
}
