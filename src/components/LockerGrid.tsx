import { useLockerStore } from '@/store/useLockerStore';
import { LockerCell } from '@/types';
import { SIZE_LABEL, STATUS_LABEL } from '@/types';

const STATUS_STYLES: Record<string, { dot: string; border: string; bg: string; glow: string }> = {
  idle: {
    dot: 'bg-locker-idle shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]',
  },
  occupied: {
    dot: 'bg-locker-occupied shadow-[0_0_8px_rgba(251,146,60,0.8)]',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/5',
    glow: 'hover:shadow-[0_0_20px_rgba(251,146,60,0.3)]',
  },
  picked: {
    dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    glow: 'hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]',
  },
  overtime: {
    dot: 'bg-locker-overtime shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse',
    border: 'border-amber-400/60',
    bg: 'bg-amber-500/10',
    glow: 'hover:shadow-[0_0_25px_rgba(251,191,36,0.4)]',
  },
  exception: {
    dot: 'bg-locker-exception shadow-[0_0_10px_rgba(167,139,250,0.9)]',
    border: 'border-violet-500/60',
    bg: 'bg-violet-500/10',
    glow: 'hover:shadow-[0_0_25px_rgba(167,139,250,0.4)]',
  },
};

const SIZE_BADGE: Record<string, string> = {
  S: 'bg-slate-700 text-slate-300 border-slate-600',
  M: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  L: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
};

function LockerCard({ locker, selected, onClick }: { locker: LockerCell; selected: boolean; onClick: () => void }) {
  const parcels = useLockerStore((s) => s.parcels);
  const parcel = parcels[locker.id];
  const style = STATUS_STYLES[locker.status];

  return (
    <button
      onClick={onClick}
      className={`group relative aspect-[4/3] rounded-lg border-2 transition-all duration-200 p-3 flex flex-col justify-between
        ${style.border} ${style.bg} ${style.glow}
        ${selected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-locker-bg scale-[1.02]' : ''}
        hover:scale-[1.02] active:scale-[0.98]`}
      data-locker-code={locker.code}
      data-locker-id={locker.id}
      data-locker-status={locker.status}
      id={`locker-${locker.code}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-xl font-bold text-zinc-100 tracking-wider">
          {locker.code}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-1">
        <span className={`badge border ${SIZE_BADGE[locker.size]}`}>{SIZE_LABEL[locker.size]}</span>
        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[60%] text-right">
          {STATUS_LABEL[locker.status]}
        </span>
      </div>

      {parcel && !parcel.pickedAt && (
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center">
          <p className="font-mono text-xs font-semibold text-zinc-200 truncate px-1 py-0.5 rounded bg-slate-900/60">
            {parcel.parcelCode}
          </p>
        </div>
      )}

      {locker.status === 'overtime' && (
        <div className="absolute top-1 right-1 badge bg-red-500/20 border-red-500/40 text-red-300">
          超时
        </div>
      )}
      {locker.status === 'exception' && (
        <div className="absolute top-1 right-1 badge bg-violet-500/20 border-violet-500/40 text-violet-300">
          异常
        </div>
      )}
    </button>
  );
}

export default function LockerGrid() {
  const lockers = useLockerStore((s) => s.getFilteredLockers());
  const allLockers = useLockerStore((s) => s.lockers);
  const selectedLockerId = useLockerStore((s) => s.selectedLockerId);
  const setSelectedLockerId = useLockerStore((s) => s.setSelectedLockerId);
  const searchQuery = useLockerStore((s) => s.searchQuery);
  const filterStatus = useLockerStore((s) => s.filterStatus);
  const filterSize = useLockerStore((s) => s.filterSize);

  const displayGrid = (() => {
    if (searchQuery.trim() || filterStatus !== 'all' || filterSize !== 'all') {
      return lockers;
    }
    return allLockers;
  })();

  const isFiltered = searchQuery.trim() || filterStatus !== 'all' || filterSize !== 'all';

  return (
    <div className="space-y-4">
      {isFiltered && (
        <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-sm">
          <div className="text-slate-400">
            筛选结果：<span className="text-cyan-400 font-semibold">{displayGrid.length}</span> / {allLockers.length} 个柜格
          </div>
        </div>
      )}

      {displayGrid.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-slate-500 mb-2">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="text-slate-400">没有匹配的柜格，请调整筛选条件</p>
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            isFiltered
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-6'
          }`}
        >
          {displayGrid.map((l) => (
            <LockerCard
              key={l.id}
              locker={l}
              selected={selectedLockerId === l.id}
              onClick={() => setSelectedLockerId(l.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
