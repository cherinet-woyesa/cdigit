# ⚡ Quick Test Commands Reference

## 🧪 Test Approval Workflows (Browser Console)

### Generate All Test Data
```javascript
window.testApprovalWorkflows.run()
```
**Creates:** 6 sample high-value transactions requiring approval

---

### Individual Commands

#### Generate Sample Workflows
```javascript
window.testApprovalWorkflows.generate()
```

#### View Statistics
```javascript
window.testApprovalWorkflows.stats()
```

#### Clear Test Data
```javascript
window.testApprovalWorkflows.clear()
```

#### View Sample Transactions
```javascript
window.testApprovalWorkflows.samples
```

---

## 📊 View Audit Logs

### Import Service
```javascript
import authorizationAuditService from './src/services/authorizationAuditService'
```

### View Signature Bindings
```javascript
authorizationAuditService.getSignatureBindingLogs()
```

### View Approval Actions
```javascript
authorizationAuditService.getApprovalLogs()
```

### View Authorization Checks
```javascript
authorizationAuditService.getAuthorizationLogs()
```

### View Analytics
```javascript
authorizationAuditService.getAnalytics()
```

### Export to CSV
```javascript
const csv = authorizationAuditService.exportLogs('csv')
console.log(csv)
```

---

## 🔐 Test Permissions

### Import Hook
```javascript
import { usePermissions } from './src/hooks/usePermissions'
```

### Check Permissions
```javascript
const { can, role, permissions } = usePermissions()

can('transaction.withdrawal.approve')  // Check single permission
role                                    // View current role
permissions                             // View all permissions
```

---

## ✅ Test Approval Thresholds

### Import Function
```javascript
import { requiresTransactionApproval } from './src/config/rbacMatrix'
```

### Test Different Amounts
```javascript
// 600K ETB Withdrawal (should require approval)
requiresTransactionApproval('withdrawal', 600000, 'ETB', 'normal')

// 400K ETB Withdrawal (should NOT require approval)
requiresTransactionApproval('withdrawal', 400000, 'ETB', 'normal')

// $6K USD (should require FX approval)
requiresTransactionApproval('withdrawal', 6000, 'USD', 'normal')
```

---

## 🎯 Quick Test Checklist

### Step 1: Login as Maker
```
1. Process transaction
2. Sign with teller signature
3. Complete transaction
4. Check console for hashes
```

### Step 2: Generate Test Data
```javascript
window.testApprovalWorkflows.run()
```

### Step 3: Login as Manager
```
1. Go to Manager Dashboard
2. Click "Approvals" tab
3. Should see 6 pending
4. Approve/Reject transactions
```

### Step 4: Verify Audit Trail
```javascript
window.testApprovalWorkflows.stats()
authorizationAuditService.getAnalytics()
```

---

## 🚨 Troubleshooting

### No test utility?
```javascript
// Reload page or import manually:
import './src/utils/testApprovalWorkflows'
```

### Clear everything
```javascript
localStorage.clear()
location.reload()
```

### Check current user
```javascript
const user = JSON.parse(localStorage.getItem('user'))
console.log('Current user:', user)
```

---

## 📱 Quick Access URLs

- **Manager Dashboard:** `/manager-dashboard`
- **Approvals Tab:** Click "✅ Approvals"
- **Maker Dashboard:** `/maker-dashboard`

---

**Press F12 to open console and run these commands!** 🚀
