import { TestRecord, AlertRecord } from '../types';

const RECORDS_KEY = 'alcohol_test_records';
const ALERTS_KEY = 'alcohol_test_alerts';

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

export const clearAll = (): void => {
  try {
    localStorage.removeItem(RECORDS_KEY);
    localStorage.removeItem(ALERTS_KEY);
  } catch (e) {
    console.error('清除数据失败:', e);
  }
};
