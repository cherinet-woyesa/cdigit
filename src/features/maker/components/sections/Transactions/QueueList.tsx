import React from 'react';
import { ClockIcon } from "@heroicons/react/24/outline";
import type { CustomerQueueItem } from '@services/makerService';
import { SkeletonCard } from '@components/feedback/Skeleton';
import { EmptyState } from '@features/maker/components/common';

interface QueueListProps {
  queue: CustomerQueueItem[];
  loadingQueue: boolean;
  queueError: string;
}

const QueueList: React.FC<QueueListProps> = ({ queue, loadingQueue, queueError }) => {
  if (loadingQueue) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        title="No Customers in Queue"
        message={queueError || "There are no customers waiting in the queue at this time."}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {queue.map((q) => (
        <QueueCard key={q.id} customer={q} />
      ))}
    </div>
  );
};

const QueueCard: React.FC<{ customer: CustomerQueueItem }> = ({ customer }) => {
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "Deposit":
        return "bg-blue-100 text-blue-700";
      case "Withdrawal":
        return "bg-amber-100 text-amber-700";
      case "FundTransfer":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getTransactionTypeColor(customer.transactionType)}`}>
          {customer.transactionType}
        </span>
        <span className="text-sm font-semibold text-gray-900">
          Q#{customer.queueNumber}
        </span>
      </div>
      <div className="font-semibold text-gray-900 mb-2">
        {customer.accountHolderName}
      </div>
      <div className="text-sm text-gray-600 mb-3">
        ETB {Number(customer.amount).toLocaleString()}
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-1">
        <ClockIcon className="h-3 w-3" />
        {new Date(customer.submittedAt).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default QueueList;