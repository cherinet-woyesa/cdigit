# Section 3.4 Teller Dashboard & Processing - Quick Test Guide

## 🚀 Quick Start

### Step 1: Generate Test Vouchers
Open browser console and run:
```javascript
// Import test utilities (already exposed on window)
window.testVouchers.generate();

// Verify generation
window.testVouchers.stats();
```

**Expected Output**:
```javascript
{
  total: 12,
  pending: 4,
  approved: 3,
  exceptions: 2,
  needsApproval: 5,
  byStatus: {
    draft: 1,
    pending_verification: 1,
    validated: 1,
    pending_approval: 5,
    posted: 2,
    completed: 1,
    rejected: 1,
    exception: 1
  }
}
```

---

## 🧪 Test Scenarios

### Test 1: View Voucher Dashboard ✅

**Steps**:
1. Login as Maker/Teller
2. Click "Voucher Dashboard" in sidebar
3. Observe the dashboard

**Expected Results**:
- ✅ Statistics cards show: Total (12), Pending (4), Approved (3), Exceptions (2), Needs Approval (5)
- ✅ Table displays 12 vouchers
- ✅ Each row shows: Reference #, Customer Name, ID, Account, Type, Amount, Status, Updated
- ✅ Action buttons visible based on permissions

**Screenshot Checklist**:
- [ ] Statistics cards are color-coded
- [ ] Status badges are visible
- [ ] Exception rows have red background (VCH001-2024-004, VCH001-2024-009)
- [ ] Approval rows have purple background (VCH001-2024-001, VCH001-2024-003, etc.)

---

### Test 2: Filter Vouchers ✅

**2a. Filter by Status**
```javascript
// In UI: Select "Pending Approval" from status dropdown
```
**Expected**: Shows 5 vouchers (VCH001-2024-001, 003, 005, 010, 011)

**2b. Search by Reference**
```javascript
// In UI: Enter "VCH001-2024-001" in search box
```
**Expected**: Shows only VCH001-2024-001

**2c. Filter Pending Only**
```javascript
// In UI: Check "Pending Only" checkbox
```
**Expected**: Shows 4 vouchers (pending_verification, validated, pending_approval)

**2d. Filter Exceptions Only**
```javascript
// In UI: Check "Exceptions Only" checkbox
```
**Expected**: Shows 2 vouchers (VCH001-2024-004, VCH001-2024-009)

---

### Test 3: View Voucher Details ✅

**Steps**:
1. Click 👁️ icon on any voucher (e.g., VCH001-2024-001)
2. Detail modal opens

**Expected Results**:
- ✅ Modal shows complete voucher information:
  - Voucher Reference: VCH001-2024-001
  - Status: Pending Approval
  - Customer Name: Abebe Kebede
  - Customer ID: ID-12345678
  - Account Number: 1000123456789
  - Transaction Type: withdrawal
  - Amount: ETB 750,000
  - Created At: timestamp
  - Updated At: timestamp
  - Created By: maker001
  - Workflow ID: workflow_001
  - Requires Approval: Yes
  - Is Exception: No

**Verify**:
- [ ] All fields populated
- [ ] Timestamps formatted correctly
- [ ] Close button works

---

### Test 4: Approve Voucher (As Manager) ✅

**Prerequisites**: 
- Login as Manager
- Ensure permission `voucher.approve` is granted

**Steps**:
1. Navigate to Voucher Dashboard
2. Find voucher VCH001-2024-001 (status: pending_approval)
3. Click ✅ Approve button
4. Signature modal opens
5. Sign in the signature pad
6. Click "Submit"

**Expected Results**:
- ✅ Signature modal opens with voucher details
- ✅ Signature can be drawn on canvas
- ✅ After submit:
  - Voucher status changes to "approved"
  - CBS auto-posting triggered
  - CBS Posting ID generated (format: CBS_{timestamp}_{random})
  - Voucher status changes to "posted"
  - Success message displayed
  - Modal closes
  - Dashboard refreshes

**Console Verification**:
```javascript
// Check audit logs
const auditLogs = window.testApprovalWorkflows.stats();
console.log('Audit logs:', auditLogs);

// Check voucher status
const vouchers = JSON.parse(localStorage.getItem('vouchers'));
const approvedVoucher = vouchers.find(v => v.formReferenceId === 'VCH001-2024-001');
console.log('Approved voucher:', approvedVoucher);
console.log('Status:', approvedVoucher.status); // Should be 'posted'
console.log('CBS ID:', approvedVoucher.cbsPostingId); // Should exist
console.log('CBS Posted At:', approvedVoucher.cbsPostedAt); // Should exist
```

---

### Test 5: Reject Voucher ✅

**Steps**:
1. Find voucher VCH001-2024-005 (RTGS, pending_approval)
2. Click ❌ Reject button
3. Enter rejection reason: "Insufficient documentation"
4. Signature modal opens
5. Sign and submit

**Expected Results**:
- ✅ Rejection reason prompt appears
- ✅ Signature modal opens
- ✅ After submit:
  - Voucher status changes to "rejected"
  - `isException` flag set to `true`
  - `exceptionReason` set to "Insufficient documentation"
  - Voucher row highlighted in red
  - Success message displayed

