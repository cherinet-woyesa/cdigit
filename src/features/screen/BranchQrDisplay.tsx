import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { qrService } from "../../services/qrService";
import { Button } from "../../components/ui/button";

interface Props {
  branchId: string;
}

export const BranchQrDisplay: React.FC<Props> = ({ branchId }) => {
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQr = async () => {
    try {
      setLoading(true);
      const res = await qrService.generate(branchId);
      if (res.success) {
        setToken(res.data.token);
        setExpiresAt(new Date(res.data.expiresAt));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQr();
    const interval = setInterval(fetchQr, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, [branchId]);

  // 👇 Construct the URL that the QR will encode
  const qrUrl = token
    ? `${window.location.origin}/qr-login/${branchId}/${token}`
    : "";

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Branch QR Access</h2>

      {token ? (
        <QRCode value={qrUrl} size={200} />
      ) : (
        <div className="text-gray-500">Generating QR...</div>
      )}

      {expiresAt && (
        <p className="text-sm text-gray-500">
          Expires at: {expiresAt.toLocaleTimeString()}
        </p>
      )}

      <Button onClick={fetchQr} disabled={loading}>
        {loading ? "Refreshing..." : "Generate New QR"}
      </Button>
    </div>
  );
};
