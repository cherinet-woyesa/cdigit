


// components/ScreenDisplay.tsx
import React, { useEffect, useState, useRef } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { motion } from "framer-motion";
import { exchangeRateService } from "@services/exchangeRateService";
import type { ExchangeRate } from "@types";
import { useAuth } from "@context/AuthContext";
import { jwtDecode } from "jwt-decode";
import type { QueueCustomer } from "@types";
import type { DecodedToken } from "@types";
import makerService from "@services/makerService";
import type { WindowDto } from "@services/makerService";
import { speechService } from "@services/speechService";
import { BranchQrDisplay } from "@features/screen/BranchQrDisplay";

export default function ScreenDisplay() {
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [onProgressCustomers, setOnProgressCustomers] = useState<QueueCustomer[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [adsIndex, setAdsIndex] = useState(0);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const { token, logout } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExchangeRate>>({});
  const [windows, setWindows] = useState<WindowDto[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const lastAnnouncedCustomerRef = useRef<string | null>(null);

  const ads = [
    "Welcome to Commercial Bank of Ethiopia!",
    "Your trusted partner in banking.",
    "Fast, Secure & Reliable Transactions.",
    "CBE: Empowering the future of banking.",
  ];

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

    // Setup SignalR connection
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5268/hub/queueHub')
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      console.log('manager screen Connected to SignalR hub');

      // Join group with Branch id
      connection.invoke('JoinBranchScreenDisplayGroup', decoded?.BranchId);
      console.log('Joined group:', decoded?.BranchId);
      // Listen for messages
      connection.on('QueueScreen', (data) => {
        console.log('New customer notification received:', data);
        setCurrentCustomer(data);
      });
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
        const branchId = decoded?.BranchId;
        const data = await makerService.getWindowsByBranchId(branchId, token);
        setWindows(data);
        console.log("Fetched windows:", data);
      } catch (err) {
        console.error("Error fetching windows:", err);
      }
    };

    fetchWindows();
  }, [decoded?.BranchId, token]);

  // Function to fetch OnProgress customers
  const fetchOnProgressCustomers = async (branchId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5268/api/QueueManager/OnProgress/${branchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      const customers = data.map((c: any) => ({
        customername: c.customerName ?? "N/A",
        queueNumber: c.queueNumber,
        windowId: c.windowId,
        token: c.tokenNumber,
        serviceName: c.serviceName,
        message: "Currently Being Served",
      }));

      // 🟢 Wait for windows before mapping
      if (windows.length === 0) {
        console.warn("Windows not loaded yet, skipping window mapping temporarily.");
        setOnProgressCustomers(customers);
        return;
      }

      const mappedCustomers = customers.map((cust: any) => {
        const win = windows.find(
          (w) => w.id.toLowerCase() === cust.windowId.toLowerCase()
        );
        console.log("Mapping customer:", cust.windowId, "=>", win?.windowNumber);
        return { ...cust, windowNumber: win?.windowNumber ?? "-" };
      });

      setOnProgressCustomers(mappedCustomers);
    } catch (err) {
      console.error("Error fetching OnProgress customers:", err);
    }
  };

  // Fetch OnProgress customers whenever windows or branchId changes
  useEffect(() => {
    if (windows.length > 0 && decoded?.BranchId) {
      console.log("Re-mapping customers since windows loaded...");
      fetchOnProgressCustomers(decoded.BranchId);
    }
  }, [windows, decoded?.BranchId]);

  // Re-Fetch OnProgress whenever currentCustomer updates, to make it real-time
  useEffect(() => {
    if (decoded?.BranchId) fetchOnProgressCustomers(decoded.BranchId);
  }, [currentCustomer, decoded?.BranchId]);

  // Fetch exchange rates periodically
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await exchangeRateService.getRates();
        setRates(data);
      } catch (err) {
        console.error("Error loading rates:", err);
      } finally {
        setLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate ads every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAdsIndex((prev) => (prev + 1) % ads.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [ads.length]);

  const handleEdit = (rate: ExchangeRate) => {
    setEditingId(rate.id);
    setFormData(rate); // preload existing values
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      await exchangeRateService.updateRate(editingId, formData as ExchangeRate);
      const updatedRates = await exchangeRateService.getRates();
      setRates(updatedRates);
      setEditingId(null); // close edit mode
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // Announce current customer when it changes
  useEffect(() => {
    if (currentCustomer && voiceEnabled) {
      // Convert queueNumber to string for comparison
      const queueNumberStr = String(currentCustomer.queueNumber);
      // Prevent announcing the same customer multiple times
      if (lastAnnouncedCustomerRef.current !== queueNumberStr) {
        lastAnnouncedCustomerRef.current = queueNumberStr;
        const textToSpeak = `Now serving customer ${currentCustomer.customername}, at window ${currentCustomer.windowNumber}. Please proceed to window ${currentCustomer.windowNumber}.`;
        speechService.speak(textToSpeak, 'en');
      }
    }
  }, [currentCustomer, voiceEnabled]);

  // Toggle voice support
  const toggleVoiceSupport = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);

    if (newVoiceEnabled && currentCustomer) {
      // Announce current customer when voice is enabled
      const textToSpeak = `Voice support enabled. Now serving customer ${currentCustomer.customername}, at window ${currentCustomer.windowNumber}.`;
      speechService.speak(textToSpeak, 'en');
    } else if (!newVoiceEnabled) {
      // Stop any ongoing speech when voice is disabled
      speechService.stop();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-purple-800 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 text-center bg-black/40 shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase">
          Commercial Bank of Ethiopia
        </h1>
        <p className="opacity-80 text-lg">Queue & Exchange Rate Display</p>
        {/* Voice Control Button */}
        {speechService.isSupported && (
          <button
            onClick={toggleVoiceSupport}
            className={`mt-2 px-4 py-2 rounded-lg font-semibold ${voiceEnabled
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-500 hover:bg-gray-600'
              } transition-colors`}
          >
            {voiceEnabled ? '🔊 Voice Enabled' : '🔇 Voice Disabled'}
          </button>
        )}
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 p-6">
        {/* Queue Section (70%) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7 bg-white/10 rounded-xl p-8 flex flex-col shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Now Serving</h2>
            {voiceEnabled && speechService.isSupported && (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                🔊 Voice Active
              </span>
            )}
          </div>

          {currentCustomer ? (
            <div className="text-center mb-6 space-y-3">
              <p className="text-lg text-yellow-200">{currentCustomer.message}</p>
              <p className="text-6xl font-extrabold text-yellow-300 drop-shadow-lg">
                {currentCustomer.queueNumber}
              </p>
              <p className="text-3xl font-bold">{currentCustomer.customername}</p>
              <p className="mt-1 text-2xl">
                Window No:{" "}
                <span className="font-semibold text-green-400">
                  {currentCustomer.windowNumber}
                </span>
              </p>
              <p className="text-sm opacity-70">Token: {currentCustomer.token}</p>
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

        {/* Right Side Panel: Exchange Rate + QR */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-3 flex flex-col gap-6"
        >
          {/* Exchange Rate Section */}
          <div className="bg-white/10 rounded-xl p-6 shadow-lg flex flex-col flex-1">
            <h2 className="text-xl font-bold mb-4 text-center">Exchange Rate</h2>
            {loadingRates ? (
              <div className="flex items-center justify-center flex-1 text-lg animate-pulse">
                Loading...
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-center border-separate border-spacing-y-1 text-sm">
                  <thead>
                    <tr className="bg-fuchsia-900 text-white">
                      <th className="p-2">Currency</th>
                      <th className="p-2">Cash Buying</th>
                      <th className="p-2">Cash Selling</th>
                      <th className="p-2">Tx Buying</th>
                      <th className="p-2">Tx Selling</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate, idx) => (
                      <motion.tr
                        key={rate.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.05 }}
                        className="bg-fuchsia-800/30 hover:bg-fuchsia-600/40 rounded-lg"
                      >
                        {editingId === rate.id ? (
                          <>
                            <td className="p-2 font-medium">{rate.currencyCode}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={formData.cashBuying ?? ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, cashBuying: +e.target.value })
                                }
                                className="w-20 p-1 rounded text-black"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={formData.cashSelling ?? ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, cashSelling: +e.target.value })
                                }
                                className="w-20 p-1 rounded text-black"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={formData.transactionBuying ?? ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    transactionBuying: +e.target.value,
                                  })
                                }
                                className="w-20 p-1 rounded text-black"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={formData.transactionSelling ?? ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    transactionSelling: +e.target.value,
                                  })
                                }
                                className="w-20 p-1 rounded text-black"
                              />
                            </td>
                            <td className="p-2 space-x-2">
                              <button
                                onClick={handleUpdate}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 rounded text-sm"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-medium">{rate.currencyCode}</td>
                            <td className="p-2">{rate.cashBuying.toFixed(2)}</td>
                            <td className="p-2">{rate.cashSelling.toFixed(2)}</td>
                            <td className="p-2">{rate.transactionBuying.toFixed(2)}</td>
                            <td className="p-2">{rate.transactionSelling.toFixed(2)}</td>
                            <td className="p-2">
                              <button
                                onClick={() => handleEdit(rate)}
                                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-sm"
                              >
                                Update
                              </button>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/10 rounded-xl p-6 shadow-lg border border-white/10"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-blue-200">
              Scan for Digital Queue
            </h2>
            <div className="flex justify-center">
              <BranchQrDisplay branchId={decoded?.BranchId || ""} />
            </div>
            <p className="text-center text-blue-200 text-sm mt-4">
              Scan this code to get your token number
            </p>
          </motion.section>
        </motion.section>


      </main>

      {/* Ads / Footer Ticker */}
      <motion.div
        key={adsIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-fuchsia-700 py-4 text-lg font-bold text-center"
      >
        {ads[adsIndex]}
      </motion.div>
    </div>
  );
}

