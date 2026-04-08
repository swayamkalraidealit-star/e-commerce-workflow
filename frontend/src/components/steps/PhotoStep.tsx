import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateVideo, checkVideoStatus, proxyImageUrl } from '../../lib/api';
import Loader from '../Loader';

export default function PhotoStep() {
  const { enhancedName, enhancedDesc, imageUrl, videoUrl, uniqueKey, setVideo, setLoading, setError, setStep, loading, error } = useStore();
  const [sublabel, setSublabel] = useState('Rendering product video — this handles heavy GPU tasks and may take 5 to 10 minutes. Please do not close this window.');
  const [imgErr, setImgErr] = useState(false);
  const proxied = imageUrl ? proxyImageUrl(imageUrl) : null;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (key: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const status = await checkVideoStatus(key);
        if (status.status === 'completed' && status.video_url) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setVideo(status.video_url, key);
          setLoading(false);
        }
      } catch {
        // keep polling on transient errors
      }
    }, 10_000);
  };

  const handleGenerateVideo = async () => {
    if (!uniqueKey) return;
    setError(null);
    setLoading(true);

    const longWait = setTimeout(
      () => setSublabel('GPU processing is still running... It may take a few more minutes.'),
      180_000,
    );

    try {
      await generateVideo({
        product_name: enhancedName,
        description: enhancedDesc,
        image_url: imageUrl,
        unique_key: uniqueKey,
      });
      clearTimeout(longWait);
      // n8n video generation is async — poll for completion
      startPolling(uniqueKey);
    } catch (err: any) {
      clearTimeout(longWait);
      setLoading(false);
      setError(err?.message || 'Video generation failed');
      setStep(3);
    }
  };

  if (loading) return (
    <Loader
      label="Producing your video"
      sublabel={sublabel}
      items={['Scene composition', 'Frame rendering', 'Motion and transitions', 'Export and packaging']}
    />
  );

  return (
    <div>
      <div className="section-head">
        <div className="sh-num">03</div>
        <div className="sh-title">Generated Photo</div>
        <div className="sh-rule" />
      </div>

      {error && <div className="alert show">{error}</div>}

      <div className="result-block show">
        <div className="result-columns">
          <div className="result-col">
            <div className="result-col-label">AI Product Visual</div>
            <div className="result-image-box">
              {proxied && !imgErr ? (
                <img src={proxied} alt={enhancedName} referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
              ) : (
                <>
                  <svg className="img-ph-icon" viewBox="0 0 26 26" fill="none">
                    <rect x="1" y="1" width="24" height="24" stroke="#0a0a0a" strokeWidth="1.5" />
                    <circle cx="8" cy="8" r="2.5" stroke="#0a0a0a" strokeWidth="1.5" />
                    <path d="M1 18l6-5 5 5 3-3 10 6" stroke="#0a0a0a" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  <span>{imgErr ? 'Could not load image' : 'Pending'}</span>
                </>
              )}
            </div>
          </div>
          <div className="result-col">
            <div className="result-col-label">Listing Summary</div>
            <div className="result-product-name" style={{ fontSize: '20px' }}>{enhancedName}</div>
            <div className="result-body" style={{ fontSize: '12px', lineHeight: '1.5' }}>{enhancedDesc}</div>
          </div>
        </div>
        <div className="proceed-bar">
          {videoUrl ? (
            <>
              <div className="proceed-text">Video generated successfully. <strong>Ready for publishing.</strong></div>
              <button className="btn btn-accent" onClick={() => setStep(4)}>View Generated Video</button>
            </>
          ) : (
            <>
              <div className="proceed-text">Photo generated. <strong>Proceed to produce the product video.</strong></div>
              <button className="btn btn-accent" onClick={handleGenerateVideo}>Generate Video</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
