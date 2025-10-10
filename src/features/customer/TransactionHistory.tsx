import { useState, useEffect, memo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getWithdrawalHistoryByPhone, getDepositHistoryByPhone, getFundTransferHistoryByPhone, type Transaction } from '../../services/historyService';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/solid';
import { SkeletonTable } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

const TransactionIcon = memo(({ type }: { type: Transaction['type'] }) => {
    const baseClass = "h-8 w-8 text-white";
    if (type === 'Deposit') return <ArrowDownCircleIcon className={baseClass} />;
    if (type === 'Withdrawal') return <ArrowUpCircleIcon className={baseClass} />;
    if (type === 'Transfer') return <ArrowsRightLeftIcon className={baseClass} />;
    return null;
});

TransactionIcon.displayName = 'TransactionIcon';

const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800';
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const TransactionList = memo(({ transactions, type }: { transactions: Transaction[], type: Transaction['type'] | 'All' }) => {
    const filtered = type === 'All' ? transactions : transactions.filter(tx => tx.type === type);

    if (filtered.length === 0) {
        return <div className="text-center py-4 text-gray-500">No {type !== 'All' ? type.toLowerCase() + ' ' : ''}transactions found.</div>;
    }

    return (
        <ul className="divide-y divide-gray-200">
            {filtered.map(tx => (
                <li key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${tx.type === 'Deposit' ? 'bg-green-500' : tx.type === 'Withdrawal' ? 'bg-red-500' : 'bg-blue-500'}`}>
                            <TransactionIcon type={tx.type} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{tx.description}</p>
                            <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-bold ${tx.type === 'Deposit' ? 'text-green-600' : 'text-gray-800'}`}>
                            {tx.type === 'Deposit' ? '+' : '-'}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'ETB' })}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(tx.status)}`}>{tx.status}</span>
                    </div>
                </li>
            ))}
        </ul>
    );
});

TransactionList.displayName = 'TransactionList';

export default function TransactionHistory() {
    const { phone } = useAuth();
    const { error: showError, info } = useToast();
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'All' | 'Deposit' | 'Withdrawal' | 'Transfer'>('All');

    useEffect(() => {
        const fetchAllHistory = async () => {
            if (!phone) {
                const errorMsg = "Authentication error. Please log in again.";
                setError(errorMsg);
                showError(errorMsg);
                setIsLoading(false);
                return;
            }
            try {
                const [deposits, withdrawals, transfers] = await Promise.all([
                    getDepositHistoryByPhone(phone),
                    getWithdrawalHistoryByPhone(phone),
                    getFundTransferHistoryByPhone(phone),
                ]);

                const combinedTransactions = [
                    ...deposits,
                    ...withdrawals,
                    ...transfers,
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setAllTransactions(combinedTransactions);
                if (combinedTransactions.length === 0) {
                    info('No transactions found in your history.');
                }
            } catch (err) {
                console.error("Failed to fetch transaction history:", err);
                const errorMsg = "Failed to fetch transaction history. Please try again later.";
                setError(errorMsg);
                showError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllHistory();
    }, [phone, showError, info]);

    // Filter transactions based on the active tab
    const filteredTransactions = activeTab === 'All' ? allTransactions : allTransactions.filter(tx => tx.type === activeTab);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-fuchsia-800">Transaction History</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            {['All', 'Deposit', 'Withdrawal', 'Transfer'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`${activeTab === tab ? 'border-fuchsia-500 text-fuchsia-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-6">
                        {isLoading ? (
                            <SkeletonTable rows={5} columns={4} />
                        ) : error ? (
                            <div className="text-center py-10 text-red-600">{error}</div>
                        ) : (
                            <div className="space-y-6">
                                <TransactionList transactions={filteredTransactions} type={activeTab} />
                                {filteredTransactions.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">No {activeTab.toLowerCase()} transactions found.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}