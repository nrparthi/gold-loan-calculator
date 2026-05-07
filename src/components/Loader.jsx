import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Loader component with different variants
 */
const Loader = ({ size = 24, className = '', variant = 'primary', fullPage = false }) => {
  const variants = {
    primary: 'text-blue-500',
    secondary: 'text-slate-400',
    white: 'text-white',
    success: 'text-emerald-500',
  };

  const loaderContent = (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Loader2 
        size={size} 
        className={`animate-spin ${variants[variant] || variants.primary}`} 
      />
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-slate-800 p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4">
          {loaderContent}
          <p className="text-slate-300 font-bold tracking-widest text-xs uppercase">Processing</p>
        </div>
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
