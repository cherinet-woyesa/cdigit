# 🧪 Testing Guide - Authentication & Authorization Features

## Quick Wins Implementation Status

### ✅ Completed Integrations

1. **TellerSignature in CurrentCustomerModal** ✅
   - Location: `src/features/maker/CurrentCustomerModal.tsx`
   - Features: Signature capture, cryptographic binding, approval workflow integration
   - Status: Fully integrated and ready to test

2. **Approval Workflow Integration** ✅
   - Location: `src/features/maker/CurrentCustomerModal.tsx`
   - Features: Automatic workflow creation, approval detection, manager notification
   - Status: Fully integrated and ready to test

3. **Manager Approval Dashboard** ✅
   - Location: `src/features/manager/ApprovalDashboard.tsx`
   - Features: View pending, approve/reject with signature, real-time stats
   - Status: Added to Manager Dashboard "Approvals" tab

---

## 🎯 Test Scenario 1: Teller Signature Integration

### Prerequisites
- Login as **Maker** (Teller)
- Have access to assigned window
- At least one customer in queue

### Steps to Test

1. **Access Maker Dashboard**
   ```
   1. Navigate to /maker-dashboard
   2. Ensure you're assigned to a window
   3. Click "Call Next" to get a customer
   ```

2. **Process Transaction with Teller Signature**
   ```
   1. Customer modal opens with transaction details
   2. Scroll down to "Teller Authorization Signature" section
   3. Sign using mouse/stylus in the signature canvas
   4. Click "Bind Signature" button
   5. Verify "Signature Bound ✓" appears
   6. Check console for cryptographic hashes:
      - signatureHash: [16 chars]...
      - voucherHash: [16 chars]...
      - bindingHash: [16 chars]...
   ```

3. **Complete Transaction**
   ```
   1. "Complete" button should now be enabled (green)
   2. Click "Complete"
   3. If high-value transaction:
      - Orange "Approval Required" message appears
      - Shows approval reason
      - Transaction queued for manager approval
   4. If normal transaction:
      - Transaction completes normally
   ```

### Expected Results
- ✅ Signature canvas appears and is functional
- ✅ Signature binding creates cryptographic hashes
- ✅ Complete button disabled until signature is bound
- ✅ Approval workflow created for high-value transactions
- ✅ Approval message displays when applicable

### Console Commands for Verification
```javascript
// Check authorization audit logs
import authorizationAuditService from './src/services/authorizationAuditService';

// View signature binding logs
const sigLogs = authorizationAuditService.getSignatureBindingLogs();
console.log('Signature Bindings:', sigLogs);

// View approval logs
const approvalLogs = authorizationAuditService.getApprovalLogs();
console.log('Approval Actions:', approvalLogs);
```

---

## 🎯 Test Scenario 2: High-Value Transaction Approval

### Prerequisites
- Test data generator available
- Login credentials for Manager role

### Steps to Test

1. **Generate Sample High-Value Transactions**
   ```javascript
   // Open browser console (F12)
   
   // Method 1: Use test utility
   window.testApprovalWorkflows.run();
   
   // This will create 6 sample transactions:
   // - 750K ETB withdrawal (exceeds 500K threshold)
   // - 1.5M ETB withdrawal
   // - 2M ETB deposit (exceeds 1M threshold)
   // - $8K USD withdrawal (exceeds $5K FX threshold)
   // - 75M ETB RTGS (exceeds 50M threshold)
   // - 5.5M ETB corporate transfer
   ```

2. **View Sample Transactions**
   ```javascript
   // Check generated workflows
   window.testApprovalWorkflows.stats();
   
   // Expected output:
   // Total Workflows: 6
   // Pending: 6
   // Approved: 0
   // Rejected: 0
   ```

3. **Login as Manager and Review**
   ```
   1. Logout from current session
   2. Login as Manager
   3. Navigate to Manager Dashboard
   4. Click "✅ Approvals" tab
   ```

4. **Verify Approval Dashboard**
   ```
   Expected to see:
   - Pending Verification: 6
   - Pending Approval: 0
   - Total Pending: 6
   
   Each transaction card shows:
   - Transaction type (withdrawal, deposit, transfer, rtgs)
   - Voucher ID (TXN001 - TXN006)
   - Approval reason (e.g., "withdrawal amount exceeds normal customer limit")
   - Created timestamp
   - Approve/Reject buttons
   ```

5. **Approve a Transaction**
   ```
   1. Click "Approve" on any transaction
   2. Modal opens with:
      - Transaction details
      - Reason input field
      - Signature canvas
   3. Enter approval reason (e.g., "Verified with customer")
   4. Sign in the canvas
   5. Click "Approve"
   6. Transaction status changes to "Approved"
   7. Disappears from pending list
   ```

6. **Reject a Transaction**
   ```
   1. Click "Reject" on any transaction
   2. Modal opens
   3. Enter rejection reason (e.g., "Insufficient documentation")
   4. Sign in the canvas
   5. Click "Reject"
   6. Transaction status changes to "Rejected"
   7. Disappears from pending list
   ```

