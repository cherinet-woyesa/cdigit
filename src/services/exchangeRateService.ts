// services/exchangeRateService.ts
import { apiClient } from '@services/http';

export interface ExchangeRate {
  id: string;
  currencyCode: string;
  currencyName: string;
  cashBuying: number;
  cashSelling: number;
  transactionBuying: number;
  transactionSelling: number;
  effectiveDate: string;
  isActive: boolean;
}

class ExchangeRateService {
  async getRates(): Promise<ExchangeRate[]> {
    const response = await apiClient.get<ExchangeRate[]>('/exchangeRate');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  }

  async createRate(data: Omit<ExchangeRate, 'id'>) {
    return apiClient.post<ExchangeRate>('/exchangeRate', data);
  }

  async updateRate(id: string, data: Partial<ExchangeRate>) {
    return apiClient.put<ExchangeRate>(`/exchangeRate/${id}`, data);
  }

  async deleteRate(id: string) {
    return apiClient.delete(`/exchangeRate/${id}`);
  }

  async getRatesForTransaction(type: 'cash' | 'transaction' = 'cash') {
    const rates = await this.getRates();
    
    return rates.map(rate => ({
      code: rate.currencyCode,
      name: rate.currencyName,
      rate: type === 'cash' ? rate.cashSelling : rate.transactionSelling
    }));
  }
}

export const exchangeRateService = new ExchangeRateService();
export default exchangeRateService;