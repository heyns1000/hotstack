import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface CurrencyInfo {
  symbol: string;
  name: string;
}

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  rates: ExchangeRates;
  currencies: { [key: string]: CurrencyInfo };
  convert: (amountUSD: number) => number;
  formatPrice: (amountUSD: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<ExchangeRates>({ USD: 1 });
  const [currencies, setCurrencies] = useState<{ [key: string]: CurrencyInfo }>({
    USD: { symbol: '$', name: 'US Dollar' }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('preferredCurrency');
    if (saved) {
      setCurrency(saved);
    }
    fetchRates();
  }, []);

  useEffect(() => {
    localStorage.setItem('preferredCurrency', currency);
  }, [currency]);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/currency/rates');
      const data = await response.json();
      
      if (data.rates) {
        setRates(data.rates);
        setCurrencies(data.currencies || {});
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convert = (amountUSD: number): number => {
    const rate = rates[currency] || 1;
    return Math.round(amountUSD * rate * 100) / 100;
  };

  const formatPrice = (amountUSD: number): string => {
    const converted = convert(amountUSD);
    const symbol = currencies[currency]?.symbol || currency;
    
    const formatted = converted.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    });
    
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        currencies,
        convert,
        formatPrice,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