### Expected Results
- ✅ All 6 sample transactions appear in approval dashboard
- ✅ Statistics cards show correct counts
- ✅ Filter and search work correctly
- ✅ Approve/Reject modals function properly
- ✅ Digital signatures are captured and bound
- ✅ Approval actions are logged to audit trail

---

## 🎯 Test Scenario 3: Approval Thresholds

### Threshold Testing Matrix

| Transaction Type | Normal Customer | Corporate Customer | Test Amount | Expected Result |
|------------------|----------------|-------------------|-------------|-----------------|
| Withdrawal | 500,000 ETB | 5,000,000 ETB | 600,000 ETB | ✅ Requires Approval |
| Withdrawal | 500,000 ETB | 5,000,000 ETB | 400,000 ETB | ❌ No Approval |
| Deposit | 1,000,000 ETB | 10,000,000 ETB | 1,500,000 ETB | ✅ Requires Approval |
| Deposit | 1,000,000 ETB | 10,000,000 ETB | 800,000 ETB | ❌ No Approval |
| FX (USD) | $5,000 | $5,000 | $6,000 | ✅ Requires FX Approval |
| FX (EUR) | €4,500 | €4,500 | €5,000 | ✅ Requires FX Approval |
| RTGS | 50,000,000 ETB | 100,000,000 ETB | 60,000,000 ETB | ✅ Requires Approval |

### Steps to Test Each Threshold

```javascript
// Test withdrawal threshold
import { requiresTransactionApproval } from './src/config/rbacMatrix';

// Normal customer - 600K ETB withdrawal
const check1 = requiresTransactionApproval('withdrawal', 600000, 'ETB', 'normal');
console.log('600K Withdrawal:', check1);
// Expected: { required: true, reason: "withdrawal amount exceeds normal customer limit..." }

// Normal customer - 400K ETB withdrawal
const check2 = requiresTransactionApproval('withdrawal', 400000, 'ETB', 'normal');
console.log('400K Withdrawal:', check2);
// Expected: { required: false }

// FX transaction - $6K USD
const check3 = requiresTransactionApproval('withdrawal', 6000, 'USD', 'normal');
console.log('$6K USD:', check3);
// Expected: { required: true, reason: "Foreign exchange amount exceeds USD 5000 threshold" }
```

---

## 🎯 Test Scenario 4: Permission-Based Access Control

### Role Permission Testing

#### Customer Role
```
Expected Access:
✅ /dashboard
✅ /form/cash-deposit
✅ /form/cash-withdrawal
✅ /form/fund-transfer

Expected Denial:
❌ /maker-dashboard
❌ /manager-dashboard
❌ /admin-dashboard
```

#### Maker Role
```
Expected Access:
✅ /maker-dashboard
✅ Process transactions
✅ Verify vouchers

Expected Denial:
❌ /manager-dashboard (cannot approve)
❌ /admin-dashboard
❌ High-value approvals
```

#### Manager Role
```
Expected Access:
✅ /manager-dashboard
✅ /manager-dashboard (Approvals tab)
✅ Approve/reject transactions
✅ View audit logs

Expected Denial:
❌ /admin-dashboard (system config)
```

### Testing Steps

1. **Test Customer Access**
   ```
   1. Login as Customer
   2. Try to access /manager-dashboard
   3. Expected: "Access Denied" page with clear message
   4. Click "Go Back" or "Go to Dashboard"
   ```

2. **Test Maker Access**
   ```
   1. Login as Maker
   2. Navigate to Maker Dashboard
   3. Try to access Manager Approval Dashboard
   4. Expected: Access denied or no approval functionality visible
   ```

3. **Test Manager Access**
   ```
   1. Login as Manager
   2. Navigate to Manager Dashboard
   3. Click "Approvals" tab
   4. Expected: Full access to approval dashboard
   ```

---

## 🎯 Test Scenario 5: Audit Trail Verification

### Steps to Test

1. **Generate Test Activity**
   ```javascript
   // In browser console
   
   // 1. Generate sample workflows
   window.testApprovalWorkflows.run();
   
   // 2. Perform various actions:
   // - Try to access restricted pages
   // - Approve/reject transactions
   // - Bind signatures
   ```

2. **View Authentication Logs**
   ```javascript
   import authorizationAuditService from './src/services/authorizationAuditService';
   
   const authLogs = authorizationAuditService.getAuthenticationLogs();
   console.table(authLogs);
   
   // Expected fields:
   // - timestamp
   // - userId
   // - authenticationType (OTP, PIN, PASSWORD)
   // - success (true/false)
   // - failureReason (if failed)
   ```

3. **View Authorization Logs**
   ```javascript
   const authzLogs = authorizationAuditService.getAuthorizationLogs();
   console.table(authzLogs);
   
   // Expected fields:
   // - timestamp
   // - userId
   // - userRole
   // - action
   // - resource
   // - permission
   // - granted (true/false)
   // - denialReason (if denied)
   ```

4. **View Approval Logs**
   ```javascript
   const approvalLogs = authorizationAuditService.getApprovalLogs();
   console.table(approvalLogs);
   
   // Expected fields:
   // - timestamp
   // - approverId
   // - approverRole
   // - voucherId
   // - action (approve/reject/verify)
   // - reason
   // - digitalSignature (hash)
   ```

