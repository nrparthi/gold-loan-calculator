import { RefreshCw } from 'lucide-react';

const RenewLoanModal = ({ loan, renewForm, setRenewForm, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-500/20 rounded-xl"><RefreshCw className="text-indigo-400" size={22} /></div>
        <div>
          <h3 className="text-xl font-black text-white">Renew Loan</h3>
          <p className="text-slate-400 text-xs mt-0.5">Resets loan date and clears pending interest</p>
        </div>
      </div>
      <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Customer</span><span className="text-white font-bold">{loan.customerName}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Current Loan Date</span><span className="text-white font-bold">{loan.loanDate ? new Date(loan.loanDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}</span></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Loan Amount (₹)</label>
          <input type="number" value={renewForm.loanAmount}
            onChange={(e) => setRenewForm(f => ({ ...f, loanAmount: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Interest Rate (%)</label>
          <input type="number" step="0.01" value={renewForm.interestRate}
            onChange={(e) => setRenewForm(f => ({ ...f, interestRate: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-slate-400 text-sm">New Monthly Interest</span>
        <span className="text-indigo-300 font-black text-lg">
          ₹{((parseFloat(renewForm.loanAmount) || 0) * (parseFloat(renewForm.interestRate) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Renewal Date</label>
        <input type="date" value={renewForm.renewalDate}
          onChange={(e) => setRenewForm(f => ({ ...f, renewalDate: e.target.value }))}
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <p className="text-amber-400/80 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
        ⚠ All unpaid interest records will be cleared and a fresh cycle begins from the renewal date.
      </p>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all">Confirm Renewal</button>
      </div>
    </div>
  </div>
);

export default RenewLoanModal;