**Console Verification**:
```javascript
const vouchers = JSON.parse(localStorage.getItem('vouchers'));
const rejectedVoucher = vouchers.find(v => v.formReferenceId === 'VCH001-2024-005');
console.log('Rejected voucher:', rejectedVoucher);
console.log('Status:', rejectedVoucher.status); // Should be 'rejected'
console.log('Is Exception:', rejectedVoucher.isException); // Should be true
console.log('Exception Reason:', rejectedVoucher.exceptionReason); // Should be set
```

---

### Test 6: Forward Voucher ✅

**Steps**:
1. Find voucher VCH001-2024-003 (FX, pending_approval)
2. Click ➡️ Forward button
3. Enter forward target: "Manager"
4. Signature modal opens
5. Sign and submit

**Expected Results**:
- ✅ Forward target prompt appears
- ✅ Signature modal opens
- ✅ After submit:
  - Workflow escalated
  - Audit log created with action: "forward"
  - Success message displayed

---

### Test 7: Edit Voucher ✅

**Steps**:
1. Find voucher VCH001-2024-007 (status: draft)
2. Click ✏️ Edit button

**Expected Results**:
- ✅ Edit action triggered
- ✅ Alert message shown: "Edit voucher: VCH001-2024-007 (Edit functionality to be implemented)"

**Note**: Full edit functionality to be implemented in future enhancement.

---

### Test 8: Auto-Refresh ⏱️

**Steps**:
1. Open Voucher Dashboard
2. Wait for 5 seconds
3. Observe the dashboard

**Expected Results**:
- ✅ Dashboard auto-refreshes every 5 seconds
- ✅ New vouchers appear automatically
- ✅ Status changes reflect immediately

**Verification**:
```javascript
// Add a new voucher in console
window.testVouchers.add({
  customerName: 'Auto Refresh Test',
  transactionType: 'deposit',
  amount: 50000,
  status: 'pending_verification'
});

// Wait 5 seconds and check if it appears in the dashboard
```

---

### Test 9: CBS Auto-Posting 🏦

**Steps**:
1. Approve voucher VCH001-2024-010 (validated status)
2. Observe CBS auto-posting

**Expected Results**:
- ✅ CBS posting triggered immediately after approval
- ✅ CBS Posting ID generated
- ✅ Voucher status changes to "posted"
- ✅ `cbsPostedAt` timestamp recorded
- ✅ Audit log contains "post_to_cbs" action

**Console Verification**:
```javascript
// Check CBS posting
const vouchers = JSON.parse(localStorage.getItem('vouchers'));
const postedVoucher = vouchers.find(v => v.formReferenceId === 'VCH001-2024-010');
console.log('CBS Posting ID:', postedVoucher.cbsPostingId);
console.log('Posted At:', postedVoucher.cbsPostedAt);

// Check audit log
const auditLogs = JSON.parse(localStorage.getItem('authorizationAuditLog'));
const cbsLog = auditLogs.approvalLog.find(log => 
  log.voucherId === 'VCH001-2024-010' && log.action === 'post_to_cbs'
);
console.log('CBS Audit Log:', cbsLog);
```

---

### Test 10: Audit Trail 📝

**Steps**:
1. Perform several actions (view, approve, reject)
2. Check audit logs

**Verification**:
```javascript
// Get all audit logs
const auditLogs = JSON.parse(localStorage.getItem('authorizationAuditLog'));

console.log('Authorization Logs:', auditLogs.authorizationLog);
console.log('Approval Logs:', auditLogs.approvalLog);

// Filter by voucher
const voucherLogs = auditLogs.approvalLog.filter(log => 
  log.voucherId === 'VCH001-2024-001'
);
console.log('Logs for VCH001-2024-001:', voucherLogs);
```

**Expected Log Entries**:
- ✅ Each action has: approverId, approverRole, voucherId, action, timestamp
- ✅ Approve action includes: digitalSignature, amount, currency
- ✅ CBS posting includes: approverId: 'CBS_SYSTEM', action: 'post_to_cbs'

---

### Test 11: Exception Highlighting 🚨

**Steps**:
1. Filter by "Exceptions Only"
2. Observe highlighted rows

**Expected Results**:
- ✅ 2 vouchers shown (VCH001-2024-004, VCH001-2024-009)
- ✅ Both rows have red background
- ✅ ⚠️ icon visible with tooltip showing exception reason
- ✅ Status badge shows "Rejected" or "Exception"

**Hover Test**:
- Hover over ⚠️ icon → Tooltip shows exception reason

---

### Test 12: Approval Highlighting 🔒

**Steps**:
1. View dashboard (no filters)
2. Identify vouchers with 🔒 icon

**Expected Results**:
- ✅ 5 vouchers have 🔒 icon (requiresApproval: true)
- ✅ Rows with status "pending_approval" have purple background
- ✅ Tooltip on 🔒 shows "Requires Manager Approval"

---

### Test 13: Statistics Accuracy 📊

