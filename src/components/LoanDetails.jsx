import { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, Edit2, Save, X, Plus, Trash2, FileText, Clock, Zap, CheckCircle, Download, RefreshCw, Scissors, Printer } from 'lucide-react';

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


const LoanDetails = ({ loan, onUpdateLoan, onRenewLoan }) => {
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
    const apiUrl = import.meta.env.VITE_API_URL;
    axios.get(`${apiUrl}/loans/${loan.id}/interests`)
      .then(r => setMonthlyInterests(r.data))
      .catch(err => console.error('Error fetching interests:', err));
    axios.get(`${apiUrl}/loans/${loan.id}/part-payments`)
      .then(r => setPartPayments(r.data))
      .catch(() => {});
  }, [loan.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrnamentChange = (index, field, value) => {
    const updated = [...ornaments];
    updated[index][field] = field === 'quantity' || field === 'grossWt' || field === 'netWt' || field === 'ratePerGram'
      ? parseFloat(value) || 0
      : value;
    if (['netWt', 'ratePerGram'].includes(field)) {
      updated[index].value = updated[index].netWt * updated[index].ratePerGram;
    }
    setOrnaments(updated);
  };

  const addOrnament = () => {
    setOrnaments([...ornaments, { type: 'CHAIN', specification: '', quantity: 1, grossWt: 0, netWt: 0, ratePerGram: 8000, value: 0 }]);
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
      const apiUrl = import.meta.env.VITE_API_URL;
      
      await axios.post(`${apiUrl}/interests/record`, {
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
    } catch (err) {
      console.error('Error paying interest:', err);
      alert('Failed to record payment');
    }
  };

  const submitCloseLoan = () => {
    onUpdateLoan({ status: 'closed', closedDate: new Date().toISOString().split('T')[0] });
    setShowCloseLoan(false);
  };

  const submitRenew = async () => {
    const newLoanAmount = parseFloat(renewForm.loanAmount);
    const newInterestRate = parseFloat(renewForm.interestRate);
    if (!newLoanAmount || newLoanAmount <= 0) { alert('Enter a valid loan amount'); return; }
    if (!newInterestRate || newInterestRate <= 0) { alert('Enter a valid interest rate'); return; }
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiUrl}/loans/${loan.id}/renew`, {
        renewalDate: renewForm.renewalDate,
        loanAmount: newLoanAmount,
        interestRate: newInterestRate
      });
      setShowRenew(false);
      if (onRenewLoan) onRenewLoan(res.data.newLoanId);
    } catch (err) {
      console.error('Renewal error:', err);
      alert('Failed to renew loan');
    }
  };

  const submitPartPayment = async () => {
    const amount = parseFloat(partPayForm.amount);
    if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
    const currentLoanAmount = parseFloat(loan.loanAmount) || 0;
    if (amount > currentLoanAmount) { alert('Amount cannot exceed current loan balance'); return; }
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.post(`${apiUrl}/loans/${loan.id}/part-payment`, {
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
    } catch (err) {
      console.error('Part payment error:', err);
      alert('Failed to record payment');
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
      const apiUrl = import.meta.env.VITE_API_URL;
      const photoTypeMap = { customerPhoto: 'customer', aadharPhoto: 'aadhar', ornamentPhoto: 'ornament' };
      const params = new URLSearchParams({
        customerId: loan.customerId || loan.guardianName || 'unknown',
        photoType: index !== null ? 'ornament' : (photoTypeMap[field] || field),
        loanId: loan.id,
        branchId: loan.branchId || ''
      });
      const fd = new FormData();
      fd.append('photo', file);
      const res = await axios.post(`${apiUrl}/upload?${params}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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

      {/* Interest Section */}
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
              onClick={() => handlePayInterest(nextInterest)}
              className="w-full lg:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black tracking-widest uppercase transition-all duration-500 shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)] active:scale-95 flex items-center justify-center gap-3 animate-shimmer"
            >
              <Zap size={20} className="fill-white" />
              Pay Interest for {new Date(nextInterest.due_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
            </button>
          )}
        </div>

        {filteredInterests.length > 0 ? (
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
                {filteredInterests.map((interest) => (
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
                        onClick={() => handlePrintInterestReceipt(interest)}
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

      {/* Part Payment History */}
      {partPayments.length > 0 && (
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
                    <td className="px-6 py-5 font-bold text-slate-300">
                      ₹{(parseFloat(p.balance_after) || 0).toLocaleString()}
                    </td>
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
      )}


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

      {/* Pay Interest Modal */}
      {showPayInterest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4">
            <h3 className="text-2xl font-bold text-white">Pay Interest</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Amount</label>
              <input type="number" value={paymentForm.amount} readOnly className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Paid On</label>
              <input type="date" value={paymentForm.paidDate} onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Mode</label>
              <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="BANK">BANK</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowPayInterest(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
              <button onClick={submitPayment} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold transition-all">Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Loan Modal */}
      {showCloseLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-4">
            <h3 className="text-2xl font-bold text-white">Close Loan</h3>
            <p className="text-slate-300">Are you sure you want to close this loan? This action cannot be undone.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowCloseLoan(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
              <button onClick={submitCloseLoan} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold transition-all">Close Loan</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Loan Modal */}
      {showRenew && (
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
              <button onClick={() => setShowRenew(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
              <button onClick={submitRenew} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all">Confirm Renewal</button>
            </div>
          </div>
        </div>
      )}

      {/* Part Payment / Foreclosure Modal */}
      {showPartPayment && (
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
                  <span className="text-amber-400 font-black">
                    ₹{Math.max(0, (parseFloat(loan.loanAmount) || 0) - (parseFloat(partPayForm.amount) || 0)).toLocaleString()}
                  </span>
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
              <button onClick={() => setShowPartPayment(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all">Cancel</button>
              <button onClick={submitPartPayment} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all">
                {partPayForm.isFull ? 'Foreclose Loan' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;
