
// services/merchantAccountOpeningApplicationService.ts
import { apiClient } from '@services/http';

export interface MerchantAccountOpeningApplicationData {
  branchId: string;
  phoneNumber: string;
  otpCode: string;
  companyName: string;
  businessType: string;
  licenceNumber?: string;
  issueDate?: Date;
  expireDate?: Date;
  tradeLicence?: string;
  taxPayerIdNumber?: string;
  officeAddress?: string;
  city?: string;
  telephoneNumber?: string;
  faxNumber?: string;
  postalNumber?: string;
  emailAddress?: string;
  representativeName?: string;
  representativeFatherName?: string;
  representativeGrandfatherName?: string;
  representativeIdNumber?: string;
  representativeIdIssuedBy?: string;
  representativeCity?: string;
  representativeEmail?: string;
  representativePhone?: string;
  branchName?: string;
  merchantAccountNumber?: string;
  signatures?: { signature: string }[];
}

export interface MerchantAccountOpeningApplicationResponse {
  id: string;
  // Add other response fields as needed
}

class MerchantAccountOpeningApplicationService {
  async submit(data: MerchantAccountOpeningApplicationData) {
    const payload = {
        BranchId: data.branchId,
        PhoneNumber: data.phoneNumber,
        OtpCode: data.otpCode,
        CompanyName: data.companyName,
        BusinessType: data.businessType,
        LicenceNumber: data.licenceNumber,
        IssueDate: data.issueDate,
        ExpireDate: data.expireDate,
        TradeLicence: data.tradeLicence,
        TaxPayerIdNumber: data.taxPayerIdNumber,
        OfficeAddress: data.officeAddress,
        City: data.city,
        TelephoneNumber: data.telephoneNumber,
        FaxNumber: data.faxNumber,
        PostalNumber: data.postalNumber,
        EmailAddress: data.emailAddress,
        RepresentativeName: data.representativeName,
        RepresentativeFatherName: data.representativeFatherName,
        RepresentativeGrandfatherName: data.representativeGrandfatherName,
        RepresentativeIdNumber: data.representativeIdNumber,
        RepresentativeIdIssuedBy: data.representativeIdIssuedBy,
        RepresentativeCity: data.representativeCity,
        RepresentativeEmail: data.representativeEmail,
        RepresentativePhone: data.representativePhone,
        BranchName: data.branchName,
        MerchantAccountNumber: data.merchantAccountNumber,
        Signatures: data.signatures,
    };
    return apiClient.post<MerchantAccountOpeningApplicationResponse>('/MerchantAccountOpeningApplication/submit', payload);
  }
}

export const merchantAccountOpeningApplicationService = new MerchantAccountOpeningApplicationService();
export default merchantAccountOpeningApplicationService;
