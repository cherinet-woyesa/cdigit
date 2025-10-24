
// components/ScreenDisplay.tsx
import React, { useEffect, useState, useRef } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { QueueCustomer } from "../../types/QueueCustomer";
import type { DecodedToken } from "../../types/DecodedToken";
import makerService from "../../services/makerService";
import type { WindowDto } from "../../services/makerService";
import { speechService } from "../../services/speechService";
import { BranchQrDisplay } from "./BranchQrDisplay";

// Dummy exchange rate data
const DUMMY_EXCHANGE_RATES = [
  { currency: "USD", buy: 56.5, sell: 57.2 },
  { currency: "EUR", buy: 61.8, sell: 62.5 },
  { currency: "GBP", buy: 71.2, sell: 72.0 },
  { currency: "AED", buy: 15.4, sell: 15.8 },
  { currency: "CNY", buy: 7.8, sell: 8.1 },
];

const ADS = [
  "Welcome to Commercial Bank of Ethiopia",
  "Your Trusted Banking Partner",
  "Serving You with Excellence",
  "Digital Banking Made Easy",
];

export default function ScreenDisplay() {
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const { token, logout } = useAuth();
  const [windows, setWindows] = useState<WindowDto[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [adsIndex, setAdsIndex] = useState(0);
  const lastAnnouncedCustomerRef = useRef<string | null>(null);

  // Dummy data for customers currently being served
  // Replace this with actual data fetching logic as needed
  const [onProgressCustomers, setOnProgressCustomers] = useState<{ token: string; windowNumber: string | number | null }[]>([]);

  // Example: Fetch or update onProgressCustomers here if needed
  // useEffect(() => {
  //   // Fetch or subscribe to on-progress customers
  //   setOnProgressCustomers([...]);
  // }, []);

  /** Decode token */
  useEffect(() => {
    if (!token) return;
    try {
      const d = jwtDecode<DecodedToken>(token);
      setDecoded(d);
    } catch {
      logout();
    }
  }, [token, logout]);

  // Connect to SignalR for live queue updates
  useEffect(() => {
    if (!decoded?.BranchId) return;

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5268/hub/queueHub')
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Screen Display Connected to SignalR hub');
        connection.invoke('JoinBranchScreenDisplayGroup', decoded.BranchId);
        
        connection.on('QueueScreen', (data) => {
          console.log('New customer notification received:', data);
          setCurrentCustomer(data);
        });
      })
      .catch(error => {
        console.error('SignalR connection error:', error);
      });

    return () => {
      connection.stop();
    };
  }, [decoded?.BranchId]);

  // Fetch windows for the branch
  useEffect(() => {
    if (!decoded?.BranchId || !token) return;

    const fetchWindows = async () => {
      try {
        const branchId = decoded.BranchId;
        const data = await makerService.getWindowsByBranchId(branchId, token);
        setWindows(data);
      } catch (err) {
        console.error("Error fetching windows:", err);
      }
    };

    fetchWindows();
  }, [decoded?.BranchId, token]);

  // Rotate ads every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAdsIndex((prev) => (prev + 1) % ADS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Announce current customer when it changes
  useEffect(() => {
    if (currentCustomer && voiceEnabled) {
      const queueNumberStr = String(currentCustomer.queueNumber);
      if (lastAnnouncedCustomerRef.current !== queueNumberStr) {
        lastAnnouncedCustomerRef.current = queueNumberStr;
        const textToSpeak = `Token number ${currentCustomer.queueNumber}, please proceed to window ${currentCustomer.windowNumber}.`;
        speechService.speak(textToSpeak, 'en');
      }
    }
  }, [currentCustomer, voiceEnabled]);

  const toggleVoiceSupport = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);
    
    if (newVoiceEnabled && currentCustomer) {
      const textToSpeak = `Voice support enabled. Token number ${currentCustomer.queueNumber}, window ${currentCustomer.windowNumber}.`;
      speechService.speak(textToSpeak, 'en');
    } else if (!newVoiceEnabled) {
      speechService.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-4 text-center bg-blue-950/80 shadow-lg border-b border-blue-400/30">
        <h1 className="text-3xl font-bold tracking-wide">Commercial Bank of Ethiopia</h1>
        <p className="opacity-90 text-sm mt-1">Queue Management System</p>
        
        {/* Voice Control Button */}
        {speechService.isSupported && (
          <button 
            onClick={toggleVoiceSupport}
            className={`mt-2 px-3 py-1 rounded-lg font-medium text-sm ${
              voiceEnabled 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-600 hover:bg-gray-700'
            } transition-colors duration-200`}
          >
            {voiceEnabled ? '🔊 Voice Enabled' : '🔇 Enable Voice'}
          </button>
        )}
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Main Display Section - Token & Window Number (60%) */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl border border-white/10"
        >
          {currentCustomer ? (
            <div className="text-center space-y-6">
              {/* Main Display */}
              <div className="space-y-2">
                <p className="text-xl text-blue-200 font-medium">Now Serving</p>
                <motion.div
                  key={currentCustomer.queueNumber}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-8xl font-black text-yellow-400 drop-shadow-lg"
                >
                  {currentCustomer.queueNumber}
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="text-4xl font-bold text-white mt-4"
                >
                  Window {currentCustomer.windowNumber}
                </motion.p>
              </div>

              {/* Additional Info */}
              <div className="mt-8 space-y-2 text-blue-200">
                <p className="text-lg">Please proceed to your assigned window</p>
                <p className="text-sm opacity-80">Thank you for your patience</p>
              </div>
            </div>
          ) : (
            <p className="text-2xl opacity-80 text-center mb-6">Waiting for next customer...</p>
          )}

          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-2xl font-bold">Currently Being Served</h2>
              {voiceEnabled && speechService.isSupported && (
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                  🔊 Voice Active
                </span>
              )}
            </div>

            {onProgressCustomers.length === 0 ? (
              <p className="text-center opacity-70">No customers currently being served.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-fuchsia-700/40 shadow-sm">
                <table className="w-full text-center text-sm">
                  <thead className="bg-fuchsia-800 text-white">
                    <tr>
                      <th className="p-2">Token</th>
                      {/* <th className="p-2">Customer</th>
                      <th className="p-2">Service</th> */}
                      <th className="p-2">Window Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onProgressCustomers.map((c, idx) => (
                      <tr
                        key={idx}
                        className="bg-fuchsia-800/20 hover:bg-fuchsia-700/30 border-b border-fuchsia-900/30"
                      >
                        <td className="p-2">{c.token}</td>
                        {/* <td className="p-2 font-semibold">{c.customername}</td>
                        <td className="p-2">{c.serviceName ?? "-"}</td> */}
                        <td className="p-2">
                          {c.windowNumber ? (
                            <span className="font-semibold text-green-400">{c.windowNumber}</span>
                          ) : (
                            <span className="opacity-50">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>

        {/* Right Side Panel (40%) */}
        <div className="lg:col-span-5 space-y-4">
          {/* QR Code Section */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-blue-200">
              Scan for Digital Queue
            </h2>
            <div className="flex justify-center">
              {/* Placeholder for QR Code */}
              <div className="w-48 h-48 bg-white/10 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-400/30">
             <BranchQrDisplay branchId={decoded?.BranchId || ""} />
              </div>
            </div>
            <p className="text-center text-blue-200 text-sm mt-4">
              Scan this code to get your token number
            </p>
          </motion.section>

          {/* Exchange Rates Section */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-blue-200">
              Exchange Rates
            </h2>
            <div className="space-y-3">
              {DUMMY_EXCHANGE_RATES.map((rate, index) => (
                <motion.div
                  key={rate.currency}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="font-semibold text-white">{rate.currency}</span>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-green-400">Buy: {rate.buy}</span>
                      {" | "}
                      <span className="text-red-400">Sell: {rate.sell}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-blue-200 text-xs mt-3 opacity-70">
              Rates are for reference only
            </p>
          </motion.section>
        </div>
      </main>

      {/* Ads Footer */}
      <motion.footer
        key={adsIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-blue-950/90 py-3 text-center border-t border-blue-400/30"
      >
        <p className="text-blue-200 font-medium text-lg">{ADS[adsIndex]}</p>
      </motion.footer>
    </div>
  );
}