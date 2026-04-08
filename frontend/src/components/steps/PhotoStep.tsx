import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateVideo, checkVideoStatus, proxyImageUrl } from '../../lib/api';
import Loader from '../Loader';

const VIDEO_WAIT_SECONDS = 5 * 60;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export default function PhotoStep() {
  const { enhancedName, enhancedDesc, imageUrl, videoUrl, uniqueKey, setVideo, setLoading, setError, setStep, setProgressStep, loading, error } = useStore();
  const [imgErr, setImgErr] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(VIDEO_WAIT_SECONDS);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [videoCheckReady, setVideoCheckReady] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [hasCheckedVideo, setHasCheckedVideo] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState<string | null>(null);
  const proxied = imageUrl ? proxyImageUrl(imageUrl) : null;

  useEffect(() => {
    if (!loading || !countdownRunning) return;
    if (countdownSeconds <= 0) {
      setCountdownRunning(false);
      setLoading(false);
      setVideoCheckReady(true);
      setVideoStatusMessage('5 minutes have passed. Check the video webhook for the latest output.');
      return;
    }

    const timer = setTimeout(() => {
      setCountdownSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownRunning, countdownSeconds, loading, setLoading]);

  const stopCountdown = () => {
    setCountdownRunning(false);
  };

  const handleGenerateVideo = async () => {
    if (!uniqueKey) return;
    setError(null);
    setCountdownSeconds(VIDEO_WAIT_SECONDS);
    setCountdownRunning(true);
    setVideoCheckReady(false);
    setCheckingVideo(false);
    setHasCheckedVideo(false);
    setVideoStatusMessage(null);
    setProgressStep(4);
    setLoading(true);

    try {
      const res = await generateVideo({
        product_name: enhancedName,
        description: enhancedDesc,
        image_url: imageUrl,
        unique_key: uniqueKey,
      });
      if ((res.status?.toLowerCase() === 'completed' || res.status?.toLowerCase() === 'success') && res.video_url) {
        stopCountdown();
        setVideo(res.video_url, res.unique_key);
        setLoading(false);
        return;
      }
      if (res.status?.toLowerCase() === 'failed' || res.status?.toLowerCase() === 'error') {
        stopCountdown();
        setProgressStep(3);
        setLoading(false);
        setError('Video generation failed in the webhook. Please try again.');
        return;
      }
    } catch (err: any) {
      stopCountdown();
      setProgressStep(3);
      setLoading(false);
      setError(err?.message || 'Video generation failed');
      setStep(3);
    }
  };

  const handleCheckVideo = async () => {
    if (!uniqueKey) return;
    setCheckingVideo(true);
    setHasCheckedVideo(true);
    setError(null);
    try {
      const status = await checkVideoStatus(uniqueKey);
      const normalized = status.status?.toLowerCase();
      if ((normalized === 'completed' || normalized === 'success') && status.video_url) {
        stopCountdown();
        setVideo(status.video_url, status.unique_key);
        return;
      }
      if (normalized === 'failed' || normalized === 'error') {
        stopCountdown();
        setProgressStep(3);
        setVideoCheckReady(false);
        setVideoStatusMessage('The webhook reported a video generation failure. Start the video step again to retry.');
        setError('Video generation failed in the webhook. Please try again.');
        return;
      }
      setProgressStep(4);
      setVideoCheckReady(true);
      setVideoStatusMessage('The video is still processing. Use Check Video again in a little while.');
    } catch (err: any) {
      setVideoCheckReady(true);
      setVideoStatusMessage(err?.message || 'Unable to check the video status right now. Please try again.');
    } finally {
      setCheckingVideo(false);
    }
  };

  if (loading) return (
    <Loader
      label="Producing your video"
      sublabel={`Manual check available in ${formatCountdown(countdownSeconds)}. Keep this tab open while the webhook renders.`}
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
          ) : videoCheckReady ? (
            <>
              <div className="proceed-text">5 minutes complete. <strong>Check the webhook for the latest video URL.</strong></div>
              <button className="btn btn-accent" onClick={handleCheckVideo} disabled={checkingVideo}>
                {checkingVideo ? 'Checking...' : hasCheckedVideo ? 'Check Video Again' : 'Check Video'}
              </button>
            </>
          ) : (
            <>
              <div className="proceed-text">Photo generated. <strong>Proceed to produce the product video.</strong></div>
              <button className="btn btn-accent" onClick={handleGenerateVideo}>Generate Video</button>
            </>
          )}
        </div>
        {videoStatusMessage && !videoUrl && (
          <div className="video-status-card">
            <div className="video-status-label">Video Status</div>
            <div className="video-status-copy">{videoStatusMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
}
