// Factory for creating form-specific services
import { BaseFormService, type BaseFormData, type BaseFormResponse } from './baseFormService';

/**
 * Creates a simple form service for forms that don't need custom logic
 */
export function createFormService<
  TFormData extends BaseFormData = BaseFormData,
  TFormResponse extends BaseFormResponse = BaseFormResponse
>(endpoint: string) {
  return class extends BaseFormService<TFormData, TFormResponse> {
    protected endpoint = endpoint;
  };
}

/**
 * Creates a form service with custom field transformation
 */
export function createFormServiceWithTransform<
  TFormData extends BaseFormData = BaseFormData,
  TFormResponse extends BaseFormResponse = BaseFormResponse
>(
  endpoint: string,
  transformFn: (data: TFormData) => any
) {
  return class extends BaseFormService<TFormData, TFormResponse> {
    protected endpoint = endpoint;
    
    protected getAdditionalFields(data: TFormData): any {
      return transformFn(data);
    }
  };
}

// Pre-configured services for the missing forms
export const BalanceConfirmationService = createFormService('BalanceConfirmation');
export const CheckDepositService = createFormService('CheckDeposit');
export const CheckWithdrawalService = createFormService('CheckWithdrawal');
export const ChequeBookRequestService = createFormService('ChequeBookRequest');
export const CashDiscrepancyReportService = createFormService('CashDiscrepancyReport');
export const CorporateCustomerService = createFormService('CorporateCustomer');
export const CustomerIdMergeService = createFormService('CustomerIdMerge');
export const CustomerProfileChangeService = createFormService('CustomerProfileChange');
export const PettyCashFormService = createFormService('PettyCashForm');
export const PhoneBlockService = createFormService('PhoneBlock');
export const POSDeliveryFormService = createFormService('POSDeliveryForm');
export const SpecialChequeClearanceService = createFormService('SpecialChequeClearance');
export const TicketMandateRequestService = createFormService('TicketMandateRequest');

// Create instances for immediate use
export const balanceConfirmationService = new BalanceConfirmationService();
export const checkDepositService = new CheckDepositService();
export const checkWithdrawalService = new CheckWithdrawalService();
export const chequeBookRequestService = new ChequeBookRequestService();
export const cashDiscrepancyReportService = new CashDiscrepancyReportService();
export const corporateCustomerService = new CorporateCustomerService();
export const customerIdMergeService = new CustomerIdMergeService();
export const customerProfileChangeService = new CustomerProfileChangeService();
export const pettyCashFormService = new PettyCashFormService();
export const phoneBlockService = new PhoneBlockService();
export const posDeliveryFormService = new POSDeliveryFormService();
export const specialChequeClearanceService = new SpecialChequeClearanceService();
export const ticketMandateRequestService = new TicketMandateRequestService();