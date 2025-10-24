import React from 'react';
import { motion } from 'framer-motion';
import InfoTile from '../../common/InfoTile';
import type { Customer } from '../../../types';

interface CustomerDetailsProps {
  customer: Customer;
  showApprovalMessage: boolean;
  currentWorkflow?: any; // Will be properly typed later
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  showApprovalMessage,
  currentWorkflow
}) => {
  const renderTransactionSpecificFields = () => {
    const fields = [];

    // Basic customer info
    fields.push(
      <motion.div
        key="basic-info"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {customer.accountHolderName || "Customer"}
        </h3>
        <p className="text-sm text-gray-500">
          Queue No: <span className="font-semibold">{customer.queueNumber}</span>
        </p>
        <p className="text-xs text-gray-600">
          Token: <span className="font-mono font-medium">{customer.tokenNumber}</span>
        </p>
        <p className="text-xs text-gray-600">
          Ref: <span className="font-mono font-medium">{customer.formReferenceId}</span>
        </p>
      </motion.div>
    );

    // Transaction Type
    fields.push(
      <InfoTile
        key="transaction-type"
        label="Transaction Type"
        value={customer.transactionType}
        highlight="type"
        index={0}
      />
    );

    // Account numbers
    let fieldIndex = 1;
    if (customer.accountNumber) {
      fields.push(
        <InfoTile
          key="account-number"
          label="Account Number"
          value={String(customer.accountNumber)}
          highlight="account"
          index={fieldIndex++}
        />
      );
    }

    if (customer.beneficiaryAccountNumber) {
      fields.push(
        <InfoTile
          key="beneficiary-account"
          label="Beneficiary Account"
          value={String(customer.beneficiaryAccountNumber)}
          highlight="account"
          index={fieldIndex++}
        />
      );
    }

    // Transaction amounts
    if (customer.transactionType === "Deposit" && customer.amount) {
      fields.push(
        <InfoTile
          key="deposit-amount"
          label="Deposit Amount"
          value={String(customer.amount)}
          highlight="amount"
          index={fieldIndex++}
        />
      );
    }

    if (customer.transactionType === "Withdrawal" && customer.withdrawal_Amount) {
      fields.push(
        <InfoTile
          key="withdrawal-amount"
          label="Withdrawal Amount"
          value={String(customer.withdrawal_Amount)}
          highlight="amount"
          index={fieldIndex++}
        />
      );
    }

    if (customer.transactionType === "FundTransfer" && customer.transferAmount) {
      fields.push(
        <InfoTile
          key="transfer-amount"
          label="Transfer Amount"
          value={String(customer.transferAmount)}
          highlight="amount"
          index={fieldIndex++}
        />
      );
    }

    // Additional fields
    if (customer.reason) {
      fields.push(
        <InfoTile
          key="reason"
          label="Reason"
          value={String(customer.reason)}
          index={fieldIndex++}
        />
      );
    }

    if (customer.remark) {
      fields.push(
        <InfoTile
          key="remark"
          label="Remark"
          value={String(customer.remark)}
          index={fieldIndex++}
        />
      );
    }

    return fields;
  };

  return (
    <div className="space-y-3">
      {renderTransactionSpecificFields()}

      {/* Approval Message */}
      {showApprovalMessage && currentWorkflow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Approval Required
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                {currentWorkflow.approvalReason}
              </p>
              <p className="mt-1 text-xs text-orange-600">
                This transaction has been queued for manager approval.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerDetails;