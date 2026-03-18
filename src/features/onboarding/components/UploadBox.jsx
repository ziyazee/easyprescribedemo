import { useRef, useState } from 'react';
import { processImage, processSignature, validateSignatureBackground } from '../../../lib/imageProcessor';

export function UploadBox({ icon, title, hint, value, onChange, variant = 'default' }) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = '';

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setError('');
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result;
      try {
        if (variant === 'signature') {
          const { result } = await validateSignatureBackground(rawDataUrl);
          if (result === 'reject') {
            setError('Signature background must be white. Please use a clean white paper.');
            setProcessing(false);
            return;
          }
          const processedDataUrl = await processSignature(rawDataUrl, {
            maxWidth: 400, maxHeight: 120, fix: result === 'fixable'
          });
          onChange?.(processedDataUrl);
        } else {
          const processedDataUrl = await processImage(rawDataUrl, { maxWidth: 300, maxHeight: 120, transparentBg: true });
          onChange?.(processedDataUrl);
        }
      } catch {
        setError('Failed to process image. Please try a different file.');
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setError('');
    onChange?.('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const isLogo = variant === 'logo';

  if (value) {
    return (
      <div className={`rounded-2xl border p-6 flex flex-col items-center ${isLogo ? 'border-[#1f7a5c]/20 bg-[#1f7a5c]/[0.03] ring-1 ring-[#1f7a5c]/10' : 'border-slate-200 bg-slate-50/80'}`}>
        <div className={`w-full flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-100 mb-5 shadow-sm ${isLogo ? 'h-44' : 'h-40'}`}>
          <img src={value} alt={title} className="max-h-full max-w-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1f7a5c] rounded-lg hover:bg-[#186347] transition-all cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-[15px]">edit</span>
            Replace
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
            onClick={handleRemove}
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {processing ? (
        <div className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 ${
          isLogo ? 'border-[#1f7a5c]/25 bg-[#1f7a5c]/[0.02]' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <span className="material-symbols-outlined text-2xl text-[#1f7a5c] animate-spin">progress_activity</span>
          <p className="text-sm font-medium text-slate-500">Processing image...</p>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer p-10 group ${
          isLogo
            ? 'border-[#1f7a5c]/25 bg-[#1f7a5c]/[0.02] hover:border-[#1f7a5c]/50 hover:bg-[#1f7a5c]/5'
            : 'border-slate-200 bg-slate-50/50 hover:border-[#1f7a5c]/40 hover:bg-[#1f7a5c]/5'
        }`}>
          <div className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center transition-colors shadow-sm ${
            isLogo
              ? 'border-[#1f7a5c]/15 text-[#1f7a5c]/50 group-hover:text-[#1f7a5c] group-hover:border-[#1f7a5c]/30'
              : 'border-slate-200 text-slate-400 group-hover:text-[#1f7a5c] group-hover:border-[#1f7a5c]/30'
          }`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 group-hover:text-[#1f7a5c] transition-colors">{title}</p>
            <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
      {error && (
        <p className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
