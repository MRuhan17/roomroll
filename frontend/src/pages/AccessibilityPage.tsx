import { AmbientBackdrop, BrandMark, SectionEyebrow, Reveal, SurfaceCard } from "@/components/landing/LandingPrimitives";
import { Link } from "react-router-dom";

export function AccessibilityPage() {
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
            <SectionEyebrow>Inclusivity & Access</SectionEyebrow>
            <h1 className="landing-title-shadow mt-8 font-display text-[3rem] font-semibold uppercase leading-[0.92] text-[#f5efe2] md:text-[4.25rem]">
              Accessibility Statement
            </h1>
            <p className="mt-7 text-lg leading-8 text-[#d7d0c4]/86">
              RoomRoll is committed to making digital tabletop gaming accessible to everyone. 
              We continuously audit and improve our platform to ensure it can be enjoyed by users of all abilities.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mt-14 space-y-12">
            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">Supported Features</h2>
              <ul className="list-disc pl-5 space-y-3 text-[#cbc3b5]/82 leading-7">
                <li><strong>Keyboard Navigation:</strong> All interactive elements, including modals and forms, are fully navigable via keyboard.</li>
                <li><strong>Screen Reader Compatibility:</strong> We utilize ARIA attributes to ensure semantic understanding for assistive technologies.</li>
                <li><strong>Reduced Motion:</strong> Users can disable cinematic animations and transitions via our Accessibility Settings or OS preferences.</li>
                <li><strong>High Contrast Mode:</strong> A dedicated toggle is available to improve text legibility and contrast across the application.</li>
                <li><strong>Large Text:</strong> Interface text scales dynamically to accommodate users requiring larger fonts.</li>
              </ul>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">Known Limitations</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                While we strive for comprehensive accessibility, certain highly visual components, such as the Tactical Combat Grid, present unique challenges. 
                We are actively exploring auditory or text-based alternatives for mapping and positioning.
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-8 md:p-10">
              <h2 className="font-display text-[2rem] uppercase text-[#f1e9db] mb-4">Contact Us</h2>
              <p className="text-[#cbc3b5]/82 leading-8">
                If you encounter any accessibility barriers on RoomRoll, please let us know. 
                We welcome your feedback and are dedicated to resolving issues promptly.
                <br /><br />
                Email: <a href="mailto:accessibility@roomroll.co.in" className="text-[#d5b45d] hover:underline">accessibility@roomroll.co.in</a>
              </p>
            </SurfaceCard>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
