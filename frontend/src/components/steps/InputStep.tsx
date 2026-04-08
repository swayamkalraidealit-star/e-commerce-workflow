import { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { generateDescription } from '../../lib/api';
import Loader from '../Loader';

export default function InputStep() {
  const { setInput, setDescription, setLoading, setError, setProgressStep, loading, error } = useStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileName(null);
      setImageBase64(null);
      setError('Please upload an image file.');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim() && !desc.trim() && !imageBase64) {
      setError('Add a product name, description, or image before running the workflow.');
      return;
    }
    setError(null);
    setInput(name, desc, imageBase64);
    setProgressStep(2);
    setLoading(true);
    try {
      const res = await generateDescription({
        product_name: name,
        description: desc,
        image_base64: imageBase64,
        file_name: fileName,
      });
      setDescription(res.product_name, res.description, res.unique_key, res.image_url ?? null);
    } catch (err: any) {
      setProgressStep(1);
      setError(err?.response?.data?.detail || err.message || 'Failed to reach workflow');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <Loader
      label="Processing your input"
      sublabel="Workflow running — approximately 15 to 30 seconds"
      items={['Reading product data', 'Evaluating inputs', 'AI generation pass']}
    />
  );

  return (
    <div>
      <div className="section-head">
        <div className="sh-num">01</div>
        <div className="sh-title">Product Input</div>
        <div className="sh-rule" />
      </div>

      {error && <div className="alert show">{error}</div>}

      <div className="field-row">
        <div className="field">
          <div className="field-label">Product Name</div>
          <input
            type="text"
            placeholder="e.g. AeroFoam Pro Running Shoes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <div className="field-label">Product Image</div>
          <div 
            className="drop-zone" 
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange} 
              style={{ display: 'none' }}
            />
            <svg className="drop-icon-svg" viewBox="0 0 28 32" fill="none">
              <rect x="1" y="1" width="20" height="26" rx="1" stroke="#0a0a0a" strokeWidth="1.5" />
              <path d="M17 1v8h5" stroke="#0a0a0a" strokeWidth="1.5" />
              <path d="M21 24v6M18 27l3-3 3 3" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="square" />
            </svg>
            <div className="drop-title">Upload Product Image</div>
            <div className="drop-sub">Click to browse or drop an image file</div>
            {fileName && (
              <div className="file-pill show">
                <div className="file-pill-dot" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <div className="field-label">Product Description</div>
          <textarea
            placeholder="Describe key features, materials, and what makes this product unique..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </div>

      <div className="action-row">
        <div className="action-hint">Provide any combination of inputs.</div>
        <div className="btn-group">
          <button className="btn" onClick={() => {
            setName('');
            setDesc('');
            setImageBase64(null);
            setFileName(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setError(null);
          }}>Reset</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Generate Description</button>
        </div>
      </div>
    </div>
  );
}
