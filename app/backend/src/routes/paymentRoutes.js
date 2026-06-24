const express = require('express');
const {
  getPayments,
  getPaymentsByInvoice,
  createPayment
} = require('../controllers/paymentController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').get(getPayments).post(createPayment);
router.get('/invoice/:invoiceId', getPaymentsByInvoice);

module.exports = router;
