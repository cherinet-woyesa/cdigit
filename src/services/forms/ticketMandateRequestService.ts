// services/ticketMandateRequestService.ts
import { apiClient } from '@services/http';

export interface TicketMandateRequestData {
  branchId: string;
  accountNumber: string;
  mandateType: string;
  authorizationScope: string;
  mandateStartDate: string;
  mandateEndDate: string;
  signature: string;
}

export interface TicketMandateRequestResponse {
  id: string;
  formReferenceId: string;
  accountNumber: string;
  status: string;
  submittedAt: string;
}

class TicketMandateRequestService {
  async submitTicketMandateRequest(data: TicketMandateRequestData, token?: string) {
    const payload = {
      BranchId: data.branchId,
      AccountNumber: data.accountNumber,
      MandateType: data.mandateType,
      AuthorizationScope: data.authorizationScope,
      MandateStartDate: data.mandateStartDate,
      MandateEndDate: data.mandateEndDate,
      Signature: data.signature,
    };

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    
    return apiClient.post<TicketMandateRequestResponse>('/TicketMandateRequest/submit', payload, headers);
  }

  async getTicketMandateRequestById(id: string) {
    return apiClient.get<TicketMandateRequestResponse>(`/TicketMandateRequest/${id}`);
  }
}

export const ticketMandateRequestService = new TicketMandateRequestService();
export const getTicketMandateRequestById = ticketMandateRequestService.getTicketMandateRequestById.bind(ticketMandateRequestService);
export default ticketMandateRequestService;
