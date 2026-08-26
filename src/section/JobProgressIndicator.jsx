import { motion } from 'motion/react';
import { Check, Loader2, Circle } from 'lucide-react';

const STEPS = [
  { id: 'narration', label: 'Generating narration script' },
  { id: 'script',   label: 'Writing animation script' },
  { id: 'audio',    label: 'Generating voice narration' },
  { id: 'render',   label: 'Rendering animation frames' },
  { id: 'merge',    label: 'Combining audio & video' },
];

const stepIndex = (stepId) => STEPS.findIndex(s => s.id === stepId);

const JobProgressIndicator = ({ step, stepLabel, progress }) => {
  const currentIndex = stepIndex(step);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1C1917]/95 rounded-lg p-8">
      {/* Circular progress ring */}
      <div className="relative mb-8">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#2C2522" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="#8B7355"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 42}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (progress || 0) / 100) }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#E6D5B8] text-lg font-bold">{progress || 0}%</span>
        </div>
      </div>

      {/* Current step label */}
      <motion.p
        key={stepLabel}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[#E6D5B8] font-semibold text-base mb-6 text-center"
      >
        {stepLabel || 'Starting…'}
      </motion.p>

      {/* Step list */}
      <div className="w-full max-w-xs space-y-2.5">
        {STEPS.map((s, i) => {
          const isDone    = currentIndex > i || step === 'done';
          const isCurrent = currentIndex === i && step !== 'done';
          const isPending = currentIndex < i && step !== 'done';

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Check className="w-4 h-4 text-[#6B9E78]" />
                  </motion.div>
                )}
                {isCurrent && <Loader2 className="w-4 h-4 text-[#8B7355] animate-spin" />}
                {isPending && <Circle className="w-3 h-3 text-[#4A3F37]" />}
              </div>
              <span className={`text-sm ${
                isDone    ? 'text-[#6B9E78]' :
                isCurrent ? 'text-[#E6D5B8]' :
                            'text-[#4A3F37]'
              }`}>
                {s.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="text-[#4A3F37] text-xs mt-6 text-center">
        This takes 1–3 minutes depending on the algorithm
      </p>
    </div>
  );
};

export default JobProgressIndicator;
