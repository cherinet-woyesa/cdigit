// hooks/useCurrencyConversion.ts
import { useState, useEffect } from 'react';
import { exchangeRateService } from '@services/exchangeRateService';

interface Currency {
  code: string;
  name: string;
  rate: number;
}

export function useCurrencyConversion() {
  const [exchangeRates, setExchangeRates] = useState<Currency[]>([
    { code: 'ETB', name: 'Ethiopian Birr', rate: 1 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExchangeRates = async () => {
      setLoading(true);
      try {
        const rates = await exchangeRateService.getRates();
        const currencies: Currency[] = rates.map(rate => ({
          code: rate.currencyCode,
          name: rate.currencyName,
          rate: rate.cashSelling // Default to cash selling rate
        }));
        setExchangeRates([{ code: 'ETB', name: 'Ethiopian Birr', rate: 1 }, ...currencies]);
      } catch (error) {
        console.error('Failed to load exchange rates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExchangeRates();
  }, []);

  const convertAmount = (amount: string, fromCurrency: string, toCurrency: string = 'ETB'): string => {
    if (!amount || fromCurrency === toCurrency) return amount;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return amount;
    
    const fromRate = exchangeRates.find(c => c.code === fromCurrency)?.rate;
    const toRate = exchangeRates.find(c => c.code === toCurrency)?.rate;
    
    if (!fromRate || !toRate) return amount;
    
    // Convert via ETB as base currency
    const amountInETB = amountNum * fromRate;
    const convertedAmount = amountInETB / toRate;
    
    return convertedAmount.toFixed(2);
  };

  const getCurrencyOptions = () => {
    return exchangeRates.map(currency => ({
      code: currency.code,
      name: currency.name
    }));
  };

  return {
    exchangeRates,
    loading,
    convertAmount,
    getCurrencyOptions,
  };
}