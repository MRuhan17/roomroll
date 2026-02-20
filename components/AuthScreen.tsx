import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import {
  Axe,
  Flame,
  Scroll,
  Shield,
  Sparkles,
  Sword,
  Wand2,
} from 'lucide-react';

const dragonWing = [
  { name: 'Embermaw', title: 'Infernal Wyrm', threat: 'Cataclysmic flame breath' },
  { name: 'Umbralith', title: 'Shadow Drake', threat: 'Nightfall concealment' },
  { name: 'Stormhollow', title: 'Tempest Serpent', threat: 'Sky-rending lightning' },
];

const partyWing = [
  { name: 'Nyra', className: 'Spellweaver', gear: 'Crystal wand', icon: Wand2 },
  { name: 'Thorn', className: 'Hexbinder', gear: 'Runed wand', icon: Sparkles },
  { name: 'Brakka', className: 'Vanguard', gear: 'Greatsword', icon: Sword },
  { name: 'Ivar', className: 'Guardian', gear: 'Tower shield', icon: Shield },
  { name: 'Marek', className: 'Ravager', gear: 'Battle axe', icon: Axe },
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
    <main className="min-h-screen px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[1.1fr_minmax(360px,420px)_1.1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-red-700/40 bg-gradient-to-br from-red-950/60 via-stone-950/70 to-black/70 p-6">
          <div className="absolute -left-10 top-8 text-8xl opacity-25">🐉</div>
          <div className="absolute right-6 top-20 text-6xl opacity-20">🐲</div>
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.35em] text-red-200/70">Left Flank</p>
            <h2 className="mt-2 text-3xl text-red-50">Dragon Frontline</h2>
            <p className="mt-2 text-sm text-red-100/80">Ancient dragons wait at the gate, forcing every hero to earn their place in the campaign.</p>

            <div className="mt-6 space-y-3">
              {dragonWing.map((dragon) => (
                <article
                  key={dragon.name}
                  className="rounded-xl border border-red-400/30 bg-red-950/25 p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base text-red-100">{dragon.name}</p>
                      <p className="text-xs text-red-200/75">{dragon.title}</p>
                    </div>
                    <Flame className="h-5 w-5 text-orange-300" />
                  </div>
                  <p className="mt-2 text-xs text-red-100/70">{dragon.threat}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ContentPanel className="flex flex-col justify-center p-8 md:p-10">
          <div className="text-center">
            <Scroll className="mx-auto mb-3 h-12 w-12 text-amber-900" />
            <h1 className="text-3xl text-stone-900 tracking-wide">Roomroll Tavern Gate</h1>
            <p className="mt-2 text-sm text-stone-700">Login stands in the center of the battlefield — dragons left, party right.</p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-stone-700">Adventurer Name</label>
              <input
                type="text"
                placeholder="Enter your hero name"
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
              Enter Session
            </button>
          </form>
        </ContentPanel>

        <section className="relative overflow-hidden rounded-2xl border border-sky-600/35 bg-gradient-to-bl from-sky-950/55 via-stone-950/70 to-black/70 p-6">
          <div className="absolute -right-6 top-2 text-7xl opacity-20">⚔️</div>
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-100/75">Right Flank</p>
            <h2 className="mt-2 text-3xl text-sky-50">Five Adventurers</h2>
            <p className="mt-2 text-sm text-sky-100/80">Two arcane wand users anchor the rear while three steel-bearers hold the line.</p>

            <div className="mt-6 space-y-3">
              {partyWing.map((member) => {
                const Icon = member.icon;
                return (
                  <article
                    key={member.name}
                    className="rounded-xl border border-sky-400/30 bg-sky-950/25 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-sky-50">{member.name} · {member.className}</p>
                        <p className="text-xs text-sky-100/70">{member.gear}</p>
                      </div>
                      <Icon className="h-5 w-5 text-sky-200" />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
