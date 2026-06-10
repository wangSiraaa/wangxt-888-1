import { useState, useMemo } from 'react';
import { X, Search, Package, CheckCircle2, AlertTriangle, ArrowUpCircle, User, Calendar, MapPin } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SIZE_LABEL, OVERTIME_THRESHOLD_MS } from '@/types';
import { formatDateTime, formatDuration } from '@/utils/format';

interface Props {
  onClose: () => void;
  onPrintLabel: (lockerId: string) => void;
}

export default function PickupModal({ onClose, onPrintLabel }: Props) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const lockers = useLockerStore((s) => s.lockers);
  const parcels = useLockerStore((s) => s.parcels);
  const pickupParcel = useLockerStore((s) => s.pickupParcel);
  const addToast = useLockerStore((s) => s.addToast);
  const setSelectedLockerId = useLockerStore((s) => s.setSelectedLockerId);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = lockers.filter((l) => {
      if (l.status === 'idle' || l.status === 'exception') return false;
      if (l.code.toLowerCase().includes(q)) return true;
      const p = parcels[l.id];
      if (!p) return false;
      if (p.parcelCode.toLowerCase().includes(q)) return true;
      if (p.courier.toLowerCase().includes(q)) return true;
      return false;
    });
    return matches;
  }, [query, lockers, parcels]);

  const handlePickup = (lockerId: string) => {
    const result = pickupParcel(lockerId);
    if (result.valid) {
      setSearched(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-locker-panel border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Search className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">取件查询</h2>
              <p className="text-xs text-slate-500">按包裹码、柜格号或快递员搜索</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearched(true);
              }}
              placeholder="输入包裹码（如 SF20240610001）、柜格号（A1）或快递员名称..."
              className="input pl-10 font-mono text-sm"
              id="input-pickup-search"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!searched ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 text-sm">输入关键词开始搜索取件</p>
              <div className="mt-6 p-4 card text-left space-y-2">
                <p className="text-xs font-semibold text-slate-300 mb-2">快速测试路径：</p>
                <div className="space-y-1.5 text-xs text-slate-500">
                  <p>✅ 正常路径：搜索 <code className="text-cyan-400">SF20240610001</code> → 可正常取件</p>
                  <p>❌ 异常路径：搜索 <code className="text-cyan-400">ZT20240610002</code> → 超时件（仍可取件）</p>
                  <p>❌ 异常路径：搜索 <code className="text-cyan-400">NOTEXIST</code> → 无结果</p>
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500/60 mb-4" />
              <p className="text-slate-400 text-sm">未找到匹配的包裹或柜格</p>
              <p className="text-xs text-slate-500 mt-2">请检查输入是否正确，或该包裹可能已被取件</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((l) => {
                const p = parcels[l.id];
                if (!p) return null;
                const now = Date.now();
                const isOvertime = now - p.storedAt > OVERTIME_THRESHOLD_MS;
                const isPicked = !!p.pickedAt;

                return (
                  <div
                    key={l.id}
                    className={`card p-4 border-l-4 transition-all ${
                      isPicked ? 'border-l-blue-500 opacity-60' :
                      isOvertime ? 'border-l-amber-400 bg-amber-500/5' :
                      'border-l-emerald-500'
                    }`}
                    data-locker-pickup-id={l.id}
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 text-center">
                        <p className="font-mono text-2xl font-bold text-zinc-100">{l.code}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{SIZE_LABEL[l.size]}</p>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono font-semibold text-zinc-100">{p.parcelCode}</p>
                          {isPicked && (
                            <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/40 border">
                              <CheckCircle2 className="w-3 h-3 mr-1" />已取件
                            </span>
                          )}
                          {isOvertime && !isPicked && (
                            <span className="badge bg-amber-500/20 text-amber-300 border-amber-500/40 border">
                              <AlertTriangle className="w-3 h-3 mr-1" />超时 {formatDuration(now - p.storedAt)}
                            </span>
                          )}
                          {!isOvertime && !isPicked && (
                            <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/40 border">
                              待取件
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 space-y-0.5">
                          <p className="flex items-center gap-1.5">
                            <User className="w-3 h-3" />{p.courier}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />入柜：{formatDateTime(p.storedAt)}
                          </p>
                          {p.pickedAt && (
                            <p className="flex items-center gap-1.5 text-blue-400">
                              <CheckCircle2 className="w-3 h-3" />取件：{formatDateTime(p.pickedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handlePickup(l.id)}
                          disabled={isPicked || l.status === 'exception'}
                          className="btn btn-success text-xs"
                          id={`btn-pickup-${l.code}`}
                          data-pickup-disabled={isPicked || l.status === 'exception'}
                        >
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {isPicked ? '已取件' : l.status === 'exception' ? '异常柜' : '取件'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLockerId(l.id);
                            onClose();
                          }}
                          className="btn btn-secondary text-xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />查看
                        </button>
                        {!isPicked && (
                          <button
                            onClick={() => onPrintLabel(l.id)}
                            className="btn btn-secondary text-xs"
                          >
                            打印
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
