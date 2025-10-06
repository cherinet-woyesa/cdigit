// components/ScreenDisplay.tsx
import React, { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { motion } from "framer-motion";
import { exchangeRateService } from "../../services/exchangeRateService";
import type { ExchangeRate } from "../../types/ExchangeRate";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";


interface QueueCustomer {
  message: string;
  customername: string;
  queueNumber: number;
  windowNumber: string;
  token: string;
}

/** Token claims we need */
type DecodedToken = {
  BranchId: string;
  nameid: string; // makerId
  role?: string;
  unique_name?: string;
  email?: string;
  exp?: number;
  iss?: string;
  aud?: string;
};

export default function ScreenDisplay() {
  const [currentCustomer, setCurrentCustomer] = useState<QueueCustomer | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [adsIndex, setAdsIndex] = useState(0);
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const { token, logout } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExchangeRate>>({});


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
      console.log('Connected to SignalR hub');

      // Join group with Branch id
      connection.invoke('JoinBranchScreenDisplayGroup', decoded?.BranchId);

      // Listen for messages
      connection.on('QueueScreen', (data) => {
        console.log('New customer notification received:', data);
        setCurrentCustomer(data);
        // setQueueNotifyModalTitle(data.transactionType + " Request");
        // setQueueNotifyModalMessage(`${data.message} is comming, please ready to serve. `);
        // setIsQueueNotifyModalOpen(true);
        // void refreshQueue();
      });
    });

    return () => {
      connection.stop();
    };
  }, [decoded?.BranchId]);


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


  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-purple-800 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="py-6 text-center bg-black/40 shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase">
          Commercial Bank of Ethiopia
        </h1>
        <p className="opacity-80 text-lg">Queue & Exchange Rate Display</p>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 p-6">
        {/* Queue Section (70%) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-7 bg-white/10 rounded-xl p-8 flex flex-col justify-center items-center shadow-lg"
        >
          {/* <h2 className="text-3xl font-bold mb-6">Now Serving</h2> */}
          {currentCustomer ? (
            <div className="text-center space-y-4">
              <p className="text-xl">{currentCustomer.message}</p>
              <p className="text-6xl font-extrabold text-yellow-300 drop-shadow-lg">
                {currentCustomer.queueNumber}
              </p>
              <p className="text-3xl font-bold">{currentCustomer.customername}</p>
              <p className="mt-2 text-2xl">
                Window No:{" "}
                <span className="font-semibold text-green-400">
                  {currentCustomer.windowNumber}
                </span>
              </p>
              <p className="text-sm opacity-70">Token: {currentCustomer.token}</p>
            </div>
          ) : (
            <p className="text-2xl opacity-80">Waiting for next customer...</p>
          )}
        </motion.section>

        {/* Exchange Rate Section (30%) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-3 bg-white/10 rounded-xl p-6 shadow-lg flex flex-col"
        >
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