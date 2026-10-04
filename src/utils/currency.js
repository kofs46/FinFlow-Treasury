export const formatBDT = (amount, lang = 'bn') => {
  const num = Number(amount) || 0;
  if (lang === 'bn') {
    const formatted = new Intl.NumberFormat('bn-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
    return `৳ ${formatted}`;
  }
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
  return `৳ ${formatted}`;
};