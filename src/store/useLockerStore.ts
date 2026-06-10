import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LockerCell,
  ParcelInfo,
  ExceptionInfo,
  ReleaseRecord,
  PrintRecord,
  ExportRecord,
  SizeType,
  LockerStatus,
  FilterStatus,
  FilterSize,
  ToastMessage,
  ValidationResult,
  OVERTIME_THRESHOLD_MS,
  COURIERS,
  CandidateLocker,
  CandidateSortBy,
} from '@/types';

function generateLockers(): LockerCell[] {
  const lockers: LockerCell[] = [];
  const rows = 8;
  const cols = 6;
  const sizes: SizeType[] = ['S', 'S', 'M', 'M', 'L', 'L'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const size = sizes[(r + c) % 3 === 0 ? 2 : (r + c) % 3];
      lockers.push({
        id: `locker-${idx}`,
        code: `${String.fromCharCode(65 + r)}${c + 1}`,
        size,
        status: 'idle',
        row: r,
        col: c,
      });
    }
  }
  return lockers;
}

function generateSampleParcels(
  lockers: LockerCell[]
): { parcels: Record<string, ParcelInfo>; updatedLockers: LockerCell[] } {
  const now = Date.now();
  const parcels: Record<string, ParcelInfo> = {};
  const updatedLockers = [...lockers];

  const samples = [
    { idx: 5, size: 'L' as SizeType, code: 'SF20240610001', hoursAgo: 2, courier: 0 },
    { idx: 12, size: 'M' as SizeType, code: 'ZT20240610002', hoursAgo: 26, courier: 1 },
    { idx: 20, size: 'M' as SizeType, code: 'YD20240610003', hoursAgo: 30, courier: 3 },
    { idx: 33, size: 'S' as SizeType, code: 'JD20240610004', hoursAgo: 1, courier: 5 },
    { idx: 45, size: 'S' as SizeType, code: 'EMS20240610005', hoursAgo: 48, courier: 6 },
    { idx: 7, size: 'M' as SizeType, code: 'ST20240610006', hoursAgo: 3, courier: 4 },
  ];

  samples.forEach((s) => {
    const locker = updatedLockers[s.idx];
    if (locker) {
      const storedAt = now - s.hoursAgo * 60 * 60 * 1000;
      const isOvertime = now - storedAt > OVERTIME_THRESHOLD_MS;
      parcels[locker.id] = {
        parcelCode: s.code,
        size: s.size,
        courier: COURIERS[s.courier],
        lockerId: locker.id,
        storedAt,
        isOvertime,
      };
      updatedLockers[s.idx] = {
        ...locker,
        status: isOvertime ? 'overtime' : 'occupied',
      };
    }
  });

  updatedLockers[15] = { ...updatedLockers[15], status: 'exception' };
  updatedLockers[38] = { ...updatedLockers[38], status: 'exception' };

  return { parcels, updatedLockers };
}

function generateSampleExceptions(): Record<string, ExceptionInfo> {
  const now = Date.now();
  return {
    'locker-15': {
      lockerId: 'locker-15',
      reason: '柜格故障',
      remark: '柜门无法闭合，已报修',
      markedAt: now - 3 * 60 * 60 * 1000,
      markedBy: '系统管理员',
    },
    'locker-38': {
      lockerId: 'locker-38',
      reason: '用户投诉',
      remark: '用户反馈取件码无效，等待核查',
      markedAt: now - 1 * 60 * 60 * 1000,
      markedBy: '系统管理员',
    },
  };
}

interface LockerStore {
  lockers: LockerCell[];
  parcels: Record<string, ParcelInfo>;
  exceptions: Record<string, ExceptionInfo>;
  releaseRecords: ReleaseRecord[];
  printRecords: PrintRecord[];
  exportRecords: ExportRecord[];
  filterStatus: FilterStatus;
  filterSize: FilterSize;
  searchQuery: string;
  selectedLockerId: string | null;
  toasts: ToastMessage[];
  selectedOvertimeIds: string[];

