export const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const dateInputValue = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
};
