import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import accountService from "../../services/accountsService";
import phoneBlockService from "../../services/phoneBlockService"; // ✅ new service

const AccountSearch: React.FC = () => {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [popupMode, setPopupMode] = useState<"block" | "recover" | null>(null);
  const [reason, setReason] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await accountService.search(query, token!);
      setResults(res.success ? res.data : []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!selectedAccount) return;
    try {
      await phoneBlockService.requestBlock(
        {
          phoneNumber: selectedAccount.phoneNumber,
          accountNumber: selectedAccount.accountNumber,
          accountHolderName: selectedAccount.accountHolderName,
          reason,
        },
      );
      alert("✅ Block request submitted successfully.");
      closePopup();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit block request.");
    }
  };

  const handleRecover = async () => {
    if (!selectedAccount) return;
    try {
      await phoneBlockService.recoverPhone(
        {
          phoneNumber: selectedAccount.phoneNumber,
          recoveredById: user?.id,
        },
      );
      alert("✅ Phone recovered and unblocked successfully.");
      closePopup();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to recover phone.");
    }
  };

  const closePopup = () => {
    setSelectedAccount(null);
    setPopupMode(null);
    setReason("");
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        🔍 Search Account by Name / Phone / Account #
      </h2>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter name, phone number, or account number..."
          className="flex-1 border-2 border-purple-400 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white px-5 py-2 rounded-md text-sm font-semibold transition-all"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results Table */}
      <table className="min-w-full text-sm border-t border-gray-200">
        <thead className="bg-gray-50 text-gray-700 font-semibold">
          <tr>
            <th className="px-4 py-2 text-left">Account Holder</th>
            <th className="px-4 py-2 text-left">Phone</th>
            <th className="px-4 py-2 text-left">Account #</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                No results found
              </td>
            </tr>
          ) : (
            results.map((a) => (
              <tr key={a.id} className="border-t hover:bg-purple-50 transition-all">
                <td className="px-4 py-2">{a.accountHolderName}</td>
                <td className="px-4 py-2">{a.phoneNumber}</td>
                <td className="px-4 py-2 font-mono">{a.accountNumber}</td>
                <td className="px-4 py-2">{a.typeOfAccount}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => {
                      setSelectedAccount(a);
                      setPopupMode("block");
                    }}
                    className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all"
                  >
                    Block
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccount(a);
                      setPopupMode("recover");
                    }}
                    className="ml-2 px-3 py-1 text-xs font-semibold bg-green-100 text-green-600 rounded hover:bg-green-200 transition-all"
                  >
                    Recover
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Popup for Block or Recover */}
      {popupMode && selectedAccount && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-purple-700">
              {popupMode === "block" ? "🚫 Block Phone" : "🔓 Recover Phone"}
            </h3>
            <p className="text-sm text-gray-600">
              Account Holder: <b>{selectedAccount.accountHolderName}</b>
              <br />
              Phone: <b>{selectedAccount.phoneNumber}</b>
            </p>

            {popupMode === "block" && (
              <div>
                <label className="font-medium text-sm text-gray-700">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for blocking..."
                  className="w-full mt-1 border-2 border-purple-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={closePopup}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              {popupMode === "block" ? (
                <button
                  onClick={handleBlock}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirm Block
                </button>
              ) : (
                <button
                  onClick={handleRecover}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Confirm Recover
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSearch;