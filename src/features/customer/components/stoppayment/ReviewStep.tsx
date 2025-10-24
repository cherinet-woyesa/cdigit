
// features/customer/components/stoppayment/ReviewStep.tsx
import React from 'react';

export default function ReviewStep({ formData, selectedSpo }) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review Details</h2>
            {formData.mode === 'spo' ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>Account:</strong> {formData.accountNumber}</p>
                    <p><strong>Cheque Number:</strong> {formData.chequeNumber}</p>
                    <p><strong>Amount:</strong> {formData.amount}</p>
                    <p><strong>Cheque Date:</strong> {formData.chequeDate}</p>
                    <p><strong>Reason:</strong> {formData.reason}</p>
                </div>
            ) : (
                selectedSpo && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p><strong>Account:</strong> {selectedSpo.accountNumber}</p>
                        <p><strong>Cheque Number:</strong> {selectedSpo.chequeNumber}</p>
                        <p><strong>Amount:</strong> {selectedSpo.chequeAmount}</p>
                        <p><strong>Reason:</strong> {selectedSpo.reason}</p>
                    </div>
                )
            )}
        </div>
    );
}
