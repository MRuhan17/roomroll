import { AmbientBackdrop, BrandMark, SectionEyebrow, Reveal, SurfaceCard } from "@/components/landing/LandingPrimitives";
import { Link } from "react-router-dom";

export function TermsOfServicePage() {
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
              Terms of Service
            </h1>
            <p className="mt-7 text-lg leading-8 text-[#d7d0c4]/86">
              Last updated: June 4, 2026. <br />
              Welcome to RoomRoll. By accessing our platform, you agree to these rules of engagement.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-14 space-y-12">
            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">1. Acceptance of Terms</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                By creating an account, you agree to be bound by these Terms. 
                RoomRoll provides an AI-augmented tabletop role-playing platform. You must be at least 13 years old to use the platform.
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">2. User Generated Content</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                You retain ownership of the characters, lore, and worlds you bring to RoomRoll. 
                However, by hosting sessions on our platform, you grant us a license to process and store this content to provide our services.
                You agree not to upload illegal, highly offensive, or copyright-infringing materials.
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">3. AI Interactions</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                The AI Dungeon Master relies on non-deterministic generation. RoomRoll is not responsible for the unpredictable nature of AI-generated responses. 
                Users are strictly prohibited from attempting to bypass AI safety filters or using the AI to generate harmful content.
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">4. Account Termination</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                We reserve the right to suspend or terminate accounts that violate these Terms. 
                You may also terminate your account at any time, which will result in the immediate and unrecoverable deletion of your data.
              </p>
            </SurfaceCard>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
