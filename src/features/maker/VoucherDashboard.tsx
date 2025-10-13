import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import approvalWorkflowService from '../../services/approvalWorkflowService';
import authorizationAuditService from '../../services/authorizationAuditService';
import signatureCryptoService from '../../services/signatureCryptoService';
import SignatureCanvas from 'react-signature-canvas';
import VoucherEditModal from './VoucherEditModal';
import type { ApprovalWorkflow } from '../../services/approvalWorkflowService';
import './VoucherDashboard.css';

// Voucher status enum matching workflow states
export type VoucherStatus = 
  | 'draft' 
  | 'initiated' 
  | 'pending_verification' 
  | 'verified' 
  | 'validated'
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'posted'
  | 'completed'
  | 'exception';

export interface Voucher {
  formReferenceId: string;
  customerName: string;
  customerId: string;
  accountNumber: string;
  transactionType: string;
  amount: number;
  currency: string;
  status: VoucherStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy?: string;
  workflowId?: string;
  requiresApproval: boolean;
  isException: boolean;
  exceptionReason?: string;
  tellerSignature?: any;
  approverSignature?: any;
  cbsPostingId?: string;
  cbsPostedAt?: Date;
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

  // Load vouchers from localStorage
  const loadVouchers = useCallback(() => {
    try {
      // Load from localStorage (mock data source)
      const storedVouchers = localStorage.getItem('vouchers');
      const voucherData: Voucher[] = storedVouchers ? JSON.parse(storedVouchers) : [];
      
      // Sort by updatedAt descending
      voucherData.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      setVouchers(voucherData);
    } catch (error) {
      console.error('Error loading vouchers:', error);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
    // Refresh every 5 seconds
    const interval = setInterval(loadVouchers, 5000);
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
        v.customerId.toLowerCase().includes(term) ||
        v.accountNumber.toLowerCase().includes(term)
      );
    }
    
    if (showPendingOnly) {
      filtered = filtered.filter(v => 
        v.status === 'pending_verification' || 
        v.status === 'pending_approval' ||
        v.status === 'validated'
      );
    }
    
    if (showExceptionsOnly) {
      filtered = filtered.filter(v => v.isException);
    }
    
    setFilteredVouchers(filtered);
    
    // Update statistics
    setStats({
      total: vouchers.length,
      pending: vouchers.filter(v => 
        v.status === 'pending_verification' || 
        v.status === 'pending_approval' ||
        v.status === 'validated'
      ).length,
      approved: vouchers.filter(v => v.status === 'approved' || v.status === 'posted' || v.status === 'completed').length,
      exceptions: vouchers.filter(v => v.isException).length,
      needsApproval: vouchers.filter(v => v.requiresApproval && v.status === 'pending_approval').length,
    });
  }, [vouchers, statusFilter, searchTerm, showPendingOnly, showExceptionsOnly]);

  // Auto-post to CBS
  const postToCBS = async (voucher: Voucher): Promise<void> => {
    try {
      console.log(`[CBS AUTO-POST] Posting voucher ${voucher.formReferenceId} to CBS...`);
      
      // Simulate CBS API call
      const cbsPostingId = `CBS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const cbsPostedAt = new Date();
      
      // Update voucher status
      const updatedVouchers = vouchers.map(v => {
        if (v.formReferenceId === voucher.formReferenceId) {
          return {
            ...v,
            status: 'posted' as VoucherStatus,
            cbsPostingId,
            cbsPostedAt,
            updatedAt: new Date(),
          };
        }
        return v;
      });
      
      setVouchers(updatedVouchers);
      localStorage.setItem('vouchers', JSON.stringify(updatedVouchers));
      
      // Log CBS posting (using approve action)
      authorizationAuditService.logApproval({
        approverId: user?.id || 'CBS_SYSTEM',
        approverRole: role || 'Maker',
        voucherId: voucher.formReferenceId,
        voucherType: voucher.transactionType,
        action: 'approve',
        amount: voucher.amount,
        currency: voucher.currency,
        reason: `Auto-posted to CBS with ID: ${cbsPostingId}`,
      });
      
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
      // Update the voucher in the local state
      const updatedVouchers = vouchers.map(v => 
        v.formReferenceId === updatedVoucher.formReferenceId ? updatedVoucher : v
      );
      
      setVouchers(updatedVouchers);
      localStorage.setItem('vouchers', JSON.stringify(updatedVouchers));
      
      // Close the edit modal
      setShowEditModal(false);
      setSelectedVoucher(null);
      
      alert('Voucher updated successfully!');
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
        accountNumber: selectedVoucher.accountNumber,
        amount: selectedVoucher.amount,
        currency: selectedVoucher.currency,
        customerName: selectedVoucher.customerName,
        customerId: selectedVoucher.customerId,
      };
      
      // Bind signature cryptographically
      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureData,
        voucherData,
        'approver'
      );
      
      // Process the action
      if (selectedVoucher.workflowId && (pendingAction.action === 'approve' || pendingAction.action === 'reject')) {
        const result = await approvalWorkflowService.processApproval({
          voucherId: selectedVoucher.formReferenceId,
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
          voucherId: selectedVoucher.formReferenceId,
          voucherType: selectedVoucher.transactionType,
          action: pendingAction.action,
          amount: selectedVoucher.amount,
          currency: selectedVoucher.currency,
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
          voucherId: selectedVoucher.formReferenceId,
          voucherType: selectedVoucher.transactionType,
          action: 'approve',
          amount: selectedVoucher.amount,
          currency: selectedVoucher.currency,
          reason: `Forwarded to ${pendingAction.forwardTo}: ${pendingAction.reason}`,
          digitalSignature: boundSignature.binding.bindingHash,
        });
      }
      
      // Reload vouchers
      loadVouchers();
      
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
      case 'draft':
      case 'initiated':
        return 'status-badge status-draft';
      case 'pending_verification':
      case 'validated':
        return 'status-badge status-pending';
      case 'verified':
        return 'status-badge status-verified';
      case 'pending_approval':
        return 'status-badge status-pending-approval';
      case 'approved':
        return 'status-badge status-approved';
      case 'posted':
      case 'completed':
        return 'status-badge status-posted';
      case 'rejected':
      case 'exception':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  const getStatusLabel = (status: VoucherStatus): string => {
    switch (status) {
      case 'pending_verification':
        return 'Pending Verification';
      case 'pending_approval':
        return 'Pending Approval';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
          <div className="stat-label">Approved</div>
          <div className="stat-value">{stats.approved}</div>
        </div>
        <div className="stat-card stat-exceptions">
          <div className="stat-label">Exceptions</div>
          <div className="stat-value">{stats.exceptions}</div>
        </div>
        <div className="stat-card stat-needs-approval">
          <div className="stat-label">Needs Approval</div>
          <div className="stat-value">{stats.needsApproval}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Voucher ID, Customer Name, Account..."
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
            <option value="draft">Draft</option>
            <option value="initiated">Initiated</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="verified">Verified</option>
            <option value="validated">Validated</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="posted">Posted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
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
        
        <button onClick={loadVouchers} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="vouchers-table-container">
        <table className="vouchers-table">
          <thead>
            <tr>
              <th>Voucher Ref #</th>
              <th>Customer Name</th>
              <th>Customer ID</th>
              <th>Account Number</th>
              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                  No vouchers found
                </td>
              </tr>
            ) : (
              filteredVouchers.map((voucher) => (
                <tr 
                  key={voucher.formReferenceId}
                  className={`
                    ${voucher.isException ? 'row-exception' : ''}
                    ${voucher.requiresApproval && voucher.status === 'pending_approval' ? 'row-needs-approval' : ''}
                  `}
                >
                  <td>
                    <strong>{voucher.formReferenceId}</strong>
                    {voucher.isException && (
                      <span className="exception-icon" title={voucher.exceptionReason}>⚠️</span>
                    )}
                    {voucher.requiresApproval && (
                      <span className="approval-icon" title="Requires Manager Approval">🔒</span>
                    )}
                  </td>
                  <td>{voucher.customerName}</td>
                  <td>{voucher.customerId}</td>
                  <td>{voucher.accountNumber}</td>
                  <td className="transaction-type">{voucher.transactionType}</td>
                  <td className="amount">
                    {voucher.currency} {voucher.amount.toLocaleString()}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(voucher.status)}>
                      {getStatusLabel(voucher.status)}
                    </span>
                  </td>
                  <td className="timestamp">
                    {new Date(voucher.updatedAt).toLocaleString()}
                  </td>
                  <td className="actions">
                    <button 
                      onClick={() => handleViewVoucher(voucher)}
                      className="btn-action btn-view"
                      title="View Details"
                    >
                      👁️
                    </button>
                    {can('voucher.edit') && voucher.status !== 'posted' && voucher.status !== 'completed' && (
                      <button 
                        onClick={() => handleEditVoucher(voucher)}
                        className="btn-action btn-edit"
                        title="Edit Voucher"
                      >
                        ✏️
                      </button>
                    )}
                    {can('voucher.approve') && 
                     (voucher.status === 'pending_approval' || voucher.status === 'validated') && (
                      <button 
                        onClick={() => handleApproveClick(voucher)}
                        className="btn-action btn-approve"
                        title="Approve Voucher"
                      >
                        ✅
                      </button>
                    )}
                    {can('voucher.reject') && 
                     voucher.status !== 'posted' && 
                     voucher.status !== 'completed' && 
                     voucher.status !== 'rejected' && (
                      <button 
                        onClick={() => handleRejectClick(voucher)}
                        className="btn-action btn-reject"
                        title="Reject Voucher"
                      >
                        ❌
                      </button>
                    )}
                    {can('voucher.forward') && 
                     voucher.requiresApproval && 
                     voucher.status === 'pending_approval' && (
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
                <DetailRow label="Status" value={getStatusLabel(selectedVoucher.status)} />
                <DetailRow label="Customer Name" value={selectedVoucher.customerName} />
                <DetailRow label="Customer ID" value={selectedVoucher.customerId} />
                <DetailRow label="Account Number" value={selectedVoucher.accountNumber} />
                <DetailRow label="Transaction Type" value={selectedVoucher.transactionType} />
                <DetailRow 
                  label="Amount" 
                  value={`${selectedVoucher.currency} ${selectedVoucher.amount.toLocaleString()}`} 
                />
                <DetailRow 
                  label="Created At" 
                  value={new Date(selectedVoucher.createdAt).toLocaleString()} 
                />
                <DetailRow 
                  label="Updated At" 
                  value={new Date(selectedVoucher.updatedAt).toLocaleString()} 
                />
                <DetailRow label="Created By" value={selectedVoucher.createdBy} />
                {selectedVoucher.lastModifiedBy && (
                  <DetailRow label="Last Modified By" value={selectedVoucher.lastModifiedBy} />
                )}
                {selectedVoucher.workflowId && (
                  <DetailRow label="Workflow ID" value={selectedVoucher.workflowId} />
                )}
                <DetailRow 
                  label="Requires Approval" 
                  value={selectedVoucher.requiresApproval ? 'Yes' : 'No'} 
                />
                <DetailRow 
                  label="Is Exception" 
                  value={selectedVoucher.isException ? 'Yes' : 'No'} 
                />
                {selectedVoucher.exceptionReason && (
                  <DetailRow label="Exception Reason" value={selectedVoucher.exceptionReason} />
                )}
                {selectedVoucher.cbsPostingId && (
                  <>
                    <DetailRow label="CBS Posting ID" value={selectedVoucher.cbsPostingId} />
                    <DetailRow 
                      label="Posted At" 
                      value={selectedVoucher.cbsPostedAt ? new Date(selectedVoucher.cbsPostedAt).toLocaleString() : 'N/A'} 
                    />
                  </>
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
