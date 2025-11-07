import React from 'react';
import type { PettyCashFormResponseDto } from '@features/maker/types';

interface PettyCashSummaryProps {
  data: PettyCashFormResponseDto;
  decoded: any;
}

const PettyCashSummary: React.FC<PettyCashSummaryProps> = ({ data, decoded }) => {
  const summaryItems = [
    // Identifiers
    { label: "Form Reference", value: data.formReferenceId },
    
    // User & Branch Info
    { label: "Front Maker", value: data.frontMakerName || decoded?.unique_name },
    { label: "Branch", value: data.branchName || decoded?.BranchId },

    // Maker Requests
    { label: "Initial Request", value: data.makerRequestInitial ? "✅ Yes" : "❌ No" },
    { label: "Additional Request", value: data.makerRequestAdditional ? "✅ Yes" : "❌ No" },
    { label: "Additional Surrender Request", value: data.makerRequestAdditionalSurrender ? "✅ Yes" : "❌ No" },

    // Vault Actions
    { label: "Cash Received from Vault", value: `ETB ${data.cashReceivedFromVault.toFixed(2)}` },
    { label: "Cash Surrendered to Vault", value: `ETB ${data.cashSurrenderedToVault.toFixed(2)}` },
    { label: "Initial Approved by Vault Mgr", value: data.initialApprovalByVManager ? "✅" : "❌" },

    // Additional Cash Flow
    { label: "Additional Received from Vault", value: data.additionalCashReceivedFromVault !== undefined ? `ETB ${data.additionalCashReceivedFromVault.toFixed(2)}` : "—" },
    { label: "Additional Surrendered to Vault", value: data.additionalCashSurrenderedToVault !== undefined ? `ETB ${data.additionalCashSurrenderedToVault.toFixed(2)}` : "—" },
    { label: "Additional Approved by Maker", value: data.additionalApprovalByMaker ? "✅" : "❌" },

    // Transactions
    { label: "Cash Received from Customers", value: `ETB ${data.cashReceivedFromCustomers.toFixed(2)}` },
    { label: "Cash Paid to Customers", value: `ETB ${data.cashPaidToCustomers.toFixed(2)}` },
    { label: "Total Coins", value: `ETB ${data.totalCoins.toFixed(2)}` },

    // Balances
    { label: "Previous Day Balance", value: `ETB ${data.previousDayBalance.toFixed(2)}` },
    { label: "Today's Balance", value: `ETB ${data.todayBalance.toFixed(2)}` },

    // Calculations
    { label: "Subtotal", value: `ETB ${data.subtotal.toFixed(2)}` },
    { label: "Total Petty Cash", value: `ETB ${data.totalPettyCash.toFixed(2)}` },

    // Foreign & Audit
    { label: "Foreign Currency Approved", value: data.foreignCurrencyApprovalByManager ? "✅" : "❌" },
    { label: "Denominations", value: data.denominations || "—" },
    { label: "Foreign Currencies", value: data.foreignCurrencies || "—" },
  ];

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
      <h4 className="font-semibold text-gray-700 mb-4">💰 Current Petty Cash Summary</h4>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-3 text-sm text-gray-800">
        {summaryItems.map((item, index) => (
          <div key={index} className="break-words">
            <span className="font-medium text-gray-600">{item.label}:</span> {item.value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PettyCashSummary;