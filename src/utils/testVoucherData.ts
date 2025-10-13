/**
 * Test Voucher Data Generator
 * 
 * Generates sample vouchers for testing the Voucher Dashboard
 * with various statuses, amounts, and scenarios.
 */

import type { Voucher, VoucherStatus } from '../features/maker/VoucherDashboard';

export const sampleVouchers: Voucher[] = [
  // High-value withdrawal - requires approval
  {
    formReferenceId: 'VCH001-2024-001',
    customerName: 'Abebe Kebede',
    customerId: 'ID-12345678',
    accountNumber: '1000123456789',
    transactionType: 'withdrawal',
    amount: 750000,
    currency: 'ETB',
    status: 'pending_approval',
    createdAt: new Date('2024-01-15T09:30:00'),
    updatedAt: new Date('2024-01-15T09:35:00'),
    createdBy: 'maker001',
    workflowId: 'workflow_001',
    requiresApproval: true,
    isException: false,
  },
  
  // Normal deposit - approved and posted
  {
    formReferenceId: 'VCH001-2024-002',
    customerName: 'Tigist Haile',
    customerId: 'ID-87654321',
    accountNumber: '1000987654321',
    transactionType: 'deposit',
    amount: 50000,
    currency: 'ETB',
    status: 'posted',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:05:00'),
    createdBy: 'maker001',
    workflowId: 'workflow_002',
    requiresApproval: false,
    isException: false,
    cbsPostingId: 'CBS_1705315500_abc123',
    cbsPostedAt: new Date('2024-01-15T10:05:00'),
  },
  
  // FX transaction exceeding threshold - requires approval
  {
    formReferenceId: 'VCH001-2024-003',
    customerName: 'Mulu Tesfaye',
    customerId: 'ID-11223344',
    accountNumber: '1000112233445',
    transactionType: 'fx',
    amount: 8000,
    currency: 'USD',
    status: 'pending_approval',
    createdAt: new Date('2024-01-15T11:00:00'),
    updatedAt: new Date('2024-01-15T11:02:00'),
    createdBy: 'maker002',
    workflowId: 'workflow_003',
    requiresApproval: true,
    isException: false,
  },
  
  // Rejected transaction - exception
  {
    formReferenceId: 'VCH001-2024-004',
    customerName: 'Yohannes Bekele',
    customerId: 'ID-99887766',
    accountNumber: '1000998877665',
    transactionType: 'withdrawal',
    amount: 1500000,
    currency: 'ETB',
    status: 'rejected',
    createdAt: new Date('2024-01-15T12:00:00'),
    updatedAt: new Date('2024-01-15T12:10:00'),
    createdBy: 'maker001',
    lastModifiedBy: 'manager001',
    workflowId: 'workflow_004',
    requiresApproval: true,
    isException: true,
    exceptionReason: 'Insufficient documentation provided',
  },
  
  // RTGS - high value, requires approval
  {
    formReferenceId: 'VCH001-2024-005',
    customerName: 'Selam Alemu',
    customerId: 'ID-55443322',
    accountNumber: '1000554433221',
    transactionType: 'rtgs',
    amount: 75000000,
    currency: 'ETB',
    status: 'pending_approval',
    createdAt: new Date('2024-01-15T13:00:00'),
    updatedAt: new Date('2024-01-15T13:05:00'),
    createdBy: 'maker003',
    workflowId: 'workflow_005',
    requiresApproval: true,
    isException: false,
  },
  
  // Pending verification
  {
    formReferenceId: 'VCH001-2024-006',
    customerName: 'Dawit Girma',
    customerId: 'ID-66778899',
    accountNumber: '1000667788990',
    transactionType: 'deposit',
    amount: 2500000,
    currency: 'ETB',
    status: 'pending_verification',
    createdAt: new Date('2024-01-15T14:00:00'),
    updatedAt: new Date('2024-01-15T14:01:00'),
    createdBy: 'maker002',
    workflowId: 'workflow_006',
    requiresApproval: true,
    isException: false,
  },
  
  // Draft - not yet submitted
  {
    formReferenceId: 'VCH001-2024-007',
    customerName: 'Hana Tadesse',
    customerId: 'ID-33221100',
    accountNumber: '1000332211009',
    transactionType: 'withdrawal',
    amount: 25000,
    currency: 'ETB',
    status: 'draft',
    createdAt: new Date('2024-01-15T14:30:00'),
    updatedAt: new Date('2024-01-15T14:30:00'),
    createdBy: 'maker001',
    requiresApproval: false,
    isException: false,
  },
  
  // Completed
  {
    formReferenceId: 'VCH001-2024-008',
    customerName: 'Biniam Mengistu',
    customerId: 'ID-44556677',
    accountNumber: '1000445566778',
    transactionType: 'transfer',
    amount: 100000,
    currency: 'ETB',
    status: 'completed',
    createdAt: new Date('2024-01-15T08:00:00'),
    updatedAt: new Date('2024-01-15T08:15:00'),
    createdBy: 'maker003',
    workflowId: 'workflow_008',
    requiresApproval: false,
    isException: false,
    cbsPostingId: 'CBS_1705308900_xyz789',
    cbsPostedAt: new Date('2024-01-15T08:15:00'),
  },
  
  // Exception - escalated
  {
    formReferenceId: 'VCH001-2024-009',
    customerName: 'Kidist Solomon',
    customerId: 'ID-77889900',
    accountNumber: '1000778899001',
    transactionType: 'fx',
    amount: 15000,
    currency: 'EUR',
    status: 'exception',
    createdAt: new Date('2024-01-15T15:00:00'),
    updatedAt: new Date('2024-01-15T15:10:00'),
    createdBy: 'maker002',
    lastModifiedBy: 'manager001',
    workflowId: 'workflow_009',
    requiresApproval: true,
    isException: true,
    exceptionReason: 'Escalated to branch manager - exceeds FX limit',
  },
  
  // Validated - ready for approval
  {
    formReferenceId: 'VCH001-2024-010',
    customerName: 'Getachew Asefa',
    customerId: 'ID-22334455',
    accountNumber: '1000223344556',
    transactionType: 'withdrawal',
    amount: 600000,
    currency: 'ETB',
    status: 'validated',
    createdAt: new Date('2024-01-15T15:30:00'),
    updatedAt: new Date('2024-01-15T15:32:00'),
    createdBy: 'maker001',
    workflowId: 'workflow_010',
    requiresApproval: true,
    isException: false,
  },
  
  // Corporate withdrawal - high value
  {
    formReferenceId: 'VCH001-2024-011',
    customerName: 'Ethiopian Airlines S.C.',
    customerId: 'CORP-00001',
    accountNumber: '1000111222333',
    transactionType: 'withdrawal',
    amount: 8000000,
    currency: 'ETB',
    status: 'pending_approval',
    createdAt: new Date('2024-01-15T16:00:00'),
    updatedAt: new Date('2024-01-15T16:05:00'),
    createdBy: 'maker003',
    workflowId: 'workflow_011',
    requiresApproval: true,
    isException: false,
  },
  
  // Recently posted
  {
    formReferenceId: 'VCH001-2024-012',
    customerName: 'Sara Michael',
    customerId: 'ID-99001122',
    accountNumber: '1000990011223',
    transactionType: 'deposit',
    amount: 150000,
    currency: 'ETB',
    status: 'posted',
    createdAt: new Date('2024-01-15T16:30:00'),
    updatedAt: new Date('2024-01-15T16:35:00'),
    createdBy: 'maker002',
    workflowId: 'workflow_012',
    requiresApproval: false,
    isException: false,
    cbsPostingId: 'CBS_1705339500_def456',
    cbsPostedAt: new Date('2024-01-15T16:35:00'),
  },
];

