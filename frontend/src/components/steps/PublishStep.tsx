import { useStore } from '../../store/useStore';
import { proxyImageUrl } from '../../lib/api';

export default function PublishStep() {
  const { enhancedName, enhancedDesc, imageUrl, videoUrl, publishUrl, publishMessage, publishStatus, reset } = useStore();
  const proxied = imageUrl ? proxyImageUrl(imageUrl) : null;

  return (
    <div>
      <div className="publish-block show">
        <div className="pub-masthead">
          <div className="pub-kicker" style={{ color: 'var(--green)' }}>
            {publishStatus ? publishStatus.toUpperCase() : 'PUBLISHED SUCCESSFULLY'}
          </div>
          <div className="pub-headline">Your product is <em>live.</em></div>
          <div className="pub-sub">{publishMessage ?? 'Your AI-generated listing is now live on your storefront.'}</div>
          <div className="pub-rule" />
        </div>

        {(publishUrl || publishMessage) && (
          <div className="publish-response">
            <div className="publish-response-label">Webhook Publish Output</div>
            {publishMessage && <div className="publish-response-copy">{publishMessage}</div>}
            {publishUrl && (
              <a className="btn btn-accent publish-response-link" href={publishUrl} target="_blank" rel="noreferrer">
                Open Published Listing
              </a>
            )}
          </div>
        )}

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
                {proxied ? <img src={proxied} alt={enhancedName} referrerPolicy="no-referrer" /> : <span>No image</span>}
              </div>
            </div>
          </div>
          <div className="pub-cell">
            <div className="pub-cell-head">Product Video <span className="pub-cell-tag">AI Produced</span></div>
            <div className="pub-cell-body">
              <div className="media-box">
                {videoUrl ? <video src={videoUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>No video</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="pub-actions">
          <div className="pub-note">
            {publishUrl ? 'The webhook returned a live listing link. You can open it above or start another product.' : 'Your product listing is live. Start again to create another product.'}
          </div>
          <button className="btn btn-primary" onClick={reset}>Create Another Product</button>
        </div>
      </div>
    </div>
  );
}
