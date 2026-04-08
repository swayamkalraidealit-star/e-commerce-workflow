import { useStore } from '../store/useStore';

const STEPS = [
  { n: 1, label: 'Product Input' },
  { n: 2, label: 'AI Description' },
  { n: 3, label: 'Photo Generation' },
  { n: 4, label: 'Video Production' },
  { n: 5, label: 'Publish' },
];

export default function ProgressStrip() {
  const {
    step,
    progressStep,
    enhancedName,
    uniqueKey,
    imageUrl,
    videoUrl,
    publishStatus,
    loading,
    setStep,
  } = useStore();
  const maxUnlockedStep =
    publishStatus || step === 5
      ? 5
      : videoUrl
        ? 4
        : imageUrl
          ? 3
          : enhancedName || uniqueKey
            ? 2
            : 1;
  const busy = loading || progressStep !== step;

  return (
    <div className="progress-strip">
      {STEPS.map((s) => {
        const done = progressStep > s.n;
        const active = progressStep === s.n;
        const enabled = !busy && s.n <= maxUnlockedStep;
        return (
          <button
            key={s.n}
            type="button"
            className={`prog-step${active ? ' active' : ''}${done ? ' done' : ''}`}
            onClick={() => enabled && setStep(s.n as typeof step)}
            disabled={!enabled}
            aria-current={active ? 'step' : undefined}
          >
            <div className="prog-num">{String(s.n).padStart(2, '0')}</div>
            <div className="prog-label">{s.label}</div>
            <div className="prog-tick">x</div>
            <div className="prog-bar" />
          </button>
        );
      })}
    </div>
  );
}
