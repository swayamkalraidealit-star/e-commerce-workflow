import { useStore } from '../store/useStore';

const STEPS = [
  { n: 1, label: 'Product Input' },
  { n: 2, label: 'AI Description' },
  { n: 3, label: 'Photo Generation' },
  { n: 4, label: 'Video Production' },
  { n: 5, label: 'Publish' },
];

export default function ProgressStrip() {
  const step = useStore((s) => s.step);
  return (
    <div className="progress-strip">
      {STEPS.map((s) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className={`prog-step${active ? ' active' : ''}${done ? ' done' : ''}`}>
            <div className="prog-num">{String(s.n).padStart(2, '0')}</div>
            <div className="prog-label">{s.label}</div>
            <div className="prog-tick">x</div>
            <div className="prog-bar" />
          </div>
        );
      })}
    </div>
  );
}
