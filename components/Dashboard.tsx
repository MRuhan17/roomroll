import { useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import { Swords, Users, BookOpen, Clock, LogOut, Crown, Shield } from 'lucide-react';
import { Button } from './ui/button';

export function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('dnd_username') || 'Adventurer';

  const handleLogout = () => {
    localStorage.removeItem('dnd_authenticated');
    localStorage.removeItem('dnd_username');
    navigate('/login', { replace: true });
  };

  const handleJoinGame = (gameId: string) => {
    navigate(`/lobby/${gameId}`);
  };

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

  const availableGames = [
    { 
      id: 'lost-tomb', 
      title: 'The Lost Tomb', 
      dm: 'Gandor the Wise',
      players: 3,
      maxPlayers: 5,
      difficulty: 'Medium',
      status: 'Waiting for players'
    },
    { 
      id: 'dragons-peak', 
      title: 'Dragon\'s Peak Expedition', 
      dm: 'Elara Moonwhisper',
      players: 4,
      maxPlayers: 6,
      difficulty: 'Hard',
      status: 'Starting soon'
    },
    { 
      id: 'shadowfen', 
      title: 'Shadowfen Mystery', 
      dm: 'Thrain Ironforge',
      players: 2,
      maxPlayers: 4,
      difficulty: 'Easy',
      status: 'Open'
    },
  ];

  return (
    <div className="min-h-screen px-6 py-24 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl text-stone-100 tracking-wide mb-2">Guild Hall</h1>
          <p className="text-stone-400">Welcome back, {username}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="bg-stone-900/50 border-stone-700 text-stone-300 hover:bg-stone-800/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave Guild
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl text-stone-100 mb-4">Available Games</h2>
          <div className="space-y-4">
            {availableGames.map((game) => (
              <ContentPanel key={game.id} variant="wood" className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg text-stone-100 mb-1">{game.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-stone-400">
                      <span className="flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        {game.dm}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {game.players}/{game.maxPlayers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {game.difficulty}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleJoinGame(game.id)}
                    className="bg-amber-900 hover:bg-amber-800 text-amber-50"
                  >
                    Join Game
                  </Button>
                </div>
                <div className="text-sm text-stone-500">
                  Status: <span className="text-amber-500">{game.status}</span>
                </div>
              </ContentPanel>
            ))}
          </div>
        </div>

        <div className="space-y-6">
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
    </div>
  );
}
