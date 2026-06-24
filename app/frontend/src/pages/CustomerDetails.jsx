import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data }) => setCustomer(data));
  }, [id]);

  if (!customer) return <p className="text-sm text-slate-500">Loading customer...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link to="/customers" className="text-sm font-semibold text-slate-500">← Back to customers</Link>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{customer.name}</h2>
          <p className="text-sm text-slate-500">{customer.companyName || 'No company name'}</p>
        </div>
        <Link to={`/customers/${customer.id}/edit`} className="btn-primary">Edit Customer</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Email</p><p className="mt-1 font-semibold text-slate-900">{customer.email || '-'}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Phone</p><p className="mt-1 font-semibold text-slate-900">{customer.phone || '-'}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Address</p><p className="mt-1 font-semibold text-slate-900">{customer.address || '-'}</p></div>
      </div>

      <section className="card">
        <h3 className="mb-4 text-lg font-bold text-slate-950">Recent Invoices</h3>
        {customer.invoices?.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customer.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3"><Link to={`/invoices/${invoice.id}`} className="font-semibold text-slate-950 hover:underline">{invoice.invoiceNumber}</Link></td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(invoice.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-slate-500">No invoices for this customer yet.</p>}
      </section>
    </div>
  );
};

export default CustomerDetails;