  setFilterStatus: (s: FilterStatus) => void;
  setFilterSize: (s: FilterSize) => void;
  setSearchQuery: (q: string) => void;
  setSelectedLockerId: (id: string | null) => void;
  toggleOvertimeSelection: (id: string) => void;
  clearOvertimeSelection: () => void;

  validateStoreParcel: (
    parcelCode: string,
    size: SizeType,
    lockerId?: string
  ) => ValidationResult & { suggestedLockerId?: string };
  validatePickup: (lockerId: string) => ValidationResult;
  validateBatchRelease: (remark: string, ids: string[]) => ValidationResult;

  storeParcel: (parcelCode: string, size: SizeType, courier: string, lockerId?: string) => ValidationResult;
  pickupParcel: (lockerId: string) => ValidationResult;
  markException: (lockerId: string, reason: string, remark: string) => ValidationResult;
  clearException: (lockerId: string) => ValidationResult;
  batchReleaseOvertime: (ids: string[], remark: string) => ValidationResult;
  addPrintRecord: (lockerId: string, type: 'label' | 'receipt') => void;
  addExportRecord: (type: 'overtime' | 'release' | 'all', count: number, filename: string) => void;
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;

  refreshOvertimeStatus: () => void;
  getOvertimeLockers: () => LockerCell[];
  getFilteredLockers: () => LockerCell[];
  getCandidateLockers: (parcelSize: SizeType, sortBy?: CandidateSortBy, excludeLockerId?: string) => CandidateLocker[];
}