/**
 * Generate vouchers and save to localStorage
 */
export const generateTestVouchers = (): void => {
  localStorage.setItem('vouchers', JSON.stringify(sampleVouchers));
  console.log('✅ Test vouchers generated:', sampleVouchers.length);
  console.log('Sample vouchers:', {
    total: sampleVouchers.length,
    pending: sampleVouchers.filter(v => v.status === 'pending_verification' || v.status === 'pending_approval' || v.status === 'validated').length,
    approved: sampleVouchers.filter(v => v.status === 'approved' || v.status === 'posted' || v.status === 'completed').length,
    exceptions: sampleVouchers.filter(v => v.isException).length,
    needsApproval: sampleVouchers.filter(v => v.requiresApproval && v.status === 'pending_approval').length,
  });
};

/**
 * Clear test vouchers
 */
export const clearTestVouchers = (): void => {
  localStorage.removeItem('vouchers');
  console.log('🗑️ Test vouchers cleared');
};

/**
 * Get voucher statistics
 */
export const getVoucherStats = () => {
  const vouchersJson = localStorage.getItem('vouchers');
  if (!vouchersJson) {
    return { total: 0, pending: 0, approved: 0, exceptions: 0, needsApproval: 0 };
  }
  
  const vouchers: Voucher[] = JSON.parse(vouchersJson);
  
  return {
    total: vouchers.length,
    pending: vouchers.filter(v => 
      v.status === 'pending_verification' || 
      v.status === 'pending_approval' ||
      v.status === 'validated'
    ).length,
    approved: vouchers.filter(v => 
      v.status === 'approved' || 
      v.status === 'posted' || 
      v.status === 'completed'
    ).length,
    exceptions: vouchers.filter(v => v.isException).length,
    needsApproval: vouchers.filter(v => 
      v.requiresApproval && v.status === 'pending_approval'
    ).length,
    byStatus: {
      draft: vouchers.filter(v => v.status === 'draft').length,
      initiated: vouchers.filter(v => v.status === 'initiated').length,
      pending_verification: vouchers.filter(v => v.status === 'pending_verification').length,
      verified: vouchers.filter(v => v.status === 'verified').length,
      validated: vouchers.filter(v => v.status === 'validated').length,
      pending_approval: vouchers.filter(v => v.status === 'pending_approval').length,
      approved: vouchers.filter(v => v.status === 'approved').length,
      posted: vouchers.filter(v => v.status === 'posted').length,
      completed: vouchers.filter(v => v.status === 'completed').length,
      rejected: vouchers.filter(v => v.status === 'rejected').length,
      exception: vouchers.filter(v => v.status === 'exception').length,
    },
  };
};

