import { X, Keyboard, Zap } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  {
    title: '核心操作',
    items: [
      { keys: ['I'], desc: '打开入柜模拟弹窗', path: '入柜 → 填写包裹信息 → 尺寸校验 → 确认入柜' },
      { keys: ['P'], desc: '打开取件查询弹窗', path: '取件 → 搜索 → 确认取件' },
      { keys: ['O'], desc: '跳转到超时管理页面', path: '超时列表 → 勾选 → 批量释放' },
      { keys: ['Esc'], desc: '关闭当前弹窗 / 取消操作', path: '通用：取消所有弹窗层' },
      { keys: ['?'], desc: '显示此快捷键帮助', path: '' },
    ],
  },
  {
    title: '表单操作',
    items: [
      { keys: ['Ctrl', 'Enter'], desc: '在入柜/异常/释放弹窗中快速提交', path: '需通过完整校验方可提交' },
      { keys: ['Tab'], desc: '在输入框间切换焦点', path: '' },
    ],
  },
  {
    title: '校验规则说明',
    items: [
      { keys: ['✓'], desc: '快捷键与按钮共用同一套校验函数', path: '尺寸匹配、重复包裹码、备注必填等全部生效' },
      { keys: ['⚠'], desc: '尺寸不匹配：入柜按钮将被禁用', path: '包裹尺寸 > 柜格尺寸 → 无法入柜' },
      { keys: ['⚠'], desc: '重复包裹码：校验失败并提示', path: '同一包裹不能占用两个柜格' },
      { keys: ['⚠'], desc: '批量释放备注必填：空值提交失败', path: '至少 2 个字符' },
    ],
  },
];

export default function ShortcutsHelp({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-locker-panel border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-cyan-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">键盘快捷键 & 使用指南</h2>
              <p className="text-xs text-slate-500">快速操作 · 校验规则 · 异常路径说明</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-500 hover:text-zinc-100 hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {item.keys.map((k, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-slate-600 mx-0.5">+</span>}
                          <span className="kbd">{k}</span>
                        </span>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{item.desc}</p>
                      {item.path && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.path}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="p-4 card bg-emerald-500/5 border-emerald-500/20">
            <h4 className="text-sm font-bold text-emerald-400 mb-2">✅ 正常路径验证（Smoke 测试）</h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
              <li>按 <span className="kbd">I</span> → 输入包裹码、选中 M 尺寸 → 推荐柜格 → 确认入柜 → 成功提示</li>
              <li>按 <span className="kbd">P</span> → 搜索 SF20240610001 → 取件按钮可用 → 点击取件 → 成功</li>
              <li>按 <span className="kbd">O</span> → 勾选超时件 → 批量释放 → 填写备注 → 释放成功</li>
            </ol>
          </div>

          <div className="p-4 card bg-red-500/5 border-red-500/20">
            <h4 className="text-sm font-bold text-red-400 mb-2">❌ 异常路径验证（Smoke 测试）</h4>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
              <li>包裹 L 码尺寸 → 仅 S 柜格可用时 → <strong className="text-red-300">提交按钮被禁用（尺寸不匹配）</strong></li>
              <li>入柜包裹码填已存在的码（如 SF20240610001）→ <strong className="text-red-300">校验失败：该包裹码已存在</strong></li>
              <li>批量释放备注不填直接提交 → <strong className="text-red-300">提交按钮禁用 / 空值校验失败</strong></li>
              <li>已取件柜格 → 取件按钮 <strong className="text-red-300">显示「已取件」并禁用</strong></li>
            </ol>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div>数据保存在浏览器 localStorage，刷新页面状态自动恢复</div>
          <button onClick={onClose} className="btn btn-secondary text-xs py-1.5">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
