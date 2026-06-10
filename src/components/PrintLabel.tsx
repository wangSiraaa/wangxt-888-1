import { useEffect, useMemo, useRef } from 'react';
import { X, Printer, Package, User, Calendar, MapPin } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SIZE_LABEL } from '@/types';
import { formatDateTime, generatePickupCode, generateQRPattern } from '@/utils/format';

interface Props {
  lockerId: string;
  onClose: () => void;
}

export default function PrintLabel({ lockerId, onClose }: Props) {
  const lockers = useLockerStore((s) => s.lockers);
  const parcels = useLockerStore((s) => s.parcels);
  const addPrintRecord = useLockerStore((s) => s.addPrintRecord);
  const printRef = useRef<HTMLDivElement>(null);

  const locker = lockers.find((l) => l.id === lockerId);
  const parcel = parcels[lockerId];
  const pickupCode = useMemo(() => generatePickupCode(), [lockerId]);
  const qrPattern = useMemo(() => generateQRPattern(parcel?.parcelCode || locker?.code || ''), [parcel, locker]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePrint = () => {
    addPrintRecord(lockerId, 'label');
    setTimeout(() => window.print(), 100);
  };

  if (!locker || !parcel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm no-print" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="text-lg font-bold text-zinc-100">面单打印预览</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn btn-primary" id="btn-print-confirm">
              <Printer className="w-4 h-4" />
              打印面单
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          id="print-area"
          ref={printRef}
          className="bg-white text-black rounded-lg p-6 shadow-2xl"
          style={{ width: '100mm', minHeight: '140mm' }}
        >
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h1 className="text-xl font-bold tracking-wider">快递共配柜 · 取件面单</h1>
            <p className="text-xs text-gray-500 mt-1">EXPRESS SHARED LOCKER LABEL</p>
          </div>

          <div className="flex justify-center mb-4">
            <div
              className="p-2 bg-white border border-gray-200 rounded"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${qrPattern.length}, 6px)`, gap: '1px' }}
            >
              {qrPattern.flat().map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: c === 'black' ? '#000' : '#fff',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-center mb-4 bg-gray-100 py-3 rounded">
            <p className="text-xs text-gray-500 mb-1">取件码</p>
            <p className="font-mono text-4xl font-bold tracking-[0.3em]">{pickupCode}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-500 w-20 flex items-center gap-1 shrink-0">
                <Package className="w-3.5 h-3.5" />包裹码
              </span>
              <span className="font-mono font-semibold text-right">{parcel.parcelCode}</span>
            </div>
            <div className="flex items-start justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-500 w-20 flex items-center gap-1 shrink-0">
                <MapPin className="w-3.5 h-3.5" />目标柜格
              </span>
              <span className="font-mono font-bold text-xl">{locker.code}</span>
            </div>
            <div className="flex items-start justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-500 w-20">包裹尺寸</span>
              <span className="font-semibold">{SIZE_LABEL[parcel.size]} ({locker.size})</span>
            </div>
            <div className="flex items-start justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-500 w-20 flex items-center gap-1 shrink-0">
                <User className="w-3.5 h-3.5" />快递员
              </span>
              <span className="text-right">{parcel.courier}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-gray-500 w-20 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5" />入柜时间
              </span>
              <span className="font-mono text-xs text-right">{formatDateTime(parcel.storedAt)}</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              请使用取件码到对应柜格自助取件 · 如有问题请联系站点管理员
            </p>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              PRINT: {formatDateTime(Date.now())} · LBL-{lockerId.slice(-6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
