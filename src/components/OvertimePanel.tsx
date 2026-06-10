import { useMemo } from 'react';
import { Clock, Download, Package, User, Calendar, Trash2, AlertTriangle, CheckSquare } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { SIZE_LABEL, OVERTIME_THRESHOLD_MS } from '@/types';
import { formatDateTime, formatDuration, downloadCSV } from '@/utils/format';

interface Props {
  onOpenRelease: () => void;
  onPrintLabel: (lockerId: string) => void;
}

export default function OvertimePanel({ onOpenRelease, onPrintLabel }: Props) {
  const lockers = useLockerStore((s) => s.lockers);
  const parcels = useLockerStore((s) => s.parcels);
  const selectedIds = useLockerStore((s) => s.selectedOvertimeIds);
  const toggle = useLockerStore((s) => s.toggleOvertimeSelection);
  const clear = useLockerStore((s) => s.clearOvertimeSelection);
  const addExportRecord = useLockerStore((s) => s.addExportRecord);
  const addToast = useLockerStore((s) => s.addToast);
  const setSelectedLockerId = useLockerStore((s) => s.setSelectedLockerId);

  const overtimeLockers = useMemo(() => {
    const now = Date.now();
    return lockers
      .filter((l) => l.status === 'overtime')
      .map((l) => {
        const p = parcels[l.id];
        const storedDuration = p ? now - p.storedAt : 0;
        const overtimeDuration = Math.max(0, storedDuration - OVERTIME_THRESHOLD_MS);
        return { locker: l, parcel: p, storedDuration, overtimeDuration };
      })
      .sort((a, b) => b.overtimeDuration - a.overtimeDuration);
  }, [lockers, parcels]);

  const allSelected = overtimeLockers.length > 0 && overtimeLockers.every((x) => selectedIds.includes(x.locker.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clear();
    } else {
      overtimeLockers.forEach((x) => {
        if (!selectedIds.includes(x.locker.id)) {
          toggle(x.locker.id);
        }
      });
    }
  };

  const handleExport = () => {
    if (overtimeLockers.length === 0) {
      addToast('warning', '暂无可导出的超时件');
      return;
    }
    const filename = `超时件列表-${formatDateTime(Date.now()).replace(/[:\s]/g, '-')}.csv`;
    const rows: string[][] = [
      ['柜格号', '尺寸', '包裹码', '快递员', '入柜时间', '已存放时长', '超时时长'],
      ...overtimeLockers.map((x) => [
        x.locker.code,
        SIZE_LABEL[x.locker.size],
        x.parcel?.parcelCode || '',
        x.parcel?.courier || '',
        formatDateTime(x.parcel?.storedAt || 0),
        formatDuration(x.storedDuration),
        formatDuration(x.overtimeDuration),
      ]),
    ];
    downloadCSV(filename, rows);
    addExportRecord('overtime', overtimeLockers.length, filename);
    addToast('success', `已导出 ${overtimeLockers.length} 条超时件记录`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">超时件管理</h2>
            <p className="text-xs text-slate-500">入柜超过 24 小时的包裹列表</p>
          </div>
          <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm px-3 py-1">
            共 {overtimeLockers.length} 件
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn btn-secondary" id="btn-export-overtime">
            <Download className="w-4 h-4" />
            导出 CSV
          </button>
          <button
            onClick={onOpenRelease}
            disabled={selectedIds.length === 0}
            className="btn btn-danger"
            id="btn-open-release"
          >
            <Trash2 className="w-4 h-4" />
            批量释放 ({selectedIds.length})
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="px-6 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-red-300">
            <AlertTriangle className="w-4 h-4" />
            已选择 <span className="font-bold font-mono">{selectedIds.length}</span> 个超时柜格，点击「批量释放」将释放柜格空间并写入操作记录
          </div>
          <button onClick={clear} className="text-xs text-slate-400 hover:text-zinc-200 underline">
            取消选择
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {overtimeLockers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">太棒了！当前无超时件</h3>
            <p className="text-slate-500 max-w-md">
              所有包裹都在 24 小时内完成取件，柜格运营状态良好。
              包裹入柜后超过 24 小时未取件将自动进入此列表。
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
              <tr className="text-left text-slate-400">
                <th className="px-6 py-3 w-12">
                  <button
                    onClick={handleSelectAll}
                    className={`p-1 rounded transition-colors ${
                      allSelected ? 'text-cyan-400' : 'text-slate-500 hover:text-zinc-200'
                    }`}
                  >
                    <CheckSquare className={`w-5 h-5 ${allSelected ? 'fill-cyan-500/30' : ''}`} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">柜格号</th>
                <th className="px-4 py-3 font-medium">尺寸</th>
                <th className="px-4 py-3 font-medium">包裹码</th>
                <th className="px-4 py-3 font-medium">快递员</th>
                <th className="px-4 py-3 font-medium">入柜时间</th>
                <th className="px-4 py-3 font-medium">已存放</th>
                <th className="px-4 py-3 font-medium text-red-400">超时</th>
                <th className="px-6 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {overtimeLockers.map((x, idx) => {
                const isSel = selectedIds.includes(x.locker.id);
                return (
                  <tr
                    key={x.locker.id}
                    className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
                      isSel ? 'bg-red-500/5' : idx % 2 ? 'bg-slate-900/30' : ''
                    }`}
                  >
                    <td className="px-6 py-3">
                      <button
                        onClick={() => toggle(x.locker.id)}
                        className={`p-1 rounded transition-colors ${
                          isSel ? 'text-cyan-400' : 'text-slate-600 hover:text-cyan-400'
                        }`}
                        data-check-overtime={x.locker.id}
                      >
                        <CheckSquare className={`w-5 h-5 ${isSel ? 'fill-cyan-500/30' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-lg font-bold text-zinc-100">{x.locker.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-slate-700 text-slate-300 border-slate-600">
                        {SIZE_LABEL[x.locker.size]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">
                      {x.parcel?.parcelCode}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {x.parcel?.courier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        {formatDateTime(x.parcel?.storedAt || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-mono font-semibold">
                      {formatDuration(x.storedDuration)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-mono font-bold">
                        +{formatDuration(x.overtimeDuration)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLockerId(x.locker.id);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
                          title="查看详情"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintLabel(x.locker.id)}
                          className="p-1.5 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors"
                          title="打印面单"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" rx="1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggle(x.locker.id)}
                          className={`btn text-xs py-1.5 px-2.5 ${isSel ? 'btn-secondary' : 'btn-danger'}`}
                        >
                          {isSel ? '已选' : '标记释放'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
