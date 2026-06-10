export type SizeType = 'S' | 'M' | 'L';

export type LockerStatus = 'idle' | 'occupied' | 'picked' | 'overtime' | 'exception';

export interface LockerCell {
  id: string;
  code: string;
  size: SizeType;
  status: LockerStatus;
  row: number;
  col: number;
}

export interface ParcelInfo {
  parcelCode: string;
  size: SizeType;
  courier: string;
  lockerId: string;
  storedAt: number;
  pickedAt?: number;
  isOvertime: boolean;
}

export interface ExceptionInfo {
  lockerId: string;
  reason: string;
  remark: string;
  markedAt: number;
  markedBy: string;
}

export interface ReleaseRecord {
  id: string;
  lockerIds: string[];
  parcelCodes: string[];
  remark: string;
  releasedAt: number;
  releasedBy: string;
  releaseType: 'overtime' | 'manual';
}

export interface PrintRecord {
  id: string;
  lockerId: string;
  parcelCode: string;
  printedAt: number;
  type: 'label' | 'receipt';
}

export interface ExportRecord {
  id: string;
  exportedAt: number;
  type: 'overtime' | 'release' | 'all';
  count: number;
  filename: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

export type FilterStatus = 'all' | LockerStatus;
export type FilterSize = 'all' | SizeType;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export type CandidateSortBy = 'recommend' | 'sizeFit' | 'location' | 'rowAsc' | 'rowDesc';

export interface CandidateLocker {
  locker: LockerCell;
  score: number;
  sizeFitLevel: number;
  distanceScore: number;
  recommendReason: string;
}

export const OVERTIME_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export const SIZE_CAPACITY: Record<SizeType, { width: number; height: number; depth: number }> = {
  S: { width: 20, height: 15, depth: 30 },
  M: { width: 40, height: 30, depth: 45 },
  L: { width: 60, height: 50, depth: 60 },
};

export const SIZE_LABEL: Record<SizeType, string> = {
  S: '小号',
  M: '中号',
  L: '大号',
};

export const STATUS_LABEL: Record<LockerStatus, string> = {
  idle: '空闲',
  occupied: '占用',
  picked: '已取件',
  overtime: '超时',
  exception: '异常',
};

export const COURIERS = [
  '顺丰速运 - 张伟',
  '中通快递 - 李娜',
  '圆通速递 - 王强',
  '韵达快递 - 赵敏',
  '申通快递 - 刘洋',
  '京东物流 - 陈磊',
  '邮政EMS - 周婷',
  '极兔速递 - 吴浩',
];

export const EXCEPTION_REASONS = [
  '包裹损坏',
  '柜格故障',
  '用户投诉',
  '信息错误',
  '其他异常',
];