/**
 * Add a single test voucher
 */
export const addTestVoucher = (voucher: Partial<Voucher>): Voucher => {
  const vouchersJson = localStorage.getItem('vouchers');
  const vouchers: Voucher[] = vouchersJson ? JSON.parse(vouchersJson) : [];
  
  const newVoucher: Voucher = {
    formReferenceId: voucher.formReferenceId || `VCH001-2024-${String(vouchers.length + 1).padStart(3, '0')}`,
    customerName: voucher.customerName || 'Test Customer',
    customerId: voucher.customerId || `ID-${Math.random().toString().substr(2, 8)}`,
    accountNumber: voucher.accountNumber || `1000${Math.random().toString().substr(2, 9)}`,
    transactionType: voucher.transactionType || 'deposit',
    amount: voucher.amount || 10000,
    currency: voucher.currency || 'ETB',
    status: voucher.status || 'draft',
    createdAt: voucher.createdAt || new Date(),
    updatedAt: voucher.updatedAt || new Date(),
    createdBy: voucher.createdBy || 'test_maker',
    requiresApproval: voucher.requiresApproval || false,
    isException: voucher.isException || false,
    ...voucher,
  };
  
  vouchers.push(newVoucher);
  localStorage.setItem('vouchers', JSON.stringify(vouchers));
  console.log('✅ Test voucher added:', newVoucher.formReferenceId);
  
  return newVoucher;
};

// Expose utilities to window for console testing
declare global {
  interface Window {
    testVouchers: {
      generate: () => void;
      clear: () => void;
      stats: () => any;
      add: (voucher: Partial<Voucher>) => Voucher;
      sampleData: Voucher[];
    };
  }
}

if (typeof window !== 'undefined') {
  window.testVouchers = {
    generate: generateTestVouchers,
    clear: clearTestVouchers,
    stats: getVoucherStats,
    add: addTestVoucher,
    sampleData: sampleVouchers,
  };
}

export default {
  generate: generateTestVouchers,
  clear: clearTestVouchers,
  stats: getVoucherStats,
  add: addTestVoucher,
  sampleData: sampleVouchers,
};
