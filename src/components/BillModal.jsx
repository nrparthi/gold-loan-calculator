import React, { useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Printer, IndianRupee, MapPin, Phone, User, Calendar, Hash, ShieldCheck, ChevronLeft, Camera, Loader2 } from 'lucide-react';

const BillModal = ({ loan, onClose, onConfirmSave, currentBranch }) => {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  if (!loan) return null;

  const handlePrintAndSave = async () => {
    setSaving(true);
    setSaveStatus('Generating PDF…');

    // Generate PDF from the rendered bill and save to server
    try {
      const element = document.getElementById('printable-bill');
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output('blob');

      const formData = new FormData();
      formData.append('photo', pdfBlob, 'receipt.pdf');
      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/upload`, formData, {
        params: {
          customerId: loan.customerId || loan.guardianName || 'unknown',
          loanId: loan.id,
          photoType: 'receipt',
          branchId: currentBranch?.id || ''
        }
      });
      setSaveStatus('Saved!');
      if (onConfirmSave) onConfirmSave(loan);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('PDF save failed:', err);
      setSaveStatus('');
    } finally {
      setSaving(false);
    }

    // Also open the print window for physical printing
    const billContent = document.getElementById('printable-bill').innerHTML;
    const filename = `${loan.customerId}-${loan.id?.split('-').pop() || 'Loan'}`;
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Outfit', sans-serif; 
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page { margin: 0; size: A4 portrait; }
            .bill-container {
              width: 210mm;
              height: 297mm;
              padding: 15mm;
              box-sizing: border-box;
              background-color: white !important;
            }
            /* Explicitly force colors for print browsers */
            .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
            .bg-blue-600 { background-color: #2563eb !important; color: white !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .text-blue-700 { color: #1d4ed8 !important; }
            .text-blue-400 { color: #60a5fa !important; }
            .text-slate-900 { color: #0f172a !important; }
            .text-slate-500 { color: #64748b !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .border-slate-900 { border-color: #0f172a !important; }
            .border-slate-200 { border-color: #e2e8f0 !important; }
            .border-white\\/10 { border-color: rgba(255,255,255,0.1) !important; }
          </style>
        </head>
        <body>
          <div class="bill-container">
            ${billContent}
          </div>
          <script>
            // Wait for images and fonts to load
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 800);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const totalOrnamentValue = loan.ornaments?.reduce((sum, o) => sum + (o.value || 0), 0) || 0;
  const processingFee = loan.processingFee || 0;
  const loanAmount = loan.loanAmount || totalOrnamentValue;
  const monthlyInt = parseFloat(loan.monthlyInterest || 0);
  const amountGiven = loan.amountGiven || (loanAmount - processingFee - monthlyInt);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 w-[900px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 bg-[#0f172a] border-b border-white/10 print:hidden shrink-0">
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold transition-all border border-white/10"
          >
            <ChevronLeft size={18} /> Edit
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black">₹</div>
             <h2 className="text-lg font-black text-white tracking-tight italic">MODERN RECEIPT PREVIEW</h2>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs font-bold text-green-400">{saveStatus}</span>
            )}
            <button
              onClick={handlePrintAndSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-black shadow-xl shadow-blue-500/20 transition-all transform active:scale-95"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
              {saving ? 'Saving…' : 'Save & Exit'}
            </button>
          </div>
        </div>

        {/* Printable Area - Modern Mill Style (Single Page Optimized) */}
        <div className="flex-1 p-10 overflow-y-auto bg-white" id="printable-bill">
          
          {/* Header - Compact */}
          <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg">₹</div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">LoanVault Financials</h1>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">Authorized Digital Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Reference</p>
              <p className="text-xl font-black text-blue-700 tracking-tighter">#{loan.id?.split('-').pop()}</p>
              <p className="text-[9px] font-bold text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Customer & Loan Top Grid (Side by Side) */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            
            {/* Customer Box - Professional & Modern */}
            <div className="col-span-8 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex gap-6">
              <div className="shrink-0 w-24 h-24 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white">
                {loan.customerPhoto ? (
                  <img src={loan.customerPhoto} alt="Customer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-6">
                <div className="col-span-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pledger Name</p>
                  <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{loan.customerName}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer ID</p>
                  <p className="text-xs font-bold text-slate-700">{loan.customerId}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone No</p>
                  <p className="text-xs font-bold text-slate-700">{loan.customerPhone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">{loan.address}</p>
                </div>
              </div>
            </div>

            {/* Terms Summary - Compact */}
            <div className="col-span-4 bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full -mr-6 -mt-6"></div>
               <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">Loan Terms</h3>
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] border-b border-white/10 pb-1">
                   <span className="font-bold opacity-60">Interest Rate</span>
                   <span className="font-black text-blue-400">{loan.interestRate}% P.M.</span>
                 </div>
                 <div className="flex justify-between text-[10px] border-b border-white/10 pb-1">
                   <span className="font-bold opacity-60">Category</span>
                   <span className="font-black text-blue-400 uppercase">{loan.ornamentCategory}</span>
                 </div>
                 <div className="flex justify-between text-[10px] border-b border-white/10 pb-1">
                   <span className="font-bold opacity-60">Mode</span>
                   <span className="font-black text-blue-400 uppercase">{loan.paymentMode}</span>
                 </div>
                 <div className="flex justify-between text-[10px]">
                   <span className="font-bold opacity-60">Appraiser</span>
                   <span className="font-black text-blue-400 uppercase">OFFICIAL</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Ornaments Documentation Table - Modern & Clean */}
          <div className="mb-6">
             <table className="w-full text-[11px] mb-4">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 border-y border-slate-300">
                    <th className="py-2.5 px-4 text-left font-black">ORNAMENT TYPE</th>
                    <th className="py-2.5 px-4 text-left font-black">SPECIFICATION</th>
                    <th className="py-2.5 px-4 text-center font-black">QTY</th>
                    <th className="py-2.5 px-4 text-right font-black">GROSS WT</th>
                    <th className="py-2.5 px-4 text-right font-black">NET WT</th>
                    <th className="py-2.5 px-4 text-right font-black">VALUATION (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loan.ornaments?.map((o, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-4 font-bold text-slate-900">{o.type}</td>
                      <td className="py-2 px-4 text-slate-500 text-[10px] italic">{o.specification || 'N/A'}</td>
                      <td className="py-2 px-4 text-center font-black">{o.quantity}</td>
                      <td className="py-2 px-4 text-right text-slate-600">{o.grossWt}g</td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">{o.netWt}g</td>
                      <td className="py-2 px-4 text-right font-black text-slate-900">{o.value?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
             </table>

             {/* Proof Gallery - Compact */}
             <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex-1 flex gap-4 overflow-hidden">
                  {loan.ornaments?.filter(o => o.photo).slice(0, 4).map((o, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="w-16 h-16 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white">
                        <img src={o.photo} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[7px] font-black text-center text-slate-500 uppercase truncate w-16">{o.type}</p>
                    </div>
                  ))}
                </div>
                {loan.aadharPhoto && (
                  <div className="flex flex-col gap-1 border-l border-slate-200 pl-4">
                    <div className="w-24 h-16 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white">
                      <img src={loan.aadharPhoto} alt="Aadhar Proof" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[7px] font-black text-center text-slate-500 uppercase">Aadhar Card</p>
                  </div>
                )}
                {loan.ornamentPhoto && (
                  <div className="flex flex-col gap-1 border-l border-slate-200 pl-4">
                    <div className="w-24 h-16 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-white">
                      <img src={loan.ornamentPhoto} alt="Group Asset" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[7px] font-black text-center text-slate-500 uppercase">Consolidated Proof</p>
                  </div>
                )}
             </div>
          </div>

          {/* Financials & Signatures - Modern Grid */}
          <div className="grid grid-cols-12 gap-8 items-end pt-4 border-t border-slate-200">
             
             {/* Totals Box */}
             <div className="col-span-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pledged Value</p>
                  <p className="text-base font-black text-slate-900">₹{totalOrnamentValue.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Initial Interest (Paid)</p>
                  <p className="text-base font-black text-slate-900">₹{loan.monthlyInterest?.toLocaleString()}</p>
                </div>
                <div className="col-span-2 bg-blue-600 p-4 rounded-2xl text-white shadow-lg flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 italic">Amount Given</p>
                    <p className="text-3xl font-black tracking-tighter">₹{amountGiven.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/20">
                    Paid in {loan.paymentMode}
                  </div>
                </div>
             </div>

             {/* Signatures */}
             <div className="col-span-6 grid grid-cols-2 gap-8 h-full">
                <div className="flex flex-col justify-end text-center border-b-2 border-slate-100 pb-2">
                  <p className="text-slate-300 italic text-[10px] mb-4">Digitally Verified</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pledger Signature</p>
                  <p className="text-[10px] font-black text-slate-900 uppercase mt-1">{loan.customerName}</p>
                </div>
                <div className="flex flex-col justify-end text-center border-b-2 border-slate-100 pb-2 relative">
                  <div className="absolute top-0 right-0 opacity-10">
                    <ShieldCheck size={40} />
                  </div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized Manager</p>
                  <p className="text-[10px] font-black text-slate-900 uppercase mt-1">MAIN BRANCH OFFICER</p>
                </div>
             </div>
          </div>

          {/* Footer Terms */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[7px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] space-y-1">
             <p>This is a legally binding computer generated receipt. Assets are stored in ultra-secure vaults.</p>
             <p>Interest starts from {loan.loanDate}. All disputes subject to jurisdiction at Salem.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BillModal;
