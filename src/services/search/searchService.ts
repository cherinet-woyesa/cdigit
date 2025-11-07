// services/search/searchService.ts
import { apiClient } from '@services/http';

export interface SearchByAccountRequest {
  branchId: string;
  serviceName: string; // 'Deposit' | 'Withdrawal' | 'FundTransfer'
  accountNumber: string;
}

export interface SearchByTokenRequest {
  branchId: string;
  tokenNumber: string;
}

export interface SearchByFormReferenceRequest {
  branchId: string;
  formReferenceId: string;
}

export interface SearchResult {
  success: boolean;
  message?: string;
  data?: any;
}

class SearchService {
  /**
   * Search for transactions by account number
   * Returns transactions for today in the specified branch
   */
  async searchByAccount(request: SearchByAccountRequest) {
    const payload = {
      BranchId: request.branchId,
      ServiceName: request.serviceName,
      AccountNumber: request.accountNumber
    };
    
    return apiClient.post<SearchResult>('/search/account', payload);
  }

  /**
   * Search for a customer by their token number
   * Returns customer information and their transaction
   */
  async searchByToken(request: SearchByTokenRequest) {
    const payload = {
      BranchId: request.branchId,
      TokenNumber: request.tokenNumber
    };
    
    return apiClient.post<SearchResult>('/search/token', payload);
  }

  /**
   * Search for a transaction by form reference ID
   * Returns the transaction details
   */
  async searchByFormReference(request: SearchByFormReferenceRequest) {
    const payload = {
      BranchId: request.branchId,
      FormReferenceId: request.formReferenceId
    };
    
    return apiClient.post<SearchResult>('/search/form-reference', payload);
  }
}

export const searchService = new SearchService();
export default searchService;
