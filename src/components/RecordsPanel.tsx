import { useState } from 'react';
import {
  Clock, Download, Printer, Trash2, FileText, History,
  Package, User, Calendar
} from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import { formatDateTime } from '@/utils/format';

type TabType = 'release' | 'print' | 'export';

export default function RecordsPanel() {
  const [tab, setTab] = useState<TabType>('release');
  const releaseRecords = useLockerStore((s) => s.releaseRecords);
  const printRecords = useLockerStore((s) => s.printRecords);
  const exportRecords = useLockerStore((s) => s.exportRecords);

  const tabs = [
    { key: 'release' as TabType, label: '批量释放记录', icon: Trash2, count: releaseRecords.length, color: 'text-red-400' },
    { key: 'print' as TabType, label: '打印记录', icon: Printer, count: printRecords.length, color: 'text-cyan-400' },
    { key: 'export' as TabType, label: '导出记录', icon: Download, count: exportRecords.length, color: 'text-emerald-400' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
            <History className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">操作记录</h2>
            <p className="text-xs text-slate-500">批量释放、打印面单与数据导出的历史记录</p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                tab === t.key
                  ? 'bg-slate-700 text-zinc-100 shadow-inner'
                  : 'text-slate-400 hover:text-zinc-200'
              }`}
            >
              <t.icon className={`w-4 h-4 ${tab === t.key ? t.color : ''}`} />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                tab === t.key ? 'bg-slate-600' : 'bg-slate-800'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'release' && (
          <div>
            {releaseRecords.length === 0 ? (
              <EmptyState icon={Trash2} title="暂无批量释放记录" desc="批量释放超时柜格后，操作记录将显示在此处" />
            ) : (
              <div className="divide-y divide-slate-800">
                {[...releaseRecords].reverse().map((r) => (
                  <div key={r.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge bg-red-500/20 text-red-300 border border-red-500/40">
                            <Trash2 className="w-3 h-3 mr-1" />
                            {r.releaseType === 'overtime' ? '超时件释放' : '手动释放'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {formatDateTime(r.releasedAt)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-sm text-zinc-300">
                            释放柜格 <span className="font-mono font-bold text-cyan-400">{r.lockerIds.length}</span> 个
                          </span>
                          <span className="text-slate-600">·</span>
                          <div className="flex flex-wrap gap-1">
                            {r.parcelCodes.slice(0, 5).map((pc) => (
                              <span key={pc} className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                {pc}
                              </span>
                            ))}
                            {r.parcelCodes.length > 5 && (
                              <span className="text-xs text-slate-500">+{r.parcelCodes.length - 5} 更多</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <MessageSquareIcon className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          <p className="text-slate-400 bg-slate-800/50 rounded px-3 py-1.5 flex-1">
                            {r.remark}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">操作人</p>
                        <p className="text-sm font-medium text-zinc-200">{r.releasedBy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'print' && (
          <div>
            {printRecords.length === 0 ? (
              <EmptyState icon={Printer} title="暂无打印记录" desc="打印面单或回执后，记录将显示在此处" />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="px-6 py-3 font-medium">时间</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">包裹码</th>
                    <th className="px-4 py-3 font-medium">柜格</th>
                  </tr>
                </thead>
                <tbody>
                  {[...printRecords].reverse().map((p, idx) => (
                    <tr key={p.id} className={`border-b border-slate-800/50 ${idx % 2 ? 'bg-slate-900/30' : ''}`}>
                      <td className="px-6 py-3 text-slate-400 font-mono text-xs">{formatDateTime(p.printedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          p.type === 'label'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        } border`}>
                          {p.type === 'label' ? '面单' : '回执'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-100">{p.parcelCode}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">
                        {useLockerStore.getState().lockers.find((l) => l.id === p.lockerId)?.code || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'export' && (
          <div>
            {exportRecords.length === 0 ? (
              <EmptyState icon={Download} title="暂无导出记录" desc="导出超时件列表后，记录将显示在此处" />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-800">
                  <tr className="text-left text-slate-400">
                    <th className="px-6 py-3 font-medium">时间</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">数量</th>
                    <th className="px-4 py-3 font-medium">文件名</th>
                  </tr>
                </thead>
                <tbody>
                  {[...exportRecords].reverse().map((e, idx) => (
                    <tr key={e.id} className={`border-b border-slate-800/50 ${idx % 2 ? 'bg-slate-900/30' : ''}`}>
                      <td className="px-6 py-3 text-slate-400 font-mono text-xs">{formatDateTime(e.exportedAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          e.type === 'overtime'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : e.type === 'release'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                        } border`}>
                          {e.type === 'overtime' ? '超时件' : e.type === 'release' ? '释放记录' : '全部数据'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">{e.count}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        <FileText className="w-3.5 h-3.5 inline mr-1.5 text-slate-500" />
                        {e.filename}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-5">
        <Icon className="w-10 h-10 text-slate-600" />
      </div>
      <h3 className="text-xl font-semibold text-zinc-300 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm">{desc}</p>
    </div>
  );
}

function MessageSquareIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
