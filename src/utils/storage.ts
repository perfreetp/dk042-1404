import { TestRecord, AlertRecord, ShiftHandoverRecord, DisposalRecord, ShiftType, Driver } from '../types';

const RECORDS_KEY = 'alcohol_test_records';
const ALERTS_KEY = 'alcohol_test_alerts';
const SHIFT_HANDOVER_KEY = 'alcohol_test_shift_handover';
const DISPOSAL_RECORDS_KEY = 'alcohol_test_disposal_records';
const CURRENT_SHIFT_KEY = 'alcohol_test_current_shift';
const DRIVERS_KEY = 'alcohol_test_drivers';

export const saveRecords = (records: TestRecord[]): void => {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('保存记录失败:', e);
  }
};

export const loadRecords = (): TestRecord[] => {
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('加载记录失败:', e);
  }
  return [];
};

export const saveAlerts = (alerts: AlertRecord[]): void => {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('保存告警失败:', e);
  }
};

export const loadAlerts = (): AlertRecord[] => {
  try {
    const data = localStorage.getItem(ALERTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('加载告警失败:', e);
  }
  return [];
};

export const saveShiftHandover = (records: ShiftHandoverRecord[]): void => {
  try {
    localStorage.setItem(SHIFT_HANDOVER_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('保存交接班记录失败:', e);
  }
};

export const loadShiftHandover = (): ShiftHandoverRecord[] => {
  try {
    const data = localStorage.getItem(SHIFT_HANDOVER_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('加载交接班记录失败:', e);
  }
  return [];
};

export const saveDisposalRecords = (records: DisposalRecord[]): void => {
  try {
    localStorage.setItem(DISPOSAL_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('保存处置记录失败:', e);
  }
};

export const loadDisposalRecords = (): DisposalRecord[] => {
  try {
    const data = localStorage.getItem(DISPOSAL_RECORDS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('加载处置记录失败:', e);
  }
  return [];
};

export const saveCurrentShift = (shift: ShiftType | null): void => {
  try {
    if (shift) {
      localStorage.setItem(CURRENT_SHIFT_KEY, shift);
    } else {
      localStorage.removeItem(CURRENT_SHIFT_KEY);
    }
  } catch (e) {
    console.error('保存当前班次失败:', e);
  }
};

export const loadCurrentShift = (): ShiftType | null => {
  try {
    const data = localStorage.getItem(CURRENT_SHIFT_KEY);
    if (data === 'morning' || data === 'evening') return data;
  } catch (e) {
    console.error('加载当前班次失败:', e);
  }
  return null;
};

export const saveDrivers = (drivers: Driver[]): void => {
  try {
    localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
  } catch (e) {
    console.error('保存司机状态失败:', e);
  }
};

export const loadDrivers = (): Driver[] | null => {
  try {
    const data = localStorage.getItem(DRIVERS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('加载司机状态失败:', e);
  }
  return null;
};

export const clearAll = (): void => {
  try {
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(ALERTS_KEY);
    localStorage.removeItem(SHIFT_HANDOVER_KEY);
    localStorage.removeItem(DISPOSAL_RECORDS_KEY);
    localStorage.removeItem(CURRENT_SHIFT_KEY);
    localStorage.removeItem(DRIVERS_KEY);
  } catch (e) {
    console.error('清除数据失败:', e);
  }
};
