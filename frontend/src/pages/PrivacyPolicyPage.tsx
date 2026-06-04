import { AmbientBackdrop, BrandMark, SectionEyebrow, Reveal, SurfaceCard } from "@/components/landing/LandingPrimitives";
import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050507] text-[#f5efe2]">
      <AmbientBackdrop />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(5,5,7,0.76)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-8 px-5 py-4 md:px-8">
          <Link to="/" className="shrink-0">
            <BrandMark compact />
          </Link>
          <Link to="/" className="text-[0.68rem] uppercase tracking-[0.32em] text-[#b8b1a3] transition-colors hover:text-[#f0ebde]">
            Return Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-5 py-24 md:px-8 md:py-28">
        <div className="relative mx-auto max-w-[960px]">
          <Reveal>
            <SectionEyebrow>Legal & Compliance</SectionEyebrow>
            <h1 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.25rem]">
              Privacy Policy
            </h1>
            <p className="mt-7 text-lg leading-8 text-[#d7d0c4]/86">
              Last updated: June 4, 2026. <br />
              Your privacy is fundamentally important to RoomRoll. This policy outlines our practices concerning your personal data and AI interactions.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-14 space-y-12">
            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">1. Data We Collect</h2>
              <p className="text-[#cbc3b5]/82 leading-8 mb-4">
                We collect information you provide directly to us:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#cbc3b5]/82 leading-7">
                <li><strong>Account Data:</strong> Email address, display name, and securely hashed passwords.</li>
                <li><strong>Campaign Data:</strong> Worlds, maps, tokens, lore, and chat logs created during sessions.</li>
                <li><strong>Technical Data:</strong> IP addresses, browser types, and accessibility preferences.</li>
              </ul>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">2. AI & Data Usage</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                RoomRoll utilizes third-party AI models (e.g., OpenAI) to power the AI Dungeon Master. 
                Your campaign logs, prompts, and character sheets are sent to these providers exclusively for the purpose of generating the story.
                <strong> We do not use your private campaign data to train our own models without explicit opt-in.</strong>
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">3. Data Retention & Deletion</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                We retain your account data for as long as your account is active. 
                You have the right to request a full export of your data or permanently delete your account at any time through the Settings panel.
                Account deletion cascades and removes all associated personal data from our servers.
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">4. Cookies & Tracking</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                We use cookies to maintain your session (Essential) and to understand how our platform is used (Analytics). 
                You can manage your consent preferences at any time via the Cookie Settings accessible in the footer.
              </p>
            </SurfaceCard>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
