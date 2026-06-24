const prisma = require('../lib/prisma');

const getCustomers = async (req, res, next) => {
  try {
    const { search = '' } = req.query;

    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user.id,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } }
            ]
          : undefined
      },
      include: {
        _count: { select: { invoices: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(customers);
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, companyName, address } = req.body;

    if (!name) return res.status(400).json({ message: 'Customer name is required' });

    const customer = await prisma.customer.create({
      data: {
        userId: req.user.id,
        name,
        email,
        phone,
        companyName,
        address
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ message: 'Customer not found' });

    const { name, email, phone, companyName, address } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { name, email, phone, companyName, address }
    });

    res.json(customer);
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!existing) return res.status(404).json({ message: 'Customer not found' });

    await prisma.customer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
