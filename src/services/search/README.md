# Search Service

This service provides methods to search for customer transactions. It's designed for **staff dashboards** (Maker, Authorizer, Auditor) to search for customer transactions within their branch.

## Available Search Methods

### 1. Search by Account Number
Search for all transactions for a specific account number today.

```typescript
import { searchService } from '@services/search';

const result = await searchService.searchByAccount({
  branchId: 'branch-guid',
  serviceName: 'Deposit', // or 'Withdrawal', 'FundTransfer'
  accountNumber: '1234567890'
});
```

### 2. Search by Token Number
Search for a customer by their queue token number.

```typescript
const result = await searchService.searchByToken({
  branchId: 'branch-guid',
  tokenNumber: 'A001'
});
```

### 3. Search by Form Reference ID
Search for a specific transaction by its form reference ID.

```typescript
const result = await searchService.searchByFormReference({
  branchId: 'branch-guid',
  formReferenceId: 'dep-1234567890'
});
```

## Usage in Staff Dashboards

### Example: Maker Dashboard Search

```typescript
import { searchService } from '@services/search';
import { useBranch } from '@context/BranchContext';

function MakerDashboard() {
  const { branch } = useBranch();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'account' | 'token'>('account');
  
  const handleSearch = async () => {
    if (!branch?.id) return;
    
    try {
      let result;
      
      if (searchType === 'account') {
        result = await searchService.searchByAccount({
          branchId: branch.id,
          serviceName: 'Deposit',
          accountNumber: searchQuery
        });
      } else {
        result = await searchService.searchByToken({
          branchId: branch.id,
          tokenNumber: searchQuery
        });
      }
      
      if (result.success && result.data) {
        // Display search results
        console.log('Search results:', result.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  return (
    // ... UI implementation
  );
}
```

## Note for Customer Dashboard

The Customer Dashboard uses a **different search approach** - it searches through available services/forms locally, not through backend transactions. This is intentional because:

1. Customers search for services they want to use (e.g., "deposit", "withdrawal")
2. Staff search for customer transactions they need to process
3. The backend search endpoints require a branch ID, which customers don't have in their context

For customer transaction history, use the transaction history endpoints instead of the search service.
