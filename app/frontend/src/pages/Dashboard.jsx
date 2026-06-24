import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const { data } = await api.get('/dashboard/summary');
      setSummary(data);
      setLoading(false);
    };
    fetchSummary().catch(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading dashboard...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Dashboard</h2>
          <p className="text-sm text-slate-500">Overview of your customers, invoices and payments.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">Create Invoice</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Customers" value={summary?.totalCustomers || 0} />
        <StatCard title="Invoices" value={summary?.totalInvoices || 0} />
        <StatCard title="Paid" value={formatCurrency(summary?.totalPaidAmount)} />
        <StatCard title="Unpaid" value={formatCurrency(summary?.totalUnpaidAmount)} />
        <StatCard title="Overdue" value={summary?.overdueInvoices || 0} />
      </div>

      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-950">Recent Invoices</h3>
          <Link to="/invoices" className="text-sm font-semibold text-slate-700">View all</Link>
        </div>

        {summary?.recentInvoices?.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summary.recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="bg-white">
                    <td className="px-4 py-3 font-semibold text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{invoice.customer?.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(invoice.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(invoice.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No invoices yet"
            description="Create your first invoice to see it appear here."
            action={<Link to="/invoices/new" className="btn-primary">Create invoice</Link>}
          />
        )}
      </section>
    </div>
  );
};

export default Dashboard;
