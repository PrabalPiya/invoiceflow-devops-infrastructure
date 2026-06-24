import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  address: ''
};

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/customers/${id}`).then(({ data }) => {
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        companyName: data.companyName || '',
        address: data.address || ''
      });
    });
  }, [id, isEdit]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, form);
      } else {
        await api.post('/customers', form);
      }
      navigate('/customers');
    } catch (error) {
      setError(error.response?.data?.message || 'Could not save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/customers" className="text-sm font-semibold text-slate-500">← Back to customers</Link>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{isEdit ? 'Edit Customer' : 'Add Customer'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="label">Name *</label>
          <input className="input" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" name="phone" value={form.phone} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label">Company Name</label>
          <input className="input" name="companyName" value={form.companyName} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input min-h-28" name="address" value={form.address} onChange={handleChange} />
        </div>
        <button className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Customer'}</button>
      </form>
    </div>
  );
};

export default CustomerForm;
