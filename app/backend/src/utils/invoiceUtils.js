const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  return Number(value);
};

const calculateInvoiceTotals = (items = [], tax = 0, discount = 0) => {
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = toNumber(item.unitPrice);
    const amount = quantity * unitPrice;

    return {
      description: item.description,
      quantity,
      unitPrice,
      amount
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + toNumber(tax) - toNumber(discount);

  return {
    items: normalizedItems,
    subtotal,
    tax: toNumber(tax),
    discount: toNumber(discount),
    total: total < 0 ? 0 : total
  };
};

const mapPaymentMethod = (method = 'OTHER') => {
  const normalized = String(method).trim().toUpperCase().replace(/\s+/g, '_');
  const allowed = ['CASH', 'BANK_TRANSFER', 'CARD', 'ESEWA', 'KHALTI', 'OTHER'];
  return allowed.includes(normalized) ? normalized : 'OTHER';
};

const mapInvoiceStatus = (status = 'DRAFT') => {
  const normalized = String(status).trim().toUpperCase();
  const allowed = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
  return allowed.includes(normalized) ? normalized : 'DRAFT';
};

module.exports = {
  toNumber,
  calculateInvoiceTotals,
  mapPaymentMethod,
  mapInvoiceStatus
};
