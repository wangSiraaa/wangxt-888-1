import { useEffect, useState } from 'react';
import { Box, PackageSearch, Clock, AlertTriangle, ListTodo, Printer, Keyboard, HelpCircle } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';
import LockerGrid from '@/components/LockerGrid';
import LockerSidebar from '@/components/LockerSidebar';
import FilterPanel from '@/components/FilterPanel';
import StatsPanel from '@/components/StatsPanel';
import ToastContainer from '@/components/ToastContainer';
import StoreModal from '@/components/StoreModal';
import PickupModal from '@/components/PickupModal';
import OvertimePanel from '@/components/OvertimePanel';
import ExceptionModal from '@/components/ExceptionModal';
import ReleaseModal from '@/components/ReleaseModal';
import PrintLabel from '@/components/PrintLabel';
import RecordsPanel from '@/components/RecordsPanel';
import ShortcutsHelp from '@/components/ShortcutsHelp';
import { useHotkeys } from '@/hooks/useHotkeys';

type TabKey = 'overview' | 'overtime' | 'records';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [storeOpen, setStoreOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const refreshOvertime = useLockerStore((s) => s.refreshOvertimeStatus);
  const lockers = useLockerStore((s) => s.lockers);
  const selectedLockerId = useLockerStore((s) => s.selectedLockerId);
  const parcels = useLockerStore((s) => s.parcels);
  const addToast = useLockerStore((s) => s.addToast);

  useEffect(() => {
    refreshOvertime();
    const timer = setInterval(refreshOvertime, 60000);
    return () => clearInterval(timer);
  }, [refreshOvertime]);

  const stats = {
    total: lockers.length,
    idle: lockers.filter((l) => l.status === 'idle').length,
    occupied: lockers.filter((l) => l.status === 'occupied' || l.status === 'picked').length,
    overtime: lockers.filter((l) => l.status === 'overtime').length,
    exception: lockers.filter((l) => l.status === 'exception').length,
  };

  useHotkeys({
    onOpenStore: () => setStoreOpen(true),
    onOpenPickup: () => setPickupOpen(true),
    onOpenOvertime: () => setActiveTab('overtime'),
    onOpenOverview: () => setActiveTab('overview'),
    onOpenHelp: () => setHelpOpen(true),
    onEscape: () => {
      setStoreOpen(false);
      setPickupOpen(false);
      setExceptionOpen(false);
      setReleaseOpen(false);
      setHelpOpen(false);
    },
  });

  const handleLabelPrint = (lockerId: string) => {
    const parcel = parcels[lockerId];
    if (!parcel) {
      addToast('error', '未找到包裹信息，无法打印');
      return;
    }
    setPrintOpen(lockerId);
  };

  return (
    <div className="h-full flex flex-col bg-locker-bg">
      <header className="no-print shrink-0 border-b border-slate-700 bg-locker-panel/80 backdrop-blur">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Box className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">快递共配柜格管理系统</h1>
              <p className="text-xs text-slate-400">Express Shared Locker Management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                activeTab === 'overview'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <ListTodo className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              柜格总览
            </button>
            <button
              onClick={() => setActiveTab('overtime')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all border relative ${
                activeTab === 'overtime'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              超时管理
              {stats.overtime > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-locker-panel">
                  {stats.overtime}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all border ${
                activeTab === 'records'
                  ? 'bg-violet-500/20 border-violet-400 text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.2)]'
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              操作记录
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-md bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-all"
              title="快捷键帮助"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setStoreOpen(true)} className="btn btn-primary" id="btn-store">
              <Box className="w-4 h-4" />
              模拟入柜 <span className="kbd ml-1">I</span>
            </button>
            <button onClick={() => setPickupOpen(true)} className="btn btn-secondary" id="btn-pickup">
              <PackageSearch className="w-4 h-4" />
              取件查询 <span className="kbd ml-1">P</span>
            </button>
            <button onClick={() => setActiveTab('overtime')} className="btn btn-warning" id="btn-overtime">
              <Clock className="w-4 h-4" />
              超时列表 <span className="kbd ml-1">O</span>
            </button>
            <button
              onClick={() => handleLabelPrint(selectedLockerId || '')}
              className="btn btn-secondary"
              disabled={!selectedLockerId || !parcels[selectedLockerId]}
              id="btn-print"
            >
              <Printer className="w-4 h-4" />
              打印面单
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-md text-slate-400 hover:text-cyan-300 transition-all"
              title="使用帮助"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden no-print">
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-72 shrink-0 border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
              <div className="p-4 space-y-4">
                <StatsPanel stats={stats} />
                <FilterPanel />
              </div>
            </aside>

            <section className="flex-1 overflow-y-auto p-4 lg:p-6">
              <LockerGrid />
            </section>

            <aside className="w-full lg:w-96 shrink-0 border-l border-slate-800 bg-slate-900/30 overflow-y-auto">
              <LockerSidebar
                onPrintLabel={handleLabelPrint}
                onOpenException={() => setExceptionOpen(true)}
              />
            </aside>
          </div>
        )}

        {activeTab === 'overtime' && (
          <OvertimePanel onOpenRelease={() => setReleaseOpen(true)} onPrintLabel={handleLabelPrint} />
        )}

        {activeTab === 'records' && <RecordsPanel />}
      </main>

      <footer className="no-print shrink-0 border-t border-slate-800 bg-locker-panel/60 px-6 py-2 flex items-center justify-between text-xs text-slate-500">
        <div>
          提示：按 <span className="kbd">I</span> 入柜 · <span className="kbd">P</span> 取件 · <span className="kbd">O</span> 超时 ·{' '}
          <span className="kbd">Esc</span> 关闭弹窗 · <span className="kbd">?</span> 帮助
        </div>
        <div>数据存储于浏览器本地，刷新不丢失 · v1.0.0</div>
      </footer>

      {storeOpen && <StoreModal onClose={() => setStoreOpen(false)} />}
      {pickupOpen && <PickupModal onClose={() => setPickupOpen(false)} onPrintLabel={handleLabelPrint} />}
      {exceptionOpen && selectedLockerId && (
        <ExceptionModal lockerId={selectedLockerId} onClose={() => setExceptionOpen(false)} />
      )}
      {releaseOpen && <ReleaseModal onClose={() => setReleaseOpen(false)} />}
      {printOpen && <PrintLabel lockerId={printOpen} onClose={() => setPrintOpen(null)} />}
      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}

      <ToastContainer />
    </div>
  );
}
