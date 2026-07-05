import { m } from 'motion/react';
import logo from '../RB.webp';

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface Props {
  onStart: () => void;
}

const spring = { type: 'spring' as const, stiffness: 120, damping: 16, mass: 0.8 };

const features: Feature[] = [
  { icon: '⊞', title: 'Track Groups', desc: 'Log attendance across clinical and non-clinical sessions' },
  { icon: '◎', title: 'Monitor Progress', desc: 'Visual overview of completed vs. required sessions' },
  { icon: '⟡', title: 'Weekend Pass', desc: 'Work toward your 30-day pass eligibility milestone' },
];

export default function Landing({ onStart }: Props) {
  return (
    <m.main
      className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B1121] via-[#0F172A] via-40% via-[#0F3D39] via-70% to-[#0B1121] px-6 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.18)_0%,rgba(15,118,110,0.06)_40%,transparent_70%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-10 max-w-[440px] w-full text-center max-sm:gap-8">
        <m.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          <img src={logo} width="110" height="110" alt="Recovery Buddy" className="w-[clamp(64px,12vw,128px)] h-[clamp(64px,12vw,128px)] drop-shadow-[0_0_12px_rgba(15,118,110,0.4)]" fetchpriority="high" />
          <h1 className="font-heading text-[2.5rem] max-sm:text-[2rem] font-bold tracking-tight text-slate-100 leading-tight">
            Recovery Buddy
          </h1>
          <p className="font-body text-sm max-w-[320px] leading-relaxed text-slate-400">
            Your personal companion for tracking recovery program attendance
          </p>
        </m.div>

        <m.section
          className="flex flex-col gap-3 w-full"
          aria-labelledby="features-heading"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
        >
          <h2 id="features-heading" className="sr-only">Key Features</h2>
          {features.map((f) => (
            <m.article
              key={f.title}
              className="flex items-center gap-3.5 bg-white/4 border border-white/6 rounded-[var(--radius-md)] p-3.5 text-left max-sm:p-3"
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: spring },
              }}
            >
              <span className="shrink-0 text-[1.35rem] leading-none text-primary opacity-80 w-7 flex items-center justify-center" aria-hidden="true">{f.icon}</span>
              <div>
                <h3 className="font-heading text-sm font-semibold text-slate-200 mb-0.5">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </m.article>
          ))}
        </m.section>

        <m.button
          className="font-heading text-base font-semibold py-3.5 px-12 max-sm:px-10 max-sm:w-full max-sm:max-w-[300px] border-none rounded-[var(--radius-lg)] bg-primary text-white cursor-pointer tracking-wide shadow-[0_4px_20px_rgba(15,118,110,0.35)] hover:bg-primary-dark hover:shadow-[0_6px_28px_rgba(15,118,110,0.45)] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px] transition-[background,box-shadow] duration-200"
          onClick={onStart}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Get Started
        </m.button>

        <m.p
          className="text-xs text-slate-600 leading-relaxed"
          role="contentinfo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          Your data stays on this device — nothing is uploaded
        </m.p>
      </div>
    </m.main>
  );
}
