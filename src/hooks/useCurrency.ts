import { useQuery } from "@tanstack/react-query";

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

// Free currency API (no key needed)
export const useCurrencyRates = (base: string = "INR") => {
  return useQuery({
    queryKey: ["currency_rates", base],
    queryFn: async (): Promise<ExchangeRates> => {
      const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
      if (!res.ok) throw new Error("Currency fetch failed");
      const data = await res.json();
      return {
        base: data.base,
        rates: data.rates,
        lastUpdated: data.date,
      };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const convertCurrency = (
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
  base: string
): number => {
  if (from === to) return amount;
  if (from === base) return amount * (rates[to] || 1);
  if (to === base) return amount / (rates[from] || 1);
  // Cross-rate
  const amountInBase = amount / (rates[from] || 1);
  return amountInBase * (rates[to] || 1);
};

export const popularCurrencies = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
];
