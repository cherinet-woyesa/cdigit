import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import authorizationAuditService from '../../services/authorizationAuditService';
import type { Voucher, VoucherStatus } from './VoucherDashboard';
import './VoucherDashboard.css';

interface VoucherEditModalProps {
  voucher: Voucher;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVoucher: Voucher) => void;
}

const VoucherEditModal: React.FC<VoucherEditModalProps> = ({
  voucher,
  isOpen,
  onClose,
  onSave,
}) => {
  const { user } = useAuth();
  const { role } = usePermissions();

  // Form state
  const [formData, setFormData] = useState<Partial<Voucher>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transaction types based on the actual data
  const transactionTypes = [
    'Deposit',
    'Withdrawal',
    'FundTransfer',
    'RTGS',
  ];

  // Currency options
  const currencies = ['ETB', 'USD', 'EUR', 'GBP'];

  // Status options (only allow certain status transitions)
  const getAvailableStatuses = (currentStatus: VoucherStatus): VoucherStatus[] => {
    // In the real system, status transitions would be more complex
    // For now, we'll allow all statuses to be selected
    return ['Cancelled', 'OnQueue', 'OnProgress', 'Completed', 'Skipped'];
  };

  // Initialize form data when voucher changes
  useEffect(() => {
    if (voucher) {
      setFormData({
        ...voucher,
      });
      setErrors({});
    }
  }, [voucher]);

  // Handle form field changes
  const handleInputChange = (field: keyof Voucher, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.transactionType?.trim()) {
      newErrors.transactionType = 'Transaction type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create updated voucher object
      const updatedVoucher: Voucher = {
        ...voucher,
        ...formData,
        updatedAt: new Date(),
      } as Voucher;

      // Log the edit action
      authorizationAuditService.logAuthorization({
        userId: user?.id || '',
        userRole: role || 'Maker',
        action: 'edit_voucher_save',
        resource: `voucher:${voucher.formReferenceId}`,
        granted: true,
        context: {
          changes: Object.keys(formData).filter(key => 
            formData[key as keyof Voucher] !== voucher[key as keyof Voucher]
          ),
        },
      });

      // Call the onSave callback
      onSave(updatedVoucher);

      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const availableStatuses = getAvailableStatuses(voucher.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content voucher-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Voucher - {voucher.formReferenceId}</h3>
          <button onClick={onClose} className="modal-close" disabled={isSubmitting}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* Customer Information */}
            <div className="form-section">
              <h4>Customer Information</h4>
              
              <div className="form-group">
                <label htmlFor="customerName">Customer Name *</label>
                <input
                  id="customerName"
                  type="text"
                  value={formData.customerName || voucher.customerName || ''}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className={errors.customerName ? 'error' : ''}
                  disabled={isSubmitting}
                  maxLength={100}
                />
                {errors.customerName && (
                  <span className="error-message">{errors.customerName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="accountHolderName">Account Holder Name</label>
                <input
                  id="accountHolderName"
                  type="text"
                  value={formData.accountHolderName || voucher.accountHolderName || ''}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  disabled={isSubmitting}
                  maxLength={100}
                />
              </div>
            </div>

            {/* Transaction Information */}
            <div className="form-section">
              <h4>Transaction Information</h4>
              
              <div className="form-group">
                <label htmlFor="transactionType">Transaction Type *</label>
                <select
                  id="transactionType"
                  value={formData.transactionType || voucher.transactionType || ''}
                  onChange={(e) => handleInputChange('transactionType', e.target.value)}
                  className={errors.transactionType ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Transaction Type</option>
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.transactionType && (
                  <span className="error-message">{errors.transactionType}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.amount || voucher.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={errors.amount ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <span className="error-message">{errors.amount}</span>
                )}
              </div>
            </div>

            {/* Status Information */}
            <div className="form-section">
              <h4>Status Information</h4>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={formData.status || voucher.status || 'OnQueue'}
                  onChange={(e) => handleInputChange('status', e.target.value as VoucherStatus)}
                  disabled={isSubmitting}
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="queueNumber">Queue Number</label>
                <input
                  id="queueNumber"
                  type="number"
                  value={formData.queueNumber || voucher.queueNumber || ''}
                  onChange={(e) => handleInputChange('queueNumber', parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherEditModal;