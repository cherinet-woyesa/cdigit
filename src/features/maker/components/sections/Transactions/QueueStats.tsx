import React from 'react';
import type { TransactionType } from '../../../../../services/makerService';

interface QueueStatsProps {
  stats: {
    Deposit: number;
    Withdrawal: number;
    FundTransfer: number;
    total: number;
  };
}

const QueueStats: React.FC<QueueStatsProps> = ({ stats }) => {
  return (
    <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
        <h3 className="text-sm font-semibold text-gray-900">Queue Statistics</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-600 font-medium mb-1">Deposits</p>
          <p className="text-2xl font-bold text-blue-700">{stats.Deposit}</p>
        </div>
        <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
          <p className="text-xs text-amber-600 font-medium mb-1">Withdrawals</p>
          <p className="text-2xl font-bold text-amber-700">{stats.Withdrawal}</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs text-purple-600 font-medium mb-1">Transfers</p>
          <p className="text-2xl font-bold text-purple-700">{stats.FundTransfer}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium mb-1">Total in Queue</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
      </div>
    </section>
  );
};

export default QueueStats;