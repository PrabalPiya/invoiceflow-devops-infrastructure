const express = require('express');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markPaid
} = require('../controllers/invoiceController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getInvoices).post(createInvoice);
router.patch('/:id/mark-paid', markPaid);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);

module.exports = router;
