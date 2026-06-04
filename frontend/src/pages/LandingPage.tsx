import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  BookOpenText,
  Clapperboard,
  MessageSquareQuote,
  Play,
  RadioTower,
  Shield,
  Sparkles,
  Sword,
  Trees,
} from "lucide-react";
import {
  AmbientBackdrop,
  BrandMark,
  Embers,
  ParallaxMedia,
  Reveal,
  SectionEyebrow,
  SurfaceCard,
} from "@/components/landing/LandingPrimitives";
import heroBackground from "@/assets/landing/hero-bg.jpg";
import loreMap from "@/assets/landing/lore-map.jpg";
import cryptPanel from "@/assets/landing/crypt-panel.jpg";
import battleMap from "@/assets/landing/battle-map.jpg";
import diceTable from "@/assets/landing/dice-table.jpg";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { label: "The World", href: "#the-world" },
  { label: "AI Dungeon Master", href: "#ai-dungeon-master" },
  { label: "Tactical Combat", href: "#tactical-combat" },
  { label: "Lore Feed", href: "#lore-feed" },
  { label: "Community", href: "#community" },
];

const introCards = [
  {
    icon: Sparkles,
    title: "Living World",
    body: "A persistent realm shaped by every campaign. Your battles leave craters, your alliances redraw borders, and your enemies return generations later.",
  },
  {
    icon: BookOpenText,
    title: "AI Storyteller",
    body: "A cinematic Dungeon Master that remembers every oath, betrayal, and whispered secret, then weaves them back when you least expect it.",
  },
  {
    icon: Sword,
    title: "Tactical Theatre",
    body: "A modern combat surface with glowing tokens, fog of war, and evocative VFX built for streamers and designed for legends.",
  },
  {
    icon: RadioTower,
    title: "Multiplayer, Always",
    body: "Synchronized dice, shared narration, and voice-aware presence so the whole table can feel the same silence at once.",
  },
];

const sessionBullets = [
  {
    title: "Dynamic Scene Lighting",
    body: "Sessions shift with the in-world hour, weather, and danger.",
  },
  {
    title: "Ambient Soundscapes",
    body: "A living score that reacts to player choices in real time.",
  },
  {
    title: "Persistent Memory",
    body: "Your blood oath in Chapter II will still be remembered in Chapter IX.",
  },
];

const narratorStats = [
  { value: "1.4M+", label: "Tokens Recalled" },
  { value: "120+", label: "NPC Personalities" },
  { value: "∞", label: "Stories Possible" },
];

const battleCards = [
  {
    title: "Fog of War",
    body: "Vision falls off naturally, like torchlight in a dungeon.",
    icon: Shield,
  },
  {
    title: "Living Tokens",
    body: "Mood, status, and intent telegraphed through glow and framing.",
    icon: Sparkles,
  },
  {
    title: "Cinematic Camera",
    body: "Auto-frames decisive moments, ready to clip and share.",
    icon: Clapperboard,
  },
];

const realmTimeline = [
  {
    chapter: "I",
    cycle: "Cycle I",
    title: "The Sundering",
    body: "Three kingdoms fell on a single moonless night. The land remembers each one.",
  },
  {
    chapter: "II",
    cycle: "Cycle II",
    title: "The Quiet Years",
    body: "Travellers stopped returning from the high passes. Maps began to lie.",
  },
  {
    chapter: "III",
    cycle: "Cycle III",
    title: "The Age of Players",
    body: "You arrive. The world has been waiting, and it has been keeping score.",
  },
];

