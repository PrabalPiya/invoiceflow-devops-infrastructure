import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await api.get('/customers', { params: { search } });
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers().catch(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer? Their invoices will also be deleted.')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Customers</h2>
          <p className="text-sm text-slate-500">Manage the people and companies you bill.</p>
        </div>
        <Link to="/customers/new" className="btn-primary">Add Customer</Link>
      </div>

      <input className="input max-w-md" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {loading ? <p className="text-sm text-slate-500">Loading customers...</p> : customers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <div key={customer.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link to={`/customers/${customer.id}`} className="text-lg font-bold text-slate-950 hover:underline">{customer.name}</Link>
                  <p className="text-sm text-slate-500">{customer.companyName || 'No company'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {customer._count?.invoices || 0} invoices
                </span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>{customer.email || 'No email'}</p>
                <p>{customer.phone || 'No phone'}</p>
              </div>
              <div className="mt-5 flex gap-2">
                <Link to={`/customers/${customer.id}/edit`} className="btn-secondary flex-1">Edit</Link>
                <button onClick={() => handleDelete(customer.id)} className="btn-secondary flex-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No customers found"
          description="Add a customer before creating invoices."
          action={<Link to="/customers/new" className="btn-primary">Add customer</Link>}
        />
      )}
    </div>
  );
};

export default Customers;
