import { createPublicClient, http, parseEther } from 'viem';
import { celo } from 'viem/chains';

// Mock exchange rates for development - in production, these would come from Mento contracts
// Reference: https://github.com/mento-protocol/mento-deployment
// These rates are approximate and would be fetched from the Mento Oracle in production
type ExchangeRateKey = 'cUSD_cEUR' | 'cUSD_cREAL' | 'cEUR_cREAL' | 'cEUR_cUSD' | 'cREAL_cUSD' | 'cREAL_cEUR';

const MOCK_EXCHANGE_RATES: Record<ExchangeRateKey, number> = {
  'cUSD_cEUR': 0.92, // 1 cUSD = 0.92 cEUR
  'cUSD_cREAL': 5.05, // 1 cUSD = 5.05 cREAL
  'cEUR_cREAL': 5.49, // 1 cEUR = 5.49 cREAL
  'cEUR_cUSD': 1.08, // 1 cEUR = 1.08 cUSD
  'cREAL_cUSD': 0.20, // 1 cREAL = 0.20 cUSD
  'cREAL_cEUR': 0.18, // 1 cREAL = 0.18 cEUR
};

// Stablecoin addresses on Celo mainnet
const STABLECOIN_ADDRESSES = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787'
};

// Create a public client for Celo
const publicClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org')
});

export const MentoService = {
  // Get supported currencies
  getSupportedCurrencies(): string[] {
    return ['cUSD', 'cEUR', 'cREAL'];
  },

  // Get currency symbol
  getCurrencySymbol(currency: string): string {
    switch (currency) {
      case 'cUSD': return '$';
      case 'cEUR': return '€';
      case 'cREAL': return 'R$';
      default: return '$';
    }
  },

  // Format amount with currency symbol
  formatAmountWithCurrency(amount: number, currency: string): string {
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
  },

  // Get exchange rate between two currencies
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return 1;

    // Normalize currency names
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    const exchangeKey = `${from}_${to}`;
    const reverseExchangeKey = `${to}_${from}`;

    // In a real implementation, we would call the Mento Oracle contracts here
    // Reference: https://github.com/mento-protocol/mento-deployment/tree/main/contracts/oracles
    // For now, we'll use mock exchange rates
    if (exchangeKey in MOCK_EXCHANGE_RATES) {
      return MOCK_EXCHANGE_RATES[exchangeKey as ExchangeRateKey];
    } else if (reverseExchangeKey in MOCK_EXCHANGE_RATES) {
      return 1 / MOCK_EXCHANGE_RATES[reverseExchangeKey as ExchangeRateKey];
    } else {
      // If no direct rate, try to go through cUSD as the base currency
      if (from !== 'CUSD' && to !== 'CUSD') {
        const rateFromTocUSD = await this.getExchangeRate(from, 'cUSD');
        const ratecUSDToTo = await this.getExchangeRate('cUSD', to);
        return rateFromTocUSD * ratecUSDToTo;
      }

      console.warn(`No exchange rate found for ${from} to ${to}, using 1:1 rate`);
      return 1; // Default to 1:1 if we can't find a rate
    }
  },

  // Convert amount from one currency to another (async version)
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  },

  // Synchronous version for use in balance calculations
  // convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  //   if (fromCurrency === toCurrency) return amount;

  //   // Normalize currency names
  //   const from = fromCurrency.toUpperCase();
  //   const to = toCurrency.toUpperCase();

  //   const exchangeKey = `${from}_${to}`;
  //   const reverseExchangeKey = `${to}_${from}`;

  //   // Use mock exchange rates for now
  //   if (exchangeKey in MOCK_EXCHANGE_RATES) {
  //     return amount * MOCK_EXCHANGE_RATES[exchangeKey as ExchangeRateKey];
  //   } else if (reverseExchangeKey in MOCK_EXCHANGE_RATES) {
  //     return amount / MOCK_EXCHANGE_RATES[reverseExchangeKey as ExchangeRateKey];
  //   } else {
  //     // If no direct rate, try to go through cUSD as the base currency
  //     if (from !== 'CUSD' && to !== 'CUSD') {
  //       try {
  //         // Be careful with recursion here - we need to avoid infinite loops
  //         const rateFromTocUSD = this.convertAmount(1, from, 'cUSD');
  //         const ratecUSDToTo = this.convertAmount(1, 'cUSD', to);
  //         return amount * rateFromTocUSD * ratecUSDToTo;
  //       } catch (e) {
  //         console.warn('Error in recursive conversion:', e);
  //       }
  //     }

  //     // Default to 1:1 conversion if we can't find a rate
  //     console.warn(`No exchange rate found for ${from} to ${to}, using 1:1 rate`);
  //     return amount;
  //   }
  // }
};

export default MentoService;
