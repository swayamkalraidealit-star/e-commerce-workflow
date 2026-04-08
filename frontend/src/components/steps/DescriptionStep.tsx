import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { generateImage } from '../../lib/api';
import Loader from '../Loader';

export default function DescriptionStep() {
  const { enhancedName, enhancedDesc, uniqueKey, imageUrl, setImage, setLoading, setError, setStep, loading, error } = useStore();
  const [sublabel, setSublabel] = useState('AI image production — approximately 30 to 50 seconds');

  const handleGeneratePhoto = async () => {
    if (imageUrl) {
      setStep(3);
      return;
    }
    if (!uniqueKey) return;
    setError(null);
    setLoading(true);
    const t = setTimeout(() => setSublabel('AI production taking a little longer... please do not refresh.'), 35_000);
    try {
      const res = await generateImage({ product_name: enhancedName, description: enhancedDesc, unique_key: uniqueKey });
      clearTimeout(t);
      setImage(res.image_url, res.unique_key);
    } catch (err: any) {
      clearTimeout(t);
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
          <div className="result-col" style={{ gridColumn: '1 / -1', borderRight: 'none' }}>
            <div className="result-col-label">AI-Enhanced Product Listing</div>
            <div className="result-product-name">{enhancedName}</div>
            <div className="result-body">{enhancedDesc}</div>
          </div>
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
