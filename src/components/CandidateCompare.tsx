import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Star,
  Ruler,
  MapPin,
  ArrowUpDown,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import {
  SizeType,
  SIZE_LABEL,
  SIZE_CAPACITY,
  CandidateLocker,
  CandidateSortBy,
} from '@/types';

interface Props {
  parcelSize: SizeType;
  selectedLockerId: string;
  onSelectLocker: (lockerId: string) => void;
  excludeLockerId?: string;
}

const SORT_OPTIONS: { value: CandidateSortBy; label: string; icon: typeof Star }[] = [
  { value: 'recommend', label: '综合推荐', icon: Star },
  { value: 'sizeFit', label: '尺寸匹配', icon: Ruler },
  { value: 'location', label: '位置优劣', icon: MapPin },
  { value: 'rowAsc', label: '低层优先', icon: ChevronDown },
  { value: 'rowDesc', label: '高层优先', icon: ChevronUp },
];

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-8 text-right">{score}</span>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  onClick,
  parcelSize,
}: {
  candidate: CandidateLocker;
  selected: boolean;
  onClick: () => void;
  parcelSize: SizeType;
}) {
  const { locker, score, sizeFitLevel, distanceScore, recommendReason } = candidate;
  const parcelDim = SIZE_CAPACITY[parcelSize];
  const lockerDim = SIZE_CAPACITY[locker.size];

  const spareWidth = lockerDim.width - parcelDim.width;
  const spareHeight = lockerDim.height - parcelDim.height;
  const spareDepth = lockerDim.depth - parcelDim.depth;

  return (
    <button
      onClick={onClick}
      className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200
        ${selected
          ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
        }`}
      data-candidate-locker={locker.code}
      data-candidate-score={score}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-2xl font-bold text-zinc-100 tracking-wider">
            {locker.code}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            第 {locker.row + 1} 行 · 第 {locker.col + 1} 列
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-4 h-4 fill-amber-400" />
            <span className="font-bold text-lg">{score}</span>
          </div>
          <p className="text-[10px] text-slate-500">综合评分</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3" />尺寸匹配
            </span>
            <span className="text-slate-300 font-mono">
              {SIZE_LABEL[locker.size]}
            </span>
          </div>
          <ScoreBar
            score={sizeFitLevel === 0 ? 100 : sizeFitLevel === 1 ? 70 : 40}
            color="bg-cyan-400"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />位置优劣
            </span>
            <span className="text-slate-300 font-mono">{distanceScore} 分</span>
          </div>
          <ScoreBar score={distanceScore} color="bg-emerald-400" />
        </div>
      </div>

      <div className="text-[11px] text-slate-500 bg-slate-900/50 rounded-md p-2">
        <p className="flex items-center gap-1 text-cyan-300/80 mb-1">
          <Layers className="w-3 h-3" />
          空间余量
        </p>
        <p className="font-mono">
          宽 +{spareWidth}cm · 高 +{spareHeight}cm · 深 +{spareDepth}cm
        </p>
      </div>

      {recommendReason && (
        <p className="mt-3 text-xs text-emerald-300/90 flex items-start gap-1.5">
          <Star className="w-3.5 h-3.5 shrink-0 mt-0.5 fill-emerald-400 text-emerald-400" />
          <span>{recommendReason}</span>
        </p>
      )}
    </button>
  );
}

export default function CandidateCompare({
  parcelSize,
  selectedLockerId,
  onSelectLocker,
  excludeLockerId,
}: Props) {
  const [sortBy, setSortBy] = useState<CandidateSortBy>('recommend');
  const [sortOpen, setSortOpen] = useState(false);

  const getCandidateLockers = useLockerStore((s) => s.getCandidateLockers);

  const candidates = useMemo(() => {
    return getCandidateLockers(parcelSize, sortBy, excludeLockerId);
  }, [getCandidateLockers, parcelSize, sortBy, excludeLockerId]);

  const sortOption = SORT_OPTIONS.find((o) => o.value === sortBy)!;
  const SortIcon = sortOption.icon;

  const topCandidates = candidates.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          候选柜格对比
          <span className="text-slate-500 font-normal">({candidates.length} 个可用)</span>
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen(!sortOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/70 border border-slate-700 text-xs text-slate-300 hover:border-slate-600 transition-colors"
            id="btn-candidate-sort"
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortOption.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value);
                      setSortOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors
                      ${sortBy === opt.value
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {topCandidates.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-400 text-sm">没有可用的候选柜格</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {topCandidates.map((c) => (
            <CandidateCard
              key={c.locker.id}
              candidate={c}
              selected={selectedLockerId === c.locker.id}
              onClick={() => onSelectLocker(c.locker.id)}
              parcelSize={parcelSize}
            />
          ))}
        </div>
      )}

      {candidates.length > 6 && (
        <p className="text-xs text-slate-500 text-center">
          仅显示前 6 个候选柜格，可通过排序调整优先级
        </p>
      )}
    </div>
  );
}
