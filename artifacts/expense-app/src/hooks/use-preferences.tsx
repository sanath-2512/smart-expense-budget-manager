import { createContext, useContext, useMemo, useState } from "react";

export const SUPPORTED_CURRENCIES = ["USD", "INR"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_KEY = "fintrack_currency";

type PreferencesContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") {
    return "USD";
  }

  const stored = localStorage.getItem(CURRENCY_KEY);
  if (stored === "USD" || stored === "INR") {
    return stored;
  }

  return "USD";
}

function getLocale(currency: CurrencyCode): string {
  return currency === "INR" ? "en-IN" : "en-US";
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => getStoredCurrency());

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENCY_KEY, nextCurrency);
    }
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      currency,
      setCurrency,
      formatCurrency: (amount: number) =>
        new Intl.NumberFormat(getLocale(currency), {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(amount),
    }),
    [currency],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }

  return context;
}
