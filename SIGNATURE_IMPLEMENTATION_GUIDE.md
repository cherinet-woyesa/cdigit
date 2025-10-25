# Digital Signature Implementation Guide

## Overview
This guide explains how to implement digital signatures in customer forms. The implementation includes both a simple signature capture component and a secure cryptographic binding component.

## Components

### 1. Simple Signature Component (`SignatureStep`)
A basic signature capture component that stores the signature as a base64 string.

**Usage:**
```tsx
import { SignatureStep } from '../components/SignatureStep';

<SignatureStep 
  onSignatureComplete={handleSignatureComplete}
  onSignatureClear={handleSignatureClear}
  error={signatureError}
/>
```

### 2. Secure Signature Component (`SecureSignatureStep`)
An advanced signature component that cryptographically binds the signature to the transaction using SHA-256 hashing.

**Usage:**
```tsx
import { SecureSignatureStep } from '../components/SecureSignatureStep';

<SecureSignatureStep 
  onSignatureBound={handleSignatureBound}
  onSignatureClear={handleSignatureClear}
  voucherData={voucherData}
  error={signatureError}
/>
```

## Backend Integration

### 1. Model Updates
Add a `Signature` property to your entity models:
```csharp
public class YourEntity : BaseVoucher
{
    public string? Signature { get; set; } // Digital signature data (base64)
}
```

### 2. DTO Updates
Add a `Signature` property to your DTOs:
```csharp
public class YourFormDto
{
    public string? Signature { get; set; } // Digital signature data (base64)
}
```

### 3. Service Updates
Handle signature data in your service methods:
```csharp
public async Task<ApiResponse<YourResponseDto>> SubmitFormAsync(YourFormDto formDto)
{
    var entity = _mapper.Map<YourEntity>(formDto);
    entity.Signature = formDto.Signature; // Add signature to entity
    // ... rest of implementation
}
```

## Frontend Integration

### 1. Add Signature State
```tsx
const [signature, setSignature] = useState<string>('');
const [signatureError, setSignatureError] = useState<string>('');
```

### 2. Signature Handlers
```tsx
const handleSignatureComplete = (signatureData: string) => {
  setSignature(signatureData);
  setSignatureError('');
};

const handleSignatureClear = () => {
  setSignature('');
};
```

### 3. Form Submission
Include signature in form data:
```tsx
const handleSubmit = async () => {
  const formData = {
    // ... other fields
    signature: signature,
  };
  
  // Submit form data
};
```

## Database Migration
After updating models, create a new migration:
```bash
dotnet ef migrations add AddSignatureToYourEntity
dotnet ef database update
```

## Reusable Hook
Use the `useSignature` hook for common signature functionality:
```tsx
import { useSignature } from '../hooks/useSignature';

const { 
  signatureData, 
  isSignatureValid, 
  signatureError,
  handleSignatureComplete,
  handleSignatureClear
} = useSignature();
```

## Security Considerations
1. Signatures are stored as base64-encoded PNG images
2. For enhanced security, use the cryptographic binding feature
3. Signatures are validated and bound to transaction data
4. All signature bindings are logged for audit purposes

## Customization
You can customize the signature components by:
1. Modifying the styling in the component files
2. Adding additional validation rules
3. Implementing different signature storage mechanisms
4. Adding multi-signature support for complex workflows