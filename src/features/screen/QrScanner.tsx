import { useState } from "react";
import { QrReader } from "react-qr-reader";
import { qrService } from "../../services/qrService";
import { Button } from "../../components/ui/button";

interface Props {
  branchId: string;
}

export const QrScanner: React.FC<Props> = ({ branchId }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (data: string | null) => {
    if (data && !loading) {
      setScanResult(data);
      setLoading(true);
      try {
        const res = await qrService.validate(branchId, data);
        setMessage(res.message);
      } catch (err: any) {
        setMessage("❌ Error validating QR");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800">Scan Branch QR</h3>

      <div className="w-64 h-64 border-4 border-purple-500 rounded-lg overflow-hidden">
        <QrReader
          onResult={(result, error) => {
            if (!!result) handleScan(result.getText());
          }}
          constraints={{ facingMode: "environment" }}
        />
      </div>

      {message && (
        <div
          className={`text-sm font-semibold p-2 rounded ${
            message.includes("Valid")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <Button onClick={() => window.location.reload()} className="mt-2">
        Rescan
      </Button>
    </div>
  );
};
