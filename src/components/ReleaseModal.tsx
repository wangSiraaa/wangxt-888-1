import { useState, useMemo } from 'react';
import { X, Trash2, AlertTriangle, MessageSquare, CheckCircle, Package, User } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SIZE_LABEL, OVERTIME_THRESHOLD_MS } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';

interface Props {
  onClose: () => void;
}

export default function ReleaseModal({ onClose }: Props) {
  const [remark, setRemark] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);

  const selectedIds = useLockerStore((s) => s.selectedOvertimeIds);
  const lockers = useLockerStore((s) => s.lockers);
  const parcels = useLockerStore((s) => s.parcels);
  const validateBatchRelease = useLockerStore((s) => s.validateBatchRelease);
  const batchReleaseOvertime = useLockerStore((s) => s.batchReleaseOvertime);
  const addToast = useLockerStore((s) => s.addToast);

  const validation = useMemo(() => {
    if (!submitted) {
      if (selectedIds.length === 0) {
        return { valid: false as const, error: '请先在超时列表中选择要释放的柜格' };
      }
      if (!remark.trim()) {
        return { valid: false as const, error: '' };
      }
      return { valid: true as const };
    }
    return validateBatchRelease(remark, selectedIds);
  }, [remark, selectedIds, validateBatchRelease, submitted]);

  const selectedItems = useMemo(() => {
    const now = Date.now();
    return selectedIds.map((id) => {
      const locker = lockers.find((l) => l.id === id);
      const parcel = parcels[id];
      const dur = parcel ? now - parcel.storedAt : 0;
      return { locker, parcel, duration: dur };
    }).filter((x) => x.locker);
  }, [selectedIds, lockers, parcels]);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!validation.valid) {
      if (validation.error) {
        addToast('error', validation.error);
      }
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      const result = batchReleaseOvertime(selectedIds, remark);
      setProcessing(false);
      if (result.valid) {
        onClose();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-locker-panel border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-red-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-400/40 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">批量释放超时件</h2>
              <p className="text-xs text-slate-500">将释放 {selectedIds.length} 个柜格空间并清除包裹记录</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-amber-300 space-y-0.5">
              <p className="font-semibold">此操作不可撤销</p>
              <p className="text-amber-300/80">
                释放后柜格将立即变为空闲状态，包裹记录将从占用列表移除，仅保留在操作记录中备查。
              </p>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                待释放列表（{selectedItems.length} 件）
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 divide-y divide-slate-800">
                {selectedItems.map((item, idx) => (
                  <div key={item.locker!.id} className={`p-2.5 flex items-center gap-3 ${idx % 2 ? 'bg-slate-900/40' : ''}`}>
                    <div className="shrink-0 text-center w-12">
                      <p className="font-mono text-base font-bold text-zinc-100">{item.locker!.code}</p>
                      <p className="text-[9px] text-slate-500">{SIZE_LABEL[item.locker!.size]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-cyan-400 truncate">
                        {item.parcel?.parcelCode}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">{item.parcel?.courier}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatDateTime(item.parcel?.storedAt || 0)}
                      </p>
                      <p className="text-[11px] font-semibold text-red-400 font-mono">
                        超时 +{formatDuration(Math.max(0, item.duration - OVERTIME_THRESHOLD_MS))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-400" />
              释放原因 / 备注 <span className="text-red-400">*</span>
              <span className="text-slate-500 ml-1 font-normal">（必填，不可为空）</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setSubmitted(false);
              }}
              rows={4}
              placeholder="请说明释放原因，如：联系用户未果返回站点、包裹超过最长保管期限、经管理员审批同意释放等..."
              className={`input resize-none ${
                submitted && !validation.valid ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              id="input-release-remark"
            />
            <div className="flex justify-between mt-1 text-[11px]">
              <span className={`${submitted && !remark.trim() ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                {submitted && !remark.trim() ? '⚠ 备注不能为空' : '至少 2 个字符，将写入操作记录'}
              </span>
              <span className="text-slate-500 font-mono">{remark.length}</span>
            </div>
          </div>

          {submitted && validation.error && (
            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-2" id="validation-error-release">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300 font-medium">{validation.error}</p>
            </div>
          )}

          {remark.trim().length >= 2 && selectedItems.length > 0 && (
            <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-300">
                <p className="font-medium">校验通过</p>
                <p className="text-xs text-emerald-300/70 mt-0.5">
                  将释放 <span className="font-mono font-bold">{selectedItems.length}</span> 个柜格，
                  操作人：<span className="font-semibold">系统管理员</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">取消</button>
          <button
            onClick={handleSubmit}
            disabled={!validation.valid || processing || selectedItems.length === 0}
            className="btn btn-danger"
            id="btn-release-submit"
          >
            {processing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                释放中...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                确认批量释放
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
