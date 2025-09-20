import QRCode from "react-qr-code";

export default function QRLogin() {
    const url = "http://192.168.1.50:5173/otp-login"; // or your ngrok URL

    return (
        <div className="flex flex-col items-center">
            <h3 className="mb-2 text-lg font-semibold">Scan to Login</h3>
            <QRCode value={url} size={180} />
        </div>
    );
}
