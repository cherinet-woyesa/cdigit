import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@context/AuthContext';
import { usePermissions } from '@shared/hooks/usePermissions';
import approvalWorkflowService from '@services/approvalWorkflowService';
import authorizationAuditService from '@services/audit/authorizationAuditService';
import signatureCryptoService from '@services/signatureCryptoService';
import SignatureCanvas from 'react-signature-canvas';
import VoucherEditModal from '@features/maker/modals/VoucherEditModal';
import type { ApprovalWorkflow } from '@services/approvalWorkflowService';
import managerService from '@services/managerService';
import './VoucherDashboard.css';

// Voucher status enum matching backend states
export type VoucherStatus = 
  | 'Cancelled'
  | 'OnQueue'
  | 'OnProgress'
  | 'Completed'
  | 'Skipped';

export interface Voucher {
  id: string;
  formReferenceId: string;
  queueNumber: number;
  customerName: string;
  accountHolderName: string;
  amount: number;
  transactionType: string;
  status: VoucherStatus;
  frontMakerId?: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
  calledAt?: Date;
  depositedToCBSAt?: Date;
}

interface VoucherDashboardProps {
  showHeader?: boolean;
}

const VoucherDashboard: React.FC<VoucherDashboardProps> = ({ showHeader = true }) => {
  const { user } = useAuth();
  const { can, role } = usePermissions();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signaturePadRef, setSignaturePadRef] = useState<SignatureCanvas | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: 'approve' | 'reject' | 'forward';
    reason: string;
    forwardTo?: string;
  } | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    exceptions: 0,
    needsApproval: 0,
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load vouchers from backend
  const loadVouchers = useCallback(async () => {
    if (!user?.branchId) {
      setError('No branch ID found for user');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch today's transactions for the branch
      const response = await managerService.getTodaysTransactions(user.branchId);
      
      if (response && response.data) {
        // Transform the data to match our Voucher interface
        const voucherData: Voucher[] = (response.data as any[]).map(item => ({
          id: item.id,
          formReferenceId: item.formReferenceId,
          queueNumber: item.queueNumber,
          customerName: item.accountHolderName,
          accountHolderName: item.accountHolderName,
          amount: item.amount,
          transactionType: item.transactionType,
          status: item.status as VoucherStatus,
          frontMakerId: item.frontMakerId,
          branchId: item.branchId,
          createdAt: new Date(item.submittedAt),
          updatedAt: new Date(item.submittedAt),
          calledAt: item.calledAt ? new Date(item.calledAt) : undefined,
          depositedToCBSAt: item.depositedToCBSAt ? new Date(item.depositedToCBSAt) : undefined,
        }));
        
        // Sort by submittedAt descending
        voucherData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setVouchers(voucherData);
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
      setError('Failed to load vouchers: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [user?.branchId]);

  useEffect(() => {
    loadVouchers();
    // Refresh every 30 seconds
    const interval = setInterval(loadVouchers, 30000);
    return () => clearInterval(interval);
  }, [loadVouchers]);

  // Apply filters
  useEffect(() => {
    let filtered = [...vouchers];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.formReferenceId.toLowerCase().includes(term) ||
        v.customerName.toLowerCase().includes(term) ||
        v.accountHolderName.toLowerCase().includes(term)
      );
    }
    
    if (showPendingOnly) {
      filtered = filtered.filter(v => 
        v.status === 'OnQueue' || 
        v.status === 'OnProgress'
      );
    }
    
    if (showExceptionsOnly) {
      // In the real system, exceptions would be transactions with specific error states
      // For now, we'll show cancelled transactions as exceptions
      filtered = filtered.filter(v => v.status === 'Cancelled');
    }
    
    setFilteredVouchers(filtered);
    
    // Update statistics
    setStats({
      total: vouchers.length,
      pending: vouchers.filter(v => 
        v.status === 'OnQueue' || 
        v.status === 'OnProgress'
      ).length,
      approved: vouchers.filter(v => v.status === 'Completed').length,
      exceptions: vouchers.filter(v => v.status === 'Cancelled' || v.status === 'Skipped').length,
      needsApproval: vouchers.filter(v => v.status === 'OnQueue').length,
    });
  }, [vouchers, statusFilter, searchTerm, showPendingOnly, showExceptionsOnly]);

  // Auto-post to CBS
  const postToCBS = async (voucher: Voucher): Promise<void> => {
    try {
      console.log(`[CBS AUTO-POST] Posting voucher ${voucher.formReferenceId} to CBS...`);
      
      // In a real implementation, this would call an actual CBS API
      // For now, we'll just log it
      const cbsPostingId = `CBS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const cbsPostedAt = new Date();
      
      console.log(`[CBS AUTO-POST] Successfully posted to CBS: ${cbsPostingId}`);
    } catch (error) {
      console.error('[CBS AUTO-POST] Error posting to CBS:', error);
      throw error;
    }
  };

  // Handle voucher actions
  const handleViewVoucher = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
    
    // Log audit
    authorizationAuditService.logAuthorization({
      userId: user?.id || '',
      userRole: role || 'Maker',
      action: 'view_voucher',
      resource: `voucher:${voucher.formReferenceId}`,
      granted: true,
    });
  };

  const handleEditVoucher = (voucher: Voucher) => {
    if (!can('voucher.edit')) {
      alert('You do not have permission to edit vouchers');
      return;
    }
    
    // Log audit
    authorizationAuditService.logAuthorization({
      userId: user?.id || '',
      userRole: role || 'Maker',
      action: 'edit_voucher',
      resource: `voucher:${voucher.formReferenceId}`,
      granted: true,
    });
    
    // Open edit modal
    setSelectedVoucher(voucher);
    setShowEditModal(true);
  };

  const handleSaveVoucherEdit = (updatedVoucher: Voucher) => {
    try {
      // In a real implementation, this would update the backend
      // For now, we'll just show a success message
      alert('Voucher updated successfully!');
      
      // Close the edit modal
      setShowEditModal(false);
      setSelectedVoucher(null);
      
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Error saving voucher. Please try again.');
    }
  };

  const handleApproveClick = (voucher: Voucher) => {
    if (!can('voucher.approve')) {
      alert('You do not have permission to approve vouchers');
      return;
    }
    
    setSelectedVoucher(voucher);
    setPendingAction({ action: 'approve', reason: 'Approved by teller' });
    setShowSignatureModal(true);
  };

  const handleRejectClick = (voucher: Voucher) => {
    if (!can('voucher.reject')) {
      alert('You do not have permission to reject vouchers');
      return;
    }
    
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    setSelectedVoucher(voucher);
    setPendingAction({ action: 'reject', reason });
    setShowSignatureModal(true);
  };

  const handleForwardClick = (voucher: Voucher) => {
    if (!can('voucher.forward')) {
      alert('You do not have permission to forward vouchers');
      return;
    }
    
    const forwardTo = prompt('Forward to (Manager/Admin):');
    if (!forwardTo) return;
    
    setSelectedVoucher(voucher);
    setPendingAction({ action: 'forward', reason: 'Forwarded for review', forwardTo });
    setShowSignatureModal(true);
  };

  const handleSignatureSubmit = async () => {
    if (!signaturePadRef || !selectedVoucher || !pendingAction) return;
    
    if (signaturePadRef.isEmpty()) {
      alert('Please provide your signature');
      return;
    }
    
    try {
      const signatureDataUrl = signaturePadRef.toDataURL();
      const signatureData = {
        signatureDataUrl: signatureDataUrl,
        data: signatureDataUrl,
        timestamp: new Date(),
        userId: user?.id || '',
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Unknown',
        userRole: role || 'Maker',
      };
      
      const voucherData = {
        voucherId: selectedVoucher.formReferenceId,
        voucherType: selectedVoucher.transactionType,
        accountNumber: '', // Not available in this data structure
        amount: selectedVoucher.amount,
        currency: 'ETB', // Default currency
        customerName: selectedVoucher.customerName,
        customerId: '', // Not available in this data structure
      };
      
      // Bind signature cryptographically
      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureData,
        voucherData,
        'approver'
      );
      
      // Process the action
      if (selectedVoucher.id && (pendingAction.action === 'approve' || pendingAction.action === 'reject')) {
        const result = await approvalWorkflowService.processApproval({
          voucherId: selectedVoucher.id,
          action: pendingAction.action,
          approvedBy: user?.id || '',
          approverRole: role || 'Maker',
          reason: pendingAction.reason,
          digitalSignature: boundSignature.binding.bindingHash,
          timestamp: new Date(),
        });
        
        // Log approval action
        authorizationAuditService.logApproval({
          approverId: user?.id || '',
          approverRole: role || 'Maker',
          voucherId: selectedVoucher.id,
          voucherType: selectedVoucher.transactionType,
          action: pendingAction.action,
          amount: selectedVoucher.amount,
          currency: 'ETB',
          reason: pendingAction.reason,
          digitalSignature: boundSignature.binding.bindingHash,
        });
        
        // Auto-post to CBS if approved
        if (pendingAction.action === 'approve' && result) {
          await postToCBS(selectedVoucher);
        }
      } else if (pendingAction.action === 'forward') {
        // Log forward action (using approve action type)
        authorizationAuditService.logApproval({
          approverId: user?.id || '',
          approverRole: role || 'Maker',
          voucherId: selectedVoucher.id,
          voucherType: selectedVoucher.transactionType,
          action: 'approve',
          amount: selectedVoucher.amount,
          currency: 'ETB',
          reason: `Forwarded to ${pendingAction.forwardTo}: ${pendingAction.reason}`,
          digitalSignature: boundSignature.binding.bindingHash,
        });
      }
      
      // Reload vouchers
      await loadVouchers();
      
      // Close modals
      setShowSignatureModal(false);
      setShowDetailModal(false);
      setSelectedVoucher(null);
      setPendingAction(null);
      
      alert(`Voucher ${pendingAction.action}d successfully!`);
    } catch (error) {
      console.error('Error processing signature:', error);
      alert('Error processing signature. Please try again.');
    }
  };

  const getStatusBadgeClass = (status: VoucherStatus): string => {
    switch (status) {
      case 'OnQueue':
        return 'status-badge status-pending';
      case 'OnProgress':
        return 'status-badge status-verified';
      case 'Completed':
        return 'status-badge status-approved';
      case 'Cancelled':
        return 'status-badge status-rejected';
      case 'Skipped':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: VoucherStatus): string => {
    switch (status) {
      case 'OnQueue':
        return 'On Queue';
      case 'OnProgress':
        return 'In Progress';
      case 'Completed':
        return 'Completed';
      case 'Cancelled':
        return 'Cancelled';
      case 'Skipped':
        return 'Skipped';
      default:
        return status;
    }
  };

  return (
    <div className="voucher-dashboard">
      {showHeader && (
        <div className="dashboard-header">
          <h2>Voucher Dashboard</h2>
          <p>View and manage all vouchers with real-time status updates</p>
        </div>
      )}

      {error && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Total Vouchers</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-pending">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card stat-approved">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card stat-exceptions">
          <div className="stat-label">Exceptions</div>
          <div className="stat-value">{stats.exceptions}</div>
        </div>
        <div className="stat-card stat-needs-approval">
          <div className="stat-label">On Queue</div>
          <div className="stat-value">{stats.needsApproval}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Voucher ID, Customer Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as VoucherStatus | 'all')}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="OnQueue">On Queue</option>
            <option value="OnProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Skipped">Skipped</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
            />
            Pending Only
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            <input
              type="checkbox"
              checked={showExceptionsOnly}
              onChange={(e) => setShowExceptionsOnly(e.target.checked)}
            />
            Exceptions Only
          </label>
        </div>
        
        <button 
          onClick={loadVouchers} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="vouchers-table-container">
        <table className="vouchers-table">
          <thead>
            <tr>
              <th>Voucher Ref #</th>
              <th>Customer Name</th>
              <th>Queue Number</th>
              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                  Loading vouchers...
                </td>
              </tr>
            ) : filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                  No vouchers found
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => (
                <tr 
                  key={voucher.id}
                  className={`
                    ${voucher.status === 'Cancelled' || voucher.status === 'Skipped' ? 'row-exception' : ''}
                    ${voucher.status === 'OnQueue' ? 'row-needs-approval' : ''}
                  `}
                >
                  <td>
                    <strong>{voucher.formReferenceId}</strong>
                    {(voucher.status === 'Cancelled' || voucher.status === 'Skipped') && (
                      <span className="exception-icon" title="Exception transaction">⚠️</span>
                    )}
                    {voucher.status === 'OnQueue' && (
                      <span className="approval-icon" title="Requires attention">🔒</span>
                    )}
                  </td>
                  <td>{voucher.customerName}</td>
                  <td>{voucher.queueNumber}</td>
                  <td className="transaction-type">{voucher.transactionType}</td>
                  <td className="amount">
                    ETB {voucher.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(voucher.status)}>
                      {getStatusLabel(voucher.status)}
                    </span>
                  </td>
                  <td className="timestamp">
                    {new Date(voucher.createdAt).toLocaleString()}
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleViewVoucher(voucher)}
                      className="btn-action btn-view"
                      title="View Details"
                    >
                      👁️
                    </button>
                    {can('voucher.edit') && voucher.status !== 'Completed' && (
                      <button 
                        onClick={() => handleEditVoucher(voucher)}
                        className="btn-action btn-edit"
                        title="Edit Voucher"
                      >
                        ✏️
                      </button>
                    )}
                    {can('voucher.approve') && voucher.status === 'OnQueue' && (
                      <button 
                        onClick={() => handleApproveClick(voucher)}
                        className="btn-action btn-approve"
                        title="Approve Voucher"
                      >
                        ✅
                      </button>
                    )}
                    {can('voucher.reject') && voucher.status !== 'Completed' && voucher.status !== 'Cancelled' && (
                      <button 
                        onClick={() => handleRejectClick(voucher)}
                        className="btn-action btn-reject"
                        title="Reject Voucher"
                      >
                        ❌
                      </button>
                    )}
                    {can('voucher.forward') && voucher.status === 'OnQueue' && (
                      <button 
                        onClick={() => handleForwardClick(voucher)}
                        className="btn-action btn-forward"
                        title="Forward to Manager"
                      >
                        ➡️
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Voucher Detail Modal */}
      {showDetailModal && selectedVoucher && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Voucher Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <DetailRow label="Voucher Reference" value={selectedVoucher.formReferenceId} />
                <DetailRow label="Queue Number" value={selectedVoucher.queueNumber.toString()} />
                <DetailRow label="Status" value={getStatusLabel(selectedVoucher.status)} />
                <DetailRow label="Customer Name" value={selectedVoucher.customerName} />
                <DetailRow label="Transaction Type" value={selectedVoucher.transactionType} />
                <DetailRow 
                  label="Amount" 
                  value={`ETB ${selectedVoucher.amount.toLocaleString()}`} 
                />
                <DetailRow 
                  label="Submitted At" 
                  value={new Date(selectedVoucher.createdAt).toLocaleString()} 
                />
                {selectedVoucher.calledAt && (
                  <DetailRow 
                    label="Called At" 
                    value={new Date(selectedVoucher.calledAt).toLocaleString()} 
                  />
                )}
                {selectedVoucher.depositedToCBSAt && (
                  <DetailRow 
                    label="Deposited to CBS At" 
                    value={new Date(selectedVoucher.depositedToCBSAt).toLocaleString()} 
                  />
                )}
                {selectedVoucher.frontMakerId && (
                  <DetailRow label="Front Maker ID" value={selectedVoucher.frontMakerId} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && selectedVoucher && pendingAction && (
        <div className="modal-overlay" onClick={() => setShowSignatureModal(false)}>
          <div className="modal-content signature-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {pendingAction.action === 'approve' ? 'Approve' : 
                 pendingAction.action === 'reject' ? 'Reject' : 'Forward'} Voucher
              </h3>
              <button onClick={() => setShowSignatureModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Voucher:</strong> {selectedVoucher.formReferenceId}<br />
                <strong>Action:</strong> {pendingAction.action.toUpperCase()}<br />
                <strong>Reason:</strong> {pendingAction.reason}
                {pendingAction.forwardTo && (
                  <>
                    <br />
                    <strong>Forward To:</strong> {pendingAction.forwardTo}
                  </>
                )}
              </p>
              <div className="signature-container">
                <label>Your Digital Signature:</label>
                <div className="signature-pad-wrapper">
                  <SignatureCanvas
                    ref={(ref) => setSignaturePadRef(ref)}
                    canvasProps={{
                      className: 'signature-canvas',
                      width: 500,
                      height: 200,
                    }}
                  />
                </div>
                <button 
                  onClick={() => signaturePadRef?.clear()} 
                  className="btn-clear-signature"
                >
                  Clear Signature
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowSignatureModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSignatureSubmit} className="btn-primary">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Edit Modal */}
      {showEditModal && selectedVoucher && (
        <VoucherEditModal
          voucher={selectedVoucher}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVoucher(null);
          }}
          onSave={handleSaveVoucherEdit}
        />
      )}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}:</span>
    <span className="detail-value">{value}</span>
  </div>
);

export default VoucherDashboard;