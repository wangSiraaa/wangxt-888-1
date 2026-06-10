import {
  Box, User, Calendar, Clock, AlertOctagon, Package, MapPin,
  ArrowUpCircle, AlertTriangle, Printer, Trash2, Check
} from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SIZE_LABEL, STATUS_LABEL, OVERTIME_THRESHOLD_MS } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';

interface Props {
  onPrintLabel: (lockerId: string) => void;
  onOpenException: () => void;
}

export default function LockerSidebar({ onPrintLabel, onOpenException }: Props) {
  const selectedId = useLockerStore((s) => s.selectedLockerId);
  const setSelectedId = useLockerStore((s) => s.setSelectedLockerId);
  const lockers = useLockerStore((s) => s.lockers);
  const parcels = useLockerStore((s) => s.parcels);
  const exceptions = useLockerStore((s) => s.exceptions);
  const pickupParcel = useLockerStore((s) => s.pickupParcel);
  const clearException = useLockerStore((s) => s.clearException);
  const validatePickup = useLockerStore((s) => s.validatePickup);
  const addToast = useLockerStore((s) => s.addToast);

  const locker = lockers.find((l) => l.id === selectedId);
  const parcel = selectedId ? parcels[selectedId] : undefined;
  const exception = selectedId ? exceptions[selectedId] : undefined;

  const now = Date.now();
  const storedDuration = parcel ? now - parcel.storedAt : 0;
  const isOvertime = parcel && storedDuration > OVERTIME_THRESHOLD_MS;

  if (!selectedId || !locker) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
          <Box className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">选择柜格查看详情</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          点击左侧网格中的任意柜格卡片，<br />
          即可查看柜格信息、包裹详情和执行操作
        </p>
      </div>
    );
  }

  const pickupResult = validatePickup(selectedId);

  const handlePickup = () => {
    const result = pickupParcel(selectedId);
    if (!result.valid) {
      addToast('error', result.error!);
    }
  };

  const handleClearException = () => {
    clearException(selectedId);
  };

  return (
    <div className="h-full flex flex-col animate-slide-in">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            柜格详情
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">柜格编号 · 状态信息</p>
        </div>
        <button
          onClick={() => setSelectedId(null)}
          className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="card p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-mono text-3xl font-bold text-zinc-100 tracking-wider">{locker.code}</p>
              <p className="text-xs text-slate-500 mt-1">位置：第 {locker.row + 1} 行 · 第 {locker.col + 1} 列</p>
            </div>
            <div className="text-right space-y-1">
              <span className={`badge ${
                locker.status === 'idle' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                locker.status === 'occupied' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' :
                locker.status === 'picked' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                locker.status === 'overtime' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-violet-500/20 text-violet-300 border-violet-500/40'
              } border`}>
                {STATUS_LABEL[locker.status]}
              </span>
              <p className="text-xs font-mono text-cyan-400">{SIZE_LABEL[locker.size]}柜格</p>
            </div>
          </div>

          {isOvertime && (
            <div className="mt-3 p-2 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300">超时警告</p>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  已存放 {formatDuration(storedDuration)}，超过 24 小时
                </p>
              </div>
            </div>
          )}
        </div>

        {parcel && (
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 border-b border-slate-700 pb-2">
              <Package className="w-4 h-4 text-orange-400" />
              包裹信息
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />包裹码
                </span>
                <span className="font-mono font-semibold text-zinc-100">{parcel.parcelCode}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-600" />包裹尺寸
                </span>
                <span className="text-zinc-200">{SIZE_LABEL[parcel.size]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />快递员
                </span>
                <span className="text-zinc-200">{parcel.courier}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />入柜时间
                </span>
                <span className="text-zinc-200 text-xs font-mono">{formatDateTime(parcel.storedAt)}</span>
              </div>
              {parcel.pickedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />取件时间
                  </span>
                  <span className="text-emerald-400 text-xs font-mono">{formatDateTime(parcel.pickedAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />已存放
                </span>
                <span className={`font-mono font-semibold ${isOvertime ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {formatDuration(storedDuration)}
                </span>
              </div>
            </div>
          </div>
        )}

        {exception && (
          <div className="card p-4 space-y-3 border-violet-500/40">
            <h3 className="text-sm font-semibold text-violet-300 flex items-center gap-2 border-b border-slate-700 pb-2">
              <AlertOctagon className="w-4 h-4 text-violet-400" />
              异常信息
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">异常原因</span>
                <span className="text-violet-300 font-medium">{exception.reason}</span>
              </div>
              <div className="text-sm">
                <span className="text-slate-400 block mb-1">异常备注</span>
                <p className="text-zinc-200 bg-slate-900/50 rounded p-2 text-xs leading-relaxed">
                  {exception.remark}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">标记人</span>
                <span className="text-slate-400">{exception.markedBy}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">标记时间</span>
                <span className="text-slate-400 font-mono">{formatDateTime(exception.markedAt)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-2">
        {(locker.status === 'occupied' || locker.status === 'overtime') && (
          <>
            <button
              onClick={handlePickup}
              disabled={!pickupResult.valid}
              className="btn btn-success w-full"
              id="sidebar-btn-pickup"
            >
              <ArrowUpCircle className="w-4 h-4" />
              {pickupResult.valid ? '确认取件' : pickupResult.error}
            </button>
            <button
              onClick={() => onPrintLabel(selectedId)}
              className="btn btn-secondary w-full"
            >
              <Printer className="w-4 h-4" />
              打印面单
            </button>
          </>
        )}

        {locker.status === 'exception' && (
          <button
            onClick={handleClearException}
            className="btn btn-warning w-full"
          >
            <Trash2 className="w-4 h-4" />
            清除异常状态
          </button>
        )}

        {locker.status !== 'exception' && locker.status !== 'picked' && (
          <button
            onClick={onOpenException}
            className="btn btn-secondary w-full"
          >
            <AlertOctagon className="w-4 h-4" />
            标记异常
          </button>
        )}
      </div>
    </div>
  );
}
