import { useState, useEffect, useMemo, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useAuth } from "@context/AuthContext";
import { useNotification } from "@context/NotificationContext";
import makerService, { type CustomerQueueItem, type NextCustomerResponse, type TransactionType } from "@services/makerService";
import { speechService } from "@services/speechService";
import type { DecodedToken } from "@features/maker/types";
import type { WindowDto } from "@services/makerService";
import type { ActionMessage } from "@types";

export const useTransactions = (assignedWindow?: WindowDto | null) => {
  const { token, logout } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [decoded, setDecoded] = useState<DecodedToken | null>(null);
  const [queue, setQueue] = useState<CustomerQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [current, setCurrent] = useState<NextCustomerResponse | null>(null);
  const [busyAction, setBusyAction] = useState<"calling" | "completing" | "canceling" | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage | null>(null);
  const [priorityCount, setPriorityCount] = useState(0);

  // Decode token
  useEffect(() => {
    if (!token) return;
    try {
      const d = jwtDecode<DecodedToken>(token);
      setDecoded(d);
    } catch {
      logout();
    }
  }, [token, logout]);

  // Save/restore current customer
  useEffect(() => {
    if (current) {
      localStorage.setItem("currentCustomer", JSON.stringify(current));
    }
  }, [current]);

  useEffect(() => {
    const stored = localStorage.getItem("currentCustomer");
    if (stored) {
      try {
        const parsed: NextCustomerResponse = JSON.parse(stored);
        setCurrent(parsed);
      } catch {
        localStorage.removeItem("currentCustomer");
      }
    }
  }, []);

  // Refresh queue
  const refreshQueue = useCallback(async () => {
    if (!token || !decoded?.BranchId) {
      console.log('Missing token or branchId for queue refresh', { token: !!token, branchId: decoded?.BranchId });
      return;
    }
    
    setLoadingQueue(true);
    setQueueError("");
    try {
      console.log('Refreshing queue for branch:', decoded.BranchId);

      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(decoded.BranchId)) {
        console.warn('BranchId is not in valid GUID format:', decoded.BranchId);
        throw new Error('Invalid branch information format');
      }

      const res = await makerService.getAllCustomersOnQueueByBranch(decoded.BranchId, token);

      if (res.success || (res.message && res.message.includes('No customers in queue'))) {
        setQueue(res.data || []);
        if (!res.data || res.data.length === 0) {
          setQueueError("No customers in queue.");
        }
      } else {
        setQueue([]);
        setQueueError(res.message || "No customers in queue.");
      }
    } catch (error: any) {
      console.error('Queue refresh error:', error);
      
      let errorMessage = "Failed to load queue.";
      if (error.response?.status === 404) {
        errorMessage = "Branch not found. Please check your branch assignment.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (error.message === 'Invalid branch information format') {
        errorMessage = "Invalid branch information. Please contact administrator.";
      }

      setQueue([]);
      setQueueError(errorMessage);
    } finally {
      setLoadingQueue(false);
    }
  }, [token, decoded?.BranchId]);

  const refreshPriorityCount = useCallback(async () => {
    if (!token || !decoded?.BranchId || !decoded?.nameid) return;
    try {
      const res = await makerService.getPriorityCount(decoded.BranchId, decoded.nameid, token);
      if (typeof res === "number") setPriorityCount(res);
    } catch (err) {
      console.error("Error fetching priority count:", err);
    }
  }, [token, decoded?.BranchId, decoded?.nameid]);

  // Initialize queue and priority count
  useEffect(() => {
    if (decoded?.BranchId) void refreshQueue();
  }, [decoded?.BranchId, refreshQueue]);

  useEffect(() => {
    if (decoded?.BranchId && decoded?.nameid) void refreshPriorityCount();
  }, [decoded?.BranchId, decoded?.nameid, refreshPriorityCount]);

  // SignalR connection for real-time updates
  useEffect(() => {
    if (!decoded?.BranchId) return;

    let connection: any = null;

    const setupSignalR = async () => {
      try {
        connection = new HubConnectionBuilder()
          .withUrl('http://localhost:5268/hub/queueHub')
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: (retryContext) => {
              if (retryContext.previousRetryCount >= 5) return null;
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
          })
          .build();

        connection.onreconnecting(() => {
          console.log('SignalR reconnecting...');
        });

        connection.onreconnected(() => {
          console.log('SignalR reconnected successfully');
          connection.invoke('JoinBranchCustomersQueueGroup', decoded.BranchId).catch(console.error);
        });

        connection.onclose(() => {
          console.log('SignalR connection closed');
        });

        await connection.start();
        console.log('Connected to SignalR hub');

        await connection.invoke('JoinBranchCustomersQueueGroup', decoded.BranchId);
        await connection.invoke('JoinMakerPriorityGroup', decoded.nameid);
        
        connection.on('NewCustomer', (data: any) => {
          console.log('New customer notification received:', data);
          showInfo(
            `${data.transactionType} Request`,
            `${data.message} is coming, please ready to serve. Amount: ETB ${Number(data.amount).toLocaleString()}`
          );
          void refreshQueue();
        });

        connection.on('PriorityUpdated', async (data: any) => {
          console.log('Priority update notification:', data);
          await refreshPriorityCount();
        });

        // Add listener for transaction completion events
        connection.on('TransactionCompleted', async (data: any) => {
          console.log('Transaction completed notification:', data);
          // Refresh the queue to update statistics
          await refreshQueue();
          // Also refresh priority count as it might have changed
          await refreshPriorityCount();
        });

        // Add listener for general queue updates
        connection.on('QueueUpdated', async () => {
          console.log('Queue updated notification received');
          // Refresh the queue to update statistics
          await refreshQueue();
          // Also refresh priority count as it might have changed
          await refreshPriorityCount();
        });

      } catch (error) {
        console.error('SignalR connection failed:', error);
      }
    };

    setupSignalR();

    return () => {
      if (connection) {
        console.log('Cleaning up SignalR connection');
        connection.off('NewCustomer');
        connection.off('PriorityUpdated');
        connection.off('TransactionCompleted');
        connection.off('QueueUpdated');
        connection.stop().catch((err: any) => console.warn('Error stopping SignalR:', err));
      }
    };
  }, [decoded?.BranchId, decoded?.nameid, showInfo, refreshQueue, refreshPriorityCount]);

  // Transaction actions
  const handleCallNext = useCallback(async () => {
    if (!token || !decoded?.nameid || !assignedWindow?.id || !decoded?.BranchId || !assignedWindow?.windowType) return;

    setBusyAction("calling");
    try {
      const res = await makerService.callNextCustomer(
        decoded.nameid,
        assignedWindow.id,
        decoded.BranchId,
        assignedWindow.windowType,
        token
      );
      
      console.log("callNextCustomer response at ui:", res);
      if (!res.success || !res.data) {
        setCurrent(null);
        setActionMessage({ type: 'error', content: res.message || "No customer in queue." });
        return;
      }
      
      const data = res.data;
      setCurrent({
        ...data,
        accountHolderName: data.accountHolderName || data.customerName || data.account_name || '',
        accountNumber: data.accountNumber || data.accNumber || data.debitAccountNumber || '',
        amount: data.amount ?? data.depositAmount ?? data.DepositAmount ?? data.transferAmount ?? data.TransferAmount ?? data.withdrawal_Amount ?? data.withdrawa_Amount ?? 0,
      });
      setActionMessage({ type: 'success', content: res.message || "Customer called." });

      // Auto-announce customer
      if (res.data && speechService.isSupported) {
        const textToSpeak = `Customer ${res.data.accountHolderName || res.data.customerName || 'Customer'}, please proceed to window ${assignedWindow.windowNumber}.`;
        speechService.speak(textToSpeak, 'en');
      }

      await refreshQueue();
    } catch (error) {
      console.error('Call next customer error:', error);
      setActionMessage({ type: 'error', content: "Failed to call next customer." });
    } finally {
      setBusyAction(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }, [token, decoded, assignedWindow, refreshQueue]);

  const handleComplete = useCallback(async () => {
    if (!token || !current?.id) return;
    setBusyAction("completing");
    try {
      const res = await makerService.completeTransaction(current.id, token);
      if (!res.success) {
        setActionMessage({ type: 'error', content: res.message || "Failed to complete." });
        return;
      }
      setActionMessage({ type: 'success', content: res.message || "Transaction completed successfully." });

      setCurrent(null);
      localStorage.removeItem("currentCustomer");
      await refreshQueue();
    } catch {
      setActionMessage({ type: 'error', content: "Failed to complete." });
    } finally {
      setBusyAction(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }, [token, current, refreshQueue]);

  const handleCancel = useCallback(async () => {
    if (!token || !current?.id) return;
    setBusyAction("canceling");
    try {
      const res = await makerService.cancelTransaction(current.id, token);
      if (!res.success) {
        setActionMessage({ type: 'error', content: res.message || "Failed to cancel." });
        return;
      }
      setActionMessage({ type: 'success', content: res.message || "Transaction canceled successfully." });

      setCurrent(null);
      localStorage.removeItem("currentCustomer");
      await refreshQueue();
    } catch {
      setActionMessage({ type: 'error', content: "Failed to cancel." });
    } finally {
      setBusyAction(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  }, [token, current, refreshQueue]);

  // Stats calculation
  const stats = useMemo(() => {
    const totals = {
      Deposit: 0,
      Withdrawal: 0,
      FundTransfer: 0,
    } as Record<TransactionType, number>;
    queue.forEach((q) => {
      totals[q.transactionType as TransactionType] += 1;
    });
    return { ...totals, total: queue.length };
  }, [queue]);

  return {
    // State
    decoded,
    queue,
    loadingQueue,
    queueError,
    current,
    busyAction,
    actionMessage,
    priorityCount,
    stats,
    setCurrent,
    
    // Actions
    refreshQueue,
    handleCallNext,
    handleComplete,
    handleCancel,
    setActionMessage,
    
    // Computed
    showCurrentCustomerModal: !!current && !!current.accountHolderName && (
      !!current.accountNumber || !!current.debitAccountNumber || !!current.beneficiaryAccountNumber
    )
  };
};