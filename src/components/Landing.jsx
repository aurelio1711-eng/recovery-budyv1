import { motion } from 'motion/react';
import './Landing.css';

const spring = { type: 'spring', stiffness: 120, damping: 16, mass: 0.8 };

const features = [
  { icon: '⊞', title: 'Track Groups', desc: 'Log attendance across clinical and non-clinical sessions' },
  { icon: '◎', title: 'Monitor Progress', desc: 'Visual overview of completed vs. required sessions' },
  { icon: '⬡', title: 'Earn Certificates', desc: 'Automatic certificate tracking as you complete programs' },
  { icon: '⟡', title: 'Weekend Pass', desc: 'Work toward your 30-day pass eligibility milestone' },
];

export default function Landing({ onStart }) {
  return (
    <motion.main
      className="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="landing-bg">
        <div className="landing-bg-glow" />
      </div>

      <div className="landing-content">
        <motion.div
          className="landing-brand"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
        >
          <span className="landing-logo">⟡</span>
          <h1 className="landing-title">Recovery Buddy</h1>
          <p className="landing-subtitle">
            Your personal companion for tracking recovery program attendance
          </p>
        </motion.div>

        <motion.section
          className="landing-features"
          aria-labelledby="features-heading"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
        >
          <h2 id="features-heading" className="sr-only">Key Features</h2>
          {features.map((f) => (
            <motion.article
              key={f.title}
              className="landing-feature"
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: spring },
              }}
            >
              <span className="landing-feature-icon" aria-hidden="true">{f.icon}</span>
              <div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            </motion.article>
          ))}
        </motion.section>

        <motion.button
          className="landing-start"
          onClick={onStart}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.55 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Get Started
        </motion.button>

        <motion.p
          className="landing-footer"
          role="contentinfo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          Your data stays on this device — nothing is uploaded
        </motion.p>
      </div>
    </motion.main>
  );
}
