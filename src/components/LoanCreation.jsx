import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, AlertCircle, Sparkles, Check, Edit2, FileText, X, Camera, User, Gem, Coins } from 'lucide-react';

const LoanCreation = ({ onAddLoan, onPreviewBill, defaultInterestRate = 1.5, currentBranch }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '', // Renamed from guardianName
    address: '',
    gender: 'M',
    loanDate: new Date().toISOString().split('T')[0],
    loanTime: new Date().toTimeString().slice(0, 8),
    ornamentCategory: 'GOLD',
    interestRate: defaultInterestRate,
    processingFee: 0,
    paymentMode: 'CASH',
    manualLoanAmount: '',
    ornamentPhoto: null,
    customerPhoto: null,
    aadharPhoto: null,
    ornaments: [{ type: '', specification: '', quantity: 1, grossWt: 0, netWt: 0, ratePerGram: 0, value: 0, photo: null }]
  });

  const [customerStatus, setCustomerStatus] = useState(null); // 'existing' or 'new'

  const fetchCustomerDetails = async (phone) => {
    if (phone.length === 10) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await axios.get(`${apiUrl}/customers/${phone}`);
        if (response.data) {
          setFormData(prev => ({
            ...prev,
            customerName: response.data.customer_name || '',
            customerId: response.data.customer_id || '',
            address: response.data.address || '',
            gender: response.data.gender || 'M',
            customerPhoto: response.data.customer_photo || null,
            aadharPhoto: response.data.aadhar_photo || null
          }));
          setCustomerStatus('existing');
          
          // Clear validation errors for auto-filled fields
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.customerName;
            delete newErrors.customerPhone;
            delete newErrors.address;
            return newErrors;
          });
        }
      } catch (err) {
        // New Customer detected - Reset all fields except phone
        const newId = `C-${Date.now().toString().slice(-4)}${Math.random().toString(36).substring(2, 3).toUpperCase()}`;
        setFormData(prev => ({
          ...prev,
          customerName: '',
          customerId: newId,
          address: '',
          customerPhoto: null,
          aadharPhoto: null,
          gender: 'M'
        }));
        setCustomerStatus('new');

        // Clear phone error as it is now a valid 10-digit number
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.customerPhone;
          return newErrors;
        });
      }
    }
  };

  const [errors, setErrors] = useState({});
  const [ornamentConfigs, setOrnamentConfigs] = useState([]);
  const [branchRates, setBranchRates] = useState({ goldRate: 0, silverRate: 0 });
  const [nextLoanNumber, setNextLoanNumber] = useState('');

  // Camera State
  const [cameraConfig, setCameraConfig] = useState({ isOpen: false, field: null, index: null, stream: null });
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const [ornResponse, rateResponse, nextNumResponse] = await Promise.all([
          axios.get(`${apiUrl}/settings/ornaments?branchId=${currentBranch.id}`),
          axios.get(`${apiUrl}/settings/branch/${currentBranch.id}`),
          axios.get(`${apiUrl}/next-loan-number?branchId=${currentBranch.id}`)
        ]);
        setOrnamentConfigs(ornResponse.data);
        setBranchRates(rateResponse.data);
        setNextLoanNumber(nextNumResponse.data.nextLoanNumber);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    if (currentBranch) fetchData();
  }, [currentBranch]);

  useEffect(() => {
    if (currentBranch?.defaultInterestRate) {
      setFormData(prev => ({ ...prev, interestRate: currentBranch.defaultInterestRate }));
    }
  }, [currentBranch?.defaultInterestRate]);

  const availableOrnaments = ornamentConfigs.filter(o => o.metalType === formData.ornamentCategory);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field as user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = async (e, field, index = null) => {
    const file = e.target.files[0];
    if (file) {
      // Show local preview immediately
      const previewUrl = URL.createObjectURL(file);
      
      if (index !== null) {
        setFormData(prev => {
          const updatedOrnaments = [...prev.ornaments];
          updatedOrnaments[index] = { ...updatedOrnaments[index], photo: previewUrl };
          return { ...prev, ornaments: updatedOrnaments };
        });
      } else {
        setFormData(prev => ({ ...prev, [field]: previewUrl }));
      }
      
      const formDataUpload = new FormData();
      formDataUpload.append('photo', file);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const photoTypeMap = { customerPhoto: 'customer', aadharPhoto: 'aadhar', ornamentPhoto: 'ornament' };
        const photoType = index !== null ? 'ornament' : (photoTypeMap[field] || field);
        const loanId = index !== null
          ? `${formData.customerId}-${nextLoanNumber}`
          : undefined;
        const params = new URLSearchParams({
          customerId: formData.customerId || 'unknown',
          photoType,
          branchId: currentBranch?.id || ''
        });
        if (loanId) params.append('loanId', loanId);
        const response = await axios.post(`${apiUrl}/upload?${params}`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (index !== null) {
          setFormData(prev => {
            const updatedOrnaments = [...prev.ornaments];
            updatedOrnaments[index] = { ...updatedOrnaments[index], photo: response.data.url };
            return { ...prev, ornaments: updatedOrnaments };
          });
        } else {
          setFormData(prev => ({ ...prev, [field]: response.data.url }));
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
  };

  const startCamera = async (field, index = null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: (field === 'ornamentPhoto' || field === 'aadharPhoto') ? 'environment' : 'user' } 
      });
      setCameraConfig({ isOpen: true, field, index, stream });
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error('Camera Error:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraConfig.stream) {
      cameraConfig.stream.getTracks().forEach(track => track.stop());
    }
    setCameraConfig({ isOpen: false, field: null, index: null, stream: null });
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const fakeEvent = { target: { files: [file] } };
      await handlePhotoUpload(fakeEvent, cameraConfig.field, cameraConfig.index);
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  const handleOrnamentChange = (index, field, value) => {
    const updatedOrnaments = [...formData.ornaments];
    
    if (field === 'type') {
      const selectedConfig = ornamentConfigs.find(o => o.name === value && o.metalType === formData.ornamentCategory);
      updatedOrnaments[index].type = value;
      const currentRate = formData.ornamentCategory === 'GOLD' ? branchRates.goldRate : branchRates.silverRate;
      updatedOrnaments[index].ratePerGram = currentRate;
      updatedOrnaments[index].value = updatedOrnaments[index].netWt * currentRate;
    } else {
      updatedOrnaments[index][field] = field === 'quantity' || field === 'grossWt' || field === 'netWt' || field === 'ratePerGram' ? parseFloat(value) || 0 : value;
      if (['netWt', 'ratePerGram'].includes(field)) {
        updatedOrnaments[index].value = updatedOrnaments[index].netWt * updatedOrnaments[index].ratePerGram;
      }
    }
    setFormData(prev => ({ ...prev, ornaments: updatedOrnaments }));
    
    // Clear ornament error if weights are now valid
    if (errors.ornaments && updatedOrnaments.every(o => o.netWt > 0)) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.ornaments;
        return newErrors;
      });
    }
  };

  const addOrnament = () => {
    setFormData(prev => ({
      ...prev,
      ornaments: [...prev.ornaments, { type: '', specification: '', quantity: 1, grossWt: 0, netWt: 0, ratePerGram: 0, value: 0, photo: null }]
    }));
  };

  const removeOrnament = (index) => {
    setFormData(prev => ({
      ...prev,
      ornaments: prev.ornaments.filter((_, i) => i !== index)
    }));
  };

  const totalOrnamentValue = formData.ornaments.reduce((sum, o) => sum + o.value, 0);
  const effectiveLoanAmount = formData.manualLoanAmount !== '' ? parseFloat(formData.manualLoanAmount) || 0 : totalOrnamentValue;
  const calculatedInterest = Math.round((effectiveLoanAmount * parseFloat(formData.interestRate || 0)) / 100);
  const amountGiven = effectiveLoanAmount - parseFloat(formData.processingFee || 0) - calculatedInterest;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.ornaments.length === 0) newErrors.ornaments = 'Add at least one ornament';
    if (formData.ornaments.some(o => o.netWt <= 0)) newErrors.ornaments = 'All ornaments must have weight > 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onAddLoan({
        ...formData,
        loanAmount: effectiveLoanAmount,
        amountGiven: amountGiven,
        monthlyInterest: calculatedInterest
      });
      setFormData({
        customerName: '',
        customerPhone: '',
        customerId: '',
        address: '',
        gender: 'M',
        loanDate: new Date().toISOString().split('T')[0],
        loanTime: new Date().toTimeString().slice(0, 8),
        ornamentCategory: 'GOLD',
        interestRate: defaultInterestRate,
        processingFee: 0,
        paymentMode: 'CASH',
        manualLoanAmount: '',
        ornamentPhoto: null,
        customerPhoto: null,
        aadharPhoto: null,
        ornaments: [{ type: '', specification: '', quantity: 1, grossWt: 0, netWt: 0, ratePerGram: 0, value: 0 }]
      });
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <Sparkles size={40} />
              Create New Loan
            </h1>
            <p className="text-purple-100 text-lg">Enter customer and ornament details to create a new gold loan</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <p className="text-purple-100 text-sm font-medium mb-1">Interest Rate (% p.m.)</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                step="0.1"
                className="w-24 bg-transparent border-b-2 border-white/30 text-white font-bold text-2xl focus:outline-none focus:border-white text-center"
              />
              <span className="text-white text-xl">%</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">1</div>
            Customer Identification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-300">Phone Number *</label>
                {customerStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                    customerStatus === 'existing' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {customerStatus}
                  </span>
                )}
              </div>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData(prev => ({ ...prev, customerPhone: val }));
                  if (val.length < 10) setCustomerStatus(null);
                  if (val.length === 10) {
                    fetchCustomerDetails(val);
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.customerPhone;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.customerPhone ? 'border-red-500 bg-red-500/10' : 'border-white/10'
                }`}
                placeholder="Enter 10-digit number"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.customerName ? 'border-red-500 bg-red-500/10' : 'border-white/10'
                }`}
                placeholder="Enter customer name"
              />
              {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Customer ID (Aadhaar/PAN)</label>
              <input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Auto-generated or Manual"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Loan Number</label>
              <input
                type="text"
                value={nextLoanNumber}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/5 rounded-lg text-slate-400 font-bold cursor-not-allowed"
                placeholder="Fetching..."
              />
            </div>
            
            <div className="lg:col-span-3 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-4 py-2.5 bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.address ? 'border-red-500 bg-red-500/10' : 'border-white/10'
                }`}
                placeholder="Enter full address"
              />
            </div>

            <div className="lg:col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Aadhar Photo</label>
              <div className="flex items-center gap-3 bg-slate-700/30 p-2 rounded-xl border border-white/5">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-white/5 overflow-hidden shadow-inner">
                  {formData.aadharPhoto ? (
                    <img src={formData.aadharPhoto} alt="Aadhar" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={20} />
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex gap-2">
                    <label className="cursor-pointer flex-1 bg-white/10 hover:bg-white/20 text-slate-200 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-white/10 text-center">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'aadharPhoto')} />
                    </label>
                    <button type="button" onClick={() => startCamera('aadharPhoto')} className="flex-1 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border border-purple-500/30 flex items-center justify-center gap-1">
                      <Camera size={12} />
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Metal Category Selector */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
          <label className="block text-sm font-semibold text-slate-400 mb-4 uppercase tracking-widest text-center">Select Metal Category</label>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, ornamentCategory: 'GOLD' }))}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
                formData.ornamentCategory === 'GOLD'
                  ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-500/20'
                  : 'bg-slate-700/30 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <Gem className={formData.ornamentCategory === 'GOLD' ? 'animate-pulse' : ''} />
              <span className="text-xl font-bold">GOLD</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, ornamentCategory: 'SILVER' }))}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-300 ${
                formData.ornamentCategory === 'SILVER'
                  ? 'bg-slate-300/10 border-slate-300 text-slate-300 shadow-lg shadow-slate-300/20'
                  : 'bg-slate-700/30 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <Coins className={formData.ornamentCategory === 'SILVER' ? 'animate-pulse' : ''} />
              <span className="text-xl font-bold">SILVER</span>
            </button>
          </div>
        </div>

        {/* Ornament Details */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                Ornament Details
              </h2>
              <p className="text-slate-400 text-sm mt-1 ml-11">Enter details of the ornament given.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 ml-11 lg:ml-0">
              <button type="button" onClick={addOrnament} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/30 text-purple-300 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all">
                <Plus size={18} /> Add another Ornament
              </button>
            </div>
          </div>

          {errors.ornaments && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex gap-3 text-red-300 mb-6 ml-11">
              <AlertCircle size={20} /> <span>{errors.ornaments}</span>
            </div>
          )}

          {/* Table Header (Hidden on small screens) */}
          <div className="hidden lg:grid grid-cols-12 gap-4 ml-11 mb-2 px-4 text-sm font-semibold text-slate-400">
            <div className="col-span-2">Ornament</div>
            <div className="col-span-2">Specification</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-1 text-center">Gross wt.</div>
            <div className="col-span-1 text-center">Net wt.</div>
            <div className="col-span-1 text-center">Rate</div>
            <div className="col-span-2 text-center">Value</div>
            <div className="col-span-2 text-center">Action</div>
          </div>

          {/* Ornaments List */}
          <div className="space-y-4 lg:ml-11">
            {formData.ornaments.map((ornament, index) => (
              <div key={index} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-700/30 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                
                {/* Mobile Labels are handled via placeholders or small text for simplicity, matching the grid layout */}
                <div className="col-span-1 lg:col-span-2">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Ornament</label>
                  <select 
                    value={ornament.type} 
                    onChange={(e) => handleOrnamentChange(index, 'type', e.target.value)} 
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Ornament</option>
                    {availableOrnaments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="col-span-1 lg:col-span-2">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Specification</label>
                  <input type="text" placeholder="e.g. 916" value={ornament.specification} onChange={(e) => handleOrnamentChange(index, 'specification', e.target.value)} className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>

                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Quantity</label>
                  <input type="number" min="1" value={ornament.quantity} onChange={(e) => handleOrnamentChange(index, 'quantity', e.target.value)} className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center" />
                </div>

                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Gross wt.</label>
                  <input type="number" step="0.1" value={ornament.grossWt} onChange={(e) => handleOrnamentChange(index, 'grossWt', e.target.value)} className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center" />
                </div>

                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Net wt.</label>
                  <input type="number" step="0.1" value={ornament.netWt} onChange={(e) => handleOrnamentChange(index, 'netWt', e.target.value)} className="w-full px-3 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center" />
                </div>

                <div className="col-span-1 lg:col-span-1">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Rate/gram</label>
                  <input type="number" value={ornament.ratePerGram} onChange={(e) => handleOrnamentChange(index, 'ratePerGram', e.target.value)} className="w-full px-2 py-2.5 bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-sm" />
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="block lg:hidden text-xs text-slate-400 mb-1">Value</label>
                  <div className="w-full px-2 py-2.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-200 font-bold flex items-center justify-center shadow-inner text-sm">
                    ₹ {ornament.value.toLocaleString()}
                  </div>
                </div>

                <div className="col-span-1 lg:col-span-2 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative group">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 overflow-hidden">
                        {ornament.photo ? (
                          <img src={ornament.photo} alt="Ornament" className="w-full h-full object-cover" />
                        ) : (
                          <Gem size={18} />
                        )}
                      </div>
                      {ornament.photo && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = [...formData.ornaments];
                            updated[index].photo = null;
                            setFormData(prev => ({ ...prev, ornaments: updated }));
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button 
                        type="button" 
                        onClick={() => startCamera('ornamentPhoto', index)} 
                        className="p-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded-md transition-colors"
                        title="Capture"
                      >
                        <Camera size={14} />
                      </button>
                      <label className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-md cursor-pointer transition-colors" title="Upload">
                        <Plus size={14} />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, 'ornamentPhoto', index)} />
                      </label>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-white/10 mx-1"></div>

                  <button type="button" onClick={() => removeOrnament(index)} className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all border border-transparent hover:border-red-500/30">
                    <Trash2 size={20} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Photos, Payment Mode & Loan Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Photos */}
          <div className="flex flex-col justify-center bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
            <h3 className="text-lg font-semibold text-slate-300 mb-6">Customer Photo</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 border border-white/5 overflow-hidden shadow-inner">
                  {formData.customerPhoto ? (
                    <img src={formData.customerPhoto} alt="Customer" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex gap-2">
                    <label className="cursor-pointer flex-1 bg-white/10 hover:bg-white/20 text-slate-200 px-3 py-2 rounded-xl text-sm transition-colors border border-white/10 text-center font-medium">
                      Upload
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handlePhotoUpload(e, 'customerPhoto')} />
                    </label>
                    <button type="button" onClick={() => startCamera('customerPhoto')} className="flex-1 bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 px-3 py-2 rounded-xl text-sm transition-colors border border-purple-500/30 font-medium flex items-center justify-center gap-2">
                      <Camera size={16} />
                      Capture
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="flex flex-col justify-center bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:p-8">
            <h3 className="text-lg font-semibold text-slate-300 mb-6">Payment Mode</h3>
            <div className="flex gap-6 bg-slate-900/50 p-2 rounded-xl w-fit border border-white/5">
              <label className={`flex items-center gap-3 px-6 py-3 rounded-lg cursor-pointer transition-all ${formData.paymentMode === 'CASH' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                <input type="radio" name="paymentMode" value="CASH" checked={formData.paymentMode === 'CASH'} onChange={handleInputChange} className="hidden" />
                <span className="font-bold tracking-wide">CASH</span>
              </label>
              <label className={`flex items-center gap-3 px-6 py-3 rounded-lg cursor-pointer transition-all ${formData.paymentMode === 'UPI' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                <input type="radio" name="paymentMode" value="UPI" checked={formData.paymentMode === 'UPI'} onChange={handleInputChange} className="hidden" />
                <span className="font-bold tracking-wide">UPI</span>
              </label>
            </div>
          </div>

          {/* Loan Summary Calculation Box */}
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 lg:p-8 shadow-2xl shadow-purple-900/20">
            <div className="space-y-6">
              
              {/* Loan Amount Row */}
              <div className="flex justify-between items-center group">
                <span className="text-purple-200 font-medium text-lg">Loan Amount :</span>
                <div className="flex items-center gap-3 relative">
                  <span className="text-slate-400">₹</span>
                  <input
                    type="number"
                    name="manualLoanAmount"
                    placeholder={totalOrnamentValue}
                    value={formData.manualLoanAmount}
                    onChange={handleInputChange}
                    className="w-32 bg-transparent border-b border-transparent group-hover:border-purple-500/50 focus:border-purple-400 text-2xl font-bold text-white text-right focus:outline-none transition-all placeholder-white/70"
                  />
                  <Edit2 size={16} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Processing Fee Row */}
              <div className="flex justify-between items-center group">
                <span className="text-purple-200 font-medium text-lg">Processing fee :</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">(-) ₹</span>
                  <input
                    type="number"
                    name="processingFee"
                    value={formData.processingFee}
                    onChange={handleInputChange}
                    className="w-24 bg-transparent border-b border-transparent group-hover:border-purple-500/50 focus:border-purple-400 text-xl font-bold text-white text-right focus:outline-none transition-all"
                  />
                  <Edit2 size={16} className="text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent my-2"></div>

              {/* Amount to be given */}
              <div className="flex justify-between items-start bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-purple-100 font-medium text-lg pt-1">Amount to<br/>be given :</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white tracking-tight mb-1">
                    ₹ {amountGiven.toLocaleString()}
                  </div>
                  <div className="text-slate-400 text-sm">
                    (rounded off) <span className="font-semibold text-slate-300">₹ {Math.round(amountGiven).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-8 pt-8 border-t border-white/10">
          <div className="bg-slate-800/80 border border-white/10 px-8 py-4 rounded-2xl shadow-inner flex items-center gap-4">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Monthly Interest :</span>
            <span className="text-3xl font-black text-orange-400">₹ {calculatedInterest.toLocaleString()}</span>
          </div>

          <button 
            type="button"
            onClick={() => {
              if (validateForm()) {
                onPreviewBill({
                  ...formData,
                  id: `${formData.customerId}-${nextLoanNumber}`,
                  loanAmount: effectiveLoanAmount,
                  amountGiven: amountGiven,
                  monthlyInterest: calculatedInterest
                });
              }
            }}
            className="w-full max-w-md bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 transition-all transform active:scale-95 group"
          >
            <Sparkles className="group-hover:rotate-12 transition-transform" size={28} />
            Review & Generate Bill
          </button>
          
          <p className="text-slate-500 text-xs font-medium">Verify all details before generating the official receipt.</p>
        </div>

      </form>
      {/* Camera Modal */}
      {cameraConfig.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera size={20} className="text-purple-400" />
                Capture {cameraConfig.field === 'ornamentPhoto' ? 'Ornament' : cameraConfig.field === 'aadharPhoto' ? 'Aadhar' : 'Customer'} Photo
              </h3>
              <button onClick={stopCamera} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative aspect-video bg-black">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
                onCanPlay={() => videoRef.current.play()}
              />
              <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20"></div>
            </div>

            <div className="p-6 flex justify-center gap-4 bg-slate-800/50">
              <button 
                onClick={stopCamera}
                className="px-6 py-3 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={capturePhoto}
                className="px-8 py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-900/40 flex items-center gap-2 transform active:scale-95 transition-all"
              >
                <Camera size={20} />
                Capture Photo
              </button>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanCreation;
