/**
 * Test Data Generator for Approval Workflows
 * Creates sample high-value transactions to test the Manager Approval Dashboard
 */

import approvalWorkflowService from '../services/approvalWorkflowService';
import type { UserRole } from '../config/rbacMatrix';

export interface SampleTransaction {
  id: string;
  type: 'withdrawal' | 'deposit' | 'transfer' | 'rtgs';
  amount: number;
  currency: string;
  customerName: string;
  accountNumber: string;
  description: string;
}

/**
 * Sample high-value transactions that will trigger approval workflows
 */
export const sampleHighValueTransactions: SampleTransaction[] = [
  {
    id: 'TXN001',
    type: 'withdrawal',
    amount: 750000, // 750K ETB - exceeds 500K threshold
    currency: 'ETB',
    customerName: 'Abebe Kebede',
    accountNumber: '1000123456789',
    description: 'High-value cash withdrawal',
  },
  {
    id: 'TXN002',
    type: 'withdrawal',
    amount: 1500000, // 1.5M ETB
    currency: 'ETB',
    customerName: 'Marta Tadesse',
    accountNumber: '2000987654321',
    description: 'Large cash withdrawal for business',
  },
  {
    id: 'TXN003',
    type: 'deposit',
    amount: 2000000, // 2M ETB - exceeds 1M threshold
    currency: 'ETB',
    customerName: 'Solomon Haile',
    accountNumber: '1000555666777',
    description: 'Large deposit from business revenue',
  },
  {
    id: 'TXN004',
    type: 'withdrawal',
    amount: 8000, // $8,000 USD - exceeds $5K FX threshold
    currency: 'USD',
    customerName: 'Hanna Yohannes',
    accountNumber: '3000111222333',
    description: 'Foreign exchange withdrawal',
  },
  {
    id: 'TXN005',
    type: 'rtgs',
    amount: 75000000, // 75M ETB - exceeds 50M threshold
    currency: 'ETB',
    customerName: 'Ethiopian Trading Corp',
    accountNumber: '4000999888777',
    description: 'RTGS transfer for supplier payment',
  },
  {
    id: 'TXN006',
    type: 'transfer',
    amount: 5500000, // 5.5M ETB - corporate transfer
    currency: 'ETB',
    customerName: 'Addis Manufacturing Ltd',
    accountNumber: '1000444333222',
    description: 'Inter-account transfer for payroll',
  },
];

/**
 * Generate sample approval workflows for testing
 */
export const generateSampleWorkflows = async (makerId: string = 'MAKER001', makerRole: UserRole = 'Maker') => {
  const createdWorkflows = [];

  for (const transaction of sampleHighValueTransactions) {
    try {
      const workflow = await approvalWorkflowService.createWorkflow({
        voucherId: transaction.id,
        voucherType: transaction.type,
        transactionType: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        customerSegment: transaction.amount > 5000000 ? 'corporate' : 'normal',
        requestedBy: makerId,
        requestedByRole: makerRole,
        reason: transaction.description,
        voucherData: {
          voucherId: transaction.id,
          voucherType: transaction.type,
          accountNumber: transaction.accountNumber,
          amount: transaction.amount,
          currency: transaction.currency,
          customerName: transaction.customerName,
          description: transaction.description,
        },
      });

      createdWorkflows.push(workflow);
      console.log(`✅ Created workflow for ${transaction.type} of ${transaction.currency} ${transaction.amount.toLocaleString()}`);
    } catch (error) {
      console.error(`❌ Failed to create workflow for ${transaction.id}:`, error);
    }
  }

  return createdWorkflows;
};

/**
 * Clear all test workflows
 */
export const clearSampleWorkflows = () => {
  // This would clear workflows from localStorage
  localStorage.removeItem('approval_workflows');
  console.log('🗑️ Cleared all sample workflows');
};

/**
 * Get approval statistics
 */
export const getApprovalStats = () => {
  const stats = approvalWorkflowService.getApprovalStatistics();
  
  console.log('📊 Approval Workflow Statistics:');
  console.log(`Total Workflows: ${stats.total}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Approved: ${stats.approved}`);
  console.log(`Rejected: ${stats.rejected}`);
  console.log(`\nBy Type:`, stats.byType);
  console.log(`By Approver:`, stats.byApprover);
  console.log(`Average Approval Time: ${(stats.avgApprovalTime / 1000 / 60).toFixed(2)} minutes`);
  
  return stats;
};

/**
 * Quick test function - run this in browser console
 */
export const runApprovalTest = async () => {
  console.log('🧪 Starting Approval Workflow Test...\n');
  
  // Clear existing workflows
  clearSampleWorkflows();
  
  // Generate sample workflows
  console.log('📝 Generating sample high-value transactions...');
  const workflows = await generateSampleWorkflows();
  
  console.log(`\n✅ Created ${workflows.length} sample workflows\n`);
  
  // Show statistics
  getApprovalStats();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Login as Manager');
  console.log('2. Navigate to Manager Dashboard');
  console.log('3. Click "✅ Approvals" tab');
  console.log('4. You should see all pending approvals');
  console.log('5. Try approving/rejecting transactions with signature\n');
  
  return workflows;
};

// Make available in window for easy console access
if (typeof window !== 'undefined') {
  (window as any).testApprovalWorkflows = {
    generate: generateSampleWorkflows,
    clear: clearSampleWorkflows,
    stats: getApprovalStats,
    run: runApprovalTest,
    samples: sampleHighValueTransactions,
  };
}
