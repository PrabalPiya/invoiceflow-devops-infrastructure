import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { dateInputValue, formatCurrency } from '../utils/formatters';

const blankItem = { description: '', quantity: 1, unitPrice: 0 };

const today = () => new Date().toISOString().slice(0, 10);
const nextWeek = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
};

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customerId: '',
    invoiceNumber: '',
    issueDate: today(),
    dueDate: nextWeek(),
    status: 'DRAFT',
    tax: 0,
    discount: 0,
    notes: '',
    items: [blankItem]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/customers').then(({ data }) => setCustomers(data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/invoices/${id}`).then(({ data }) => {
      setForm({
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        issueDate: dateInputValue(data.issueDate),
        dueDate: dateInputValue(data.dueDate),
        status: data.status,
        tax: Number(data.tax || 0),
        discount: Number(data.discount || 0),
        notes: data.notes || '',
        items: data.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        })) || [blankItem]
      });
    });
  }, [id, isEdit]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
    const total = Math.max(subtotal + Number(form.tax || 0) - Number(form.discount || 0), 0);
    return { subtotal, total };
  }, [form.items, form.tax, form.discount]);

  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const updateItem = (index, name, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [name]: value };
    updateField('items', items);
  };

  const addItem = () => updateField('items', [...form.items, blankItem]);
  const removeItem = (index) => updateField('items', form.items.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        tax: Number(form.tax || 0),
        discount: Number(form.discount || 0),
        items: form.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0)
        }))
      };

      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
      } else {
        await api.post('/invoices', payload);
      }

      navigate('/invoices');
    } catch (error) {
      setError(error.response?.data?.message || 'Could not save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/invoices" className="text-sm font-semibold text-slate-500">← Back to invoices</Link>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="card grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Customer *</label>
            <select className="input" value={form.customerId} onChange={(e) => updateField('customerId', e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
            {!customers.length && <p className="mt-2 text-xs text-red-600">Add a customer first before creating an invoice.</p>}
          </div>
          <div>
            <label className="label">Invoice Number</label>
            <input className="input" value={form.invoiceNumber} onChange={(e) => updateField('invoiceNumber', e.target.value)} placeholder="Auto generated if empty" />
          </div>
          <div>
            <label className="label">Issue Date *</label>
            <input className="input" type="date" value={form.issueDate} onChange={(e) => updateField('issueDate', e.target.value)} required />
          </div>
          <div>
            <label className="label">Due Date *</label>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} required />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
              {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Invoice Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary">Add Item</button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_120px_160px_110px]">
                <input className="input" placeholder="Description" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} required />
                <input className="input" type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required />
                <input className="input" type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} required />
                <button type="button" onClick={() => removeItem(index)} disabled={form.items.length === 1} className="btn-secondary disabled:opacity-40">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="card grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Tax</label>
            <input className="input" type="number" min="0" step="0.01" value={form.tax} onChange={(e) => updateField('tax', e.target.value)} />
          </div>
          <div>
            <label className="label">Discount</label>
            <input className="input" type="number" min="0" step="0.01" value={form.discount} onChange={(e) => updateField('discount', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-28" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-4 text-right">
            <p className="text-sm text-slate-500">Subtotal: <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</span></p>
            <p className="mt-1 text-xl font-bold text-slate-950">Total: {formatCurrency(totals.total)}</p>
          </div>
        </section>

        <button className="btn-primary" disabled={loading || !customers.length}>{loading ? 'Saving...' : 'Save Invoice'}</button>
      </form>
    </div>
  );
};

export default InvoiceForm;
