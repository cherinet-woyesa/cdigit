/**
 * Manager Approval Dashboard
 * For managers to review and approve/reject pending transactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePermissions } from '@shared/hooks/usePermissions';
import approvalWorkflowService, { type ApprovalWorkflow } from '@services/approvalWorkflowService';
import { CheckCircle, XCircle, Clock, AlertCircle, Filter, Search, ChevronRight, FileText } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import signatureCryptoService, { type SignatureData, type VoucherData } from '@services/signatureCryptoService';
import { useAuth } from '@context/AuthContext';
import type { VoucherStatus } from '@config/rbacMatrix';

const ApprovalDashboard: React.FC = () => {
  const { canApprove, role, can } = usePermissions();
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalWorkflow[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);
  
  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: 'approve' | 'reject'; reason: string } | null>(null);
  const signaturePadRef = useRef<SignatureCanvas | null>(null);

  // Load pending approvals
  useEffect(() => {
    if (canApprove && role) {
      loadPendingApprovals();
    }
  }, [canApprove, role]);

  // Filter approvals
  useEffect(() => {
    let filtered = [...pendingApprovals];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(w => w.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.voucherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.voucherType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredApprovals(filtered);
  }, [pendingApprovals, filterStatus, searchTerm]);

  const loadPendingApprovals = () => {
    if (!role) return;
    setLoading(true);
    const pending = approvalWorkflowService.getPendingApprovalsForRole(role);
    setPendingApprovals(pending);
    setLoading(false);
  };

  const handleApproveClick = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    setPendingAction({ action: 'approve', reason: '' });
    setShowSignatureModal(true);
  };

  const handleRejectClick = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    setPendingAction({ action: 'reject', reason: '' });
    setShowSignatureModal(true);
  };

  const handleSignatureSubmit = async () => {
    if (!selectedWorkflow || !pendingAction || !user) return;
    
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert('Please provide your signature');
      return;
    }

    setProcessingAction(pendingAction.action);

    try {
      // Get signature
      const signatureDataUrl = signaturePadRef.current.toDataURL();
      
      // Create signature data
      const signatureData: SignatureData = {
        signatureDataUrl,
        userId: user.id,
        userRole: user.role,
        timestamp: new Date(),
      };

      // Bind signature to voucher
      const voucherData: VoucherData = {
        voucherId: selectedWorkflow.voucherId,
        voucherType: selectedWorkflow.voucherType,
      };

      const boundSignature = await signatureCryptoService.bindSignatureToVoucher(
        signatureData,
        voucherData,
        'approver'
      );

      // Process approval
      const result = await approvalWorkflowService.processApproval({
        voucherId: selectedWorkflow.voucherId,
        action: pendingAction.action,
        approvedBy: user.id,
        approverRole: role!,
        reason: pendingAction.reason,
        digitalSignature: boundSignature.binding.bindingHash,
        timestamp: new Date(),
      });

      if (result.success) {
        // Reload approvals
        loadPendingApprovals();
        setShowSignatureModal(false);
        setSelectedWorkflow(null);
        setPendingAction(null);
        if (signaturePadRef.current) {
          signaturePadRef.current.clear();
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval');
    } finally {
      setProcessingAction(null);
    }
  };

  if (!canApprove) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">You don't have permission to approve transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transaction Approvals</h1>
        <p className="text-gray-600">Review and approve pending transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingApprovals.filter(w => w.status === 'pending_verification').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingApprovals.filter(w => w.status === 'pending_approval').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-fuchsia-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingApprovals.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-fuchsia-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as VoucherStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="pending_approval">Pending Approval</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by voucher ID or type..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
            />
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading approvals...</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending approvals</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApprovals.map((workflow) => (
              <ApprovalCard
                key={workflow.id}
                workflow={workflow}
                onApprove={() => handleApproveClick(workflow)}
                onReject={() => handleRejectClick(workflow)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureModal && selectedWorkflow && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {pendingAction.action === 'approve' ? 'Approve' : 'Reject'} Transaction
            </h2>

            {/* Workflow Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Voucher ID: <span className="font-mono font-semibold">{selectedWorkflow.voucherId}</span></p>
              <p className="text-sm text-gray-600">Type: <span className="font-semibold">{selectedWorkflow.voucherType}</span></p>
              {selectedWorkflow.approvalReason && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-semibold">Reason:</span> {selectedWorkflow.approvalReason}
                </p>
              )}
            </div>

            {/* Reason Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {pendingAction.action === 'approve' ? 'Approval' : 'Rejection'} Reason
              </label>
              <textarea
                value={pendingAction.reason}
                onChange={(e) => setPendingAction({ ...pendingAction, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                rows={3}
                placeholder={`Enter reason for ${pendingAction.action}...`}
              />
            </div>

            {/* Signature Canvas */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature
              </label>
              <div className="border-2 border-gray-300 rounded-lg p-2 bg-gray-50">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: 'w-full h-40 bg-white border border-gray-200 rounded'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => signaturePadRef.current?.clear()}
                className="mt-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Signature
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setSelectedWorkflow(null);
                  setPendingAction(null);
                  if (signaturePadRef.current) {
                    signaturePadRef.current.clear();
                  }
                }}
                disabled={processingAction !== null}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignatureSubmit}
                disabled={processingAction !== null}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                  pendingAction.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processingAction ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {pendingAction.action === 'approve' ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reject
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Approval Card Component
interface ApprovalCardProps {
  workflow: ApprovalWorkflow;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ workflow, onApprove, onReject }) => {
  const getStatusBadge = (status: VoucherStatus) => {
    const badges = {
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Verification' },
      pending_approval: { color: 'bg-orange-100 text-orange-800', label: 'Pending Approval' },
      verified: { color: 'bg-blue-100 text-blue-800', label: 'Verified' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    };

    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{workflow.voucherType}</h3>
            {getStatusBadge(workflow.status)}
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <span className="font-medium">Voucher ID:</span>{' '}
            <span className="font-mono">{workflow.voucherId}</span>
          </p>
          {workflow.approvalReason && (
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Reason:</span> {workflow.approvalReason}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Created: {new Date(workflow.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={onReject}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
