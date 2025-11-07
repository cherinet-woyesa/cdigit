# Authorizer Service

This service handles authorization operations for various transaction types (deposits, withdrawals, fund transfers, etc.).

## Features

- **Deposit Authorization**: Get pending deposits and authorize them
- **Withdrawal Authorization**: Get pending withdrawals and authorize them (ready for implementation)
- **Fund Transfer Authorization**: Get pending fund transfers and authorize them (ready for implementation)
- **Multi-form Support**: Designed to handle authorization for multiple form types

## Usage

### Import the service

```typescript
import authorizerService from '@/services/authorizer';
// or
import { authorizerService } from '@/services/authorizer';
```

### Get pending deposits for a branch

```typescript
const response = await authorizerService.getDepositsByBranch(branchId);
if (response.data && response.data.success) {
  const deposits = response.data.data;
  // Process deposits
}
```

### Authorize a deposit

```typescript
const response = await authorizerService.authorizeDeposit(depositId, userId);
if (response.data && response.data.success) {
  // Authorization successful
}
```

### Get all pending items (deposits, withdrawals, fund transfers)

```typescript
const allPending = await authorizerService.getAllPendingByBranch(branchId);
console.log(allPending.deposits);
console.log(allPending.withdrawals);
console.log(allPending.fundTransfers);
```

## API Endpoints

### Deposits
- `GET /Deposits/branch/{branchId}/pending-authorization` - Get pending deposits
- `PUT /Deposits/authorize` - Authorize a deposit

### Withdrawals (Future)
- `GET /Withdrawals/branch/{branchId}/pending-authorization` - Get pending withdrawals
- `PUT /Withdrawals/authorize` - Authorize a withdrawal

### Fund Transfers (Future)
- `GET /FundTransfers/branch/{branchId}/pending-authorization` - Get pending fund transfers
- `PUT /FundTransfers/authorize` - Authorize a fund transfer

## Types

```typescript
interface AuthorizableItem {
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

interface AuthorizeResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

## Extending for Other Forms

To add authorization for other form types:

1. Add new methods following the pattern:
```typescript
async getFormTypeByBranch(branchId: string) {
  return apiClient.get<GetByBranchResponse>(`/FormType/branch/${branchId}/pending-authorization`);
}

async authorizeFormType(formTypeId: string, userId: string) {
  return apiClient.put<AuthorizeResponse>('/FormType/authorize', { 
    formTypeId, 
    userId 
  });
}
```

2. Update the `getAllPendingByBranch` method to include the new form type