5. **View Signature Binding Logs**
   ```javascript
   const sigLogs = authorizationAuditService.getSignatureBindingLogs();
   console.table(sigLogs);
   
   // Expected fields:
   // - timestamp
   // - voucherId
   // - signatureType (customer/teller/approver)
   // - userId
   // - signatureHash
   // - voucherHash
   // - bindingHash
   // - verified (true/false)
   ```

6. **Export Audit Logs**
   ```javascript
   // Export as JSON
   const jsonExport = authorizationAuditService.exportLogs('json');
   console.log(jsonExport);
   
   // Export as CSV
   const csvExport = authorizationAuditService.exportLogs('csv');
   console.log(csvExport);
   
   // Save to file
   const blob = new Blob([csvExport], { type: 'text/csv' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'audit_logs_' + new Date().toISOString() + '.csv';
   a.click();
   ```

7. **View Analytics**
   ```javascript
   const analytics = authorizationAuditService.getAnalytics();
   console.log('Audit Analytics:', analytics);
   
   // Expected output:
   // {
   //   totalAuthAttempts: number,
   //   successfulAuths: number,
   //   failedAuths: number,
   //   successRate: percentage,
   //   authByType: { OTP: n, PIN: n, PASSWORD: n },
   //   totalAuthzChecks: number,
   //   grantedAuthz: number,
   //   deniedAuthz: number,
   //   commonDenials: [...],
   //   totalApprovals: number,
   //   approvedCount: number,
   //   rejectedCount: number
   // }
   ```

---

## 🧹 Test Cleanup

### Clear Test Data

```javascript
// Clear all sample workflows
window.testApprovalWorkflows.clear();

// Clear audit logs (use with caution!)
// This should only be done in development
import authorizationAuditService from './src/services/authorizationAuditService';
authorizationAuditService.clearLogs();

// Clear localStorage (nuclear option)
localStorage.clear();
```

---

## ✅ Test Checklist

### Teller Signature Integration
- [ ] Signature canvas appears in CurrentCustomerModal
- [ ] Can draw signature with mouse/stylus
- [ ] "Clear" button works
- [ ] "Bind Signature" button creates cryptographic binding
- [ ] Console shows signature/voucher/binding hashes
- [ ] Complete button disabled until signature bound
- [ ] Complete button enabled after signature bound

### Approval Workflow
- [ ] High-value transactions trigger approval workflow
- [ ] Approval message displays with reason
- [ ] Workflow status tracked correctly
- [ ] Pending approvals visible to manager
- [ ] Low-value transactions complete without approval

### Manager Approval Dashboard
- [ ] Accessible only to Manager/Admin roles
- [ ] Shows all pending approvals
- [ ] Statistics cards show correct counts
- [ ] Filter by status works
- [ ] Search by voucher ID works
- [ ] Approve modal opens correctly
- [ ] Reject modal opens correctly
- [ ] Signature canvas in approve/reject modal works
- [ ] Approval/rejection processes successfully
- [ ] Approved/rejected items removed from pending list

### Permission System
- [ ] Customer cannot access staff routes
- [ ] Maker cannot access manager routes
- [ ] Manager can access approval dashboard
- [ ] Access denied page displays correctly
- [ ] Permission checks logged to audit

### Audit Trail
- [ ] Authentication attempts logged
- [ ] Authorization checks logged
- [ ] Approval actions logged
- [ ] Signature bindings logged
- [ ] Export to JSON works
- [ ] Export to CSV works
- [ ] Analytics calculated correctly

---

## 🐛 Known Issues & Troubleshooting

### Issue: Signature canvas not showing
**Solution:** Ensure react-signature-canvas is installed
```bash
npm install react-signature-canvas
npm install @types/react-signature-canvas --save-dev
```

### Issue: "Cannot find module" errors
**Solution:** Verify import paths are correct
```typescript
// Correct imports:
import TellerSignature from '../../components/TellerSignature';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';
import approvalWorkflowService from '../../services/approvalWorkflowService';
```

### Issue: Complete button always disabled
**Solution:** Check tellerBoundSignature state
```typescript
// In component:
console.log('Teller Signature Bound:', tellerBoundSignature);
```

### Issue: Approval dashboard empty
**Solution:** Generate test data
```javascript
window.testApprovalWorkflows.run();
```

### Issue: Permission denied unexpectedly
**Solution:** Check user role and permissions
```typescript
import { usePermissions } from '../hooks/usePermissions';
const { role, permissions } = usePermissions();
console.log('Role:', role);
console.log('Permissions:', permissions);
```

---

## 📊 Success Metrics

After testing, verify:
- ✅ 100% of high-value transactions trigger approval
- ✅ 0% of low-value transactions stuck in approval
- ✅ All teller transactions have cryptographic signatures
- ✅ All approval actions have audit trail
- ✅ Manager can approve/reject within 2 clicks
- ✅ No unauthorized access to protected routes

---

## 🎉 Test Complete!

If all checkboxes are marked, the integration is successful and production-ready! 🚀
