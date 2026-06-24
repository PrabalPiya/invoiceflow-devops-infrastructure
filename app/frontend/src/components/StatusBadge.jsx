const styles = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-50 text-blue-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-zinc-100 text-zinc-600'
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || styles.DRAFT}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
