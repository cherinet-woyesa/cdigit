# KYC Service

This service handles KYC (Know Your Customer) verification operations for various transaction types.

## Features

- **KYC Approval**: Approve vouchers requiring KYC verification
- **Search & Filter**: Search by ID, form reference, account, phone, maker, and date range
- **Multi-form Support**: Designed to handle KYC verification for multiple form types

## Usage

### Import the service

```typescript
import kycService from '@/services/kyc';
// or
import { kycService } from '@/services/kyc';
```

### Get today's vouchers requiring KYC

```typescript
const response = await kycService.getToday({
  serviceName: "Deposits",
  branchId: branchId
});
if (response.data && response.data.success) {
  const vouchers = response.data.data;
  // Process vouchers
}
```

### Approve KYC for a voucher

```typescript
const response = await kycService.kycApprove({
  serviceName: "Deposits",
  voucherId: voucherId,
  kycOfficerId: userId
});
if (response.data && response.data.success) {
  // KYC approval successful
}
```

### Search by specific criteria

```typescript
// By voucher ID
const byId = await kycService.getById({
  serviceName: "Deposits",
  voucherId: "123",
  branchId: branchId
});

// By form reference
const byFormRef = await kycService.getByFormReference({
  serviceName: "Deposits",
  formReferenceId: "REF-123",
  branchId: branchId
});

// By account number
const byAccount = await kycService.getByAccount({
  serviceName: "Deposits",
  accountNumber: "1234567890",
  branchId: branchId
});

// By phone number
const byPhone = await kycService.getByPhone({
  serviceName: "Deposits",
  phoneNumber: "+251912345678",
  branchId: branchId
});

// By maker ID
const byMaker = await kycService.getByMaker({
  serviceName: "Deposits",
  makerId: "maker-123",
  branchId: branchId
});

// By date range
const byDateRange = await kycService.getByDateRange({
  serviceName: "Deposits",
  from: "2024-01-01",
  to: "2024-01-31",
  branchId: branchId
});
```

## API Endpoints

### KYC Operations
- `POST /Kyc/KycApprove` - Approve KYC for a voucher
- `POST /Kyc/today` - Get today's vouchers requiring KYC
- `POST /Kyc/id` - Get voucher by ID
- `POST /Kyc/formReference` - Get voucher by form reference
- `POST /Kyc/account` - Get vouchers by account number
- `POST /Kyc/phone` - Get vouchers by phone number
- `POST /Kyc/maker` - Get vouchers by maker ID
- `POST /Kyc/range` - Get vouchers by date range

## Types

```typescript
interface KycableItem {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  amount: number;
  isAuthorized: boolean;
  isAudited: boolean;
  isKycApproved: boolean;
  isRejected: boolean;
  remark: string;
  submittedAt: string;
  authorizerId?: string;
  auditerId?: string;
  kycOfficerId?: string;
  formReferenceId?: string;
  status?: string;
  branchName?: string;
  makerName?: string;
  makerId?: string;
  customerId?: string;
  signatureUrl?: string;
}

interface KycApproveDto {
  serviceName: string;
  voucherId: string;
  kycOfficerId: string;
}

interface KycResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

## Extending for Other Forms

To add KYC verification for other form types, simply use the same methods with different `serviceName` values:

```typescript
// For withdrawals
await kycService.kycApprove({
  serviceName: "Withdrawals",
  voucherId: voucherId,
  kycOfficerId: userId
});

// For fund transfers
await kycService.getToday({
  serviceName: "FundTransfers",
  branchId: branchId
});
```