const loreEntries = [
  {
    tag: "War",
    day: "Day 412 · Third Cycle",
    title: "The Crimson Banner Falls at Eldermere",
    body: "After six campaigns of bloodshed, the gates of Eldermere have shattered. The Crimson Banner now flies over the keep.",
    source: "House Varron",
    accent: "text-[#b94f4f]",
  },
  {
    tag: "Discovery",
    day: "Day 418 · Third Cycle",
    title: "An Unmarked Crypt Discovered Beneath Hollowfen",
    body: "A scout party stumbled into a doorless chamber sealed in obsidian. Whatever sleeps inside has been waiting since before the Sundering.",
    source: "Wandering Players",
    accent: "text-[#87a8ff]",
  },
  {
    tag: "Politics",
    day: "Day 420 · Third Cycle",
    title: "The Whispering Council Issues a Bounty",
    body: "Twelve thousand crowns for the head of the Oathbreaker. The reward grows by one crown each hour she remains free.",
    source: "The Whispering Council",
    accent: "text-[#d5b45d]",
  },
  {
    tag: "Lore",
    day: "Day 423 · Third Cycle",
    title: "Stormcaller’s Tower Returns from the Mist",
    body: "After three hundred years lost to the Midlands, the tower has reappeared on the cliffs of Vaelmar with its windows lit.",
    source: "Arcane Concord",
    accent: "text-[#9b8fe4]",
  },
  {
    tag: "Politics",
    day: "Day 425 · Third Cycle",
    title: "The Iron Pact Is Broken",
    body: "For the first time in a thousand years, the Holds march against the surface kingdoms. The earth itself trembles in answer.",
    source: "Dwarven Holds of Khar-Dum",
    accent: "text-[#d5b45d]",
  },
  {
    tag: "Discovery",
    day: "Day 426 · Third Cycle",
    title: "A Dragon’s Egg Surfaces in the Auction Halls",
    body: "Bidding opens at fifty thousand crowns. The seller cannot be found, but witnesses claim the egg is warm to the touch.",
    source: "The Black Market",
    accent: "text-[#87a8ff]",
  },
];

const audienceCards = [
  {
    icon: RadioTower,
    title: "Streamer Native",
    body: "Cinematic camera framing, royalty-free music beds, and click-to-clip highlights. Your audience will think you have a film crew.",
    link: "For Creators →",
  },
  {
    icon: MessageSquareQuote,
    title: "A Real Table",
    body: "Voice presence, whisper channels, table emotes, and in-character DMs. The intimacy of a long session, anywhere on Earth.",
    link: "For Players →",
  },
  {
    icon: Trees,
    title: "Open Worlds",
    body: "Bring your own setting, your own monsters, and your own pantheon. RoomRoll learns your canon and stays inside the lines.",
    link: "For Worldbuilders →",
  },
];

const footerColumns = [
  {
    title: "Platform",
    links: ["AI Dungeon Master", "Tactical Combat", "Lore Feed", "Waitlist"],
  },
  {
    title: "Community",
    links: ["Creators Program", "Discord", "Campaign Circle", "Events"],
  },
  {
    title: "The Codex",
    links: ["Lore Wiki", "Press", "Manifesto", "Enter the Table"],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Accessibility", href: "/accessibility" }
    ],
  },
];

function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "text-[0.68rem] uppercase tracking-[0.34em] text-[#ddd7ca]/86 transition-colors duration-300 hover:text-[#f5efe2]",
        className,
      )}
    >
      {children}
    </a>
  );
}

function CtaLink({
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const shared =
    "inline-flex items-center justify-center gap-3 rounded-sm border px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.32em] transition-all duration-300 cursor-pointer";

  if (variant === "ghost") {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cn(
          shared,
          "border-[#7e6840]/60 bg-black/20 text-[#d7bf78] hover:border-[#d7bf78]/70 hover:bg-[#d7bf78]/8",
          className,
        )}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        shared,
        "border-[#8a1d1a] bg-[linear-gradient(180deg,_#ab211f,_#7d1011)] text-[#f7efe5] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_18px_40px_rgba(134,17,17,0.22)] hover:-translate-y-0.5 hover:shadow-[0_18px_48px_rgba(134,17,17,0.28)]",
        className,
      )}
    >
      {children}
    </a>
  );
}

