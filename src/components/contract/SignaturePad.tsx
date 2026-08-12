import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
  loading?: boolean;
  backgroundColor?: string;
  penColor?: string;
  title?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  loading,
  backgroundColor = '#000000', // Black background for customer
  penColor = '#22c55e', // Green pen for customer
  title = 'Plaats uw handtekening'
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="vl-card rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b border-white/[0.1] px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-white"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div
            className="border-2 rounded-lg mb-4"
            style={{
              borderColor: penColor,
              backgroundColor: backgroundColor
            }}
          >
            <SignatureCanvas
              ref={sigCanvas}
              canvasProps={{
                className: 'w-full h-64 cursor-crosshair',
              }}
              onBegin={handleBegin}
              backgroundColor={backgroundColor}
              penColor={penColor}
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleClear}
              disabled={isEmpty || loading}
              className="px-4 py-2 border border-white/[0.1] rounded-md text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Wissen
            </button>

            <button
              onClick={handleSave}
              disabled={isEmpty || loading}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center font-semibold"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Bezig...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Handtekening opslaan
                </>
              )}
            </button>
          </div>

          <p className="text-sm text-neutral-400 mt-4 text-center">
            Teken uw handtekening met {penColor === '#22c55e' ? 'groene' : 'zwarte'} pen in het {backgroundColor === '#000000' ? 'zwarte' : 'groene'} vak
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
