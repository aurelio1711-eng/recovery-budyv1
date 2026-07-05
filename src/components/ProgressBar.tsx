import { m } from 'motion/react';

interface Props {
  value: number;
}

export default function ProgressBar({ value }: Props) {
  const percentage = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 bg-border rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% complete`}
    >
      <m.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
