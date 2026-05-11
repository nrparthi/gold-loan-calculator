import { Scissors } from 'lucide-react';

const PartPaymentModal = ({ loan, partPayForm, setPartPayForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/20 rounded-xl"><Scissors className="text-amber-400" size={22} /></div>
        <div>
          <h3 className="text-xl font-black text-white">Part Payment / Foreclosure</h3>
          <p className="text-slate-400 text-xs mt-0.5">Reduce principal or fully settle the loan</p>
        </div>
      </div>
      <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">Current Balance</span><span className="text-white font-black text-base">₹{(parseFloat(loan.loanAmount) || 0).toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Monthly Interest</span><span className="text-emerald-400 font-bold">₹{(parseFloat(loan.monthlyInterest) || 0).toLocaleString()}</span></div>
        {partPayForm.amount && !partPayForm.isFull && (
          <div className="flex justify-between border-t border-white/5 pt-2">
            <span className="text-slate-400">Remaining After Payment</span>
            <span className="text-amber-400 font-black">₹{Math.max(0, (parseFloat(loan.loanAmount) || 0) - (parseFloat(partPayForm.amount) || 0)).toLocaleString()}</span>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Amount (₹)</label>
        <input type="number" value={partPayForm.amount} placeholder="Enter amount"
          onChange={(e) => setPartPayForm(p => ({ ...p, amount: e.target.value, isFull: false }))}
          disabled={partPayForm.isFull}
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50" />
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={partPayForm.isFull}
          onChange={(e) => setPartPayForm(p => ({ ...p, isFull: e.target.checked, amount: e.target.checked ? (parseFloat(loan.loanAmount) || 0) : p.amount }))}
          className="w-4 h-4 accent-amber-500 rounded" />
        <span className="text-white font-semibold text-sm">Full Foreclosure — settle entire loan amount</span>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Date</label>
          <input type="date" value={partPayForm.paymentDate}
            onChange={(e) => setPartPayForm(p => ({ ...p, paymentDate: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Mode</label>
          <select value={partPayForm.paymentMode}
            onChange={(e) => setPartPayForm(p => ({ ...p, paymentMode: e.target.value }))}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            <option value="CASH">CASH</option>
            <option value="UPI">UPI</option>
            <option value="BANK">BANK</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
        <button onClick={onSubmit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all">Record Payment</button>
      </div>
    </div>
  </div>
);

export default PartPaymentModal;
