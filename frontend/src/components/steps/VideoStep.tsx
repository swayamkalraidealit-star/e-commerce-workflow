import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { publish, proxyImageUrl } from '../../lib/api';

export default function VideoStep() {
  const { enhancedName, enhancedDesc, imageUrl, videoUrl, uniqueKey, setStep, setError, setPublishResult, setProgressStep, reset, error } = useStore();
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const proxied = imageUrl ? proxyImageUrl(imageUrl) : null;
  const canPublish = Boolean(uniqueKey && imageUrl && videoUrl);

  const handlePublish = async () => {
    if (!uniqueKey || !canPublish) {
      setError('Wait for the image and video webhook output before publishing.');
      return;
    }
    setError(null);
    setProgressStep(5);
    setPublishing(true);
    try {
      const res = await publish({
        product_name: enhancedName,
        description: enhancedDesc,
        image_url: imageUrl,
        video_url: videoUrl,
      });
      setPublishResult(res.product_url ?? null, res.message ?? null, res.status ?? null);
      useStore.setState({
        imageUrl: res.image_url ?? imageUrl,
        videoUrl: res.video_url ?? videoUrl,
      });
      setPublished(true);
      setStep(5);
    } catch (err: any) {
      setProgressStep(4);
      setError(err?.response?.data?.detail || err.message || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="publish-block show">
        <div className="pub-masthead">
          <div className="pub-kicker">Ready for publishing</div>
          <div className="pub-headline">Your product is <em>live-ready.</em></div>
          <div className="pub-sub">Review the listing below and publish to your storefront.</div>
          <div className="pub-rule" />
        </div>

        {error && <div className="alert show" style={{ marginBottom: '20px' }}>{error}</div>}

        <div className="pub-grid">
          <div className="pub-cell full">
            <div className="pub-cell-head">Product Overview <span className="pub-cell-tag">AI Generated</span></div>
            <div className="pub-cell-body">
              <div className="pub-product-name">{enhancedName}</div>
              <div className="pub-desc">{enhancedDesc}</div>
            </div>
          </div>
          <div className="pub-cell">
            <div className="pub-cell-head">Product Image <span className="pub-cell-tag">AI Rendered</span></div>
            <div className="pub-cell-body">
              <div className="media-box">
                {proxied ? (
                  <img src={proxied} alt={enhancedName} referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <svg className="media-ph-icon" viewBox="0 0 22 22" fill="none">
                      <rect x="1" y="1" width="20" height="20" stroke="#0a0a0a" strokeWidth="1.5" />
                      <circle cx="7" cy="7" r="2" stroke="#0a0a0a" strokeWidth="1.5" />
                      <path d="M1 15l5-4 4 4 3-3 8 5" stroke="#0a0a0a" strokeWidth="1.5" />
                    </svg>
                    <span>Awaiting image</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="pub-cell">
            <div className="pub-cell-head">Product Video <span className="pub-cell-tag">AI Produced</span></div>
            <div className="pub-cell-body">
              <div className="media-box">
                {videoUrl ? (
                  <video src={videoUrl} controls autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <svg className="media-ph-icon" viewBox="0 0 22 18" fill="none">
                      <rect x="1" y="1" width="14" height="16" stroke="#0a0a0a" strokeWidth="1.5" />
                      <path d="M15 5l6-4v12l-6-4" stroke="#0a0a0a" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <span>Awaiting video</span>
                  </>
                )}
              </div>
              {videoUrl && (
                <a className="video-output-link" href={videoUrl} target="_blank" rel="noreferrer">
                  Open Video URL
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="pub-actions">
          <div className="pub-note">Once published, your product listing with AI-generated description, image, and video will go live on your storefront.</div>
          <div className="btn-group">
            <button className="btn" onClick={reset}>Start Over</button>
            <button className="btn btn-publish-final" onClick={handlePublish} disabled={published || publishing || !canPublish}>
              {published ? 'Published' : publishing ? 'Publishing...' : canPublish ? 'Publish to Store' : 'Waiting on Assets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
