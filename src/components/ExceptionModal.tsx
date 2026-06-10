import { useState } from 'react';
import { X, AlertOctagon, AlertCircle, MessageSquare } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { EXCEPTION_REASONS, SIZE_LABEL } from '@/types';

interface Props {
  lockerId: string;
  onClose: () => void;
}

export default function ExceptionModal({ lockerId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const lockers = useLockerStore((s) => s.lockers);
  const markException = useLockerStore((s) => s.markException);
  const addToast = useLockerStore((s) => s.addToast);

  const locker = lockers.find((l) => l.id === lockerId);

  const handleSubmit = () => {
    setError('');
    if (!reason) {
      setError('请选择异常原因');
      return;
    }
    if (!remark.trim() || remark.trim().length < 2) {
      setError('请填写异常备注（至少2个字符）');
      return;
    }
    const result = markException(lockerId, reason, remark);
    if (result.valid) {
      onClose();
    } else {
      setError(result.error || '操作失败');
      addToast('error', result.error || '操作失败');
    }
  };

  if (!locker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-locker-panel border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-violet-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">标记异常柜格</h2>
              <p className="text-xs text-slate-500">
                柜格 <span className="font-mono text-violet-300">{locker.code}</span> · {SIZE_LABEL[locker.size]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-amber-300 space-y-0.5">
              <p className="font-medium">重要提示</p>
              <p className="text-amber-300/80">标记为异常的柜格将<strong>无法被自动分配</strong>用于入柜，需手动清除异常状态后恢复使用。</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
              异常原因 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXCEPTION_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    setError('');
                  }}
                  className={`px-3 py-2 text-xs rounded-md border transition-all ${
                    reason === r
                      ? 'bg-violet-500/20 border-violet-400/50 text-violet-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
              异常备注 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setError('');
              }}
              rows={4}
              placeholder="请详细描述异常情况，例如：柜门无法闭合、取件码异常、用户投诉等..."
              className="input resize-none"
              id="input-exception-remark"
            />
            <div className="flex justify-between mt-1 text-[11px] text-slate-500">
              <span>至少 2 个字符</span>
              <span>{remark.length} 字</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">取消</button>
          <button onClick={handleSubmit} className="btn btn-warning" id="btn-exception-submit">
            <AlertOctagon className="w-4 h-4" />
            确认标记
          </button>
        </div>
      </div>
    </div>
  );
}
