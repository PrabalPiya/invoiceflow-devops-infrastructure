const prisma = require('../lib/prisma');
const { updateOverdueInvoices } = require('./invoiceController');

const getSummary = async (req, res, next) => {
  try {
    await updateOverdueInvoices(req.user.id);

    const [customersCount, invoices, payments, recentInvoices] = await Promise.all([
      prisma.customer.count({ where: { userId: req.user.id } }),
      prisma.invoice.findMany({
        where: { userId: req.user.id },
        include: { payments: true }
      }),
      prisma.payment.findMany({ where: { userId: req.user.id } }),
      prisma.invoice.findMany({
        where: { userId: req.user.id },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const totalInvoices = invoices.length;
    const totalPaidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalInvoiceAmount = invoices
      .filter((invoice) => invoice.status !== 'CANCELLED')
      .reduce((sum, invoice) => sum + Number(invoice.total), 0);
    const totalUnpaidAmount = Math.max(totalInvoiceAmount - totalPaidAmount, 0);
    const overdueInvoices = invoices.filter((invoice) => invoice.status === 'OVERDUE').length;

    res.json({
      totalCustomers: customersCount,
      totalInvoices,
      totalPaidAmount,
      totalUnpaidAmount,
      overdueInvoices,
      recentInvoices
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary };
