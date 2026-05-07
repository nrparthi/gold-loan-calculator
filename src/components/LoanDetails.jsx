import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Camera, Upload, Edit2, Save, X, Plus, Trash2, Eye, FileText, Clock, Zap, CheckCircle, Download } from 'lucide-react';

const LoanDetails = ({ loan, onUpdateLoan }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(loan);
  const [ornaments, setOrnaments] = useState(loan.ornaments || []);
  const [paymentMode, setPaymentMode] = useState(loan.paymentMode || 'CASH');
  const [showPayInterest, setShowPayInterest] = useState(false);
  const [showCloseLoan, setShowCloseLoan] = useState(false);
  const [selectedInterestId, setSelectedInterestId] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paidDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH' });
  const [monthlyInterests, setMonthlyInterests] = useState([]);
  const [loadingInterests, setLoadingInterests] = useState(false);

  useEffect(() => {
    const fetchInterests = async () => {
      setLoadingInterests(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/loans/${loan.id}/interests`);
        setMonthlyInterests(response.data);
      } catch (err) {
        console.error('Error fetching interests:', err);
      } finally {
        setLoadingInterests(false);
      }
    };
    if (loan.id) fetchInterests();
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
    setSelectedInterestId(interest.id);
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
      
      // Use record endpoint for dynamic payments
      const response = await axios.post(`${apiUrl}/interests/record`, {
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
      
      onUpdateLoan({ 
        ...loan, 
        totalInterestPaid: (parseFloat(loan.totalInterestPaid) || 0) + parseFloat(paymentForm.amount) 
      });
      setShowPayInterest(false);
    } catch (err) {
      console.error('Error paying interest:', err);
      alert('Failed to record payment');
    }
  };

  const submitCloseLoan = () => {
    onUpdateLoan({ status: 'closed', closedDate: new Date().toISOString().split('T')[0] });
    setShowCloseLoan(false);
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
  const amountToGive = totalOrnamentValue - processingFee - monthlyInt;
  
  const totalInterestPaid = monthlyInterests.filter(i => i.status === 'paid').reduce((sum, i) => sum + (parseFloat(i.paid_amount) || 0), 0);
  const totalInterestDue = monthlyInterests.reduce((sum, i) => sum + parseFloat(i.amount), 0);

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
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              {isEditing ? <X size={20} /> : <Edit2 size={20} />}
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
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
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Bank Details</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Loan Amount Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Loan Amount</p>
          <p className="text-4xl font-bold text-blue-400">₹{totalOrnamentValue.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Processing Fee</p>
          <p className="text-4xl font-bold text-orange-400">₹{processingFee}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Amount Given</p>
          <p className="text-4xl font-bold text-green-400">₹{(loan.amountGiven || amountToGive).toLocaleString()}</p>
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
              Pay Interest for {new Date(nextInterest.due_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
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
                      {new Date(interest.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                        {interest.payment_date ? new Date(interest.payment_date).toLocaleDateString('en-GB') : '—'}
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

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <button className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          <Eye size={20} /> Preview Bill
        </button>
        <div className="flex gap-4 justify-end flex-wrap">
          {!isEditing && loan.status !== 'closed' && (
            <button
              onClick={() => setShowCloseLoan(true)}
              className="px-8 py-3 border border-white/10 text-white rounded-lg hover:bg-white/5 font-semibold transition-all duration-300"
            >
              Close Loan
            </button>
          )}
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
        </div>
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
    </div>
  );
};

export default LoanDetails;