function LandingNav({ onEnter }: { onEnter: () => void }) {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(5,5,7,0.76)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-8 px-5 py-4 md:px-8">
        <a href="#top" className="shrink-0">
          <BrandMark compact />
        </a>
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {!user && (
            <a
              href="/login"
              className="hidden text-[0.68rem] uppercase tracking-[0.32em] text-[#b8b1a3] transition-colors hover:text-[#f0ebde] sm:inline-flex"
            >
              Login
            </a>
          )}
          <CtaLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); onEnter(); }} 
            className="px-5 py-3 text-[0.66rem]"
          >
            {user ? "Resume Journey" : "Enter Roomroll"}
          </CtaLink>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onEnter }: { onEnter: () => void }) {
  const user = useAuthStore((state) => state.user);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const backgroundY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 140]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1.02, 1.12]);
  const contentY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 84]);
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.56]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate min-h-[calc(100svh-77px)] overflow-hidden border-b border-white/6"
    >
      <motion.div
        style={{ y: backgroundY, scale: backgroundScale }}
        className="absolute inset-0"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_34%,_rgba(255,255,255,0.06),_transparent_24%),linear-gradient(90deg,_rgba(0,0,0,0.68)_0%,_rgba(0,0,0,0.28)_46%,_rgba(0,0,0,0.7)_100%),linear-gradient(180deg,_rgba(0,0,0,0.28)_0%,_rgba(5,5,8,0.46)_60%,_rgba(5,5,8,0.96)_100%)]" />
      </motion.div>

      <Embers className="opacity-90" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-77px)] w-full max-w-[1240px] items-center px-5 pb-28 pt-16 md:px-8 md:pb-32 lg:pt-20">
        <motion.div style={{ y: contentY, opacity: contentOpacity }} className="max-w-[760px]">
          <Reveal>
            <SectionEyebrow className="mb-8">Chapter One · An Invitation</SectionEyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="landing-title-shadow font-display text-[3.5rem] font-semibold uppercase leading-[0.86] text-[#f6f2e8] sm:text-[4.4rem] md:text-[5.9rem] lg:text-[7rem]">
              <span className="block">Where Legends</span>
              <span className="block">
                Are <span className="text-[#d5b45d]">Remembered.</span>
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.14} className="mt-8 max-w-[660px]">
            <p className="text-lg leading-8 text-[#d6d1c8]/88 md:text-[1.32rem] md:leading-9">
              An AI-powered, cinematic tabletop world where every roll alters history,
              every campaign carves a scar into the realm, and no story is ever forgotten.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <CtaLink href="#" onClick={(e) => { e.preventDefault(); onEnter(); }}>
              {user ? "Continue Campaign" : "Begin Your Campaign"}
            </CtaLink>
            <CtaLink href="#the-world" variant="ghost">
              <Play className="h-4 w-4" strokeWidth={1.7} />
              Watch the World Awaken
            </CtaLink>
          </Reveal>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute left-7 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[0.68rem] uppercase tracking-[0.34em] text-[#8e8778]/65 lg:block">
        An Oath in Every Roll
      </div>

      <a
        href="#the-world"
        className="absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[0.68rem] uppercase tracking-[0.34em] text-[#c7bc9c]/88 transition-colors hover:text-[#f4efe3]"
      >
        Descend
        <span className="h-10 w-px bg-gradient-to-b from-[#c7bc9c]/80 to-transparent" />
      </a>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/6 px-5 py-20 md:px-8 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(114,122,163,0.12),_transparent_36%),linear-gradient(180deg,_rgba(13,13,17,0.88),_rgba(6,6,9,0.95))]" />
      <div className="relative mx-auto max-w-[1100px]">
        <Reveal className="text-center">
          <div className="mx-auto mb-10 flex max-w-[180px] items-center justify-center gap-3">
            <span className="h-px flex-1 bg-[#78643e]/70" />
            <span className="text-[#b99d57]">✦</span>
            <span className="h-px flex-1 bg-[#78643e]/70" />
          </div>
          <blockquote className="font-display text-[2.2rem] italic leading-[1.18] text-[#ece5d6] md:text-[3rem] lg:text-[3.7rem]">
            “The dice were cast long before you sat at this table.
            <br className="hidden md:block" /> The world has simply been waiting for your hand.”
          </blockquote>
          <p className="mt-9 text-[0.72rem] uppercase tracking-[0.42em] text-[#948d7e]">
            — From the Codex of Veylen, recovered in Hollowfen
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function ConversationPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <SurfaceCard className="relative overflow-hidden rounded-[1.75rem] p-8 md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,177,90,0.12),_transparent_34%),linear-gradient(180deg,_rgba(28,24,15,0.65),_transparent_55%)]" />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between text-[0.68rem] uppercase tracking-[0.34em] text-[#c7b98f]/86">
          <div className="flex items-center gap-3">
            <span className="landing-live-dot h-2.5 w-2.5 rounded-full bg-[#c22e24]" />
            Session Live · Hollowfen Crypt
          </div>
          <span>Ch. IV</span>
        </div>
        <div className="ml-auto max-w-[76%] rounded-[1.15rem] border border-white/8 bg-[rgba(17,17,20,0.76)] px-6 py-5 text-[#ebe4d6] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[#c0b087]">
            Kael, Halfling Rogue
          </p>
          <p className="mt-3 text-lg leading-7">
            I push the stone door of the ancient crypt open.
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-[#7a442a]/35 bg-[linear-gradient(180deg,_rgba(56,18,14,0.64),_rgba(24,13,11,0.42))] px-7 py-7">
          <div className="mb-4 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.34em] text-[#cfbc8f]">
            <span className="rounded-full border border-[#8a6634]/50 px-2 py-1">✧</span>
            AI Dungeon Master
          </div>
          <p className="text-[1.15rem] italic leading-8 text-[#f0e9dc]">
            The slab groans against centuries of silence. Cold air spills out, smelling of
            iron and old prayers. A pale glow pulses somewhere far below, slow, like a
            heartbeat that has waited a very long{" "}
            <motion.span
              animate={reduceMotion ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.05, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="inline-block h-6 w-[0.38rem] translate-y-1 bg-[#d7b762]"
            />
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="rounded-[1rem] border border-white/8 bg-black/28 px-5 py-4 text-[#8d877c]">
            Type your action...
          </div>
          <button
            type="button"
            className="rounded-[1rem] border border-[#7b643a]/60 bg-[rgba(39,28,16,0.78)] px-7 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-[#d7c28d] transition-colors hover:bg-[rgba(60,42,21,0.88)]"
          >
            Speak
          </button>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const handleEnter = () => {
    if (user) {
      navigate("/campaigns");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050507] text-[#f5efe2]">
      <AmbientBackdrop />
      <LandingNav onEnter={handleEnter} />

      <main className="relative z-10">
        <HeroSection onEnter={handleEnter} />
        <QuoteSection />

        <section id="the-world" className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_center,_rgba(117,18,19,0.18),_transparent_70%)] blur-3xl" />
          <div className="relative mx-auto max-w-[1240px]">
            <Reveal className="max-w-[780px]">
              <SectionEyebrow>What Is RoomRoll</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 max-w-[840px] font-display text-[3rem] font-semibold uppercase leading-[0.9] text-[#f4eee2] md:text-[4.5rem] lg:text-[5.15rem]">
                A Cinematic Gateway Into the Future of{" "}
                <span className="text-[#d5b45d]">Collaborative Storytelling.</span>
              </h2>
              <p className="mt-8 max-w-[760px] text-lg leading-8 text-[#d8d1c6]/88 md:text-[1.18rem] md:leading-9">
                RoomRoll is part tabletop, part theatre, part AAA experience. It holds the
                spirit of a smoky tavern session and the polish of a cinematic title screen,
                held together by an AI that watches, remembers, and surprises.
              </p>
            </Reveal>

            <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {introCards.map((card, index) => (
                <Reveal key={card.title} delay={index * 0.06}>
                  <SurfaceCard className="h-full p-7">
                    <card.icon className="h-5 w-5 text-[#d7b762]" strokeWidth={1.7} />
                    <h3 className="mt-8 font-display text-[1.9rem] uppercase leading-none text-[#f4ecdd]">
                      {card.title}
                    </h3>
                    <p className="mt-5 text-base leading-8 text-[#cbc3b5]/82">{card.body}</p>
                  </SurfaceCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <Reveal>
              <ParallaxMedia
                src={cryptPanel}
                alt="The Hollowfen Crypt preview panel"
                className="min-h-[420px] border-[#8a6e38]/24"
              />
            </Reveal>

            <Reveal delay={0.08}>
              <SectionEyebrow>Open Session</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.25rem]">
                Step Into a Session That{" "}
                <span className="text-[#d5b45d]">Feels Alive.</span>
              </h2>
              <p className="mt-7 max-w-[560px] text-lg leading-8 text-[#d7d0c4]/86">
                Light shifts as night falls in-world. Music swells when the orcs crest the
                ridge. Your AI Dungeon Master pauses, lets the silence hold, then asks,
                quietly: <span className="italic text-[#f2eadb]">What do you do?</span>
              </p>

              <div className="mt-11 space-y-7">
                {sessionBullets.map((bullet, index) => (
                  <Reveal key={bullet.title} delay={0.14 + index * 0.06}>
                    <div className="flex gap-5">
                      <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d8b85d] shadow-[0_0_14px_rgba(216,184,93,0.45)]" />
                      <div>
                        <h3 className="font-display text-[1.7rem] uppercase text-[#efe7d9]">
                          {bullet.title}
                        </h3>
                        <p className="mt-2 text-base leading-7 text-[#cbc3b5]/82">
                          {bullet.body}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="ai-dungeon-master" className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="absolute inset-y-0 left-0 w-[42%] bg-[radial-gradient(circle_at_center,_rgba(85,20,11,0.14),_transparent_72%)] blur-3xl" />
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[0.88fr_1.12fr]">
            <Reveal>
              <SectionEyebrow>The AI Dungeon Master</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.15rem]">
                A Narrator That{" "}
                <span className="text-[#d5b45d]">Never Forgets.</span>
              </h2>
              <p className="mt-7 max-w-[560px] text-lg leading-8 text-[#d7d0c4]/86">
                Reactive narration. Persistent memory. Improvised NPCs with their own moods,
                grudges, and dreams. Watch the AI weave a scene in real time below.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {narratorStats.map((stat, index) => (
                  <Reveal key={stat.label} delay={0.12 + index * 0.05}>
                    <SurfaceCard className="px-4 py-6 text-center">
                      <p className="font-display text-[2rem] uppercase text-[#d7b762]">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-[0.72rem] uppercase tracking-[0.34em] text-[#b9b09d]">
                        {stat.label}
                      </p>
                    </SurfaceCard>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <ConversationPanel />
            </Reveal>
          </div>
        </section>

        <section id="tactical-combat" className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto max-w-[1240px]">
            <Reveal className="max-w-[760px]">
              <SectionEyebrow>Tactical Theatre</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f4eee2] md:text-[4.4rem]">
                Battle, Rendered as{" "}
                <span className="text-[#d5b45d]">Cinema.</span>
              </h2>
              <p className="mt-7 max-w-[720px] text-lg leading-8 text-[#d7d0c4]/86">
                Modern, premium, elegant. Glowing tokens, animated fog of war, and
                line-of-sight that flickers as torches die. Built for streamers, not
                spreadsheets.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="mt-14">
              <ParallaxMedia
                src={battleMap}
                alt="RoomRoll tactical combat map"
                className="min-h-[380px] md:min-h-[620px]"
              >
                <div className="absolute left-1/2 top-[46%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(230,196,101,0.3),_transparent_68%)] blur-2xl" />
              </ParallaxMedia>
            </Reveal>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {battleCards.map((card, index) => (
                <Reveal key={card.title} delay={0.1 + index * 0.05}>
                  <SurfaceCard className="h-full p-7">
                    <card.icon className="h-5 w-5 text-[#d7b762]" strokeWidth={1.7} />
                    <h3 className="mt-8 font-display text-[1.8rem] uppercase text-[#f2ebdc]">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-[#cbc3b5]/82">{card.body}</p>
                  </SurfaceCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto max-w-[1240px]">
            <div className="absolute right-0 top-0 hidden w-[52%] overflow-hidden rounded-[1.9rem] border border-white/6 lg:block">
              <img
                src={loreMap}
                alt=""
                className="landing-shimmer h-full w-full object-cover opacity-28"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(5,5,7,0.25),_rgba(5,5,7,0.8))]" />
            </div>

            <Reveal className="relative max-w-[760px]">
              <SectionEyebrow>A Persistent Realm</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.3rem]">
                The World Goes On{" "}
                <span className="text-[#d5b45d]">Without You.</span>
              </h2>
              <p className="mt-7 max-w-[720px] text-lg leading-8 text-[#d7d0c4]/86">
                Factions scheme. Kingdoms fall. Trade routes shift. When you return to the
                table, the world has changed, sometimes because of you, sometimes despite you.
              </p>
            </Reveal>

            <div className="relative mt-16 max-w-[760px]">
              {realmTimeline.map((entry, index) => (
                <Reveal key={entry.title} delay={0.08 + index * 0.06}>
                  <div className="relative grid gap-5 pb-10 pl-16 sm:grid-cols-[auto_1fr]">
                    {index < realmTimeline.length - 1 ? (
                      <div className="absolute left-[1.1rem] top-[3.35rem] h-[calc(100%-1rem)] w-px bg-gradient-to-b from-[#735f38] via-[#4f4330] to-transparent" />
                    ) : null}
                    <div className="absolute left-0 top-2 flex h-9 w-9 items-center justify-center rounded-[0.55rem] border border-[#8b7542]/55 bg-[rgba(21,18,15,0.9)] font-display text-lg text-[#d7b762]">
                      {entry.chapter}
                    </div>
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.34em] text-[#b9af98]">
                        {entry.cycle}
                      </p>
                      <h3 className="mt-2 font-display text-[2.1rem] uppercase text-[#f1e9db]">
                        {entry.title}
                      </h3>
                      <p className="mt-3 text-base leading-8 text-[#cbc3b5]/82">{entry.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="community" className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
            <Reveal>
              <SectionEyebrow>Shared Unforgettable Moments</SectionEyebrow>
              <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f4eee2] md:text-[4.25rem]">
                One Table.
                <span className="mt-1 block text-[#d5b45d]">A Thousand Miles Apart.</span>
              </h2>
              <p className="mt-7 max-w-[560px] text-lg leading-8 text-[#d7d0c4]/86">
                Synchronized rolls. Shared narration. Voice-aware presence that knows when
                someone leans in to whisper. RoomRoll is built for tables that live in
                different cities but breathe inside the same world.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <ParallaxMedia
                src={diceTable}
                alt="Shared dice roll scene"
                className="min-h-[360px] border-[#866d39]/24"
                imageClassName="object-cover object-center"
              >
                <div className="absolute left-[52%] top-[68%] rounded-[0.7rem] border border-[#9a7b31]/60 bg-[rgba(26,22,13,0.84)] px-4 py-2 text-[0.68rem] uppercase tracking-[0.34em] text-[#d5ba72] shadow-[0_0_24px_rgba(181,142,47,0.18)]">
                  Crit · 20
                </div>
              </ParallaxMedia>
            </Reveal>
          </div>
        </section>

        <section id="lore-feed" className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto max-w-[1240px]">
            <Reveal>
              <div className="landing-panel relative overflow-hidden rounded-[1.8rem] border border-white/7">
                <img src={loreMap} alt="Living lore map" className="h-[260px] w-full object-cover opacity-78 md:h-[320px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(5,5,7,0.16),_rgba(5,5,7,0.82))]" />
                <div className="absolute left-[52%] top-[48%] h-5 w-5 rounded-full border border-[#f1d48e]/70 bg-[#d8ba67]/35 shadow-[0_0_24px_rgba(216,186,103,0.58)]" />
                <div className="absolute left-[28%] top-[36%] h-3.5 w-3.5 rounded-full bg-[#a91c21]/85 shadow-[0_0_18px_rgba(169,28,33,0.58)]" />
                <div className="absolute left-[70%] top-[63%] h-3.5 w-3.5 rounded-full bg-[#a91c21]/85 shadow-[0_0_18px_rgba(169,28,33,0.58)]" />
                <div className="absolute left-[17%] top-[72%] h-3.5 w-3.5 rounded-full bg-[#d8ba67]/8 shadow-[0_0_18px_rgba(216,186,103,0.38)]" />
              </div>
            </Reveal>

            <div className="mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <Reveal className="max-w-[760px]">
                <SectionEyebrow>The Living Lore Feed</SectionEyebrow>
                <h2 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.2rem]">
                  History Is Being Written{" "}
                  <span className="text-[#d5b45d]">Right Now.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.34em] text-[#c5baa0]">
                  <span className="landing-live-dot h-2.5 w-2.5 rounded-full bg-[#ba2325]" />
                  Live from 4,217 campaigns
                </div>
              </Reveal>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {loreEntries.map((entry, index) => (
                <Reveal key={entry.title} delay={0.06 * index}>
                  <SurfaceCard className="h-full p-7">
                    <div className="flex items-center justify-between gap-4 text-[0.68rem] uppercase tracking-[0.34em] text-[#aaa291]">
                      <span className={cn("rounded-full border border-current/20 px-3 py-1", entry.accent)}>
                        {entry.tag}
                      </span>
                      <span>{entry.day}</span>
                    </div>
                    <h3 className="mt-7 font-display text-[2rem] uppercase leading-[1.1] text-[#efe7d9]">
                      {entry.title}
                    </h3>
                    <p className="mt-5 text-base leading-8 text-[#cbc3b5]/82">{entry.body}</p>
                    <div className="mt-8 border-t border-white/8 pt-5 text-[0.72rem] uppercase tracking-[0.34em] text-[#c6b98c]">
                      {entry.source}
                    </div>
                  </SurfaceCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative px-5 py-24 md:px-8 md:py-28">
          <div className="relative mx-auto max-w-[1240px]">
            <Reveal className="mx-auto max-w-[960px] text-center">
              <h2 className="landing-title-shadow font-display text-[3rem] font-semibold uppercase leading-[0.94] text-[#f5efe2] md:text-[4.55rem]">
                Built for Everyone Who Has Ever{" "}
                <span className="text-[#d5b45d]">Rolled the Dice.</span>
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {audienceCards.map((card, index) => (
                <Reveal key={card.title} delay={0.06 * index}>
                  <SurfaceCard className="h-full p-8">
                    <card.icon className="h-5 w-5 text-[#d7b762]" strokeWidth={1.7} />
                    <h3 className="mt-8 font-display text-[2rem] uppercase text-[#f1e9db]">
                      {card.title}
                    </h3>
                    <p className="mt-5 text-base leading-8 text-[#cbc3b5]/82">{card.body}</p>
                    <div className="mt-10 text-[0.72rem] uppercase tracking-[0.34em] text-[#d1ba78]">
                      {card.link}
                    </div>
                  </SurfaceCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="final-chapter" className="relative overflow-hidden border-t border-white/6 px-5 pb-14 pt-24 md:px-8 md:pt-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(116,15,15,0.18),_transparent_34%),linear-gradient(180deg,_rgba(7,7,9,0.36),_rgba(5,5,7,0.96))]" />
          <div className="relative mx-auto max-w-[1240px]">
            <Reveal className="mx-auto max-w-[980px] text-center">
              <p className="font-display text-[4.3rem] font-semibold uppercase leading-[0.86] text-[#f5efe2] sm:text-[5rem] md:text-[6rem] lg:text-[7rem]">
                Around
                <span className="block text-[#d5b45d]">The Table.</span>
              </p>
              <p className="mx-auto mt-8 max-w-[760px] text-lg leading-8 text-[#d7d0c4]/86 md:text-[1.24rem]">
                The world is waiting. Forge your identity and step into a realm where every roll carves history.
              </p>
            </Reveal>

            <Reveal delay={0.08} className="mx-auto mt-12 flex justify-center">
              <CtaLink 
                href="#" 
                onClick={(e) => { e.preventDefault(); handleEnter(); }}
                className="px-10 py-5 text-[0.85rem]"
              >
                {user ? "Resume Your Story" : "Begin Your Journey"}
              </CtaLink>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="mt-16 text-center text-[0.78rem] uppercase tracking-[0.42em] text-[#857d71]">
                Every campaign leaves scars. Every roll changes the world.
              </p>
            </Reveal>

            <footer className="mt-20 border-t border-white/6 pt-10">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
                <Reveal>
                  <BrandMark />
                  <p className="mt-6 max-w-[340px] text-base leading-8 text-[#c9c2b4]/78">
                    A cinematic gateway into the future of AI-powered collaborative
                    storytelling.
                  </p>
                  {!user && (
                    <a
                      href="/login"
                      className="mt-6 inline-flex text-[0.72rem] uppercase tracking-[0.32em] text-[#d1bb78] transition-colors hover:text-[#f5edd8]"
                    >
                      Already sworn? Enter the table.
                    </a>
                  )}
                </Reveal>

                {footerColumns.map((column, index) => (
                  <Reveal key={column.title} delay={0.04 * index}>
                    <p className="text-[0.72rem] uppercase tracking-[0.36em] text-[#c6b88d]">
                      {column.title}
                    </p>
                    <div className="mt-5 space-y-4">
                      {column.links.map((link, i) => {
                        if (typeof link === 'string') {
                          if (link === "Waitlist") return null;
                          return (
                            <p key={link} className="text-base text-[#cdc5b7]/76 cursor-default">
                              {link}
                            </p>
                          );
                        } else {
                          return (
                            <a 
                              key={link.name} 
                              href={link.href}
                              className="block text-base text-[#cdc5b7]/76 hover:text-[#d5b45d] transition-colors"
                            >
                              {link.name}
                            </a>
                          );
                        }
                      })}
                    </div>
                  </Reveal>
                ))}
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
