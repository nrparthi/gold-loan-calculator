import { Scissors } from 'lucide-react';

const PartPaymentHistory = ({ partPayments }) => {
  if (!partPayments.length) return null;
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-amber-500/20 p-6 lg:p-8 shadow-xl">
      <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-6">
        <Scissors className="text-amber-400" size={24} />
        Principal Payment History
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full">
          <thead className="bg-slate-900/50 text-slate-400 text-left">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">#</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Payment Date</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Amount Paid</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Balance After</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Mode</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {partPayments.map((p, i) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 text-slate-500 font-bold text-sm">{i + 1}</td>
                <td className="px-6 py-5 text-white font-bold">
                  {p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'}
                </td>
                <td className="px-6 py-5">
                  <span className="text-lg font-black text-amber-400">₹{(parseFloat(p.amount) || 0).toLocaleString()}</span>
                </td>
                <td className="px-6 py-5 font-bold text-slate-300">₹{(parseFloat(p.balance_after) || 0).toLocaleString()}</td>
                <td className="px-6 py-5 text-slate-400 font-bold text-sm uppercase">{p.payment_mode || 'CASH'}</td>
                <td className="px-6 py-5">
                  {p.is_foreclosure
                    ? <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">Foreclosure</span>
                    : <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">Part Payment</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartPaymentHistory;
