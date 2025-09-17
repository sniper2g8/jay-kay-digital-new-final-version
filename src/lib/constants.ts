// Application constants for Jay Kay Digital Press

// Currency settings
export const CURRENCY = {
  CODE: "SLL", // Sierra Leonean Leone
  SYMBOL: "SLL",
  NAME: "Sierra Leonean Leone",
  LOCALE: "en-SL", // English (Sierra Leone)
};

// Region settings
export const REGION = {
  NAME: "Sierra Leone",
  COUNTRY_CODE: "SL",
  TIMEZONE: "Africa/Freetown",
};

// Formatting options
export const FORMAT_OPTIONS = {
  CURRENCY: {
    style: "currency",
    currency: "SLL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
};

// Default formatting function for currency
export const formatCurrency = (amount: number): string => {
  return `SLL ${amount.toLocaleString()}`;
};

// Default formatting function for numbers
export const formatNumber = (number: number): string => {
  return number.toLocaleString();
};

// Default formatting function for dates
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
