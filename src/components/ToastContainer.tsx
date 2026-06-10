import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLockerStore } from '@/store/useLockerStore';

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  info: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
};

const ICON_COLORS = {
  success: 'text-emerald-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
};

export default function ToastContainer() {
  const toasts = useLockerStore((s) => s.toasts);
  const removeToast = useLockerStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)] no-print">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm flex items-start gap-3 animate-slide-in ${COLORS[t.type]}`}
            data-testid={`toast-${t.type}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[t.type]}`} />
            <p className="flex-1 text-sm font-medium leading-relaxed">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors -mr-1 -mt-1"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
