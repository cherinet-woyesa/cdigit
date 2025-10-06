// types/ExchangeRate.ts
export interface ExchangeRate {
  id: string;
  currencyName: string;
  currencyCode: string;
  cashBuying: number;
  cashSelling: number;
  transactionBuying: number;
  transactionSelling: number;
  effectiveDate: string;
}