import { useState, useEffect } from 'react';
import api, { getErrorMessage } from '../api';
import { useToastContext } from './Toast';
import { Camera, Upload, Edit2, Save, X, Plus, Trash2, FileText, CheckCircle, RefreshCw, Scissors, Printer } from 'lucide-react';
import InterestLedger from './LoanDetails/InterestLedger';
import PartPaymentHistory from './LoanDetails/PartPaymentHistory';
import PayInterestModal from './LoanDetails/PayInterestModal';
import CloseLoanModal from './LoanDetails/CloseLoanModal';
import RenewLoanModal from './LoanDetails/RenewLoanModal';
import PartPaymentModal from './LoanDetails/PartPaymentModal';

const InterestReceipt = ({ receipt, loan, onClose }) => {
  if (!receipt) return null;
  const print = () => {
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`<html><head><title>Interest Receipt</title>
      <style>body{font-family:sans-serif;padding:20px;color:#111}h2{text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#666;font-size:12px;margin-bottom:16px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .label{color:#666}.value{font-weight:bold}.total{font-size:18px;font-weight:900;color:#16a34a;text-align:center;margin-top:16px}
      .footer{text-align:center;font-size:11px;color:#999;margin-top:20px}</style></head>
      <body>
      <h2>Interest Payment Receipt</h2>
      <div class="sub">${new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</div>
      <div class="row"><span class="label">Customer</span><span class="value">${loan.customerName || '—'}</span></div>
      <div class="row"><span class="label">Loan ID</span><span class="value">${loan.id}</span></div>
      <div class="row"><span class="label">Due Date</span><span class="value">${new Date(receipt.dueDate).toLocaleDateString('en-IN')}</span></div>
      <div class="row"><span class="label">Payment Date</span><span class="value">${new Date(receipt.paidDate).toLocaleDateString('en-IN')}</span></div>
      <div class="row"><span class="label">Payment Mode</span><span class="value">${receipt.paymentMode}</span></div>
      <div class="total">₹${parseFloat(receipt.amount).toLocaleString('en-IN')} Received</div>
      <div class="footer">Thank you for your payment</div>
      </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mx-auto mb-4">
          <CheckCircle className="text-emerald-400" size={32} />
        </div>
        <h2 className="text-white font-black text-2xl text-center mb-1">Payment Recorded</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Interest payment successfully saved</p>
        <div className="space-y-3 mb-6">
          {[['Customer', loan.customerName],['Loan ID', loan.id],['Amount Paid', `₹${parseFloat(receipt.amount).toLocaleString('en-IN')}`],['Payment Mode', receipt.paymentMode],['Payment Date', new Date(receipt.paidDate).toLocaleDateString('en-IN')]].map(([k,v]) => (
            <div key={k} className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-sm">{k}</span>
              <span className="text-white font-bold text-sm">{v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={print} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all">
            <Printer size={16} /> Print Receipt
          </button>
          <button onClick={onClose} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all">Done</button>
        </div>
      </div>
    </div>
  );
};


const LoanDetails = ({ loan, onUpdateLoan, onRenewLoan, autoPayInterest = false }) => {
  const { showError, showSuccess } = useToastContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(loan);
  const [ornaments, setOrnaments] = useState(loan.ornaments || []);
  const [paymentMode, setPaymentMode] = useState(loan.paymentMode || 'CASH');
  const [showPayInterest, setShowPayInterest] = useState(false);
  const [showCloseLoan, setShowCloseLoan] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paidDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH' });
  const [monthlyInterests, setMonthlyInterests] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [partPayments, setPartPayments] = useState([]);
  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({ renewalDate: new Date().toISOString().split('T')[0], loanAmount: loan.loanAmount || '', interestRate: loan.interestRate || '' });
  const [showPartPayment, setShowPartPayment] = useState(false);
  const [partPayForm, setPartPayForm] = useState({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH', isFull: false });

  useEffect(() => {
    if (!loan.id) return;
    Promise.all([
      api.get(`/loans/${loan.id}/interests`),
      api.get(`/loans/${loan.id}/part-payments`),
    ]).then(([interestsRes, partPayRes]) => {
      setMonthlyInterests(interestsRes.data);
      setPartPayments(partPayRes.data);
      if (autoPayInterest) {
        const sorted = [...interestsRes.data].filter(i => i.status === 'paid').sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        const lastDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].due_date) : new Date(loan.loanDate || new Date());
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        setPaymentForm(f => ({ ...f, amount: loan.monthlyInterest || 0, dueDate: nextDate.toISOString().split('T')[0] }));
        setShowPayInterest(true);
      }
    }).catch(err => showError(getErrorMessage(err)));
  }, [loan.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrnamentChange = (index, field, value) => {
    const updated = [...ornaments];
    updated[index][field] = ['quantity', 'grossWt', 'netWt', 'ratePerGram', 'purity'].includes(field)
      ? parseFloat(value) || 0
      : value;
    if (['netWt', 'ratePerGram', 'purity'].includes(field)) {
      const purity = updated[index].purity || 1000;
      updated[index].value = updated[index].netWt * updated[index].ratePerGram * (purity / 1000);
    }
    setOrnaments(updated);
  };

  const addOrnament = () => {
    setOrnaments([...ornaments, { type: 'CHAIN', specification: '', quantity: 1, grossWt: 0, netWt: 0, ratePerGram: 8000, purity: 916, value: 0 }]);
  };

  const removeOrnament = (index) => {
    setOrnaments(ornaments.filter((_, i) => i !== index));
  };

  const handlePayInterest = (interest) => {
    setPaymentForm({ 
      amount: interest.amount, 
      dueDate: interest.due_date,
      paidDate: new Date().toISOString().split('T')[0], 
      paymentMode: 'CASH' 
    });
    setShowPayInterest(true);
  };

  const submitPayment = async () => {
    try {
      await api.post(`/interests/record`, {
        loanId: loan.id,
        dueDate: paymentForm.dueDate,
        amount: paymentForm.amount,
        paymentDate: paymentForm.paidDate,
        paymentMode: paymentForm.paymentMode
      });
      
      // Refresh monthly interests from server to get new ID if needed, 
      // or just add to local state
      const newPayment = {
        id: Date.now().toString(), // temporary id
        due_date: paymentForm.dueDate,
        amount: paymentForm.amount,
        paid_amount: paymentForm.amount,
        payment_date: paymentForm.paidDate,
        payment_mode: paymentForm.paymentMode,
        status: 'paid'
      };

      setMonthlyInterests(prev => [...prev, newPayment]);
      onUpdateLoan({ ...loan, totalInterestPaid: (parseFloat(loan.totalInterestPaid) || 0) + parseFloat(paymentForm.amount) });
      setShowPayInterest(false);
      setReceiptData({ amount: paymentForm.amount, dueDate: paymentForm.dueDate, paidDate: paymentForm.paidDate, paymentMode: paymentForm.paymentMode });
      showSuccess('Interest payment recorded');
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const submitCloseLoan = () => {
    onUpdateLoan({ status: 'closed', closedDate: new Date().toISOString().split('T')[0] });
    setShowCloseLoan(false);
  };

  const submitRenew = async () => {
    const newLoanAmount = parseFloat(renewForm.loanAmount);
    const newInterestRate = parseFloat(renewForm.interestRate);
    if (!newLoanAmount || newLoanAmount <= 0) { showError('Enter a valid loan amount'); return; }
    if (!newInterestRate || newInterestRate <= 0) { showError('Enter a valid interest rate'); return; }
    try {
      const res = await api.post(`/loans/${loan.id}/renew`, {
        renewalDate: renewForm.renewalDate,
        loanAmount: newLoanAmount,
        interestRate: newInterestRate
      });
      setShowRenew(false);
      showSuccess('Loan renewed successfully');
      if (onRenewLoan) onRenewLoan(res.data.newLoanId);
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const submitPartPayment = async () => {
    const amount = parseFloat(partPayForm.amount);
    if (!amount || amount <= 0) { showError('Enter a valid amount'); return; }
    const currentLoanAmount = parseFloat(loan.loanAmount) || 0;
    if (amount > currentLoanAmount) { showError('Amount cannot exceed current loan balance'); return; }
    try {
      const res = await api.post(`/loans/${loan.id}/part-payment`, {
        amount,
        paymentDate: partPayForm.paymentDate,
        paymentMode: partPayForm.paymentMode,
        isFull: partPayForm.isFull || amount >= currentLoanAmount
      });
      const d = res.data;
      onUpdateLoan({ ...loan, loanAmount: d.loanAmount, amountGiven: d.amountGiven, monthlyInterest: d.monthlyInterest, status: d.status });
      setPartPayments(prev => [...prev, {
        id: Date.now().toString(),
        loan_id: loan.id,
        amount: amount,
        payment_date: partPayForm.paymentDate,
        payment_mode: partPayForm.paymentMode,
        balance_after: d.loanAmount,
        is_foreclosure: partPayForm.isFull || amount >= (parseFloat(loan.loanAmount) || 0)
      }]);
      setShowPartPayment(false);
      setPartPayForm({ amount: '', paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH', isFull: false });
      showSuccess('Part payment recorded');
    } catch (err) {
      showError(getErrorMessage(err));
    }
  };

  const handlePhotoUpload = async (e, field, index = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);

    if (index !== null) {
      setOrnaments(prev => { const u = [...prev]; u[index] = { ...u[index], photo: previewUrl }; return u; });
    } else {
      setFormData(prev => ({ ...prev, [field]: previewUrl }));
    }

    try {
      const photoTypeMap = { customerPhoto: 'customer', aadharPhoto: 'aadhar', ornamentPhoto: 'ornament' };
      const params = new URLSearchParams({
        customerId: loan.customerId || loan.guardianName || 'unknown',
        photoType: index !== null ? 'ornament' : (photoTypeMap[field] || field),
        loanId: loan.id,
        branchId: loan.branchId || ''
      });
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post(`/upload?${params}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (index !== null) {
        setOrnaments(prev => { const u = [...prev]; u[index] = { ...u[index], photo: res.data.url }; return u; });
      } else {
        setFormData(prev => ({ ...prev, [field]: res.data.url }));
      }
    } catch (err) {
      console.error('Photo upload error:', err);
    }
  };

  const handleSave = () => {
    onUpdateLoan({
      ...formData,
      ornaments,
      loanAmount: totalOrnamentValue,
      paymentMode: formData.paymentMode,
      bankName: formData.bankName,
      bankLoanNumber: formData.bankLoanNumber,
      area: formData.area
    });
    setIsEditing(false);
  };

  const ornamentTypes = ['CHAIN', 'RING', 'AARAM', 'NECKLES', 'BANGLES'];
  const totalOrnamentValue = ornaments.reduce((sum, o) => sum + o.value, 0);
  const processingFee = formData.processingFee || 0;
  const monthlyInt = parseFloat(loan.monthlyInterest || 0);
  const amountToGive = parseFloat(loan.amountGiven) || (totalOrnamentValue - processingFee - monthlyInt);
  
  // Filter interests to show only paid months in history
  const getFilteredInterests = () => {
    return [...monthlyInterests]
      .filter(i => i.status === 'paid')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  };

  const filteredInterests = getFilteredInterests();

  // Calculate Next Due Interest
  const getNextInterest = () => {
    if (loan.status === 'closed') return null;
    
    const sortedPaid = [...monthlyInterests]
      .filter(i => i.status === 'paid')
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    let nextDate;
    if (sortedPaid.length > 0) {
      const lastDate = new Date(sortedPaid[sortedPaid.length - 1].due_date);
      nextDate = new Date(lastDate);
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate = new Date(loan.loanDate || new Date());
    }

    return {
      due_date: nextDate.toISOString().split('T')[0],
      amount: loan.monthlyInterest || 0
    };
  };

  const nextInterest = getNextInterest();

  // Check if paying correctly
  const isPayingCorrectly = () => {
    const now = new Date();
    const pastDueUnpaid = monthlyInterests.some(i => {
      const dueDate = new Date(i.due_date);
      return dueDate < now && i.status !== 'paid';
    });
    return !pastDueUnpaid;
  };

  const handlePrintInterestReceipt = (interest) => {
    const filename = `Interest-${loan.id}-${interest.id}`;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const content = `
      <html>
        <head>
          <title>${filename}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Outfit', sans-serif; padding: 40px; }
            .receipt-card { border: 2px solid #000; padding: 30px; border-radius: 20px; }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="flex justify-between items-center mb-8 border-b pb-4">
              <div>
                <h1 class="text-2xl font-black uppercase">LoanVault Financials</h1>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Interest Payment Receipt</p>
              </div>
              <div class="text-right">
                <p class="text-xl font-black text-blue-600">#INT-${interest.id}</p>
                <p class="text-[10px] text-slate-500">${new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
                <p class="font-bold">${loan.customerName}</p>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase">Loan Reference</p>
                <p class="font-bold">${loan.id}</p>
              </div>
            </div>

            <div class="bg-slate-50 p-6 rounded-xl mb-8">
              <div class="flex justify-between mb-4 border-b pb-2">
                <span class="font-semibold text-slate-600">Interest Due Date</span>
                <span class="font-bold">${new Date(interest.due_date).toLocaleDateString()}</span>
              </div>
              <div class="flex justify-between mb-4 border-b pb-2">
                <span class="font-semibold text-slate-600">Paid Amount</span>
                <span class="text-xl font-black text-green-600">₹${interest.paid_amount || interest.amount}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-semibold text-slate-600">Payment Mode</span>
                <span class="font-bold uppercase">${interest.payment_mode || 'CASH'}</span>
              </div>
            </div>

            <div class="flex justify-between items-end mt-12">
              <div class="text-center">
                <div class="w-32 border-b border-slate-300 mb-1"></div>
                <p class="text-[8px] font-bold uppercase">Customer Sign</p>
              </div>
              <div class="text-center">
                <div class="w-32 border-b border-slate-300 mb-1"></div>
                <p class="text-[8px] font-bold uppercase">Authorized Sign</p>
              </div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      <InterestReceipt receipt={receiptData} loan={loan} onClose={() => setReceiptData(null)} />
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText size={40} />
                Loan Details
                {isPayingCorrectly() ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest ml-4">
                    On Track ✓
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest ml-4">
                    Payments Delayed ⚠
                  </span>
                )}
              </h1>
              <p className="text-indigo-100 text-lg">Loan ID: <span className="font-bold">#{loan.id}</span></p>
            </div>
            {loan.status !== 'closed' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
              >
                {isEditing ? <X size={20} /> : <Edit2 size={20} />}
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Information Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">1</div>
          Customer Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Customer ID (Aadhaar/PAN)</label>
            <input
              type="text"
              name="customerId"
              value={formData.customerId}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Loan Date</label>
            <input
              type="date"
              name="loanDate"
              value={formData.loanDate ? new Date(formData.loanDate).toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' }) : ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* Ornament Details Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">2</div>
            Ornament Details
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={addOrnament}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all duration-300 shadow-lg"
            >
              <Plus size={18} /> Add another Ornament
            </button>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {ornaments.map((ornament, index) => (
            <div key={index} className="flex flex-col lg:flex-row gap-3 items-end bg-slate-700/30 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-all duration-300">
              <select
                value={ornament.type}
                onChange={(e) => handleOrnamentChange(index, 'type', e.target.value)}
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ornamentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="text"
                placeholder="Specification"
                value={ornament.specification}
                onChange={(e) => handleOrnamentChange(index, 'specification', e.target.value)}
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Qty"
                value={ornament.quantity}
                onChange={(e) => handleOrnamentChange(index, 'quantity', e.target.value)}
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Gross wt."
                value={ornament.grossWt}
                onChange={(e) => handleOrnamentChange(index, 'grossWt', e.target.value)}
                step="0.1"
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Net wt."
                value={ornament.netWt}
                onChange={(e) => handleOrnamentChange(index, 'netWt', e.target.value)}
                step="0.1"
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Rate/gram"
                value={ornament.ratePerGram}
                onChange={(e) => handleOrnamentChange(index, 'ratePerGram', e.target.value)}
                disabled={!isEditing}
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <input
                type="number"
                placeholder="Purity"
                value={ornament.purity ?? 916}
                onChange={(e) => handleOrnamentChange(index, 'purity', e.target.value)}
                disabled={!isEditing}
                title="Purity (e.g. 916 for 22k, 750 for 18k)"
                className="flex-1 px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <span className="font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent text-lg lg:min-w-fit">₹{ornament.value.toLocaleString()}</span>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => removeOrnament(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-all duration-300"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Photo Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/10">
          {/* Customer Photo */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Customer Photo</label>
            <div className="w-24 h-24 rounded-xl bg-slate-700/50 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden mb-3">
              {formData.customerPhoto
                ? <img src={formData.customerPhoto} alt="Customer" className="w-full h-full object-cover" />
                : <div className="text-slate-400 text-3xl">👤</div>}
            </div>
            {isEditing && (
              <label className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 text-white rounded-lg hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm">
                <Upload size={16} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'customerPhoto')} />
              </label>
            )}
          </div>

          {/* Aadhar Photo */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Aadhar Photo</label>
            <div className="w-24 h-24 rounded-xl bg-slate-700/50 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden mb-3">
              {formData.aadharPhoto
                ? <img src={formData.aadharPhoto} alt="Aadhar" className="w-full h-full object-cover" />
                : <FileText className="text-slate-400" size={32} />}
            </div>
            {isEditing && (
              <label className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 text-white rounded-lg hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm">
                <Upload size={16} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'aadharPhoto')} />
              </label>
            )}
          </div>

          {/* Ornament Photos — one per ornament */}
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Ornament Photos</label>
            <div className="flex flex-wrap gap-2">
              {ornaments.map((ornament, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div className="w-20 h-20 rounded-xl bg-slate-700/50 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                    {ornament.photo
                      ? <img src={ornament.photo} alt={`Ornament ${index + 1}`} className="w-full h-full object-cover" />
                      : <Camera className="text-slate-400" size={24} />}
                  </div>
                  <span className="text-slate-500 text-[10px] truncate max-w-[5rem]">{ornament.type || `#${index + 1}`}</span>
                  {isEditing && (
                    <label className="w-full px-2 py-1 bg-slate-700/50 border border-white/10 text-white rounded-lg hover:border-white/20 transition-all flex items-center justify-center gap-1 cursor-pointer text-xs">
                      <Upload size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'ornamentPhoto', index)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Details — always visible */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">3</div>
            Bank Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Bank Name</label>
              <input type="text" name="bankName" value={formData.bankName || ''} onChange={handleInputChange} disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Bank Loan No.</label>
              <input type="text" name="bankLoanNumber" value={formData.bankLoanNumber || ''} onChange={handleInputChange} disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Area</label>
              <input type="text" name="area" value={formData.area || ''} onChange={handleInputChange} disabled={!isEditing}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Amount Bank Gave (₹)</label>
              <input type="number" name="bankAmount" value={formData.bankAmount || ''} onChange={handleInputChange} disabled={!isEditing}
                placeholder="0"
                className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Amount Settled to Bank (₹)</label>
              <input type="number" name="bankSettledAmount" value={formData.bankSettledAmount || ''} onChange={handleInputChange} disabled={!isEditing}
                placeholder="0"
                className={`w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold">Bank Balance Outstanding</label>
              <div className={`w-full px-4 py-2.5 bg-slate-900/50 border border-white/5 rounded-xl font-black ${(parseFloat(formData.bankAmount || 0) - parseFloat(formData.bankSettledAmount || 0)) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ₹{Math.max(0, (parseFloat(formData.bankAmount || 0) - parseFloat(formData.bankSettledAmount || 0))).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <label className="block text-sm font-semibold text-slate-300 mb-3">Payment mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="CASH"
                checked={paymentMode === 'CASH'}
                onChange={(e) => setPaymentMode(e.target.value)}
                disabled={!isEditing}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-white">CASH</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="UPI"
                checked={paymentMode === 'UPI'}
                onChange={(e) => setPaymentMode(e.target.value)}
                disabled={!isEditing}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-white">UPI</span>
            </label>
          </div>
        </div>
      </div>

      <InterestLedger
        interests={filteredInterests}
        nextInterest={nextInterest}
        onPayInterest={handlePayInterest}
        onPrintReceipt={handlePrintInterestReceipt}
      />

      <PartPaymentHistory partPayments={partPayments} />


      {/* Loan Amount Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Loan Amount</p>
          <p className="text-3xl font-bold text-blue-400">₹{totalOrnamentValue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Processing Fee</p>
          <p className="text-3xl font-bold text-orange-400">₹{(parseFloat(processingFee) || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Amount Given</p>
          <p className="text-3xl font-bold text-green-400">₹{amountToGive.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Interest Rate</p>
          <p className="text-3xl font-bold text-purple-400">{parseFloat(loan.interestRate || formData.interestRate || 0).toFixed(2)}%</p>
          <p className="text-slate-500 text-xs mt-1">per month</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Monthly Interest</p>
          <p className="text-3xl font-bold text-yellow-400">₹{(parseFloat(loan.monthlyInterest) || 0).toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-rose-500/30 p-5">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Balance</p>
          <p className="text-3xl font-bold text-rose-400">₹{(parseFloat(loan.loanAmount) || 0).toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">outstanding principal</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end flex-wrap">
          {!isEditing && loan.status !== 'closed' && (
            <>
              <button
                onClick={() => setShowRenew(true)}
                className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <RefreshCw size={18} /> Renew Loan
              </button>
              <button
                onClick={() => setShowPartPayment(true)}
                className="px-6 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
              >
                <Scissors size={18} /> Part Payment
              </button>
              <button
                onClick={() => setShowCloseLoan(true)}
                className="px-8 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all duration-300"
              >
                Close Loan
              </button>
            </>
          )}
          {loan.status !== 'closed' && (
            <>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all duration-300"
                >
                  Cancel
                </button>
              )}
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Save size={20} /> Save changes
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Edit2 size={20} /> Edit Details
                </button>
              )}
            </>
          )}
        </div>

      {showPayInterest && (
        <PayInterestModal
          paymentForm={paymentForm}
          setPaymentForm={setPaymentForm}
          onSubmit={submitPayment}
          onClose={() => setShowPayInterest(false)}
        />
      )}

      {showCloseLoan && (
        <CloseLoanModal
          onConfirm={submitCloseLoan}
          onClose={() => setShowCloseLoan(false)}
        />
      )}

      {showRenew && (
        <RenewLoanModal
          loan={loan}
          renewForm={renewForm}
          setRenewForm={setRenewForm}
          onConfirm={submitRenew}
          onClose={() => setShowRenew(false)}
        />
      )}

      {showPartPayment && (
        <PartPaymentModal
          loan={loan}
          partPayForm={partPayForm}
          setPartPayForm={setPartPayForm}
          onSubmit={submitPartPayment}
          onClose={() => setShowPartPayment(false)}
        />
      )}
    </div>
  );
};

export default LoanDetails;
