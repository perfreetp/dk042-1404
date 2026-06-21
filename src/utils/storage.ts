import { TestRecord } from '../types';

const STORAGE_KEY = 'alcohol_test_records';

export const saveRecords = (records: TestRecord[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('保存记录失败:', error);
  }
};

export const loadRecords = (): TestRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载记录失败:', error);
  }
  return [];
};

export const clearRecords = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除记录失败:', error);
  }
};
