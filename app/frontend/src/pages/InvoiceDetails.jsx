import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const InvoiceDetails = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [payment, setPayment] = useState({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'CASH', note: '' });
  const [error, setError] = useState('');

  const fetchInvoice = async () => {
    const { data } = await api.get(`/invoices/${id}`);
    setInvoice(data);
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const paidAmount = useMemo(() => {
    return invoice?.payments?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  }, [invoice]);

  const balance = Math.max(Number(invoice?.total || 0) - paidAmount, 0);

  const handlePayment = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/payments', {
        ...payment,
        invoiceId: invoice.id,
        amount: Number(payment.amount)
      });
      setPayment({ amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'CASH', note: '' });
      fetchInvoice();
    } catch (error) {
      setError(error.response?.data?.message || 'Could not record payment');
    }
  };

  const markPaid = async () => {
    await api.patch(`/invoices/${invoice.id}/mark-paid`);
    fetchInvoice();
  };

  if (!invoice) return <p className="text-sm text-slate-500">Loading invoice...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link to="/invoices" className="text-sm font-semibold text-slate-500">← Back to invoices</Link>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-950">{invoice.invoiceNumber}</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-slate-500">Billed to {invoice.customer?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/invoices/${invoice.id}/edit`} className="btn-secondary">Edit</Link>
          {invoice.status !== 'PAID' && <button onClick={markPaid} className="btn-primary">Mark Paid</button>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card"><p className="text-sm text-slate-500">Issue Date</p><p className="font-semibold">{formatDate(invoice.issueDate)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Due Date</p><p className="font-semibold">{formatDate(invoice.dueDate)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Paid</p><p className="font-semibold">{formatCurrency(paidAmount)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Balance</p><p className="font-semibold">{formatCurrency(balance)}</p></div>
      </div>

      <section className="card">
        <h3 className="mb-4 text-lg font-bold text-slate-950">Line Items</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.description}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(invoice.subtotal)}</strong></div>
            <div className="flex justify-between"><span>Tax</span><strong>{formatCurrency(invoice.tax)}</strong></div>
            <div className="flex justify-between"><span>Discount</span><strong>{formatCurrency(invoice.discount)}</strong></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg"><span>Total</span><strong>{formatCurrency(invoice.total)}</strong></div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="card">
          <h3 className="mb-4 text-lg font-bold text-slate-950">Payments</h3>
          {invoice.payments.length ? (
            <div className="space-y-3">
              {invoice.payments.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-slate-500">{item.paymentMethod} · {formatDate(item.paymentDate)}</p>
                    </div>
                    <p className="text-sm text-slate-500">{item.note}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-500">No payments recorded yet.</p>}
        </section>

        <section className="card">
          <h3 className="mb-4 text-lg font-bold text-slate-950">Record Payment</h3>
          {error && <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="label">Amount</label>
              <input className="input" type="number" min="1" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={payment.paymentDate} onChange={(e) => setPayment({ ...payment, paymentDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Method</label>
              <select className="input" value={payment.paymentMethod} onChange={(e) => setPayment({ ...payment, paymentMethod: e.target.value })}>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="ESEWA">Esewa</option>
                <option value="KHALTI">Khalti</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Note</label>
              <textarea className="input min-h-24" value={payment.note} onChange={(e) => setPayment({ ...payment, note: e.target.value })} />
            </div>
            <button className="btn-primary w-full">Save Payment</button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default InvoiceDetails;
