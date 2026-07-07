import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, ScanLine, Camera } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scannerId = "barcode-scanner";
    const html5QrCode = new Html5Qrcode(scannerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.77,
    };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          html5QrCode.stop();
          onClose();
        },
        () => {
          // QR code scan failed - this is expected, ignore
        }
      )
      .then(() => {
        setScanning(true);
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setError("Camera access denied or not available. Please allow camera permissions.");
      });

    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-[#ff3e00]" />
          <span className="text-white text-[14px] font-medium">Scan Barcode</span>
        </div>
        <button
          onClick={() => {
            if (scannerRef.current) scannerRef.current.stop().catch(() => {});
            onClose();
          }}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <Camera className="w-12 h-12 text-[#848281] mx-auto mb-4" />
              <p className="text-[14px] text-[#c6c6c6] mb-2">{error}</p>
              <button
                onClick={onClose}
                className="shutter-btn-dark mt-4"
              >
                Close Scanner
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              id="barcode-scanner"
              ref={containerRef}
              className="w-full h-full"
            />
            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[160px] border-2 border-[#ff3e00] rounded-lg">
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#00ca48]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#00ca48]" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#00ca48]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#00ca48]" />
                {/* Laser line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#ff3e00]/60 animate-pulse" />
              </div>
            </div>
            {/* Bottom hint */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white/70 text-[12px]">
                Position barcode within the frame
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
