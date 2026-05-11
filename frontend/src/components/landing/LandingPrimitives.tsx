import { type CSSProperties, type ReactNode, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

const emberSeeds = [
  { left: "4%", top: "76%", delay: "0s", duration: "10s" },
  { left: "10%", top: "88%", delay: "1.6s", duration: "11s" },
  { left: "16%", top: "68%", delay: "3.2s", duration: "8.8s" },
  { left: "23%", top: "82%", delay: "0.4s", duration: "9.6s" },
  { left: "31%", top: "72%", delay: "4.5s", duration: "10.8s" },
  { left: "38%", top: "90%", delay: "2.8s", duration: "9s" },
  { left: "48%", top: "70%", delay: "5.4s", duration: "11.5s" },
  { left: "56%", top: "86%", delay: "2s", duration: "8.4s" },
  { left: "63%", top: "78%", delay: "4s", duration: "10.4s" },
  { left: "71%", top: "92%", delay: "0.8s", duration: "9.2s" },
  { left: "79%", top: "72%", delay: "5.8s", duration: "11.2s" },
  { left: "88%", top: "84%", delay: "1.1s", duration: "10.1s" },
];

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  x?: number;
  y?: number;
};

export function AmbientBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_#09090b_0%,_#050507_48%,_#040405_100%)]" />
      <div className="landing-noise absolute inset-0 opacity-70" />
      <div className="landing-grid absolute inset-0 opacity-25" />
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.22, 0.38, 0.22] }}
        transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="landing-breathe absolute left-[-8rem] top-[9rem] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,_rgba(117,13,13,0.26),_transparent_72%)] blur-3xl"
      />
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.16, 0.3, 0.16] }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        className="landing-breathe absolute right-[-10rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(205,152,44,0.12),_transparent_70%)] blur-3xl"
      />
      <motion.div
        animate={reduceMotion ? undefined : { opacity: [0.12, 0.24, 0.12] }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1.2 }}
        className="landing-breathe absolute bottom-[-7rem] left-[30%] h-[20rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(135,17,17,0.18),_transparent_70%)] blur-3xl"
      />
    </div>
  );
}

export function Embers({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {emberSeeds.map((seed, index) => (
        <span
          key={`${seed.left}-${seed.top}-${index}`}
          className="landing-ember"
          style={
            {
              left: seed.left,
              top: seed.top,
              animationDelay: seed.delay,
              ["--ember-duration" as string]: seed.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative flex items-center justify-center",
          compact ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        <span className="absolute inset-0 rotate-45 rounded-[0.5rem] border border-[#7d5a27]/70 bg-black/50 shadow-[0_0_0_1px_rgba(229,185,88,0.12),0_0_24px_rgba(146,30,22,0.12)]" />
        <span className="relative font-display text-base font-semibold tracking-[0.22em] text-[#d6b15a]">
          R
        </span>
      </div>
      <span className="font-sans text-sm font-medium tracking-[0.22em] text-[#f1ede4]">
        ROOMROLL
      </span>
    </div>
  );
}

export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.38em] text-[#b89a52]", className)}>
      <span className="h-px w-10 bg-[#8f733f]/80" />
      <span>{children}</span>
    </div>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  x = 0,
  y = 32,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SurfaceCard({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -8,
              borderColor: "rgba(214, 177, 90, 0.36)",
              boxShadow:
                "0 28px 70px rgba(0,0,0,0.44), 0 0 0 1px rgba(214,177,90,0.12)",
            }
      }
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "landing-panel rounded-[1.35rem] transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

type ParallaxMediaProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
};

export function ParallaxMedia({
  src,
  alt,
  className,
  imageClassName,
  children,
}: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [46, -46]);
  const scale = useTransform(scrollYProgress, [0, 1], reduceMotion ? [1, 1] : [1.04, 1.1]);

  return (
    <div
      ref={ref}
      className={cn(
        "landing-panel relative overflow-hidden rounded-[1.75rem] border border-white/10",
        className,
      )}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale }}
        className={cn("h-full w-full object-cover", imageClassName)}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(4,4,6,0.08),_rgba(4,4,6,0.32)_65%,_rgba(4,4,6,0.68))]" />
      {children}
    </div>
  );
}
