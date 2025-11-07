# Auditor Service

This service handles audit operations for various transaction types (deposits, withdrawals, fund transfers, etc.).

## Features

- **Deposit Audit**: Get pending deposits and audit them
- **Withdrawal Audit**: Get pending withdrawals and audit them (ready for implementation)
- **Fund Transfer Audit**: Get pending fund transfers and audit them (ready for implementation)
- **Multi-form Support**: Designed to handle auditing for multiple form types

## Usage

### Import the service

```typescript
import auditorService from '@/services/auditor';
// or
import { auditorService } from '@/services/auditor';
```

### Get pending deposits for a branch

```typescript
const response = await auditorService.getDepositsByBranch(branchId);
if (response.data && response.data.success) {
  const deposits = response.data.data;
  // Process deposits
}
```

### Audit a deposit

```typescript
const response = await auditorService.auditDeposit(depositId, userId);
if (response.data && response.data.success) {
  // Audit successful
}
```

### Get all pending items (deposits, withdrawals, fund transfers)

```typescript
const allPending = await auditorService.getAllPendingByBranch(branchId);
console.log(allPending.deposits);
console.log(allPending.withdrawals);
console.log(allPending.fundTransfers);
```

## API Endpoints

### Deposits
- `GET /Deposits/branch/{branchId}/pending-audit` - Get pending deposits
- `PUT /Deposits/audit` - Audit a deposit

### Withdrawals (Future)
- `GET /Withdrawals/branch/{branchId}/pending-audit` - Get pending withdrawals
- `PUT /Withdrawals/audit` - Audit a withdrawal

### Fund Transfers (Future)
- `GET /FundTransfers/branch/{branchId}/pending-audit` - Get pending fund transfers
- `PUT /FundTransfers/audit` - Audit a fund transfer

## Types

```typescript
interface AuditableItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  isAuthorized: boolean;
  isAudited: boolean;
  submittedAt: string;
  authorizerId?: string;
  auditerId?: string;
  formReferenceId?: string;
  status?: string;
}

interface AuditResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

## Extending for Other Forms

To add auditing for other form types:

1. Add new methods following the pattern:
```typescript
async getFormTypeByBranch(branchId: string) {
  return apiClient.get<GetByBranchResponse>(`/FormType/branch/${branchId}/pending-audit`);
}

async auditFormType(formTypeId: string, userId: string) {
  return apiClient.put<AuditResponse>('/FormType/audit', { 
    formTypeId, 
    userId 
  });
}
```

2. Update the `getAllPendingByBranch` method to include the new form type
