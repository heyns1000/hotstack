import { Hono } from 'hono';

interface Env {
  CURRENCY_EXCHANGE_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// Exchange rates cache (updated every hour)
let cachedRates: { [key: string]: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Supported currencies
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  MXN: { symbol: 'MX$', name: 'Mexican Peso' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
};

async function fetchExchangeRates(apiKey: string): Promise<{ [key: string]: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    // Using exchangerate-api.com free tier
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data = await response.json() as {
      result: string;
      conversion_rates?: { [key: string]: number };
    };
    
    if (data.result === 'success' && data.conversion_rates) {
      cachedRates = data.conversion_rates;
      lastFetchTime = now;
      return cachedRates!;
    } else {
      throw new Error('API returned error');
    }
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Return fallback rates if API fails
    if (cachedRates) {
      return cachedRates;
    }
    
    // Hardcoded fallback rates (approximate)
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.50,
      AUD: 1.52,
      CAD: 1.36,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.12,
      ZAR: 18.50,
      BRL: 4.97,
      MXN: 17.15,
      SGD: 1.34,
      NZD: 1.63,
      KRW: 1320.50,
    };
  }
}

// Get exchange rates
app.get('/rates', async (c) => {
  try {
    const apiKey = c.env.CURRENCY_EXCHANGE_API_KEY;
    
    if (!apiKey) {
      return c.json({ error: 'Currency API key not configured' }, 500);
    }

    const rates = await fetchExchangeRates(apiKey);
    
    return c.json({
      base: 'USD',
      rates,
      currencies: SUPPORTED_CURRENCIES,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error in /rates:', error);
    return c.json({ error: 'Failed to fetch exchange rates' }, 500);
  }
});

// Convert amount from USD to target currency
app.post('/convert', async (c) => {
  try {
    const { amount, from = 'USD', to } = await c.req.json();
    
    if (!amount || !to) {
      return c.json({ error: 'Missing amount or target currency' }, 400);
    }

    const apiKey = c.env.CURRENCY_EXCHANGE_API_KEY;
    
    if (!apiKey) {
      return c.json({ error: 'Currency API key not configured' }, 500);
    }

    const rates = await fetchExchangeRates(apiKey);
    
    if (!rates[to]) {
      return c.json({ error: 'Invalid target currency' }, 400);
    }

    let convertedAmount: number;
    
    if (from === 'USD') {
      convertedAmount = amount * rates[to];
    } else {
      // Convert from source currency to USD first, then to target
      const usdAmount = amount / rates[from];
      convertedAmount = usdAmount * rates[to];
    }

    return c.json({
      from,
      to,
      amount,
      converted: Math.round(convertedAmount * 100) / 100,
      rate: rates[to],
      symbol: SUPPORTED_CURRENCIES[to as keyof typeof SUPPORTED_CURRENCIES]?.symbol || to,
    });
  } catch (error) {
    console.error('Error in /convert:', error);
    return c.json({ error: 'Failed to convert currency' }, 500);
  }
});

export default app;
