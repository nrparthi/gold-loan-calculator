const PayInterestModal = ({ paymentForm, setPaymentForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4">
      <h3 className="text-2xl font-bold text-white">Pay Interest</h3>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Amount</label>
        <input type="number" value={paymentForm.amount} readOnly className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Paid On</label>
        <input type="date" value={paymentForm.paidDate} onChange={(e) => setPaymentForm(f => ({ ...f, paidDate: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Mode</label>
        <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm(f => ({ ...f, paymentMode: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="CASH">CASH</option>
          <option value="UPI">UPI</option>
          <option value="BANK">BANK</option>
        </select>
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
        <button onClick={onSubmit} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold transition-all">Pay</button>
      </div>
    </div>
  </div>
);

export default PayInterestModal;
