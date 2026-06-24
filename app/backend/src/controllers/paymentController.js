const prisma = require('../lib/prisma');
const { mapPaymentMethod, toNumber } = require('../utils/invoiceUtils');

const getPayments = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        invoice: {
          include: { customer: true }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

const getPaymentsByInvoice = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.invoiceId, userId: req.user.id }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const payments = await prisma.payment.findMany({
      where: { invoiceId: req.params.invoiceId, userId: req.user.id },
      orderBy: { paymentDate: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentDate, paymentMethod = 'OTHER', note } = req.body;

    if (!invoiceId) return res.status(400).json({ message: 'Invoice is required' });
    if (!amount || toNumber(amount) <= 0) return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    if (!paymentDate) return res.status(400).json({ message: 'Payment date is required' });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: req.user.id },
      include: { payments: true }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.status === 'CANCELLED') return res.status(400).json({ message: 'Cannot pay a cancelled invoice' });

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId: req.user.id,
          invoiceId,
          amount: toNumber(amount),
          paymentDate: new Date(paymentDate),
          paymentMethod: mapPaymentMethod(paymentMethod),
          note
        }
      });

      const previousTotalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const newTotalPaid = previousTotalPaid + toNumber(amount);
      const invoiceTotal = Number(invoice.total);

      if (newTotalPaid >= invoiceTotal) {
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' }
        });
      }

      return payment;
    });

    const freshInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true, payments: true }
    });

    res.status(201).json({ payment: result, invoice: freshInvoice });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentsByInvoice,
  createPayment
};
