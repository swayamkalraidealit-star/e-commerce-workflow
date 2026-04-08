import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateImage, proxyImageUrl } from '../../lib/api';
import Loader from '../Loader';

export default function DescriptionStep() {
  const { enhancedName, enhancedDesc, uniqueKey, imageUrl, setImage, setLoading, setError, setStep, setProgressStep, loading, error } = useStore();
  const [sublabel, setSublabel] = useState('AI image production — approximately 30 to 50 seconds');
  const [imgErr, setImgErr] = useState(false);
  const proxied = imageUrl ? proxyImageUrl(imageUrl) : null;

  const handleGeneratePhoto = async () => {
    if (imageUrl) {
      setStep(3);
      return;
    }
    if (!uniqueKey) return;
    setError(null);
    setProgressStep(3);
    setLoading(true);
    const t = setTimeout(() => setSublabel('AI production taking a little longer... please do not refresh.'), 35_000);
    try {
      const res = await generateImage({ product_name: enhancedName, description: enhancedDesc, unique_key: uniqueKey });
      clearTimeout(t);
      setImage(res.image_url, res.unique_key);
    } catch (err: any) {
      clearTimeout(t);
      setProgressStep(2);
      setError(err?.response?.data?.detail || err.message || 'Image generation failed');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Loader
      label="Generating product photo"
      sublabel={sublabel}
      items={['Analysing description', 'Generating product image', 'Optimising render']}
    />
  );

  return (
    <div>
      <div className="section-head">
        <div className="sh-num">02</div>
        <div className="sh-title">Generated Description</div>
        <div className="sh-rule" />
      </div>

      {error && <div className="alert show">{error}</div>}

      <div className="result-block show">
        <div className="result-columns">
          <div className="result-col" style={imageUrl ? undefined : { gridColumn: '1 / -1', borderRight: 'none' }}>
            <div className="result-col-label">AI-Enhanced Product Listing</div>
            <div className="result-product-name">{enhancedName}</div>
            <div className="result-body">{enhancedDesc}</div>
          </div>
          {imageUrl && (
            <div className="result-col">
              <div className="result-col-label">Webhook Image Output</div>
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
                    <span>Image returned but could not be displayed</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="proceed-bar">
          <div className="proceed-text">
            {imageUrl 
              ? <>Description and Photo ready. <strong>Proceed to view product photo.</strong></>
              : <>Description ready. <strong>Proceed to generate the product photo.</strong></>}
          </div>
          <button className="btn btn-accent" onClick={handleGeneratePhoto}>
            {imageUrl ? 'View Photo' : 'Generate Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
