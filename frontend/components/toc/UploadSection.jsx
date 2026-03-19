'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXT  = ['.pdf', '.docx'];
const MAX_SIZE_MB    = 10;

/**
 * UploadSection — drag-and-drop file picker for PDF / DOCX.
 *
 * Props:
 *   label        {string}   — visible label, e.g. "Privacy Policy"
 *   fieldName    {string}   — form field name (informational, upload handled by parent)
 *   onFileSelect {Function} — called with (File | null) on selection or removal
 *   required     {boolean}  — shows a "required" badge (default false)
 */
export function UploadSection({ label, fieldName, onFileSelect, required = false }) {
  const [file,    setFile]    = useState(null);
  const [error,   setError]   = useState(null);
  const [isDragging, setDrag] = useState(false);
  const inputRef = useRef(null);

  const validate = useCallback((f) => {
    if (!ACCEPTED_MIME.includes(f.type) && !ACCEPTED_EXT.some(ext => f.name.toLowerCase().endsWith(ext))) {
      return 'Само PDF и DOCX файлове са разрешени.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Максимален размер: ${MAX_SIZE_MB} MB.`;
    }
    return null;
  }, []);

  const pick = useCallback((f) => {
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
      onFileSelect(null);
      return;
    }
    setError(null);
    setFile(f);
    onFileSelect(f);
  }, [validate, onFileSelect]);

  const handleInput = (e) => {
    const f = e.target.files?.[0];
    if (f) pick(f);
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pick(f);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    onFileSelect(null);
  };

  const dragClass = isDragging
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50';

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {required && <span className="text-xs text-blue-600 font-medium">obligatoriu</span>}
        {!required && <span className="text-xs text-gray-400">optional</span>}
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          role="button"
          tabIndex={0}
          aria-label={`Качи ${label}`}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${dragClass}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Плъзни файл тук или{' '}
              <span className="text-blue-600 underline underline-offset-2">избери</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">PDF или DOCX, макс. {MAX_SIZE_MB} MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={ACCEPTED_EXT.join(',')}
            onChange={handleInput}
          />
        </div>
      ) : (
        /* Selected file display */
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-green-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-green-800">{file.name}</p>
            <p className="text-xs text-green-600">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Премахни файла"
            className="rounded-md p-1 text-green-600 hover:bg-green-100 hover:text-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
