import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle, X, FileText, ExternalLink } from 'lucide-react';
import { uploadSalarySlip, validateDocumentFile } from '../../utils/upload';

interface SalarySlipUploadProps {
  userId: string;
  proxyUrl: string;
  initialSlips?: string[]; // Existing uploaded URLs (index 0 = slip 1, etc.)
  onSlipsChange: (slips: string[]) => void; // Called with updated URLs array whenever a slip changes
}

const SLIP_LABELS = [
  'Loonstrook 1 (meest recent)',
  'Loonstrook 2',
  'Loonstrook 3',
];

const SalarySlipUpload: React.FC<SalarySlipUploadProps> = ({
  userId,
  proxyUrl,
  initialSlips = [],
  onSlipsChange,
}) => {
  const [slips, setSlips] = useState<(string | null)[]>([
    initialSlips[0] || null,
    initialSlips[1] || null,
    initialSlips[2] || null,
  ]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [errors, setErrors] = useState<(string | null)[]>([null, null, null]);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleFileSelect = async (index: number, file: File) => {
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setErrors(prev => {
        const next = [...prev];
        next[index] = validation.error || 'Ongeldig bestand';
        return next;
      });
      return;
    }

    // Clear error
    setErrors(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });

    // Start upload
    setUploading(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });

    try {
      const result = await uploadSalarySlip(file, userId, (index + 1) as 1 | 2 | 3, proxyUrl);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload mislukt');
      }

      const newSlips = [...slips];
      newSlips[index] = result.url;
      setSlips(newSlips);
      onSlipsChange(newSlips.filter(Boolean) as string[]);
    } catch (err: any) {
      setErrors(prev => {
        const next = [...prev];
        next[index] = err.message || 'Upload mislukt, probeer opnieuw';
        return next;
      });
    } finally {
      setUploading(prev => {
        const next = [...prev];
        next[index] = false;
        return next;
      });
      // Reset the file input so the same file can be re-selected
      if (inputRefs[index].current) {
        inputRefs[index].current!.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newSlips = [...slips];
    newSlips[index] = null;
    setSlips(newSlips);
    onSlipsChange(newSlips.filter(Boolean) as string[]);
  };

  const getFilename = (url: string): string => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch {
      return 'loonstrook';
    }
  };

  return (
    <div className="space-y-3">
      {SLIP_LABELS.map((label, index) => (
        <div key={index} className="vl-card rounded-lg border border-white/[0.1] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {slips[index] ? (
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-neutral-500 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">{label}</p>
                {slips[index] ? (
                  <a
                    href={slips[index]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 mt-0.5 truncate"
                  >
                    <span className="truncate">{getFilename(slips[index]!)}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-neutral-500 mt-0.5">PDF, JPG of PNG — max. 10 MB</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {uploading[index] ? (
                <Loader2 className="w-5 h-5 animate-spin text-green-400" />
              ) : slips[index] ? (
                <>
                  <button
                    onClick={() => inputRefs[index].current?.click()}
                    className="text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded border border-white/[0.1] hover:border-white/20"
                  >
                    Vervangen
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Verwijderen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => inputRefs[index].current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Uploaden
                </button>
              )}
            </div>
          </div>

          {errors[index] && (
            <p className="mt-2 text-xs text-red-400">{errors[index]}</p>
          )}

          <input
            ref={inputRefs[index]}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(index, file);
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default SalarySlipUpload;
