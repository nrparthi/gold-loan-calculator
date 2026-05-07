import React, { useMemo } from 'react';
import { Plus, Trash2, Camera, Upload } from 'lucide-react';
import { calculateOrnamentValue } from '../../utils/calculations';

/**
 * OrnamentForm Component - Manages ornament entry and management
 */
const OrnamentForm = ({
  ornaments,
  ornamentConfigs,
  metalType,
  branchRates,
  onOrnamentChange,
  onAddOrnament,
  onRemoveOrnament,
  onPhotoCapture,
  onPhotoUpload,
  cameraField,
  onCameraClick,
}) => {
  const availableOrnaments = useMemo(() => {
    return ornamentConfigs.filter((o) => o.metalType === metalType);
  }, [ornamentConfigs, metalType]);

  const totalValue = useMemo(() => {
    return ornaments.reduce((sum, o) => sum + (o.value || 0), 0);
  }, [ornaments]);

  const currentRate = metalType === 'GOLD' ? branchRates.goldRate : branchRates.silverRate;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
          💎
        </div>
        Ornament Details
      </h3>

      {/* Ornaments List */}
      <div className="space-y-4">
        {ornaments.map((ornament, index) => (
          <div
            key={index}
            className="bg-slate-700/30 border border-white/10 rounded-xl p-4 space-y-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-blue-300">Ornament {index + 1}</span>
              {ornaments.length > 1 && (
                <button
                  onClick={() => onRemoveOrnament(index)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                  title="Remove ornament"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Ornament Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Type</label>
              <select
                value={ornament.type}
                onChange={(e) => onOrnamentChange(index, 'type', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              >
                <option value="">Select ornament type</option>
                {availableOrnaments.map((config) => (
                  <option key={config.id} value={config.name}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Specification */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Specification (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 22K, 916, Hallmarked"
                value={ornament.specification}
                onChange={(e) => onOrnamentChange(index, 'specification', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              />
            </div>

            {/* Weight and Rate Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Gross Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ornament.grossWt}
                  onChange={(e) => onOrnamentChange(index, 'grossWt', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Net Weight (g)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ornament.netWt}
                  onChange={(e) => onOrnamentChange(index, 'netWt', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Rate Per Gram (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={ornament.ratePerGram}
                    onChange={(e) => onOrnamentChange(index, 'ratePerGram', e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  />
                  <button
                    onClick={() =>
                      onOrnamentChange(index, 'ratePerGram', currentRate)
                    }
                    className="px-3 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-300 text-sm font-semibold transition-colors"
                    title={`Use current rate: ₹${currentRate}`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Value (₹)</label>
                <input
                  type="text"
                  value={ornament.value.toFixed(2)}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-white opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Photo Section */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Ornament Photo (Optional)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onCameraClick('ornamentPhoto', index)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-300 ${
                    cameraField?.field === 'ornamentPhoto' && cameraField?.index === index
                      ? 'bg-blue-500/30 border-blue-500/60 text-blue-300'
                      : 'bg-slate-700/50 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <Camera size={18} />
                  Camera
                </button>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-lg text-slate-300 hover:border-white/20 cursor-pointer transition-all duration-300">
                  <Upload size={18} />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPhotoUpload(e, 'ornamentPhoto', index)}
                    className="hidden"
                  />
                </label>
              </div>
              {ornament.photo && (
                <div className="mt-2 relative group">
                  <img
                    src={ornament.photo}
                    alt="Ornament"
                    className="h-24 w-full object-cover rounded-lg border border-white/10"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">✓ Photo Added</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Ornament Button */}
      <button
        onClick={onAddOrnament}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/50 hover:border-blue-500 rounded-lg text-blue-300 hover:text-blue-200 font-semibold transition-all duration-300"
      >
        <Plus size={20} />
        Add Another Ornament
      </button>

      {/* Total Value Display */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-sm text-slate-300 mb-1">Total Ornament Value</p>
        <p className="text-3xl font-bold text-yellow-300">₹{totalValue.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default OrnamentForm;
