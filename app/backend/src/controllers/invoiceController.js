const prisma = require('../lib/prisma');
const { calculateInvoiceTotals, mapInvoiceStatus, toNumber } = require('../utils/invoiceUtils');

const updateOverdueInvoices = async (userId) => {
  await prisma.invoice.updateMany({
    where: {
      userId,
      dueDate: { lt: new Date() },
      status: { in: ['SENT', 'DRAFT'] }
    },
    data: { status: 'OVERDUE' }
  });
};

const getInvoices = async (req, res, next) => {
  try {
    await updateOverdueInvoices(req.user.id);
    const { status = '', search = '' } = req.query;

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: req.user.id,
        status: status ? mapInvoiceStatus(status) : undefined,
        OR: search
          ? [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { customer: { name: { contains: search, mode: 'insensitive' } } },
              { customer: { companyName: { contains: search, mode: 'insensitive' } } }
            ]
          : undefined
      },
      include: {
        customer: true,
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    await updateOverdueInvoices(req.user.id);

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } }
      }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      invoiceNumber,
      issueDate,
      dueDate,
      status = 'DRAFT',
      tax = 0,
      discount = 0,
      notes,
      items = []
    } = req.body;

    if (!customerId) return res.status(400).json({ message: 'Customer is required' });
    if (!issueDate || !dueDate) return res.status(400).json({ message: 'Issue date and due date are required' });
    if (!items.length) return res.status(400).json({ message: 'At least one invoice item is required' });

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId: req.user.id }
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const totals = calculateInvoiceTotals(items, tax, discount);
    const generatedInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user.id,
        customerId,
        invoiceNumber: generatedInvoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: mapInvoiceStatus(status),
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        notes,
        items: {
          create: totals.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          }))
        }
      },
      include: { customer: true, items: true, payments: true }
    });

    res.status(201).json(invoice);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Invoice number already exists for this account' });
    }
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { payments: true }
    });

    if (!existing) return res.status(404).json({ message: 'Invoice not found' });

    const {
      customerId,
      invoiceNumber,
      issueDate,
      dueDate,
      status,
      tax = existing.tax,
      discount = existing.discount,
      notes,
      items
    } = req.body;

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId: req.user.id }
      });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
    }

    let updateData = {
      customerId: customerId || existing.customerId,
      invoiceNumber: invoiceNumber || existing.invoiceNumber,
      issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
      dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
      status: status ? mapInvoiceStatus(status) : existing.status,
      notes
    };

    const result = await prisma.$transaction(async (tx) => {
      if (Array.isArray(items)) {
        const totals = calculateInvoiceTotals(items, tax, discount);
        updateData = {
          ...updateData,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total
        };

        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await tx.invoice.update({ where: { id: existing.id }, data: updateData });
        await tx.invoiceItem.createMany({
          data: totals.items.map((item) => ({
            invoiceId: existing.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
          }))
        });
      } else {
        await tx.invoice.update({ where: { id: existing.id }, data: updateData });
      }

      return tx.invoice.findUnique({
        where: { id: existing.id },
        include: { customer: true, items: true, payments: true }
      });
    });

    res.json(result);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Invoice number already exists for this account' });
    }
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ message: 'Invoice not found' });

    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    next(error);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ message: 'Invoice not found' });

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'PAID' },
      include: { customer: true, items: true, payments: true }
    });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markPaid,
  updateOverdueInvoices
};
