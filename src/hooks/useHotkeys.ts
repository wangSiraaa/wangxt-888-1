import { useEffect } from 'react';

interface HotkeyHandlers {
  onOpenStore?: () => void;
  onOpenPickup?: () => void;
  onOpenOvertime?: () => void;
  onOpenOverview?: () => void;
  onOpenHelp?: () => void;
  onEscape?: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
};

export function useHotkeys(handlers: HotkeyHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;

      if (e.key === 'Escape') {
        handlers.onEscape?.();
        return;
      }

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handlers.onOpenHelp?.();
        return;
      }

      if (isEditableTarget(target)) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'i':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handlers.onOpenStore?.();
          }
          break;
        case 'p':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handlers.onOpenPickup?.();
          }
          break;
        case 'o':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handlers.onOpenOvertime?.();
          }
          break;
        case 'h':
          if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            handlers.onOpenOverview?.();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
