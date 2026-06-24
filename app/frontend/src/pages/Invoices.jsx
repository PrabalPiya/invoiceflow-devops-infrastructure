import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const statuses = ['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await api.get('/invoices', { params: { status, search } });
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices().catch(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    fetchInvoices();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Invoices</h2>
          <p className="text-sm text-slate-500">Create, filter and manage your invoices.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">Create Invoice</Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input className="input" placeholder="Search invoice or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((item) => <option key={item || 'ALL'} value={item}>{item || 'All Statuses'}</option>)}
        </select>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading invoices...</p> : invoices.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3"><Link to={`/invoices/${invoice.id}`} className="font-semibold text-slate-950 hover:underline">{invoice.invoiceNumber}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{invoice.customer?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(invoice.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/invoices/${invoice.id}/edit`} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">Edit</Link>
                      <button onClick={() => handleDelete(invoice.id)} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No invoices found"
          description="Create your first invoice after adding a customer."
          action={<Link to="/invoices/new" className="btn-primary">Create invoice</Link>}
        />
      )}
    </div>
  );
};

export default Invoices;
