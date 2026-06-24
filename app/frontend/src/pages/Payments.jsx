import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments')
      .then(({ data }) => setPayments(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Payments</h2>
        <p className="text-sm text-slate-500">View all recorded invoice payments.</p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading payments...</p> : payments.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3"><Link to={`/invoices/${payment.invoiceId}`} className="font-semibold text-slate-950 hover:underline">{payment.invoice?.invoiceNumber}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{payment.invoice?.customer?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(payment.paymentDate)}</td>
                  <td className="px-4 py-3 text-slate-600">{payment.paymentMethod}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{payment.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No payments yet"
          description="Open an invoice and record a payment to see it here."
          action={<Link to="/invoices" className="btn-primary">Go to invoices</Link>}
        />
      )}
    </div>
  );
};

export default Payments;
