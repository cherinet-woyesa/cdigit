import { useState } from "react";
import { Button } from "@components/ui/button";
import toast from "react-hot-toast";
import managerPettyCashService from "@services/transactions/managerPettyCashService";

interface Props {
  token: string | null;
  open: boolean;
  onClose: () => void;
  pettyCash: any;
  voultManagerId: string;
  onUpdated: () => Promise<void>;
}

export default function PettyCashDetailModal({
  token,
  open,
  onClose,
  pettyCash,
  voultManagerId,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState<{
    type: "initial" | "additional" | null;
  }>({ type: null });
  const [amount, setAmount] = useState<number>(0);


  console.log("petty for curent user:", pettyCash);

  if (!open || !pettyCash) return null;

  // 🟢 Separate Handlers
  const handleGiveInitial = async () => {
    try {
      setLoading(true);
      const res = await managerPettyCashService.giveInitialCash(
        pettyCash.id,
        voultManagerId,
        amount
      );
      if (res?.success) {
        toast.success(res.message);
        await onUpdated();
        setShowAmountModal({ type: null });
      } else toast.error(res?.message || "Failed to give initial cash");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleGiveAdditional = async () => {
    try {
      setLoading(true);
      const res = await managerPettyCashService.giveAdditionalCash(
        pettyCash.id,
        voultManagerId,
        amount
      );
      if (res?.success) {
        toast.success(res.message);
        await onUpdated();
        setShowAmountModal({ type: null });
      } else toast.error(res?.message || "Failed to give additional cash");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSurrender = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await managerPettyCashService.approveSurrender(
        pettyCash.id,
        pettyCash.frontMakerId,
        token
      );
      if (res?.success) {
        toast.success(res.message);
        await onUpdated();
      } else toast.error(res?.message || "Failed to approve surrender");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdditionalSurrender = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await managerPettyCashService.approveAdditionalSurrender(
        pettyCash.id,
        pettyCash.frontMakerId,
        token
      );
      if (res?.success) {
        toast.success(res.message);
        await onUpdated();
      } else toast.error(res?.message || "Failed to approve additional surrender");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveForeign = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await managerPettyCashService.approveForeignCurrency(
        pettyCash.id,
        pettyCash.frontMakerId,
        token
      );
      if (res?.success) {
        toast.success(res.message);
        await onUpdated();
      } else toast.error(res?.message || "Failed to approve foreign currency");
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔹 Main Detail Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl animate-fadeIn">
          <h2 className="text-xl font-semibold text-purple-900 mb-3">
            💵 Petty Cash Detail
          </h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <b>Form Ref:</b> {pettyCash.formReferenceId}
            </div>
            <div>
              <b>Maker:</b> {pettyCash.frontMakerName}
            </div>
            <div>
              <b>Given from Vault:</b> {pettyCash.cashReceivedFromVault}
            </div>
            <div>
              <b>Surrendered to Vault:</b> {pettyCash.cashSurrenderedToVault}
            </div>
            <div>
              <b>Request Add Cash:</b> {pettyCash.makerRequestAdditional ? "Yes" : "No"}
            </div>
            <div>
              <b>Add Given:</b> {pettyCash.managerGiveAdditionalCashReq ? "Yes" : "No"}
            </div>
            <div>
              <b>Surrender Add:</b> {pettyCash.makerRequestAdditionalSurrender ? "Yes" : "No"}
            </div>
            <div>
              <b>Initial Approval by maker:</b> {pettyCash.initialApprovalByMaker ? "Yes" : "No"}
            </div>
            <div>
              <b>Additional Approval by maker:</b> {pettyCash.additionalApprovalByMaker ? "Yes" : "No"}
            </div>
            <div>
              <b>Today Balance:</b> {pettyCash.todayBalance? pettyCash.todayBalance : (pettyCash.cashReceivedFromVault- pettyCash.cashSurrenderedToVault)}
            </div>
          </div>

          <div className="mt-5 border-t pt-4">
            <h3 className="font-semibold text-purple-700 mb-2">
              Manager Actions
            </h3>

            <div className="flex flex-wrap gap-2">

              {(!pettyCash.cashReceivedFromVault && pettyCash.makerRequestInitial) && (
                <Button
                  onClick={() => setShowAmountModal({ type: "initial" })}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  Give Initial
                </Button>
              )}

              {(pettyCash && pettyCash.makerRequestAdditional && !pettyCash.managerGiveAdditionalCashReq) && (
                <Button
                  onClick={() => setShowAmountModal({ type: "additional" })}
                  disabled={loading}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  Give Additional
                </Button>
              )}

              {((pettyCash.cashSurrenderedToVault != 0) && !pettyCash.initialApprovalByVManager) && (
                <Button
                  onClick={handleApproveSurrender}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  Approve Surrender
                </Button>
              )}

              {(pettyCash.makerRequestAdditionalSurrender && !pettyCash.additionalApprovalByVManager) && (
                <Button
                  onClick={handleApproveAdditionalSurrender}
                  disabled={loading}
                  className="bg-pink-600 hover:bg-pink-500 text-white"
                >
                  Approve Additional Surrender
                </Button>
              )}

              {(pettyCash.foreignCurrencies && !pettyCash.foreignCurrencyApprovalByManager) && (
                <Button
                  onClick={handleApproveForeign}
                  disabled={loading}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  Approve Foreign Currency:
                </Button>
              )}

              {(pettyCash.foreignCurrencies && !pettyCash.foreignCurrencyApprovalByManager) && (
              <div>
                foreign Currency: {pettyCash.foreignCurrencies}
              </div>
                 )}

            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* 🔹 Sub-Popup for Amount Input */}
      {showAmountModal.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fadeIn">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">
              {showAmountModal.type === "initial"
                ? "💰 Give Initial Cash"
                : "💵 Give Additional Cash"}
            </h3>

            <div className="space-y-2 text-sm">
              <p>
                <b>Form ID:</b> {pettyCash.id}
              </p>
              <p>
                <b>Vault Manager ID:</b> {voultManagerId}
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount"
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button
                onClick={() => setShowAmountModal({ type: null })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </Button>

              <Button
                onClick={
                  showAmountModal.type === "initial"
                    ? handleGiveInitial
                    : handleGiveAdditional
                }
                disabled={loading || !amount}
                className="bg-gradient-to-r from-purple-600 to-purple-400 text-white hover:from-purple-700 hover:to-purple-500"
              >
                {loading
                  ? "Processing..."
                  : showAmountModal.type === "initial"
                    ? "Confirm Initial"
                    : "Confirm Additional"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}