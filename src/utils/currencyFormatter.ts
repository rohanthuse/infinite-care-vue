
export const formatCurrency = (amount: number): string => {
  return `£${amount.toFixed(2)}`;
};

export const parseCurrency = (value: string): number => {
  // Remove £ symbol and any spaces, then parse as float
  return parseFloat(value.replace(/[£\s,]/g, '')) || 0;
};
