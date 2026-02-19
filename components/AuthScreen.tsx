import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import {
  Axe,
  Shield,
  Sparkles,
  Sword,
  WandSparkles,
  Flame,
  Scroll,
} from 'lucide-react';

const partyMembers = [
  { name: 'Aria the Mage', role: 'Arcane Caster', icon: WandSparkles },
  { name: 'Voss the Warlock', role: 'Eldritch Caster', icon: Sparkles },
  { name: 'Brom the Knight', role: 'Frontline Guard', icon: Sword },
  { name: 'Kael the Sentinel', role: 'Shield Bearer', icon: Shield },
  { name: 'Rurik the Raider', role: 'Heavy Striker', icon: Axe },
];

const dragons = [
  { name: 'Ashwing', title: 'Ancient Fire Drake' },
  { name: 'Nightscale', title: 'Shadow Wyrm' },
  { name: 'Stormfang', title: 'Sky Serpent' },
];

export function AuthScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (localStorage.getItem('dnd_authenticated') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      localStorage.setItem('dnd_authenticated', 'true');
      localStorage.setItem('dnd_username', username);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-6 lg:grid-cols-[1fr_minmax(340px,420px)_1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-amber-600/30 bg-stone-950/45 p-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-red-800/20 via-orange-700/10 to-transparent" />
          <div className="relative">
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-red-200/70">Dragon Host</p>
            <h2 className="text-2xl text-amber-100">The Wyrms Gather</h2>
            <p className="mt-2 text-sm text-stone-300/90">The left flank burns with ancient dragons ready to test any party bold enough to enter.</p>

            <div className="mt-6 space-y-3">
              {dragons.map((dragon) => (
                <div
                  key={dragon.name}
                  className="flex items-center justify-between rounded-xl border border-red-500/25 bg-red-950/20 px-4 py-3"
                >
                  <div>
                    <p className="text-base text-red-100">🐉 {dragon.name}</p>
                    <p className="text-xs text-red-200/70">{dragon.title}</p>
                  </div>
                  <Flame className="h-5 w-5 text-orange-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <ContentPanel className="w-full p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <Scroll className="mb-3 h-12 w-12 text-amber-900" />
            <h1 className="text-3xl text-stone-900 tracking-wide">Roomroll</h1>
            <p className="mt-2 text-sm text-stone-700">Log in and step into tonight&apos;s D&D encounter.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-stone-700">Adventurer Name</label>
              <input
                type="text"
                placeholder="Your party alias"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded border border-stone-300 bg-stone-50 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-stone-700">Passphrase</label>
              <input
                type="password"
                placeholder="Enter your passphrase"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-stone-300 bg-stone-50 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50"
              />
            </div>

            <button
              type="submit"
              className="mt-5 w-full rounded bg-amber-900 py-3 text-amber-50 transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!username || !password}
            >
              Begin Campaign
            </button>
          </form>
        </ContentPanel>

        <section className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-stone-950/40 p-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-bl from-sky-800/20 via-indigo-700/10 to-transparent" />
          <div className="relative">
            <p className="mb-2 text-xs uppercase tracking-[0.35em] text-sky-100/75">Adventuring Party</p>
            <h2 className="text-2xl text-sky-50">Five Heroes, Two Wands</h2>
            <p className="mt-2 text-sm text-stone-300/90">Two casters channel arcane power while three allies hold steel and shields on the right flank.</p>

            <div className="mt-6 space-y-3">
              {partyMembers.map((member) => {
                const Icon = member.icon;
                return (
                  <div
                    key={member.name}
                    className="flex items-center justify-between rounded-xl border border-sky-400/25 bg-sky-950/20 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-sky-50">{member.name}</p>
                      <p className="text-xs text-sky-100/70">{member.role}</p>
                    </div>
                    <Icon className="h-5 w-5 text-sky-200" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
