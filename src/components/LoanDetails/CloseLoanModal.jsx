const CloseLoanModal = ({ onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4">
      <h3 className="text-2xl font-bold text-white">Close Loan</h3>
      <p className="text-slate-300">Are you sure you want to close this loan? This action cannot be undone.</p>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold transition-all">Close Loan</button>
      </div>
    </div>
  </div>
);

export default CloseLoanModal;
