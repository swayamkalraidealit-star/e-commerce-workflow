import { useStore } from './store/useStore';
import ProgressStrip from './components/StepNav';
import InputStep from './components/steps/InputStep';
import DescriptionStep from './components/steps/DescriptionStep';
import PhotoStep from './components/steps/PhotoStep';
import VideoStep from './components/steps/VideoStep';
import PublishStep from './components/steps/PublishStep';

export default function App() {
  const step = useStore((s) => s.step);
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="wrap">
      {/* MASTHEAD */}
      <header className="masthead">
        <div className="mast-left">
          <div className="mast-logo">PRODUCT<sup>STUDIO</sup></div>
          <div className="mast-tagline">Commerce Studio</div>
        </div>
        <div className="mast-date">{date}</div>
      </header>

      <div className="issue-line">
        <span>n8n Workflow Engine</span>
        <span className="issue-sep">/</span>
        <span>AI Description Generation</span>
        <span className="issue-sep">/</span>
        <span>Video Production</span>
        <span className="issue-sep">/</span>
        <span>Ecommerce Publishing</span>
      </div>

      {/* HEADLINE */}
      {step === 1 && (
        <div className="headline-block">
          <div>
            <div className="hl-kicker">Automated Product Creation</div>
            <h1 className="hl-title">Input.<br /><em>Generate.</em><br />Publish.</h1>
          </div>
          <div className="hl-aside">
            <div className="hl-aside-label">How it works</div>
            <div className="hl-aside-body">
              Enter your product name and a brief description. The AI workflow crafts a polished listing,
              generates a product image and video, then publishes everything to your storefront in one pipeline.
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS */}
      <ProgressStrip />

      {/* STEPS */}
      {step === 1 && <InputStep />}
      {step === 2 && <DescriptionStep />}
      {step === 3 && <PhotoStep />}
      {step === 4 && <VideoStep />}
      {step === 5 && <PublishStep />}

      {/* FOOTER */}
      <footer>
        <div className="foot-copy">PRODUCT — AI Commerce Studio</div>
        <div className="foot-power">Powered by <span>n8n</span> workflow automation</div>
      </footer>
    </div>
  );
}
