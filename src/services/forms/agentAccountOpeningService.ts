
// services/agentAccountOpeningService.ts
import { apiClient } from '@services/http';

export interface AgentAccountOpeningData {
  companyName: string;
  businessType: string;
  tradeLicenseNumber: string;
  issueDate?: Date;
  expireDate?: Date;
  taxPayerIdNumber: string;
  officeAddress: string;
  city: string;
  phoneNumber: string;
  faxNumber: string;
  postalNumber: string;
  emailAddress: string;
  representativeName: string;
  fatherName: string;
  grandfatherName: string;
  idNumber: string;
  idIssuedBy: string;
  representativeCity: string;
  representativeEmail: string;
  representativeTelNumber: string;
  branchName: string;
  agentBankAccountNumber: string;
  branchId: string;
  otpCode: string;
  signatures?: { signature: string }[];
}

export interface AgentAccountOpeningResponse {
  id: string;
  // Add other response fields as needed
}

class AgentAccountOpeningService {
  async submit(data: AgentAccountOpeningData) {
    const payload = {
        CompanyName: data.companyName,
        BusinessType: data.businessType,
        TradeLicenseNumber: data.tradeLicenseNumber,
        IssueDate: data.issueDate,
        ExpireDate: data.expireDate,
        TaxPayerIdNumber: data.taxPayerIdNumber,
        OfficeAddress: data.officeAddress,
        City: data.city,
        PhoneNumber: data.phoneNumber,
        FaxNumber: data.faxNumber,
        PostalNumber: data.postalNumber,
        EmailAddress: data.emailAddress,
        RepresentativeName: data.representativeName,
        FatherName: data.fatherName,
        GrandfatherName: data.grandfatherName,
        IdNumber: data.idNumber,
        IdIssuedBy: data.idIssuedBy,
        RepresentativeCity: data.representativeCity,
        RepresentativeEmail: data.representativeEmail,
        RepresentativeTelNumber: data.representativeTelNumber,
        BranchName: data.branchName,
        AgentBankAccountNumber: data.agentBankAccountNumber,
        BranchId: data.branchId,
        OtpCode: data.otpCode,
        Signatures: data.signatures,
    };
    return apiClient.post<AgentAccountOpeningResponse>('/AgentAccountOpening/submit', payload);
  }
}

export const agentAccountOpeningService = new AgentAccountOpeningService();
export default agentAccountOpeningService;
