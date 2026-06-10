import { Boxes, Package, Clock, AlertCircle } from 'lucide-react';

interface Stats {
  total: number;
  idle: number;
  occupied: number;
  overtime: number;
  exception: number;
}

interface Props {
  stats: Stats;
}

export default function StatsPanel({ stats }: Props) {
  const idleRate = stats.total > 0 ? Math.round((stats.idle / stats.total) * 100) : 0;

  const items = [
    {
      label: '柜格总数',
      value: stats.total,
      icon: Boxes,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
    },
    {
      label: '空闲可用',
      value: stats.idle,
      icon: Package,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      sub: `利用率 ${100 - idleRate}%`,
    },
    {
      label: '占用中',
      value: stats.occupied,
      icon: Package,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
    },
    {
      label: '超时件',
      value: stats.overtime,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      highlight: stats.overtime > 0,
    },
    {
      label: '异常柜',
      value: stats.exception,
      icon: AlertCircle,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      highlight: stats.exception > 0,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <Boxes className="w-4 h-4 text-cyan-400" />
        数据统计
      </h3>

      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.label}
            className={`stat-card ${it.border} ${it.bg} ${
              it.highlight ? 'animate-pulse' : ''
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-md ${it.bg} ${it.color}`}>
                <it.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{it.label}</p>
                <p className={`text-xl font-bold font-mono ${it.color}`}>{it.value}</p>
                {it.sub && <p className="text-[10px] text-slate-500 mt-0.5">{it.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-3 mt-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>空闲率</span>
          <span className="font-mono font-semibold text-emerald-400">{idleRate}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${idleRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
