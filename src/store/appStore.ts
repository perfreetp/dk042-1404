import { create } from 'zustand';
import { Driver, TestRecord, TestStep, AlertRecord, AlertStatus, AppState, AppActions, CardScanResult } from '../types';
import { mockDrivers } from '../data/mockData';
import { loadRecords, saveRecords, loadAlerts, saveAlerts } from '../utils/storage';

interface AppStore extends AppState, AppActions {}

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
    if (driver && driver.status === 'waiting') {
      set({
        currentDriver: driver,
        testStep: 'idle',
        testResult: null,
        currentAlcoholLevel: null,
        currentPassCode: null,
      });
    }
  },

  selectDriverByCard: (cardNumber: string): CardScanResult => {
    const driver = get().drivers.find(d => d.cardNumber === cardNumber);
    if (!driver) {
      return { type: 'not_found', cardNumber };
    }
    if (driver.status !== 'waiting') {
      return { type: 'already_tested', driver };
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
      const updatedRecords = records.map(r =>
        r.driverId === currentDriver.id && r.result === 'passed' && !r.released
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
      d.id === driverId ? { ...d, status: 'waiting' as const, queuePosition: maxQueue + 1 } : d
    );
    set({ drivers: updatedDrivers });
  },

  updateAlertStatus: (alertId: string, status: AlertStatus) => {
    const { alerts } = get();
    const updatedAlerts = alerts.map(a => {
      if (a.id !== alertId) return a;
      const now = Date.now();
      return {
        ...a,
        status,
        ...(status === 'contacted' ? { contactedAt: now } : {}),
        ...(status === 'reviewed' ? { reviewedAt: now, contactedAt: a.contactedAt || now } : {}),
      };
    });
    persistAlerts(updatedAlerts);
    set({ alerts: updatedAlerts });
  },

  verifyPassCode: (code: string) => {
    const { records } = get();
    const record = records.find(r => r.passCode === code);
    if (!record) return { valid: false, alreadyReleased: false };
    return { valid: true, record, alreadyReleased: record.released };
  },

  markRecordReleased: (recordId: string) => {
    const { records } = get();
    const updatedRecords = records.map(r =>
      r.id === recordId ? { ...r, released: true } : r
    );
    persistRecords(updatedRecords);
    set({ records: updatedRecords });
  },
}));
