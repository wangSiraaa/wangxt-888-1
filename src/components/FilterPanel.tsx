import { Search, Filter } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { FilterStatus, FilterSize, STATUS_LABEL, SIZE_LABEL } from '@/types';

const STATUSES: { value: FilterStatus; label: string; color: string }[] = [
  { value: 'all', label: '全部', color: 'text-slate-300' },
  { value: 'idle', label: STATUS_LABEL.idle, color: 'text-emerald-400' },
  { value: 'occupied', label: STATUS_LABEL.occupied, color: 'text-orange-400' },
  { value: 'picked', label: STATUS_LABEL.picked, color: 'text-blue-400' },
  { value: 'overtime', label: STATUS_LABEL.overtime, color: 'text-amber-400' },
  { value: 'exception', label: STATUS_LABEL.exception, color: 'text-violet-400' },
];

const SIZES: { value: FilterSize; label: string; count: (s: FilterSize) => boolean }[] = [
  { value: 'all', label: '全部', count: () => true },
  { value: 'S', label: SIZE_LABEL.S, count: (s) => s === 'S' },
  { value: 'M', label: SIZE_LABEL.M, count: (s) => s === 'M' },
  { value: 'L', label: SIZE_LABEL.L, count: (s) => s === 'L' },
];

export default function FilterPanel() {
  const filterStatus = useLockerStore((s) => s.filterStatus);
  const filterSize = useLockerStore((s) => s.filterSize);
  const searchQuery = useLockerStore((s) => s.searchQuery);
  const setFilterStatus = useLockerStore((s) => s.setFilterStatus);
  const setFilterSize = useLockerStore((s) => s.setFilterSize);
  const setSearchQuery = useLockerStore((s) => s.setSearchQuery);

  return (
    <div className="card p-4 space-y-4">
      <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <Filter className="w-4 h-4 text-cyan-400" />
        筛选条件
      </h3>

      <div>
        <label className="block text-xs text-slate-400 mb-2">搜索</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="柜格号 / 包裹码 / 快递员"
            className="input pl-9"
            id="input-search"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2">状态筛选</label>
        <div className="grid grid-cols-3 gap-1.5">
          {STATUSES.map((st) => (
            <button
              key={st.value}
              onClick={() => setFilterStatus(st.value)}
              className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                filterStatus === st.value
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              <span className={filterStatus === st.value ? st.color : ''}>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2">尺寸筛选</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SIZES.map((sz) => (
            <button
              key={sz.value}
              onClick={() => setFilterSize(sz.value)}
              className={`px-2 py-1.5 text-xs rounded-md border transition-all ${
                filterSize === sz.value
                  ? 'bg-violet-500/20 border-violet-400/50 text-violet-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {sz.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-700">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>空闲 - 可入柜</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
            <span>占用 - 已入柜</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>超时 - 超24h</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <span>异常 - 禁分配</span>
          </div>
        </div>
      </div>
    </div>
  );
}