export const useLockerStore = create<LockerStore>()(
  persist(
    (set, get) => {
      const baseLockers = generateLockers();
      const { parcels: sampleParcels, updatedLockers } = generateSampleParcels(baseLockers);
      const sampleExceptions = generateSampleExceptions();

      return {
        lockers: updatedLockers,
        parcels: sampleParcels,
        exceptions: sampleExceptions,
        releaseRecords: [],
        printRecords: [],
        exportRecords: [],
        filterStatus: 'all',
        filterSize: 'all',
        searchQuery: '',
        selectedLockerId: null,
        toasts: [],
        selectedOvertimeIds: [],

        setFilterStatus: (s) => set({ filterStatus: s }),
        setFilterSize: (s) => set({ filterSize: s }),
        setSearchQuery: (q) => set({ searchQuery: q }),
        setSelectedLockerId: (id) => set({ selectedLockerId: id }),

        toggleOvertimeSelection: (id) => {
          const cur = get().selectedOvertimeIds;
          if (cur.includes(id)) {
            set({ selectedOvertimeIds: cur.filter((x) => x !== id) });
          } else {
            set({ selectedOvertimeIds: [...cur, id] });
          }
        },
        clearOvertimeSelection: () => set({ selectedOvertimeIds: [] }),

        validateStoreParcel: (parcelCode, size, lockerId) => {
          const state = get();
          parcelCode = parcelCode.trim();

          if (!parcelCode) {
            return { valid: false, error: '包裹码不能为空' };
          }

          const allParcels = Object.values(state.parcels);
          const activeParcels = allParcels.filter((p) => !p.pickedAt);
          if (activeParcels.some((p) => p.parcelCode === parcelCode)) {
            return { valid: false, error: '该包裹码已存在，不能重复入柜' };
          }

          let targetLocker: LockerCell | undefined;
          if (lockerId) {
            targetLocker = state.lockers.find((l) => l.id === lockerId);
            if (!targetLocker) {
              return { valid: false, error: '目标柜格不存在' };
            }
            if (state.exceptions[targetLocker.id]) {
              return { valid: false, error: `柜格 ${targetLocker.code} 为异常状态，禁止分配` };
            }
            if (targetLocker.status !== 'idle') {
              return { valid: false, error: `柜格 ${targetLocker.code} 当前不是空闲状态` };
            }
          } else {
            const sizeOrder: SizeType[] = ['S', 'M', 'L'];
            const targetIdx = sizeOrder.indexOf(size);
            const candidates = state.lockers.filter((l) => {
              if (l.status !== 'idle') return false;
              if (state.exceptions[l.id]) return false;
              const lockerIdx = sizeOrder.indexOf(l.size);
              return lockerIdx >= targetIdx;
            });
            candidates.sort((a, b) => {
              const sa = sizeOrder.indexOf(a.size);
              const sb = sizeOrder.indexOf(b.size);
              if (sa !== sb) return sa - sb;
              return a.row - b.row || a.col - b.col;
            });
            if (candidates.length === 0) {
              return { valid: false, error: '没有可用的空闲柜格' };
            }
            targetLocker = candidates[0];
          }

          const sizeOrder: SizeType[] = ['S', 'M', 'L'];
          const parcelSizeIdx = sizeOrder.indexOf(size);
          const lockerSizeIdx = sizeOrder.indexOf(targetLocker.size);
          if (parcelSizeIdx > lockerSizeIdx) {
            return {
              valid: false,
              error: `包裹尺寸(${size})与柜格尺寸(${targetLocker.size})不匹配，无法入柜`,
            };
          }

          return { valid: true, suggestedLockerId: targetLocker.id };
        },

        validatePickup: (lockerId) => {
          const state = get();
          const locker = state.lockers.find((l) => l.id === lockerId);
          if (!locker) {
            return { valid: false, error: '柜格不存在' };
          }
          if (locker.status === 'idle') {
            return { valid: false, error: '该柜格未占用，无法取件' };
          }
          if (locker.status === 'picked') {
            return { valid: false, error: '该柜格包裹已取件，不能再次取件' };
          }
          if (locker.status === 'exception') {
            return { valid: false, error: '异常柜格请联系管理员处理' };
          }
          const parcel = state.parcels[lockerId];
          if (!parcel) {
            return { valid: false, error: '未找到包裹信息' };
          }
          return { valid: true };
        },

        validateBatchRelease: (remark, ids) => {
          if (!remark || !remark.trim()) {
            return { valid: false, error: '批量释放必须填写备注' };
          }
          if (remark.trim().length < 2) {
            return { valid: false, error: '备注至少需要2个字符' };
          }
          if (ids.length === 0) {
            return { valid: false, error: '请至少选择一个超时柜格' };
          }
          return { valid: true };
        },

        storeParcel: (parcelCode, size, courier, lockerId) => {
          const state = get();
          const result = state.validateStoreParcel(parcelCode, size, lockerId);
          if (!result.valid) return result;

          const targetLockerId = result.suggestedLockerId!;
          const now = Date.now();

          set((s) => {
            const newParcels = { ...s.parcels };
            newParcels[targetLockerId] = {
              parcelCode: parcelCode.trim(),
              size,
              courier,
              lockerId: targetLockerId,
              storedAt: now,
              isOvertime: false,
            };
            const newLockers = s.lockers.map((l) =>
              l.id === targetLockerId ? { ...l, status: 'occupied' as LockerStatus } : l
            );
            return {
              parcels: newParcels,
              lockers: newLockers,
              selectedLockerId: targetLockerId,
            };
          });

          const locker = get().lockers.find((l) => l.id === targetLockerId)!;
          state.addToast('success', `包裹 ${parcelCode} 已成功入柜 ${locker.code}`);
          return { valid: true };
        },

        pickupParcel: (lockerId) => {
          const state = get();
          const result = state.validatePickup(lockerId);
          if (!result.valid) return result;

          const now = Date.now();
          set((s) => {
            const newParcels = { ...s.parcels };
            if (newParcels[lockerId]) {
              newParcels[lockerId] = { ...newParcels[lockerId], pickedAt: now };
            }
            const newLockers = s.lockers.map((l) =>
              l.id === lockerId ? { ...l, status: 'picked' as LockerStatus } : l
            );
            return { parcels: newParcels, lockers: newLockers };
          });

          const parcel = get().parcels[lockerId];
          state.addToast('success', `包裹 ${parcel.parcelCode} 取件成功，柜格已释放`);

          setTimeout(() => {
            set((s) => {
              const newLockers = s.lockers.map((l) =>
                l.id === lockerId ? { ...l, status: 'idle' as LockerStatus } : l
              );
              return { lockers: newLockers };
            });
          }, 3000);

          return { valid: true };
        },

        markException: (lockerId, reason, remark) => {
          const state = get();
          const locker = state.lockers.find((l) => l.id === lockerId);
          if (!locker) return { valid: false, error: '柜格不存在' };
          if (!reason) return { valid: false, error: '请选择异常原因' };
          if (!remark.trim()) return { valid: false, error: '请填写异常备注' };

          const now = Date.now();
          set((s) => {
            const newLockers = s.lockers.map((l) =>
              l.id === lockerId ? { ...l, status: 'exception' as LockerStatus } : l
            );
            const newExceptions = { ...s.exceptions };
            newExceptions[lockerId] = {
              lockerId,
              reason,
              remark: remark.trim(),
              markedAt: now,
              markedBy: '系统管理员',
            };
            return { lockers: newLockers, exceptions: newExceptions };
          });

          state.addToast('warning', `柜格 ${locker.code} 已标记为异常：${reason}`);
          return { valid: true };
        },

        clearException: (lockerId) => {
          const state = get();
          const locker = state.lockers.find((l) => l.id === lockerId);
          if (!locker) return { valid: false, error: '柜格不存在' };

          set((s) => {
            const newExceptions = { ...s.exceptions };
            delete newExceptions[lockerId];
            const newLockers = s.lockers.map((l) =>
              l.id === lockerId ? { ...l, status: 'idle' as LockerStatus } : l
            );
            return { lockers: newLockers, exceptions: newExceptions };
          });

          state.addToast('info', `柜格 ${locker.code} 异常状态已清除`);
          return { valid: true };
        },

        batchReleaseOvertime: (ids, remark) => {
          const state = get();
          const result = state.validateBatchRelease(remark, ids);
          if (!result.valid) return result;

          const now = Date.now();
          const parcelCodes: string[] = [];

          set((s) => {
            const newParcels = { ...s.parcels };
            const newLockers = s.lockers.map((l) => {
              if (ids.includes(l.id)) {
                if (newParcels[l.id]) {
                  parcelCodes.push(newParcels[l.id].parcelCode);
                  delete newParcels[l.id];
                }
                return { ...l, status: 'idle' as LockerStatus };
              }
              return l;
            });
            const newRecords = [
              ...s.releaseRecords,
              {
                id: `rel-${now}`,
                lockerIds: ids,
                parcelCodes,
                remark: remark.trim(),
                releasedAt: now,
                releasedBy: '系统管理员',
                releaseType: 'overtime' as const,
              },
            ];
            return {
              parcels: newParcels,
              lockers: newLockers,
              releaseRecords: newRecords,
              selectedOvertimeIds: [],
            };
          });

          state.addToast('success', `已批量释放 ${ids.length} 个超时柜格`);
          return { valid: true };
        },

        addPrintRecord: (lockerId, type) => {
          const state = get();
          const parcel = state.parcels[lockerId];
          if (!parcel) return;
          set((s) => ({
            printRecords: [
              ...s.printRecords,
              {
                id: `print-${Date.now()}`,
                lockerId,
                parcelCode: parcel.parcelCode,
                printedAt: Date.now(),
                type,
              },
            ],
          }));
        },

        addExportRecord: (type, count, filename) => {
          set((s) => ({
            exportRecords: [
              ...s.exportRecords,
              {
                id: `exp-${Date.now()}`,
                exportedAt: Date.now(),
                type,
                count,
                filename,
              },
            ],
          }));
        },

        addToast: (type, message) => {
          const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          set((s) => ({
            toasts: [...s.toasts, { id, type, message, duration: 3500 }],
          }));
          setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
          }, 3500);
        },

        removeToast: (id) => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        },

        refreshOvertimeStatus: () => {
          const now = Date.now();
          set((s) => {
            const newParcels = { ...s.parcels };
            const newLockers = s.lockers.map((l) => {
              const p = newParcels[l.id];
              if (p && !p.pickedAt && l.status === 'occupied') {
                const overtime = now - p.storedAt > OVERTIME_THRESHOLD_MS;
                if (overtime) {
                  newParcels[l.id] = { ...p, isOvertime: true };
                  return { ...l, status: 'overtime' as LockerStatus };
                }
              }
              return l;
            });
            return { parcels: newParcels, lockers: newLockers };
          });
        },

        getOvertimeLockers: () => {
          const state = get();
          return state.lockers.filter((l) => l.status === 'overtime');
        },

        getFilteredLockers: () => {
          const state = get();
          let result = [...state.lockers];

          if (state.filterStatus !== 'all') {
            result = result.filter((l) => l.status === state.filterStatus);
          }
          if (state.filterSize !== 'all') {
            result = result.filter((l) => l.size === state.filterSize);
          }
          if (state.searchQuery.trim()) {
            const q = state.searchQuery.trim().toLowerCase();
            result = result.filter((l) => {
              if (l.code.toLowerCase().includes(q)) return true;
              const p = state.parcels[l.id];
              if (p && p.parcelCode.toLowerCase().includes(q)) return true;
              if (p && p.courier.toLowerCase().includes(q)) return true;
              return false;
            });
          }

          return result;
        },

        getCandidateLockers: (parcelSize, sortBy = 'recommend', excludeLockerId) => {
          const state = get();
          const sizeOrder: SizeType[] = ['S', 'M', 'L'];
          const parcelSizeIdx = sizeOrder.indexOf(parcelSize);
          const totalRows = 8;
          const totalCols = 6;
          const centerRow = (totalRows - 1) / 2;
          const centerCol = (totalCols - 1) / 2;

          const candidates = state.lockers
            .filter((l) => {
              if (l.status !== 'idle') return false;
              if (state.exceptions[l.id]) return false;
              if (excludeLockerId && l.id === excludeLockerId) return false;
              const lockerSizeIdx = sizeOrder.indexOf(l.size);
              return lockerSizeIdx >= parcelSizeIdx;
            })
            .map((l) => {
              const lockerSizeIdx = sizeOrder.indexOf(l.size);
              const sizeFitLevel = lockerSizeIdx - parcelSizeIdx;
              const sizeFitScore = sizeFitLevel === 0 ? 100 : sizeFitLevel === 1 ? 70 : 40;

              const distance = Math.sqrt(
                Math.pow(l.row - centerRow, 2) + Math.pow(l.col - centerCol, 2)
              );
              const maxDistance = Math.sqrt(
                Math.pow(totalRows - 1 - centerRow, 2) + Math.pow(totalCols - 1 - centerCol, 2)
              );
              const distanceScore = Math.round((1 - distance / maxDistance) * 100);

              const rowScore = Math.round((1 - l.row / (totalRows - 1)) * 100);

              const score = Math.round(sizeFitScore * 0.5 + distanceScore * 0.3 + rowScore * 0.2);

              let recommendReason = '';
              if (sizeFitLevel === 0) {
                recommendReason = '尺寸完美匹配';
              } else if (sizeFitLevel === 1) {
                recommendReason = '尺寸适中，空间充裕';
              } else {
                recommendReason = '空间宽敞，适合大件';
              }
              if (distanceScore > 70) {
                recommendReason += ' · 位置居中';
              }
              if (l.row < 3) {
                recommendReason += ' · 取放方便';
              }

              return {
                locker: l,
                score,
                sizeFitLevel,
                distanceScore,
                recommendReason,
              };
            });

          switch (sortBy) {
            case 'sizeFit':
              candidates.sort((a, b) => a.sizeFitLevel - b.sizeFitLevel || a.score - b.score);
              break;
            case 'location':
              candidates.sort((a, b) => b.distanceScore - a.distanceScore || a.score - b.score);
              break;
            case 'rowAsc':
              candidates.sort((a, b) => a.locker.row - b.locker.row || a.locker.col - b.locker.col);
              break;
            case 'rowDesc':
              candidates.sort((a, b) => b.locker.row - a.locker.row || a.locker.col - b.locker.col);
              break;
            case 'recommend':
            default:
              candidates.sort((a, b) => b.score - a.score || a.sizeFitLevel - b.sizeFitLevel);
              break;
          }

          return candidates;
        },
      };
    },
    {
      name: 'locker-management-store',
      partialize: (state) => ({
        lockers: state.lockers,
        parcels: state.parcels,
        exceptions: state.exceptions,
        releaseRecords: state.releaseRecords,
        printRecords: state.printRecords,
        exportRecords: state.exportRecords,
      }),
    }
  )
);