**Steps**:
1. View statistics cards at top of dashboard
2. Verify counts

**Expected Values**:
- **Total Vouchers**: 12
- **Pending**: 4 (pending_verification: 1, validated: 1, pending_approval: 2)
- **Approved**: 3 (posted: 2, completed: 1)
- **Exceptions**: 2 (rejected: 1, exception: 1)
- **Needs Approval**: 5 (requiresApproval && pending_approval)

**Verification**:
```javascript
window.testVouchers.stats();
```

---

### Test 14: Permission-Based Actions 🔐

**Test 14a: As Maker (Limited Permissions)**
```javascript
// Login as Maker
// Expected permissions: voucher.view, voucher.edit
```

**Expected**:
- ✅ 👁️ View button visible
- ✅ ✏️ Edit button visible (only on non-posted vouchers)
- ❌ ✅ Approve button hidden
- ❌ ❌ Reject button hidden
- ❌ ➡️ Forward button hidden

**Test 14b: As Manager (Full Permissions)**
```javascript
// Login as Manager
// Expected permissions: All voucher permissions
```

**Expected**:
- ✅ All action buttons visible based on voucher status

---

### Test 15: Responsive Design 📱

**Steps**:
1. Resize browser window to mobile size (375px)
2. Observe layout changes

**Expected Results**:
- ✅ Statistics cards stack vertically
- ✅ Filters stack vertically
- ✅ Table remains scrollable
- ✅ Action buttons stack vertically
- ✅ Modal resizes appropriately

---

## 🎯 Quick Console Commands

### Generate Test Data
```javascript
window.testVouchers.generate();
```

### Check Statistics
```javascript
window.testVouchers.stats();
```

### Add Custom Voucher
```javascript
window.testVouchers.add({
  customerName: 'Custom Test',
  transactionType: 'withdrawal',
  amount: 999000,
  status: 'pending_approval',
  requiresApproval: true
});
```

### Clear All Vouchers
```javascript
window.testVouchers.clear();
```

### View Approval Workflows
```javascript
window.testApprovalWorkflows.stats();
```

### Export Audit Logs (CSV)
```javascript
const auditService = window.authorizationAuditService;
const csvLogs = auditService.exportLogs('csv', 'approval');
console.log(csvLogs);
```

---

## 🐛 Troubleshooting

### Issue: No vouchers displayed
**Solution**:
```javascript
// Regenerate test data
window.testVouchers.generate();
// Refresh page
location.reload();
```

### Issue: Approval workflow not found
**Solution**:
```javascript
// Generate approval workflows
window.testApprovalWorkflows.generate();
```

### Issue: Signature modal not opening
**Solution**:
- Check browser console for errors
- Verify react-signature-canvas is installed
- Ensure permissions are correctly set

### Issue: CBS posting not working
**Solution**:
- Check console logs for `[CBS AUTO-POST]` messages
- Verify voucher status is "approved" before posting
- Check localStorage for cbsPostingId

---

## ✅ Success Criteria

All tests pass when:
- ✅ Dashboard displays all vouchers correctly
- ✅ Filters work as expected
- ✅ Actions execute based on permissions
- ✅ Signatures are captured and bound cryptographically
- ✅ Approval workflows process correctly
- ✅ CBS auto-posting works
- ✅ Exceptions and approvals are highlighted
- ✅ Audit trail logs all actions
- ✅ Statistics are accurate
- ✅ Auto-refresh works every 5 seconds

---

## 📝 Test Report Template

```
## Test Execution Report - Section 3.4

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]

### Test Results
- Test 1 (View Dashboard): ✅ PASS / ❌ FAIL
- Test 2 (Filter Vouchers): ✅ PASS / ❌ FAIL
- Test 3 (View Details): ✅ PASS / ❌ FAIL
- Test 4 (Approve Voucher): ✅ PASS / ❌ FAIL
- Test 5 (Reject Voucher): ✅ PASS / ❌ FAIL
- Test 6 (Forward Voucher): ✅ PASS / ❌ FAIL
- Test 7 (Edit Voucher): ✅ PASS / ❌ FAIL
- Test 8 (Auto-Refresh): ✅ PASS / ❌ FAIL
- Test 9 (CBS Auto-Posting): ✅ PASS / ❌ FAIL
- Test 10 (Audit Trail): ✅ PASS / ❌ FAIL
- Test 11 (Exception Highlighting): ✅ PASS / ❌ FAIL
- Test 12 (Approval Highlighting): ✅ PASS / ❌ FAIL
- Test 13 (Statistics Accuracy): ✅ PASS / ❌ FAIL
- Test 14 (Permission-Based Actions): ✅ PASS / ❌ FAIL
- Test 15 (Responsive Design): ✅ PASS / ❌ FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Additional observations]
```

---

## 🚀 Next Steps

After all tests pass:
1. ✅ Test with real backend API
2. ✅ Implement WebSocket for real-time updates
3. ✅ Add bulk actions
4. ✅ Implement edit functionality
5. ✅ Add export to CSV/Excel
6. ✅ Performance testing with 1000+ vouchers

**Section 3.4 Implementation Complete!** 🎉
