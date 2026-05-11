import { Clock, Zap, CheckCircle, Download } from 'lucide-react';

const InterestLedger = ({ interests, nextInterest, onPayInterest, onPrintReceipt }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8 shadow-2xl">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
          <Clock className="text-blue-400" />
          Interest Ledger
        </h2>
        <p className="text-slate-400 font-medium text-sm mt-1">History of interest payments for this loan</p>
      </div>
      {nextInterest && (
        <button
          onClick={() => onPayInterest(nextInterest)}
          className="w-full lg:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black tracking-widest uppercase transition-all duration-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 flex items-center justify-center gap-3"
        >
          <Zap size={20} className="fill-white" />
          Pay Interest for {new Date(nextInterest.due_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
        </button>
      )}
    </div>

    {interests.length > 0 ? (
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full">
          <thead className="bg-slate-900/50 text-slate-400 text-left">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Interest Date</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Amount</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Payment Details</th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {interests.map((interest) => (
              <tr key={interest.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 font-bold text-white">
                  {new Date(interest.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
                </td>
                <td className="px-8 py-6">
                  <span className="text-xl font-black text-emerald-400">₹{(parseFloat(interest.amount) || 0).toLocaleString()}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle size={12} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Paid</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="text-xs font-bold text-slate-300">
                    {interest.payment_date ? new Date(interest.payment_date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '—'}
                  </div>
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    Mode: {interest.payment_mode || 'CASH'}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => onPrintReceipt(interest)}
                    className="p-3 bg-white/5 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl transition-all border border-white/10 hover:border-blue-400 group/print"
                    title="Print Receipt"
                  >
                    <Download size={18} className="group-hover/print:scale-110 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-white/10 border-dashed">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-slate-600" size={32} />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No payment history found</p>
      </div>
    )}
  </div>
);

export default InterestLedger;
