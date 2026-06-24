import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Settings</h2>
        <p className="text-sm text-slate-500">Basic account and local environment information.</p>
      </div>

      <section className="card space-y-4">
        <h3 className="text-lg font-bold text-slate-950">Account</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="font-semibold text-slate-900">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="font-semibold text-slate-900">{user?.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
