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

  // Transaction types
  const transactionTypes = [
    'Cash Deposit',
    'Cash Withdrawal',
    'Transfer',
    'Check Deposit',
    'Check Withdrawal',
    'Account Opening',
    'Account Closure',
    'Foreign Exchange',
    'Standing Order',
    'Other',
  ];

  // Currency options
  const currencies = ['ETB', 'USD', 'EUR', 'GBP'];

  // Status options (only allow certain status transitions)
  const getAvailableStatuses = (currentStatus: VoucherStatus): VoucherStatus[] => {
    switch (currentStatus) {
      case 'draft':
        return ['draft', 'initiated'];
      case 'initiated':
        return ['initiated', 'pending_verification'];
      case 'pending_verification':
        return ['pending_verification', 'verified', 'rejected'];
      case 'verified':
        return ['verified', 'validated', 'rejected'];
      case 'validated':
        return ['validated', 'pending_approval'];
      case 'pending_approval':
        return ['pending_approval', 'approved', 'rejected'];
      default:
        return [currentStatus]; // No changes allowed for final states
    }
  };

  // Initialize form data when voucher changes
  useEffect(() => {
    if (voucher) {
      setFormData({
        ...voucher,
        // Ensure dates are properly formatted for input fields
        createdAt: voucher.createdAt,
        updatedAt: voucher.updatedAt,
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

    if (!formData.customerId?.trim()) {
      newErrors.customerId = 'Customer ID is required';
    }

    if (!formData.accountNumber?.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    if (!formData.transactionType?.trim()) {
      newErrors.transactionType = 'Transaction type is required';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.currency?.trim()) {
      newErrors.currency = 'Currency is required';
    }

    // Business rule validations
    if (formData.amount && formData.amount > 1000000) {
      newErrors.amount = 'Amount cannot exceed 1,000,000';
    }

    if (formData.accountNumber && !/^\d{10,16}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 10-16 digits';
    }

    if (formData.customerId && !/^[A-Z0-9]{8,12}$/.test(formData.customerId)) {
      newErrors.customerId = 'Customer ID must be 8-12 alphanumeric characters';
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
        lastModifiedBy: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
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
                  value={formData.customerName || ''}
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
                <label htmlFor="customerId">Customer ID *</label>
                <input
                  id="customerId"
                  type="text"
                  value={formData.customerId || ''}
                  onChange={(e) => handleInputChange('customerId', e.target.value.toUpperCase())}
                  className={errors.customerId ? 'error' : ''}
                  disabled={isSubmitting}
                  placeholder="e.g., CUST12345678"
                  maxLength={12}
                />
                {errors.customerId && (
                  <span className="error-message">{errors.customerId}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  id="accountNumber"
                  type="text"
                  value={formData.accountNumber || ''}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className={errors.accountNumber ? 'error' : ''}
                  disabled={isSubmitting}
                  placeholder="e.g., 1234567890123456"
                  maxLength={16}
                />
                {errors.accountNumber && (
                  <span className="error-message">{errors.accountNumber}</span>
                )}
              </div>
            </div>

            {/* Transaction Information */}
            <div className="form-section">
              <h4>Transaction Information</h4>
              
              <div className="form-group">
                <label htmlFor="transactionType">Transaction Type *</label>
                <select
                  id="transactionType"
                  value={formData.transactionType || ''}
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
                  max="1000000"
                  value={formData.amount || ''}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={errors.amount ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {errors.amount && (
                  <span className="error-message">{errors.amount}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency *</label>
                <select
                  id="currency"
                  value={formData.currency || ''}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className={errors.currency ? 'error' : ''}
                  disabled={isSubmitting}
                >
                  <option value="">Select Currency</option>
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <span className="error-message">{errors.currency}</span>
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
                  value={formData.status || voucher.status}
                  onChange={(e) => handleInputChange('status', e.target.value as VoucherStatus)}
                  disabled={isSubmitting}
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <small className="help-text">
                  Only certain status transitions are allowed based on business rules
                </small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.requiresApproval ?? voucher.requiresApproval}
                    onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  Requires Manager Approval
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isException ?? voucher.isException}
                    onChange={(e) => handleInputChange('isException', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  Mark as Exception
                </label>
              </div>

              {(formData.isException ?? voucher.isException) && (
                <div className="form-group">
                  <label htmlFor="exceptionReason">Exception Reason</label>
                  <textarea
                    id="exceptionReason"
                    value={formData.exceptionReason || ''}
                    onChange={(e) => handleInputChange('exceptionReason', e.target.value)}
                    disabled={isSubmitting}
                    placeholder="Explain why this voucher is marked as an exception..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              )}
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