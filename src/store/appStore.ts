import { create } from 'zustand';
import {
  Driver, TestRecord, TestStep, AlertRecord, AlertStatus,
  AppState, AppActions, CardScanResult, ReviewConclusion,
} from '../types';
import { mockDrivers } from '../data/mockData';
import { loadRecords, saveRecords, loadAlerts, saveAlerts } from '../utils/storage';
import { exportRecordsToCSV, downloadCSV } from '../utils/exportCsv';

interface AppStore extends AppState, AppActions {}

const isSameDay = (ts1: number, ts2: number) =>
  new Date(ts1).toDateString() === new Date(ts2).toDateString();

const generatePassCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

const persistRecords = (records: TestRecord[]) => saveRecords(records);
const persistAlerts = (alerts: AlertRecord[]) => saveAlerts(alerts);

export const useAppStore = create<AppStore>((set, get) => ({
  drivers: mockDrivers,
  currentDriver: null,
  testStep: 'idle' as TestStep,
  testResult: null,
  records: loadRecords(),
  alerts: loadAlerts(),
  currentAlcoholLevel: null,
  currentPassCode: null,

  selectDriver: (driverId: string) => {
    const driver = get().drivers.find(d => d.id === driverId);
    if (!driver) return { ok: false, reason: '未找到该司机' };

    const todayRecords = get().records.filter(r =>
      r.driverId === driverId && isSameDay(r.timestamp, Date.now())
    );

    if (driver.status === 'suspended') {
      return { ok: false, reason: 'suspended' };
    }
    if (todayRecords.some(r => r.result === 'passed')) {
      return { ok: false, reason: 'already_passed' };
    }
    if (todayRecords.some(r => r.result === 'failed')) {
      return { ok: false, reason: 'failed_pending' };
    }
    if (driver.status === 'testing') {
      return { ok: false, reason: 'testing' };
    }
    if (driver.status !== 'waiting') {
      return { ok: false, reason: 'already_tested' };
    }

    set({
      currentDriver: driver,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
    return { ok: true };
  },

  selectDriverByCard: (cardNumber: string): CardScanResult => {
    const driver = get().drivers.find(d => d.cardNumber === cardNumber);
    if (!driver) {
      return { type: 'not_found', cardNumber };
    }

    const todayRecords = get().records.filter(r =>
      r.driverId === driver.id && isSameDay(r.timestamp, Date.now())
    );
    const passedToday = todayRecords.find(r => r.result === 'passed');
    const failedToday = todayRecords.find(r => r.result === 'failed');

    if (driver.status === 'suspended') {
      return { type: 'suspended', driver };
    }
    if (passedToday) {
      return { type: 'already_passed', driver, passCode: passedToday.passCode };
    }
    if (failedToday || driver.status === 'failed') {
      return { type: 'failed_pending', driver };
    }
    if (driver.status === 'testing') {
      return { type: 'testing', driver };
    }
    if (driver.status !== 'waiting') {
      return { type: 'already_passed', driver };
    }

    set({
      currentDriver: driver,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
    return { type: 'success', driver };
  },

  startTest: () => {
    const { currentDriver, drivers } = get();
    if (!currentDriver) return;
    const updatedDrivers = drivers.map(d =>
      d.id === currentDriver.id ? { ...d, status: 'testing' as const } : d
    );
    set({
      drivers: updatedDrivers,
      currentDriver: { ...currentDriver, status: 'testing' },
      testStep: 'blow',
    });
  },

  setTestStep: (step: TestStep) => {
    set({ testStep: step });
  },

  completeTest: (result: 'passed' | 'failed', alcoholLevel: number) => {
    const { currentDriver, drivers, records, alerts } = get();
    if (!currentDriver) return;

    const todaySame = records.find(r =>
      r.driverId === currentDriver.id && isSameDay(r.timestamp, Date.now())
    );
    if (todaySame) {
      set({
        currentDriver: { ...currentDriver, status: result },
        testStep: 'result',
        testResult: result,
        currentAlcoholLevel: alcoholLevel,
        currentPassCode: todaySame.passCode || null,
      });
      return;
    }

    const passCode = result === 'passed' ? generatePassCode() : undefined;
    const newRecord: TestRecord = {
      id: generateId('REC'),
      driverId: currentDriver.id,
      driverName: currentDriver.name,
      busPlate: currentDriver.busPlate,
      route: currentDriver.route,
      timestamp: Date.now(),
      result,
      alcoholLevel,
      passCode,
      released: false,
    };

    const updatedDrivers = drivers.map(d =>
      d.id === currentDriver.id ? { ...d, status: result } : d
    );
    const updatedQueueDrivers = updatedDrivers.map(d => {
      if (d.status === 'waiting' && d.queuePosition > currentDriver.queuePosition) {
        return { ...d, queuePosition: d.queuePosition - 1 };
      }
      return d;
    });

    let updatedAlerts = alerts;
    if (result === 'failed') {
      const newAlert: AlertRecord = {
        id: generateId('ALT'),
        driverId: currentDriver.id,
        driverName: currentDriver.name,
        busPlate: currentDriver.busPlate,
        route: currentDriver.route,
        timestamp: Date.now(),
        alcoholLevel,
        status: 'pending',
      };
      updatedAlerts = [...alerts, newAlert];
      persistAlerts(updatedAlerts);
    }

    const updatedRecords = [...records, newRecord];
    persistRecords(updatedRecords);

    set({
      drivers: updatedQueueDrivers,
      currentDriver: { ...currentDriver, status: result },
      testStep: 'result',
      testResult: result,
      currentAlcoholLevel: alcoholLevel,
      currentPassCode: passCode || null,
      records: updatedRecords,
      alerts: updatedAlerts,
    });
  },

  resetTest: () => {
    set({
      currentDriver: null,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
  },

  confirmRelease: () => {
    const { currentDriver, records } = get();
    if (currentDriver) {
      const today = Date.now();
      const updatedRecords = records.map(r =>
        r.driverId === currentDriver.id &&
        r.result === 'passed' &&
        !r.released &&
        isSameDay(r.timestamp, today)
          ? { ...r, released: true }
          : r
      );
      persistRecords(updatedRecords);
      set({ records: updatedRecords });
    }
    set({
      currentDriver: null,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
  },

  resetDriverStatus: (driverId: string) => {
    const { drivers } = get();
    const maxQueue = Math.max(...drivers.filter(d => d.status === 'waiting').map(d => d.queuePosition), 0);
    const updatedDrivers = drivers.map(d =>
      d.id === driverId
        ? { ...d, status: 'waiting' as const, queuePosition: maxQueue + 1 }
        : d
    );
    set({ drivers: updatedDrivers });
  },

  updateAlertContact: (alertId: string, note: string) => {
    const { alerts } = get();
    const updatedAlerts = alerts.map(a =>
      a.id === alertId
        ? { ...a, status: 'contacted' as AlertStatus, contactedAt: Date.now(), contactNote: note }
        : a
    );
    persistAlerts(updatedAlerts);
    set({ alerts: updatedAlerts });
  },

  updateAlertReview: (alertId: string, conclusion: ReviewConclusion, note: string) => {
    const { alerts, drivers, records } = get();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const now = Date.now();
    const updatedAlerts = alerts.map(a =>
      a.id === alertId
        ? {
            ...a,
            status: 'reviewed' as AlertStatus,
            reviewedAt: now,
            contactedAt: a.contactedAt || now,
            reviewConclusion: conclusion,
            reviewNote: note,
          }
        : a
    );
    persistAlerts(updatedAlerts);

    const updatedDrivers = drivers.map(d =>
      d.id === alert.driverId
        ? { ...d, status: conclusion === 'cleared' ? ('waiting' as const) : ('suspended' as const) }
        : d
    );

    const updatedRecords = records.map(r =>
      r.driverId === alert.driverId && isSameDay(r.timestamp, now)
        ? { ...r, reviewConclusion: conclusion }
        : r
    );
    persistRecords(updatedRecords);

    set({ alerts: updatedAlerts, drivers: updatedDrivers, records: updatedRecords });
  },

  verifyPassCode: (code: string) => {
    const { records } = get();
    const record = records.find(r => r.passCode === code.trim().toUpperCase());
    if (!record) return { valid: false, alreadyReleased: false };
    return { valid: true, record, alreadyReleased: record.released };
  },

  markRecordReleased: (recordId: string) => {
    const { records } = get();
    const now = Date.now();
    const updatedRecords = records.map(r =>
      r.id === recordId ? { ...r, released: true, releasedAt: now } : r
    );
    persistRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  exportTodayLedger: () => {
    const { records, alerts } = get();
    const today = Date.now();
    const todayRecords = records.filter(r => isSameDay(r.timestamp, today));
    const csv = exportRecordsToCSV(todayRecords, alerts);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `校车酒测台账_${dateStr}.csv`);
    return csv;
  },
}));
