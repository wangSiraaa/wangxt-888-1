import { useState, useMemo, useEffect } from 'react';
import { X, Package, User, Ruler, Target, AlertCircle, CheckCircle2, Box } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SizeType, COURIERS, SIZE_LABEL, SIZE_CAPACITY } from '@/types';

interface Props {
  onClose: () => void;
}

export default function StoreModal({ onClose }: Props) {
  const [parcelCode, setParcelCode] = useState('');
  const [size, setSize] = useState<SizeType>('M');
  const [courier, setCourier] = useState(COURIERS[0]);
  const [targetLockerId, setTargetLockerId] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const validateStoreParcel = useLockerStore((s) => s.validateStoreParcel);
  const storeParcel = useLockerStore((s) => s.storeParcel);
  const lockers = useLockerStore((s) => s.lockers);
  const addToast = useLockerStore((s) => s.addToast);
  const addPrintRecord = useLockerStore((s) => s.addPrintRecord);

  const validation = useMemo(() => {
    if (!submitted) {
      if (!parcelCode.trim()) {
        return { valid: false as const, error: '请输入包裹码', suggestedLockerId: undefined };
      }
      return validateStoreParcel(parcelCode, size, targetLockerId || undefined);
    }
    return validateStoreParcel(parcelCode, size, targetLockerId || undefined);
  }, [parcelCode, size, targetLockerId, validateStoreParcel, submitted]);

  const suggestLocker = validation.suggestedLockerId
    ? lockers.find((l) => l.id === validation.suggestedLockerId)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.valid) {
      addToast('error', validation.error!);
      return;
    }
    const result = storeParcel(parcelCode, size, courier, targetLockerId || undefined);
    if (result.valid) {
      setTimeout(() => {
        if (validation.suggestedLockerId) {
          addPrintRecord(validation.suggestedLockerId, 'label');
        }
      }, 100);
      onClose();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSubmit(e as any);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const idleLockersBySize = useMemo(() => {
    const sizeOrder: SizeType[] = ['S', 'M', 'L'];
    const targetIdx = sizeOrder.indexOf(size);
    return lockers.filter((l) => {
      if (l.status !== 'idle') return false;
      const lockerIdx = sizeOrder.indexOf(l.size);
      return lockerIdx >= targetIdx;
    }).sort((a, b) => a.row - b.row || a.col - b.col);
  }, [lockers, size]);

  const dimension = SIZE_CAPACITY[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-locker-panel border border-slate-700 rounded-xl shadow-2xl w-full max-w-md animate-slide-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Box className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">模拟入柜</h2>
              <p className="text-xs text-slate-500">填写包裹信息并完成入柜</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              包裹码 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={parcelCode}
              onChange={(e) => {
                setParcelCode(e.target.value);
                setSubmitted(false);
              }}
              placeholder="如：SF20240610001"
              className={`input font-mono text-sm ${
                submitted && !parcelCode.trim() ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              id="input-parcel-code"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              包裹尺寸类型 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['S', 'M', 'L'] as SizeType[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setSize(sz);
                    setTargetLockerId('');
                    setSubmitted(false);
                  }}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    size === sz
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                  data-size={sz}
                >
                  <p className="font-bold text-lg">{sz}</p>
                  <p className="text-[10px] mt-0.5 opacity-80">{SIZE_LABEL[sz]}</p>
                  <p className="text-[9px] opacity-60 mt-0.5">
                    {SIZE_CAPACITY[sz].width}×{SIZE_CAPACITY[sz].height}cm
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              包裹尺寸：宽 {dimension.width} × 高 {dimension.height} × 深 {dimension.depth} cm
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              快递员 <span className="text-red-400">*</span>
            </label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="select"
              id="select-courier"
            >
              {COURIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              目标柜格（可选）
            </label>
            <select
              value={targetLockerId}
              onChange={(e) => {
                setTargetLockerId(e.target.value);
                setSubmitted(false);
              }}
              className="select"
              id="select-target-locker"
            >
              <option value="">系统自动推荐最适合柜格</option>
              {idleLockersBySize.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} · {SIZE_LABEL[l.size]}
                </option>
              ))}
            </select>
            {suggestLocker && (
              <div className="mt-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-emerald-300">推荐柜格</p>
                  <p className="text-[11px] text-emerald-400/80 font-mono">
                    {suggestLocker.code} · {SIZE_LABEL[suggestLocker.size]} · 第{suggestLocker.row + 1}行
                  </p>
                </div>
              </div>
            )}
          </div>

          {submitted && !validation.valid && validation.error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2" id="validation-error-store">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{validation.error}</p>
            </div>
          )}
        </form>

        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> 快速提交
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!validation.valid}
              className="btn btn-primary"
              id="btn-store-submit"
            >
              <Package className="w-4 h-4" />
              确认入柜
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
