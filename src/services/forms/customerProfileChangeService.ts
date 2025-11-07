// services/customerProfileChangeService.ts
import { apiClient } from '@services/http';

export interface CustomerProfileChangeData {
  branchId: string;
  phoneNumber: string;
  otpCode: string;
  customerId: string;
  accountNumber: string;
  accountName: string;
  customerFullName: string;
  accountType: string;
  dateRequested: string;
  tokenSerialNumber?: string;
  merchantContractNumber?: string;
  merchantId?: string;
  paymentCardNumber?: string;
  registeredMobileNumber?: string;
  changeOfSignatureOrName: boolean;
  pinResetRequest: boolean;
  mobileNumberReplacement: boolean;
  changeOrAddMobileBankingChannel: boolean;
  corpInternetBankingUserChange: boolean;
  mobileBankingResubscription: boolean;
  customerInfoChange: boolean;
  mobileBankingTermination: boolean;
  tokenReplacement: boolean;
  internetBankingTermination: boolean;
  linkOrChangeAdditionalAccounts: boolean;
  accountClosure: boolean;
  posMerchantContractTermination: boolean;
  powerOfAttorneyChange: boolean;
  additionalCardRequest: boolean;
  cardReplacementRequest: boolean;
  hasOtherRequest: boolean;
  reasonForRequest?: string;
  newSpecimenSignature1?: string;
  newSpecimenSignature2?: string;
  newSpecimenSignature3?: string;
  newSpecimenSignature4?: string;
  detailedRequestDescription?: string;
  clause?: string;
}

export interface CustomerProfileChangeResponse {
  id: string;
  formReferenceId: string;
  changeType: string;
  status: string;
  submittedAt: string;
}

class CustomerProfileChangeService {
  async submitCustomerProfileChange(data: CustomerProfileChangeData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      PhoneNumber: data.phoneNumber,
      OtpCode: data.otpCode,
      CustomerId: data.customerId,
      AccountNumber: data.accountNumber,
      AccountName: data.accountName,
      CustomerFullName: data.customerFullName,
      AccountType: data.accountType,
      DateRequested: data.dateRequested,
      TokenSerialNumber: data.tokenSerialNumber,
      MerchantContractNumber: data.merchantContractNumber,
      MerchantId: data.merchantId,
      PaymentCardNumber: data.paymentCardNumber,
      RegisteredMobileNumber: data.registeredMobileNumber,
      ChangeOfSignatureOrName: data.changeOfSignatureOrName,
      PinResetRequest: data.pinResetRequest,
      MobileNumberReplacement: data.mobileNumberReplacement,
      ChangeOrAddMobileBankingChannel: data.changeOrAddMobileBankingChannel,
      CorpInternetBankingUserChange: data.corpInternetBankingUserChange,
      MobileBankingResubscription: data.mobileBankingResubscription,
      CustomerInfoChange: data.customerInfoChange,
      MobileBankingTermination: data.mobileBankingTermination,
      TokenReplacement: data.tokenReplacement,
      InternetBankingTermination: data.internetBankingTermination,
      LinkOrChangeAdditionalAccounts: data.linkOrChangeAdditionalAccounts,
      AccountClosure: data.accountClosure,
      PosMerchantContractTermination: data.posMerchantContractTermination,
      PowerOfAttorneyChange: data.powerOfAttorneyChange,
      AdditionalCardRequest: data.additionalCardRequest,
      CardReplacementRequest: data.cardReplacementRequest,
      HasOtherRequest: data.hasOtherRequest,
      ReasonForRequest: data.reasonForRequest,
      NewSpecimenSignature1: data.newSpecimenSignature1,
      NewSpecimenSignature2: data.newSpecimenSignature2,
      NewSpecimenSignature3: data.newSpecimenSignature3,
      NewSpecimenSignature4: data.newSpecimenSignature4,
      DetailedRequestDescription: data.detailedRequestDescription,
      Clause: data.clause,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<CustomerProfileChangeResponse>('/CustomerProfileChangeOrTerminationRequest/submit', payload, headers);
  }

  async getCustomerProfileChangeById(id: string) {
    return apiClient.get<CustomerProfileChangeResponse>(`/CustomerProfileChangeOrTerminationRequest/${id}`);
  }
}

export const customerProfileChangeService = new CustomerProfileChangeService();
export const getCustomerProfileChangeById = customerProfileChangeService.getCustomerProfileChangeById.bind(customerProfileChangeService);
export default customerProfileChangeService;